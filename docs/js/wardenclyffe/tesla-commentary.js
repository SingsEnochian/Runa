export function generateTeslaCommentary(scene, context = {}) {
  const layers = Array.isArray(scene?.layers) ? scene.layers : [];
  const enabledLayers = layers.filter((layer) => layer.enabled !== false);
  const toneLayers = enabledLayers.filter((layer) => layer.kind === 'tone');
  const binauralLayers = enabledLayers.filter((layer) => layer.kind === 'binaural');
  const movingLayers = enabledLayers.filter((layer) => layer.motionEnabled);
  const sceneName = scene?.name || 'Unnamed Scene';
  const question = context.question?.trim();
  const note = context.note?.trim();

  const observation = buildObservation(sceneName, enabledLayers, toneLayers, binauralLayers, movingLayers);
  const interpretation = buildInterpretation(enabledLayers, toneLayers, binauralLayers, movingLayers);
  const faultLine = buildFaultLine(enabledLayers, binauralLayers, movingLayers, scene?.masterGain ?? 0.8);
  const nextTrial = buildNextTrial(enabledLayers, toneLayers, binauralLayers, movingLayers, question);

  const noteBlock = note ? `Additional bench note: ${note}\n\n` : '';

  return [
    'Wardenclyffe Note',
    '',
    `I have observed the present scene, “${sceneName},” and its structure is now sufficiently legible to admit comment.`,
    '',
    noteBlock + observation,
    '',
    interpretation,
    '',
    `Fault line: ${faultLine}`,
    '',
    `Next trial: ${nextTrial}`,
  ].join('\n');
}

function buildObservation(sceneName, enabledLayers, toneLayers, binauralLayers, movingLayers) {
  const parts = [];
  parts.push(`The scene contains ${enabledLayers.length} active layer${enabledLayers.length === 1 ? '' : 's'}.`);
  if (toneLayers.length) {
    parts.push(`${toneLayers.length} operate as direct tone voice${toneLayers.length === 1 ? '' : 's'}.`);
  }
  if (binauralLayers.length) {
    parts.push(`${binauralLayers.length} are binaural pair${binauralLayers.length === 1 ? '' : 's'}, which demands greater discipline in motion and balance.`);
  }
  if (movingLayers.length) {
    parts.push(`${movingLayers.length} layer${movingLayers.length === 1 ? '' : 's'} are in motion, so the field is not static but in deliberate spatial circulation.`);
  } else {
    parts.push('The field is presently static, which makes it suitable for cleaner baseline listening.');
  }
  return parts.join(' ');
}

function buildInterpretation(enabledLayers, toneLayers, binauralLayers, movingLayers) {
  if (!enabledLayers.length) {
    return 'There is, as yet, no active field to interpret. The apparatus is named, but not energised.';
  }
  if (binauralLayers.length && movingLayers.length) {
    return 'The principle is promising, though the interplay between binaural structure and spatial motion must be handled soberly. One seeks width, but must not destroy the very ear-separation upon which the effect depends.';
  }
  if (toneLayers.length > 2 && movingLayers.length) {
    return 'This arrangement tends toward a choral field rather than a solitary tone. It suggests that the engine is beginning to behave as an orchestra of layers, not a single oscillator with decorative attachments.';
  }
  if (toneLayers.length <= 2 && !movingLayers.length) {
    return 'The arrangement remains clean enough for elementary observation. Such simplicity is not a weakness. It is often the only honest way to determine whether the field possesses any true character of its own.';
  }
  return 'The structure is coherent and points toward the correct architecture: independent voices, a common engine, and enough separation of concerns that the scene can be examined rather than merely heard.';
}

function buildFaultLine(enabledLayers, binauralLayers, movingLayers, masterGain) {
  if (!enabledLayers.length) {
    return 'No signal has yet been committed to the field.';
  }
  if (masterGain > 0.9) {
    return 'The master gain stands high enough that subtle relational information may be masked by sheer intensity.';
  }
  if (binauralLayers.length && movingLayers.length) {
    return 'Binaural layers in motion remain the principal uncertainty. The mechanism may be evocative, yet still contaminate the very pattern it is supposed to preserve.';
  }
  if (enabledLayers.length > 4) {
    return 'The field may now be dense enough that symbolic intention and actual acoustical function begin to obscure one another.';
  }
  return 'The remaining uncertainty is not one of conception, but of measurement. The structure is sound, yet comparative trials are still required.';
}

function buildNextTrial(enabledLayers, toneLayers, binauralLayers, movingLayers, question) {
  const lead = question ? `Proceed with the question, “${question},” but do so under a stricter comparison.` : 'Proceed with a stricter comparison between adjacent scene variants.';
  if (!enabledLayers.length) {
    return 'Energise a single tone layer first, establish a baseline, and only then add motion or a second voice.';
  }
  if (binauralLayers.length && movingLayers.length) {
    return `${lead} Run the scene once with binaural motion disabled, and once with it enabled only on non-binaural layers. Record which version produces the cleaner subjective report.`;
  }
  if (toneLayers.length > 2) {
    return `${lead} Duplicate the scene, remove one layer from the copy, and determine whether the lost voice was structural or merely ornamental.`;
  }
  if (!movingLayers.length) {
    return `${lead} Introduce a single slow-motion layer and observe whether the field becomes more legible or merely more theatrical.`;
  }
  return `${lead} Save the present arrangement as a baseline scene, then alter only one parameter in the next run so the resulting difference may actually be attributed.`;
}
