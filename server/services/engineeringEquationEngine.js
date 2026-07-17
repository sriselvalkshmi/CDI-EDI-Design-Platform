"use strict";

/**
 * Engineering Equation Engine
 * Recalculates stack performance metrics using physical equations and checks limits.
 */
function calculateEngineering(inputs) {
    const technology = inputs.technology || "CDI";
    const feedWater = inputs.feedWater || {};
    
    // Parse parameters
    const voltage = Number(inputs.voltage ?? 1.2);
    const current = Number(inputs.current ?? 5);
    const cellPairs = Number(inputs.cellPairs ?? 20);
    const electrodeArea = Number(inputs.electrodeArea ?? 250); // cm²
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
    // 1. VALIDATION OF OPERATING LIMITS
    //--------------------------------------------------
    const errors = [];
    
    // Technology-specific limits
    if (technology === "CDI") {
        if (voltage < 0.8 || voltage > 2.0) {
            errors.push(`CDI voltage must be between 0.8 V and 2.0 V. Got ${voltage} V.`);
        }
        if (current < 1.0 || current > 20.0) {
            errors.push(`CDI current must be between 1.0 A and 20.0 A. Got ${current} A.`);
        }
        if (cellPairs < 10 || cellPairs > 200) {
            errors.push(`CDI Cell pairs must be between 10 and 200. Got ${cellPairs}.`);
        }
        if (electrodeArea < 50 || electrodeArea > 2000) {
            errors.push(`CDI Electrode area must be between 50 cm² and 2000 cm². Got ${electrodeArea} cm².`);
        }
    } else if (technology === "MCDI") {
        if (voltage < 1.0 || voltage > 3.0) {
            errors.push(`MCDI voltage must be between 1.0 V and 3.0 V. Got ${voltage} V.`);
        }
    } else if (technology === "EDI") {
        if (voltage < 5.0 || voltage > 50.0) {
            errors.push(`EDI voltage must be between 5.0 V and 50.0 V. Got ${voltage} V.`);
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join(" | "));
    }

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
    const tds = feedWater.tds || 500;
    const targetTds = feedWater.targetTds || 50;
    
    // Estimate expected removal fraction based on technology standard
    let removalFraction = 0.70;
    if (technology === "MCDI") removalFraction = 0.85;
    else if (technology === "FCDI") removalFraction = 0.92;
    else if (technology === "EDI") removalFraction = 0.98;

    // If manual mode modifies current or voltage, adjust removal fraction slightly as a proxy
    const standardVoltage = technology === "EDI" ? 15 : (technology === "MCDI" ? 1.4 : 1.2);
    const standardCurrent = 5;
    const voltageRatio = voltage / standardVoltage;
    const currentRatio = current / standardCurrent;
    
    let simulatedRemovalFraction = removalFraction * Math.min(1.2, Math.max(0.5, (voltageRatio + currentRatio) / 2));
    // Bound the removal efficiency to physically reasonable values
    simulatedRemovalFraction = Math.max(0.1, Math.min(0.995, simulatedRemovalFraction));
    
    const outletTDS = tds * (1 - simulatedRemovalFraction);
    const removedSaltPpm = tds - outletTDS; // mg/L
    
    // Removed salt in mg during residence time = removedSaltPpm (mg/L) * flowRate (L/min) * residenceTime (min)
    const removedSaltMg = removedSaltPpm * flowRate * calculatedResidenceTime;

    // SAC = removed salt / electrode mass (mg / g)
    const sac = electrodeMass > 0 ? (removedSaltMg / electrodeMass) : 0;

    return {
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

module.exports = calculateEngineering;
