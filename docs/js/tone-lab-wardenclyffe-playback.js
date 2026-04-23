import { WardenclyffeAudioEngine } from './wardenclyffe/audio-engine.js';
import { buildSceneFromToneLabSelection } from './wardenclyffe/tone-lab-adapter.js';
import { findToneByName } from './wardenclyffe/tone-library.js';

const engine = new WardenclyffeAudioEngine();
const state = {
  isPlaying: false,
  replayTimer: null,
};

const refs = {
  playButton: document.getElementById('playSelectedButton'),
  stopButton: document.getElementById('stopPlaybackButton'),
  exportMessage: document.getElementById('exportMessage'),
  themeSelect: document.getElementById('themeSelect'),
  waveformSelect: document.getElementById('waveformSelect'),
  gainControl: document.getElementById('gainControl'),
  orbitRateControl: document.getElementById('orbitRateControl'),
  depthControl: document.getElementById('depthControl'),
  motionEnabled: document.getElementById('motionEnabled'),
  toneGroups: document.getElementById('toneGroups'),
  presetButtons: document.getElementById('presetButtons'),
};

function initWardenclyffeToneLabPlayback() {
  if (!refs.playButton || !refs.stopButton) return;

  refs.playButton.addEventListener('click', onPlayClick, true);
  refs.stopButton.addEventListener('click', onStopClick, true);

  [
    refs.waveformSelect,
    refs.gainControl,
    refs.orbitRateControl,
    refs.depthControl,
    refs.motionEnabled,
  ].forEach((element) => {
    if (!element) return;
    element.addEventListener('input', scheduleReplayIfPlaying);
    element.addEventListener('change', scheduleReplayIfPlaying);
  });

  refs.toneGroups?.addEventListener('click', scheduleReplayIfPlaying);
  refs.presetButtons?.addEventListener('click', scheduleReplayIfPlaying);

  updatePlaybackButtons();
}

async function onPlayClick(event) {
  event.preventDefault();
  event.stopImmediatePropagation();

  const scene = buildLiveScene();
  if (!scene.layers.length) {
    setStatus('Select at least one tone before playing through Wardenclyffe.');
    return;
  }

  try {
    await engine.playScene(scene);
    state.isPlaying = true;
    updatePlaybackButtons();
    setStatus(`Wardenclyffe is carrying ${scene.layers.length} tone layer(s).`);
  } catch (error) {
    console.error(error);
    setStatus('Wardenclyffe playback failed to start.');
  }
}

function onStopClick(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  stopPlayback('Wardenclyffe scene stopped.');
}

function stopPlayback(message) {
  engine.stopScene();
  state.isPlaying = false;
  updatePlaybackButtons();
  if (message) setStatus(message);
}

function scheduleReplayIfPlaying() {
  if (!state.isPlaying) return;
  if (state.replayTimer) {
    window.clearTimeout(state.replayTimer);
  }
  state.replayTimer = window.setTimeout(async () => {
    state.replayTimer = null;
    const scene = buildLiveScene();
    if (!scene.layers.length) {
      stopPlayback('No tones remain active in the field.');
      return;
    }
    try {
      await engine.playScene(scene);
      state.isPlaying = true;
      updatePlaybackButtons();
      setStatus(`Wardenclyffe updated the field to ${scene.layers.length} tone layer(s).`);
    } catch (error) {
      console.error(error);
      setStatus('Wardenclyffe could not refresh the field.');
    }
  }, 40);
}

function buildLiveScene() {
  const selectedTones = collectSelectedTones();
  return buildSceneFromToneLabSelection({
    sceneName: 'Tone Lab Live Field',
    theme: refs.themeSelect?.value || 'nocturne-garden',
    selectedTones,
    waveform: refs.waveformSelect?.value || 'sine',
    gain: Number(refs.gainControl?.value || 0.1),
    orbitRate: Number(refs.orbitRateControl?.value || 0.05),
    depth: Number(refs.depthControl?.value || 0.7),
    motionEnabled: Boolean(refs.motionEnabled?.checked),
  });
}

function collectSelectedTones() {
  const cards = Array.from(document.querySelectorAll('.tone-card.active'));
  return cards.map((card, index) => {
    const name = card.querySelector('.tone-name')?.textContent?.trim() || `Tone ${index + 1}`;
    const frequencyText = card.querySelector('.tone-frequency')?.textContent?.trim() || '432 Hz';
    const meaningText = card.querySelector('.tone-meaning')?.textContent?.trim() || '';
    const frequency = Number.parseFloat(frequencyText.replace('Hz', '').trim()) || 432;
    const known = findToneByName(name);

    return {
      id: known?.id || `tone-${index + 1}`,
      name,
      frequency,
      meaning: meaningText || known?.meaning || '',
    };
  });
}

function updatePlaybackButtons() {
  if (refs.playButton) refs.playButton.disabled = state.isPlaying;
  if (refs.stopButton) refs.stopButton.disabled = !state.isPlaying;
}

function setStatus(message) {
  if (refs.exportMessage) {
    refs.exportMessage.textContent = message;
  }
}

window.addEventListener('beforeunload', () => {
  stopPlayback();
});

initWardenclyffeToneLabPlayback();
