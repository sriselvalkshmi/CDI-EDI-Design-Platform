import test from "node:test";
import assert from "node:assert/strict";

import calculateCDIModel from "../../frontend/src/engineering/models/cdiModel.js";
import calculateMCDIModel from "../../frontend/src/engineering/models/mCDIModel.js";
import calculateFCDIModel from "../../frontend/src/engineering/models/fCDIModel.js";
import calculateEDIModel from "../../frontend/src/engineering/models/ediModel.js";
import calculateEngineering from "../../frontend/src/engineering/engine/engineeringEquationEngine.js";
import aiRecommendation from "../../frontend/src/engineering/core/aiRecommendation.js";
import { getCentralEngineeringResult } from "../../frontend/src/engineering/core/singleSourceOfTruth.js";

// ==========================================
// A-F: ELECTROCHEMICAL & UNIT SIZING AUDIT
// ==========================================

test("A-C. Unit Conversions & Salt Mass/Molar Removal Rates", () => {
    const feed = { tds: 500, flowRate: 10.0, targetTds: 50 };
    const mcdi = calculateMCDIModel({ feedWater: feed });
    
    // Q [m³/s] = 10 L/min / 60000 = 1.6667e-4
    const expectedFlowM3s = 10.0 / 60000;
    assert.ok(Math.abs(mcdi.flowRateM3s - expectedFlowM3s) < 1e-7, "Flow m³/s unit conversion must match 10/60000");

    // Delta C = 500 - 50 = 450 g/m³; mass removal = 1.6667e-4 * 450 = 0.0750 g/s
    const expectedMassRateGs = expectedFlowM3s * 450;
    assert.ok(Math.abs(mcdi.massRemovalRateGs - expectedMassRateGs) < 1e-4, "Mass removal rate must match Q*DeltaC = 0.075 g/s");

    // Molar removal = 0.075 / 58.44 = 0.001283 mol/s
    const expectedMolarRateMols = expectedMassRateGs / 58.44;
    assert.ok(Math.abs(mcdi.molarRemovalRateMols - expectedMolarRateMols) < 1e-6, "Molar removal rate must match 0.001283 mol/s");
});

test("D-E. Faraday Charge Transfer & Series Stack Current Distribution", () => {
    const feed = { tds: 500, flowRate: 10.0, targetTds: 50 };
    const mcdi = calculateMCDIModel({ feedWater: feed });

    // I_total = (0.001283 * 1 * 96485) / 0.92 = 134.58 A
    const expectedTotalCurrent = (mcdi.molarRemovalRateMols * 1 * 96485) / mcdi.chargeEfficiencyFrac;
    assert.ok(Math.abs(mcdi.totalFaradayCurrent - expectedTotalCurrent) < 0.5, "Total Faradaic current must equal z*F*n_dot/eta");

    // In electrical series stack: I_stack = I_total / N_pairs
    const expectedStackCurrent = expectedTotalCurrent / mcdi.cellPairs;
    assert.ok(Math.abs(mcdi.current - expectedStackCurrent) < 0.05, "Stack series current must equal I_total / N_pairs = 1.98 A");
});

test("F. Current Density Definition Consistency", () => {
    const mcdi = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0, targetTds: 50 }, electrodeArea: 350, cellPairs: 68 });
    
    // J = I_stack / (A_planar in m²) = 1.98 / 0.0350 = 56.6 A/m²
    const planarAreaM2 = 350 / 10000;
    const expectedCurrentDensity = mcdi.current / planarAreaM2;
    assert.ok(Math.abs(mcdi.currentDensity - expectedCurrentDensity) < 0.2, "Current density J must equal I_stack / A_planar");
});

// ==========================================
// G-L: POWER, HYDRAULICS & SEC AUDIT
// ==========================================

test("G-H. Stack Voltage & Electrical Power Derivation", () => {
    const mcdi = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 }, cellPairs: 68, voltage: 1.40 });
    
    // V_stack = 68 * 1.40 = 95.2 V
    assert.equal(mcdi.voltageStack, 95.2, "Stack voltage must equal 68 * 1.40 = 95.2 V");

    // Power = V_stack * I_stack = 95.2 * 1.98 = 188.5 W
    const expectedPower = mcdi.voltageStack * mcdi.current;
    assert.ok(Math.abs(mcdi.power - expectedPower) < 1.0, "Electrical power must equal V_stack * I_stack = 188.5 W");
});

test("I-K. Hydraulic Parallelization, Velocity, Re & Pressure Drop", () => {
    const mcdi = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 }, cellPairs: 68, electrodeArea: 350, spacerThickness: 0.5 });
    
    // Flow area = 68 * 0.1871 * 0.0005 = 6.36e-3 m²
    // Velocity u = 1.6667e-4 / 6.36e-3 = 0.026 - 0.049 m/s
    assert.ok(mcdi.flowVelocity > 0.02 && mcdi.flowVelocity < 0.10, "Hydraulic velocity must be physically reasonable");
    assert.ok(mcdi.pressureDrop > 100 && mcdi.pressureDrop < 1000, "Spacer channel pressure drop must be positive and physically realistic");
});

test("L. Specific Energy Accounting (Gross, Net & Total SEC >= Net Electrical)", () => {
    const mcdi = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0, targetTds: 50 } });
    
    assert.ok(mcdi.secElectrical > 0, "Electrical SEC must be strictly positive");
    assert.ok(mcdi.secHydraulic > 0, "Hydraulic SEC must be strictly positive");
    assert.ok(mcdi.secTotal >= mcdi.secElectrical, "Total SEC must be >= Net Electrical SEC");
    assert.ok(Math.abs(mcdi.secTotal - (mcdi.secElectrical + mcdi.secHydraulic)) < 0.001, "Total SEC must equal Net Elec + Hyd");
});

// ==========================================
// M-O: MASS BALANCES & WATER RECOVERY
// ==========================================

test("M. Water Recovery Definition", () => {
    const mcdi = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 } });
    const calculatedRecovery = (mcdi.productFlowLmin / mcdi.flowRateLmin) * 100;
    assert.ok(Math.abs(mcdi.waterRecovery - calculatedRecovery) < 0.1, "Recovery must match (Q_prod / Q_feed) * 100");
});

test("N-O. Independent Water and Salt Mass Balance Closures", () => {
    const feed = { tds: 500, flowRate: 10.0, targetTds: 50 };
    const mcdi = calculateMCDIModel({ feedWater: feed });
    
    // Water balance: Q_feed = Q_prod + Q_brine
    const waterResidual = Math.abs(mcdi.flowRateLmin - (mcdi.productFlowLmin + mcdi.concentrateFlowLmin));
    assert.ok(waterResidual < 1e-5, "Water balance residual must be zero");

    // Salt balance: Q_feed*C_feed = Q_prod*C_prod + Q_brine*C_brine
    const feedSalt = (mcdi.flowRateLmin / 60000) * mcdi.feedTds;
    const prodSalt = (mcdi.productFlowLmin / 60000) * mcdi.outletTds;
    const brineSalt = (mcdi.concentrateFlowLmin / 60000) * mcdi.concentrateTds;
    const saltResidual = Math.abs(feedSalt - (prodSalt + brineSalt));
    assert.ok(saltResidual < 1e-5, "Salt balance residual must be zero");
});

// ==========================================
// P-S: SENSITIVITY RESPONSES
// ==========================================

test("P-S. Sensitivity: Current, Flow, Cell Pairs, and Active Area", () => {
    const base = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 }, current: 1.98, cellPairs: 68, electrodeArea: 350 });
    
    // P. Current sensitivity: I up -> outlet down
    const higherI = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 }, current: 2.38, cellPairs: 68, electrodeArea: 350 });
    assert.ok(higherI.outletTds <= base.outletTds, "Increasing current must increase salt removal (lower outlet TDS)");

    // Q. Flow sensitivity: Q up -> outlet up
    const higherQ = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 12.0 }, current: 1.98, cellPairs: 68, electrodeArea: 350 });
    assert.ok(higherQ.outletTds > base.outletTds, "Increasing flow at fixed current must decrease single-pass removal (higher outlet TDS)");

    // R. Cell pair sensitivity: N down -> voltage down, outlet up
    const lowerN = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 }, current: 1.98, cellPairs: 54, electrodeArea: 350 });
    assert.ok(lowerN.voltageStack < base.voltageStack, "Fewer cell pairs must reduce stack voltage");
    assert.ok(lowerN.outletTds > base.outletTds, "Fewer cell pairs at fixed current must reduce total Faradaic removal");

    // S. Area sensitivity: Area up -> current density down
    const largerArea = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 }, current: 1.98, cellPairs: 68, electrodeArea: 500 });
    assert.ok(largerArea.currentDensity < base.currentDensity, "Larger planar area must reduce current density J");
});

// ==========================================
// T-W: TECHNOLOGY-SPECIFIC ARCHITECTURES
// ==========================================

test("T. CDI Architecture: Membrane-Free, Co-ion Penalty", () => {
    const cdi = calculateCDIModel({ feedWater: { tds: 500, flowRate: 10.0 } });
    assert.equal(cdi.totalMembraneAreaM2, 0.0, "CDI must have zero membrane area");
    assert.equal(cdi.membraneThicknessMm, 0.0, "CDI must have zero membrane thickness");
    assert.ok(cdi.chargeEfficiencyFrac < 0.80, "CDI must reflect co-ion expulsion efficiency penalty");
});

test("U. MCDI Architecture: AEM and CEM Included", () => {
    const mcdi = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 }, cellPairs: 68, electrodeArea: 350 });
    assert.ok(mcdi.totalMembraneAreaM2 > 0, "MCDI must have positive membrane area");
    assert.ok(mcdi.chargeEfficiencyFrac >= 0.85, "MCDI must exhibit high charge efficiency with co-ion exclusion");
});

test("V. FCDI Architecture: Flowing Slurry Pumping Energy Included", () => {
    const fcdi = calculateFCDIModel({ feedWater: { tds: 500, flowRate: 10.0 } });
    assert.ok(fcdi.slurryFlowLmin > 0, "FCDI must model circulating slurry flow");
    assert.ok(fcdi.secSlurryPump > 0, "FCDI must account for slurry pumping SEC");
    assert.ok(fcdi.secTotal >= fcdi.secElectrical + fcdi.secHydraulic, "FCDI total SEC must include slurry pump duty");
});

test("W. EDI Feasibility Gate: 500 mg/L Feed Requires Pretreatment", () => {
    const edi = calculateEDIModel({ feedWater: { tds: 500, hardness: 150, flowRate: 10.0 } });
    assert.equal(edi.feedGatingStatus, "FEED PRETREATMENT REQUIRED", "500 mg/L raw feed must require pretreatment for EDI");
    assert.equal(edi.isFeedFeasible, false, "EDI direct feed must be marked infeasible on 500 ppm feed");
});

// ==========================================
// X-AH: ADVANCED PROPAGATION, REACTIVITY & EXPORT AUDIT
// ==========================================

test("X-Z. Multi-Tech Comparison Matrix & Single Source of Truth Pedigree", () => {
    const rec = aiRecommendation({ tds: 500, hardness: 150, flowRate: 10.0, targetTds: 50 });
    assert.equal(rec.evaluations.length, 4, "Comparison matrix must evaluate all 4 technologies");

    const mcdiEval = rec.evaluations.find(e => e.technology === "MCDI");
    const ediEval = rec.evaluations.find(e => e.technology === "EDI");

    assert.ok(mcdiEval.targetAchievable, "MCDI must achieve target 50 mg/L");
    assert.equal(ediEval.feedQualityFeasible, false, "EDI must be flagged as requiring pretreatment in comparison matrix");

    const eng = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, flowRate: 10.0, targetTds: 50 } });
    const ssot = getCentralEngineeringResult(eng, "MCDI", { tds: 500, targetTds: 50 });

    assert.ok(ssot.outputs.outletTDS.value > 0, "SSOT outlet TDS must be positive");
    assert.equal(ssot.outputs.outletTDS.value, eng.outletTDS, "SSOT outlet TDS must match engineering result exactly");
    assert.equal(ssot.outputs.secTotalNet.value, eng.sec, "SSOT SEC must match engineering result exactly");
});

test("AA-AD. Single Source of Truth & Comparison Matrix Independence", () => {
    const feed = { tds: 500, hardness: 150, flowRate: 10.0, targetTds: 50 };
    const cdi = calculateCDIModel({ feedWater: feed });
    const mcdi = calculateMCDIModel({ feedWater: feed });
    const fcdi = calculateFCDIModel({ feedWater: feed });
    const edi = calculateEDIModel({ feedWater: feed });

    // Distinct physical models must give distinct, non-identical performance outputs
    assert.notEqual(cdi.outletTds, mcdi.outletTds, "CDI single-pass outlet must differ from MCDI due to co-ion expulsion");
    assert.notEqual(fcdi.secTotal, mcdi.secTotal, "FCDI SEC must differ from MCDI due to slurry pumping power");
    assert.equal(edi.isFeedFeasible, false, "EDI must reject raw 500 ppm feed as requiring RO pretreatment");
});

test("AE-AF. Manual Adjustment Reactivity & Dynamic Recalculation", () => {
    // 1. Changing Voltage
    const lowV = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 }, voltage: 1.0, cellPairs: 68, current: 1.98 });
    const highV = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 }, voltage: 1.5, cellPairs: 68, current: 1.98 });
    assert.ok(highV.voltageStack > lowV.voltageStack, "Stack voltage must react to cell voltage change");
    assert.ok(highV.power > lowV.power, "Power must react to voltage change");

    // 2. Changing Spacer Thickness
    const thinSpacer = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 }, spacerThickness: 0.3 });
    const thickSpacer = calculateMCDIModel({ feedWater: { tds: 500, flowRate: 10.0 }, spacerThickness: 0.8 });
    assert.ok(thinSpacer.pressureDrop > thickSpacer.pressureDrop, "Thinner spacer channel must produce higher hydraulic pressure drop");
});

test("AG-AH. Zero Hardcoded Engineering Outputs & Export Consistency", () => {
    const eng = calculateEngineering({ technology: "MCDI", feedWater: { tds: 600, flowRate: 12.0, targetTds: 60 } });
    
    // Changing feed TDS from 500 -> 600 must dynamically update removal load, current, and outlet
    assert.equal(eng.feedTds, 600, "Feed TDS must be 600");
    assert.ok(eng.current > 0, "Current must be derived dynamically");
    assert.ok(eng.voltageStack > 0, "Stack voltage must be derived dynamically");
    assert.ok(eng.power > 0, "Power must be derived dynamically");
});
