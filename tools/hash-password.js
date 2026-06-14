// Generate a password hash for a new editor (PBKDF2-HMAC-SHA256).
// Must match the verification in lib/cms.js.
//
//   node tools/hash-password.js "their-password"
//
// Output is "saltHex:hashHex" — put it in the CMS_USERS env var, e.g.
//   {"jane@bcorridor.com":"<hash>","sam@bcorridor.com":"<hash>"}

const crypto = require('crypto');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node tools/hash-password.js "the-password"');
  process.exit(1);
}

const ITER = 100000;
const LEN = 32; // bytes — must match lib/cms.js
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(String(password), salt, ITER, LEN, 'sha256');
console.log(`${salt.toString('hex')}:${hash.toString('hex')}`);
