// GET /api/list → all posts (incl. drafts) for the editor. Auth required.
import { json, requireAuth, ghGetFile } from '../../lib/cms.js';

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) return json(401, { error: 'Not logged in' });
  if (env.DEV_MOCK) return json(200, { posts: globalThis.__DEV_POSTS || [] }); // local sandbox: in-memory posts
  try {
    const { content } = await ghGetFile(env, 'content/news.json');
    const data = content ? JSON.parse(content) : { posts: [] };
    return json(200, { posts: data.posts || [] });
  } catch (e) {
    return json(500, { error: 'Could not load posts', detail: String(e.message || e) });
  }
}
