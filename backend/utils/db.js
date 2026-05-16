const fs = require('fs');
const path = require('path');

const INTERVIEWERS_FILE = path.join(__dirname, '../../data/interviewers.json');
const APPLICATIONS_FILE = path.join(__dirname, '../../data/applications.json');

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  getInterviewers: () => readJSON(INTERVIEWERS_FILE),
  saveInterviewers: (data) => writeJSON(INTERVIEWERS_FILE, data),
  getApplications: () => readJSON(APPLICATIONS_FILE),
  saveApplications: (data) => writeJSON(APPLICATIONS_FILE, data),
};
