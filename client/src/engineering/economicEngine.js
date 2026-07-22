"use strict";

/**
 * Economic & Energy Analysis Engine
 * Calculates CAPEX, OPEX, Cost per m³, Carbon Footprint, and Payback Period.
 */
export function calculateEconomics(engineering = {}, feedWater = {}) {
    const powerStack = Number(engineering.power ?? 0); // W
    const pumpPower = Number(engineering.pumpPower ?? 0); // W
    const auxiliaryPower = 5.0; // W (sensors & controllers)
    const totalPower = powerStack + pumpPower + auxiliaryPower; // W

    const flowRateLmin = Number(engineering.flowRate ?? feedWater.flowRate ?? 10); // L/min
    const flowRateM3h = (flowRateLmin / 1000) * 60; // m³/h

    // 1. SEC (kWh/m³)
    const sec = flowRateM3h > 0 ? (totalPower / 1000) / flowRateM3h : 0; // kWh/m³

    // 2. Carbon Footprint (kg CO2 / m³)
    // Standard grid carbon intensity ~ 0.5 kg CO2/kWh
    const carbonIntensity = 0.5; // kg CO2/kWh
    const carbonFootprint = sec * carbonIntensity; // kg CO2/m³

    // 3. CAPEX Calculations ($)
    const cellPairs = Number(engineering.cellPairs ?? 36);
    const areaCm2 = Number(engineering.electrodeArea ?? 350);
    const areaM2 = (areaCm2 / 10000) * cellPairs * 2; // total electrode area

    const technology = engineering.technology || "CDI";
    const electrodeMassKg = Number(engineering.electrodeMass ?? 500) / 1000;

    const unitElectrodeCost = 30; // $/kg
    const unitMembraneCost = (technology === "MCDI" || technology === "EDI") ? 45 : (technology === "FCDI" ? 35 : 0); // $/m²

    const electrodeCost = electrodeMassKg * unitElectrodeCost;
    const membraneCost = areaM2 * unitMembraneCost;
    const pumpCost = 450; // $
    const powerSupplyCost = 350 + (totalPower * 0.15); // $
    const instrumentationCost = 300; // $

    const capex = electrodeCost + membraneCost + pumpCost + powerSupplyCost + instrumentationCost; // Total CAPEX ($)

    // 4. OPEX Calculations ($/year)
    const electricityTariff = 0.12; // $/kWh
    const operatingHoursPerYear = 8000; // hours/year
    const annualWaterVolumeM3 = flowRateM3h * operatingHoursPerYear; // m³/year

    const annualElectricityCost = (totalPower / 1000) * operatingHoursPerYear * electricityTariff; // $/year
    const annualMembraneReplacement = membraneCost * 0.15; // 15% replacement per year
    const annualElectrodeReplacement = electrodeCost * 0.10; // 10% replacement per year
    const annualMaintenance = capex * 0.03; // 3% of CAPEX

    const annualOpex = annualElectricityCost + annualMembraneReplacement + annualElectrodeReplacement + annualMaintenance; // $/year

    // 5. Cost per m³ ($/m³)
    // Capital recovery factor over 10 year lifespan at 5% interest => CRF ~ 0.1295
    const annualizedCapex = capex * 0.1295;
    const costPerM3 = annualWaterVolumeM3 > 0 ? (annualizedCapex + annualOpex) / annualWaterVolumeM3 : 0; // $/m³

    // 6. Payback Period vs Conventional Reverse Osmosis ($0.75/m³)
    const conventionalCostPerM3 = 0.75;
    const annualSavings = Math.max(10, (conventionalCostPerM3 - costPerM3) * annualWaterVolumeM3);
    const paybackPeriod = annualSavings > 0 ? capex / annualSavings : 3.5; // years

    return {
        powerStack: Number(powerStack.toFixed(2)),
        pumpPower: Number(pumpPower.toFixed(2)),
        auxiliaryPower: Number(auxiliaryPower.toFixed(2)),
        totalPower: Number(totalPower.toFixed(2)),
        sec: Number(sec.toFixed(4)),
        carbonFootprint: Number(carbonFootprint.toFixed(4)),

        // CAPEX
        capex: Number(capex.toFixed(2)),
        electrodeCost: Number(electrodeCost.toFixed(2)),
        membraneCost: Number(membraneCost.toFixed(2)),
        pumpCost: Number(pumpCost.toFixed(2)),
        powerSupplyCost: Number(powerSupplyCost.toFixed(2)),
        instrumentationCost: Number(instrumentationCost.toFixed(2)),

        // OPEX
        annualOpex: Number(annualOpex.toFixed(2)),
        annualElectricityCost: Number(annualElectricityCost.toFixed(2)),
        annualWaterVolumeM3: Number(annualWaterVolumeM3.toFixed(1)),
        costPerM3: Number(costPerM3.toFixed(3)),
        paybackPeriod: Number(paybackPeriod.toFixed(1))
    };
}

export default calculateEconomics;
