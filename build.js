// build.js — runs on every Netlify deploy.
// 1. Copies the public site into /dist
// 2. Reads content/news.json
// 3. Generates dist/news/<slug>.html in the B Corridor article design
// 4. Injects the News grid (news.html) + homepage Events & News cards (index.html)
//
// Generated pages reuse styles.css + article.css and the shared header / CTA /
// footer lifted straight from article.html, so they always match the site.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// folders/files that must NOT be published
const EXCLUDE = new Set([
  'dist', 'content', 'functions', 'lib', 'tools', 'node_modules', '.git', '.github',
  'build.js', 'SETUP.md', 'README.md', 'PROJECT_LOG.md', 'package.json', 'package-lock.json',
  '.gitignore', '.env', '.dev.vars', 'wrangler.toml', 'pics', 'testcms-main.zip',
]);

const read  = (p) => fs.readFileSync(p, 'utf8');
const write = (p, c) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c, 'utf8'); };
const esc   = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return esc(d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
// Make relative href/src in lifted markup root-absolute, so it works at any depth.
function addAbs(html) {
  return html.replace(/(href|src)="(?!https?:|\/\/|\/|#|mailto:|tel:|data:)([^"]+)"/g, '$1="/$2"');
}

// ── shared SVGs ──────────────────────────────────────────────────────────────
const CAL_SVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>';
const BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H6M12 5l-7 7 7 7"/></svg>';
const WAVE_SVG = '<svg viewBox="0 0 1440 150" preserveAspectRatio="none" focusable="false"><path d="M0 80 C 240 20 480 20 720 80 C 960 140 1200 140 1440 80 L1440 150 L0 150 Z"></path></svg>';
const HERO_OVERLAY = 'linear-gradient(180deg, rgba(13,38,24,0.55) 0%, rgba(13,38,24,0.35) 40%, rgba(13,38,24,0.78) 100%)';

// ── 1. copy public files into /dist ──────────────────────────────────────────
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
for (const entry of fs.readdirSync(ROOT)) {
  if (EXCLUDE.has(entry)) continue;
  fs.cpSync(path.join(ROOT, entry), path.join(DIST, entry), { recursive: true });
}

// ── 2. load posts ────────────────────────────────────────────────────────────
const data = JSON.parse(read(path.join(ROOT, 'content', 'news.json')));
const published = (data.posts || [])
  .filter(p => p.status === 'published')
  .sort((a, b) => {
    // newest date first; for same date, newest-created first
    const byDate = new Date(b.date) - new Date(a.date);
    if (byDate !== 0) return byDate;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
console.log(`Found ${published.length} published post(s).`);

// ── 3. lift shared chrome from article.html ──────────────────────────────────
const article = read(path.join(ROOT, 'article.html'));
const grab = (re) => { const m = article.match(re); return m ? addAbs(m[0]) : ''; };
const HEADER = grab(/<header class="site-header"[\s\S]*?<\/header>/);
const CTA    = grab(/<section class="cta-section"[\s\S]*?<\/section>/);
const FOOTER = grab(/<footer class="site-footer"[\s\S]*?<\/footer>/);

// ── article page template ────────────────────────────────────────────────────
function buildArticle(post, prev, next) {
  const title   = esc(post.title);
  const cat     = esc(post.category || 'Action');
  const img     = post.featuredImage || '/assets/plants-meadows.webp';
  const metaDesc = esc(post.metaDescription || post.excerpt || '');
  const byline  = post.author ? `By ${esc(post.author)} <span class="article-meta__dot" aria-hidden="true">&middot;</span> ` : '';
  const prevLink = prev ? `<a class="article-pnav" href="/news/${esc(prev.slug)}.html"><span>${BACK_SVG}Previous</span><strong>${esc(prev.title)}</strong></a>` : '<span></span>';
  const nextLink = next ? `<a class="article-pnav article-pnav--next" href="/news/${esc(next.slug)}.html"><span>Next</span><strong>${esc(next.title)}</strong></a>` : '<span></span>';

  return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${metaDesc}" />
  <meta name="theme-color" content="#46855c" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${metaDesc}" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="${esc(img)}" />
  <title>${title} | B Corridor News</title>
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="preload" as="font" type="font/woff2" crossorigin href="/display-heading/display-heading.woff2" />
  <link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/gaegu-400-latin.woff2" />
  <link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/open-sans-400-latin.woff2" />
  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/article.css" />
  <script>document.documentElement.classList.replace("no-js","js");</script>
</head>
<body class="article-page">
  <a class="skip-link" href="#main-content">Skip to main content</a>
${HEADER}
  <main id="main-content" tabindex="-1">
    <article class="article">
      <header class="article-hero" style="background-image:${HERO_OVERLAY}, url('${esc(img)}');" aria-label="${title}">
        <div class="article-hero__inner">
          <a class="article-back" href="/news.html">${BACK_SVG}Back to News</a>
          <span class="article-tag">${cat}</span>
          <h1>${title}</h1>
          <p class="article-meta">${byline}<time datetime="${esc(post.date)}">${fmtDate(post.date)}</time></p>
        </div>
        <div class="hero-wave" aria-hidden="true">${WAVE_SVG}</div>
      </header>

      <div class="article-body">
        ${post.body || '<p>No content yet.</p>'}
        <div class="article-pnav-row">${prevLink}${nextLink}</div>
        <a class="article-back article-back--bottom" href="/news.html">${BACK_SVG}Back to News</a>
      </div>
    </article>
${CTA}
  </main>
${FOOTER}
  <script src="/script.js" defer></script>
</body>
</html>`;
}

// ── card templates ───────────────────────────────────────────────────────────
function cardBlog(p) {
  const img = esc(p.featuredImage || '/assets/placeholder.svg');
  return `        <article class="post-card" data-category="${esc(p.category || '')}">
          <a class="post-card__media" href="/news/${esc(p.slug)}.html" aria-label="Read: ${esc(p.title)}">
            <img src="${img}" alt="${esc(p.title)}" loading="lazy" onerror="this.onerror=null;this.src='/assets/placeholder.svg'" />
          </a>
          <div class="post-card__body">
            <span class="post-card__tag">${esc(p.category || 'News')}</span>
            <h3 class="post-card__title"><a href="/news/${esc(p.slug)}.html">${esc(p.title)}</a></h3>
            <p class="post-card__excerpt">${esc(p.excerpt)}</p>
            <p class="post-card__meta"><span class="post-card__date">${CAL_SVG}${fmtDate(p.date)}</span></p>
          </div>
        </article>`;
}
function cardHome(p) {
  const img = esc(p.featuredImage || '/assets/placeholder.svg');
  return `          <a class="news-card" href="/news/${esc(p.slug)}.html">
            <img src="${img}" alt="${esc(p.title)}" loading="lazy" onerror="this.onerror=null;this.src='/assets/placeholder.svg'" />
            <span class="news-tag">${esc(p.category || 'News')}</span>
            <div class="news-card-body">
              <time datetime="${esc(p.date)}">${fmtDate(p.date)}</time>
              <h3>${esc(p.title)}</h3>
              <p>${esc(p.excerpt)}</p>
            </div>
          </a>`;
}

// ── marker injection ─────────────────────────────────────────────────────────
function inject(file, inner) {
  const full = path.join(DIST, file);
  if (!fs.existsSync(full)) { console.warn(`  ! ${file} not found`); return; }
  let html = read(full);
  const START = '<!-- CMS:NEWS:START -->';
  const END   = '<!-- CMS:NEWS:END -->';
  const a = html.indexOf(START), b = html.indexOf(END);
  if (a === -1 || b === -1) { console.warn(`  ! markers not found in ${file}`); return; }
  html = html.slice(0, a + START.length) + '\n' + inner + '\n        ' + html.slice(b);
  write(full, html);
  console.log(`  ✓ ${file} grid updated`);
}

// ── 4. write news pages ──────────────────────────────────────────────────────
published.forEach((post, i) => {
  const prev = published[i + 1] || null; // older
  const next = published[i - 1] || null; // newer
  write(path.join(DIST, 'news', `${post.slug}.html`), buildArticle(post, prev, next));
  console.log(`  ✓ news/${post.slug}.html`);
});

// ── 5. grids ─────────────────────────────────────────────────────────────────
inject('news.html', published.length ? published.map(cardBlog).join('\n') : '        <p class="post-empty">No news yet, check back soon.</p>');
inject('index.html', published.slice(0, 3).map(cardHome).join('\n'));

console.log('Build complete.');
