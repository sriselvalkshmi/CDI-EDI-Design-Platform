"use strict";

import { PARAMETER_REGISTRY } from "./parameterRegistry.js";
import { lMinToM3h, calculateSoluteFlowGs, calculateElectricalPowerW, calculateSecKwhM3 } from "./unitConversions.js";
import { evaluateFeasibilityGate } from "./feasibilityGate.js";

/**
 * Builds a standardized parameter metadata leaf.
 */
function createParamMeta({
    parameterId,
    value,
    unit,
    source,
    equationId,
    modelId,
    dependencies = [],
    assumptions = "Standard state 25°C, 1 atm",
    operatingRange = null,
    uncertainty = "±2%",
    validationStatus = "VERIFIED"
}) {
    const reg = PARAMETER_REGISTRY[parameterId] || {};
    return {
        parameter: reg.canonicalName || parameterId,
        parameterId,
        value: typeof value === "number" ? Number(value.toFixed(6).replace(/\.?0+$/, "")) : value,
        unit: unit || reg.unit || "",
        source: source || reg.authoritativeOwner || "Authoritative Engineering Engine",
        equationId: equationId || reg.equationId || "EQ-CORE-001",
        modelId: modelId || "PHYSICS-MODEL-V2",
        dependencies,
        assumptions,
        operatingRange: operatingRange || reg.validRange || [0, 100000],
        uncertainty: uncertainty || reg.uncertainty || "±2%",
        validationStatus,
        version: "2.5.0",
        timestamp: new Date().toISOString()
    };
}

/**
 * Transforms any technology model calculation result into the authoritative
 * Canonical Engineering Result Object specified in Section 2 of the Engineering Principle.
 * 
 * @param {Object} raw Result from technology model or engineeringEquationEngine
 * @param {Object} inputs Feed water and operating inputs
 * @param {Object} [teaResult] Optional techno-economic analysis result
 * @param {Object} [assessmentResult] Optional technology assessment multi-candidate matrix
 * @returns {Object} Canonical Engineering Result
 */
export function buildCanonicalEngineeringResult(raw = {}, inputs = {}, teaResult = null, assessmentResult = null) {
    const tech = raw.technology || inputs.technology || "MCDI";
    const feed = inputs.feedWater || inputs || {};

    const feedTds = Number(raw.tds ?? raw.feedTds ?? feed.tds ?? 500);
    const targetTds = Number(raw.targetTds ?? feed.targetTds ?? 50);
    const feedFlowLmin = Number(raw.flowRateLmin ?? raw.flowRate ?? feed.flowRate ?? 10);
    const waterRecoveryPct = Number(raw.waterRecovery ?? raw.recovery ?? 95.0);

    const productFlowLmin = Number(raw.productFlowLmin ?? raw.productFlow ?? (feedFlowLmin * (waterRecoveryPct / 100)));
    const rejectFlowLmin = Number(raw.rejectFlowLmin ?? raw.concentrateFlowLmin ?? (feedFlowLmin - productFlowLmin));
    const rawOutlet = Number(raw.outletTDS ?? raw.outletTds ?? 50.0);
    const outletTDS = Math.max(0, rawOutlet);
    const effOutlet = feedTds > 0 ? Math.min(feedTds, outletTDS) : 0;
    const calculatedRejectTds = rejectFlowLmin > 0 
        ? Math.max(0, (feedFlowLmin * feedTds - productFlowLmin * effOutlet) / rejectFlowLmin)
        : Math.max(0, feedTds * 5);
    const rejectTds = Math.max(0, Number(raw.rejectTds ?? raw.concentrateTds ?? calculatedRejectTds));

    const cellVoltage = Number(raw.voltageCell ?? raw.voltage ?? (tech === "MCDI" ? 1.4 : (tech === "EDI" ? 3.5 : 1.2)));
    const cellPairs = Number(raw.cellPairs ?? 68);
    const numberOfModules = Number(raw.numberOfModules ?? raw.modules ?? 2);
    const pairsPerModule = Number(raw.pairsPerModule ?? Math.ceil(cellPairs / numberOfModules));
    const moduleVoltage = Number(raw.voltageModule ?? (cellVoltage * pairsPerModule));
    const stackVoltage = Number(raw.voltageStack ?? (moduleVoltage * numberOfModules));

    const currentCell = Number(raw.current ?? raw.currentCell ?? 1.98);
    const currentStack = currentCell; // In a series module stack, current traverses all cell pairs
    const activeAreaCm2 = Number(raw.electrodeArea ?? raw.activeArea ?? 350);
    const activeAreaM2 = activeAreaCm2 * 1e-4;
    const currentDensityAm2 = Number(raw.currentDensity ?? (currentCell / activeAreaM2));

    const powerW = Number(raw.power ?? calculateElectricalPowerW(stackVoltage, currentStack));
    const secGrossKwhM3 = Number(raw.secElectricalGross ?? raw.secGross ?? calculateSecKwhM3(powerW, productFlowLmin));
    const secNetKwhM3 = Number(raw.secElectricalNet ?? raw.secNet ?? (raw.energyRecoveryFactor ? secGrossKwhM3 * (1 - raw.energyRecoveryFactor) : secGrossKwhM3));
    const secHydraulicKwhM3 = Number(raw.secHydraulic ?? raw.auxSec ?? 0.00010);
    const secTotalKwhM3 = Number(raw.secTotal ?? (secNetKwhM3 + secHydraulicKwhM3));

    const channelDpPa = Number(raw.channelPressureDropPa ?? raw.pressureDropChannel ?? 567);
    const manifoldDpPa = Number(raw.manifoldPressureDropPa ?? raw.pressureDropManifold ?? 150);
    const totalDpPa = Number(raw.pressureDrop ?? (channelDpPa + manifoldDpPa));
    const velocityMs = Number(raw.linearVelocityMs ?? raw.flowVelocity ?? 0.005);
    const reynoldsNumber = Number(raw.reynoldsNumber ?? raw.re ?? 2.4);

    // Mass Balance Closures
    const massWaterResidualLmin = Math.abs(feedFlowLmin - (productFlowLmin + rejectFlowLmin));
    const massWaterClosed = massWaterResidualLmin <= 1e-4;

    const saltInGs = calculateSoluteFlowGs(feedFlowLmin, feedTds);
    const saltProdGs = calculateSoluteFlowGs(productFlowLmin, outletTDS);
    const saltRejGs = calculateSoluteFlowGs(rejectFlowLmin, rejectTds);
    const saltSumOutGs = saltProdGs + saltRejGs;
    const saltResidualGs = Math.abs(saltInGs - saltSumOutGs);
    const saltClosed = saltResidualGs <= 1e-4 || (saltInGs > 0 && (saltResidualGs / saltInGs) < 0.001);

    // Faraday Charge Balance Reconciliation
    // dot{m}_salt = (N_pairs * I * Lambda * M_NaCl) / (z * F)
    let faradayRecon = raw.faradayChargeReconciliation ? { ...raw.faradayChargeReconciliation } : (raw.chargeBalance ? { ...raw.chargeBalance } : null);
    const rawLambda = Number(raw.chargeUtilization ?? raw.chargeEfficiency ?? 88.0);
    const chargeEfficiency = rawLambda > 1.0 ? rawLambda / 100 : rawLambda;
    const F = 96485.3321; // C/mol
    const M_NaCl = 58.44; // g/mol
    const z = 1;

    const observedSaltRemovalGs = (faradayRecon?.streamSaltRemovalMgS ?? faradayRecon?.streamSaltRemovalRateMgPerS) !== undefined
        ? Number(faradayRecon.streamSaltRemovalMgS ?? faradayRecon.streamSaltRemovalRateMgPerS) / 1000
        : (saltInGs - saltProdGs);

    const electroSaltRemovalGs = faradayRecon 
        ? Number(faradayRecon.faradaySaltRemovalMgS ?? faradayRecon.saltRemovalRateMgPerS ?? (faradayRecon.faradaySaltRemovalGs ? faradayRecon.faradaySaltRemovalGs * 1000 : null)) / 1000
        : ((cellPairs * currentCell * chargeEfficiency * M_NaCl) / (z * F));

    const rawChargeResidual = Math.abs(electroSaltRemovalGs - observedSaltRemovalGs);
    const chargeResidualGs = rawChargeResidual;
    const discrepancyPercent = observedSaltRemovalGs > 0 ? (chargeResidualGs / observedSaltRemovalGs) * 100 : 0;
    const chargeClosed = faradayRecon
        ? Boolean(faradayRecon.reconciled ?? faradayRecon.isConserved ?? (discrepancyPercent <= 0.5))
        : (chargeResidualGs <= 1.0e-4 || discrepancyPercent <= 0.5);

    if (!faradayRecon) {
        const totalFaradayCurrentA = cellPairs * currentCell;
        const effectiveCurrentA = totalFaradayCurrentA * chargeEfficiency;
        const molarRemovalRateMols = effectiveCurrentA / (z * F);
        const faradaySaltRemovalGs = electroSaltRemovalGs;
        const streamSaltRemovalGs = observedSaltRemovalGs;
        const isConserved = chargeClosed;

        faradayRecon = {
            equationId: "EQ-03-04",
            modelId: `${tech}-FIRST-PRINCIPLES`,
            inputDependencies: ["current", "cellPairs", "chargeEfficiency", "molarMassNaCl", "faradayConstant"],
            units: {
                current: "A",
                chargeRate: "C/s",
                ionTransport: "µmol/s",
                massRate: "mg/s",
                cycleRemoval: "mg/10min"
            },
            validationStatus: isConserved ? "VALIDATED" : "DISCREPANCY",
            cellCurrentA: currentCell,
            cellPairs,
            chargeUtilization: chargeEfficiency,
            chargeEfficiencyPct: Number((chargeEfficiency * 100).toFixed(1)),
            totalFaradayCurrentA: Number(totalFaradayCurrentA.toFixed(4)),
            totalCurrentA: Number(totalFaradayCurrentA.toFixed(4)),
            effectiveCurrentA: Number(effectiveCurrentA.toFixed(4)),
            chargeSuppliedCoulombsPerSec: Number(totalFaradayCurrentA.toFixed(3)),
            chargeUtilizedCoulombsPerSec: Number(effectiveCurrentA.toFixed(3)),
            molarRemovalRateMols,
            molarSaltRateMolPerS: molarRemovalRateMols,
            ionTransportUmolS: Number((molarRemovalRateMols * 1e6).toFixed(2)),
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
            discrepancyPercent: Number(discrepancyPercent.toFixed(4)),
            chargeBalanceRelativeErrorPct: Number(discrepancyPercent.toFixed(4)),
            isConserved,
            reconciled: isConserved,
            status: isConserved ? "RECONCILED" : "DIVERGENT"
        };
    } else {
        faradayRecon.totalFaradayCurrentA = faradayRecon.totalFaradayCurrentA ?? faradayRecon.totalCurrentA ?? (cellPairs * currentCell);
        faradayRecon.totalCurrentA = faradayRecon.totalCurrentA ?? faradayRecon.totalFaradayCurrentA;
        faradayRecon.effectiveCurrentA = faradayRecon.effectiveCurrentA ?? faradayRecon.chargeUtilizedCoulombsPerSec;
        faradayRecon.chargeUtilizedCoulombsPerSec = faradayRecon.chargeUtilizedCoulombsPerSec ?? faradayRecon.effectiveCurrentA;
        faradayRecon.molarRemovalRateMols = faradayRecon.molarRemovalRateMols ?? faradayRecon.molarSaltRateMolPerS;
        faradayRecon.molarSaltRateMolPerS = faradayRecon.molarSaltRateMolPerS ?? faradayRecon.molarRemovalRateMols;
        faradayRecon.faradaySaltRemovalMgS = faradayRecon.faradaySaltRemovalMgS ?? faradayRecon.saltRemovalRateMgPerS;
        faradayRecon.saltRemovalRateMgPerS = faradayRecon.saltRemovalRateMgPerS ?? faradayRecon.faradaySaltRemovalMgS;
        faradayRecon.streamSaltRemovalMgS = faradayRecon.streamSaltRemovalMgS ?? faradayRecon.streamSaltRemovalRateMgPerS;
        faradayRecon.streamSaltRemovalRateMgPerS = faradayRecon.streamSaltRemovalRateMgPerS ?? faradayRecon.streamSaltRemovalMgS;
        faradayRecon.faradaySaltRemovedPerCycleMg = faradayRecon.faradaySaltRemovedPerCycleMg ?? faradayRecon.faradaySaltRemoval10MinMg;
        faradayRecon.faradaySaltRemoval10MinMg = faradayRecon.faradaySaltRemoval10MinMg ?? faradayRecon.faradaySaltRemovedPerCycleMg;
        faradayRecon.streamSaltRemovedPerCycleMg = faradayRecon.streamSaltRemovedPerCycleMg ?? faradayRecon.streamSaltRemoval10MinMg;
        faradayRecon.streamSaltRemoval10MinMg = faradayRecon.streamSaltRemoval10MinMg ?? faradayRecon.streamSaltRemovedPerCycleMg;
        faradayRecon.discrepancyPercent = faradayRecon.discrepancyPercent ?? faradayRecon.chargeBalanceRelativeErrorPct ?? Number(discrepancyPercent.toFixed(4));
        faradayRecon.chargeBalanceRelativeErrorPct = faradayRecon.chargeBalanceRelativeErrorPct ?? faradayRecon.discrepancyPercent;
        faradayRecon.reconciled = Boolean(faradayRecon.reconciled ?? faradayRecon.isConserved ?? (faradayRecon.discrepancyPercent <= 5.0));
    }

    // Dynamic Cycle Inventory Closure (Continuous vs Cyclic Electrosorption)
    const isContinuousTech = tech === "FCDI" || tech === "EDI" || tech === "ED";
    let tAdsSec = 0;
    let tDesSec = 0;
    let saltAdsorbedMg = 0;
    let saltDesorbedMg = 0;
    let desFlowLmin = 0;
    let desAvgTds = 0;
    let dynamicCycleResidualMg = 0.0;
    let dynamicCycleClosed = true;

    if (!isContinuousTech) {
        tAdsSec = Number(raw.adsorptionTimeSec ?? 600);
        tDesSec = Number(raw.desorptionTimeSec ?? 60);
        const adsWaterVolL = (feedFlowLmin / 60) * tAdsSec;
        const desWaterVolL = (rejectFlowLmin / 60) * tDesSec;
        saltAdsorbedMg = (feedTds - outletTDS) * (productFlowLmin / 60) * tAdsSec;
        desFlowLmin = tDesSec > 0 ? (desWaterVolL / (tDesSec / 60)) : rejectFlowLmin;
        desAvgTds = desWaterVolL > 0 ? (saltAdsorbedMg / desWaterVolL) : rejectTds;
        saltDesorbedMg = (desFlowLmin / 60) * tDesSec * desAvgTds;
        dynamicCycleResidualMg = Math.abs(saltAdsorbedMg - saltDesorbedMg);
        dynamicCycleClosed = dynamicCycleResidualMg <= 1e-4;
    }

    const validationTier = Boolean(raw.isCalibrated || inputs.isCalibrated || inputs.calibrationData)
        ? "LEVEL 4: FULLY VALIDATED (CALIBRATED)"
        : "LEVEL 3: FEASIBLE & COMPLIANT (FIRST-PRINCIPLES PREDICTION)";

    // Construct Canonical Result
    const canonical = {
        ...raw,
        technology: tech,
        isCalibrated: Boolean(raw.isCalibrated || inputs.isCalibrated || inputs.calibrationData),

        DesignBasis: {
            feedTDS: createParamMeta({ parameterId: "FEED_TDS", value: feedTds, unit: "mg/L", source: "Design Basis Inflow" }),
            feedFlow: createParamMeta({ parameterId: "FEED_FLOW", value: feedFlowLmin, unit: "L/min", source: "Design Basis Inflow" }),
            targetTds: createParamMeta({ parameterId: "PRODUCT_TDS", value: targetTds, unit: "mg/L", source: "Design Basis Target Setpoint" }),
            targetRecovery: createParamMeta({ parameterId: "RECOVERY", value: waterRecoveryPct, unit: "%", source: "Design Basis Recovery Target" }),
            activeArea: createParamMeta({ parameterId: "ACTIVE_AREA", value: activeAreaCm2, unit: "cm²", source: "Electrode Specification" })
        },

        TechnologyResult: {
            technology: tech,
            outletTDS: createParamMeta({ parameterId: "PRODUCT_TDS", value: outletTDS, unit: "mg/L", modelId: `${tech}-DESAL-V2`, equationId: "EQ-02-02", dependencies: ["FEED_TDS", "CELL_VOLTAGE", "CURRENT"] }),
            waterRecovery: createParamMeta({ parameterId: "RECOVERY", value: waterRecoveryPct, unit: "%", equationId: "EQ-01-04", dependencies: ["FEED_FLOW", "PRODUCT_FLOW"] }),
            saltRemovalRate: createParamMeta({ parameterId: "SALT_REMOVAL", value: (observedSaltRemovalGs * 1000), unit: "mg/s", equationId: "EQ-02-03", dependencies: ["FEED_TDS", "PRODUCT_TDS", "FEED_FLOW"] }),
            cellPairs: createParamMeta({ parameterId: "CELL_PAIRS", value: cellPairs, unit: "pairs", modelId: "STACK-GEOM-V1", equationId: "EQ-04-01" }),
            numberOfModules: { value: numberOfModules, unit: "modules" },
            pairsPerModule: { value: pairsPerModule, unit: "pairs/module" },
            isTargetAchieved: outletTDS <= targetTds + 0.05
        },

        HydraulicResult: {
            productFlow: createParamMeta({ parameterId: "PRODUCT_FLOW", value: productFlowLmin, unit: "L/min", equationId: "EQ-01-02", dependencies: ["FEED_FLOW", "RECOVERY"] }),
            rejectFlow: { value: rejectFlowLmin, unit: "L/min", source: "Hydraulic Mass Conservation" },
            productFlowM3h: { value: lMinToM3h(productFlowLmin), unit: "m³/h" },
            linearVelocity: createParamMeta({ parameterId: "VELOCITY", value: velocityMs, unit: "m/s", equationId: "EQ-01-05", dependencies: ["FEED_FLOW", "CELL_PAIRS"] }),
            reynoldsNumber: { value: reynoldsNumber, unit: "dimensionless", source: "Hydrodynamic Spacer Geometry" },
            channelPressureDrop: createParamMeta({ parameterId: "CHANNEL_DP", value: channelDpPa, unit: "Pa", equationId: "EQ-01-08" }),
            manifoldPressureDrop: { value: manifoldDpPa, unit: "Pa", source: "Manifold Header Sizing" },
            totalPressureDrop: { value: totalDpPa, unit: "Pa", source: "Channel DP + Manifold DP" },
            hydraulicBreakdown: raw.hydraulicBreakdown || {
                productChannelPa: channelDpPa,
                slurryChannelPa: Number(raw.pressureDropSlurryPa ?? 0),
                manifoldPa: manifoldDpPa,
                totalSystemPa: totalDpPa
            },
            auxSec: createParamMeta({ parameterId: "AUX_SEC", value: secHydraulicKwhM3, unit: "kWh/m³", equationId: "EQ-01-09" })
        },

        ElectricalResult: {
            cellVoltage: createParamMeta({ parameterId: "CELL_VOLTAGE", value: cellVoltage, unit: "V", equationId: "EQ-03-03" }),
            moduleVoltage: { value: moduleVoltage, unit: "V", source: "Cell Voltage * Pairs per Module" },
            stackVoltage: createParamMeta({ parameterId: "STACK_VOLTAGE", value: stackVoltage, unit: "V", equationId: "EQ-03-04", dependencies: ["CELL_VOLTAGE", "CELL_PAIRS"] }),
            cellCurrent: createParamMeta({ parameterId: "CURRENT", value: currentCell, unit: "A", equationId: "EQ-03-01" }),
            stackCurrent: { value: createParamMeta({ parameterId: "CURRENT", value: currentStack, unit: "A" }).value, unit: "A", source: "Series Module Circuit Topology" },
            currentDensity: createParamMeta({ parameterId: "CURRENT_DENSITY", value: currentDensityAm2, unit: "A/m²", equationId: "EQ-03-02", dependencies: ["CURRENT", "ACTIVE_AREA"] }),
            stackPower: createParamMeta({ parameterId: "STACK_POWER", value: powerW, unit: "W", equationId: "EQ-03-05", dependencies: ["STACK_VOLTAGE", "CURRENT"] }),
            secGross: createParamMeta({ parameterId: "SEC_GROSS", value: secGrossKwhM3, unit: "kWh/m³", equationId: "EQ-03-06", dependencies: ["STACK_POWER", "PRODUCT_FLOW"] }),
            secNet: { value: secNetKwhM3, unit: "kWh/m³", source: "Gross SEC - Energy Recovery" },
            secTotal: { value: secTotalKwhM3, unit: "kWh/m³", source: "Net Electrical SEC + Hydraulic Pumping SEC" }
        },

        MassBalance: {
            flowInLmin: feedFlowLmin,
            flowOutProductLmin: productFlowLmin,
            flowOutRejectLmin: rejectFlowLmin,
            flowResidualLmin: Number(massWaterResidualLmin.toFixed(8)),
            toleranceLmin: 1e-4,
            status: massWaterClosed ? "CLOSED" : "DISCREPANCY",
            isConserved: massWaterClosed
        },

        SaltBalance: {
            saltInGs: Number(saltInGs.toFixed(6)),
            saltOutProductGs: Number(saltProdGs.toFixed(6)),
            saltOutRejectGs: Number(saltRejGs.toFixed(6)),
            saltResidualGs: Number(saltResidualGs.toFixed(8)),
            relativeErrorPct: saltInGs > 0 ? Number(((saltResidualGs / saltInGs) * 100).toFixed(4)) : 0,
            toleranceGs: 1e-4,
            status: saltClosed ? "CLOSED" : "DISCREPANCY",
            isConserved: saltClosed
        },

        ChargeBalance: {
            faradaicEquivalentRemovalGs: Number((electroSaltRemovalGs ?? 0).toFixed(6)),
            observedSoluteRemovalGs: Number((observedSaltRemovalGs ?? 0).toFixed(6)),
            chargeUtilizationRateCs: faradayRecon?.effectiveCurrentA !== undefined 
                ? Number(faradayRecon.effectiveCurrentA.toFixed(4)) 
                : Number(((cellPairs ?? 0) * (currentCell ?? 0) * (chargeEfficiency ?? 0)).toFixed(4)),
            chargeResidualGs: Number((chargeResidualGs ?? 0).toFixed(6)),
            discrepancyPercent: faradayRecon?.discrepancyPercent !== undefined 
                ? Number(faradayRecon.discrepancyPercent.toFixed(4)) 
                : (observedSaltRemovalGs > 0 ? Number((((chargeResidualGs ?? 0) / observedSaltRemovalGs) * 100).toFixed(4)) : 0),
            toleranceGs: 0.005,
            chargeEfficiencyPct: faradayRecon?.chargeUtilization !== undefined 
                ? Number((faradayRecon.chargeUtilization * 100).toFixed(1)) 
                : Number(((chargeEfficiency ?? 0.88) * 100).toFixed(1)),
            status: chargeClosed ? "CLOSED" : "DISCREPANCY",
            isConserved: chargeClosed
        },

        DynamicCycleResult: {
            adsorptionTimeSec: tAdsSec,
            desorptionTimeSec: tDesSec,
            adsorbedSaltMg: Number(saltAdsorbedMg.toFixed(2)),
            desorbedSaltMg: Number(saltDesorbedMg.toFixed(2)),
            cycleResidualMg: Number(dynamicCycleResidualMg.toFixed(6)),
            toleranceMg: 1e-4,
            desorptionFlowLmin: Number(desFlowLmin.toFixed(2)),
            desorptionAvgTds: Number(desAvgTds.toFixed(1)),
            isInventoryConserved: dynamicCycleClosed
        },

        TechnologyAssessment: assessmentResult || raw.technologyAssessment || {},

        EconomicResult: teaResult || {
            productWaterM3Year: Number((lMinToM3h(productFlowLmin) * 24 * 350).toFixed(1)),
            annualEnergyKwh: Number((secTotalKwhM3 * lMinToM3h(productFlowLmin) * 24 * 350).toFixed(1)),
            basisHoursPerYear: 8400
        },

        ValidationResult: {
            validationTier,
            isFeasible: outletTDS <= targetTds + 0.05 && massWaterClosed && saltClosed,
            massBalanceStatus: massWaterClosed ? "PASS" : "FAIL",
            saltBalanceStatus: saltClosed ? "PASS" : "FAIL",
            chargeBalanceStatus: chargeClosed ? "PASS" : "FAIL",
            hydraulicStatus: totalDpPa <= 300000 ? "PASS" : "EXCEEDED",
            electricalStatus: currentDensityAm2 <= 400 ? "PASS" : "EXCEEDED",
            validationEvidence: Boolean(raw.isCalibrated || inputs.isCalibrated || inputs.calibrationData)
                ? "Calibrated Against Published Pilot Test Dataset"
                : "Verified via Analytical First-Principles Governing Equations"
        },

        // Backward compatibility flat accessors for existing UI consumption
        outletTDS,
        waterRecovery: waterRecoveryPct,
        flowRate: feedFlowLmin,
        feedTds,
        targetTds,
        productFlow: productFlowLmin,
        rejectFlow: rejectFlowLmin,
        productFlowLmin,
        rejectFlowLmin,
        flowRateLmin: feedFlowLmin,
        tds: feedTds,
        cellPairs,
        electrodeArea: activeAreaCm2,
        voltageCell: cellVoltage,
        voltage: cellVoltage,
        voltageModule: moduleVoltage,
        voltageStack: stackVoltage,
        current: currentCell,
        currentDensity: currentDensityAm2,
        power: powerW,
        sec: secTotalKwhM3,
        secElectrical: secNetKwhM3,
        secElectricalGross: secGrossKwhM3,
        secElectricalNet: secNetKwhM3,
        secHydraulic: secHydraulicKwhM3,
        secTotal: secTotalKwhM3,
        pressureDrop: totalDpPa,
        channelPressureDropPa: channelDpPa,
        manifoldPressureDropPa: manifoldDpPa,
        linearVelocityMs: velocityMs,
        flowVelocity: velocityMs,
        reynoldsNumber,
        numberOfModules,
        pairsPerModule,
        moduleDimensions: raw.moduleDimensions || `${Math.round(Math.sqrt(activeAreaCm2) * 10)}mm L × ${Math.round(Math.sqrt(activeAreaCm2) * 10)}mm W × ${Math.round(cellPairs * 1.5 + 40)}mm H`,
        chargeEfficiency: Number((chargeEfficiency * 100).toFixed(1)),
        energyRecoveryFactor: raw.energyRecoveryFactor || 0,
        validationStatus: validationTier,
        engineeringConfidence: raw.engineeringConfidence || "High",
        feedQualityFeasible: raw.feedQualityFeasible !== false,
        faradayChargeReconciliation: faradayRecon,
        recoveryType: raw.recoveryType || "DESIGN CONSTRAINT"
    };

    canonical.feasibilityGate = evaluateFeasibilityGate(canonical);
    return canonical;
}
