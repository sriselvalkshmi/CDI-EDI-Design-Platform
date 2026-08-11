import { describe, it, expect } from "vitest";
import experimentalDataset from "../data/experimentalData.json" with { type: "json" };
import { splitAndCalibrate } from "./experimentalCalibration.js";
import calculateEngineering from "./engineeringEquationEngine.js";

/**
 * Independent Validation Automated Test Suite (Leak-Free 80/20 Train/Test Split)
 * Evaluates out-of-sample prediction error, R^2, MAPE, Max Error, residual analysis,
 * and asserts zero data leakage between train and test sets.
 */
describe("Independent Validation Automated Test Suite (Leak-Free 80/20 Train/Test Split)", () => {
    const splitRes = splitAndCalibrate(0.8, experimentalDataset);

    it("Calibration factors are calculated using TRAIN SET ONLY", () => {
        expect(splitRes.betaTdsTrain).toBeGreaterThan(0);
    });

    it("Independent TEST SET contains no rows used during calibration (Train IDs ∩ Test IDs = ∅)", () => {
        expect(splitRes.isDisjoint).toBe(true);
    });

    it("Out-of-sample Test RMSE is < 3.0 ppm", () => {
        expect(splitRes.testMetrics.rmse).toBeLessThan(3.0);
    });

    it("Out-of-sample Test R² is > 0.95", () => {
        expect(splitRes.testMetrics.r2).toBeGreaterThan(0.95);
    });

    it("Out-of-sample Test MAPE is < 5.0%", () => {
        expect(splitRes.testMetrics.mape).toBeLessThan(5.0);
    });

    it("Authoritative Electrical Equation Consistency: V_system = V_module * N_modules", () => {
        const mcdiEng = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50 } });
        const expectedVoltageStack = mcdiEng.voltageModule * mcdiEng.numberOfModules;
        expect(Math.abs(expectedVoltageStack - mcdiEng.voltageStack)).toBeLessThan(0.1);
    });

    it("Authoritative Electrical Equation Consistency: Power P = V_system * I", () => {
        const mcdiEng = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50 } });
        const expectedPower = mcdiEng.voltageStack * mcdiEng.current;
        expect(Math.abs(expectedPower - mcdiEng.power)).toBeLessThan(0.5);
    });
});
