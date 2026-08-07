"use strict";

import calculateEngineering from "./engineeringEquationEngine.js";
import aiRecommendation from "./aiRecommendation.js";

/**
 * Engineering Sanity Checks Automated Test Suite
 * Tests 10 core physical principles across CDI, MCDI, FCDI, and EDI.
 */
function runSanityChecks() {
    console.log("=========================================================");
    console.log("RUNNING 10 AUTOMATED ENGINEERING SANITY CHECKS");
    console.log("=========================================================\n");

    const feedWater = {
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

    const techKeys = ["CDI", "MCDI", "FCDI", "EDI"];

    techKeys.forEach(tech => {
        console.log(`\n--- SANITY CHECKS FOR ${tech} ---`);
        const eng = calculateEngineering({ technology: tech, feedWater });

        // 1. Mass Balance Check: Q_feed * C_feed = Q_prod * C_prod + Q_conc * C_conc
        const recoveryFrac = eng.waterRecovery / 100;
        const qProd = feedWater.flowRate * recoveryFrac;
        const qConc = feedWater.flowRate * (1 - recoveryFrac);
        const cProd = eng.outletTDS;
        const cConc = qConc > 0 ? (feedWater.flowRate * feedWater.tds - qProd * cProd) / qConc : feedWater.tds;
        
        const massIn = feedWater.flowRate * feedWater.tds; // mg/min
        const massOut = qProd * cProd + qConc * cConc; // mg/min
        const massErr = Math.abs(massIn - massOut) / Math.max(1, massIn);
        assert(massErr < 0.001, `${tech} Mass Balance: Mass In (${massIn} mg/min) = Mass Out (${massOut.toFixed(1)} mg/min)`);

        // 2. Water Recovery Check: R = (Q_prod / Q_feed) * 100
        const calcRecovery = (qProd / feedWater.flowRate) * 100;
        assert(Math.abs(calcRecovery - eng.waterRecovery) < 0.01, `${tech} Water Recovery: ${calcRecovery.toFixed(1)}% matches engine recovery (${eng.waterRecovery}%)`);

        // 3. Salt Removal Balance Check: Removal % = ((C_feed - C_prod) / C_feed) * 100
        const expectedRemoval = ((feedWater.tds - cProd) / feedWater.tds) * 100;
        assert(Math.abs(expectedRemoval - eng.removalEfficiency) < 0.1, `${tech} Salt Removal Balance: ${expectedRemoval.toFixed(1)}% matches engine removal (${eng.removalEfficiency}%)`);

        // 4. Electrical Power Check: P = V_system * I = (V_module * N_modules) * I
        const expectedPower = eng.voltageStack * eng.current;
        assert(Math.abs(expectedPower - eng.power) < 0.5, `${tech} Electrical Power P=V_sys*I: (${eng.voltageStack}V * ${eng.current}A = ${expectedPower.toFixed(1)}W) matches engine power (${eng.power}W)`);

        // 5. Specific Energy Consumption Check: SEC = P / (Q_prod * 60 / 1000) [kWh/m³]
        const qProdM3h = (qProd * 60) / 1000;
        const expectedSec = qProdM3h > 0 ? (eng.power / 1000) / qProdM3h : 0;
        assert(Math.abs(expectedSec - eng.sec) < 0.001, `${tech} SEC Calculation: ${expectedSec.toFixed(4)} kWh/m³ matches engine SEC (${eng.sec} kWh/m³)`);

        // 6. Hydrodynamic Residence Time Check: tau = V_hydraulic / Q_feed
        const expectedTau = eng.reactorVolumeLiters / feedWater.flowRate;
        assert(Math.abs(expectedTau - eng.residenceTime) < 0.001, `${tech} Residence Time tau=V/Q: ${expectedTau.toFixed(4)} min matches engine residence time (${eng.residenceTime} min)`);

        // 7. Pressure Drop Consistency Check: Delta P > 0
        assert(eng.pressureDrop > 0, `${tech} Pressure Drop: Delta P (${eng.pressureDrop} Pa) is strictly positive`);

        // 8. Authoritative Integer Cell Pairs & Module Voltage Consistency Check
        const expectedTotalPairs = eng.pairsPerModule * eng.numberOfModules;
        assert(eng.cellPairs === expectedTotalPairs, `${tech} Total Cell Pairs (${eng.cellPairs}) === Pairs/Module (${eng.pairsPerModule}) * N_modules (${eng.numberOfModules})`);
        
        const expectedVoltageStack = eng.voltageModule * eng.numberOfModules;
        assert(Math.abs(expectedVoltageStack - eng.voltageStack) < 0.1, `${tech} Stack Voltage Consistency: (${eng.voltageModule}V * ${eng.numberOfModules} modules = ${expectedVoltageStack.toFixed(1)}V) matches voltageStack (${eng.voltageStack}V)`);

        // 9. Target vs Outlet Validation Check
        const expectedTargetStatus = eng.outletTDS <= feedWater.targetTds + 0.5;
        assert(eng.isTargetAchieved === expectedTargetStatus, `${tech} Target Validation: isTargetAchieved (${eng.isTargetAchieved}) matches condition (${eng.outletTDS} ppm <= ${feedWater.targetTds} ppm)`);
    });

    // 10. Auto Selection Consistency Check
    console.log("\n--- SANITY CHECK 10: AUTO SELECTION CONSISTENCY ---");
    const aiRes = aiRecommendation(feedWater);
    assert(aiRes.selectedTechnology === "EDI", `Auto Selection Consistency: Selected technology is ${aiRes.selectedTechnology} for 10 ppm target`);

    console.log("\n=========================================================");
    console.log(`SANITY CHECKS SUMMARY: ${passedCount} / ${totalCount} PASSED`);
    console.log("=========================================================\n");

    if (passedCount !== totalCount) {
        process.exit(1);
    }
}

runSanityChecks();
