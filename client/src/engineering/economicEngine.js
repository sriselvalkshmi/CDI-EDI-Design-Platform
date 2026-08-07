"use strict";

/**
 * Energy & Environmental Engineering Analysis Engine
 * Calculates stack electrical power, SEC (kWh/m³), carbon footprint, and energy consumption metrics.
 * Note: Commercial BOM pricing and dollar CAPEX figures have been removed to focus strictly on technical engineering physics.
 */
export function calculateEconomics(engineering = {}, feedWater = {}) {
    const powerStack = Number(engineering.power ?? 0); // W
    const pumpPower = Number(engineering.pumpPower ?? 0); // W
    const auxiliaryPower = 5.0; // W (sensors & controllers)
    const totalPower = powerStack + pumpPower + auxiliaryPower; // W

    const flowRateLmin = Number(engineering.flowRate ?? feedWater.flowRate ?? 10); // L/min
    const flowRateM3h = (flowRateLmin / 1000) * 60; // m³/h

    // 1. Specific Energy Consumption SEC (kWh/m³)
    const sec = flowRateM3h > 0 ? (totalPower / 1000) / flowRateM3h : 0; // kWh/m³

    // 2. Carbon Footprint (kg CO2 / m³)
    // Standard grid carbon intensity ~ 0.5 kg CO2/kWh
    const carbonIntensity = 0.5; // kg CO2/kWh
    const carbonFootprint = sec * carbonIntensity; // kg CO2/m³

    // Annual energy consumption (kWh/year) for 8000 operational hours
    const operatingHoursPerYear = 8000;
    const annualEnergyKwh = (totalPower / 1000) * operatingHoursPerYear;
    const annualWaterVolumeM3 = flowRateM3h * operatingHoursPerYear;

    return {
        powerStack: Number(powerStack.toFixed(2)),
        pumpPower: Number(pumpPower.toFixed(2)),
        auxiliaryPower: Number(auxiliaryPower.toFixed(2)),
        totalPower: Number(totalPower.toFixed(2)),
        sec: Number(sec.toFixed(4)),
        carbonFootprint: Number(carbonFootprint.toFixed(4)),
        annualEnergyKwh: Number(annualEnergyKwh.toFixed(1)),
        annualWaterVolumeM3: Number(annualWaterVolumeM3.toFixed(1))
    };
}

export default calculateEconomics;
