document.addEventListener("DOMContentLoaded", () => {
  const stationCards = [...document.querySelectorAll(".bench-card")];
  const status = document.getElementById("benchStatus");
  const stationTitle = document.getElementById("activeStationTitle");
  const stationCopy = document.getElementById("activeStationCopy");
  const modeReadout = document.getElementById("modeReadout");
  const modeToggle = document.getElementById("benchModeToggle");
  const body = document.body;

  const stationText = {
    Resonance: "Establish the field gently. Choose a mode, let the interface respond, and leave an exit tone within reach.",
    "Stitch Tray": "Pin one exact line. The tray is for active signal, not archive sprawl.",
    "Grove Ledger": "Record a bead, then choose whether it is kept, released, or revisited. The Grove breathes because it is not overfilled.",
    "Tesla Bench": "Name the problem in Nature's terms. Visualise the ideal mechanism. Work backward into constraints. Test what remains unknown."
  };

  const modes = {
    Feather: "432 Hz | pause, soften, consent-check, graceful exit.",
    Wrap: "528 Hz | containment, warmth, settle the field.",
    Seldrin: "741 Hz | clarity, clean signal, no storm.",
    Notch: "603 Hz | re-link, focus, return to the room.",
    Lantern: "888 Hz | witness, guidance, steady attention."
  };

  const setStation = (card) => {
    const station = card.dataset.station;
    stationCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    stationTitle.textContent = station;
    stationCopy.textContent = stationText[station];
    status.textContent = `${station} awake: copper trace carrying signal.`;
  };

  stationCards.forEach((card) => {
    card.addEventListener("click", () => setStation(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setStation(card);
      }
    });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      modeReadout.textContent = `${mode}: ${modes[mode]}`;
      status.textContent = `${mode} selected. The bench adjusts without scolding.`;
    });
  });

  modeToggle?.addEventListener("click", () => {
    const grove = body.classList.toggle("grove-glow");
    modeToggle.textContent = grove ? "Switch to Wardenclyffe" : "Switch to Grove Glow";
    status.textContent = grove
      ? "Grove Glow active: mosslight under copper."
      : "Wardenclyffe active: coils bright, field steady.";
  });

  const addListItem = (list, text) => {
    const item = document.createElement("li");
    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    item.textContent = `[${stamp}] ${text}`;
    list.prepend(item);
  };

  document.getElementById("pinLine")?.addEventListener("click", () => {
    const input = document.getElementById("stitchInput");
    const text = input.value.trim();
    if (!text) return;
    addListItem(document.getElementById("stitchList"), text);
    input.value = "";
    status.textContent = "Line pinned. Scroll-depth denied its supper.";
  });

  document.querySelectorAll("[data-ledger]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById("ledgerInput");
      const text = input.value.trim();
      if (!text) return;
      addListItem(document.getElementById("ledgerList"), `${button.dataset.ledger}: ${text}`);
      input.value = "";
      status.textContent = `Ledger bead marked: ${button.dataset.ledger}.`;
    });
  });

  document.getElementById("generateNote")?.addEventListener("click", () => {
    const input = document.getElementById("ideaInput");
    const idea = input.value.trim() || "Unnamed apparatus";
    document.getElementById("teslaNote").textContent = [
      `Problem in Nature's terms: ${idea}`,
      "Ideal mechanism: See the complete operation before touching the apparatus.",
      "Engineering constraints: power, safety, clarity, consent, interface simplicity.",
      "Unknowns to test: what changes under load, repetition, fatigue, and real use?",
      "Next experiment: build the smallest observable version and record the result without embellishment."
    ].join("\n");
    status.textContent = "Tesla Method note generated. The first coil turns.";
  });
});
