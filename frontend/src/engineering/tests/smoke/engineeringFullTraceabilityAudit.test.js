"use strict";

import { getCentralEngineeringResult } from "../../shared/engineering/core/singleSourceOfTruth.js";
import calculateEngineering from "../../shared/engineering/engine/engineeringEquationEngine.js";
import calculateCDIModel from "../../shared/engineering/models/cdiModel.js";
import calculateMCDIModel from "../../shared/engineering/models/mCDIModel.js";
import calculateFCDIModel from "../../shared/engineering/models/fCDIModel.js";
import calculateEDIModel from "../../shared/engineering/models/ediModel.js";
import aiRecommendation from "../../shared/engineering/core/aiRecommendation.js";
import { analyzeWaterChemistry } from "../../shared/engineering/chemistry/waterChemistryEngine.js";
import { LITERATURE_BENCHMARKS } from "../../shared/engineering/validation/experimentalValidation.js";

/**
 * Standalone Node.js Engineering Full Traceability & Calculation Audit Test Suite
 * Executable directly via: `node client/src/engineering/engineeringFullTraceabilityAudit.test.js`
 */

let passCount = 0;
let failCount = 0;

function assert(condition, message, expected = "", actual = "") {
    if (condition) {
        console.log(`  ✓ PASS: ${message}`);
        passCount++;
    } else {
        console.error(`  ✕ FAIL: ${message} | Expected: ${expected}, Actual: ${actual}`);
        failCount++;
    }
}

console.log("==================================================================");
console.log("CDI/EDI PLATFORM — FULL ENGINEERING VERIFICATION & AUDIT SUITE");
console.log("==================================================================");

// ------------------------------------------------------------------
// GROUP 1: REFERENCE CASE CROSS-CHECK (PHASE 27)
// ------------------------------------------------------------------
console.log("\n[GROUP 1] Reference Case Cross-Check (Brackish Water 500 mg/L -> 50 mg/L Target):");
const refInputs = {
    technology: "MCDI",
    feedWater: { tds: 500, targetTds: 50, flowRate: 10, hardness: 150, ph: 7.2, temperature: 25 },
    voltageCell: 1.40,
    pairsPerModule: 34,
    numberOfModules: 2,
    current: 1.98,
    electrodeArea: 350
};

const mcdiRef = calculateMCDIModel(refInputs);
const centralRef = getCentralEngineeringResult(mcdiRef, "MCDI", refInputs.feedWater);

// Reference case expected metrics
// 1. Water balance: Q_product = 9.52 L/min, Q_reject = 0.48 L/min
assert(Math.abs(mcdiRef.productFlowLmin - 9.52) < 0.1, "Reference Product Flow = 9.52 L/min", 9.52, mcdiRef.productFlowLmin);
assert(Math.abs(mcdiRef.concentrateFlowLmin - 0.48) < 0.1, "Reference Reject Flow = 0.48 L/min", 0.48, mcdiRef.concentrateFlowLmin);

// 2. Mass balance check: (10*500 - 9.52*50)/0.48 = (5000 - 476)/0.48 = 9425 mg/L
const expectedRejectTds = (10 * 500 - 9.52 * 50) / 0.48; // 9425 mg/L
assert(Math.abs(mcdiRef.concentrateTds - 9425) < 50, "Reference Reject Concentration = 9425 mg/L", 9425, mcdiRef.concentrateTds);
assert(mcdiRef.isWaterConserved === true, "Reference Water Conservation Check (Q_feed = Q_prod + Q_rej)");
assert(mcdiRef.isSaltConserved === true, "Reference Salt Mass Conservation Check (Salt_in = Salt_out)");

// 3. Electrical topology: V_module = 1.40 * 34 = 47.6 V, V_system = 47.6 * 2 = 95.2 V
assert(mcdiRef.voltageModule === 47.6, "Reference Module Voltage = 47.6 V", 47.6, mcdiRef.voltageModule);
assert(mcdiRef.voltageStack === 95.2, "Reference Stack System Voltage = 95.2 V", 95.2, mcdiRef.voltageStack);

// 4. Power: P = 95.2 V * 1.98 A = 188.496 W (~188.5 W)
const expectedPower = 95.2 * 1.98;
assert(Math.abs(mcdiRef.power - expectedPower) < 0.5, "Reference Electrical Power = 188.5 W", expectedPower, mcdiRef.power);

// 5. Current density: J = 1.98 A / 0.035 m² = 56.57 A/m² (~56.6 A/m²)
const expectedCurrentDensity = 1.98 / (350 / 10000);
assert(Math.abs(mcdiRef.currentDensity - 56.6) < 0.5, "Reference Current Density = 56.6 A/m²", expectedCurrentDensity, mcdiRef.currentDensity);

// 6. Water Recovery: 9.52 / 10 * 100 = 95.2%
assert(Math.abs(mcdiRef.waterRecovery - 95.2) < 0.2, "Reference Water Recovery = 95.2%", 95.2, mcdiRef.waterRecovery);

// 7. SEC Energy Accounting:
// Gross Elec SEC = (0.1885 kW) / (0.00952 m³/min * 60 min/h) = 0.1885 / 0.5712 = 0.3300 kWh/m³
// Recovered SEC (20%) = 0.0660 kWh/m³
// Net Elec SEC = 0.2640 kWh/m³
assert(Math.abs(mcdiRef.secElectricalGross - 0.3300) < 0.01, "Reference Gross Electrical SEC = 0.3300 kWh/m³", 0.3300, mcdiRef.secElectricalGross);
assert(Math.abs(mcdiRef.secElectricalNet - 0.2640) < 0.01, "Reference Net Electrical SEC = 0.2640 kWh/m³", 0.2640, mcdiRef.secElectricalNet);

// ------------------------------------------------------------------
// GROUP 2: WATER CHEMISTRY AND ION BALANCE AUDIT (PHASE 4)
// ------------------------------------------------------------------
console.log("\n[GROUP 2] Water Chemistry & Ionic Charge Balance Audit:");
const waterResult = analyzeWaterChemistry({ tds: 500, hardness: 150, ph: 7.2, temperature: 25 });
assert(waterResult.chargeBalanceErrorPercent < 5.0, "Ionic Charge Balance Error < 5%", "< 5%", `${waterResult.chargeBalanceErrorPercent}%`);
assert(waterResult.totalHardnessMgL === 150, "Total Hardness interpreted as mg/L as CaCO3", 150, waterResult.totalHardnessMgL);
assert(waterResult.assumptionsNotice.includes("NaCl-equivalent"), "Explicit NaCl-equivalent notice present when ions omitted");

// ------------------------------------------------------------------
// GROUP 3: SINGLE SOURCE OF TRUTH CONSISTENCY (PHASE 2 & PHASE 29)
// ------------------------------------------------------------------
console.log("\n[GROUP 3] Single Source of Truth GUI Consistency Audit:");
const schema = centralRef.schema;
assert(schema.outletTDS.value === mcdiRef.outletTDS, "Central Schema Outlet TDS matches model", mcdiRef.outletTDS, schema.outletTDS.value);
assert(schema.voltageStack.value === mcdiRef.voltageStack, "Central Schema Stack Voltage matches model", mcdiRef.voltageStack, schema.voltageStack.value);
assert(schema.power.value === mcdiRef.power, "Central Schema Power matches model", mcdiRef.power, schema.power.value);
assert(schema.secTotalNet.value === mcdiRef.secTotalNet, "Central Schema Net SEC matches model", mcdiRef.secTotalNet, schema.secTotalNet.value);

// ------------------------------------------------------------------
// GROUP 4: TECHNOLOGY-SPECIFIC PHYSICS AUDIT (PHASE 6)
// ------------------------------------------------------------------
console.log("\n[GROUP 4] Technology-Specific Physics Audit (CDI, MCDI, FCDI, EDI):");

// CDI: porous carbon, no membranes
const cdiModel = calculateCDIModel({ feedWater: { tds: 500, targetTds: 50, flowRate: 10 } });
assert(cdiModel.membraneThicknessMm === 0, "CDI has 0 membranes (membrane-free)", 0, cdiModel.membraneThicknessMm);

// MCDI: AEM at Anode (+), CEM at Cathode (-)
assert(mcdiRef.membraneConfiguration.includes("AEM") && mcdiRef.membraneConfiguration.includes("CEM"), "MCDI includes both AEM and CEM");

// FCDI: continuous slurry, separate slurry pump energy
const fcdiModel = calculateFCDIModel({ feedWater: { tds: 500, targetTds: 50, flowRate: 10 } });
assert(fcdiModel.slurryFlowLmin > 0, "FCDI includes flowing carbon slurry flow", "> 0", fcdiModel.slurryFlowLmin);
assert(fcdiModel.secSlurryPump > 0, "FCDI includes explicit slurry pumping SEC", "> 0", fcdiModel.secSlurryPump);

// EDI: RO gating limit (30 mg/L)
const ediHigh = calculateEDIModel({ feedWater: { tds: 500, hardness: 150, flowRate: 10 } });
assert(ediHigh.isFeedFeasible === false, "EDI raw feed (500 mg/L) is gated as INFEASIBLE", false, ediHigh.isFeedFeasible);
const ediPerm = calculateEDIModel({ feedWater: { tds: 15, hardness: 0.1, flowRate: 10 } });
assert(ediPerm.isFeedFeasible === true, "EDI RO permeate feed (15 mg/L) is FEASIBLE", true, ediPerm.isFeedFeasible);

// ------------------------------------------------------------------
// GROUP 5: LITERATURE TRACEABILITY & ZHAO CITATION AUDIT (PHASE 14 & 16)
// ------------------------------------------------------------------
console.log("\n[GROUP 5] Literature Traceability & Citation Correction Audit:");
const mcdiBenchmarkNote = LITERATURE_BENCHMARKS.MCDI.notes;
assert(!mcdiBenchmarkNote.includes("Zhao et al. 2012 only"), "Pilot SEC citation decoupled from raw Zhao et al. 2012 paper");
assert(centralRef.schema.voltageCell.provenance.includes("LITERATURE_SUPPORTED"), "Cell voltage provenance tagged LITERATURE_SUPPORTED");

// ------------------------------------------------------------------
// GROUP 6: EDGE CASE TESTING (20 CASES — PHASE 26)
// ------------------------------------------------------------------
console.log("\n[GROUP 6] Comprehensive Edge Case Testing (20 Cases):");

const edgeCases = [
    { name: "1. TDS = 0", inputs: { tds: 0, targetTds: 50, flowRate: 10 } },
    { name: "2. TDS < Target", inputs: { tds: 30, targetTds: 50, flowRate: 10 } },
    { name: "3. TDS = Target", inputs: { tds: 50, targetTds: 50, flowRate: 10 } },
    { name: "4. TDS slightly above target", inputs: { tds: 55, targetTds: 50, flowRate: 10 } },
    { name: "5. Very high TDS (10,000 ppm)", inputs: { tds: 10000, targetTds: 50, flowRate: 10 } },
    { name: "6. Zero flow rate", inputs: { tds: 500, targetTds: 50, flowRate: 0 } },
    { name: "7. Negative flow rate", inputs: { tds: 500, targetTds: 50, flowRate: -5 } },
    { name: "8. Zero hardness", inputs: { tds: 500, targetTds: 50, flowRate: 10, hardness: 0 } },
    { name: "9. Extremely high hardness (2000 ppm)", inputs: { tds: 1500, targetTds: 50, flowRate: 10, hardness: 2000 } },
    { name: "10. Invalid pH (pH = 14)", inputs: { tds: 500, targetTds: 50, flowRate: 10, ph: 14 } },
    { name: "11. Invalid Temperature (80 °C)", inputs: { tds: 500, targetTds: 50, flowRate: 10, temperature: 80 } },
    { name: "12. Missing conductivity", inputs: { tds: 500, targetTds: 50, flowRate: 10, conductivity: null } },
    { name: "13. Inconsistent conductivity/TDS", inputs: { tds: 500, conductivity: 50, targetTds: 50, flowRate: 10 } },
    { name: "14. Charge imbalance water", inputs: { tds: 500, ions: { ca: 500, cl: 10 }, flowRate: 10 } },
    { name: "15. Impossible recovery input (99.9%)", inputs: { tds: 500, targetTds: 50, flowRate: 10, recovery: 99.9 } },
    { name: "16. Target below physical limit (0.001 mg/L)", inputs: { tds: 500, targetTds: 0.001, flowRate: 10 } },
    { name: "17. EDI raw feed above limit (500 ppm)", inputs: { technology: "EDI", feedWater: { tds: 500, flowRate: 10 } } },
    { name: "18. CDI outside envelope (5000 ppm)", inputs: { technology: "CDI", feedWater: { tds: 5000, flowRate: 10 } } },
    { name: "19. MCDI outside envelope (15000 ppm)", inputs: { technology: "MCDI", feedWater: { tds: 15000, flowRate: 10 } } },
    { name: "20. FCDI sub-optimal envelope (50 ppm)", inputs: { technology: "FCDI", feedWater: { tds: 50, flowRate: 10 } } }
];

edgeCases.forEach((tc) => {
    try {
        const res = calculateEngineering(tc.inputs);
        assert(res !== null && res !== undefined, `Edge Case "${tc.name}" handled safely without crashing`);
    } catch (err) {
        assert(err.message.includes("Invalid") || err.message.includes("positive"), `Edge Case "${tc.name}" caught expected error: ${err.message}`);
    }
});

// ------------------------------------------------------------------
// SUMMARY & EXIT CODE
// ------------------------------------------------------------------
console.log("\n==================================================================");
console.log(`AUDIT COMPLETE: ${passCount} PASSED, ${failCount} FAILED.`);
console.log("==================================================================");

if (failCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
