/**
 * health.js — Production-grade health check endpoints for Express
 * -----------------------------------------------------------------
 * Exposes three distinct signals, because "is the app healthy?" is
 * actually three different questions in production:
 *
 *   GET /health/live   — Liveness: is the process running at all?
 *                         (Kubernetes uses this to decide whether to
 *                          kill and restart the container.)
 *
 *   GET /health/ready   — Readiness: can this instance actually serve
 *                          traffic right now? (DB reachable, cache up,
 *                          etc. Load balancers use this to decide
 *                          whether to route requests here.)
 *
 *   GET /health         — Combined human/dashboard view: everything
 *                          above plus uptime, memory, version info.
 *
 * Why split liveness from readiness at all?
 * If your DB connection drops for 10 seconds, that's a READINESS
 * problem — take the pod out of rotation, let it recover, put it
 * back. It is NOT a LIVENESS problem — the process itself is fine.
 * If you wire a DB check into liveness, Kubernetes will restart a
 * perfectly healthy process in a crash loop while the DB is down,
 * which is strictly worse (cold starts, thundering herd on the DB
 * once it recovers).
 */

import express from "express";
const router = express.Router();

// ---------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------
const APP_VERSION = process.env.npm_package_version || "unknown";
const GIT_SHA = process.env.GIT_SHA || "unknown";
const CHECK_TIMEOUT_MS = 2000; // never let a hung dependency hang the health check itself

// ---------------------------------------------------------------
// Dependency check registry
// -----------------------------------------------------------------
// Each check is: name -> async function that throws (or rejects) on failure.
// Register real ones from your app at startup, e.g.:
//   registerCheck("postgres", () => pool.query("SELECT 1"));
//   registerCheck("redis", () => redisClient.ping());
// -----------------------------------------------------------------
const checks = new Map();

function registerCheck(name, fn) {
  checks.set(name, fn);
}

/**
 * Runs a single check with a hard timeout, so a hung dependency
 * can't make your health endpoint itself hang (which would then
 * cause the orchestrator to kill you for the WRONG reason).
 */
async function runCheckWithTimeout(name, fn) {
  const start = Date.now();
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`timed out after ${CHECK_TIMEOUT_MS}ms`)),
          CHECK_TIMEOUT_MS
        )
      ),
    ]);
    return { name, status: "up", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      name,
      status: "down",
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

async function runAllChecks() {
  const results = await Promise.all(
    Array.from(checks.entries()).map(([name, fn]) =>
      runCheckWithTimeout(name, fn)
    )
  );
  const healthy = results.every((r) => r.status === "up");
  return { healthy, results };
}

// ---------------------------------------------------------------
// Routes
// ---------------------------------------------------------------

// Liveness — no dependency checks. If this doesn't respond, the
// process is genuinely stuck/dead and a restart is the right call.
router.get("/health/live", (req, res) => {
  res.status(200).json({ status: "alive" });
});

// Readiness — checks real dependencies. 503 tells load balancers
// and orchestrators "don't route to me right now."
router.get("/health/ready", async (req, res) => {
  const { healthy, results } = await runAllChecks();
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ready" : "not_ready",
    checks: results,
  });
});

// Combined view — for dashboards, uptime monitors, humans.
router.get("/health", async (req, res) => {
  const { healthy, results } = await runAllChecks();
  const mem = process.memoryUsage();

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    version: APP_VERSION,
    commit: GIT_SHA,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      rssMB: +(mem.rss / 1024 / 1024).toFixed(1),
      heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(1),
      heapTotalMB: +(mem.heapTotal / 1024 / 1024).toFixed(1),
    },
    dependencies: results,
  });
});

export { router, registerCheck }
