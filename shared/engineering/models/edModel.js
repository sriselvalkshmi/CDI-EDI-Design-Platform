"use strict";

/**
 * First-Principles Electrodialysis (ED) Process Model
 * 
 * Physics Basis:
 * - Alternating Anion-Exchange Membranes (AEM) and Cation-Exchange Membranes (CEM).
 * - Continuous electromigration under DC electric field across dilute and concentrate compartments.
 * - Limiting Current Density (I_lim) governed by convective-diffusive boundary layer mass transfer (Sherwood correlation).
 * - Concentration polarization (CP = I / I_lim) strictly bounded below 0.85 to prevent unmitigated water dissociation.
 * - Multi-component cell pair resistance: R_cell = R_AEM + R_CEM + R_dilute + R_concentrate + V_Donnan.
 * - Dual-stream hydraulic modeling (dilute product stream + concentrate reject stream).
 * - Rigorous mass, salt, charge, and energy conservation via validateEngineeringBalances.
 */

import { validateEngineeringBalances } from "../core/balanceEngine.js";
import { analyzeWaterChemistry } from "../chemistry/waterChemistryEngine.js";

export const DEFAULT_ED_LIMITS = {
    name: "Electrodialysis (ED)",
    category: "Electromembrane",
    minFeedTdsMgL: 500,
    maxFeedTdsMgL: 12000,
    sweetSpotMinTds: 1000,
    sweetSpotMaxTds: 8000,
    maxHardnessMgLAsCaCO3: 250, // Standard ED scaling limit (without polarity reversal)
    maxRecovery: 90.0,
    minRecovery: 70.0,
    defaultRecovery: 85.0,
    defaultCellPairVoltage: 1.0,  // V / cell pair nominal
    minCellPairVoltage: 0.5,
    maxCellPairVoltage: 2.0,
    defaultCurrentDensityAm2: 120, // A/m² nominal
    maxOperatingCurrentDensity: 300, // A/m² hard equipment ceiling
    membraneThicknessMm: 0.15,
    channelThicknessMm: 0.75,
    spacerPorosity: 0.75,
    counterIonTransportNumber: 0.98,
    solutionTransportNumber: 0.40,
    waterDiffusivityM2s: 1.61e-9, // NaCl at 25°C
    molarMassNaCl: 58.44,
    faradayConstant: 96485,
    ionValence: 1,
    typicalCurrentEfficiency: 0.90
};

/**
 * Calculates limiting current density (I_lim in A/m²) using Sherwood convective-diffusive mass transfer correlation.
 * i_lim = (z * F * k_L * C_dilute) / (t_m - t_s)
 */
export function calculateEDLimitingCurrentDensity({
    flowVelocity = 0.05,        // m/s interstitial velocity
    channelThicknessM = 0.00075,// channel spacing (m)
    diluteTdsMgL = 500,         // bulk dilute salinity (mg/L)
    temperatureC = 25
}) {
    const D = DEFAULT_ED_LIMITS.waterDiffusivityM2s * (1 + 0.025 * (temperatureC - 25));
    const fluidDensity = 1000 - 0.02 * (temperatureC - 20);
    const dynamicViscosity = 0.001 * Math.exp(0.02 * (20 - temperatureC));
    const kinematicViscosity = dynamicViscosity / fluidDensity;

    // Hydraulic diameter of thin rectangular channel with spacer: d_h ≈ 2 * channelThickness
    const dh = 2 * channelThicknessM;
    const reynoldsNumber = Math.max(0.1, (flowVelocity * dh) / kinematicViscosity);
    const schmidtNumber = Math.max(10, kinematicViscosity / D);

    // Sherwood correlation for netting spacer channel (Pawlowski et al., Journal of Membrane Science)
    // Sh = 0.29 * Re^0.50 * Sc^0.33
    const sherwoodNumber = 0.29 * Math.pow(reynoldsNumber, 0.50) * Math.pow(schmidtNumber, 0.33);
    const kL = (sherwoodNumber * D) / dh; // mass transfer coefficient (m/s)

    const z = DEFAULT_ED_LIMITS.ionValence;
    const F = DEFAULT_ED_LIMITS.faradayConstant;
    const tm = DEFAULT_ED_LIMITS.counterIonTransportNumber;
    const ts = DEFAULT_ED_LIMITS.solutionTransportNumber;
    const deltaT = Math.max(0.1, tm - ts); // ~0.58

    // Concentration in mol/m³
    const cDiluteMolM3 = Math.max(0.1, diluteTdsMgL / DEFAULT_ED_LIMITS.molarMassNaCl);

    // Limiting current density in A/m²
    const iLim = (z * F * kL * cDiluteMolM3) / deltaT;
    return Math.max(10.0, Math.min(800.0, Number(iLim.toFixed(1))));
}

/**
 * Calculates ED design and operational performance parameters from first principles.
 */
export function calculateEDModel(arg1 = {}, arg2 = {}) {
    const inputs = (arg2 && typeof arg2 === "object" && Object.keys(arg2).length > 0)
        ? { feedWater: arg1, ...arg1, ...arg2 }
        : arg1;
    const feedWater = inputs.feedWater || {};

    const rawTds = Number(inputs.tds ?? inputs.feedTds ?? feedWater.tds ?? 2000.0);
    const rawHardness = Number(inputs.hardness ?? inputs.feedHardness ?? feedWater.hardness ?? 100.0);
    const flowRateLmin = Number(inputs.flowRate ?? inputs.flowRateLmin ?? feedWater.flowRate ?? 10.0);
    const targetTds = Number(inputs.targetTds ?? inputs.targetTDS ?? feedWater.targetTds ?? 200.0);
    const temperatureC = Number(inputs.temperature ?? feedWater.temperature ?? 25.0);

    if (isNaN(rawTds) || rawTds <= 0 || isNaN(flowRateLmin) || flowRateLmin <= 0) {
        throw new Error("Invalid inputs: flowRate and feedTds must be valid positive numbers for ED calculation.");
    }

    const feedTds = Math.max(10, rawTds);
    const feedHardness = Math.max(0, rawHardness);

    // Recovery
    const requestedRecovery = inputs.waterRecovery !== undefined || inputs.recovery !== undefined
        ? Number(inputs.waterRecovery ?? inputs.recovery)
        : (feedWater.targetRecovery !== undefined ? Number(feedWater.targetRecovery) : DEFAULT_ED_LIMITS.defaultRecovery);
    const waterRecoveryPct = Math.min(DEFAULT_ED_LIMITS.maxRecovery, Math.max(DEFAULT_ED_LIMITS.minRecovery, requestedRecovery));
    const waterRecoveryFrac = waterRecoveryPct / 100;

    // SI Conversions
    const flowRateM3s = (flowRateLmin / 1000) / 60;
    const flowRateM3h = (flowRateLmin * 60) / 1000;
    const productFlowLmin = flowRateLmin * waterRecoveryFrac;
    const productFlowM3s = (productFlowLmin / 1000) / 60;
    const productFlowM3h = (productFlowLmin * 60) / 1000;
    const concentrateFlowLmin = flowRateLmin * (1 - waterRecoveryFrac);
    const concentrateFlowM3s = (concentrateFlowLmin / 1000) / 60;
    const concentrateFlowM3h = (concentrateFlowLmin * 60) / 1000;

    // Membrane Dimensions & Sizing
    const inputPlanarAreaCm2 = Number(inputs.electrodeArea ?? inputs.membraneArea ?? 500.0);
    const planarAreaM2 = Math.max(0.02, inputPlanarAreaCm2 / 10000); // 0.05 m² nominal
    const pairsPerModule = 50;

    // Channel Hydraulics
    const channelThicknessMm = DEFAULT_ED_LIMITS.channelThicknessMm;
    const channelThicknessM = channelThicknessMm / 1000;
    const stackWidthM = Math.sqrt(planarAreaM2);
    const stackLengthM = Math.sqrt(planarAreaM2);

    // Current Efficiency (Faradaic transport fraction: 0.85 - 0.95)
    let currentEfficiency = Number(inputs.chargeEfficiency ?? inputs.currentEfficiency ?? DEFAULT_ED_LIMITS.typicalCurrentEfficiency);
    if (currentEfficiency > 1.0) currentEfficiency /= 100;
    currentEfficiency = Math.max(0.70, Math.min(0.98, currentEfficiency));

    // Design Mode
    const hasManualCurrent = inputs.current !== undefined && inputs.current !== null && inputs.current !== "" && !isNaN(Number(inputs.current));
    const hasManualPairs = inputs.cellPairs !== undefined && inputs.cellPairs !== null && inputs.cellPairs !== "" && !isNaN(Number(inputs.cellPairs));
    const calculationMode = (hasManualCurrent && hasManualPairs) || inputs.calculationMode === "CURRENT_CONTROLLED"
        ? "CURRENT_CONTROLLED"
        : "TARGET_CONTROLLED";

    let cellPairs;
    let numberOfModules;
    let cellCurrent;
    let currentDensityAm2;
    let outletTds;
    let isFeasible = true;
    let failureReason = null;

    // Physical single-pass removal limit for standard ED (typically max 85-90% removal per pass)
    const maxSinglePassRemovalRatio = 0.90;

    if (calculationMode === "CURRENT_CONTROLLED") {
        cellCurrent = Number(Number(inputs.current ?? 6.0).toFixed(2));
        cellPairs = Number(inputs.cellPairs ?? 100);
        numberOfModules = Math.max(1, Math.ceil(cellPairs / pairsPerModule));
        currentDensityAm2 = Number((cellCurrent / planarAreaM2).toFixed(1));

        // Migration rate: n_dot = (N_pairs * I * xi) / (z * F)
        const molarRemovalRateMols = (cellPairs * cellCurrent * currentEfficiency) / (DEFAULT_ED_LIMITS.ionValence * DEFAULT_ED_LIMITS.faradayConstant);
        const massRemovalRateGs = molarRemovalRateMols * DEFAULT_ED_LIMITS.molarMassNaCl;

        const deltaTds = productFlowM3s > 0 ? (massRemovalRateGs / productFlowM3s) : 0;
        const calcOutlet = Math.max(5.0, feedTds - deltaTds);
        outletTds = Number(calcOutlet.toFixed(1));

        if (outletTds > targetTds + 1.0) {
            isFeasible = false;
            failureReason = `Specified current (${cellCurrent} A) across ${cellPairs} pairs yields outlet TDS ${outletTds} mg/L, exceeding target ${targetTds} mg/L.`;
        }
    } else {
        // Target Controlled Sizing
        const requestedRemoval = Math.max(0, feedTds - targetTds);
        const requestedRatio = feedTds > 0 ? requestedRemoval / feedTds : 0;
        const actualRemovalRatio = Math.min(maxSinglePassRemovalRatio, requestedRatio);

        if (requestedRatio > maxSinglePassRemovalRatio) {
            outletTds = Number((feedTds * (1 - actualRemovalRatio)).toFixed(1));
            isFeasible = false;
            failureReason = `Target removal ratio (${(requestedRatio * 100).toFixed(1)}%) exceeds ED single-stage physical limit (${(maxSinglePassRemovalRatio * 100).toFixed(0)}%). Minimum outlet is ${outletTds} mg/L.`;
        } else {
            outletTds = Number(targetTds.toFixed(1));
        }

        const deltaTds = feedTds - outletTds;
        const massRemovalRateGs = productFlowM3s * deltaTds;
        const molarRemovalRateMols = massRemovalRateGs / DEFAULT_ED_LIMITS.molarMassNaCl;

        // Total Faraday current required: I_total = (n_dot * z * F) / xi
        const totalFaradayCurrent = (molarRemovalRateMols * DEFAULT_ED_LIMITS.ionValence * DEFAULT_ED_LIMITS.faradayConstant) / currentEfficiency;

        // Target operating current density (nominal 100 - 150 A/m²)
        const targetJ = Number(inputs.currentDensity ?? DEFAULT_ED_LIMITS.defaultCurrentDensityAm2);
        const targetCurrentDensity = Math.max(20, Math.min(DEFAULT_ED_LIMITS.maxOperatingCurrentDensity, targetJ));

        const requiredTotalAreaM2 = totalFaradayCurrent / targetCurrentDensity;
        const calculatedPairsRaw = Math.ceil(requiredTotalAreaM2 / planarAreaM2);
        const calculatedPairs = Math.max(20, calculatedPairsRaw);

        const manualPairs = hasManualPairs ? Number(inputs.cellPairs) : null;
        cellPairs = manualPairs !== null ? manualPairs : calculatedPairs;
        numberOfModules = Math.max(1, Math.ceil(cellPairs / pairsPerModule));

        cellCurrent = totalFaradayCurrent / cellPairs;
        currentDensityAm2 = Number((cellCurrent / planarAreaM2).toFixed(1));
    }

    // Interstitial Flow Velocity
    const diluteFlowAreaM2 = cellPairs * stackWidthM * channelThicknessM * DEFAULT_ED_LIMITS.spacerPorosity;
    const interstitialVelocity = diluteFlowAreaM2 > 0 ? flowRateM3s / diluteFlowAreaM2 : 0.045;

    // Limiting Current Density Check (Sherwood correlation)
    const iLim = calculateEDLimitingCurrentDensity({
        flowVelocity: interstitialVelocity,
        channelThicknessM,
        diluteTdsMgL: Math.max(10, outletTds),
        temperatureC
    });

    const concentrationPolarizationFactor = Number((currentDensityAm2 / iLim).toFixed(2));
    const isBelowLimitingCurrent = concentrationPolarizationFactor <= 0.85;

    if (!isBelowLimitingCurrent) {
        isFeasible = false;
        failureReason = `Operating current density (${currentDensityAm2} A/m²) exceeds 85% of limiting current density (${iLim} A/m²; CP = ${concentrationPolarizationFactor}). Risk of water dissociation & membrane fouling.`;
    }

    // Concentrate Stream Chemistry & Scaling
    const feedSaltRateGs = flowRateM3s * feedTds;
    const productSaltRateGs = productFlowM3s * outletTds;
    const concentrateSaltRateGs = Math.max(0, feedSaltRateGs - productSaltRateGs);
    const concentrateTds = concentrateFlowM3s > 0 ? Number((concentrateSaltRateGs / concentrateFlowM3s).toFixed(1)) : feedTds;

    // Electrical Resistance & Stack Voltage
    // Solution conductivity: kappa ≈ (TDS / 0.65) * 1e-4 S/m
    const kappaDilute = Math.max(1e-3, ((feedTds + outletTds) / 2 / 0.65) * 1e-4);
    const kappaConc = Math.max(1e-2, (concentrateTds / 0.65) * 1e-4);

    const rAem = 0.00020; // 2.0 Ohm-cm² = 0.00020 Ohm-m²
    const rCem = 0.00020;
    const rDilute = channelThicknessM / (kappaDilute * DEFAULT_ED_LIMITS.spacerPorosity);
    const rConc = channelThicknessM / (kappaConc * DEFAULT_ED_LIMITS.spacerPorosity);

    const rCellPairM2 = rAem + rCem + rDilute + rConc;
    const rCellPairOhm = rCellPairM2 / planarAreaM2;

    // Donnan membrane potential (counter-diffusion barrier)
    const R_gas = 8.314;
    const T_kelvin = 273.15 + temperatureC;
    const donnanPotentialPair = (2 * R_gas * T_kelvin / DEFAULT_ED_LIMITS.faradayConstant) * Math.log(Math.max(1.1, concentrateTds / Math.max(1, outletTds)));

    const voltageCellPair = Number((cellCurrent * rCellPairOhm + donnanPotentialPair).toFixed(3));
    const electrodeRinseVoltage = 3.0; // Overpotentials at anode & cathode
    const voltageStack = Number((cellPairs * voltageCellPair + electrodeRinseVoltage).toFixed(2));
    const voltageModule = Number((voltageStack / numberOfModules).toFixed(2));

    const stackElectricalPowerW = Number((voltageStack * cellCurrent).toFixed(1));

    // Hydraulic Pressure Drop (spacer channel Darcy-Weisbach)
    const fluidDensity = 1000;
    const dynamicViscosity = 0.001;
    const dh = 2 * channelThicknessM;
    const reynolds = (fluidDensity * interstitialVelocity * dh) / dynamicViscosity;
    const frictionFactor = (64 / Math.max(0.5, reynolds)) + 0.45; // spacer netting drag
    const channelPressureDropPa = frictionFactor * (stackLengthM / dh) * (fluidDensity * Math.pow(interstitialVelocity, 2) / 2);
    const manifoldPressureDropPa = 1.8 * (fluidDensity * Math.pow(interstitialVelocity, 2) / 2);
    const pressureDropPa = Math.max(150, Math.min(25000, Math.round(channelPressureDropPa + manifoldPressureDropPa)));

    const pumpEfficiency = 0.72;
    const idealHydraulicPowerW = flowRateM3s * pressureDropPa;
    const pumpElectricalPowerW = idealHydraulicPowerW / pumpEfficiency;

    // Specific Energy Consumption (SEC)
    const secElectricalGross = productFlowM3h > 0 ? ((stackElectricalPowerW / 1000) / productFlowM3h) : 0;
    const secElectricalNet = secElectricalGross; // ED operates continuously in steady state
    const secHydraulic = productFlowM3h > 0 ? ((pumpElectricalPowerW / 1000) / productFlowM3h) : 0;
    const secAuxiliary = 0.010; // Controls, degasifier, and electrode rinse circulation
    const secTotalNet = secElectricalNet + secHydraulic;
    const secTotalGross = secElectricalGross + secHydraulic + secAuxiliary;

    // Hardness & Scaling Assessment
    const isHardnessFeasible = feedHardness <= DEFAULT_ED_LIMITS.maxHardnessMgLAsCaCO3;
    if (!isHardnessFeasible) {
        isFeasible = false;
        failureReason = `Feed hardness (${feedHardness} mg/L as CaCO3) exceeds standard ED scaling limit (${DEFAULT_ED_LIMITS.maxHardnessMgLAsCaCO3} mg/L). Upstream softening or Electrodialysis Reversal (EDR) required.`;
    }

    const waterChem = analyzeWaterChemistry(feedWater);
    const isWaterConserved = Math.abs(flowRateLmin - (productFlowLmin + concentrateFlowLmin)) < 1e-5;
    const isSaltConserved = Math.abs(feedSaltRateGs - (productSaltRateGs + concentrateSaltRateGs)) < 1e-5;

    // Reconciled Faraday Charge Balance
    const totalFaradayCurrent = cellCurrent * cellPairs;
    const chargeSuppliedCoulombsPerSec = totalFaradayCurrent;
    const chargeUtilizedCoulombsPerSec = totalFaradayCurrent * currentEfficiency;
    const faradayMolarRateMols = chargeUtilizedCoulombsPerSec / (DEFAULT_ED_LIMITS.ionValence * DEFAULT_ED_LIMITS.faradayConstant);
    const faradaySaltRemovalGs = faradayMolarRateMols * DEFAULT_ED_LIMITS.molarMassNaCl;
    const streamSaltRemovalGs = feedSaltRateGs - productSaltRateGs;
    const chargeResidualGs = Math.abs(faradaySaltRemovalGs - streamSaltRemovalGs);
    const chargeBalanceRelativeError = streamSaltRemovalGs > 0 ? (chargeResidualGs / streamSaltRemovalGs) : 0;
    const isChargeConserved = chargeBalanceRelativeError <= 0.005 || chargeResidualGs < 1e-5;

    const chargeBalance = {
        equationId: "EQ-03-04",
        modelId: "ED-FIRST-PRINCIPLES",
        inputDependencies: ["current", "cellPairs", "currentEfficiency", "molarMassNaCl", "faradayConstant"],
        units: {
            current: "A",
            chargeRate: "C/s",
            ionTransport: "µmol/s",
            massRate: "mg/s",
            cycleRemoval: "mg/10min"
        },
        validationStatus: isChargeConserved ? "VALIDATED" : "DISCREPANCY",
        cellCurrentA: cellCurrent,
        cellPairs,
        chargeUtilization: currentEfficiency,
        chargeEfficiencyPct: Number((currentEfficiency * 100).toFixed(1)),
        totalFaradayCurrentA: Number(totalFaradayCurrent.toFixed(4)),
        totalCurrentA: Number(totalFaradayCurrent.toFixed(4)),
        effectiveCurrentA: Number(chargeUtilizedCoulombsPerSec.toFixed(4)),
        chargeSuppliedCoulombsPerSec: Number(chargeSuppliedCoulombsPerSec.toFixed(3)),
        chargeUtilizedCoulombsPerSec: Number(chargeUtilizedCoulombsPerSec.toFixed(3)),
        molarRemovalRateMols: faradayMolarRateMols,
        molarSaltRateMolPerS: faradayMolarRateMols,
        ionTransportUmolS: Number((faradayMolarRateMols * 1e6).toFixed(2)),
        faradaySaltRemovalGs,
        streamSaltRemovalGs,
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
        discrepancyPercent: Number((chargeBalanceRelativeError * 100).toFixed(4)),
        chargeBalanceRelativeErrorPct: Number((chargeBalanceRelativeError * 100).toFixed(4)),
        isConserved: isChargeConserved,
        reconciled: isChargeConserved,
        status: isChargeConserved ? "RECONCILED" : "DIVERGENT"
    };
    const faradayChargeReconciliation = chargeBalance;

    // Common Engineering Balance Engine
    const balanceAudit = validateEngineeringBalances({
        technology: "ED",
        flowRateLmin,
        productFlowLmin,
        concentrateFlowLmin,
        feedTds,
        outletTds,
        targetTds,
        concentrateTds,
        cellPairs,
        cellCurrent,
        chargeEfficiency: currentEfficiency,
        voltageCell: voltageCellPair,
        voltageStack,
        power: stackElectricalPowerW,
        secElectricalGross,
        energyRecoveryFactor: 0.0,
        pressureDrop: pressureDropPa,
        flowVelocity: interstitialVelocity,
        waterRecovery: waterRecoveryPct,
        feedQualityFeasible: isHardnessFeasible,
        isCalibrated: Boolean(inputs.isCalibrated)
    }, { feedWater });

    const removalEfficiency = Number((((feedTds - outletTds) / feedTds) * 100).toFixed(1));
    const isTargetAchieved = outletTds <= (targetTds + 0.1);

    const envelopeStatus = (feedTds >= DEFAULT_ED_LIMITS.minFeedTdsMgL && feedTds <= DEFAULT_ED_LIMITS.maxFeedTdsMgL && isHardnessFeasible)
        ? "VALIDATED"
        : (feedTds > DEFAULT_ED_LIMITS.maxFeedTdsMgL || !isHardnessFeasible ? "OUTSIDE_ENVELOPE" : "EXTRAPOLATED");

    const envelopeMessage = envelopeStatus === "VALIDATED"
        ? "Operating within standard Electrodialysis (ED) benchmark envelope."
        : (failureReason || "Operating parameters fall outside standard ED operational sweet spot.");

    const modelPredictionLabel = isFeasible
        ? (isTargetAchieved ? "ELECTRODIALYSIS DESALINATION ACHIEVED" : "INTERMEDIATE ED SEPARATION")
        : "ED OPERATIONAL LIMIT REACHED";

    return {
        technology: "ED",
        techName: DEFAULT_ED_LIMITS.name,
        category: DEFAULT_ED_LIMITS.category,
        calculationMode,
        feedTds,
        targetTds,
        outletTDS: outletTds,
        outletTds,
        removalEfficiency,
        isTargetAchieved,
        isFeasible,
        status: isFeasible ? "FEASIBLE" : "NOT_FEASIBLE",
        failureReason,
        infeasibilityReason: failureReason,

        // Flow & Water Balance
        flowRateLmin,
        productFlowLmin: Number(productFlowLmin.toFixed(2)),
        concentrateFlowLmin: Number(concentrateFlowLmin.toFixed(2)),
        rejectFlowLmin: Number(concentrateFlowLmin.toFixed(2)),
        flowRateM3s: Number(flowRateM3s.toExponential(4)),
        flowRateM3h: Number(flowRateM3h.toFixed(3)),
        productFlowM3h: Number(productFlowM3h.toFixed(3)),
        concentrateFlowM3h: Number(concentrateFlowM3h.toFixed(3)),
        concentrateTds,
        brineTds: concentrateTds,
        rejectTds: concentrateTds,
        waterRecovery: waterRecoveryPct,
        waterRecoveryPct,
        isWaterConserved,
        isSaltConserved,

        // Limiting Current & Electromigration
        limitingCurrentDensity: iLim,
        limitingCurrentDensityAm2: iLim,
        limitingCurrentAmperes: Number(((iLim * planarAreaM2)).toFixed(2)),
        concentrationPolarizationFactor,
        polarizationRatioPct: Number((concentrationPolarizationFactor * 100).toFixed(1)),
        isBelowLimitingCurrent,
        currentEfficiency: Number((currentEfficiency * 100).toFixed(1)),
        currentEfficiencyFrac: currentEfficiency,
        chargeEfficiency: Number((currentEfficiency * 100).toFixed(1)),
        chargeEfficiencyFrac: currentEfficiency,
        totalFaradayCurrent: Number((cellCurrent * cellPairs).toFixed(2)),
        current: cellCurrent,
        cellCurrent,
        currentDensity: currentDensityAm2,
        actualCurrentDensityAm2: currentDensityAm2,

        // Stack Geometry & Sizing
        cellPairs,
        pairsPerModule,
        numberOfModules,
        electrodeArea: inputPlanarAreaCm2,
        membraneAreaCm2: inputPlanarAreaCm2,
        totalMembraneAreaM2: Number((2 * cellPairs * planarAreaM2).toFixed(2)),
        membraneThicknessMm: DEFAULT_ED_LIMITS.membraneThicknessMm,
        channelThicknessMm,
        reactorVolumeLiters: Number(((cellPairs * planarAreaM2 * channelThicknessM * 2) * 1000).toFixed(2)),
        residenceTime: Number(((cellPairs * planarAreaM2 * channelThicknessM * 2 * 1000) / flowRateLmin).toFixed(4)),

        // Electrical & Energy
        voltageCell: voltageCellPair,
        voltageCellPair,
        voltage: voltageCellPair,
        voltageModule,
        voltageStack,
        stackElectricalPowerW,
        power: stackElectricalPowerW,
        stackPowerW: stackElectricalPowerW,
        sec: secTotalNet,
        secElectrical: secElectricalNet,
        secElectricalGross,
        secElectricalNet,
        secRecovered: 0.0,
        secPump: secHydraulic,
        secHydraulic,
        secAuxiliary,
        secTotal: secTotalNet,
        secTotalNet,
        secTotalGross,

        // Hydraulics
        flowVelocity: Number(interstitialVelocity.toFixed(4)),
        superficialVelocity: Number((interstitialVelocity * DEFAULT_ED_LIMITS.spacerPorosity).toFixed(4)),
        pressureDrop: pressureDropPa,
        pressureDropPa,

        // Balances & Audit
        chargeBalance,
        faradayChargeReconciliation,
        balanceAudit,
        balanceDiagnostics: balanceAudit.balanceDiagnostics,
        electrochemicalConsistency: balanceAudit.electrochemicalConsistency,
        waterChem,
        complianceLevel: isFeasible ? balanceAudit.complianceLevel : "LEVEL_0_INFEASIBLE",
        complianceLabel: isFeasible ? balanceAudit.complianceLabel : "LEVEL 0: DESIGN ENVELOPE LIMIT",
        modelConfidence: balanceAudit.modelConfidence,

        // Fundamentals & Metadata
        modelPredictionLabel,
        envelopeStatus,
        envelopeMessage,
        envelopeConfig: DEFAULT_ED_LIMITS
    };
}

export {
    calculateEDLimitingCurrentDensity as calculateLimitingCurrentDensity
};

export default calculateEDModel;
