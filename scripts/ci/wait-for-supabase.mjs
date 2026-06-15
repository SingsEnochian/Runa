#!/usr/bin/env node

const DEFAULT_URL = "https://rufrmjyusalnifpegllj.supabase.co";
const SUPABASE_URL = (process.env.SUPABASE_URL || DEFAULT_URL).replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const MAX_ATTEMPTS = Number.parseInt(process.env.SUPABASE_HEALTH_ATTEMPTS || "18", 10);
const DELAY_MS = Number.parseInt(process.env.SUPABASE_HEALTH_DELAY_MS || "10000", 10);
const STRICT = process.env.SUPABASE_HEALTH_STRICT === "true";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkGatewayOnly() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: "GET",
    headers: { accept: "application/json" }
  });

  return {
    ok: response.status > 0 && response.status < 500,
    status: response.status,
    detail: `gateway returned HTTP ${response.status}`
  };
}

async function checkDatabaseRpc() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/flameclyffe_health_ping`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${SUPABASE_KEY}`,
      "content-type": "application/json",
      accept: "application/json"
    },
    body: "{}"
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  return {
    ok: response.ok && payload?.status === "ok",
    status: response.status,
    detail: payload
  };
}

async function run() {
  console.log(`Checking Supabase health at ${SUPABASE_URL}`);

  if (!SUPABASE_KEY) {
    console.warn("SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY is not set; falling back to gateway-only health check.");
    if (STRICT) {
      throw new Error("Strict Supabase health check requires SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY.");
    }
  }

  let lastResult = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      lastResult = SUPABASE_KEY ? await checkDatabaseRpc() : await checkGatewayOnly();
      console.log(`Attempt ${attempt}/${MAX_ATTEMPTS}:`, JSON.stringify(lastResult));

      if (lastResult.ok) {
        console.log("Supabase health gate passed.");
        return;
      }
    } catch (error) {
      lastResult = { ok: false, detail: error.message };
      console.log(`Attempt ${attempt}/${MAX_ATTEMPTS}: ${error.message}`);
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(DELAY_MS);
    }
  }

  throw new Error(`Supabase health gate failed after ${MAX_ATTEMPTS} attempts. Last result: ${JSON.stringify(lastResult)}`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
