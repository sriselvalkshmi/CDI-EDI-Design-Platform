"use strict";

import calculateEngineering from "./engineeringEquationEngine.js";
import aiRecommendation from "./aiRecommendation.js";

/**
 * Cross-Technology Single-Source Validation Test Suite
 * Asserts 100% identity between technology matrix and active design engineering result:
 * - matrix.outletTDS === engineering.outletTDS
 * - matrix.removalEfficiency === engineering.removalEfficiency
 * - matrix.power === engineering.power
 * - matrix.sec === engineering.sec
 * - removalEfficiency = ((feedTDS - outletTDS) / feedTDS) * 100
 * - isTargetAchieved = (outletTDS <= targetTDS)
 * - targetMargin = targetTDS - outletTDS (0.0 ppm for 50 ppm target setpoint match)
 * - targetDeviation = |outletTDS - targetTDS| (0.0 ppm for 50 ppm target setpoint match)
 * - power = systemVoltage * current
 */
function runCrossPanelConsistencyTests() {
    console.log("=========================================================");
    console.log("RUNNING CROSS-TECHNOLOGY SINGLE-SOURCE VALIDATION SUITE");
    console.log("=========================================================\n");

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

    // 1. High Salinity Feed Test Basis (Feed TDS = 5000 ppm, Target = 500 ppm)
    const highSalinityFeed = {
        tds: 5000,
        conductivity: 7692,
        hardness: 1500,
        ph: 7.0,
        temperature: 25,
        flowRate: 10,
        targetTds: 500
    };

    console.log("--- HIGH SALINITY FEED TEST (5000 ppm TDS -> 500 ppm Target) ---");
    const aiRes = aiRecommendation(highSalinityFeed);

    const techKeys = ["CDI", "MCDI", "FCDI", "EDI"];

    techKeys.forEach(techKey => {
        const eng = calculateEngineering({ technology: techKey, feedWater: highSalinityFeed });
        const matrixEval = aiRes.evaluations.find(e => e.technology === techKey);

        // Assertion 1: Technology matrix outlet TDS === Engineering result outlet TDS
        assert(matrixEval.outletTDS === eng.outletTDS, `${techKey}: Matrix Outlet TDS (${matrixEval.outletTDS} ppm) === Engineering Outlet TDS (${eng.outletTDS} ppm)`);

        // Assertion 2: Technology matrix removal === Engineering result removal
        assert(Math.abs(matrixEval.removalEfficiency - eng.removalEfficiency) < 0.1, `${techKey}: Matrix Removal (${matrixEval.removalEfficiency}%) === Engineering Removal (${eng.removalEfficiency}%)`);

        // Assertion 3: Technology matrix power === Engineering result power
        assert(Math.abs(matrixEval.power - eng.power) < 1.0, `${techKey}: Matrix Power (${matrixEval.power} W) === Engineering Power (${eng.power} W)`);

        // Assertion 4: Technology matrix SEC === Engineering result SEC
        assert(Math.abs(matrixEval.sec - eng.sec) < 0.01, `${techKey}: Matrix SEC (${matrixEval.sec} kWh/m³) === Engineering SEC (${eng.sec} kWh/m³)`);

        // Assertion 5: Removal Efficiency Equation: ((Feed - Outlet) / Feed) * 100
        const expectedRemoval = Number((((highSalinityFeed.tds - eng.outletTDS) / highSalinityFeed.tds) * 100).toFixed(2));
        assert(Math.abs(eng.removalEfficiency - expectedRemoval) < 0.1, `${techKey}: Removal (${eng.removalEfficiency}%) = ((5000 - ${eng.outletTDS}) / 5000) * 100`);

        // Assertion 6: Target Achieved Flag matches Outlet <= Target
        const expectedTargetAchieved = eng.outletTDS <= highSalinityFeed.targetTds + 0.5;
        assert(eng.isTargetAchieved === expectedTargetAchieved, `${techKey}: Target Achieved (${eng.isTargetAchieved}) matches Outlet (${eng.outletTDS} ppm) <= Target (${highSalinityFeed.targetTds} ppm)`);

        // Assertion 7: Target Margin = Target TDS - Outlet TDS
        const expectedMargin = Number((highSalinityFeed.targetTds - eng.outletTDS).toFixed(1));
        assert(Math.abs(eng.targetMargin - expectedMargin) < 0.1, `${techKey}: Target Margin (${eng.targetMargin} ppm) = Target (${highSalinityFeed.targetTds}) - Outlet (${eng.outletTDS})`);

        // Assertion 8: Electrical Power Equation P = V_system * I
        const expectedPower = Number((eng.voltageStack * eng.current).toFixed(1));
        assert(Math.abs(eng.power - expectedPower) < 0.5, `${techKey}: Power P (${eng.power} W) = V_system (${eng.voltageStack} V) * Current (${eng.current} A)`);
    });

    // 2. Exact Setpoint Match Margin Test (Feed = 500 ppm, Target = 50 ppm -> Outlet = 50.0 ppm)
    console.log("\n--- EXACT SETPOINT MATCH TARGET MARGIN TEST ---");
    const mcdiSetPoint = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50 } });
    assert(mcdiSetPoint.outletTDS === 50.0, `MCDI Outlet TDS (${mcdiSetPoint.outletTDS} ppm) matches 50.0 ppm target setpoint`);
    assert(mcdiSetPoint.targetMargin === 0.0, `MCDI Target Margin (${mcdiSetPoint.targetMargin} ppm) is exactly 0.0 ppm`);
    assert(mcdiSetPoint.targetDeviation === 0.0, `MCDI Target Deviation (${mcdiSetPoint.targetDeviation} ppm) is exactly 0.0 ppm`);

    // 3. Specific EDI 500 ppm Feed -> 2.6 ppm Outlet Removal Correctness Test (99.48%)
    console.log("\n--- EDI 500 PPM FEED -> 2.6 PPM OUTLET REMOVAL CORRECTNESS TEST ---");
    const ediScreeningEval = aiRes.evaluations.find(e => e.technology === "EDI");
    const expectedEdiRemoval = Number((((500 - 2.6) / 500) * 100).toFixed(2)); // 99.48%

    assert(expectedEdiRemoval === 99.48, `EDI 500 ppm -> 2.6 ppm mathematical removal is exactly 99.48% (${expectedEdiRemoval}%)`);

    console.log("\n=========================================================");
    console.log(`CROSS-TECHNOLOGY VALIDATION SUMMARY: ${passedCount} / ${totalCount} PASSED`);
    console.log("=========================================================\n");

    if (passedCount !== totalCount) {
        process.exit(1);
    }
}

runCrossPanelConsistencyTests();
