import { buildSceneFromToneLabSelection } from './wardenclyffe/tone-lab-adapter.js';
import { saveScene } from './wardenclyffe/scene-store.js';
import { findToneByName } from './wardenclyffe/tone-library.js';

const AUTOLOAD_KEY = 'wardenclyffe:auto-load-scene';

function initToneLabWardenclyffeBridge() {
  const button = document.getElementById('openInWardenclyffeButton');
  const themeSelect = document.getElementById('themeSelect');
  const waveformSelect = document.getElementById('waveformSelect');
  const gainControl = document.getElementById('gainControl');
  const orbitRateControl = document.getElementById('orbitRateControl');
  const depthControl = document.getElementById('depthControl');
  const motionEnabled = document.getElementById('motionEnabled');
  const exportMessage = document.getElementById('exportMessage');

  if (!button) return;

  button.addEventListener('click', async () => {
    const selectedTones = collectSelectedTones();
    if (!selectedTones.length) {
      if (exportMessage) {
        exportMessage.textContent = 'Select at least one tone before opening the field in Wardenclyffe.';
      }
      return;
    }

    const scene = buildSceneFromToneLabSelection({
      sceneName: `Tone Lab Transfer — ${new Date().toLocaleString()}`,
      theme: themeSelect?.value || 'nocturne-garden',
      selectedTones,
      waveform: waveformSelect?.value || 'sine',
      gain: Number(gainControl?.value || 0.1),
      orbitRate: Number(orbitRateControl?.value || 0.05),
      depth: Number(depthControl?.value || 0.7),
      motionEnabled: Boolean(motionEnabled?.checked),
    });

    try {
      await saveScene(scene);
      window.sessionStorage.setItem(AUTOLOAD_KEY, scene.id);
      window.location.href = './wardenclyffe.html?autoload=1';
    } catch (error) {
      if (exportMessage) {
        exportMessage.textContent = 'Wardenclyffe handoff failed. The scene could not be saved.';
      }
      console.error(error);
    }
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

initToneLabWardenclyffeBridge();
