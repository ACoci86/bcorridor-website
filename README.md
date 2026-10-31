<p align="center">
  <img src="assets/logo-nav.png" alt="B Corridor logo" width="120" />
</p>

<h1 align="center">B Corridor website</h1>

<p align="center">
  The website for the B Corridor, a biodiversity corridor in Waterford, Ireland.
</p>

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-welcome.png" width="32" align="top" alt="" /> What this is

A fast, simple website built with plain HTML, CSS and JavaScript. It also has a
small news editor, so the team can publish News posts by logging in with an email
and password. There is no database and no server to look after.

The site is hosted for free on Cloudflare Pages and updates itself whenever the
code or a news post changes on GitHub.

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/network.png" width="32" align="top" alt="" /> Find B Corridor online

<p>
  <a href="https://www.facebook.com/people/B-Corridor/61587389275249/"><img src="https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white" alt="Facebook" /></a>
  <a href="https://www.instagram.com/waterfordbcorridor/"><img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" /></a>
  <a href="mailto:bcorridorwaterford@gmail.com"><img src="https://img.shields.io/badge/Email-46855C?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIiIHk9IjQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIxNiIgcng9IjIiLz48cGF0aCBkPSJtMjIgNy0xMCA2TDIgNyIvPjwvc3ZnPg==" alt="Email" /></a>
  <a href="https://www.idonate.ie/donate/cause/bcorridorwaterford"><img src="https://img.shields.io/badge/Donate-896C4B?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyMXMtNy41LTQuNi05LjYtOS4zQy45IDguMyAyLjggNC41IDYuNCA0LjVjMiAwIDMuNyAxIDUuNiAzLjEgMS45LTIuMSAzLjYtMy4xIDUuNi0zLjEgMy42IDAgNS41IDMuOCA0IDcuMkMxOS41MDAgMTYuNDAwIDEyIDIxIDEyIDIxeiIvPjwvc3ZnPg==" alt="Donate" /></a>
</p>

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-settings.png" width="32" align="top" alt="" /> Built with

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflarepages&logoColor=white" alt="Cloudflare Pages" />
  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
</p>

- Plain HTML, CSS and JavaScript, with no framework.
- Node.js runs `build.js`, which turns the news posts into web pages.
- Leaflet draws the trail map, using Stadia Maps and Esri tiles and OSRM for walking routes.
- The "Did you know?" fact comes from the iNaturalist API.
- Cloudflare Pages hosts the site and runs the editor's functions. GitHub stores the code and the news posts.

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-browser.png" width="32" align="top" alt="" /> What is in the site

- A home page with the story of the project, an interactive trail map, a "Did you
  know?" wildlife fact, partners and ways to get involved.
- A News page with category filters and pages of posts.
- One page for each news post. These are generated automatically.
- A friendly 404 page.

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-text-editor.png" width="32" align="top" alt="" /> How the news editor works

1. An editor opens `/admin` and logs in.
2. They write a post and press Save.
3. A Cloudflare function saves the post into `content/news.json` on GitHub.
4. Cloudflare rebuilds the site, and the new post is live within about a minute.

Editors have their own step by step instructions in [EDITOR-GUIDE.md](EDITOR-GUIDE.md).
To set everything up from scratch, see [SETUP.md](SETUP.md).

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/filetype-folder.png" width="32" align="top" alt="" /> Folder guide

| Path | What it is |
|---|---|
| `index.html` | The home page |
| `news.html` | The News page |
| `article.html` | A sample article. The generated posts copy its header and footer |
| `404.html` | The "page not found" page |
| `styles.css`, `blog.css`, `article.css`, `404.css` | The styles |
| `script.js` | The page behaviour: menu, hero video, map, carousels, news filter |
| `assets/` | Images, icons, videos and all fonts (`assets/fonts/`) |
| `images/` | Photos uploaded through the news editor |
| `vendor/leaflet/` | The Leaflet map library |
| `admin/` | The news editor |
| `functions/api/` | The editor's back end: login, logout, list, save and upload |
| `lib/cms.js` | Shared login and GitHub code used by the functions |
| `content/news.json` | All news posts |
| `build.js` | Builds the finished site into `dist/` |
| `tools/` | Small helper scripts for editor passwords |

The `dist/` folder is created by `build.js`. Do not edit it by hand.

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-terminal.png" width="32" align="top" alt="" /> Run it on your computer

You need [Node.js](https://nodejs.org) installed.

```
node build.js
python3 -m http.server -d dist 8080
```

Then open http://localhost:8080. This shows the public site. The `/admin` editor
needs Cloudflare Functions, so to try it locally use:

```
npx wrangler pages dev dist
```

This reads its settings from a `.dev.vars` file, which is kept private and is not
saved to GitHub. To set a local editor password, run
`node tools/set-local-password.js "a-password"`.

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/downloads.png" width="32" align="top" alt="" /> Publishing

Cloudflare Pages is connected to this GitHub repository, with these settings:

- Build command: `node build.js`
- Build output directory: `dist`

Every push to the main branch publishes automatically.

The repository is public, so no secrets are stored in it. The GitHub token, session
secret and editor logins live in Cloudflare's environment variables. Because the
repository is public, anything in `content/news.json`, including drafts, can be
read by anyone. Do not put private information in a draft.

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-hearts.png" width="32" align="top" alt="" /> Credits

Website by [Alessio Coci](https://github.com/ACoci86).
