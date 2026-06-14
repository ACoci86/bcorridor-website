// POST /api/save → create/update a post, or { action:'delete', id }. Auth required.
import { json, requireAuth, ghGetFile, ghPutFile, toBase64 } from '../../lib/cms.js';

function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export async function onRequestPost({ request, env }) {
  const email = await requireAuth(request, env);
  if (!email) return json(401, { error: 'Not logged in' });

  let body;
  try { body = await request.json(); } catch { return json(400, { error: 'Bad request' }); }

  try {
    const { sha, content } = await ghGetFile(env, 'content/news.json');
    const data = content ? JSON.parse(content) : { posts: [] };
    const posts = data.posts || [];
    const now = new Date().toISOString();

    if (body.action === 'delete') {
      const idx = posts.findIndex((p) => p.id === body.id);
      if (idx === -1) return json(404, { error: 'Post not found' });
      posts.splice(idx, 1);
    } else {
      const p = body.post || {};
      if (!p.title || !p.title.trim()) return json(400, { error: 'Title is required' });

      const existing = p.id ? posts.find((x) => x.id === p.id) : null;
      let base = slugify(p.slug || p.title) || 'post';
      let slug = base, n = 2;
      while (posts.some((x) => x.slug === slug && x !== existing)) slug = `${base}-${n++}`;

      const record = {
        id: existing ? existing.id : 'post-' + Date.now().toString(36),
        slug,
        status: p.status === 'published' ? 'published' : 'draft',
        title: String(p.title).trim(),
        excerpt: String(p.excerpt || '').trim(),
        body: String(p.body || ''),
        category: ['Action', 'Education', 'Community'].includes(p.category) ? p.category : 'Action',
        featuredImage: String(p.featuredImage || '').trim(),
        date: /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : now.slice(0, 10),
        author: String(p.author || '').trim(),
        metaDescription: String(p.metaDescription || '').trim(),
        createdAt: existing ? existing.createdAt : now,
        updatedAt: now,
      };

      if (existing) Object.assign(existing, record);
      else posts.push(record);
    }

    data.posts = posts;
    const encoded = toBase64(JSON.stringify(data, null, 2));
    await ghPutFile(env, 'content/news.json', encoded, `CMS: update news (${email})`, sha || undefined);
    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: 'Save failed', detail: String(e.message || e) });
  }
}
