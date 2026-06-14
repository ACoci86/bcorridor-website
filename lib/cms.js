// lib/cms.js — shared helpers for the Cloudflare Pages Functions.
// Runs on the Workers runtime: uses Web Crypto + fetch only (no Node APIs).
// Env vars arrive via the function's `context.env`, so they're passed in.

// ── encoders ────────────────────────────────────────────────────────────────
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function b64urlFromBytes(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlEncodeStr(str) {
  return b64urlFromBytes(new TextEncoder().encode(str));
}
function b64urlDecodeToStr(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
// standard base64 (for GitHub file content, which is UTF-8)
export function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
export function fromBase64(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ── password hashing (PBKDF2-HMAC-SHA256) ───────────────────────────────────
// Stored format: "saltHex:hashHex". Must match tools/hash-password.js.
const PBKDF2_ITER = 100000;
const PBKDF2_LEN = 32; // bytes
async function pbkdf2(password, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITER, hash: 'SHA-256' },
    keyMaterial, PBKDF2_LEN * 8
  );
  return bytesToHex(new Uint8Array(bits));
}
export async function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [saltHex, hashHex] = stored.split(':');
  const test = await pbkdf2(String(password), hexToBytes(saltHex));
  return safeEqual(test, hashHex);
}

// ── editor accounts ─────────────────────────────────────────────────────────
export function getUsers(env) {
  try { return JSON.parse(env.CMS_USERS || '{}'); } catch { return {}; }
}
export function findUserHash(env, email) {
  const users = getUsers(env);
  const key = Object.keys(users).find((k) => k.toLowerCase() === String(email).toLowerCase());
  return key ? users[key] : null;
}

// ── sessions (HMAC-SHA256 signed token in an httpOnly cookie) ────────────────
const SESSION_TTL = 60 * 60 * 8; // 8h
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret || ''), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return b64urlFromBytes(new Uint8Array(sig));
}
export async function signSession(email, secret) {
  const payload = b64urlEncodeStr(JSON.stringify({ email, exp: Date.now() + SESSION_TTL * 1000 }));
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}
export async function verifyToken(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = await hmac(secret, payload);
  if (!safeEqual(sig, expected)) return null;
  let data;
  try { data = JSON.parse(b64urlDecodeToStr(payload)); } catch { return null; }
  if (!data.exp || data.exp < Date.now()) return null;
  return data.email;
}
function parseCookies(request) {
  const raw = request.headers.get('Cookie') || '';
  const out = {};
  raw.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}
export async function requireAuth(request, env) {
  return verifyToken(parseCookies(request).cms_session, env.SESSION_SECRET);
}
export function sessionCookie(value, maxAge) {
  return [`cms_session=${value}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Strict', `Max-Age=${maxAge}`].join('; ');
}

// ── responses ───────────────────────────────────────────────────────────────
export function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// ── GitHub Contents API ─────────────────────────────────────────────────────
function ghHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'bcorridor-cms',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}
export async function ghGetFile(env, path) {
  const branch = env.GITHUB_BRANCH || 'main';
  const r = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${encodeURI(path)}?ref=${branch}`,
    { headers: ghHeaders(env) }
  );
  if (r.status === 404) return { sha: null, content: null };
  if (!r.ok) throw new Error(`GitHub GET ${path} -> ${r.status}`);
  const j = await r.json();
  return { sha: j.sha, content: fromBase64(j.content) };
}
export async function ghPutFile(env, path, contentBase64, message, sha) {
  const branch = env.GITHUB_BRANCH || 'main';
  const body = { message, content: contentBase64, branch };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${encodeURI(path)}`, {
    method: 'PUT',
    headers: { ...ghHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`GitHub PUT ${path} -> ${r.status}: ${await r.text()}`);
  return r.json();
}
