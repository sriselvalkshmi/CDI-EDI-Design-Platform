import { describe, it, expect } from "vitest";
import calculateEngineering from "./engineeringEquationEngine.js";
import calculateCDIModel from "./cdiModel.js";
import calculateMCDIModel from "./mCDIModel.js";
import calculateFCDIModel from "./fCDIModel.js";
import calculateEDIModel from "./ediModel.js";
import aiRecommendation from "./aiRecommendation.js";

describe("Engineering Correctness & Technology Topology Regression Tests", () => {

    describe("1. CDI Architecture & Envelope Bounds", () => {
        it("must strictly enforce membrane-free configuration for CDI", () => {
            const cdi = calculateCDIModel({ tds: 500, targetTds: 50, flowRate: 10 });
            expect(cdi.technology).toBe("CDI");
            expect(cdi.membraneConfiguration).toContain("NONE");
            expect(cdi.membraneThicknessMm).toBe(0);
            expect(cdi.electrodeConfiguration).toContain("Fixed porous carbon");
            expect(cdi.regenerationMode).toContain("discharge");
        });

        it("must calculate non-Faradaic Donnan charge efficiency for CDI", () => {
            const cdi = calculateCDIModel({ tds: 500, targetTds: 50, voltage: 1.2 });
            expect(cdi.chargeEfficiencyFrac).toBeGreaterThanOrEqual(0.40);
            expect(cdi.chargeEfficiencyFrac).toBeLessThanOrEqual(0.85);
        });

        it("must enforce water and salt mass conservation", () => {
            const cdi = calculateCDIModel({ tds: 500, targetTds: 50, waterRecovery: 80 });
            const waterError = Math.abs(cdi.flowRateLmin - (cdi.productFlowLmin + cdi.concentrateFlowLmin));
            expect(waterError).toBeLessThan(1.0e-4);
        });
    });

    describe("2. MCDI Architecture & Envelope Bounds", () => {
        it("must explicitly include AEM and CEM membranes for MCDI", () => {
            const mcdi = calculateMCDIModel({ tds: 1000, targetTds: 50, flowRate: 10 });
            expect(mcdi.technology).toBe("MCDI");
            expect(mcdi.membraneConfiguration).toContain("AEM");
            expect(mcdi.membraneConfiguration).toContain("CEM");
            expect(mcdi.membraneThicknessMm).toBeGreaterThan(0);
            expect(mcdi.chargeEfficiencyFrac).toBeGreaterThanOrEqual(0.80);
        });

        it("must demonstrate higher charge efficiency than CDI at identical salinity", () => {
            const cdi = calculateCDIModel({ tds: 500, voltage: 1.2 });
            const mcdi = calculateMCDIModel({ tds: 500, voltage: 1.4 });
            expect(mcdi.chargeEfficiencyFrac).toBeGreaterThan(cdi.chargeEfficiencyFrac);
        });
    });

    describe("3. FCDI Architecture & Flow-Electrode Slurry System", () => {
        it("must present flowing carbon slurry micro-electrodes and slurry loops", () => {
            const fcdi = calculateFCDIModel({ tds: 5000, targetTds: 500, flowRate: 10, slurryConcentrationWt: 10 });
            expect(fcdi.technology).toBe("FCDI");
            expect(fcdi.electrodeConfiguration).toContain("Flowing carbon slurry");
            expect(fcdi.flowConfiguration).toContain("dual-loop");
            expect(fcdi.slurryConcentrationWt).toBe(10);
            expect(fcdi.regenerationMode).toContain("slurry");
        });

        it("must handle high-salinity feed water (>3,000 mg/L) without saturation limit", () => {
            const fcdiHigh = calculateFCDIModel({ tds: 10000, targetTds: 500, flowRate: 10 });
            expect(fcdiHigh.envelopeStatus).toBe("VALIDATED");
            expect(fcdiHigh.isTargetAchieved).toBe(true);
        });
    });

    describe("4. EDI Ultrapure Polishing & RO Feed Gating", () => {
        it("must strictly gate feed water quality for direct EDI feed", () => {
            // High TDS raw water feed (500 mg/L) -> EDI must reject direct feed and flag RO pretreatment requirement
            const ediRaw = calculateEDIModel({ tds: 500, hardness: 150, flowRate: 10 });
            expect(ediRaw.isFeedFeasible).toBe(false);
            expect(ediRaw.gatingReason).toContain("exceeds max limit");

            // Low TDS RO permeate feed (15 mg/L, hardness 0.2, target 0.05 mg/L) -> EDI direct feed passed
            const ediRoPermeate = calculateEDIModel({ tds: 15, hardness: 0.2, targetTds: 0.05, flowRate: 10 });
            expect(ediRoPermeate.isFeedFeasible).toBe(true);
            expect(ediRoPermeate.predictedOutletResistivity).toBeGreaterThanOrEqual(10.0);
            expect(ediRoPermeate.regenerationMode).toContain("water splitting");
        });
    });

    describe("5. Technology Selection Hierarchy", () => {
        it("must select membrane-free CDI for low salinity (300 mg/L) with target 50 mg/L", () => {
            const rec = aiRecommendation({ tds: 300, targetTds: 50, flowRate: 10 });
            expect(rec.selectedTechnology).toBe("CDI");
        });

        it("must select MCDI for brackish water (1500 mg/L) with target 50 mg/L", () => {
            const rec = aiRecommendation({ tds: 1500, targetTds: 50, flowRate: 10 });
            expect(rec.selectedTechnology).toBe("MCDI");
        });

        it("must select FCDI for high-salinity brine (8000 mg/L) with target 500 mg/L", () => {
            const rec = aiRecommendation({ tds: 8000, targetTds: 500, flowRate: 10 });
            expect(rec.selectedTechnology).toBe("FCDI");
        });

        it("must select RO -> EDI for ultrapure setpoint (0.05 mg/L)", () => {
            const rec = aiRecommendation({ tds: 500, targetTds: 0.05, flowRate: 10 });
            expect(rec.selectedTechnology).toBe("EDI");
            expect(rec.recommendedProcess).toBe("RO → EDI");
        });
    });

    describe("6. Topology Synchronization & Clean Component Switching", () => {
        it("must prove that changing selected technology cleanly updates all downstream parameters", () => {
            const cdiEng = calculateEngineering({ technology: "CDI", feedWater: { tds: 500, targetTds: 50 } });
            const fcdiEng = calculateEngineering({ technology: "FCDI", feedWater: { tds: 5000, targetTds: 500 } });
            const ediEng = calculateEngineering({ technology: "EDI", feedWater: { tds: 15, targetTds: 0.05 } });

            // CDI has no slurry and no resin
            expect(cdiEng.technology).toBe("CDI");
            expect(cdiEng.membraneConfiguration).toContain("NONE");
            expect(cdiEng.slurryConcentrationWt).toBeUndefined();
            expect(cdiEng.predictedOutletResistivity).toBeUndefined();

            // FCDI has slurry configuration
            expect(fcdiEng.technology).toBe("FCDI");
            expect(fcdiEng.electrodeConfiguration).toContain("Flowing carbon slurry");
            expect(fcdiEng.slurryConcentrationWt).toBe(10);

            // EDI has ultrapure resistivity and water splitting
            expect(ediEng.technology).toBe("EDI");
            expect(ediEng.predictedOutletResistivity).toBeDefined();
            expect(ediEng.regenerationMode).toContain("water splitting");
        });
    });
});
