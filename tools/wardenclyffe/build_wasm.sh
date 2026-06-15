#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOURCE_FILE="${ROOT_DIR}/tools/wardenclyffe/wardenclyffe_fluid_kernel.cpp"
OUT_DIR="${ROOT_DIR}/docs/wasm"
OUT_FILE="${OUT_DIR}/wardenclyffe_fluid_kernel.wasm"
MANIFEST_FILE="${ROOT_DIR}/docs/data/wardenclyffe-wasm-manifest.json"
ENABLE_MANIFEST="${WARDENCLYFFE_WASM_ENABLE_MANIFEST:-true}"

if ! command -v emcc >/dev/null 2>&1; then
  cat >&2 <<'MSG'
Wardenclyffe WASM build requires Emscripten's emcc.
Install/activate the Emscripten SDK, then run this script again.
MSG
  exit 127
fi

mkdir -p "${OUT_DIR}"

emcc "${SOURCE_FILE}" \
  -O3 \
  --no-entry \
  -s STANDALONE_WASM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_wc_step_scalar_field","_wc_envelope","_malloc","_free"]' \
  -o "${OUT_FILE}"

if [[ "${ENABLE_MANIFEST}" == "true" ]]; then
  python3 - <<'PY' "${MANIFEST_FILE}"
import json
import pathlib
import sys

manifest_path = pathlib.Path(sys.argv[1])
data = json.loads(manifest_path.read_text())
data["enabled"] = True
data.setdefault("artifact", {})["url"] = "../wasm/wardenclyffe_fluid_kernel.wasm"
data["artifact"]["format"] = "wasm"
data["artifact"]["exports"] = ["wc_envelope", "wc_step_scalar_field"]
data["notes"] = "WASM artifact built from tools/wardenclyffe/wardenclyffe_fluid_kernel.cpp. JavaScript fallback remains available if loading fails."
manifest_path.write_text(json.dumps(data, indent=2) + "\n")
PY
fi

printf 'Built %s\n' "${OUT_FILE}"
