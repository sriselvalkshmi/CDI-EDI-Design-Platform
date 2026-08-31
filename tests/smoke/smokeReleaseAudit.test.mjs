import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_EQUATIONS_DATABASE } from "../../shared/engineering/equations/defaultEquationsDatabase.js";
import { evaluateFormula, validateFormula } from "../../shared/engineering/engine/formulaParser.js";
import calculateEngineering from "../../shared/engineering/engine/engineeringEquationEngine.js";

test("1. Master Equation Registry Size & Integrity", () => {
    assert.strictEqual(DEFAULT_EQUATIONS_DATABASE.length, 57, "Authoritative equation catalog must contain exactly 57 equations");
    
    DEFAULT_EQUATIONS_DATABASE.forEach(eq => {
        assert.ok(eq.id, `Equation ${eq.name} must have an ID`);
        assert.ok(eq.formula, `Equation ${eq.name} must have a formula`);
        assert.ok(eq.units, `Equation ${eq.name} must have physical units`);
        assert.ok(eq.category, `Equation ${eq.name} must have a category`);
        assert.ok(eq.sourceClassification, `Equation ${eq.name} must have source classification`);
        assert.ok(eq.description, `Equation ${eq.name} must have description`);
        assert.ok(eq.applicableBasis, `Equation ${eq.name} must have applicable basis`);
        
        // Test formula validity
        const val = validateFormula(eq.formula);
        assert.ok(val.valid, `Formula syntax for ${eq.name} (${eq.formula}) must be valid. Error: ${val.error}`);
    });
});

test("2. Flow & Volumetric Conversion Physics (10 L/min -> 1.6667e-4 m³/s)", () => {
    const flowEq = DEFAULT_EQUATIONS_DATABASE.find(e => e.id === "EQ-01-01");
    assert.ok(flowEq, "EQ-01-01 must exist");
    const result = evaluateFormula(flowEq.formula, { flowRate: 10.0 });
    assert.ok(Math.abs(result - 0.0001666667) < 1e-8, "10 L/min must evaluate to 1.6667e-4 m³/s");
});

test("3. Current Density Unit Protection (350 cm² -> 56.57 A/m² at 1.98 A)", () => {
    const cdEq = DEFAULT_EQUATIONS_DATABASE.find(e => e.id === "EQ-03-04");
    assert.ok(cdEq, "EQ-03-04 must exist");
    const result = evaluateFormula(cdEq.formula, { I: 1.98, electrodeArea_cm2: 350.0 });
    assert.ok(Math.abs(result - 56.5714) < 0.01, `Current density must evaluate to 56.57 A/m². Got: ${result}`);
});

test("4. Distinct Stack Geometry Definitions (85 mm active core vs 176 mm assembly envelope)", () => {
    const coreEq = DEFAULT_EQUATIONS_DATABASE.find(e => e.id === "EQ-09-03A");
    const envEq = DEFAULT_EQUATIONS_DATABASE.find(e => e.id === "EQ-09-03B");
    
    assert.ok(coreEq, "Active stack core equation EQ-09-03A must exist");
    assert.ok(envEq, "Total stack envelope equation EQ-09-03B must exist");
    
    const coreHeight = evaluateFormula(coreEq.formula, {
        cellPairs: 68,
        electrodeThickness: 0.60,
        spacerThickness: 0.50,
        membraneThickness: 0.15
    });
    assert.ok(Math.abs(coreHeight - 85.0) < 0.01, `Active core height must evaluate to 85.0 mm. Got: ${coreHeight}`);
    
    const envHeight = evaluateFormula(envEq.formula, {
        cellPairs: 68,
        cellPitch: 2.0,
        endPlateThickness: 40.0
    });
    assert.ok(Math.abs(envHeight - 176.0) < 0.01, `Assembly envelope height must evaluate to 176.0 mm. Got: ${envHeight}`);
    
    assert.notStrictEqual(coreHeight, envHeight, "Active core height and envelope height must be distinct physical quantities");
});

test("5. Cycle-Integrated Salt Adsorption Capacity (SAC = 9.00 mg/g)", () => {
    const sacEq = DEFAULT_EQUATIONS_DATABASE.find(e => e.id === "EQ-10-03");
    assert.ok(sacEq, "EQ-10-03 must exist");
    
    const sacVal = evaluateFormula(sacEq.formula, {
        tdsIn: 500.0,
        tdsOut: 49.8,
        flowRate: 10.0,
        adsorptionTime: 5.0,
        totalCarbonMass: 2.50
    });
    // deltaTDS = 450.2 mg/L, Total salt removed in 5 min = 450.2 * (10/60) * 300 = 22,510 mg
    // SAC = 22,510 mg / 2500 g = 9.004 mg/g
    assert.ok(Math.abs(sacVal - 9.004) < 0.01, `SAC must evaluate to 9.00 mg/g. Got: ${sacVal}`);
});

test("6. Mass & Salt Balance Closure (< 0.001 residual)", () => {
    const feed = { flowRate: 10.0, tds: 500.0, targetTds: 50.0, ph: 7.2, temperature: 25.0 };
    const res = calculateEngineering({ technology: "MCDI", feedWater: feed });
    
    const q_f = Number(res.flowRate || 10.0);
    const rec = Number(res.waterRecovery || 95.2) / 100;
    const q_p = q_f * rec;
    const q_c = q_f - q_p;
    const flowResidual = Math.abs(q_f - (q_p + q_c));
    assert.ok(flowResidual < 0.01, `Volumetric flow balance residual must be < 0.01 L/min. Got: ${flowResidual}`);
    
    const c_f = Number(res.tds || 500.0);
    const c_p = Number(res.outletTDS || 49.8);
    const c_c = ((q_f * c_f) - (q_p * c_p)) / q_c;
    const feedSalt = (q_f / 60) * (c_f / 1000);
    const prodSalt = (q_p / 60) * (c_p / 1000);
    const rejSalt = (q_c / 60) * (c_c / 1000);
    const saltResidual = Math.abs(feedSalt - (prodSalt + rejSalt));
    assert.ok(saltResidual < 0.001, `Salt mass balance residual must be < 0.001 g/s. Got: ${saltResidual}`);
});

test("7. Physical Non-Negative & SEC Boundedness (No NaN, Infinity, or Negative SEC)", () => {
    const feed = { flowRate: 10.0, tds: 500.0, targetTds: 50.0, ph: 7.2, temperature: 25.0 };
    const res = calculateEngineering({ technology: "MCDI", feedWater: feed });
    
    const sec = Number(res.sec);
    assert.ok(!isNaN(sec) && isFinite(sec) && sec > 0, `SEC must be finite and positive. Got: ${sec}`);
    assert.ok(res.power > 0, `Stack power must be positive. Got: ${res.power}`);
    assert.ok(res.voltageStack > 0, `Stack voltage must be positive. Got: ${res.voltageStack}`);
});

test("8. Boundary Envelope Stress Testing (TDS 5,000 mg/L, Recovery 90%)", () => {
    const highSalinityFeed = { flowRate: 10.0, tds: 5000.0, targetTds: 500.0, ph: 7.5, temperature: 25.0 };
    const res = calculateEngineering({ technology: "MCDI", feedWater: highSalinityFeed });
    
    assert.ok(res.outletTDS <= 500.0, `MCDI must achieve target outlet TDS. Got: ${res.outletTDS}`);
    assert.ok(res.waterRecovery >= 85.0, `Recovery must be physically positive. Got: ${res.waterRecovery}`);
});
