# Arkfire Glyph & Tone Studio — World Reception Gate Completion Path

**Status:** Active subsystem path
**Version:** 0.1
**Parent authority:** Arkfire Completion Matrix and Ten-Stage Subsystem Ladder

## User-facing outcome

A user can select a world or signal protocol in Hearthgate, understand its tone and shape, inspect every layer, open it deliberately, move through its passage, stop safely, record the audition, generate a traceable artifact, and return the result to Arkfire for later interpretation, continuity review, and reobservation.

## Explicit responsibilities

- define and version world-native tone profiles
- preserve true binaural routing
- generate browser previews and later lossless renders
- provide phase and journey orchestration
- validate frequency math and collisions
- provide accessibility variants
- preserve generation provenance and artifact lineage
- collect audition receipts
- publish versioned contracts and events
- remain independently useful when neighbouring subsystems are unavailable

## Explicit exclusions

- world and entity authority
- accepted canon and continuity authority
- source-document truth adjudication
- medical or physiological guarantees
- autonomous named-presence inference
- silent continuity mutation
- automatic profile adaptation in the current release
- the complete Arkfire shell

## Ten-stage ladder

### Stage 1 — Purpose Locked

**Current:** Complete for v0.1.

Acceptance:

- purpose and user outcome are explicit
- authority boundary is explicit
- relation to the Arkfire loop is explicit
- world profiles and signal protocols are distinguished
- world profiles and journeys are distinguished

### Stage 2 — Record Model Locked

**Current:** Partial.

Required records:

- Tone Profile Definition
- Tone Profile Revision
- Tone Layer Definition
- Tone Journey Definition
- Tone Collision Report
- Tone Generation Result
- Tone Audition Receipt
- Tone Artifact Record
- Playback Session Record
- Import / Export Receipt

Lock stable identifiers, lifecycle, snapshot/history authority, lineage, and inactive-versus-deleted behaviour.

### Stage 3 — Contracts Locked

**Current:** Initial contract inventory written; schemas pending.

Freeze only immediate-neighbour contracts:

- WorldReceptionContext@1.0
- ToneProfileRequest@1.0
- ToneRevisionRequest@1.0
- ToneProfileDefinition@1.0
- ToneGenerationResult@1.0
- ToneCollisionReport@1.0
- ToneAuditionReceipt@1.0
- ToneArtifactRecord@1.0

Add common-envelope schemas, event schemas, rejection contracts, version compatibility, and missing-neighbour behaviour.

### Stage 4 — Internal Design Complete

**Current:** Partial.

Map:

- profile registry
- profile loader
- graph builder
- protected stereo bus
- modulation engine
- phase orchestrator
- journey renderer
- collision auditor
- artifact renderer
- audition recorder
- persistence adapter
- diagnostics stream
- accessibility transformer
- import/export translator

Define state machines for profile loading, engine opening, passage running, Feather pause, closing, rendering, exporting, recovery, and failure.

### Stage 5 — Core Engine Implemented

**Current:** Prototype exists.

Working:

- profile selection
- oscillator and noise graph creation
- true binaural routing
- tremolo and isochronic modulation
- filter sweeps
- stereo drift on non-binaural layers
- manual gains and mutes
- five-phase gain orchestration

Blocking gaps:

- macro-envelope rendering
- exact long fade completion before context close
- journey chirps and dual-dyad crossfades
- shared-source oscillator derivation for collision policies
- lossless offline render
- haptic output adapter
- deterministic random-envelope generation with persisted seed

### Stage 6 — Persistence and Recovery Complete

**Current:** Partial Supabase registry; not complete.

Required:

- authoritative snapshot plus append-only profile history
- audition and playback receipts
- artifact lineage records
- incomplete-write detection
- reopen and recovery
- schema migrations
- export/import preservation
- profile branch and restore
- safe inactive state

### Stage 7 — Standalone Interface Complete

**Current:** Prototype surface exists.

Required:

- progressive disclosure
- plain-language Accept / Edit / Skip / See Why review
- complete profile source inspector
- runtime warnings and unsupported-feature badges
- collision report view
- waveform and routing view
- audition notes and Withness form
- keyboard navigation
- screen-reader labels
- migraine, tinnitus, hearing, and reduced-motion paths
- user guide and contextual help

### Stage 8 — Adapter Integration Complete

**Current:** Initial static adapters exist.

Every adapter must simulate:

- valid context
- empty result
- delayed result
- rejected request
- incompatible schema
- malformed payload
- unavailable neighbour
- retry and reconciliation

Neighbours:

- Project Core
- World State Registry
- Entity Vault
- Timeweaver
- Observer
- Library / Source Intelligence
- Mathematical Model Engine
- Interpretation and Reconciliation
- Artifact Store
- Continuity and Canon Engine
- Logging and Diagnostics

### Stage 9 — Subsystem Acceptance Complete

**Current:** Not reached.

Acceptance suite:

- every registered profile loads by route
- every binaural difference validates
- no protected carrier pans or sums to mono
- collision policies are honoured at runtime
- every modulation declared in a profile is rendered or visibly rejected
- every phase runs and returns safely
- Feather preserves current state without time advancement
- Stop completes the declared fade and releases resources
- profile switch closes the old graph first
- offline reopen recovers accepted state
- exports re-import with identity and lineage intact
- accessibility variants match declarations
- diagnostics explain every block
- documentation describes only implemented behaviour
- Boxfire returns pass or pass-with-notes with no hidden core skip

### Stage 10 — Real Integration Complete

**Current:** Not reached.

Replace adapters with live Arkfire neighbours and pass:

- context request and receipt
- world and entity association
- observation-to-tone generation
- model and interpretation inputs
- artifact store write and lineage
- prompt-package tone references
- narrative-return evaluation
- continuity proposal without direct mutation
- accepted state persistence
- reobservation using the accepted artifact
- restart and recovery across the full chain

## Agent gate sequence

Every update follows:

1. Intake packet
2. Source-authority lock
3. Worldshape contract
4. Record and contract impact check
5. Signal draft
6. Static schema and collision validation
7. Runtime feature-support validation
8. Low-volume manual audition
9. Five-phase or journey test
10. Accessibility pass
11. Artifact and receipt generation
12. Boxfire QA
13. Registration across GitHub, Supabase, Notion, and Arkfire manifests
14. Withness and next-change record

## No-fog ledger

Every incomplete item must be one of:

- implemented
- partially implemented
- blocked with reason
- scheduled with dependency
- explicitly excluded

No agent may hide an unsupported profile feature behind a successful JSON validation result.
