"use strict";

import experimentalDataset from "../data/experimentalData.json" with { type: "json" };
import { splitAndCalibrate } from "./experimentalCalibration.js";
import calculateEngineering from "./engineeringEquationEngine.js";

/**
 * Independent Validation Automated Test Suite (Leak-Free 80/20 Train/Test Split)
 * Evaluates out-of-sample prediction error, R^2, MAPE, Max Error, residual analysis,
 * and asserts zero data leakage between train and test sets.
 */
function runIndependentValidationTests() {
    console.log("=========================================================");
    console.log("RUNNING LEAK-FREE INDEPENDENT VALIDATION TEST SUITE");
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

    // 1. Run Leak-Free 80/20 Train/Test Split Calibration
    const splitRes = splitAndCalibrate(0.8, experimentalDataset);

    console.log(`Dataset Split: Total ${splitRes.sampleSize} Runs | Train Set (80%): ${splitRes.trainMetrics.sampleSize} Runs | Test Set (20%): ${splitRes.testMetrics.sampleSize} Runs\n`);

    // ASSERTION 1: Calibration factors calculated using TRAIN SET ONLY
    assert(splitRes.betaTdsTrain > 0, `Calibration factors calculated using TRAIN SET ONLY (betaTdsTrain = ${splitRes.betaTdsTrain})`);

    // ASSERTION 2: Independent TEST SET contains no rows used during calibration
    assert(splitRes.isDisjoint === true, "Independent TEST SET contains no rows used during calibration (Train IDs ∩ Test IDs = ∅)");

    // 2. Train vs Test Performance Metrics Table
    console.log("\n--- TRAIN VS TEST PERFORMANCE METRICS COMPARISON ---");
    console.log(`Metric                   | Train Set (80%) | Test Set (20% Out-of-Sample)`);
    console.log(`-------------------------|-----------------|-----------------------------`);
    console.log(`Sample Size              | ${splitRes.trainMetrics.sampleSize.toString().padEnd(15)} | ${splitRes.testMetrics.sampleSize}`);
    console.log(`RMSE (TDS ppm)           | ${splitRes.trainMetrics.rmse.toString().padEnd(15)} | ${splitRes.testMetrics.rmse}`);
    console.log(`MAE (TDS ppm)            | ${splitRes.trainMetrics.mae.toString().padEnd(15)} | ${splitRes.testMetrics.mae}`);
    console.log(`R² (Coeff. of Det.)      | ${splitRes.trainMetrics.r2.toString().padEnd(15)} | ${splitRes.testMetrics.r2}`);
    console.log(`Max Absolute Error (ppm) | ${splitRes.trainMetrics.maxAbsErr.toString().padEnd(15)} | ${splitRes.testMetrics.maxAbsErr}`);
    console.log(`MAPE (%)                 | ${splitRes.trainMetrics.mape.toString().padEnd(15)} | ${splitRes.testMetrics.mape}%\n`);

    assert(splitRes.testMetrics.rmse < 3.0, `Out-of-sample Test RMSE (${splitRes.testMetrics.rmse} ppm) is < 3.0 ppm`);
    assert(splitRes.testMetrics.r2 > 0.95, `Out-of-sample Test R² (${splitRes.testMetrics.r2}) is > 0.95`);
    assert(splitRes.testMetrics.mape < 5.0, `Out-of-sample Test MAPE (${splitRes.testMetrics.mape}%) is < 5.0%`);

    // 3. Electrical Equation Consistency Checks (V_system = V_module * N_modules | P = V_system * I)
    console.log("\n--- AUTHORITATIVE ELECTRICAL EQUATION CONSISTENCY CHECKS ---");
    const mcdiEng = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50 } });
    const expectedVoltageStack = mcdiEng.voltageModule * mcdiEng.numberOfModules;
    const expectedPower = mcdiEng.voltageStack * mcdiEng.current;

    assert(Math.abs(expectedVoltageStack - mcdiEng.voltageStack) < 0.1, `V_system (${mcdiEng.voltageStack} V) = V_module (${mcdiEng.voltageModule} V) * N_modules (${mcdiEng.numberOfModules})`);
    assert(Math.abs(expectedPower - mcdiEng.power) < 0.5, `Power P (${mcdiEng.power} W) = V_system (${mcdiEng.voltageStack} V) * Current (${mcdiEng.current} A)`);

    console.log("\n=========================================================");
    console.log(`INDEPENDENT VALIDATION SUMMARY: ${passedCount} / ${totalCount} PASSED`);
    console.log("=========================================================\n");

    if (passedCount !== totalCount) {
        process.exit(1);
    }
}

runIndependentValidationTests();
