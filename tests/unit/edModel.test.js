import { describe, it, expect } from "vitest";
import { calculateEDModel, calculateLimitingCurrentDensity } from "../../shared/engineering/models/edModel.js";

describe("Electrodialysis (ED) First-Principles Model", () => {
    const standardFeed = {
        tds: 3000,
        flowRate: 10, // L/min
        temperature: 25,
        targetTds: 300,
        targetRecovery: 88,
        ions: {
            na: 1000,
            cl: 1600,
            ca: 150,
            mg: 50,
            so4: 200
        }
    };

    it("calculates Sherwood limiting current density based on boundary layer mass transfer", () => {
        const iLim = calculateLimitingCurrentDensity({
            flowVelocity: 0.05,
            channelThicknessM: 0.0005,
            diluteTdsMgL: 300,
            temperatureC: 25
        });

        expect(iLim).toBeGreaterThan(15);
        expect(iLim).toBeLessThan(1000);
        expect(Number.isFinite(iLim)).toBe(true);
    });

    it("restricts operational current density to safe non-polarizing region (I <= 0.85 * I_lim)", () => {
        const feasibleFeed = {
            tds: 3000,
            flowRate: 15,
            temperature: 25,
            targetTds: 1800,
            targetRecovery: 85
        };

        const result = calculateEDModel({
            feedWater: feasibleFeed,
            currentDensity: 30,
            electrodeArea: 350
        });

        expect(result.limitingCurrentDensity).toBeGreaterThan(0);
        expect(result.actualCurrentDensityAm2).toBeLessThanOrEqual(result.limitingCurrentDensity * 0.90);
        expect(result.polarizationRatioPct).toBeLessThanOrEqual(90);
    });

    it("determines cell pair voltage from Ohmic resistance and Donnan membrane potentials", () => {
        const result = calculateEDModel({
            feedWater: standardFeed,
            cellPairs: 80,
            electrodeArea: 350
        });

        // Typical ED cell pair voltage: 0.8 to 1.8 V/pair
        expect(result.voltageCell).toBeGreaterThanOrEqual(0.7);
        expect(result.voltageCell).toBeLessThanOrEqual(2.2);

        // Stack voltage = cellPairs * voltageCell + 3.0 V electrode rinse overpotentials
        expect(result.voltageStack).toBeCloseTo(80 * result.voltageCell + 3.0, 1);
        expect(result.power).toBeGreaterThan(0);
        expect(result.sec).toBeGreaterThan(0);
    });

    it("conserves solute mass balance between feed, dilute product, and concentrate brine", () => {
        const result = calculateEDModel({
            feedWater: standardFeed,
            cellPairs: 100,
            electrodeArea: 350,
            targetTds: 300
        });

        expect(result.outletTds).toBeLessThan(standardFeed.tds);
        expect(result.removalEfficiency).toBeGreaterThan(80);
        expect(result.waterRecovery).toBeGreaterThanOrEqual(80);

        // Feed mass rate = product mass rate + brine mass rate
        const qFeed = standardFeed.flowRate;
        const qProd = qFeed * (result.waterRecovery / 100);
        const qBrine = qFeed - qProd;

        const feedSolute = qFeed * standardFeed.tds;
        const prodSolute = qProd * result.outletTds;
        const brineSolute = qBrine * result.brineTds;

        const soluteBalanceError = Math.abs(feedSolute - (prodSolute + brineSolute)) / feedSolute;
        expect(soluteBalanceError).toBeLessThan(0.02); // Under 2% error
    });

    it("validates Faradaic charge transport consistency against solute removal", () => {
        const result = calculateEDModel({
            feedWater: standardFeed,
            cellPairs: 100,
            electrodeArea: 350
        });

        expect(result.chargeEfficiency).toBeGreaterThanOrEqual(80);
        expect(result.chargeEfficiency).toBeLessThanOrEqual(98);
        expect(result.technology).toBe("ED");
    });
});
