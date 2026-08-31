import { describe, it } from "vitest";
import calculateEngineering from "../../shared/engineering/engine/engineeringEquationEngine.js";
import calculateCDIModel from "../../shared/engineering/models/cdiModel.js";
import calculateMCDIModel from "../../shared/engineering/models/mCDIModel.js";
import calculateFCDIModel from "../../shared/engineering/models/fCDIModel.js";
import calculateEDIModel from "../../shared/engineering/models/ediModel.js";
import aiRecommendation from "../../shared/engineering/core/aiRecommendation.js";

describe("Engineering Calculation Audit Suite", () => {
    it("runs engineering calculation audit tests", () => {
        runEngineeringCalculationAuditTests();
    });
});

/**
 * Phase 4 Complete Engineering Calculation Integrity Audit Test Suite
 * Fully verifies CDI, MCDI, FCDI, EDI, SEC consistency, mass balance closure,
 * target-achievement decoupling, recommendation gating, and Cases A, B, C.
 */
export function runEngineeringCalculationAuditTests() {
    console.log("==================================================================");
    console.log("PHASE 4: COMPREHENSIVE ENGINEERING CALCULATION INTEGRITY AUDIT");
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

    // ------------------------------------------------------------------
    // GROUP 1: CDI AUDIT
    // ------------------------------------------------------------------
    console.log("\n[GROUP 1] CDI Model Audit (Membrane-free, fixed carbon, cyclic):");
    const cdiRes = calculateCDIModel({ feedWater: { tds: 500, targetTds: 50, flowRate: 10 } });
    assert(cdiRes.membraneThicknessMm === 0, "CDI membrane count/thickness is ZERO (membrane-free)");
    assert(cdiRes.operationType.includes("Cyclic"), "CDI operation type is Cyclic Batch");
    assert(cdiRes.waterRecovery > 70 && cdiRes.waterRecovery < 90, `CDI water recovery derived (${cdiRes.waterRecovery}%)`);
    assert(cdiRes.isWaterConserved === true, "CDI water balance closes perfectly (Q_feed = Q_prod + Q_rej)");
    assert(cdiRes.isSaltConserved === true, "CDI salt balance closes perfectly (Salt_feed = Salt_prod + Salt_rej)");
    assert(Math.abs((cdiRes.secElectricalNet + cdiRes.secHydraulic) - cdiRes.secTotalNet) < 0.001, `CDI SEC balance closes (${cdiRes.secElectricalNet} + ${cdiRes.secHydraulic} = ${cdiRes.secTotalNet})`);

    // ------------------------------------------------------------------
    // GROUP 2: MCDI AUDIT
    // ------------------------------------------------------------------
    console.log("\n[GROUP 2] MCDI Model Audit (AEM@Anode, CEM@Cathode, 20% Energy Rec, Faraday):");
    const mcdiRes = calculateMCDIModel({ feedWater: { tds: 500, targetTds: 50, flowRate: 10 } });
    assert(mcdiRes.membraneConfiguration.includes("AEM") && mcdiRes.membraneConfiguration.includes("CEM"), "MCDI has both AEM and CEM membranes");
    assert(mcdiRes.energyRecoveryFactor === 0.20, "MCDI energy recovery factor is explicitly 20%");
    assert(mcdiRes.secElectricalGross > mcdiRes.secElectricalNet, `MCDI Gross SEC (${mcdiRes.secElectricalGross}) > Net SEC (${mcdiRes.secElectricalNet}) due to energy recovery`);
    assert(Math.abs((mcdiRes.secElectricalNet + mcdiRes.secHydraulic) - mcdiRes.secTotalNet) < 0.0001, `MCDI Net SEC addition adds up: ${mcdiRes.secElectricalNet} + ${mcdiRes.secHydraulic} = ${mcdiRes.secTotalNet}`);
    assert(Math.abs((mcdiRes.secElectricalGross + mcdiRes.secHydraulic) - mcdiRes.secTotalGross) < 0.0001, `MCDI Gross SEC addition adds up: ${mcdiRes.secElectricalGross} + ${mcdiRes.secHydraulic} = ${mcdiRes.secTotalGross}`);
    assert(mcdiRes.isWaterConserved === true, "MCDI water balance closes");
    assert(mcdiRes.isSaltConserved === true, "MCDI salt balance closes");

    // ------------------------------------------------------------------
    // GROUP 3: FCDI AUDIT
    // ------------------------------------------------------------------
    console.log("\n[GROUP 3] FCDI Model Audit (Flowable carbon slurry, separate slurry pumping):");
    const fcdiRes = calculateFCDIModel({ feedWater: { tds: 500, targetTds: 50, flowRate: 10 } });
    assert(fcdiRes.slurryFlowLmin > 0, `FCDI circulating slurry flow rate defined (${fcdiRes.slurryFlowLmin} L/min)`);
    assert(fcdiRes.secSlurryPump > 0, `FCDI slurry pumping SEC separated (${fcdiRes.secSlurryPump} kWh/m³)`);
    assert(fcdiRes.secWaterPump > 0, `FCDI water pumping SEC separated (${fcdiRes.secWaterPump} kWh/m³)`);
    assert(fcdiRes.operationType.includes("Continuous"), "FCDI operation is continuous non-stop");
    assert(fcdiRes.isWaterConserved === true, "FCDI water balance closes");
    assert(fcdiRes.isSaltConserved === true, "FCDI salt balance closes");

    // ------------------------------------------------------------------
    // GROUP 4: EDI AUDIT
    // ------------------------------------------------------------------
    console.log("\n[GROUP 4] EDI Model Audit (Mixed-bed resin, electromigration, RO gating):");
    const ediRaw = calculateEDIModel({ feedWater: { tds: 500, hardness: 150, flowRate: 10 } });
    assert(ediRaw.isFeedFeasible === false, "EDI raw feed (500 mg/L) is gated as INFEASIBLE");
    assert(ediRaw.gatingReason.includes("30 mg/L"), "EDI gating reason explicitly specifies 30 mg/L limit");

    const ediPermeate = calculateEDIModel({ feedWater: { tds: 15, hardness: 0.1, flowRate: 10, targetTds: 0.05 } });
    assert(ediPermeate.isFeedFeasible === true, "EDI RO permeate feed (15 mg/L) is FEASIBLE");
    assert(ediPermeate.predictedOutletResistivity > 10, `EDI achieves ultrapure resistivity (${ediPermeate.predictedOutletResistivity} MΩ·cm)`);
    assert(ediPermeate.calculationTrace.some(t => t.name === "Hydraulic Balance" && t.provenance === "EXTRAPOLATED"), "Ergun pressure drop tagged EXTRAPOLATED");

    // ------------------------------------------------------------------
    // GROUP 5: CROSS-TECHNOLOGY AUDIT & DECOUPLING
    // ------------------------------------------------------------------
    console.log("\n[GROUP 5] Cross-Technology Target Achievement & Recommendation Decoupling:");
    const cdiHigh = calculateEngineering({ technology: "CDI", feedWater: { tds: 1000, targetTds: 50, flowRate: 10 } });
    assert(cdiHigh.isTargetAchieved === false, "CDI target check reports FALSE when single-stage cannot reach target");
    assert(cdiHigh.targetDeviation > 0, `CDI reports explicit positive deviation (+${cdiHigh.targetDeviation} mg/L)`);

    // ------------------------------------------------------------------
    // GROUP 6: TEST CASE A — BRACKISH WATER (500 -> 50 mg/L)
    // ------------------------------------------------------------------
    console.log("\n[GROUP 6] Case A Verification — Brackish Water (500 mg/L Feed -> 50 mg/L Target):");
    const caseA = aiRecommendation({ tds: 500, targetTds: 50, flowRate: 10, hardness: 150 });
    assert(caseA.selectedTechnology === "MCDI", `Case A selects MCDI (Actual: ${caseA.selectedTechnology})`);
    assert(caseA.screening.EDI.status === "PRETREATMENT_REQUIRED", "Case A screens EDI as PRETREATMENT_REQUIRED");
    assert(caseA.screening.MCDI.status === "RECOMMENDED", "Case A screens MCDI as RECOMMENDED");

    // ------------------------------------------------------------------
    // GROUP 7: TEST CASE B — RO PERMEATE (15 -> 0.05 mg/L)
    // ------------------------------------------------------------------
    console.log("\n[GROUP 7] Case B Verification — RO Permeate (15 mg/L Feed -> 0.05 mg/L Target):");
    const caseB = aiRecommendation({ tds: 15, targetTds: 0.05, flowRate: 10, hardness: 0.1, conductivity: 23 });
    assert(caseB.selectedTechnology === "EDI", `Case B selects EDI for ultrapure polishing (Actual: ${caseB.selectedTechnology})`);
    assert(caseB.screening.EDI.feedQualityFeasible === true, "Case B confirms EDI direct feed quality is feasible");

    // ------------------------------------------------------------------
    // GROUP 8: TEST CASE C — HIGH-SALINITY FEED (5000 -> 500 mg/L)
    // ------------------------------------------------------------------
    console.log("\n[GROUP 8] Case C Verification — High-Salinity Feed (5,000 mg/L Feed -> 500 mg/L Target):");
    const caseC = aiRecommendation({ tds: 5000, targetTds: 500, flowRate: 10, hardness: 400 });
    assert(caseC.selectedTechnology === "FCDI", `Case C selects FCDI for continuous high-salinity flow-electrode operation (Actual: ${caseC.selectedTechnology})`);
    assert(caseC.screening.CDI.envelopeOK === false, "Case C flags CDI outside literature envelope");
    assert(caseC.screening.FCDI.envelopeOK === true, "Case C confirms FCDI within high-salinity envelope");

    console.log("\n==================================================================");
    console.log(`AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("==================================================================");

    if (failCount > 0) {
        throw new Error(`Engineering Calculation Audit Failed with ${failCount} assertion failures.`);
    }

    return { passCount, failCount };
}

// Auto-execute if run directly via Node.js
if (typeof process !== "undefined" && process.argv && process.argv[1] && process.argv[1].includes("engineeringCalculationAudit.test.js")) {
    runEngineeringCalculationAuditTests();
}
