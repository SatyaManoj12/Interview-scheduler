const express = require('express');
const router = express.Router();
const { getApplications, saveApplications, getInterviewers } = require('../utils/db');
const { sendInterviewerRequest, sendCandidateConfirmation } = require('../utils/mailer');
const { generateMeetLink } = require('../utils/meetLink');

router.get('/', async (req, res) => {
  const { token, action } = req.query;

  if (!token || !['accept', 'reject'].includes(action)) {
    return res.status(400).send('<h2>Invalid request.</h2>');
  }

  const applications = getApplications();
  const idx = applications.findIndex(a => a.token === token);

  if (idx === -1) return res.status(404).send('<h2>Application not found.</h2>');

  const app = applications[idx];

  if (app.status !== 'pending') {
    return res.send(`<h2>This application has already been ${app.status}. No action needed.</h2>`);
  }

  const interviewers = getInterviewers();
  const timestamp = new Date().toISOString();

  if (action === 'accept') {
    const interviewer = interviewers.find(i => i.id === app.assignedInterviewerId);
    const meetLink = generateMeetLink();

    app.status = 'accepted';
    app.meetLink = meetLink;
    app.auditLog.push({ event: 'interviewer_accepted', interviewer: interviewer?.email, timestamp });

    await sendCandidateConfirmation(app.candidate, interviewer, meetLink);
    app.auditLog.push({ event: 'candidate_notified', timestamp });

    applications[idx] = app;
    saveApplications(applications);

    return res.send(`
      <h2>✅ Accepted!</h2>
      <p>A Google Meet link has been sent to <strong>${app.candidate.name}</strong>.</p>
      <p>Meet Link: <a href="${meetLink}">${meetLink}</a></p>
    `);
  }

  if (action === 'reject') {
    const currentInterviewer = interviewers.find(i => i.id === app.assignedInterviewerId);
    app.auditLog.push({ event: 'interviewer_rejected', interviewer: currentInterviewer?.email, timestamp });

    // Find next available interviewer not yet tried
    const triedIds = app.auditLog
      .filter(e => e.event === 'email_sent_to_interviewer')
      .map(e => interviewers.find(i => i.email === e.interviewer)?.id)
      .filter(Boolean);

    const nextInterviewer = interviewers.find(i => i.available && !triedIds.includes(i.id));

    if (!nextInterviewer) {
      app.status = 'no_interviewer';
      app.auditLog.push({ event: 'all_interviewers_rejected', timestamp });
      applications[idx] = app;
      saveApplications(applications);
      return res.send('<h2>❌ All interviewers rejected. Application closed.</h2>');
    }

    // Rotate token for security
    const { v4: uuidv4 } = require('uuid');
    app.token = uuidv4();
    app.assignedInterviewerId = nextInterviewer.id;

    await sendInterviewerRequest(nextInterviewer, app.candidate, app);
    app.auditLog.push({ event: 'email_sent_to_interviewer', interviewer: nextInterviewer.email, timestamp: new Date().toISOString() });

    applications[idx] = app;
    saveApplications(applications);

    return res.send('<h2>❌ Rejected. Next interviewer has been notified.</h2>');
  }
});

module.exports = router;
