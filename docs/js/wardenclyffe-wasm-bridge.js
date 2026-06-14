window.WardenclyffeWasmBridge = (() => {
  let moduleInstance = null;
  let moduleExports = null;
  let status = "fallback";

  async function load(url = "./wasm/wardenclyffe_fluid_kernel.wasm", imports = {}) {
    if (!WebAssembly || !WebAssembly.instantiateStreaming) {
      status = "fallback";
      return { ok: false, status, reason: "WebAssembly streaming is not available." };
    }

    try {
      const result = await WebAssembly.instantiateStreaming(fetch(url), imports);
      moduleInstance = result.instance;
      moduleExports = moduleInstance.exports;
      status = "wasm";
      return { ok: true, status, exports: Object.keys(moduleExports) };
    } catch (error) {
      status = "fallback";
      return { ok: false, status, reason: error.message };
    }
  }

  function envelope(phaseRadians, depth) {
    if (moduleExports && typeof moduleExports.wc_envelope === "function") {
      return moduleExports.wc_envelope(phaseRadians, depth);
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
    }
  };
})();
