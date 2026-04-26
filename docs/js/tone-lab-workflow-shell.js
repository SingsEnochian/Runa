import { buildSceneFromToneLabSelection } from './wardenclyffe/tone-lab-adapter.js';
import { saveScene } from './wardenclyffe/scene-store.js';

(() => {
  const labPanel = document.querySelector('[data-tab-panel="lab"]');
  if (!labPanel || document.getElementById('buildFieldStep')) return;

  injectWorkflowStyles();

  const originalChildren = Array.from(labPanel.children);
  if (!originalChildren.length) return;

  const shell = document.createElement('section');
  shell.className = 'workflow-shell';
  shell.dataset.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'true' : 'false';

  const buildFieldStep = document.createElement('section');
  buildFieldStep.id = 'buildFieldStep';
  buildFieldStep.className = 'step-panel is-active';
  buildFieldStep.dataset.step = 'build-field';
  buildFieldStep.dataset.state = 'active';
  buildFieldStep.setAttribute('aria-labelledby', 'buildFieldTitle');

  const stepFrame = document.createElement('div');
  stepFrame.className = 'step-frame';
  stepFrame.innerHTML = `
    <div class="copper-trace copper-trace-top" aria-hidden="true"></div>
    <header class="step-header">
      <div class="step-kicker">
        <span class="step-number">Step 1</span>
        <span class="step-feather" aria-hidden="true">🪶</span>
      </div>
      <h2 id="buildFieldTitle">Build Field</h2>
      <p class="step-subtitle">Select tones, shape the field, and commit it when the chamber is ready.</p>
    </header>
    <div class="step-body">
      <div id="buildFieldWorkbench"></div>
      <footer class="step-actions">
        <div class="step-status" id="buildFieldStatus" aria-live="polite">Select at least one tone to arm this chamber.</div>
        <div class="button-row wrap-row">
          <button id="previewFieldButton" class="ghost-button" type="button">Preview Field</button>
          <button id="saveFieldButton" class="accent-button" type="button" disabled>Save Field</button>
        </div>
      </footer>
    </div>
    <div class="step-summary" id="buildFieldSummary" hidden>
      <div class="summary-left">
        <div class="summary-feather" aria-hidden="true">🪶</div>
        <div>
          <strong class="summary-title">Build Field — Completed</strong>
          <p class="summary-meta" id="buildFieldSummaryMeta">No field committed yet.</p>
        </div>
      </div>
      <div class="summary-actions">
        <button id="editFieldButton" class="ghost-button" type="button">Edit</button>
      </div>
    </div>
    <div class="spark-layer" aria-hidden="true"></div>
  `;
  buildFieldStep.appendChild(stepFrame);

  const divider = document.createElement('div');
  divider.id = 'fieldToWardenclyffeDivider';
  divider.className = 'step-divider';
  divider.hidden = true;
  divider.innerHTML = `
    <div class="divider-line"></div>
    <div class="divider-feathers" aria-hidden="true"><span>🪶</span><span>🪶</span></div>
    <p class="divider-copy">Current transferred. Proceed to Wardenclyffe.</p>
  `;

  const wardenclyffeStep = document.createElement('section');
  wardenclyffeStep.id = 'wardenclyffeStep';
  wardenclyffeStep.className = 'step-panel';
  wardenclyffeStep.dataset.step = 'wardenclyffe';
  wardenclyffeStep.dataset.state = 'idle';
  wardenclyffeStep.hidden = true;
  wardenclyffeStep.setAttribute('aria-labelledby', 'wardenclyffeTitle');
  wardenclyffeStep.innerHTML = `
    <div class="step-frame">
      <header class="step-header">
        <div class="step-kicker">
          <span class="step-number">Step 2</span>
          <span class="step-feather" aria-hidden="true">🪶</span>
        </div>
        <h2 id="wardenclyffeTitle">Refine in Wardenclyffe</h2>
        <p class="step-subtitle">The saved field is now ready to become a scene.</p>
      </header>
      <div class="step-body">
        <p id="wardenclyffeIntro">Save the field first. This chamber will then open automatically.</p>
        <div class="button-row wrap-row">
          <button id="openWardenclyffeStepButton" class="accent-button" type="button">Open in Wardenclyffe</button>
        </div>
      </div>
    </div>
  `;

  shell.appendChild(buildFieldStep);
  shell.appendChild(divider);
  shell.appendChild(wardenclyffeStep);
  labPanel.appendChild(shell);

  const workbench = stepFrame.querySelector('#buildFieldWorkbench');
  originalChildren.forEach((child) => workbench.appendChild(child));

  const refs = {
    shell,
    buildFieldStep,
    divider,
    wardenclyffeStep,
    buildFieldStatus: document.getElementById('buildFieldStatus'),
    saveFieldButton: document.getElementById('saveFieldButton'),
    previewFieldButton: document.getElementById('previewFieldButton'),
    buildFieldSummary: document.getElementById('buildFieldSummary'),
    buildFieldSummaryMeta: document.getElementById('buildFieldSummaryMeta'),
    editFieldButton: document.getElementById('editFieldButton'),
    openWardenclyffeStepButton: document.getElementById('openWardenclyffeStepButton'),
    themeSelect: document.getElementById('themeSelect'),
    waveformSelect: document.getElementById('waveformSelect'),
    gainControl: document.getElementById('gainControl'),
    orbitRateControl: document.getElementById('orbitRateControl'),
    depthControl: document.getElementById('depthControl'),
    reverbControl: document.getElementById('reverbControl'),
    motionEnabled: document.getElementById('motionEnabled'),
    playSelectedButton: document.getElementById('playSelectedButton'),
    toneGroups: document.getElementById('toneGroups'),
    presetButtons: document.getElementById('presetButtons'),
    addCustomToneButton: document.getElementById('addCustomToneButton'),
    exportMessage: document.getElementById('exportMessage'),
  };

  const fieldModel = {
    selectedTones: [],
    waveform: 'sine',
    gain: 0.1,
    orbitRate: 0.05,
    depth: 1.5,
    reverb: 0.5,
    motionEnabled: true,
    savedSceneId: null,
    savedAt: null,
  };

  function setStepState(stepEl, state) {
    if (stepEl) stepEl.dataset.state = state;
  }

  function collectSelectedTones() {
    return Array.from(document.querySelectorAll('.tone-card.active')).map((card, index) => {
      const name = card.querySelector('.tone-name')?.textContent?.trim() || `Tone ${index + 1}`;
      const frequencyText = card.querySelector('.tone-frequency')?.textContent?.trim() || '432 Hz';
      const meaning = card.querySelector('.tone-meaning')?.textContent?.trim() || '';
      const frequency = Number.parseFloat(frequencyText.replace('Hz', '').trim()) || 432;
      return { name, frequency, meaning };
    });
  }

  function refreshFieldModel() {
    fieldModel.selectedTones = collectSelectedTones();
    fieldModel.waveform = refs.waveformSelect?.value || 'sine';
    fieldModel.gain = Number(refs.gainControl?.value || 0.1);
    fieldModel.orbitRate = Number(refs.orbitRateControl?.value || 0.05);
    fieldModel.depth = Number(refs.depthControl?.value || 1.5);
    fieldModel.reverb = Number(refs.reverbControl?.value || 0.5);
    fieldModel.motionEnabled = Boolean(refs.motionEnabled?.checked);
  }

  function refreshBuildFieldReadiness() {
    refreshFieldModel();
    const ready = fieldModel.selectedTones.length > 0;
    if (refs.buildFieldStep.dataset.state !== 'collapsed') {
      setStepState(refs.buildFieldStep, ready ? 'armed' : 'active');
    }
    refs.saveFieldButton.disabled = !ready;
    refs.buildFieldStatus.textContent = ready
      ? 'Field ready. Commit when satisfied.'
      : 'Select at least one tone to arm this chamber.';
  }

  async function saveField() {
    refreshFieldModel();
    if (!fieldModel.selectedTones.length) return;

    setStepState(refs.buildFieldStep, 'saving');
    refs.buildFieldStatus.textContent = 'Conducting current and committing field...';

    const scene = buildSceneFromToneLabSelection({
      sceneName: `Tone Lab Field — ${new Date().toLocaleString()}`,
      theme: refs.themeSelect?.value || 'nocturne-garden',
      selectedTones: fieldModel.selectedTones,
      waveform: fieldModel.waveform,
      gain: fieldModel.gain,
      orbitRate: fieldModel.orbitRate,
      depth: fieldModel.depth,
      motionEnabled: fieldModel.motionEnabled,
    });

    await saveScene(scene);
    fieldModel.savedSceneId = scene.id;
    fieldModel.savedAt = new Date().toISOString();

    await wait(420);
    setStepState(refs.buildFieldStep, 'folding');
    await wait(420);

    refs.buildFieldSummary.hidden = false;
    refs.buildFieldSummaryMeta.textContent = `${fieldModel.selectedTones.length} tones · ${fieldModel.waveform} · ${fieldModel.motionEnabled ? '8D on' : '8D off'}`;
    setStepState(refs.buildFieldStep, 'collapsed');

    refs.divider.hidden = false;
    refs.divider.classList.remove('is-revealed');
    refs.wardenclyffeStep.hidden = false;
    refs.wardenclyffeStep.classList.remove('is-revealed');

    window.requestAnimationFrame(() => {
      refs.divider.classList.add('is-revealed');
      refs.wardenclyffeStep.classList.add('is-revealed');
      setStepState(refs.wardenclyffeStep, 'active');
    });

    refs.exportMessage && (refs.exportMessage.textContent = 'Field saved. Proceed to Wardenclyffe.');
  }

  function reopenBuildField() {
    refs.divider.classList.remove('is-revealed');
    refs.wardenclyffeStep.classList.remove('is-revealed');
    refs.divider.hidden = true;
    refs.wardenclyffeStep.hidden = true;
    refs.buildFieldSummary.hidden = true;
    setStepState(refs.buildFieldStep, 'active');
    refreshBuildFieldReadiness();
  }

  function scheduleRefresh() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(refreshBuildFieldReadiness);
    });
  }

  refs.previewFieldButton?.addEventListener('click', () => {
    refs.playSelectedButton?.click();
  });

  refs.saveFieldButton?.addEventListener('click', () => {
    saveField().catch((error) => {
      console.error(error);
      refs.buildFieldStatus.textContent = 'The field could not be committed.';
      setStepState(refs.buildFieldStep, 'armed');
    });
  });

  refs.editFieldButton?.addEventListener('click', reopenBuildField);

  refs.openWardenclyffeStepButton?.addEventListener('click', () => {
    if (!fieldModel.savedSceneId) return;
    window.sessionStorage.setItem('wardenclyffe:auto-load-scene', fieldModel.savedSceneId);
    window.location.href = './wardenclyffe.html?autoload=1';
  });

  refs.toneGroups?.addEventListener('click', scheduleRefresh);
  refs.presetButtons?.addEventListener('click', scheduleRefresh);
  refs.addCustomToneButton?.addEventListener('click', scheduleRefresh);

  [refs.waveformSelect, refs.gainControl, refs.orbitRateControl, refs.depthControl, refs.reverbControl, refs.motionEnabled]
    .filter(Boolean)
    .forEach((element) => {
      element.addEventListener('input', refreshBuildFieldReadiness);
      element.addEventListener('change', refreshBuildFieldReadiness);
    });

  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(workbench, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  refreshBuildFieldReadiness();

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function injectWorkflowStyles() {
    if (document.getElementById('toneLabWorkflowStyles')) return;
    const style = document.createElement('style');
    style.id = 'toneLabWorkflowStyles';
    style.textContent = `
      .workflow-shell { display: grid; gap: 1rem; }
      .step-panel { position: relative; transition: transform 420ms ease, opacity 320ms ease, filter 320ms ease; }
      .step-frame { position: relative; overflow: hidden; border-radius: 22px; border: 1px solid color-mix(in srgb, var(--border) 78%, transparent); background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), color-mix(in srgb, var(--card) 88%, transparent); box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 32px rgba(0,0,0,0.18); transition: transform 420ms ease, box-shadow 320ms ease, opacity 320ms ease; }
      .step-header, .step-body { padding: 1rem 1.1rem; }
      .step-summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; max-height: 0; opacity: 0; overflow: hidden; padding: 0 1.1rem; transition: max-height 360ms ease, opacity 260ms ease, padding 260ms ease; }
      .step-kicker { display: flex; gap: 0.5rem; align-items: center; font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
      .step-header h2 { margin: 0.35rem 0 0.25rem; }
      .step-subtitle { margin: 0; color: var(--muted); }
      .step-actions { display: flex; flex-wrap: wrap; gap: 0.85rem; align-items: center; justify-content: space-between; margin-top: 1rem; }
      .step-status { color: var(--muted); font-size: 0.92rem; }
      .summary-left { display: flex; gap: 0.8rem; align-items: center; }
      .summary-feather { font-size: 1.25rem; filter: drop-shadow(0 0 8px rgba(255,255,255,0.25)); }
      .summary-meta { margin: 0.15rem 0 0; color: var(--muted); }
      .copper-trace { position: absolute; left: 0; right: 0; height: 2px; top: 0; background: linear-gradient(90deg, rgba(184,115,51,0.12), rgba(212,140,64,0.7), rgba(184,115,51,0.12)); opacity: 0.45; transform-origin: left center; }
      .spark-layer { position: absolute; inset: 0; pointer-events: none; opacity: 0; }
      .step-divider { display: grid; justify-items: center; gap: 0.45rem; padding: 0.35rem 0 0.6rem; color: var(--muted); opacity: 0; transform: translateY(-10px); transition: opacity 320ms ease, transform 420ms ease; }
      .step-divider.is-revealed { opacity: 1; transform: translateY(0); }
      .divider-line { width: 2px; height: 24px; background: linear-gradient(180deg, rgba(210,145,78,0.7), rgba(255,255,255,0.15)); }
      .divider-feathers { display: flex; gap: 0.35rem; font-size: 1rem; }
      .divider-copy { margin: 0; font-size: 0.9rem; }
      .step-panel[data-state="active"] .step-frame { box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 36px rgba(0,0,0,0.2), 0 0 0 1px rgba(210,145,78,0.08); }
      .step-panel[data-state="armed"] .copper-trace { opacity: 0.8; box-shadow: 0 0 10px rgba(212,140,64,0.35); }
      .step-panel[data-state="saving"] .copper-trace { animation: chargePass 520ms ease-in-out; }
      .step-panel[data-state="saving"] .spark-layer { opacity: 1; animation: sparkFlash 360ms ease-out; }
      .step-panel[data-state="folding"] .step-frame { transform: perspective(1200px) rotateX(6deg) translateY(-6px) scale(0.988); }
      .step-panel[data-state="folding"] .step-body, .step-panel[data-state="folding"] .step-header { opacity: 0; transform: translateY(-12px); transition: opacity 320ms ease, transform 320ms ease; }
      .step-panel[data-state="collapsed"] .step-header, .step-panel[data-state="collapsed"] .step-body { display: none; }
      .step-panel[data-state="collapsed"] .step-summary { max-height: 180px; opacity: 1; padding: 1rem 1.1rem; }
      #wardenclyffeStep { opacity: 0; transform: translateY(16px) scale(0.985); }
      #wardenclyffeStep.is-revealed { opacity: 1; transform: translateY(0) scale(1); }
      .workflow-shell[data-reduced-motion="true"] * { animation-duration: 1ms !important; transition-duration: 1ms !important; }
      @keyframes chargePass { 0% { transform: scaleX(0.08); opacity: 0.3; } 50% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1); opacity: 0.75; } }
      @keyframes sparkFlash { 0% { background: radial-gradient(circle at 18% 0%, rgba(255,220,170,0.7), transparent 18%); } 100% { background: radial-gradient(circle at 72% 0%, rgba(255,220,170,0), transparent 24%); } }
    `;
    document.head.appendChild(style);
  }
})();
