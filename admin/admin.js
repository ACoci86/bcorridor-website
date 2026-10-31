const fn = (name) => "/api/" + name;
const $ = (id) => document.getElementById(id);
let posts = [];
let editingId = null;

function toast(msg, isErr) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast show" + (isErr ? " err" : "");
  setTimeout(() => (t.className = "toast"), 2600);
}

// ── auth ──────────────────────────────────────────────────────────────────
async function checkAuth() {
  try {
    const r = await fetch(fn("list"));
    if (r.ok) {
      const d = await r.json();
      posts = d.posts || [];
      showApp();
      renderList();
      return;
    }
  } catch (e) {}
  showLogin();
}
function showLogin() {
  $("login").classList.remove("hidden");
  $("app").classList.add("hidden");
}
function showApp() {
  $("login").classList.add("hidden");
  $("app").classList.remove("hidden");
}

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("li-email").value.trim(),
    password = $("li-pass").value;
  const r = await fetch(fn("login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (r.ok) {
    $("li-pass").value = "";
    checkAuth();
  } else {
    const d = await r.json().catch(() => ({}));
    toast(d.error || "Login failed", true);
  }
});
$("logoutBtn").addEventListener("click", async () => {
  await fetch(fn("logout"), { method: "POST" });
  showLogin();
});

// ── list ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt)
    ? d
    : dt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}
function renderList() {
  const el = $("postList");
  const sorted = [...posts].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  if (!sorted.length) {
    el.innerHTML =
      '<div class="empty">No posts yet. Click “New post” to write your first one.</div>';
    return;
  }
  el.innerHTML = sorted
    .map(
      (p) => `
<div class="post-row">
  <img class="thumb" src="${p.featuredImage || "/assets/placeholder.svg"}" alt="" onerror="this.src='/assets/placeholder.svg'"/>
  <div class="info">
    <h3>${escapeHtml(p.title)}</h3>
    <div class="meta">
      <span class="badge ${p.status === "published" ? "badge--pub" : "badge--draft"}">${p.status === "published" ? "Published" : "Draft"}</span>
      &nbsp; ${escapeHtml(p.category || "")} &nbsp;·&nbsp; ${fmtDate(p.date)}
    </div>
  </div>
  ${p.status === "published" && p.slug ? `<a class="btn btn--ghost btn--sm" href="/news/${p.slug}" target="_blank" rel="noopener" style="text-decoration:none">View ↗</a>` : ""}
  <button class="btn btn--ghost btn--sm" data-edit="${p.id}">Edit</button>
</div>`,
    )
    .join("");
  el.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => openEditor(b.dataset.edit)),
  );
}
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── editor ──────────────────────────────────────────────────────────────────
function openEditor(id) {
  editingId = id || null;
  const p = id ? posts.find((x) => x.id === id) : null;
  $("editTitle").textContent = p ? "Edit post" : "New post";
  $("f-title").value = p?.title || "";
  $("f-excerpt").value = p?.excerpt || "";
  $("f-category").value = p?.category || "Action";
  $("f-date").value = p?.date || new Date().toISOString().slice(0, 10);
  $("f-author").value = p?.author || "B Corridor Team";
  $("f-featimg").value = p?.featuredImage || "";
  $("f-body").innerHTML = p?.body || "";
  normalizeEditorBlocks();
  $("f-status").value = p?.status || "published";
  const prev = $("featPreview");
  if (p?.featuredImage) {
    prev.src = p.featuredImage;
    prev.style.display = "block";
    $("featRemove").style.display = "inline-flex";
  } else {
    prev.style.display = "none";
    $("featRemove").style.display = "none";
  }
  $("deleteBtn").style.display = id ? "inline-flex" : "none";
  const vl = $("viewLive");
  if (p && p.status === "published" && p.slug) {
    vl.href = "/news/" + p.slug;
    vl.style.display = "inline-flex";
  } else {
    vl.style.display = "none";
  }
  $("listView").classList.add("hidden");
  $("editView").classList.remove("hidden");
  window.scrollTo(0, 0);
}
$("newBtn").addEventListener("click", () => openEditor(null));
$("backBtn").addEventListener("click", () => {
  $("editView").classList.add("hidden");
  $("listView").classList.remove("hidden");
});

// toolbar
document.querySelectorAll(".editor-toolbar [data-cmd]").forEach((b) =>
  b.addEventListener("mousedown", (e) => {
    e.preventDefault();
    document.execCommand(b.dataset.cmd, false, null);
  }),
);
document.querySelectorAll(".editor-toolbar [data-block]").forEach((b) =>
  b.addEventListener("mousedown", (e) => {
    e.preventDefault();
    document.execCommand("formatBlock", false, b.dataset.block);
  }),
);
$("linkBtn").addEventListener("mousedown", (e) => {
  e.preventDefault();
  const url = prompt("Link address (https://…)");
  if (url) document.execCommand("createLink", false, url);
});
// ── selection-safe insertion ───────────────────────────────────────────────
// File pickers / modals steal focus from the editor, losing the caret. We save
// the cursor position when a toolbar button is pressed, then insert there via
// the DOM (reliable) instead of execCommand (flaky once focus is lost).
let savedRange = null;
function saveSel() {
  const s = window.getSelection();
  if (s && s.rangeCount && $("f-body").contains(s.anchorNode))
    savedRange = s.getRangeAt(0).cloneRange();
}
function insertNode(node) {
  $("f-body").focus();
  let range =
    savedRange && $("f-body").contains(savedRange.commonAncestorContainer)
      ? savedRange
      : null;
  if (!range) {
    range = document.createRange();
    range.selectNodeContents($("f-body"));
    range.collapse(false);
  }
  range.deleteContents();
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  const s = window.getSelection();
  s.removeAllRanges();
  s.addRange(range);
  savedRange = range.cloneRange();
}
// Insert a block-level node as a DIRECT child of the editor (never nested inside
// a paragraph), so a carousel/video can never wrap the surrounding article text.
function insertBlock(node) {
  const fb = $("f-body");
  fb.focus();
  let range =
    savedRange && fb.contains(savedRange.commonAncestorContainer)
      ? savedRange
      : null;
  if (!range) {
    fb.appendChild(node);
  } else {
    let n = range.startContainer; // climb to the top-level child of the editor
    while (n && n !== fb && n.parentNode !== fb) n = n.parentNode;
    if (n && n !== fb && n.parentNode === fb) n.after(node);
    else fb.appendChild(node);
  }
  const r = document.createRange();
  r.setStartAfter(node);
  r.collapse(true);
  const s = window.getSelection();
  s.removeAllRanges();
  s.addRange(r);
  savedRange = r.cloneRange();
}
function insertCarousel(items) {
  // items: [{url, dataUrl, caption}]
  const car = document.createElement("div");
  car.className = "article-carousel";
  car.setAttribute("contenteditable", "false");
  items.forEach((it) => {
    const img = document.createElement("img");
    img.src = it.dataUrl || it.url; // show instantly — no wait for redeploy
    img.setAttribute("data-url", it.url); // real /images path, written back on save
    img.alt = it.caption || "";
    if (it.caption) img.setAttribute("data-caption", it.caption);
    car.appendChild(img);
  });
  insertBlock(car);
  const p = document.createElement("p");
  p.innerHTML = "<br>";
  car.after(p);
}

// Prepare a saved post for editing. Older/buggy saves can trap article text
// INSIDE a carousel (which is contenteditable=false → uneditable). So we lift
// any non-image content back out, re-lock the blocks as non-editable, and make
// sure there's an editable line after a trailing block.
function normalizeEditorBlocks() {
  const fb = $("f-body");
  fb.querySelectorAll(".article-carousel").forEach((car) => {
    let ref = car;
    [...car.childNodes].forEach((n) => {
      if (n.nodeType === 1 && n.tagName === "IMG") return; // keep images inside
      const blank =
        (n.nodeType === 3 && !n.textContent.trim()) ||
        (n.nodeType === 1 && n.tagName === "BR");
      if (blank) {
        n.remove();
        return;
      } // drop empty filler
      if (n.nodeType === 3) {
        // bare text → wrap in <p>, move out
        const p = document.createElement("p");
        p.textContent = n.textContent;
        ref.after(p);
        ref = p;
        n.remove();
      } else {
        ref.after(n);
        ref = n;
      } // element → move out, keep order
    });
    car.setAttribute("contenteditable", "false");
  });
  fb.querySelectorAll(".article-embed").forEach((el) =>
    el.setAttribute("contenteditable", "false"),
  );
  const last = fb.lastElementChild;
  if (
    last &&
    (last.classList.contains("article-carousel") ||
      last.classList.contains("article-embed"))
  ) {
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    fb.appendChild(p);
  }
}

// single image
$("imgBtn").addEventListener("mousedown", (e) => {
  e.preventDefault();
  saveSel();
  $("bodyImgFile").click();
});
$("bodyImgFile").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  toast("Uploading image…");
  try {
    const { url, dataUrl } = await uploadImage(f);
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = "";
    img.setAttribute("data-url", url);
    insertNode(img);
    toast("Image added ✓");
  } catch (err) {
    toast(err.message || "Upload failed", true);
  }
});

// ── carousel manager: add photos / edit captions / remove photos ────────────
let capMode = "new"; // 'new' = uploading picked files, 'edit' = existing carousel
let capEditTarget = null; // the .article-carousel being edited
let capEntries = []; // working list: {previewUrl, caption, file?, imgEl?, objUrl?}

$("carouselBtn").addEventListener("mousedown", (e) => {
  e.preventDefault();
  saveSel();
  $("carouselFiles").click();
});
$("carouselFiles").addEventListener("change", (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  if (!files.length) return;
  capMode = "new";
  capEditTarget = null;
  capEntries = files.map((f) => {
    const objUrl = URL.createObjectURL(f);
    return { previewUrl: objUrl, objUrl, caption: "", file: f };
  });
  openCapModal(
    "Add carousel photos",
    "Add a caption under each photo (optional), or remove any you don’t want.",
  );
});

// click a carousel to manage it; click a normal image to remove it
$("f-body").addEventListener("click", (e) => {
  const car = e.target.closest && e.target.closest(".article-carousel");
  if (car && $("f-body").contains(car)) {
    capMode = "edit";
    capEditTarget = car;
    capEntries = [];
    [...car.querySelectorAll("img")].forEach((im) =>
      capEntries.push({
        previewUrl: im.src,
        caption: im.getAttribute("data-caption") || "",
        imgEl: im,
      }),
    );
    openCapModal(
      "Manage carousel photos",
      "Edit captions, remove photos, or delete the whole carousel.",
    );
    return;
  }
  const embed = e.target.closest && e.target.closest(".article-embed");
  if (embed && $("f-body").contains(embed)) {
    showElRemove(embed, "video");
    return;
  }
  const img = e.target.tagName === "IMG" ? e.target : null;
  if (
    img &&
    $("f-body").contains(img) &&
    !img.closest(".article-carousel")
  ) {
    showElRemove(img, "image");
    return;
  }
  hideImgRemove();
});

function syncCaps() {
  [...$("capList").querySelectorAll(".cap-input")].forEach((inp, i) => {
    if (capEntries[i]) capEntries[i].caption = inp.value.trim();
  });
}
function renderCapList() {
  const list = $("capList");
  list.innerHTML = "";
  if (!capEntries.length) {
    const m = document.createElement("div");
    m.className = "cap-empty";
    m.textContent = "No photos left. Cancel, or delete the carousel.";
    list.appendChild(m);
  }
  capEntries.forEach((en, idx) => {
    const row = document.createElement("div");
    row.className = "cap-row";
    const img = document.createElement("img");
    img.className = "cap-thumb";
    img.src = en.previewUrl;
    img.alt = "";
    const inp = document.createElement("input");
    inp.className = "cap-input";
    inp.type = "text";
    inp.placeholder = "Caption (optional)";
    inp.value = en.caption || "";
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "cap-remove";
    rm.textContent = "✕";
    rm.title = "Remove this photo";
    rm.addEventListener("click", () => {
      syncCaps();
      const gone = capEntries.splice(idx, 1)[0];
      if (gone && gone.objUrl) URL.revokeObjectURL(gone.objUrl);
      renderCapList();
    });
    row.appendChild(img);
    row.appendChild(inp);
    row.appendChild(rm);
    list.appendChild(row);
  });
}
function openCapModal(title, sub) {
  $("capTitle").textContent = title;
  $("capSub").textContent = sub;
  renderCapList();
  $("capConfirm").textContent =
    capMode === "edit" ? "Save changes" : "Add to article";
  $("capDelete").style.display =
    capMode === "edit" ? "inline-flex" : "none";
  $("capModal").classList.remove("hidden");
  const first = $("capList").querySelector(".cap-input");
  if (first) first.focus();
}
function closeCapModal() {
  $("capModal").classList.add("hidden");
  capEntries.forEach((en) => {
    if (en.objUrl) URL.revokeObjectURL(en.objUrl);
  });
  capEntries = [];
  capEditTarget = null;
}
$("capCancel").addEventListener("click", closeCapModal);
$("capModal").addEventListener("mousedown", (e) => {
  if (e.target === $("capModal")) closeCapModal();
});
$("capDelete").addEventListener("click", () => {
  if (capEditTarget) capEditTarget.remove();
  toast("Carousel deleted");
  closeCapModal();
});

$("capConfirm").addEventListener("click", async () => {
  syncCaps();
  // edit mode — apply captions, drop removed photos, no upload
  if (capMode === "edit") {
    const keep = new Set(capEntries.map((en) => en.imgEl));
    [...capEditTarget.querySelectorAll("img")].forEach((im) => {
      if (!keep.has(im)) im.remove();
    });
    capEntries.forEach((en) => {
      const c = en.caption || "";
      if (c) {
        en.imgEl.setAttribute("data-caption", c);
        en.imgEl.alt = c;
      } else {
        en.imgEl.removeAttribute("data-caption");
        en.imgEl.alt = "";
      }
    });
    if (!capEditTarget.querySelector("img")) capEditTarget.remove(); // emptied → drop it
    toast("Carousel updated ✓");
    closeCapModal();
    return;
  }
  // new mode — upload remaining photos, insert one carousel
  const entries = capEntries.slice();
  if (!entries.length) {
    closeCapModal();
    return;
  }
  const old = $("capConfirm").textContent;
  $("capConfirm").disabled = true;
  $("capDelete").disabled = true;
  try {
    const items = [];
    for (let i = 0; i < entries.length; i++) {
      $("capConfirm").textContent =
        "Uploading " + (i + 1) + " of " + entries.length + "…";
      const { url, dataUrl } = await uploadImage(entries[i].file);
      items.push({ url, dataUrl, caption: entries[i].caption || "" });
    }
    insertCarousel(items);
    toast("Carousel added ✓ (" + items.length + " photos)");
    closeCapModal();
  } catch (err) {
    toast(err.message || "Upload failed", true);
  } finally {
    $("capConfirm").disabled = false;
    $("capDelete").disabled = false;
    $("capConfirm").textContent = old;
  }
});

// floating "Remove" button for a single image OR a video embed
let imgRemoveTarget = null;
function showElRemove(el, label) {
  imgRemoveTarget = el;
  const b = $("imgRemove");
  b.textContent = "✕ Remove " + label;
  const r = el.getBoundingClientRect();
  b.style.top = r.top + 8 + "px";
  b.style.left = r.left + 8 + "px";
  b.classList.remove("hidden");
}
function hideImgRemove() {
  $("imgRemove").classList.add("hidden");
  imgRemoveTarget = null;
}
$("imgRemove").addEventListener("click", () => {
  if (imgRemoveTarget) imgRemoveTarget.remove();
  hideImgRemove();
});
window.addEventListener("scroll", hideImgRemove, true);

// video — paste a YouTube/Vimeo link, insert an embed block
$("videoBtn").addEventListener("mousedown", (e) => {
  e.preventDefault();
  const url = prompt("Paste a YouTube or Vimeo link:");
  if (!url) return;
  let embed = toEmbed(url.trim());
  if (!embed) {
    toast("Please paste a YouTube or Vimeo link", true);
    return;
  }
  if (
    confirm(
      "Play the video automatically when the page opens? (It will be muted.)",
    )
  ) {
    const sep = embed.includes("?") ? "&" : "?";
    embed +=
      sep +
      (embed.includes("youtube")
        ? "autoplay=1&mute=1&playsinline=1"
        : "autoplay=1&muted=1");
  }
  document.execCommand(
    "insertHTML",
    false,
    `<div class="article-embed" contenteditable="false" data-embed="${embed}"></div><p><br></p>`,
  );
  toast("Video added ✓");
});
function toEmbed(url) {
  let m;
  if (
    (m = url.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/,
    ))
  )
    return "https://www.youtube.com/embed/" + m[1];
  if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)))
    return "https://player.vimeo.com/video/" + m[1];
  if (
    /^https:\/\/(www\.youtube\.com\/embed\/|player\.vimeo\.com\/video\/)/.test(
      url,
    )
  )
    return url;
  return null;
}

// featured image
$("featRemove").addEventListener("click", () => {
  $("f-featimg").value = "";
  $("f-featfile").value = "";
  const prev = $("featPreview");
  prev.removeAttribute("src");
  prev.style.display = "none";
  $("featRemove").style.display = "none";
  toast("Featured image removed");
});
$("f-featfile").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  toast("Uploading image…");
  try {
    const { url, dataUrl } = await uploadImage(f);
    $("f-featimg").value = url;
    const prev = $("featPreview");
    prev.src = dataUrl;
    prev.style.display = "block";
    $("featRemove").style.display = "inline-flex";
    toast("Image uploaded ✓");
  } catch (err) {
    toast(err.message || "Upload failed", true);
  }
  e.target.value = "";
});

// resize + compress client-side, then upload
async function uploadImage(file) {
  const dataUrl = await resizeImage(file, 1400, 0.82);
  // extension must match what the canvas actually produced (webp, or jpeg fallback)
  const ext = dataUrl.startsWith("data:image/webp") ? ".webp" : ".jpg";
  const filename = (file.name.replace(/\.[^.]+$/, "") || "image") + ext;
  const r = await fetch(fn("upload"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, dataBase64: dataUrl }),
  });
  if (r.status === 401) {
    showLogin();
    throw new Error("Please sign in again");
  }
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Upload failed");
  return { url: d.url, dataUrl };
}
function resizeImage(file, maxW, quality) {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth,
        h = img.naturalHeight;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      // Some browsers (e.g. older Safari) can't encode WebP from a canvas and
      // silently return a PNG — which ignores `quality` and stays large. Detect
      // that and fall back to JPEG so the image is always actually compressed.
      let out = c.toDataURL("image/webp", quality);
      if (!out.startsWith("data:image/webp"))
        out = c.toDataURL("image/jpeg", quality);
      res(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error("Could not read image"));
    };
    img.src = url;
  });
}

// save
$("saveBtn").addEventListener("click", async () => {
  const title = $("f-title").value.trim();
  if (!title) {
    toast("Please add a title", true);
    return;
  }
  const post = {
    id: editingId || undefined,
    title,
    excerpt: $("f-excerpt").value.trim(),
    body: cleanHtml($("f-body").innerHTML),
    category: $("f-category").value,
    date: $("f-date").value,
    author: $("f-author").value.trim(),
    featuredImage: $("f-featimg").value.trim(),
    status: $("f-status").value,
  };
  $("saveBtn").disabled = true;
  $("saveBtn").textContent = "Saving…";
  try {
    const r = await fetch(fn("save"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post }),
    });
    if (r.status === 401) {
      showLogin();
      throw new Error("Please sign in again");
    }
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Save failed");
    toast("Saved ✓ The site will update shortly.");
    await refresh();
    $("editView").classList.add("hidden");
    $("listView").classList.remove("hidden");
  } catch (err) {
    toast(err.message || "Save failed", true);
  } finally {
    $("saveBtn").disabled = false;
    $("saveBtn").textContent = "Save";
  }
});

// delete
$("deleteBtn").addEventListener("click", async () => {
  if (!editingId) return;
  if (!confirm("Delete this post? This cannot be undone.")) return;
  try {
    const r = await fetch(fn("save"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: editingId }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Delete failed");
    toast("Post deleted");
    await refresh();
    $("editView").classList.add("hidden");
    $("listView").classList.remove("hidden");
  } catch (err) {
    toast(err.message || "Delete failed", true);
  }
});

async function refresh() {
  const r = await fetch(fn("list"));
  if (r.ok) {
    posts = (await r.json()).posts || [];
    renderList();
  }
}

// light cleanup of editor HTML
function cleanHtml(html) {
  const d = document.createElement("div");
  d.innerHTML = html;
  // images carry their instant-preview data in src and the real /images path in
  // data-url — write the real path back so the saved post stays small & correct.
  d.querySelectorAll("img[data-url]").forEach((im) => {
    im.setAttribute("src", im.getAttribute("data-url"));
    im.removeAttribute("data-url");
  });
  d.querySelectorAll("[style]").forEach((e) =>
    e.removeAttribute("style"),
  );
  d.querySelectorAll("[contenteditable]").forEach((e) =>
    e.removeAttribute("contenteditable"),
  );
  d.querySelectorAll("font").forEach((e) => {
    const s = document.createElement("span");
    s.innerHTML = e.innerHTML;
    e.replaceWith(s);
  });
  d.querySelectorAll("b").forEach((e) => {
    const s = document.createElement("strong");
    s.innerHTML = e.innerHTML;
    e.replaceWith(s);
  });
  d.querySelectorAll("i").forEach((e) => {
    const s = document.createElement("em");
    s.innerHTML = e.innerHTML;
    e.replaceWith(s);
  });
  return d.innerHTML
    .replace(/<div>/g, "<p>")
    .replace(/<\/div>/g, "</p>")
    .trim();
}

checkAuth();
