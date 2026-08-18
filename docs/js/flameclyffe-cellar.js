(() => {
  const SUPABASE_URL = "https://rufrmjyusalnifpegllj.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_z69-aAbQvzFFDRk4SHDYrQ_FuqirkLD";
  const API = `${SUPABASE_URL}/rest/v1`;

  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    Accept: "application/json",
  };

  const state = {
    patches: [],
    routes: [],
    tones: [],
    activePatchSlug: null,
    audio: null,
  };

  const $ = (id) => document.getElementById(id);

  const els = {
    status: $("cellarStatus"),
    patchGrid: $("patchGrid"),
    toneGrid: $("toneGrid"),
    routeGrid: $("routeGrid"),
    patchSelect: $("patchSelect"),
    patchDetail: $("patchDetail"),
    playBtn: $("playPatch"),
    stopBtn: $("stopPatch"),
    refreshBtn: $("refreshCellar"),
    counts: $("cellarCounts"),
  };

  function esc(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function hz(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a";
    return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} Hz`;
  }

  function setStatus(message, tone = "idle") {
    els.status.textContent = message;
    els.status.dataset.tone = tone;
  }

  async function rest(path) {
    const response = await fetch(`${API}/${path}`, { headers });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }
    return response.json();
  }

  async function loadCellar() {
    setStatus("Opening Flameclyffe cellar…", "loading");

    const [patches, routes, tones] = await Promise.all([
      rest("flameclyffe_patch_manifest?select=*&order=slug.asc"),
      rest("flameclyffe_public_routes?select=*"),
      rest("flameclyffe_tones?select=slug,label,tone_group,frequency_hz,meaning,default_waveform,recommended_use,metadata&visibility=eq.public&order=tone_group.asc,frequency_hz.asc"),
    ]);

    state.patches = patches;
    state.routes = routes;
    state.tones = tones;
    state.activePatchSlug = state.activePatchSlug || patches[0]?.slug || null;

    render();
    setStatus("Cellar linked. Public Flameclyffe manifest is live.", "ready");
  }

  function render() {
    renderCounts();
    renderPatchSelect();
    renderPatches();
    renderTones();
    renderRoutes();
    renderDetail();
  }

  function renderCounts() {
    els.counts.innerHTML = `
      <span><b>${state.patches.length}</b> public patch${state.patches.length === 1 ? "" : "es"}</span>
      <span><b>${state.tones.length}</b> public tone${state.tones.length === 1 ? "" : "s"}</span>
      <span><b>${state.routes.length}</b> public route${state.routes.length === 1 ? "" : "s"}</span>
    `;
  }

  function renderPatchSelect() {
    els.patchSelect.innerHTML = state.patches
      .map((patch) => `<option value="${esc(patch.slug)}" ${patch.slug === state.activePatchSlug ? "selected" : ""}>${esc(patch.name || patch.slug)}</option>`)
      .join("");
    els.playBtn.disabled = !state.activePatchSlug;
  }

  function renderPatches() {
    if (!state.patches.length) {
      els.patchGrid.innerHTML = `<p class="tiny">No public patches are visible yet. Circle-only drafts are protected by RLS.</p>`;
      return;
    }

    els.patchGrid.innerHTML = state.patches.map((patch) => {
      const bearer = patch.bearer?.display_name || "Unassigned";
      const dyad = patch.dyad?.display_name ? `<span>${esc(patch.dyad.display_name)}</span>` : "";
      const layers = patch.layers?.length || 0;
      const tones = patch.tones?.length || 0;
      const core = patch.colour_binding?.core || "#1a4d3a";
      const shimmer = patch.colour_binding?.shimmer || "#2d7a5f";

      return `
        <article class="cellar-card patch-card" data-patch-card="${esc(patch.slug)}" style="--patch-core:${esc(core)};--patch-shimmer:${esc(shimmer)}">
          <div class="patch-sigil"></div>
          <div>
            <p class="eyebrow">${esc(patch.status || "public")}</p>
            <h3>${esc(patch.name || patch.slug)}</h3>
            <p>${esc(patch.description || patch.intent || "No description yet.")}</p>
            <div class="chip-row">
              <span>${esc(bearer)}</span>
              ${dyad}
              <span>${layers} layer${layers === 1 ? "" : "s"}</span>
              <span>${tones} tone link${tones === 1 ? "" : "s"}</span>
            </div>
          </div>
        </article>
      `;
    }).join("");

    els.patchGrid.querySelectorAll("[data-patch-card]").forEach((card) => {
      card.addEventListener("click", () => {
        state.activePatchSlug = card.dataset.patchCard;
        renderPatchSelect();
        renderDetail();
      });
    });
  }

  function renderTones() {
    if (!state.tones.length) {
      els.toneGrid.innerHTML = `<p class="tiny">No public tones are visible yet.</p>`;
      return;
    }

    els.toneGrid.innerHTML = state.tones.map((tone) => `
      <article class="cellar-card tone-card">
        <p class="eyebrow">${esc(tone.tone_group)}</p>
        <h3>${esc(tone.label)}</h3>
        <strong>${hz(tone.frequency_hz)}</strong>
        <p>${esc(tone.meaning || tone.recommended_use || "Reusable Flameclyffe tone.")}</p>
      </article>
    `).join("");
  }

  function renderRoutes() {
    if (!state.routes.length) {
      els.routeGrid.innerHTML = `<p class="tiny">No public route registry rows are visible yet.</p>`;
      return;
    }

    els.routeGrid.innerHTML = state.routes.map((route) => `
      <article class="cellar-card route-card">
        <p class="eyebrow">${esc(route.category || "route")}</p>
        <h3>${esc(route.label)}</h3>
        <p><code>${esc(route.route)}</code></p>
        <p>${esc(route.notes || route.data_source || "")}</p>
      </article>
    `).join("");
  }

  function activePatch() {
    return state.patches.find((patch) => patch.slug === state.activePatchSlug) || state.patches[0] || null;
  }

  function renderDetail() {
    const patch = activePatch();
    if (!patch) {
      els.patchDetail.innerHTML = `<p class="tiny">Choose a patch after the cellar loads.</p>`;
      return;
    }

    const layers = patch.layers || [];
    const tones = patch.tones || [];

    els.patchDetail.innerHTML = `
      <div class="detail-head">
        <div>
          <p class="eyebrow">selected patch</p>
          <h2>${esc(patch.name || patch.slug)}</h2>
          <p>${esc(patch.intent || patch.description || "")}</p>
        </div>
        <span class="section-pill">${esc(patch.slug)}</span>
      </div>
      <div class="detail-grid">
        <div>
          <h3>Layer stack</h3>
          ${layers.length ? layers.map((layer) => `
            <div class="layer-row">
              <span>${esc(layer.label)}</span>
              <b>${hz(layer.frequency_hz)}</b>
              <em>${esc(layer.role || layer.notes || "")}</em>
            </div>
          `).join("") : `<p class="tiny">No explicit layer stack on this public manifest.</p>`}
        </div>
        <div>
          <h3>Tone links</h3>
          ${tones.length ? tones.map((tone) => `
            <div class="layer-row">
              <span>${esc(tone.label)}</span>
              <b>${hz(tone.frequency_hz)}</b>
              <em>${esc(tone.role || tone.meaning || "")}</em>
            </div>
          `).join("") : `<p class="tiny">No tone links on this public manifest.</p>`}
        </div>
      </div>
    `;
  }

  function stopAudio() {
    if (!state.audio) return;
    const { ctx, master, nodes } = state.audio;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0.0001, now, 0.15);
    nodes.forEach((node) => {
      try { node.stop(now + 0.45); } catch {}
    });
    state.audio = null;
    els.stopBtn.disabled = true;
    setStatus("Feather stop. Audio fading out.", "idle");
  }

  async function playPatch() {
    stopAudio();
    const patch = activePatch();
    if (!patch) return;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextCtor();
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const now = ctx.currentTime;
    master.gain.linearRampToValueAtTime(0.085, now + 0.8);

    const sources = [];
    const layerSources = (patch.layers || []).map((layer) => ({
      label: layer.label,
      frequency: Number(layer.frequency_hz),
      waveform: layer.waveform || "sine",
      gain: 0.035,
    }));
    const toneSources = (patch.tones || []).map((tone) => ({
      label: tone.label,
      frequency: Number(tone.frequency_hz),
      waveform: tone.default_waveform || "sine",
      gain: 0.025,
    }));

    [...layerSources, ...toneSources].filter((source) => source.frequency > 0).slice(0, 10).forEach((source, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = source.waveform;
      osc.frequency.value = source.frequency;
      gain.gain.value = source.gain / Math.max(1, index * 0.25 + 1);
      panner.pan.value = Math.sin(index) * 0.45;
      lfo.frequency.value = 0.035 + index * 0.008;
      lfoGain.gain.value = 0.35;

      lfo.connect(lfoGain);
      lfoGain.connect(panner.pan);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(master);

      osc.start(now);
      lfo.start(now);
      sources.push(osc, lfo);
    });

    state.audio = { ctx, master, nodes: sources };
    els.stopBtn.disabled = false;
    setStatus(`Previewing ${patch.name || patch.slug}. Start gently; this is a sketch oscillator, not the full engine.`, "playing");
  }

  els.patchSelect.addEventListener("change", (event) => {
    state.activePatchSlug = event.target.value;
    renderDetail();
  });

  els.playBtn.addEventListener("click", playPatch);
  els.stopBtn.addEventListener("click", stopAudio);
  els.refreshBtn.addEventListener("click", () => loadCellar().catch(handleError));

  function handleError(error) {
    console.error(error);
    setStatus(`Cellar link failed: ${error.message}`, "error");
  }

  loadCellar().catch(handleError);
})();
