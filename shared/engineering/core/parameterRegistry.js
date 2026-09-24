"use strict";

/**
 * Authoritative Canonical Parameter Registry
 * Single point of truth defining every system engineering parameter.
 * If two modules request the same parameter, they MUST reference the same canonical definition here.
 */

export const PARAMETER_REGISTRY = {
    FEED_TDS: {
        parameterId: "FEED_TDS",
        canonicalName: "Feed Water Total Dissolved Solids",
        unit: "mg/L",
        dataType: "number",
        nature: "input",
        authoritativeOwner: "Water Chemistry / Design Basis",
        equationId: "EQ-02-01",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [10, 50000],
        uncertainty: "±2%",
        source: "Standard Methods 2540C / Ion Chromatography Sum"
    },
    FEED_FLOW: {
        parameterId: "FEED_FLOW",
        canonicalName: "Feed Volumetric Inflow Rate",
        unit: "L/min",
        dataType: "number",
        nature: "input",
        authoritativeOwner: "Process Inflow / Design Basis",
        equationId: "EQ-01-01",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [0.1, 1000],
        uncertainty: "±1%",
        source: "Electromagnetic / Turbine In-Line Flow Sensor"
    },
    PRODUCT_FLOW: {
        parameterId: "PRODUCT_FLOW",
        canonicalName: "Purified Product Water Flow Rate",
        unit: "L/min",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Hydraulic Model / Mass Balance",
        equationId: "EQ-01-02",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [0.05, 950],
        uncertainty: "±1.5%",
        source: "Mass Balance Closure: Q_feed * Recovery"
    },
    PRODUCT_TDS: {
        parameterId: "PRODUCT_TDS",
        canonicalName: "Product Water Total Dissolved Solids",
        unit: "mg/L",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Electrochemical Desalination Model",
        equationId: "EQ-02-02",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [0.001, 10000],
        uncertainty: "±3%",
        source: "First-Principles Electrosorption / Electrodialysis Mass Transfer"
    },
    RECOVERY: {
        parameterId: "RECOVERY",
        canonicalName: "Water Recovery Percentage",
        unit: "%",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Process Mass Balance",
        equationId: "EQ-01-04",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [50.0, 99.0],
        uncertainty: "±0.5%",
        source: "Conservation of Fluid Mass: (Q_prod / Q_feed) * 100"
    },
    CELL_PAIRS: {
        parameterId: "CELL_PAIRS",
        canonicalName: "Total Cell Pairs in Stack Architecture",
        unit: "pairs",
        dataType: "integer",
        nature: "calculated",
        authoritativeOwner: "Stack Sizing Engine",
        equationId: "EQ-04-01",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [1, 2000],
        uncertainty: "0",
        source: "Faraday Capacity & Residence Sizing Algorithm"
    },
    ACTIVE_AREA: {
        parameterId: "ACTIVE_AREA",
        canonicalName: "Single Cell Active Electrode Geometric Area",
        unit: "cm²",
        dataType: "number",
        nature: "input",
        authoritativeOwner: "Component Geometry / Electrode Sizing",
        equationId: "EQ-04-02",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [25, 2500],
        uncertainty: "±1%",
        source: "Manufacturer / CAD Assembly Specification"
    },
    CURRENT: {
        parameterId: "CURRENT",
        canonicalName: "Operating Direct Electrical Current per Cell",
        unit: "A",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Electrical Model",
        equationId: "EQ-03-01",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [0.01, 100.0],
        uncertainty: "±1.5%",
        source: "Faraday Law of Electrolysis with Charge Efficiency"
    },
    CURRENT_DENSITY: {
        parameterId: "CURRENT_DENSITY",
        canonicalName: "Electrochemical Current Density",
        unit: "A/m²",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Electrical Model",
        equationId: "EQ-03-02",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [1.0, 500.0],
        uncertainty: "±1.5%",
        source: "Current normalized by projected active electrode area (I / A_m2)"
    },
    CELL_VOLTAGE: {
        parameterId: "CELL_VOLTAGE",
        canonicalName: "Unit Cell DC Operating Voltage",
        unit: "V",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Electrochemical Thermodynamic Model",
        equationId: "EQ-03-03",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [0.4, 4.5],
        uncertainty: "±2%",
        source: "Nernst Potential + Ohmic Drop + Overpotentials (Below H2O Splitting)"
    },
    STACK_VOLTAGE: {
        parameterId: "STACK_VOLTAGE",
        canonicalName: "Total Stack Electrical DC Voltage",
        unit: "V",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Electrical Model",
        equationId: "EQ-03-04",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [1.0, 1000.0],
        uncertainty: "±2%",
        source: "Series Summation: Cell Voltage * Pairs per Module * Modules"
    },
    STACK_POWER: {
        parameterId: "STACK_POWER",
        canonicalName: "Electrical Power Consumed by Active Stack",
        unit: "W",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Electrical Power Model",
        equationId: "EQ-03-05",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [0.1, 50000.0],
        uncertainty: "±2%",
        source: "Joule's Law: P = Stack Voltage * Stack Current"
    },
    SEC_GROSS: {
        parameterId: "SEC_GROSS",
        canonicalName: "Gross Electrical Specific Energy Consumption",
        unit: "kWh/m³",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Specific Energy Accounting Model",
        equationId: "EQ-03-06",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [0.01, 15.0],
        uncertainty: "±2%",
        source: "Total Stack Power normalized by hourly product water delivery"
    },
    AUX_SEC: {
        parameterId: "AUX_SEC",
        canonicalName: "Auxiliary / Hydraulic Specific Energy Consumption",
        unit: "kWh/m³",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Hydraulic Pump Duty Model",
        equationId: "EQ-01-09",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [0.001, 2.0],
        uncertainty: "±5%",
        source: "Pumping energy required to overcome friction & manifold head losses"
    },
    CHANNEL_DP: {
        parameterId: "CHANNEL_DP",
        canonicalName: "Flow Channel Hydraulic Pressure Drop",
        unit: "Pa",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Hydraulic Model",
        equationId: "EQ-01-08",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [10, 500000],
        uncertainty: "±8%",
        source: "Darcy-Weisbach friction equation modified for netted spacer geometry"
    },
    VELOCITY: {
        parameterId: "VELOCITY",
        canonicalName: "Superficial Linear Channel Fluid Velocity",
        unit: "m/s",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Hydrodynamic Model",
        equationId: "EQ-01-05",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [0.0001, 0.5],
        uncertainty: "±3%",
        source: "Volumetric flow rate divided by open cross-sectional channel area"
    },
    SALT_REMOVAL: {
        parameterId: "SALT_REMOVAL",
        canonicalName: "Solute Salt Mass Removal Rate",
        unit: "mg/s",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Solute Mass Balance",
        equationId: "EQ-02-03",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [0.01, 10000.0],
        uncertainty: "±1.5%",
        source: "Solute Conservation: m_in - m_prod"
    },
    CHARGE_TRANSFER: {
        parameterId: "CHARGE_TRANSFER",
        canonicalName: "Faradaic Charge Utilization Rate",
        unit: "C/s",
        dataType: "number",
        nature: "calculated",
        authoritativeOwner: "Electrochemical Charge Model",
        equationId: "EQ-03-08",
        technologyScope: ["CDI", "MCDI", "FCDI", "EDI", "ED", "EDR"],
        validRange: [0.01, 500.0],
        uncertainty: "±2%",
        source: "I_cell * N_pairs * Charge Efficiency"
    }
};

/**
 * Retrieves the canonical parameter metadata entry.
 * @param {string} paramId
 * @returns {Object}
 */
export function getCanonicalParameter(paramId) {
    const entry = PARAMETER_REGISTRY[paramId];
    if (!entry) {
        throw new Error(`Unknown canonical parameter requested: '${paramId}'. Must be defined in parameterRegistry.js`);
    }
    return entry;
}
