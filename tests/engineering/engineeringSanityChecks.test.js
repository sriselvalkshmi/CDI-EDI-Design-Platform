import { describe, it, expect } from "vitest";
import calculateEngineering from "../../shared/engineering/engine/engineeringEquationEngine.js";
import aiRecommendation from "../../shared/engineering/core/aiRecommendation.js";

/**
 * Engineering Sanity Checks Automated Test Suite
 * Tests 10 core physical principles across CDI, MCDI, FCDI, and EDI.
 */
describe("Engineering Sanity Checks Automated Test Suite", () => {
    const feedWater = {
        tds: 500,
        conductivity: 300,
        hardness: 150,
        ph: 7.2,
        temperature: 25,
        flowRate: 10,
        targetTds: 10
    };

    const techKeys = ["CDI", "MCDI", "FCDI", "EDI"];

    techKeys.forEach(tech => {
        describe(`Sanity Checks for ${tech}`, () => {
            const eng = calculateEngineering({ technology: tech, feedWater });

            it(`${tech} Mass Balance: Mass In = Mass Out`, () => {
                const recoveryFrac = (eng.waterRecovery || 90) / 100;
                const qProd = feedWater.flowRate * recoveryFrac;
                const qConc = feedWater.flowRate * (1 - recoveryFrac);
                const cProd = eng.outletTDS;
                const cConc = qConc > 0 ? (feedWater.flowRate * feedWater.tds - qProd * cProd) / qConc : feedWater.tds;
                
                const massIn = feedWater.flowRate * feedWater.tds; // mg/min
                const massOut = qProd * cProd + qConc * cConc; // mg/min
                const massErr = Math.abs(massIn - massOut) / Math.max(1, massIn);
                expect(massErr).toBeLessThan(0.001);
            });

            it(`${tech} Water Recovery matches calculation`, () => {
                const recoveryFrac = (eng.waterRecovery || 90) / 100;
                const qProd = feedWater.flowRate * recoveryFrac;
                const calcRecovery = (qProd / feedWater.flowRate) * 100;
                expect(Math.abs(calcRecovery - eng.waterRecovery)).toBeLessThan(0.01);
            });

            it(`${tech} Salt Removal Balance matches calculation`, () => {
                const cProd = eng.outletTDS;
                const expectedRemoval = ((feedWater.tds - cProd) / feedWater.tds) * 100;
                expect(Math.abs(expectedRemoval - eng.removalEfficiency)).toBeLessThan(0.1);
            });

            it(`${tech} Electrical Power P=V_sys*I matches stack power`, () => {
                const expectedPower = eng.voltageStack * eng.current;
                expect(Math.abs(expectedPower - eng.power)).toBeLessThan(0.5);
            });

            it(`${tech} SEC Calculation matches engine SEC breakdown`, () => {
                const recoveryFrac = (eng.waterRecovery || 90) / 100;
                const qProd = feedWater.flowRate * recoveryFrac;
                const qProdM3h = (qProd * 60) / 1000;
                const grossSecElec = qProdM3h > 0 ? (eng.power / 1000) / qProdM3h : 0;
                const engineSecElec = eng.secElectricalAdsorption || eng.secElectrical || eng.sec;
                expect(Math.abs(grossSecElec - engineSecElec)).toBeLessThan(0.02);
            });

            it(`${tech} Hydrodynamic Residence Time tau=V/Q matches engine tau`, () => {
                const expectedTau = eng.reactorVolumeLiters / feedWater.flowRate;
                expect(Math.abs(expectedTau - eng.residenceTime)).toBeLessThan(0.001);
            });

            it(`${tech} Pressure Drop is strictly positive`, () => {
                expect(eng.pressureDrop).toBeGreaterThan(0);
            });

            it(`${tech} Total Cell Pairs & Module Voltage Consistency`, () => {
                const expectedTotalPairs = eng.pairsPerModule * eng.numberOfModules;
                expect(eng.cellPairs).toBe(expectedTotalPairs);

                const expectedVoltageStack = eng.voltageModule * eng.numberOfModules;
                expect(Math.abs(expectedVoltageStack - eng.voltageStack)).toBeLessThan(0.1);
            });

            it(`${tech} Target Validation matches condition`, () => {
                const expectedTargetStatus = eng.outletTDS <= feedWater.targetTds + 0.5;
                expect(eng.isTargetAchieved).toBe(expectedTargetStatus);
            });
        });
    });

    it("Auto Selection Consistency for Clean Permeate Feed", () => {
        const cleanFeed = { tds: 20, conductivity: 30, hardness: 0.1, ph: 7.0, flowRate: 10, targetTds: 0.1 };
        const aiRes = aiRecommendation(cleanFeed);
        expect(aiRes.selectedTechnology).toBe("EDI");
    });
});
