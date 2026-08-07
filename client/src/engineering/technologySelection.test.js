"use strict";

import calculateEngineering from "./engineeringEquationEngine.js";
import aiRecommendation from "./aiRecommendation.js";

/**
 * Automated Technology Selection & Engineering Regression Test Suite
 * Tests all 4 technologies, Auto recommendation, Target changes, and Clean vs. Raw Feed EDI envelopes.
 */
function runTests() {
    console.log("=========================================================");
    console.log("RUNNING AUTOMATED ENGINEERING REGRESSION TEST SUITE");
    console.log("=========================================================\n");

    const rawFeedWater = {
        tds: 500,
        conductivity: 300,
        hardness: 150,
        ph: 7.2,
        temperature: 25,
        flowRate: 10,
        targetTds: 10
    };

    let passedCount = 0;
    let totalCount = 0;

    function assert(condition, message) {
        totalCount++;
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passedCount++;
        } else {
            console.error(`❌ FAIL: ${message}`);
        }
    }

    // --- TEST 1: CDI EVALUATION ---
    console.log("--- TEST 1: CDI Evaluation ---");
    const cdiRes = calculateEngineering({ technology: "CDI", feedWater: rawFeedWater });
    assert(cdiRes.technology === "CDI", "Technology is CDI");
    assert(cdiRes.outletTDS >= 70 && cdiRes.outletTDS <= 80, `CDI Outlet TDS is ~75 ppm (Actual: ${cdiRes.outletTDS} ppm)`);
    assert(cdiRes.isTargetAchieved === false, "CDI Target Achieved is FALSE for 10 ppm target");
    assert(cdiRes.feedQualityFeasible === true, "CDI Direct Feed is Feasible for 500 ppm");

    // --- TEST 2: MCDI EVALUATION ---
    console.log("\n--- TEST 2: MCDI Evaluation ---");
    const mcdiRes = calculateEngineering({ technology: "MCDI", feedWater: rawFeedWater });
    assert(mcdiRes.technology === "MCDI", "Technology is MCDI");
    assert(mcdiRes.outletTDS >= 28 && mcdiRes.outletTDS <= 32, `MCDI Outlet TDS is ~30 ppm (Actual: ${mcdiRes.outletTDS} ppm)`);
    assert(mcdiRes.isTargetAchieved === false, "MCDI Target Achieved is FALSE for 10 ppm target");

    // --- TEST 3: FCDI EVALUATION ---
    console.log("\n--- TEST 3: FCDI Evaluation ---");
    const fcdiRes = calculateEngineering({ technology: "FCDI", feedWater: rawFeedWater });
    assert(fcdiRes.technology === "FCDI", "Technology is FCDI");
    assert(fcdiRes.outletTDS >= 23 && fcdiRes.outletTDS <= 27, `FCDI Outlet TDS is ~25 ppm (Actual: ${fcdiRes.outletTDS} ppm)`);
    assert(fcdiRes.isTargetAchieved === false, "FCDI Target Achieved is FALSE for 10 ppm target");

    // --- TEST 4: EDI EVALUATION (RAW FEED) ---
    console.log("\n--- TEST 4: EDI Evaluation (Raw Feed) ---");
    const ediRes = calculateEngineering({ technology: "EDI", feedWater: rawFeedWater });
    assert(ediRes.technology === "EDI", "Technology is EDI");
    assert(ediRes.outletTDS <= 10, `EDI Outlet TDS achieves <= 10 ppm (Actual: ${ediRes.outletTDS} ppm)`);
    assert(ediRes.isTargetAchieved === true, "EDI Target Achieved is TRUE for 10 ppm target");
    assert(ediRes.feedQualityFeasible === false, "EDI Direct Feed is FALSE for raw 500 ppm / 150 mg/L hardness feed");
    assert(ediRes.processTrainName === "RO → EDI", "EDI Process Train is RO → EDI when raw feed is supplied");

    // --- TEST 5: AUTO MODE SELECTION ---
    console.log("\n--- TEST 5: Auto Mode Technology Selection ---");
    const autoRes = aiRecommendation(rawFeedWater);
    assert(autoRes.selectedTechnology === "EDI", `Auto Mode selects EDI (Selected: ${autoRes.selectedTechnology})`);

    // --- TEST 6: TARGET CHANGE RESPONSIVENESS (MCDI at 30 ppm Outlet) ---
    console.log("\n--- TEST 6: Target Change Responsiveness (MCDI) ---");
    const mcdiTarget100 = calculateEngineering({ technology: "MCDI", feedWater: { ...rawFeedWater, targetTds: 100 } });
    assert(mcdiTarget100.isTargetAchieved === true, "MCDI Target Achieved is TRUE when Target = 100 ppm (30 ppm <= 100 ppm)");

    const mcdiTarget10 = calculateEngineering({ technology: "MCDI", feedWater: { ...rawFeedWater, targetTds: 10 } });
    assert(mcdiTarget10.isTargetAchieved === false, "MCDI Target Achieved is FALSE when Target = 10 ppm (30 ppm > 10 ppm)");

    const mcdiTarget5 = calculateEngineering({ technology: "MCDI", feedWater: { ...rawFeedWater, targetTds: 5 } });
    assert(mcdiTarget5.isTargetAchieved === false, "MCDI Target Achieved is FALSE when Target = 5 ppm (30 ppm > 5 ppm)");

    // --- TEST 7: CLEAN / CONDITIONED FEED EDI ---
    console.log("\n--- TEST 7: Clean / Conditioned Feed EDI ---");
    const cleanFeedWater = {
        tds: 15,
        conductivity: 23,
        hardness: 0.2,
        ph: 7.0,
        temperature: 25,
        flowRate: 10,
        targetTds: 10
    };
    const cleanEdiRes = calculateEngineering({ technology: "EDI", feedWater: cleanFeedWater });
    assert(cleanEdiRes.feedQualityFeasible === true, "EDI Direct Feed is TRUE for conditioned RO permeate feed (15 ppm TDS, 0.2 mg/L hardness)");
    assert(cleanEdiRes.processTrainName === "EDI", "EDI Process Train is standalone EDI for conditioned feed");

    console.log("\n=========================================================");
    console.log(`TEST SUMMARY: ${passedCount} / ${totalCount} PASSED`);
    console.log("=========================================================\n");

    if (passedCount !== totalCount) {
        process.exit(1);
    }
}

runTests();
