// LOCAL DEV ONLY — set the password for the local wrangler editor login.
// Rewrites the CMS_USERS entry in .dev.vars (git-ignored). Does NOT touch the
// live site. Usage:
//   node tools/set-local-password.js "a-temp-password"
//   node tools/set-local-password.js "a-temp-password" someone@example.com
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const password = process.argv[2];
const email = (process.argv[3] || 'bcorridorwaterford@gmail.com').trim();
if (!password) {
  console.error('Usage: node tools/set-local-password.js "the-password" [email]');
  process.exit(1);
}

const ITER = 100000, LEN = 32; // must match lib/cms.js
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(String(password), salt, ITER, LEN, 'sha256');
const stored = salt.toString('hex') + ':' + hash.toString('hex');

const file = path.join(__dirname, '..', '.dev.vars');
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
let users = {};
const out = lines.map((line) => {
  if (line.startsWith('CMS_USERS=')) {
    try { users = JSON.parse(line.slice('CMS_USERS='.length)); } catch {}
    users[email] = stored;
    return 'CMS_USERS=' + JSON.stringify(users);
  }
  return line;
});
fs.writeFileSync(file, out.join('\n'));
console.log(`Local password set for ${email}. Restart the dev server to apply.`);
