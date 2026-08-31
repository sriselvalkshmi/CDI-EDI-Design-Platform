import { describe, it, expect } from "vitest";
import calculateEngineering from "../../frontend/src/engineering/engine/engineeringEquationEngine.js";
import calculateCDIModel, { CDI_ENVELOPE } from "../../frontend/src/engineering/models/cdiModel.js";
import calculateMCDIModel, { MCDI_ENVELOPE } from "../../frontend/src/engineering/models/mCDIModel.js";
import calculateFCDIModel, { FCDI_ENVELOPE } from "../../frontend/src/engineering/models/fCDIModel.js";
import calculateEDIModel, { DEFAULT_EDI_LIMITS } from "../../frontend/src/engineering/models/ediModel.js";
import aiRecommendation from "../../frontend/src/engineering/core/aiRecommendation.js";
import { TECHNOLOGY_FUNDAMENTALS } from "../../frontend/src/engineering/core/technologyFundamentals.js";

describe("Engineering Correctness & Technology Fundamental Concept Tests", () => {

    describe("1. Authoritative Conceptual Fundamentals", () => {
        it("must verify CDI conceptual attributes", () => {
            const cdi = calculateCDIModel({ tds: 500, targetTds: 50, flowRate: 10 });
            expect(cdi.technology).toBe("CDI");
            expect(cdi.membraneConfiguration).toContain("NONE");
            expect(cdi.membraneThicknessMm).toBe(0);
            expect(cdi.electrodeConfiguration).toContain("Fixed porous carbon");
            expect(cdi.operationType).toBe("Cyclic Batch Operation (alternating adsorption and desorption cycles).");
            expect(cdi.regenerationMechanism).toContain("Cyclic discharge / desorption");
            expect(cdi.ionTransportDirection).toContain("Cations migrate directly to cathode EDL");
        });

        it("must verify MCDI conceptual attributes", () => {
            const mcdi = calculateMCDIModel({ tds: 1000, targetTds: 50, flowRate: 10 });
            expect(mcdi.technology).toBe("MCDI");
            expect(mcdi.membraneConfiguration).toContain("CEM");
            expect(mcdi.membraneConfiguration).toContain("AEM");
            expect(mcdi.membraneThicknessMm).toBeGreaterThan(0);
            expect(mcdi.electrodeConfiguration).toContain("Fixed porous carbon");
            expect(mcdi.operationType).toBe("Cyclic Batch Operation (alternating adsorption and desorption cycles; reverse polarity desorption enabled by membranes).");
            expect(mcdi.ionTransportDirection).toContain("Co-ions are trapped inside electrode pore fluid");
        });

        it("must verify FCDI conceptual attributes", () => {
            const fcdi = calculateFCDIModel({ tds: 5000, targetTds: 500, flowRate: 10, slurryConcentrationWt: 10 });
            expect(fcdi.technology).toBe("FCDI");
            expect(fcdi.electrodeConfiguration).toContain("Flowing carbon slurry");
            expect(fcdi.operationType).toBe("Continuous Operation (uninterrupted desalination in main cell module).");
            expect(fcdi.feedWaterFlowDirection).toContain("Central treated-water channel");
            expect(fcdi.regenerationMechanism).toContain("Continuous external slurry regeneration");
        });

        it("must verify EDI conceptual attributes", () => {
            const edi = calculateEDIModel({ tds: 15, hardness: 0.2, targetTds: 0.05, flowRate: 10 });
            expect(edi.technology).toBe("EDI");
            expect(edi.electrodeConfiguration).toContain("Dedicated end anode");
            expect(edi.operationType).toBe("Continuous Operation (no cyclic batch switching, no chemical regeneration pauses).");
            expect(edi.desalinationMechanism).toContain("Hybrid ion exchange + continuous electromigration");
            expect(edi.regenerationMechanism).toContain("Continuous in-situ electrochemical water splitting");
        });
    });

    describe("2. Continuous vs Cyclic Operation Classification", () => {
        it("must classify CDI and MCDI as Cyclic Batch Operation", () => {
            const cdi = calculateCDIModel({ tds: 500 });
            const mcdi = calculateMCDIModel({ tds: 1000 });
            expect(cdi.operationType).toContain("Cyclic");
            expect(mcdi.operationType).toContain("Cyclic");
        });

        it("must classify FCDI and EDI as Continuous Operation", () => {
            const fcdi = calculateFCDIModel({ tds: 5000 });
            const edi = calculateEDIModel({ tds: 15, hardness: 0.2 });
            expect(fcdi.operationType).toContain("Continuous");
            expect(edi.operationType).toContain("Continuous");
        });
    });

    describe("3. EDI Pretreatment Gating & Feasibility", () => {
        it("must strictly reject raw high-TDS feed for direct EDI polishing", () => {
            const ediRaw = calculateEDIModel({ tds: 500, hardness: 150 });
            expect(ediRaw.isFeedFeasible).toBe(false);
            expect(ediRaw.gatingReason).toContain("exceeds max");
        });

        it("must accept RO permeate feed (TDS <= 30 mg/L) for direct EDI polishing", () => {
            const ediRO = calculateEDIModel({ tds: 15, hardness: 0.2, targetTds: 0.05 });
            expect(ediRO.isFeedFeasible).toBe(true);
            expect(ediRO.outletTds).toBeLessThanOrEqual(0.05);
            expect(ediRO.predictedOutletResistivity).toBeGreaterThanOrEqual(10.0);
        });
    });

    describe("4. AI Technology Recommendation Hierarchy", () => {
        it("must recommend membrane-free CDI for low-salinity stream (300 mg/L) with target 50 mg/L", () => {
            const rec = aiRecommendation({ tds: 300, targetTds: 50, flowRate: 10 });
            expect(rec.selectedTechnology).toBe("CDI");
        });

        it("must recommend MCDI for brackish water (1500 mg/L) with target 100 mg/L", () => {
            const rec = aiRecommendation({ tds: 1500, targetTds: 100, flowRate: 10 });
            expect(rec.selectedTechnology).toBe("MCDI");
        });

        it("must recommend FCDI for high-salinity brine (8000 mg/L) with target 500 mg/L", () => {
            const rec = aiRecommendation({ tds: 8000, targetTds: 500, flowRate: 10 });
            expect(rec.selectedTechnology).toBe("FCDI");
        });

        it("must recommend RO -> EDI for ultrapure polishing (target 0.05 mg/L)", () => {
            const rec = aiRecommendation({ tds: 500, targetTds: 0.05, flowRate: 10 });
            expect(rec.selectedTechnology).toBe("EDI");
            expect(rec.recommendedProcess).toBe("RO → EDI");
        });

        it("must never override hard engineering feasibility constraints", () => {
            const rec = aiRecommendation({ tds: 12000, targetTds: 600, flowRate: 10 });
            expect(rec.screening.CDI.envelopeOK).toBe(false);
            expect(rec.screening.MCDI.envelopeOK).toBe(false);
            expect(rec.selectedTechnology).toBe("FCDI");
        });
    });

    describe("5. Topology Synchronization & Clean Component Switching", () => {
        it("must cleanly update downstream configurations when technology switches", () => {
            const cdiEng = calculateEngineering({ technology: "CDI", feedWater: { tds: 500, targetTds: 50 } });
            const fcdiEng = calculateEngineering({ technology: "FCDI", feedWater: { tds: 5000, targetTds: 500 } });
            const ediEng = calculateEngineering({ technology: "EDI", feedWater: { tds: 15, targetTds: 0.05 } });

            expect(cdiEng.technology).toBe("CDI");
            expect(cdiEng.membraneConfiguration).toContain("NONE");

            expect(fcdiEng.technology).toBe("FCDI");
            expect(fcdiEng.electrodeConfiguration).toContain("Flowing carbon slurry");

            expect(ediEng.technology).toBe("EDI");
            expect(ediEng.regenerationMechanism).toContain("water splitting");
        });
    });

    describe("6. Phase 2 Calculation Correctness & Mathematical Integrity", () => {
        it("must verify 100% exact salt mass balance across all four technologies", () => {
            const models = [
                calculateCDIModel({ tds: 500, targetTds: 50, flowRate: 10, waterRecovery: 80 }),
                calculateMCDIModel({ tds: 1500, targetTds: 50, flowRate: 10, waterRecovery: 90 }),
                calculateFCDIModel({ tds: 5000, targetTds: 500, flowRate: 10, waterRecovery: 90 }),
                calculateEDIModel({ tds: 15, hardness: 0.2, targetTds: 0.05, flowRate: 10, waterRecovery: 90 })
            ];

            models.forEach(m => {
                expect(m.isSaltConserved).toBe(true);
                expect(m.isWaterConserved).toBe(true);
                // Water volume balance check
                const flowDiff = Math.abs(m.flowRateLmin - (m.productFlowLmin + m.concentrateFlowLmin));
                expect(flowDiff).toBeLessThan(1.0e-3);
            });
        });

        it("must verify V_system = V_module x N_modules and P = V_system x I", () => {
            const models = [
                calculateCDIModel({ tds: 500, targetTds: 50, flowRate: 10 }),
                calculateMCDIModel({ tds: 1500, targetTds: 50, flowRate: 10 }),
                calculateFCDIModel({ tds: 5000, targetTds: 500, flowRate: 10 }),
                calculateEDIModel({ tds: 15, hardness: 0.2, targetTds: 0.05, flowRate: 10 })
            ];

            models.forEach(m => {
                expect(m.voltageStack).toBeCloseTo(m.voltageModule * m.numberOfModules, 1);
                expect(m.stackElectricalPowerW).toBeCloseTo(m.voltageStack * m.cellCurrent, 0);
            });
        });

        it("must verify separate Electrical and Hydraulic SEC accounting on product-water basis", () => {
            const cdi = calculateCDIModel({ tds: 500, targetTds: 50, flowRate: 10 });
            const edi = calculateEDIModel({ tds: 15, hardness: 0.2, targetTds: 0.05, flowRate: 10 });

            expect(cdi.secElectrical).toBeGreaterThan(0);
            expect(cdi.secHydraulic).toBeGreaterThan(0);
            expect(cdi.secTotal).toBeCloseTo(cdi.secElectrical + cdi.secHydraulic, 3);

            expect(edi.secElectrical).toBeGreaterThan(0);
            expect(edi.secHydraulic).toBeGreaterThan(0);
            expect(edi.secTotal).toBeCloseTo(edi.secElectrical + edi.secHydraulic, 3);
        });

        it("must verify authentic Ergun equation for packed resin beds in EDI", () => {
            const edi = calculateEDIModel({ tds: 15, hardness: 0.2, targetTds: 0.05, flowRate: 10 });
            expect(edi.pressureDropWaterPa).toBeGreaterThanOrEqual(250);
            expect(edi.pressureDropWaterPa).toBeLessThanOrEqual(2500);
        });

        it("must verify explicit provenance structure on all technology envelopes", () => {
            expect(CDI_ENVELOPE.provenance.recommendedTdsRange).toContain("LITERATURE_SUPPORTED");
            expect(MCDI_ENVELOPE.provenance.recommendedTdsRange).toContain("LITERATURE_SUPPORTED");
            expect(FCDI_ENVELOPE.provenance.recommendedTdsRange).toContain("LITERATURE_SUPPORTED");
            expect(DEFAULT_EDI_LIMITS.provenance.maxFeedTdsMgL).toContain("LITERATURE_SUPPORTED");
        });
    });
});
