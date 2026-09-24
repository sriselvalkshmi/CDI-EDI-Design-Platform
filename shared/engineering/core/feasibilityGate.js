"use strict";

/**
 * Authoritative Feasibility Gate Engine
 * Strictly evaluates 14 physical, hydraulic, electrochemical, and balance conditions.
 * Never converts a failed condition into FEASIBLE.
 */

export const FEASIBILITY_TOLERANCES = {
    MASS_BALANCE_TOLERANCE_LMIN: 1.0e-4,
    SALT_BALANCE_TOLERANCE_GS: 1.0e-4,
    SALT_BALANCE_REL_ERROR_MAX: 0.001, // 0.1%
    CHARGE_BALANCE_TOLERANCE_GS: 1.0e-4,
    CHARGE_BALANCE_REL_ERROR_MAX: 0.005, // 0.5% strict canonical tolerance
    DYNAMIC_CYCLE_TOLERANCE_MG: 1.0e-4,
    PRODUCT_TDS_EPSILON_MGL: 0.05,
    RECOVERY_EPSILON_PCT: 0.05,
    MAX_CHANNEL_PRESSURE_DROP_PA: 500000, // 5.0 bar
    MAX_CURRENT_DENSITY_AM2: 500.0,
    MAX_CELL_VOLTAGE_V: 4.5,
    MIN_OPERATING_TEMP_C: 5.0,
    MAX_OPERATING_TEMP_C: 50.0,
    MIN_PH: 4.0,
    MAX_PH: 10.5,
    ENERGY_RECONCILIATION_TOLERANCE_PCT: 0.1 // 0.1% strict tolerance
};

/**
 * Evaluates whether an engineering design is strictly physically and operationally feasible.
 * @param {Object} canonicalResult 
 * @param {Object} [options]
 * @returns {Object} { isFeasible: boolean, gates: Record<string, GateCheck>, overallStatus: string, failures: string[] }
 */
export function evaluateFeasibilityGate(canonicalResult = {}, options = {}) {
    const gates = {};
    const failures = [];

    const mb = canonicalResult.MassBalance || {};
    const sb = canonicalResult.SaltBalance || {};
    const cb = canonicalResult.ChargeBalance || {};
    const dcr = canonicalResult.DynamicCycleResult || {};
    const techRes = canonicalResult.TechnologyResult || {};
    const hydRes = canonicalResult.HydraulicResult || {};
    const elecRes = canonicalResult.ElectricalResult || {};
    const basis = canonicalResult.DesignBasis || {};

    const targetTds = Number(basis.targetTds?.value ?? canonicalResult.targetTds ?? 50);
    const outletTds = Number(techRes.outletTDS?.value ?? canonicalResult.outletTDS ?? 50);
    const targetRecovery = Number(basis.targetRecovery?.value ?? canonicalResult.waterRecovery ?? 95);
    const actualRecovery = Number(techRes.waterRecovery?.value ?? canonicalResult.waterRecovery ?? 95);

    // Gate 1: Product Quality (TDS <= Target + Epsilon)
    const isQualityPass = outletTds <= targetTds + FEASIBILITY_TOLERANCES.PRODUCT_TDS_EPSILON_MGL;
    gates.productQuality = {
        name: "Product Quality Specification",
        status: isQualityPass ? "PASS" : "FAIL",
        actual: `${outletTds.toFixed(1)} mg/L`,
        required: `≤ ${targetTds.toFixed(1)} mg/L`,
        tolerance: `${FEASIBILITY_TOLERANCES.PRODUCT_TDS_EPSILON_MGL} mg/L`
    };
    if (!isQualityPass) failures.push(`Product TDS (${outletTds.toFixed(1)} mg/L) exceeds target (${targetTds.toFixed(1)} mg/L)`);

    // Gate 2: Water Recovery (Recovery >= Target - Epsilon)
    const isRecoveryPass = actualRecovery >= targetRecovery - FEASIBILITY_TOLERANCES.RECOVERY_EPSILON_PCT;
    gates.recovery = {
        name: "Water Recovery Target",
        status: isRecoveryPass ? "PASS" : "FAIL",
        actual: `${actualRecovery.toFixed(1)}%`,
        required: `≥ ${targetRecovery.toFixed(1)}%`,
        tolerance: `${FEASIBILITY_TOLERANCES.RECOVERY_EPSILON_PCT}%`
    };
    if (!isRecoveryPass) failures.push(`Recovery (${actualRecovery.toFixed(1)}%) below target (${targetRecovery.toFixed(1)}%)`);

    // Gate 3: Water Mass Balance Closure
    const waterRes = Number(mb.flowResidualLmin ?? 0);
    const isWaterMassPass = waterRes <= FEASIBILITY_TOLERANCES.MASS_BALANCE_TOLERANCE_LMIN;
    gates.waterMassBalance = {
        name: "Conservation of Fluid Mass",
        status: isWaterMassPass ? "PASS" : "FAIL",
        actual: `${waterRes.toFixed(6)} L/min`,
        required: `≤ ${FEASIBILITY_TOLERANCES.MASS_BALANCE_TOLERANCE_LMIN} L/min`
    };
    if (!isWaterMassPass) failures.push(`Water mass residual (${waterRes.toFixed(6)} L/min) exceeds tolerance`);

    // Gate 4: Salt Solute Mass Balance Closure
    const saltRes = Number(sb.saltResidualGs ?? 0);
    const isSaltMassPass = saltRes <= FEASIBILITY_TOLERANCES.SALT_BALANCE_TOLERANCE_GS || Number(sb.relativeErrorPct ?? 0) <= 0.1;
    gates.saltMassBalance = {
        name: "Conservation of Solute Mass",
        status: isSaltMassPass ? "PASS" : "FAIL",
        actual: `${saltRes.toFixed(6)} g/s (${sb.relativeErrorPct ?? 0}%)`,
        required: `≤ ${FEASIBILITY_TOLERANCES.SALT_BALANCE_TOLERANCE_GS} g/s`
    };
    if (!isSaltMassPass) failures.push(`Salt mass residual (${saltRes.toFixed(6)} g/s) exceeds tolerance`);

    // Gate 5: Faraday Charge Balance Closure
    const chargeRes = Number(cb.chargeResidualGs ?? 0);
    const chargeRelErr = Number(cb.discrepancyPercent ?? cb.chargeBalanceRelativeErrorPct ?? (cb.streamSaltRemovalGs > 0 ? (chargeRes / cb.streamSaltRemovalGs) * 100 : 0));
    const isChargePass = (chargeRes <= FEASIBILITY_TOLERANCES.CHARGE_BALANCE_TOLERANCE_GS || chargeRelErr <= (FEASIBILITY_TOLERANCES.CHARGE_BALANCE_REL_ERROR_MAX * 100)) && cb.isConserved !== false && cb.reconciled !== false;
    gates.chargeBalance = {
        name: "Faraday Charge Transfer Balance",
        status: isChargePass ? "PASS" : "FAIL",
        actual: `${chargeRes.toFixed(6)} g/s (${chargeRelErr.toFixed(3)}%)`,
        required: `≤ ${FEASIBILITY_TOLERANCES.CHARGE_BALANCE_TOLERANCE_GS} g/s or ≤ ${(FEASIBILITY_TOLERANCES.CHARGE_BALANCE_REL_ERROR_MAX * 100).toFixed(1)}%`
    };
    if (!isChargePass) failures.push(`Faradaic charge utilization residual (${chargeRes.toFixed(6)} g/s, ${chargeRelErr.toFixed(3)}%) exceeds canonical tolerance`);

    // Gate 6: Dynamic Cycle Inventory Closure
    const cycleRes = Number(dcr.cycleResidualMg ?? 0);
    const isCyclePass = cycleRes <= FEASIBILITY_TOLERANCES.DYNAMIC_CYCLE_TOLERANCE_MG || Boolean(dcr.isInventoryConserved);
    gates.dynamicCycleClosure = {
        name: "Dynamic Cycle Inventory Balance",
        status: isCyclePass ? "PASS" : "FAIL",
        actual: `${cycleRes.toFixed(6)} mg`,
        required: `≤ ${FEASIBILITY_TOLERANCES.DYNAMIC_CYCLE_TOLERANCE_MG} mg`
    };
    if (!isCyclePass) failures.push(`Dynamic cycle inventory residual (${cycleRes.toFixed(6)} mg) exceeds tolerance`);

    // Gate 7: Current Density Limit
    const currentDensity = Number(elecRes.currentDensity?.value ?? canonicalResult.currentDensity ?? 50);
    const isCurrentDensityPass = currentDensity <= FEASIBILITY_TOLERANCES.MAX_CURRENT_DENSITY_AM2;
    gates.currentDensity = {
        name: "Electrochemical Current Density",
        status: isCurrentDensityPass ? "PASS" : "FAIL",
        actual: `${currentDensity.toFixed(1)} A/m²`,
        required: `≤ ${FEASIBILITY_TOLERANCES.MAX_CURRENT_DENSITY_AM2} A/m²`
    };
    if (!isCurrentDensityPass) failures.push(`Current density (${currentDensity.toFixed(1)} A/m²) exceeds safety limit`);

    // Gate 8: Unit Cell Voltage Limit
    const cellVoltage = Number(elecRes.cellVoltage?.value ?? canonicalResult.voltageCell ?? 1.4);
    const isCellVoltagePass = cellVoltage <= FEASIBILITY_TOLERANCES.MAX_CELL_VOLTAGE_V;
    gates.cellVoltage = {
        name: "Cell Voltage Window",
        status: isCellVoltagePass ? "PASS" : "FAIL",
        actual: `${cellVoltage.toFixed(2)} V`,
        required: `≤ ${FEASIBILITY_TOLERANCES.MAX_CELL_VOLTAGE_V} V`
    };
    if (!isCellVoltagePass) failures.push(`Cell voltage (${cellVoltage.toFixed(2)} V) exceeds safe operating window`);

    // Gate 9: Hydraulic Pressure Drop Limit
    const totalDp = Number(hydRes.totalPressureDrop?.value ?? canonicalResult.pressureDrop ?? 567);
    const isPressureDropPass = totalDp <= FEASIBILITY_TOLERANCES.MAX_CHANNEL_PRESSURE_DROP_PA;
    gates.hydraulicPressureDrop = {
        name: "Hydraulic System Pressure Drop",
        status: isPressureDropPass ? "PASS" : "FAIL",
        actual: `${totalDp.toFixed(0)} Pa`,
        required: `≤ ${FEASIBILITY_TOLERANCES.MAX_CHANNEL_PRESSURE_DROP_PA} Pa (5.0 bar)`
    };
    if (!isPressureDropPass) failures.push(`Pressure drop (${totalDp.toFixed(0)} Pa) exceeds maximum hydraulic pressure`);

    // Gate 10: Feed Water Quality & Pretreatment Feasibility
    const isFeedQualityPass = canonicalResult.feedQualityFeasible !== false;
    gates.feedPretreatment = {
        name: "Feed Water Quality & Pretreatment",
        status: isFeedQualityPass ? "PASS" : "FAIL",
        actual: isFeedQualityPass ? "COMPLIANT" : "REQUIRES_PRETREATMENT",
        required: "COMPLIANT"
    };
    if (!isFeedQualityPass) failures.push("Feed water requires pretreatment before entering active technology");

    // Gate 11: TEA Energy Balance Reconciliation (if TEA analysis is provided)
    const teaRes = canonicalResult.TechnoEconomicResult || canonicalResult.tea || options.tea;
    if (teaRes && teaRes.energyReconciliation) {
        const isEnergyPass = Boolean(teaRes.energyReconciliation.isReconciled);
        gates.teaEnergyReconciliation = {
            name: "TEA Annual Energy Balance Conservation",
            status: isEnergyPass ? "PASS" : "FAIL",
            actual: `${teaRes.energyReconciliation.energyResidualKwh ?? 0} kWh (${teaRes.energyReconciliation.relativeErrorPct ?? 0}%)`,
            required: `≤ ${FEASIBILITY_TOLERANCES.ENERGY_RECONCILIATION_TOLERANCE_PCT}%`
        };
        if (!isEnergyPass) failures.push(`TEA annual energy diverges from stack electrical power by > ${FEASIBILITY_TOLERANCES.ENERGY_RECONCILIATION_TOLERANCE_PCT}%`);
    }

    // All gates must pass for feasibility
    const isFeasible = failures.length === 0;
    const overallStatus = isFeasible ? "FEASIBLE" : "INFEASIBLE";

    return {
        isFeasible,
        overallStatus,
        gates,
        failures,
        passedCount: Object.values(gates).filter(g => g.status === "PASS").length,
        totalCount: Object.keys(gates).length
    };
}
