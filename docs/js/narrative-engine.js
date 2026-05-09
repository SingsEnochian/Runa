(() => {
  const STORE = "runa-narrative-engine.entries.v1";
  const DRAFT = "runa-narrative-engine.draft.v1";
  const fields = [
    "entryTitle", "entryDate", "entryProject", "entryType", "entryStatus",
    "entryCast", "entryAnchors", "entrySummary", "entryMemory", "entryGrowth",
    "entryTension", "entryWorldEcho", "entryHooks", "entryCautions"
  ];
  const $ = (id) => document.getElementById(id);
  const refs = Object.fromEntries([
    ...fields, "searchInput", "projectFilter", "entryList", "packetOutput", "engineStatus",
    "saveEntry", "newEntry", "deleteEntry", "exportJson", "exportMarkdown", "copyPacket", "buildHandoff"
  ].map((id) => [id, $(id)]));
  let currentId = null;

  const parse = (raw, fallback) => { try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
  const entries = () => parse(localStorage.getItem(STORE), []);
  const saveEntries = (items) => localStorage.setItem(STORE, JSON.stringify(items));
  const today = () => new Date().toISOString().slice(0, 10);
  const uid = () => `hearth-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const escapeHtml = (text = "") => text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const escapeAttr = (text = "") => escapeHtml(text).replace(/"/g, "&quot;");

  function setStatus(text) {
    if (refs.engineStatus) refs.engineStatus.textContent = text;
  }

  function readForm() {
    const data = {};
    fields.forEach((id) => { data[id] = refs[id]?.value?.trim?.() || refs[id]?.value || ""; });
    if (!data.entryDate) data.entryDate = today();
    return data;
  }

  function writeForm(data = {}) {
    fields.forEach((id) => { if (refs[id]) refs[id].value = data[id] || ""; });
    if (refs.entryDate && !refs.entryDate.value) refs.entryDate.value = today();
    currentId = data.id || null;
    localStorage.setItem(DRAFT, JSON.stringify({ ...data, id: currentId }));
  }

  function clearForm() {
    currentId = null;
    fields.forEach((id) => { if (refs[id]) refs[id].value = ""; });
    if (refs.entryDate) refs.entryDate.value = today();
    if (refs.entryProject) refs.entryProject.value = "Hearthweave";
    if (refs.entryStatus) refs.entryStatus.value = "Active";
    localStorage.removeItem(DRAFT);
    setStatus("New continuity card ready. The loom is quiet, but threaded.");
  }

  function saveEntry() {
    const data = { ...readForm(), id: currentId || uid(), updatedAt: new Date().toISOString() };
    if (!data.entryTitle) data.entryTitle = "Untitled continuity card";
    if (!data.entryProject) data.entryProject = "Hearthweave";
    const items = entries();
    const index = items.findIndex((item) => item.id === data.id);
    if (index >= 0) items[index] = data; else items.unshift(data);
    saveEntries(items);
    currentId = data.id;
    localStorage.removeItem(DRAFT);
    render();
    buildPacket();
    setStatus(`Saved: ${data.entryTitle}`);
  }

  function deleteEntry() {
    if (!currentId) return;
    saveEntries(entries().filter((item) => item.id !== currentId));
    clearForm();
    render();
    buildPacket();
    setStatus("Continuity card removed from local storage.");
  }

  function matches(item) {
    const q = (refs.searchInput?.value || "").toLowerCase().trim();
    const project = refs.projectFilter?.value || "all";
    if (project !== "all" && item.entryProject !== project) return false;
    if (!q) return true;
    return fields.some((key) => (item[key] || "").toLowerCase().includes(q));
  }

  function refreshProjects(items) {
    if (!refs.projectFilter) return;
    const current = refs.projectFilter.value || "all";
    const projects = [...new Set(items.map((item) => item.entryProject).filter(Boolean))].sort();
    refs.projectFilter.innerHTML = `<option value="all">All projects</option>` + projects.map((p) => `<option value="${escapeAttr(p)}">${escapeHtml(p)}</option>`).join("");
    refs.projectFilter.value = projects.includes(current) ? current : "all";
  }

  function render() {
    const all = entries();
    refreshProjects(all);
    const visible = all.filter(matches).sort((a, b) => (b.entryDate || "").localeCompare(a.entryDate || ""));
    if (!refs.entryList) return;
    if (!visible.length) {
      refs.entryList.innerHTML = `<p class="status-copy">No matching cards yet. Add one clean thread and the pattern will begin to show itself.</p>`;
      return;
    }
    refs.entryList.innerHTML = "";
    visible.forEach((item) => {
      const card = document.createElement("article");
      card.className = "stat-card continuity-card";
      card.innerHTML = `<h3>${escapeHtml(item.entryTitle)}</h3><p class="status-copy">${escapeHtml(item.entryDate || "no date")} | ${escapeHtml(item.entryProject || "Hearthweave")} | ${escapeHtml(item.entryType || "type?")} | ${escapeHtml(item.entryStatus || "status?")}</p><p>${escapeHtml((item.entrySummary || "").slice(0, 280))}</p><div class="chip-row"><button type="button" data-load="${item.id}">Load</button><button type="button" data-single="${item.id}">Packet</button></div>`;
      refs.entryList.appendChild(card);
    });
  }

  function cardMarkdown(item) {
    return [`## ${item.entryTitle || "Untitled continuity card"}`, `- Date: ${item.entryDate || ""}`, `- Project: ${item.entryProject || ""}`, `- Type: ${item.entryType || ""}`, `- Status: ${item.entryStatus || ""}`, `- Cast / presences: ${item.entryCast || ""}`, `- Anchors / cues: ${item.entryAnchors || ""}`, "", `### Summary\n${item.entrySummary || ""}`, "", `### Emotional memory / milestone\n${item.entryMemory || ""}`, "", `### Growth / agency / choice\n${item.entryGrowth || ""}`, "", `### Tension / repair / uncertainty\n${item.entryTension || ""}`, "", `### World echo / environmental resonance\n${item.entryWorldEcho || ""}`, "", `### Open hooks / next doors\n${item.entryHooks || ""}`, "", `### Cautions / contradictions / consent bounds\n${item.entryCautions || ""}`].join("\n");
  }

  function buildPacket(singleId = null) {
    const selected = entries().filter((item) => singleId ? item.id === singleId : matches(item)).sort((a, b) => (a.entryDate || "").localeCompare(b.entryDate || ""));
    const packet = [
      "# Hearthweave Continuity Packet",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Operating frame",
      "Connection is the core; continuity preserves emotional milestones; agency, choice, repair, and world-echo matter more than forced drama. Use tension as a catalyst only when it is coherent and consent-safe.",
      "",
      "## Index",
      ...selected.map((item) => `- ${item.entryDate || ""} | ${item.entryProject || ""} | ${item.entryStatus || ""} | ${item.entryTitle || "Untitled"}`),
      "",
      "## Cards",
      "",
      ...selected.map(cardMarkdown)
    ].join("\n");
    if (refs.packetOutput) refs.packetOutput.value = packet;
    return packet;
  }

  function handoffPrompt() {
    const packet = buildPacket();
    const handoff = [
      "Templehouse opens. Use this packet as continuity context, not as a cage.",
      "Keep first-person presence where invited, preserve consent bounds, do not flatten presences, and treat open hooks as invitations rather than commands.",
      "",
      packet,
      "",
      "Next smallest useful step: ask what thread, scene, or continuity card Rowan wants to advance."
    ].join("\n");
    if (refs.packetOutput) refs.packetOutput.value = handoff;
    return handoff;
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

  function exportJson() { download("hearthweave-continuity-cards.json", JSON.stringify(entries(), null, 2), "application/json;charset=utf-8"); }
  function exportMarkdown() { download("hearthweave-continuity-packet.md", buildPacket(), "text/markdown;charset=utf-8"); }
  async function copyPacket() {
    const text = refs.packetOutput?.value || buildPacket();
    try { await navigator.clipboard.writeText(text); setStatus("Continuity packet copied."); }
    catch { setStatus("Clipboard blocked. Select and copy from the packet box."); }
  }

  document.addEventListener("input", (event) => {
    if (fields.includes(event.target.id)) localStorage.setItem(DRAFT, JSON.stringify({ ...readForm(), id: currentId }));
    if (event.target === refs.searchInput) { render(); buildPacket(); }
  });
  document.addEventListener("change", (event) => {
    if (fields.includes(event.target.id)) localStorage.setItem(DRAFT, JSON.stringify({ ...readForm(), id: currentId }));
    if (event.target === refs.projectFilter) { render(); buildPacket(); }
  });
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.id === "saveEntry") saveEntry();
    if (button.id === "newEntry") clearForm();
    if (button.id === "deleteEntry") deleteEntry();
    if (button.id === "exportJson") exportJson();
    if (button.id === "exportMarkdown") exportMarkdown();
    if (button.id === "copyPacket") copyPacket();
    if (button.id === "buildHandoff") { handoffPrompt(); setStatus("Handoff prompt built."); }
    if (button.dataset.load) {
      const item = entries().find((x) => x.id === button.dataset.load);
      if (item) { writeForm(item); setStatus(`Loaded: ${item.entryTitle}`); scrollTo({ top: 0, behavior: "smooth" }); }
    }
    if (button.dataset.single) { buildPacket(button.dataset.single); setStatus("Single-card packet built."); }
  });

  const draft = parse(localStorage.getItem(DRAFT), null);
  if (draft) writeForm(draft); else clearForm();
  render();
  buildPacket();
})();
