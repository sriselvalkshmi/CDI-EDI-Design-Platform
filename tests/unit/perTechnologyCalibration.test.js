import { describe, it, expect } from "vitest";
import experimentalDataset from "../../shared/engineering/validation/experimentalData.json" with { type: "json" };
import { splitAndCalibrate } from "../../shared/engineering/validation/experimentalCalibration.js";
import calculateEngineering from "../../shared/engineering/engine/engineeringEquationEngine.js";

describe("Stage 2: Per-Technology Model Calibration & Multi-Parameter Validation Test Suite", () => {
    it("verifies per-technology benchmark metrics and multi-parameter scaling", () => {
        const res = splitAndCalibrate(0.8, experimentalDataset);

        expect(res.sampleSize).toBeGreaterThanOrEqual(12);
        expect(res.testMetrics.rmse).toBeLessThan(3.0);

        const techKeys = ["CDI", "MCDI", "FCDI", "EDI"];

        techKeys.forEach(tech => {
            const techMetrics = res.byTechnology[tech];
            expect(techMetrics.sampleSize).toBeGreaterThanOrEqual(3);
            expect(techMetrics.rmseTds).toBeLessThan(3.0);
            expect(techMetrics.betaTds).toBeGreaterThanOrEqual(0.8);
            expect(techMetrics.betaTds).toBeLessThanOrEqual(1.2);
        });

        // 1. Feed TDS Sensitivity Check (CDI: 300 ppm vs 800 ppm)
        const cdiLow = calculateEngineering({ technology: "CDI", feedWater: { tds: 300, targetTds: 50, flowRate: 5 } });
        const cdiHigh = calculateEngineering({ technology: "CDI", feedWater: { tds: 800, targetTds: 120, flowRate: 15 } });
        expect(cdiHigh.outletTDS).toBeGreaterThan(cdiLow.outletTDS);

        // 2. Flow Rate Sensitivity & Module Sizing Check (MCDI: 5 L/min vs 50 L/min)
        const mcdiLowFlow = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50, flowRate: 5 } });
        const mcdiHighFlow = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50, flowRate: 50 } });
        expect(mcdiHighFlow.cellPairs).toBeGreaterThanOrEqual(mcdiLowFlow.cellPairs);
    });
});
