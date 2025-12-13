document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggle");
  const body = document.body;
  const heading = document.querySelector("h1");

  if (!toggleBtn) {
    console.warn("Theme toggle button not found");
    return;
  }

  toggleBtn.addEventListener("click", () => {
    const celestial = body.classList.toggle("celestial");

    if (celestial) {
      heading.textContent = "Celestial Mode";
      toggleBtn.textContent = "Switch to Norse";
    } else {
      heading.textContent = "Norse Mode";
      toggleBtn.textContent = "Switch to Celestial";
    }
  });
});
