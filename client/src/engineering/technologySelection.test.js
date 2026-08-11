import { describe, it, expect } from "vitest";
import calculateEngineering from "./engineeringEquationEngine.js";
import aiRecommendation, { selectBestTechnology } from "./aiRecommendation.js";

describe("Automated Technology Selection & Engineering Regression Test Suite", () => {
    const rawFeedWater = {
        tds: 500,
        conductivity: 300,
        hardness: 150,
        ph: 7.2,
        temperature: 25,
        flowRate: 10,
        targetTds: 10
    };

    it("evaluates CDI single-stage desalting and envelope checks", () => {
        const cdiRes = calculateEngineering({ technology: "CDI", feedWater: rawFeedWater });
        expect(cdiRes.technology).toBe("CDI");
        expect(cdiRes.outletTDS).toBeGreaterThanOrEqual(20);
        expect(cdiRes.outletTDS).toBeLessThanOrEqual(80);
        expect(cdiRes.isTargetAchieved).toBe(false);
        expect(cdiRes.feedQualityFeasible).toBe(true);
    });

    it("evaluates MCDI desalting performance", () => {
        const mcdiRes = calculateEngineering({ technology: "MCDI", feedWater: rawFeedWater });
        expect(mcdiRes.technology).toBe("MCDI");
        expect(mcdiRes.outletTDS).toBeGreaterThanOrEqual(20);
        expect(mcdiRes.outletTDS).toBeLessThanOrEqual(35);
        expect(mcdiRes.isTargetAchieved).toBe(false);
    });

    it("evaluates FCDI desalting performance", () => {
        const fcdiRes = calculateEngineering({ technology: "FCDI", feedWater: rawFeedWater });
        expect(fcdiRes.technology).toBe("FCDI");
        expect(fcdiRes.outletTDS).toBeLessThanOrEqual(27);
        expect(fcdiRes.isTargetAchieved).toBe(false);
    });

    it("evaluates EDI direct raw feed feasibility gating", () => {
        const ediRes = calculateEngineering({ technology: "EDI", feedWater: rawFeedWater });
        expect(ediRes.technology).toBe("EDI");
        expect(ediRes.outletTDS).toBeLessThanOrEqual(10);
        expect(ediRes.isTargetAchieved).toBe(true);
        expect(ediRes.feedQualityFeasible).toBe(false);
        expect(ediRes.processTrainName).toBe("RO → EDI");
    });

    it("evaluates Auto Mode technology selection", () => {
        const rec = aiRecommendation(rawFeedWater);
        expect(rec.selectedTechnology).toBe("MCDI");
    });

    it("evaluates Target Change responsiveness for MCDI", () => {
        const mcdi100 = calculateEngineering({ technology: "MCDI", feedWater: { ...rawFeedWater, targetTds: 100 } });
        expect(mcdi100.isTargetAchieved).toBe(true);

        const mcdi10 = calculateEngineering({ technology: "MCDI", feedWater: { ...rawFeedWater, targetTds: 10 } });
        expect(mcdi10.isTargetAchieved).toBe(false);

        const mcdi5 = calculateEngineering({ technology: "MCDI", feedWater: { ...rawFeedWater, targetTds: 5 } });
        expect(mcdi5.isTargetAchieved).toBe(false);
    });

    it("evaluates conditioned RO permeate feed for EDI", () => {
        const cleanFeed = {
            tds: 15,
            conductivity: 25,
            hardness: 0.2,
            ph: 7.0,
            temperature: 25,
            flowRate: 10,
            targetTds: 0.5
        };

        const ediClean = calculateEngineering({ technology: "EDI", feedWater: cleanFeed });
        expect(ediClean.feedQualityFeasible).toBe(true);
        expect(ediClean.processTrainName).toBe("EDI");
    });

    // Explicit Technology Selection Preservation Tests
    it("preserves explicit CDI selection", () => {
        const cdiResult = calculateEngineering({ technology: "CDI", feedWater: rawFeedWater });
        expect(cdiResult.technology).toBe("CDI");
    });

    it("preserves explicit MCDI selection", () => {
        const mcdiResult = calculateEngineering({ technology: "MCDI", feedWater: rawFeedWater });
        expect(mcdiResult.technology).toBe("MCDI");
    });

    it("preserves explicit FCDI selection", () => {
        const fcdiResult = calculateEngineering({ technology: "FCDI", feedWater: rawFeedWater });
        expect(fcdiResult.technology).toBe("FCDI");
    });

    it("preserves explicit EDI selection", () => {
        const ediResult = calculateEngineering({ technology: "EDI", feedWater: { tds: 15, hardness: 0.2, targetTds: 0.05 } });
        expect(ediResult.technology).toBe("EDI");
    });

    // Auto/AI Technology Screening Tests
    it("returns one of the supported technologies for AUTO, with reason, screening map, and input echo", () => {
        const rec = aiRecommendation(rawFeedWater);
        expect(["CDI", "MCDI", "FCDI", "EDI"]).toContain(rec.selectedTechnology);
        expect(rec.reason).toBeTruthy();
        expect(rec.screening).toBeDefined();
        expect(rec.screening.CDI).toBeDefined();
        expect(rec.screening.MCDI).toBeDefined();
        expect(rec.screening.FCDI).toBeDefined();
        expect(rec.screening.EDI).toBeDefined();
        expect(rec.input).toBeDefined();
        expect(rec.input.tds).toBe(500);
    });

    it("demonstrates dynamic technology selection screening across different feed compositions", () => {
        // Feed A: Low TDS (100 mg/L) -> CDI candidate
        const recA = aiRecommendation({ tds: 100, targetTds: 50, hardness: 30 });
        expect(recA.screening.CDI.targetAchievable).toBe(true);

        // Feed B: Brackish (500 mg/L) -> MCDI candidate
        const recB = aiRecommendation({ tds: 500, targetTds: 50, hardness: 150 });
        expect(recB.screening.MCDI.targetAchievable).toBe(true);

        // Feed C: High Salinity (5000 mg/L) -> FCDI strong candidate
        const recC = aiRecommendation({ tds: 5000, targetTds: 500, hardness: 500 });
        expect(recC.screening.FCDI).toBeDefined();
        expect(recC.screening.FCDI.score).toBeGreaterThan(0);

        // Feed D: Clean RO Permeate (10 mg/L) -> EDI candidate
        const recD = aiRecommendation({ tds: 10, targetTds: 0.05, hardness: 0.1 });
        expect(recD.screening.EDI.feasible).toBe(true);
        expect(recD.selectedTechnology).toBe("EDI");
    });

    // 5 Known Decision Benchmark Test Cases (Task 22)
    it("Case A: selects CDI for low-salinity stream (300 mg/L feed -> 100 mg/L target)", () => {
        const rec = aiRecommendation({ tds: 300, targetTds: 100, hardness: 50, flowRate: 10 });
        expect(rec.selectedTechnology).toBe("CDI");
        expect(rec.screening.CDI.feasible).toBe(true);
        expect(rec.screening.CDI.targetAchievable).toBe(true);
    });

    it("Case B: selects MCDI for brackish stream (1,500 mg/L feed -> 100 mg/L target)", () => {
        const rec = aiRecommendation({ tds: 1500, targetTds: 100, hardness: 200, flowRate: 10 });
        expect(rec.selectedTechnology).toBe("MCDI");
        expect(rec.screening.MCDI.feasible).toBe(true);
        expect(rec.screening.MCDI.targetAchievable).toBe(true);
    });

    it("Case C: selects FCDI for high-salinity stream (8,000 mg/L feed -> 500 mg/L target)", () => {
        const rec = aiRecommendation({ tds: 8000, targetTds: 500, hardness: 500, flowRate: 12 });
        expect(rec.selectedTechnology).toBe("FCDI");
        expect(rec.screening.FCDI.feasible).toBe(true);
        expect(rec.screening.FCDI.targetAchievable).toBe(true);
    });

    it("Case D: selects EDI for pretreated low-salinity polishing (20 mg/L feed -> 5 mg/L target)", () => {
        const rec = aiRecommendation({ tds: 20, targetTds: 0.1, hardness: 0.2, flowRate: 10 });
        expect(rec.selectedTechnology).toBe("EDI");
        expect(rec.screening.EDI.feasible).toBe(true);
        expect(rec.screening.EDI.targetAchievable).toBe(true);
    });

    it("Case E: selects MCDI for 500 mg/L feed requiring 90% removal to 50 mg/L target", () => {
        const rec = aiRecommendation({ tds: 500, targetTds: 50, hardness: 150, flowRate: 10 });
        expect(rec.selectedTechnology).toBe("MCDI");
        expect(rec.screening.MCDI.feasible).toBe(true);
        expect(rec.screening.MCDI.targetAchievable).toBe(true);
    });

    // Hard Feasibility Rule Verification Tests (Step 6)
    it("selection must equal highest scoring feasible technology", () => {
        const rec = aiRecommendation(rawFeedWater);
        const feasible = Object.entries(rec.screening)
            .filter(([, x]) => x.feasible)
            .sort((a, b) => b[1].score - a[1].score);

        expect(rec.selectedTechnology).toBe(feasible[0][0]);
    });

    it("infeasible technology can never be selected when feasible candidates exist", () => {
        const rec = aiRecommendation(rawFeedWater);
        expect(rec.screening[rec.selectedTechnology].feasible).toBe(true);
    });

    it("selectBestTechnology explicit decision function selects highest scoring feasible candidate", () => {
        const mockScreening = {
            CDI: { feasible: true, score: 70, reason: "Feasible" },
            MCDI: { feasible: true, score: 92, reason: "Highest feasible" },
            FCDI: { feasible: false, score: 98, reason: "Infeasible envelope" }
        };
        const best = selectBestTechnology(mockScreening);
        expect(best.technology).toBe("MCDI");
        expect(best.score).toBe(92);
    });

    // Literature Operating Envelope Boundary Transition Tests (Task 24)
    it("evaluates CDI literature validation boundary transitions (100–1,000 mg/L)", () => {
        expect(aiRecommendation({ tds: 99, targetTds: 50, flowRate: 10 }).screening.CDI.envelopeOK).toBe(false);
        expect(aiRecommendation({ tds: 100, targetTds: 50, flowRate: 10 }).screening.CDI.envelopeOK).toBe(true);
        expect(aiRecommendation({ tds: 1000, targetTds: 100, flowRate: 10 }).screening.CDI.envelopeOK).toBe(true);
        expect(aiRecommendation({ tds: 1001, targetTds: 100, flowRate: 10 }).screening.CDI.envelopeOK).toBe(false);
    });

    it("evaluates MCDI literature validation boundary transitions (500–3,000 mg/L)", () => {
        expect(aiRecommendation({ tds: 499, targetTds: 50, flowRate: 10 }).screening.MCDI.envelopeOK).toBe(false);
        expect(aiRecommendation({ tds: 500, targetTds: 50, flowRate: 10 }).screening.MCDI.envelopeOK).toBe(true);
        expect(aiRecommendation({ tds: 3000, targetTds: 200, flowRate: 10 }).screening.MCDI.envelopeOK).toBe(true);
        expect(aiRecommendation({ tds: 3001, targetTds: 200, flowRate: 10 }).screening.MCDI.envelopeOK).toBe(false);
    });

    it("evaluates FCDI literature validation boundary transitions (3,000–15,000 mg/L)", () => {
        expect(aiRecommendation({ tds: 2999, targetTds: 500, flowRate: 12 }).screening.FCDI.envelopeOK).toBe(false);
        expect(aiRecommendation({ tds: 3000, targetTds: 500, flowRate: 12 }).screening.FCDI.envelopeOK).toBe(true);
        expect(aiRecommendation({ tds: 15000, targetTds: 1000, flowRate: 12 }).screening.FCDI.envelopeOK).toBe(true);
        expect(aiRecommendation({ tds: 15001, targetTds: 1000, flowRate: 12 }).screening.FCDI.envelopeOK).toBe(false);
    });
});
