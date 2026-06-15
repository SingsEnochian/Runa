window.WardenclyffeWasmBridge = (() => {
  const DEFAULT_MANIFEST_URL = "./data/wardenclyffe-wasm-manifest.json";

  let moduleInstance = null;
  let moduleExports = null;
  let manifest = null;
  let status = "fallback";
  let reason = "WASM not loaded yet.";

  async function loadJson(url) {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`WASM manifest unavailable: ${response.status}`);
    return response.json();
  }

  function normalizeManifest(input) {
    if (!input || typeof input !== "object") {
      return { enabled: false, artifact: null, reason: "Manifest was empty." };
    }

    const artifact = input.artifact || {};
    return {
      schema: input.schema || "wardenclyffe.wasm-manifest.v0",
      enabled: input.enabled === true,
      artifact: {
        url: artifact.url || null,
        format: artifact.format || "wasm",
        exports: Array.isArray(artifact.exports) ? artifact.exports : []
      },
      fallback: input.fallback || "js-fluid-field",
      notes: input.notes || ""
    };
  }

  function resolveArtifactUrl(manifestUrl, artifactUrl) {
    if (!artifactUrl) return null;
    return new URL(artifactUrl, new URL(manifestUrl, window.location.href)).toString();
  }

  async function instantiateArtifact(artifactUrl, imports) {
    if (typeof WebAssembly === "undefined") {
      throw new Error("WebAssembly is not available.");
    }

    const response = await fetch(artifactUrl);
    if (!response.ok) {
      throw new Error(`WASM artifact unavailable: ${response.status}`);
    }

    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return WebAssembly.instantiateStreaming(response.clone(), imports);
      } catch {
        // Some static hosts serve .wasm with a generic MIME type. ArrayBuffer keeps Pages-friendly fallback intact.
      }
    }

    const bytes = await response.arrayBuffer();
    return WebAssembly.instantiate(bytes, imports);
  }

  function exported(name) {
    if (!moduleExports) return null;
    return moduleExports[name] || moduleExports[`_${name}`] || null;
  }

  async function load(manifestUrl = DEFAULT_MANIFEST_URL, imports = {}) {
    try {
      manifest = normalizeManifest(await loadJson(manifestUrl));

      if (!manifest.enabled) {
        status = "fallback";
        reason = manifest.notes || "WASM manifest is disabled; using JavaScript fallback.";
        return { ok: false, status, reason, manifest };
      }

      const artifactUrl = resolveArtifactUrl(manifestUrl, manifest.artifact.url);
      if (!artifactUrl) {
        status = "fallback";
        reason = "WASM artifact URL is not configured.";
        return { ok: false, status, reason, manifest };
      }

      const result = await instantiateArtifact(artifactUrl, imports);
      moduleInstance = result.instance;
      moduleExports = moduleInstance.exports;
      status = "wasm";
      reason = "WASM artifact loaded.";
      return { ok: true, status, reason, manifest, exports: Object.keys(moduleExports) };
    } catch (error) {
      status = "fallback";
      reason = error.message;
      return { ok: false, status, reason, manifest };
    }
  }

  function envelope(phaseRadians, depth) {
    const wasmEnvelope = exported("wc_envelope");
    if (typeof wasmEnvelope === "function") {
      return wasmEnvelope(phaseRadians, depth);
    }

    const clampedDepth = Math.max(0, Math.min(1, depth));
    const normalized = (Math.sin(phaseRadians) + 1) * 0.5;
    const eased = normalized * normalized * (3 - 2 * normalized);
    return 1 - clampedDepth + eased * clampedDepth;
  }

  function stepScalarField(field, velocityX, velocityY, width, height, dt, dissipation) {
    const out = new Float32Array(field.length);
    const keep = Math.max(0, Math.min(1, dissipation));

    const indexOf = (x, y) => {
      const cx = Math.max(0, Math.min(width - 1, x));
      const cy = Math.max(0, Math.min(height - 1, y));
      return cy * width + cx;
    };

    const sample = (x, y) => {
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const sx = x - x0;
      const sy = y - y0;
      const a = field[indexOf(x0, y0)];
      const b = field[indexOf(x0 + 1, y0)];
      const c = field[indexOf(x0, y0 + 1)];
      const d = field[indexOf(x0 + 1, y0 + 1)];
      const top = a + (b - a) * sx;
      const bottom = c + (d - c) * sx;
      return (top + (bottom - top) * sy) * keep;
    };

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = y * width + x;
        out[idx] = sample(x - velocityX[idx] * dt, y - velocityY[idx] * dt);
      }
    }

    return out;
  }

  return {
    load,
    envelope,
    stepScalarField,
    get status() {
      return status;
    },
    get reason() {
      return reason;
    },
    get manifest() {
      return manifest;
    }
  };
})();
