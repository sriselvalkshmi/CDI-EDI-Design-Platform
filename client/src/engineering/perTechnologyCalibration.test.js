"use strict";

import experimentalDataset from "../data/experimentalData.json" with { type: "json" };
import { splitAndCalibrate } from "./experimentalCalibration.js";
import calculateEngineering from "./engineeringEquationEngine.js";

/**
 * Stage 2: Per-Technology Model Calibration & Multi-Parameter Validation Test Suite
 * Tests per-technology RMSE, MAE, R^2, calibration factors (betaTds), and multi-parameter scaling.
 */
function runStage2CalibrationTests() {
    console.log("=========================================================");
    console.log("RUNNING STAGE 2: PER-TECHNOLOGY CALIBRATION TEST SUITE");
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

    const res = splitAndCalibrate(0.8, experimentalDataset);

    console.log("--- PER-TECHNOLOGY CALIBRATION METRICS ---");
    console.log(`Global Benchmark Sample Size: ${res.sampleSize} Runs`);
    console.log(`Global RMSE TDS: ${res.testMetrics.rmse} ppm, MAE TDS: ${res.testMetrics.mae} ppm`);
    console.log(`Global Calibration Factor (betaTds): ${res.betaTdsTrain}\n`);

    assert(res.sampleSize >= 12, "Benchmark dataset contains at least 12 pilot runs (3 per technology)");
    assert(res.testMetrics.rmse < 3.0, `Global RMSE TDS (${res.testMetrics.rmse} ppm) is < 3.0 ppm`);

    const techKeys = ["CDI", "MCDI", "FCDI", "EDI"];

    techKeys.forEach(tech => {
        console.log(`\n--- ${tech} INDIVIDUAL CALIBRATION METRICS ---`);
        const techMetrics = res.byTechnology[tech];
        console.log(`Sample Size: ${techMetrics.sampleSize} pilot runs`);
        console.log(`RMSE TDS: ${techMetrics.rmseTds} ppm`);
        console.log(`MAE TDS: ${techMetrics.maeTds} ppm`);
        console.log(`Calibration Factor (betaTds): ${techMetrics.betaTds}`);

        assert(techMetrics.sampleSize >= 3, `${tech} sample size is >= 3 pilot runs`);
        assert(techMetrics.rmseTds < 3.0, `${tech} RMSE TDS (${techMetrics.rmseTds} ppm) is < 3.0 ppm`);
        assert(techMetrics.betaTds >= 0.8 && techMetrics.betaTds <= 1.2, `${tech} betaTds factor (${techMetrics.betaTds}) is within [0.8, 1.2] envelope`);
    });

    console.log("\n--- MULTI-PARAMETER OPERATING MATRIX CHECKS ---");

    // 1. Feed TDS Sensitivity Check (CDI: 300 ppm vs 800 ppm)
    const cdiLow = calculateEngineering({ technology: "CDI", feedWater: { tds: 300, targetTds: 50, flowRate: 5 } });
    const cdiHigh = calculateEngineering({ technology: "CDI", feedWater: { tds: 800, targetTds: 120, flowRate: 15 } });
    assert(cdiHigh.outletTDS > cdiLow.outletTDS, `CDI Outlet TDS increases with higher feed TDS (300 ppm -> ${cdiLow.outletTDS} ppm vs 800 ppm -> ${cdiHigh.outletTDS} ppm)`);

    // 2. Flow Rate Sensitivity & Module Sizing Check (MCDI: 5 L/min vs 50 L/min)
    const mcdiLowFlow = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50, flowRate: 5 } });
    const mcdiHighFlow = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50, flowRate: 50 } });
    assert(mcdiHighFlow.cellPairs >= mcdiLowFlow.cellPairs, `MCDI required cell pairs scale with flow rate (5 L/min -> ${mcdiLowFlow.cellPairs} pairs vs 50 L/min -> ${mcdiHighFlow.cellPairs} pairs)`);

    console.log("\n=========================================================");
    console.log(`STAGE 2 TEST SUMMARY: ${passedCount} / ${totalCount} PASSED`);
    console.log("=========================================================\n");

    if (passedCount !== totalCount) {
        process.exit(1);
    }
}

runStage2CalibrationTests();
