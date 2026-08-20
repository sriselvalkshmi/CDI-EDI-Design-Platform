import { describe, it, expect } from "vitest";
import calculateEngineering from "../../frontend/src/engineering/engine/engineeringEquationEngine.js";
import { calculateEDIModel } from "../../frontend/src/engineering/models/ediModel.js";
import { calculateCDIModel } from "../../frontend/src/engineering/models/cdiModel.js";
import { calculateMCDIModel } from "../../frontend/src/engineering/models/mCDIModel.js";
import { calculateFCDIModel } from "../../frontend/src/engineering/models/fCDIModel.js";

describe("Technology Screening & Boundary Transition Suite", () => {
    describe("1. EDI Feed TDS Boundary (Limit: <= 30.00 mg/L)", () => {
        it("TDS = 29.99 mg/L with low hardness (0.2 mg/L) passes direct feed gating", () => {
            const res = calculateEDIModel({ feedWater: { tds: 29.99, hardness: 0.2, targetTds: 1.0, flowRate: 10 } });
            expect(res.isFeedFeasible).toBe(true);
            expect(res.feedGatingStatus).toBe("PASSED");
            expect(res.processTrainName).toBe("EDI");
        });

        it("TDS = 30.00 mg/L with low hardness (0.2 mg/L) passes exactly at the boundary", () => {
            const res = calculateEDIModel({ feedWater: { tds: 30.00, hardness: 0.2, targetTds: 1.0, flowRate: 10 } });
            expect(res.isFeedFeasible).toBe(true);
            expect(res.feedGatingStatus).toBe("PASSED");
            expect(res.processTrainName).toBe("EDI");
        });

        it("TDS = 30.01 mg/L exceeds boundary and requires RO pretreatment", () => {
            const res = calculateEDIModel({ feedWater: { tds: 30.01, hardness: 0.2, targetTds: 1.0, flowRate: 10 } });
            expect(res.isFeedFeasible).toBe(false);
            expect(res.feedGatingStatus).toBe("FEED PRETREATMENT REQUIRED");
            expect(res.processTrainName).toBe("RO → EDI");
            expect(res.gatingReason).toContain("exceeds max EDI direct feed limit");
        });
    });

    describe("2. EDI Hardness Scaling Boundary (Limit: <= 0.50 mg/L as CaCO3)", () => {
        it("Hardness = 0.50 mg/L with TDS 20 mg/L passes direct feed gating", () => {
            const res = calculateEDIModel({ feedWater: { tds: 20, hardness: 0.50, targetTds: 1.0, flowRate: 10 } });
            expect(res.isFeedFeasible).toBe(true);
            expect(res.feedGatingStatus).toBe("PASSED");
        });

        it("Hardness = 0.51 mg/L triggers scaling hazard and requires pretreatment", () => {
            const res = calculateEDIModel({ feedWater: { tds: 20, hardness: 0.51, targetTds: 1.0, flowRate: 10 } });
            expect(res.isFeedFeasible).toBe(false);
            expect(res.feedGatingStatus).toBe("FEED PRETREATMENT REQUIRED");
            expect(res.gatingReason).toContain("exceeds EDI scaling-control limit");
        });

        it("Hardness = 10.0 mg/L (20x limit) triggers strong scaling warning and pretreatment", () => {
            const res = calculateEDIModel({ feedWater: { tds: 30, hardness: 10.0, targetTds: 2.0, flowRate: 20 } });
            expect(res.isFeedFeasible).toBe(false);
            expect(res.feedGatingStatus).toBe("FEED PRETREATMENT REQUIRED");
            expect(res.recommendedPretreatment).toContain("Reverse Osmosis (RO) Permeate");
        });
    });

    describe("3. Recovery Constraints & Technology Default Operating Points", () => {
        it("MCDI standard recovery achieves >= 95%", () => {
            const res = calculateMCDIModel({ feedWater: { tds: 500, targetTds: 50, flowRate: 10 } });
            expect(res.waterRecovery).toBeGreaterThanOrEqual(95.0);
        });

        it("EDI default water recovery is 90% (providing 10% reject sweep to avoid scaling)", () => {
            const res = calculateEDIModel({ feedWater: { tds: 15, hardness: 0.2, targetTds: 0.05, flowRate: 10 } });
            expect(res.waterRecovery).toBeCloseTo(90.0, 1);
        });

        it("Detects recovery shortfall when target is >= 95% and actual is 90%", () => {
            const ediRes = calculateEDIModel({ feedWater: { tds: 30, hardness: 0.2, targetTds: 2.0, flowRate: 20 } });
            const targetRecovery = 95.0;
            const isRecoverySatisfied = ediRes.waterRecovery >= targetRecovery;
            expect(isRecoverySatisfied).toBe(false);
            expect(ediRes.waterRecovery).toBe(90.0);
        });
    });

    describe("4. CDI 85% Removal Ceiling vs Target Capability", () => {
        it("CDI at feed TDS 30 mg/L hits 4.5 mg/L ceiling, failing a 2.0 mg/L target", () => {
            const cdiRes = calculateCDIModel({ feedWater: { tds: 30, targetTds: 2.0, flowRate: 20 } });
            expect(cdiRes.outletTds).toBeCloseTo(4.5, 1);
            expect(cdiRes.outletTds).toBeGreaterThan(2.0);
            expect(cdiRes.isTargetAchieved).toBe(false);
        });

        it("CDI at feed TDS 30 mg/L passes when target is 5.0 mg/L", () => {
            const cdiRes = calculateCDIModel({ feedWater: { tds: 30, targetTds: 5.0, flowRate: 20 } });
            expect(cdiRes.outletTds).toBeLessThanOrEqual(5.0);
            expect(cdiRes.isTargetAchieved).toBe(true);
        });
    });

    describe("5. User Screenshot Scenario Benchmark (Feed TDS = 30, Hardness = 10, Target = 2.0)", () => {
        const feedScreenshot = {
            tds: 30,
            hardness: 10,
            targetTds: 2.0,
            flowRate: 20,
            ph: 7.0,
            temperature: 25,
            pressure: 2.0
        };

        it("Evaluates all 4 technologies consistently with the user's audit", () => {
            const mcdi = calculateEngineering({ technology: "MCDI", feedWater: feedScreenshot });
            const cdi = calculateEngineering({ technology: "CDI", feedWater: feedScreenshot });
            const fcdi = calculateEngineering({ technology: "FCDI", feedWater: feedScreenshot });
            const edi = calculateEngineering({ technology: "EDI", feedWater: feedScreenshot });

            // MCDI: Product Target PASS (2.0 mg/L), Recovery >= 95%
            expect(mcdi.outletTDS).toBeLessThanOrEqual(2.0);
            expect(mcdi.waterRecovery).toBeGreaterThanOrEqual(95.0);

            // CDI: Capability FAIL (4.5 mg/L > 2.0 mg/L target)
            expect(cdi.outletTDS).toBeGreaterThan(2.0);
            expect(cdi.isTargetAchieved).toBe(false);

            // FCDI: Product Target PASS (2.0 mg/L)
            expect(fcdi.outletTDS).toBeLessThanOrEqual(2.0);

            // EDI: Product Target PASS (0.05 mg/L), but Pretreatment Required due to 10 mg/L Hardness
            expect(edi.outletTDS).toBeLessThanOrEqual(2.0);
            expect(edi.feedQualityFeasible).toBe(false);
            expect(edi.feedGatingStatus).toBe("FEED PRETREATMENT REQUIRED");
            expect(edi.waterRecovery).toBe(90.0);
        });
    });
});
