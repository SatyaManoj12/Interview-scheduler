const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getInterviewers, saveInterviewers } = require('../utils/db');

router.get('/', (req, res) => {
  try {
    res.json(getInterviewers());
  } catch (err) {
    res.status(500).json({ error: 'Failed to load interviewers' });
  }
});

router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });

  try {
    const interviewers = getInterviewers();
    if (interviewers.find(i => i.email === email)) return res.status(409).json({ error: 'Interviewer already exists' });

    const newInterviewer = { id: uuidv4(), name, email, available: true, createdAt: new Date().toISOString() };
    interviewers.push(newInterviewer);
    saveInterviewers(interviewers);
    res.status(201).json(newInterviewer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save interviewer' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    let interviewers = getInterviewers();
    const exists = interviewers.find(i => i.id === req.params.id);
    if (!exists) return res.status(404).json({ error: 'Interviewer not found' });

    interviewers = interviewers.filter(i => i.id !== req.params.id);
    saveInterviewers(interviewers);
    res.json({ message: 'Interviewer removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove interviewer' });
  }
});

module.exports = router;
