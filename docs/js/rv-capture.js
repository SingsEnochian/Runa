(() => {
  const STORAGE_KEY = "runa-rv-capture.session.v1";

  const refs = {
    body: document.body,
    themeSelect: document.getElementById("themeSelect"),
    sessionLabelInput: document.getElementById("sessionLabelInput"),
    targetIdInput: document.getElementById("targetIdInput"),
    conditionLabelInput: document.getElementById("conditionLabelInput"),
    protocolSelect: document.getElementById("protocolSelect"),
    shellSelect: document.getElementById("shellSelect"),
    durationSelect: document.getElementById("durationSelect"),
    startTimerButton: document.getElementById("startTimerButton"),
    stopTimerButton: document.getElementById("stopTimerButton"),
    clearFormButton: document.getElementById("clearFormButton"),
    sessionStatus: document.getElementById("sessionStatus"),
    timerDisplay: document.getElementById("timerDisplay"),
    protocolDisplay: document.getElementById("protocolDisplay"),
    shellDisplay: document.getElementById("shellDisplay"),
    targetDisplay: document.getElementById("targetDisplay"),
    shapesInput: document.getElementById("shapesInput"),
    texturesInput: document.getElementById("texturesInput"),
    motionInput: document.getElementById("motionInput"),
    colourInput: document.getElementById("colourInput"),
    atmosphereInput: document.getElementById("atmosphereInput"),
    sketchNotesInput: document.getElementById("sketchNotesInput"),
    interpretationInput: document.getElementById("interpretationInput"),
    bodyCalmInput: document.getElementById("bodyCalmInput"),
    clarityInput: document.getElementById("clarityInput"),
    imageryInput: document.getElementById("imageryInput"),
    confidenceInput: document.getElementById("confidenceInput"),
    bodyCalmValue: document.getElementById("bodyCalmValue"),
    clarityValue: document.getElementById("clarityValue"),
    imageryValue: document.getElementById("imageryValue"),
    confidenceValue: document.getElementById("confidenceValue"),
    postNotesInput: document.getElementById("postNotesInput"),
    exportJsonButton: document.getElementById("exportJsonButton"),
    exportMarkdownButton: document.getElementById("exportMarkdownButton"),
  };

  const state = {
    theme: "ember-rain",
    timerRemainingSec: 0,
    timerRunning: false,
  };

  let timerInterval = null;
  let timerEndsAt = null;

  function formatSeconds(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
    const secs = String(safe % 60).padStart(2, "0");
    return `${minutes}:${secs}`;
  }

  function readAllFields() {
    return {
      theme: refs.themeSelect.value,
      sessionLabel: refs.sessionLabelInput.value.trim(),
      targetId: refs.targetIdInput.value.trim(),
      conditionLabel: refs.conditionLabelInput.value.trim(),
      protocol: refs.protocolSelect.value,
      shell: refs.shellSelect.value,
      durationSec: Number(refs.durationSelect.value) || 120,
      shapes: refs.shapesInput.value.trim(),
      textures: refs.texturesInput.value.trim(),
      motion: refs.motionInput.value.trim(),
      colours: refs.colourInput.value.trim(),
      atmosphere: refs.atmosphereInput.value.trim(),
      sketchNotes: refs.sketchNotesInput.value.trim(),
      interpretation: refs.interpretationInput.value.trim(),
      bodyCalm: Number(refs.bodyCalmInput.value) || 0,
      clarity: Number(refs.clarityInput.value) || 0,
      imagery: Number(refs.imageryInput.value) || 0,
      confidence: Number(refs.confidenceInput.value) || 0,
      postNotes: refs.postNotesInput.value.trim(),
      timerRemainingSec: state.timerRemainingSec,
      timerRunning: state.timerRunning,
    };
  }

  function persistState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(readAllFields()));
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return;
      refs.themeSelect.value = saved.theme || "ember-rain";
      refs.body.dataset.theme = refs.themeSelect.value;
      refs.sessionLabelInput.value = saved.sessionLabel || "";
      refs.targetIdInput.value = saved.targetId || "";
      refs.conditionLabelInput.value = saved.conditionLabel || "";
      refs.protocolSelect.value = saved.protocol || "rv001";
      refs.shellSelect.value = saved.shell || "f12";
      refs.durationSelect.value = String(saved.durationSec || 120);
      refs.shapesInput.value = saved.shapes || "";
      refs.texturesInput.value = saved.textures || "";
      refs.motionInput.value = saved.motion || "";
      refs.colourInput.value = saved.colours || "";
      refs.atmosphereInput.value = saved.atmosphere || "";
      refs.sketchNotesInput.value = saved.sketchNotes || "";
      refs.interpretationInput.value = saved.interpretation || "";
      refs.bodyCalmInput.value = String(saved.bodyCalm ?? 5);
      refs.clarityInput.value = String(saved.clarity ?? 5);
      refs.imageryInput.value = String(saved.imagery ?? 5);
      refs.confidenceInput.value = String(saved.confidence ?? 5);
      refs.postNotesInput.value = saved.postNotes || "";
      state.theme = refs.themeSelect.value;
      state.timerRemainingSec = Number(saved.timerRemainingSec) || Number(refs.durationSelect.value) || 120;
      state.timerRunning = false;
    } catch {
      // ignore restore failures
    }
  }

  function updateMetricReadouts() {
    refs.bodyCalmValue.textContent = `${refs.bodyCalmInput.value} / 10`;
    refs.clarityValue.textContent = `${refs.clarityInput.value} / 10`;
    refs.imageryValue.textContent = `${refs.imageryInput.value} / 10`;
    refs.confidenceValue.textContent = `${refs.confidenceInput.value} / 10`;
  }

  function renderHeaderStats() {
    refs.protocolDisplay.textContent = refs.protocolSelect.value.toUpperCase();
    refs.shellDisplay.textContent = refs.shellSelect.value.toUpperCase();
    refs.targetDisplay.textContent = refs.targetIdInput.value.trim() || "—";
    refs.timerDisplay.textContent = formatSeconds(state.timerRemainingSec || Number(refs.durationSelect.value) || 120);
    refs.sessionStatus.textContent = state.timerRunning
      ? "Timer running. Keep the raw material raw before you interpret it."
      : "Capture fields autosave locally in this browser.";
  }

  function stopTimer() {
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
    timerEndsAt = null;
    state.timerRunning = false;
    persistState();
    renderHeaderStats();
  }

  function startTimer() {
    stopTimer();
    state.timerRemainingSec = Number(refs.durationSelect.value) || 120;
    state.timerRunning = true;
    timerEndsAt = Date.now() + state.timerRemainingSec * 1000;
    renderHeaderStats();
    persistState();

    timerInterval = window.setInterval(() => {
      const remainingMs = timerEndsAt - Date.now();
      state.timerRemainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      refs.timerDisplay.textContent = formatSeconds(state.timerRemainingSec);
      if (remainingMs <= 0) {
        stopTimer();
      }
    }, 150);
  }

  function clearForm() {
    stopTimer();
    window.localStorage.removeItem(STORAGE_KEY);
    refs.sessionLabelInput.value = "";
    refs.targetIdInput.value = "";
    refs.conditionLabelInput.value = "";
    refs.protocolSelect.value = "rv001";
    refs.shellSelect.value = "f12";
    refs.durationSelect.value = "120";
    refs.shapesInput.value = "";
    refs.texturesInput.value = "";
    refs.motionInput.value = "";
    refs.colourInput.value = "";
    refs.atmosphereInput.value = "";
    refs.sketchNotesInput.value = "";
    refs.interpretationInput.value = "";
    refs.bodyCalmInput.value = "5";
    refs.clarityInput.value = "5";
    refs.imageryInput.value = "5";
    refs.confidenceInput.value = "5";
    refs.postNotesInput.value = "";
    state.timerRemainingSec = 120;
    updateMetricReadouts();
    renderHeaderStats();
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    const payload = {
      ...readAllFields(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${payload.sessionLabel || payload.targetId || "rv-capture"}.json`);
  }

  function exportMarkdown() {
    const data = readAllFields();
    const lines = [
      `# ${data.sessionLabel || "RV Capture Session"}`,
      "",
      `- Target ID: ${data.targetId || "—"}`,
      `- Protocol: ${data.protocol}`,
      `- Shell: ${data.shell}`,
      `- Condition: ${data.conditionLabel || "—"}`,
      `- Timer: ${data.durationSec}s`,
      "",
      "## Raw Capture",
      "",
      `### Shapes / structure\n${data.shapes || "—"}`,
      "",
      `### Textures / surfaces\n${data.textures || "—"}`,
      "",
      `### Temperature / movement\n${data.motion || "—"}`,
      "",
      `### Colours / light\n${data.colours || "—"}`,
      "",
      `### Atmosphere / emotional tone\n${data.atmosphere || "—"}`,
      "",
      `### Sketch notes / layout\n${data.sketchNotes || "—"}`,
      "",
      `### Interpretive guess\n${data.interpretation || "—"}`,
      "",
      "## Metrics",
      "",
      `- Body calm: ${data.bodyCalm}/10`,
      `- Clarity: ${data.clarity}/10`,
      `- Imagery density: ${data.imagery}/10`,
      `- Confidence: ${data.confidence}/10`,
      "",
      "## Post-session notes",
      "",
      data.postNotes || "—",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, `${data.sessionLabel || data.targetId || "rv-capture"}.md`);
  }

  refs.themeSelect.addEventListener("change", (event) => {
    state.theme = event.target.value;
    refs.body.dataset.theme = state.theme;
    persistState();
  });

  [
    refs.sessionLabelInput,
    refs.targetIdInput,
    refs.conditionLabelInput,
    refs.protocolSelect,
    refs.shellSelect,
    refs.durationSelect,
    refs.shapesInput,
    refs.texturesInput,
    refs.motionInput,
    refs.colourInput,
    refs.atmosphereInput,
    refs.sketchNotesInput,
    refs.interpretationInput,
    refs.postNotesInput,
  ].forEach((element) => {
    element.addEventListener("input", () => {
      renderHeaderStats();
      persistState();
    });
    element.addEventListener("change", () => {
      renderHeaderStats();
      persistState();
    });
  });

  [refs.bodyCalmInput, refs.clarityInput, refs.imageryInput, refs.confidenceInput].forEach((slider) => {
    slider.addEventListener("input", () => {
      updateMetricReadouts();
      persistState();
    });
  });

  refs.startTimerButton.addEventListener("click", startTimer);
  refs.stopTimerButton.addEventListener("click", stopTimer);
  refs.clearFormButton.addEventListener("click", clearForm);
  refs.exportJsonButton.addEventListener("click", exportJson);
  refs.exportMarkdownButton.addEventListener("click", exportMarkdown);

  loadState();
  updateMetricReadouts();
  renderHeaderStats();
})();