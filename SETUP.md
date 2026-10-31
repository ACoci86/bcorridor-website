# <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-settings.png" width="32" align="top" alt="" /> Setting up the news editor

This guide explains how to set up the website and its news editor on Cloudflare Pages.
You only need to do this once. It takes about 15 minutes and costs nothing.

The live website is https://bcorridorwaterford.com and the editor is at
https://bcorridorwaterford.com/admin.

---

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/filetype-form.png" width="32" align="top" alt="" /> What you need

- A GitHub account that owns the `bcorridor-website` repository
- A Cloudflare account (the free plan is enough)
- [Node.js](https://nodejs.org) on your computer, to make passwords and test the site

---

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-run.png" width="32" align="top" alt="" /> How it works

1. An editor goes to `/admin` and logs in with an email and password.
2. They write a post and press Save.
3. A Cloudflare function saves the post into `content/news.json` on GitHub.
4. Cloudflare rebuilds the site with `node build.js`. The post becomes its own page,
   and the News page and home page cards update.
5. The change is live in about a minute.

The GitHub token that allows step 3 is kept in Cloudflare's settings. It is never
written on a web page, so editors cannot see it.

---

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/downloads.png" width="32" align="top" alt="" /> One-time setup

### <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/git-directory.png" width="32" align="top" alt="" /> Step 1. Put the code on GitHub

Push this project to the GitHub repository `ACoci86/bcorridor-website`.

### <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/key.png" width="32" align="top" alt="" /> Step 2. Create a GitHub token

The token gives Cloudflare permission to save posts. Editors never see it.

1. On GitHub, open Settings, then Developer settings, then Personal access tokens,
   then Fine-grained tokens.
2. Press Generate new token.
3. Under Repository access, choose Only select repositories and pick `bcorridor-website`.
4. Under Permissions, find Contents and set it to Read and write.
5. Press Generate token and copy it. It starts with `github_pat_`. You will not be
   able to see it again, so keep it somewhere safe until step 4.

### <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/network.png" width="32" align="top" alt="" /> Step 3. Create the Cloudflare Pages project

1. In the Cloudflare dashboard, go to Workers & Pages, then Create, then Pages,
   then Connect to Git.
2. Choose the `bcorridor-website` repository.
3. Enter these build settings:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `node build.js` |
| Build output directory | `dist` |

4. Press Save and Deploy.

The first deploy gives you a temporary `pages.dev` address. The public site works
straight away. The editor starts working after step 4.

### <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-display-settings.png" width="32" align="top" alt="" /> Step 4. Add the settings

In your Pages project, open Settings, then Environment variables, then Production, and
add these five:

| Name | What to put |
|---|---|
| `GITHUB_TOKEN` | The token from step 2 |
| `GITHUB_REPO` | `ACoci86/bcorridor-website` |
| `GITHUB_BRANCH` | `main` |
| `SESSION_SECRET` | A long random string (see below) |
| `CMS_USERS` | The editors' logins (see step 5) |

To make a `SESSION_SECRET`, run this on your computer and copy what it prints:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-user-settings.png" width="32" align="top" alt="" /> Step 5. Create the editor logins

Do this for each editor. It turns their password into a scrambled code (a hash), so the
real password is never stored anywhere.

1. Run this on your computer, with their password inside the quotes:

```
node tools/hash-password.js "their-password"
```

2. It prints a long code with a colon in the middle. Copy it.
3. Put every editor into one line, with each email next to their code:

```
{"jane@example.com":"<code>","sam@example.com":"<code>"}
```

4. Paste that whole line in as the `CMS_USERS` value.

### <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/home.png" width="32" align="top" alt="" /> Step 6. Redeploy and log in

1. In Cloudflare, open Deployments and retry the latest deployment, so the new
   settings are picked up.
2. Go to `/admin` on your site and sign in.

If you can sign in and see the Posts screen, you are done.

---

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-browser.png" width="32" align="top" alt="" /> Using your own domain

1. In your Pages project, open Custom domains and choose Set up a domain.
2. Enter your domain and follow the steps Cloudflare shows. HTTPS is set up for you.
3. Check that the address in the `<head>` of `index.html` matches your domain. It is used
   for social media previews and is currently `https://bcorridorwaterford.com/`.

---

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-calendar.png" width="32" align="top" alt="" /> Everyday use

- Editors write, edit and delete posts at `/admin`. Their instructions are in
  [EDITOR-GUIDE.md](EDITOR-GUIDE.md).
- A post marked Draft is never shown on the site. A post marked Published goes live.
- The home page shows the 3 newest published posts. The News page shows all of them,
  3 per page.

### <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/app-user-settings.png" width="32" align="top" alt="" /> Adding or removing an editor

1. Run `node tools/hash-password.js "new-password"` and copy the result.
2. In Cloudflare, open Environment variables and edit `CMS_USERS`. Add or delete that
   person's entry, then save.
3. Retry the latest deployment so the change takes effect.

Deleting someone's entry stops them from logging in.

### <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/certificate.png" width="32" align="top" alt="" /> Changing someone's password

Follow the same steps as adding an editor, and replace that person's old code with
the new one.

---

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/desktop.png" width="32" align="top" alt="" /> Trying it on your computer

To see the public site:

```
node build.js
python3 -m http.server -d dist 8080
```

Then open http://localhost:8080.

To try the editor as well, use Wrangler, which runs the Cloudflare functions on your
computer:

```
npx wrangler pages dev dist
```

Put the same settings as step 4 in a file called `.dev.vars` in the project folder.
This file is private and is never saved to GitHub. To set a password for local testing,
run:

```
node tools/set-local-password.js "a-password"
```

---

## <img src="https://cdn.jsdelivr.net/gh/SerenityOS/serenity@master/Base/res/icons/32x32/msgbox-warning.png" width="32" align="top" alt="" /> If something goes wrong

| Problem | What to try |
|---|---|
| The editor says "Invalid email or password" | Check the email and password. If needed, make a new code and replace it in `CMS_USERS`. |
| The editor says "Please sign in again" | Sign in again. This happens after being away for a while. |
| Saving fails | Check that `GITHUB_TOKEN` is correct and still allows Contents, Read and write. |
| A change in Cloudflare has no effect | Retry the latest deployment. Settings only apply to new deployments. |
| A post is saved but not on the site | Wait a minute for the rebuild, then reload. Check the post is set to Published. |
