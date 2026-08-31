import { describe, it, expect } from "vitest";
import { calculateMCDIChargeEfficiency } from "../../shared/engineering/models/mCDIModel.js";
import { calculateEngineering } from "../../shared/engineering/engine/engineeringEquationEngine.js";

describe("Dynamic Parametric Sensitivity & Charge Efficiency Audit (Tests A, B, C)", () => {
    describe("1. Charge Efficiency Mathematical Boundaries & Clamp Verification", () => {
        it("strictly enforces 0.80 lower bound for dilute feed (39 mg/L at 1.4 V)", () => {
            const lambda = calculateMCDIChargeEfficiency(1.4, 39);
            expect(lambda).toBe(0.80);
        });

        it("returns exact 0.92 nominal baseline for 500 mg/L feed at 1.4 V", () => {
            const lambda = calculateMCDIChargeEfficiency(1.4, 500);
            expect(lambda).toBe(0.92);
        });

        it("maintains 0.92 baseline at 1000 mg/L feed at 1.4 V", () => {
            const lambda = calculateMCDIChargeEfficiency(1.4, 1000);
            expect(lambda).toBe(0.92);
        });

        it("applies Faradaic overpotential penalty when cell voltage > 1.4 V", () => {
            const lambdaHighV = calculateMCDIChargeEfficiency(1.6, 500);
            expect(lambdaHighV).toBeLessThan(0.92);
        });
    });

    describe("2. Test A: Dilute Feed Baseline (39 mg/L -> 2 mg/L at 20 L/min)", () => {
        const inputA = {
            technology: "MCDI",
            flowRate: 20,
            feedWater: {
                tds: 39,
                flowRate: 20,
                targetTds: 2,
                hardness: 10,
                ph: 7.0
            },
            manualCellVoltage: 1.4,
            manualElectrodeArea: 350,
            manualPairs: 34
        };

        it("achieves target setpoint, closed mass balance, and 95.2% recovery", () => {
            const res = calculateEngineering(inputA);
            expect(res.outletTDS).toBeLessThanOrEqual(2.0);
            expect(res.waterRecovery).toBeCloseTo(95.24, 1);
            expect(res.chargeEfficiencyFrac || res.chargeEfficiency / 100).toBe(0.80);
            
            const flowResidual = Math.abs(res.flowRateLmin - (res.productFlowLmin + res.concentrateFlowLmin));
            expect(flowResidual).toBeLessThan(0.001);

            const feedSalt = (res.flowRateLmin / 60) * (res.feedTds / 1000);
            const prodSalt = (res.productFlowLmin / 60) * (res.outletTDS / 1000);
            const rejSalt = (res.concentrateFlowLmin / 60) * (res.concentrateTds / 1000);
            const saltMassResidual = Math.abs(feedSalt - (prodSalt + rejSalt));
            expect(saltMassResidual).toBeLessThan(0.0001);

            expect(res.power).toBeCloseTo(35.7, 1);
            expect(res.secElectricalGross || res.secElectricalAdsorption).toBeCloseTo(0.0313, 3);
        });
    });

    describe("3. Test B: Dynamic Shift to 100 mg/L Feed (100 mg/L -> 2 mg/L at 20 L/min)", () => {
        const inputB = {
            technology: "MCDI",
            flowRate: 20,
            feedWater: {
                tds: 100,
                flowRate: 20,
                targetTds: 2,
                hardness: 10,
                ph: 7.0
            },
            manualCellVoltage: 1.4,
            manualElectrodeArea: 350,
            manualPairs: 34
        };

        it("dynamically recalculates current, power, SEC, and concentrate brine concentration", () => {
            const res = calculateEngineering(inputB);
            expect(res.outletTDS).toBeCloseTo(5.0, 1);
            expect(res.waterRecovery).toBeCloseTo(95.24, 1);
            expect(res.current).toBeGreaterThan(0.75);
            expect(res.power).toBeGreaterThan(35.7);
            expect(res.secElectricalGross || res.secElectricalAdsorption).toBeGreaterThan(0.0313);
            expect(res.concentrateTds).toBeGreaterThan(774.8);
            
            const flowResidual = Math.abs(res.flowRateLmin - (res.productFlowLmin + res.concentrateFlowLmin));
            expect(flowResidual).toBeLessThan(0.001);

            const feedSalt = (res.flowRateLmin / 60) * (res.feedTds / 1000);
            const prodSalt = (res.productFlowLmin / 60) * (res.outletTDS / 1000);
            const rejSalt = (res.concentrateFlowLmin / 60) * (res.concentrateTds / 1000);
            const saltMassResidual = Math.abs(feedSalt - (prodSalt + rejSalt));
            expect(saltMassResidual).toBeLessThan(0.0001);
        });
    });

    describe("4. Test C: Nominal Baseline Envelope (500 mg/L -> 50 mg/L at 20 L/min)", () => {
        const inputC = {
            technology: "MCDI",
            flowRate: 20,
            feedWater: {
                tds: 500,
                flowRate: 20,
                targetTds: 50,
                hardness: 10,
                ph: 7.0
            },
            manualCellVoltage: 1.4,
            manualElectrodeArea: 350,
            manualPairs: 34
        };

        it("evaluates exactly at nominal 0.92 charge efficiency baseline with closed balances", () => {
            const res = calculateEngineering(inputC);
            expect(res.outletTDS).toBeLessThanOrEqual(50.0);
            expect(res.chargeEfficiencyFrac || res.chargeEfficiency / 100).toBe(0.92);
            expect(res.waterRecovery).toBeCloseTo(95.24, 1);

            const flowResidual = Math.abs(res.flowRateLmin - (res.productFlowLmin + res.concentrateFlowLmin));
            expect(flowResidual).toBeLessThan(0.001);

            const feedSalt = (res.flowRateLmin / 60) * (res.feedTds / 1000);
            const prodSalt = (res.productFlowLmin / 60) * (res.outletTDS / 1000);
            const rejSalt = (res.concentrateFlowLmin / 60) * (res.concentrateTds / 1000);
            const saltMassResidual = Math.abs(feedSalt - (prodSalt + rejSalt));
            expect(saltMassResidual).toBeLessThan(0.0001);
        });
    });
});
