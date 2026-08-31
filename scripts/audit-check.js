/**
 * Engineering Audit Check Script
 * Validates single source of truth, mass balance closures, and equation database integrity.
 */
import { DEFAULT_EQUATIONS_DATABASE } from "../shared/engineering/equations/defaultEquationsDatabase.js";
import { validateFormula } from "../shared/engineering/engine/formulaParser.js";
import calculateEngineering from "../shared/engineering/engine/engineeringEquationEngine.js";
import { auditEngineeringDesign } from "../shared/engineering/core/engineeringAudit.js";

console.log("==================================================================");
console.log("🔬 RUNNING SYSTEM INTEGRITY & EQUATION DATABASE AUDIT");
console.log("==================================================================\n");

// 1. Equation Count & Syntax Validation
console.log(`[CHECK 1] Validating ${DEFAULT_EQUATIONS_DATABASE.length} Authoritative Equations...`);
let syntaxErrors = 0;
DEFAULT_EQUATIONS_DATABASE.forEach(eq => {
    const val = validateFormula(eq.formula);
    if (!val.valid) {
        console.error(`  ❌ Syntax error in ${eq.name} (${eq.id}): ${val.error}`);
        syntaxErrors++;
    }
});
if (syntaxErrors === 0) {
    console.log(`  ✓ All ${DEFAULT_EQUATIONS_DATABASE.length} equations syntactically valid.`);
} else {
    console.error(`  ❌ Found ${syntaxErrors} equation syntax errors.`);
    process.exit(1);
}

// 2. Physics & Conservation Verification across all 4 Technologies
const technologies = ["CDI", "MCDI", "FCDI", "EDI"];
console.log("\n[CHECK 2] Verifying Mass & Salt Conservation Across Technologies...");

technologies.forEach(tech => {
    const feed = { tds: tech === "EDI" ? 20 : 500, targetTds: tech === "EDI" ? 0.05 : 50, flowRate: 10, hardness: 150 };
    const eng = calculateEngineering({ technology: tech, feedWater: feed });
    const audit = auditEngineeringDesign(eng, feed);

    if (audit.overallValid && audit.massBalanceValid) {
        console.log(`  ✓ ${tech}: Water & Salt balances verified (Closure: PASS, Overall: VALID)`);
    } else {
        console.error(`  ❌ ${tech}: Audit failed (overallValid: ${audit.overallValid}, errors: ${JSON.stringify(audit.errors)})`);
        process.exit(1);
    }
});

console.log("\n==================================================================");
console.log("✅ SYSTEM AUDIT PASSED: ALL INVARIANTS SATISFIED.");
console.log("==================================================================");
