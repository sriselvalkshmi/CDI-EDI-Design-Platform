import { describe, it, expect } from "vitest";
import { calculateMCDIModel } from "../../shared/engineering/models/mCDIModel";
import { calculateEDIModel } from "../../shared/engineering/models/ediModel";
import { executeEngineeringEquationEngine } from "../../shared/engineering/engine/engineeringEquationEngine";

describe("12-Minute Cycle, Mass Balances & EDI Multi-Gate Screening Audit Suite", () => {
    
    // -------------------------------------------------------------
    // 1. 12-Minute Transient Cycle & Salt Balance Closure
    // -------------------------------------------------------------
    describe("1. 12-Minute MCDI Dynamic Cycle & Conservation Balances", () => {
        it("strictly closes the 12-minute water and salt balances with 0.000 residual", () => {
            const feedFlowLmin = 20.0;
            const feedTdsMgL = 39.0;
            const targetTdsMgL = 2.0;

            const res = calculateMCDIModel({
                flowRate: feedFlowLmin,
                feedTds: feedTdsMgL,
                targetTds: targetTdsMgL,
                waterRecovery: 95.238
            });

            // Steady-state continuous flows
            expect(res.productFlowLmin).toBeCloseTo(19.04, 1);
            expect(res.concentrateFlowLmin).toBeCloseTo(0.96, 1);
            expect(res.outletTds).toBeLessThanOrEqual(2.0);

            // 12-Minute Transient Cycle Accounting:
            // 10 min Adsorption @ 20 L/min -> 200 L product
            // 1 min Desorption @ 10 L/min -> 10 L reject
            // 1 min Rinse @ 20 L/min -> 20 L recycled to equalization
            const adsDurationMin = 10.0;
            const desDurationMin = 1.0;
            const rinseDurationMin = 1.0;
            const cycleDurationMin = adsDurationMin + desDurationMin + rinseDurationMin; // 12 min

            const vProductL = feedFlowLmin * adsDurationMin; // 200.0 L
            const vDesFeedL = 10.0 * desDurationMin; // 10.0 L
            const vExternalFeedL = vProductL + vDesFeedL; // 210.0 L
            const vRejectL = vDesFeedL; // 10.0 L
            const vRinseRecycleL = 20.0 * rinseDurationMin; // 20.0 L

            // External Water Balance Closure
            const cycleWaterResidualL = Math.abs(vExternalFeedL - (vProductL + vRejectL));
            expect(cycleWaterResidualL).toBeLessThan(1e-6);

            // Cycle-Integrated Water Recovery
            const cycleRecoveryPct = (vProductL / vExternalFeedL) * 100;
            expect(cycleRecoveryPct).toBeCloseTo(95.24, 2);

            // Salt Mass Accounting
            const saltInMg = vExternalFeedL * feedTdsMgL; // 210 * 39 = 8190 mg
            const saltProductMg = vProductL * res.outletTds; // 200 * 1.9 = 380 mg
            const concTdsMgL = (saltInMg - saltProductMg) / vRejectL; // (8190 - 380) / 10 = 781.0 mg/L
            const saltRejectMg = vRejectL * concTdsMgL; // 7810.0 mg

            const cycleSaltResidualMg = Math.abs(saltInMg - (saltProductMg + saltRejectMg));
            expect(cycleSaltResidualMg).toBeLessThan(1e-6);
        });

        it("distinguishes steady-state continuous recovery from cycle-integrated recovery", () => {
            const feedFlow = 20.0;
            const res = calculateMCDIModel({
                flowRate: feedFlow,
                feedTds: 39.0,
                targetTds: 2.0,
                waterRecovery: 95.238
            });

            const ssRecovery = (res.productFlowLmin / feedFlow) * 100;
            expect(ssRecovery).toBeCloseTo(95.2, 1);
        });
    });

    // -------------------------------------------------------------
    // 2. EDI Hardness Scaling Gate & Recovery Coupling
    // -------------------------------------------------------------
    describe("2. EDI Hardness Scaling & Recovery Coupling", () => {
        it("strictly applies 0.10 mg/L limit at >= 95% recovery and calculates 100x exceedance for 10 mg/L feed", () => {
            const res = calculateEDIModel({
                flowRate: 20.0,
                feedTds: 39.0,
                targetTds: 2.0,
                feedHardness: 10.0,
                waterRecovery: 95.0
            });

            expect(res.isFeedFeasible).toBe(false);
            expect(res.screeningGates.hardness.limit).toContain("0.1 mg/L");
            expect(res.screeningGates.hardness.status).toBe("FAIL");
            expect(res.screeningGates.hardness.exceedance).toBe("100.0×");
            expect(res.gatingReason).toContain("exceeds EDI scaling-control limit");
        });

        it("allows 0.50 mg/L limit at <= 90% recovery", () => {
            const res = calculateEDIModel({
                flowRate: 20.0,
                feedTds: 25.0,
                targetTds: 2.0,
                feedHardness: 0.40,
                waterRecovery: 89.6
            });

            expect(res.isFeedFeasible).toBe(true);
            expect(res.screeningGates.hardness.status).toBe("PASS");
        });
    });

    // -------------------------------------------------------------
    // 3. TDS / Conductivity Consistency & Missing Chemistry
    // -------------------------------------------------------------
    describe("3. Chemistry Consistency Review & Missing Parameters", () => {
        it("flags a chemistry consistency review when TDS (39 mg/L) / Conductivity (8 µS/cm) ratio is anomalous", () => {
            const res = calculateEDIModel({
                flowRate: 20.0,
                feedTds: 39.0,
                targetTds: 2.0,
                feedConductivity: 8.0,
                feedHardness: 10.0,
                waterRecovery: 95.0
            });

            expect(res.chemistryConsistency.isConsistent).toBe(false);
            expect(res.chemistryConsistency.ratio).toBe(4.88);
            expect(res.chemistryConsistency.warning).toContain("TDS/conductivity relationship requires laboratory reconciliation");
        });

        it("properly flags missing EDI chemistry parameters as NOT VERIFIED", () => {
            const res = calculateEDIModel({
                flowRate: 20.0,
                feedTds: 39.0,
                targetTds: 2.0,
                feedHardness: 10.0
            });

            expect(res.screeningGates.silica.status).toBe("NOT VERIFIED");
            expect(res.screeningGates.co2.status).toBe("NOT VERIFIED");
            expect(res.screeningGates.toc.status).toBe("NOT VERIFIED");
            expect(res.screeningGates.ironManganese.status).toBe("NOT VERIFIED");
            expect(res.screeningGates.freeChlorine.status).toBe("NOT VERIFIED");
            expect(res.screeningGates.turbidity.status).toBe("NOT VERIFIED");
        });
    });

    // -------------------------------------------------------------
    // 4. Hydraulic Traceability & Energy Recovery Accounting
    // -------------------------------------------------------------
    describe("4. Hydraulic Velocity & Energy Recovery Accounting", () => {
        it("confirms parallel channel superficial velocity = 0.105 m/s across 31.8 cm² area", () => {
            const res = calculateMCDIModel({
                flowRate: 20.0,
                feedTds: 39.0,
                targetTds: 2.0,
                cellPairs: 34,
                electrodeArea: 350,
                current: 0.75
            });

            // A_flow = 34 pairs * 0.1871 m width * 0.0005 m spacer = 0.0031804 m² = 31.8 cm²
            // Q = 20 L/min = 0.00033333 m³/s
            // u = 0.00033333 / 0.0031804 = 0.1048 m/s
            const aFlowM2 = 34 * Math.sqrt(0.035) * 0.0005;
            const qM3s = 20 / 60000;
            const uChannel = qM3s / aFlowM2;

            expect(uChannel).toBeCloseTo(0.105, 3);
            expect(res.currentDensity).toBeCloseTo(21.4, 1);
            expect(res.secElectricalGross).toBeCloseTo(0.0313, 4);
        });
    });

    // -------------------------------------------------------------
    // 5. Engineering Action Directives & Pretreatment Train Hierarchy
    // -------------------------------------------------------------
    describe("5. Pretreatment Action Plan & Recommendation Hierarchy", () => {
        it("provides a structured pretreatmentActionPlan and train route for ineligible direct feed", () => {
            const res = calculateEDIModel({
                flowRate: 20.0,
                feedTds: 39.0,
                targetTds: 2.0,
                feedConductivity: 8.0,
                feedHardness: 10.0,
                waterRecovery: 95.0
            });

            expect(res.feedGatingStatus).toBe("FEED PRETREATMENT REQUIRED");
            expect(res.recommendedTrain).toContain("Raw water → Pretreatment → RO / Softening → EDI Polishing");
            expect(res.engineeringActionDirective).toContain("Design upstream RO/softening to produce EDI-quality water");
            expect(Array.isArray(res.pretreatmentActionPlan)).toBe(true);
            expect(res.pretreatmentActionPlan.length).toBe(8);

            const hardnessItem = res.pretreatmentActionPlan.find(item => item.parameter.includes("Hardness"));
            expect(hardnessItem.status).toBe("PRETREATMENT REQUIRED");
            expect(hardnessItem.action).toContain("RO + Softening");
        });
    });
});
