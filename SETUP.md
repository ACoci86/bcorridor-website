# B Corridor — News CMS setup (Cloudflare Pages)

Your site has a small content management system so the team can write News posts
with **email + password** (no tokens, no coding). It runs free on **Cloudflare
Pages**. This is the one-time setup (~15 min). Do it once.

---

## How it works (short version)

1. An editor goes to **`yourdomain/admin`**, logs in with email + password.
2. They write a post and click **Save**.
3. A Cloudflare function commits the post to `content/news.json` in this GitHub
   repo (the GitHub token lives **only** in Cloudflare's settings, never in the page).
4. Cloudflare rebuilds the site (`node build.js`): the post becomes a page at
   `news/<slug>.html` and the **News page** + **homepage cards** refresh.
5. The live site updates in about a minute.

---

## One-time setup

### 1. Code on GitHub
Push this project to your GitHub repo (`ACoci86/bcorridor-website`).

### 2. Create a GitHub access token (for Cloudflare, not the editors)
GitHub → **Settings → Developer settings → Fine-grained personal access tokens → Generate**:
- **Repository access:** *Only select repositories* → **bcorridor-website**
- **Permissions → Repository → Contents → Read and write**
- Generate and **copy the token** (`github_pat_…`).

### 3. Create the Cloudflare Pages project
- Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
- Pick **bcorridor-website**.
- Build settings:
  - **Framework preset:** None
  - **Build command:** `node build.js`
  - **Build output directory:** `dist`
- **Save and Deploy.** (The first deploy gives you a `…pages.dev` URL. The public
  site will work; `/admin` comes alive after the next step.)

### 4. Add the environment variables
Cloudflare → your Pages project → **Settings → Environment variables → Production →
Add variable**, add these five:

| Name | Value |
|---|---|
| `GITHUB_TOKEN` | the token from step 2 |
| `GITHUB_REPO` | `ACoci86/bcorridor-website` |
| `GITHUB_BRANCH` | `main` |
| `SESSION_SECRET` | a long random string (see below) |
| `CMS_USERS` | the editor logins (see step 5) |

Generate a `SESSION_SECRET` on your computer:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Create the editor logins
For each editor, make a password hash on your computer:
```
node tools/hash-password.js "their-password"
```
It prints `saltHex:hashHex`. Build the `CMS_USERS` value as JSON:
```
{"jane@bcorridor.com":"<hash>","sam@bcorridor.com":"<hash>"}
```
Paste that as the `CMS_USERS` variable.

### 6. Redeploy & log in
Cloudflare → **Deployments → … → Retry deployment** (so the new variables apply).
Then open **`yourproject.pages.dev/admin`** and sign in.

---

## Day-to-day

- **Write / edit posts:** `/admin` → log in → **New post** or **Edit**.
- **Images:** click to upload — resized automatically, stored in `images/`.
- **Carousel / Video:** toolbar buttons in the editor (video = YouTube/Vimeo link).
- **Draft vs Published:** set *Visibility*. Drafts never appear on the live site.
- Homepage shows the **3 newest** published posts; the News page shows all, **3 per page**.

## Add or remove an editor
1. `node tools/hash-password.js "new-password"` → copy the hash.
2. Cloudflare → Environment variables → edit `CMS_USERS`, add/remove the
   `"email":"hash"` entry → **Save**.
3. **Retry the latest deployment** so the change takes effect.
   (Removing an entry revokes that person.)

## Custom domain
Cloudflare → your Pages project → **Custom domains → Set up a domain** → follow the
DNS steps. HTTPS is automatic.

---

## What's where

| Path | What it is |
|---|---|
| `admin/` | the editor (login + post form) |
| `content/news.json` | all posts (source of truth; not published) |
| `functions/api/` | Cloudflare functions: login, logout, list, save, upload |
| `lib/cms.js` | shared auth (Web Crypto) + GitHub helpers |
| `build.js` | generates `news/<slug>.html` + grids → `dist/` |
| `tools/hash-password.js` | makes a password hash for a new editor |

## Local preview (static only)
```
node build.js
python3 -m http.server -d dist 8080
```
The `/admin` login only works on the deployed Cloudflare site (it needs the functions).
