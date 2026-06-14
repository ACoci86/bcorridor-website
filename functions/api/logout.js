// POST /api/logout → clears the session cookie
import { json, sessionCookie } from '../../lib/cms.js';

export async function onRequestPost() {
  return json(200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
}
