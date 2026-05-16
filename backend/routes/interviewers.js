const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getInterviewers, saveInterviewers } = require('../utils/db');

// GET all interviewers
router.get('/', (req, res) => {
  res.json(getInterviewers());
});

// POST add interviewer
router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });

  const interviewers = getInterviewers();
  if (interviewers.find(i => i.email === email)) return res.status(409).json({ error: 'Interviewer already exists' });

  const newInterviewer = { id: uuidv4(), name, email, available: true, createdAt: new Date().toISOString() };
  interviewers.push(newInterviewer);
  saveInterviewers(interviewers);
  res.status(201).json(newInterviewer);
});

// DELETE remove interviewer
router.delete('/:id', (req, res) => {
  let interviewers = getInterviewers();
  const exists = interviewers.find(i => i.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Interviewer not found' });

  interviewers = interviewers.filter(i => i.id !== req.params.id);
  saveInterviewers(interviewers);
  res.json({ message: 'Interviewer removed' });
});

module.exports = router;
