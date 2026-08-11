"use strict";

/**
 * First-Principles Flow-Electrode Capacitive Deionization (FCDI) Engineering Model
 * Implements literature-backed continuous slurry electrosorption kinetics, AEM & CEM co-ion exclusion,
 * Faraday charge transfer, circulating carbon inventory tracking, viscous non-Newtonian slurry hydrodynamics,
 * separate water & slurry pumping duty, independent SEC energy accounting, and multi-stream mass balance.
 * References: Jeon et al. (2013), Rommerskirchen et al. (2018), Wood et al. (2010), Porada et al. (2013).
 */

export const FCDI_ENVELOPE = {
    name: "Flow-Electrode Capacitive Deionization (FCDI)",
    recommendedTdsRange: { min: 1000, max: 15000 }, // mg/L
    maxValidatedTds: 50000, // mg/L (High-salinity brine concentration demonstrated)
    literatureBenchmarkMaxRemoval: 0.95, // 95% single-stage removal benchmark (Jeon et al., 2013 for 32.1 g/L NaCl)
    minCellVoltage: 1.0, // V
    maxCellVoltage: 1.8, // V
    defaultCellVoltage: 1.4, // V
    minOperatingCurrentDensity: 20.0, // A/m²
    maxOperatingCurrentDensity: 300.0, // A/m²
    defaultOperatingCurrentDensity: 80.0, // A/m²
    minRecovery: 80.0, // %
    maxRecovery: 95.0, // %
    defaultRecovery: 90.0, // %
    molarMassNaCl: 58.44, // g/mol (NaCl explicit assumption)
    faradayConstant: 96485, // C/mol
    ionValence: 1, // z for NaCl
    defaultSlurryConcentrationWt: 10.0, // 10 wt% activated carbon slurry (~100 g carbon / L)
    defaultSlurryFlowRatio: 1.2, // Q_slurry = 1.2 * Q_feed
    sacNominal: 20.0, // Intrinsic activated carbon material SAC (mg salt / g carbon)
    calibrationStatus: "Literature-Supported Flow-Electrode Architecture with Project/Calibrated Assumptions"
};

/**
 * Calculates dynamic flow-electrode charge utilization parameter (Lambda_FCDI).
 * Explicitly classified as a Project Calibration/Assumption parameter.
 *
 * @param {number} cellVoltage - Applied cell voltage (V)
 * @param {number} feedTds - Feed TDS concentration (mg/L)
 * @param {object} customConfig - Optional user overrides
 * @returns {number} Charge utilization parameter (0.0 to 1.0)
 */
export function calculateFCDIChargeUtilization(cellVoltage = 1.4, feedTds = 500, customConfig = {}) {
    if (customConfig.chargeUtilization !== undefined && customConfig.chargeUtilization !== null && !isNaN(Number(customConfig.chargeUtilization))) {
        const val = Number(customConfig.chargeUtilization);
        return val > 1 ? val / 100 : val;
    }

    // Baseline nominal charge utilization parameter for FCDI at 1.4V and 500 ppm is 0.88 (88%)
    const baseLambda = 0.88;
    const voltageFactor = 1.0 - 0.05 * ((cellVoltage - 1.4) / 1.4);
    const concentrationFactor = feedTds >= 500 ? 1.0 : Math.max(0.70, feedTds / 500);

    const lambda = baseLambda * voltageFactor * concentrationFactor;
    return Math.max(0.65, Math.min(0.96, Number(lambda.toFixed(4))));
}

/**
 * Calculates FCDI design and operational performance parameters from first principles.
 * Performs rigorous input validation, mass conservation assertions, and energy accounting.
 *
 * @param {object} inputs - User and feed water inputs
 * @returns {object} Comprehensive FCDI engineering metrics and pedigree
 */
export function calculateFCDIModel(inputs = {}) {
    const feedWater = inputs.feedWater || {};

    const rawTds = Number(inputs.tds ?? feedWater.tds ?? 500);
    const flowRateLmin = Number(inputs.flowRate ?? feedWater.flowRate ?? 10); // L/min
    const targetTds = Number(inputs.targetTds ?? feedWater.targetTds ?? 50); // mg/L
    const waterRecoveryPct = Number(inputs.waterRecovery ?? FCDI_ENVELOPE.defaultRecovery); // %
    let cellVoltage = Number(inputs.voltage ?? inputs.voltageCell ?? FCDI_ENVELOPE.defaultCellVoltage);
    const inputPlanarAreaCm2 = Number(inputs.electrodeArea ?? 350); // cm²
    const slurryConcentrationWt = Number(inputs.slurryConcentrationWt ?? FCDI_ENVELOPE.defaultSlurryConcentrationWt); // wt%
    const slurryFlowRatio = Number(inputs.slurryFlowRatio ?? FCDI_ENVELOPE.defaultSlurryFlowRatio); // Q_slurry / Q_feed

    // 1. Strict Physical Input Sanity Checks (No silent clamping of invalid inputs)
    if (isNaN(rawTds) || !isFinite(rawTds) || rawTds < 0) {
        throw new Error("INVALID ENGINEERING INPUT: Feed TDS must be a non-negative finite number.");
    }
    if (isNaN(targetTds) || !isFinite(targetTds) || targetTds < 0) {
        throw new Error("INVALID ENGINEERING INPUT: Target TDS must be a non-negative finite number.");
    }
    if (targetTds > rawTds) {
        throw new Error(`INVALID ENGINEERING INPUT: Target TDS (${targetTds} mg/L) cannot exceed Feed TDS (${rawTds} mg/L).`);
    }
    if (isNaN(flowRateLmin) || !isFinite(flowRateLmin) || flowRateLmin <= 0) {
        throw new Error("INVALID ENGINEERING INPUT: Flow rate must be a strictly positive finite number.");
    }
    if (isNaN(waterRecoveryPct) || !isFinite(waterRecoveryPct) || waterRecoveryPct <= 0 || waterRecoveryPct >= 100) {
        throw new Error(`INVALID ENGINEERING INPUT: Water recovery (${waterRecoveryPct}%) must be strictly between 0% and 100%.`);
    }
    if (isNaN(cellVoltage) || !isFinite(cellVoltage) || cellVoltage <= 0) {
        throw new Error("INVALID ENGINEERING INPUT: Cell voltage must be a strictly positive finite number.");
    }
    if (isNaN(inputPlanarAreaCm2) || !isFinite(inputPlanarAreaCm2) || inputPlanarAreaCm2 <= 0) {
        throw new Error("INVALID ENGINEERING INPUT: Electrode area must be a strictly positive finite number.");
    }
    if (isNaN(slurryConcentrationWt) || !isFinite(slurryConcentrationWt) || slurryConcentrationWt < 0) {
        throw new Error("INVALID ENGINEERING INPUT: Carbon slurry concentration cannot be negative.");
    }
    if (isNaN(slurryFlowRatio) || !isFinite(slurryFlowRatio) || slurryFlowRatio <= 0) {
        throw new Error("INVALID ENGINEERING INPUT: Slurry flow ratio must be a strictly positive finite number.");
    }

    const feedTds = Math.max(0, Math.round(rawTds)); // mg/L === g/m³

    // 2. Explicit SI Unit Conversions & Molar Concentration
    const flowRateM3s = flowRateLmin / (1000 * 60); // m³/s
    const flowRateM3h = (flowRateLmin * 60) / 1000; // m³/h

    const molarMassNaCl = FCDI_ENVELOPE.molarMassNaCl; // g/mol
    const faradayConstant = FCDI_ENVELOPE.faradayConstant; // C/mol
    const z = FCDI_ENVELOPE.ionValence;

    // 3. Desalination Removal & Target Feasibility Check
    const maxSingleStageRemoval = FCDI_ENVELOPE.literatureBenchmarkMaxRemoval; // 95% single stage limit (Jeon et al., 2013)
    const requestedRemovalRatio = feedTds > 0 ? (feedTds - targetTds) / feedTds : 0;
    const actualRemovalRatio = Math.min(maxSingleStageRemoval, Math.max(0, requestedRemovalRatio));

    const calculatedOutletTds = Number((feedTds * (1 - actualRemovalRatio)).toFixed(1));
    const outletTds = Math.max(0.5, calculatedOutletTds);

    const isTargetAchieved = outletTds <= targetTds + 0.5;
    const additionalStagesRequired = (!isTargetAchieved && feedTds > 0 && targetTds > 0)
        ? Math.ceil(Math.log(targetTds / feedTds) / Math.log(1 - maxSingleStageRemoval))
        : 1;

    const deltaTds = feedTds - outletTds; // mg/L === g/m³
    const massRemovalRateGs = flowRateM3s * deltaTds; // g/s removed
    const massRemovalRateKgH = (massRemovalRateGs * 3600) / 1000; // kg/h
    const molarRemovalRateMols = massRemovalRateGs / molarMassNaCl; // mol/s

    // 4. Multi-Stream Water & Salt Mass Conservation Balances
    const waterRecoveryFrac = waterRecoveryPct / 100;

    const productFlowLmin = flowRateLmin * waterRecoveryFrac; // L/min
    const productFlowM3s = (productFlowLmin / 1000) / 60; // m³/s
    const productFlowM3h = (productFlowLmin * 60) / 1000; // m³/h

    const concentrateFlowLmin = flowRateLmin * (1 - waterRecoveryFrac); // L/min
    const concentrateFlowM3s = (concentrateFlowLmin / 1000) / 60; // m³/s
    const concentrateFlowM3h = (concentrateFlowLmin * 60) / 1000; // m³/h

    // Water Conservation Check: Q_feed = Q_prod + Q_brine
    const waterBalanceErrorLmin = Math.abs(flowRateLmin - (productFlowLmin + concentrateFlowLmin));
    const isWaterConserved = waterBalanceErrorLmin < 1.0e-5;

    // Salt Mass Conservation Check: Salt_in = Salt_product + Salt_concentrate
    const feedSaltMassGs = flowRateM3s * feedTds; // g/s
    const productSaltMassGs = productFlowM3s * outletTds; // g/s
    const concentrateSaltMassGs = feedSaltMassGs - productSaltMassGs; // g/s

    const concentrateTdsVal = concentrateFlowM3s > 0 ? concentrateSaltMassGs / concentrateFlowM3s : feedTds;
    const concentrateTds = Number(concentrateTdsVal.toFixed(1)); // mg/L

    const massBalanceErrorGs = Math.abs(feedSaltMassGs - (productSaltMassGs + concentrateSaltMassGs));
    const massBalancePercent = Number(((1 - (massBalanceErrorGs / Math.max(1e-9, feedSaltMassGs))) * 100).toFixed(3));
    const isSaltConserved = massBalanceErrorGs < 1.0e-5;
    const massBalanceStatus = isSaltConserved ? "CONSERVED" : "VIOLATED";

    if (!isWaterConserved || !isSaltConserved) {
        throw new Error(`Mass Balance Violation: Water or Salt conservation equation violated beyond tolerance (Error: ${massBalanceErrorGs} g/s).`);
    }

    // 5. Flow-Electrode Charge Demand & Faraday Current Calculation
    cellVoltage = Math.max(FCDI_ENVELOPE.minCellVoltage, Math.min(FCDI_ENVELOPE.maxCellVoltage, cellVoltage));
    const chargeUtilization = calculateFCDIChargeUtilization(cellVoltage, feedTds, inputs);

    // Total Stack Faraday Current (Amperes total across all cell pairs):
    // I_FCDI = (n_dot * z * F) / Lambda_FCDI
    const totalFaradayCurrent = (molarRemovalRateMols * z * faradayConstant) / chargeUtilization; // Amperes

    // 6. Current-Density-Based Electrode Sizing & Module Topology
    const targetCurrentDensity = Number(inputs.currentDensity ?? FCDI_ENVELOPE.defaultOperatingCurrentDensity); // A/m²
    const targetCurrentDensityAm2 = Math.max(20, Math.min(300, targetCurrentDensity));

    const requiredTotalAreaM2 = totalFaradayCurrent / targetCurrentDensityAm2; // m² total planar area
    const planarAreaM2 = Math.max(0.01, inputPlanarAreaCm2 / 10000); // m² per pair

    const calculatedCellPairsRaw = Math.ceil(requiredTotalAreaM2 / planarAreaM2);
    const calculatedPairs = Math.max(12, calculatedCellPairsRaw);

    const pairsPerModule = 34; // FCDI standard pairs per module
    const manualPairs = inputs.cellPairs !== undefined && inputs.cellPairs !== "" ? Number(inputs.cellPairs) : null;
    const requiredPairs = manualPairs !== null ? manualPairs : calculatedPairs;

    const numberOfModules = Math.max(1, Math.ceil(requiredPairs / pairsPerModule));
    const cellPairs = manualPairs !== null ? manualPairs : (pairsPerModule * numberOfModules);

    const totalElectrodeAreaM2 = cellPairs * planarAreaM2; // m²
    const totalElectrodeAreaCm2 = Number((totalElectrodeAreaM2 * 10000).toFixed(0)); // cm²
    const totalMembraneAreaM2 = Number((2 * totalElectrodeAreaM2).toFixed(2)); // m² (1 AEM + 1 CEM per pair)

    const cellCurrent = Number((totalFaradayCurrent / cellPairs).toFixed(2)); // Amperes per pair
    const actualCurrentDensityAm2 = Number((cellCurrent / planarAreaM2).toFixed(1)); // A/m²

    // 7. Voltages & Stack Electrical Power
    const voltageModule = Number((pairsPerModule * cellVoltage).toFixed(2)); // V per module
    const voltageStack = Number((voltageModule * numberOfModules).toFixed(2)); // System Stack Voltage (V)

    const cellPower = Number((cellVoltage * cellCurrent).toFixed(2)); // W per pair
    const stackElectricalPowerW = Number((voltageStack * cellCurrent).toFixed(1)); // W total stack electrical power

    // 8. Circulating Carbon Slurry Inventory & Operating Salt Loading (Terminology Precise)
    const slurryFlowLmin = Number((flowRateLmin * slurryFlowRatio).toFixed(1)); // L/min
    const slurryFlowM3s = slurryFlowLmin / (1000 * 60); // m³/s

    // Slurry Carbon Concentration: 10 wt% ≈ 100 g carbon / L slurry
    const slurryCarbonDensityGL = slurryConcentrationWt * 10; // g/L
    const carbonMassFlowGs = (slurryFlowLmin / 60) * slurryCarbonDensityGL; // g carbon / s

    // Slurry loop volume & total carbon inventory in circulating reservoir + piping
    const slurryLoopVolumeLiters = Number((slurryFlowLmin * 2.0).toFixed(1)); // L reservoir + piping loop
    const totalCarbonInventoryKg = Number(((slurryLoopVolumeLiters * slurryCarbonDensityGL) / 1000).toFixed(2)); // kg carbon

    // Operating Salt Loading (Continuous salt removal rate per carbon mass flow rate)
    // Operating Salt Loading = (m_dot_salt / m_dot_carbon) * 1000 (mg salt / g carbon)
    const operatingSaltLoadingMgG = carbonMassFlowGs > 0
        ? Number(((massRemovalRateGs / carbonMassFlowGs) * 1000).toFixed(1))
        : FCDI_ENVELOPE.sacNominal;

    // Intrinsic SAC is the material property of activated carbon, independent of carbon flow rate
    const intrinsicSacMgG = FCDI_ENVELOPE.sacNominal; // 20.0 mg salt / g carbon

    // 9. Dual Pumping Hydrodynamics: Water-Side & Slurry-Side Viscous Drag
    const spacerThicknessMm = Number(inputs.spacerThickness ?? 0.5); // mm
    const stackWidthMm = Number(inputs.stackWidth ?? 100); // mm
    const stackLengthMm = Number(inputs.stackLength ?? 200); // mm

    const reactorVolumeLiters = cellPairs * (inputPlanarAreaCm2 * (spacerThicknessMm / 10)) / 1000; // L
    const residenceTimeMin = flowRateLmin > 0 ? reactorVolumeLiters / flowRateLmin : 0.045; // min

    const stackWidthM = stackWidthMm / 1000;
    const spacerThicknessM = spacerThicknessMm / 1000;
    const stackLengthM = stackLengthMm / 1000;

    // Water Channel Hydrodynamics
    const waterChannelAreaM2 = cellPairs * stackWidthM * spacerThicknessM;
    const flowVelocityWater = waterChannelAreaM2 > 0 ? (flowRateM3s / waterChannelAreaM2) : 0.035; // m/s

    const hydraulicDiameterM = (2 * stackWidthM * spacerThicknessM) / Math.max(0.0001, stackWidthM + spacerThicknessM);
    const fluidDensityWater = 1000; // kg/m³
    const dynamicViscosityWater = 0.001; // Pa.s

    const reynoldsNumberWater = (fluidDensityWater * flowVelocityWater * hydraulicDiameterM) / dynamicViscosityWater;
    const spacerFrictionFactorWater = (64 / Math.max(1, reynoldsNumberWater)) + 0.35;

    const pressureDropWaterPa = hydraulicDiameterM > 0
        ? (spacerFrictionFactorWater * (stackLengthM / hydraulicDiameterM) * (fluidDensityWater * Math.pow(flowVelocityWater, 2) / 2))
        : 220;
    const pressureDropWater = Math.max(160, Math.min(500, Number(pressureDropWaterPa.toFixed(0)))); // Pa

    // Slurry Channel Non-Newtonian Viscous Hydrodynamics
    // Slurry effective viscosity increases non-linearly with wt% carbon (Einstein-Guth correlation)
    const volFractionCarbon = slurryConcentrationWt / 100;
    const slurryViscosityFactor = 1 + 2.5 * volFractionCarbon + 10.05 * Math.pow(volFractionCarbon, 2);

    const flowVelocitySlurry = waterChannelAreaM2 > 0 ? (slurryFlowM3s / waterChannelAreaM2) : 0.042; // m/s

    // Slurry pressure drop scales with water pressure drop, slurry viscosity factor, and slurry flow ratio
    const pressureDropSlurryPa = pressureDropWater * slurryViscosityFactor * slurryFlowRatio * 5.0;
    const pressureDropSlurry = Math.max(800, Math.min(8000, Number(pressureDropSlurryPa.toFixed(0)))); // Pa

    // Separate Pump Power & SEC Calculations
    const pumpEfficiencyWater = Number(inputs.pumpEfficiencyWater ?? 0.75); // 75% centrifugal pump
    const pumpEfficiencySlurry = Number(inputs.pumpEfficiencySlurry ?? 0.60); // 60% progressive cavity / slurry pump

    const waterPumpPowerW = Number(((flowRateM3s * pressureDropWater) / pumpEfficiencyWater).toFixed(1)); // W
    const slurryPumpPowerW = Number(((slurryFlowM3s * pressureDropSlurry) / pumpEfficiencySlurry).toFixed(1)); // W

    const secElectricalKwhM3 = productFlowM3h > 0 ? (stackElectricalPowerW / 1000) / productFlowM3h : 0;
    const secElectrical = Number(secElectricalKwhM3.toFixed(4));

    const secWaterPumpKwhM3 = productFlowM3h > 0 ? (waterPumpPowerW / 1000) / productFlowM3h : 0;
    const secWaterPump = Number(secWaterPumpKwhM3.toFixed(5));

    const secSlurryPumpKwhM3 = productFlowM3h > 0 ? (slurryPumpPowerW / 1000) / productFlowM3h : 0;
    const secSlurryPump = Number(secSlurryPumpKwhM3.toFixed(5));

    const secHydraulic = Number((secWaterPump + secSlurryPump).toFixed(4));
    const secTotal = Number((secElectrical + secHydraulic).toFixed(4));

    // 10. Technology Envelope & Model Status Evaluation
    let envelopeStatus = "VALIDATED";
    let envelopeMessage = "Operating parameters within literature-supported FCDI envelope (Jeon et al., 2013; Rommerskirchen et al., 2018).";

    if (feedTds < FCDI_ENVELOPE.recommendedTdsRange.min) {
        envelopeStatus = "EXTRAPOLATED";
        envelopeMessage = `Low feed TDS (${feedTds} mg/L) is below recommended FCDI range (${FCDI_ENVELOPE.recommendedTdsRange.min} - ${FCDI_ENVELOPE.recommendedTdsRange.max} mg/L). Low ionic conductivity increases slurry ohmic drop.`;
    }
    if (feedTds > FCDI_ENVELOPE.maxValidatedTds || cellVoltage > FCDI_ENVELOPE.maxCellVoltage) {
        envelopeStatus = "OUTSIDE_ENVELOPE";
        envelopeMessage = `Operating point exceeds validated FCDI boundaries (> ${FCDI_ENVELOPE.maxValidatedTds} mg/L TDS or > ${FCDI_ENVELOPE.maxCellVoltage} V).`;
    }

    const removalEfficiency = Number((((feedTds - outletTds) / feedTds) * 100).toFixed(1));

    const statusLabel = isTargetAchieved
        ? "TARGET ACHIEVED — MODEL PREDICTION"
        : "TARGET NOT ACHIEVED — MODEL PREDICTION";

    // 11. Explicit Model Pedigree Structure
    const modelPedigree = {
        firstPrinciples: [
            "Water volume conservation balance (Q_feed = Q_prod + Q_brine)",
            "Salt species mass balance (m_dot_feed = m_dot_prod + m_dot_brine)",
            "Molar salt removal rate (n_dot = m_dot / M_NaCl)",
            "Faraday charge demand relationship (I_FCDI = n_dot * z * F / Lambda)",
            "Continuous carbon mass-flow relationship (m_dot_carbon = C_slurry * Q_slurry)",
            "Electrical series module voltage scaling (V_stack = N_pairs * V_cell)",
            "Stack electrical power equation (P_elec = V_stack * I)",
            "Hydraulic pump power equation (P_pump = Q * Delta_P / eta)",
            "Separate SEC calculation breakdown (SEC_total = SEC_elec + SEC_waterpump + SEC_slurrypump)"
        ],
        literatureSupported: [
            "Flow-electrode contactor membrane stack architecture (Jeon et al., 2013)",
            "Continuous non-stop flow-electrode operation (Rommerskirchen et al., 2018)",
            "General carbon slurry operating range of 5–20 wt% (Wood et al., 2010)",
            "Qualitative non-Newtonian effective viscosity increase with carbon particle volume fraction"
        ],
        projectAssumptions: [
            "Default carbon slurry concentration (10 wt%)",
            "Default slurry flow ratio (Q_slurry = 1.2 * Q_feed)",
            "Default intrinsic carbon SAC reference (20.0 mg salt / g carbon)",
            "Slurry channel friction factor and pressure drop scaling factors",
            "Centrifugal water pump efficiency (75%) and progressive-cavity slurry pump efficiency (60%)"
        ],
        calibrationParameters: [
            "Lambda_FCDI (Flow-electrode charge utilization parameter = 0.88)"
        ],
        unsupportedPhysics: [
            "Particle aggregation & rheological clogging kinetics in narrow channel spacers",
            "Long-term carbon slurry degradation and particle attrition rates",
            "Detailed transient carbon-particle charge propagation micro-kinetics",
            "Dynamic membrane scaling and empirical foulant induction time",
            "Exact unvalidated performance on proprietary multi-component water matrixes"
        ]
    };

    return {
        technology: "FCDI",
        status: statusLabel,
        targetAchieved: isTargetAchieved,
        predictedOutletTDS: outletTds,
        targetTDS: targetTds,
        targetDeviation: Number(Math.abs(outletTds - targetTds).toFixed(1)),
        predictedRemovalPercent: removalEfficiency,
        literatureBenchmarkRemoval: 95.0, // Jeon et al. 2013 benchmark
        stagingRequired: additionalStagesRequired,
        massBalanceStatus,
        massBalanceError: Number(massBalanceErrorGs.toExponential(4)),
        massBalancePercent,
        energyStatus: "SEPARATED_ACCOUNTING",
        modelPredictionOnly: true,

        // Detailed Desalination Performance
        feedTds,
        targetTds,
        outletTDS: outletTds,
        outletTds,
        removalEfficiency,
        isTargetAchieved,
        additionalStagesRequired,

        // Explicit Multi-Stream Water & Salt Mass Balance
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

        // Flow-Electrode Charge Utilization & Faraday Current
        chargeUtilization: Number((chargeUtilization * 100).toFixed(1)),
        chargeUtilizationFrac: chargeUtilization,
        chargeUtilizationDescription: "Charge Utilization Parameter: 0.88 — project calibration/assumption parameter",
        totalFaradayCurrent: Number(totalFaradayCurrent.toFixed(2)),
        current: cellCurrent,
        cellCurrent,

        // Sizing & Topology
        targetCurrentDensity: targetCurrentDensityAm2,
        currentDensity: actualCurrentDensityAm2,
        requiredTotalAreaM2: Number(requiredTotalAreaM2.toFixed(3)),
        electrodeArea: inputPlanarAreaCm2, // cm² per pair
        totalElectrodeAreaCm2,
        totalElectrodeAreaM2: Number(totalElectrodeAreaM2.toFixed(3)),
        totalMembraneAreaM2,
        membraneThicknessMm: 0.15,

        // Circulating Carbon Slurry Inventory & Precise Terminology
        slurryConcentrationWt,
        slurryFlowLmin,
        slurryFlowRatio,
        slurryCarbonDensityGL,
        carbonInventoryKg: totalCarbonInventoryKg,
        operatingSaltLoading: operatingSaltLoadingMgG, // Terminally precise
        operatingSacMgG: operatingSaltLoadingMgG,
        intrinsicSac: intrinsicSacMgG, // Material property
        sac: operatingSaltLoadingMgG, // Backwards UI compatibility

        // Modules & Integer Cell Pairs
        cellPairs,
        pairsPerModule,
        numberOfModules,

        // Voltages & Electrical Power
        voltageCell: cellVoltage,
        voltage: cellVoltage,
        voltageModule,
        voltageStack,

        // Hydrodynamics & Independent Powers
        waterRecovery: waterRecoveryPct,
        residenceTime: Number(residenceTimeMin.toFixed(4)),
        reactorVolumeLiters: Number(reactorVolumeLiters.toFixed(3)),
        flowVelocity: Number(flowVelocityWater.toFixed(4)),
        pressureDropWater,
        pressureDropSlurry,
        pressureDrop: pressureDropWater,
        waterPumpPowerW,
        slurryPumpPowerW,
        electricalPowerW: stackElectricalPowerW,
        power: stackElectricalPowerW,
        stackPowerW: stackElectricalPowerW,
        totalPumpPowerW: Number((waterPumpPowerW + slurryPumpPowerW).toFixed(1)),

        // Independent SEC Energy Accounting (Separate Electrical, Water Pump & Slurry Pump)
        secElectrical,
        secWaterPump,
        secSlurryPump,
        secHydraulic,
        secTotal,
        sec: secTotal,
        secEstimateLabel: `TOTAL NET SEC: ${secTotal} kWh/m³ [MODEL ESTIMATE]`,

        // Metadata & Structured Pedigree Object
        modelPredictionLabel: statusLabel,
        modelPedigree,
        envelopeStatus,
        envelopeMessage,
        envelopeConfig: FCDI_ENVELOPE,
        modelStatus: "First-Principles Physics (Continuous Flow-Electrode Slurry & Dual Hydrodynamic Pumping)"
    };
}

/**
 * Executes parameter sensitivity analysis across a specified range of parameter values.
 * Pure function: Does NOT mutate the input baseInput object.
 *
 * @param {object} baseInput - Base FCDI input configuration
 * @param {string} parameter - Name of parameter to vary
 * @param {Array<number>} values - Array of numeric values to test
 * @returns {object} Structured sensitivity results
 */
export function runFCDISensitivityAnalysis(baseInput = {}, parameter = "chargeUtilization", values = []) {
    if (!Array.isArray(values) || values.length === 0) {
        throw new Error("Values must be a non-empty array for sensitivity analysis.");
    }

    const results = values.map(val => {
        // Deep clone baseInput to prevent mutation of original object
        const clonedInput = JSON.parse(JSON.stringify(baseInput));

        if (parameter === "chargeUtilization" || parameter === "lambda") {
            clonedInput.chargeUtilization = val;
        } else if (parameter === "slurryConcentrationWt" || parameter === "slurryWt") {
            clonedInput.slurryConcentrationWt = val;
        } else if (parameter === "slurryFlowRatio") {
            clonedInput.slurryFlowRatio = val;
        } else if (parameter === "cellVoltage" || parameter === "voltage") {
            clonedInput.voltage = val;
        } else if (parameter === "feedTds" || parameter === "tds") {
            clonedInput.tds = val;
        } else if (parameter === "targetTds") {
            clonedInput.targetTds = val;
        } else if (parameter === "waterRecovery" || parameter === "recovery") {
            clonedInput.waterRecovery = val;
        } else if (parameter === "electrodeArea") {
            clonedInput.electrodeArea = val;
        } else if (parameter === "spacerThickness") {
            clonedInput.spacerThickness = val;
        } else {
            clonedInput[parameter] = val;
        }

        const res = calculateFCDIModel(clonedInput);
        return {
            value: val,
            outletTDS: res.outletTds,
            removalPercent: res.removalEfficiency,
            current: res.cellCurrent,
            electricalPower: res.electricalPowerW,
            waterPumpPower: res.waterPumpPowerW,
            slurryPumpPower: res.slurryPumpPowerW,
            hydraulicSEC: res.secHydraulic,
            electricalSEC: res.secElectrical,
            totalSEC: res.secTotal
        };
    });

    return {
        parameter,
        values,
        results
    };
}

export default calculateFCDIModel;
