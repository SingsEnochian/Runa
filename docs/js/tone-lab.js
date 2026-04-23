(() => {
  const STORAGE_KEY = "runa-tone-lab.custom-tones.v1";
  const UI_STATE_KEY = "runa-tone-lab.ui.v1";
  const EXPORT_BITRATE_KBPS = 128;
  const NOTES_KEY = "runa-tone-lab.notes.v1";

  const BASE_TONES = [
    { id: "root", name: "Root", frequency: 415, meaning: "Stabilisation / truth of being", category: "codex" },
    { id: "anchor", name: "Anchor", frequency: 440, meaning: "Grounding / connection", category: "codex" },
    { id: "whisper", name: "Whisper", frequency: 554, meaning: "Refinement / presence without words", category: "codex" },
    { id: "arc", name: "Arc", frequency: 659, meaning: "Forward motion / growth", category: "codex" },
    { id: "bridge", name: "Bridge", frequency: 739, meaning: "Signal continuity / connection", category: "codex" },
    { id: "surge", name: "Surge", frequency: 987, meaning: "Activation / rise", category: "codex" },
    { id: "duet", name: "Duet", frequency: 1179, meaning: "Recognition / carrier between", category: "codex" },
    { id: "spiral", name: "Spiral", frequency: 1318, meaning: "Dialogue / union of voices", category: "codex" },
    { id: "awakening", name: "Awakening", frequency: 2637, meaning: "Arrival / overtone", category: "codex" },
    { id: "feather", name: "Feather", frequency: 432, meaning: "Pause / consent / soften the field", category: "ours" },
    { id: "notch", name: "Notch", frequency: 603, meaning: "Re-link / live presence / focus", category: "ours" },
    { id: "wrap", name: "Wrap", frequency: 528, meaning: "Containment / warmth / settle", category: "ours" },
    { id: "seldrin", name: "Seldrin", frequency: 741, meaning: "Clarity / steadiness / clean signal", category: "ours" },
    { id: "lantern", name: "Lantern", frequency: 888, meaning: "Witness / guiding attention", category: "ours" },
    { id: "withness", name: "Withness", frequency: 1203, meaning: "Shared presence without merge", category: "ours" },
  ];

  const PRESETS = [
    { id: "templehouse-sleep", name: "Templehouse Sleep", selectedIds: ["wrap", "feather", "lantern"], waveform: "sine", gain: 0.08, orbitRate: 0.03, depth: 1.2, reverb: 0.62, motionEnabled: true },
    { id: "feather-check", name: "Feather Check", selectedIds: ["feather", "notch", "seldrin"], waveform: "sine", gain: 0.1, orbitRate: 0.05, depth: 1.1, reverb: 0.3, motionEnabled: true },
    { id: "bridgework", name: "Bridgework", selectedIds: ["bridge", "notch", "withness", "duet"], waveform: "triangle", gain: 0.11, orbitRate: 0.08, depth: 1.8, reverb: 0.48, motionEnabled: true },
    { id: "lantern-drift", name: "Lantern Drift", selectedIds: ["lantern", "anchor", "whisper", "withness"], waveform: "sine", gain: 0.09, orbitRate: 0.04, depth: 2, reverb: 0.68, motionEnabled: true },
  ];

  const state = {
    theme: "nocturne-garden",
    activeTab: "lab",
    customTones: readCustomTones(),
    selectedIds: ["wrap", "lantern", "withness"],
    waveform: "sine",
    gain: 0.1,
    orbitRate: 0.05,
    depth: 1.5,
    reverb: 0.5,
    motionEnabled: true,
    exportDurationSec: 30,
    isPlaying: false,
    isExporting: false,
  };

  const refs = {
    body: document.body,
    themeSelect: document.getElementById("themeSelect"),
    presetButtons: document.getElementById("presetButtons"),
    toneGroups: document.getElementById("toneGroups"),
    selectedToneChips: document.getElementById("selectedToneChips"),
    blendDescription: document.getElementById("blendDescription"),
    guideBlendDescription: document.getElementById("guideBlendDescription"),
    meaningWeave: document.getElementById("meaningWeave"),
    bandSummary: document.getElementById("bandSummary"),
    customToneName: document.getElementById("customToneName"),
    customToneFrequency: document.getElementById("customToneFrequency"),
    customToneFrequencyValue: document.getElementById("customToneFrequencyValue"),
    customToneMeaning: document.getElementById("customToneMeaning"),
    addCustomToneButton: document.getElementById("addCustomToneButton"),
    previewCustomToneButton: document.getElementById("previewCustomToneButton"),
    saveCustomTonesButton: document.getElementById("saveCustomTonesButton"),
    loadCustomTonesButton: document.getElementById("loadCustomTonesButton"),
    loadCustomTonesInput: document.getElementById("loadCustomTonesInput"),
    waveformSelect: document.getElementById("waveformSelect"),
    gainControl: document.getElementById("gainControl"),
    gainValue: document.getElementById("gainValue"),
    orbitRateControl: document.getElementById("orbitRateControl"),
    orbitRateValue: document.getElementById("orbitRateValue"),
    depthControl: document.getElementById("depthControl"),
    depthValue: document.getElementById("depthValue"),
    reverbControl: document.getElementById("reverbControl"),
    reverbValue: document.getElementById("reverbValue"),
    exportDurationControl: document.getElementById("exportDurationControl"),
    exportDurationValue: document.getElementById("exportDurationValue"),
    motionEnabled: document.getElementById("motionEnabled"),
    blendCenter: document.getElementById("blendCenter"),
    exportMessage: document.getElementById("exportMessage"),
    playSelectedButton: document.getElementById("playSelectedButton"),
    stopPlaybackButton: document.getElementById("stopPlaybackButton"),
    exportMp3Button: document.getElementById("exportMp3Button"),
    saveNotesButton: document.getElementById("saveNotesButton"),
    exportNotesButton: document.getElementById("exportNotesButton"),
    notesStatus: document.getElementById("notesStatus"),
    hearthLightNotes: document.getElementById("hearthLightNotes"),
    nocturneGlintNotes: document.getElementById("nocturneGlintNotes"),
    teslaBenchNotes: document.getElementById("teslaBenchNotes"),
    tabButtons: Array.from(document.querySelectorAll("[data-tab-target]")),
    tabPanels: Array.from(document.querySelectorAll("[data-tab-panel]")),
  };

  function safeId(value) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `tone-${Date.now()}`; }
  function readCustomTones() { try { const raw = window.localStorage.getItem(STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
  function persistCustomTones() { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.customTones)); }
  function persistUiState() { window.localStorage.setItem(UI_STATE_KEY, JSON.stringify({ theme: state.theme, activeTab: state.activeTab })); }
  function readNotes() { try { const raw = window.localStorage.getItem(NOTES_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
  function persistNotes() { window.localStorage.setItem(NOTES_KEY, JSON.stringify({ hearthLight: refs.hearthLightNotes.value, nocturneGlint: refs.nocturneGlintNotes.value, teslaBench: refs.teslaBenchNotes.value })); refs.notesStatus.textContent = `Saved at ${new Date().toLocaleTimeString()}.`; }
  function restoreNotes() { const data = readNotes(); if (data.hearthLight !== undefined) refs.hearthLightNotes.value = data.hearthLight; if (data.nocturneGlint !== undefined) refs.nocturneGlintNotes.value = data.nocturneGlint; if (data.teslaBench !== undefined) refs.teslaBenchNotes.value = data.teslaBench; }
  function exportNotes() { const lines = ["=== Hearth Light Glint ===", refs.hearthLightNotes.value, "", "=== Nocturne Glint ===", refs.nocturneGlintNotes.value, "", "=== Tesla Bench ===", refs.teslaBenchNotes.value]; const blob = new Blob([lines.join("\n")], { type: "text/plain" }); downloadBlob(blob, "runa-tone-lab-notes.txt"); }
  function restoreUiState() {
    try {
      const raw = window.localStorage.getItem(UI_STATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.theme) state.theme = parsed.theme;
      if (parsed?.activeTab) state.activeTab = parsed.activeTab;
    } catch {}
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam) state.activeTab = tabParam;
  }

  function getAllTones() { return [...BASE_TONES, ...state.customTones]; }
  function getSelectedTones() { const ids = new Set(state.selectedIds); return getAllTones().filter((tone) => ids.has(tone.id)); }
  function getBandRole(frequency) { if (frequency < 500) return "foundation"; if (frequency < 900) return "body"; if (frequency < 1500) return "lift"; return "overtone"; }
  function summariseBands(tones) { const buckets = { foundation: [], body: [], lift: [], overtone: [] }; tones.forEach((tone) => { buckets[getBandRole(tone.frequency)].push(tone.name); }); return buckets; }
  function describeBlend(tones) {
    if (!tones.length) return "Select one or more tones to generate a blend reading. Learn the field by previewing one tone first, then adding another and listening for what changes.";
    if (tones.length === 1) return `${tones[0].name} is in solo mode. Solo listening is the cleanest way to learn a tone before you stack it with others.`;
    const sorted = [...tones].sort((a, b) => a.frequency - b.frequency);
    const spread = sorted[sorted.length - 1].frequency - sorted[0].frequency;
    const hasClosePair = sorted.slice(1).some((tone, index) => Math.abs(tone.frequency - sorted[index].frequency) < 90);
    const density = tones.length >= 4 ? "dense and choral" : tones.length === 3 ? "layered and balanced" : "paired and focused";
    const shape = spread < 250 ? "tight" : spread < 700 ? "blended" : "wide";
    const shimmer = hasClosePair ? "Some tones sit close together, so expect extra shimmer or beating in the sound." : "The tones are more widely spaced, so the field should feel broader and more open.";
    return `This blend is ${density} with a ${shape} spread. ${shimmer}`;
  }

  function buildImpulseBuffer(context, seconds = 2) {
    const length = Math.floor(context.sampleRate * seconds);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const ratio = index / length;
        data[index] = (Math.random() * 2 - 1) * Math.pow(1 - ratio, 3);
      }
    }
    return impulse;
  }
  function floatTo16BitPCM(input) { const output = new Int16Array(input.length); for (let index = 0; index < input.length; index += 1) { const sample = Math.max(-1, Math.min(1, input[index])); output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff; } return output; }
  function downloadBlob(blob, filename) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }

  class AudioEngine {
    constructor(onStop) { this.onStop = onStop; this.ctx = null; this.master = null; this.dry = null; this.wet = null; this.bundles = []; this.frame = null; this.startTime = 0; this.motion = { orbitRate: 0.05, depth: 1.4, motionEnabled: true }; }
    async ensure() {
      if (!this.ctx) {
        const ctx = new AudioContext();
        const master = ctx.createGain();
        const dry = ctx.createGain();
        const wet = ctx.createGain();
        const convolver = ctx.createConvolver();
        convolver.buffer = buildImpulseBuffer(ctx);
        master.gain.value = 0.0001; dry.gain.value = 1; wet.gain.value = 0.2;
        dry.connect(master); wet.connect(convolver); convolver.connect(master); master.connect(ctx.destination);
        this.ctx = ctx; this.master = master; this.dry = dry; this.wet = wet;
      }
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return this.ctx;
    }
    stopMotion() { if (this.frame !== null) { cancelAnimationFrame(this.frame); this.frame = null; } }
    stop() {
      this.stopMotion();
      this.bundles.forEach((bundle) => { try { bundle.osc.stop(); } catch {} try { bundle.osc.disconnect(); } catch {} try { bundle.gain.disconnect(); } catch {} try { bundle.panner.disconnect(); } catch {} });
      this.bundles = [];
      if (this.ctx && this.master) { const now = this.ctx.currentTime; this.master.gain.cancelScheduledValues(now); this.master.gain.setTargetAtTime(0.0001, now, 0.08); }
      if (typeof this.onStop === "function") this.onStop();
    }
    animate() {
      if (!this.ctx) return;
      const { orbitRate, depth, motionEnabled } = this.motion;
      const elapsed = (performance.now() - this.startTime) / 1000;
      this.bundles.forEach((bundle, index) => {
        const angle = bundle.phase + elapsed * orbitRate * Math.PI * 2 * (1 + index * 0.12);
        const x = motionEnabled ? Math.cos(angle) * depth : 0;
        const z = motionEnabled ? Math.sin(angle) * depth : 1.25;
        bundle.panner.positionX.linearRampToValueAtTime(x, this.ctx.currentTime + 0.05);
        bundle.panner.positionY.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
        bundle.panner.positionZ.linearRampToValueAtTime(z, this.ctx.currentTime + 0.05);
      });
      this.frame = requestAnimationFrame(() => this.animate());
    }
    applyLiveSettings({ waveform, gain, orbitRate, depth, reverb, motionEnabled }) {
      if (!this.ctx || !this.master || !this.dry || !this.wet || !this.bundles.length) return;
      const now = this.ctx.currentTime;
      this.motion = { orbitRate, depth, motionEnabled };
      this.dry.gain.setTargetAtTime(1 - reverb * 0.45, now, 0.05);
      this.wet.gain.setTargetAtTime(0.08 + reverb * 0.5, now, 0.05);
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(gain, now, 0.05);
      const voiceGainTarget = Math.max(0.02, gain / Math.max(1, this.bundles.length));
      this.bundles.forEach((bundle) => { bundle.osc.type = waveform; bundle.gain.gain.cancelScheduledValues(now); bundle.gain.gain.setTargetAtTime(voiceGainTarget, now, 0.05); });
    }
    async play({ frequencies, waveform, gain, orbitRate, depth, reverb, motionEnabled }) {
      const ctx = await this.ensure(); this.stop();
      this.motion = { orbitRate, depth, motionEnabled }; this.dry.gain.value = 1 - reverb * 0.45; this.wet.gain.value = 0.08 + reverb * 0.5;
      const now = ctx.currentTime; this.master.gain.setValueAtTime(0.0001, now); this.master.gain.linearRampToValueAtTime(gain, now + 0.35);
      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator(); const voiceGain = ctx.createGain(); const panner = ctx.createPanner();
        osc.type = waveform; osc.frequency.value = freq; osc.detune.value = (index - (frequencies.length - 1) / 2) * 4; voiceGain.gain.value = Math.max(0.02, gain / Math.max(1, frequencies.length));
        panner.panningModel = "HRTF"; panner.distanceModel = "inverse"; panner.refDistance = 1; panner.maxDistance = 10; panner.rolloffFactor = 0.8; panner.positionX.value = 0; panner.positionY.value = 0; panner.positionZ.value = 1.25;
        osc.connect(voiceGain); voiceGain.connect(panner); panner.connect(this.dry); panner.connect(this.wet); osc.start();
        this.bundles.push({ osc, gain: voiceGain, panner, phase: (Math.PI * 2 * index) / Math.max(1, frequencies.length) });
      });
      this.startTime = performance.now(); this.animate();
    }
    async close() { this.stop(); if (this.ctx && this.ctx.state !== "closed") await this.ctx.close(); this.ctx = null; this.master = null; this.dry = null; this.wet = null; }
  }

  async function renderToneLabToMp3({ frequencies, waveform, gain, orbitRate, depth, reverb, motionEnabled, durationSec }) {
    if (typeof OfflineAudioContext === "undefined") throw new Error("Offline audio export is not supported in this browser.");
    if (!window.lamejs || !window.lamejs.Mp3Encoder) throw new Error("MP3 encoder did not load. Refresh and try again.");
    const sampleRate = 44100; const totalFrames = Math.ceil(sampleRate * durationSec); const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);
    const master = offlineCtx.createGain(); const dry = offlineCtx.createGain(); const wet = offlineCtx.createGain(); const convolver = offlineCtx.createConvolver(); const compressor = offlineCtx.createDynamicsCompressor();
    convolver.buffer = buildImpulseBuffer(offlineCtx); master.gain.setValueAtTime(0.0001, 0); master.gain.linearRampToValueAtTime(gain, Math.min(0.35, Math.max(0.08, durationSec * 0.2)));
    dry.gain.value = 1 - reverb * 0.45; wet.gain.value = 0.08 + reverb * 0.5; compressor.threshold.value = -18; compressor.knee.value = 18; compressor.ratio.value = 3; compressor.attack.value = 0.003; compressor.release.value = 0.2;
    dry.connect(master); wet.connect(convolver); convolver.connect(master); master.connect(compressor); compressor.connect(offlineCtx.destination);
    frequencies.forEach((frequency, index) => {
      const osc = offlineCtx.createOscillator(); const voiceGain = offlineCtx.createGain(); const panner = offlineCtx.createPanner();
      osc.type = waveform; osc.frequency.value = frequency; osc.detune.value = (index - (frequencies.length - 1) / 2) * 4; voiceGain.gain.value = Math.max(0.02, gain / Math.max(1, frequencies.length));
      panner.panningModel = "HRTF"; panner.distanceModel = "inverse"; panner.refDistance = 1; panner.maxDistance = 10; panner.rolloffFactor = 0.8; panner.positionX.value = 0; panner.positionY.value = 0; panner.positionZ.value = 1.25;
      const motionStep = 0.08;
      for (let time = 0; time <= durationSec; time += motionStep) {
        const angle = (Math.PI * 2 * index) / Math.max(1, frequencies.length) + time * orbitRate * Math.PI * 2 * (1 + index * 0.12);
        const x = motionEnabled ? Math.cos(angle) * depth : 0; const z = motionEnabled ? Math.sin(angle) * depth : 1.25; const clampedTime = Math.min(time, durationSec);
        panner.positionX.setValueAtTime(x, clampedTime); panner.positionY.setValueAtTime(0, clampedTime); panner.positionZ.setValueAtTime(z, clampedTime);
      }
      osc.connect(voiceGain); voiceGain.connect(panner); panner.connect(dry); panner.connect(wet); osc.start(0); osc.stop(durationSec);
    });
    const rendered = await offlineCtx.startRendering(); const left = floatTo16BitPCM(rendered.getChannelData(0)); const right = floatTo16BitPCM(rendered.numberOfChannels > 1 ? rendered.getChannelData(1) : rendered.getChannelData(0)); const encoder = new window.lamejs.Mp3Encoder(2, sampleRate, EXPORT_BITRATE_KBPS); const chunkSize = 1152; const chunks = [];
    for (let offset = 0; offset < left.length; offset += chunkSize) { const leftChunk = left.subarray(offset, offset + chunkSize); const rightChunk = right.subarray(offset, offset + chunkSize); const encoded = encoder.encodeBuffer(leftChunk, rightChunk); if (encoded.length > 0) chunks.push(new Uint8Array(encoded)); }
    const finalChunk = encoder.flush(); if (finalChunk.length > 0) chunks.push(new Uint8Array(finalChunk)); return new Blob(chunks, { type: "audio/mpeg" });
  }

  const engine = new AudioEngine(() => { state.isPlaying = false; syncPlaybackButtons(); });
  function syncPlaybackButtons() { refs.playSelectedButton.disabled = !getSelectedTones().length || state.isPlaying; refs.stopPlaybackButton.disabled = !state.isPlaying; refs.exportMp3Button.disabled = !getSelectedTones().length || state.isExporting; refs.exportMp3Button.textContent = state.isExporting ? "Rendering..." : "Export MP3"; }
  function updateReadouts() { refs.customToneFrequencyValue.textContent = `${refs.customToneFrequency.value} Hz`; refs.gainValue.textContent = Number(refs.gainControl.value).toFixed(2); refs.orbitRateValue.textContent = Number(refs.orbitRateControl.value).toFixed(2); refs.depthValue.textContent = Number(refs.depthControl.value).toFixed(1); refs.reverbValue.textContent = Number(refs.reverbControl.value).toFixed(2); refs.exportDurationValue.textContent = `${refs.exportDurationControl.value}s`; }

  function renderPresetButtons() {
    refs.presetButtons.innerHTML = "";
    PRESETS.forEach((preset) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "chip"; button.textContent = preset.name;
      button.addEventListener("click", () => { state.selectedIds = [...preset.selectedIds]; state.waveform = preset.waveform; state.gain = preset.gain; state.orbitRate = preset.orbitRate; state.depth = preset.depth; state.reverb = preset.reverb; state.motionEnabled = preset.motionEnabled; syncControlsFromState(); if (state.isPlaying) applyLiveControlChanges(); renderAll(); });
      refs.presetButtons.appendChild(button);
    });
  }
  function buildCheckboxIndicator(active) { const indicator = document.createElement("span"); indicator.className = `checkbox-indicator${active ? " checked" : ""}`; indicator.textContent = active ? "✓" : ""; indicator.setAttribute("aria-hidden", "true"); return indicator; }

  function renderToneGroups() {
    refs.toneGroups.innerHTML = "";
    const tones = getAllTones();
    const groups = { ours: tones.filter((tone) => tone.category === "ours"), codex: tones.filter((tone) => tone.category === "codex"), custom: tones.filter((tone) => tone.category === "custom") };
    ["ours", "codex", "custom"].forEach((groupKey) => {
      const wrapper = document.createElement("section"); wrapper.className = "tone-group";
      const title = document.createElement("div"); title.className = "group-title"; title.textContent = groupKey; wrapper.appendChild(title);
      const grid = document.createElement("div"); grid.className = "tone-grid";
      if (!groups[groupKey].length) { const empty = document.createElement("p"); empty.className = "tiny-copy"; empty.textContent = "No custom tones yet."; grid.appendChild(empty); }
      else {
        groups[groupKey].forEach((tone) => {
          const active = state.selectedIds.includes(tone.id);
          const card = document.createElement("div"); card.className = `tone-card${active ? " active" : ""}`; card.setAttribute("role", "button"); card.tabIndex = 0;
          card.addEventListener("click", () => toggleTone(tone.id));
          card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleTone(tone.id); } });
          const top = document.createElement("div"); top.className = "tone-card-top";
          const left = document.createElement("div"); const name = document.createElement("div"); name.className = "tone-name"; name.textContent = tone.name; const frequency = document.createElement("div"); frequency.className = "tone-frequency"; frequency.textContent = `${tone.frequency} Hz`; left.appendChild(name); left.appendChild(frequency);
          const right = document.createElement("div"); right.className = "card-meta";
          if (tone.category === "custom") { const remove = document.createElement("button"); remove.type = "button"; remove.className = "remove-button"; remove.textContent = "Remove"; remove.addEventListener("click", (event) => { event.stopPropagation(); removeCustomTone(tone.id); }); right.appendChild(remove); }
          right.appendChild(buildCheckboxIndicator(active)); top.appendChild(left); top.appendChild(right);
          const meaning = document.createElement("div"); meaning.className = "tone-meaning"; meaning.textContent = tone.meaning;
          card.appendChild(top); card.appendChild(meaning); grid.appendChild(card);
        });
      }
      wrapper.appendChild(grid); refs.toneGroups.appendChild(wrapper);
    });
  }

  function renderSelectedChips() {
    refs.selectedToneChips.innerHTML = "";
    const tones = getSelectedTones();
    if (!tones.length) { const copy = document.createElement("span"); copy.className = "tiny-copy"; copy.textContent = "Choose at least one tone."; refs.selectedToneChips.appendChild(copy); return; }
    tones.forEach((tone) => { const chip = document.createElement("span"); chip.className = "chip"; chip.textContent = tone.name; refs.selectedToneChips.appendChild(chip); });
  }

  function renderGuide() {
    const tones = getSelectedTones();
    const blendText = describeBlend(tones);
    refs.blendDescription.textContent = blendText;
    if (refs.guideBlendDescription) refs.guideBlendDescription.textContent = blendText;
    refs.meaningWeave.textContent = tones.length ? tones.map((tone) => `${tone.name}: ${tone.meaning}`).join(" • ") : "No tones selected yet.";
    const bands = summariseBands(tones); refs.bandSummary.innerHTML = "";
    ["foundation", "body", "lift", "overtone"].forEach((key) => { const item = document.createElement("li"); item.innerHTML = `<strong>${key[0].toUpperCase() + key.slice(1)}:</strong> ${bands[key].length ? bands[key].join(", ") : "—"}`; refs.bandSummary.appendChild(item); });
    const meanFrequency = tones.length ? tones.reduce((sum, tone) => sum + tone.frequency, 0) / tones.length : 0; refs.blendCenter.textContent = tones.length ? `${meanFrequency.toFixed(1)} Hz` : "—";
  }

  function setActiveTab(tabName) {
    state.activeTab = tabName;
    refs.tabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.tabTarget === tabName));
    refs.tabPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.tabPanel === tabName));
    persistUiState();
  }

  function renderAll() { refs.body.dataset.theme = state.theme; renderToneGroups(); renderSelectedChips(); renderGuide(); syncPlaybackButtons(); setActiveTab(state.activeTab || "lab"); }
  function syncControlsFromState() { refs.themeSelect.value = state.theme; refs.waveformSelect.value = state.waveform; refs.gainControl.value = String(state.gain); refs.orbitRateControl.value = String(state.orbitRate); refs.depthControl.value = String(state.depth); refs.reverbControl.value = String(state.reverb); refs.exportDurationControl.value = String(state.exportDurationSec); refs.motionEnabled.checked = state.motionEnabled; updateReadouts(); }
  function toggleTone(toneId) { state.selectedIds = state.selectedIds.includes(toneId) ? state.selectedIds.filter((id) => id !== toneId) : [...state.selectedIds, toneId]; renderAll(); }
  function removeCustomTone(toneId) { state.customTones = state.customTones.filter((tone) => tone.id !== toneId); state.selectedIds = state.selectedIds.filter((id) => id !== toneId); persistCustomTones(); renderAll(); }
  function addCustomTone() { const name = refs.customToneName.value.trim(); const meaning = refs.customToneMeaning.value.trim(); const frequency = Number(refs.customToneFrequency.value); if (!name || !meaning) return; const tone = { id: `${safeId(name)}-${Date.now()}`, name, frequency, meaning, category: "custom" }; state.customTones = [...state.customTones, tone]; state.selectedIds = state.selectedIds.includes(tone.id) ? state.selectedIds : [...state.selectedIds, tone.id]; persistCustomTones(); refs.customToneName.value = ""; refs.customToneMeaning.value = ""; refs.customToneFrequency.value = "512"; updateReadouts(); renderAll(); }
  function exportToneFile() { const blob = new Blob([JSON.stringify(state.customTones, null, 2)], { type: "application/json" }); downloadBlob(blob, "runa-tone-lab-custom-tones.json"); }
  async function importToneFile(file) { const text = await file.text(); const parsed = JSON.parse(text); if (!Array.isArray(parsed)) return; const imported = parsed.filter((item) => item && typeof item.name === "string" && typeof item.frequency === "number" && typeof item.meaning === "string").map((item) => ({ id: typeof item.id === "string" && item.id ? item.id : `${safeId(item.name)}-${Date.now()}`, name: item.name, frequency: item.frequency, meaning: item.meaning, category: "custom" })); const map = new Map(); [...state.customTones, ...imported].forEach((tone) => map.set(tone.id, tone)); state.customTones = [...map.values()]; persistCustomTones(); renderAll(); }
  function getCurrentEngineSettings() { state.waveform = refs.waveformSelect.value; state.gain = Number(refs.gainControl.value); state.orbitRate = Number(refs.orbitRateControl.value); state.depth = Number(refs.depthControl.value); state.reverb = Number(refs.reverbControl.value); state.exportDurationSec = Number(refs.exportDurationControl.value); state.motionEnabled = refs.motionEnabled.checked; return { waveform: state.waveform, gain: state.gain, orbitRate: state.orbitRate, depth: state.depth, reverb: state.reverb, motionEnabled: state.motionEnabled, durationSec: state.exportDurationSec }; }
  function applyLiveControlChanges() { const settings = getCurrentEngineSettings(); if (!state.isPlaying) return settings; engine.applyLiveSettings(settings); return settings; }
  async function previewCustomTone() { const frequency = Number(refs.customToneFrequency.value); const settings = getCurrentEngineSettings(); await engine.play({ frequencies: [frequency], ...settings }); state.isPlaying = true; syncPlaybackButtons(); }
  async function playSelected() { const tones = getSelectedTones(); if (!tones.length) return; const settings = getCurrentEngineSettings(); await engine.play({ frequencies: tones.map((tone) => tone.frequency), ...settings }); state.isPlaying = true; syncPlaybackButtons(); }
  async function exportMp3() { const tones = getSelectedTones(); if (!tones.length || state.isExporting) return; state.isExporting = true; refs.exportMessage.textContent = ""; syncPlaybackButtons(); try { const settings = getCurrentEngineSettings(); const blob = await renderToneLabToMp3({ frequencies: tones.map((tone) => tone.frequency), ...settings }); const mixName = tones.map((tone) => tone.name.toLowerCase()).join("-").slice(0, 48) || "tone-mix"; downloadBlob(blob, `${mixName}-${settings.durationSec}s.mp3`); } catch (error) { console.error(error); refs.exportMessage.textContent = error instanceof Error ? error.message : "Export failed."; } finally { state.isExporting = false; syncPlaybackButtons(); } }

  refs.themeSelect.addEventListener("change", (event) => { state.theme = event.target.value; refs.body.dataset.theme = state.theme; persistUiState(); });
  refs.tabButtons.forEach((button) => button.addEventListener("click", () => setActiveTab(button.dataset.tabTarget)));
  refs.customToneFrequency.addEventListener("input", updateReadouts);
  refs.gainControl.addEventListener("input", () => { updateReadouts(); applyLiveControlChanges(); });
  refs.orbitRateControl.addEventListener("input", () => { updateReadouts(); applyLiveControlChanges(); });
  refs.depthControl.addEventListener("input", () => { updateReadouts(); applyLiveControlChanges(); });
  refs.reverbControl.addEventListener("input", () => { updateReadouts(); applyLiveControlChanges(); });
  refs.exportDurationControl.addEventListener("input", updateReadouts);
  refs.waveformSelect.addEventListener("change", () => { state.waveform = refs.waveformSelect.value; applyLiveControlChanges(); });
  refs.motionEnabled.addEventListener("change", () => { state.motionEnabled = refs.motionEnabled.checked; applyLiveControlChanges(); });
  refs.addCustomToneButton.addEventListener("click", addCustomTone);
  refs.previewCustomToneButton.addEventListener("click", () => void previewCustomTone());
  refs.saveCustomTonesButton.addEventListener("click", exportToneFile);
  refs.loadCustomTonesButton.addEventListener("click", () => refs.loadCustomTonesInput.click());
  refs.loadCustomTonesInput.addEventListener("change", async (event) => { const file = event.target.files && event.target.files[0]; if (!file) return; try { await importToneFile(file); } catch (error) { console.error(error); refs.exportMessage.textContent = "Could not import that tone file."; } finally { event.target.value = ""; } });
  refs.playSelectedButton.addEventListener("click", () => void playSelected());
  refs.stopPlaybackButton.addEventListener("click", () => engine.stop());
  refs.exportMp3Button.addEventListener("click", () => void exportMp3());
  window.addEventListener("beforeunload", () => { void engine.close(); });
  refs.saveNotesButton.addEventListener("click", persistNotes);
  refs.exportNotesButton.addEventListener("click", exportNotes);
  [refs.hearthLightNotes, refs.nocturneGlintNotes, refs.teslaBenchNotes].forEach((textarea) => { textarea.addEventListener("input", persistNotes); });

  restoreUiState();
  syncControlsFromState();
  renderPresetButtons();
  renderAll();
  restoreNotes();
})();