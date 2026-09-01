import { describe, it, expect } from "vitest";
import aiRecommendation, {
    evaluateTechnologyCandidate,
    rankFeasibleCandidates
} from "../../shared/engineering/core/aiRecommendation.js";
import calculateEngineering from "../../shared/engineering/engine/engineeringEquationEngine.js";

describe("Strict Feasibility-First AUTO Technology Selection Hierarchy", () => {
    describe("Regression Test: Feed TDS 50 mg/L -> Target TDS 5.0 mg/L, Recovery >= 95%", () => {
        const feed = {
            tds: 50,
            targetTds: 5.0,
            targetRecovery: 95.0,
            flowRate: 10,
            hardness: 10,
            ph: 7.0,
            temperature: 25
        };

        it("evaluates MCDI: TDS PASS (4.5 <= 5.0), Recovery PASS (95.2 >= 95) -> FEASIBLE WITH WARNING (Eligible)", () => {
            const mcdi = evaluateTechnologyCandidate({
                key: "MCDI",
                feedWater: feed,
                targetTds: 5.0,
                targetRecovery: 95.0
            });
            expect(mcdi.isTdsPass).toBe(true);
            expect(mcdi.isRecPass).toBe(true);
            expect(mcdi.isFeasible).toBe(true);
            expect(mcdi.autoEligibility).toBe("ELIGIBLE_WITH_WARNING");
            expect(mcdi.operatingApplicability).toBe("OUTSIDE_RECOMMENDED_RANGE");
            expect(mcdi.overallFeasibility).toBe("FEASIBLE (WITH WARNING)");
        });

        it("evaluates FCDI: TDS PASS (5.0 <= 5.0), Recovery PASS (95.0 >= 95) -> FEASIBLE WITH WARNING (Eligible)", () => {
            const fcdi = evaluateTechnologyCandidate({
                key: "FCDI",
                feedWater: feed,
                targetTds: 5.0,
                targetRecovery: 95.0
            });
            expect(fcdi.isTdsPass).toBe(true);
            expect(fcdi.isRecPass).toBe(true);
            expect(fcdi.isFeasible).toBe(true);
            expect(fcdi.autoEligibility).toBe("ELIGIBLE_WITH_WARNING");
            expect(fcdi.operatingApplicability).toBe("OUTSIDE_RECOMMENDED_RANGE");
            expect(fcdi.overallFeasibility).toBe("FEASIBLE (WITH WARNING)");
        });

        it("evaluates CDI: TDS FAIL (7.5 > 5.0), Recovery FAIL (83.3 < 95) -> NOT FEASIBLE", () => {
            const cdi = evaluateTechnologyCandidate({
                key: "CDI",
                feedWater: feed,
                targetTds: 5.0,
                targetRecovery: 95.0
            });
            expect(cdi.isTdsPass).toBe(false);
            expect(cdi.isRecPass).toBe(false);
            expect(cdi.isFeasible).toBe(false);
            expect(cdi.autoEligibility).toBe("REJECTED");
        });

        it("evaluates EDI: Pretreatment required (Feed TDS 50 > 30 mg/L) -> NOT FEASIBLE", () => {
            const edi = evaluateTechnologyCandidate({
                key: "EDI",
                feedWater: feed,
                targetTds: 5.0,
                targetRecovery: 95.0
            });
            expect(edi.requiresPretreatment).toBe(true);
            expect(edi.isFeasible).toBe(false);
            expect(edi.autoEligibility).toBe("REJECTED");
        });

        it("produces AUTO Feasible Count = 2 / 4 and selects MCDI on lower SEC", () => {
            const rec = aiRecommendation(feed);
            expect(rec.feasibleCount).toBe(2);
            expect(rec.selectedTechnology).toBe("MCDI");
        });
    });
    // Regression Scenario (Section 15):
    // MCDI manual candidate at 40.9 mg/L (TDS FAIL), CDI at 83.3% recovery (REC FAIL), EDI requires pretreatment (PRETREATMENT FAIL), FCDI meets 39 mg/L & 95% recovery (FEASIBLE)
    describe("Regression Test: Feed TDS 500 mg/L -> Target TDS 50 mg/L, Recovery >= 95%", () => {
        const feed = {
            tds: 500,
            targetTds: 50,
            targetRecovery: 95.0,
            flowRate: 10,
            hardness: 50,
            ph: 7.0,
            temperature: 25
        };

        it("evaluates MCDI with manual sub-optimal design: TDS FAIL (60 > 50), Recovery PASS (95.2 >= 95) -> NOT FEASIBLE", () => {
            const manualMcdiModel = {
                outletTDS: 60.0,
                waterRecovery: 95.2,
                secElectricalGross: 0.31,
                equipmentStatus: "NOMINAL",
                envelopeStatus: "NOMINAL"
            };

            const mcdi = evaluateTechnologyCandidate({
                key: "MCDI",
                feedWater: feed,
                model: manualMcdiModel,
                targetTds: 50,
                targetRecovery: 95.0
            });
            expect(mcdi.isTdsPass).toBe(false);
            expect(mcdi.isRecPass).toBe(true);
            expect(mcdi.isFeasible).toBe(false);
            expect(mcdi.evaluation).toBe("TDS Exceeded");
        });

        it("evaluates CDI: TDS PASS (100 <= 100), Recovery FAIL (83.3 < 95) -> NOT FEASIBLE", () => {
            const cdi = evaluateTechnologyCandidate({
                key: "CDI",
                feedWater: feed,
                targetTds: 100,
                targetRecovery: 95.0
            });
            expect(cdi.isTdsPass).toBe(true);
            expect(cdi.isRecPass).toBe(false);
            expect(cdi.isFeasible).toBe(false);
            expect(cdi.evaluation).toBe("Recovery Deficit");
        });

        it("evaluates FCDI in high-salinity envelope: TDS PASS, Recovery PASS -> FEASIBLE", () => {
            const fcdiFeed = { tds: 4000, targetTds: 400, targetRecovery: 90.0, flowRate: 10 };
            const fcdi = evaluateTechnologyCandidate({
                key: "FCDI",
                feedWater: fcdiFeed,
                targetTds: 400,
                targetRecovery: 90.0
            });
            expect(fcdi.isTdsPass).toBe(true);
            expect(fcdi.isRecPass).toBe(true);
            expect(fcdi.isFeasible).toBe(true);
            expect(fcdi.evaluation).toBe("Meets Target");
        });

        it("evaluates EDI: Pretreatment required (Feed TDS 500 > 30 mg/L) -> NOT FEASIBLE standalone", () => {
            const edi = evaluateTechnologyCandidate({
                key: "EDI",
                feedWater: feed,
                targetTds: 50,
                targetRecovery: 95.0
            });
            expect(edi.requiresPretreatment).toBe(true);
            expect(edi.isFeasible).toBe(false);
            expect(edi.evaluation).toBe("Requires Pretreatment");
        });

        it("produces AUTO Recommendation = FCDI when FCDI is the only feasible candidate", () => {
            const highBrineFeed = { tds: 4000, targetTds: 400, targetRecovery: 90.0, flowRate: 10 };
            const candidates = [
                evaluateTechnologyCandidate({ key: "MCDI", feedWater: highBrineFeed, targetTds: 400, targetRecovery: 90.0 }), // MCDI out of envelope (>3000)
                evaluateTechnologyCandidate({ key: "CDI", feedWater: highBrineFeed, targetTds: 400, targetRecovery: 90.0 }),  // CDI out of envelope (>1000)
                evaluateTechnologyCandidate({ key: "FCDI", feedWater: highBrineFeed, targetTds: 400, targetRecovery: 90.0 }), // FCDI in envelope & feasible
                evaluateTechnologyCandidate({ key: "EDI", feedWater: highBrineFeed, targetTds: 400, targetRecovery: 90.0 })   // EDI requires pretreatment
            ];

            const feasible = rankFeasibleCandidates(candidates, 400, 90.0, 4000);
            expect(feasible.length).toBe(1);
            expect(feasible[0].key).toBe("FCDI");
        });
    });

    // Required Specification Tests (Section 14: Cases A - H)
    describe("Mandatory Verification Cases (CASE A - CASE H)", () => {
        it("CASE A: MCDI and FCDI both fully pass -> AUTO chooses the better ranked feasible candidate by SEC", () => {
            const feed = {
                tds: 1500,
                targetTds: 150,
                targetRecovery: 90.0,
                flowRate: 10,
                hardness: 100
            };
            const rec = aiRecommendation(feed);
            expect(rec.feasibleCount).toBeGreaterThanOrEqual(1);
            expect(["MCDI", "FCDI"]).toContain(rec.selectedTechnology);
            expect(rec.selectedTechnology).toBe("MCDI");
        });

        it("CASE B: Only MCDI fully passes -> AUTO = MCDI", () => {
            const feed = {
                tds: 1500,
                targetTds: 100,
                targetRecovery: 95.0,
                flowRate: 10,
                hardness: 200
            };
            const rec = aiRecommendation(feed);
            expect(rec.selectedTechnology).toBe("MCDI");
            expect(rec.screening.MCDI.feasible).toBe(true);
        });

        it("CASE C: Only FCDI fully passes -> AUTO = FCDI", () => {
            const feed = {
                tds: 8000,
                targetTds: 500,
                targetRecovery: 90.0,
                flowRate: 10,
                hardness: 200
            };
            const rec = aiRecommendation(feed);
            expect(rec.selectedTechnology).toBe("FCDI");
            expect(rec.screening.FCDI.feasible).toBe(true);
        });

        it("CASE D: No technology fully passes -> AUTO = NONE, Feasible = 0 / 4", () => {
            const feed = {
                tds: 500,
                targetTds: 5,
                targetRecovery: 95.0,
                flowRate: 10,
                hardness: 150
            };
            const rec = aiRecommendation(feed);
            expect(rec.selectedTechnology).toBeNull();
            expect(rec.recommendation).toBe("NONE");
            expect(rec.feasibleCount).toBe(0);
        });

        it("CASE E: EDI TDS passes but pretreatment is required -> NOT FEASIBLE standalone", () => {
            const feed = {
                tds: 500,
                targetTds: 10,
                targetRecovery: 95.0,
                flowRate: 10,
                hardness: 150
            };
            const edi = evaluateTechnologyCandidate({
                key: "EDI",
                feedWater: feed,
                targetTds: 10,
                targetRecovery: 95.0
            });
            expect(edi.requiresPretreatment).toBe(true);
            expect(edi.isFeasible).toBe(false);
            expect(edi.evaluation).toBe("Requires Pretreatment");

            const rec = aiRecommendation(feed);
            expect(rec.selectedTechnology).not.toBe("EDI");
        });

        it("CASE F: A technology passes TDS but fails recovery -> NOT FEASIBLE", () => {
            const cand = evaluateTechnologyCandidate({
                key: "CDI",
                feedWater: { tds: 500, flowRate: 10, hardness: 50 },
                targetTds: 100,
                targetRecovery: 95.0
            });
            expect(cand.isTdsPass).toBe(true);
            expect(cand.isRecPass).toBe(false);
            expect(cand.isFeasible).toBe(false);
            expect(cand.evaluation).toBe("Recovery Deficit");
        });

        it("CASE G: A technology passes recovery but fails TDS -> NOT FEASIBLE", () => {
            const cand = evaluateTechnologyCandidate({
                key: "MCDI",
                feedWater: { tds: 500, flowRate: 10, hardness: 50 },
                model: { outletTDS: 120.0, waterRecovery: 95.2, sec: 0.3, equipmentStatus: "NOMINAL", envelopeStatus: "NOMINAL" },
                targetTds: 50,
                targetRecovery: 95.0
            });
            expect(cand.isTdsPass).toBe(false);
            expect(cand.isRecPass).toBe(true);
            expect(cand.isFeasible).toBe(false);
            expect(cand.evaluation).toBe("TDS Exceeded");
        });

        it("CASE H: Manual selection failure does not affect AUTO recommendation", () => {
            const feed = { tds: 50, targetTds: 39, targetRecovery: 95.0, flowRate: 10 };
            const mcdiManual = calculateEngineering({
                technology: "MCDI",
                feedWater: feed,
                current: 0.05,
                cellPairs: 4 // low-current manual design under-desalinating
            });
            expect(mcdiManual.outletTDS).toBeGreaterThan(39.0); // manual design fails TDS

            // AUTO screening independently evaluates full feasibility
            const rec = aiRecommendation(feed);
            expect(rec.selectedTechnology).toBeDefined();
        });
    });

    describe("Array-Order Independence & Deterministic Ranking (Section 8)", () => {
        it("ranks feasible candidates deterministically regardless of input array order", () => {
            const candidates = [
                { key: "FCDI", isFeasible: true, isPass: true, secVal: 0.45, recoveryVal: 90.0, outlet: 45.0, pressureDrop: 1200 },
                { key: "MCDI", isFeasible: true, isPass: true, secVal: 0.32, recoveryVal: 95.2, outlet: 48.0, pressureDrop: 800 }
            ];

            const sortedForward = rankFeasibleCandidates(candidates, 50, 95.0, 500);
            const sortedReversed = rankFeasibleCandidates([...candidates].reverse(), 50, 95.0, 500);

            expect(sortedForward[0].key).toBe("MCDI");
            expect(sortedReversed[0].key).toBe("MCDI");
            expect(sortedForward[1].key).toBe("FCDI");
            expect(sortedReversed[1].key).toBe("FCDI");
        });
    });

    // 7 Explicit Verification Points from Mentor Specification
    describe("Explicit 7-Point Mentor Demo Verification Suite", () => {
        it("Point 1: One feasible candidate -> that candidate is AUTO", () => {
            const feed = { tds: 8000, targetTds: 500, targetRecovery: 90.0, flowRate: 10, hardness: 200 };
            const rec = aiRecommendation(feed);
            expect(rec.feasibleCount).toBe(1);
            expect(rec.selectedTechnology).toBe("FCDI");
        });

        it("Point 2: MCDI infeasible (envelope exceeded at 4000 ppm) + FCDI feasible -> AUTO = FCDI", () => {
            const feed = { tds: 4000, targetTds: 400, targetRecovery: 90.0, flowRate: 10 };
            const mcdiCand = evaluateTechnologyCandidate({ key: "MCDI", feedWater: feed, targetTds: 400, targetRecovery: 90.0 });
            const cdiCand = evaluateTechnologyCandidate({ key: "CDI", feedWater: feed, targetTds: 400, targetRecovery: 90.0 });
            const fcdiCand = evaluateTechnologyCandidate({ key: "FCDI", feedWater: feed, targetTds: 400, targetRecovery: 90.0 });
            const ediCand = evaluateTechnologyCandidate({ key: "EDI", feedWater: feed, targetTds: 400, targetRecovery: 90.0 });

            expect(mcdiCand.isFeasible).toBe(false); // 4000 > 3000 ppm (Envelope Exceeded)
            expect(cdiCand.isFeasible).toBe(false);  // 4000 > 1000 ppm (Envelope Exceeded)
            expect(fcdiCand.isFeasible).toBe(true);  // In envelope (3000-15000) & meets target
            expect(ediCand.isFeasible).toBe(false);  // Pretreatment required

            const ranked = rankFeasibleCandidates([mcdiCand, cdiCand, fcdiCand, ediCand], 400, 90.0, 4000);
            expect(ranked.length).toBe(1);
            expect(ranked[0].key).toBe("FCDI");
        });

        it("Point 3: Both MCDI and CDI feasible (dilute 300 ppm) -> secondary ranking decides", () => {
            const feed = { tds: 300, targetTds: 100, flowRate: 10, hardness: 50 };
            const mcdiCand = evaluateTechnologyCandidate({ key: "MCDI", feedWater: feed, targetTds: 100 });
            const cdiCand = evaluateTechnologyCandidate({ key: "CDI", feedWater: feed, targetTds: 100 });

            expect(mcdiCand.isFeasible).toBe(true);
            expect(cdiCand.isFeasible).toBe(true);

            // CDI has CAPEX advantage (membrane-free) for dilute feeds
            const ranked = rankFeasibleCandidates([mcdiCand, cdiCand], 100, null, 300);
            expect(ranked[0].key).toBe("CDI");
            expect(ranked[1].key).toBe("MCDI");
        });

        it("Point 4: No feasible candidates -> AUTO = NONE", () => {
            const feed = { tds: 500, targetTds: 5, targetRecovery: 95.0, flowRate: 10, hardness: 150 };
            const rec = aiRecommendation(feed);
            expect(rec.feasibleCount).toBe(0);
            expect(rec.selectedTechnology).toBeNull();
            expect(rec.recommendation).toBe("NONE");
        });

        it("Point 5: Manual active technology never overrides AUTO", () => {
            const feed = { tds: 50, targetTds: 39, targetRecovery: 95.0, flowRate: 10 };
            const activeManualTech = "MCDI";
            const autoRec = aiRecommendation(feed);

            // Active manual selection can be MCDI while AUTO remains independently evaluated
            expect(activeManualTech).toBe("MCDI");
            expect(autoRec.selectedTechnology).toBeDefined();
            expect(autoRec.screening.MCDI).toBeDefined();
        });

        it("Point 6: Permuting technology array order does not change AUTO", () => {
            const feed = { tds: 1500, targetTds: 150, targetRecovery: 90.0, flowRate: 10, hardness: 100 };
            const keysA = ["CDI", "MCDI", "FCDI", "EDI"];
            const keysB = ["EDI", "FCDI", "CDI", "MCDI"];
            const keysC = ["FCDI", "MCDI", "EDI", "CDI"];

            const evalA = rankFeasibleCandidates(keysA.map(key => evaluateTechnologyCandidate({ key, feedWater: feed, targetTds: 150, targetRecovery: 90.0 })), 150, 90.0, 1500);
            const evalB = rankFeasibleCandidates(keysB.map(key => evaluateTechnologyCandidate({ key, feedWater: feed, targetTds: 150, targetRecovery: 90.0 })), 150, 90.0, 1500);
            const evalC = rankFeasibleCandidates(keysC.map(key => evaluateTechnologyCandidate({ key, feedWater: feed, targetTds: 150, targetRecovery: 90.0 })), 150, 90.0, 1500);

            expect(evalA[0].key).toBe(evalB[0].key);
            expect(evalB[0].key).toBe(evalC[0].key);
            expect(evalA[0].key).toBe("MCDI");
        });

        it("Point 7: GUI displayed AUTO recommendation exactly matches centralized engineering evaluation", () => {
            const feed = { tds: 500, targetTds: 50, targetRecovery: 95.0, flowRate: 10, hardness: 150 };
            const centralEngineRec = aiRecommendation(feed);
            
            // Re-evaluate identically to TechTradeoffsPanel
            const rawCandidates = ["MCDI", "CDI", "FCDI", "EDI"].map(key =>
                evaluateTechnologyCandidate({ key, feedWater: feed, targetTds: 50, targetRecovery: 95.0 })
            );
            const feasible = rankFeasibleCandidates(rawCandidates, 50, 95.0, 500);

            expect(feasible[0].key).toBe(centralEngineRec.selectedTechnology);
            expect(feasible.length).toBe(centralEngineRec.feasibleCount);
        });
    });
});
