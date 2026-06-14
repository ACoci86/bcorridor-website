// POST /api/upload { filename, dataBase64 } → commits image to /images. Auth required.
import { json, requireAuth, ghGetFile, ghPutFile } from '../../lib/cms.js';

function safeName(name) {
  return String(name || 'image')
    .toLowerCase().replace(/[^a-z0-9.\-_]/g, '-').replace(/-+/g, '-').slice(-60);
}

export async function onRequestPost({ request, env }) {
  const email = await requireAuth(request, env);
  if (!email) return json(401, { error: 'Not logged in' });

  let body;
  try { body = await request.json(); } catch { return json(400, { error: 'Bad request' }); }

  const { filename, dataBase64 } = body;
  if (!filename || !dataBase64) return json(400, { error: 'Missing file' });

  const base64 = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
  if (base64.length > 7_000_000) return json(413, { error: 'Image too large (max ~5MB)' });

  const repoPath = 'images/' + Date.now().toString(36) + '-' + safeName(filename);
  try {
    const existing = await ghGetFile(env, repoPath);
    await ghPutFile(env, repoPath, base64, `CMS: upload ${repoPath} (${email})`, existing.sha || undefined);
    return json(200, { ok: true, url: '/' + repoPath });
  } catch (e) {
    return json(500, { error: 'Upload failed', detail: String(e.message || e) });
  }
}
