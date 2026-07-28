(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const INSPECTOR_STATES = ['collapsed', 'compact', 'expanded'];
  const INSPECTOR_LABELS = {
    collapsed: 'Collapsed Rail',
    compact: 'Compact Summary',
    expanded: 'Expanded Overlay'
  };

  const shell = {
    inspectorState: 'compact',
    clockTimer: null,
    diagnosticsTimer: null,

    init() {
      this.inspectorState = this.loadInspectorState();
      this.applyInspectorState(this.inspectorState);
      this.bindInspector();
      this.bindDeveloperPanel();
      this.bindProfileObservers();
      this.bindClockObservers();
      this.startClocks();
      this.updateDiagnostics();
      this.diagnosticsTimer = window.setInterval(() => this.updateDiagnostics(), 3000);
    },

    loadInspectorState() {
      try {
        const stored = localStorage.getItem('arkfire:context-inspector');
        return INSPECTOR_STATES.includes(stored) ? stored : 'compact';
      } catch (_) {
        return 'compact';
      }
    },

    saveInspectorState(state) {
      try {
        localStorage.setItem('arkfire:context-inspector', state);
      } catch (_) {}
    },

    bindInspector() {
      byId('inspectorCycle')?.addEventListener('click', () => {
        const index = INSPECTOR_STATES.indexOf(this.inspectorState);
        this.applyInspectorState(INSPECTOR_STATES[(index + 1) % INSPECTOR_STATES.length]);
      });
    },

    applyInspectorState(state) {
      const inspector = byId('contextInspector');
      if (!inspector) return;
      this.inspectorState = state;
      INSPECTOR_STATES.forEach((name) => inspector.classList.remove(`inspector-${name}`));
      inspector.classList.add(`inspector-${state}`);
      inspector.dataset.inspectorState = state;
      byId('inspectorCycle').textContent = `Inspector: ${INSPECTOR_LABELS[state]}`;
      byId('inspectorStatePill').textContent = INSPECTOR_LABELS[state].toLowerCase();
      this.saveInspectorState(state);
      this.updateDiagnostics();
    },

    bindDeveloperPanel() {
      const button = byId('developerToggle');
      const panel = byId('developerPanel');
      if (!button || !panel) return;

      button.addEventListener('click', () => {
        panel.open = !panel.open;
        button.setAttribute('aria-expanded', String(panel.open));
        panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        this.updateDiagnostics();
      });

      panel.addEventListener('toggle', () => {
        button.setAttribute('aria-expanded', String(panel.open));
        this.updateDiagnostics();
      });
    },

    bindProfileObservers() {
      const profileSelect = byId('profileSelect');
      if (!profileSelect) return;

      const sync = () => {
        this.populateToneTriad();
        this.updateWorldClock();
        this.updateDiagnostics();
      };

      profileSelect.addEventListener('change', sync);
      new MutationObserver(sync).observe(profileSelect, { childList: true, subtree: true });
    },

    bindClockObservers() {
      const phaseClock = byId('phaseClock');
      const status = byId('status');
      if (phaseClock) {
        new MutationObserver(() => this.updateBridgeClock()).observe(phaseClock, { childList: true, characterData: true, subtree: true });
      }
      if (status) {
        new MutationObserver(() => {
          this.updateBridgeClock();
          this.updateDiagnostics();
        }).observe(status, { childList: true, characterData: true, subtree: true });
      }
    },

    startClocks() {
      const update = () => {
        const now = new Date();
        const time = new Intl.DateTimeFormat(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZoneName: 'short'
        }).format(now);
        const date = new Intl.DateTimeFormat(undefined, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(now);
        byId('earthClock').textContent = time;
        byId('earthDate').textContent = date;
        this.updateWorldClock();
        this.updateBridgeClock();
      };
      update();
      this.clockTimer = window.setInterval(update, 1000);
    },

    updateWorldClock() {
      const select = byId('profileSelect');
      const selected = select?.selectedOptions?.[0];
      const profileTitle = byId('profileTitle')?.textContent?.trim();
      const name = selected?.textContent?.replace(/\s+·\s+(seed|calibration|review|stable|retired|blocked)$/i, '') || profileTitle || 'No profile';
      byId('worldClock').textContent = name;
      byId('worldClockNote').textContent = 'Native calendar adapter not connected';
    },

    updateBridgeClock() {
      const value = byId('phaseClock')?.textContent?.trim() || '00:00';
      const statusText = byId('status')?.textContent?.trim() || '';
      byId('bridgeClock').textContent = value;
      if (/running/i.test(statusText)) {
        byId('bridgeClockNote').textContent = statusText.replace(/^Running\s+/i, '').replace(/\. Manual controls.*$/i, '');
      } else if (/pause/i.test(statusText)) {
        byId('bridgeClockNote').textContent = 'Feather pause · passage held';
      } else {
        byId('bridgeClockNote').textContent = 'No Timeweaver bridge-time adapter';
      }
    },

    populateToneTriad() {
      const source = byId('profileSelect');
      const worldOne = byId('worldOneSelect');
      const worldTwo = byId('worldTwoSelect');
      if (!source || !worldOne || !worldTwo) return;

      const worldGroup = [...source.querySelectorAll('optgroup')].find((group) => /world reception/i.test(group.label));
      const options = worldGroup ? [...worldGroup.querySelectorAll('option')] : [];
      if (options.length === 0) return;

      const previousOne = worldOne.value;
      const previousTwo = worldTwo.value;
      const markup = options.map((option) => `<option value="${option.value}">${option.textContent}</option>`).join('');
      worldOne.innerHTML = markup;
      worldTwo.innerHTML = markup;

      const selectedWorld = options.some((option) => option.value === source.value) ? source.value : options[0].value;
      worldOne.value = options.some((option) => option.value === previousOne) ? previousOne : selectedWorld;
      const fallbackTwo = options.find((option) => option.value !== worldOne.value)?.value || worldOne.value;
      worldTwo.value = options.some((option) => option.value === previousTwo && previousTwo !== worldOne.value) ? previousTwo : fallbackTwo;
    },

    updateDiagnostics() {
      const diagnostics = byId('developerDiagnostics');
      if (!diagnostics) return;
      const profile = byId('profileSelect')?.value || 'unresolved';
      const variant = byId('variantSelect')?.value || 'default';
      const status = byId('status')?.textContent?.trim() || 'unknown';
      const phase = byId('phaseClock')?.textContent?.trim() || '00:00';
      const enabledLayers = document.querySelectorAll('[data-layer-toggle]:checked').length;
      const totalLayers = document.querySelectorAll('[data-layer-toggle]').length;
      const developerOpen = Boolean(byId('developerPanel')?.open);

      diagnostics.textContent = JSON.stringify({
        parent_product: 'Arkfire Dimensional World Bridge',
        subsystem: 'Glyph & Tone Studio',
        surface: 'World Reception Gate',
        profile,
        variant,
        inspector_state: this.inspectorState,
        developer_open: developerOpen,
        phase_clock: phase,
        status,
        layers: { enabled: enabledLayers, total: totalLayers },
        runtime_support: {
          profile_loading: 'supported',
          protected_binaural: 'supported',
          phase_gain_orchestration: 'supported',
          macro_envelopes: 'blocked',
          declared_close_fade: 'partial',
          playback_receipts: 'blocked',
          journey_rendering: 'definition-only',
          bridge_tone_derivation: 'contract-pending'
        },
        source_authority: {
          archive: 'arkfiredesignconcepts.zip',
          archive_commit: '4d65ee5a693434a8edeba21b1b0b84128f0a9a07',
          preservation_matrix: 'docs/ARKFIRE_DESIGN_ARCHIVE_PRESERVATION_MATRIX.md',
          capability_atlas: 'docs/ARKFIRE_CONSOLIDATED_CAPABILITY_ATLAS_V0_1.md'
        }
      }, null, 2);
    }
  };

  window.addEventListener('DOMContentLoaded', () => shell.init());
})();
