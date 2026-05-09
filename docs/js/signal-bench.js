(() => {
  const DRAFT_KEY = "runa-signal-bench.draft.v1";
  const ARCHIVE_KEY = "runa-signal-bench.archive.v1";

  const fieldIds = [
    "sessionLabel", "targetId", "conditionLabel", "protocol", "shell", "durationSec",
    "shapes", "textures", "temperatureMotion", "colourLight", "atmosphere",
    "functionPurpose", "sketchNotes", "interpretiveGuess", "bodyCalm",
    "clarity", "imagery", "confidence", "postNotes"
  ];

  const scoreIds = [
    "gestalt", "sensory", "structure", "material", "colourLightScore",
    "motionTemp", "atmosphereScore", "functionScore", "location"
  ];

  const $ = (id) => document.getElementById(id);
  const refs = Object.fromEntries([...fieldIds, ...scoreIds, "themeSelect", "timerDisplay", "sessionStatus", "commitButton", "newSessionButton", "exportDraftJson", "exportDraftMarkdown", "revealPanel", "sealStatus", "revealTitle", "revealReference", "revealNotes", "scoreNotes", "saveReveal", "exportSealedJson", "exportSealedMarkdown", "archiveList", "startTimer", "stopTimer", "clearDraft", "targetDisplay", "protocolDisplay", "shellDisplay", "scoreSummary"].map((id) => [id, $(id)]));

  let timer = null;
  let timerEndsAt = null;
  let current = null;

  function safeJsonParse(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  }

  function nowStamp() {
    return new Date().toISOString();
  }

  function displayStamp(iso) {
    try { return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); } catch { return iso || "—"; }
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function readDraftFields() {
    const data = {};
    fieldIds.forEach((id) => {
      const el = refs[id];
      if (!el) return;
      if (el.type === "range" || el.type === "number") data[id] = Number(el.value) || 0;
      else data[id] = el.value.trim ? el.value.trim() : el.value;
    });
    data.theme = refs.themeSelect?.value || "ember-rain";
    return data;
  }

  function writeDraftFields(data = {}) {
    fieldIds.forEach((id) => {
      const el = refs[id];
      if (!el) return;
      if (data[id] !== undefined) el.value = String(data[id]);
    });
    if (refs.themeSelect && data.theme) refs.themeSelect.value = data.theme;
    document.body.dataset.theme = refs.themeSelect?.value || data.theme || "ember-rain";
    updateReadouts();
  }

  function readScores() {
    return Object.fromEntries(scoreIds.map((id) => [id, refs[id]?.value || ""]));
  }

  function writeScores(scores = {}) {
    scoreIds.forEach((id) => {
      if (refs[id]) refs[id].value = scores[id] || "";
    });
  }

  function readReveal() {
    return {
      title: refs.revealTitle?.value.trim() || "",
      reference: refs.revealReference?.value.trim() || "",
      notes: refs.revealNotes?.value.trim() || "",
      scores: readScores(),
      scoreNotes: refs.scoreNotes?.value.trim() || "",
      savedAt: nowStamp()
    };
  }

  function canonicalRaw(data) {
    const raw = { ...data };
    delete raw.theme;
    return JSON.stringify(raw, Object.keys(raw).sort());
  }

  function getArchive() {
    return safeJsonParse(localStorage.getItem(ARCHIVE_KEY), []);
  }

  function saveArchive(entries) {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(entries));
  }

  function persistDraft() {
    if (current?.sealed) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(readDraftFields()));
    updateReadouts();
  }

  function updateReadouts() {
    const data = readDraftFields();
    if (refs.targetDisplay) refs.targetDisplay.textContent = data.targetId || "—";
    if (refs.protocolDisplay) refs.protocolDisplay.textContent = (data.protocol || "rv001").toUpperCase();
    if (refs.shellDisplay) refs.shellDisplay.textContent = (data.shell || "f12").toUpperCase();
    updateMetricLabels();
    updateScoreSummary();
  }

  function updateMetricLabels() {
    ["bodyCalm", "clarity", "imagery", "confidence"].forEach((id) => {
      const label = $(`${id}Value`);
      if (label && refs[id]) label.textContent = `${refs[id].value} / 10`;
    });
  }

  function setCaptureLocked(locked) {
    document.querySelectorAll(".capture-lock input, .capture-lock textarea, .capture-lock select").forEach((el) => {
      el.disabled = locked;
    });
    if (refs.commitButton) refs.commitButton.disabled = locked;
    if (refs.revealPanel) refs.revealPanel.classList.toggle("hidden", !locked);
  }

  function renderSeal() {
    if (!current?.sealed) {
      refs.sealStatus.textContent = "Unsealed draft. Raw fields are editable.";
      setCaptureLocked(false);
      return;
    }
    refs.sealStatus.textContent = `Sealed ${displayStamp(current.sealedAt)} | hash ${current.hash.slice(0, 12)}…`;
    setCaptureLocked(true);
  }

  async function commitSeal() {
    stopTimer();
    const raw = readDraftFields();
    const sealedAt = nowStamp();
    const hash = await sha256(canonicalRaw(raw));
    current = { id: `${raw.targetId || raw.sessionLabel || "signal"}-${Date.now()}`, sealed: true, sealedAt, hash, raw, reveal: null };
    const archive = getArchive();
    archive.unshift(current);
    saveArchive(archive);
    localStorage.removeItem(DRAFT_KEY);
    renderSeal();
    renderArchive();
  }

  function saveReveal() {
    if (!current?.sealed) return;
    current.reveal = readReveal();
    const archive = getArchive();
    const idx = archive.findIndex((entry) => entry.id === current.id);
    if (idx >= 0) archive[idx] = current;
    else archive.unshift(current);
    saveArchive(archive);
    renderArchive();
    updateScoreSummary();
  }

  function scoreTotal(scores) {
    return Object.values(scores || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  }

  function updateScoreSummary() {
    if (!refs.scoreSummary) return;
    const scores = readScores();
    const filled = Object.values(scores).filter((v) => v !== "").length;
    const total = scoreTotal(scores);
    refs.scoreSummary.textContent = current?.sealed
      ? `${filled}/9 categories scored | weighted total ${total}`
      : "No sealed entry loaded.";
  }

  function sessionToMarkdown(entry) {
    const raw = entry.raw || {};
    const reveal = entry.reveal || {};
    const scores = reveal.scores || {};
    return [
      `# ${raw.sessionLabel || "Wardenclyffe Signal Bench Session"}`,
      "",
      `- Target ID: ${raw.targetId || "—"}`,
      `- Protocol: ${raw.protocol || "—"}`,
      `- Shell: ${raw.shell || "—"}`,
      `- Condition: ${raw.conditionLabel || "—"}`,
      `- Sealed at: ${entry.sealedAt || "unsealed"}`,
      `- SHA-256: ${entry.hash || "—"}`,
      "",
      "## Raw Capture",
      "",
      `### Shapes / structure\n${raw.shapes || "—"}`,
      "",
      `### Textures / surfaces\n${raw.textures || "—"}`,
      "",
      `### Temperature / movement\n${raw.temperatureMotion || "—"}`,
      "",
      `### Colours / light\n${raw.colourLight || "—"}`,
      "",
      `### Atmosphere\n${raw.atmosphere || "—"}`,
      "",
      `### Function / purpose\n${raw.functionPurpose || "—"}`,
      "",
      `### Sketch notes / layout\n${raw.sketchNotes || "—"}`,
      "",
      `### Interpretive guess / AOL\n${raw.interpretiveGuess || "—"}`,
      "",
      "## Metrics",
      "",
      `- Body calm: ${raw.bodyCalm ?? "—"}/10`,
      `- Clarity: ${raw.clarity ?? "—"}/10`,
      `- Imagery density: ${raw.imagery ?? "—"}/10`,
      `- Confidence: ${raw.confidence ?? "—"}/10`,
      "",
      "## Post-session notes",
      raw.postNotes || "—",
      "",
      "## Reveal",
      "",
      `- Target: ${reveal.title || "—"}`,
      `- Reference: ${reveal.reference || "—"}`,
      reveal.notes || "—",
      "",
      "## Scores",
      "",
      ...scoreIds.map((id) => `- ${id}: ${scores[id] || "unscored"}`),
      "",
      `Weighted total: ${scoreTotal(scores)}`,
      "",
      "## Scoring notes",
      reveal.scoreNotes || "—"
    ].join("\n");
  }

  function exportEntry(entry, kind) {
    const nameBase = (entry.raw?.sessionLabel || entry.raw?.targetId || "signal-bench-session").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "signal-bench-session";
    if (kind === "json") downloadText(`${nameBase}.json`, JSON.stringify(entry, null, 2), "application/json;charset=utf-8");
    else downloadText(`${nameBase}.md`, sessionToMarkdown(entry), "text/markdown;charset=utf-8");
  }

  function exportDraft(kind) {
    const entry = { id: `draft-${Date.now()}`, sealed: false, raw: readDraftFields(), exportedAt: nowStamp() };
    exportEntry(entry, kind);
  }

  function loadEntry(id) {
    const entry = getArchive().find((item) => item.id === id);
    if (!entry) return;
    current = entry;
    writeDraftFields(entry.raw);
    refs.revealTitle.value = entry.reveal?.title || "";
    refs.revealReference.value = entry.reveal?.reference || "";
    refs.revealNotes.value = entry.reveal?.notes || "";
    refs.scoreNotes.value = entry.reveal?.scoreNotes || "";
    writeScores(entry.reveal?.scores || {});
    renderSeal();
    updateScoreSummary();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteEntry(id) {
    saveArchive(getArchive().filter((entry) => entry.id !== id));
    if (current?.id === id) newSession();
    renderArchive();
  }

  function renderArchive() {
    const list = refs.archiveList;
    if (!list) return;
    const archive = getArchive();
    if (!archive.length) {
      list.innerHTML = `<p class="status-copy">No sealed sessions yet. The ledger is waiting with tiny brass spectacles.</p>`;
      return;
    }
    list.innerHTML = "";
    archive.forEach((entry) => {
      const row = document.createElement("article");
      row.className = "stat-card archive-entry";
      const title = entry.raw?.sessionLabel || entry.raw?.targetId || "Untitled signal";
      const reveal = entry.reveal?.title ? `Reveal: ${entry.reveal.title}` : "Reveal pending";
      row.innerHTML = `
        <h3>${title}</h3>
        <p class="status-copy">${entry.raw?.targetId || "No target ID"} | ${displayStamp(entry.sealedAt)} | ${reveal}</p>
        <p class="tiny-copy">hash ${entry.hash ? entry.hash.slice(0, 18) + "…" : "—"}</p>
        <div class="button-row">
          <button type="button" data-load="${entry.id}">Load</button>
          <button type="button" data-json="${entry.id}">Export JSON</button>
          <button type="button" data-md="${entry.id}">Export Markdown</button>
          <button type="button" data-delete="${entry.id}">Delete local</button>
        </div>`;
      list.appendChild(row);
    });
  }

  function newSession() {
    stopTimer();
    current = null;
    localStorage.removeItem(DRAFT_KEY);
    document.querySelectorAll("input, textarea").forEach((el) => {
      if (["range", "button"].includes(el.type)) return;
      if (el.id && !scoreIds.includes(el.id)) el.value = "";
    });
    ["bodyCalm", "clarity", "imagery", "confidence"].forEach((id) => { if (refs[id]) refs[id].value = "5"; });
    if (refs.protocol) refs.protocol.value = "rv001";
    if (refs.shell) refs.shell.value = "f12";
    if (refs.durationSec) refs.durationSec.value = "120";
    refs.revealTitle.value = "";
    refs.revealReference.value = "";
    refs.revealNotes.value = "";
    refs.scoreNotes.value = "";
    writeScores({});
    renderSeal();
    updateReadouts();
  }

  function clearDraft() {
    if (current?.sealed) return;
    newSession();
  }

  function formatSeconds(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function startTimer() {
    stopTimer();
    const duration = Number(refs.durationSec?.value) || 120;
    timerEndsAt = Date.now() + duration * 1000;
    refs.sessionStatus.textContent = "Timer running. Capture raw impressions before interpretation.";
    timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
      refs.timerDisplay.textContent = formatSeconds(remaining);
      if (remaining <= 0) stopTimer();
    }, 150);
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
    timerEndsAt = null;
    const duration = Number(refs.durationSec?.value) || 120;
    refs.timerDisplay.textContent = formatSeconds(duration);
    if (refs.sessionStatus) refs.sessionStatus.textContent = current?.sealed ? "Entry sealed. Reveal panel open." : "Capture fields autosave locally in this browser.";
  }

  document.addEventListener("input", (event) => {
    if (event.target.closest(".capture-lock")) persistDraft();
    if (scoreIds.includes(event.target.id)) updateScoreSummary();
  });
  document.addEventListener("change", (event) => {
    if (event.target === refs.themeSelect) {
      document.body.dataset.theme = refs.themeSelect.value;
      persistDraft();
    }
    if (event.target.closest(".capture-lock")) persistDraft();
    if (scoreIds.includes(event.target.id)) updateScoreSummary();
  });
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const id = button.id;
    if (id === "commitButton") commitSeal();
    if (id === "newSessionButton") newSession();
    if (id === "clearDraft") clearDraft();
    if (id === "startTimer") startTimer();
    if (id === "stopTimer") stopTimer();
    if (id === "saveReveal") saveReveal();
    if (id === "exportDraftJson") exportDraft("json");
    if (id === "exportDraftMarkdown") exportDraft("md");
    if (id === "exportSealedJson" && current) exportEntry(current, "json");
    if (id === "exportSealedMarkdown" && current) exportEntry(current, "md");
    if (button.dataset.load) loadEntry(button.dataset.load);
    if (button.dataset.delete) deleteEntry(button.dataset.delete);
    if (button.dataset.json) {
      const entry = getArchive().find((item) => item.id === button.dataset.json);
      if (entry) exportEntry(entry, "json");
    }
    if (button.dataset.md) {
      const entry = getArchive().find((item) => item.id === button.dataset.md);
      if (entry) exportEntry(entry, "md");
    }
  });

  const savedDraft = safeJsonParse(localStorage.getItem(DRAFT_KEY), null);
  if (savedDraft) writeDraftFields(savedDraft);
  else writeDraftFields({ theme: "ember-rain", protocol: "rv001", shell: "f12", durationSec: 120, bodyCalm: 5, clarity: 5, imagery: 5, confidence: 5 });
  stopTimer();
  renderSeal();
  renderArchive();
})();
