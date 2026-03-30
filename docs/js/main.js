document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggle");
  const body = document.body;
  const heading = document.getElementById("modeHeading");
  const description = document.getElementById("modeDescription");
  const storageKey = "runa-theme";

  if (!toggleBtn || !heading || !description) {
    console.warn("Theme controls not found");
    return;
  }

  const applyTheme = (celestial) => {
    body.classList.toggle("celestial", celestial);

    if (celestial) {
      heading.textContent = "Celestial Mode";
      description.textContent = "A cooler nocturnal palette inspired by starlight and moonlit skies.";
      toggleBtn.textContent = "Switch to Norse";
      toggleBtn.setAttribute("aria-label", "Switch to Norse mode");
      localStorage.setItem(storageKey, "celestial");
    } else {
      heading.textContent = "Norse Mode";
      description.textContent = "A grounded dark theme inspired by stone, iron, and firelight.";
      toggleBtn.textContent = "Switch to Celestial";
      toggleBtn.setAttribute("aria-label", "Switch to Celestial mode");
      localStorage.setItem(storageKey, "norse");
    }
  };

  const savedTheme = localStorage.getItem(storageKey);
  applyTheme(savedTheme === "celestial");

  toggleBtn.addEventListener("click", () => {
    applyTheme(!body.classList.contains("celestial"));
  });

  document.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.key.toLowerCase() === "t") {
      applyTheme(!body.classList.contains("celestial"));
    }
  });
});
