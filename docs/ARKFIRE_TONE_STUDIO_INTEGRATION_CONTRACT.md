# Arkfire Glyph & Tone Studio — World Reception Gate Integration Contract

**Status:** Active integration boundary
**Version:** 0.1
**Parent product:** Arkfire Dimensional World Bridge
**Subsystem:** Glyph & Tone Studio
**Hearthgate surface:** Arkfire World Reception / Resonance Gate

## Constitutional position

Arkfire is the complete Dimensional World Bridge. The on-demand world tone loader is not a replacement Arkfire core and does not own world identity, continuity, entity identity, project persistence, observation evidence, or canon.

This work belongs to Arkfire's **Glyph & Tone Studio** subsystem. It receives authoritative context from neighbouring systems, generates and auditions tone artifacts, and returns provenance-bearing results to the Arkfire feedback loop.

> Observe → Model → Interpret → Generate → Narrate → Evaluate → Record → Reobserve

The World Reception Gate currently begins at **Generate**, supports **Evaluate**, and produces records for **Record** and later **Reobserve**. Until the full neighbouring subsystems exist, contract-faithful adapters supply world, canon, observation, and project context.

## Source authority

Architecture authority, in descending order:

1. Arkfire Dimensional World Bridge Constitution
2. Arkfire Decision Register and approved governance checkpoints
3. Arkfire Subsystem Communication Map
4. Arkfire Completion Matrix and Ten-Stage Subsystem Ladder
5. Arkfire First-Class Record Inventory
6. Current Arkfire Core Planning working tree from the shared Drive archive
7. This integration contract
8. Runa implementation files and provisional world profiles

World meaning and canon authority remain in each world's canonical sources and World Reception Profile pages. A tone profile may translate canon; it may not silently rewrite it.

## Authority boundary

### This subsystem owns

- tone profile definitions and versions
- tone layer definitions
- generation and playback parameters
- phase and transition definitions
- collision analysis results
- audio render provenance
- audition receipts
- tone artifact lineage
- accessibility variants specific to sound playback
- deterministic profile validation

### This subsystem associates but does not own

- worlds
- entities
- locations
- timelines
- observations
- perspectives
- Lore and ontology
- continuity events
- accepted canon
- project identity
- source documents

### This subsystem must not

- modify world or entity authority directly
- promote generated symbolism into canon without review
- label subjective or ritual intentions as measured facts
- infer named presence from profile activation
- write continuity without a proposal and acceptance path
- start audio automatically
- hide signal routing or generation provenance

## Common exchange envelope

Every cross-subsystem request, result, receipt, or event uses the Arkfire common envelope:

```json
{
  "message_id": "uuid",
  "message_type": "arkfire.tone.profile.requested",
  "schema_name": "ToneProfileRequest",
  "schema_version": "1.0",
  "producer_subsystem": "glyph-tone-studio",
  "producer_instance": "hearthgate-world-reception-gate",
  "created_at": "RFC-3339 timestamp",
  "project_id": "uuid-or-null",
  "correlation_id": "uuid",
  "causation_id": "uuid-or-null",
  "authority_class": "generated",
  "provenance_ref": "artifact-or-source-reference",
  "payload": {}
}
```

The envelope is transport metadata, not a universal domain record. Domain content belongs in the versioned payload.

## Initial contract inventory

### Inbound

#### `WorldReceptionContext@1.0`

Carries:

- project reference
- world identifiers
- selected world and optional comparison worlds
- entity and perspective references
- time context
- observation references
- selected source and Lore references
- continuity snapshot reference
- accessibility preferences
- explicit consent scope

#### `ToneProfileRequest@1.0`

Carries:

- profile slug and requested version
- requested variant
- requested phase or journey state
- output target: preview, browser playback, lossless render, haptic reference, or export
- manual overrides
- approval identity

#### `ToneRevisionRequest@1.0`

Carries one requested change, its reason, affected layer or phase, and the evidence or audition receipt motivating it.

### Outbound

#### `ToneProfileDefinition@1.0`

The canonical typed profile record currently represented by the Arkfire profile JSON schema.

#### `ToneGenerationResult@1.0`

Carries:

- exact oscillator and noise parameters
- routing graph summary
- clock and modulation relationships
- generated artifact references
- render environment
- warnings and unsupported features
- deterministic validation result

#### `ToneAuditionReceipt@1.0`

Carries:

- selected profile, version, variant, and phase
- start and stop timestamps
- manually changed layers
- master gain and output mode
- comfort and accessibility observations
- what helped
- what was hard
- what is Held
- one requested change
- approval state

#### `ToneCollisionReport@1.0`

Carries exact overlaps, near overlaps, harmonic relationships, binaural contamination risks, channel imbalance, sub-bass accumulation, and each declared policy.

#### `ToneArtifactRecord@1.0`

Carries artifact identity, type, version, creator, world and entity associations, lineage, source associations, transformation history, and provenance.

### Published events

- `arkfire.tone.profile.registered`
- `arkfire.tone.profile.revised`
- `arkfire.tone.profile.selected`
- `arkfire.tone.playback.opened`
- `arkfire.tone.phase.changed`
- `arkfire.tone.playback.paused`
- `arkfire.tone.playback.closed`
- `arkfire.tone.audition.recorded`
- `arkfire.tone.artifact.generated`
- `arkfire.tone.validation.blocked`

### Error and rejection contracts

- `ToneProfileNotFound`
- `ToneSchemaIncompatible`
- `ToneRoutingUnsafe`
- `ToneCollisionBlocked`
- `ToneOutputUnsupported`
- `ToneConsentMissing`
- `ToneSourceAuthorityMissing`
- `ToneArtifactWriteFailed`
- `ToneNeighbourUnavailable`

No error may be converted into silent fallback if that fallback changes the requested world, state, routing, or authority class.

## First-class records

World tone profiles and journeys are typed records owned by Glyph & Tone Studio. Generated audio, diagrams, waveforms, exports, and audition recordings are first-class Arkfire artifacts.

Each accepted profile must preserve:

- stable identifier
- semantic version
- owner subsystem
- world associations
- creator and reviewers
- source authority
- claims labels
- complete profile payload
- parent revision
- transformation history
- validation status
- Boxfire QA status
- active/inactive state without destructive deletion

## Hearthgate route contract

The current static adapter resolves profiles through:

`/arkfire.html?profile=<profile-slug>`

This route is the Hearthgate entry to the World Reception Gate. It is not the complete Arkfire application shell.

Required behaviour:

- load exactly one selected profile
- show world tone and shape before playback
- never auto-start audio
- retain independent layer controls
- retain explicit phase controls
- close the active graph before switching profiles
- publish or store an audition receipt when connected persistence exists
- remain useful offline through static profile files

## Current adapter map

| Arkfire neighbour | Current adapter |
|---|---|
| Project Core | Runa static registry plus Supabase route record |
| World State Registry | `starwell_worlds` references and world profile metadata |
| Entity Vault | no automatic entity activation; named motifs remain opt-in |
| Timeweaver | profile-local phase clocks and journey durations |
| Observer | manually supplied source stacks and claims shelf |
| Library / Source Intelligence | Notion pages and shared Drive source references |
| Mathematical Model Engine | deterministic frequency, ratio, and collision validation |
| Interpretation Engine | explicit technical / experiential / symbolic separation |
| Artifact Store | `starwell_artifacts` association and typed profile records |
| Continuity & Canon | Notion review and manual approval; no direct canon writes |
| Logging & Diagnostics | GitHub Actions validation and Supabase revision receipts |

Adapters must be replaceable without changing profile identity or rewriting lineage.

## Completion posture

The current World Reception Gate is a **Stage 5 prototype with partial Stage 6, Stage 7, and Stage 8 work**, not a completed Arkfire subsystem.

Implemented:

- purpose and initial authority boundary
- provisional record model and schemas
- static registry
- on-demand selector
- protected binaural routing
- phase-continuous source graph
- deterministic profile validation
- Supabase typed records and revisions
- Notion source receipts
- contract-faithful initial adapters

Still required before Stage 9:

- complete contract schemas listed above
- persistent audition receipts
- generated artifact records and lineage
- runtime logging and diagnostics
- full render/export pipeline
- automated collision report generation
- accessibility acceptance suite
- browser and desktop recovery tests
- manual audio audition
- Boxfire runtime QA
- user and technical guides

## Runtime blockers already identified

The current browser adapter still requires runtime correction for:

1. declared macro-envelope layers, which are validated but not yet rendered by the Web Audio prototype;
2. profile-declared long stop fades, which the prototype currently truncates during context shutdown;
3. explicit playback and phase events, which are not yet persisted as exchange records;
4. the Ten-State Journey, which is displayed but not yet rendered as a chirped or crossfaded journey engine.

These are blocking notes, not invisible future work.

## Governing principle

The World Reception Gate must let a person recognise a world by sound, inspect how that sound was made, stop it safely, preserve what happened, and feed the result back into Arkfire.

A beautiful tone that leaves no lineage is an orphan. Arkfire adopts its children.
