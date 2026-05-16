require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/interviewers', require('./routes/interviewers'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/respond', require('./routes/respond'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Catch-all → index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Interview Scheduler running on http://localhost:${PORT}`);
});
