(() => {
  const STORAGE_KEY = "runa-zener-lab.session.v1";
  const JOURNAL_KEY = "runa-zener-lab.journal.v1";

  const SYMBOLS = [
    { id: "circle", name: "Circle", mark: "○" },
    { id: "cross", name: "Cross", mark: "+" },
    { id: "waves", name: "Waves", mark: "≋" },
    { id: "square", name: "Square", mark: "□" },
    { id: "star", name: "Star", mark: "★" },
  ];
  const CONDITION_CHIPS = ["Silence", "Neutral Bed", "F10", "F12", "F15", "F33-ish"];

  const refs = {
    body: document.body,
    themeSelect: document.getElementById("themeSelect"),
    sessionLabelInput: document.getElementById("sessionLabelInput"),
    conditionLabelInput: document.getElementById("conditionLabelInput"),
    conditionChipRow: document.getElementById("conditionChipRow"),
    modeSelect: document.getElementById("modeSelect"),
    trialCountInput: document.getElementById("trialCountInput"),
    timeWindowSelect: document.getElementById("timeWindowSelect"),
    startSessionButton: document.getElementById("startSessionButton"),
    continueSessionButton: document.getElementById("continueSessionButton"),
    clearSessionButton: document.getElementById("clearSessionButton"),
    sessionStatus: document.getElementById("sessionStatus"),
    trialNumberDisplay: document.getElementById("trialNumberDisplay"),
    timerDisplay: document.getElementById("timerDisplay"),
    modeDisplay: document.getElementById("modeDisplay"),
    conditionDisplay: document.getElementById("conditionDisplay"),
    trialStatusText: document.getElementById("trialStatusText"),
    beginTrialButton: document.getElementById("beginTrialButton"),
    skipTrialButton: document.getElementById("skipTrialButton"),
    symbolGrid: document.getElementById("symbolGrid"),
    confidenceInput: document.getElementById("confidenceInput"),
    confidenceValue: document.getElementById("confidenceValue"),
    submitGuessButton: document.getElementById("submitGuessButton"),
    nextTrialButton: document.getElementById("nextTrialButton"),
    hitsDisplay: document.getElementById("hitsDisplay"),
    hitRateDisplay: document.getElementById("hitRateDisplay"),
    averageConfidenceDisplay: document.getElementById("averageConfidenceDisplay"),
    averageResponseTimeDisplay: document.getElementById("averageResponseTimeDisplay"),
    exportJsonButton: document.getElementById("exportJsonButton"),
    exportCsvButton: document.getElementById("exportCsvButton"),
    resultsTableBody: document.getElementById("resultsTableBody"),
    journalSection: document.getElementById("journalSection"),
    journalInput: document.getElementById("journalInput"),
    saveJournalButton: document.getElementById("saveJournalButton"),
    journalStatus: document.getElementById("journalStatus"),
  };

  const state = {
    theme: "nocturne-garden",
    sessionLabel: "",
    conditionLabel: "",
    mode: "hidden-target",
    trialCount: 25,
    timeWindowSec: 10,
    sessionId: null,
    targets: [],
    trials: [],
    currentIndex: 0,
    phase: "idle",
    selectedGuess: null,
    trialGateOpenedAt: null,
    revealResults: false,
  };

  let timerInterval = null;
  let timerEndsAt = null;

  function persistState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return false;
      Object.assign(state, parsed);
      return true;
    } catch {
      return false;
    }
  }

  function clearStoredState() {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function readJournal() {
    try { return window.localStorage.getItem(JOURNAL_KEY) || ""; } catch { return ""; }
  }

  function persistJournal(text) {
    try { window.localStorage.setItem(JOURNAL_KEY, text); } catch {}
  }

  function clearJournal() {
    try { window.localStorage.removeItem(JOURNAL_KEY); } catch {}
    if (refs.journalInput) refs.journalInput.value = "";
    if (refs.journalStatus) refs.journalStatus.textContent = "Reflection autosaves locally.";
  }

  function randomSymbolId() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id;
  }

  function escapeCell(value) {
    return String(value ?? "").replace(/"/g, '""');
  }

  function formatMs(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "0 ms";
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  }

  function formatSeconds(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
    const secs = String(safe % 60).padStart(2, "0");
    return `${minutes}:${secs}`;
  }

  function modeLabel(mode) {
    return { "hidden-target": "Hidden", "timed-impression": "Timed" }[mode] || mode;
  }

  function currentTarget() {
    return state.targets[state.currentIndex] || null;
  }

  function currentTrialNumber() {
    return Math.min(state.currentIndex + 1, state.targets.length || state.trialCount || 0);
  }

  function stopTimer() {
    if (timerInterval) { window.clearInterval(timerInterval); timerInterval = null; }
    timerEndsAt = null;
  }

  function syncInputsFromState() {
    refs.body.dataset.theme = state.theme;
    refs.themeSelect.value = state.theme;
    refs.sessionLabelInput.value = state.sessionLabel || "";
    refs.conditionLabelInput.value = state.conditionLabel || "";
    refs.modeSelect.value = state.mode || "hidden-target";
    refs.trialCountInput.value = String(state.trialCount || 25);
    refs.timeWindowSelect.value = String(state.timeWindowSec || 10);
    refs.confidenceInput.value = "3";
    refs.confidenceValue.textContent = "3 / 5";
  }

  function renderConditionChips() {
    refs.conditionChipRow.innerHTML = "";
    CONDITION_CHIPS.forEach((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `chip-button${state.conditionLabel === label ? " active" : ""}`;
      button.textContent = label;
      button.addEventListener("click", () => {
        state.conditionLabel = label;
        refs.conditionLabelInput.value = label;
        persistState();
        renderConditionChips();
        renderHeaderStats();
      });
      refs.conditionChipRow.appendChild(button);
    });
  }

  function renderSymbolButtons() {
    refs.symbolGrid.innerHTML = "";
    const lastTrial = state.phase === "revealed" && state.trials.length > 0
      ? state.trials[state.trials.length - 1]
      : null;
    const isSelectable = state.phase === "response";

    SYMBOLS.forEach((symbol) => {
      const isSelected = state.selectedGuess === symbol.id;
      let isFlipped = false;
      let backClass = "";
      let resultText = "";
      let resultDetail = "";

      if (lastTrial) {
        const wasGuessed = lastTrial.guess === symbol.id;
        const wasTarget = lastTrial.target === symbol.id;
        if (wasGuessed || wasTarget) {
          isFlipped = true;
          if (lastTrial.skipped) {
            if (wasTarget) { backClass = "is-target"; resultText = "Target"; resultDetail = "Skipped"; }
          } else if (wasGuessed && wasTarget) {
            backClass = "is-hit"; resultText = "Hit"; resultDetail = symbol.name;
          } else if (wasGuessed) {
            backClass = "is-miss"; resultText = "Miss"; resultDetail = symbol.name;
          } else if (wasTarget) {
            backClass = "is-target"; resultText = "Target"; resultDetail = symbol.name;
          }
        }
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = [
        "zener-card",
        isSelectable ? "is-selectable" : "",
        isSelected ? "is-selected" : "",
        isFlipped ? "is-flipped" : "",
      ].filter(Boolean).join(" ");
      button.disabled = !isSelectable;

      const inner = document.createElement("div");
      inner.className = "zener-card-inner";

      const front = document.createElement("div");
      front.className = "zener-card-face zener-card-front";
      const mark = document.createElement("div");
      mark.className = "zener-symbol";
      mark.textContent = symbol.mark;
      const name = document.createElement("div");
      name.className = "zener-name";
      name.textContent = symbol.name;
      front.append(mark, name);

      const back = document.createElement("div");
      back.className = ["zener-card-face", "zener-card-back", backClass].filter(Boolean).join(" ");
      const result = document.createElement("div");
      result.className = "zener-result";
      result.textContent = resultText;
      const detail = document.createElement("div");
      detail.className = "zener-result-detail";
      detail.textContent = resultDetail;
      back.append(result, detail);

      inner.append(front, back);
      button.appendChild(inner);

      if (isSelectable) {
        button.addEventListener("click", () => {
          state.selectedGuess = symbol.id;
          renderSymbolButtons();
          renderStatus();
        });
      }

      refs.symbolGrid.appendChild(button);
    });
  }

  function renderHeaderStats() {
    refs.trialNumberDisplay.textContent = `${state.targets.length ? currentTrialNumber() : 0} / ${state.targets.length || state.trialCount || 0}`;
    refs.modeDisplay.textContent = modeLabel(state.mode);
    refs.conditionDisplay.textContent = state.conditionLabel || "—";
  }

  function renderSummary() {
    const completed = state.trials.filter((t) => !t.skipped);
    const hits = completed.filter((t) => t.hit).length;
    const avgConfidence = completed.length ? completed.reduce((s, t) => s + t.confidence, 0) / completed.length : 0;
    const avgResponse = completed.length ? completed.reduce((s, t) => s + t.responseTimeMs, 0) / completed.length : 0;
    refs.hitsDisplay.textContent = String(hits);
    refs.hitRateDisplay.textContent = completed.length ? `${((hits / completed.length) * 100).toFixed(1)}%` : "0%";
    refs.averageConfidenceDisplay.textContent = avgConfidence ? avgConfidence.toFixed(2) : "0.0";
    refs.averageResponseTimeDisplay.textContent = formatMs(avgResponse);
  }

  function renderResultsTable() {
    refs.resultsTableBody.innerHTML = "";
    state.trials.forEach((trial) => {
      const targetMeta = SYMBOLS.find((s) => s.id === trial.target);
      const guessMeta = SYMBOLS.find((s) => s.id === trial.guess);
      const row = document.createElement("tr");
      if (trial.hit) row.className = "hit";
      const targetText = state.revealResults || state.phase === "complete"
        ? `${targetMeta?.mark || ""} ${targetMeta?.name || trial.target}`
        : "Hidden";
      row.innerHTML = `
        <td>${trial.index + 1}</td>
        <td>${targetText}</td>
        <td>${trial.skipped ? "Skipped" : `${guessMeta?.mark || ""} ${guessMeta?.name || trial.guess || "—"}`}</td>
        <td>${trial.skipped ? "—" : trial.hit ? "Yes" : "No"}</td>
        <td>${trial.skipped ? "—" : trial.confidence}</td>
        <td>${trial.skipped ? "—" : formatMs(trial.responseTimeMs)}</td>
      `;
      refs.resultsTableBody.appendChild(row);
    });
  }

  function renderStatus() {
    const total = state.targets.length;
    const completed = state.trials.length;
    const awaiting = total ? total - completed : 0;
    refs.sessionStatus.textContent = state.sessionId
      ? `Session ${state.sessionId} active. ${completed} logged, ${awaiting} remaining.`
      : "No active session yet.";

    if (state.phase === "idle") {
      refs.trialStatusText.textContent = "Start a session to generate hidden targets.";
    } else if (state.phase === "ready") {
      refs.trialStatusText.textContent = "Trial armed. Begin when ready.";
    } else if (state.phase === "waiting") {
      refs.trialStatusText.textContent = "Hold the impression window. Guessing unlocks when the countdown finishes.";
    } else if (state.phase === "response") {
      refs.trialStatusText.textContent = "Target remains hidden. Choose a symbol, rate confidence, and lock the guess.";
    } else if (state.phase === "revealed") {
      const lastTrial = state.trials[state.trials.length - 1];
      refs.trialStatusText.textContent = lastTrial?.skipped
        ? "Trial skipped. Click Next Card to continue."
        : lastTrial?.hit
        ? "Hit. Click Next Card to continue."
        : "Miss. Click Next Card to continue.";
    } else if (state.phase === "complete") {
      refs.trialStatusText.textContent = "Session complete. Results can now be reviewed or exported.";
    }

    refs.beginTrialButton.disabled = state.phase !== "ready" || !state.sessionId;
    refs.skipTrialButton.disabled = state.phase !== "response" && state.phase !== "waiting";
    refs.submitGuessButton.disabled = state.phase !== "response" || !state.selectedGuess;
    refs.nextTrialButton.disabled = state.phase !== "revealed";
    refs.exportJsonButton.disabled = state.trials.length === 0;
    refs.exportCsvButton.disabled = state.trials.length === 0;

    if (refs.journalSection) {
      refs.journalSection.classList.toggle("hidden", state.phase !== "complete");
    }

    renderSymbolButtons();
    renderHeaderStats();
    renderSummary();
    renderResultsTable();
  }

  function renderAll() {
    renderConditionChips();
    renderStatus();
  }

  function startSession() {
    state.sessionLabel = refs.sessionLabelInput.value.trim();
    state.conditionLabel = refs.conditionLabelInput.value.trim();
    state.mode = refs.modeSelect.value;
    state.trialCount = Math.max(1, Math.min(100, Number(refs.trialCountInput.value) || 25));
    state.timeWindowSec = Math.max(1, Number(refs.timeWindowSelect.value) || 10);
    state.sessionId = `zener-${Date.now()}`;
    state.targets = Array.from({ length: state.trialCount }, () => randomSymbolId());
    state.trials = [];
    state.currentIndex = 0;
    state.phase = "ready";
    state.selectedGuess = null;
    state.trialGateOpenedAt = null;
    state.revealResults = false;
    refs.confidenceInput.value = "3";
    refs.confidenceValue.textContent = "3 / 5";
    stopTimer();
    refs.timerDisplay.textContent = formatSeconds(state.timeWindowSec);
    clearJournal();
    persistState();
    renderAll();
  }

  function beginTrial() {
    if (!state.sessionId || state.phase === "complete") return;
    state.selectedGuess = null;
    refs.confidenceInput.value = "3";
    refs.confidenceValue.textContent = "3 / 5";

    if (state.mode === "timed-impression") {
      state.phase = "waiting";
      timerEndsAt = Date.now() + state.timeWindowSec * 1000;
      refs.timerDisplay.textContent = formatSeconds(state.timeWindowSec);
      stopTimer();
      timerInterval = window.setInterval(() => {
        const remainingMs = timerEndsAt - Date.now();
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        refs.timerDisplay.textContent = formatSeconds(remainingSec);
        if (remainingMs <= 0) {
          stopTimer();
          state.phase = "response";
          state.trialGateOpenedAt = Date.now();
          refs.timerDisplay.textContent = formatSeconds(0);
          persistState();
          renderAll();
        }
      }, 150);
    } else {
      state.phase = "response";
      state.trialGateOpenedAt = Date.now();
      refs.timerDisplay.textContent = "00:00";
    }

    persistState();
    renderAll();
  }

  function finalizeTrial({ skipped = false } = {}) {
    const target = currentTarget();
    if (!target) return;
    const confidence = Number(refs.confidenceInput.value) || 3;
    const guess = skipped ? null : state.selectedGuess;
    const responseTimeMs = skipped || !state.trialGateOpenedAt ? 0 : Date.now() - state.trialGateOpenedAt;

    state.trials.push({
      index: state.currentIndex,
      target,
      guess,
      hit: !skipped && guess === target,
      confidence,
      responseTimeMs,
      mode: state.mode,
      skipped,
    });

    state.currentIndex += 1;
    state.selectedGuess = null;
    state.trialGateOpenedAt = null;
    stopTimer();
    state.phase = "revealed";

    refs.confidenceInput.value = "3";
    refs.confidenceValue.textContent = "3 / 5";
    persistState();
    renderAll();
  }

  function exportJson() {
    const payload = {
      sessionId: state.sessionId,
      sessionLabel: state.sessionLabel,
      conditionLabel: state.conditionLabel,
      mode: state.mode,
      timeWindowSec: state.timeWindowSec,
      trialCount: state.trialCount,
      trials: state.trials,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${state.sessionId || "zener-session"}.json`);
  }

  function exportCsv() {
    const header = ["session_id", "session_label", "condition_label", "mode", "trial_index", "target", "guess", "hit", "confidence", "response_time_ms"];
    const rows = state.trials.map((trial) => [
      state.sessionId || "",
      state.sessionLabel || "",
      state.conditionLabel || "",
      state.mode || "",
      trial.index + 1,
      trial.target || "",
      trial.guess || "",
      trial.hit ? "1" : "0",
      trial.confidence ?? "",
      trial.responseTimeMs ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${escapeCell(cell)}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `${state.sessionId || "zener-session"}.csv`);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  refs.themeSelect.addEventListener("change", (event) => {
    state.theme = event.target.value;
    refs.body.dataset.theme = state.theme;
    persistState();
  });

  refs.conditionLabelInput.addEventListener("input", (event) => {
    state.conditionLabel = event.target.value;
    persistState();
    renderConditionChips();
    renderHeaderStats();
  });

  refs.modeSelect.addEventListener("change", (event) => {
    state.mode = event.target.value;
    persistState();
    renderAll();
  });

  refs.confidenceInput.addEventListener("input", (event) => {
    refs.confidenceValue.textContent = `${event.target.value} / 5`;
  });

  refs.startSessionButton.addEventListener("click", startSession);

  refs.continueSessionButton.addEventListener("click", () => {
    if (loadState()) {
      syncInputsFromState();
      refs.timerDisplay.textContent = formatSeconds(state.timeWindowSec || 10);
      if (refs.journalInput) refs.journalInput.value = readJournal();
      renderAll();
    }
  });

  refs.clearSessionButton.addEventListener("click", () => {
    stopTimer();
    clearStoredState();
    clearJournal();
    state.theme = refs.themeSelect.value || "nocturne-garden";
    state.sessionLabel = "";
    state.conditionLabel = "";
    state.mode = "hidden-target";
    state.trialCount = 25;
    state.timeWindowSec = 10;
    state.sessionId = null;
    state.targets = [];
    state.trials = [];
    state.currentIndex = 0;
    state.phase = "idle";
    state.selectedGuess = null;
    state.trialGateOpenedAt = null;
    state.revealResults = false;
    syncInputsFromState();
    refs.timerDisplay.textContent = "00:00";
    renderAll();
  });

  refs.beginTrialButton.addEventListener("click", beginTrial);
  refs.skipTrialButton.addEventListener("click", () => finalizeTrial({ skipped: true }));
  refs.submitGuessButton.addEventListener("click", () => finalizeTrial({ skipped: false }));

  refs.nextTrialButton.addEventListener("click", () => {
    if (state.phase !== "revealed") return;
    if (state.currentIndex >= state.targets.length) {
      state.phase = "complete";
      state.revealResults = true;
    } else {
      state.phase = "ready";
    }
    persistState();
    renderAll();
  });

  refs.exportJsonButton.addEventListener("click", exportJson);
  refs.exportCsvButton.addEventListener("click", exportCsv);

  if (refs.journalInput) {
    refs.journalInput.addEventListener("input", () => {
      persistJournal(refs.journalInput.value);
      if (refs.journalStatus) refs.journalStatus.textContent = "Saved.";
    });
  }
  if (refs.saveJournalButton) {
    refs.saveJournalButton.addEventListener("click", () => {
      persistJournal(refs.journalInput?.value || "");
      if (refs.journalStatus) refs.journalStatus.textContent = "Saved.";
    });
  }

  if (loadState()) {
    syncInputsFromState();
    refs.timerDisplay.textContent = state.phase === "idle" ? "00:00" : formatSeconds(state.timeWindowSec || 10);
    if (refs.journalInput) refs.journalInput.value = readJournal();
  } else {
    syncInputsFromState();
    refs.timerDisplay.textContent = "00:00";
  }
  renderAll();
})();
