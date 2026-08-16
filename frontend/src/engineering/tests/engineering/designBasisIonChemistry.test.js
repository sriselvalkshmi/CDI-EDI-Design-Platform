import { describe, it } from "vitest";
import calculateEngineering, { generateParetoTradeoffCurve } from "../../shared/engineering/engine/engineeringEquationEngine.js";
import { analyzeWaterChemistry } from "../../shared/engineering/chemistry/waterChemistryEngine.js";
import { extractDesignBasisSummary, PROVENANCE_TIERS } from "../../shared/engineering/core/designBasis.js";

describe("Design Basis & Ion Chemistry Suite", () => {
    it("runs design basis and ion chemistry tests", () => {
        runDesignBasisIonChemistryTests();
    });
});

/**
 * Phase 5 Automated Regression Test Suite:
 * Design Basis, Water Chemistry, Valency Selectivity, 3-Way Balances, Risks, and Pareto Curves.
 */
export function runDesignBasisIonChemistryTests() {
    console.log("==================================================================");
    console.log("PHASE 5: AUTOMATED DESIGN BASIS, ION CHEMISTRY & CONSTRAINT SUITE");
    console.log("==================================================================");

    let passCount = 0;
    let failCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✓ PASS: ${message}`);
            passCount++;
        } else {
            console.error(`  ✕ FAIL: ${message}`);
            failCount++;
        }
    }

    // 1. Water Chemistry & Speciation Analysis
    console.log("\n[TEST 1] Water Chemistry & Speciation Engine Analysis:");
    const chemNaCl = analyzeWaterChemistry({ tds: 500 });
    assert(chemNaCl.totalHardnessMgL > 0, `NaCl Feed Total Hardness derived: ${chemNaCl.totalHardnessMgL} mg/L as CaCO3`);
    assert(chemNaCl.isChargeBalanced === true, ` NaCl Feed Charge Balance Error: ${chemNaCl.chargeBalanceErrorPercent}%`);

    const chemHard = analyzeWaterChemistry({ tds: 500, ca: 100, mg: 40, hco3: 300, ph: 7.8 });
    assert(chemHard.totalHardnessMgL > 350, `High Hardness Feed Total Hardness derived: ${chemHard.totalHardnessMgL} mg/L as CaCO3`);
    assert(chemHard.scalingRisk === "HIGH" || chemHard.scalingRisk === "MODERATE", `High Hardness scaling risk flagged: ${chemHard.scalingRisk}`);
    assert(chemHard.valencySelectivityFactor > 1.1, `Divalency selectivity factor elevated: x${chemHard.valencySelectivityFactor}`);

    // 2. Formal Design Basis Provenance Extraction
    console.log("\n[TEST 2] Formal Design Basis Summary Extraction:");
    const mcdiEng = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50, flowRate: 10 } });
    const basisCards = extractDesignBasisSummary(mcdiEng);
    assert(basisCards.length >= 4, `Extracted ${basisCards.length} formal Design Basis parameter cards`);
    assert(basisCards.some(c => c.provenance === "FIRST_PRINCIPLES"), "Contains FIRST_PRINCIPLES cards");
    assert(basisCards.some(c => c.provenance === "LITERATURE_SUPPORTED"), "Contains LITERATURE_SUPPORTED cards");

    // 3. 3-Way Mass, Salt & Charge Balance Diagnostics
    console.log("\n[TEST 3] 3-Way Balance Conservation Diagnostics:");
    assert(mcdiEng.balanceDiagnostics.waterBalanceStatus === "PASS", "Water balance status is PASS");
    assert(mcdiEng.balanceDiagnostics.saltBalanceStatus === "PASS", "Salt balance status is PASS");
    assert(mcdiEng.balanceDiagnostics.chargeBalanceStatus === "PASS", "Charge balance status is PASS");

    // 4. Technology Failure Modes & Risk Engine
    console.log("\n[TEST 4] Technology Failure Modes & Risk Engine:");
    assert(Array.isArray(mcdiEng.risks) && mcdiEng.risks.length > 0, `MCDI returns ${mcdiEng.risks.length} risk diagnostic entries`);
    assert(mcdiEng.risks.some(r => r.level === "PASS"), "MCDI returns PASS entry for target setpoint");

    const ediEng = calculateEngineering({ technology: "EDI", feedWater: { tds: 500, hardness: 150, flowRate: 10 } });
    assert(ediEng.risks.some(r => r.level === "FAIL"), "EDI raw feed returns FAIL entry for feed quality limit");

    // 5. Pareto Tradeoff Curve Generation
    console.log("\n[TEST 5] Pareto Tradeoff Curve Generation (Area -> Outlet TDS -> SEC):");
    const paretoCurve = generateParetoTradeoffCurve("MCDI", { tds: 500, targetTds: 50, flowRate: 10 });
    assert(paretoCurve.length === 8, `Pareto tradeoff curve generated with ${paretoCurve.length} design points`);
    assert(paretoCurve[0].secKwhM3 > 0, `Pareto point 1 SEC: ${paretoCurve[0].secKwhM3} kWh/m³`);
    assert(paretoCurve[paretoCurve.length - 1].isTargetAchieved === true, "High area Pareto point achieves target setpoint");

    console.log("\n==================================================================");
    console.log(`AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("==================================================================");

    if (failCount > 0) {
        throw new Error(`Phase 5 Design Basis Audit Failed with ${failCount} assertion failures.`);
    }

    return { passCount, failCount };
}

// Auto-execute if run directly via Node.js
if (typeof process !== "undefined" && process.argv && process.argv[1] && process.argv[1].includes("designBasisIonChemistry.test.js")) {
    runDesignBasisIonChemistryTests();
}
