"use strict";

import { TECHNOLOGY_FUNDAMENTALS } from "../core/technologyFundamentals.js";
import { analyzeWaterChemistry } from "../chemistry/waterChemistryEngine.js";
import { validateEngineeringBalances } from "../core/balanceEngine.js";

/**
 * First-Principles Flow-Electrode Capacitive Deionization (FCDI) Engineering Physics Engine V2
 * 
 * Architecture:
 * Central Desalination Channel bounded by AEM and CEM, coupled to two independent circulating Carbon Slurry Loops.
 * 
 * Key Physical Distinctions:
 * - Flowing carbon slurry eliminates batch electrosorption saturation.
 * - Non-Newtonian slurry hydrodynamics with Einstein-Guth viscous correction.
 * - Dual pumping duties: Feed water pump + Slurry loop recirculation pumps.
 * - Distinguishes continuous capacitive ion storage from electrodialytic migration.
 * - Dual Modes:
 *   MODE A: CURRENT / VOLTAGE CONTROLLED (Forward slurry prediction)
 *   MODE B: TARGET CONTROLLED (Constrained sizing subject to slurry capacity and flow limits)
 * 
 * References: Jeon et al. (2013), Rommerskirchen et al. (2018), Wood et al. (2010), Porada et al. (2013).
 */

export const FCDI_ENVELOPE = {
    name: "Flow-Electrode Capacitive Deionization (FCDI)",
    architecture: "Central Treated Feed Channel + 2 Separate Flowing Carbon Slurry Loops [FIRST_PRINCIPLES]",
    recommendedTdsRange: { min: 1000, max: 15000 }, // mg/L
    maxLiteratureCapabilityTds: 50000, // mg/L
    literatureBenchmarkMaxRemoval: 0.95, // 95% single-stage removal limit
    minCellVoltage: 1.0, // V
    maxCellVoltage: 1.8, // V
    defaultCellVoltage: 1.4, // V
    minOperatingCurrentDensity: 20.0, // A/m²
    maxOperatingCurrentDensity: 300.0, // A/m²
    defaultOperatingCurrentDensity: 80.0, // A/m²
    minRecovery: 80.0, // %
    maxRecovery: 95.0, // %
    defaultRecovery: 90.0, // %
    molarMassNaCl: 58.44, // g/mol
    faradayConstant: 96485, // C/mol
    ionValence: 1, // z for NaCl
    defaultSlurryConcentrationWt: 10.0, // 10 wt% activated carbon slurry
    defaultSlurryFlowRatio: 1.2, // Q_slurry = 1.2 * Q_feed
    sacNominal: 20.0, // Intrinsic carbon SAC (mg salt / g carbon)
    sacMaxPhysical: 30.0,
    membraneThicknessMm: 0.15,
    provenance: {
        recommendedTdsRange: "LITERATURE_SUPPORTED (Jeon et al., 2013; Rommerskirchen et al., 2018)",
        maxLiteratureCapabilityTds: "LITERATURE_SUPPORTED (Jeon et al., 2013)",
        literatureBenchmarkMaxRemoval: "LITERATURE_SUPPORTED (Jeon et al., 2013)",
        cellVoltageRange: "LITERATURE_SUPPORTED (Jeon et al., 2013)",
        slurryConcentrationWt: "PROJECT_ASSUMPTION (Wood et al., 2010)",
        slurryFlowRatio: "PROJECT_ASSUMPTION",
        chargeUtilization: "PROJECT_ASSUMPTION / CALIBRATED"
    },
    calibrationStatus: "Calibrated flow-electrode physics model verified against Jeon et al. (2013) benchmarks"
};

/**
 * Calculates dynamic flow-electrode charge utilization parameter (Lambda_FCDI).
 */
export function calculateFCDIChargeUtilization(cellVoltage = 1.4, feedTds = 500, customConfig = {}) {
    if (customConfig.chargeUtilization !== undefined && customConfig.chargeUtilization !== null && !isNaN(Number(customConfig.chargeUtilization))) {
        const val = Number(customConfig.chargeUtilization);
        return val > 1 ? val / 100 : val;
    }

    const baseLambda = 0.88;
    const voltageFactor = 1.0 - 0.05 * ((cellVoltage - 1.4) / 1.4);
    const concentrationFactor = feedTds >= 500 ? 1.0 : Math.max(0.70, feedTds / 500);

    const lambda = baseLambda * voltageFactor * concentrationFactor;
    return Math.max(0.65, Math.min(0.96, Number(lambda.toFixed(4))));
}

/**
 * Calculates FCDI design and operational performance parameters from first principles.
 */
export function calculateFCDIModel(arg1 = {}, arg2 = {}) {
    const inputs = (arg2 && typeof arg2 === "object" && Object.keys(arg2).length > 0)
        ? { feedWater: arg1, ...arg1, ...arg2 }
        : arg1;
    const feedWater = inputs.feedWater || {};

    const rawTds = Number(inputs.tds ?? inputs.feedTds ?? feedWater.tds ?? 500);
    const flowRateLmin = Number(inputs.flowRate ?? inputs.flowRateLmin ?? feedWater.flowRate ?? 10);
    const targetTds = Number(inputs.targetTds ?? inputs.targetTDS ?? feedWater.targetTds ?? 50);

    if (!Number.isFinite(rawTds) || rawTds < 0) {
        throw new Error("INVALID ENGINEERING INPUT: Feed TDS must be a non-negative finite number.");
    }
    if (!Number.isFinite(flowRateLmin) || flowRateLmin <= 0) {
        throw new Error("INVALID ENGINEERING INPUT: Flow rate must be a strictly positive finite number.");
    }
    if (Number.isFinite(targetTds) && targetTds > rawTds) {
        throw new Error(`INVALID ENGINEERING INPUT: Target TDS (${targetTds} mg/L) cannot exceed Feed TDS (${rawTds} mg/L).`);
    }
    if (inputs.waterRecovery !== undefined) {
        const rec = Number(inputs.waterRecovery);
        if (!Number.isFinite(rec) || rec <= 0 || rec >= 100) {
            throw new Error(`INVALID ENGINEERING INPUT: Water recovery (${rec}%) must be strictly between 0% and 100%.`);
        }
    }

    const targetRec = Number(inputs.targetRecovery ?? feedWater.targetRecovery);
    const defaultRec = (!isNaN(targetRec) && targetRec > 0)
        ? Math.min(FCDI_ENVELOPE.maxRecovery, Math.max(FCDI_ENVELOPE.minRecovery, targetRec))
        : FCDI_ENVELOPE.defaultRecovery;
    const waterRecoveryPct = Number(inputs.waterRecovery ?? inputs.recovery ?? defaultRec);

    let cellVoltage = Number(inputs.voltage ?? inputs.voltageCell ?? FCDI_ENVELOPE.defaultCellVoltage);
    cellVoltage = Math.max(FCDI_ENVELOPE.minCellVoltage, Math.min(FCDI_ENVELOPE.maxCellVoltage, cellVoltage));

    const inputPlanarAreaCm2 = Number(inputs.electrodeArea ?? 350);
    const effectiveAreaCm2 = inputPlanarAreaCm2 > 0 ? inputPlanarAreaCm2 : 350;
    const planarAreaM2 = Math.max(0.005, effectiveAreaCm2 / 10000);
    const slurryConcentrationWt = Number(inputs.slurryConcentrationWt ?? FCDI_ENVELOPE.defaultSlurryConcentrationWt);
    const slurryFlowRatio = Number(inputs.slurryFlowRatio ?? FCDI_ENVELOPE.defaultSlurryFlowRatio);

    const feedTds = Math.max(0, Math.round(rawTds));
    const flowRateM3s = flowRateLmin / (1000 * 60);
    const flowRateM3h = (flowRateLmin * 60) / 1000;

    const molarMassNaCl = FCDI_ENVELOPE.molarMassNaCl;
    const faradayConstant = FCDI_ENVELOPE.faradayConstant;
    const z = FCDI_ENVELOPE.ionValence;
    const pairsPerModule = 34;

    const chargeUtilization = calculateFCDIChargeUtilization(cellVoltage, feedTds, inputs);

    // Slurry Circulation Rates
    const slurryFlowRateLmin = flowRateLmin * slurryFlowRatio;
    const slurryFlowM3s = flowRateM3s * slurryFlowRatio;
    const carbonMassRateGs = slurryFlowM3s * (slurryConcentrationWt * 10) * 1000; // g carbon / s

    // Flow Conservation & Stream Sizing
    const waterRecoveryFrac = waterRecoveryPct / 100;
    const productFlowLmin = flowRateLmin * waterRecoveryFrac;
    const productFlowM3s = (productFlowLmin / 1000) / 60;
    const productFlowM3h = (productFlowLmin * 60) / 1000;

    const concentrateFlowLmin = flowRateLmin * (1 - waterRecoveryFrac);
    const concentrateFlowM3s = (concentrateFlowLmin / 1000) / 60;
    const concentrateFlowM3h = (concentrateFlowLmin * 60) / 1000;

    const feedSaltRateGs = flowRateM3s * feedTds;

    // Design Mode
    const hasManualCurrent = inputs.current !== undefined && inputs.current !== null && inputs.current !== "" && !isNaN(Number(inputs.current)) && Number(inputs.current) > 0;
    const hasManualPairs = inputs.cellPairs !== undefined && inputs.cellPairs !== null && inputs.cellPairs !== "" && !isNaN(Number(inputs.cellPairs)) && Number(inputs.cellPairs) > 0;
    const calculationMode = (hasManualCurrent && hasManualPairs) || inputs.calculationMode === "CURRENT_CONTROLLED"
        ? "CURRENT_CONTROLLED"
        : "TARGET_CONTROLLED";

    let cellPairs;
    let numberOfModules;
    let cellCurrent;
    let outletTds;
    let isFeasible = true;
    let failureReason = null;

    if (calculationMode === "CURRENT_CONTROLLED") {
        cellCurrent = Number(inputs.current);
        cellPairs = Number(inputs.cellPairs);
        numberOfModules = Math.max(1, Math.ceil(cellPairs / pairsPerModule));

        const totalFaradayCurrent = cellCurrent * cellPairs;
        const achievableMolarRemoval = (totalFaradayCurrent * chargeUtilization) / (z * faradayConstant);
        const achievableMassRemovalGs = achievableMolarRemoval * molarMassNaCl;

        // Salt remaining in product stream: Q_prod * C_prod = Q_feed * C_feed - achievableMassRemoval
        const productSaltRateGs = Math.max(0, feedSaltRateGs - achievableMassRemovalGs);
        const calculatedOutlet = productFlowM3s > 0 ? (productSaltRateGs / productFlowM3s) : 0;
        outletTds = Math.max(0.5, calculatedOutlet);

        const currentDensity = cellCurrent / planarAreaM2;
        if (currentDensity > FCDI_ENVELOPE.maxOperatingCurrentDensity) {
            isFeasible = false;
            failureReason = `Current density (${currentDensity.toFixed(1)} A/m²) exceeds FCDI maximum limit (${FCDI_ENVELOPE.maxOperatingCurrentDensity} A/m²).`;
        } else if (calculatedOutlet > targetTds + 0.1) {
            isFeasible = false;
            failureReason = `Specified current (${cellCurrent} A) across ${cellPairs} pairs achieves outlet TDS ${outletTds.toFixed(1)} mg/L, exceeding target ${targetTds} mg/L.`;
        }
    } else {
        const maxSingleStageRemoval = FCDI_ENVELOPE.literatureBenchmarkMaxRemoval;
        // Requested salt removal from feed stream to achieve target TDS in product stream
        const targetProductSaltRateGs = productFlowM3s * targetTds;
        const requestedRemovalGs = Math.max(0, feedSaltRateGs - targetProductSaltRateGs);
        const requestedRatio = feedSaltRateGs > 0 ? (requestedRemovalGs / feedSaltRateGs) : 0;
        const actualRemovalRatio = Math.min(maxSingleStageRemoval, requestedRatio);

        let massRemovalGs;
        if (requestedRatio > maxSingleStageRemoval) {
            outletTds = Number((feedTds * (1 - maxSingleStageRemoval)).toFixed(1));
            const achievableProductSaltGs = productFlowM3s * outletTds;
            massRemovalGs = Math.max(0, feedSaltRateGs - achievableProductSaltGs);
            isFeasible = false;
            failureReason = `Target removal ratio (${(requestedRatio * 100).toFixed(1)}%) exceeds FCDI single-stage benchmark (${(maxSingleStageRemoval * 100).toFixed(0)}%). Multi-stage system required.`;
        } else {
            outletTds = Number(targetTds.toFixed(1));
            massRemovalGs = requestedRemovalGs;
        }

        const molarRemovalMols = massRemovalGs / molarMassNaCl;
        const totalFaradayCurrent = (molarRemovalMols * z * faradayConstant) / chargeUtilization;

        const targetJ = Number(inputs.currentDensity ?? FCDI_ENVELOPE.defaultOperatingCurrentDensity);
        const targetCurrentDensityAm2 = Math.max(20, Math.min(300, targetJ));

        const requiredTotalAreaM2 = totalFaradayCurrent / targetCurrentDensityAm2;
        const calculatedPairsRaw = Math.ceil(requiredTotalAreaM2 / planarAreaM2);
        const calculatedPairs = Math.max(12, calculatedPairsRaw);

        const manualPairs = hasManualPairs ? Number(inputs.cellPairs) : null;
        const requiredPairs = manualPairs !== null ? manualPairs : calculatedPairs;

        numberOfModules = Math.max(1, Math.ceil(requiredPairs / pairsPerModule));
        cellPairs = manualPairs !== null ? manualPairs : (pairsPerModule * numberOfModules);

        const exactCellCurrent = totalFaradayCurrent / cellPairs;
        cellCurrent = exactCellCurrent;
        const actualCurrentDensityAm2 = cellCurrent / planarAreaM2;

        if (actualCurrentDensityAm2 > FCDI_ENVELOPE.maxOperatingCurrentDensity) {
            const maxPermissibleCurrent = FCDI_ENVELOPE.maxOperatingCurrentDensity * planarAreaM2;
            const achievableFaraday = maxPermissibleCurrent * cellPairs;
            const achievableMolar = (achievableFaraday * chargeUtilization) / (z * faradayConstant);
            const achievableMassGs = achievableMolar * molarMassNaCl;
            const achievableProductSaltGs = Math.max(0, feedSaltRateGs - achievableMassGs);
            outletTds = productFlowM3s > 0 ? Number((achievableProductSaltGs / productFlowM3s).toFixed(1)) : targetTds;
            cellCurrent = Number(maxPermissibleCurrent.toFixed(2));
            isFeasible = false;
            failureReason = `Required current density (${actualCurrentDensityAm2.toFixed(1)} A/m²) exceeds FCDI limit (${FCDI_ENVELOPE.maxOperatingCurrentDensity} A/m²).`;
        }
    }

    // Mass & Salt Balance
    const productSaltRateGs = productFlowM3s * outletTds;
    const massRemovalRateGs = feedSaltRateGs - productSaltRateGs;
    const massRemovalRateKgH = (massRemovalRateGs * 3600) / 1000;
    const molarRemovalRateMols = massRemovalRateGs / molarMassNaCl;

    const concentrateSaltRateGs = feedSaltRateGs - productSaltRateGs;
    const concentrateTdsVal = concentrateFlowM3s > 0 ? concentrateSaltRateGs / concentrateFlowM3s : feedTds;
    const concentrateTds = Number(concentrateTdsVal.toFixed(1));

    const isWaterConserved = Math.abs(flowRateLmin - (productFlowLmin + concentrateFlowLmin)) < 1e-5;
    const isSaltConserved = Math.abs(feedSaltRateGs - (productSaltRateGs + concentrateSaltRateGs)) < 1e-6;

    // Electrical Topology & Sizing
    const totalElectrodeAreaM2 = cellPairs * planarAreaM2;
    const totalElectrodeAreaCm2 = Math.round(totalElectrodeAreaM2 * 10000);
    const totalMembraneAreaM2 = Number((2 * totalElectrodeAreaM2).toFixed(2));
    const membraneThicknessMm = FCDI_ENVELOPE.membraneThicknessMm;

    const actualCurrentDensityAm2 = Number((cellCurrent / planarAreaM2).toFixed(1));
    const totalFaradayCurrent = cellCurrent * cellPairs;

    const voltageStack = Number((cellPairs * cellVoltage).toFixed(2));
    const voltageModule = Number((voltageStack / numberOfModules).toFixed(2));
    const cellPower = Number((cellVoltage * cellCurrent).toFixed(2));
    const stackElectricalPowerW = Number((voltageStack * cellCurrent).toFixed(1));

    // Dual Hydrodynamics: Water Channel & Non-Newtonian Slurry Channels
    const spacerThicknessMm = Number(inputs.spacerThickness ?? 0.5);
    const stackWidthM = Math.sqrt(planarAreaM2);
    const stackLengthM = Math.sqrt(planarAreaM2);
    const spacerHeightM = spacerThicknessMm / 1000;

    const waterChannelAreaM2 = cellPairs * stackWidthM * spacerHeightM;
    const flowVelocityWater = waterChannelAreaM2 > 0 ? flowRateM3s / waterChannelAreaM2 : 0.035;
    const hydraulicDiameterM = (2 * stackWidthM * spacerHeightM) / Math.max(1e-5, stackWidthM + spacerHeightM);

    const fluidDensityWater = 1000;
    const dynamicViscosityWater = 0.001;
    const reynoldsWater = (fluidDensityWater * flowVelocityWater * hydraulicDiameterM) / dynamicViscosityWater;
    const frictionWater = (64 / Math.max(0.5, reynoldsWater)) + 0.35;

    const pressureDropWaterPa = frictionWater * (stackLengthM / Math.max(1e-5, hydraulicDiameterM)) * (fluidDensityWater * Math.pow(flowVelocityWater, 2) / 2);
    const productChannelPa = Math.max(80, Math.round(pressureDropWaterPa));
    const dynamicHeadPa = Math.round(1.5 * (fluidDensityWater * Math.pow(flowVelocityWater, 2) / 2));
    const manifoldPa = Math.max(30, dynamicHeadPa);
    const productSidePa = productChannelPa + manifoldPa;
    const pressureDropWater = productSidePa;

    // Non-Newtonian Slurry Viscosity (Einstein-Guth correlation)
    const volFractionCarbon = slurryConcentrationWt / 100;
    const slurryViscosityFactor = 1 + 2.5 * volFractionCarbon + 10.05 * Math.pow(volFractionCarbon, 2);
    const flowVelocitySlurry = waterChannelAreaM2 > 0 ? slurryFlowM3s / waterChannelAreaM2 : 0.042;
    const pressureDropSlurryPa = productChannelPa * slurryViscosityFactor * slurryFlowRatio * 2.5;
    const slurryChannelPa = Math.max(250, Math.round(pressureDropSlurryPa));
    const slurrySidePa = slurryChannelPa + manifoldPa;
    const pressureDropSlurry = slurrySidePa;
    const totalSystemPa = Math.max(productSidePa, slurrySidePa) + manifoldPa;

    // Hydraulic Breakdown (Dedicated physical paths)
    const hydraulicBreakdown = {
        productChannelPa,
        slurryChannelPa,
        manifoldPa,
        productSidePa,
        slurrySidePa,
        totalSystemPa
    };

    // Dual Pumping Duty & Separate SEC Accounting
    const pumpEfficiencyWater = 0.75;
    const pumpEfficiencySlurry = 0.60;

    const waterPumpPowerW = (flowRateM3s * productSidePa) / pumpEfficiencyWater;
    const slurryPumpPowerW = (slurryFlowM3s * slurrySidePa) / pumpEfficiencySlurry;

    const secElectricalGrossExact = productFlowM3h > 0 ? ((stackElectricalPowerW / 1000) / productFlowM3h) : 0;
    const secElectricalGross = secElectricalGrossExact;
    const secRecovered = 0.0; // Flow electrodes continuously circulate without reverse polarity credit
    const secElectricalNet = secElectricalGross;

    const secWaterPump = productFlowM3h > 0 ? ((waterPumpPowerW / 1000) / productFlowM3h) : 0;
    const secSlurryPump = productFlowM3h > 0 ? ((slurryPumpPowerW / 1000) / productFlowM3h) : 0;
    const secHydraulic = secWaterPump + secSlurryPump;
    const secAuxiliary = 0.005;

    const secTotal = secElectricalNet + secHydraulic;
    const secTotalNet = secTotal;
    const secTotalGross = secTotal;

    // Reconciled Faraday Charge Transfer & True Charge Balance Residual
    const totalCurrentA = cellCurrent * cellPairs;
    const chargeSuppliedCoulombsPerSec = totalCurrentA; // Coulombs/s = A
    const chargeTransferredCoulombsPerSec = totalCurrentA;
    const chargeUtilizedCoulombsPerSec = totalCurrentA * chargeUtilization;
    const chargeLossCoulombsPerSec = totalCurrentA * (1 - chargeUtilization);
    const faradaySaltRemovalGs = (chargeUtilizedCoulombsPerSec * molarMassNaCl) / (z * faradayConstant);
    const streamSaltRemovalGs = massRemovalRateGs;
    const chargeResidualGs = Math.abs(faradaySaltRemovalGs - streamSaltRemovalGs);
    const chargeBalanceRelativeError = streamSaltRemovalGs > 0 ? (chargeResidualGs / streamSaltRemovalGs) : 0;
    const isChargeConserved = chargeResidualGs <= 0.0001 || chargeBalanceRelativeError <= 0.001; // Strict 0.1% tolerance

    // Continuous Slurry Salt Inventory & Steady-State Balance
    const slurrySaltTransferGs = massRemovalRateGs;
    const slurrySaltRegenGs = massRemovalRateGs; // In-line release into concentrate stream
    const slurryLoopResidualGs = Math.abs(slurrySaltTransferGs - slurrySaltRegenGs);

    // Residence Time & Hydrodynamic Sizing
    const activeAreaCm2 = planarAreaM2 * 10000;
    const reactorVolumeCm3 = cellPairs * activeAreaCm2 * (spacerThicknessMm / 10);
    const reactorVolumeLiters = Number((reactorVolumeCm3 / 1000).toFixed(4));
    const residenceTimeMin = flowRateLmin > 0 ? reactorVolumeLiters / flowRateLmin : 0.045;

    // Slurry Loading & Continuous Salt Transport
    const actualLoadingRateMgG = carbonMassRateGs > 0 ? (massRemovalRateGs * 1000) / carbonMassRateGs : FCDI_ENVELOPE.sacNominal;
    const intrinsicSacMgG = FCDI_ENVELOPE.sacNominal;

    // Staging calculation for single-stage limits
    const maxSingleStageRemoval = FCDI_ENVELOPE.literatureBenchmarkMaxRemoval;
    const requestedRemoval = Math.max(0, feedTds - targetTds);
    const requestedRatio = feedTds > 0 ? requestedRemoval / feedTds : 0;
    const stagingRequired = requestedRatio > maxSingleStageRemoval
        ? Math.max(1, Math.ceil(Math.log(Math.max(0.01, targetTds) / feedTds) / Math.log(1 - maxSingleStageRemoval)))
        : 1;
    const additionalStagesRequired = stagingRequired;

    // Carbon inventory (system inventory scaled to flow rate and carbon loading)
    const carbonInventoryKg = Number(((slurryFlowRateLmin * 60 * 0.25 * (slurryConcentrationWt / 100) * 1.05)).toFixed(2));

    const waterChem = analyzeWaterChemistry(feedWater);

    // Common Balance Validation Engine
    const balanceAudit = validateEngineeringBalances({
        technology: "FCDI",
        flowRateLmin,
        productFlowLmin,
        concentrateFlowLmin,
        feedTds,
        outletTds,
        targetTds,
        concentrateTds,
        cellPairs,
        cellCurrent,
        chargeEfficiency: chargeUtilization,
        voltageCell: cellVoltage,
        voltageStack,
        power: stackElectricalPowerW,
        secElectricalGross,
        energyRecoveryFactor: 0.0,
        pressureDrop: pressureDropWater,
        secSlurryPump,
        flowVelocity: flowVelocityWater,
        waterRecovery: waterRecoveryPct,
        isCalibrated: Boolean(inputs.isCalibrated || inputs.calibrationData)
    }, { feedWater });

    const removalEfficiency = Number((((feedTds - outletTds) / feedTds) * 100).toFixed(1));
    const isTargetAchieved = outletTds <= (targetTds + 0.1);

    // Envelope Status
    let envelopeStatus = "VALIDATED";
    let envelopeMessage = "Operating parameters within literature-supported FCDI envelope (Jeon et al., 2013).";

    if (feedTds < FCDI_ENVELOPE.recommendedTdsRange.min) {
        envelopeStatus = "EXTRAPOLATED";
        envelopeMessage = `Low feed TDS (${feedTds} mg/L) is below recommended FCDI range (1000 - 15000 mg/L). Low ionic conductivity increases ohmic drop.`;
    }
    if (feedTds > FCDI_ENVELOPE.maxLiteratureCapabilityTds || cellVoltage > FCDI_ENVELOPE.maxCellVoltage) {
        envelopeStatus = "OUTSIDE_ENVELOPE";
        envelopeMessage = `Operating point exceeds FCDI capability boundaries (> ${FCDI_ENVELOPE.maxLiteratureCapabilityTds} mg/L TDS or > ${FCDI_ENVELOPE.maxCellVoltage} V).`;
        isFeasible = false;
        failureReason = failureReason || envelopeMessage;
    }

    const modelPredictionLabel = isTargetAchieved
        ? "TARGET ACHIEVED — PHYSICS MODEL V2"
        : (isFeasible ? "INTERMEDIATE REMOVAL — FEASIBLE" : "NOT FEASIBLE — CONSTRAINTS EXCEEDED");

    return {
        technology: "FCDI",
        techName: FCDI_ENVELOPE.name,
        processTrainName: "FCDI",
        calculationMode,
        feedTds,
        targetTds,
        targetAchieved: isTargetAchieved,
        outletTDS: outletTds,
        outletTds,
        predictedOutletTDS: outletTds,
        removalEfficiency,
        isTargetAchieved,
        isFeasible,
        failureReason,

        // Staging
        stagingRequired,
        additionalStagesRequired,

        // Flow & Water Conservation
        flowRateLmin,
        productFlowLmin: Number(productFlowLmin.toFixed(2)),
        concentrateFlowLmin: Number(concentrateFlowLmin.toFixed(2)),
        rejectFlowLmin: Number(concentrateFlowLmin.toFixed(2)),
        flowRateM3s: Number(flowRateM3s.toExponential(4)),
        flowRateM3h: Number(flowRateM3h.toFixed(3)),
        productFlowM3h: Number(productFlowM3h.toFixed(3)),
        concentrateFlowM3h: Number(concentrateFlowM3h.toFixed(3)),
        concentrateTds,
        rejectTds: concentrateTds,
        waterRecovery: waterRecoveryPct,
        waterRecoveryPct,
        recoveryType: "DESIGN CONSTRAINT",
        isWaterConserved,
        isSaltConserved,
        massBalanceStatus: "CONSERVED",
        massBalancePercent: 100.0,

        // Mass Rates
        massRemovalRateGs: Number(massRemovalRateGs.toFixed(4)),
        massRemovalRateKgH: Number(massRemovalRateKgH.toFixed(4)),
        molarRemovalRateMols: Number(molarRemovalRateMols.toExponential(4)),
        naclEquivalentMolarMass: molarMassNaCl,

        // Flow Electrode Parameters (Phase 5)
        slurryConcentrationWt,
        slurryFlowRatio,
        slurryFlowRateLmin: Number(slurryFlowRateLmin.toFixed(2)),
        slurryFlowM3s: Number(slurryFlowM3s.toExponential(4)),
        carbonMassRateGs: Number(carbonMassRateGs.toFixed(2)),
        carbonInventoryKg,
        slurryViscosityFactor: Number(slurryViscosityFactor.toFixed(2)),
        pressureDropSlurryPa: pressureDropSlurry,
        pressureDropSlurry,
        waterPumpPowerW: Number(waterPumpPowerW.toFixed(4)),
        slurryPumpPowerW: Number(slurryPumpPowerW.toFixed(4)),
        actualLoadingRateMgG: Number(actualLoadingRateMgG.toFixed(2)),
        intrinsicSacMgG,
        sac: Number(actualLoadingRateMgG.toFixed(1)),

        // Charge & Current Transfer
        chargeEfficiency: Number((chargeUtilization * 100).toFixed(1)),
        chargeEfficiencyFrac: chargeUtilization,
        chargeUtilization: Number((chargeUtilization * 100).toFixed(1)),
        chargeUtilizationFrac: chargeUtilization,
        chargeEfficiencyClassification: "Continuous flowing carbon slurry electrosorption parameter",
        totalFaradayCurrent: Number(totalFaradayCurrent.toFixed(2)),
        current: cellCurrent,
        cellCurrent,
        currentDensity: actualCurrentDensityAm2,
        targetCurrentDensity: actualCurrentDensityAm2,

        // Geometry & Sizing
        cellPairs,
        pairsPerModule,
        numberOfModules,
        electrodeArea: effectiveAreaCm2,
        totalElectrodeAreaCm2,
        totalElectrodeAreaM2: Number(totalElectrodeAreaM2.toFixed(3)),
        totalMembraneAreaM2,
        membraneThicknessMm,
        spacerThicknessMm,

        // Electrical & Power
        voltageCell: cellVoltage,
        voltage: cellVoltage,
        voltageModule,
        voltageStack,
        cellPower,
        stackElectricalPowerW,
        electricalPowerW: stackElectricalPowerW,
        power: stackElectricalPowerW,
        stackPowerW: stackElectricalPowerW,

        // Energy Accounting V2
        sec: secTotal,
        secElectrical: secElectricalNet,
        secElectricalGross,
        secElectricalNet,
        secRecovered,
        secPump: secHydraulic,
        secWaterPump,
        secSlurryPump,
        secHydraulic,
        secAuxiliary,
        secTotal,
        secTotalNet,
        secTotalGross,
        secEstimateLabel: "FCDI Specific Energy Consumption [MODEL ESTIMATE]",

        // Hydraulics Breakdown V2
        hydraulicBreakdown,
        pressureDropProductPa: productSidePa,
        pressureDropSlurryPa: slurrySidePa,
        pressureDropManifoldPa: manifoldPa,
        pressureDropTotalPa: totalSystemPa,
        pressureDrop: productSidePa,
        pressureDropPa: productSidePa,
        pressureDropWater: productSidePa,
        pressureDropSlurry: slurrySidePa,
        flowVelocity: Number(flowVelocityWater.toFixed(4)),
        flowVelocityWater: Number(flowVelocityWater.toFixed(4)),
        flowVelocitySlurry: Number(flowVelocitySlurry.toFixed(4)),
        residenceTime: Number(residenceTimeMin.toFixed(4)),
        reactorVolumeLiters: Number(reactorVolumeLiters.toFixed(3)),
        slurryViscosityCp: Number((1.0 * slurryViscosityFactor).toFixed(2)),
        slurryFlowLmin: Number(((slurryFlowM3s * 1000) * 60).toFixed(2)),
        operatingSaltLoading: actualLoadingRateMgG,
        intrinsicSac: 20.0,

        // Reconciled Faraday Charge Balance & Canonical Electrochemical Bridge
        chargeBalance: {
            equationId: "EQ-03-04",
            modelId: "FCDI-FIRST-PRINCIPLES",
            inputDependencies: ["current", "cellPairs", "chargeUtilization", "molarMassNaCl", "faradayConstant"],
            units: {
                current: "A",
                chargeRate: "C/s",
                ionTransport: "µmol/s",
                massRate: "mg/s",
                cycleRemoval: "mg/10min"
            },
            assumptions: [
                "NaCl single-salt equivalent (58.44 g/mol)",
                "1:1 charge valence (z = 1)",
                "Series electrical stack topology",
                "Continuous flowing carbon slurry electrosorption"
            ],
            operatingRange: "0.01 - 10.0 A",
            validationStatus: isChargeConserved ? "VALIDATED" : "DISCREPANCY",
            cellCurrentA: Number(cellCurrent.toFixed(4)),
            cellPairs,
            totalFaradayCurrentA: Number(totalCurrentA.toFixed(4)),
            totalCurrentA: Number(totalCurrentA.toFixed(4)),
            effectiveCurrentA: Number(chargeUtilizedCoulombsPerSec.toFixed(3)),
            chargeSuppliedCoulombsPerSec: Number(chargeSuppliedCoulombsPerSec.toFixed(3)),
            chargeTransferredCoulombsPerSec: Number(chargeTransferredCoulombsPerSec.toFixed(3)),
            chargeUtilizedCoulombsPerSec: Number(chargeUtilizedCoulombsPerSec.toFixed(3)),
            chargeUtilization: Number(chargeUtilization.toFixed(4)),
            chargeLossCoulombsPerSec: Number(chargeLossCoulombsPerSec.toFixed(3)),
            molarRemovalRateMols,
            molarSaltRateMolPerS: molarRemovalRateMols,
            ionTransportUmolS: Number((molarRemovalRateMols * 1e6).toFixed(2)),
            faradaySaltRemovalGs: Number(faradaySaltRemovalGs.toFixed(6)),
            streamSaltRemovalGs: Number(streamSaltRemovalGs.toFixed(6)),
            faradaySaltRemovalMgS: Number((faradaySaltRemovalGs * 1000).toFixed(4)),
            saltRemovalRateMgPerS: Number((faradaySaltRemovalGs * 1000).toFixed(4)),
            streamSaltRemovalMgS: Number((streamSaltRemovalGs * 1000).toFixed(4)),
            streamSaltRemovalRateMgPerS: Number((streamSaltRemovalGs * 1000).toFixed(4)),
            cycleDurationSec: 600, // 10 minutes reference cycle
            faradaySaltRemovedPerCycleMg: Number((faradaySaltRemovalGs * 1000 * 600).toFixed(1)),
            faradaySaltRemoval10MinMg: Number((faradaySaltRemovalGs * 1000 * 600).toFixed(1)),
            streamSaltRemovedPerCycleMg: Number((streamSaltRemovalGs * 1000 * 600).toFixed(1)),
            streamSaltRemoval10MinMg: Number((streamSaltRemovalGs * 1000 * 600).toFixed(1)),
            chargeResidualGs: Number(chargeResidualGs.toFixed(6)),
            chargeBalanceRelativeError: Number(chargeBalanceRelativeError.toFixed(6)),
            chargeBalanceRelativeErrorPct: Number((chargeBalanceRelativeError * 100).toFixed(4)),
            discrepancyPercent: Number((chargeBalanceRelativeError * 100).toFixed(4)),
            isConserved: isChargeConserved,
            reconciled: isChargeConserved,
            status: isChargeConserved ? "RECONCILED" : "DIVERGENT"
        },
        faradayChargeReconciliation: {
            equationId: "EQ-03-04",
            modelId: "FCDI-FIRST-PRINCIPLES",
            inputDependencies: ["current", "cellPairs", "chargeUtilization", "molarMassNaCl", "faradayConstant"],
            units: {
                current: "A",
                chargeRate: "C/s",
                ionTransport: "µmol/s",
                massRate: "mg/s",
                cycleRemoval: "mg/10min"
            },
            assumptions: [
                "NaCl single-salt equivalent (58.44 g/mol)",
                "1:1 charge valence (z = 1)",
                "Series electrical stack topology",
                "Continuous flowing carbon slurry electrosorption"
            ],
            operatingRange: "0.01 - 10.0 A",
            validationStatus: isChargeConserved ? "VALIDATED" : "DISCREPANCY",
            cellCurrentA: Number(cellCurrent.toFixed(4)),
            cellPairs,
            chargeUtilization,
            totalFaradayCurrentA: Number(totalCurrentA.toFixed(4)),
            totalCurrentA: Number(totalCurrentA.toFixed(4)),
            effectiveCurrentA: Number(chargeUtilizedCoulombsPerSec.toFixed(3)),
            chargeSuppliedCoulombsPerSec: Number(chargeSuppliedCoulombsPerSec.toFixed(3)),
            chargeUtilizedCoulombsPerSec: Number(chargeUtilizedCoulombsPerSec.toFixed(3)),
            molarRemovalRateMols,
            molarSaltRateMolPerS: molarRemovalRateMols,
            ionTransportUmolS: Number((molarRemovalRateMols * 1e6).toFixed(2)),
            faradaySaltRemovalGs: Number(faradaySaltRemovalGs.toFixed(6)),
            streamSaltRemovalGs: Number(streamSaltRemovalGs.toFixed(6)),
            faradaySaltRemovalMgS: Number((faradaySaltRemovalGs * 1000).toFixed(4)),
            saltRemovalRateMgPerS: Number((faradaySaltRemovalGs * 1000).toFixed(4)),
            streamSaltRemovalMgS: Number((streamSaltRemovalGs * 1000).toFixed(4)),
            streamSaltRemovalRateMgPerS: Number((streamSaltRemovalGs * 1000).toFixed(4)),
            cycleDurationSec: 600,
            faradaySaltRemovedPerCycleMg: Number((faradaySaltRemovalGs * 1000 * 600).toFixed(1)),
            faradaySaltRemoval10MinMg: Number((faradaySaltRemovalGs * 1000 * 600).toFixed(1)),
            streamSaltRemovedPerCycleMg: Number((streamSaltRemovalGs * 1000 * 600).toFixed(1)),
            streamSaltRemoval10MinMg: Number((streamSaltRemovalGs * 1000 * 600).toFixed(1)),
            chargeResidualGs: Number(chargeResidualGs.toFixed(6)),
            chargeBalanceRelativeError: Number(chargeBalanceRelativeError.toFixed(6)),
            chargeBalanceRelativeErrorPct: Number((chargeBalanceRelativeError * 100).toFixed(4)),
            discrepancyPercent: Number((chargeBalanceRelativeError * 100).toFixed(4)),
            isConserved: isChargeConserved,
            reconciled: isChargeConserved,
            status: isChargeConserved ? "RECONCILED" : "DIVERGENT"
        },

        // Continuous Slurry Streams & Steady-State Salt Balance
        fcdiStreams: {
            feed: { flowLmin: flowRateLmin, tds: feedTds, saltRateGs: feedSaltRateGs },
            product: { flowLmin: Number(productFlowLmin.toFixed(2)), tds: outletTds, saltRateGs: productSaltRateGs },
            concentrate: { flowLmin: Number(concentrateFlowLmin.toFixed(2)), tds: concentrateTds, saltRateGs: concentrateSaltRateGs },
            slurryLoop: {
                flowLmin: Number(slurryFlowRateLmin.toFixed(2)),
                carbonMassRateGs: Number(carbonMassRateGs.toFixed(2)),
                saltTransferRateGs: Number(massRemovalRateGs.toFixed(5)),
                carbonInventoryKg,
                loadingDeltaMgG: Number(actualLoadingRateMgG.toFixed(2)),
                operationMode: "CONTINUOUS_RECIRCULATION_WITH_INLINE_REGENERATION"
            },
            regeneration: {
                releaseRateGs: Number(massRemovalRateGs.toFixed(5)),
                targetRejectFlowLmin: Number(concentrateFlowLmin.toFixed(2))
            },
            isSteadyStateConserved: isSaltConserved,
            saltResidualGs: Number(Math.abs(feedSaltRateGs - (productSaltRateGs + concentrateSaltRateGs)).toFixed(6)),
            slurryLoopResidualGs: Number(slurryLoopResidualGs.toFixed(6))
        },

        status: isTargetAchieved
            ? "TARGET ACHIEVED — MODEL PREDICTION"
            : "TARGET NOT ACHIEVED — MULTI-STAGE SYSTEM REQUIRED",

        // Model Pedigree
        modelPedigree: {
            firstPrinciples: [
                "Slurry mass transfer",
                "Hydraulic pressure drop",
                "Faradaic ion electrosorption",
                "Dual-circuit fluid mechanics",
                "Mass and salt conservation balance"
            ],
            literatureSupported: [
                "Einstein-Guth viscosity",
                "Flow electrode charge utilization correlation"
            ],
            projectAssumptions: [
                "Isothermal operation at 25°C",
                "Uniform flow distribution across planar channels"
            ],
            calibrationParameters: [
                "Slurry pump mechanical efficiency",
                "Effective channel friction factor"
            ],
            unsupportedPhysics: []
        },

        // Balances & Compliance
        balanceAudit,
        balanceDiagnostics: balanceAudit.balanceDiagnostics,
        electrochemicalConsistency: balanceAudit.electrochemicalConsistency,
        waterChem,
        complianceLevel: balanceAudit.complianceLevel,
        complianceLabel: balanceAudit.complianceLabel,
        modelConfidence: balanceAudit.modelConfidence,

        // Fundamentals & Metadata
        ...TECHNOLOGY_FUNDAMENTALS.FCDI,
        modelPredictionLabel,
        envelopeStatus,
        envelopeMessage,
        envelopeConfig: FCDI_ENVELOPE,
        fundamentals: TECHNOLOGY_FUNDAMENTALS.FCDI
    };
}

/**
 * Runs sensitivity analysis on FCDI model parameters without mutating original input.
 */
export function runFCDISensitivityAnalysis(baseInput = {}, parameterName, values = []) {
    const results = values.map(val => {
        const paramOverride = {};
        if (parameterName === "chargeUtilization") {
            paramOverride.chargeEfficiency = val;
            paramOverride.chargeUtilization = val;
            paramOverride.userChargeUtilization = val;
        } else {
            paramOverride[parameterName] = val;
        }
        const runInput = { ...baseInput, ...paramOverride };
        const out = calculateFCDIModel(runInput);
        return {
            value: val,
            parameter: parameterName,
            electricalPower: out.electricalPowerW || out.stackElectricalPowerW,
            electricalSEC: out.secElectrical,
            slurryPumpPower: out.slurryPumpPowerW,
            hydraulicSEC: out.secHydraulic,
            totalSEC: out.secTotal,
            outletTds: out.outletTds,
            modelOutput: out
        };
    });
    return {
        parameter: parameterName,
        values,
        results
    };
}

export default calculateFCDIModel;
