import { describe, it, expect } from "vitest";
import { calculateMCDIModel, calculateMCDIChargeEfficiency, MCDI_ENVELOPE } from "./mCDIModel.js";

describe("First-Principles MCDI Model Unit & Validation Suite", () => {

    it("verifies hand-calculated MCDI benchmark case from platform spec", () => {
        // Platform Prompt Benchmark Case:
        // Feed: 500 ppm -> Target: 50 ppm (90% removal)
        // Recovery: 95%
        // V_cell: 1.40 V
        // Pairs per module: 34 -> V_module = 34 * 1.40 = 47.6 V
        // Modules: 3 -> V_stack = 3 * 47.6 = 142.8 V (102 pairs)
        // Expected current: 1.32 A
        // Expected power: 188.5 W
        // Expected SEC_elec: 0.3306 kWh/m³

        const res = calculateMCDIModel({
            flowRate: 10,
            tds: 500,
            targetTds: 50,
            voltage: 1.4,
            waterRecovery: 95,
            cellPairs: 102,
            electrodeArea: 350
        });

        expect(res.feedTds).toBe(500);
        expect(res.outletTDS).toBe(50);
        expect(res.removalEfficiency).toBe(90);

        expect(res.chargeEfficiencyFrac).toBe(0.92);
        expect(res.totalFaradayCurrent).toBeCloseTo(134.59, 1);

        expect(res.pairsPerModule).toBe(34);
        expect(res.numberOfModules).toBe(3);
        expect(res.cellPairs).toBe(102);

        expect(res.voltageCell).toBe(1.40);
        expect(res.voltageModule).toBe(47.60);
        expect(res.voltageStack).toBe(142.80);

        expect(res.cellCurrent).toBeCloseTo(1.32, 2);
        expect(res.power).toBeCloseTo(188.4, 0);

        expect(res.productFlowM3h).toBe(0.57);
        expect(res.secElectrical).toBeCloseTo(0.3306, 3);
        expect(res.envelopeStatus).toBe("VALIDATED");
    });

    it("verifies multi-stream water and salt conservation balances", () => {
        const flowRateLmin = 10;
        const feedTds = 500;
        const targetTds = 50;
        const recovery = 95;

        const res = calculateMCDIModel({
            flowRate: flowRateLmin,
            tds: feedTds,
            targetTds,
            waterRecovery: recovery
        });

        // Water conservation: Q_feed = Q_prod + Q_brine
        expect(res.flowRateLmin).toBe(res.productFlowLmin + res.concentrateFlowLmin);
        expect(res.isWaterConserved).toBe(true);

        // Salt conservation: Q_feed * C_feed = Q_prod * C_out + Q_brine * C_brine
        const saltIn = (res.flowRateM3s) * res.feedTds;
        const saltOutProd = (res.productFlowM3h / 3600) * res.outletTDS;
        const saltOutBrine = (res.concentrateFlowM3h / 3600) * res.concentrateTds;

        expect(saltIn).toBeCloseTo(saltOutProd + saltOutBrine, 4);
        expect(res.isSaltConserved).toBe(true);
    });

    it("verifies Faraday charge and current calculations for MCDI", () => {
        const flowRateLmin = 10;
        const feedTds = 500;
        const targetTds = 50;
        const cellVoltage = 1.4;

        const Lambda = calculateMCDIChargeEfficiency(cellVoltage, feedTds);
        const res = calculateMCDIModel({ flowRate: flowRateLmin, tds: feedTds, targetTds, voltage: cellVoltage });

        // Total Faraday current = (n_dot * 1 * 96485) / Lambda
        const mDotGs = (10 / 60000) * (500 - 50);
        const nDotMols = mDotGs / 58.44;
        const expectedFaradayCurrent = (nDotMols * 96485) / Lambda;

        expect(res.totalFaradayCurrent).toBeCloseTo(expectedFaradayCurrent, 1);
        expect(res.chargeEfficiencyFrac).toBe(Lambda);
    });

    it("verifies current-density-based electrode and membrane area sizing", () => {
        const targetJ = 60.0; // A/m²
        const planarAreaCm2 = 350; // cm² per pair

        const res = calculateMCDIModel({
            flowRate: 10,
            tds: 500,
            targetTds: 50,
            currentDensity: targetJ,
            electrodeArea: planarAreaCm2
        });

        // A_total = I_total / 60.0
        const expectedAreaM2 = res.totalFaradayCurrent / targetJ;
        expect(res.requiredTotalAreaM2).toBeCloseTo(expectedAreaM2, 2);

        // Membrane area = 2 * Total electrode area
        expect(res.totalMembraneAreaM2).toBeCloseTo(2 * res.totalElectrodeAreaM2, 2);

        // Actual J = I_cell / 0.035
        const expectedActualJ = res.cellCurrent / 0.035;
        expect(res.currentDensity).toBeCloseTo(expectedActualJ, 1);
    });

    it("verifies series electrical voltage and power scaling", () => {
        const cellVoltage = 1.4;

        const res = calculateMCDIModel({
            flowRate: 10,
            tds: 500,
            targetTds: 50,
            voltage: cellVoltage,
            cellPairs: 102
        });

        // 34 pairs/module -> V_module = 34 * 1.4 = 47.6 V
        expect(res.voltageModule).toBe(47.6);

        // 3 modules -> V_stack = 3 * 47.6 = 142.8 V
        expect(res.voltageStack).toBe(142.8);

        // Stack Power = V_stack * I_cell
        const expectedPowerW = res.voltageStack * res.cellCurrent;
        expect(res.power).toBeCloseTo(expectedPowerW, 1);
    });

    it("verifies electrical and hydraulic SEC separation", () => {
        const res = calculateMCDIModel({
            flowRate: 10,
            tds: 500,
            targetTds: 50,
            waterRecovery: 95
        });

        // Product flow = 10 * 0.95 * 60 / 1000 = 0.57 m³/h
        expect(res.productFlowM3h).toBe(0.57);

        // SEC_elec = (P / 1000) / 0.57
        const expectedSecElec = (res.power / 1000) / 0.57;
        expect(res.secElectrical).toBeCloseTo(expectedSecElec, 3);

        // Total Net SEC = SEC_elec_net + SEC_hydraulic
        expect(res.secTotal).toBeCloseTo(res.secElectricalNet + res.secHydraulic, 3);
        expect(res.sec).toBe(res.secTotal);
    });

    it("verifies operating envelope status categorization for MCDI", () => {
        // Validated case (500 - 3000 ppm, <= 1.4V)
        const valRes = calculateMCDIModel({ tds: 1500, voltage: 1.4 });
        expect(valRes.envelopeStatus).toBe("VALIDATED");

        // Extrapolated case (outside recommended 500-3000 ppm range, e.g. 400 ppm)
        const extRes = calculateMCDIModel({ tds: 400, voltage: 1.4 });
        expect(extRes.envelopeStatus).toBe("EXTRAPOLATED");

        // Outside envelope case (> 5000 ppm)
        const outRes = calculateMCDIModel({ tds: 6000, voltage: 1.6 });
        expect(outRes.envelopeStatus).toBe("OUTSIDE_ENVELOPE");
    });

    it("rejects invalid inputs with descriptive error messages", () => {
        expect(() => calculateMCDIModel({ flowRate: 0, tds: 500 })).toThrow("Invalid inputs");
        expect(() => calculateMCDIModel({ flowRate: 10, tds: -100 })).toThrow("Invalid inputs");
    });
});
