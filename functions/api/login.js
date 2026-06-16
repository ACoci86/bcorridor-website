// POST /api/login  { email, password } → sets httpOnly session cookie
import { json, findUserHash, verifyPassword, signSession, sessionCookie } from '../../lib/cms.js';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json(400, { error: 'Bad request' }); }

  const email = String(body.email || '').trim();
  const password = String(body.password || '');
  if (!email || !password) return json(400, { error: 'Email and password are required' });

  const stored = findUserHash(env, email);
  const ok = stored ? await verifyPassword(password, stored) : false;
  if (!ok) return json(401, { error: 'Invalid email or password' });

  const token = await signSession(email.toLowerCase(), env.SESSION_SECRET);
  // local sandbox runs over http, where Secure cookies are dropped — omit Secure there only
  return json(200, { ok: true, email }, { 'Set-Cookie': sessionCookie(token, 60 * 60 * 8, !env.DEV_MOCK) });
}
