const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendInterviewerRequest(interviewer, candidate, application) {
  const base = process.env.BASE_URL;
  const acceptUrl = `${base}/api/respond?token=${application.token}&action=accept`;
  const rejectUrl = `${base}/api/respond?token=${application.token}&action=reject`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Interview Bot" <${process.env.GMAIL_USER}>`,
    to: interviewer.email,
    subject: `Interview Request: ${candidate.name}`,
    html: `
      <h2>Interview Request</h2>
      <p>You have been selected to interview <strong>${candidate.name}</strong>.</p>
      <p><strong>Email:</strong> ${candidate.email}</p>
      <p>Please respond:</p>
      <a href="${acceptUrl}" style="background:#28a745;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;margin-right:10px;">✅ Accept</a>
      <a href="${rejectUrl}" style="background:#dc3545;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">❌ Reject</a>
    `,
  });
}

async function sendCandidateConfirmation(candidate, interviewer, meetLink) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Interview Bot" <${process.env.GMAIL_USER}>`,
    to: candidate.email,
    subject: 'Your Interview is Scheduled!',
    html: `
      <h2>Interview Confirmed 🎉</h2>
      <p>Dear <strong>${candidate.name}</strong>,</p>
      <p>Your interview has been scheduled.</p>
      <p><strong>Interviewer:</strong> ${interviewer.name}</p>
      <p><strong>Google Meet Link:</strong> <a href="${meetLink}">${meetLink}</a></p>
      <p>Best of luck!</p>
    `,
  });
}

module.exports = { sendInterviewerRequest, sendCandidateConfirmation };
