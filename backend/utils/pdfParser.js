const fs = require('fs');

async function extractCandidateInfo(filePath) {
  // Lazy-require pdf-parse to avoid startup issues with its test file check
  let pdfParse;
  try {
    pdfParse = require('pdf-parse/lib/pdf-parse.js');
  } catch {
    pdfParse = require('pdf-parse');
  }

  const buffer = fs.readFileSync(filePath);

  let text = '';
  try {
    const data = await pdfParse(buffer);
    text = data.text || '';
  } catch (err) {
    throw new Error('Failed to parse PDF: ' + err.message);
  }

  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : null;

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1 && !/^[\W\d]+$/.test(l));
  const name = lines[0] || 'Unknown Candidate';

  return { name, email };
}

module.exports = { extractCandidateInfo };
