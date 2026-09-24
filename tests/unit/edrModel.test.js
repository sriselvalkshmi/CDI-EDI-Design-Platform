import { describe, it, expect } from "vitest";
import { calculateEDRModel, calculateEDRRecovery } from "../../shared/engineering/models/edrModel.js";

describe("Electrodialysis Reversal (EDR) First-Principles Model", () => {
    const scalingFeed = {
        tds: 4500,
        flowRate: 15, // L/min
        temperature: 25,
        hardness: 550, // mg/L as CaCO3 - High scaling!
        ph: 7.9,
        targetTds: 450,
        targetRecovery: 85
    };

    it("derives net water recovery accounting for transition flush purge volume", () => {
        const baseEdRecovery = 90.0;
        const flushSec = 90; // 1.5 min
        const cycleMin = 20;

        const edrRecovery = calculateEDRRecovery({
            baseRecoveryPct: baseEdRecovery,
            flushDurationSec: flushSec,
            reversalPeriodMin: cycleMin
        });

        // Net recovery is reduced by the purge fraction
        expect(edrRecovery).toBeLessThan(baseEdRecovery);
        expect(edrRecovery).toBeGreaterThanOrEqual(80.0);
        // Specifically: 90 * (1 - 1.5/20) = 90 * 0.925 = 83.25%
        expect(edrRecovery).toBeCloseTo(83.25, 1);
    });

    it("operates successfully in high-scaling waters where standard ED would scale", () => {
        const result = calculateEDRModel({
            feedWater: scalingFeed,
            cellPairs: 90,
            electrodeArea: 350,
            reversalPeriodMin: 20,
            flushDurationSec: 90
        });

        expect(result.technology).toBe("EDR");
        expect(result.inSituScaleDissolutionActive).toBe(true);
        expect(result.scaleRiskLevel).toBe("CONTROLLED_BY_REVERSAL");
        expect(result.chemicalAntiscalantDosingRequired).toBe(false);
    });

    it("calculates dual-polarity voltage and power requirements", () => {
        const result = calculateEDRModel({
            feedWater: scalingFeed,
            cellPairs: 90,
            electrodeArea: 350
        });

        expect(result.voltageStack).toBeGreaterThan(0);
        expect(result.forwardVoltageStack).toBeGreaterThan(0);
        expect(result.reverseVoltageStack).toBeLessThan(0);
        expect(Math.abs(result.reverseVoltageStack)).toBeCloseTo(result.forwardVoltageStack, 1);
        expect(result.power).toBeGreaterThan(0);
        expect(result.sec).toBeGreaterThan(0);
    });

    it("validates transition flush off-spec water mass balance", () => {
        const result = calculateEDRModel({
            feedWater: scalingFeed,
            cellPairs: 90,
            electrodeArea: 350,
            reversalPeriodMin: 20,
            flushDurationSec: 90
        });

        expect(result.flushDivertVolumeLitersPerCycle).toBeGreaterThan(0);
        expect(result.netWaterRecoveryPct).toBeLessThan(result.grossWaterRecoveryPct);
        expect(result.outletTds).toBeLessThan(scalingFeed.tds);
    });
});
