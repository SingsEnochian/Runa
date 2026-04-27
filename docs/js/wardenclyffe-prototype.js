import { WardenclyffeAudioEngine } from './wardenclyffe/audio-engine.js';
import { createBinauralLayer, createEmptyScene, createToneLayer, touchScene } from './wardenclyffe/scene-factory.js';
import { listScenes, loadScene, saveScene } from './wardenclyffe/scene-store.js';
import { generateTeslaCommentary } from './wardenclyffe/tesla-commentary.js';

const AUTOLOAD_KEY = 'wardenclyffe:auto-load-scene';

const refs = {
  themeSelect: document.getElementById('themeSelect'),
  sceneNameInput: document.getElementById('sceneNameInput'),
  masterGainInput: document.getElementById('masterGainInput'),
  masterGainValue: document.getElementById('masterGainValue'),
  addToneLayerButton: document.getElementById('addToneLayerButton'),
  addBinauralLayerButton: document.getElementById('addBinauralLayerButton'),
  playSceneButton: document.getElementById('playSceneButton'),
  stopSceneButton: document.getElementById('stopSceneButton'),
  saveSceneButton: document.getElementById('saveSceneButton'),
  engineStatus: document.getElementById('engineStatus'),
  layerStack: document.getElementById('layerStack'),
  sceneList: document.getElementById('sceneList'),
  commentaryQuestionInput: document.getElementById('commentaryQuestionInput'),
  commentaryNoteInput: document.getElementById('commentaryNoteInput'),
  generateCommentaryButton: document.getElementById('generateCommentaryButton'),
  copyCommentaryButton: document.getElementById('copyCommentaryButton'),
  commentaryOutput: document.getElementById('commentaryOutput'),
};

const state = {
  scene: createEmptyScene(),
  engine: new WardenclyffeAudioEngine(),
};

function syncSceneFieldsToState() {
  state.scene.name = refs.sceneNameInput.value.trim() || 'Untitled Wardenclyffe Scene';
  state.scene.masterGain = Number(refs.masterGainInput.value);
  state.scene.theme = refs.themeSelect.value;
  touchScene(state.scene);
}

function render() {
  refs.sceneNameInput.value = state.scene.name;
  refs.masterGainInput.value = String(state.scene.masterGain);
  refs.masterGainValue.textContent = Number(state.scene.masterGain).toFixed(2);
  refs.themeSelect.value = state.scene.theme;
  document.body.dataset.theme = state.scene.theme;
  renderLayers();
}

function renderLayers() {
  refs.layerStack.innerHTML = '';

  if (state.scene.layers.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty-copy';
    p.textContent = 'No layers yet. Add a tone layer or a binaural layer to begin.';
    refs.layerStack.appendChild(p);
    return;
  }

  state.scene.layers.forEach((layer) => {
    const card = document.createElement('section');
    card.className = 'layer-card';

    card.innerHTML = `
      <div class="layer-card-head">
        <div>
          <div class="layer-kind">${layer.kind}</div>
          <strong>${escapeHtml(layer.name)}</strong>
        </div>
        <div class="button-row wrap-row">
          <button type="button" data-action="duplicate" data-layer-id="${layer.id}">Duplicate</button>
          <button type="button" data-action="delete" data-layer-id="${layer.id}">Delete</button>
        </div>
      </div>
      <div class="two-up">
        <label>
          <span>Name</span>
          <input type="text" data-field="name" data-layer-id="${layer.id}" value="${escapeAttribute(layer.name)}" />
        </label>
        <label>
          <span>Waveform</span>
          <select data-field="waveform" data-layer-id="${layer.id}">
            ${renderWaveformOptions(layer.waveform)}
          </select>
        </label>
      </div>
      ${renderSourceControls(layer)}
      <div class="two-up">
        <label>
          <span>Layer gain</span>
          <input type="range" min="0" max="0.5" step="0.01" data-field="gain" data-layer-id="${layer.id}" value="${layer.gain}" />
          <strong>${Number(layer.gain).toFixed(2)}</strong>
        </label>
        <label>
          <span>Pan offset</span>
          <input type="range" min="-1" max="1" step="0.01" data-field="offset" data-layer-id="${layer.id}" value="${layer.offset}" />
          <strong>${Number(layer.offset).toFixed(2)}</strong>
        </label>
      </div>
      <div class="two-up">
        <label>
          <span>Motion rate</span>
          <input type="range" min="0.01" max="0.2" step="0.01" data-field="motionRateHz" data-layer-id="${layer.id}" value="${layer.motionRateHz}" />
          <strong>${Number(layer.motionRateHz).toFixed(2)} Hz</strong>
        </label>
        <label>
          <span>Motion depth</span>
          <input type="range" min="0" max="1" step="0.01" data-field="motionDepth" data-layer-id="${layer.id}" value="${layer.motionDepth}" />
          <strong>${Number(layer.motionDepth).toFixed(2)}</strong>
        </label>
      </div>
      <div class="button-row wrap-row">
        <button type="button" data-action="toggle-enabled" data-layer-id="${layer.id}">${layer.enabled ? 'Disable' : 'Enable'}</button>
        <button type="button" data-action="toggle-motion" data-layer-id="${layer.id}">${layer.motionEnabled ? 'Disable 8D' : 'Enable 8D'}</button>
        ${layer.kind === 'binaural' ? `<button type="button" data-action="toggle-safe-motion" data-layer-id="${layer.id}">${layer.safeMotion ? 'Safe motion on' : 'Experimental motion'}</button>` : ''}
      </div>
    `;

    refs.layerStack.appendChild(card);
  });
}

function renderSourceControls(layer) {
  if (layer.kind === 'tone') {
    return `
      <div class="two-up">
        <label>
          <span>Frequency</span>
          <input type="range" min="40" max="2400" step="1" data-field="frequencyHz" data-layer-id="${layer.id}" value="${layer.frequencyHz}" />
          <strong>${Math.round(layer.frequencyHz)} Hz</strong>
        </label>
        <label>
          <span>Enabled</span>
          <input type="text" value="${layer.enabled ? 'Yes' : 'No'}" disabled />
        </label>
      </div>
    `;
  }

  return `
    <div class="two-up">
      <label>
        <span>Carrier</span>
        <input type="range" min="40" max="1200" step="1" data-field="carrierHz" data-layer-id="${layer.id}" value="${layer.carrierHz}" />
        <strong>${Math.round(layer.carrierHz)} Hz</strong>
      </label>
      <label>
        <span>Beat</span>
        <input type="range" min="0.5" max="40" step="0.1" data-field="beatHz" data-layer-id="${layer.id}" value="${layer.beatHz}" />
        <strong>${Number(layer.beatHz).toFixed(1)} Hz</strong>
      </label>
    </div>
  `;
}

function renderWaveformOptions(selected) {
  return ['sine', 'triangle', 'square', 'sawtooth']
    .map((wave) => `<option value="${wave}" ${wave === selected ? 'selected' : ''}>${wave}</option>`)
    .join('');
}

function attachUiEvents() {
  refs.themeSelect.addEventListener('change', () => {
    syncSceneFieldsToState();
    render();
  });

  refs.sceneNameInput.addEventListener('input', syncSceneFieldsToState);
  refs.masterGainInput.addEventListener('input', () => {
    syncSceneFieldsToState();
    refs.masterGainValue.textContent = Number(state.scene.masterGain).toFixed(2);
  });

  refs.addToneLayerButton.addEventListener('click', () => {
    state.scene.layers.push(createToneLayer(state.scene.layers.filter((l) => l.kind === 'tone').length + 1));
    touchScene(state.scene);
    render();
  });

  refs.addBinauralLayerButton.addEventListener('click', () => {
    state.scene.layers.push(createBinauralLayer(state.scene.layers.filter((l) => l.kind === 'binaural').length + 1));
    touchScene(state.scene);
    render();
  });

  refs.playSceneButton.addEventListener('click', async () => {
    syncSceneFieldsToState();
    await state.engine.playScene(state.scene);
    refs.engineStatus.textContent = `Playing scene “${state.scene.name}” with ${state.scene.layers.filter((layer) => layer.enabled).length} active layer(s).`;
  });

  refs.stopSceneButton.addEventListener('click', () => {
    state.engine.stopScene();
    refs.engineStatus.textContent = 'Scene stopped.';
  });

  refs.saveSceneButton.addEventListener('click', async () => {
    syncSceneFieldsToState();
    await saveScene(state.scene);
    refs.engineStatus.textContent = `Saved scene “${state.scene.name}”.`;
    await renderSavedScenes();
  });

  refs.generateCommentaryButton?.addEventListener('click', () => {
    syncSceneFieldsToState();
    refs.commentaryOutput.value = generateTeslaCommentary(state.scene, {
      question: refs.commentaryQuestionInput?.value || '',
      note: refs.commentaryNoteInput?.value || '',
    });
  });

  refs.copyCommentaryButton?.addEventListener('click', async () => {
    const value = refs.commentaryOutput?.value || '';
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
      refs.engineStatus.textContent = 'Wardenclyffe Note copied.';
    } catch {
      refs.engineStatus.textContent = 'Copy failed. The note remains in the chamber.';
    }
  });

  refs.layerStack.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const field = target.dataset.field;
    const layerId = target.dataset.layerId;
    if (!field || !layerId) return;

    const layer = state.scene.layers.find((entry) => entry.id === layerId);
    if (!layer) return;

    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
      const nextValue = target.value;
      if (field === 'name' || field === 'waveform') {
        layer[field] = nextValue;
      } else {
        layer[field] = Number(nextValue);
      }
      touchScene(state.scene);
      render();
    }
  });

  refs.layerStack.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    const layerId = target.dataset.layerId;
    if (!action || !layerId) return;

    const index = state.scene.layers.findIndex((entry) => entry.id === layerId);
    if (index === -1) return;
    const layer = state.scene.layers[index];

    if (action === 'delete') {
      state.scene.layers.splice(index, 1);
    } else if (action === 'duplicate') {
      state.scene.layers.splice(index + 1, 0, {
        ...structuredClone(layer),
        id: crypto.randomUUID(),
        name: `${layer.name} Copy`,
      });
    } else if (action === 'toggle-enabled') {
      layer.enabled = !layer.enabled;
    } else if (action === 'toggle-motion') {
      layer.motionEnabled = !layer.motionEnabled;
    } else if (action === 'toggle-safe-motion' && layer.kind === 'binaural') {
      layer.safeMotion = !layer.safeMotion;
      if (layer.safeMotion) {
        layer.motionEnabled = false;
      }
    }

    touchScene(state.scene);
    render();
  });
}

async function renderSavedScenes() {
  const scenes = await listScenes();
  refs.sceneList.innerHTML = '';

  if (scenes.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty-copy';
    p.textContent = 'No saved scenes yet.';
    refs.sceneList.appendChild(p);
    return;
  }

  scenes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  for (const scene of scenes) {
    const item = document.createElement('section');
    item.className = 'scene-item';
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(scene.name)}</strong>
        <div class="scene-meta">${scene.layers.length} layer(s) · ${new Date(scene.updatedAt).toLocaleString()}</div>
      </div>
      <div class="button-row wrap-row">
        <button type="button" data-scene-id="${scene.id}" data-action="load">Load</button>
      </div>
    `;
    refs.sceneList.appendChild(item);
  }

  refs.sceneList.addEventListener('click', handleSceneListClick, { once: true });
}

async function handleSceneListClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.dataset.action;
  const sceneId = target.dataset.sceneId;
  if (action !== 'load' || !sceneId) {
    await renderSavedScenes();
    return;
  }

  const scene = await loadScene(sceneId);
  if (scene) {
    state.engine.stopScene();
    state.scene = scene;
    render();
    refs.engineStatus.textContent = `Loaded scene “${scene.name}”.`;
  }

  await renderSavedScenes();
}

async function tryAutoLoadScene() {
  const url = new URL(window.location.href);
  const shouldAutoload = url.searchParams.get('autoload') === '1';
  const sceneId = window.sessionStorage.getItem(AUTOLOAD_KEY);
  if (!shouldAutoload || !sceneId) {
    return;
  }

  window.sessionStorage.removeItem(AUTOLOAD_KEY);
  const scene = await loadScene(sceneId);
  if (scene) {
    state.scene = scene;
    render();
    refs.engineStatus.textContent = `Tone Lab handed off scene “${scene.name}”.`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

async function init() {
  attachUiEvents();
  render();
  await tryAutoLoadScene();
  await renderSavedScenes();
  window.__wardenclyffe = { state, refs, render, touchScene, renderSavedScenes };
  window.dispatchEvent(new CustomEvent('wardenclyffe:ready'));
}

init();
