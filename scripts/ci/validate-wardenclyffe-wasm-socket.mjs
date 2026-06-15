#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const manifestPath = resolve(root, "docs/data/wardenclyffe-wasm-manifest.json");
const bridgePath = resolve(root, "docs/js/wardenclyffe-wasm-bridge.js");
const kernelPath = resolve(root, "tools/wardenclyffe/wardenclyffe_fluid_kernel.cpp");

function fail(message) {
  console.error(`Wardenclyffe WASM socket validation failed: ${message}`);
  process.exit(1);
}

function read(path) {
  if (!existsSync(path)) fail(`missing required file ${path}`);
  return readFileSync(path, "utf8");
}

const manifest = JSON.parse(read(manifestPath));
const bridge = read(bridgePath);
const kernel = read(kernelPath);

if (manifest.schema !== "wardenclyffe.wasm-manifest.v0") {
  fail(`unexpected manifest schema ${manifest.schema}`);
}

if (typeof manifest.enabled !== "boolean") {
  fail("manifest.enabled must be boolean");
}

if (!manifest.artifact || manifest.artifact.url !== "../wasm/wardenclyffe_fluid_kernel.wasm") {
  fail("manifest artifact URL must point to ../wasm/wardenclyffe_fluid_kernel.wasm");
}

for (const expectedExport of ["wc_envelope", "wc_step_scalar_field"]) {
  if (!manifest.artifact.exports?.includes(expectedExport)) {
    fail(`manifest missing export ${expectedExport}`);
  }
  if (!kernel.includes(expectedExport)) {
    fail(`kernel missing export ${expectedExport}`);
  }
}

for (const bridgeNeedle of ["DEFAULT_MANIFEST_URL", "normalizeManifest", "instantiateArtifact", "exported(\"wc_envelope\")", "stepScalarField"]) {
  if (!bridge.includes(bridgeNeedle)) {
    fail(`bridge missing ${bridgeNeedle}`);
  }
}

if (manifest.enabled) {
  const artifactPath = resolve(root, "docs/wasm/wardenclyffe_fluid_kernel.wasm");
  if (!existsSync(artifactPath)) {
    fail("manifest enables WASM, but docs/wasm/wardenclyffe_fluid_kernel.wasm is missing");
  }
}

console.log("Wardenclyffe WASM socket validation passed.");
