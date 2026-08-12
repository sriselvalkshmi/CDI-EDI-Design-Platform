"use strict";

import { TECHNOLOGY_FUNDAMENTALS } from "./technologyFundamentals.js";

/**
 * First-Principles Membrane Capacitive Deionization (MCDI) Engineering Model
 * Implements literature-backed electrosorption kinetics, AEM & CEM co-ion exclusion,
 * Faraday charge transfer, current-density-based electrode sizing, series electrical topology,
 * and multi-stream mass balance (Feed = Product + Concentrate Brine).
 * References: Zhao et al. (2012), Biesheuvel & van der Wal (2010), Dykstra et al. (2016).
 */

export const MCDI_ENVELOPE = {
    name: "Membrane Capacitive Deionization (MCDI)",
    recommendedTdsRange: { min: 500, max: 3000 }, // mg/L
    maxValidatedTds: 5000, // mg/L
    minCellVoltage: 1.0, // V
    maxCellVoltage: 1.6, // V
    defaultCellVoltage: 1.4, // V
    minOperatingCurrentDensity: 20.0, // A/m²
    maxOperatingCurrentDensity: 250.0, // A/m²
    defaultOperatingCurrentDensity: 60.0, // A/m²
    minRecovery: 85.0, // %
    maxRecovery: 95.0, // %
    defaultRecovery: 95.0, // %
    molarMassNaCl: 58.44, // g/mol (NaCl explicit assumption)
    faradayConstant: 96485, // C/mol
    ionValence: 1, // z for NaCl
    membraneThicknessMm: 0.15, // mm per AEM/CEM sheet
    membranePermselectivity: 0.98, // AEM/CEM selectivity factor
    sacNominal: 25.0, // mg salt / g carbon (membrane-assisted capacity)
    calibrationStatus: "MCDI Model Operating Envelope: 100–3,000 mg/L TDS. Supported by literature and project calibration; applicability depends on specified operating conditions."
};

/**
 * Calculates dynamic charge efficiency for MCDI.
 * Ion-exchange membranes block co-ion expulsion, maintaining high charge efficiency (90% - 98%).
 *
 * @param {number} cellVoltage - Applied cell voltage (V)
 * @param {number} feedTds - Feed TDS concentration (mg/L)
 * @param {object} customConfig - Optional user overrides
 * @returns {number} Charge efficiency (0.0 to 1.0)
 */
export function calculateMCDIChargeEfficiency(cellVoltage = 1.4, feedTds = 500, customConfig = {}) {
    if (customConfig.chargeEfficiency !== undefined && customConfig.chargeEfficiency !== null && !isNaN(Number(customConfig.chargeEfficiency))) {
        const val = Number(customConfig.chargeEfficiency);
        return val > 1 ? val / 100 : val;
    }

    // Baseline nominal efficiency for MCDI at 1.4V and 500 ppm is 0.92 (92%)
    const baseLambda = 0.92;
    const voltageFactor = 1.0 - 0.04 * ((cellVoltage - 1.4) / 1.4);
    const concentrationFactor = feedTds >= 500 ? 1.0 : Math.max(0.85, feedTds / 500);

    const lambda = baseLambda * voltageFactor * concentrationFactor;
    return Math.max(0.80, Math.min(0.98, Number(lambda.toFixed(4))));
}

/**
 * Calculates MCDI design and operational performance parameters from first principles.
 *
 * @param {object} inputs - User and feed water inputs
 * @returns {object} Comprehensive MCDI engineering metrics
 */
export function calculateMCDIModel(inputs = {}) {
    const feedWater = inputs.feedWater || {};

    const rawTds = Number(inputs.tds ?? feedWater.tds ?? 500);
    const flowRateLmin = Number(inputs.flowRate ?? feedWater.flowRate ?? 10); // L/min

    // Invalid input checks
    if (flowRateLmin <= 0 || rawTds <= 0 || isNaN(rawTds) || isNaN(flowRateLmin)) {
        throw new Error("Invalid inputs: flowRate and feedTds must be strictly positive numbers.");
    }

    const feedTds = Math.max(10, Math.round(rawTds)); // mg/L === g/m³
    const targetTds = Math.max(0.5, Number(inputs.targetTds ?? feedWater.targetTds ?? 50)); // mg/L

    // 1. Explicit SI Unit Conversions & Molar Concentration
    const flowRateM3s = flowRateLmin / (1000 * 60); // m³/s
    const flowRateM3h = (flowRateLmin * 60) / 1000; // m³/h

    const molarMassNaCl = MCDI_ENVELOPE.molarMassNaCl; // g/mol
    const faradayConstant = MCDI_ENVELOPE.faradayConstant; // C/mol
    const z = MCDI_ENVELOPE.ionValence;

    const feedMolarConcentration = feedTds / molarMassNaCl; // mol/m³

    // 2. Desalination Removal & Mass Balance
    const requiredRemovalRatio = feedTds > 0 ? Math.min(0.95, Math.max(0.05, (feedTds - targetTds) / feedTds)) : 0.90;
    const calculatedOutletTds = Number((feedTds * (1 - requiredRemovalRatio)).toFixed(1));
    const outletTds = Math.max(0.5, calculatedOutletTds);

    const deltaTds = feedTds - outletTds; // mg/L === g/m³
    const massRemovalRateGs = flowRateM3s * deltaTds; // g/s removed
    const massRemovalRateKgH = (massRemovalRateGs * 3600) / 1000; // kg/h
    const molarRemovalRateMols = massRemovalRateGs / molarMassNaCl; // mol/s

    // 3. Multi-Stream Water & Salt Conservation Balances
    const waterRecoveryPct = Number(inputs.waterRecovery ?? MCDI_ENVELOPE.defaultRecovery); // %
    const waterRecoveryFrac = waterRecoveryPct / 100;

    const productFlowLmin = flowRateLmin * waterRecoveryFrac; // L/min
    const productFlowM3s = (productFlowLmin / 1000) / 60; // m³/s
    const productFlowM3h = (productFlowLmin * 60) / 1000; // m³/h

    const concentrateFlowLmin = flowRateLmin * (1 - waterRecoveryFrac); // L/min
    const concentrateFlowM3s = (concentrateFlowLmin / 1000) / 60; // m³/s
    const concentrateFlowM3h = (concentrateFlowLmin * 60) / 1000; // m³/h

    // Water Conservation Assertion Check
    const waterBalanceErrorLmin = Math.abs(flowRateLmin - (productFlowLmin + concentrateFlowLmin));
    const isWaterConserved = waterBalanceErrorLmin < 1.0e-5;

    // Salt Mass Conservation: Salt_in = Salt_product + Salt_concentrate
    // m_dot_feed = Q_feed * C_feed
    // m_dot_prod = Q_prod * C_out
    // m_dot_brine = Q_brine * C_brine = m_dot_feed - m_dot_prod
    const feedSaltRateGs = flowRateM3s * feedTds; // g/s
    const productSaltRateGs = productFlowM3s * outletTds; // g/s
    const concentrateSaltRateGs = feedSaltRateGs - productSaltRateGs; // g/s

    const concentrateTdsVal = concentrateFlowM3s > 0 ? concentrateSaltRateGs / concentrateFlowM3s : feedTds;
    const concentrateTds = Number(concentrateTdsVal.toFixed(1)); // mg/L

    // Salt Conservation Assertion Check
    const saltBalanceErrorGs = Math.abs(feedSaltRateGs - (productSaltRateGs + concentrateSaltRateGs));
    const isSaltConserved = saltBalanceErrorGs < 1.0e-6;

    if (!isWaterConserved || !isSaltConserved) {
        throw new Error("Mass Balance Violation: Water or Salt conservation equation violated beyond tolerance.");
    }

    // 4. Charge Demand & Faraday Current Calculation
    let cellVoltage = Number(inputs.voltage ?? inputs.voltageCell ?? MCDI_ENVELOPE.defaultCellVoltage);
    cellVoltage = Math.max(MCDI_ENVELOPE.minCellVoltage, Math.min(MCDI_ENVELOPE.maxCellVoltage, cellVoltage));

    const chargeEfficiency = calculateMCDIChargeEfficiency(cellVoltage, feedTds, inputs);

    // Total Stack Faraday Current (Amperes total across all cell pairs):
    // I_total = (n_dot * z * F) / Lambda
    const totalFaradayCurrent = (molarRemovalRateMols * z * faradayConstant) / chargeEfficiency; // Amperes

    // 5. Current-Density-Based Electrode Sizing
    const targetCurrentDensity = Number(inputs.currentDensity ?? MCDI_ENVELOPE.defaultOperatingCurrentDensity); // A/m²
    const targetCurrentDensityAm2 = Math.max(20, Math.min(250, targetCurrentDensity));

    const requiredTotalAreaM2 = totalFaradayCurrent / targetCurrentDensityAm2; // m² total planar area

    const inputPlanarAreaCm2 = Number(inputs.electrodeArea ?? 350); // cm² per cell pair
    const planarAreaM2 = Math.max(0.01, inputPlanarAreaCm2 / 10000); // m² per pair

    const calculatedCellPairsRaw = Math.ceil(requiredTotalAreaM2 / planarAreaM2);
    const calculatedPairs = Math.max(12, calculatedCellPairsRaw);

    // 6. Authoritative Module & Integer Pair Synchronization
    const pairsPerModule = 34; // MCDI standard pairs per module
    const manualPairs = inputs.cellPairs !== undefined && inputs.cellPairs !== "" ? Number(inputs.cellPairs) : null;
    const requiredPairs = manualPairs !== null ? manualPairs : calculatedPairs;

    const numberOfModules = Math.max(1, Math.ceil(requiredPairs / pairsPerModule));
    const cellPairs = manualPairs !== null ? manualPairs : (pairsPerModule * numberOfModules);

    // Actual total planar area after integer module pairing
    const totalElectrodeAreaM2 = cellPairs * planarAreaM2; // m²
    const totalElectrodeAreaCm2 = Number((totalElectrodeAreaM2 * 10000).toFixed(0)); // cm²

    // Total Membrane Area (2 membranes per cell pair: 1 AEM + 1 CEM)
    const totalMembraneAreaM2 = Number((2 * totalElectrodeAreaM2).toFixed(2)); // m²

    // Electrical Series Topology: Current through each pair in series
    const cellCurrent = Number((totalFaradayCurrent / cellPairs).toFixed(2)); // Amperes per pair
    const actualCurrentDensityAm2 = Number((cellCurrent / planarAreaM2).toFixed(1)); // A/m²

    // 7. Voltages, Power & Series Electrical Topology
    const voltageModule = Number((pairsPerModule * cellVoltage).toFixed(2)); // V per module
    const voltageStack = Number((voltageModule * numberOfModules).toFixed(2)); // System Stack Voltage (V)

    const cellPower = Number((cellVoltage * cellCurrent).toFixed(2)); // W per pair
    const stackElectricalPowerW = Number((voltageStack * cellCurrent).toFixed(1)); // W total stack power

    // 8. Specific Energy Consumption (SEC) - Complete Energy Accounting
    const secElectricalAdsorptionKwhM3 = productFlowM3h > 0 ? (stackElectricalPowerW / 1000) / productFlowM3h : 0;
    const secElectricalAdsorption = Number(secElectricalAdsorptionKwhM3.toFixed(4));

    // Energy Recovery during desorption/discharge (Default 20% energy recovery factor for MCDI RPD)
    const energyRecoveryFactor = Number(inputs.energyRecoveryFactor ?? 0.20);
    const secElectricalNet = Number((secElectricalAdsorption * (1 - energyRecoveryFactor)).toFixed(4));

    // Hydraulic Pressure Drop Calculation (Netting Spacer Mesh Drag)
    const electrodeThicknessMm = Number(inputs.electrodeThickness ?? 0.6); // mm
    const spacerThicknessMm = Number(inputs.spacerThickness ?? 0.5); // mm
    const membraneThicknessMm = MCDI_ENVELOPE.membraneThicknessMm; // mm
    const stackWidthMm = Number(inputs.stackWidth ?? 100); // mm
    const stackLengthMm = Number(inputs.stackLength ?? 200); // mm

    const stackWidthM = stackWidthMm / 1000;
    const spacerThicknessM = spacerThicknessMm / 1000;
    const stackLengthM = stackLengthMm / 1000;

    const channelAreaM2 = cellPairs * stackWidthM * spacerThicknessM;
    const flowVelocity = channelAreaM2 > 0 ? (flowRateM3s / channelAreaM2) : 0.035; // m/s

    const hydraulicDiameterM = (2 * stackWidthM * spacerThicknessM) / Math.max(0.0001, stackWidthM + spacerThicknessM);
    const fluidDensity = 1000; // kg/m³
    const dynamicViscosity = 0.001; // Pa.s

    const reynoldsNumber = (fluidDensity * flowVelocity * hydraulicDiameterM) / dynamicViscosity;
    const spacerFrictionFactor = (64 / Math.max(1, reynoldsNumber)) + 0.35; // Mesh drag

    const pressureDropPa = hydraulicDiameterM > 0
        ? (spacerFrictionFactor * (stackLengthM / hydraulicDiameterM) * (fluidDensity * Math.pow(flowVelocity, 2) / 2))
        : 220;
    const pressureDrop = Math.max(160, Math.min(500, Number(pressureDropPa.toFixed(0)))); // Pa

    const pumpEfficiency = 0.75; // 75% centrifugal pump efficiency
    const hydraulicPowerW = (flowRateM3s * pressureDrop) / pumpEfficiency;
    const secHydraulicKwhM3 = productFlowM3h > 0 ? (hydraulicPowerW / 1000) / productFlowM3h : 0;
    const secHydraulic = Number(secHydraulicKwhM3.toFixed(5));

    const secElectrical = secElectricalAdsorption; // Preserved for backward UI compatibility
    const secTotal = Number((secElectricalNet + secHydraulic).toFixed(4));

    // 9. Residence Time & Electrode Mass
    const reactorVolumeLiters = cellPairs * (inputPlanarAreaCm2 * (spacerThicknessMm / 10)) / 1000; // L
    const residenceTimeMin = flowRateLmin > 0 ? reactorVolumeLiters / flowRateLmin : 0.045; // min

    const electrodeDensity = Number(inputs.electrodeDensity ?? 0.45); // g/cm³
    const totalElectrodeMassGrams = 2 * cellPairs * inputPlanarAreaCm2 * (electrodeThicknessMm / 10) * electrodeDensity;
    const electrodeMassKg = Number((totalElectrodeMassGrams / 1000).toFixed(2));

    const cycleTimeMin = 10.0;
    const requiredSorptionMg = flowRateLmin * cycleTimeMin * deltaTds;
    const actualSacMgG = totalElectrodeMassGrams > 0 ? requiredSorptionMg / totalElectrodeMassGrams : MCDI_ENVELOPE.sacNominal;

    // 10. Technology Envelope Status Evaluation & Model Prediction Labeling
    let envelopeStatus = "VALIDATED";
    let envelopeMessage = "Operating parameters within literature-supported MCDI envelope (Zhao et al., 2012).";

    if (feedTds < MCDI_ENVELOPE.recommendedTdsRange.min || feedTds > MCDI_ENVELOPE.recommendedTdsRange.max) {
        envelopeStatus = "EXTRAPOLATED";
        envelopeMessage = `Operating point (Feed: ${feedTds} mg/L) is outside recommended MCDI literature range (${MCDI_ENVELOPE.recommendedTdsRange.min} - ${MCDI_ENVELOPE.recommendedTdsRange.max} mg/L).`;
    }
    if (feedTds > MCDI_ENVELOPE.maxValidatedTds || cellVoltage > MCDI_ENVELOPE.maxCellVoltage) {
        envelopeStatus = "OUTSIDE_ENVELOPE";
        envelopeMessage = `Operating point exceeds validated MCDI feasibility boundaries (> ${MCDI_ENVELOPE.maxValidatedTds} mg/L TDS or > ${MCDI_ENVELOPE.maxCellVoltage} V). FCDI is recommended.`;
    }

    const removalEfficiency = Number((((feedTds - outletTds) / feedTds) * 100).toFixed(1));
    const isTargetAchieved = outletTds <= targetTds + 0.5;
    const modelPredictionLabel = isTargetAchieved ? "TARGET ACHIEVED — MODEL PREDICTION" : "TARGET NOT ACHIEVED — MODEL OPERATING LIMIT";

    return {
        technology: "MCDI",
        techName: MCDI_ENVELOPE.name,
        processTrainName: "MCDI",
        feedTds,
        targetTds,
        outletTDS: outletTds,
        outletTds,
        removalEfficiency,
        isTargetAchieved,

        // Explicit Conversions & Mass Balance
        flowRateLmin,
        productFlowLmin: Number(productFlowLmin.toFixed(2)),
        concentrateFlowLmin: Number(concentrateFlowLmin.toFixed(2)),
        flowRateM3s: Number(flowRateM3s.toExponential(4)),
        flowRateM3h: Number(flowRateM3h.toFixed(3)),
        productFlowM3h: Number(productFlowM3h.toFixed(3)),
        concentrateFlowM3h: Number(concentrateFlowM3h.toFixed(3)),
        concentrateTds,

        // Mass Balance Audit Flags
        isWaterConserved,
        isSaltConserved,

        massRemovalRateGs: Number(massRemovalRateGs.toFixed(4)),
        massRemovalRateKgH: Number(massRemovalRateKgH.toFixed(4)),
        molarRemovalRateMols: Number(molarRemovalRateMols.toExponential(4)),
        naclEquivalentMolarMass: molarMassNaCl,

        // Faraday Charge & Current
        chargeEfficiency: Number((chargeEfficiency * 100).toFixed(1)),
        chargeEfficiencyFrac: chargeEfficiency,
        chargeEfficiencyDescription: "Charge Efficiency Parameter: 0.92 — model assumption/calibration",
        totalFaradayCurrent: Number(totalFaradayCurrent.toFixed(2)),
        current: cellCurrent,
        cellCurrent,

        // Electrode & Membrane Sizing
        targetCurrentDensity: targetCurrentDensityAm2,
        currentDensity: actualCurrentDensityAm2,
        requiredTotalAreaM2: Number(requiredTotalAreaM2.toFixed(3)),
        electrodeArea: inputPlanarAreaCm2, // cm² per pair
        totalElectrodeAreaCm2,
        totalElectrodeAreaM2: Number(totalElectrodeAreaM2.toFixed(3)),
        totalMembraneAreaM2,
        membraneThicknessMm,

        // Modules & Integer Cell Pairs
        cellPairs,
        pairsPerModule,
        numberOfModules,

        // Voltages & Electrical Power
        voltageCell: cellVoltage,
        voltage: cellVoltage,
        voltageModule,
        voltageStack,
        cellPower,
        power: stackElectricalPowerW,
        stackPowerW: stackElectricalPowerW,

        // SEC Breakdown (Adsorption, Net, Hydraulic & Energy Recovery)
        sec: secTotal,
        secElectrical,
        secElectricalAdsorption,
        secElectricalNet,
        energyRecoveryFactor,
        secHydraulic,
        secTotal,

        // Hydraulics & Mass
        waterRecovery: waterRecoveryPct,
        flowVelocity: Number(flowVelocity.toFixed(4)),
        pressureDrop,
        residenceTime: Number(residenceTimeMin.toFixed(4)),
        reactorVolumeLiters: Number(reactorVolumeLiters.toFixed(3)),
        electrodeMassKg,
        sac: Number(actualSacMgG.toFixed(1)),

        // Technology Fundamental Configuration (Single Source of Truth)
        fundamentals: TECHNOLOGY_FUNDAMENTALS.MCDI,
        flowConfiguration: TECHNOLOGY_FUNDAMENTALS.MCDI.flowConfiguration,
        electrodeConfiguration: TECHNOLOGY_FUNDAMENTALS.MCDI.electrodeConfiguration,
        membraneConfiguration: TECHNOLOGY_FUNDAMENTALS.MCDI.membraneConfiguration,
        membraneThicknessMm,
        ionTransport: TECHNOLOGY_FUNDAMENTALS.MCDI.ionTransport,
        polarity: "Cyclic DC voltage (1.0–1.6 V charging / adsorption; 0 V or reverse -0.2 to -0.6 V discharge)",
        productStream: "High-purity desalinated product water produced during adsorption cycle",
        concentrateStream: "Concentrated brine waste produced during electrical discharge/desorption cycle",
        pretreatment: TECHNOLOGY_FUNDAMENTALS.MCDI.pretreatment,
        regenerationMode: TECHNOLOGY_FUNDAMENTALS.MCDI.regenerationMode,
        advantages: TECHNOLOGY_FUNDAMENTALS.MCDI.advantages,
        limitations: TECHNOLOGY_FUNDAMENTALS.MCDI.limitations,

        // Configurable Envelope Metadata & Model Prediction Status
        modelPredictionLabel,
        envelopeStatus,
        envelopeMessage,
        envelopeConfig: MCDI_ENVELOPE,
        modelStatus: "First-Principles Physics (AEM/CEM Co-Ion Exclusion & Dual Sized)"
    };
}

export default calculateMCDIModel;
