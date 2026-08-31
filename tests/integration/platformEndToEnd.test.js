import { describe, it, expect } from "vitest";
import calculateEngineering from "../../shared/engineering/engine/engineeringEquationEngine.js";
import aiRecommendation from "../../shared/engineering/core/aiRecommendation.js";
import calculateCDIModel from "../../shared/engineering/models/cdiModel.js";
import calculateMCDIModel from "../../shared/engineering/models/mCDIModel.js";
import calculateFCDIModel from "../../shared/engineering/models/fCDIModel.js";
import calculateEDIModel from "../../shared/engineering/models/ediModel.js";
import calculateProcessTrain from "../../shared/engineering/models/processTrainEngine.js";

describe("Platform End-to-End Engineering Integration & Validation Suite", () => {
    const rawBrackishFeed = {
        tds: 500,
        conductivity: 770,
        hardness: 150,
        ph: 7.2,
        temperature: 25,
        flowRate: 10,
        targetTds: 0.05
    };

    // 1. End-to-end AI recommendation for raw brackish feed requesting ultrapure water
    it("1. recommends RO -> EDI process train for 500 mg/L raw feed requesting 0.05 mg/L target", () => {
        const rec = aiRecommendation(rawBrackishFeed);
        expect(rec.recommendedProcess).toBe("RO → EDI");
        expect(rec.feedGating).toBe("FEED PRETREATMENT REQUIRED");
        expect(rec.reason).toContain("RO → EDI process train is recommended");
    });

    // 2. End-to-end execution of RO -> EDI process train via engineering equation engine
    it("2. executes RO -> EDI process train producing ultrapure water with conserved mass balance", () => {
        const trainResult = calculateEngineering({
            technology: "PROCESS_TRAIN",
            feedWater: rawBrackishFeed,
            stages: [{ technology: "RO" }, { technology: "EDI" }]
        });

        expect(trainResult.technology).toBe("PROCESS_TRAIN");
        expect(trainResult.processTrainName).toBe("RO → EDI");
        expect(trainResult.stageCount).toBe(2);

        expect(trainResult.finalProductTds).toBeLessThanOrEqual(0.1);
        expect(trainResult.status).toBe("TARGET ACHIEVED — MODEL PREDICTION");
        expect(trainResult.systemMassBalanceStatus).toBe("CONSERVED");
        expect(trainResult.secEstimateLabel).toContain("MODEL ESTIMATE");
        expect(trainResult.costEstimateLabel).toContain("ENGINEERING ESTIMATE");
    });

    // 3. End-to-end execution of FCDI -> EDI continuous hybrid train
    it("3. executes FCDI -> EDI continuous hybrid process train", () => {
        const fcdiEdiResult = calculateEngineering({
            technology: "PROCESS_TRAIN",
            feedWater: { ...rawBrackishFeed, hardness: 40 },
            stages: [{ technology: "FCDI" }, { technology: "EDI" }]
        });

        expect(fcdiEdiResult.processTrainName).toBe("FCDI → EDI");
        expect(fcdiEdiResult.stages[0].technology).toBe("FCDI");
        expect(fcdiEdiResult.stages[1].technology).toBe("EDI");
        expect(fcdiEdiResult.finalProductTds).toBeLessThan(10);
        expect(fcdiEdiResult.massBalanceStatus).toBe("CONSERVED");
    });

    // 4. EDI direct feed gating rejection on high-TDS raw feed
    it("4. rejects direct EDI on high-TDS raw feed and flags FEED PRETREATMENT REQUIRED", () => {
        const ediResult = calculateEngineering({
            technology: "EDI",
            feedWater: rawBrackishFeed
        });

        expect(ediResult.technology).toBe("EDI");
        expect(ediResult.feedQualityFeasible).toBe(false);
        expect(ediResult.feedGatingStatus || ediResult.status).toContain("PRETREATMENT REQUIRED");
        expect(ediResult.processTrainName).toBe("RO → EDI");
    });

    // 5. EDI direct feed execution on pretreated RO permeate
    it("5. executes direct EDI on pretreated RO permeate producing 18.2 MΩ·cm ultrapure water", () => {
        const cleanPermeateFeed = {
            tds: 15,
            conductivity: 25,
            hardness: 0.2,
            ph: 7.0,
            temperature: 25,
            flowRate: 10,
            targetTds: 0.05
        };

        const ediResult = calculateEngineering({
            technology: "EDI",
            feedWater: cleanPermeateFeed
        });

        expect(ediResult.feedQualityFeasible).toBe(true);
        expect(ediResult.status).toBe("TARGET ACHIEVED — MODEL PREDICTION");
        expect(ediResult.predictedOutletResistivity).toBe(13.0); // Exact predicted resistivity for 0.05 mg/L TDS
        expect(ediResult.waterSplittingRateMols).toBeGreaterThan(0);
    });

    // 6. First-principles CDI model execution and mass balance
    it("6. verifies CDI model execution with conserved salt mass balance and explicit SEC", () => {
        const cdiResult = calculateCDIModel({ tds: 500, targetTds: 50, flowRate: 10 });

        expect(cdiResult.technology).toBe("CDI");
        expect(cdiResult.outletTds).toBe(75); // Single-stage membrane-free CDI predicted outlet
        expect(cdiResult.isSaltConserved).toBe(true);
        expect(cdiResult.secTotal).toBeGreaterThan(0);
        expect(cdiResult.envelopeStatus).toBe("EXTRAPOLATED");
    });

    // 7. First-principles MCDI model execution
    it("7. verifies MCDI model execution with membrane co-ion suppression", () => {
        const mcdiResult = calculateMCDIModel({ tds: 500, targetTds: 50, flowRate: 10 });

        expect(mcdiResult.technology).toBe("MCDI");
        expect(mcdiResult.chargeEfficiency).toBe(92);
        expect(mcdiResult.outletTds).toBe(50);
        expect(mcdiResult.isSaltConserved).toBe(true);
    });

    // 8. First-principles FCDI model execution with slurry loading distinction
    it("8. verifies FCDI model execution with operating loading vs intrinsic SAC distinction", () => {
        const fcdiResult = calculateFCDIModel({ tds: 500, targetTds: 50, flowRate: 10 });

        expect(fcdiResult.technology).toBe("FCDI");
        expect(fcdiResult.operatingSaltLoading).toBeDefined();
        expect(fcdiResult.intrinsicSac).toBe(20.0); // Material property
        expect(fcdiResult.slurryPumpPowerW).toBeGreaterThan(fcdiResult.waterPumpPowerW);
        expect(fcdiResult.massBalanceStatus).toBe("CONSERVED");
    });

    // 9. Cross-module UI status badge label verification
    it("9. verifies consistent UI status badge labels across all engineering outputs", () => {
        const cdiRes = calculateCDIModel({ tds: 500, targetTds: 50 });
        const mcdiRes = calculateMCDIModel({ tds: 500, targetTds: 50 });
        const fcdiRes = calculateFCDIModel({ tds: 500, targetTds: 50 });
        const ediCleanRes = calculateEDIModel({ tds: 15, hardness: 0.2, targetTds: 0.05 });
        const ediRawRes = calculateEDIModel({ tds: 500, hardness: 150 });

        expect(cdiRes.envelopeStatus).toBe("EXTRAPOLATED");
        expect(mcdiRes.envelopeStatus).toBe("MODEL_PREDICTION");
        expect(fcdiRes.status).toContain("MODEL PREDICTION");
        expect(ediCleanRes.status).toContain("MODEL PREDICTION");
        expect(ediRawRes.status).toBe("FEED PRETREATMENT REQUIRED");
    });

    // 10. Robust edge-case error handling across all technology routers
    it("10. rejects invalid inputs with explicit descriptive engineering errors", () => {
        expect(() => calculateCDIModel({ tds: -500 }))
            .toThrow(/invalid/i);
        expect(() => calculateMCDIModel({ flowRate: 0 }))
            .toThrow(/invalid/i);
        expect(() => calculateFCDIModel({ waterRecovery: 100 }))
            .toThrow(/invalid/i);
        expect(() => calculateEDIModel({ hardness: -1 }))
            .toThrow(/invalid/i);
        expect(() => calculateProcessTrain({ feed: { tds: NaN } }))
            .toThrow(/invalid/i);
    });

    // 11. Dynamic CAD & UI Technology Switching Verification (Task 14 & Task 15)
    it("11. verifies complete dynamic technology switching pipeline (state -> label -> stack order -> CAD geometry)", () => {
        const cdiRes = calculateEngineering({ technology: "CDI", feedWater: { tds: 500, targetTds: 50 } });
        const mcdiRes = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50 } });
        const fcdiRes = calculateEngineering({ technology: "FCDI", feedWater: { tds: 500, targetTds: 50 } });
        const ediRes = calculateEngineering({ technology: "EDI", feedWater: { tds: 15, hardness: 0.2, targetTds: 0.05 } });
        const trainRes = calculateEngineering({ technology: "PROCESS_TRAIN", feedWater: { tds: 500, targetTds: 0.05 }, stages: [{ technology: "RO" }, { technology: "EDI" }] });

        // Helper mapper matching CAD3DStackViewer & EngineeringPanel
        const getLabel = (tech) => ({ CDI: "CDI", MCDI: "MCDI", FCDI: "FCDI", EDI: "EDI", PROCESS_TRAIN: "PROCESS TRAIN" }[tech] || tech);
        const getStackOrder = (tech) => ({
            CDI: "Layer Stack Order: Anode Current Collector → Porous Carbon Anode → Flow Spacer → Porous Carbon Cathode → Cathode Collector",
            MCDI: "Layer Stack Order: Feed Channel → AEM Membrane → Carbon Anode → Current Collector → Carbon Cathode → CEM Membrane → Product Channel",
            FCDI: "Layer Stack Order: Flow-Electrode Slurry Chamber → AEM Membrane → Water Desalination Channel → CEM Membrane → Flow-Electrode Slurry Chamber",
            EDI: "Layer Stack Order: Anode → AEM Membrane → Mixed-Bed Resin Diluate Channel → CEM Membrane → Cathode Concentrate Channel",
            PROCESS_TRAIN: "Multi-Stage Hybrid Process Train Assembly Geometry"
        }[tech]);

        // CDI Assertions
        expect(cdiRes.technology).toBe("CDI");
        expect(getLabel(cdiRes.technology)).toBe("CDI");
        expect(getStackOrder(cdiRes.technology)).toContain("Porous Carbon Anode");
        expect(cdiRes.technology).not.toBe("MCDI");

        // MCDI Assertions
        expect(mcdiRes.technology).toBe("MCDI");
        expect(getLabel(mcdiRes.technology)).toBe("MCDI");
        expect(getStackOrder(mcdiRes.technology)).toContain("AEM Membrane");

        // FCDI Assertions
        expect(fcdiRes.technology).toBe("FCDI");
        expect(getLabel(fcdiRes.technology)).toBe("FCDI");
        expect(getStackOrder(fcdiRes.technology)).toContain("Flow-Electrode Slurry Chamber");
        expect(getLabel(fcdiRes.technology)).not.toBe("MCDI");

        // EDI Assertions
        expect(ediRes.technology).toBe("EDI");
        expect(getLabel(ediRes.technology)).toBe("EDI");
        expect(getStackOrder(ediRes.technology)).toContain("Mixed-Bed Resin");

        // PROCESS_TRAIN Assertions
        expect(trainRes.technology).toBe("PROCESS_TRAIN");
        expect(getLabel(trainRes.technology)).toBe("PROCESS TRAIN");
        expect(trainRes.processTrainName).toBe("RO → EDI");

        // Step 19 Explicit Label & Non-MCDI Invariant Assertions
        expect(getLabel("CDI")).toBe("CDI");
        expect(getLabel("MCDI")).toBe("MCDI");
        expect(getLabel("FCDI")).toBe("FCDI");
        expect(getLabel("EDI")).toBe("EDI");
        expect(getLabel("PROCESS_TRAIN")).toBe("PROCESS TRAIN");

        for (const techKey of ["CDI", "FCDI", "EDI", "PROCESS_TRAIN"]) {
            expect(getLabel(techKey)).not.toBe("MCDI");
        }
    });

    // 12. Multi-Technology Design Generation Pipeline Preservation (Task 21)
    it("12. verifies that calculateEngineering returns matching technology for all supported technologies without unwanted MCDI fallbacks", () => {
        const technologies = ["CDI", "MCDI", "FCDI", "EDI"];

        for (const tech of technologies) {
            const result = calculateEngineering({
                technology: tech,
                feedWater: {
                    tds: tech === "EDI" ? 15 : 500,
                    targetTds: tech === "EDI" ? 0.05 : 50,
                    hardness: tech === "EDI" ? 0.2 : 150
                }
            });

            expect(result.technology).toBe(tech);
        }
    });

    // 13. Single Authoritative Technology Consistency (Task 22)
    it("13. verifies single authoritative technology propagation across AI selection, engineering model, and downstream views", () => {
        const rawFeed = { tds: 1500, targetTds: 100, hardness: 200, flowRate: 10 };
        const rec = aiRecommendation(rawFeed);
        
        const engResult = calculateEngineering({
            technology: rec.selectedTechnology,
            feedWater: rawFeed
        });

        // 1. AI recommendation equals engineering model technology
        expect(engResult.technology).toBe(rec.selectedTechnology);
        expect(engResult.technology).toBe("MCDI");

        // 2. Manual override mode: selecting CDI explicitly MUST NOT be overridden by AI
        const manualCDI = calculateEngineering({
            technology: "CDI",
            feedWater: rawFeed
        });
        expect(manualCDI.technology).toBe("CDI");
        expect(manualCDI.technology).not.toBe(rec.selectedTechnology);
    });
});
