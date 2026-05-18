const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { extractCandidateInfo } = require('../utils/pdfParser');
const { getInterviewers, getApplications, saveApplications } = require('../utils/db');
const { sendInterviewerRequest } = require('../utils/mailer');

router.post('/', uploadLimiter, upload.single('resume'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'PDF resume required' });

  try {
    const candidate = await extractCandidateInfo(req.file.path);

    if (!candidate.email) {
      fs.unlinkSync(req.file.path);
      return res.status(422).json({ error: 'Could not extract an email address from the resume. Please ensure your email is visible in the PDF.' });
    }

    const interviewers = getInterviewers();
    const available = interviewers.filter(i => i.available);
    if (available.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(503).json({ error: 'No interviewers are available right now. Please try again later.' });
    }

    const token = uuidv4();
    const application = {
      id: uuidv4(),
      candidate,
      token,
      status: 'pending',
      assignedInterviewerId: available[0].id,
      auditLog: [{ event: 'application_received', timestamp: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };

    try {
      await sendInterviewerRequest(available[0], candidate, application);
      application.auditLog.push({ event: 'email_sent_to_interviewer', interviewer: available[0].email, timestamp: new Date().toISOString() });
    } catch (emailErr) {
      console.error('Failed to send interviewer email:', emailErr);
      application.auditLog.push({ event: 'interviewer_email_failed', error: emailErr.message, timestamp: new Date().toISOString() });
    }

    const applications = getApplications();
    applications.push(application);
    saveApplications(applications);

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(201).json({ message: 'Application received. An interviewer has been notified.', applicationId: application.id });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
});

// GET all applications (admin)
router.get('/', (req, res) => {
  res.json(getApplications());
});

module.exports = router;
