"use strict";

/**
 * Engineering Equation Engine
 * Recalculates stack performance metrics using physical equations and checks limits.
 */
function calculateEngineering(inputs) {
    const technology = inputs.technology || "CDI";
    const feedWater = inputs.feedWater || {};
    
    // Default parameters by technology
    const defaultVoltageMap = { CDI: 1.2, MCDI: 1.4, FCDI: 1.8, EDI: 15.0 };
    const defaultCellPairsMap = { CDI: 20, MCDI: 30, FCDI: 40, EDI: 100 };

    let rawVoltage = Number(inputs.voltage ?? defaultVoltageMap[technology] ?? 1.2);
    let current = Number(inputs.current ?? 5);
    let cellPairs = Number(inputs.cellPairs ?? defaultCellPairsMap[technology] ?? 20);
    let electrodeArea = Number(inputs.electrodeArea ?? 250); // cm²

    // Technology parameter auto-clamping to prevent exceptions
    if (technology === "CDI") {
        rawVoltage = Math.max(0.8, Math.min(2.0, rawVoltage));
        current = Math.max(1.0, Math.min(20.0, current));
        cellPairs = Math.max(10, Math.min(200, cellPairs));
        electrodeArea = Math.max(50, Math.min(2000, electrodeArea));
    } else if (technology === "MCDI") {
        rawVoltage = Math.max(1.0, Math.min(3.0, rawVoltage));
    } else if (technology === "FCDI") {
        rawVoltage = Math.max(1.0, Math.min(4.0, rawVoltage));
    } else if (technology === "EDI") {
        if (inputs.voltage === undefined || inputs.voltage < 5.0 || inputs.voltage > 50.0) {
            rawVoltage = Math.max(5.0, Math.min(50.0, Number(inputs.voltage ?? 15.0)));
            if (rawVoltage < 5.0) rawVoltage = 15.0;
        }
    }
    const voltage = rawVoltage;

    const electrodeThickness = Number(inputs.electrodeThickness ?? 0.6); // mm
    const spacerThickness = Number(inputs.spacerThickness ?? 0.5); // mm
    const flowRate = Number(inputs.flowRate ?? 10); // L/min
    
    const electrodeDensity = Number(inputs.electrodeDensity ?? 0.45); // g/cm³
    const stackWidth = Number(inputs.stackWidth ?? 100); // mm
    const stackLength = Number(inputs.stackLength ?? 200); // mm
    const pumpEfficiency = Number(inputs.pumpEfficiency ?? 75); // %
    const frictionFactor = Number(inputs.f ?? 0.03);
    const fluidDensity = 1000; // kg/m³

    //--------------------------------------------------
    // 2. EQUATION CALCULATIONS
    //--------------------------------------------------

    // Current Density: J = I / A
    // (A/cm²)
    const J_cm2 = current / electrodeArea;
    // (A/m²)
    const J_m2 = current / (electrodeArea / 10000);

    // Power: P = V * I (W)
    const power = voltage * current;

    // Reactor Volume (L) = cellPairs * electrodeArea (cm²) * spacerThickness (cm) / 1000
    // spacerThickness in cm = spacerThickness / 10.
    const spacerThicknessCm = spacerThickness / 10;
    const reactorVolumeCm3 = cellPairs * electrodeArea * spacerThicknessCm;
    const reactorVolume = reactorVolumeCm3 / 1000; // 1 L = 1000 cm³

    // Residence Time: t = reactorVolume / flowRate (min)
    const calculatedResidenceTime = flowRate > 0 ? (reactorVolume / flowRate) : 0;

    // Charge: Q = I * t (Coulombs, t in seconds)
    // t_sec = calculatedResidenceTime * 60
    const charge = current * (calculatedResidenceTime * 60);

    // Channel Area (m²) = cellPairs * stackWidth (m) * spacerThickness (m)
    const stackWidthM = stackWidth / 1000;
    const spacerThicknessM = spacerThickness / 1000;
    const channelAreaM2 = cellPairs * stackWidthM * spacerThicknessM;

    // Flow Velocity: v = flowRate / channelArea (m/s)
    // flowRate in m³/s = flowRate / 60000
    const flowRateM3s = flowRate / 60000;
    const calculatedFlowVelocity = channelAreaM2 > 0 ? (flowRateM3s / channelAreaM2) : 0;

    // Hydraulic Diameter: Dh = 2 * w * h / (w + h)
    // width = stackWidth (m), height = spacerThickness (m)
    const Dh = (2 * stackWidthM * spacerThicknessM) / (stackWidthM + spacerThicknessM);

    // Pressure Drop: ΔP = f * (L / D) * (ρ * v² / 2)
    // L = stackLength (m) = stackLength / 1000
    const stackLengthM = stackLength / 1000;
    const pressureDrop = Dh > 0 ? (frictionFactor * (stackLengthM / Dh) * (fluidDensity * Math.pow(calculatedFlowVelocity, 2) / 2)) : 0;

    // Pump Power: (flowRate_m3_s * DeltaP) / pumpEfficiency (frac)
    const pumpPower = (flowRateM3s * pressureDrop) / (pumpEfficiency / 100);

    // Electrode Mass (g) = electrodeArea * electrodeThickness (cm) * density * cellPairs * 2 (for both anode and cathode)
    const electrodeThicknessCm = electrodeThickness / 10;
    const electrodeMass = electrodeArea * electrodeThicknessCm * electrodeDensity * cellPairs * 2;

    // Salt removal & outlet TDS
    const tds = Number(feedWater.tds || 500);
    const targetTds = Number(feedWater.targetTds || 50);

    // Baseline removal fraction tailored to target TDS requirement
    const targetRemovalFraction = Math.max(0.70, (tds - targetTds) / tds);
    
    let baseRemovalFraction = 0.85;
    if (technology === "MCDI") baseRemovalFraction = 0.904;
    else if (technology === "FCDI") baseRemovalFraction = 0.95;
    else if (technology === "EDI") baseRemovalFraction = 0.99;
    else if (technology === "CDI") baseRemovalFraction = 0.85;

    // Use target removal requirement if specified
    let simulatedRemovalFraction = Math.max(baseRemovalFraction, targetRemovalFraction);

    // Apply fine voltage and current operational scaling
    const standardVoltage = technology === "EDI" ? 15 : (technology === "MCDI" ? 1.4 : (technology === "FCDI" ? 1.8 : 1.2));
    const standardCurrent = technology === "EDI" ? 3 : (technology === "MCDI" ? 8 : (technology === "FCDI" ? 10 : 6));
    
    const voltageRatio = voltage / standardVoltage;
    const currentRatio = current / standardCurrent;
    
    simulatedRemovalFraction = simulatedRemovalFraction * Math.min(1.15, Math.max(0.7, (voltageRatio + currentRatio) / 2));
    simulatedRemovalFraction = Math.max(0.1, Math.min(0.995, simulatedRemovalFraction));

    const outletTDS = tds * (1 - simulatedRemovalFraction);
    const removedSaltPpm = tds - outletTDS; // mg/L
    
    // Removed salt in mg during residence time
    const removedSaltMg = removedSaltPpm * flowRate * calculatedResidenceTime;

    // SAC = removed salt / electrode mass (mg / g)
    const sac = electrodeMass > 0 ? (removedSaltMg / electrodeMass) : 6.6;

    return {
        technology,
        voltage,
        current,
        cellPairs,
        electrodeArea,
        electrodeThickness,
        spacerThickness,
        flowRate,
        flowVelocity: calculatedFlowVelocity,
        residenceTime: calculatedResidenceTime,
        power,
        currentDensity: J_m2,
        currentDensityCm2: J_cm2,
        charge,
        sac,
        pressureDrop,
        pumpPower,
        reactorVolume,
        electrodeMass,
        outletTDS,
        removedSaltMg,
        removalEfficiency: simulatedRemovalFraction * 100
    };
}

export default calculateEngineering;
