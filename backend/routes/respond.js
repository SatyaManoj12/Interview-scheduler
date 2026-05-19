const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getApplications, saveApplications, getInterviewers } = require('../utils/db');
const { sendInterviewerRequest, sendCandidateConfirmation } = require('../utils/mailer');
const { generateMeetLink } = require('../utils/meetLink');

router.get('/', async (req, res) => {
  const { token, action } = req.query;

  if (!token || !['accept', 'reject'].includes(action)) {
    return res.status(400).send(page('Invalid Request', '⚠️ Invalid or missing parameters.'));
  }

  const applications = getApplications();
  const idx = applications.findIndex(a => a.token === token);

  if (idx === -1) {
    return res.status(404).send(page('Not Found', '❌ Application not found. The link may have expired.'));
  }

  const app = applications[idx];

  if (app.status !== 'pending') {
    return res.send(page('Already Processed', `ℹ️ This application has already been <strong>${app.status}</strong>. No further action needed.`));
  }

  const interviewers = getInterviewers();
  const timestamp = new Date().toISOString();

  if (action === 'accept') {
    const interviewer = interviewers.find(i => i.id === app.assignedInterviewerId);
    if (!interviewer) {
      return res.status(500).send(page('Error', '⚠️ Assigned interviewer no longer exists. Please contact admin.'));
    }

    const meetLink = generateMeetLink();
    app.status = 'accepted';
    app.meetLink = meetLink;
    app.auditLog.push({ event: 'interviewer_accepted', interviewer: interviewer.email, timestamp });

    try {
      await sendCandidateConfirmation(app.candidate, interviewer, meetLink);
      app.auditLog.push({ event: 'candidate_notified', timestamp: new Date().toISOString() });
    } catch (emailErr) {
      console.error('Failed to email candidate:', emailErr);
      app.auditLog.push({ event: 'candidate_email_failed', error: emailErr.message, timestamp: new Date().toISOString() });
    }

    applications[idx] = app;
    saveApplications(applications);

    return res.send(page('Accepted!', `
      ✅ <strong>Thank you!</strong> You have accepted the interview request for <strong>${escapeHtml(app.candidate.name)}</strong>.<br><br>
      A Google Meet link has been sent to the candidate.<br>
      <strong>Meet Link:</strong> <a href="${escapeHtml(meetLink)}">${escapeHtml(meetLink)}</a>
    `));
  }

  if (action === 'reject') {
    const currentInterviewer = interviewers.find(i => i.id === app.assignedInterviewerId);
    app.auditLog.push({ event: 'interviewer_rejected', interviewer: currentInterviewer?.email || 'unknown', timestamp });

    const triedEmails = app.auditLog
      .filter(e => e.event === 'email_sent_to_interviewer')
      .map(e => e.interviewer);

    const nextInterviewer = interviewers.find(i => i.available && !triedEmails.includes(i.email));

    if (!nextInterviewer) {
      app.status = 'no_interviewer';
      app.auditLog.push({ event: 'all_interviewers_rejected', timestamp });
      applications[idx] = app;
      saveApplications(applications);
      return res.send(page('No Interviewers Available', '❌ All interviewers have rejected this request. Application has been closed.'));
    }

    app.token = uuidv4();
    app.assignedInterviewerId = nextInterviewer.id;

    try {
      await sendInterviewerRequest(nextInterviewer, app.candidate, app);
      app.auditLog.push({ event: 'email_sent_to_interviewer', interviewer: nextInterviewer.email, timestamp: new Date().toISOString() });
    } catch (emailErr) {
      console.error('Failed to email next interviewer:', emailErr);
      app.auditLog.push({ event: 'interviewer_email_failed', error: emailErr.message, timestamp: new Date().toISOString() });
    }

    applications[idx] = app;
    saveApplications(applications);

    return res.send(page('Rejected', '❌ You have rejected the request. The next interviewer has been notified.'));
  }
});

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} — Interview Scheduler</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #f0f4f8; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: #fff; border-radius: 12px; padding: 40px; max-width: 480px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; }
    h2 { color: #1a202c; margin-bottom: 16px; }
    p { color: #4a5568; line-height: 1.6; }
    a { color: #4299e1; }
    .back { display: inline-block; margin-top: 24px; color: #4299e1; text-decoration: none; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="card">
    <h2>${title}</h2>
    <p>${body}</p>
    <a class="back" href="/">← Back to Home</a>
  </div>
</body>
</html>`;
}

module.exports = router;
