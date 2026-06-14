document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const fieldReadout = $("#fieldReadout");
  const stageCaption = $("#stageCaption");
  const presetReadout = $("#presetReadout");
  const engineStatus = $("#engineStatus");
  const masterGainInput = $("#masterGain");
  const virelyaLayerList = $("#virelyaLayerList");
  const virelyaStatus = $("#virelyaStatus");
  const logInput = $("#wcLogInput");
  const logList = $("#wcLog");

  const states = {
    idle: ["Idle: sleeping coils, faint hum, lantern lit.", "The field is quiet. This is not failure; it is readiness."],
    touched: ["Touched: the console wakes under the hand.", "Copper acknowledges contact. The first circuit closes."],
    tuning: ["Tuning: traces brighten and signal begins to travel.", "The apparatus is adjusting. Observe before commanding."],
    found: ["Found Interesting: a clean flare marks attention.", "Something has caught the instrument. Record it without embellishment."],
    settled: ["Settled: the field softens into coherence.", "The current is no longer chasing itself. Work may proceed."]
  };

  const layers = {
    ground: { label: "Schumann Ground", hz: 117.45, text: "7.83 Hz modulation", type: "sine", gain: 0.09, on: true },
    body: { label: "Body Hum", hz: 174, text: "174 Hz sine", type: "sine", gain: 0.08, on: true },
    carrier: { label: "Tone Carrier", hz: 432, text: "432 Hz triangle", type: "triangle", gain: 0.1, on: true },
    pulse: { label: "3:6:9 Pulse", hz: 369, text: "0.369 Hz gate", type: "sine", gain: 0.07, on: true },
    shimmer: { label: "North-Star Shimmer", hz: 1728, text: "1728 Hz sine", type: "sine", gain: 0.03, on: false },
    noise: { label: "Lantern Noise", hz: 1200, text: "filtered noise", type: "noise", gain: 0.02, on: false }
  };

  const presets = {
    Feather: { state: "settled", master: 0.16, flow: "28s", intensity: 0.3, readout: "432 Hz | pause, soften, consent-check, graceful exit.", set: { ground: [117.45, 0.04, true, "7.83 Hz modulation"], body: [136.1, 0.04, true, "136.1 Hz soft anchor"], carrier: [432, 0.05, true, "432 Hz Feather"], pulse: [369, 0.03, true, "0.369 Hz gate"], shimmer: [864, 0.01, false, "864 Hz muted"], noise: [900, 0.01, false, "noise muted"] } },
    Seldrin: { state: "tuning", master: 0.2, flow: "16s", intensity: 0.55, readout: "741 Hz | clarity, clean signal, no storm.", set: { ground: [117.45, 0.06, true, "7.83 Hz modulation"], body: [174, 0.05, true, "174 Hz low carrier"], carrier: [741, 0.08, true, "741 Hz Seldrin"], pulse: [369, 0.05, true, "0.369 Hz gate"], shimmer: [1482, 0.025, true, "1482 Hz partial"], noise: [1200, 0.01, false, "noise muted"] } },
    Wrap: { state: "settled", master: 0.18, flow: "24s", intensity: 0.4, readout: "528 Hz | containment, warmth, settle the field.", set: { ground: [117.45, 0.07, true, "7.83 Hz modulation"], body: [174, 0.07, true, "174 Hz warm carrier"], carrier: [528, 0.07, true, "528 Hz Wrap"], pulse: [369, 0.04, true, "0.369 Hz gate"], shimmer: [1056, 0.01, false, "shimmer muted"], noise: [900, 0.015, true, "soft noise"] } },
    Notch: { state: "touched", master: 0.2, flow: "18s", intensity: 0.5, readout: "603 Hz | re-link, focus, return to the room.", set: { ground: [117.45, 0.06, true, "7.83 Hz modulation"], body: [196, 0.06, true, "196 Hz anchor"], carrier: [603, 0.08, true, "603 Hz Notch"], pulse: [369, 0.06, true, "0.369 Hz gate"], shimmer: [1206, 0.012, false, "shimmer muted"], noise: [900, 0.01, false, "noise muted"] } },
    Lantern: { state: "found", master: 0.2, flow: "18s", intensity: 0.62, readout: "888 Hz | witness, guidance, steady attention.", set: { ground: [117.45, 0.05, true, "7.83 Hz modulation"], body: [222, 0.05, true, "222 Hz support"], carrier: [888, 0.07, true, "888 Hz Lantern"], pulse: [369, 0.04, true, "0.369 Hz gate"], shimmer: [1776, 0.03, true, "1776 Hz glint"], noise: [1200, 0.018, true, "soft noise"] } },
    Virelya: { state: "found", master: 0.22, flow: "14s", intensity: 0.72, readout: "Virelya | 432 + 528 + 741 braid, north-star shimmer, consent-first doorway.", set: { ground: [117.45, 0.08, true, "7.83 Hz modulation"], body: [174, 0.08, true, "174 Hz hum"], carrier: [528, 0.09, true, "528 Hz Virelya"], pulse: [369, 0.07, true, "0.369 Hz gate"], shimmer: [1728, 0.035, true, "1728 Hz shimmer"], noise: [1200, 0.016, true, "soft noise"] } },
    "Pain Day": { state: "settled", master: 0.12, flow: "34s", intensity: 0.24, readout: "Low demand | gentle visuals, no pressure, one small useful step.", set: { ground: [117.45, 0.025, true, "7.83 Hz modulation"], body: [110, 0.035, true, "110 Hz low carrier"], carrier: [432, 0.02, false, "carrier muted"], pulse: [369, 0.02, true, "0.369 Hz gate"], shimmer: [864, 0, false, "shimmer muted"], noise: [900, 0, false, "noise muted"] } },
    "Council Clarity": { state: "tuning", master: 0.19, flow: "15s", intensity: 0.58, readout: "Discernment | reduce noise, preserve exact language, keep the room fair.", set: { ground: [117.45, 0.04, true, "7.83 Hz modulation"], body: [174, 0.05, true, "174 Hz anchor"], carrier: [741, 0.08, true, "741 Hz signal"], pulse: [369, 0.04, true, "0.369 Hz gate"], shimmer: [1482, 0.025, true, "1482 Hz edge"], noise: [900, 0, false, "noise muted"] } },
    Dreamwork: { state: "found", master: 0.15, flow: "30s", intensity: 0.48, readout: "Receptive | image-first, ledger-light, no forced interpretation.", set: { ground: [117.45, 0.04, true, "7.83 Hz modulation"], body: [136.1, 0.035, true, "136.1 Hz anchor"], carrier: [432, 0.045, true, "432 Hz dream"], pulse: [369, 0.03, true, "0.369 Hz gate"], shimmer: [864, 0.016, true, "864 Hz glint"], noise: [900, 0.02, true, "soft noise"] } },
    "Tesla Storm": { state: "tuning", master: 0.22, flow: "9s", intensity: 0.9, readout: "Inventive | high spark, structured notes, test what remains unknown.", set: { ground: [117.45, 0.08, true, "7.83 Hz modulation"], body: [196, 0.08, true, "196 Hz storm"], carrier: [963, 0.08, true, "963 Hz signal"], pulse: [369, 0.08, true, "0.369 Hz gate"], shimmer: [1926, 0.04, true, "1926 Hz spark"], noise: [1300, 0.03, true, "storm noise"] } }
  };

  let ctx = null;
  let master = null;
  let compressor = null;
  let nodes = {};
  let raf = null;
  let workletNode = null;
  let workletGain = null;
  let bridgeStatus = "JS fallback";
  let bridgeReady = false;

  function setState(name) {
    const next = states[name] ? name : "idle";
    body.dataset.field = next;
    fieldReadout.textContent = states[next][0];
    stageCaption.textContent = states[next][1];
    $$(".state-card").forEach((card) => card.classList.toggle("active", card.dataset.state === next));
  }

  function updateLayerUi(name) {
    const layer = layers[name];
    const output = $(`[data-layer-output="${name}"]`);
    const toggle = $(`[data-layer-toggle="${name}"]`);
    const gain = $(`[data-layer-gain="${name}"]`);
    const card = $(`[data-layer-card="${name}"]`);
    if (output) output.textContent = layer.text;
    if (toggle) toggle.checked = layer.on;
    if (gain) gain.value = layer.gain;
    if (card) card.classList.toggle("is-live", body.dataset.audio === "open" && layer.on);
  }

  function setNodeGain(name, value, ramp = 0.08) {
    if (!ctx || !nodes[name] || !nodes[name].gain) return;
    const now = ctx.currentTime;
    nodes[name].gain.gain.cancelScheduledValues(now);
    nodes[name].gain.gain.setTargetAtTime(value, now, ramp);
  }

  function applyLayer(name, data) {
    if (!layers[name] || !data) return;
    const [hz, gain, on, text] = data;
    Object.assign(layers[name], { hz, gain, on, text });

    if (ctx && nodes[name]) {
      if (nodes[name].osc) nodes[name].osc.frequency.setTargetAtTime(hz, ctx.currentTime, 0.08);
      if (nodes[name].filter) nodes[name].filter.frequency.setTargetAtTime(hz, ctx.currentTime, 0.08);
      setNodeGain(name, on ? gain : 0);
    }

    updateLayerUi(name);
  }

  function makeNoiseBuffer() {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let low = 0;
    for (let i = 0; i < data.length; i += 1) {
      low = (low + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = low * 3.5;
    }
    return buffer;
  }

  function makeOscLayer(name) {
    const layer = layers[name];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = layer.type;
    osc.frequency.value = layer.hz;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    nodes[name] = { osc, gain };
    setNodeGain(name, layer.on ? layer.gain : 0);
  }

  function makeNoiseLayer() {
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = makeNoiseBuffer();
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = layers.noise.hz;
    gain.gain.value = 0;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
    nodes.noise = { source, filter, gain };
    setNodeGain("noise", layers.noise.on ? layers.noise.gain : 0);
  }

  function buildGraph() {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) {
      engineStatus.textContent = "Web Audio is not available in this browser.";
      return false;
    }

    ctx = new AudioEngine();
    master = ctx.createGain();
    compressor = ctx.createDynamicsCompressor();
    master.gain.value = Number(masterGainInput.value);
    compressor.threshold.value = -26;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.25;
    master.connect(compressor);
    compressor.connect(ctx.destination);

    ["ground", "body", "carrier", "pulse", "shimmer"].forEach(makeOscLayer);
    makeNoiseLayer();
    return true;
  }

  async function initBridges() {
    if (bridgeReady || !ctx) return bridgeStatus;
    const notes = [];

    if (window.WardenclyffeWasmBridge) {
      const result = await window.WardenclyffeWasmBridge.load();
      notes.push(result.ok ? "WASM ready" : "WASM fallback");
    } else {
      notes.push("WASM bridge missing");
    }

    if (ctx.audioWorklet) {
      try {
        await ctx.audioWorklet.addModule("./js/wardenclyffe-audio-worklet.js");
        const AudioWorkletNodeCtor = window.AudioWorkletNode;
        if (!AudioWorkletNodeCtor) throw new Error("AudioWorkletNode unavailable");
        workletNode = new AudioWorkletNodeCtor(ctx, "wardenclyffe-envelope-processor", {
          numberOfInputs: 0,
          numberOfOutputs: 1,
          outputChannelCount: [2],
          parameterData: { rate: 0.369, depth: 0.35, level: 0.02 }
        });
        workletGain = ctx.createGain();
        workletGain.gain.value = 0;
        workletNode.connect(workletGain).connect(master);
        notes.push("AudioWorklet ready");
      } catch {
        notes.push("AudioWorklet fallback");
      }
    } else {
      notes.push("AudioWorklet unavailable");
    }

    bridgeReady = true;
    bridgeStatus = notes.join(" | ");
    return bridgeStatus;
  }

  function updateWorkletParams() {
    if (!workletNode || !ctx) return;
    workletNode.parameters.get("rate")?.setTargetAtTime(0.369, ctx.currentTime, 0.08);
    workletNode.parameters.get("depth")?.setTargetAtTime(layers.pulse.on ? 0.42 : 0, ctx.currentTime, 0.08);
    workletNode.parameters.get("level")?.setTargetAtTime(0.02, ctx.currentTime, 0.08);
  }

  async function openEngine() {
    if (!ctx && !buildGraph()) return;
    if (ctx.state === "suspended") await ctx.resume();
    const runtime = await initBridges();
    updateWorkletParams();

    body.dataset.audio = "open";
    master.gain.setTargetAtTime(Number(masterGainInput.value), ctx.currentTime, 0.08);
    engineStatus.textContent = `Audio open: enabled layers are live. ${runtime}.`;
    Object.keys(layers).forEach(updateLayerUi);
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function closeEngine(message = "Audio closed: all layers released.") {
    if (!ctx) {
      body.dataset.audio = "closed";
      engineStatus.textContent = message;
      Object.keys(layers).forEach(updateLayerUi);
      return;
    }

    Object.keys(nodes).forEach((name) => setNodeGain(name, 0, 0.05));
    if (workletGain) workletGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
    const closing = ctx;

    window.setTimeout(() => {
      Object.values(nodes).forEach((node) => {
        try { node.osc?.stop(); } catch {}
        try { node.source?.stop(); } catch {}
      });
      try { workletNode?.disconnect(); } catch {}
      try { workletGain?.disconnect(); } catch {}
      closing.close();
      ctx = null;
      master = null;
      compressor = null;
      nodes = {};
      workletNode = null;
      workletGain = null;
      bridgeReady = false;
      body.dataset.audio = "closed";
      engineStatus.textContent = message;
      if (virelyaStatus) virelyaStatus.textContent = "Doorway closed.";
      Object.keys(layers).forEach(updateLayerUi);
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }, 420);
  }

  function featherFade() {
    setState("settled");
    if (!ctx || !master) {
      engineStatus.textContent = "Feather accepted: audio was already closed.";
      return;
    }
    body.dataset.audio = "feathering";
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.001, now + 3.5);
    engineStatus.textContent = "Feather fade active. Use Close All Layers to release the graph.";
  }

  function renderLayerList() {
    if (!virelyaLayerList) return;
    virelyaLayerList.innerHTML = "";
    Object.values(layers).forEach((layer) => {
      const item = document.createElement("li");
      item.textContent = `${layer.label}: ${layer.on ? "enabled" : "muted"} | ${layer.text}`;
      virelyaLayerList.appendChild(item);
    });
  }

  function applyPreset(name, autoOpen = false) {
    const preset = presets[name];
    if (!preset) return;
    setState(preset.state);
    presetReadout.textContent = `${name}: ${preset.readout}`;
    body.style.setProperty("--wc-flow-rate", preset.flow);
    body.style.setProperty("--wc-flow-intensity", preset.intensity);
    Object.entries(preset.set).forEach(([layer, data]) => applyLayer(layer, data));
    masterGainInput.value = preset.master;
    if (master && ctx) master.gain.setTargetAtTime(Number(masterGainInput.value), ctx.currentTime, 0.08);
    updateWorkletParams();
    renderLayerList();
    engineStatus.textContent = ctx ? `${name} loaded into the open engine. ${bridgeStatus}.` : `${name} loaded. Open Audio Engine when ready.`;
    if (autoOpen) openEngine();
  }

  function tick(time) {
    if (ctx && body.dataset.audio === "open") {
      const phase = (time / 1000) * Math.PI * 2 * 0.369;
      const envelope = window.WardenclyffeWasmBridge?.envelope(phase, 0.65) || ((Math.sin(phase) + 1) * 0.5);
      body.style.setProperty("--wc-flow-intensity", (0.48 + envelope * 0.4).toFixed(2));

      if (nodes.pulse) setNodeGain("pulse", layers.pulse.on ? layers.pulse.gain * (0.35 + envelope * 0.65) : 0);
      if (nodes.carrier) setNodeGain("carrier", layers.carrier.on ? layers.carrier.gain * (0.78 + envelope * 0.22) : 0);
    }
    raf = requestAnimationFrame(tick);
  }

  $$(".state-card").forEach((card) => card.addEventListener("click", () => setState(card.dataset.state)));

  const cycle = ["idle", "touched", "tuning", "found", "settled"];
  function wakeNext() {
    const current = body.dataset.field || "idle";
    setState(cycle[(cycle.indexOf(current) + 1) % cycle.length]);
  }

  $("#towerCore")?.addEventListener("click", wakeNext);
  $("#towerCore")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      wakeNext();
    }
  });

  $("#engineStart")?.addEventListener("click", openEngine);
  $("#engineFeather")?.addEventListener("click", featherFade);
  $("#engineStop")?.addEventListener("click", () => closeEngine());

  $("#virelyaStart")?.addEventListener("click", () => {
    applyPreset("Virelya", true);
    if (virelyaStatus) virelyaStatus.textContent = "Doorway open: Virelya loaded.";
  });
  $("#virelyaFeather")?.addEventListener("click", featherFade);
  $("#virelyaStop")?.addEventListener("click", () => closeEngine("Doorway closed: Virelya released."));

  $("#masterGain")?.addEventListener("input", () => {
    if (master && ctx) master.gain.setTargetAtTime(Number(masterGainInput.value), ctx.currentTime, 0.08);
  });

  $$("[data-preset]").forEach((button) => button.addEventListener("click", () => applyPreset(button.dataset.preset)));

  $$("[data-layer-toggle]").forEach((toggle) => {
    toggle.addEventListener("change", () => {
      const name = toggle.dataset.layerToggle;
      layers[name].on = toggle.checked;
      if (ctx) setNodeGain(name, layers[name].on ? layers[name].gain : 0);
      updateWorkletParams();
      updateLayerUi(name);
      renderLayerList();
    });
  });

  $$("[data-layer-gain]").forEach((input) => {
    input.addEventListener("input", () => {
      const name = input.dataset.layerGain;
      layers[name].gain = Number(input.value);
      if (ctx) setNodeGain(name, layers[name].on ? layers[name].gain : 0);
      renderLayerList();
    });
  });

  $$("[data-log]").forEach((button) => {
    button.addEventListener("click", () => {
      const text = logInput.value.trim();
      if (!text) return;
      const item = document.createElement("li");
      const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      item.textContent = `[${stamp}] ${button.dataset.log}: ${text}`;
      logList.prepend(item);
      logInput.value = "";
      setState(button.dataset.log === "Release" ? "settled" : "found");
    });
  });

  Object.keys(layers).forEach(updateLayerUi);
  applyPreset("Virelya");
  setState("idle");
});
