(() => {
  const DRAFT_KEY = "runa-signal-bench.draft.v1";
  const ARCHIVE_KEY = "runa-signal-bench.archive.v1";
  const fields = ["sessionLabel","targetId","conditionLabel","protocol","shell","durationSec","shapes","textures","temperatureMotion","colourLight","atmosphere","functionPurpose","sketchNotes","interpretiveGuess","bodyCalm","clarity","imagery","confidence","postNotes"];
  const scores = ["gestalt","sensory","structure","material","colourLightScore","motionTemp","atmosphereScore","functionScore","location"];
  const ids = [...fields, ...scores, "themeSelect","timerDisplay","sessionStatus","commitButton","newSessionButton","exportDraftJson","exportDraftMarkdown","revealPanel","sealStatus","revealTitle","revealReference","revealNotes","scoreNotes","saveReveal","exportSealedJson","exportSealedMarkdown","archiveList","startTimer","stopTimer","clearDraft","targetDisplay","protocolDisplay","shellDisplay","scoreSummary"];
  const $ = (id) => document.getElementById(id);
  const ref = Object.fromEntries(ids.map((id) => [id, $(id)]));
  let current = null;
  let timer = null;

  function injectMotionSkin() {
    const style = document.createElement("style");
    style.textContent = `
      body::before { animation: benchAura 18s ease-in-out infinite alternate; }
      .card { animation: benchRise .55s ease both; }
      .card:nth-of-type(2) { animation-delay: .06s; } .card:nth-of-type(3) { animation-delay: .12s; }
      .card:nth-of-type(4) { animation-delay: .18s; } .card:nth-of-type(5) { animation-delay: .24s; }
      .hero.glow-card { position: relative; overflow: hidden; }
      .hero.glow-card::after { content:""; position:absolute; inset:-40%; background: linear-gradient(110deg, transparent 35%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 65%); transform: translateX(-55%) rotate(8deg); animation: benchSweep 9s ease-in-out infinite; pointer-events:none; }
      .stat-card, .metric-card, textarea, input, select { transition: transform .18s ease, box-shadow .25s ease, border-color .25s ease, filter .25s ease; }
      textarea:focus, input:focus, select:focus { transform: translateY(-1px); }
      .capture-lock:focus-within { box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 0 30px color-mix(in srgb, var(--accent) 18%, transparent), var(--shadow); }
      .bench-spark { position: fixed; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 22px var(--accent), 0 0 40px var(--accent-2); pointer-events: none; z-index: 20; animation: benchSpark .9s ease-out forwards; }
      .bench-state-strip { display:flex; flex-wrap:wrap; gap:.55rem; margin-top:1rem; }
      .bench-step { border: 1px solid color-mix(in srgb, var(--border) 75%, transparent); border-radius:999px; padding:.45rem .75rem; color:var(--muted); background: color-mix(in srgb, var(--card-strong) 88%, transparent); transition: all .25s ease; }
      .bench-step.active { color:var(--text); border-color: color-mix(in srgb, var(--accent) 55%, white 4%); box-shadow: 0 0 18px var(--glow); transform: translateY(-1px); }
      .sealed-pulse { animation: sealThunder 1s ease both; }
      .reveal-open { animation: drawerOpen .72s cubic-bezier(.2,.7,.2,1) both; }
      .score-flare { animation: scoreFlare .55s ease both; }
      .archive-entry { animation: archiveSlide .45s ease both; }
      body[data-bench-state="capturing"] .timer { text-shadow: 0 0 22px var(--accent); animation: timerPulse 1.2s ease-in-out infinite alternate; }
      body[data-bench-state="sealed"] #sealStatus { border-color: color-mix(in srgb, var(--accent) 65%, white 5%); box-shadow: 0 0 26px var(--glow); }
      body[data-bench-state="revealed"] #revealPanel { box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 0 34px color-mix(in srgb, var(--accent-2) 20%, transparent), var(--shadow); }
      @keyframes benchAura { from { filter: hue-rotate(0deg) brightness(.95); opacity:.65; } to { filter: hue-rotate(12deg) brightness(1.15); opacity:.95; } }
      @keyframes benchRise { from { opacity:0; transform: translateY(12px) scale(.992); } to { opacity:1; transform: translateY(0) scale(1); } }
      @keyframes benchSweep { 0%,70% { transform: translateX(-70%) rotate(8deg); opacity:0; } 82% { opacity:.75; } 100% { transform: translateX(70%) rotate(8deg); opacity:0; } }
      @keyframes benchSpark { from { opacity:1; transform: translate(-50%,-50%) scale(.5); } to { opacity:0; transform: translate(-50%,-90px) scale(1.8); } }
      @keyframes sealThunder { 0% { transform: scale(1); filter:brightness(1); } 35% { transform: scale(1.015); filter:brightness(1.45); } 100% { transform: scale(1); filter:brightness(1); } }
      @keyframes drawerOpen { from { opacity:0; transform: translateY(-12px) scaleY(.97); } to { opacity:1; transform: translateY(0) scaleY(1); } }
      @keyframes scoreFlare { 0% { transform: scale(1); } 45% { transform: scale(1.025); box-shadow:0 0 26px var(--glow); } 100% { transform: scale(1); } }
      @keyframes archiveSlide { from { opacity:0; transform: translateX(-10px); } to { opacity:1; transform: translateX(0); } }
      @keyframes timerPulse { from { filter: brightness(.95); } to { filter: brightness(1.3); } }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; scroll-behavior:auto !important; } }
    `;
    document.head.appendChild(style);
    const hero = document.querySelector(".hero");
    if (hero && !$("benchStateStrip")) {
      const strip = document.createElement("div");
      strip.id = "benchStateStrip";
      strip.className = "bench-state-strip";
      ["idle","capturing","sealed","revealed","archived"].forEach((state) => {
        const chip = document.createElement("span");
        chip.className = "bench-step";
        chip.dataset.step = state;
        chip.textContent = state[0].toUpperCase() + state.slice(1);
        strip.appendChild(chip);
      });
      hero.querySelector("div")?.appendChild(strip);
    }
  }

  function setBenchState(state) {
    document.body.dataset.benchState = state;
    document.querySelectorAll(".bench-step").forEach((chip) => chip.classList.toggle("active", chip.dataset.step === state));
  }

  function sparkNear(el) {
    const box = el?.getBoundingClientRect?.() || { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    for (let i = 0; i < 5; i++) {
      const s = document.createElement("i");
      s.className = "bench-spark";
      s.style.left = `${box.left + box.width / 2 + (Math.random() - .5) * 90}px`;
      s.style.top = `${box.top + window.scrollY + box.height / 2 + (Math.random() - .5) * 40}px`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 950);
    }
  }

  const parse = (raw, fallback) => { try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
  const stamp = () => new Date().toISOString();
  const pretty = (iso) => { try { return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); } catch { return iso || "—"; } };
  const archive = () => parse(localStorage.getItem(ARCHIVE_KEY), []);
  const saveArchive = (items) => localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items));

  function readFields() {
    const out = {};
    fields.forEach((id) => {
      const el = ref[id];
      if (!el) return;
      out[id] = el.type === "range" || el.type === "number" ? Number(el.value) || 0 : (el.value.trim ? el.value.trim() : el.value);
    });
    out.theme = ref.themeSelect?.value || "ember-rain";
    return out;
  }

  function writeFields(data = {}) {
    fields.forEach((id) => { if (ref[id] && data[id] !== undefined) ref[id].value = String(data[id]); });
    if (ref.themeSelect && data.theme) ref.themeSelect.value = data.theme;
    document.body.dataset.theme = ref.themeSelect?.value || data.theme || "ember-rain";
    updateReadouts();
  }

  function readScores() { return Object.fromEntries(scores.map((id) => [id, ref[id]?.value || ""])); }
  function writeScores(data = {}) { scores.forEach((id) => { if (ref[id]) ref[id].value = data[id] || ""; }); }
  function scoreTotal(data) { return Object.values(data || {}).reduce((sum, v) => sum + (Number(v) || 0), 0); }

  async function hashRaw(raw) {
    const payload = { ...raw };
    delete payload.theme;
    const text = JSON.stringify(payload, Object.keys(payload).sort());
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  function updateReadouts() {
    const data = readFields();
    if (ref.targetDisplay) ref.targetDisplay.textContent = data.targetId || "—";
    if (ref.protocolDisplay) ref.protocolDisplay.textContent = (data.protocol || "rv001").toUpperCase();
    if (ref.shellDisplay) ref.shellDisplay.textContent = (data.shell || "f12").toUpperCase();
    ["bodyCalm","clarity","imagery","confidence"].forEach((id) => { const label = $(`${id}Value`); if (label && ref[id]) label.textContent = `${ref[id].value} / 10`; });
    updateScoreSummary();
  }

  function updateScoreSummary() {
    if (!ref.scoreSummary) return;
    const data = readScores();
    const filled = Object.values(data).filter(Boolean).length;
    ref.scoreSummary.textContent = current?.sealed ? `${filled}/9 categories scored | weighted total ${scoreTotal(data)}` : "No sealed entry loaded.";
  }

  function setLocked(locked) {
    document.querySelectorAll(".capture-lock input,.capture-lock textarea,.capture-lock select").forEach((el) => { el.disabled = locked; });
    if (ref.commitButton) ref.commitButton.disabled = locked;
    if (ref.revealPanel) {
      ref.revealPanel.classList.toggle("hidden", !locked);
      if (locked) ref.revealPanel.classList.add("reveal-open");
    }
  }

  function renderSeal() {
    if (!current?.sealed) {
      ref.sealStatus.textContent = "Unsealed draft. Raw fields are editable.";
      setLocked(false);
      setBenchState("idle");
      return;
    }
    ref.sealStatus.textContent = `Sealed ${pretty(current.sealedAt)} | hash ${current.hash.slice(0, 12)}…`;
    ref.sealStatus.classList.add("sealed-pulse");
    setTimeout(() => ref.sealStatus.classList.remove("sealed-pulse"), 1100);
    setLocked(true);
    setBenchState(current.reveal ? "revealed" : "sealed");
  }

  function persistDraft() {
    if (current?.sealed) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(readFields()));
    updateReadouts();
  }

  async function commit() {
    stopTimer();
    const raw = readFields();
    current = { id: `${raw.targetId || raw.sessionLabel || "signal"}-${Date.now()}`, sealed: true, sealedAt: stamp(), hash: await hashRaw(raw), raw, reveal: null };
    const items = archive();
    items.unshift(current);
    saveArchive(items);
    localStorage.removeItem(DRAFT_KEY);
    sparkNear(ref.commitButton);
    renderSeal();
    renderArchive();
  }

  function saveReveal() {
    if (!current?.sealed) return;
    current.reveal = { title: ref.revealTitle?.value.trim() || "", reference: ref.revealReference?.value.trim() || "", notes: ref.revealNotes?.value.trim() || "", scores: readScores(), scoreNotes: ref.scoreNotes?.value.trim() || "", savedAt: stamp() };
    const items = archive();
    const idx = items.findIndex((x) => x.id === current.id);
    if (idx >= 0) items[idx] = current; else items.unshift(current);
    saveArchive(items);
    sparkNear(ref.saveReveal);
    setBenchState("revealed");
    renderArchive();
    updateScoreSummary();
  }

  function markdown(entry) {
    const r = entry.raw || {}, v = entry.reveal || {}, s = v.scores || {};
    return [`# ${r.sessionLabel || "Wardenclyffe Signal Bench Session"}`, "", `- Target ID: ${r.targetId || "—"}`, `- Protocol: ${r.protocol || "—"}`, `- Shell: ${r.shell || "—"}`, `- Condition: ${r.conditionLabel || "—"}`, `- Sealed at: ${entry.sealedAt || "unsealed"}`, `- SHA-256: ${entry.hash || "—"}`, "", "## Raw Capture", "", `### Shapes / structure\n${r.shapes || "—"}`, "", `### Textures / surfaces\n${r.textures || "—"}`, "", `### Temperature / movement\n${r.temperatureMotion || "—"}`, "", `### Colours / light\n${r.colourLight || "—"}`, "", `### Atmosphere\n${r.atmosphere || "—"}`, "", `### Function / purpose\n${r.functionPurpose || "—"}`, "", `### Sketch notes / layout\n${r.sketchNotes || "—"}`, "", `### Interpretive guess / AOL\n${r.interpretiveGuess || "—"}`, "", "## Metrics", `- Body calm: ${r.bodyCalm ?? "—"}/10`, `- Clarity: ${r.clarity ?? "—"}/10`, `- Imagery density: ${r.imagery ?? "—"}/10`, `- Confidence: ${r.confidence ?? "—"}/10`, "", "## Post-session notes", r.postNotes || "—", "", "## Reveal", `- Target: ${v.title || "—"}`, `- Reference: ${v.reference || "—"}`, v.notes || "—", "", "## Scores", ...scores.map((id) => `- ${id}: ${s[id] || "unscored"}`), "", `Weighted total: ${scoreTotal(s)}`, "", "## Scoring notes", v.scoreNotes || "—"].join("\n");
  }

  function exportEntry(entry, kind) {
    const base = (entry.raw?.sessionLabel || entry.raw?.targetId || "signal-bench-session").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "signal-bench-session";
    if (kind === "json") download(`${base}.json`, JSON.stringify(entry, null, 2), "application/json;charset=utf-8");
    else download(`${base}.md`, markdown(entry), "text/markdown;charset=utf-8");
  }

  function exportDraft(kind) { exportEntry({ id: `draft-${Date.now()}`, sealed: false, raw: readFields(), exportedAt: stamp() }, kind); }

  function loadEntry(id) {
    const entry = archive().find((x) => x.id === id);
    if (!entry) return;
    current = entry;
    writeFields(entry.raw);
    if (ref.revealTitle) ref.revealTitle.value = entry.reveal?.title || "";
    if (ref.revealReference) ref.revealReference.value = entry.reveal?.reference || "";
    if (ref.revealNotes) ref.revealNotes.value = entry.reveal?.notes || "";
    if (ref.scoreNotes) ref.scoreNotes.value = entry.reveal?.scoreNotes || "";
    writeScores(entry.reveal?.scores || {});
    renderSeal();
    updateScoreSummary();
    scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteEntry(id) {
    saveArchive(archive().filter((x) => x.id !== id));
    if (current?.id === id) newSession();
    renderArchive();
  }

  function renderArchive() {
    const list = ref.archiveList;
    if (!list) return;
    const items = archive();
    if (!items.length) { list.innerHTML = `<p class="status-copy">No sealed sessions yet. The ledger is waiting with tiny brass spectacles.</p>`; return; }
    list.innerHTML = "";
    items.forEach((entry) => {
      const row = document.createElement("article");
      row.className = "stat-card archive-entry";
      row.innerHTML = `<h3>${entry.raw?.sessionLabel || entry.raw?.targetId || "Untitled signal"}</h3><p class="status-copy">${entry.raw?.targetId || "No target ID"} | ${pretty(entry.sealedAt)} | ${entry.reveal?.title ? "Reveal: " + entry.reveal.title : "Reveal pending"}</p><p class="tiny-copy">hash ${entry.hash ? entry.hash.slice(0, 18) + "…" : "—"}</p><div class="button-row"><button type="button" data-load="${entry.id}">Load</button><button type="button" data-json="${entry.id}">Export JSON</button><button type="button" data-md="${entry.id}">Export Markdown</button><button type="button" data-delete="${entry.id}">Delete local</button></div>`;
      list.appendChild(row);
    });
    setBenchState(current?.reveal ? "revealed" : current?.sealed ? "sealed" : "archived");
  }

  function newSession() {
    stopTimer();
    current = null;
    localStorage.removeItem(DRAFT_KEY);
    document.querySelectorAll("input,textarea").forEach((el) => { if (!["range","button"].includes(el.type) && el.id && !scores.includes(el.id)) el.value = ""; });
    ["bodyCalm","clarity","imagery","confidence"].forEach((id) => { if (ref[id]) ref[id].value = "5"; });
    if (ref.protocol) ref.protocol.value = "rv001";
    if (ref.shell) ref.shell.value = "f12";
    if (ref.durationSec) ref.durationSec.value = "120";
    writeScores({});
    renderSeal(); updateReadouts();
  }

  function fmt(sec) { const s = Math.max(0, Math.floor(sec)); return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`; }
  function startTimer() {
    stopTimer();
    const end = Date.now() + (Number(ref.durationSec?.value) || 120) * 1000;
    setBenchState("capturing");
    ref.sessionStatus.textContent = "Timer running. Capture raw impressions before interpretation.";
    timer = setInterval(() => { const left = Math.max(0, Math.ceil((end - Date.now()) / 1000)); ref.timerDisplay.textContent = fmt(left); if (left <= 0) stopTimer(); }, 150);
  }
  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
    ref.timerDisplay.textContent = fmt(Number(ref.durationSec?.value) || 120);
    if (ref.sessionStatus) ref.sessionStatus.textContent = current?.sealed ? "Entry sealed. Reveal panel open." : "Capture fields autosave locally in this browser.";
    if (!current?.sealed) setBenchState("idle");
  }

  injectMotionSkin();
  document.addEventListener("input", (e) => { if (e.target.closest(".capture-lock")) persistDraft(); if (scores.includes(e.target.id)) { e.target.closest(".metric-card")?.classList.add("score-flare"); setTimeout(() => e.target.closest(".metric-card")?.classList.remove("score-flare"), 600); updateScoreSummary(); } });
  document.addEventListener("change", (e) => { if (e.target === ref.themeSelect) { document.body.dataset.theme = ref.themeSelect.value; persistDraft(); } if (e.target.closest(".capture-lock")) persistDraft(); if (scores.includes(e.target.id)) updateScoreSummary(); });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.id === "commitButton") commit();
    if (b.id === "newSessionButton") newSession();
    if (b.id === "clearDraft") newSession();
    if (b.id === "startTimer") startTimer();
    if (b.id === "stopTimer") stopTimer();
    if (b.id === "saveReveal") saveReveal();
    if (b.id === "exportDraftJson") exportDraft("json");
    if (b.id === "exportDraftMarkdown") exportDraft("md");
    if (b.id === "exportSealedJson" && current) exportEntry(current, "json");
    if (b.id === "exportSealedMarkdown" && current) exportEntry(current, "md");
    if (b.dataset.load) loadEntry(b.dataset.load);
    if (b.dataset.delete) deleteEntry(b.dataset.delete);
    if (b.dataset.json) { const entry = archive().find((x) => x.id === b.dataset.json); if (entry) exportEntry(entry, "json"); }
    if (b.dataset.md) { const entry = archive().find((x) => x.id === b.dataset.md); if (entry) exportEntry(entry, "md"); }
  });

  const saved = parse(localStorage.getItem(DRAFT_KEY), null);
  if (saved) writeFields(saved); else writeFields({ theme: "ember-rain", protocol: "rv001", shell: "f12", durationSec: 120, bodyCalm: 5, clarity: 5, imagery: 5, confidence: 5 });
  stopTimer(); renderSeal(); renderArchive();
})();
