"use strict";

/**
 * TECHNO-ECONOMIC ANALYSIS (TEA) ENGINE — V1
 * 
 * Extends engineering feasibility to include economic feasibility.
 * Consumes authoritative engineering outputs:
 * - Feed flow & product flow
 * - Recovery
 * - Gross SEC (kWh/m³)
 * - Stack power
 * - Technology, Modules, Cell Pairs, Active Area
 * 
 * Calculates:
 * 1. Annual Product Water (m³/year)
 * 2. Annual Energy Consumption (kWh/year)
 * 3. Annual Energy Cost (₹/year)
 * 4. Total CAPEX (₹)
 * 5. Annual OPEX (₹/year)
 * 6. Operating Treatment Cost (₹/m³)
 */

/**
 * Sensible default values for industrial Indian water treatment economics
 * (User-editable)
 */
export const DEFAULT_TEA_INPUTS = Object.freeze({
    // Operational parameters
    electricityTariff: 8.00,       // ₹ / kWh
    operatingHoursPerDay: 24,      // h / day
    operatingDaysPerYear: 350,     // days / year

    // CAPEX components (₹)
    equipmentCost: 50000,          // ₹ Base skid / piping / valves
    stackCost: 120000,             // ₹ Desalination core stack
    pumpCost: 35000,               // ₹ Feed & booster pumps
    powerSupplyCost: 25000,        // ₹ DC power supply / rectifier
    membraneElectrodeCost: 40000,  // ₹ Ion-exchange membranes / electrodes
    installationCost: 30000,       // ₹ Mechanical & electrical installation

    // OPEX components (₹ / year)
    annualMaintenanceCost: 15000,  // ₹ / year Routine preventive maintenance
    annualReplacementCost: 10000   // ₹ / year Consumable & part replacement
});

/**
 * Validates economic inputs according to TEA V1 business rules:
 * ✓ Economic inputs complete
 * ✓ Electricity tariff valid (> 0)
 * ✓ Operating hours valid (0 < hours <= 24)
 * ✓ Operating days valid (0 < days <= 365)
 * ✓ CAPEX values non-negative (>= 0)
 * ✓ Maintenance cost non-negative (>= 0)
 * ✓ Replacement cost non-negative (>= 0)
 * 
 * @param {Object} inputs
 * @returns {Object} { isValid, status, errors }
 */
export function validateEconomicInputs(inputs = {}) {
    const errors = [];

    // 1. Completeness & validity checks
    const checkRequiredNumeric = (val, name) => {
        if (val === "" || val === null || val === undefined || isNaN(Number(val))) {
            errors.push(`${name} is required.`);
            return null;
        }
        return Number(val);
    };

    const tariff = checkRequiredNumeric(inputs.electricityTariff, "Electricity tariff");
    const hours = checkRequiredNumeric(inputs.operatingHoursPerDay, "Operating hours per day");
    const days = checkRequiredNumeric(inputs.operatingDaysPerYear, "Operating days per year");

    const equipment = checkRequiredNumeric(inputs.equipmentCost, "Equipment cost");
    const stack = checkRequiredNumeric(inputs.stackCost, "Stack cost");
    const pump = checkRequiredNumeric(inputs.pumpCost, "Pump cost");
    const powerSupply = checkRequiredNumeric(inputs.powerSupplyCost, "Power supply cost");
    const membraneElectrode = checkRequiredNumeric(inputs.membraneElectrodeCost, "Membrane/Electrode cost");
    const installation = checkRequiredNumeric(inputs.installationCost, "Installation cost");

    const maintenance = checkRequiredNumeric(inputs.annualMaintenanceCost, "Annual maintenance cost");
    const replacement = checkRequiredNumeric(inputs.annualReplacementCost, "Annual replacement cost");

    // Range checks
    if (tariff !== null) {
        if (tariff <= 0) errors.push("Electricity tariff must be strictly greater than 0 ₹/kWh.");
    }
    if (hours !== null) {
        if (hours <= 0 || hours > 24) errors.push("Operating hours must be between 0.1 and 24 hours/day.");
    }
    if (days !== null) {
        if (days <= 0 || days > 365) errors.push("Operating days must be between 1 and 365 days/year.");
    }

    // Non-negative checks
    const nonNegatives = [
        { val: equipment, name: "Equipment cost" },
        { val: stack, name: "Stack cost" },
        { val: pump, name: "Pump cost" },
        { val: powerSupply, name: "Power supply cost" },
        { val: membraneElectrode, name: "Membrane/Electrode cost" },
        { val: installation, name: "Installation cost" },
        { val: maintenance, name: "Annual maintenance cost" },
        { val: replacement, name: "Annual replacement cost" }
    ];

    nonNegatives.forEach(({ val, name }) => {
        if (val !== null && val < 0) {
            errors.push(`${name} must be non-negative (>= 0).`);
        }
    });

    const isValid = errors.length === 0;
    const status = isValid
        ? "ECONOMIC ANALYSIS: READY"
        : "ECONOMIC ANALYSIS: INCOMPLETE — ENTER REQUIRED COST INPUTS";

    return {
        isValid,
        status,
        errors
    };
}

/**
 * Scales CAPEX dynamically based on scenario physical sizing parameters:
 * cell pairs, modules, membrane/electrode area, flow rate, and electrical power.
 */
export function calculateScaledCAPEX({
    baseInputs = DEFAULT_TEA_INPUTS,
    modules = 1,
    cellPairs = 34,
    electrodeAreaCm2 = 350,
    flowRateLmin = 10,
    stackPowerW = 188.5
} = {}) {
    const basePairs = 34;
    const baseAreaCm2 = 350;
    const baseFlowLmin = 10;
    const basePowerW = 188.5;

    // Base equipment cost (skid, structural frame, piping, valves) scales with flow capacity
    const flowScale = Math.pow(Math.max(0.1, flowRateLmin) / baseFlowLmin, 0.6);
    const equipmentCost = Math.round((baseInputs.equipmentCost ?? 50000) * flowScale);

    // Core stack hardware cost scales with modules and cell pairs
    const stackScale = Math.max(1, modules) * (Math.max(1, cellPairs) / basePairs);
    const stackCost = Math.round((baseInputs.stackCost ?? 120000) * stackScale);

    // Pumps scale with hydraulic capacity
    const pumpCost = Math.round((baseInputs.pumpCost ?? 35000) * flowScale);

    // Power supply / rectifiers scale with required DC power capacity
    const powerScale = Math.pow(Math.max(1, stackPowerW) / basePowerW, 0.7);
    const powerSupplyCost = Math.round((baseInputs.powerSupplyCost ?? 25000) * powerScale);

    // Membrane and electrode consumables scale with total active membrane area
    const totalAreaM2 = (Math.max(1, cellPairs) * Math.max(10, electrodeAreaCm2)) / 10000;
    const baseTotalAreaM2 = (basePairs * baseAreaCm2) / 10000; // 1.19 m²
    const membraneScale = totalAreaM2 / baseTotalAreaM2;
    const membraneElectrodeCost = Math.round((baseInputs.membraneElectrodeCost ?? 40000) * membraneScale);

    // Mechanical and electrical installation scales with overall equipment footprint
    const installScale = (flowScale + stackScale) / 2;
    const installationCost = Math.round((baseInputs.installationCost ?? 30000) * installScale);

    const totalCapexInr = equipmentCost + stackCost + pumpCost + powerSupplyCost + membraneElectrodeCost + installationCost;

    return {
        equipmentCost,
        stackCost,
        pumpCost,
        powerSupplyCost,
        membraneElectrodeCost,
        installationCost,
        totalCapexInr
    };
}

/**
 * Calculates Techno-Economic Analysis (TEA) for a given authoritative engineering design.
 * Consumes authoritative engineering results without re-calculating engineering equations.
 * 
 * @param {Object} params
 * @param {Object} params.engineering Authoritative engineering output object
 * @param {Object} [params.economicInputs] User or scenario economic inputs
 * @param {boolean} [params.scaleWithDesign] Whether to scale CAPEX dynamically
 * @returns {Object} TEA results object
 */
export function calculateTEA({ engineering = {}, economicInputs = {}, scaleWithDesign = false } = {}) {
    // Merge with defaults for any omitted properties
    const inputs = {
        electricityTariff: economicInputs.electricityTariff !== undefined ? economicInputs.electricityTariff : DEFAULT_TEA_INPUTS.electricityTariff,
        operatingHoursPerDay: economicInputs.operatingHoursPerDay !== undefined ? economicInputs.operatingHoursPerDay : DEFAULT_TEA_INPUTS.operatingHoursPerDay,
        operatingDaysPerYear: economicInputs.operatingDaysPerYear !== undefined ? economicInputs.operatingDaysPerYear : DEFAULT_TEA_INPUTS.operatingDaysPerYear,
        equipmentCost: economicInputs.equipmentCost !== undefined ? economicInputs.equipmentCost : DEFAULT_TEA_INPUTS.equipmentCost,
        stackCost: economicInputs.stackCost !== undefined ? economicInputs.stackCost : DEFAULT_TEA_INPUTS.stackCost,
        pumpCost: economicInputs.pumpCost !== undefined ? economicInputs.pumpCost : DEFAULT_TEA_INPUTS.pumpCost,
        powerSupplyCost: economicInputs.powerSupplyCost !== undefined ? economicInputs.powerSupplyCost : DEFAULT_TEA_INPUTS.powerSupplyCost,
        membraneElectrodeCost: economicInputs.membraneElectrodeCost !== undefined ? economicInputs.membraneElectrodeCost : DEFAULT_TEA_INPUTS.membraneElectrodeCost,
        installationCost: economicInputs.installationCost !== undefined ? economicInputs.installationCost : DEFAULT_TEA_INPUTS.installationCost,
        annualMaintenanceCost: economicInputs.annualMaintenanceCost !== undefined ? economicInputs.annualMaintenanceCost : DEFAULT_TEA_INPUTS.annualMaintenanceCost,
        annualReplacementCost: economicInputs.annualReplacementCost !== undefined ? economicInputs.annualReplacementCost : DEFAULT_TEA_INPUTS.annualReplacementCost
    };

    const validation = validateEconomicInputs(inputs);

    // Extract authoritative engineering outputs
    const feedFlowLmin = Number(engineering.flowRate ?? engineering.feedFlow ?? 10);
    const recoveryPct = Number(engineering.waterRecoveryPct ?? engineering.waterRecovery ?? engineering.recovery ?? 95.0);
    const recoveryFraction = recoveryPct > 1.0 ? recoveryPct / 100 : recoveryPct;
    const productFlowLmin = Number(engineering.productFlowLmin ?? engineering.productFlow ?? (feedFlowLmin * recoveryFraction));
    const grossSecKwhM3 = Number(engineering.secElectricalGross ?? engineering.secTotalGross ?? engineering.sec ?? engineering.SEC ?? 0.040);
    const netSecKwhM3 = Number(engineering.secElectricalNet ?? engineering.secTotalNet ?? engineering.sec ?? grossSecKwhM3);
    const stackPowerW = Number(engineering.stackElectricalPowerW ?? engineering.power ?? 0);
    const tech = engineering.technology ?? "MCDI";
    const modules = Number(engineering.numberOfModules ?? engineering.modules ?? 1);
    const cellPairs = Number(engineering.cellPairs ?? 34);
    const activeAreaCm2 = Number(engineering.electrodeArea ?? engineering.activeArea ?? 350);

    // Numeric conversion of inputs
    const tariff = Number(inputs.electricityTariff ?? 0);
    const hours = Number(inputs.operatingHoursPerDay ?? 0);
    const days = Number(inputs.operatingDaysPerYear ?? 0);

    let equipCost = Math.max(0, Number(inputs.equipmentCost ?? 0));
    let stackCost = Math.max(0, Number(inputs.stackCost ?? 0));
    let pumpCost = Math.max(0, Number(inputs.pumpCost ?? 0));
    let powerSupplyCost = Math.max(0, Number(inputs.powerSupplyCost ?? 0));
    let membraneCost = Math.max(0, Number(inputs.membraneElectrodeCost ?? 0));
    let installCost = Math.max(0, Number(inputs.installationCost ?? 0));

    if (scaleWithDesign || economicInputs.scaleWithDesign) {
        const scaled = calculateScaledCAPEX({
            baseInputs: inputs,
            modules,
            cellPairs,
            electrodeAreaCm2: activeAreaCm2,
            flowRateLmin: feedFlowLmin,
            stackPowerW
        });
        equipCost = scaled.equipmentCost;
        stackCost = scaled.stackCost;
        pumpCost = scaled.pumpCost;
        powerSupplyCost = scaled.powerSupplyCost;
        membraneCost = scaled.membraneElectrodeCost;
        installCost = scaled.installationCost;
    }

    const maintCost = Math.max(0, Number(inputs.annualMaintenanceCost ?? 0));
    const replaceCost = Math.max(0, Number(inputs.annualReplacementCost ?? 0));

    // 1. Annual Product Water (m³/year)
    // Formula: Product Flow (L/min) * 60 min/h / 1000 L/m³ * Operating Hours/day * Operating Days/year
    const productFlowM3h = (productFlowLmin * 60) / 1000; // m³/h
    const totalOperatingHoursPerYear = hours * days; // h/year
    const annualProductWaterM3 = validation.isValid && productFlowLmin > 0
        ? productFlowM3h * totalOperatingHoursPerYear
        : 0;

    // 2. Annual Energy Consumption (Gross vs Net) & Mathematical Energy Reconciliation
    // Reconciliation Principle: E_annual(SEC) = Gross SEC * V_annual ≡ E_annual(Power) = (Stack Power / 1000) * Operating Hours
    // Derive exact unrounded electrical SEC from physical stack power and product flow
    const exactElectricalSecKwhM3 = (productFlowM3h > 0 && stackPowerW > 0)
        ? (stackPowerW / 1000) / productFlowM3h
        : grossSecKwhM3;

    const annualEnergyFromSec = validation.isValid
        ? grossSecKwhM3 * annualProductWaterM3
        : 0;
    const annualEnergyFromPower = validation.isValid && stackPowerW > 0
        ? (stackPowerW / 1000) * totalOperatingHoursPerYear
        : annualEnergyFromSec;

    // Reconcile passed grossSecKwhM3 against the first-principles power equivalent
    const annualEnergyFromPassedSec = validation.isValid
        ? grossSecKwhM3 * annualProductWaterM3
        : 0;
    const energyResidualKwh = Number(Math.abs(annualEnergyFromPassedSec - annualEnergyFromPower).toFixed(4));
    const maxEnergy = Math.max(annualEnergyFromPassedSec, annualEnergyFromPower);
    const tolerancePct = 0.1; // 0.1% strict engineering tolerance
    const energyRelativeErrorPct = maxEnergy > 0
        ? Number(((energyResidualKwh / maxEnergy) * 100).toFixed(4))
        : 0;

    // Strictly enforce 0.1% tolerance without arbitrary loopholes
    const isEnergyReconciled = !validation.isValid || stackPowerW === 0 || (energyRelativeErrorPct <= tolerancePct);

    validation.isEnergyReconciled = isEnergyReconciled;
    if (!isEnergyReconciled) {
        validation.energyReconciliationWarning = `Energy Reconciliation Warning: Annual energy from SEC (${annualEnergyFromPassedSec.toFixed(2)} kWh) diverges from Stack Power equivalent (${annualEnergyFromPower.toFixed(2)} kWh) by ${energyResidualKwh.toFixed(2)} kWh (${energyRelativeErrorPct}% > ${tolerancePct}% tolerance).`;
    }

    const annualEnergyConsumptionKwh = annualEnergyFromSec;
    const annualGrossEnergyConsumptionKwh = annualEnergyConsumptionKwh;
    const annualNetEnergyConsumptionKwh = validation.isValid
        ? netSecKwhM3 * annualProductWaterM3
        : 0;

    // 3. Annual Energy Cost (₹/year)
    const annualEnergyCostInr = validation.isValid
        ? annualEnergyConsumptionKwh * tariff
        : 0;
    const annualNetEnergyCostInr = validation.isValid
        ? annualNetEnergyConsumptionKwh * tariff
        : 0;

    // Technology-specific replacement description
    const techReplacementDescription = tech === "CDI"
        ? "Activated Carbon Electrode Replacement"
        : (tech === "MCDI"
            ? "AEM & CEM Ion-Exchange Membranes + Carbon Electrode Replacement"
            : (tech === "FCDI"
                ? "Carbon Slurry Recirculation Refill & Slurry Pump Wear Parts"
                : (tech === "ED"
                    ? "Heterogeneous/Homogeneous AEM & CEM Membrane Replacement + Acid Cleaning"
                    : (tech === "EDR"
                        ? "AEM & CEM Membrane Replacement (Acid-Free Operation, Polarity Reversal Savings)"
                        : "Mixed-Bed Ion-Exchange Resin & Membrane Replacement"))));

    // 4. CAPEX (₹)
    // Formula: Equipment + Stack + Pump + Power Supply + Membrane/Electrode + Installation
    let capexInr;
    let capexBreakdown = null;
    if (economicInputs.isScaled || economicInputs.scaleWithDesign) {
        const scaled = calculateScaledCAPEX({
            baseInputs: inputs,
            modules,
            cellPairs,
            electrodeAreaCm2: activeAreaCm2,
            flowRateLmin: feedFlowLmin,
            stackPowerW
        });
        capexInr = scaled.totalCapexInr;
        capexBreakdown = scaled;
    } else {
        capexInr = equipCost + stackCost + pumpCost + powerSupplyCost + membraneCost + installCost;
        capexBreakdown = {
            equipmentCost: equipCost,
            stackCost: stackCost,
            pumpCost: pumpCost,
            powerSupplyCost: powerSupplyCost,
            membraneElectrodeCost: membraneCost,
            installationCost: installCost,
            totalCapexInr: capexInr
        };
    }

    // 5. Annual OPEX (₹/year)
    // Formula: Annual Energy Cost + Annual Maintenance Cost + Annual Replacement Cost
    const annualOpexInr = validation.isValid
        ? annualEnergyCostInr + maintCost + replaceCost
        : (maintCost + replaceCost);

    // 6. Operating Treatment Cost (₹/m³)
    // Formula: Annual OPEX / Annual Product Water
    const operatingTreatmentCostInrPerM3 = validation.isValid && annualProductWaterM3 > 0
        ? annualOpexInr / annualProductWaterM3
        : 0;

    return {
        // Consumed authoritative engineering outputs
        engineeringBasis: {
            technology: tech,
            feedFlowLmin: Number(feedFlowLmin.toFixed(2)),
            productFlowLmin: Number(productFlowLmin.toFixed(2)),
            productFlowM3h: Number(productFlowM3h.toFixed(3)),
            totalOperatingHoursPerYear,
            recoveryPct: Number((recoveryFraction * 100).toFixed(1)),
            grossSecKwhM3: Number(grossSecKwhM3.toFixed(4)),
            stackPowerW: Number(stackPowerW.toFixed(1)),
            modules,
            cellPairs,
            activeAreaCm2
        },

        // Economic inputs
        inputs: {
            ...inputs,
            electricityTariff: tariff,
            operatingHoursPerDay: hours,
            operatingDaysPerYear: days,
            equipmentCost: equipCost,
            stackCost: stackCost,
            pumpCost: pumpCost,
            powerSupplyCost: powerSupplyCost,
            membraneElectrodeCost: membraneCost,
            installationCost: installCost,
            annualMaintenanceCost: maintCost,
            annualReplacementCost: replaceCost
        },

        // Validation metadata
        validation,

        // Energy balance reconciliation
        energyReconciliation: {
            annualEnergyFromSec: Number(annualEnergyFromSec.toFixed(2)),
            annualEnergyFromPower: Number(annualEnergyFromPower.toFixed(2)),
            energyResidualKwh: Number(energyResidualKwh.toFixed(3)),
            relativeErrorPct: energyRelativeErrorPct,
            tolerancePct,
            isReconciled: isEnergyReconciled,
            status: isEnergyReconciled ? "RECONCILED" : "DIVERGENT",
            displayStatus: isEnergyReconciled ? "RECONCILED" : "NOT RECONCILED",
            basis: "Annual Energy from SEC ≡ (Stack Power / 1000) × Operating Hours"
        },

        // Core TEA outputs
        annualProductWaterM3: Number(annualProductWaterM3.toFixed(2)),
        annualEnergyConsumptionKwh: Number(annualEnergyConsumptionKwh.toFixed(2)),
        annualEnergyCostInr: Number(annualEnergyCostInr.toFixed(2)),

        capexInr: Number(capexInr.toFixed(2)),
        capexBreakdown: {
            equipmentCost: equipCost,
            stackCost: stackCost,
            pumpCost: pumpCost,
            powerSupplyCost: powerSupplyCost,
            membraneElectrodeCost: membraneCost,
            installationCost: installCost
        },

        annualOpexInr: Number(annualOpexInr.toFixed(2)),
        opexBreakdown: {
            annualEnergyCost: Number(annualEnergyCostInr.toFixed(2)),
            annualMaintenanceCost: maintCost,
            annualReplacementCost: replaceCost
        },

        operatingTreatmentCostInrPerM3: Number(operatingTreatmentCostInrPerM3.toFixed(2)),

        // V1 Traceability notes
        labels: {
            operatingTreatmentCostLabel: "Operating Treatment Cost (₹/m³)",
            capexLabel: "Total Capital Expenditure (CAPEX)",
            opexLabel: "Total Annual Operating Expenditure (OPEX)",
            energyCostLabel: "Annual Energy Cost",
            productWaterLabel: "Annual Product Water Volume"
        }
    };
}

export { calculateTEA as calculateTechnoEconomicModel };
export default calculateTEA;
