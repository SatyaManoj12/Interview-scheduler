function generateMeetLink() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  // Google Meet format: xxx-xxxx-xxx (all lowercase letters)
  return `https://meet.google.com/${rand(3)}-${rand(4)}-${rand(3)}`;
}

module.exports = { generateMeetLink };
