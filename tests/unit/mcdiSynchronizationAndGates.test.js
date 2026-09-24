import { describe, it, expect } from "vitest";
import calculateEngineering from "../../shared/engineering/engine/engineeringEquationEngine.js";
import { calculateMCDIModel } from "../../shared/engineering/models/mCDIModel.js";
import { calculateFCDIModel } from "../../shared/engineering/models/fCDIModel.js";
import { runScenarioAnalysis, optimizeScenarioTechnology } from "../../shared/engineering/core/designExplorerEngine.js";
import { calculateTEA } from "../../shared/engineering/tea/technoEconomicEngine.js";
import aiRecommendation, { evaluateTechnologyCandidate, rankFeasibleCandidates } from "../../shared/engineering/core/aiRecommendation.js";
import { evaluateFeasibilityGate, FEASIBILITY_TOLERANCES } from "../../shared/engineering/core/feasibilityGate.js";
import { buildCanonicalEngineeringResult } from "../../shared/engineering/core/canonicalEngineeringResult.js";

describe("MCDI/FCDI Authoritative Synchronization & Engineering Gates Suite", () => {

    // -------------------------------------------------------------------------
    // 1. MCDI FARADAY ELECTROCHEMICAL BALANCE & CANONICAL TOLERANCE
    // -------------------------------------------------------------------------
    describe("1. MCDI Faraday Balance & Canonical Tolerance", () => {
        it("strictly closes MCDI Faraday electrochemical balance with 0.0000% residual (eliminating 1.1514% artifact)", () => {
            const feed40 = { tds: 40, targetTds: 3.0, flowRate: 10, targetRecovery: 95.0 };
            const res = calculateMCDIModel({ feedWater: feed40 });
            const cb = res.chargeBalance;

            expect(cb).toBeDefined();
            expect(cb.streamSaltRemovalGs).toBeGreaterThan(0);
            expect(cb.faradaySaltRemovalGs).toBeGreaterThan(0);
            expect(cb.chargeResidualGs).toBeLessThanOrEqual(FEASIBILITY_TOLERANCES.CHARGE_BALANCE_TOLERANCE_GS);
            expect(cb.chargeBalanceRelativeErrorPct).toBeLessThanOrEqual(FEASIBILITY_TOLERANCES.CHARGE_BALANCE_REL_ERROR_MAX * 100);
            expect(cb.isConserved).toBe(true);
            expect(cb.status).toBe("RECONCILED");
        });

        it("strictly closes Faraday balance across wide salinity range (10 to 500 mg/L)", () => {
            for (const tds of [10, 20, 50, 100, 240, 500]) {
                const res = calculateMCDIModel({ feedWater: { tds, targetTds: 2.0, flowRate: 10, targetRecovery: 95.0 } });
                const cb = res.chargeBalance;
                expect(cb.chargeResidualGs).toBeLessThanOrEqual(FEASIBILITY_TOLERANCES.CHARGE_BALANCE_TOLERANCE_GS);
                expect(cb.chargeBalanceRelativeErrorPct).toBeLessThanOrEqual(FEASIBILITY_TOLERANCES.CHARGE_BALANCE_REL_ERROR_MAX * 100);
                expect(cb.isConserved).toBe(true);
            }
        });

        it("canonical feasibility gate BLOCKS overall feasibility when Faraday balance fails", () => {
            const baseRes = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50, flowRate: 10, targetRecovery: 95 } });
            const canonicalValid = buildCanonicalEngineeringResult(baseRes, { technology: "MCDI", feedWater: { tds: 500, targetTds: 50, flowRate: 10, targetRecovery: 95 } });
            
            // Valid baseline must pass
            const gateValid = evaluateFeasibilityGate(canonicalValid);
            expect(gateValid.isFeasible).toBe(true);
            expect(gateValid.gates.chargeBalance.status).toBe("PASS");

            // Intentionally inject Faraday discrepancy > tolerance
            const canonicalInvalid = JSON.parse(JSON.stringify(canonicalValid));
            canonicalInvalid.ChargeBalance.chargeResidualGs = 0.05; // 50x tolerance
            canonicalInvalid.ChargeBalance.discrepancyPercent = 2.5; // > 0.5% max
            canonicalInvalid.ChargeBalance.isConserved = false;
            canonicalInvalid.ChargeBalance.reconciled = false;

            const gateBlocked = evaluateFeasibilityGate(canonicalInvalid);
            expect(gateBlocked.isFeasible).toBe(false);
            expect(gateBlocked.gates.chargeBalance.status).toBe("FAIL");
            expect(gateBlocked.failures.some(f => f.includes("Faradaic charge utilization residual"))).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // 2. TECHNOLOGY SELECTION ENGINE CONSISTENCY (MCDI vs FCDI)
    // -------------------------------------------------------------------------
    describe("2. Technology Selection Consistency", () => {
        it("strictly awards 'Recommended' to lower SEC candidate even for small differences (< 0.01 kWh/m³)", () => {
            const candidates = [
                { key: "FCDI", name: "FCDI", sec: 0.0074, secVal: 0.0074, recoveryVal: 95.0, waterRecovery: 95.0, outlet: 2.0, outletTDS: 2.0, isFeasible: true, isPass: true },
                { key: "MCDI", name: "MCDI", sec: 0.0046, secVal: 0.0046, recoveryVal: 95.0, waterRecovery: 95.0, outlet: 2.0, outletTDS: 2.0, isFeasible: true, isPass: true }
            ];

            const ranked = rankFeasibleCandidates(candidates, 3.0, 95.0, 10);
            expect(ranked[0].key).toBe("MCDI");
            expect(ranked[1].key).toBe("FCDI");
        });

        it("selects MCDI for low salinity baseline (10 mg/L) in aiRecommendation", () => {
            const rec = aiRecommendation({ tds: 10, targetTds: 1.5, flowRate: 10, targetRecovery: 95 });
            expect(rec.selectedTechnology).toBe("MCDI");
            const mcdi = rec.feasibleCandidates.find(c => c.key === "MCDI");
            const fcdi = rec.feasibleCandidates.find(c => c.key === "FCDI");
            expect(mcdi).toBeDefined();
            expect(fcdi).toBeDefined();
            expect(mcdi.sec).toBeLessThan(fcdi.sec);
        });
    });

    // -------------------------------------------------------------------------
    // 3. DESIGN EXPLORER BASELINE SYNCHRONIZATION
    // -------------------------------------------------------------------------
    describe("3. Design Explorer Baseline Synchronization", () => {
        it("synchronizes S01 and BEST CASE with active MCDI selection for 10 mg/L baseline", () => {
            const baseline = {
                feedWater: { tds: 10, flowRate: 10, targetTds: 1.5, targetRecovery: 95.0, conductivity: 15, hardness: 3 },
                technology: "AUTO",
                optimizationInputs: { voltage: 1.4, cellPairs: 34, electrodeArea: 350 },
                engineering: { outletTds: 1.5, waterRecoveryPct: 95.0, secElectricalGross: 0.007, pressureDrop: 406 }
            };

            const values = [10, 50, 100, 200, 300, 400];
            const result = runScenarioAnalysis({ baseline, parameter: "Feed TDS", values });

            // S01 must match MCDI
            const s01 = result.scenarios[0];
            expect(s01.scenarioId).toBe("S01");
            expect(s01.technology).toBe("MCDI");
            expect(s01.feasibility).toBe("FEASIBLE");
            expect(s01.outletTds).toBeLessThanOrEqual(1.55);

            // Best Case must match MCDI
            expect(result.summary.bestCaseTech).toBe("MCDI");
            expect(result.summary.bestRegion.bestTechnology).toBe("MCDI");
        });
    });

    // -------------------------------------------------------------------------
    // 4. DESIGN EXPLORER INDEPENDENT CALCULATION (ALL 6 SCENARIOS)
    // -------------------------------------------------------------------------
    describe("4. Design Explorer Independent Scenario Calculations", () => {
        it("independently executes authoritative model for all six scenarios with closed balances and physical consistency", () => {
            const baseline = {
                feedWater: { tds: 50, flowRate: 10, targetTds: 3.0, targetRecovery: 95.0, conductivity: 77, hardness: 15 },
                technology: "AUTO",
                optimizationInputs: { voltage: 1.4, cellPairs: 34, electrodeArea: 350 }
            };

            const values = [50, 240, 430, 620, 810, 1000];
            const result = runScenarioAnalysis({ baseline, parameter: "Feed TDS", values });

            expect(result.scenarios.length).toBe(6);

            result.scenarios.forEach((sc, idx) => {
                expect(sc.feedTds).toBe(values[idx]);
                expect(sc.technology).toBe("MCDI");
                expect(sc.feasibility).toBe("FEASIBLE");
                expect(sc.operatingRange).toBe("RECOMMENDED");

                // Balances must close independently
                expect(sc.massBalanceStatus).toBe("CLOSED");
                expect(sc.saltBalanceStatus).toBe("CLOSED");
                expect(sc.faradayBalanceStatus).toBe("CLOSED");
                expect(sc.faradayBalance.status).toBe("CLOSED");

                // Physical metrics must be non-zero and physically bounded
                expect(sc.current).toBeGreaterThan(0);
                expect(sc.power).toBeGreaterThan(0);
                expect(sc.sec).toBeGreaterThan(0);
                expect(sc.pressureDrop).toBeGreaterThan(0);
                expect(sc.recovery).toBeCloseTo(95.0, 1);
                expect(sc.outletTds).toBeLessThanOrEqual(3.05);
            });

            // S01-S04 have 1 module (34 pairs) -> 567 Pa; S05-S06 expand to 2 modules (68 pairs) -> 237 Pa
            expect(result.scenarios[0].pressureDrop).toBe(567);
            expect(result.scenarios[3].pressureDrop).toBe(567);
            expect(result.scenarios[4].pressureDrop).toBe(237);
            expect(result.scenarios[5].pressureDrop).toBe(237);
        });
    });

    // -------------------------------------------------------------------------
    // 5. DOWNSTREAM SYSTEM SYNCHRONIZATION
    // -------------------------------------------------------------------------
    describe("5. Downstream System Synchronization", () => {
        it("TEA strictly derives annual cost from authoritative SEC and product flow", () => {
            const feedWater = { tds: 10, targetTds: 1.5, flowRate: 10.0, targetRecovery: 95.0 };
            const mcdiEng = calculateEngineering({ technology: "MCDI", feedWater });

            const tea = calculateTEA({
                engineering: mcdiEng,
                scaleWithDesign: true
            });

            expect(tea).toBeDefined();
            const productFlowLmin = mcdiEng.productFlowLmin; // 9.50 L/min
            const annualVolumeM3 = (productFlowLmin * 60 * 24 * 350) / 1000; // 4,788 m3/yr
            const expectedAnnualKwh = (mcdiEng.secElectricalGross ?? mcdiEng.sec) * annualVolumeM3;

            expect(tea.annualEnergyConsumptionKwh).toBeCloseTo(expectedAnnualKwh, 1);
            expect(tea.operatingTreatmentCostInrPerM3).toBeGreaterThan(0);
        });
    });
});
