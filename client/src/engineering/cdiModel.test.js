import { describe, it, expect } from "vitest";
import { calculateCDIModel, calculateCDIChargeEfficiency, CDI_ENVELOPE } from "./cdiModel.js";

describe("First-Principles CDI Model Unit & Validation Suite", () => {

    it("verifies explicit unit conversions (L/min -> m³/s and mg/L -> kg/m³)", () => {
        const flowRateLmin = 10;
        const feedTdsMgL = 500;

        const res = calculateCDIModel({ flowRate: flowRateLmin, tds: feedTdsMgL });

        // Q (m³/s) = 10 / (1000 * 60) = 1.6667e-4 m³/s
        const expectedM3s = 10 / 60000;
        expect(res.flowRateM3s).toBeCloseTo(expectedM3s, 5);

        // Q (m³/h) = 10 * 60 / 1000 = 0.6 m³/h
        expect(res.flowRateM3h).toBe(0.6);

        // C (kg/m³) = 500 / 1000 = 0.5 kg/m³
        const feedKgM3 = feedTdsMgL / 1000;
        expect(feedKgM3).toBe(0.5);
    });

    it("verifies multi-stream water and salt mass balances for CDI", () => {
        const flowRateLmin = 10;
        const feedTds = 500;
        const targetTds = 125; // 75% max single-stage removal

        const res = calculateCDIModel({ flowRate: flowRateLmin, tds: feedTds, targetTds, waterRecovery: 80 });

        // Water balance: Q_feed = Q_prod + Q_brine
        expect(res.flowRateLmin).toBe(res.productFlowLmin + res.concentrateFlowLmin);
        expect(res.isWaterConserved).toBe(true);

        // Salt balance: Salt_in = Salt_prod + Salt_brine
        const saltInGs = res.flowRateM3s * res.feedTds;
        const saltProdGs = (res.productFlowM3h / 3600) * res.outletTDS;
        const saltBrineGs = (res.concentrateFlowM3h / 3600) * res.concentrateTds;

        expect(saltInGs).toBeCloseTo(saltProdGs + saltBrineGs, 4);
        expect(res.isSaltConserved).toBe(true);
    });

    it("verifies non-Faradaic EDL charge demand and cycle-averaged current", () => {
        const flowRateLmin = 10;
        const feedTds = 500;
        const targetTds = 125;
        const cellVoltage = 1.2;

        const Lambda = calculateCDIChargeEfficiency(cellVoltage, feedTds);
        const res = calculateCDIModel({ flowRate: flowRateLmin, tds: feedTds, targetTds, voltage: cellVoltage });

        // Total cycle-averaged charging current = (n_dot * 1 * 96485) / Lambda
        const mDotGs = (10 / 60000) * (500 - 125);
        const nDotMols = mDotGs / 58.44;
        const expectedFaradayCurrent = (nDotMols * 96485) / Lambda;

        expect(res.totalFaradayCurrent).toBeCloseTo(expectedFaradayCurrent, 1);
        expect(res.chargeEfficiencyFrac).toBe(Lambda);
    });

    it("verifies dual sizing constraint: max(N_pairs_rate, N_pairs_capacity)", () => {
        const targetJ = 50.0; // A/m²
        const planarAreaCm2 = 350; // cm² per pair

        const res = calculateCDIModel({
            flowRate: 10,
            tds: 500,
            targetTds: 125,
            currentDensity: targetJ,
            electrodeArea: planarAreaCm2
        });

        // Rate Sizing: A_total = I_total / 50.0
        const expectedAreaRateM2 = res.totalFaradayCurrent / targetJ;
        expect(res.requiredTotalAreaM2).toBeCloseTo(expectedAreaRateM2, 2);

        // Electrode mass must be physically sufficient to store salt without exceeding SAC_max
        expect(res.sac).toBeLessThanOrEqual(CDI_ENVELOPE.sacMaxPhysical);
    });

    it("verifies electrical series voltage and power calculations", () => {
        const cellVoltage = 1.2;

        const res = calculateCDIModel({
            flowRate: 10,
            tds: 500,
            targetTds: 125,
            voltage: cellVoltage,
            cellPairs: 102
        });

        // 34 pairs/module -> V_module = 34 * 1.2 = 40.8 V
        expect(res.voltageModule).toBe(40.8);

        // 3 modules -> V_stack = 3 * 40.8 = 122.4 V
        expect(res.voltageStack).toBe(122.4);

        // Stack Power = V_stack * I_cell
        const expectedPowerW = res.voltageStack * res.cellCurrent;
        expect(res.power).toBeCloseTo(expectedPowerW, 1);
    });

    it("verifies electrical and hydraulic SEC separation", () => {
        const res = calculateCDIModel({
            flowRate: 10,
            tds: 500,
            targetTds: 125,
            waterRecovery: 80,
            cellPairs: 102
        });

        // Product flow = 10 * 0.80 * 60 / 1000 = 0.48 m³/h
        expect(res.productFlowM3h).toBe(0.48);

        // SEC_elec = (P / 1000) / 0.48
        const expectedSecElec = (res.power / 1000) / 0.48;
        expect(res.secElectrical).toBeCloseTo(expectedSecElec, 3);

        // Total SEC = SEC_elec + SEC_hydraulic
        expect(res.secTotal).toBeCloseTo(res.secElectrical + res.secHydraulic, 3);
        expect(res.sec).toBe(res.secTotal);
    });

    it("verifies first-principles reference benchmark case for single-stage CDI", () => {
        // First-Principles Benchmark Parameters (500 -> 125 ppm, 75% max single-stage removal):
        // Feed: 500 ppm, Target: 125 ppm, Flow: 10 L/min, Recovery: 80%, V_cell: 1.2V
        // J_target: 50 A/m², A_pair: 350 cm², Lambda: 0.82, cellPairs: 102
        // Derived values:
        // m_dot = (10 / 60000) * 375 = 0.0625 g/s
        // n_dot = 0.0625 / 58.44 = 0.00106947 mol/s
        // I_faraday = (0.00106947 * 96485) / 0.82 = 125.84 A
        // N_pairs = 102 -> I_cell = 125.84 / 102 = 1.2337 A
        // V_stack = 102 * 1.2 = 122.40 V
        // Power = 122.40 * 1.2337 = 151.01 W
        // SEC_elec = (0.15101 kW) / (0.480 m³/h) = 0.3146 kWh/m³

        const res = calculateCDIModel({
            flowRate: 10,
            tds: 500,
            targetTds: 125,
            voltage: 1.2,
            cellPairs: 102,
            waterRecovery: 80
        });

        expect(res.massRemovalRateGs).toBeCloseTo(0.0625, 4);
        expect(res.molarRemovalRateMols).toBeCloseTo(0.0010695, 5);
        expect(res.totalFaradayCurrent).toBeCloseTo(125.84, 1);
        expect(res.cellPairs).toBe(102);
        expect(res.cellCurrent).toBeCloseTo(1.23, 2);
        expect(res.voltageStack).toBe(122.40);
        expect(res.power).toBeCloseTo(151.0, 0);
        expect(res.secElectrical).toBeCloseTo(0.3138, 3);
        expect(res.envelopeStatus).toBe("VALIDATED");
    });

    it("verifies operating envelope status categorization", () => {
        // Validated case (< 1000 ppm, <= 1.2V, <= 75% removal)
        const valRes = calculateCDIModel({ tds: 500, targetTds: 150, voltage: 1.2 });
        expect(valRes.envelopeStatus).toBe("VALIDATED");

        // Extrapolated case (> 1000 ppm, <= 1.5V)
        const extRes = calculateCDIModel({ tds: 1500, targetTds: 500, voltage: 1.4 });
        expect(extRes.envelopeStatus).toBe("EXTRAPOLATED");

        // Outside envelope case (> 3000 ppm)
        const outRes = calculateCDIModel({ tds: 4000, voltage: 1.6 });
        expect(outRes.envelopeStatus).toBe("OUTSIDE_ENVELOPE");
    });

    it("rejects invalid inputs with descriptive error messages", () => {
        expect(() => calculateCDIModel({ flowRate: 0, tds: 500 })).toThrow("Invalid inputs");
        expect(() => calculateCDIModel({ flowRate: 10, tds: -100 })).toThrow("Invalid inputs");
    });
});
