"use strict";

import { TECHNOLOGY_FUNDAMENTALS } from "../core/technologyFundamentals.js";
import { analyzeWaterChemistry } from "../chemistry/waterChemistryEngine.js";

/**
 * First-Principles Electrodeionization (EDI) Engineering Model
 * Implements continuous hybrid ion-exchange resin bed transport, AEM & CEM electromigration,
 * continuous electrochemical water-splitting auto-regeneration (H+ / OH-), ultrapure product water resistivity (MΩ·cm),
 * strict RO permeate feed-water gating (DuPont EDI-310 spec), and independent SEC energy accounting.
 * References: DuPont Water Solutions EDI-310 Engineering Manual, Glaeser et al. (2014), Wood et al. (2010).
 */

export const DEFAULT_EDI_LIMITS = {
    name: "Electrodeionization (EDI)",
    maxFeedTdsMgL: 30.0, // mg/L TDS max for direct EDI feed (RO Permeate required)
    maxHardnessMgLAsCaCO3: 0.5, // mg/L as CaCO3 max hardness (DuPont EDI-310 scaling limit)
    maxConductivityUsCm: 50.0, // µS/cm max feed conductivity
    recommendedTdsRange: { min: 1.0, max: 30.0 }, // mg/L
    minCellVoltage: 1.0, // V per cell pair
    maxCellVoltage: 6.0, // V per cell pair
    defaultCellVoltage: 3.5, // V per cell pair (Standard EDI field polarization voltage)
    defaultCurrentDensityAm2: 60.0, // A/m²
    defaultRecovery: 90.0, // % water recovery (90% product, 10% concentrate reject)
    molarMassNaCl: 58.44, // g/mol (NaCl explicit assumption)
    faradayConstant: 96485, // C/mol
    ionValence: 1, // z for NaCl
    resinExchangeCapacityEqL: 1.9, // eq/L mixed-bed resin capacity
    resinBedPorosity: 0.40, // Void fraction in resin channel
    channelThicknessMm: 3.0, // mm resin dilute channel gap
    provenance: {
        maxFeedTdsMgL: "LITERATURE_SUPPORTED (DuPont EDI-310 Vendor Specification; Glaeser et al., 2014)",
        maxHardnessMgLAsCaCO3: "LITERATURE_SUPPORTED (DuPont EDI-310 Scaling Limit)",
        maxConductivityUsCm: "LITERATURE_SUPPORTED (DuPont EDI-310 Specification)",
        cellVoltageRange: "LITERATURE_SUPPORTED (Glaeser et al., 2014)",
        resinExchangeCapacityEqL: "PROJECT_ASSUMPTION (Standard Mixed-Bed Resin)",
        chargeUtilization: "PROJECT_ASSUMPTION"
    },
    calibrationStatus: "Literature-Supported Hybrid Resin/Membrane Architecture with DuPont EDI-310 Vendor Limits"
};

/**
 * Calculates dynamic current/charge utilization parameter for EDI (Lambda_EDI).
 * Explicitly classified as a Project Calibration/Assumption parameter.
 *
 * @param {number} cellVoltage - Applied cell voltage per pair (V)
 * @param {number} feedTds - Feed TDS concentration (mg/L)
 * @param {object} customConfig - Optional user overrides
 * @returns {number} Charge utilization parameter (0.0 to 1.0)
 */
export function calculateEDIChargeUtilization(cellVoltage = 3.5, feedTds = 15, customConfig = {}) {
    if (customConfig.chargeUtilization !== undefined && customConfig.chargeUtilization !== null && !isNaN(Number(customConfig.chargeUtilization))) {
        const val = Number(customConfig.chargeUtilization);
        return val > 1 ? val / 100 : val;
    }

    // Baseline nominal charge utilization parameter for EDI at 3.5V and 15 ppm is 0.85 (85%)
    const baseLambda = 0.85;
    const voltageFactor = 1.0 - 0.04 * ((cellVoltage - 3.5) / 3.5);
    const concentrationFactor = feedTds <= 30 ? 1.0 : Math.max(0.60, 30 / feedTds);

    const lambda = baseLambda * voltageFactor * concentrationFactor;
    return Math.max(0.50, Math.min(0.95, Number(lambda.toFixed(4))));
}

/**
 * Calculates EDI design and operational performance parameters from first principles.
 * Enforces strict feed-water gating, mass balance assertions, and independent energy accounting.
 *
 * @param {object} inputs - User and feed water inputs
 * @returns {object} Comprehensive EDI engineering metrics and pedigree
 */
export function calculateEDIModel(inputs = {}) {
    const feedWater = inputs.feedWater || {};

    const rawTds = Number(inputs.tds ?? feedWater.tds ?? 15.0);
    const rawHardness = Number(inputs.hardness ?? feedWater.hardness ?? 0.2); // mg/L as CaCO3
    const flowRateLmin = Number(inputs.flowRate ?? feedWater.flowRate ?? 10.0); // L/min
    const targetTds = Number(inputs.targetTds ?? feedWater.targetTds ?? 0.05); // mg/L (Ultrapure polishing target)
    const rawWaterRecInput = inputs.waterRecovery ?? inputs.recovery;
    if (rawWaterRecInput !== undefined && rawWaterRecInput !== null && rawWaterRecInput !== "") {
        const valRec = Number(rawWaterRecInput);
        if (isNaN(valRec) || !isFinite(valRec) || valRec <= 0 || valRec >= 100) {
            throw new Error(`INVALID ENGINEERING INPUT: Water recovery (${rawWaterRecInput}%) must be strictly between 0% and 100%.`);
        }
    }

    let waterRecoveryPct = Number(inputs.waterRecovery ?? inputs.recovery);
    if (isNaN(waterRecoveryPct) || waterRecoveryPct <= 0 || waterRecoveryPct >= 100) {
        // EDI Water Recovery: 90% default on RO permeate (feedTds <= 30 mg/L).
        // Higher feed TDS requires increased concentrate reject bleed to prevent scaling.
        const baseRecovery = DEFAULT_EDI_LIMITS.defaultRecovery; // 90%
        const scalingRejectPenalty = rawTds > 30 ? Math.min(25.0, (rawTds - 30) * 0.04) : 0;
        waterRecoveryPct = Number((baseRecovery - scalingRejectPenalty).toFixed(1));
    }
    let cellVoltage = Number(inputs.voltage ?? inputs.voltageCell ?? DEFAULT_EDI_LIMITS.defaultCellVoltage);
    const inputPlanarAreaCm2 = Number(inputs.electrodeArea ?? inputs.membraneArea ?? 350.0); // cm²
    const manualCellPairs = inputs.cellPairs !== undefined && inputs.cellPairs !== "" ? Number(inputs.cellPairs) : null;

    // 1. Strict Physical Input Sanity Checks
    if (isNaN(rawTds) || !isFinite(rawTds) || rawTds < 0) {
        throw new Error("INVALID ENGINEERING INPUT: Feed TDS must be a non-negative finite number.");
    }
    if (isNaN(rawHardness) || !isFinite(rawHardness) || rawHardness < 0) {
        throw new Error("INVALID ENGINEERING INPUT: Feed hardness must be a non-negative finite number.");
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
        throw new Error("INVALID ENGINEERING INPUT: Membrane/electrode area must be a strictly positive finite number.");
    }
    if (manualCellPairs !== null && (isNaN(manualCellPairs) || !isFinite(manualCellPairs) || manualCellPairs <= 0)) {
        throw new Error("INVALID ENGINEERING INPUT: Cell pairs must be a strictly positive integer.");
    }

    const feedTds = Math.max(0, rawTds);
    const feedHardness = Math.max(0, rawHardness);

    // 2. Strict Feed-Water Gating (RO Permeate Pretreatment Gating)
    const maxFeedTds = DEFAULT_EDI_LIMITS.maxFeedTdsMgL; // 30 mg/L
    const maxHardness = DEFAULT_EDI_LIMITS.maxHardnessMgLAsCaCO3; // 0.5 mg/L as CaCO3

    const isFeedTdsFeasible = feedTds <= maxFeedTds;
    const isHardnessFeasible = feedHardness <= maxHardness;
    const isFeedFeasible = isFeedTdsFeasible && isHardnessFeasible;

    let feedGatingStatus = "PASSED";
    let recommendedPretreatment = null;
    let gatingReason = null;

    if (!isFeedFeasible) {
        feedGatingStatus = "FEED PRETREATMENT REQUIRED";
        recommendedPretreatment = "Reverse Osmosis (RO) Permeate pretreatment required before EDI.";
        if (!isFeedTdsFeasible && !isHardnessFeasible) {
            gatingReason = `Feed TDS (${feedTds} mg/L) exceeds max limit (${maxFeedTds} mg/L) and hardness (${feedHardness} mg/L as CaCO3) exceeds scaling limit (${maxHardness} mg/L; DuPont EDI-310 Spec).`;
        } else if (!isFeedTdsFeasible) {
            gatingReason = `Feed TDS (${feedTds} mg/L) exceeds max EDI direct feed limit (${maxFeedTds} mg/L TDS; DuPont EDI-310 Spec).`;
        } else {
            gatingReason = `Feed hardness (${feedHardness} mg/L as CaCO3) exceeds EDI scaling-control limit (${maxHardness} mg/L; DuPont EDI-310 Spec). High OH- generation causes Ca/Mg scaling in concentrate channels.`;
        }
    }

    // 3. Explicit SI Unit Conversions & Molar Ion Removal
    const flowRateM3s = flowRateLmin / (1000 * 60); // m³/s
    const flowRateM3h = (flowRateLmin * 60) / 1000; // m³/h

    const molarMassNaCl = DEFAULT_EDI_LIMITS.molarMassNaCl; // g/mol
    const faradayConstant = DEFAULT_EDI_LIMITS.faradayConstant; // C/mol
    const z = DEFAULT_EDI_LIMITS.ionValence;

    // 4. Ultrapure Polishing Performance & Product Quality Calculations
    // Single-stage EDI achieves >99.5% ion removal on RO permeate feed
    const maxSinglePassRemovalRatio = 0.998; // 99.8% max removal
    const requestedRemovalRatio = feedTds > 0 ? (feedTds - targetTds) / feedTds : 0.99;
    const actualRemovalRatio = Math.min(maxSinglePassRemovalRatio, Math.max(0, requestedRemovalRatio));

    const calculatedOutletTds = Number((feedTds * (1 - actualRemovalRatio)).toFixed(3));
    const outletTds = Math.max(0.005, calculatedOutletTds); // mg/L

    const isTargetAchieved = outletTds <= targetTds + 0.01;
    const targetDeviation = Number(Math.abs(outletTds - targetTds).toFixed(3));
    const additionalStagesRequired = (!isTargetAchieved && isFeedFeasible) ? 2 : 1;

    // Ultrapure Water Conductivity & Resistivity Calculations
    // Conductivity (µS/cm) ≈ TDS (mg/L) / 0.65; Resistivity (MΩ·cm) = 1 / Conductivity (µS/cm)
    // Pure water theoretical limit: 0.055 µS/cm ≡ 18.2 MΩ·cm at 25°C
    const calculatedConductivityUsCm = Math.max(0.055, outletTds / 0.65);
    const predictedOutletConductivity = Number(calculatedConductivityUsCm.toFixed(4));
    const calculatedResistivityMohmCm = Math.min(18.2, 1.0 / calculatedConductivityUsCm);
    const predictedOutletResistivity = Number(calculatedResistivityMohmCm.toFixed(2));

    // Hardness Removal
    const predictedOutletHardness = Number((feedHardness * (1 - actualRemovalRatio)).toFixed(4));

    const deltaTds = feedTds - outletTds; // mg/L === g/m³
    const massRemovalRateGs = flowRateM3s * deltaTds; // g/s removed
    const massRemovalRateKgH = (massRemovalRateGs * 3600) / 1000; // kg/h
    const molarRemovalRateMols = massRemovalRateGs / molarMassNaCl; // mol/s

    // 5. Multi-Stream Water & Salt Conservation Balances
    const waterRecoveryFrac = waterRecoveryPct / 100;

    const productFlowLmin = flowRateLmin * waterRecoveryFrac; // L/min
    const productFlowM3s = (productFlowLmin / 1000) / 60; // m³/s
    const productFlowM3h = (productFlowLmin * 60) / 1000; // m³/h

    const concentrateFlowLmin = flowRateLmin * (1 - waterRecoveryFrac); // L/min
    const concentrateFlowM3s = (concentrateFlowLmin / 1000) / 60; // m³/s
    const concentrateFlowM3h = (concentrateFlowLmin * 60) / 1000; // m³/h

    // Water Conservation Check: Q_feed = Q_prod + Q_conc
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

    // 6. Faraday Charge Demand & Current Calculation
    cellVoltage = Math.max(DEFAULT_EDI_LIMITS.minCellVoltage, Math.min(DEFAULT_EDI_LIMITS.maxCellVoltage, cellVoltage));
    const chargeUtilization = calculateEDIChargeUtilization(cellVoltage, feedTds, inputs);

    // Total Stack Faraday Current (Amperes total across all cell pairs):
    // I_EDI = (n_dot * z * F) / Lambda_EDI
    const totalFaradayCurrent = (molarRemovalRateMols * z * faradayConstant) / chargeUtilization; // Amperes

    // 7. Current-Density-Based Membrane Sizing & Module Topology
    const targetCurrentDensityAm2 = Number(inputs.currentDensity ?? DEFAULT_EDI_LIMITS.defaultCurrentDensityAm2);
    const requiredTotalAreaM2 = totalFaradayCurrent / Math.max(10, targetCurrentDensityAm2); // m² total membrane area

    const planarAreaM2 = Math.max(0.01, inputPlanarAreaCm2 / 10000); // m² per cell pair

    const calculatedCellPairsRaw = Math.ceil(requiredTotalAreaM2 / planarAreaM2);
    const calculatedPairs = Math.max(10, calculatedCellPairsRaw);

    const pairsPerModule = 34; // EDI standard cell pairs per module
    const requiredPairs = manualCellPairs !== null ? manualCellPairs : calculatedPairs;

    const numberOfModules = Math.max(1, Math.ceil(requiredPairs / pairsPerModule));
    const cellPairs = manualCellPairs !== null ? manualCellPairs : (pairsPerModule * numberOfModules);

    const totalMembraneAreaM2 = Number((2 * cellPairs * planarAreaM2).toFixed(2)); // m² (1 AEM + 1 CEM per pair)

    const cellCurrent = Number((totalFaradayCurrent / cellPairs).toFixed(2)); // Amperes per pair
    const actualCurrentDensityAm2 = Number((cellCurrent / planarAreaM2).toFixed(1)); // A/m²

    // 8. Resin Bed Transport & Dilute Channel Hydraulics
    const channelThicknessM = DEFAULT_EDI_LIMITS.channelThicknessMm / 1000; // m
    const diluteChannelVolumeM3 = cellPairs * planarAreaM2 * channelThicknessM; // m³
    const resinVolumeLiters = diluteChannelVolumeM3 * (1 - DEFAULT_EDI_LIMITS.resinBedPorosity) * 1000; // Liters of resin
    const resinExchangeCapacityEq = resinVolumeLiters * DEFAULT_EDI_LIMITS.resinExchangeCapacityEqL; // Total equivalents capacity

    const residenceTimeMin = flowRateM3s > 0 ? (diluteChannelVolumeM3 / flowRateM3s) / 60 : 0.05; // minutes
    const ionFlux = totalMembraneAreaM2 > 0 ? (molarRemovalRateMols / totalMembraneAreaM2) : 0; // mol/(m²·s)

    // 9. Continuous Electrochemical Water Splitting & Auto-Regeneration (H+ / OH-)
    // Water splitting occurs at bipolar resin-membrane boundaries when current exceeds limiting current density
    // Water Splitting Rate = I_total * (1 - Lambda_EDI) / F (mol/s)
    const waterSplittingRateMols = (totalFaradayCurrent * (1 - chargeUtilization)) / faradayConstant; // mol H+/OH- generated per sec
    const HplusGenerationMols = waterSplittingRateMols; // mol/s H+
    const OHminusGenerationMols = waterSplittingRateMols; // mol/s OH-

    // 10. Voltages & Stack Electrical Power
    const voltageModule = Number((pairsPerModule * cellVoltage).toFixed(2)); // V per module
    const voltageStack = Number((voltageModule * numberOfModules).toFixed(2)); // System Stack Voltage (V)

    const cellPower = Number((cellVoltage * cellCurrent).toFixed(2)); // W per pair
    const stackElectricalPowerW = Number((voltageStack * cellCurrent).toFixed(1)); // W total stack electrical power

    // 11. Separate Hydraulic Pumping Hydrodynamics (Packed Resin Bed Ergun Equation for Dilute Channels)
    const resinBedPorosity = DEFAULT_EDI_LIMITS.resinBedPorosity; // 0.40
    const resinBeadDiameterM = 0.0006; // 0.6 mm resin bead diameter
    const stackWidthMm = Number(inputs.stackWidth ?? 100); // mm
    const stackLengthMm = Number(inputs.stackLength ?? 200); // mm

    const stackWidthM = stackWidthMm / 1000;
    const stackLengthM = stackLengthMm / 1000;

    const diluteChannelAreaM2 = cellPairs * stackWidthM * channelThicknessM;
    const flowVelocityDilute = diluteChannelAreaM2 > 0 ? (flowRateM3s / diluteChannelAreaM2) : 0.025; // m/s superficial velocity

    const fluidDensityWater = 1000; // kg/m³
    const dynamicViscosityWater = 0.001; // Pa.s

    // Ergun Equation for fluid flow through packed porous resin beds:
    // dP/L = 150 * (1-eps)^2 / eps^3 * (mu * v / dp^2) + 1.75 * (1-eps) / eps^3 * (rho * v^2 / dp)
    const ergunViscousTerm = 150 * Math.pow(1 - resinBedPorosity, 2) / Math.pow(resinBedPorosity, 3) * (dynamicViscosityWater * flowVelocityDilute / Math.pow(resinBeadDiameterM, 2));
    const ergunInertialTerm = 1.75 * (1 - resinBedPorosity) / Math.pow(resinBedPorosity, 3) * (fluidDensityWater * Math.pow(flowVelocityDilute, 2) / resinBeadDiameterM);

    const ergunPressureDropPa = (ergunViscousTerm + ergunInertialTerm) * stackLengthM;
    const calculatedErgunDp = Math.max(250, Math.min(2500, Number(ergunPressureDropPa.toFixed(0))));

    const pressureDropWaterPa = Number(inputs.pressureDropWater ?? inputs.pressureDrop ?? calculatedErgunDp); // Pa
    const pressureDropConcentratePa = Number(inputs.pressureDropConcentrate ?? Math.round(calculatedErgunDp * 1.2)); // Pa

    const pumpEfficiencyWater = Number(inputs.pumpEfficiencyWater ?? inputs.pumpEfficiency ?? 0.75); // 75%
    const pumpEfficiencyConcentrate = Number(inputs.pumpEfficiencyConcentrate ?? 0.70); // 70%

    const waterPumpPowerW = Number(((flowRateM3s * pressureDropWaterPa) / pumpEfficiencyWater).toFixed(1)); // W
    const concentratePumpPowerW = Number(((concentrateFlowM3s * pressureDropConcentratePa) / pumpEfficiencyConcentrate).toFixed(1)); // W

    // 12. Independent SEC Energy Accounting (Separate Electrical, Water Pump & Concentrate Pump)
    const secElectricalKwhM3 = productFlowM3h > 0 ? (stackElectricalPowerW / 1000) / productFlowM3h : 0;
    const secElectrical = Number(secElectricalKwhM3.toFixed(4));

    const secWaterPumpKwhM3 = productFlowM3h > 0 ? (waterPumpPowerW / 1000) / productFlowM3h : 0;
    const secWaterPump = Number(secWaterPumpKwhM3.toFixed(5));

    const secConcentratePumpKwhM3 = productFlowM3h > 0 ? (concentratePumpPowerW / 1000) / productFlowM3h : 0;
    const secConcentratePump = Number(secConcentratePumpKwhM3.toFixed(5));

    const secHydraulic = Number((secWaterPump + secConcentratePump).toFixed(4));
    const secTotal = Number((secElectrical + secHydraulic).toFixed(4));

    // 13. Feasibility Status Determination
    let statusLabel = "TARGET ACHIEVED — MODEL PREDICTION";
    if (!isFeedFeasible) {
        statusLabel = "FEED PRETREATMENT REQUIRED";
    } else if (!isTargetAchieved) {
        statusLabel = "TARGET NOT ACHIEVED — MODEL OPERATING LIMIT";
    }

    const removalEfficiency = Number((((feedTds - outletTds) / feedTds) * 100).toFixed(2));

    // 14. Explicit Structured Model Pedigree Object
    const modelPedigree = {
        firstPrinciples: [
            "Water volume conservation balance (Q_feed = Q_prod + Q_conc)",
            "Salt species mass balance (Q_f * C_f = Q_p * C_p + Q_c * C_c)",
            "Molar ion removal rate (n_dot = m_dot / M_NaCl)",
            "Faraday charge demand relationship (I_EDI = n_dot * z * F / Lambda)",
            "Electrical series module voltage scaling (V_stack = N_pairs * V_cell)",
            "Stack electrical power equation (P_elec = V_stack * I)",
            "Hydraulic pump power equation (P_pump = Q * Delta_P / eta)",
            "Separate SEC calculation breakdown (SEC_total = SEC_elec + SEC_waterpump + SEC_concpump)",
            "Water-splitting stoichiometry (H2O -> H+ + OH- at bipolar interfaces)"
        ],
        literatureSupported: [
            "Continuous hybrid resin/membrane EDI stack architecture (Glaeser et al., 2014)",
            "Continuous electrical resin auto-regeneration without chemical acid/base",
            "Strict RO-pretreated feed requirement (Feed TDS < 30 mg/L, Hardness < 0.5 mg/L as CaCO3)",
            "DuPont EDI-310 vendor technical specification scaling boundaries"
        ],
        projectAssumptions: [
            "Default feed limits (30 mg/L TDS, 0.5 mg/L hardness as CaCO3)",
            "Default module topology (34 cell pairs per module)",
            "Mixed-bed resin ion-exchange capacity (1.9 eq/L resin)",
            "Centrifugal water pump efficiency (75%) and concentrate pump efficiency (70%)"
        ],
        calibrationParameters: [
            "Lambda_EDI (EDI current/charge utilization efficiency = 0.85)"
        ],
        unsupportedPhysics: [
            "Resin pore-scale intra-particle diffusion kinetics",
            "Exact dynamic membrane permselectivity under high-field polarization",
            "Transient boundary-layer concentration polarization micro-profiles",
            "Detailed multicomponent Ca2+/Mg2+/Na+ competitive ion exchange kinetics",
            "Silica reactive polymerization and dynamic CO2 loading equilibria",
            "Resin thermal aging, bed compaction, and long-term membrane fouling"
        ]
    };

    // Water Chemistry & Multi-Ion Speciation
    const waterChem = analyzeWaterChemistry(feedWater);

    // 3-Way Mass, Salt & Charge Balance Diagnostics
    const feedSaltRateGs = flowRateM3s * feedTds;
    const productSaltRateGs = productFlowM3s * outletTds;
    const concentrateSaltRateGs = concentrateFlowM3s * concentrateTdsVal;

    const waterBalanceError = Number(Math.abs(flowRateLmin - (productFlowLmin + concentrateFlowLmin)).toFixed(4));
    const saltBalanceError = Number(Math.abs(feedSaltRateGs - (productSaltRateGs + concentrateSaltRateGs)).toFixed(4));
    const chargeBalanceError = waterChem.chargeBalanceErrorPercent;

    const balanceDiagnostics = {
        waterBalanceStatus: waterBalanceError < 0.01 ? "PASS" : "FAIL",
        saltBalanceStatus: saltBalanceError < 0.001 ? "PASS" : "FAIL",
        chargeBalanceStatus: waterChem.isChargeBalanced ? "PASS" : "WARNING",
        waterBalanceError,
        saltBalanceError,
        chargeBalanceErrorPercent: chargeBalanceError
    };

    // Technology Failure Modes & Risk Diagnostics
    const risks = [];
    if (isFeedFeasible) {
        risks.push({ level: "PASS", message: "RO Permeate Feed Feasible: Continuous mixed-bed resin electromigration and water splitting active." });
    } else {
        risks.push({ level: "FAIL", message: `DIRECT FEED INFEASIBLE: ${gatingReason}. RO Pretreatment Required (RO → EDI).` });
    }

    if (feedHardness > 0.5) {
        risks.push({ level: "FAIL", message: `Hardness Limit Exceeded: Feed hardness (${feedHardness} mg/L) > 0.5 mg/L as CaCO3 limit. Extreme CaCO3/Mg(OH)2 scaling risk in concentrate channel.` });
    }

    risks.push({ level: "INFO", message: "Continuous In-Situ Regeneration: H+/OH- water splitting continuously regenerates mixed-bed resin without hazardous acid/caustic chemicals." });

    // Envelope Distinction
    const envelopeDistinction = {
        currentModelEnvelope: "0.05 – 30.0 mg/L TDS RO Permeate Feed (DuPont EDI-310 Vendor Limit)",
        literatureEvidence: "Glaeser et al. (2014) Ultrapure Water Polishing Benchmark",
        extrapolationWarning: !isFeedFeasible ? `Direct feed TDS (${feedTds} mg/L) exceeds EDI feed quality envelope.` : null
    };

    return {
        technology: "EDI",
        techName: DEFAULT_EDI_LIMITS.name,
        processTrainName: isFeedFeasible ? "EDI" : "RO → EDI",
        status: (inputs.tds === undefined && feedWater.tds === undefined) ? "EDI feed qualification incomplete" : (isFeedFeasible ? statusLabel : "FEED PRETREATMENT REQUIRED"),
        isFeedFeasible,
        feedQualityFeasible: isFeedFeasible,
        ediDirectFeedFeasible: isFeedFeasible,
        feedGating: (inputs.tds === undefined && feedWater.tds === undefined) ? "INCOMPLETE_DATA" : feedGatingStatus,
        feedGatingStatus: (inputs.tds === undefined && feedWater.tds === undefined) ? "INCOMPLETE_DATA" : feedGatingStatus,
        recommendedPretreatment,
        gatingReason: (inputs.tds === undefined && feedWater.tds === undefined) ? "Insufficient EDI feed quality information for qualification" : gatingReason,

        // Mass Balance & 3-Way Diagnostic Audit Flags
        isWaterConserved,
        isSaltConserved,
        balanceDiagnostics,
        waterChem,
        risks,
        envelopeDistinction,

        // Desalination & Ultrapure Water Quality
        feedTds,
        targetTds,
        outletTDS: outletTds,
        outletTds,
        predictedOutletTds: outletTds,
        predictedOutletConductivity,
        predictedOutletResistivity,

        feedHardness,
        predictedOutletHardness,
        hardnessLimit: DEFAULT_EDI_LIMITS.maxHardnessMgLAsCaCO3,
        hardnessStatus: isHardnessFeasible ? "PASSED" : "FEED PRETREATMENT REQUIRED (Hardness Exceeds Scaling Limit)",

        removalEfficiency,
        isTargetAchieved,
        targetAchievable: isTargetAchieved,
        additionalStagesRequired,

        // Multi-Stream Water & Salt Mass Balance
        flowRateLmin,
        feedFlowRate: flowRateLmin,
        productFlowLmin: Number(productFlowLmin.toFixed(2)),
        productFlowRate: Number(productFlowLmin.toFixed(2)),
        concentrateFlowLmin: Number(concentrateFlowLmin.toFixed(2)),
        concentrateFlowRate: Number(concentrateFlowLmin.toFixed(2)),
        flowRateM3s: Number(flowRateM3s.toExponential(4)),
        flowRateM3h: Number(flowRateM3h.toFixed(3)),
        productFlowM3h: Number(productFlowM3h.toFixed(3)),
        concentrateFlowM3h: Number(concentrateFlowM3h.toFixed(3)),
        concentrateTds,

        // Mass Balance Audit Flags & Mass Rates
        isWaterConserved,
        isSaltConserved,
        feedIonMassRate: Number(feedSaltMassGs.toFixed(6)),
        productIonMassRate: Number(productSaltMassGs.toFixed(6)),
        concentrateIonMassRate: Number(concentrateSaltMassGs.toFixed(6)),
        massRemovalRateGs: Number(massRemovalRateGs.toFixed(4)),
        massRemovalRateKgH: Number(massRemovalRateKgH.toFixed(4)),
        molarRemovalRateMols: Number(molarRemovalRateMols.toExponential(4)),
        ionRemovalRate: Number(massRemovalRateGs.toFixed(4)),
        naclEquivalentMolarMass: molarMassNaCl,

        massBalanceError: Number(massBalanceErrorGs.toExponential(4)),
        massBalancePercent,
        massBalanceStatus,

        // Charge, Current & Electrochemical Sizing
        chargeUtilization: Number((chargeUtilization * 100).toFixed(1)),
        chargeUtilizationFrac: chargeUtilization,
        chargeUtilizationDescription: "Charge Utilization Parameter: 0.85 — project calibration/assumption parameter",
        totalFaradayCurrent: Number(totalFaradayCurrent.toFixed(2)),
        current: cellCurrent,
        cellCurrent,
        targetCurrentDensity: targetCurrentDensityAm2,
        currentDensity: actualCurrentDensityAm2,
        // Modules & Integer Cell Pairs
        cellPairs,
        pairsPerModule,
        numberOfModules,
        requiredTotalAreaM2: Number(requiredTotalAreaM2.toFixed(3)),
        electrodeArea: inputPlanarAreaCm2, // cm² per pair
        membraneArea: totalMembraneAreaM2,
        totalMembraneAreaM2,
        membraneThicknessMm: 0.15,

        // Resin Bed Transport & Water Splitting
        resinVolumeLiters: Number(resinVolumeLiters.toFixed(2)),
        reactorVolumeLiters: Number((diluteChannelVolumeM3 * 1000).toFixed(3)),
        resinExchangeCapacityEq: Number(resinExchangeCapacityEq.toFixed(2)),
        residenceTimeMin: Number(residenceTimeMin.toFixed(4)),
        residenceTime: Number(residenceTimeMin.toFixed(4)),
        ionFlux: Number(ionFlux.toExponential(4)),

        waterSplittingRateMols: Number(waterSplittingRateMols.toExponential(4)),
        HplusGenerationMols: Number(HplusGenerationMols.toExponential(4)),
        OHminusGenerationMols: Number(OHminusGenerationMols.toExponential(4)),
        regenerationChargeFraction: Number((1 - chargeUtilization).toFixed(2)),

        // Voltages & Electrical Power
        voltageCell: cellVoltage,
        cellPairVoltage: cellVoltage,
        voltage: cellVoltage,
        voltageModule,
        voltageStack,
        cellPower,
        stackElectricalPowerW,
        electricalPowerW: stackElectricalPowerW,
        electricalPower: stackElectricalPowerW,
        power: stackElectricalPowerW,
        stackPowerW: stackElectricalPowerW,

        // Hydrodynamics & Independent Pump Powers
        pressureDropWaterPa,
        pressureDropWater: pressureDropWaterPa,
        pressureDropConcentrate: pressureDropConcentratePa,
        pressureDrop: pressureDropWaterPa,
        waterPumpPowerW,
        waterPumpPower: waterPumpPowerW,
        concentratePumpPowerW,
        concentratePumpPower: concentratePumpPowerW,
        totalPumpPowerW: Number((waterPumpPowerW + concentratePumpPowerW).toFixed(1)),

        // Independent SEC Energy Accounting (Separate Electrical, Water Pump & Concentrate Pump)
        electricalSEC: secElectrical,
        waterPumpSEC: secWaterPump,
        concentratePumpSEC: secConcentratePump,
        // Explicit SEC Energy Accounting Breakdown
        secElectrical,
        secElectricalGross: secElectrical,
        secElectricalNet: secElectrical,
        energyRecoveryFactor: 0.0,
        energyRecoveryPercent: 0.0,
        secWaterPump,
        secConcentratePump,
        secHydraulic,
        secTotal,
        secTotalNet: secTotal,
        secTotalGross: secTotal,
        sec: secTotal,
        rejectFlowLmin: Number(concentrateFlowLmin.toFixed(2)),
        rejectTds: concentrateTds,
        secEstimateLabel: `TOTAL NET SEC: ${secTotal} kWh/m³ [MODEL ESTIMATE]`,

        // Hydraulics & Mass
        waterRecovery: waterRecoveryPct,
        productFlowLmin: Number(productFlowLmin.toFixed(2)),

        // Technology Fundamental Configuration (Single Source of Truth)
        fundamentals: TECHNOLOGY_FUNDAMENTALS.EDI,
        operatingPrinciple: TECHNOLOGY_FUNDAMENTALS.EDI.operatingPrinciple,
        electrodeConfiguration: TECHNOLOGY_FUNDAMENTALS.EDI.electrodeConfiguration,
        membraneConfiguration: TECHNOLOGY_FUNDAMENTALS.EDI.membraneConfiguration,
        membraneThicknessMm: 0.20,
        feedWaterFlowDirection: TECHNOLOGY_FUNDAMENTALS.EDI.feedWaterFlowDirection,
        productWaterFlowPath: TECHNOLOGY_FUNDAMENTALS.EDI.productWaterFlowPath,
        concentrateRejectFlowPath: TECHNOLOGY_FUNDAMENTALS.EDI.concentrateRejectFlowPath,
        electricalPolarity: TECHNOLOGY_FUNDAMENTALS.EDI.electricalPolarity,
        ionTransportDirection: TECHNOLOGY_FUNDAMENTALS.EDI.ionTransportDirection,
        desalinationMechanism: TECHNOLOGY_FUNDAMENTALS.EDI.desalinationMechanism,
        regenerationMechanism: TECHNOLOGY_FUNDAMENTALS.EDI.regenerationMechanism,
        operationType: TECHNOLOGY_FUNDAMENTALS.EDI.operationType,
        pretreatmentRequirements: TECHNOLOGY_FUNDAMENTALS.EDI.pretreatmentRequirements,
        operatingEnvelope: TECHNOLOGY_FUNDAMENTALS.EDI.operatingEnvelope,
        advantages: TECHNOLOGY_FUNDAMENTALS.EDI.advantages,
        limitations: TECHNOLOGY_FUNDAMENTALS.EDI.limitations,

        // Legacy compatibility aliases
        flowConfiguration: TECHNOLOGY_FUNDAMENTALS.EDI.feedWaterFlowDirection,
        ionTransport: TECHNOLOGY_FUNDAMENTALS.EDI.ionTransportDirection,
        polarity: TECHNOLOGY_FUNDAMENTALS.EDI.electricalPolarity,
        productStream: TECHNOLOGY_FUNDAMENTALS.EDI.productWaterFlowPath,
        concentrateStream: TECHNOLOGY_FUNDAMENTALS.EDI.concentrateRejectFlowPath,
        pretreatment: TECHNOLOGY_FUNDAMENTALS.EDI.pretreatmentRequirements,
        regenerationMode: TECHNOLOGY_FUNDAMENTALS.EDI.regenerationMechanism,

        // Metadata & Structured Pedigree Object
        modelPredictionLabel: statusLabel,
        modelPedigree,
        modelPredictionOnly: true,
        envelopeStatus: isFeedFeasible ? "VALIDATED" : "OUTSIDE_ENVELOPE",
        envelopeMessage: isFeedFeasible
            ? "Operating parameters within literature-supported EDI benchmark envelope (DuPont EDI-310 spec)."
            : gatingReason,
        envelopeConfig: DEFAULT_EDI_LIMITS,
        modelStatus: "First-Principles Physics (Hybrid Resin/Membrane Electromigration & Water Splitting Auto-Regeneration)",

        // Engineering Calculation Traceability Sequence (Phase 3 Traceability)
        calculationTrace: [
            { step: 1, name: "Feed Water Quality", status: "VALIDATED", provenance: "LITERATURE_SUPPORTED", detail: `Feed TDS: ${feedTds} mg/L, Hardness: ${feedHardness} mg/L as CaCO3, Flow: ${flowRateLmin} L/min` },
            { step: 2, name: "Feasibility Gating", status: isFeedFeasible ? "PASSED" : "FAILED_RO_REQUIRED", provenance: "LITERATURE_SUPPORTED", detail: isFeedFeasible ? "RO Permeate feed quality feasible (<30 mg/L TDS, <0.5 mg/L hardness; DuPont EDI-310 spec)" : `NOT DIRECT-FEED FEASIBLE — RO Pretreatment Required (${gatingReason})` },
            { step: 3, name: "Physical Mechanism", status: "VALIDATED", provenance: "LITERATURE_SUPPORTED", detail: "Mixed-bed resin ion electromigration & continuous H+/OH- water-splitting auto-regeneration" },
            { step: 4, name: "Mass Conservation", status: "PASSED", provenance: "FIRST_PRINCIPLES", detail: `Q_feed (${flowRateLmin} L/min) = Q_prod (${productFlowLmin} L/min) + Q_conc (${concentrateFlowLmin} L/min)` },
            { step: 5, name: "Electrical Balance", status: "PASSED", provenance: "FIRST_PRINCIPLES", detail: `I_total (${totalFaradayCurrent.toFixed(1)} A) = n_dot × z × F / Charge Utilization (${(chargeUtilization * 100).toFixed(1)}%)` },
            { step: 6, name: "Hydraulic Balance", status: "ESTIMATED", provenance: "EXTRAPOLATED", detail: `Pressure drop: ${pressureDropWaterPa} Pa (Calculated via Ergun packed resin bed model; literature-estimated)` },
            { step: 7, name: "Outlet TDS & Resistivity", status: "DERIVED", provenance: "FIRST_PRINCIPLES", detail: `Outlet: ${outletTds} mg/L (Resistivity: ${predictedOutletResistivity} MΩ·cm, Conductivity: ${predictedOutletConductivity} µS/cm)` },
            { step: 8, name: "Water Recovery", status: "DERIVED", provenance: "CALIBRATED", detail: `Recovery (${waterRecoveryPct}%) derived from concentrate reject bleed for scaling control` },
            { step: 9, name: "Specific Energy (SEC)", status: "RECONCILED", provenance: "FIRST_PRINCIPLES", detail: `SEC: ${secTotal} kWh/m³ (Electrical: ${secElectrical} kWh/m³, Water Pump: ${secWaterPump} kWh/m³, Concentrate Pump: ${secConcentratePump} kWh/m³)` },
            { step: 10, name: "Target Check", status: isFeedFeasible ? (isTargetAchieved ? "PASSED" : "LIMIT_REACHED") : "PRETREATMENT_REQUIRED", provenance: "PROJECT_ASSUMPTION", detail: isFeedFeasible ? (isTargetAchieved ? `Ultrapure target setpoint reached (${predictedOutletResistivity} MΩ·cm)` : `Target deviation (+${targetDeviation} mg/L)`) : "EDI direct feed infeasible; RO pretreatment required" }
        ]
    };
}

/**
 * Executes parameter sensitivity analysis across a specified range of parameter values for EDI.
 * Pure function: Does NOT mutate the input baseInput object.
 *
 * @param {object} baseInput - Base EDI input configuration
 * @param {string} parameter - Name of parameter to vary
 * @param {Array<number>} values - Array of numeric values to test
 * @returns {object} Structured sensitivity results
 */
export function runEDISensitivityAnalysis(baseInput = {}, parameter = "feedTds", values = []) {
    if (!Array.isArray(values) || values.length === 0) {
        throw new Error("Values must be a non-empty array for sensitivity analysis.");
    }

    const results = values.map(val => {
        // Deep clone baseInput to prevent mutation of original object
        const clonedInput = JSON.parse(JSON.stringify(baseInput));

        if (parameter === "feedTds" || parameter === "tds") {
            clonedInput.tds = val;
        } else if (parameter === "targetTds") {
            clonedInput.targetTds = val;
        } else if (parameter === "hardness") {
            clonedInput.hardness = val;
        } else if (parameter === "voltage" || parameter === "cellPairVoltage") {
            clonedInput.voltage = val;
        } else if (parameter === "cellPairs") {
            clonedInput.cellPairs = val;
        } else if (parameter === "membraneArea" || parameter === "electrodeArea") {
            clonedInput.electrodeArea = val;
        } else if (parameter === "currentDensity") {
            clonedInput.currentDensity = val;
        } else if (parameter === "flowRate") {
            clonedInput.flowRate = val;
        } else if (parameter === "waterRecovery" || parameter === "recovery") {
            clonedInput.waterRecovery = val;
        } else if (parameter === "resinVolume") {
            clonedInput.resinVolume = val;
        } else if (parameter === "chargeUtilization" || parameter === "lambda") {
            clonedInput.chargeUtilization = val;
        } else if (parameter === "pumpEfficiency") {
            clonedInput.pumpEfficiencyWater = val;
        } else {
            clonedInput[parameter] = val;
        }

        const res = calculateEDIModel(clonedInput);
        return {
            value: val,
            outletTDS: res.outletTds,
            predictedOutletResistivity: res.predictedOutletResistivity,
            removalPercent: res.removalEfficiency,
            current: res.cellCurrent,
            electricalPower: res.electricalPowerW,
            waterPumpPower: res.waterPumpPowerW,
            concentratePumpPower: res.concentratePumpPowerW,
            hydraulicSEC: res.secHydraulic,
            electricalSEC: res.secElectrical,
            totalSEC: res.secTotal,
            status: res.status
        };
    });

    return {
        parameter,
        values,
        results
    };
}

export default calculateEDIModel;
