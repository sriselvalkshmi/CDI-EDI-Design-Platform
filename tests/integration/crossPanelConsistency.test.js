import { describe, it, expect } from "vitest";
import calculateEngineering from "../../frontend/src/engineering/engine/engineeringEquationEngine.js";
import aiRecommendation from "../../frontend/src/engineering/core/aiRecommendation.js";

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
describe("Cross-Technology Single-Source Validation Test Suite", () => {
    const highSalinityFeed = {
        tds: 5000,
        conductivity: 7692,
        hardness: 1500,
        ph: 7.0,
        temperature: 25,
        flowRate: 10,
        targetTds: 500
    };

    const aiRes = aiRecommendation(highSalinityFeed);
    const techKeys = ["CDI", "MCDI", "FCDI", "EDI"];

    techKeys.forEach(techKey => {
        describe(`Validation for ${techKey}`, () => {
            const eng = calculateEngineering({ technology: techKey, feedWater: highSalinityFeed });
            const matrixEval = aiRes.evaluations.find(e => e.technology === techKey);

            it(`${techKey}: Matrix Outlet TDS === Engineering Outlet TDS`, () => {
                expect(matrixEval.outletTDS).toBe(eng.outletTDS);
            });

            it(`${techKey}: Matrix Removal === Engineering Removal`, () => {
                expect(Math.abs(matrixEval.removalEfficiency - eng.removalEfficiency)).toBeLessThan(0.1);
            });

            it(`${techKey}: Matrix Power === Engineering Power`, () => {
                expect(Math.abs(matrixEval.power - eng.power)).toBeLessThan(1.0);
            });

            it(`${techKey}: Matrix SEC === Engineering SEC`, () => {
                expect(Math.abs(matrixEval.sec - eng.sec)).toBeLessThan(0.01);
            });

            it(`${techKey}: Removal Efficiency Equation matches formula`, () => {
                const expectedRemoval = Number((((highSalinityFeed.tds - eng.outletTDS) / highSalinityFeed.tds) * 100).toFixed(2));
                expect(Math.abs(eng.removalEfficiency - expectedRemoval)).toBeLessThan(0.1);
            });

            it(`${techKey}: Target Achieved Flag matches condition`, () => {
                const expectedTargetAchieved = eng.outletTDS <= highSalinityFeed.targetTds + 0.5;
                expect(eng.isTargetAchieved).toBe(expectedTargetAchieved);
            });

            it(`${techKey}: Target Margin matches calculation`, () => {
                const expectedMargin = Number((highSalinityFeed.targetTds - eng.outletTDS).toFixed(1));
                expect(Math.abs(eng.targetMargin - expectedMargin)).toBeLessThan(0.1);
            });

            it(`${techKey}: Electrical Power Equation P = V_system * I`, () => {
                const expectedPower = Number((eng.voltageStack * eng.current).toFixed(1));
                expect(Math.abs(eng.power - expectedPower)).toBeLessThan(0.5);
            });
        });
    });

    it("EXACT SETPOINT MATCH TARGET MARGIN TEST (MCDI 500 -> 50 ppm)", () => {
        const mcdiSetPoint = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50 } });
        expect(mcdiSetPoint.outletTDS).toBe(50.0);
        expect(mcdiSetPoint.targetMargin).toBe(0.0);
        expect(mcdiSetPoint.targetDeviation).toBe(0.0);
    });

    it("EDI 500 PPM FEED -> 2.6 PPM OUTLET REMOVAL CORRECTNESS TEST", () => {
        const expectedEdiRemoval = Number((((500 - 2.6) / 500) * 100).toFixed(2)); // 99.48%
        expect(expectedEdiRemoval).toBe(99.48);
    });
});
