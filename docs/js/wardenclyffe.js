document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const fieldReadout = document.getElementById("fieldReadout");
  const stageCaption = document.getElementById("stageCaption");
  const stateCards = [...document.querySelectorAll(".state-card")];
  const towerCore = document.getElementById("towerCore");
  const presetReadout = document.getElementById("presetReadout");
  const logInput = document.getElementById("wcLogInput");
  const logList = document.getElementById("wcLog");

  const states = {
    idle: {
      readout: "Idle: sleeping coils, faint hum, lantern lit.",
      caption: "The field is quiet. This is not failure; it is readiness."
    },
    touched: {
      readout: "Touched: the console wakes under the hand.",
      caption: "Copper acknowledges contact. The first circuit closes."
    },
    tuning: {
      readout: "Tuning: traces brighten and signal begins to travel.",
      caption: "The apparatus is adjusting. Observe before commanding."
    },
    found: {
      readout: "Found Interesting: a clean flare marks attention.",
      caption: "Something has caught the instrument. Record it without embellishment."
    },
    settled: {
      readout: "Settled: the field softens into coherence.",
      caption: "The current is no longer chasing itself. Work may proceed."
    }
  };

  const presets = {
    Feather: "432 Hz | pause, soften, consent-check, graceful exit.",
    Seldrin: "741 Hz | clarity, clean signal, no storm.",
    Wrap: "528 Hz | containment, warmth, settle the field.",
    Notch: "603 Hz | re-link, focus, return to the room.",
    Lantern: "888 Hz | witness, guidance, steady attention.",
    "Pain Day": "Low demand | gentle visuals, no pressure, one small useful step.",
    "Council Clarity": "Discernment | reduce noise, preserve exact language, keep the room fair.",
    Dreamwork: "Receptive | image-first, ledger-light, no forced interpretation.",
    "Tesla Storm": "Inventive | high spark, structured notes, test what remains unknown."
  };

  const setState = (nextState) => {
    const state = states[nextState] ? nextState : "idle";
    body.dataset.field = state;
    fieldReadout.textContent = states[state].readout;
    stageCaption.textContent = states[state].caption;
    stateCards.forEach((card) => card.classList.toggle("active", card.dataset.state === state));
  };

  stateCards.forEach((card) => {
    card.addEventListener("click", () => setState(card.dataset.state));
  });

  const cycleStates = ["idle", "touched", "tuning", "found", "settled"];
  const wakeNext = () => {
    const current = body.dataset.field || "idle";
    const nextIndex = (cycleStates.indexOf(current) + 1) % cycleStates.length;
    setState(cycleStates[nextIndex]);
  };

  towerCore?.addEventListener("click", wakeNext);
  towerCore?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      wakeNext();
    }
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.preset;
      presetReadout.textContent = `${preset}: ${presets[preset]}`;

      if (preset === "Feather" || preset === "Pain Day" || preset === "Wrap") setState("settled");
      else if (preset === "Tesla Storm" || preset === "Council Clarity") setState("tuning");
      else if (preset === "Dreamwork" || preset === "Lantern") setState("found");
      else setState("touched");
    });
  });

  const addLog = (mode, text) => {
    const item = document.createElement("li");
    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    item.textContent = `[${stamp}] ${mode}: ${text}`;
    logList.prepend(item);
  };

  document.querySelectorAll("[data-log]").forEach((button) => {
    button.addEventListener("click", () => {
      const text = logInput.value.trim();
      if (!text) return;
      addLog(button.dataset.log, text);
      logInput.value = "";
      setState(button.dataset.log === "Release" ? "settled" : "found");
    });
  });

  setState("idle");
});
