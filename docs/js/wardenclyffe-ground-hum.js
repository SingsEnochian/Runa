import { createStAugustineProfile, buildSchumannUnderlayLayers, summariseSchumannProfile } from './wardenclyffe/schumann-underlay.js';

const SCHUMANN_TAG = 'schumann-underlay';

function initGroundHumExtension() {
  const api = window.__wardenclyffe;
  if (!api) return;

  const refs = {
    locationInput: document.getElementById('schumannLocationInput'),
    intensityInput: document.getElementById('schumannIntensityInput'),
    intensityValue: document.getElementById('schumannIntensityValue'),
    tactileInput: document.getElementById('schumannTactileInput'),
    tactileValue: document.getElementById('schumannTactileValue'),
    audibleInput: document.getElementById('schumannAudibleInput'),
    audibleValue: document.getElementById('schumannAudibleValue'),
    overtoneInput: document.getElementById('schumannOvertoneInput'),
    seedButton: document.getElementById('seedSchumannButton'),
    clearButton: document.getElementById('clearSchumannButton'),
    summary: document.getElementById('groundHumSummary'),
  };

  if (!refs.seedButton || !refs.summary) return;

  const renderControls = () => {
    const profile = createStAugustineProfile({
      intensity: Number(refs.intensityInput?.value || 0.18),
      tactileBias: Number(refs.tactileInput?.value || 0.8),
      audibleBias: Number(refs.audibleInput?.value || 0.22),
      includeOvertone: Boolean(refs.overtoneInput?.checked),
    });

    if (refs.locationInput) refs.locationInput.value = profile.label;
    if (refs.intensityValue) refs.intensityValue.textContent = profile.intensity.toFixed(2);
    if (refs.tactileValue) refs.tactileValue.textContent = profile.tactileBias.toFixed(2);
    if (refs.audibleValue) refs.audibleValue.textContent = profile.audibleBias.toFixed(2);
    refs.summary.textContent = `Modelled coastal weighting with dominant modes near ${summariseSchumannProfile(profile)}. The 7.83 Hz fundamental is intended as a felt base, with higher modes layered softly above it.`;
    return profile;
  };

  const seedGroundHum = async () => {
    const profile = renderControls();
    api.state.scene.layers = api.state.scene.layers.filter((layer) => layer.systemTag !== SCHUMANN_TAG);
    api.state.scene.layers.unshift(...buildSchumannUnderlayLayers(profile));
    api.touchScene(api.state.scene);
    api.render();
    api.refs.engineStatus.textContent = `Seeded ${profile.label} ground hum beneath the current scene.`;
    if (typeof api.renderSavedScenes === 'function') {
      await api.renderSavedScenes();
    }
  };

  const clearGroundHum = async () => {
    const before = api.state.scene.layers.length;
    api.state.scene.layers = api.state.scene.layers.filter((layer) => layer.systemTag !== SCHUMANN_TAG);
    if (api.state.scene.layers.length === before) return;
    api.touchScene(api.state.scene);
    api.render();
    api.refs.engineStatus.textContent = 'Ground hum layers cleared.';
    if (typeof api.renderSavedScenes === 'function') {
      await api.renderSavedScenes();
    }
  };

  [refs.intensityInput, refs.tactileInput, refs.audibleInput, refs.overtoneInput]
    .filter(Boolean)
    .forEach((element) => {
      element.addEventListener('input', renderControls);
      element.addEventListener('change', renderControls);
    });

  refs.seedButton.addEventListener('click', () => {
    seedGroundHum().catch((error) => {
      console.error(error);
      api.refs.engineStatus.textContent = 'Ground hum seeding failed.';
    });
  });

  refs.clearButton?.addEventListener('click', () => {
    clearGroundHum().catch((error) => {
      console.error(error);
      api.refs.engineStatus.textContent = 'Ground hum clearing failed.';
    });
  });

  renderControls();
}

if (window.__wardenclyffe) {
  initGroundHumExtension();
} else {
  window.addEventListener('wardenclyffe:ready', initGroundHumExtension, { once: true });
}
