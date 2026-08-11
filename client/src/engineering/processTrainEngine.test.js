import { describe, it, expect } from "vitest";
import {
    calculateProcessTrain,
    validateProcessTrain,
    runProcessTrainSensitivityAnalysis,
    DEFAULT_ECONOMIC_ASSUMPTIONS
} from "./processTrainEngine.js";

describe("First-Principles Multi-Technology Process Train & Hybrid System Sizing Engine Suite", () => {

    // 1. RO -> EDI normal operation
    it("1. verifies RO -> EDI process train execution for high-TDS feed to ultrapure water", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }],
            targetTds: 0.05
        });

        expect(res.processTrainName).toBe("RO → EDI");
        expect(res.stageCount).toBe(2);
        expect(res.initialFeedTds).toBe(500);

        // Stage 1 RO reduces 500 -> 25 mg/L (95% rejection)
        expect(res.stages[0].predictedOutletTds).toBe(25);
        expect(res.stages[0].technology).toBe("RO");

        // Stage 2 EDI receives 50 mg/L product from Stage 1 and reduces to ultrapure quality
        expect(res.stages[1].technology).toBe("EDI");
        expect(res.stages[1].predictedOutletTds).toBeLessThanOrEqual(0.1);
        expect(res.finalTds).toBeLessThanOrEqual(0.1);

        expect(res.status).toBe("TARGET ACHIEVED — MODEL PREDICTION");
        expect(res.systemMassBalanceStatus).toBe("CONSERVED");
        expect(res.overallSEC).toBeGreaterThan(0);
    });

    // 2. CDI -> EDI operation
    it("2. verifies CDI -> EDI process train execution", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 200, hardness: 20 },
            stages: [{ technology: "CDI" }, { technology: "EDI" }],
            targetTds: 0.05
        });

        expect(res.processTrainName).toBe("CDI → EDI");
        expect(res.stageCount).toBe(2);
        expect(res.stages[0].technology).toBe("CDI");
        expect(res.stages[1].technology).toBe("EDI");
        expect(res.finalTds).toBeLessThan(10);
    });

    // 3. MCDI -> EDI operation
    it("3. verifies MCDI -> EDI process train execution", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 300, hardness: 30 },
            stages: [{ technology: "MCDI" }, { technology: "EDI" }],
            targetTds: 0.05
        });

        expect(res.processTrainName).toBe("MCDI → EDI");
        expect(res.stages[0].technology).toBe("MCDI");
        expect(res.stages[1].technology).toBe("EDI");
        expect(res.finalTds).toBeLessThan(5);
    });

    // 4. FCDI -> EDI operation
    it("4. verifies FCDI -> EDI process train execution for continuous slurry desalination", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 50 },
            stages: [{ technology: "FCDI" }, { technology: "EDI" }],
            targetTds: 0.05
        });

        expect(res.processTrainName).toBe("FCDI → EDI");
        expect(res.stages[0].technology).toBe("FCDI");
        expect(res.stages[1].technology).toBe("EDI");
        expect(res.finalTds).toBeLessThan(10);
    });

    // 5. Single-stage EDI operation
    it("5. verifies single-stage EDI process train execution for pretreated RO permeate", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 15, hardness: 0.2 },
            stages: [{ technology: "EDI" }],
            targetTds: 0.05
        });

        expect(res.processTrainName).toBe("EDI");
        expect(res.stageCount).toBe(1);
        expect(res.finalTds).toBe(0.05);
        expect(res.status).toBe("TARGET ACHIEVED — MODEL PREDICTION");
    });

    // 6. Invalid EDI direct feed warning
    it("6. flags EDI direct feed warning when raw feed exceeds limits without pretreatment", () => {
        const validation = validateProcessTrain(
            [{ technology: "EDI" }],
            { tds: 500, hardness: 150, flowRate: 10 }
        );

        expect(validation.warnings.length).toBeGreaterThan(0);
        expect(validation.warnings[0]).toContain("EDI Direct Feed Warning");
    });

    // 7. Stage-to-stage stream propagation
    it("7. verifies exact stage-to-stage product stream propagation kinetics", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        });

        const stage1Product = res.stages[0].productStream;
        const stage2Input = res.stages[1].inputStream;

        expect(stage2Input.flowRate).toBe(stage1Product.flowRate);
        expect(stage2Input.tds).toBe(stage1Product.tds);
        expect(stage2Input.hardness).toBe(stage1Product.hardness);
    });

    // 8. Final TDS calculation
    it("8. verifies final TDS calculation across process train", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        });

        expect(res.finalTds).toBe(res.stages[1].productStream.tds);
        expect(res.overallRemovalPercent).toBeGreaterThan(99.0);
    });

    // 9. Overall recovery calculation
    it("9. verifies overall recovery percentage calculation", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        });

        const expectedOverallRecovery = (res.overallProductFlowLmin / res.initialFlowRateLmin) * 100;
        expect(res.overallRecoveryPercent).toBeCloseTo(expectedOverallRecovery, 2);
    });

    // 10. Salt mass conservation
    it("10. verifies system-level salt mass conservation across all stages", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        });

        expect(res.systemMassBalanceStatus).toBe("CONSERVED");
        expect(res.systemMassBalancePercent).toBeGreaterThanOrEqual(99.9);
    });

    // 11. Water volume conservation
    it("11. verifies water volume conservation across multi-stage train", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        });

        const totalConcFlow = res.stages.reduce((sum, s) => sum + s.concentrateStream.flowRate, 0);
        expect(res.initialFlowRateLmin).toBeCloseTo(res.overallProductFlowLmin + totalConcFlow, 1);
    });

    // 12. Total energy aggregation
    it("12. verifies electrical, hydraulic, and total power aggregation across stages", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        });

        const expectedElecPower = res.stages[0].electricalPowerW + res.stages[1].electricalPowerW;
        const expectedHydPower = res.stages[0].hydraulicPowerW + res.stages[1].hydraulicPowerW;

        expect(res.totalElectricalPowerW).toBeCloseTo(expectedElecPower, 1);
        expect(res.totalHydraulicPowerW).toBeCloseTo(expectedHydPower, 1);
        expect(res.totalPowerW).toBeCloseTo(expectedElecPower + expectedHydPower, 1);
    });

    // 13. System SEC calculation
    it("13. verifies overall normalized SEC calculation based on final product volume", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        });

        const expectedSec = (res.totalPowerW / 1000) / res.overallProductFlowM3h;
        expect(res.overallSEC).toBeCloseTo(expectedSec, 3);
        expect(res.secEstimateLabel).toContain("[MODEL ESTIMATE]");
    });

    // 14. CAPEX estimate
    it("14. verifies CAPEX cost estimate framework calculation", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        });

        expect(res.estimatedCAPEX).toBeGreaterThan(0);
        expect(res.costEstimateLabel).toContain("ENGINEERING ESTIMATE");
    });

    // 15. OPEX estimate
    it("15. verifies OPEX cost estimate framework calculation (annual energy + maintenance)", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        });

        expect(res.estimatedAnnualEnergyCost).toBeGreaterThan(0);
        expect(res.estimatedAnnualMaintenanceCost).toBeGreaterThan(0);
        expect(res.estimatedAnnualOPEX).toBe(res.estimatedAnnualEnergyCost + res.estimatedAnnualMaintenanceCost);
    });

    // 16. Invalid negative TDS
    it("16. rejects invalid negative feed TDS", () => {
        expect(() => calculateProcessTrain({
            feed: { flowRate: 10, tds: -500 },
            stages: [{ technology: "RO" }]
        })).toThrow("INVALID ENGINEERING INPUT: Feed TDS must be a non-negative finite number.");
    });

    // 17. Invalid flow rate
    it("17. rejects zero or negative feed flow rate", () => {
        expect(() => calculateProcessTrain({
            feed: { flowRate: 0, tds: 500 },
            stages: [{ technology: "RO" }]
        })).toThrow("INVALID ENGINEERING INPUT: Feed flow rate must be a strictly positive finite number.");
    });

    // 18. Invalid recovery
    it("18. rejects unsupported technology name in stage configuration", () => {
        expect(() => calculateProcessTrain({
            feed: { flowRate: 10, tds: 500 },
            stages: [{ technology: "UNKNOWN_TECH" }]
        })).toThrow("unsupported technology");
    });

    // 19. NaN input rejection
    it("19. rejects NaN values across process train inputs", () => {
        expect(() => calculateProcessTrain({
            feed: { flowRate: NaN, tds: 500 },
            stages: [{ technology: "RO" }]
        })).toThrow("INVALID ENGINEERING INPUT");
    });

    // 20. Infinity input rejection
    it("20. rejects Infinite values across process train inputs", () => {
        expect(() => calculateProcessTrain({
            feed: { flowRate: Infinity, tds: 500 },
            stages: [{ technology: "RO" }]
        })).toThrow("INVALID ENGINEERING INPUT");
    });

    // 21. Target feasibility
    it("21. verifies target-achieved feasibility indicator for complete train", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }],
            targetTds: 0.05
        });

        expect(res.isTargetAchieved).toBe(true);
        expect(res.status).toBe("TARGET ACHIEVED — MODEL PREDICTION");
    });

    // 22. Multi-stage desalination
    it("22. verifies 3-stage hybrid desalination train (RO -> MCDI -> EDI)", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 1000, hardness: 200 },
            stages: [{ technology: "RO" }, { technology: "MCDI" }, { technology: "EDI" }],
            targetTds: 0.05
        });

        expect(res.stageCount).toBe(3);
        expect(res.processTrainName).toBe("RO → MCDI → EDI");
        expect(res.finalTds).toBeLessThanOrEqual(0.1);
    });

    // 23. Sensitivity analysis API
    it("23. verifies runProcessTrainSensitivityAnalysis across feed TDS range", () => {
        const baseInput = {
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        };

        const sens = runProcessTrainSensitivityAnalysis(baseInput, "feedTds", [200, 500, 1000]);

        expect(sens.results.length).toBe(3);
        expect(sens.results[2].totalPowerW).toBeGreaterThan(sens.results[0].totalPowerW);
    });

    // 24. Sensitivity API non-mutation
    it("24. ensures runProcessTrainSensitivityAnalysis does NOT mutate original baseInput object", () => {
        const originalInput = Object.freeze({
            feed: Object.freeze({ flowRate: 10, tds: 500, hardness: 150 }),
            stages: Object.freeze([{ technology: "RO" }, { technology: "EDI" }])
        });

        const copyCheck = JSON.stringify(originalInput);
        runProcessTrainSensitivityAnalysis(originalInput, "feedTds", [200, 500, 1000]);

        expect(JSON.stringify(originalInput)).toBe(copyCheck);
    });

    // 25. Pedigree structure
    it("25. verifies structured modelPedigree object exists with required categories including commercial assumptions", () => {
        const res = calculateProcessTrain({
            feed: { flowRate: 10, tds: 500, hardness: 150 },
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        });

        expect(res.modelPedigree).toBeDefined();
        expect(Array.isArray(res.modelPedigree.firstPrinciples)).toBe(true);
        expect(Array.isArray(res.modelPedigree.literatureSupported)).toBe(true);
        expect(Array.isArray(res.modelPedigree.projectAssumptions)).toBe(true);
        expect(Array.isArray(res.modelPedigree.calibrationParameters)).toBe(true);
        expect(Array.isArray(res.modelPedigree.commercialAssumptions)).toBe(true);
        expect(Array.isArray(res.modelPedigree.unsupportedPhysics)).toBe(true);
    });
});
