(() => {
  const STORAGE_KEY = "runa-zener-lab.session.v1";
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
    revealResultsButton: document.getElementById("revealResultsButton"),
    firstImpressionLabel: document.getElementById("firstImpressionLabel"),
    firstImpressionInput: document.getElementById("firstImpressionInput"),
    symbolGrid: document.getElementById("symbolGrid"),
    confidenceInput: document.getElementById("confidenceInput"),
    confidenceValue: document.getElementById("confidenceValue"),
    notesInput: document.getElementById("notesInput"),
    submitGuessButton: document.getElementById("submitGuessButton"),
    nextTrialButton: document.getElementById("nextTrialButton"),
    hitsDisplay: document.getElementById("hitsDisplay"),
    hitRateDisplay: document.getElementById("hitRateDisplay"),
    averageConfidenceDisplay: document.getElementById("averageConfidenceDisplay"),
    averageResponseTimeDisplay: document.getElementById("averageResponseTimeDisplay"),
    exportJsonButton: document.getElementById("exportJsonButton"),
    exportCsvButton: document.getElementById("exportCsvButton"),
    resultsTableBody: document.getElementById("resultsTableBody"),
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
    return {
      "hidden-target": "Hidden",
      "timed-impression": "Timed",
      "image-first": "Image-First",
    }[mode] || mode;
  }

  function currentTarget() {
    return state.targets[state.currentIndex] || null;
  }

  function currentTrialNumber() {
    return Math.min(state.currentIndex + 1, state.targets.length || state.trialCount || 0);
  }

  function stopTimer() {
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
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
    SYMBOLS.forEach((symbol) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `symbol-button${state.selectedGuess === symbol.id ? " active" : ""}`;
      button.disabled = state.phase !== "response";
      button.addEventListener("click", () => {
        state.selectedGuess = symbol.id;
        renderSymbolButtons();
      });

      const mark = document.createElement("div");
      mark.className = "symbol-mark";
      mark.textContent = symbol.mark;
      const name = document.createElement("div");
      name.className = "symbol-name";
      name.textContent = symbol.name;
      button.append(mark, name);
      refs.symbolGrid.appendChild(button);
    });
  }

  function renderHeaderStats() {
    refs.trialNumberDisplay.textContent = `${state.targets.length ? currentTrialNumber() : 0} / ${state.targets.length || state.trialCount || 0}`;
    refs.modeDisplay.textContent = modeLabel(state.mode);
    refs.conditionDisplay.textContent = state.conditionLabel || "—";
  }

  function renderSummary() {
    const completed = state.trials.filter((trial) => !trial.skipped);
    const hits = completed.filter((trial) => trial.hit).length;
    const avgConfidence = completed.length ? completed.reduce((sum, trial) => sum + trial.confidence, 0) / completed.length : 0;
    const avgResponse = completed.length ? completed.reduce((sum, trial) => sum + trial.responseTimeMs, 0) / completed.length : 0;
    refs.hitsDisplay.textContent = String(hits);
    refs.hitRateDisplay.textContent = completed.length ? `${((hits / completed.length) * 100).toFixed(1)}%` : "0%";
    refs.averageConfidenceDisplay.textContent = avgConfidence ? avgConfidence.toFixed(2) : "0.0";
    refs.averageResponseTimeDisplay.textContent = formatMs(avgResponse);
  }

  function renderResultsTable() {
    refs.resultsTableBody.innerHTML = "";
    state.trials.forEach((trial) => {
      const targetMeta = SYMBOLS.find((symbol) => symbol.id === trial.target);
      const guessMeta = SYMBOLS.find((symbol) => symbol.id === trial.guess);
      const row = document.createElement("tr");
      if (trial.hit) row.className = "hit";
      const targetText = state.revealResults || state.phase === "complete" ? `${targetMeta?.mark || ""} ${targetMeta?.name || trial.target}` : "Hidden";
      row.innerHTML = `
        <td>${trial.index + 1}</td>
        <td>${targetText}</td>
        <td>${trial.skipped ? "Skipped" : `${guessMeta?.mark || ""} ${guessMeta?.name || trial.guess || "—"}`}</td>
        <td>${trial.skipped ? "—" : trial.hit ? "Yes" : "No"}</td>
        <td>${trial.skipped ? "—" : trial.confidence}</td>
        <td>${trial.skipped ? "—" : formatMs(trial.responseTimeMs)}</td>
        <td>${trial.firstImpression ? `<code>${trial.firstImpression}</code>` : "—"}</td>
        <td>${trial.notes ? `<code>${trial.notes}</code>` : "—"}</td>
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
    } else if (state.phase === "complete") {
      refs.trialStatusText.textContent = "Session complete. Results can now be reviewed or exported.";
    }

    refs.beginTrialButton.disabled = !(state.phase === "ready" || state.phase === "idle" || state.phase === "complete") || !state.sessionId || state.phase === "complete";
    refs.skipTrialButton.disabled = state.phase !== "response" && state.phase !== "waiting";
    refs.submitGuessButton.disabled = state.phase !== "response" || !state.selectedGuess;
    refs.nextTrialButton.disabled = state.phase !== "ready" || state.currentIndex >= state.targets.length;
    refs.revealResultsButton.disabled = state.trials.length === 0;
    refs.revealResultsButton.textContent = state.revealResults ? "Hide Results" : "Reveal Results";
    refs.exportJsonButton.disabled = state.trials.length === 0;
    refs.exportCsvButton.disabled = state.trials.length === 0;
    refs.firstImpressionLabel.classList.toggle("hidden", state.mode === "hidden-target");
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
    refs.notesInput.value = "";
    refs.firstImpressionInput.value = "";
    refs.confidenceInput.value = "3";
    refs.confidenceValue.textContent = "3 / 5";
    stopTimer();
    refs.timerDisplay.textContent = formatSeconds(state.timeWindowSec);
    persistState();
    renderAll();
  }

  function beginTrial() {
    if (!state.sessionId || state.phase === "complete") return;
    state.selectedGuess = null;
    refs.notesInput.value = "";
    refs.firstImpressionInput.value = "";
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
      refs.timerDisplay.textContent = state.mode === "image-first" ? formatSeconds(state.timeWindowSec) : "00:00";
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
    const firstImpression = refs.firstImpressionInput.value.trim();
    const notes = refs.notesInput.value.trim();

    state.trials.push({
      index: state.currentIndex,
      target,
      guess,
      hit: !skipped && guess === target,
      confidence,
      firstImpression,
      notes,
      responseTimeMs,
      mode: state.mode,
      skipped,
    });

    state.currentIndex += 1;
    state.selectedGuess = null;
    state.trialGateOpenedAt = null;
    stopTimer();

    if (state.currentIndex >= state.targets.length) {
      state.phase = "complete";
      state.revealResults = true;
      refs.timerDisplay.textContent = "00:00";
    } else {
      state.phase = "ready";
      refs.timerDisplay.textContent = formatSeconds(state.timeWindowSec);
    }

    refs.notesInput.value = "";
    refs.firstImpressionInput.value = "";
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
    const header = ["session_id","session_label","condition_label","mode","trial_index","target","guess","hit","confidence","response_time_ms","first_impression","notes"];
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
      trial.firstImpression || "",
      trial.notes || "",
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
      renderAll();
    }
  });
  refs.clearSessionButton.addEventListener("click", () => {
    stopTimer();
    clearStoredState();
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
    refs.notesInput.value = "";
    refs.firstImpressionInput.value = "";
    renderAll();
  });
  refs.beginTrialButton.addEventListener("click", beginTrial);
  refs.skipTrialButton.addEventListener("click", () => finalizeTrial({ skipped: true }));
  refs.submitGuessButton.addEventListener("click", () => finalizeTrial({ skipped: false }));
  refs.nextTrialButton.addEventListener("click", () => {
    if (state.phase === "ready") beginTrial();
  });
  refs.revealResultsButton.addEventListener("click", () => {
    state.revealResults = !state.revealResults;
    persistState();
    renderResultsTable();
    renderStatus();
  });
  refs.exportJsonButton.addEventListener("click", exportJson);
  refs.exportCsvButton.addEventListener("click", exportCsv);

  if (loadState()) {
    syncInputsFromState();
    refs.timerDisplay.textContent = state.phase === "idle" ? "00:00" : formatSeconds(state.timeWindowSec || 10);
  } else {
    syncInputsFromState();
    refs.timerDisplay.textContent = "00:00";
  }
  renderAll();
})();