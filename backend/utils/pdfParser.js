const pdfParse = require('pdf-parse');
const fs = require('fs');

async function extractCandidateInfo(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = data.text;

  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : null;

  // Extract name: first non-empty line of the PDF
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const name = lines[0] || 'Unknown Candidate';

  return { name, email };
}

module.exports = { extractCandidateInfo };
