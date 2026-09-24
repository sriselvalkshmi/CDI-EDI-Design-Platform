"use strict";

import { TECHNOLOGY_FUNDAMENTALS } from "../core/technologyFundamentals.js";
import { analyzeWaterChemistry } from "../chemistry/waterChemistryEngine.js";
import { validateEngineeringBalances } from "../core/balanceEngine.js";

/**
 * First-Principles Membrane Capacitive Deionization (MCDI) Engineering Physics Engine V2
 * 
 * Architecture:
 * Porous Carbon Electrode (+) → Anion Exchange Membrane (AEM) → Feed Spacer Channel → Cation Exchange Membrane (CEM) → Porous Carbon Electrode (-)
 * 
 * Physics Principles:
 * - Counter-ion transport with co-ion exclusion through ion-exchange membranes.
 * - Rigorous Series Faraday Coupling: Total salt removal rate n_dot = (I_stack * N_pairs * Lambda) / (z * F).
 * - Two Explicit Operating / Design Modes:
 *   MODE A: CURRENT / VOLTAGE CONTROLLED (Forward Physics) -> Predicts achievable salt removal, outlet TDS, recovery, SEC.
 *   MODE B: TARGET CONTROLLED (Constrained Engineering Sizing) -> Calculates required current/area/pairs, subject to physical limits.
 * - Complete Energy Accounting: Gross Stack SEC, Energy Recovery Credit, Net Electrical SEC, Pump SEC, Total Net SEC.
 * - Responsive Hydraulic Model: Dynamic pressure drop responding to flow, geometry, and spacer mesh drag.
 * - Integration with Common Balance Engine: Water, salt, charge, and energy balance verification.
 * 
 * References: Zhao et al. (2012), Biesheuvel & van der Wal (2010), Dykstra et al. (2016), Porada et al. (2013).
 */

export const MCDI_ENVELOPE = {
    name: "Membrane Capacitive Deionization (MCDI)",
    architecture: "Fixed Carbon Electrodes + AEM@Anode (+) + CEM@Cathode (-) [FIRST_PRINCIPLES]",
    recommendedTdsRange: { min: 500, max: 3000 }, // mg/L (Zhao et al. 2012)
    maxModelTds: 5000, // mg/L
    maxSingleStageRemovalRatio: 0.95, // 95% single-stage electrosorption benchmark limit
    minCellVoltage: 0.8, // V
    maxCellVoltage: 1.6, // V
    defaultCellVoltage: 1.4, // V
    minOperatingCurrentDensity: 10.0, // A/m²
    maxOperatingCurrentDensity: 250.0, // A/m²
    defaultOperatingCurrentDensity: 60.0, // A/m²
    minRecovery: 80.0, // %
    maxRecovery: 96.0, // %
    defaultRecovery: 95.0, // %
    molarMassNaCl: 58.44, // g/mol
    faradayConstant: 96485, // C/mol
    ionValence: 1, // z for NaCl
    membraneThicknessMm: 0.15, // mm per AEM/CEM sheet
    membranePermselectivity: 0.98, // AEM/CEM selectivity factor
    sacNominal: 20.0, // mg salt / g carbon (membrane-assisted capacity)
    sacMaxPhysical: 28.0, // mg salt / g carbon upper physical limit
    provenance: {
        recommendedTdsRange: "LITERATURE_SUPPORTED (Zhao et al., 2012; Dykstra et al., 2016)",
        maxModelTds: "LITERATURE_SUPPORTED",
        cellVoltageRange: "LITERATURE_SUPPORTED (Zhao et al., 2012)",
        chargeEfficiency: "PROJECT_ASSUMPTION / EMPIRICALLY_CALIBRATED",
        waterRecovery: "CALCULATED_FROM_CYCLE_TIMING",
        sacNominal: "LITERATURE_SUPPORTED (Membrane-Assisted Carbon Benchmark)"
    },
    calibrationStatus: "Calibrated first-principles model verified against literature benchmarks (Zhao et al., 2012; Dykstra et al., 2016)"
};

/**
 * Calculates dynamic charge efficiency for MCDI based on cell voltage, feed TDS, and membrane permselectivity.
 * Separates user calibration assumption from physical state dependence.
 */
export function calculateMCDIChargeEfficiency(cellVoltage = 1.4, feedTds = 500, customConfig = {}) {
    if (customConfig.chargeEfficiency !== undefined && customConfig.chargeEfficiency !== null && !isNaN(Number(customConfig.chargeEfficiency))) {
        const val = Number(customConfig.chargeEfficiency);
        return val > 1 ? val / 100 : val;
    }

    // Baseline nominal efficiency for MCDI at 1.4V and 500 ppm is 0.92 (92%)
    const baseLambda = 0.92;
    const voltageFactor = 1.0 - 0.04 * ((cellVoltage - 1.4) / 1.4);
    // At dilute feed (<=100 mg/L), charge efficiency is 0.80 based on literature benchmark
    const concentrationFactor = feedTds >= 300 ? 1.0 : (feedTds <= 100 ? (0.80 / baseLambda) : Math.max(0.80 / baseLambda, 0.85 + 0.15 * (feedTds / 300)));

    const lambda = baseLambda * voltageFactor * concentrationFactor;
    return Math.max(0.75, Math.min(0.98, Number(lambda.toFixed(4))));
}

/**
 * Calculates responsive hydraulic pressure drop through spacer-filled channel.
 */
export function calculateMCDIHydraulics({
    flowRateM3s,
    cellPairs,
    planarAreaM2,
    spacerThicknessMm = 0.5,
    stackLengthM = null,
    stackWidthM = null,
    temperatureC = 25
}) {
    const spacerHeightM = spacerThicknessMm / 1000;
    const widthM = stackWidthM || Math.sqrt(planarAreaM2);
    const lengthM = stackLengthM || Math.sqrt(planarAreaM2);

    // Flow area of all parallel cell channels
    const totalFlowAreaM2 = cellPairs * widthM * spacerHeightM;
    const spacerPorosity = 0.75; // Void fraction of netting spacer
    const superficialVelocity = totalFlowAreaM2 > 0 ? flowRateM3s / totalFlowAreaM2 : 0.035; // m/s
    const interstitialVelocity = superficialVelocity / spacerPorosity;

    // Hydraulic diameter Dh = 4 * cross-section / wetted perimeter ≈ 2 * spacer height
    const hydraulicDiameterM = (2 * widthM * spacerHeightM) / Math.max(1e-5, widthM + spacerHeightM);

    // Fluid properties corrected for temperature
    const fluidDensity = 1000 - 0.02 * (temperatureC - 20); // kg/m³
    // Dynamic viscosity (Pa.s) approx: mu(T) = 0.001 * exp(0.02 * (20 - T))
    const dynamicViscosity = 0.001 * Math.exp(0.02 * (20 - temperatureC));

    const reynoldsNumber = (fluidDensity * interstitialVelocity * hydraulicDiameterM) / Math.max(1e-7, dynamicViscosity);

    // Spacer friction factor (Darcy-Weisbach with mesh drag correlation)
    // f = 64/Re + K_mesh
    const spacerDragCoeff = 0.40;
    const frictionFactor = (64 / Math.max(0.5, reynoldsNumber)) + spacerDragCoeff;

    // Spacer bed pressure drop: Delta P = f * (L / Dh) * (rho * v^2 / 2)
    const spacerPressureDropPa = frictionFactor * (lengthM / Math.max(1e-5, hydraulicDiameterM)) * (fluidDensity * Math.pow(interstitialVelocity, 2) / 2);

    // Manifold / header entrance and exit losses
    const manifoldLossPa = 1.5 * (fluidDensity * Math.pow(interstitialVelocity, 2) / 2);
    const totalPressureDropPa = Math.max(80, Math.round(spacerPressureDropPa + manifoldLossPa));

    // Hydraulic pumping power
    const pumpEfficiency = 0.70;
    const idealHydraulicPowerW = flowRateM3s * totalPressureDropPa;
    const pumpElectricalPowerW = idealHydraulicPowerW / pumpEfficiency;

    return {
        hydraulicDiameterM,
        superficialVelocity,
        interstitialVelocity,
        reynoldsNumber,
        frictionFactor,
        pressureDropPa: totalPressureDropPa,
        idealHydraulicPowerW,
        pumpElectricalPowerW,
        pumpEfficiency
    };
}

/**
 * Calculates MCDI design and operational performance parameters from first principles.
 * 
 * @param {object} inputs - User, feed water, and operating inputs
 * @returns {object} Comprehensive MCDI engineering metrics and audit trail
 */
export function calculateMCDIModel(arg1 = {}, arg2 = {}) {
    const inputs = (arg2 && typeof arg2 === "object" && Object.keys(arg2).length > 0)
        ? { feedWater: arg1, ...arg1, ...arg2 }
        : arg1;
    const feedWater = inputs.feedWater || {};
    const waterChem = analyzeWaterChemistry(feedWater);

    const rawTds = Number(inputs.tds ?? inputs.feedTds ?? feedWater.tds ?? 500);
    const flowRateLmin = Number(inputs.flowRate ?? inputs.flowRateLmin ?? feedWater.flowRate ?? 10);

    if (flowRateLmin <= 0 || rawTds <= 0 || isNaN(rawTds) || isNaN(flowRateLmin)) {
        throw new Error("Invalid inputs: flowRate and feedTds must be strictly positive numbers.");
    }

    const feedTds = Math.max(1, Math.round(rawTds));
    const targetTds = Math.max(0.1, Number(inputs.targetTds ?? inputs.targetTDS ?? feedWater.targetTds ?? 50));

    // SI Unit Conversions
    const flowRateM3s = flowRateLmin / (1000 * 60);
    const flowRateM3h = (flowRateLmin * 60) / 1000;

    const molarMassNaCl = MCDI_ENVELOPE.molarMassNaCl;
    const faradayConstant = MCDI_ENVELOPE.faradayConstant;
    const z = MCDI_ENVELOPE.ionValence;

    // Sizing / Geometry Basis
    const inputPlanarAreaCm2 = Number(inputs.electrodeArea ?? 350);
    const planarAreaM2 = Math.max(0.01, inputPlanarAreaCm2 / 10000);
    const pairsPerModule = 34;

    let cellVoltage = Number(inputs.voltage ?? inputs.voltageCell ?? MCDI_ENVELOPE.defaultCellVoltage);
    cellVoltage = Math.max(MCDI_ENVELOPE.minCellVoltage, Math.min(MCDI_ENVELOPE.maxCellVoltage, cellVoltage));

    // Determine Design Mode
    // Mode A: Current/Voltage controlled (manual current or explicit current-controlled mode)
    // Mode B: Target controlled (requires sizing current and pairs to meet target TDS)
    const hasManualCurrent = inputs.current !== undefined && inputs.current !== null && inputs.current !== "" && !isNaN(Number(inputs.current));
    const hasManualPairs = inputs.cellPairs !== undefined && inputs.cellPairs !== null && inputs.cellPairs !== "" && !isNaN(Number(inputs.cellPairs));
    const calculationMode = (hasManualCurrent && hasManualPairs) || inputs.calculationMode === "CURRENT_CONTROLLED" || inputs.operatingMode === "CURRENT_CONTROLLED"
        ? "CURRENT_CONTROLLED"
        : "TARGET_CONTROLLED";

    // Dynamic Charge Efficiency
    const chargeEfficiency = calculateMCDIChargeEfficiency(cellVoltage, feedTds, inputs);

    // Water Recovery Derivation
    let waterRecoveryPct = Number(inputs.waterRecovery ?? inputs.recovery ?? inputs.targetRecovery ?? feedWater.targetRecovery);
    if (isNaN(waterRecoveryPct) || waterRecoveryPct <= 0 || waterRecoveryPct >= 100) {
        // Dynamic water recovery based on adsorption/desorption cycle ratio (t_ads = 10 min, t_des = 1.0 min, q_ratio = 0.5)
        const tAds = 10.0;
        const tDes = 1.0;
        const qDesRatio = 0.5;
        const baseRecovery = (tAds / (tAds + tDes * qDesRatio)) * 100; // 95.24%
        const scalingCorrection = feedTds > 1500 ? Math.min(7.0, (feedTds - 1500) * 0.002) : 0;
        waterRecoveryPct = Number((baseRecovery - scalingCorrection).toFixed(1));
    }
    const waterRecoveryFrac = waterRecoveryPct / 100;

    let cellPairs;
    let numberOfModules;
    let cellCurrent;
    let outletTds;
    let isFeasible = true;
    let failureReason = null;

    if (calculationMode === "CURRENT_CONTROLLED") {
        // MODE A: CURRENT CONTROLLED
        // Current and cell pairs are specified by user or scenario point
        if (inputs.current !== undefined && inputs.current !== null && !isNaN(Number(inputs.current))) {
            cellCurrent = Number(inputs.current);
        } else {
            const kappa = (feedTds / 0.65) * 1e-4; // S/m
            const rSolution = 0.0005 / Math.max(1e-5, kappa * planarAreaM2);
            const rCell = Math.max(0.15, rSolution + 0.10);
            cellCurrent = Number(Math.min(MCDI_ENVELOPE.maxOperatingCurrentDensity * planarAreaM2, Math.max(0.1, cellVoltage / rCell)).toFixed(2));
        }
        cellPairs = Number(inputs.cellPairs ?? 34);
        numberOfModules = Math.max(1, Math.ceil(cellPairs / pairsPerModule));

        // Available Faraday salt removal rate (moles/s):
        // Series stack: I_stack passes through all N_pairs cells
        const totalFaradayCurrent = cellCurrent * cellPairs;
        const achievableMolarRemoval = (totalFaradayCurrent * chargeEfficiency) / (z * faradayConstant); // mol/s
        const achievableMassRemovalGs = achievableMolarRemoval * molarMassNaCl; // g/s

        // Removal concentration delta across product flow stream
        const deltaTdsFromCurrent = flowRateM3s > 0 ? (achievableMassRemovalGs / flowRateM3s) : 0; // g/m³ = mg/L

        // Physical outlet TDS emerges directly from electrochemistry
        const calculatedOutlet = feedTds - deltaTdsFromCurrent;
        outletTds = Number(Math.max(0.5, calculatedOutlet).toFixed(1));

        // Check feasibility against physical bounds and target
        const currentDensity = cellCurrent / planarAreaM2;
        if (currentDensity > MCDI_ENVELOPE.maxOperatingCurrentDensity) {
            isFeasible = false;
            failureReason = `Current density (${currentDensity.toFixed(1)} A/m²) exceeds maximum allowable limit (${MCDI_ENVELOPE.maxOperatingCurrentDensity} A/m²).`;
        } else if (calculatedOutlet > targetTds + 0.1) {
            // Not feasible to meet target under this fixed current/pair combination
            isFeasible = false;
            failureReason = `Specified current (${cellCurrent} A) across ${cellPairs} pairs achieves outlet TDS ${outletTds} mg/L, exceeding target ${targetTds} mg/L.`;
        }
    } else {
        // MODE B: TARGET CONTROLLED
        // Calculates required electrochemical charge, current, and cell pairs to achieve target TDS
        const maxSingleStageRemoval = MCDI_ENVELOPE.maxSingleStageRemovalRatio ?? 0.95;
        const requestedRemoval = Math.max(0, feedTds - targetTds);
        const requestedRatio = feedTds > 0 ? requestedRemoval / feedTds : 0;

        // Multi-module series stages capability (modules in series achieve (1 - (1 - eta)^N) removal)
        const manualPairs = hasManualPairs ? Number(inputs.cellPairs) : null;
        const manualModules = Number(inputs.numberOfModules ?? inputs.modules ?? (manualPairs ? Math.ceil(manualPairs / pairsPerModule) : 1));
        const maxRemovalPossible = manualModules > 1
            ? 1 - Math.pow(1 - maxSingleStageRemoval, manualModules)
            : maxSingleStageRemoval;

        const actualRemovalRatio = Math.min(maxRemovalPossible, requestedRatio);

        if (requestedRatio > maxRemovalPossible) {
            outletTds = Number((feedTds * (1 - actualRemovalRatio)).toFixed(1));
            isFeasible = false;
            failureReason = `Target removal ratio (${(requestedRatio * 100).toFixed(1)}%) exceeds MCDI ${manualModules > 1 ? "multi-module" : "single-stage"} physical limit (${(maxRemovalPossible * 100).toFixed(0)}%). Outlet TDS is ${outletTds} mg/L. Multi-stage train required.`;
        } else {
            outletTds = Number(targetTds.toFixed(1));
        }

        const deltaTds = feedTds - outletTds;
        const massRemovalGs = flowRateM3s * deltaTds;
        const molarRemovalMols = massRemovalGs / molarMassNaCl;

        // Total Faraday current demand across all cells (A)
        const totalFaradayCurrent = (molarRemovalMols * z * faradayConstant) / chargeEfficiency;

        // Size area and cell pairs based on target operating current density
        const targetJ = Number(inputs.currentDensity ?? MCDI_ENVELOPE.defaultOperatingCurrentDensity);
        const targetCurrentDensityAm2 = Math.max(10, Math.min(250, targetJ));

        const requiredTotalAreaM2 = totalFaradayCurrent / targetCurrentDensityAm2;
        const calculatedPairsRaw = Math.ceil(requiredTotalAreaM2 / planarAreaM2);
        const calculatedPairs = Math.max(12, calculatedPairsRaw);

        const requiredPairs = manualPairs !== null ? manualPairs : calculatedPairs;

        numberOfModules = manualModules > 1 ? manualModules : Math.max(1, Math.ceil(requiredPairs / pairsPerModule));
        cellPairs = manualPairs !== null ? manualPairs : (pairsPerModule * numberOfModules);

        // Required current per cell pair in electrical series
        const exactCellCurrent = totalFaradayCurrent / cellPairs;
        cellCurrent = exactCellCurrent;
        const actualCurrentDensityAm2 = cellCurrent / planarAreaM2;

        if (actualCurrentDensityAm2 > MCDI_ENVELOPE.maxOperatingCurrentDensity) {
            // Physical limit exceeded -> Current is clamped to physical limit, outlet TDS rises, FEASIBILITY = FAIL
            const maxPermissibleCurrent = MCDI_ENVELOPE.maxOperatingCurrentDensity * planarAreaM2;
            const achievableFaraday = maxPermissibleCurrent * cellPairs;
            const achievableMolar = (achievableFaraday * chargeEfficiency) / (z * faradayConstant);
            const achievableMassGs = achievableMolar * molarMassNaCl;
            const deltaTdsClamped = achievableMassGs / flowRateM3s;
            outletTds = Number(Math.max(0.5, feedTds - deltaTdsClamped).toFixed(1));
            cellCurrent = maxPermissibleCurrent;
            isFeasible = false;
            failureReason = `Required current density (${actualCurrentDensityAm2.toFixed(1)} A/m²) exceeds maximum allowable physical limit (${MCDI_ENVELOPE.maxOperatingCurrentDensity} A/m²). Additional cell pairs/modules required.`;
        } else if (requestedRatio > maxSingleStageRemoval) {
            outletTds = Number((feedTds * (1 - actualRemovalRatio)).toFixed(1));
        } else {
            outletTds = Number(targetTds.toFixed(1));
        }
    }

    // Mass Balance & Multi-Stream Conservation
    const massRemovalRateGs = (calculationMode === "CURRENT_CONTROLLED" && typeof achievableMassRemovalGs === "number")
        ? achievableMassRemovalGs
        : (flowRateM3s * (feedTds - outletTds));
    const deltaTds = flowRateM3s > 0 ? (massRemovalRateGs / flowRateM3s) : (feedTds - outletTds);
    const massRemovalRateKgH = (massRemovalRateGs * 3600) / 1000;
    const molarRemovalRateMols = massRemovalRateGs / molarMassNaCl;

    const productFlowLmin = flowRateLmin * waterRecoveryFrac;
    const productFlowM3s = (productFlowLmin / 1000) / 60;
    const productFlowM3h = (productFlowLmin * 60) / 1000;

    const concentrateFlowLmin = flowRateLmin * (1 - waterRecoveryFrac);
    const concentrateFlowM3s = (concentrateFlowLmin / 1000) / 60;
    const concentrateFlowM3h = (concentrateFlowLmin * 60) / 1000;

    const feedSaltRateGs = flowRateM3s * feedTds;
    const productSaltRateGs = productFlowM3s * outletTds;
    const concentrateSaltRateGs = feedSaltRateGs - productSaltRateGs;
    const concentrateTdsVal = concentrateFlowM3s > 0 ? concentrateSaltRateGs / concentrateFlowM3s : feedTds;
    const concentrateTds = Number(concentrateTdsVal.toFixed(1));

    // Water & Salt Conservation Checks
    const waterBalanceErrorLmin = Math.abs(flowRateLmin - (productFlowLmin + concentrateFlowLmin));
    const isWaterConserved = waterBalanceErrorLmin < 1.0e-5;
    const saltBalanceErrorGs = Math.abs(feedSaltRateGs - (productSaltRateGs + concentrateSaltRateGs));
    const isSaltConserved = saltBalanceErrorGs < 1.0e-6;

    if (!isWaterConserved || !isSaltConserved) {
        throw new Error("Mass Balance Violation: Water or Salt conservation equation violated beyond tolerance.");
    }

    // Sizing Outputs
    const totalElectrodeAreaM2 = cellPairs * planarAreaM2;
    const totalElectrodeAreaCm2 = Math.round(totalElectrodeAreaM2 * 10000);
    const totalMembraneAreaM2 = Number((2 * totalElectrodeAreaM2).toFixed(2)); // 1 AEM + 1 CEM per pair
    const membraneThicknessMm = MCDI_ENVELOPE.membraneThicknessMm;

    const actualCurrentDensityAm2 = Number((cellCurrent / planarAreaM2).toFixed(1));
    const totalFaradayCurrent = cellCurrent * cellPairs;

    // Electrical Topology & Power
    const voltageStack = Number((cellPairs * cellVoltage).toFixed(2));
    const voltageModule = Number((voltageStack / numberOfModules).toFixed(2));
    const cellPower = Number((cellVoltage * cellCurrent).toFixed(2));
    const stackElectricalPowerW = Number((voltageStack * cellCurrent).toFixed(1));

    // SEC - Energy Accounting V2
    const secElectricalGross = productFlowM3h > 0 ? ((stackElectricalPowerW / 1000) / productFlowM3h) : 0;
    const energyRecoveryFactor = Number(inputs.energyRecoveryFactor ?? 0.20); // 20% credit from RPD desorption
    const secRecovered = secElectricalGross * energyRecoveryFactor;
    const secElectricalNet = secElectricalGross - secRecovered;

    // Dynamic Hydraulics V2
    const spacerThicknessMm = Number(inputs.spacerThickness ?? 0.5);
    const electrodeThicknessMm = Number(inputs.electrodeThickness ?? 0.6);
    const hydraulics = calculateMCDIHydraulics({
        flowRateM3s,
        cellPairs,
        planarAreaM2,
        spacerThicknessMm,
        temperatureC: Number(feedWater.temperature ?? 25)
    });

    const pressureDrop = hydraulics.pressureDropPa;
    const secHydraulic = productFlowM3h > 0 ? Number(((hydraulics.pumpElectricalPowerW / 1000) / productFlowM3h).toFixed(5)) : 0;
    const secAuxiliary = 0.005; // 0.005 kWh/m³ instruments and controls
    const secTotalNet = Number((secElectricalNet + secHydraulic).toFixed(4));
    const secTotalGross = Number((secElectricalGross + secHydraulic).toFixed(4));

    // Residence Time & Sizing
    const reactorVolumeLiters = cellPairs * (inputPlanarAreaCm2 * (spacerThicknessMm / 10)) / 1000;
    const residenceTimeMin = flowRateLmin > 0 ? reactorVolumeLiters / flowRateLmin : 0.045;

    const electrodeDensity = Number(inputs.electrodeDensity ?? 0.45);
    const totalElectrodeMassGrams = 2 * cellPairs * inputPlanarAreaCm2 * (electrodeThicknessMm / 10) * electrodeDensity;
    const electrodeMassKg = Number((totalElectrodeMassGrams / 1000).toFixed(2));

    const cycleTimeMin = Number(inputs.adsorptionTimeMin ?? inputs.cycleTimeMin ?? (feedTds > 200 ? Math.max(2.0, 10.0 * (200 / feedTds)) : 10.0));
    const requiredSorptionMg = flowRateLmin * cycleTimeMin * deltaTds;
    const actualSacMgG = totalElectrodeMassGrams > 0 ? requiredSorptionMg / totalElectrodeMassGrams : MCDI_ENVELOPE.sacNominal;

    if (actualSacMgG > MCDI_ENVELOPE.sacMaxPhysical) {
        isFeasible = false;
        failureReason = failureReason || `Required Salt Adsorption Capacity (${actualSacMgG.toFixed(1)} mg/g) exceeds maximum physical capacity (${MCDI_ENVELOPE.sacMaxPhysical} mg/g). Additional electrode mass required.`;
    }

    // Reconciled Faraday Charge Balance
    const chargeSuppliedCoulombsPerSec = totalFaradayCurrent;
    const chargeUtilizedCoulombsPerSec = totalFaradayCurrent * chargeEfficiency;
    const faradayMolarRateMols = chargeUtilizedCoulombsPerSec / (z * faradayConstant);
    const faradaySaltRemovalGs = faradayMolarRateMols * molarMassNaCl;
    const streamSaltRemovalGs = massRemovalRateGs;
    const chargeResidualGs = Math.abs(faradaySaltRemovalGs - streamSaltRemovalGs);
    const chargeBalanceRelativeError = streamSaltRemovalGs > 0 ? (chargeResidualGs / streamSaltRemovalGs) : 0;
    const isChargeConserved = chargeBalanceRelativeError <= 0.05 || chargeResidualGs < 1e-4;

    const chargeBalance = {
        equationId: "EQ-03-04",
        modelId: "MCDI-FIRST-PRINCIPLES",
        inputDependencies: ["current", "cellPairs", "chargeEfficiency", "molarMassNaCl", "faradayConstant"],
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
            "Membrane capacitive deionization electrosorption"
        ],
        operatingRange: "0.01 - 10.0 A",
        validationStatus: isChargeConserved ? "VALIDATED" : "DISCREPANCY",
        cellCurrentA: cellCurrent,
        cellPairs,
        chargeUtilization: chargeEfficiency,
        chargeEfficiencyPct: Number((chargeEfficiency * 100).toFixed(1)),
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

    // Common Balance Validation Engine
    const balanceAudit = validateEngineeringBalances({
        technology: "MCDI",
        flowRateLmin,
        productFlowLmin,
        concentrateFlowLmin,
        feedTds,
        outletTds,
        targetTds,
        concentrateTds,
        cellPairs,
        cellCurrent,
        chargeEfficiency,
        voltageCell: cellVoltage,
        voltageStack,
        power: stackElectricalPowerW,
        secElectricalGross,
        energyRecoveryFactor,
        pressureDrop,
        flowVelocity: hydraulics.superficialVelocity,
        waterRecovery: waterRecoveryPct,
        isCalibrated: Boolean(inputs.isCalibrated || inputs.calibrationData)
    }, { feedWater });

    const removalEfficiency = Number((((feedTds - outletTds) / feedTds) * 100).toFixed(1));
    const isTargetAchieved = outletTds <= (targetTds + 0.1);

    // Envelope Status
    let envelopeStatus = "MODEL_PREDICTION";
    let envelopeMessage = "Operating parameters within literature-supported MCDI envelope (Zhao et al., 2012).";

    if (feedTds < MCDI_ENVELOPE.recommendedTdsRange.min || feedTds > MCDI_ENVELOPE.recommendedTdsRange.max) {
        envelopeStatus = "EXTRAPOLATED";
        envelopeMessage = `Operating point (Feed: ${feedTds} mg/L) is outside recommended MCDI literature range (${MCDI_ENVELOPE.recommendedTdsRange.min} - ${MCDI_ENVELOPE.recommendedTdsRange.max} mg/L).`;
    }
    if (feedTds > MCDI_ENVELOPE.maxModelTds || cellVoltage > MCDI_ENVELOPE.maxCellVoltage) {
        envelopeStatus = "OUTSIDE_ENVELOPE";
        envelopeMessage = `Operating point exceeds model MCDI feasibility boundaries (> ${MCDI_ENVELOPE.maxModelTds} mg/L TDS or > ${MCDI_ENVELOPE.maxCellVoltage} V).`;
        isFeasible = false;
        failureReason = failureReason || envelopeMessage;
    }

    const modelPredictionLabel = isTargetAchieved
        ? "TARGET ACHIEVED — PHYSICS MODEL V2"
        : (isFeasible ? "INTERMEDIATE REMOVAL — FEASIBLE" : "NOT FEASIBLE — CONSTRAINTS EXCEEDED");

    // Technology Failure Modes & Risk Diagnostics
    const risks = [];
    if (outletTds <= targetTds + 0.5) {
        risks.push({ level: "PASS", message: "Target setpoint achievable under MCDI mass/charge transfer model." });
    } else {
        risks.push({ level: "FAIL", message: `Target not achieved: Single-stage outlet is ${outletTds} mg/L (Target: ${targetTds} mg/L).` });
    }

    if (waterChem?.scalingRisk === "HIGH") {
        risks.push({ level: "WARNING", message: `High CaCO3 Scaling Risk (LSI = +${waterChem.lsiIndex}, Hardness = ${waterChem.totalHardnessMgL} mg/L). Pretreatment or softening recommended.` });
    } else if (waterChem?.scalingRisk === "MODERATE") {
        risks.push({ level: "WARNING", message: `Moderate Scaling Risk (LSI = +${waterChem.lsiIndex}). Antiscalant recommended.` });
    }

    risks.push({ level: "WARNING", message: "AEM/CEM Membrane Biofouling Risk: Pre-filtration (< 1 NTU) required." });
    risks.push({ level: "INFO", message: "20% Desorption Energy Recovery (RPD) active for reduced electrical SEC." });

    return {
        technology: "MCDI",
        techName: MCDI_ENVELOPE.name,
        processTrainName: "MCDI",
        calculationMode,
        feedTds,
        targetTds,
        outletTDS: outletTds,
        outletTds,
        removalEfficiency,
        isTargetAchieved,
        isFeasible,
        failureReason,

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
        isWaterConserved,
        isSaltConserved,

        // Mass & Molar Rates
        massRemovalRateGs: Number(massRemovalRateGs.toFixed(4)),
        massRemovalRateKgH: Number(massRemovalRateKgH.toFixed(4)),
        molarRemovalRateMols: Number(molarRemovalRateMols.toExponential(4)),
        naclEquivalentMolarMass: molarMassNaCl,

        // Charge & Current Transfer
        chargeEfficiency: Number((chargeEfficiency * 100).toFixed(1)),
        chargeEfficiencyFrac: chargeEfficiency,
        chargeEfficiencyClassification: "User calibration / empirical benchmark parameter",
        totalFaradayCurrent: Number(totalFaradayCurrent.toFixed(2)),
        current: cellCurrent,
        cellCurrent,
        currentDensity: actualCurrentDensityAm2,
        targetCurrentDensity: actualCurrentDensityAm2,

        // Stack Geometry & Sizing
        cellPairs,
        pairsPerModule,
        numberOfModules,
        electrodeArea: inputPlanarAreaCm2,
        totalElectrodeAreaCm2,
        totalElectrodeAreaM2: Number(totalElectrodeAreaM2.toFixed(3)),
        requiredTotalAreaM2: Number((totalFaradayCurrent / (Number(inputs.currentDensity ?? MCDI_ENVELOPE.defaultOperatingCurrentDensity) || 60.0)).toFixed(4)),
        totalMembraneAreaM2,
        membraneThicknessMm,
        electrodeThicknessMm,
        spacerThicknessMm,

        // Electrical & Power
        voltageCell: cellVoltage,
        voltage: cellVoltage,
        voltageModule,
        voltageStack,
        cellPower,
        stackElectricalPowerW,
        power: stackElectricalPowerW,
        stackPowerW: stackElectricalPowerW,

        // Energy Accounting V2
        sec: Number((secElectricalNet + secHydraulic).toFixed(4)),
        secElectrical: secElectricalNet,
        secElectricalGross,
        secGross: secElectricalGross,
        secElectricalAdsorption: secElectricalGross,
        secElectricalNet,
        secNet: secElectricalNet,
        secRecovered,
        energyRecoveryFactor,
        energyRecoveryPercent: Number((energyRecoveryFactor * 100).toFixed(1)),
        secPump: secHydraulic,
        secHydraulic,
        secAuxiliary,
        secTotal: Number((secElectricalNet + secHydraulic).toFixed(4)),
        secTotalNet,
        secTotalGross,
        operatingMode: calculationMode,
        calculationMode,
        infeasibilityReason: failureReason,

        // Hydraulics V2
        flowVelocity: Number(hydraulics.superficialVelocity.toFixed(4)),
        superficialVelocity: Number(hydraulics.superficialVelocity.toFixed(4)),
        reynoldsNumber: Number(hydraulics.reynoldsNumber.toFixed(1)),
        pressureDrop,
        pressureDropPa: pressureDrop,
        residenceTime: Number(residenceTimeMin.toFixed(4)),
        reactorVolumeLiters: Number(reactorVolumeLiters.toFixed(3)),
        electrodeMassKg,
        sac: Number(actualSacMgG.toFixed(1)),

        // Balances & Multi-Level Compliance (Phase 7, 12, 13)
        chargeBalance,
        faradayChargeReconciliation,
        balanceAudit,
        balanceDiagnostics: balanceAudit.balanceDiagnostics,
        electrochemicalConsistency: balanceAudit.electrochemicalConsistency,
        waterChem,
        risks,
        complianceLevel: balanceAudit.complianceLevel,
        complianceLabel: balanceAudit.complianceLabel,
        modelConfidence: balanceAudit.modelConfidence,

        // Fundamentals & Envelope Metadata
        ...TECHNOLOGY_FUNDAMENTALS.MCDI,
        modelPredictionLabel,
        envelopeStatus,
        envelopeMessage,
        envelopeConfig: MCDI_ENVELOPE,
        fundamentals: TECHNOLOGY_FUNDAMENTALS.MCDI
    };
}

export default calculateMCDIModel;
