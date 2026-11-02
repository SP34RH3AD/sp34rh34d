(() => {
  "use strict";

  const CFG = window.SITE_CONFIG;
  const API = "https://api.github.com";
  const CACHE_TTL = 10 * 60 * 1000;

  const LANG_COLORS = {
    Python: "#3572A5", Go: "#00ADD8", JavaScript: "#f1e05a", TypeScript: "#3178c6",
    Shell: "#89e051", PowerShell: "#012456", C: "#555555", "C++": "#f34b7d",
    "C#": "#178600", Rust: "#dea584", Ruby: "#701516", PHP: "#4F5D95",
    Java: "#b07219", HTML: "#e34c26", CSS: "#563d7c", Nim: "#ffc200", Perl: "#0298c3"
  };

  const state = {
    repos: null,
    user: null,
    posts: null,
    repoFilter: { q: "", sort: "updated", forks: false, lang: null },
    postTag: null
  };

  // ---------- helpers ----------
  const $ = (sel) => document.querySelector(sel);

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

  const fmtDate = (d) => new Date(d).toLocaleDateString("en", { year: "numeric", month: "short", day: "2-digit" });

  function cacheGet(key) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const { t, v } = JSON.parse(raw);
      return Date.now() - t < CACHE_TTL ? v : null;
    } catch { return null; }
  }

  function cacheSet(key, v) {
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch { /* no storage */ }
  }

  async function getJSON(url, cacheKey) {
    if (cacheKey) {
      const hit = cacheGet(cacheKey);
      if (hit) return hit;
    }
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    if (cacheKey) cacheSet(cacheKey, data);
    return data;
  }

  // ---------- data ----------
  async function loadRepos() {
    if (state.repos) return state.repos;
    const all = [];
    for (let page = 1; page <= 5; page++) {
      const batch = await getJSON(
        `${API}/users/${encodeURIComponent(CFG.githubUser)}/repos?per_page=100&page=${page}&sort=updated`,
        `repos:${CFG.githubUser}:${page}`
      );
      all.push(...batch);
      if (batch.length < 100) break;
    }
    state.repos = all.filter((r) => !CFG.hideRepos.includes(r.name));
    return state.repos;
  }

  async function loadUser() {
    if (state.user) return state.user;
    state.user = await getJSON(`${API}/users/${encodeURIComponent(CFG.githubUser)}`, `user:${CFG.githubUser}`);
    return state.user;
  }

  async function loadPosts() {
    if (state.posts) return state.posts;
    const res = await fetch(CFG.postsIndex, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Could not load ${CFG.postsIndex}`);
    const posts = await res.json();
    state.posts = posts
      .filter((p) => !p.draft)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return state.posts;
  }

  const postsForRepo = (name) => (state.posts || []).filter((p) => p.repo && p.repo.toLowerCase() === name.toLowerCase());

  // ---------- render: shared ----------
  function repoCard(r) {
    const related = postsForRepo(r.name);
    const topics = (r.topics || []).slice(0, 5).map((t) => `<span class="topic">${esc(t)}</span>`).join("");
    const lang = r.language
      ? `<span><span class="lang-dot" style="background:${LANG_COLORS[r.language] || "var(--red)"}"></span>${esc(r.language)}</span>`
      : "";
    const relatedHtml = related.length
      ? `<div class="related">${related.map((p) => `<a href="#/posts/${encodeURIComponent(p.slug)}">&gt; post: ${esc(p.title)}</a>`).join("<br>")}</div>`
      : "";
    return `
      <div class="card">
        <h3><a href="${esc(r.html_url)}" target="_blank" rel="noopener">${esc(r.name)}</a>${r.fork ? '<span class="badge-fork">fork</span>' : ""}</h3>
        <p>${esc(r.description || "// no description")}</p>
        ${topics ? `<div class="topics">${topics}</div>` : ""}
        <div class="meta">
          ${lang}
          <span>★ ${r.stargazers_count}</span>
          <span>⑂ ${r.forks_count}</span>
          <span>upd ${fmtDate(r.pushed_at || r.updated_at)}</span>
        </div>
        ${relatedHtml}
      </div>`;
  }

  function postItem(p) {
    const tags = (p.tags || []).map((t) => `#${esc(t)}`).join(" ");
    return `
      <a class="post-item" href="#/posts/${encodeURIComponent(p.slug)}">
        <h3>${esc(p.title)}</h3>
        <div class="post-meta">
          <span>${fmtDate(p.date)}</span>
          ${p.repo ? `<span class="repo-ref">repo: ${esc(p.repo)}</span>` : ""}
          ${tags ? `<span>${tags}</span>` : ""}
        </div>
        ${p.summary ? `<p>${esc(p.summary)}</p>` : ""}
      </a>`;
  }

  // ---------- views ----------
  let termTimer = null;

  async function renderHome() {
    const posts = await loadPosts().catch(() => []);
    $("#stat-posts").textContent = posts.length;
    $("#home-posts").innerHTML = posts.length
      ? posts.slice(0, 3).map(postItem).join("")
      : '<p class="status">// no posts yet</p>';

    let repos = [];
    try {
      repos = await loadRepos();
      $("#stat-repos").textContent = repos.filter((r) => !r.fork).length;
      $("#stat-stars").textContent = repos.reduce((n, r) => n + r.stargazers_count, 0);
    } catch {
      $("#stat-repos").textContent = "?";
      $("#stat-stars").textContent = "?";
    }
    typeTerminal(repos);
  }

  function typeTerminal(repos) {
    clearTimeout(termTimer);
    const out = $("#term-out");
    const recent = repos.filter((r) => !r.fork).slice(0, 6).map((r) => r.name).join("  ") || "(GitHub API rate limit hit, try again later)";
    const lines = CFG.terminal.map((l) => ({ cmd: l.cmd, out: l.out.replace("__REPOS__", recent) }));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prompt = '<span class="prompt">sp34rh34d@netrunner:~$ </span>';
    let html = "";

    if (reduce) {
      out.innerHTML = lines.map((l) => `${prompt}${esc(l.cmd)}\n<span class="out">${esc(l.out)}</span>\n`).join("") + prompt + '<span class="cursor"></span>';
      return;
    }

    let li = 0, ci = 0;
    const tick = () => {
      if (li >= lines.length) {
        out.innerHTML = html + prompt + '<span class="cursor"></span>';
        return;
      }
      const line = lines[li];
      if (ci < line.cmd.length) {
        ci++;
        out.innerHTML = html + prompt + esc(line.cmd.slice(0, ci)) + '<span class="cursor"></span>';
        termTimer = setTimeout(tick, 55 + Math.random() * 60);
      } else {
        html += `${prompt}${esc(line.cmd)}\n<span class="out">${esc(line.out)}</span>\n`;
        out.innerHTML = html;
        li++; ci = 0;
        termTimer = setTimeout(tick, 450);
      }
    };
    tick();
  }

  async function renderRepos() {
    const grid = $("#repo-grid");
    const status = $("#repo-status");
    status.className = "status";

    if (!state.repos) {
      grid.innerHTML = "";
      status.textContent = "// jacking in to github.com ...";
    }
    try {
      await Promise.all([loadRepos(), loadPosts().catch(() => [])]);
    } catch (e) {
      status.className = "status error";
      status.textContent = e.status === 403
        ? "// GitHub API rate limit reached. Try again in a few minutes."
        : `// failed to load repos: ${e.message}`;
      return;
    }
    renderLangChips();
    renderRepoGrid();
  }

  function renderLangChips() {
    const langs = [...new Set(state.repos.map((r) => r.language).filter(Boolean))].sort();
    const f = state.repoFilter;
    $("#repo-langs").innerHTML =
      `<button class="chip ${f.lang ? "" : "active"}" data-lang="">all</button>` +
      langs.map((l) => `<button class="chip ${f.lang === l ? "active" : ""}" data-lang="${esc(l)}">${esc(l)}</button>`).join("");
  }

  function renderRepoGrid() {
    const f = state.repoFilter;
    const q = f.q.trim().toLowerCase();
    let list = state.repos.filter((r) =>
      (f.forks || !r.fork) &&
      (!f.lang || r.language === f.lang) &&
      (!q || [r.name, r.description, ...(r.topics || [])].join(" ").toLowerCase().includes(q))
    );
    const sorters = {
      updated: (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at),
      stars: (a, b) => b.stargazers_count - a.stargazers_count,
      name: (a, b) => a.name.localeCompare(b.name)
    };
    list = list.sort(sorters[f.sort]);
    $("#repo-grid").innerHTML = list.map(repoCard).join("");
    $("#repo-status").textContent = list.length ? `// ${list.length} result(s)` : "// 0 results. no matching repos.";
  }

  async function renderPosts() {
    let posts;
    try {
      posts = await loadPosts();
    } catch (e) {
      $("#post-list").innerHTML = `<p class="status error">// ${esc(e.message)}</p>`;
      return;
    }
    const tags = [...new Set(posts.flatMap((p) => p.tags || []))].sort();
    $("#post-tags").innerHTML = tags.length
      ? `<button class="chip ${state.postTag ? "" : "active"}" data-tag="">all</button>` +
        tags.map((t) => `<button class="chip ${state.postTag === t ? "active" : ""}" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")
      : "";
    const list = state.postTag ? posts.filter((p) => (p.tags || []).includes(state.postTag)) : posts;
    $("#post-list").innerHTML = list.length ? list.map(postItem).join("") : '<p class="status">// no posts yet</p>';
  }

  async function renderPost(slug) {
    const art = $("#post-article");
    art.innerHTML = '<p class="status">// decrypting ...</p>';

    const posts = await loadPosts().catch(() => []);
    const meta = posts.find((p) => p.slug === slug);
    if (!meta) {
      art.innerHTML = '<p class="status error">// 404: post not found</p>';
      return;
    }
    document.title = `${meta.title} // ${CFG.githubUser}`;

    let md = "";
    try {
      const res = await fetch(`posts/${encodeURIComponent(slug)}.md`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      md = await res.text();
    } catch (e) {
      art.innerHTML = `<p class="status error">// failed to load post: ${esc(e.message)}</p>`;
      return;
    }

    const bodyHtml = DOMPurify.sanitize(marked.parse(md), {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["target", "allow", "allowfullscreen", "loading", "frameborder", "referrerpolicy"],
    });
    const tags = (meta.tags || []).map((t) => `#${esc(t)}`).join(" ");

    art.innerHTML = `
      <h1>${esc(meta.title)}</h1>
      <div class="post-meta">
        <span>${fmtDate(meta.date)}</span>
        ${tags ? `<span>${tags}</span>` : ""}
      </div>
      <div class="post-repo-card" id="post-repo"></div>
      <div class="post-body">${bodyHtml}</div>`;

    art.querySelectorAll(".post-body a[href^='http']").forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener";
    });

    if (meta.repo) {
      const slot = $("#post-repo");
      try {
        const repos = await loadRepos();
        const repo = repos.find((r) => r.name.toLowerCase() === meta.repo.toLowerCase());
        slot.innerHTML = repo
          ? repoCard(repo)
          : `<div class="card"><h3><a href="https://github.com/${esc(CFG.githubUser)}/${esc(meta.repo)}" target="_blank" rel="noopener">${esc(meta.repo)}</a></h3></div>`;
      } catch {
        slot.innerHTML = `<div class="card"><h3><a href="https://github.com/${esc(CFG.githubUser)}/${esc(meta.repo)}" target="_blank" rel="noopener">${esc(meta.repo)}</a></h3><p>// repo data unavailable</p></div>`;
      }
    }
  }

  async function renderAbout() {
    const box = $("#about-box");
    box.innerHTML = '<p class="status">// querying ...</p>';
    try {
      const u = await loadUser();
      const rows = [
        ["user", `<a href="${esc(u.html_url)}" target="_blank" rel="noopener">${esc(u.login)}</a>`],
        u.name && ["name", esc(u.name)],
        u.bio && ["bio", esc(u.bio)],
        u.company && ["org", esc(u.company)],
        u.location && ["loc", esc(u.location)],
        u.blog && ["web", `<a href="${esc(/^https?:/.test(u.blog) ? u.blog : "https://" + u.blog)}" target="_blank" rel="noopener">${esc(u.blog)}</a>`],
        ["repos", u.public_repos],
        ["followers", u.followers],
        ["since", fmtDate(u.created_at)]
      ].filter(Boolean);
      box.innerHTML = `
        <img src="${esc(u.avatar_url)}" alt="avatar of ${esc(u.login)}">
        <dl>${rows.map(([k, v]) => `<dt>${k}:</dt><dd>${v}</dd>`).join("")}</dl>`;
    } catch (e) {
      box.innerHTML = `<p class="status error">// error: ${esc(e.message)}</p>`;
    }
  }

  // ---------- router ----------
  function route() {
    const parts = (location.hash.replace(/^#\/?/, "") || "home").split("/");
    let view = parts[0];
    const arg = parts[1] ? decodeURIComponent(parts[1]) : null;

    if (view === "posts" && arg) view = "post";
    if (!["home", "repos", "posts", "post", "about"].includes(view)) view = "home";

    document.querySelectorAll(".view").forEach((v) => { v.hidden = v.dataset.view !== view; });
    const activeTab = view === "post" ? "posts" : view;
    document.querySelectorAll(".tab").forEach((t) => {
      const on = t.dataset.tab === activeTab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on);
    });

    if (view !== "post") document.title = `${CFG.githubUser} // terminal`;
    if (view !== "home") clearTimeout(termTimer);
    window.scrollTo(0, 0);

    ({
      home: renderHome,
      repos: renderRepos,
      posts: renderPosts,
      post: () => renderPost(arg),
      about: renderAbout
    })[view]();
  }

  // ---------- events ----------
  $("#repo-search").addEventListener("input", (e) => { state.repoFilter.q = e.target.value; if (state.repos) renderRepoGrid(); });
  $("#repo-sort").addEventListener("change", (e) => { state.repoFilter.sort = e.target.value; if (state.repos) renderRepoGrid(); });
  $("#repo-forks").addEventListener("change", (e) => { state.repoFilter.forks = e.target.checked; if (state.repos) renderRepoGrid(); });
  $("#repo-langs").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    state.repoFilter.lang = b.dataset.lang || null;
    renderLangChips();
    renderRepoGrid();
  });
  $("#post-tags").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    state.postTag = b.dataset.tag || null;
    renderPosts();
  });

  window.addEventListener("hashchange", route);
  route();
})();
