# Supabase Health Gate

Flameclyffe uses a two-part Supabase wakefulness pattern:

1. A database-side daily heartbeat writes to `public.moltbook_heartbeat` through the private function `private.run_moltbook_heartbeat(...)`.
2. A GitHub-side health gate runs `scripts/ci/wait-for-supabase.mjs` before Supabase-dependent work.

The database heartbeat is scheduled by `pg_cron` as:

```cron
17 14 * * *
```

That is 14:17 UTC daily. The GitHub health workflow runs ten minutes later:

```cron
27 14 * * *
```

## GitHub health script

The health script lives at:

```text
scripts/ci/wait-for-supabase.mjs
```

It uses this order:

1. Prefer `SUPABASE_PUBLISHABLE_KEY`.
2. Fall back to `SUPABASE_ANON_KEY`.
3. If neither key is available and strict mode is false, check the Supabase gateway only.

When a key exists, it calls:

```text
/rest/v1/rpc/flameclyffe_health_ping
```

That RPC returns harmless status metadata only. It does not expose private heartbeat rows.

## Recommended workflow gate pattern

For any future workflow that depends on Supabase, add this step before tests, deploy, migrations, or generated-type checks:

```yaml
- name: Wait for Supabase health
  run: node scripts/ci/wait-for-supabase.mjs
  env:
    SUPABASE_URL: ${{ vars.SUPABASE_URL }}
    SUPABASE_PUBLISHABLE_KEY: ${{ secrets.SUPABASE_PUBLISHABLE_KEY }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_HEALTH_ATTEMPTS: "18"
    SUPABASE_HEALTH_DELAY_MS: "10000"
    SUPABASE_HEALTH_STRICT: "false"
```

For workflows where Supabase must be reachable by the real Data API, set:

```yaml
SUPABASE_HEALTH_STRICT: "true"
```

Strict mode requires one of the Supabase public client keys to be present and verifies the DB-backed RPC instead of only the gateway.

## Why this exists

The Flameclyffe project can briefly report as restoring or starting up. During that window, Postgres and PostgREST may reject connections. Without a health gate, CI can fail even when the code is fine.

The health gate turns that failure mode into a retry window instead of a false-red build.
