/* Globe AI Studio mockup: hash-routed single page app, no dependencies.
   Everything is simulated in the browser; nothing is sent anywhere. */

(function () {
  const D = window.GMS_DATA;
  const NEO = window.GMS_NEO;
  const app = document.getElementById("app");
  const STORE_KEY = "gms-state-v1";

  // ---------- state ----------
  let state = load() || { user: null, agents: [], draft: null };
  let otp = null; // { email, code, merchant } kept in memory only
  let timers = [];

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: demo still works in-memory */ }
  }
  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  // ---------- utils ----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const go = (hash) => { location.hash = hash; };
  const industry = (id) => D.industries.find((i) => i.id === id);
  const slugify = (x) => String(x).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const chIcon = { voice: "📞", chat: "💬", flow: "🧩" };
  const chName = { voice: "Voice", chat: "Chat", flow: "Agentic flow" };
  const ctxFor = (spec) => ({ merchant: state.user ? state.user.merchant : "Your Business", persona: spec.persona || "Joy", industryId: state.user && state.user.industry });
  const fill = (s, spec) => NEO.fill(s, ctxFor(spec));

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let s = seed || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

  function channelBadges(spec) {
    let b = `<span class="badge badge-${spec.channel}">${chIcon[spec.channel]} ${chName[spec.channel]}</span>`;
    if (spec.direction) b += ` <span class="badge badge-gray">${spec.direction === "inbound" ? "↙ Inbound" : "↗ Outbound"}</span>`;
    return b;
  }

  function highlight(json) {
    return esc(json).replace(/(&quot;(?:\\.|[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, (m, str, colon, bool, num) => {
      if (str) return colon ? `<span class="k">${str}</span>${colon}` : `<span class="s">${str}</span>`;
      if (bool) return `<span class="b">${bool}</span>`;
      return `<span class="n">${num}</span>`;
    });
  }

  function download(filename, text, type) {
    const blob = new Blob([text], { type: type || "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function toast(html, ms) {
    let wrap = $(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = html;
    wrap.appendChild(t);
    if (ms) setTimeout(() => t.remove(), ms);
    return t;
  }

  // Official Globe logo (from globe.com.ph); white version for dark backgrounds.
  const logo = (dark) => `<div class="logo${dark ? " on-dark" : ""}"><img class="logo-img" src="assets/globe-logo-${dark ? "white" : "blue"}.png" alt="Globe"><div class="logo-text">AI Studio<small>for Business</small></div></div>`;
  const PHONE_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8z"/></svg>`;
  const waveBars = (n) => Array.from({ length: n }, (_, i) => `<i style="animation-delay:${(i * 0.09) % 1.2}s"></i>`).join("");

  // ---------- shell ----------
  function shell(active, body) {
    const u = state.user;
    const initials = u.merchant.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return `
      <header class="topbar"><div class="topbar-inner">
        <a href="#/build">${logo()}</a>
        <nav class="nav">
          <a href="#/build" class="${active === "build" ? "active" : ""}">Build</a>
          <a href="#/services" class="${active === "services" ? "active" : ""}">My Services${state.agents.length ? `<span class="count">${state.agents.length}</span>` : ""}</a>
        </nav>
        <div class="topbar-right">
          <span class="mock-pill" title="All data and actions are simulated">Mockup</span>
          <div class="merchant-chip" id="chip">
            <div class="avatar">${esc(initials)}</div>
            <div class="who"><b>${esc(u.merchant)}</b><span class="muted">${esc(industry(u.industry).name)}</span></div>
            <div class="menu hidden" id="menu">
              <div class="small muted" style="padding:8px 12px">${esc(u.email)}</div>
              <div class="sep"></div>
              <button data-act="industry">Change industry</button>
              <button data-act="reset">Reset demo data</button>
              <button data-act="logout">Sign out</button>
            </div>
          </div>
        </div>
      </div></header>
      <main>${body}</main>
      <footer class="footer"><div class="footer-inner"><img src="assets/globe-logo-white.png" alt="Globe"><span>Mockup for discussion only. No real email, NEO, or telephony calls are made.</span><span>Powered by <b>NEO</b> · OneByZero</span></div></footer>`;
  }

  function bindShell() {
    const chip = $("#chip"), menu = $("#menu");
    if (!chip) return;
    chip.addEventListener("click", (e) => { e.stopPropagation(); menu.classList.toggle("hidden"); });
    document.addEventListener("click", () => menu.classList.add("hidden"), { once: true });
    menu.addEventListener("click", (e) => {
      const act = e.target.dataset.act;
      if (act === "logout") { state.user = null; state.draft = null; save(); go("#/login"); }
      if (act === "reset") { if (confirm("Remove all demo services and sign out?")) { state = { user: null, agents: [], draft: null }; save(); go("#/login"); } }
      if (act === "industry") go("#/onboard");
    });
  }

  // ---------- login ----------
  function viewLogin() {
    app.innerHTML = `
      <div class="auth">
        <section class="auth-hero">
          <span class="shape pill-y" style="width:280px;height:120px;top:0;right:0"></span>
          <span class="shape circle-m" style="width:72px;height:72px;top:150px;right:28px"></span>
          <span class="shape pill-t" style="width:300px;height:110px;bottom:0;left:0"></span>
          <span class="shape ring" style="width:220px;height:110px;bottom:0;right:60px"></span>
          ${logo(true)}
          <h1>Launch AI voice agents for your business <span>in minutes.</span></h1>
          <p class="lead">Pick a ready-made template for your industry, or describe what you need. Your agent runs on Globe's network, powered by NEO.</p>
          <div class="auth-points">
            <div class="auth-point"><span class="ic">📞</span><div><b>Voice-first.</b> Outbound campaigns and inbound hotlines on Globe telephony.</div></div>
            <div class="auth-point"><span class="ic">🧩</span><div><b>Templates for your industry.</b> Top use cases, ready to customize.</div></div>
            <div class="auth-point"><span class="ic">✨</span><div><b>Describe it, we build it.</b> Turn a prompt into a working agent.</div></div>
          </div>
          <div class="wave">${waveBars(48)}</div>
          <div class="powered">Powered by NEO · OneByZero</div>
        </section>
        <section class="auth-form"><div class="auth-box" id="authbox"></div></section>
      </div>`;
    otp ? renderVerify() : renderEmail();
  }

  function renderEmail(prefill, err) {
    const box = $("#authbox");
    box.innerHTML = `
      <h2>Sign in or register</h2>
      <p class="sub">Use your business email. We'll send a one-time code to verify your domain.</p>
      <form id="emailForm" novalidate>
        <label class="field"><span>Work email</span>
          <input class="input" id="email" type="email" placeholder="you@neofoodresto.com.ph" autocomplete="off" value="${esc(prefill || "")}" autofocus>
          ${err ? `<div class="error">${esc(err)}</div>` : `<div class="hint">Try <a href="#" id="demoEmail">ops@neofoodresto.com.ph</a>, or any business domain.</div>`}
        </label>
        <button class="btn btn-primary btn-lg" style="width:100%">Send verification code</button>
      </form>
      <p class="auth-foot">New domains are registered automatically on first sign-in. Globe Business accounts only.</p>`;
    const demo = $("#demoEmail");
    if (demo) demo.onclick = (e) => { e.preventDefault(); $("#email").value = "ops@neofoodresto.com.ph"; $("#email").focus(); };
    $("#emailForm").onsubmit = (e) => {
      e.preventDefault();
      const email = $("#email").value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return renderEmail(email, "Enter a valid email address.");
      const domain = email.split("@")[1];
      if (D.freeDomains.includes(domain)) return renderEmail(email, `Please use your business email. Personal domains like ${domain} can't be verified.`);
      const code = String(Math.floor(100000 + Math.random() * 900000));
      otp = { email, code, merchant: D.detectMerchant(email) };
      sendCodeToast();
      renderVerify();
    };
  }

  function sendCodeToast() {
    $$(".toast").forEach((t) => t.remove());
    const t = toast(`
      <div class="t-head"><span>📧 Demo inbox (simulated)</span><span>now</span></div>
      <div class="t-title">Your Globe AI Studio sign-in code</div>
      <div class="small muted">To: ${esc(otp.email)}</div>
      <div class="code">${otp.code}</div>
      <button class="btn btn-ghost btn-sm" id="useCode">Use this code</button>`);
    $("#useCode", t).onclick = () => { const i = $("#otp"); if (i) { i.value = otp.code; i.dispatchEvent(new Event("input")); } t.remove(); };
  }

  function renderVerify(err) {
    const box = $("#authbox");
    box.innerHTML = `
      <h2>Check your email</h2>
      <p class="sub">We sent a 6-digit code to <b>${esc(otp.email)}</b>.</p>
      <form id="otpForm" novalidate>
        <label class="field"><span>Verification code</span>
          <input class="input otp" id="otp" inputmode="numeric" maxlength="6" placeholder="••••••" autocomplete="one-time-code" autofocus>
          ${err ? `<div class="error">${esc(err)}</div>` : ""}
        </label>
        <button class="btn btn-primary btn-lg" style="width:100%">Verify & continue</button>
      </form>
      <p class="auth-foot"><a href="#" id="resend">Resend code</a> · <a href="#" id="changeEmail">Use a different email</a></p>`;
    const input = $("#otp");
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 6);
      if (input.value.length === 6) setTimeout(() => $("#otpForm").requestSubmit(), 150);
    });
    $("#otpForm").onsubmit = (e) => {
      e.preventDefault();
      if (input.value !== otp.code) return renderVerify("That code doesn't match. Check the demo inbox and try again.");
      $$(".toast").forEach((t) => t.remove());
      const known = state.user && state.user.email === otp.email;
      if (!known) state.user = { email: otp.email, domain: otp.merchant.domain, merchant: otp.merchant.name, industry: otp.merchant.industry, detected: otp.merchant.detected };
      otp = null;
      save();
      go(state.user.industry && known ? "#/build" : "#/onboard");
    };
    $("#resend").onclick = (e) => { e.preventDefault(); otp.code = String(Math.floor(100000 + Math.random() * 900000)); sendCodeToast(); };
    $("#changeEmail").onclick = (e) => { e.preventDefault(); const em = otp.email; otp = null; $$(".toast").forEach((t) => t.remove()); renderEmail(em); };
  }

  // ---------- onboarding ----------
  function viewOnboard() {
    const u = state.user;
    let selected = u.industry;
    app.innerHTML = shell("", `
      <div class="onboard">
        <h1 style="font-size:28px">Welcome to Globe AI Studio 👋</h1>
        <p class="muted" style="margin:6px 0 24px">Let's confirm a few details so we can show templates for your industry.</p>
        ${u.detected ? `<div class="detected"><span class="big">✅</span><div><b>Domain verified: ${esc(u.domain)}</b><div class="small muted">We matched this to <b>${esc(u.merchant)}</b> in <b>${esc(industry(u.industry).name)}</b>. Change it below if that's wrong.</div></div></div>`
          : `<div class="detected" style="background:var(--sky-50);border-color:#bfe0f3"><span class="big">🔎</span><div><b>Domain verified: ${esc(u.domain)}</b><div class="small muted">We couldn't tell your industry from the domain. Please pick one below.</div></div></div>`}
        <div class="card card-pad">
          <label class="field"><span>Business name</span><input class="input" id="bizName" value="${esc(u.merchant)}"></label>
          <div class="field"><span>Industry</span>
            <div class="ind-grid" id="indGrid">
              ${D.industries.map((i) => `<button class="ind ${i.id === selected ? "selected" : ""}" data-id="${i.id}" ${i.live ? "" : "disabled"}><span class="emoji">${i.icon}</span><b>${i.name}</b><small>${i.live ? "10 templates" : "Coming soon"}</small></button>`).join("")}
            </div>
          </div>
          <div class="actions" style="margin-top:0"><button class="btn btn-primary btn-lg" id="cont" ${selected ? "" : "disabled"}>Continue →</button></div>
        </div>
      </div>`);
    bindShell();
    $("#indGrid").onclick = (e) => {
      const b = e.target.closest(".ind");
      if (!b || b.disabled) return;
      selected = b.dataset.id;
      $$(".ind").forEach((x) => x.classList.toggle("selected", x === b));
      $("#cont").disabled = false;
    };
    $("#cont").onclick = () => {
      u.merchant = $("#bizName").value.trim() || u.merchant;
      u.industry = selected;
      save();
      go("#/build");
    };
  }

  // ---------- build (home) ----------
  let homeFilter = { channel: "all", industry: null, mode: "auto" };

  function viewBuild() {
    const u = state.user;
    const ind = homeFilter.industry || u.industry;
    app.innerHTML = shell("build", `
      <div class="page">
        <div class="page-head">
          <div><h1>${industry(ind).icon} Top use cases for ${esc(industry(ind).name)}</h1>
          <p class="muted" style="margin:6px 0 0">Ready-made agents for ${esc(u.merchant)}. Pick one, adjust it, and deploy to NEO.</p></div>
          <div class="controls" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <div class="seg" id="chFilter" style="background:#fff;border:1px solid var(--line)">
              ${["all", "voice", "chat", "flow"].map((c) => `<button data-c="${c}" class="${homeFilter.channel === c ? "on" : ""}">${c === "all" ? "All" : chName[c]}</button>`).join("")}
            </div>
            <select class="select-sm" id="indSel">
              ${D.industries.filter((i) => i.live).map((i) => `<option value="${i.id}" ${i.id === ind ? "selected" : ""}>${i.name}${i.id === u.industry ? " (yours)" : ""}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="tpl-grid">${templateCards(ind)}</div>
        <a class="build-else" href="#/create">
          <span class="be-ic">✨</span>
          <span><b>Want to build something else?</b> <span class="muted">Describe it in your own words.</span></span>
          <span class="be-cta">Click here →</span>
        </a>
      </div>`);
    bindShell();
    $("#chFilter").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; homeFilter.channel = b.dataset.c; viewBuild(); };
    $("#indSel").onchange = (e) => { homeFilter.industry = e.target.value; viewBuild(); };
    $$(".tpl").forEach((t) => (t.onclick = () => useTemplate(t.dataset.ind, t.dataset.id)));
  }

  // ---------- create from prompt ----------
  function viewCreate() {
    const u = state.user;
    app.innerHTML = shell("build", `
      <div class="page">
        <div class="crumbs"><a href="#/build">Build</a> › Create something else</div>
        <section class="hero" style="margin-top:12px">
          <span class="shape pill-y" style="width:220px;height:84px;top:0;right:0;opacity:.95"></span>
          <span class="shape circle-m" style="width:64px;height:64px;top:96px;right:46px"></span>
          <span class="shape pill-t" style="width:240px;height:80px;bottom:0;left:0;opacity:.9"></span>
          <span class="shape circle-a" style="width:120px;height:120px;bottom:-50px;right:18%;opacity:.55"></span>
          <h1>What do you want to build today?</h1>
          <p class="sub">Describe it in plain words and we'll generate a NEO agent for ${esc(u.merchant)}.</p>
          <div class="prompt-box">
            <textarea id="prompt" placeholder="e.g. ${esc(D.examplePrompts[0])}">${esc(state.draftPrompt || "")}</textarea>
            <div class="prompt-bar">
              <div class="seg" id="mode">
                ${["auto", "voice", "chat", "flow"].map((m) => `<button data-m="${m}" class="${homeFilter.mode === m ? "on" : ""}">${m === "auto" ? "✨ Auto" : chIcon[m] + " " + chName[m]}</button>`).join("")}
              </div>
              <button class="btn btn-ai" id="genBtn">Generate agent →</button>
            </div>
          </div>
          <div class="chips">${D.examplePrompts.map((p) => `<button class="chip" data-p="${esc(p)}">${esc(p.length > 62 ? p.slice(0, 60) + "…" : p)}</button>`).join("")}</div>
        </section>
        <p class="muted small" style="text-align:center">Prefer a ready-made agent? <a href="#/build">Browse templates for ${esc(industry(u.industry).name)}</a></p>
      </div>`);
    bindShell();

    const prompt = $("#prompt");
    prompt.focus();
    $("#mode").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; homeFilter.mode = b.dataset.m; $$("#mode button").forEach((x) => x.classList.toggle("on", x === b)); };
    $$(".chip").forEach((c) => (c.onclick = () => { prompt.value = c.dataset.p; prompt.focus(); }));
    prompt.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) $("#genBtn").click(); });
    $("#genBtn").onclick = () => {
      const p = prompt.value.trim();
      if (p.length < 8) { prompt.focus(); prompt.placeholder = "Tell us a bit more about the agent you want…"; return; }
      state.draftPrompt = p;
      const { spec, reasons } = NEO.specFromPrompt(p, homeFilter.mode, u.industry);
      spec.persona = "Joy";
      spec.csvFields = D.csvFieldsFor(spec);
      state.draft = { spec, reasons, fresh: true };
      save();
      go("#/generate");
    };
  }

  function templateCards(ind) {
    const list = D.templates[ind].filter((t) => homeFilter.channel === "all" || t.channel === homeFilter.channel);
    return list.map((t) => `
      <button class="tpl" data-ch="${t.channel}" data-id="${t.id}" data-ind="${ind}">
        <div class="tpl-ic ic-${t.channel}">${chIcon[t.channel]}</div>
        <div class="row">${channelBadges(t)}${t.popular ? ` <span class="badge badge-warn">★ Popular</span>` : ""}</div>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.blurb)}</p>
        <span class="use">Use template →</span>
      </button>`).join("") || `<p class="muted">No templates for this filter.</p>`;
  }

  function specFromTemplate(ind, t) {
    const spec = JSON.parse(JSON.stringify(t));
    Object.assign(spec, { persona: "Joy", language: ind === "banking" && t.id === "bank-faq" ? "taglish" : "en", purpose: t.blurb, source: "template", templateId: t.id, industryId: ind });
    spec.csvFields = D.csvFieldsFor(spec);
    return spec;
  }

  function useTemplate(ind, id) {
    const spec = specFromTemplate(ind, D.templates[ind].find((x) => x.id === id));
    state.draft = { spec, reasons: null };
    save();
    go("#/configure");
  }

  // ---------- generate (prompt path) ----------
  function viewGenerate() {
    if (!state.draft) return go("#/build");
    const { spec, reasons } = state.draft;
    const steps = [
      ["Reading your request", `${spec.purpose.split(/\s+/).length} words`],
      ["Choosing channel & direction", `${chName[spec.channel]}${spec.direction ? " · " + spec.direction : ""}`],
      ["Matching against industry templates", spec.basedOn ? `closest: ${spec.basedOn}` : "no close match, building from scratch"],
      ["Drafting conversation steps & outcomes", `${spec.stages.length} steps · ${spec.metrics.length} outcome fields`],
      ["Writing NEO import JSON", spec.channel === "voice" ? "voice-agent-export" : spec.channel === "chat" ? "chatbot-export" : "flow-agent-export"],
    ];
    app.innerHTML = shell("build", `
      <div class="page">
        <div class="crumbs"><a href="#/build">Build</a> › <a href="#/create">Create something else</a> › Generate</div>
        <div class="page-head"><h1>✨ Generating your agent</h1></div>
        <div class="gen-prompt">“${esc(spec.purpose)}”</div>
        <div id="genArea">
          <div class="card card-pad" style="max-width:640px">
            <div class="steps">${steps.map((s, i) => `<div class="step" id="gs${i}"><span class="st"></span><div>${s[0]}<span class="log"></span></div></div>`).join("")}</div>
          </div>
        </div>
      </div>`);
    bindShell();

    const finish = () => renderGenerated();
    if (!state.draft.fresh) return finish();
    steps.forEach((s, i) => {
      later(() => { const el = $("#gs" + i); if (el) el.classList.add("active"); }, i * 650);
      later(() => { const el = $("#gs" + i); if (!el) return; el.classList.remove("active"); el.classList.add("done"); $(".st", el).textContent = "✓"; $(".log", el).textContent = s[1]; }, i * 650 + 600);
    });
    later(() => { state.draft.fresh = false; save(); finish(); }, steps.length * 650 + 350);
  }

  function renderGenerated() {
    const { spec, reasons } = state.draft;
    const exp = NEO.build(spec, ctxFor(spec));
    $(".page-head h1").textContent = "✨ Your agent is ready to import";
    $("#genArea").innerHTML = `
      <div class="grid-2">
        <div class="card card-pad">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
            <div class="tpl-ic ic-${spec.channel}" style="margin:0">${chIcon[spec.channel]}</div>
            <div><h2 style="font-size:20px">${esc(spec.name)}</h2><div style="margin-top:4px">${channelBadges(spec)}</div></div>
          </div>
          <div class="section-title">What we understood</div>
          <dl class="kv">${reasons.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
          <div class="section-title">Conversation steps</div>
          <div class="stage-list">${spec.stages.map((s, i) => `<div class="stage"><span class="num">${i + 1}</span><span>${esc(s)}</span></div>`).join("")}</div>
          <div class="actions">
            <a class="btn btn-ghost" href="#/create">← Edit prompt</a>
            <a class="btn btn-ghost" href="#/configure">Customize</a>
            <button class="btn btn-primary" id="importBtn">Import into NEO →</button>
          </div>
        </div>
        <div class="sticky">${jsonCard(exp, "Generated automatically from your prompt. This is the file that gets imported into NEO.")}</div>
      </div>`;
    bindJsonCard(exp);
    $("#importBtn").onclick = () => startDeploy();
  }

  function jsonCard(exp, lead) {
    const text = JSON.stringify(exp.json, null, 2);
    const kb = (new Blob([text]).size / 1024).toFixed(1);
    return `
      <div class="card">
        <div class="json-head">
          <div><b style="font-size:14px">NEO import file</b> <span class="badge badge-gray">${exp.format}</span><div class="fname">${esc(exp.filename)} · ${kb} KB</div></div>
          <div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" data-json="copy">Copy</button><button class="btn btn-ghost btn-sm" data-json="dl">⬇ Download</button></div>
        </div>
        <div class="note"><span>ℹ️</span><span>${esc(lead || "")} The structure follows real NEO ${exp.format} files. Credentials and the workspace ID are placeholders${exp.format === "flow-agent-export" ? ", and component code is left out" : ""}. Not yet tested against a live NEO import.</span></div>
        <pre class="json">${highlight(text)}</pre>
      </div>`;
  }

  function bindJsonCard(exp) {
    const text = JSON.stringify(exp.json, null, 2);
    $$("[data-json]").forEach((b) => (b.onclick = () => {
      if (b.dataset.json === "dl") download(exp.filename, text);
      else { try { navigator.clipboard.writeText(text); b.textContent = "Copied ✓"; } catch (e) { b.textContent = "Copy failed"; } setTimeout(() => (b.textContent = "Copy"), 1500); }
    }));
  }

  // ---------- configure (template path + customize) ----------
  function viewConfigure() {
    if (!state.draft) return go("#/build");
    const spec = state.draft.spec;
    const tplName = spec.source === "template" ? spec.name : null;
    const isOutVoice = spec.channel === "voice" && spec.direction === "outbound";
    spec.callWindow = spec.callWindow || { from: "09:00", to: "18:00" };

    app.innerHTML = shell("build", `
      <div class="page">
        <div class="crumbs"><a href="#/build">Build</a> › ${tplName ? "Template: " + esc(tplName) : "Customize generated agent"}</div>
        <div class="page-head">
          <div><h1>Set up your ${chName[spec.channel].toLowerCase()} ${spec.channel === "flow" ? "" : "agent"}</h1><div style="margin-top:8px">${channelBadges(spec)}</div></div>
        </div>
        <div class="grid-2">
          <div class="card card-pad" id="form">
            <div class="section-title">Basics</div>
            <label class="field"><span>Service name</span><input class="input" data-f="name" value="${esc(spec.name)}"></label>
            <div class="row-2">
              <label class="field"><span>Agent persona name</span><input class="input" data-f="persona" value="${esc(spec.persona)}"></label>
              <label class="field"><span>Language</span><select class="select" data-f="language">
                ${Object.entries(NEO.LANGS).map(([k, l]) => `<option value="${k}" ${spec.language === k ? "selected" : ""}>${l.label}</option>`).join("")}
              </select></label>
            </div>
            <label class="field"><span>Goal / instructions</span><textarea class="textarea" data-f="purpose">${esc(spec.purpose)}</textarea></label>
            <label class="field"><span>${spec.channel === "voice" ? "Opening line" : "Welcome message"}</span><textarea class="textarea" data-f="greeting" style="min-height:64px">${esc(spec.greeting)}</textarea>
              <div class="hint">Use {persona} and {merchant} as placeholders.</div></label>

            <div class="section-title">Conversation steps</div>
            <div class="stage-list" id="stages"></div>
            <button class="btn btn-link small" id="addStage" style="margin-top:10px">+ Add step</button>

            <div class="section-title">Outcomes to track per ${spec.channel === "voice" ? "call" : "conversation"}</div>
            <div id="metrics">${spec.metrics.map((mt, i) => `<label class="check"><input type="checkbox" data-mi="${i}" ${mt.off ? "" : "checked"}><div><code>${esc(mt.name)}</code> <span class="badge badge-gray">${mt.type}</span><div class="small muted">${esc(mt.desc)}</div></div></label>`).join("")}</div>

            ${spec.tools ? `<div class="section-title">Tools the agent can use</div><div style="display:flex;gap:8px;flex-wrap:wrap">${spec.tools.map((t) => `<span class="badge badge-flow">🔧 ${esc(t)}</span>`).join("")}</div>` : ""}

            ${isOutVoice ? `
              <div class="section-title">Calling</div>
              <div class="row-2">
                <label class="field"><span>Call window from</span><input class="input" type="time" data-cw="from" value="${spec.callWindow.from}"></label>
                <label class="field"><span>to</span><input class="input" type="time" data-cw="to" value="${spec.callWindow.to}"></label>
              </div>
              <div class="hint small muted" style="margin-top:-8px">Calls go out from a Globe caller ID. You can upload a customer list after deploying.</div>` : ""}
            ${spec.channel === "chat" ? `
              <div class="section-title">Where it appears</div>
              ${["Website widget", "Facebook Messenger", "Viber"].map((c, i) => `<label class="check"><input type="checkbox" ${i === 0 ? "checked" : ""}><div>${c}</div></label>`).join("")}` : ""}
            ${spec.channel === "voice" && spec.direction === "inbound" ? `<div class="section-title">Phone number</div><p class="small muted" style="margin:0">A Globe hotline number is assigned when you deploy.</p>` : ""}

            <div class="actions">
              <a class="btn btn-ghost" href="#/build">Cancel</a>
              <button class="btn btn-primary btn-lg" id="deployBtn">Deploy to NEO →</button>
            </div>
          </div>
          <div class="sticky">
            <div class="card">
              <div class="tabs" id="ptabs"><button data-t="preview" class="on">Preview</button><button data-t="json">NEO JSON</button></div>
              <div id="pane"></div>
            </div>
          </div>
        </div>
      </div>`);
    bindShell();

    let tab = "preview";
    const renderStages = () => {
      $("#stages").innerHTML = spec.stages.map((s, i) => `<div class="stage"><span class="num">${i + 1}</span><input class="input" data-si="${i}" value="${esc(s)}"><button class="icon-btn" data-del="${i}" title="Remove step">✕</button></div>`).join("");
    };
    const renderPane = () => {
      if (tab === "preview") {
        $("#pane").innerHTML = `<div class="transcript">${transcriptFor(spec).map(([who, text]) => msgHtml(who, fill(text, spec), spec)).join("")}</div>
          <div class="summary-box small muted">Sample ${spec.channel === "voice" ? "call" : "conversation"}. Your agent will adapt to what the customer actually says.</div>`;
      } else {
        const exp = NEO.build(activeSpec(spec), ctxFor(spec));
        $("#pane").innerHTML = jsonCard(exp, "Updates as you edit.").replace('<div class="card">', "<div>");
        bindJsonCard(exp);
      }
    };
    renderStages();
    renderPane();

    const form = $("#form");
    form.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.f) spec[t.dataset.f] = t.value;
      if (t.dataset.si) spec.stages[+t.dataset.si] = t.value;
      if (t.dataset.cw) spec.callWindow[t.dataset.cw] = t.value;
      if (t.dataset.mi) spec.metrics[+t.dataset.mi].off = !t.checked;
      save();
      clearTimeout(form._t);
      form._t = setTimeout(renderPane, 250);
    });
    $("#stages").addEventListener("click", (e) => {
      const d = e.target.dataset.del;
      if (d == null || spec.stages.length <= 2) return;
      spec.stages.splice(+d, 1); save(); renderStages(); renderPane();
    });
    $("#addStage").onclick = () => { spec.stages.splice(spec.stages.length - 1, 0, "New step"); save(); renderStages(); renderPane(); };
    $("#ptabs").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; tab = b.dataset.t; $$("#ptabs button").forEach((x) => x.classList.toggle("on", x === b)); renderPane(); };
    $("#deployBtn").onclick = () => {
      if (!spec.name.trim()) { $('[data-f="name"]').focus(); return; }
      startDeploy();
    };
  }

  const activeSpec = (spec) => ({ ...spec, metrics: spec.metrics.filter((m) => !m.off) });

  function transcriptFor(spec) {
    if (spec.transcript) return spec.transcript;
    const out = spec.channel === "voice" && spec.direction === "outbound";
    const t = [["agent", spec.greeting], ["customer", out ? "Yes, speaking." : "Hi, I need some help."]];
    if (spec.channel === "flow" && spec.tools && spec.tools[0]) t.push(["tool", `Called ${spec.tools[0].replace(/\s*\(MCP\)/, "")}`]);
    t.push(["agent", spec.pitch], ["customer", spec.reply]);
    if (spec.channel === "flow" && spec.tools && spec.tools[1]) t.push(["tool", `Called ${spec.tools[1].replace(/\s*\(MCP\)/, "")}`]);
    t.push(["agent", spec.channel === "voice" ? "Thank you! Have a great day. Goodbye!" : "Done! Anything else I can help with?"]);
    return t;
  }

  function msgHtml(who, text, spec) {
    if (who === "tool") return `<div class="msg tool">🔧 ${esc(text)}</div>`;
    const name = who === "agent" ? `${esc(spec.persona)} · AI` : "Customer";
    return `<div class="msg ${who}"><span class="who">${name}</span>${esc(text)}</div>`;
  }

  // ---------- deploy ----------
  function makeAgent(spec, opts) {
    opts = opts || {};
    spec.csvFields = spec.csvFields || D.csvFieldsFor(spec);
    const exp = NEO.build(spec, ctxFor(spec));
    const r = rng(hash(spec.name + (opts.seed || Date.now())));
    return {
      id: "ag_" + Math.random().toString(36).slice(2, 10),
      spec, createdAt: opts.createdAt || Date.now(), status: opts.status || "deploying",
      phone: spec.channel === "voice" ? `+63 2 8${Math.floor(r() * 900 + 100)} ${String(Math.floor(r() * 9000 + 1000))}` : null,
      export: { format: exp.format, filename: exp.filename, text: JSON.stringify(exp.json, null, 2) },
      schedules: [],
    };
  }

  // Demo merchants start with three live agents from their industry:
  // two outbound voice agents and one chat agent.
  function seedAgents() {
    if (state.seeded || !state.user || !state.user.industry) return;
    const ind = state.user.industry, list = D.templates[ind];
    const picks = [...list.filter((t) => t.channel === "voice" && t.direction === "outbound").slice(0, 2), list.find((t) => t.channel === "chat")].filter(Boolean);
    picks.forEach((t, i) => state.agents.push(makeAgent(specFromTemplate(ind, t), { status: "live", seed: t.id, createdAt: Date.now() - (i + 1) * 4 * 864e5 })));
    state.seeded = true;
    save();
  }

  function startDeploy() {
    const agent = makeAgent(activeSpec(state.draft.spec));
    state.agents.unshift(agent);
    state.draft = null;
    state.draftPrompt = "";
    save();
    go("#/deploy/" + agent.id);
  }

  function viewDeploy(id) {
    const agent = state.agents.find((a) => a.id === id);
    if (!agent) return go("#/services");
    const s = agent.spec;
    const kb = (agent.export.text.length / 1024).toFixed(1);
    const stepsBy = {
      voice: [
        [`Validating ${agent.export.format} file`, `${kb} KB · ${s.stages.length} stages · customer_phone variable found`],
        ["Importing into Globe-hosted NEO workspace", "agent draft created"],
        ["Creating voice agent & conversation stages", `${s.stages.length + 1} nodes incl. Transfer to Human`],
        ["Configuring speech & outcome tracking", `${NEO.LANGS[s.language].label} · ${s.metrics.length} outcome fields`],
        [s.direction === "inbound" ? "Assigning Globe hotline number" : "Linking Globe outbound caller ID", agent.phone + " (demo number)"],
        ["Running a test conversation", "passed"],
      ],
      chat: [
        [`Validating ${agent.export.format} file`, `${kb} KB · ${s.stages.length + 1} groups`],
        ["Importing into Globe-hosted NEO workspace", "chat agent draft created"],
        ["Creating chat flow & variables", "menu + topic groups wired"],
        ["Publishing web chat widget", "embed snippet ready"],
        ["Running a test conversation", "passed"],
      ],
      flow: [
        [`Validating ${agent.export.format} file`, `${kb} KB`],
        ["Importing into Globe-hosted NEO workspace", "flow created"],
        ["Wiring agent, memory & tools", `${(s.tools || []).length} tools connected`],
        ["Applying input & output guardrails", "enabled"],
        ["Running a test run", "passed"],
      ],
    };
    const steps = stepsBy[s.channel];
    app.innerHTML = shell("services", `
      <div class="page"><div class="deploy">
        <div class="crumbs"><a href="#/services">My Services</a> › Deploy</div>
        <div class="card deploy-card" id="dcard">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="tpl-ic ic-${s.channel}" style="margin:0">${chIcon[s.channel]}</div>
            <div><h2 style="font-size:20px">Deploying “${esc(s.name)}”</h2><div class="small muted">Importing <span class="mono">${esc(agent.export.filename)}</span> into NEO</div></div>
          </div>
          <div class="progress"><i id="bar"></i></div>
          <div class="small muted" style="margin-bottom:10px">Simulated, no live systems are called.</div>
          <div class="steps">${steps.map((st, i) => `<div class="step" id="ds${i}"><span class="st"></span><div>${esc(st[0])}<span class="log"></span></div></div>`).join("")}</div>
        </div>
      </div></div>`);
    bindShell();

    if (agent.status !== "deploying") return renderLive(agent);
    const per = 900;
    steps.forEach((st, i) => {
      later(() => { const el = $("#ds" + i); if (el) el.classList.add("active"); }, i * per);
      later(() => {
        const el = $("#ds" + i); if (!el) return;
        el.classList.remove("active"); el.classList.add("done"); $(".st", el).textContent = "✓"; $(".log", el).textContent = st[1];
        $("#bar").style.width = ((i + 1) / steps.length) * 100 + "%";
      }, i * per + per - 100);
    });
    later(() => { agent.status = "live"; save(); renderLive(agent); }, steps.length * per + 300);
  }

  function renderLive(agent) {
    const s = agent.spec;
    $("#dcard").innerHTML = `
      <div class="success">
        <div class="big">✓</div>
        <h2 style="font-size:24px">“${esc(s.name)}” is live</h2>
        <p class="muted" style="margin:6px 0 0">${s.channel === "voice" ? (s.direction === "inbound" ? "Customers can now call your AI hotline:" : "Your agent is ready to call customers from:") : s.channel === "chat" ? "Your chat widget is published and ready to embed." : "Your agentic flow is running in NEO."}</p>
        ${agent.phone ? `<div class="live-number">${agent.phone}</div><div class="small muted">Demo number, not a real line</div>` : ""}
        <div class="actions" style="justify-content:center;margin-top:24px">
          <a class="btn btn-ghost" href="#/agent/${agent.id}/overview">Open dashboard</a>
          ${canTrigger(agent) ? `<button class="btn btn-ghost" id="liveTrigger">⚡ Trigger</button>` : ""}
          <a class="btn btn-primary" href="#/agent/${agent.id}/test">${s.channel === "voice" ? "📞 Place a test call" : "💬 Try it now"}</a>
        </div>
      </div>`;
    const tb = $("#liveTrigger");
    if (tb) tb.onclick = () => openTrigger(agent);
  }

  // ---------- services ----------
  let selectedAgent = null;
  const triggerable = (a) => !(a.spec.channel === "voice" && a.spec.direction === "inbound");
  const canTrigger = (a) => a.status === "live" && triggerable(a);

  function scheduleBadge(a) {
    const sch = a.schedules || [];
    if (!sch.length) return `<span class="muted small">-</span>`;
    if (sch.some((x) => x.status === "running")) return `<span class="badge badge-ok"><span class="dot pulse"></span> Running</span>`;
    const next = sch.filter((x) => x.status === "scheduled").length;
    return next ? `<span class="badge badge-voice">🗓 ${next} scheduled</span>` : `<span class="badge badge-gray">${sch.length} completed</span>`;
  }

  function viewServices() {
    if (selectedAgent && !state.agents.some((a) => a.id === selectedAgent)) selectedAgent = null;
    const rows = state.agents.map((a) => {
      const st = stats(a);
      const statusBadge = a.status === "live" ? `<span class="badge badge-ok"><span class="dot pulse"></span> Live</span>` : a.status === "paused" ? `<span class="badge badge-gray"><span class="dot"></span> Paused</span>` : `<span class="badge badge-warn"><span class="dot pulse"></span> Deploying</span>`;
      const sel = a.id === selectedAgent;
      return `<tr data-id="${a.id}" class="${sel ? "selected" : ""}">
        <td class="sel-cell"><input type="radio" name="agentSel" aria-label="Select ${esc(a.spec.name)}" ${sel ? "checked" : ""}></td>
        <td><div style="display:flex;align-items:center;gap:12px"><div class="tpl-ic ic-${a.spec.channel}" style="margin:0;width:36px;height:36px;font-size:16px">${chIcon[a.spec.channel]}</div><div><b>${esc(a.spec.name)}</b><div class="small muted">${a.spec.source === "prompt" ? "✨ Generated from prompt" : "From template"}</div></div></div></td>
        <td>${channelBadges(a.spec)}</td>
        <td>${statusBadge}</td>
        <td class="hide-sm">${scheduleBadge(a)}</td>
        <td class="hide-sm">${st.total.toLocaleString()}</td>
        <td style="text-align:right"><a class="btn btn-ghost btn-sm" data-open href="#/${a.status === "deploying" ? "deploy/" + a.id : "agent/" + a.id + "/overview"}">Open</a></td>
      </tr>`;
    }).join("");
    app.innerHTML = shell("services", `
      <div class="page">
        <div class="page-head">
          <div><h1>My Services</h1><p class="muted" style="margin:4px 0 0">Agents running for ${esc(state.user.merchant)}.</p></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn btn-ghost" href="#/build">+ Build new</a>
            <button class="btn btn-primary" id="triggerBtn" disabled>⚡ Trigger</button>
          </div>
        </div>
        ${state.agents.length ? `
          <div class="sel-hint" id="selHint"></div>
          <div class="card" style="overflow:auto"><table class="svc-table"><thead><tr><th style="width:44px"></th><th>Service</th><th>Type</th><th>Status</th><th class="hide-sm">Schedules</th><th class="hide-sm">Conversations (7d)</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
          : `<div class="card empty"><div class="big">🎙️</div><h2 style="font-size:20px;margin:10px 0 6px">No services yet</h2><p class="muted">Build your first AI agent from a template or a prompt.</p><a class="btn btn-primary" href="#/build" style="margin-top:10px">Build your first agent</a></div>`}
      </div>`);
    bindShell();

    const refresh = () => {
      const a = state.agents.find((x) => x.id === selectedAgent);
      $$(".svc-table tbody tr").forEach((tr) => { const on = tr.dataset.id === selectedAgent; tr.classList.toggle("selected", on); $("input", tr).checked = on; });
      const btn = $("#triggerBtn"), hint = $("#selHint");
      btn.disabled = !(a && canTrigger(a));
      if (!hint) return;
      if (!a) hint.innerHTML = `Select <b>one</b> agent, then click <b>Trigger</b> to upload contacts and schedule it.`;
      else if (!triggerable(a)) hint.innerHTML = `<b>${esc(a.spec.name)}</b> answers incoming calls, so there's nothing to trigger.`;
      else if (a.status !== "live") hint.innerHTML = `<b>${esc(a.spec.name)}</b> is ${a.status}. Set it live to trigger it.`;
      else hint.innerHTML = `Selected: <b>${esc(a.spec.name)}</b>. Click <b>Trigger</b> to upload a CSV.`;
    };
    $$(".svc-table tbody tr").forEach((tr) => (tr.onclick = (e) => {
      if (e.target.closest("[data-open]")) return;
      selectedAgent = tr.dataset.id;
      refresh();
    }));
    $("#triggerBtn").onclick = () => {
      const a = state.agents.find((x) => x.id === selectedAgent);
      if (a && canTrigger(a)) openTrigger(a, () => viewServices());
    };
    refresh();
  }

  // ---------- trigger: CSV upload -> NEO-style schedule ----------
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const unitFor = (s) => (s.channel === "flow" ? "records" : "contacts");

  function parseCsv(text) {
    const lines = String(text).replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
    const row = (line) => {
      const out = []; let cur = "", q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
        else if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c;
      }
      out.push(cur);
      return out.map((x) => x.trim());
    };
    const headers = lines.length ? row(lines[0]) : [];
    return { headers, rows: lines.slice(1).map(row) };
  }

  function sampleCsv(fields, n) {
    const q = (v) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const rows = Array.from({ length: n }, (_, i) => fields.map((f) => q(D.sampleValue(f, i))).join(","));
    return [fields.join(","), ...rows].join("\n") + "\n";
  }

  const fmtDT = (v) => (v ? new Date(v).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "");
  const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const daysText = (d) => (d.length === 7 ? "Every day" : d.join(",") === DAYS.slice(0, 5).join(",") ? "Weekdays" : d.map((x) => x.slice(0, 3)).join(", "));

  function openTrigger(a, onClose) {
    const s = a.spec;
    const fields = s.csvFields || D.csvFieldsFor(s);
    const t = { file: null, error: null, sch: { name: "", days: [], start: "", end: "", immediate: false } };
    const bg = document.createElement("div");
    bg.className = "modal-bg";
    bg.innerHTML = `<div class="card modal modal-wide" role="dialog" aria-modal="true"></div>`;
    document.body.appendChild(bg);
    const box = $(".modal", bg);
    let created = false;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const close = () => { bg.remove(); document.removeEventListener("keydown", onKey); if (created && onClose) onClose(); };
    document.addEventListener("keydown", onKey);
    bg.addEventListener("mousedown", (e) => { if (e.target === bg) close(); });

    const missing = () => (t.file ? fields.filter((f) => !t.file.headers.includes(f)) : fields);
    const valid = () => !!t.file && !missing().length && t.file.rows.length > 0;
    const chips = () => fields.map((f) => {
      if (!t.file) return `<span class="hchip">${esc(f)}</span>`;
      const ok = t.file.headers.includes(f);
      return `<span class="hchip ${ok ? "ok" : "missing"}">${ok ? "✓" : "✕"} ${esc(f)}</span>`;
    }).join("");
    const fileLine = () => `<div class="ua-file">📄 <b>${esc(t.file.name)}</b> · ${t.file.rows.length.toLocaleString()} ${unitFor(s)}</div>`;

    function renderUpload() {
      const miss = missing();
      box.innerHTML = `
        <div class="m-head">
          <div class="m-title"><span class="m-ic">⚡</span><div><h2>Trigger agent</h2><div class="m-sub">${esc(s.name)} ${channelBadges(s)}</div></div></div>
          <button class="icon-btn" data-x title="Close">✕</button>
        </div>
        <div class="m-body">
          <p class="muted" style="margin:0 0 14px">Upload a CSV with one row per ${s.channel === "voice" ? "person to call" : s.channel === "chat" ? "person to message" : "record to process"}. Each column fills one of the agent's variables.</p>
          <div class="upload-area ${t.file ? (valid() ? "ok" : "bad") : ""}">
            <div class="ua-btns">
              <label class="btn btn-outline btn-sm">⤒ Choose File<input type="file" accept=".csv,text/csv" id="csvIn" hidden></label>
              <button class="btn btn-soft btn-sm" id="dlSample">⤓ Download Sample</button>
            </div>
            ${t.file ? fileLine() : `<b class="ua-title">Upload a file containing contact information</b>`}
            <div class="small muted">Supported formats: .csv</div>
            <div class="ua-req">Required CSV Headers (case-sensitive)</div>
            <div class="hchips">${chips()}</div>
          </div>
          ${t.error ? `<div class="error">${esc(t.error)}</div>` : ""}
          ${t.file && miss.length ? `<div class="error">Missing ${miss.length === 1 ? "header" : "headers"}: ${miss.map(esc).join(", ")}. Headers are case-sensitive.</div>` : ""}
          ${t.file && !miss.length && !t.file.rows.length ? `<div class="error">The file has headers but no rows.</div>` : ""}
          ${valid() ? previewTable() : ""}
          ${t.file ? "" : `<button class="btn-link small" id="useSample" style="margin-top:12px">No file handy? Use a sample list (demo)</button>`}
        </div>
        <div class="m-foot">
          <button class="btn btn-ghost" data-x>Cancel</button>
          <button class="btn btn-primary" id="toSchedule" ${valid() ? "" : "disabled"}>🗓 Schedule</button>
        </div>`;
      bindCommon();
      $("#csvIn", box).onchange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        if (!/\.csv$/i.test(f.name)) { t.error = "Please choose a .csv file."; t.file = null; return renderUpload(); }
        const rd = new FileReader();
        rd.onload = () => { const p = parseCsv(rd.result); t.error = null; t.file = { name: f.name, headers: p.headers, rows: p.rows }; renderUpload(); };
        rd.readAsText(f);
      };
      $("#dlSample", box).onclick = () => download(`${slugify(s.name)}-sample.csv`, sampleCsv(fields, 3), "text/csv");
      const us = $("#useSample", box);
      if (us) us.onclick = () => { const p = parseCsv(sampleCsv(fields, 250)); t.file = { name: "sample-contacts.csv", headers: p.headers, rows: p.rows }; renderUpload(); };
      $("#toSchedule", box).onclick = () => { if (valid()) renderSchedule(); };
    }

    function previewTable() {
      const cols = t.file.headers;
      return `<div class="preview"><div class="small muted" style="margin-bottom:6px">Preview (first 3 of ${t.file.rows.length.toLocaleString()})</div>
        <div style="overflow:auto"><table class="svc-table mini"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>${t.file.rows.slice(0, 3).map((r) => `<tr>${cols.map((_, i) => `<td>${esc(r[i] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
    }

    function renderSchedule(err) {
      err = err || {};
      const sc = t.sch;
      const period = sc.start && sc.end ? `${fmtDT(sc.start)}  →  ${fmtDT(sc.end)}` : "";
      box.innerHTML = `
        <div class="m-head">
          <div class="m-title"><span class="m-ic">📋</span><h2>Schedule Details</h2></div>
          <div style="display:flex;gap:8px"><button class="btn btn-ghost" data-x>Cancel</button><button class="btn btn-primary" id="createBtn">💾 Create</button></div>
        </div>
        <div class="m-body">
          <div class="m-sec">Basic Information</div>
          <div class="nf ${err.name ? "has-err" : ""}"><label for="schName">Schedule Name <i>*</i></label>
            <input class="input" id="schName" placeholder="Enter schedule name" value="${esc(sc.name)}">
            ${err.name ? `<div class="error">${err.name}</div>` : ""}</div>
          <div class="nf"><label>CSV File Upload <i>*</i></label>
            <div class="upload-area ok compact">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">${fileLine()}<button class="btn-link small" id="changeFile">Change file</button></div>
              <div class="ua-req">Required CSV Headers (case-sensitive)</div>
              <div class="hchips">${chips()}</div>
            </div></div>
          <div class="m-sec">Schedule Configuration</div>
          <div class="nf ${err.days ? "has-err" : ""}">
            <div class="nf-row"><label>Days of Week <i>*</i></label><div style="display:flex;gap:6px"><button class="btn btn-soft btn-sm" id="allDays">Select All</button><button class="btn btn-soft btn-sm" id="weekdays">Weekdays Only</button></div></div>
            <div class="days">${DAYS.map((d) => `<label class="day"><input type="checkbox" value="${d}" ${sc.days.includes(d) ? "checked" : ""}> ${d}</label>`).join("")}</div>
            ${err.days ? `<div class="error">${err.days}</div>` : ""}</div>
          <div class="nf ${err.period ? "has-err" : ""}"><label>Schedule Period <i>*</i></label>
            <div class="period">
              <button type="button" class="period-field" id="periodBtn"><span class="cal">🗓</span><span class="${period ? "" : "ph"}">${period ? esc(period) : "Select schedule date &amp; time range"}</span></button>
              <div class="period-pop hidden" id="periodPop">
                <div class="row-2">
                  <label class="field"><span>Start date &amp; time</span><input type="datetime-local" class="input" id="pStart" value="${sc.start}"></label>
                  <label class="field"><span>End date &amp; time</span><input type="datetime-local" class="input" id="pEnd" value="${sc.end}"></label>
                </div>
                <div class="error hidden" id="pErr" style="margin:-6px 0 10px"></div>
                <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn btn-soft btn-sm" id="pClear">Clear</button><button class="btn btn-primary btn-sm" id="pApply">Apply</button></div>
              </div>
            </div>
            ${err.period ? `<div class="error">${err.period}</div>` : ""}</div>
          <label class="check-inline"><input type="checkbox" id="immediate" ${sc.immediate ? "checked" : ""}> Start Immediately
            <span class="info" tabindex="0" aria-label="About Start Immediately">i<span class="tip">Starts running as soon as you click Create instead of waiting for the period's start time. A schedule can't be edited once it has started.</span></span></label>
          <div style="margin-top:16px"><button class="btn-link small" id="backUpload">← Back to upload</button></div>
        </div>`;
      bindCommon();
      const name = $("#schName", box);
      name.oninput = () => (sc.name = name.value);
      if (!sc.name) name.focus();
      $$(".day input", box).forEach((c) => (c.onchange = () => (sc.days = $$(".day input", box).filter((x) => x.checked).map((x) => x.value))));
      $("#allDays", box).onclick = () => { sc.days = DAYS.slice(); renderSchedule(); };
      $("#weekdays", box).onclick = () => { sc.days = DAYS.slice(0, 5); renderSchedule(); };
      $("#changeFile", box).onclick = () => renderUpload();
      $("#backUpload", box).onclick = () => renderUpload();
      $("#immediate", box).onchange = (e) => (sc.immediate = e.target.checked);
      const pop = $("#periodPop", box);
      $("#periodBtn", box).onclick = () => {
        pop.classList.toggle("hidden");
        if (!pop.classList.contains("hidden")) setTimeout(() => pop.scrollIntoView({ block: "nearest", behavior: "smooth" }), 0);
        if (!sc.start) {
          const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1);
          const e2 = new Date(d.getTime() + 7 * 864e5); e2.setHours(18, 0, 0, 0);
          $("#pStart", box).value = localISO(d); $("#pEnd", box).value = localISO(e2);
        }
      };
      $("#pClear", box).onclick = () => { sc.start = sc.end = ""; renderSchedule(); };
      $("#pApply", box).onclick = () => {
        const st = $("#pStart", box).value, en = $("#pEnd", box).value, pe = $("#pErr", box);
        if (!st || !en) { pe.textContent = "Pick both a start and an end."; pe.classList.remove("hidden"); return; }
        if (new Date(en) <= new Date(st)) { pe.textContent = "The end must be after the start."; pe.classList.remove("hidden"); return; }
        sc.start = st; sc.end = en; renderSchedule();
      };
      $("#createBtn", box).onclick = () => {
        const e = {};
        if (!sc.name.trim()) e.name = "Enter a schedule name.";
        if (!sc.days.length) e.days = "Pick at least one day.";
        if (!sc.start || !sc.end) e.period = "Select a date &amp; time range.";
        if (Object.keys(e).length) return renderSchedule(e);
        const sched = {
          id: "sch_" + Math.random().toString(36).slice(2, 8), name: sc.name.trim(), file: t.file.name, count: t.file.rows.length,
          days: sc.days.slice(), start: sc.start, end: sc.end, immediate: sc.immediate,
          status: sc.immediate ? "running" : "scheduled", done: 0, createdAt: Date.now(),
        };
        a.schedules = a.schedules || [];
        a.schedules.unshift(sched);
        created = true;
        save();
        renderDone(sched);
      };
    }

    function renderDone(sched) {
      box.innerHTML = `
        <div class="m-body" style="padding-top:30px">
          <div class="success">
            <div class="big">✓</div>
            <h2 style="font-size:22px">Schedule created</h2>
            <p class="muted" style="margin:6px 0 18px">${sched.immediate ? `${esc(s.name)} is starting now.` : `${esc(s.name)} will start at the beginning of the period.`}</p>
          </div>
          <dl class="kv" style="max-width:520px;margin:0 auto">
            <dt>Agent</dt><dd>${esc(s.name)}</dd>
            <dt>Schedule</dt><dd>${esc(sched.name)}</dd>
            <dt>CSV</dt><dd>${esc(sched.file)} · ${sched.count.toLocaleString()} ${unitFor(s)}</dd>
            <dt>Days</dt><dd>${esc(daysText(sched.days))}</dd>
            <dt>Period</dt><dd>${esc(fmtDT(sched.start))} → ${esc(fmtDT(sched.end))}</dd>
            <dt>Start</dt><dd>${sched.immediate ? "Immediately" : "At period start"}</dd>
          </dl>
        </div>
        <div class="m-foot"><button class="btn btn-ghost" data-x>Done</button><button class="btn btn-primary" id="viewSch">View schedules →</button></div>`;
      bindCommon();
      $("#viewSch", box).onclick = () => { onClose = null; close(); go(`#/agent/${a.id}/schedules`); };
    }

    function bindCommon() { $$("[data-x]", box).forEach((b) => (b.onclick = close)); }
    renderUpload();
  }
  // mock analytics, deterministic per agent
  function stats(a) {
    const r = rng(hash(a.id));
    const base = a.spec.channel === "voice" ? 120 : 60;
    const days = Array.from({ length: 7 }, () => Math.round(base * (0.5 + r())));
    const total = days.reduce((x, y) => x + y, 0);
    return { r, days, total, connect: Math.round(68 + r() * 22), resolved: Math.round(72 + r() * 20), dur: `${1 + Math.floor(r() * 3)}m ${String(Math.floor(r() * 60)).padStart(2, "0")}s` };
  }

  function metricSample(mt, r) {
    if (mt.type === "boolean") return r() > 0.32 ? "True" : "False";
    if (mt.type === "number") return mt.name === "nps" ? String(6 + Math.floor(r() * 5)) : mt.name === "party_size" ? String(2 + Math.floor(r() * 6)) : String(3 + Math.floor(r() * 3));
    const opts = { call_language: ["taglish", "english"], customer_sentiment: ["positive", "neutral", "positive"], ptp_date: ["Oct 18", "Oct 20", "Oct 25"] }[mt.name] || ["Price", "Timing", "No reason given"];
    return opts[Math.floor(r() * opts.length)];
  }

  // ---------- agent detail ----------
  function viewAgent(id, tab) {
    const a = state.agents.find((x) => x.id === id);
    if (!a) return go("#/services");
    if (a.status === "deploying") return go("#/deploy/" + a.id);
    const s = a.spec;
    const tabs = [["overview", "Overview"], ["test", s.channel === "voice" ? "Test call" : "Try it"], ["logs", s.channel === "voice" ? "Call logs" : "Conversations"]];
    if (triggerable(a)) tabs.push(["schedules", `Schedules${(a.schedules || []).length ? ` (${a.schedules.length})` : ""}`]);
    tabs.push(["json", "NEO JSON"]);
    if (!tabs.some((t) => t[0] === tab)) tab = "overview";

    app.innerHTML = shell("services", `
      <div class="page">
        <div class="crumbs"><a href="#/services">My Services</a> › ${esc(s.name)}</div>
        <div class="page-head">
          <div class="agent-head">
            <div class="tpl-ic ic-${s.channel}">${chIcon[s.channel]}</div>
            <div><h1>${esc(s.name)}</h1><div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">${channelBadges(s)} ${a.phone ? `<span class="badge badge-gray mono">${a.phone}</span>` : ""} <span class="small muted">Persona: ${esc(s.persona)} · ${NEO.LANGS[s.language].label}</span></div></div>
          </div>
          <label class="switch"><input type="checkbox" id="liveToggle" ${a.status === "live" ? "checked" : ""}><span class="tr"></span><span id="liveLabel">${a.status === "live" ? "Live" : "Paused"}</span></label>
        </div>
        <div class="card" style="margin-bottom:20px"><div class="tabs" style="border-bottom:0">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? "on" : ""}">${l}</button>`).join("")}</div></div>
        <div id="tabBody"></div>
      </div>`);
    bindShell();
    $$("[data-tab]").forEach((b) => (b.onclick = () => go(`#/agent/${a.id}/${b.dataset.tab}`)));
    $("#liveToggle").onchange = (e) => { a.status = e.target.checked ? "live" : "paused"; $("#liveLabel").textContent = e.target.checked ? "Live" : "Paused"; save(); };

    ({ overview: tabOverview, test: tabTest, logs: tabLogs, schedules: tabSchedules, json: tabJson })[tab](a);
  }

  function tabOverview(a) {
    const s = a.spec, st = stats(a);
    const first = s.metrics[0];
    let fv = "-", fl = first ? first.name : "";
    if (first && first.type === "number") fv = (3.6 + st.r() * 1.2).toFixed(1) + (first.name === "nps" ? "" : " / 5");
    else if (first && first.type === "boolean") fv = Math.round(45 + st.r() * 40) + "%";
    else if (first) fv = metricSample(first, st.r);
    const max = Math.max(...st.days);
    const dayNames = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 864e5).toLocaleDateString(undefined, { weekday: "short" }));
    $("#tabBody").innerHTML = `
      <div class="small muted" style="margin:-6px 0 12px"><span class="badge badge-warn">Sample data</span> Illustrative numbers for the mockup.</div>
      <div class="kpis">
        <div class="card kpi"><div class="label">${s.channel === "voice" ? "Calls" : "Conversations"} (7d)</div><div class="val">${st.total.toLocaleString()}</div><div class="delta">▲ ${Math.round(st.r() * 18 + 4)}% vs last week</div></div>
        <div class="card kpi"><div class="label">${s.channel === "voice" && s.direction === "outbound" ? "Connect rate" : "Resolved by AI"}</div><div class="val">${s.channel === "voice" && s.direction === "outbound" ? st.connect : st.resolved}%</div><div class="delta">▲ ${Math.round(st.r() * 5 + 1)} pts</div></div>
        <div class="card kpi"><div class="label">${esc(fl.replace(/_/g, " "))}</div><div class="val">${esc(fv)}</div><div class="delta muted" style="color:var(--muted)">tracked per conversation</div></div>
        <div class="card kpi"><div class="label">Avg duration</div><div class="val">${st.dur}</div><div class="delta muted" style="color:var(--muted)">per conversation</div></div>
      </div>
      <div class="grid-2">
        <div class="card card-pad"><b>Volume, last 7 days</b><div class="bars">${st.days.map((d, i) => `<div class="bar"><b>${d}</b><i style="height:${(d / max) * 100}%"></i><span>${dayNames[i]}</span></div>`).join("")}</div></div>
        <div class="card card-pad"><b>How it works</b>
          <div class="stage-list" style="margin-top:12px">${s.stages.map((x, i) => `<div class="stage"><span class="num">${i + 1}</span><span>${esc(x)}</span></div>`).join("")}</div>
          <div class="section-title">Outcomes tracked</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${s.metrics.map((m) => `<span class="badge badge-gray mono">${esc(m.name)}</span>`).join("")}</div>
        </div>
      </div>`;
  }

  function tabTest(a) {
    const s = a.spec;
    const lines = transcriptFor(s).map(([w, t]) => [w, fill(t, s)]);
    if (s.channel === "voice") {
      $("#tabBody").innerHTML = `
        <div class="test-grid">
          <div class="phone"><div class="phone-screen">
            <div class="status" id="pStatus">${s.direction === "inbound" ? "Call your AI hotline" : "Have the agent call you"}</div>
            <div class="avatar-lg"><img src="assets/globe-mark-64.png" alt=""></div>
            <div class="caller">${esc(s.persona)} · ${esc(state.user.merchant)}</div>
            <div class="status mono">${a.phone}</div>
            <div class="wave" id="pWave">${waveBars(28)}</div>
            <div class="status" id="pTimer">00:00</div>
            <div class="btns"><button class="call-btn go" id="callBtn" title="Start call">${PHONE_ICON}</button></div>
          </div></div>
          <div class="card">
            <div class="json-head"><b style="font-size:14px">Live transcript</b><span class="small muted">Simulated call</span></div>
            <div class="transcript" id="tr"><p class="muted small" style="margin:0">Press the green button to start a test call.</p></div>
            <div class="summary-box hidden" id="sumBox"></div>
          </div>
        </div>`;
      let running = false, tick = null;
      $("#callBtn").onclick = () => {
        if (running) return endCall();
        running = true;
        const btn = $("#callBtn"); btn.className = "call-btn end"; btn.title = "End call";
        $("#pStatus").textContent = "Ringing…"; $("#tr").innerHTML = ""; $("#sumBox").classList.add("hidden");
        let sec = 0;
        later(() => { $("#pStatus").textContent = "Connected"; tick = setInterval(() => { sec++; const t = $("#pTimer"); if (t) t.textContent = `00:${String(sec).padStart(2, "0")}`; else clearInterval(tick); }, 1000); }, 1200);
        playLines(lines, s, $("#tr"), 1500, (who) => { const w = $("#pWave"); if (w) w.classList.toggle("on", who === "agent"); }, () => endCall(true));
      };
      function endCall(natural) {
        running = false; clearInterval(tick); clearTimers();
        const btn = $("#callBtn"); if (!btn) return;
        btn.className = "call-btn go"; btn.title = "Start call";
        $("#pStatus").textContent = natural ? "Call ended" : "Call ended by you";
        $("#pWave").classList.remove("on");
        showSummary(s, $("#sumBox"));
      }
    } else {
      $("#tabBody").innerHTML = `
        <div class="card" style="max-width:720px">
          <div class="json-head"><b style="font-size:14px">${s.channel === "flow" ? "Flow playground" : "Chat preview"}</b><button class="btn btn-ghost btn-sm" id="replay">▶ Play sample conversation</button></div>
          <div class="transcript" id="tr" style="min-height:320px"></div>
          <form class="chat-input" id="chatForm"><input class="input" id="chatIn" placeholder="Type a message…"><button class="btn btn-primary">Send</button></form>
          <div class="summary-box hidden" id="sumBox"></div>
        </div>`;
      const play = () => { clearTimers(); $("#tr").innerHTML = ""; $("#sumBox").classList.add("hidden"); playLines(lines, s, $("#tr"), 1100, null, () => showSummary(s, $("#sumBox"))); };
      $("#replay").onclick = play;
      play();
      $("#chatForm").onsubmit = (e) => {
        e.preventDefault();
        const v = $("#chatIn").value.trim(); if (!v) return;
        $("#chatIn").value = "";
        const tr = $("#tr");
        tr.insertAdjacentHTML("beforeend", msgHtml("customer", v, s));
        tr.insertAdjacentHTML("beforeend", `<div class="typing" id="typing"><i></i><i></i><i></i></div>`);
        tr.scrollTop = tr.scrollHeight;
        later(() => {
          $("#typing") && $("#typing").remove();
          tr.insertAdjacentHTML("beforeend", msgHtml("agent", "Thanks for your message! In the live platform NEO would answer this from your knowledge base. This mockup only plays scripted replies.", s));
          tr.scrollTop = tr.scrollHeight;
        }, 1000);
      };
    }
  }

  function playLines(lines, s, box, gap, onSpeaker, done) {
    lines.forEach(([who, text], i) => {
      later(() => {
        if (who === "agent") { box.insertAdjacentHTML("beforeend", `<div class="typing" data-ty><i></i><i></i><i></i></div>`); box.scrollTop = box.scrollHeight; }
      }, i * gap + 200);
      later(() => {
        const ty = $("[data-ty]", box); if (ty) ty.remove();
        box.insertAdjacentHTML("beforeend", msgHtml(who, text, s));
        box.scrollTop = box.scrollHeight;
        onSpeaker && onSpeaker(who);
      }, i * gap + (who === "agent" ? 900 : 500));
    });
    later(done, lines.length * gap + 600);
  }

  function showSummary(s, box) {
    const r = rng(hash(s.name));
    box.innerHTML = `<b class="small">Post-${s.channel === "voice" ? "call" : "conversation"} summary (extracted by NEO)</b>
      <dl class="kv small" style="margin-top:8px;grid-template-columns:200px 1fr">${s.metrics.map((m) => `<dt class="mono">${esc(m.name)}</dt><dd>${esc(summaryValue(s, m, r))}</dd>`).join("")}</dl>`;
  }

  // values consistent with the scripted (happy-path) transcript
  function summaryValue(s, m, r) {
    if (s.summary && s.summary[m.name] != null) return s.summary[m.name];
    if (m.type === "boolean") return /cancel|opted_out|hardship|escalat|human|transfer|changes|missing/.test(m.name) ? "False" : "True";
    if (m.type === "number") return { nps: "9", party_size: "4" }[m.name] || "5";
    return metricSample(m, r);
    box.classList.remove("hidden");
  }

  function tabLogs(a) {
    const s = a.spec, r = rng(hash(a.id + "logs"));
    const cols = s.metrics.slice(0, 3);
    const statuses = s.channel === "voice" ? ["Completed", "Completed", "Completed", "No answer", "Completed", "Transferred"] : ["Completed", "Completed", "Completed", "Handed off"];
    const rows = Array.from({ length: 12 }, (_, i) => {
      const t = new Date(Date.now() - (i * 47 + Math.floor(r() * 30)) * 60000);
      const status = statuses[Math.floor(r() * statuses.length)];
      const who = s.channel === "voice" ? `+63 9${Math.floor(r() * 90 + 10)} ••• ${String(Math.floor(r() * 9000 + 1000))}` : `Visitor #${Math.floor(r() * 9000 + 1000)}`;
      const dur = status === "No answer" ? "-" : `${Math.floor(r() * 3)}:${String(Math.floor(r() * 60)).padStart(2, "0")}`;
      return `<tr data-row="${i}"><td class="small">${t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}<div class="muted">${t.toLocaleDateString()}</div></td><td class="mono small">${who}</td><td>${dur}</td>
        <td><span class="badge ${status === "Completed" ? "badge-ok" : status === "No answer" ? "badge-gray" : "badge-warn"}">${status}</span></td>
        ${cols.map((m) => `<td class="hide-sm small">${status === "No answer" ? "-" : esc(metricSample(m, r))}</td>`).join("")}<td><button class="btn btn-link small" data-view="${i}">View</button></td></tr>`;
    }).join("");
    $("#tabBody").innerHTML = `
      <div class="small muted" style="margin:-6px 0 12px"><span class="badge badge-warn">Sample data</span> Each row's outcome columns come from the fields this agent tracks.</div>
      <div class="card" style="overflow:auto"><table class="svc-table"><thead><tr><th>Time</th><th>${s.channel === "voice" ? "Customer" : "User"}</th><th>Duration</th><th>Status</th>${cols.map((m) => `<th class="hide-sm mono" style="text-transform:none">${esc(m.name)}</th>`).join("")}<th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    $$("[data-view]").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); openTranscript(s); }));
    $$("[data-row]").forEach((tr) => (tr.onclick = () => openTranscript(s)));
  }

  function openTranscript(s) {
    const bg = document.createElement("div");
    bg.className = "modal-bg";
    bg.innerHTML = `<div class="card modal"><div class="json-head"><b>Transcript</b><button class="btn btn-ghost btn-sm" id="closeM">Close</button></div>
      <div class="transcript">${transcriptFor(s).map(([w, t]) => msgHtml(w, fill(t, s), s)).join("")}</div><div class="summary-box" id="mSum"></div></div>`;
    document.body.appendChild(bg);
    showSummary(s, $("#mSum", bg));
    bg.onclick = (e) => { if (e.target === bg || e.target.id === "closeM") bg.remove(); };
  }

  function tabSchedules(a) {
    const s = a.spec;
    a.schedules = a.schedules || [];
    const labels = s.channel === "voice" ? ["Dialed", "Connected", "Completed", (s.metrics[0] || { name: "goal" }).name.replace(/_/g, " ")]
      : s.channel === "chat" ? ["Sent", "Delivered", "Replied", "Resolved"] : ["Processed", "Succeeded", "Completed", "Needs review"];
    const nums = (x) => { const d = x.done, c = Math.round(d * 0.78), k = Math.round(c * 0.95); return [d, c, k, Math.round(k * 0.57)]; };
    const badge = (x) => x.status === "running" ? `<span class="badge badge-ok"><span class="dot pulse"></span> Running</span>` : x.status === "completed" ? `<span class="badge badge-gray">✓ Completed</span>` : `<span class="badge badge-voice">🗓 Scheduled</span>`;
    const card = (x) => {
      const pct = Math.round((x.done / x.count) * 100), n = nums(x);
      return `<div class="card card-pad sch" data-sch="${x.id}">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">
          <div><b class="sch-name">${esc(x.name)}</b> <span class="sch-badge">${badge(x)}</span>
            <div class="small muted" style="margin-top:4px">📄 ${esc(x.file)} · ${x.count.toLocaleString()} ${unitFor(s)} · ${esc(daysText(x.days))} · ${esc(fmtDT(x.start))} → ${esc(fmtDT(x.end))}${x.immediate ? " · Started immediately" : ""}</div></div>
          ${x.status === "scheduled" ? `<button class="btn btn-soft btn-sm" data-run="${x.id}" title="Demo only: skip ahead to the start time">▶ Start now (demo)</button>` : ""}
        </div>
        ${x.status === "scheduled" ? "" : `<div class="progress"><i style="width:${pct}%"></i></div>
        <div class="camp-stats" style="margin-top:8px">${labels.map((l, i) => `<div><b data-n="${i}">${n[i].toLocaleString()}</b><span>${esc(l)}</span></div>`).join("")}</div>`}
      </div>`;
    };
    $("#tabBody").innerHTML = `
      <div class="page-head" style="margin-bottom:14px">
        <div><h2 style="font-size:20px">Schedules</h2><p class="muted small" style="margin:4px 0 0">Each schedule runs this agent over an uploaded CSV, on the days and dates you choose.</p></div>
        <button class="btn btn-primary" id="tabTrigger" ${canTrigger(a) ? "" : "disabled"}>⚡ Trigger</button>
      </div>
      ${a.schedules.length ? `<div style="display:grid;gap:14px">${a.schedules.map(card).join("")}</div>`
        : `<div class="card empty"><div class="big">🗓</div><h2 style="font-size:19px;margin:10px 0 6px">No schedules yet</h2><p class="muted">Click <b>Trigger</b> to upload a CSV and schedule this agent.</p></div>`}
      <p class="small muted" style="margin-top:12px">Progress is simulated for the mockup.</p>`;
    $("#tabTrigger").onclick = () => openTrigger(a, () => viewAgent(a.id, "schedules"));
    $$("[data-run]").forEach((b) => (b.onclick = () => { const x = a.schedules.find((y) => y.id === b.dataset.run); x.status = "running"; save(); viewAgent(a.id, "schedules"); }));

    const running = a.schedules.filter((x) => x.status === "running");
    if (!running.length) return;
    const step = () => {
      let any = false;
      running.forEach((x) => {
        if (x.status !== "running") return;
        x.done = Math.min(x.count, x.done + Math.max(1, Math.ceil(x.count / 40)));
        if (x.done >= x.count) x.status = "completed"; else any = true;
        const el = $(`[data-sch="${x.id}"]`);
        if (!el) return;
        $(".progress i", el).style.width = Math.round((x.done / x.count) * 100) + "%";
        nums(x).forEach((v, i) => ($(`[data-n="${i}"]`, el).textContent = v.toLocaleString()));
        if (x.status === "completed") $(".sch-badge", el).innerHTML = badge(x);
      });
      save();
      if (any) later(step, 250);
    };
    later(step, 300);
  }

  function tabJson(a) {
    const exp = { format: a.export.format, filename: a.export.filename, json: JSON.parse(a.export.text) };
    $("#tabBody").innerHTML = jsonCard(exp, "This is the exact file that was imported for this service.");
    bindJsonCard(exp);
  }

  // ---------- router ----------
  function route() {
    clearTimers();
    $$(".modal-bg").forEach((m) => m.remove());
    const [path, a, b] = location.hash.replace(/^#\/?/, "").split("/");
    if (!state.user) { if (path !== "login") return go("#/login"); return viewLogin(); }
    if (!state.user.industry && path !== "onboard") return go("#/onboard");
    seedAgents();
    window.scrollTo(0, 0);
    switch (path) {
      case "login": return go("#/build");
      case "onboard": return viewOnboard();
      case "build": return viewBuild();
      case "create": return viewCreate();
      case "generate": return viewGenerate();
      case "configure": return viewConfigure();
      case "deploy": return viewDeploy(a);
      case "services": return viewServices();
      case "agent": return viewAgent(a, b);
      default: return go("#/build");
    }
  }

  window.addEventListener("hashchange", route);
  route();
})();
