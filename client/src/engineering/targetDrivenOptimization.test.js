"use strict";

import calculateEngineering from "./engineeringEquationEngine.js";
import optimize from "./designOptimizer.js";

/**
 * Target-Driven Physics Sizing & Energy Optimization Test Suite
 * Asserts Target TDS operates as an active setpoint constraint:
 * 1. Target = 100 ppm -> Outlet TDS ≈ 100.0 ppm
 * 2. Target = 50 ppm -> Outlet TDS ≈ 50.0 ppm
 * 3. Target = 5 ppm -> Target Not Achievable for MCDI single-stage
 */
function runTargetDrivenOptimizationTests() {
    console.log("=========================================================");
    console.log("RUNNING TARGET-DRIVEN PHYSICS SIZING TEST SUITE");
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

    const feed500 = { tds: 500, conductivity: 300, hardness: 150, ph: 7.2, flowRate: 10 };

    // TEST 1: Target = 100 ppm
    console.log("--- TEST 1: MCDI Target = 100 ppm Setpoint ---");
    const mcdi100 = calculateEngineering({ technology: "MCDI", feedWater: { ...feed500, targetTds: 100 } });
    assert(mcdi100.outletTDS <= 100.5 && mcdi100.outletTDS >= 95.0, `MCDI Outlet TDS (${mcdi100.outletTDS} ppm) matches ~100 ppm target setpoint`);
    assert(mcdi100.isTargetAchieved === true, `MCDI Target Achieved is TRUE for 100 ppm target`);

    // TEST 2: Target = 50 ppm
    console.log("\n--- TEST 2: MCDI Target = 50 ppm Setpoint ---");
    const mcdi50 = calculateEngineering({ technology: "MCDI", feedWater: { ...feed500, targetTds: 50 } });
    assert(mcdi50.outletTDS <= 50.5 && mcdi50.outletTDS >= 45.0, `MCDI Outlet TDS (${mcdi50.outletTDS} ppm) matches ~50 ppm target setpoint`);
    assert(mcdi50.isTargetAchieved === true, `MCDI Target Achieved is TRUE for 50 ppm target`);

    // TEST 3: Target = 5 ppm (Unachievable for MCDI single-stage)
    console.log("\n--- TEST 3: MCDI Target = 5 ppm Unachievable Boundary ---");
    const mcdi5 = calculateEngineering({ technology: "MCDI", feedWater: { ...feed500, targetTds: 5 } });
    assert(mcdi5.isTargetAchieved === false, `MCDI Target Achieved is FALSE for 5 ppm target (Calculated Outlet: ${mcdi5.outletTDS} ppm > 5.0 ppm)`);

    // TEST 4: Design Optimizer Target Setpoint Match
    console.log("\n--- TEST 4: Design Optimizer Setpoint Minimization ---");
    const optRes = optimize({ ...feed500, targetTds: 50 }, {}, { technology: "MCDI" });
    assert(optRes.outletTDS <= 50.5, `Optimized Outlet TDS (${optRes.outletTDS} ppm) achieves <= 50.5 ppm target setpoint`);

    console.log("\n=========================================================");
    console.log(`TARGET-DRIVEN OPTIMIZATION SUMMARY: ${passedCount} / ${totalCount} PASSED`);
    console.log("=========================================================\n");

    if (passedCount !== totalCount) {
        process.exit(1);
    }
}

runTargetDrivenOptimizationTests();
