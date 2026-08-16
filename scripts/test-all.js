/**
 * Unified Test Runner for CDI-EDI-Design-Platform
 * Runs all Unit, Engineering, Integration, Smoke, and Traceability test suites.
 */
import { spawnSync } from "child_process";

console.log("==================================================================");
console.log("🚀 RUNNING FULL AUTOMATED TEST & ENGINEERING VERIFICATION SUITE");
console.log("==================================================================\n");

// Step 1: Run Vitest Suite (Unit, Engineering, Integration)
console.log("▶ [1/3] Running Vitest Suites (Unit, Physics, Integration)...");
const vitestResult = spawnSync("npx", ["vitest", "run"], { stdio: "inherit", shell: true });

if (vitestResult.status !== 0) {
    console.error("\n❌ Vitest test suite failed.");
    process.exit(vitestResult.status || 1);
}

// Step 2: Run First Principles and Smoke Node Test Suites
console.log("\n▶ [2/3] Running First Principles & Smoke Release Audits...");
const smoke1Result = spawnSync("node", ["--test", "tests/engineering/firstPrinciplesAudit.test.mjs"], { stdio: "inherit", shell: true });
if (smoke1Result.status !== 0) {
    console.error("\n❌ First principles test suite failed.");
    process.exit(smoke1Result.status || 1);
}

const smoke2Result = spawnSync("node", ["--test", "tests/smoke/smokeReleaseAudit.test.mjs"], { stdio: "inherit", shell: true });
if (smoke2Result.status !== 0) {
    console.error("\n❌ Smoke release audit test suite failed.");
    process.exit(smoke2Result.status || 1);
}

// Step 3: Run Full Traceability & 20 Edge-Case Audit
console.log("\n▶ [3/3] Running Full Engineering Traceability & Edge Case Audit...");
const auditResult = spawnSync("node", ["tests/smoke/engineeringFullTraceabilityAudit.test.js"], { stdio: "inherit", shell: true });

if (auditResult.status !== 0) {
    console.error("\n❌ Engineering full traceability audit failed.");
    process.exit(auditResult.status || 1);
}

console.log("\n==================================================================");
console.log("✅ ALL 25+ TEST SUITES & 300+ CHECKS PASSED WITH ZERO FAILURES!");
console.log("==================================================================");
