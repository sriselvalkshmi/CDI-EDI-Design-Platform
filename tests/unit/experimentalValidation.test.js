import { describe, it, expect } from "vitest";
import {
    calculateAbsoluteError,
    calculateRelativeError,
    calculateMAE,
    calculateRMSE,
    calculateBias,
    calculateR2,
    calculateValidationStats,
    checkValidationBoundary,
    applyExperimentalCalibration,
    DEFAULT_EXPERIMENTAL_RUNS,
    LITERATURE_BENCHMARKS
} from "../../shared/engineering/validation/experimentalValidation.js";

describe("Experimental Validation & Model Calibration Suite", () => {
    // 1. Prediction Error Calculation
    it("1. calculates absolute prediction error correctly", () => {
        const err = calculateAbsoluteError(51.2, 50.0);
        expect(err).toBe(1.2);
    });

    // 2. Relative Error Percentage Calculation
    it("2. calculates relative error percentage correctly", () => {
        const relErr = calculateRelativeError(51.2, 50.0);
        expect(relErr).toBe(2.34); // (1.2 / 51.2) * 100 = 2.34%
    });

    // 3. Mean Absolute Error (MAE) Calculation
    it("3. calculates MAE correctly across measured and predicted arrays", () => {
        const measured = [51.2, 104.5, 153.8];
        const predicted = [50.0, 100.0, 150.0];
        const mae = calculateMAE(measured, predicted);
        expect(mae).toBe(3.1667);
    });

    // 4. Root Mean Square Error (RMSE) Calculation
    it("4. calculates RMSE correctly across measured and predicted arrays", () => {
        const measured = [51.2, 104.5, 153.8];
        const predicted = [50.0, 100.0, 150.0];
        const rmse = calculateRMSE(measured, predicted);
        expect(rmse).toBe(3.4704);
    });

    // 5. Mean Bias Error Calculation
    it("5. calculates Bias correctly across measured and predicted arrays", () => {
        const measured = [51.2, 104.5, 153.8];
        const predicted = [50.0, 100.0, 150.0];
        const bias = calculateBias(measured, predicted);
        expect(bias).toBe(3.1667); // Positive bias indicates physics model slightly under-predicts
    });

    // 6. Coefficient of Determination (R²) Calculation
    it("6. calculates R² metric correctly", () => {
        const measured = [51.2, 104.5, 153.8];
        const predicted = [50.0, 100.0, 150.0];
        const r2 = calculateR2(measured, predicted);
        expect(r2).toBeGreaterThan(0.99);
    });

    // 7. Empty Dataset Handling
    it("7. handles empty dataset safely and returns UNVALIDATED status", () => {
        const stats = calculateValidationStats([], "MCDI");
        expect(stats.runCount).toBe(0);
        expect(stats.validationStatus).toBe("UNVALIDATED");
        expect(stats.statusLabel).toContain("UNVALIDATED");
    });

    // 8. Invalid Measurement Input Rejection
    it("8. rejects invalid or mismatched measurement inputs with descriptive error", () => {
        expect(() => calculateAbsoluteError(NaN, 50)).toThrow(/invalid/i);
        expect(() => calculateMAE([50], [50, 60])).toThrow(/invalid/i);
        expect(() => calculateRMSE([], [])).toThrow(/invalid/i);
    });

    // 9. Physics-Based Calibration Factor Computation & Application
    it("9. applies physics-based experimental calibration factor without obscuring underlying model", () => {
        const physicsOutput = { technology: "MCDI", outletTDS: 50.0 };
        const calibrated = applyExperimentalCalibration(physicsOutput, "MCDI", DEFAULT_EXPERIMENTAL_RUNS);

        expect(calibrated.physicsOutletTds).toBe(50.0);
        expect(calibrated.calibrationFactor).toBeGreaterThan(1.0);
        expect(calibrated.correctedOutletTds).toBeCloseTo(51.2, 0);
        expect(calibrated.literatureBenchmark).toBeDefined();
    });

    // 10. Validated Operating Envelope Detection
    it("10. detects validated operating range when parameters fall within pilot envelope", () => {
        const boundary = checkValidationBoundary("MCDI", { tds: 500, flowRate: 10 }, { cellVoltageV: 1.4 });
        expect(boundary.isValidatedRange).toBe(true);
        expect(boundary.statusLabel).toBe("VALIDATED OPERATING RANGE");
    });

    // 11. Extrapolation Boundary Detection
    it("11. detects model extrapolation when parameters exceed pilot envelope", () => {
        const boundary = checkValidationBoundary("MCDI", { tds: 4000, flowRate: 25 }, { cellVoltageV: 2.0 });
        expect(boundary.isValidatedRange).toBe(false);
        expect(boundary.statusLabel).toBe("MODEL EXTRAPOLATION");
    });

    // 12. Input Object Immutability
    it("12. ensures applyExperimentalCalibration does NOT mutate original input object", () => {
        const originalInput = Object.freeze({ technology: "MCDI", outletTDS: 50.0 });
        expect(() => applyExperimentalCalibration(originalInput, "MCDI")).not.toThrow();
    });
});
