(() => {
  const SUPABASE_URL = "https://rufrmjyusalnifpegllj.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_z69-aAbQvzFFDRk4SHDYrQ_FuqirkLD";
  const API = `${SUPABASE_URL}/rest/v1`;
  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    Accept: "application/json",
  };

  const adapter = new window.FlameclyffeAudioAdapter({ masterGain: 0.072 });
  let latestManifest = [];

  const $ = (id) => document.getElementById(id);
  const status = $("cellarStatus");
  const patchSelect = $("patchSelect");
  const playBtn = $("playPatch");
  const stopBtn = $("stopPatch");

  function setStatus(message, tone = "idle") {
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  }

  async function rest(path) {
    const response = await fetch(`${API}/${path}`, { headers });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  }

  async function refreshManifest() {
    latestManifest = await rest("flameclyffe_patch_manifest?select=*&order=slug.asc");
    return latestManifest;
  }

  function selectedPatch() {
    const slug = patchSelect?.value;
    return latestManifest.find((patch) => patch.slug === slug) || latestManifest[0] || null;
  }

  async function playSelected(event) {
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();

    try {
      if (!latestManifest.length) await refreshManifest();
      const patch = selectedPatch();
      const result = await adapter.playPatch(patch);
      stopBtn.disabled = false;
      setStatus(`Adapter playing ${result.patch_name || result.patch_slug}: ${result.voice_count} voice${result.voice_count === 1 ? "" : "s"}.`, "playing");
    } catch (error) {
      console.error(error);
      setStatus(`Adapter failed: ${error.message}`, "error");
    }
  }

  async function stopSelected(event) {
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();
    await adapter.stop();
    stopBtn.disabled = true;
    setStatus("Feather stop. Adapter faded out.", "idle");
  }

  function installHook() {
    if (!playBtn || !stopBtn) return;
    playBtn.addEventListener("click", playSelected, true);
    stopBtn.addEventListener("click", stopSelected, true);

    refreshManifest().catch((error) => {
      console.warn("Flameclyffe adapter manifest prefetch failed", error);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installHook, { once: true });
  } else {
    installHook();
  }
})();
