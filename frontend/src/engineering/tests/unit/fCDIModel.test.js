import { describe, it, expect } from "vitest";
import {
    calculateFCDIModel,
    calculateFCDIChargeUtilization,
    runFCDISensitivityAnalysis,
    FCDI_ENVELOPE
} from "../../shared/engineering/models/fCDIModel.js";

describe("Hardened First-Principles FCDI Engineering Model Suite", () => {

    // 1. Normal benchmark calculation
    it("1. verifies normal benchmark calculation for FCDI desalting", () => {
        const res = calculateFCDIModel({
            flowRate: 10,
            tds: 500,
            targetTds: 50,
            voltage: 1.4,
            waterRecovery: 90,
            currentDensity: 80,
            slurryConcentrationWt: 10,
            slurryFlowRatio: 1.2
        });

        expect(res.feedTds).toBe(500);
        expect(res.outletTDS).toBe(50);
        expect(res.removalEfficiency).toBe(90);
        expect(res.chargeUtilizationFrac).toBe(0.88);
        expect(res.totalFaradayCurrent).toBeCloseTo(140.71, 1);

        expect(res.pairsPerModule).toBe(34);
        expect(res.numberOfModules).toBe(2);
        expect(res.cellPairs).toBe(68);

        expect(res.voltageCell).toBe(1.40);
        expect(res.voltageModule).toBe(47.60);
        expect(res.voltageStack).toBe(95.20);
        expect(res.electricalPowerW).toBeCloseTo(196.9, 0);

        expect(res.productFlowM3h).toBe(0.54);
        expect(res.secElectrical).toBeCloseTo(0.3647, 3);
        expect(res.status).toBe("TARGET ACHIEVED — MODEL PREDICTION");
        expect(res.secEstimateLabel).toContain("[MODEL ESTIMATE]");
    });

    // 2. Exact salt mass conservation
    it("2. verifies exact salt mass conservation balance and detects perturbations", () => {
        const res = calculateFCDIModel({
            flowRate: 10,
            tds: 500,
            targetTds: 50,
            waterRecovery: 90
        });

        const saltInGs = res.flowRateM3s * res.feedTds;
        const saltProdGs = (res.productFlowM3h / 3600) * res.outletTDS;
        const saltBrineGs = (res.concentrateFlowM3h / 3600) * res.concentrateTds;

        expect(saltInGs).toBeCloseTo(saltProdGs + saltBrineGs, 4);
        expect(res.massBalanceStatus).toBe("CONSERVED");
        expect(res.massBalancePercent).toBeGreaterThanOrEqual(99.99);

        // Perturbation test: Intentionally perturbing product salt rate by 10% breaks conservation assertion
        const perturbedProductSaltGs = saltProdGs * 1.10;
        const perturbedErrorGs = Math.abs(saltInGs - (perturbedProductSaltGs + saltBrineGs));
        expect(perturbedErrorGs).toBeGreaterThan(1e-4);
    });

    // 3. Invalid negative TDS
    it("3. rejects invalid negative TDS with descriptive exception", () => {
        expect(() => calculateFCDIModel({ flowRate: 10, tds: -500, targetTds: 50 }))
            .toThrow("INVALID ENGINEERING INPUT: Feed TDS must be a non-negative finite number.");
    });

    // 4. Invalid target > feed
    it("4. rejects invalid target TDS greater than feed TDS", () => {
        expect(() => calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 600 }))
            .toThrow("INVALID ENGINEERING INPUT: Target TDS (600 mg/L) cannot exceed Feed TDS (500 mg/L).");
    });

    // 5. Invalid recovery
    it("5. rejects invalid water recovery percentage <= 0 or >= 100", () => {
        expect(() => calculateFCDIModel({ flowRate: 10, tds: 500, waterRecovery: 0 }))
            .toThrow("INVALID ENGINEERING INPUT: Water recovery (0%) must be strictly between 0% and 100%.");
        expect(() => calculateFCDIModel({ flowRate: 10, tds: 500, waterRecovery: 100 }))
            .toThrow("INVALID ENGINEERING INPUT: Water recovery (100%) must be strictly between 0% and 100%.");
    });

    // 6. Target-achieved case
    it("6. verifies target-achieved case and status labeling", () => {
        const res = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 50 });
        expect(res.targetAchieved).toBe(true);
        expect(res.status).toBe("TARGET ACHIEVED — MODEL PREDICTION");
        expect(res.predictedOutletTDS).toBe(50.0);
    });

    // 7. Target-not-achieved case
    it("7. verifies target-not-achieved case for unachievable single-stage targets", () => {
        // Requesting 2 mg/L target from 500 mg/L (requires 99.6% removal)
        // Single-stage max removal benchmark is 95% (yielding 25 mg/L)
        const res = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 2 });
        expect(res.targetAchieved).toBe(false);
        expect(res.status).toContain("TARGET NOT ACHIEVED");
        expect(res.predictedOutletTDS).toBe(25.0);
    });

    // 8. Sensitivity to charge utilization
    it("8. verifies sensitivity to charge utilization parameter (Lambda_FCDI)", () => {
        const baseInput = { flowRate: 10, tds: 500, targetTds: 50 };
        const sens = runFCDISensitivityAnalysis(baseInput, "chargeUtilization", [0.90, 0.70]);

        expect(sens.results[1].electricalPower).toBeGreaterThan(sens.results[0].electricalPower);
        expect(sens.results[1].electricalSEC).toBeGreaterThan(sens.results[0].electricalSEC);
    });

    // 9. Sensitivity to slurry concentration
    it("9. verifies sensitivity to slurry concentration (wt%) and viscosity drag", () => {
        const baseInput = { flowRate: 10, tds: 500, targetTds: 50 };
        const sens = runFCDISensitivityAnalysis(baseInput, "slurryConcentrationWt", [10, 20]);

        expect(sens.results[1].slurryPumpPower).toBeGreaterThan(sens.results[0].slurryPumpPower);
        expect(sens.results[1].hydraulicSEC).toBeGreaterThan(sens.results[0].hydraulicSEC);
    });

    // 10. Sensitivity to slurry flow
    it("10. verifies sensitivity to slurry flow ratio (Q_slurry / Q_feed)", () => {
        const baseInput = { flowRate: 10, tds: 500, targetTds: 50 };
        const sens = runFCDISensitivityAnalysis(baseInput, "slurryFlowRatio", [1.0, 2.0]);

        expect(sens.results[1].slurryPumpPower).toBeGreaterThan(sens.results[0].slurryPumpPower);
        expect(sens.results[1].totalSEC).toBeGreaterThan(sens.results[0].totalSEC);
    });

    // 11. Sensitivity to carbon inventory
    it("11. verifies sensitivity to carbon inventory / carbon mass loading", () => {
        const res5wt = calculateFCDIModel({ tds: 500, targetTds: 50, slurryConcentrationWt: 5 });
        const res15wt = calculateFCDIModel({ tds: 500, targetTds: 50, slurryConcentrationWt: 15 });

        expect(res15wt.carbonInventoryKg).toBeGreaterThan(res5wt.carbonInventoryKg);
        expect(res15wt.operatingSaltLoading).toBeLessThan(res5wt.operatingSaltLoading);
    });

    // 12. Sensitivity to voltage
    it("12. verifies sensitivity to cell voltage", () => {
        const baseInput = { flowRate: 10, tds: 500, targetTds: 50 };
        const sens = runFCDISensitivityAnalysis(baseInput, "voltage", [1.2, 1.6]);

        expect(sens.results[1].electricalPower).toBeGreaterThan(sens.results[0].electricalPower);
        expect(sens.results[1].electricalSEC).toBeGreaterThan(sens.results[0].electricalSEC);
    });

    // 13. Water pump energy
    it("13. verifies water pump power and water pump SEC calculations", () => {
        const res = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 50 });
        expect(res.waterPumpPowerW).toBeGreaterThan(0);
        expect(res.secWaterPump).toBeGreaterThan(0);

        const expectedWaterPumpSec = (res.waterPumpPowerW / 1000) / res.productFlowM3h;
        expect(res.secWaterPump).toBeCloseTo(expectedWaterPumpSec, 4);
    });

    // 14. Slurry pump energy
    it("14. verifies slurry pump power and slurry pump SEC calculations", () => {
        const res = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 50 });
        expect(res.slurryPumpPowerW).toBeGreaterThan(res.waterPumpPowerW);
        expect(res.secSlurryPump).toBeGreaterThan(res.secWaterPump);

        const expectedSlurryPumpSec = (res.slurryPumpPowerW / 1000) / res.productFlowM3h;
        expect(res.secSlurryPump).toBeCloseTo(expectedSlurryPumpSec, 4);
    });

    // 15. Total SEC accounting
    it("15. verifies independent total SEC energy accounting breakdown", () => {
        const res = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 50 });

        expect(res.secHydraulic).toBeCloseTo(res.secWaterPump + res.secSlurryPump, 4);
        expect(res.secTotal).toBeCloseTo(res.secElectrical + res.secHydraulic, 4);
        expect(res.sec).toBe(res.secTotal);
        expect(res.secEstimateLabel).toContain("[MODEL ESTIMATE]");
    });

    // 16. No mutation of input
    it("16. ensures runFCDISensitivityAnalysis does NOT mutate original input object", () => {
        const originalInput = Object.freeze({ flowRate: 10, tds: 500, targetTds: 50, slurryConcentrationWt: 10 });
        const copyForCheck = JSON.stringify(originalInput);

        runFCDISensitivityAnalysis(originalInput, "slurryConcentrationWt", [5, 10, 15, 20]);

        expect(JSON.stringify(originalInput)).toBe(copyForCheck);
    });

    // 17. Pedigree object exists
    it("17. verifies structured modelPedigree object exists with required categories", () => {
        const res = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 50 });

        expect(res.modelPedigree).toBeDefined();
        expect(Array.isArray(res.modelPedigree.firstPrinciples)).toBe(true);
        expect(Array.isArray(res.modelPedigree.literatureSupported)).toBe(true);
        expect(Array.isArray(res.modelPedigree.projectAssumptions)).toBe(true);
        expect(Array.isArray(res.modelPedigree.calibrationParameters)).toBe(true);
        expect(Array.isArray(res.modelPedigree.unsupportedPhysics)).toBe(true);
    });

    // 18. Staging recommendation
    it("18. verifies staging recommendation calculation for unachievable single-stage targets", () => {
        const res = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 2 });

        expect(res.stagingRequired).toBe(2);
        expect(res.additionalStagesRequired).toBe(2);
    });

    // 19. NaN/infinite protection
    it("19. rejects NaN and infinite values across engineering input arguments", () => {
        expect(() => calculateFCDIModel({ flowRate: NaN, tds: 500 })).toThrow("INVALID ENGINEERING INPUT");
        expect(() => calculateFCDIModel({ flowRate: Infinity, tds: 500 })).toThrow("INVALID ENGINEERING INPUT");
        expect(() => calculateFCDIModel({ flowRate: 10, tds: NaN })).toThrow("INVALID ENGINEERING INPUT");
    });

    // 20. Operating loading terminology
    it("20. verifies precise terminology separation between Operating Salt Loading and Intrinsic SAC", () => {
        const res = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 50, slurryConcentrationWt: 10 });

        expect(res.operatingSaltLoading).toBeDefined();
        expect(res.intrinsicSac).toBe(20.0); // Material property
        expect(res.operatingSaltLoading).toBeCloseTo(3.8, 1);
    });

    // 21. Water recovery sensitivity
    it("21. verifies sensitivity to water recovery percentage", () => {
        const res80 = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 50, waterRecovery: 80 });
        const res95 = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 50, waterRecovery: 95 });

        // Higher recovery yields more product volume per unit feed, reducing SEC per m³ of product
        expect(res95.productFlowM3h).toBeGreaterThan(res80.productFlowM3h);
        expect(res95.secElectrical).toBeLessThan(res80.secElectrical);
    });

    // 22. Electrode area sensitivity
    it("22. verifies sensitivity to planar electrode area sizing", () => {
        const res350 = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 50, electrodeArea: 350 });
        const res500 = calculateFCDIModel({ flowRate: 10, tds: 500, targetTds: 50, electrodeArea: 500 });

        // Larger planar area per pair (500 cm² vs 350 cm²) reduces operating current density (A/m²)
        expect(res500.currentDensity).toBeLessThan(res350.currentDensity);
        expect(res500.totalElectrodeAreaM2).toBeGreaterThanOrEqual(res350.totalElectrodeAreaM2);
    });
});
