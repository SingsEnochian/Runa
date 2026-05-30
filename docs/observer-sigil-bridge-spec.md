# Observer Sigil Bridge · DEEP / Normal Observer / Writer Room

Status: design spine for implementation.

## Core idea

Faer-style sigils become the shared visual compression layer for Observer.

The normal Observer uses calmer field-sigils: readable, stable, good for daily checks, weather, Waking World notes, and gentle Aeterna correspondences.

DEEP uses full living sigils: higher-density geometry generated from Waking World telemetry, Aeterna conditions, story shards, motifs, resonance vectors, and prior continuity links.

The sigil is not decoration. It is the interface, the receipt, and the compressed map of a bridge event.

## Directionality

Every bridge record can move in either direction:

- Waking → Aeterna: weather, news, body-state, sound, moon, space weather, conversation, art, file, or real event influences a Terra Aeterna condition.
- Aeterna → Waking: a story event, dream, ritual, DEEP symbol, character action, or narrative shard becomes something to watch for in the Waking World.
- Bidirectional: the two sides are already resonating and need to be tracked together.

This must never be treated as deterministic fate. Data sets atmosphere, not fate.

## Supabase section

Add a Project Zero / Observer Bridge section in Flameclyffe Supabase beside existing STARWELL tables.

Existing STARWELL tables already provide worlds, locations, codex entries, discovery logs, and frontend routes. The new bridge tables should link into those instead of replacing them.

### Proposed tables

#### `observer_condition_sets`

Stores a snapshot of conditions from either side.

Recommended columns:

- `id uuid primary key default gen_random_uuid()`
- `scope text` — `waking`, `aeterna`, `dreaming`, `observer`, `deep`
- `source text` — `manual`, `weather`, `space_weather`, `news`, `story`, `file`, `altar`, `import`, `sensor`
- `observed_at timestamptz`
- `title text`
- `summary text`
- `condition_json jsonb default '{}'`
- `deep_vector jsonb default '{}'` — P/C/R/E/M/A, dP/dt, charge, etc.
- `sigil_seed text`
- `sigil_signature jsonb default '{}'`
- `visibility text default 'private'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

#### `observer_bridge_events`

The actual bridge record tying Waking and Aeterna together.

Recommended columns:

- `id uuid primary key default gen_random_uuid()`
- `slug text unique`
- `title text`
- `event_kind text` — `waking_event`, `aeterna_event`, `news_event`, `story_shard`, `altar_working`, `file_anchor`, `dream`, `observer_import`, `prediction_watch`
- `direction text` — `waking_to_aeterna`, `aeterna_to_waking`, `bidirectional`
- `waking_condition_id uuid references observer_condition_sets(id)`
- `aeterna_condition_id uuid references observer_condition_sets(id)`
- `related_world_id uuid references starwell_worlds(id)`
- `related_location_id uuid references starwell_locations(id)`
- `related_codex_entry_id uuid references starwell_codex_entries(id)`
- `related_discovery_log_id uuid references starwell_discovery_logs(id)`
- `body_md text`
- `motifs text[] default '{}'`
- `links jsonb default '{}'`
- `confidence numeric` — observational confidence, not certainty
- `probability_window jsonb default '{}'` — for future watch windows
- `status text default 'logged'` — `logged`, `watching`, `matched`, `dismissed`, `archived`
- `sigil_seed text`
- `sigil_signature jsonb default '{}'`
- `visibility text default 'private'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

#### `observer_trigger_watchers`

Tracks past, present, and future possible triggers without making prophecy-claims.

Recommended columns:

- `id uuid primary key default gen_random_uuid()`
- `bridge_event_id uuid references observer_bridge_events(id)`
- `watch_kind text` — `past_scan`, `present_monitor`, `future_probability`
- `query_json jsonb default '{}'`
- `motifs text[] default '{}'`
- `time_window jsonb default '{}'`
- `probability_score numeric`
- `evidence_json jsonb default '{}'`
- `status text default 'watching'` — `watching`, `matched`, `quiet`, `dismissed`, `expired`
- `last_checked_at timestamptz`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

#### `observer_sigil_renders`

Stores reusable sigil render instructions, not necessarily image blobs.

Recommended columns:

- `id uuid primary key default gen_random_uuid()`
- `bridge_event_id uuid references observer_bridge_events(id)`
- `condition_set_id uuid references observer_condition_sets(id)`
- `mode text` — `normal`, `deep`, `writer_room`, `altar`
- `sigil_family text` — e.g. `faer_lochflame`, `deep_enochian`, `normal_observer`, `runestone`
- `seed text`
- `geometry_json jsonb default '{}'`
- `palette_json jsonb default '{}'`
- `motion_json jsonb default '{}'`
- `render_svg text`
- `thumbnail_url text`
- `created_at timestamptz default now()`

## UI placement

### Normal Observer

Display a compact field-sigil beside the daily condition card. It should answer: “what is today’s field?”

Fields shown:

- Waking condition summary
- Aeterna condition summary
- current motifs
- bridge direction
- confidence or watch state

### DEEP

Display the full sigil as the central object. DEEP should expose:

- P/C/R/E/M/A bars
- glyph code
- current motifs
- Waking ↔ Aeterna bridge event list
- linked files / story shards / news notes
- watcher status for possible past/present/future triggers

### Writer Room

Display a side rail called “Bridge Conditions”. It should show:

- current Waking conditions
- current Aeterna conditions
- active bridge events
- suggested atmospheric prompts
- “attach this passage to Project Zero” button
- “create reverse watch” button for Aeterna → Waking resonance

## Query patterns

Past trigger scan:

- Find bridge events with overlapping motifs before a given story shard.
- Compare condition vectors and motif arrays.
- Return candidate resonances with evidence, not conclusions.

Present monitor:

- Find current Waking conditions that match active Aeterna watch motifs.
- Show in DEEP as “live resonance candidates”.

Future probability:

- Use recurring patterns, motif co-occurrence, weather/space-weather windows, and narrative trajectory.
- Return probability windows, not certainties.

## Consent / privacy

Default bridge-on means every save flow should offer anchoring.

It does not mean automatic harvesting.

Private/offline/excluded must always be available.

Prediction language must stay soft: candidate, watch, resonance, probability window, not fate.

## First implementation slice

1. Create the four Supabase tables.
2. Add frontend route registration for:
   - `observer-sigil-bridge`
   - `project-zero-bridge`
   - `deep-observer`
   - `writer-room`
3. Build a small JS module:
   - `observer-sigil-engine.js`
   - accepts condition set + bridge event + mode
   - returns geometry seed, palette, motion hints, and SVG/canvas instructions
4. Add DEEP display panel:
   - active bridge event list
   - sigil render
   - watcher state
5. Add Writer Room side rail:
   - bridge conditions
   - attach passage
   - reverse watch

## Seed language

The Waking World gives weather, event, body, sky, sound, and news.

Aeterna gives story, place, character, dream, magic, and mythic condition.

Observer binds them into a field.

DEEP compresses the field into a glyph.

The Writer Room turns the glyph back into living language.
