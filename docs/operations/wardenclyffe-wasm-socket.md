# Wardenclyffe WASM Socket

Wardenclyffe keeps the runtime modular:

- CSS owns the liquid-light skin.
- JavaScript owns consent, browser wiring, and fallback behavior.
- AudioWorklet owns realtime audio-lane isolation.
- C++ owns future fast kernels.
- The WASM manifest decides whether the C++ artifact is active.

This means a missing or disabled WASM artifact should never break the page. The JavaScript fallback remains canonical unless the manifest explicitly enables the compiled artifact.

## Runtime files

```text
docs/js/wardenclyffe-wasm-bridge.js
docs/data/wardenclyffe-wasm-manifest.json
docs/wasm/wardenclyffe_fluid_kernel.wasm
```

The manifest starts disabled:

```json
{
  "enabled": false
}
```

When the artifact is built and committed, set `enabled` to `true`.

## Build command

With Emscripten active locally:

```bash
tools/wardenclyffe/build_wasm.sh
```

The script compiles:

```text
tools/wardenclyffe/wardenclyffe_fluid_kernel.cpp
```

into:

```text
docs/wasm/wardenclyffe_fluid_kernel.wasm
```

It also updates the manifest to enable the artifact by default. To build without changing the manifest:

```bash
WARDENCLYFFE_WASM_ENABLE_MANIFEST=false tools/wardenclyffe/build_wasm.sh
```

## Exported kernel functions

The first C++ socket exposes:

```text
wc_envelope
wc_step_scalar_field
```

The bridge supports either normal export names or Emscripten-style underscore names, so `_wc_envelope` and `_wc_step_scalar_field` are also acceptable.

## Fallback rule

If the manifest is disabled, missing, malformed, or points to an unavailable `.wasm` file, the bridge reports fallback and continues with JavaScript behavior.

That is intentional. Wardenclyffe should degrade gracefully instead of punishing the page for an optional kernel.
