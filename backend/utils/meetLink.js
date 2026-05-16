const { v4: uuidv4 } = require('uuid');

function generateMeetLink() {
  const code = uuidv4().replace(/-/g, '').substring(0, 10);
  const formatted = `${code.slice(0,3)}-${code.slice(3,7)}-${code.slice(7,10)}`;
  return `https://meet.google.com/${formatted}`;
}

module.exports = { generateMeetLink };
