"use strict";

import EquationEngine from "./equationEngine";

function engineeringCalculator(feedWater, designParameters, technology) {

    //-----------------------------------------
    // INPUTS
    //-----------------------------------------

    const inputTDS = Number(feedWater.tds || 500);
    const targetTDS = Number(feedWater.targetTds || 50);
    const requiredRemoval = Math.max(0, inputTDS - targetTDS);
    const removalFraction = requiredRemoval / Math.max(inputTDS, 1);

    // Get parameters with manual overrides
    const opt = feedWater.optimizationInputs || {};
    
    let voltage = Number(opt.voltage ?? feedWater.voltage ?? designParameters?.voltage ?? 1.2);
    let current = Number(opt.current ?? feedWater.current ?? Math.max(2, (feedWater.flowRate || 10) * 0.5));
    let cellPairs = Number(opt.cellPairs ?? feedWater.cellPairs ?? designParameters?.electrodePairs ?? 36);
    let electrodeArea = Number(opt.electrodeArea ?? feedWater.electrodeArea ?? designParameters?.electrodeArea ?? 250);
    let electrodeThickness = Number(opt.electrodeThickness ?? feedWater.electrodeThickness ?? designParameters?.electrodeThickness ?? 0.6);
    let spacerThickness = Number(opt.spacerThickness ?? feedWater.spacerThickness ?? designParameters?.electrodeSpacing ?? 0.5);
    let flowRate = Number(opt.flowRate ?? feedWater.flowRate ?? designParameters?.flowRate ?? 10);
    let flowVelocity = Number(opt.flowVelocity ?? feedWater.flowVelocity ?? designParameters?.flowVelocity ?? 0.15);
    let residenceTime = Number(opt.residenceTime ?? feedWater.residenceTime ?? designParameters?.residenceTime ?? 10);
    let feedPressure = Number(opt.feedPressure ?? feedWater.pressure ?? designParameters?.pressure ?? 1.0);
    let stackLength = Number(opt.stackLength ?? designParameters?.stackLength ?? 200);
    let stackWidth = Number(opt.stackWidth ?? designParameters?.stackWidth ?? 100);
    let pumpEfficiency = Number(opt.pumpEfficiency ?? 75);
    let electrodeDensity = Number(opt.electrodeDensity ?? designParameters?.density ?? 0.45);
    let electrodePorosity = Number(opt.electrodePorosity ?? designParameters?.porosity ?? 0.65);

    // Current density default depending on technology if not overridden
    let currentDensity = 20;
    switch (technology) {
        case "CDI": currentDensity = 20; break;
        case "MCDI": currentDensity = 18; break;
        case "FCDI": currentDensity = 25; break;
        case "EDI": currentDensity = 35; break;
    }
    if (opt.currentDensity) {
        currentDensity = Number(opt.currentDensity);
    } else if (designParameters?.currentDensity) {
        currentDensity = Number(designParameters.currentDensity);
    }

    //-----------------------------------------
    // DYNAMIC EQUATION RESOLVER
    //-----------------------------------------
    const evalInputs = {
        voltage,
        current,
        cellPairs,
        electrodeArea,
        electrodeThickness,
        spacerThickness,
        flowRate,
        flowVelocity,
        residenceTime,
        feedPressure,
        stackLength,
        stackWidth,
        pumpEfficiency,
        electrodeDensity,
        electrodePorosity,
        feedTds: inputTDS,
        outletTds: targetTDS,
        waterRecovery: 98,
        f: 0.03,
        fluidDensity: 1000
    };

    const resolved = EquationEngine.evaluateAll(evalInputs);

    // Extract values with formula overrides or fallback to standard formulas
    const power = Number((resolved.Power ?? resolved.P ?? (voltage * current)).toFixed(2));
    
    // Convert to A/m² if it's evaluated in A/cm² or fallback
    const computedCurrentDensity = resolved.CurrentDensity ?? resolved.J ?? (current / (electrodeArea / 10000));
    currentDensity = Number(computedCurrentDensity.toFixed(2));

    const finalFlowVelocity = Number((resolved.FlowVelocity ?? resolved.v ?? (0.10 + flowRate * 0.005)).toFixed(3));
    const finalResidenceTime = Number((resolved.ResidenceTime ?? resolved.t ?? Math.max(2, 100 / flowRate)).toFixed(2));
    
    const pressureDrop = Number((resolved.PressureDrop ?? resolved.DeltaP ?? (finalFlowVelocity * 180)).toFixed(2));
    const reactorVolume = Number((resolved.ReactorVolume ?? (flowRate * finalResidenceTime / 1000)).toFixed(3));
    const pumpPower = Number((resolved.PumpPower ?? (pressureDrop * flowRate / 60000)).toFixed(3));

    const stackHeight = Number((resolved.stackHeight ?? (cellPairs * (2 * electrodeThickness + spacerThickness) * 0.1)).toFixed(2));
    const waterRecovery = Number((resolved.waterRecovery ?? 98));

    //-----------------------------------------
    // RETURN
    //-----------------------------------------

    return {
        technology,
        voltage,
        current,
        power,
        currentDensity,
        electrodeArea,
        electrodeThickness,
        cellPairs,
        stackLength,
        stackWidth,
        stackHeight,
        flowVelocity: finalFlowVelocity,
        residenceTime: finalResidenceTime,
        pressureDrop,
        pumpPower,
        reactorVolume,
        waterRecovery,
        requiredRemoval,
        predictedRemoval: Number((removalFraction * 100).toFixed(2))
    };
}

export default engineeringCalculator;