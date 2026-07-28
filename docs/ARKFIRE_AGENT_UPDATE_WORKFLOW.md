# Hearthgate: Arkfire — Agent Update Workflow

Status: active build workflow
Version: 0.1
Scope: world-native sound profiles, true binaural stacks, five-phase passage, accessibility variants, database registration, and QA

## Governing rule

The engine remains universal. Each world owns its tone, shape, arrival signature, phase behaviour, and return path.

Every profile must declare:

1. what each signal is;
2. what it technically does;
3. what it is intended to feel like;
4. what it symbolically means in canon;
5. when it enters and leaves;
6. where it is routed;
7. how it stops safely;
8. which claims are evidence-backed, under study, symbolic, or promotional language that must not be stored as fact.

No agent may flatten several worlds into one generic “mystical ambience” preset.

## Agent roles

### 1. Canon Steward

Reads the world’s canonical sources before touching frequencies.

Produces:

- world name and slug;
- source authority list;
- intended reception;
- forbidden or misleading motifs;
- world-specific arrival and return signatures;
- named-presence consent requirements;
- unresolved canon questions.

The Canon Steward does not invent technical claims.

### 2. Worldshape Weaver

Translates canon into a distinct perceptual design.

Produces:

- tone words;
- spatial shape;
- palette;
- density and motion character;
- centre of gravity;
- arrival geometry;
- return geometry;
- contrast against neighbouring world profiles.

A shape is an orchestration rule, not merely a visual description.

### 3. Signal Architect

Builds the actual stack.

Classifies every layer as one of:

- `true-binaural`
- `isochronic`
- `tone`
- `pad`
- `noise`
- `cue`
- `haptic-reference`

For every layer, records carrier frequency, beat or modulation rate, waveform, gain, routing, phase continuity, clock relationship, filter behaviour, collision policy, and whether headphones are required.

True binaural layers are protected. Their left and right oscillators must remain directly routed to their intended ears, with no mono summing, crossfeed, stereo widening, independent channel compression, or channel-asymmetric processing.

### 4. Epistemic Keeper

Labels the claims shelf.

Allowed labels:

- `established-science`
- `active-research`
- `speculative-theory`
- `symbolic-canon`
- `subjective-intention`
- `implementation-task`
- `evidence-backed-finding`

Examples:

- “108 Hz left and 114.66 Hz right create a perceived 6.66 Hz binaural difference over headphones” is signal engineering.
- “Theta binaural stimulation may affect some cognitive, anxiety, pain, or EEG outcomes” is active research and must retain uncertainty.
- “963 Hz stimulates the pineal gland” is not stored as established fact.
- “963 Hz is the veil-crown or third-eye symbol in this profile” is valid symbolic canon.

Promotional source wording may be preserved in `source_language`, but must not silently become a technical or medical claim.

### 5. Collision Auditor

Runs the profile validator before audition.

Checks:

- exact frequency overlap;
- near overlap;
- harmonic relationship;
- accidental monaural beating;
- binaural carrier contamination;
- left/right energy imbalance;
- sub-bass accumulation;
- upper-frequency congestion;
- phase reset risk;
- incompatible modulation clocks;
- haptic-only layers accidentally routed to headphones.

Every collision receives a policy:

- `intentional-shared-source`
- `intentional-harmonic`
- `phase-locked`
- `gain-separated`
- `moved-to-harmonic`
- `masking-risk-accepted`
- `must-fix`

### 6. Passage Orchestrator

Builds the five phases without restarting oscillators:

1. Baseline
2. Vestibule
3. Arrival
4. Immersion
5. Return

Oscillators and noise sources remain phase-continuous after the engine opens. Phases alter audible gain, filtering, panning, and modulation depth rather than destroying and recreating the world.

Every Return phase must withdraw spatial motion and high-complexity layers before removing the central anchor.

### 7. Accessibility Steward

Provides at least:

- centre-safe;
- low-volume;
- reduced-motion;
- no-haptics;
- low-complexity;
- migraine-sensitive;
- tinnitus-sensitive notes where relevant.

`Feather` or `Icarus` pauses phase progression and preserves the current field for a consent check.

`Stop & Close` fades every audible layer and closes the passage.

Named Constellation motifs are opt-in. Opening a world does not summon or imply the presence of any person, self, aspect, or character.

### 8. Arkfire Registrar

Registers the accepted profile in all active surfaces:

- `docs/profiles/arkfire/registry.v0.1.json`
- the profile JSON file;
- `docs/arkfire.html` selector;
- Supabase `arkfire_world_profiles`;
- Supabase `arkfire_profile_revisions`;
- Notion World Reception Profile page;
- Hearthgate: Arkfire route manifest.

The registrar records source commit, database row, Notion page, version, status, and reviewer.

### 9. Boxfire QA

Boxfire tests the implementation rather than the mythology.

Required checks:

- JSON schema validation;
- page loads without console errors;
- every world can be selected directly by query string;
- true binaural left/right routing is correct;
- manual layer mute and gain controls work;
- five phases progress in order;
- Feather pauses without resetting phase;
- Stop fades all output;
- switching profiles stops the previous profile first;
- master gain is conservative;
- haptic references do not enter the audible bus;
- reduced-motion and centre-safe variants behave as declared;
- claims labels are visible and correctly separated.

Boxfire returns `pass`, `pass-with-notes`, or `block`.

## Update sequence

### Gate 0 — Intake

Create an update packet containing:

- profile slug;
- requested change;
- source authority;
- old version;
- target version;
- agent role;
- consent scope;
- whether the change affects canon, signal engineering, UI, or all three.

### Gate 1 — Canon lock

The Canon Steward records what may change and what must not.

No frequencies are approved merely because a source attaches spiritual or therapeutic claims to them.

### Gate 2 — Worldshape contract

The Worldshape Weaver writes one sentence each for:

- tone;
- shape;
- arrival;
- immersion;
- return;
- difference from every adjacent profile.

If two worlds produce the same contract, the newer profile returns for redesign.

### Gate 3 — Signal draft

The Signal Architect creates or edits one profile JSON. Every layer remains independently addressable.

Change one variable at a time during calibration unless the change is a declared structural migration.

### Gate 4 — Static validation

Run schema and collision validation. `must-fix` findings block audition.

### Gate 5 — Manual audition

Audition at low volume with explicit start. Record:

- world recognition;
- imagery vividness;
- orientation stability;
- sound comfort;
- pain, migraine, tinnitus, fatigue, or activation changes;
- which layer helped;
- which layer intruded;
- requested single-variable change.

### Gate 6 — Five-phase test

Run Baseline through Return. Confirm that Arrival is unmistakable and Return restores ordinary orientation without an abrupt drop.

### Gate 7 — Accessibility pass

Test centre-safe, reduced-motion, low-complexity, and no-haptics variants.

### Gate 8 — Boxfire QA

No profile becomes `stable` without Boxfire QA.

### Gate 9 — Registration

Commit profile, update registry, upsert Supabase rows, update the Notion profile, and register the Hearthgate: Arkfire route.

### Gate 10 — Withness record

Record:

- what helped;
- what was hard;
- what is Held;
- one requested change;
- approval state.

## Versioning

- Patch: gain, wording, accessibility note, or non-structural timing change.
- Minor: new layer, phase behaviour, routing mode, or profile variant.
- Major: changed world identity, arrival signature, signal class, or incompatible schema.

Statuses:

- `seed`
- `calibration`
- `review`
- `stable`
- `retired`
- `blocked`

## On-demand route contract

Every registry entry must resolve through:

`/arkfire.html?profile=<profile-slug>`

The route loads one selected profile only. It does not begin audio automatically. The user must open the audio engine explicitly.

## Current first pass

The first implementation wave contains:

- Terra Aeterna / Hearthweave v0.2;
- 3.69 Triune Field v0.1;
- 6.66 Veilwork v0.1;
- seed identities for Luna, T’averen Vaen, Starsong, Feather & Flame, Dreaming Grove / Templehouse, and A Momento Creationis.

The 3.69 and 6.66 profiles are signal protocols, not fictional worlds. Arkfire lists them separately so their architecture can be reused without overwriting a world’s native voice.
