import { describe, it, expect } from "vitest";
import calculateEngineering from "../../shared/engineering/engine/engineeringEquationEngine.js";
import { calculateFCDIModel } from "../../shared/engineering/models/fCDIModel.js";
import { runScenarioAnalysis } from "../../shared/engineering/core/designExplorerEngine.js";
import { calculateTEA } from "../../shared/engineering/tea/technoEconomicEngine.js";
import aiRecommendation from "../../shared/engineering/core/aiRecommendation.js";

describe("FCDI Engineering Validation Blockers Regression Suite", () => {
    // -------------------------------------------------------------------------
    // A-I: BASELINE SPECIFICATION VERIFICATION
    // -------------------------------------------------------------------------
    const baselineInputs = {
        technology: "FCDI",
        feedWater: {
            tds: 10,
            flowRate: 10.00,
            targetTds: 3.0,
            targetRecovery: 95.0
        },
        tds: 10,
        flowRate: 10.00,
        targetTds: 3.0,
        targetRecovery: 95.0,
        cellPairs: 34,
        electrodeArea: 350,
        voltage: 1.40,
        chargeUtilization: 0.65
    };

    it("A-D. validates baseline FCDI water, salt, and Faraday balances with 0% residual", () => {
        const res = calculateEngineering(baselineInputs);

        // A. Baseline metrics
        expect(res.technology).toBe("FCDI");
        expect(res.cellPairs).toBe(34);
        expect(res.electrodeArea).toBe(350);
        expect(res.voltageCell).toBe(1.40);
        expect(res.voltageStack).toBeCloseTo(47.6, 1);

        // C. Water balance
        const productFlow = res.productFlowLmin;
        const rejectFlow = res.rejectFlowLmin;
        expect(productFlow).toBeCloseTo(9.50, 2);
        expect(rejectFlow).toBeCloseTo(0.50, 2);
        expect(Math.abs(10.00 - (productFlow + rejectFlow))).toBeLessThanOrEqual(0.0001);
        expect(res.MassBalance.status).toBe("CLOSED");

        // D. Salt balance
        // Feed: 10 L/min * 10 mg/L = 100 mg/min
        // Product: 9.5 L/min * 3 mg/L = 28.5 mg/min
        // Concentrate: 0.5 L/min * 143 mg/L = 71.5 mg/min
        // 28.5 + 71.5 = 100 mg/min (exact closure)
        expect(res.outletTDS).toBeCloseTo(3.0, 1);
        expect(res.rejectTds).toBeCloseTo(143.0, 1);
        const saltInMgMin = 10.00 * 10;
        const saltOutMgMin = (productFlow * res.outletTDS) + (rejectFlow * res.rejectTds);
        expect(Math.abs(saltInMgMin - saltOutMgMin)).toBeLessThan(0.05);
        expect(res.SaltBalance.status).toBe("CLOSED");

        // B. Faraday balance
        // Stream removal = 100 - 28.5 = 71.5 mg/min = 715.0 mg / 10 min
        const recon = res.faradayChargeReconciliation;
        expect(recon).toBeDefined();
        expect(recon.streamSaltRemovedPerCycleMg).toBeCloseTo(715.0, 1);
        expect(recon.faradaySaltRemovedPerCycleMg).toBeCloseTo(715.0, 1);
        expect(recon.chargeBalanceRelativeErrorPct).toBeLessThanOrEqual(0.05);
        expect(recon.reconciled).toBe(true);
        expect(recon.isConserved).toBe(true);
        expect(recon.status).toBe("RECONCILED");

        // E. Electrical power
        expect(res.current).toBeCloseTo(0.089, 2);
        expect(res.power).toBeGreaterThan(3.5);
        expect(res.power).toBeLessThan(5.5);

        // F. Electrical SEC
        expect(res.secElectricalGross).toBeGreaterThan(0.005);
        expect(res.secElectricalGross).toBeLessThan(0.015);

        // G. Hydraulic ΔP
        expect(res.pressureDrop).toBeGreaterThan(0);
        expect(res.HydraulicResult.channelPressureDrop.value).toBeGreaterThan(0);

        // H-I. Recovery & TDS
        expect(res.recoveryType).toBe("DESIGN CONSTRAINT");
        expect(res.outletTDS).toBe(3.0);
    });

    // -------------------------------------------------------------------------
    // J. AUTO TECHNOLOGY SELECTION TRACEABILITY
    // -------------------------------------------------------------------------
    it("J. evaluates technologies through authoritative individual models during AUTO selection", () => {
        const autoResult = aiRecommendation({
            tds: 500,
            targetTds: 50,
            flowRate: 10,
            targetRecovery: 95.0
        });

        expect(autoResult.selectedTechnology).toBeDefined();
        expect(autoResult.evaluations).toBeDefined();
        expect(autoResult.evaluations.length).toBeGreaterThanOrEqual(4);

        // Verify each candidate has independent model and validation traceability
        autoResult.evaluations.forEach(cand => {
            expect(cand.technology).toBeDefined();
            expect(cand.modelBasis).toBeDefined();
            expect(cand.complianceStatus).toBeDefined();
            expect(typeof cand.isFeasible).toBe("boolean");
        });
    });

    // -------------------------------------------------------------------------
    // K. DESIGN EXPLORER SCENARIO INDEPENDENCE
    // -------------------------------------------------------------------------
    it("K. executes each Design Explorer scenario independently through calculateEngineering without copying baseline", () => {
        const values = [10, 208, 406, 604, 802, 1000];
        const deResult = runScenarioAnalysis({
            parameter: "Feed TDS",
            values,
            baseline: {
                technology: "FCDI",
                feedWater: baselineInputs.feedWater,
                engineering: calculateEngineering(baselineInputs)
            }
        });

        expect(deResult.scenarios).toBeDefined();
        expect(deResult.scenarios.length).toBe(6);

        // Verify scenario outputs vary across feed TDS (10, 208, 406, 604, 802, 1000 mg/L)
        const s01 = deResult.scenarios[0];
        const s06 = deResult.scenarios[5];

        expect(s01.feedTds).toBe(10);
        expect(s06.feedTds).toBe(1000);
        expect(s01.current).not.toBe(s06.current);
        expect(s01.power).not.toBe(s06.power);
        expect(s01.sec).not.toBe(s06.sec);

        // Verify every scenario contains an independent calculation trace
        deResult.scenarios.forEach(sc => {
            expect(sc.calculationTrace).toBeDefined();
            expect(sc.calculationTrace.inputs).toBeDefined();
            expect(sc.calculationTrace.outputs).toBeDefined();
            expect(sc.calculationTrace.balances).toBeDefined();
            expect(sc.calculationTrace.governingEquations).toBeDefined();
        });
    });

    // -------------------------------------------------------------------------
    // L. TEA ENERGY RECONCILIATION SYNCHRONIZATION
    // -------------------------------------------------------------------------
    it("L. strictly reconciles TEA annual energy from SEC vs Power within 0.1% tolerance", () => {
        const engResult = calculateEngineering(baselineInputs);
        const teaResult = calculateTEA({
            engineering: engResult,
            economicInputs: {
                operatingHoursPerDay: 24,
                operatingDaysPerYear: 350,
                electricityTariff: 8.5
            }
        });

        expect(teaResult.energyReconciliation).toBeDefined();
        expect(teaResult.energyReconciliation.relativeErrorPct).toBeLessThanOrEqual(0.1);
        expect(teaResult.energyReconciliation.isReconciled).toBe(true);
        expect(teaResult.energyReconciliation.status).toBe("RECONCILED");
    });

    // -------------------------------------------------------------------------
    // EDGE CASES & SAFETY GATES
    // -------------------------------------------------------------------------
    it("verifies safe handling of zero and negative inputs", () => {
        expect(() => calculateFCDIModel({ flowRate: 0, tds: 10 }))
            .toThrow();
        expect(() => calculateFCDIModel({ flowRate: -5, tds: 10 }))
            .toThrow();
        expect(() => calculateFCDIModel({ flowRate: 10, tds: -10 }))
            .toThrow();
    });

    it("verifies zero pairs and zero area limits clamp safely to physical bounds", () => {
        const zeroPairs = calculateFCDIModel({
            flowRate: 10,
            tds: 10,
            targetTds: 3,
            cellPairs: 0
        });
        // Model must clamp to minimum physical pairs (>= 12) rather than divide by zero
        expect(zeroPairs.cellPairs).toBeGreaterThanOrEqual(12);

        const zeroArea = calculateFCDIModel({
            flowRate: 10,
            tds: 10,
            targetTds: 3,
            electrodeArea: 0
        });
        expect(zeroArea.electrodeArea).toBeGreaterThanOrEqual(50);
    });

    it("verifies physical limit gates for unachievable setpoints", () => {
        // Feed TDS 500 mg/L with target 0.1 mg/L (99.98% removal exceeds single-stage 95% limit)
        const unachievable = calculateEngineering({
            technology: "FCDI",
            feedWater: { tds: 500, flowRate: 10, targetTds: 0.1, targetRecovery: 90 },
            tds: 500,
            targetTds: 0.1
        });

        expect(unachievable.isTargetAchieved).toBe(false);
        expect(unachievable.feasibilityGate.isFeasible).toBe(false);
        expect(unachievable.outletTDS).toBeGreaterThan(0.1);
    });

    it("verifies clean technology switching maintains single source of truth", () => {
        const fcdi = calculateEngineering({ technology: "FCDI", feedWater: { tds: 1000, flowRate: 10 } });
        const mcdi = calculateEngineering({ technology: "MCDI", feedWater: { tds: 1000, flowRate: 10 } });
        const cdi = calculateEngineering({ technology: "CDI", feedWater: { tds: 300, flowRate: 10 } });

        expect(fcdi.technology).toBe("FCDI");
        expect(mcdi.technology).toBe("MCDI");
        expect(cdi.technology).toBe("CDI");

        expect(fcdi.HydraulicResult.hydraulicBreakdown.slurryChannelPa).toBeGreaterThan(0);
        expect(mcdi.HydraulicResult.hydraulicBreakdown.slurryChannelPa).toBe(0);
    });
});
