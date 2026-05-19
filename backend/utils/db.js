const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const INTERVIEWERS_FILE = path.join(DATA_DIR, 'interviewers.json');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8').trim();
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read ${file}:`, err.message);
    return [];
  }
}

function writeJSON(file, data) {
  // Atomic write: write to temp file then rename to avoid corruption
  const tmp = file + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, file);
  } catch (err) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw err;
  }
}

module.exports = {
  getInterviewers: () => readJSON(INTERVIEWERS_FILE),
  saveInterviewers: (data) => writeJSON(INTERVIEWERS_FILE, data),
  getApplications: () => readJSON(APPLICATIONS_FILE),
  saveApplications: (data) => writeJSON(APPLICATIONS_FILE, data),
};
