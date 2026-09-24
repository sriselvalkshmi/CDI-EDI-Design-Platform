import { describe, it, expect } from "vitest";
import {
    calculateTEA,
    validateEconomicInputs,
    DEFAULT_TEA_INPUTS
} from "../../shared/engineering/tea/technoEconomicEngine.js";
import { runScenarioAnalysis } from "../../shared/engineering/core/designExplorerEngine.js";

describe("Techno-Economic Analysis (TEA) Engine Test Suite", () => {

    const referenceEngineering = {
        technology: "MCDI",
        feedFlow: 10,
        flowRate: 10,
        productFlowLmin: 9.52,
        waterRecoveryPct: 95.2,
        secElectricalGross: 0.040,
        stackElectricalPowerW: 22.8,
        modules: 1,
        cellPairs: 34,
        activeArea: 350
    };

    it("verifies TEA default inputs are sensible, non-negative, and valid", () => {
        expect(DEFAULT_TEA_INPUTS.electricityTariff).toBe(8.00);
        expect(DEFAULT_TEA_INPUTS.operatingHoursPerDay).toBe(24);
        expect(DEFAULT_TEA_INPUTS.operatingDaysPerYear).toBe(350);
        expect(DEFAULT_TEA_INPUTS.equipmentCost).toBeGreaterThan(0);
        expect(DEFAULT_TEA_INPUTS.stackCost).toBeGreaterThan(0);
        expect(DEFAULT_TEA_INPUTS.pumpCost).toBeGreaterThan(0);
        expect(DEFAULT_TEA_INPUTS.powerSupplyCost).toBeGreaterThan(0);
        expect(DEFAULT_TEA_INPUTS.membraneElectrodeCost).toBeGreaterThan(0);
        expect(DEFAULT_TEA_INPUTS.installationCost).toBeGreaterThan(0);
        expect(DEFAULT_TEA_INPUTS.annualMaintenanceCost).toBeGreaterThan(0);
        expect(DEFAULT_TEA_INPUTS.annualReplacementCost).toBeGreaterThan(0);

        const val = validateEconomicInputs(DEFAULT_TEA_INPUTS);
        expect(val.isValid).toBe(true);
        expect(val.status).toBe("ECONOMIC ANALYSIS: READY");
        expect(val.errors.length).toBe(0);
    });

    it("evaluates reference case with exact formula verification", () => {
        // Feed Flow: 10 L/min, Product Flow: 9.52 L/min, Recovery: 95.2%, Gross SEC: 0.040 kWh/m³
        // Tariff: ₹8.00/kWh, Hours: 24 h/day, Days: 350 days/year
        const tea = calculateTEA({
            engineering: referenceEngineering,
            economicInputs: DEFAULT_TEA_INPUTS
        });

        // 1. Annual Product Water: 9.52 * 60 * 24 * 350 / 1000 = 4798.08 m³/year
        const expectedAnnualWater = (9.52 * 60 * 24 * 350) / 1000;
        expect(tea.annualProductWaterM3).toBeCloseTo(expectedAnnualWater, 2);
        expect(tea.annualProductWaterM3).toBeCloseTo(4798.08, 1);

        // 2. Annual Energy Consumption: 0.040 kWh/m³ * 4798.08 m³/year = 191.9232 kWh/year
        const expectedAnnualEnergy = 0.040 * expectedAnnualWater;
        expect(tea.annualEnergyConsumptionKwh).toBeCloseTo(expectedAnnualEnergy, 2);
        expect(tea.annualEnergyConsumptionKwh).toBeCloseTo(191.92, 1);

        // 3. Annual Energy Cost: 191.9232 * 8.00 = ₹ 1535.39/year
        const expectedEnergyCost = expectedAnnualEnergy * 8.00;
        expect(tea.annualEnergyCostInr).toBeCloseTo(expectedEnergyCost, 2);
        expect(tea.annualEnergyCostInr).toBeCloseTo(1535.39, 1);

        // 4. CAPEX: 50000 + 120000 + 35000 + 25000 + 40000 + 30000 = ₹ 300,000
        const expectedCapex = 50000 + 120000 + 35000 + 25000 + 40000 + 30000;
        expect(tea.capexInr).toBe(expectedCapex);
        expect(tea.capexInr).toBe(300000);

        // 5. Annual OPEX: Energy Cost + 15000 + 10000 = 1535.39 + 25000 = ₹ 26,535.39/year
        const expectedAnnualOpex = expectedEnergyCost + 15000 + 10000;
        expect(tea.annualOpexInr).toBeCloseTo(expectedAnnualOpex, 2);

        // 6. Operating Treatment Cost: Annual OPEX / Annual Product Water
        // 26535.3856 / 4798.08 = 5.5304 ₹/m³
        const expectedOperatingTreatmentCost = expectedAnnualOpex / expectedAnnualWater;
        expect(tea.operatingTreatmentCostInrPerM3).toBeCloseTo(expectedOperatingTreatmentCost, 2);
        expect(tea.operatingTreatmentCostInrPerM3).toBeCloseTo(5.53, 1);

        // Engineering Basis preservation
        expect(tea.engineeringBasis.technology).toBe("MCDI");
        expect(tea.engineeringBasis.productFlowLmin).toBe(9.52);
        expect(tea.engineeringBasis.recoveryPct).toBe(95.2);
        expect(tea.engineeringBasis.grossSecKwhM3).toBe(0.040);
        expect(tea.validation.status).toBe("ECONOMIC ANALYSIS: READY");
    });

    it("rejects incomplete or invalid economic inputs gracefully", () => {
        // Missing tariff
        const missingTariff = validateEconomicInputs({ ...DEFAULT_TEA_INPUTS, electricityTariff: "" });
        expect(missingTariff.isValid).toBe(false);
        expect(missingTariff.status).toBe("ECONOMIC ANALYSIS: INCOMPLETE — ENTER REQUIRED COST INPUTS");
        expect(missingTariff.errors.some(e => e.includes("Electricity tariff is required"))).toBe(true);

        // Negative tariff
        const negTariff = validateEconomicInputs({ ...DEFAULT_TEA_INPUTS, electricityTariff: -5 });
        expect(negTariff.isValid).toBe(false);
        expect(negTariff.errors.some(e => e.includes("strictly greater than 0"))).toBe(true);

        // Invalid operating hours (> 24)
        const excessiveHours = validateEconomicInputs({ ...DEFAULT_TEA_INPUTS, operatingHoursPerDay: 26 });
        expect(excessiveHours.isValid).toBe(false);
        expect(excessiveHours.errors.some(e => e.includes("between 0.1 and 24 hours/day"))).toBe(true);

        // Invalid operating days (> 365)
        const excessiveDays = validateEconomicInputs({ ...DEFAULT_TEA_INPUTS, operatingDaysPerYear: 400 });
        expect(excessiveDays.isValid).toBe(false);
        expect(excessiveDays.errors.some(e => e.includes("between 1 and 365 days/year"))).toBe(true);

        // Negative CAPEX components
        const negEquipment = validateEconomicInputs({ ...DEFAULT_TEA_INPUTS, equipmentCost: -1000 });
        expect(negEquipment.isValid).toBe(false);
        expect(negEquipment.errors.some(e => e.includes("Equipment cost must be non-negative"))).toBe(true);
    });

    it("verifies Design Explorer integrates TEA without mutating engineering rankings", () => {
        const baseline = {
            feedWater: {
                tds: 500,
                flowRate: 10,
                targetTds: 10,
                targetRecovery: 95.0,
                hardness: 150,
                conductivity: 769
            },
            technology: "MCDI",
            optimizationInputs: {
                voltage: 1.4,
                cellPairs: 34,
                electrodeArea: 350
            }
        };

        const analysis = runScenarioAnalysis({
            baseline,
            parameter: "Feed TDS",
            values: [200, 400, 600, 800],
            teaInputs: DEFAULT_TEA_INPUTS
        });

        expect(analysis.scenarios.length).toBeGreaterThan(0);
        analysis.scenarios.forEach((sc) => {
            // Check TEA properties are attached
            expect(sc.capex).toBeGreaterThan(0);
            expect(sc.annualOpex).toBeGreaterThan(0);
            expect(sc.energyCost).toBeGreaterThan(0);
            expect(sc.operatingTreatmentCost).toBeGreaterThan(0);
            expect(sc.tea).toBeDefined();
            expect(sc.tea.validation.status).toBe("ECONOMIC ANALYSIS: READY");

            // Check engineering outputs remain intact
            expect(sc.productFlow).toBeGreaterThan(0);
            expect(sc.recovery).toBeGreaterThan(0);
            expect(sc.sec).toBeGreaterThan(0);
            expect(sc.feasibility).toBeDefined();
        });
    });
});
