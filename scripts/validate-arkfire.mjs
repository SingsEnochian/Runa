#!/usr/bin/env node

import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const docs = path.join(root, 'docs');
const registryPath = path.join(docs, 'profiles', 'arkfire', 'registry.v0.1.json');
const journeyPath = path.join(docs, 'journeys', 'ten-state-cognitive-roadmap.v0.1.json');
const errors = [];
const warnings = [];

const loadJson = async (filePath) => {
  const raw = await readFile(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${path.relative(root, filePath)} is not valid JSON: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const warn = (condition, message) => {
  if (!condition) warnings.push(message);
};

const closeEnough = (a, b, tolerance = 0.001) => Math.abs(a - b) <= tolerance;
const phaseOrder = ['baseline', 'vestibule', 'arrival', 'immersion', 'return'];

const validateLayer = (profile, layer) => {
  const prefix = `${profile.slug}:${layer.id}`;
  assert(typeof layer.id === 'string' && layer.id.length > 0, `${prefix} needs an id.`);
  assert(typeof layer.gain_db === 'number' && layer.gain_db <= 0, `${prefix} gain_db must be a non-positive number.`);
  assert(layer.phase_continuous === true, `${prefix} must declare phase_continuous: true.`);
  assert(typeof layer.routing?.mode === 'string', `${prefix} needs routing.mode.`);
  assert(typeof layer.evidence_label === 'string', `${prefix} needs evidence_label.`);
  assert(typeof layer.collision_policy === 'string', `${prefix} needs collision_policy.`);

  if (layer.type === 'true-binaural') {
    const left = layer.signal?.left_hz;
    const right = layer.signal?.right_hz;
    const beat = layer.signal?.beat_hz;
    assert(Number.isFinite(left) && Number.isFinite(right) && Number.isFinite(beat), `${prefix} requires left_hz, right_hz, and beat_hz.`);
    if (Number.isFinite(left) && Number.isFinite(right) && Number.isFinite(beat)) {
      assert(closeEnough(Math.abs(left - right), beat), `${prefix} beat math is wrong: |${left} - ${right}| != ${beat}.`);
    }
    assert(layer.routing.mode === 'protected-stereo', `${prefix} must use protected-stereo routing.`);
  }

  if (layer.type === 'haptic-reference') {
    assert(layer.routing.mode === 'haptic-only', `${prefix} haptic reference must use haptic-only routing.`);
  }

  if (layer.type === 'noise') {
    assert(['pink', 'white'].includes(layer.signal?.noise_type), `${prefix} noise layer needs pink or white noise_type.`);
  }

  if (layer.signal?.filter) {
    const { min_hz: minHz, max_hz: maxHz } = layer.signal.filter;
    if (Number.isFinite(minHz) && Number.isFinite(maxHz)) {
      assert(minHz < maxHz, `${prefix} filter min_hz must be below max_hz.`);
    }
  }
};

const validateProfile = (profile, registryEntry) => {
  const prefix = profile.slug || registryEntry.slug;
  assert(profile.schema_version === '1.0', `${prefix} schema_version must be 1.0.`);
  assert(profile.slug === registryEntry.slug, `${prefix} slug does not match registry.`);
  assert(profile.route === `/arkfire.html?profile=${profile.slug}`, `${prefix} route must be its Arkfire query route.`);
  assert(['world', 'signal-protocol'].includes(profile.profile_kind), `${prefix} has invalid profile_kind.`);
  assert(['seed', 'calibration', 'review', 'stable', 'retired', 'blocked'].includes(profile.status), `${prefix} has invalid status.`);
  assert(profile.identity?.tone?.trim(), `${prefix} needs identity.tone.`);
  assert(profile.identity?.shape?.trim(), `${prefix} needs identity.shape.`);
  assert(profile.identity?.arrival_signature?.trim(), `${prefix} needs arrival_signature.`);
  assert(profile.identity?.return_signature?.trim(), `${prefix} needs return_signature.`);
  assert(Array.isArray(profile.layers) && profile.layers.length > 0, `${prefix} needs layers.`);
  assert(Array.isArray(profile.phases) && profile.phases.length === 5, `${prefix} needs exactly five phases.`);
  assert(profile.safety?.automatic_start_allowed === false, `${prefix} may not allow automatic audio start.`);
  assert(profile.change_control?.automatic_changes_allowed === false, `${prefix} may not allow automatic profile changes.`);

  const layerIds = new Set();
  for (const layer of profile.layers || []) {
    assert(!layerIds.has(layer.id), `${prefix} repeats layer id ${layer.id}.`);
    layerIds.add(layer.id);
    validateLayer(profile, layer);
  }

  (profile.phases || []).forEach((phase, index) => {
    assert(phase.id === phaseOrder[index], `${prefix} phase ${index + 1} must be ${phaseOrder[index]}, not ${phase.id}.`);
    assert(Number.isInteger(phase.duration_seconds) && phase.duration_seconds > 0, `${prefix}:${phase.id} duration must be a positive integer.`);
    for (const [layerId, state] of Object.entries(phase.layer_states || {})) {
      assert(layerIds.has(layerId), `${prefix}:${phase.id} references unknown layer ${layerId}.`);
      assert(typeof state.enabled === 'boolean', `${prefix}:${phase.id}:${layerId} needs enabled boolean.`);
    }
  });

  for (const claim of profile.claims || []) {
    if (/pineal|third eye|overview effect|weightless|detachment|brain entrain|forces? respiration/i.test(claim.text)) {
      assert(!['established-science', 'evidence-backed-finding'].includes(claim.label), `${prefix} overstates claim as ${claim.label}: ${claim.text}`);
    }
  }

  warn(profile.safety?.default_master_gain_db <= -14, `${prefix} default master gain is comparatively high; review before stable status.`);
};

const validateJourney = (journey) => {
  assert(journey.schema_version === '1.0', 'Journey schema_version must be 1.0.');
  assert(journey.safety?.automatic_start_allowed === false, 'Journey may not auto-start.');
  assert(Array.isArray(journey.states) && journey.states.length === 10, 'Ten-State Journey must contain ten states.');

  journey.states.forEach((state, index) => {
    const prefix = `journey:${state.id}`;
    assert(state.index === index + 1, `${prefix} index must be ${index + 1}.`);
    assert(state.duration_seconds === 10800, `${prefix} canonical duration must be 10,800 seconds.`);
    for (const point of ['start', 'end']) {
      const dyad = state[point];
      assert(closeEnough(Math.abs(dyad.left_hz - dyad.right_hz), dyad.beat_hz), `${prefix}:${point} beat math is wrong.`);
    }
    if (index > 0) {
      const previous = journey.states[index - 1];
      if (state.transition.carrier_curve !== 'dual-dyad-crossfade') {
        assert(closeEnough(previous.end.left_hz, state.start.left_hz), `${prefix} left boundary does not match previous state.`);
        assert(closeEnough(previous.end.right_hz, state.start.right_hz), `${prefix} right boundary does not match previous state.`);
      }
    }
  });

  const totalSeconds = journey.states.reduce((sum, state) => sum + state.duration_seconds, 0);
  assert(totalSeconds === 108000, `Journey canonical total must be 108,000 seconds, got ${totalSeconds}.`);
};

try {
  const registry = await loadJson(registryPath);
  const seenSlugs = new Set();
  const toneShapes = new Set();
  let profileCount = 0;

  for (const group of registry.groups || []) {
    for (const entry of group.entries || []) {
      profileCount += 1;
      assert(!seenSlugs.has(entry.slug), `Registry repeats slug ${entry.slug}.`);
      seenSlugs.add(entry.slug);
      const identityKey = `${entry.tone.trim().toLowerCase()}|${entry.shape.trim().toLowerCase()}`;
      assert(!toneShapes.has(identityKey), `Registry profiles share the same tone and shape: ${entry.slug}.`);
      toneShapes.add(identityKey);

      const filePath = path.resolve(docs, entry.file.replace(/^\.\//, ''));
      await access(filePath);
      const profile = await loadJson(filePath);
      validateProfile(profile, entry);
    }
  }

  assert(profileCount >= 10, `Arkfire should register at least ten profiles; found ${profileCount}.`);
  const journey = await loadJson(journeyPath);
  validateJourney(journey);
} catch (error) {
  errors.push(error.message);
}

warnings.forEach((message) => console.warn(`WARN: ${message}`));
if (errors.length > 0) {
  errors.forEach((message) => console.error(`ERROR: ${message}`));
  console.error(`Arkfire validation failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`Arkfire validation passed with ${warnings.length} warning(s).`);
