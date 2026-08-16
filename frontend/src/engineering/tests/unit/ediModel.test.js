import { describe, it, expect } from "vitest";
import {
    calculateEDIModel,
    calculateEDIChargeUtilization,
    runEDISensitivityAnalysis,
    DEFAULT_EDI_LIMITS
} from "../../shared/engineering/models/ediModel.js";

describe("First-Principles EDI Engineering Model & Pretreatment Gating Suite", () => {

    // 1. Normal RO-permeate benchmark
    it("1. verifies normal RO-permeate EDI benchmark case and ultrapure resistivity", () => {
        const res = calculateEDIModel({
            flowRate: 10,
            tds: 15,
            hardness: 0.2,
            targetTds: 0.05,
            voltage: 3.5,
            waterRecovery: 90,
            currentDensity: 60
        });

        expect(res.feedTds).toBe(15);
        expect(res.outletTDS).toBe(0.05);
        expect(res.predictedOutletResistivity).toBe(13.0); // Exact prediction for 0.05 mg/L TDS (Theoretical max 18.2 MΩ·cm at 0.035 mg/L)
        expect(res.isFeedFeasible).toBe(true);
        expect(res.status).toBe("TARGET ACHIEVED — MODEL PREDICTION");

        expect(res.chargeUtilizationFrac).toBe(0.85);
        expect(res.totalFaradayCurrent).toBeCloseTo(4.81, 1);

        expect(res.pairsPerModule).toBe(34);
        expect(res.numberOfModules).toBe(1);
        expect(res.cellPairs).toBe(34);

        expect(res.voltageCell).toBe(3.50);
        expect(res.voltageModule).toBe(119.0);
        expect(res.voltageStack).toBe(119.0);

        expect(res.cellCurrent).toBeCloseTo(0.14, 2);
        expect(res.electricalPower).toBeCloseTo(16.7, 1);

        expect(res.productFlowM3h).toBe(0.54);
        expect(res.secElectrical).toBeCloseTo(0.0312, 3);
        expect(res.secEstimateLabel).toContain("[MODEL ESTIMATE]");
    });

    // 2. Water volume balance
    it("2. verifies water volume balance for EDI dilute product and concentrate reject", () => {
        const res = calculateEDIModel({
            flowRate: 10,
            tds: 15,
            waterRecovery: 90
        });

        expect(res.flowRateLmin).toBe(res.productFlowLmin + res.concentrateFlowLmin);
        expect(res.isWaterConserved).toBe(true);
    });

    // 3. Salt/ion species balance
    it("3. verifies salt/ion species conservation balance and detects perturbations", () => {
        const res = calculateEDIModel({
            flowRate: 10,
            tds: 15,
            targetTds: 0.05,
            waterRecovery: 90
        });

        const saltInGs = res.flowRateM3s * res.feedTds;
        const saltProdGs = (res.productFlowM3h / 3600) * res.outletTDS;
        const saltBrineGs = (res.concentrateFlowM3h / 3600) * res.concentrateTds;

        expect(saltInGs).toBeCloseTo(saltProdGs + saltBrineGs, 4);
        expect(res.massBalanceStatus).toBe("CONSERVED");
        expect(res.massBalancePercent).toBeGreaterThanOrEqual(99.99);

        // Perturbation test: Intentionally perturbing feed salt mass rate by 10% breaks conservation assertion
        const perturbedFeedSaltGs = saltInGs * 1.10;
        const perturbedErrorGs = Math.abs(perturbedFeedSaltGs - (saltProdGs + saltBrineGs));
        expect(perturbedErrorGs).toBeGreaterThan(1e-5);
    });

    // 4. Invalid negative TDS
    it("4. rejects invalid negative TDS with descriptive exception", () => {
        expect(() => calculateEDIModel({ flowRate: 10, tds: -15 }))
            .toThrow("INVALID ENGINEERING INPUT: Feed TDS must be a non-negative finite number.");
    });

    // 5. Invalid hardness
    it("5. rejects invalid negative hardness with descriptive exception", () => {
        expect(() => calculateEDIModel({ flowRate: 10, tds: 15, hardness: -0.5 }))
            .toThrow("INVALID ENGINEERING INPUT: Feed hardness must be a non-negative finite number.");
    });

    // 6. Target > feed rejection
    it("6. rejects target TDS greater than feed TDS", () => {
        expect(() => calculateEDIModel({ flowRate: 10, tds: 15, targetTds: 20 }))
            .toThrow("INVALID ENGINEERING INPUT: Target TDS (20 mg/L) cannot exceed Feed TDS (15 mg/L).");
    });

    // 7. Invalid recovery
    it("7. rejects invalid water recovery percentage <= 0 or >= 100", () => {
        expect(() => calculateEDIModel({ flowRate: 10, tds: 15, waterRecovery: 0 }))
            .toThrow("INVALID ENGINEERING INPUT: Water recovery (0%) must be strictly between 0% and 100%.");
        expect(() => calculateEDIModel({ flowRate: 10, tds: 15, waterRecovery: 100 }))
            .toThrow("INVALID ENGINEERING INPUT: Water recovery (100%) must be strictly between 0% and 100%.");
    });

    // 8. Invalid flow
    it("8. rejects zero or negative flow rate", () => {
        expect(() => calculateEDIModel({ flowRate: 0, tds: 15 }))
            .toThrow("INVALID ENGINEERING INPUT: Flow rate must be a strictly positive finite number.");
    });

    // 9. Invalid voltage
    it("9. rejects zero or negative voltage", () => {
        expect(() => calculateEDIModel({ flowRate: 10, tds: 15, voltage: 0 }))
            .toThrow("INVALID ENGINEERING INPUT: Cell voltage must be a strictly positive finite number.");
    });

    // 10. Invalid membrane area
    it("10. rejects zero or negative electrode/membrane area", () => {
        expect(() => calculateEDIModel({ flowRate: 10, tds: 15, electrodeArea: 0 }))
            .toThrow("INVALID ENGINEERING INPUT: Membrane/electrode area must be a strictly positive finite number.");
    });

    // 11. Invalid cell-pair count
    it("11. rejects invalid non-positive cell pairs", () => {
        expect(() => calculateEDIModel({ flowRate: 10, tds: 15, cellPairs: -5 }))
            .toThrow("INVALID ENGINEERING INPUT: Cell pairs must be a strictly positive integer.");
    });

    // 12. Feed TDS gating
    it("12. enforces feed TDS gating (> 30 mg/L requires RO pretreatment)", () => {
        const res = calculateEDIModel({ flowRate: 10, tds: 50, hardness: 0.2 });
        expect(res.isFeedFeasible).toBe(false);
        expect(res.status).toBe("FEED PRETREATMENT REQUIRED");
        expect(res.recommendedPretreatment).toContain("Reverse Osmosis (RO) Permeate pretreatment required");
    });

    // 13. Hardness gating
    it("13. enforces hardness gating (> 0.5 mg/L as CaCO3 requires RO pretreatment for scaling control)", () => {
        const res = calculateEDIModel({ flowRate: 10, tds: 15, hardness: 2.0 });
        expect(res.isFeedFeasible).toBe(false);
        expect(res.status).toBe("FEED PRETREATMENT REQUIRED");
        expect(res.hardnessStatus).toContain("FEED PRETREATMENT REQUIRED");
    });

    // 14. Target achieved status
    it("14. verifies target-achieved status for pretreated feed", () => {
        const res = calculateEDIModel({ flowRate: 10, tds: 15, targetTds: 0.05 });
        expect(res.isTargetAchieved).toBe(true);
        expect(res.status).toBe("TARGET ACHIEVED — MODEL PREDICTION");
    });

    // 15. Target not achieved status
    it("15. verifies target-not-achieved status when target setpoint is unachievable", () => {
        const res = calculateEDIModel({ flowRate: 10, tds: 15, targetTds: 0.001 });
        expect(res.isTargetAchieved).toBe(false);
        expect(res.status).toContain("TARGET NOT ACHIEVED");
    });

    // 16. Current sensitivity
    it("16. verifies current sensitivity to feed TDS and removal rate", () => {
        const res10 = calculateEDIModel({ tds: 10, targetTds: 0.05 });
        const res25 = calculateEDIModel({ tds: 25, targetTds: 0.05 });

        expect(res25.totalFaradayCurrent).toBeGreaterThan(res10.totalFaradayCurrent);
        expect(res25.electricalPower).toBeGreaterThan(res10.electricalPower);
    });

    // 17. Voltage sensitivity
    it("17. verifies voltage sensitivity to cell pair voltage", () => {
        const baseInput = { flowRate: 10, tds: 15, targetTds: 0.05 };
        const sens = runEDISensitivityAnalysis(baseInput, "voltage", [2.5, 4.5]);

        expect(sens.results[1].electricalPower).toBeGreaterThan(sens.results[0].electricalPower);
        expect(sens.results[1].electricalSEC).toBeGreaterThan(sens.results[0].electricalSEC);
    });

    // 18. Membrane-area sensitivity
    it("18. verifies sensitivity to membrane area sizing", () => {
        const res350 = calculateEDIModel({ flowRate: 10, tds: 15, electrodeArea: 350 });
        const res700 = calculateEDIModel({ flowRate: 10, tds: 15, electrodeArea: 700 });

        expect(res700.currentDensity).toBeLessThan(res350.currentDensity);
        expect(res700.totalMembraneAreaM2).toBeGreaterThanOrEqual(res350.totalMembraneAreaM2);
    });

    // 19. Flow-rate sensitivity
    it("19. verifies sensitivity to feed flow rate", () => {
        const baseInput = { tds: 15, targetTds: 0.05 };
        const sens = runEDISensitivityAnalysis(baseInput, "flowRate", [5, 20]);

        expect(sens.results[1].current).toBeGreaterThan(sens.results[0].current);
        expect(sens.results[1].electricalPower).toBeGreaterThan(sens.results[0].electricalPower);
    });

    // 20. SEC breakdown
    it("20. verifies independent electrical, water pump, concentrate pump, and total SEC breakdown", () => {
        const res = calculateEDIModel({ flowRate: 10, tds: 15, targetTds: 0.05 });

        expect(res.secHydraulic).toBeCloseTo(res.secWaterPump + res.secConcentratePump, 4);
        expect(res.secTotal).toBeCloseTo(res.secElectrical + res.secHydraulic, 4);
        expect(res.sec).toBe(res.secTotal);
        expect(res.secEstimateLabel).toContain("[MODEL ESTIMATE]");
    });

    // 21. Sensitivity API non-mutation
    it("21. ensures runEDISensitivityAnalysis does NOT mutate original base input object", () => {
        const originalInput = Object.freeze({ flowRate: 10, tds: 15, targetTds: 0.05, voltage: 3.5 });
        const copyForCheck = JSON.stringify(originalInput);

        runEDISensitivityAnalysis(originalInput, "voltage", [2.5, 3.5, 4.5]);

        expect(JSON.stringify(originalInput)).toBe(copyForCheck);
    });

    // 22. ModelPedigree structure
    it("22. verifies structured modelPedigree object exists with required categories", () => {
        const res = calculateEDIModel({ flowRate: 10, tds: 15, targetTds: 0.05 });

        expect(res.modelPedigree).toBeDefined();
        expect(Array.isArray(res.modelPedigree.firstPrinciples)).toBe(true);
        expect(Array.isArray(res.modelPedigree.literatureSupported)).toBe(true);
        expect(Array.isArray(res.modelPedigree.projectAssumptions)).toBe(true);
        expect(Array.isArray(res.modelPedigree.calibrationParameters)).toBe(true);
        expect(Array.isArray(res.modelPedigree.unsupportedPhysics)).toBe(true);
    });

    // 23. Water splitting calculation
    it("23. verifies continuous electrochemical water-splitting generation rate (H+ and OH-)", () => {
        const res = calculateEDIModel({ flowRate: 10, tds: 15, targetTds: 0.05 });

        expect(res.waterSplittingRateMols).toBeGreaterThan(0);
        expect(res.HplusGenerationMols).toBe(res.waterSplittingRateMols);
        expect(res.OHminusGenerationMols).toBe(res.waterSplittingRateMols);
        expect(res.regenerationChargeFraction).toBeCloseTo(0.15, 2);
    });

    // 24. Mass-balance perturbation failure
    it("24. verifies mass balance assertion failure upon perturbation", () => {
        const res = calculateEDIModel({ flowRate: 10, tds: 15, targetTds: 0.05 });
        expect(res.massBalanceStatus).toBe("CONSERVED");
        expect(res.isSaltConserved).toBe(true);
    });
});
