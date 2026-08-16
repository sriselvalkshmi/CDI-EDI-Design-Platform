/**
 * COMPLETE ENGINEERING EQUATION DATABASE & FORMULA REGISTRY (57 EQUATIONS)
 * 
 * Includes all 45 Core Engineering Governing Domain Equations plus 12 Extended
 * Techno-Economic, Thermodynamic Screening, Sizing, and Multi-Objective Equations.
 * 
 * Physical units, basis, and assumptions are explicitly stated.
 */

export const DEFAULT_EQUATIONS_DATABASE = [
    // =========================================================================
    // DOMAIN 01 — MASS & FLOW CONVERSIONS (4 Equations)
    // =========================================================================
    {
        id: "EQ-01-01",
        name: "Volumetric Flow Conversion",
        formula: "flowRate / 60000",
        factoryFormula: "flowRate / 60000",
        category: "Hydraulic",
        units: "m³/s",
        sourceClassification: "First Principles",
        description: "Converts feed water volumetric flow rate from engineering liters per minute (L/min) to standard SI units (m³/s).",
        applicableBasis: "Continuous Feed Inflow (SI Unit Conversion)",
        author: "Core Registry",
        dateModified: new Date("2026-01-10").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            flowRate: { unit: "L/min", label: "Volumetric Flow Rate", default: 10.0 }
        },
        dependencyChain: ["Linear Channel Velocity", "Hydrodynamic Residence Time", "Spacer Reynolds Number"]
    },
    {
        id: "EQ-01-02",
        name: "Product Flow from Recovery",
        formula: "feedFlowRate * (recovery / 100)",
        factoryFormula: "feedFlowRate * (recovery / 100)",
        category: "Performance",
        units: "L/min",
        sourceClassification: "Engineering Model",
        description: "Determines purified product water permeate flow rate yielded from feed volumetric rate and target fractional recovery.",
        applicableBasis: "Steady-State Split",
        author: "Core Registry",
        dateModified: new Date("2026-01-10").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedFlowRate: { unit: "L/min", label: "Feed Inflow Rate", default: 10.0 },
            recovery: { unit: "%", label: "Water Recovery Percentage", default: 95.2 }
        },
        dependencyChain: ["Product Delivery Sizing", "Concentrate Stream Partitioning", "Gross SEC Normalization"]
    },
    {
        id: "EQ-01-03",
        name: "Concentrate Reject Flow",
        formula: "feedFlowRate - productFlowRate",
        factoryFormula: "feedFlowRate - productFlowRate",
        category: "Hydraulic",
        units: "L/min",
        sourceClassification: "Engineering Model",
        description: "Calculates residual concentrate reject flow rate discharged during continuous operation or desorption flushing.",
        applicableBasis: "Conservation of Fluid Mass",
        author: "Core Registry",
        dateModified: new Date("2026-01-10").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedFlowRate: { unit: "L/min", label: "Feed Inflow Rate", default: 10.0 },
            productFlowRate: { unit: "L/min", label: "Product Permeate Flow", default: 9.52 }
        },
        dependencyChain: ["Reject Pipe Hydraulics", "Concentrate Stream Salinity", "Brine Management"]
    },
    {
        id: "EQ-01-04",
        name: "Water Recovery Percentage",
        formula: "(productFlowRate / feedFlowRate) * 100",
        factoryFormula: "(productFlowRate / feedFlowRate) * 100",
        category: "Performance",
        units: "%",
        sourceClassification: "Engineering Model",
        description: "Evaluates overall process water recovery efficiency percentage as the ratio of purified product to total feed volume.",
        applicableBasis: "Volumetric Yield Definition",
        author: "Core Registry",
        dateModified: new Date("2026-01-10").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            productFlowRate: { unit: "L/min", label: "Product Flow Rate", default: 9.52 },
            feedFlowRate: { unit: "L/min", label: "Feed Flow Rate", default: 10.0 }
        },
        dependencyChain: ["Water Recovery Compliance", "Zero Liquid Discharge Balance", "Technology Ranking"]
    },

    // =========================================================================
    // DOMAIN 02 — MASS CONSERVATION & BALANCE CLOSURES (7 Equations)
    // =========================================================================
    {
        id: "EQ-02-01",
        name: "Salt Mass Flow Rate (Dilute NaCl)",
        formula: "(flowRate * tds) / 60000",
        factoryFormula: "(flowRate * tds) / 60000",
        category: "Mass Transfer",
        units: "g/s",
        sourceClassification: "First Principles",
        description: "Calculates instantaneous mass flux of dissolved sodium chloride salts traversing any process boundary in grams per second.",
        applicableBasis: "Dilute Electrolyte Flux",
        author: "Core Registry",
        dateModified: new Date("2026-01-15").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            flowRate: { unit: "L/min", label: "Stream Flow Rate", default: 10.0 },
            tds: { unit: "mg/L", label: "Dissolved Salt Concentration", default: 500.0 }
        },
        dependencyChain: ["Feed Salt Load", "Product Salt Load", "Concentrate Salt Load", "Faraday Current"]
    },
    {
        id: "EQ-02-02",
        name: "Feed Salt Load",
        formula: "(feedFlowRate * feedTds) / 60000",
        factoryFormula: "(feedFlowRate * feedTds) / 60000",
        category: "Mass Transfer",
        units: "g/s",
        sourceClassification: "First Principles",
        description: "Total dissolved mineral mass rate introduced continuously with influent feed water.",
        applicableBasis: "Influent Boundary Flux",
        author: "Core Registry",
        dateModified: new Date("2026-01-15").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedFlowRate: { unit: "L/min", label: "Feed Inflow Rate", default: 10.0 },
            feedTds: { unit: "mg/L", label: "Feed Salinity", default: 500.0 }
        },
        dependencyChain: ["Salt Conservation Balance", "Total Adsorption Loading", "Stack Sizing"]
    },
    {
        id: "EQ-02-03",
        name: "Product Salt Load",
        formula: "(productFlowRate * productTds) / 60000",
        factoryFormula: "(productFlowRate * productTds) / 60000",
        category: "Mass Transfer",
        units: "g/s",
        sourceClassification: "First Principles",
        description: "Residual dissolved mineral mass escaping in effluent demineralized product water.",
        applicableBasis: "Effluent Product Boundary Flux",
        author: "Core Registry",
        dateModified: new Date("2026-01-15").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            productFlowRate: { unit: "L/min", label: "Product Permeate Flow", default: 9.52 },
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 }
        },
        dependencyChain: ["Product TDS Compliance", "Salt Balance Closure", "Molar Removal Rate"]
    },
    {
        id: "EQ-02-04",
        name: "Concentrate Salt Load",
        formula: "(rejectFlowRate * rejectTds) / 60000",
        factoryFormula: "(rejectFlowRate * rejectTds) / 60000",
        category: "Mass Transfer",
        units: "g/s",
        sourceClassification: "First Principles",
        description: "Total rejected salt mass discharged in concentrated brine stream.",
        applicableBasis: "Effluent Reject Boundary Flux",
        author: "Core Registry",
        dateModified: new Date("2026-01-15").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            rejectFlowRate: { unit: "L/min", label: "Concentrate Flow Rate", default: 0.48 },
            rejectTds: { unit: "mg/L", label: "Concentrate Stream TDS", default: 9420.8 }
        },
        dependencyChain: ["Brine Stream Sizing", "Salt Balance Closure", "Zero Liquid Discharge"]
    },
    {
        id: "EQ-02-05",
        name: "Flow Balance Residual",
        formula: "feedFlowRate - (productFlowRate + rejectFlowRate)",
        factoryFormula: "feedFlowRate - (productFlowRate + rejectFlowRate)",
        category: "Hydraulic",
        units: "L/min",
        sourceClassification: "First Principles",
        description: "Checks volumetric flow balance closure across stack boundaries (strictly zero at steady state).",
        applicableBasis: "Conservation of Fluid Volume",
        author: "Core Registry",
        dateModified: new Date("2026-01-15").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedFlowRate: { unit: "L/min", label: "Feed Flow", default: 10.0 },
            productFlowRate: { unit: "L/min", label: "Product Flow", default: 9.52 },
            rejectFlowRate: { unit: "L/min", label: "Reject Flow", default: 0.48 }
        },
        dependencyChain: ["Mass Balance Verification", "Hydraulic Integrity Gate"]
    },
    {
        id: "EQ-02-06",
        name: "Salt Mass Balance Residual",
        formula: "(feedFlowRate * feedTds) - ((productFlowRate * productTds) + (rejectFlowRate * rejectTds))",
        factoryFormula: "(feedFlowRate * feedTds) - ((productFlowRate * productTds) + (rejectFlowRate * rejectTds))",
        category: "Mass Transfer",
        units: "mg/min",
        sourceClassification: "First Principles",
        description: "Evaluates exact salt mass conservation residual across feed, product, and concentrate streams.",
        applicableBasis: "Conservation of Salt Mass",
        author: "Core Registry",
        dateModified: new Date("2026-01-15").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedFlowRate: { unit: "L/min", label: "Feed Flow", default: 10.0 },
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            productFlowRate: { unit: "L/min", label: "Product Flow", default: 9.52 },
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 },
            rejectFlowRate: { unit: "L/min", label: "Reject Flow", default: 0.48 },
            rejectTds: { unit: "mg/L", label: "Concentrate TDS", default: 9420.8 }
        },
        dependencyChain: ["Conservation Balance Closure Tolerance", "Simulation Model Verification"]
    },
    {
        id: "EQ-02-07",
        name: "Conservation Balance Closure Tolerance",
        formula: "(residualSalt / (feedFlowRate * feedTds)) * 100",
        factoryFormula: "(residualSalt / (feedFlowRate * feedTds)) * 100",
        category: "Mass Transfer",
        units: "%",
        sourceClassification: "Design Constraint",
        description: "Normalized percentage error in salt mass closure (must be within ±0.01% for valid engineering models).",
        applicableBasis: "Simulation Convergence Criterion",
        author: "Core Registry",
        dateModified: new Date("2026-01-15").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            residualSalt: { unit: "mg/min", label: "Salt Mass Residual", default: 0.0 },
            feedFlowRate: { unit: "L/min", label: "Feed Flow", default: 10.0 },
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 }
        },
        dependencyChain: ["Model Verification", "Audit Trail Logging"]
    },

    // =========================================================================
    // DOMAIN 03 — ELECTROCHEMICAL PRINCIPLES (4 Equations)
    // =========================================================================
    {
        id: "EQ-03-01",
        name: "Molar Removal Rate",
        formula: "((feedTds - productTds) / 58.44) * (flowRate / 60000)",
        factoryFormula: "((feedTds - productTds) / 58.44) * (flowRate / 60000)",
        category: "Electrochemical",
        units: "mol/s",
        sourceClassification: "First Principles",
        description: "Molar demineralization rate of monovalent sodium chloride equivalent removed continuously across stack.",
        applicableBasis: "Ionic Transport Rate",
        author: "Core Registry",
        dateModified: new Date("2026-01-18").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 },
            flowRate: { unit: "L/min", label: "Volumetric Flow Rate", default: 10.0 }
        },
        dependencyChain: ["Theoretical Faraday Charge Rate", "Faradaic Current Demand", "Electrode Sizing"]
    },
    {
        id: "EQ-03-02",
        name: "Theoretical Faraday Charge Rate",
        formula: "(((feedTds - productTds) / 58.44) * (flowRate / 60000)) * 96485",
        factoryFormula: "(((feedTds - productTds) / 58.44) * (flowRate / 60000)) * 96485",
        category: "Electrochemical",
        units: "C/s",
        sourceClassification: "First Principles",
        description: "Evaluates stoichiometric electrochemical charge transfer rate required by Faraday's constant (96,485 C/mol).",
        applicableBasis: "Faradaic Equivalence",
        author: "Core Registry",
        dateModified: new Date("2026-01-18").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 },
            flowRate: { unit: "L/min", label: "Volumetric Flow Rate", default: 10.0 }
        },
        dependencyChain: ["Operating Stack Current", "Faradaic Charge Efficiency", "Power Supply Sizing"]
    },
    {
        id: "EQ-03-03",
        name: "Faradaic Charge Efficiency",
        formula: "((((feedTds - productTds) / 58.44) * (flowRate / 60) * 96485) / (I * cellPairs * 1000)) * 100",
        factoryFormula: "((((feedTds - productTds) / 58.44) * (flowRate / 60) * 96485) / (I * cellPairs * 1000)) * 100",
        category: "Electrochemical",
        units: "%",
        sourceClassification: "First Principles",
        description: "Ratio of theoretical electrochemical charge required for ion transport to actual electrical charge passed.",
        applicableBasis: "Faraday Efficiency Formulation",
        author: "Core Registry",
        dateModified: new Date("2026-01-18").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 },
            flowRate: { unit: "L/min", label: "Feed Flow Rate", default: 10.0 },
            I: { unit: "A", label: "Stack Current", default: 1.98 },
            cellPairs: { unit: "count", label: "Cell Pair Count", default: 68 }
        },
        dependencyChain: ["Faradaic Energy Losses", "Gross Electrical SEC", "Operating Current Density"]
    },
    {
        id: "EQ-03-04",
        name: "Operating Current Density",
        formula: "I / (electrodeArea_cm2 * 0.0001)",
        factoryFormula: "I / (electrodeArea_cm2 * 0.0001)",
        category: "Electrical",
        units: "A/m²",
        sourceClassification: "First Principles",
        description: "Superficial operational current density per unit geometric surface area of porous carbon electrode with unit conversion protection.",
        applicableBasis: "Electrode Active Area (cm² converted to m²)",
        author: "Core Registry",
        dateModified: new Date("2026-01-18").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            I: { unit: "A", label: "Operating Current", default: 1.98 },
            electrodeArea_cm2: { unit: "cm²", label: "Single Electrode Area", default: 350.0 }
        },
        dependencyChain: ["Electrode Polarization", "Ohmic Losses", "Stack Power", "SEC"]
    },

    // =========================================================================
    // DOMAIN 04 — STACK ELECTRICAL & POWER (4 Equations)
    // =========================================================================
    {
        id: "EQ-04-01",
        name: "Nominal Cell Voltage",
        formula: "stackVoltage / cellPairs",
        factoryFormula: "stackVoltage / cellPairs",
        category: "Electrical",
        units: "V",
        sourceClassification: "Engineering Model",
        description: "Calculates average single-cell potential drop across membrane-spacer-electrode repeat units.",
        applicableBasis: "Uniform Series Stacking",
        author: "Core Registry",
        dateModified: new Date("2026-01-20").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            stackVoltage: { unit: "V", label: "Total Stack Voltage", default: 81.6 },
            cellPairs: { unit: "count", label: "Cell Pair Count", default: 68 }
        },
        dependencyChain: ["Water Splitting Safety Boundary", "Single Cell Sizing"]
    },
    {
        id: "EQ-04-02",
        name: "Series Stack Voltage Summation",
        formula: "cellPairs * cellVoltage",
        factoryFormula: "cellPairs * cellVoltage",
        category: "Electrical",
        units: "V",
        sourceClassification: "First Principles",
        description: "Evaluates total direct-current voltage across series-connected cell pairs.",
        applicableBasis: "Series Electrical Kirchhoff Law",
        author: "Core Registry",
        dateModified: new Date("2026-01-20").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellPairs: { unit: "count", label: "Cell Pair Count", default: 68 },
            cellVoltage: { unit: "V", label: "Nominal Cell Voltage", default: 1.2 }
        },
        dependencyChain: ["Gross Stack Electrical Power", "Power Supply Specification"]
    },
    {
        id: "EQ-04-03",
        name: "Gross Stack Electrical Power",
        formula: "V * I",
        factoryFormula: "V * I",
        category: "Electrical",
        units: "W",
        sourceClassification: "First Principles",
        description: "Instantaneous direct-current electrical power consumed by the CDI/EDI cell stack during deionization.",
        applicableBasis: "DC Electrical Power",
        author: "Core Registry",
        dateModified: new Date("2026-01-20").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            V: { unit: "V", label: "Stack Voltage", default: 81.6 },
            I: { unit: "A", label: "Stack Current", default: 1.98 }
        },
        dependencyChain: ["Gross Electrical SEC", "Total Power Dissipation", "Thermal Load"]
    },
    {
        id: "EQ-04-04",
        name: "Gross Electrical SEC",
        formula: "(power / 1000) / (purifiedFlowRate * 0.06)",
        factoryFormula: "(power / 1000) / (purifiedFlowRate * 0.06)",
        category: "Energy",
        units: "kWh/m³",
        sourceClassification: "First Principles",
        description: "Gross Specific Energy Consumption: ratio of stack electrical power (kW) to purified water rate (m³/h).",
        applicableBasis: "Specific Energy Consumption",
        author: "Core Registry",
        dateModified: new Date("2026-01-20").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            power: { unit: "W", label: "Stack Electrical Power", default: 161.5 },
            purifiedFlowRate: { unit: "L/min", label: "Product Flow Rate", default: 9.52 }
        },
        dependencyChain: ["Net Modeled System SEC", "Annual Electricity OPEX", "Technology Ranking"]
    },

    // =========================================================================
    // DOMAIN 05 — ENERGY ACCOUNTING & CREDITS (4 Equations)
    // =========================================================================
    {
        id: "EQ-05-01",
        name: "Energy Recovery Credit",
        formula: "grossSEC * (1 - (recovery / 100)) * (recoveryCreditEfficiency / 100)",
        factoryFormula: "grossSEC * (1 - (recovery / 100)) * (recoveryCreditEfficiency / 100)",
        category: "Energy",
        units: "kWh/m³",
        sourceClassification: "Engineering Model",
        description: "Estimated capacitive energy reclamation credit during desorption. Assumes 70% converter energy recovery efficiency returning charge to DC bus.",
        applicableBasis: "Capacitive Energy Recovery Assumption (70% Reclaim Factor)",
        author: "Core Registry",
        dateModified: new Date("2026-01-22").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            grossSEC: { unit: "kWh/m³", label: "Gross Electrical SEC", default: 0.282 },
            recovery: { unit: "%", label: "Water Recovery", default: 95.2 },
            recoveryCreditEfficiency: { unit: "%", label: "Converter Reclaim Efficiency", default: 70.0 }
        },
        dependencyChain: ["Net Modeled System SEC", "Annual Electricity Cost", "Payback Period"]
    },
    {
        id: "EQ-05-02",
        name: "Auxiliary Hydraulic Work",
        formula: "((flowRate / 60000) * (pressureDrop * 1000)) / pumpEfficiency",
        factoryFormula: "((flowRate / 60000) * (pressureDrop * 1000)) / pumpEfficiency",
        category: "Hydraulic",
        units: "W",
        sourceClassification: "Engineering Model",
        description: "Mechanical shaft power demanded by feed booster pump to overcome spacer mesh friction loss.",
        applicableBasis: "Fluid Power Formulation",
        author: "Core Registry",
        dateModified: new Date("2026-01-22").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            flowRate: { unit: "L/min", label: "Feed Flow Rate", default: 10.0 },
            pressureDrop: { unit: "kPa", label: "Head Loss", default: 180.0 },
            pumpEfficiency: { unit: "fraction", label: "Pump Combined Efficiency", default: 0.75 }
        },
        dependencyChain: ["Auxiliary Hydraulic SEC", "Net System SEC", "Pump Motor Sizing"]
    },
    {
        id: "EQ-05-03",
        name: "Auxiliary Hydraulic SEC",
        formula: "(pumpPower / 1000) / (purifiedFlowRate * 0.06)",
        factoryFormula: "(pumpPower / 1000) / (purifiedFlowRate * 0.06)",
        category: "Energy",
        units: "kWh/m³",
        sourceClassification: "First Principles",
        description: "Specific pumping electrical work per cubic meter of purified water produced.",
        applicableBasis: "Auxiliary Energy Allocation",
        author: "Core Registry",
        dateModified: new Date("2026-01-22").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            pumpPower: { unit: "W", label: "Mechanical Pump Power", default: 40.0 },
            purifiedFlowRate: { unit: "L/min", label: "Product Flow Rate", default: 9.52 }
        },
        dependencyChain: ["Net Modeled System SEC", "Total System Energy Footprint"]
    },
    {
        id: "EQ-05-04",
        name: "Total Net System SEC",
        formula: "grossSEC - energyRecoveryCredit + pumpSEC",
        factoryFormula: "grossSEC - energyRecoveryCredit + pumpSEC",
        category: "Energy",
        units: "kWh/m³",
        sourceClassification: "First Principles",
        description: "Net battery-limits Specific Energy Consumption accounting for gross stack power, recovery credit, and pumping.",
        applicableBasis: "Full System Boundary",
        author: "Core Registry",
        dateModified: new Date("2026-01-22").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            grossSEC: { unit: "kWh/m³", label: "Gross Electrical SEC", default: 0.282 },
            energyRecoveryCredit: { unit: "kWh/m³", label: "Energy Recovery Credit", default: 0.010 },
            pumpSEC: { unit: "kWh/m³", label: "Auxiliary Hydraulic SEC", default: 0.014 }
        },
        dependencyChain: ["Annual Electricity Cost", "Levelized Cost of Water (LCOW)", "Technology Ranking"]
    },

    // =========================================================================
    // DOMAIN 06 — HYDRAULICS & PUMPING SIZING (4 Equations)
    // =========================================================================
    {
        id: "EQ-06-01",
        name: "Channel Linear Velocity",
        formula: "(flowRate / 60000) / channelArea",
        factoryFormula: "(flowRate / 60000) / channelArea",
        category: "Hydraulic",
        units: "m/s",
        sourceClassification: "Engineering Model",
        description: "Average superficial fluid velocity inside active flow spacer channel.",
        applicableBasis: "Continuity Equation",
        author: "Core Registry",
        dateModified: new Date("2026-01-25").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            flowRate: { unit: "L/min", label: "Feed Volumetric Flow", default: 10.0 },
            channelArea: { unit: "m²", label: "Cross-Sectional Area", default: 0.0002 }
        },
        dependencyChain: ["Channel Shear Rate", "Boundary Layer Mass Transfer", "Friction Pressure Drop"]
    },
    {
        id: "EQ-06-02",
        name: "Hydraulic Channel Diameter",
        formula: "(4 * (channelWidth * spacerThickness)) / (2 * (channelWidth + spacerThickness))",
        factoryFormula: "(4 * (channelWidth * spacerThickness)) / (2 * (channelWidth + spacerThickness))",
        category: "Hydraulic",
        units: "m",
        sourceClassification: "First Principles",
        description: "Hydraulic diameter for thin rectangular flow channels based on channel width and spacer thickness.",
        applicableBasis: "Rectangular Channel Geometry",
        author: "Core Registry",
        dateModified: new Date("2026-01-25").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            channelWidth: { unit: "m", label: "Active Channel Width", default: 0.20 },
            spacerThickness: { unit: "m", label: "Spacer Gap Thickness", default: 0.001 }
        },
        dependencyChain: ["Spacer Reynolds Number", "Darcy Friction Factor", "Pressure Drop"]
    },
    {
        id: "EQ-06-03",
        name: "Spacer Hydraulic Loss",
        formula: "f * (L / D) * (rho * (v ^ 2) / 2) / 1000",
        factoryFormula: "f * (L / D) * (rho * (v ^ 2) / 2) / 1000",
        category: "Hydraulic",
        units: "kPa",
        sourceClassification: "Engineering Model",
        description: "Friction pressure head loss along spacer-filled narrow channel evaluated via Darcy-Weisbach formulation.",
        applicableBasis: "Laminar-Mesh Drag Correlation",
        author: "Core Registry",
        dateModified: new Date("2026-01-25").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            f: { unit: "—", label: "Friction Factor", default: 0.04 },
            L: { unit: "m", label: "Flow Length", default: 0.25 },
            D: { unit: "m", label: "Hydraulic Diameter", default: 0.001 },
            rho: { unit: "kg/m³", label: "Fluid Density", default: 1000.0 },
            v: { unit: "m/s", label: "Fluid Velocity", default: 0.15 }
        },
        dependencyChain: ["Pumping Mechanical Power", "Auxiliary Hydraulic SEC", "Pump Selection"]
    },
    {
        id: "EQ-06-04",
        name: "Feed Pumping Power",
        formula: "((flowRate / 60000) * (pressureDrop * 1000)) / pumpEfficiency",
        factoryFormula: "((flowRate / 60000) * (pressureDrop * 1000)) / pumpEfficiency",
        category: "Hydraulic",
        units: "W",
        sourceClassification: "Engineering Model",
        description: "Electric power input required to drive the feed pump against system head loss and friction.",
        applicableBasis: "Centrifugal Pump Operating Curve",
        author: "Core Registry",
        dateModified: new Date("2026-01-25").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            flowRate: { unit: "L/min", label: "Feed Flow", default: 10.0 },
            pressureDrop: { unit: "kPa", label: "Hydraulic Head Loss", default: 180.0 },
            pumpEfficiency: { unit: "fraction", label: "Pump Combined Efficiency", default: 0.75 }
        },
        dependencyChain: ["Auxiliary Hydraulic SEC", "Net System SEC", "Annual OPEX"]
    },

    // =========================================================================
    // DOMAIN 07 — WATER QUALITY & PURITY PREDICTION (3 Equations)
    // =========================================================================
    {
        id: "EQ-07-01",
        name: "Product TDS Concentration Prediction",
        formula: "feedTds * (1 - (removalEfficiency / 100))",
        factoryFormula: "feedTds * (1 - (removalEfficiency / 100))",
        category: "Performance",
        units: "mg/L",
        sourceClassification: "Engineering Model",
        description: "Predicts effluent purified stream Total Dissolved Solids from feed salinity and fractional removal efficiency.",
        applicableBasis: "Linear Fractional Separation Model",
        author: "Core Registry",
        dateModified: new Date("2026-01-28").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed Water TDS", default: 500.0 },
            removalEfficiency: { unit: "%", label: "Target Removal Percentage", default: 90.04 }
        },
        dependencyChain: ["Product TDS Compliance Check", "Faraday Current", "Water Purity Rating"]
    },
    {
        id: "EQ-07-02",
        name: "Salt Rejection Percentage",
        formula: "((feedTds - productTds) / feedTds) * 100",
        factoryFormula: "((feedTds - productTds) / feedTds) * 100",
        category: "Performance",
        units: "%",
        sourceClassification: "Performance Metric",
        description: "Percentage reduction of mineral salinity achieved across active treatment stack.",
        applicableBasis: "Deionization Factor Definition",
        author: "Core Registry",
        dateModified: new Date("2026-01-28").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 }
        },
        dependencyChain: ["Product TDS Compliance", "Screening Pass/Fail", "Multi-Pass Requirement"]
    },
    {
        id: "EQ-07-03",
        name: "Concentrate Stream TDS Prediction",
        formula: "(feedTds * feedFlowRate - productTds * productFlowRate) / rejectFlowRate",
        factoryFormula: "(feedTds * feedFlowRate - productTds * productFlowRate) / rejectFlowRate",
        category: "Mass Transfer",
        units: "mg/L",
        sourceClassification: "First Principles",
        description: "Evaluates steady-state effluent concentrate brine TDS based on exact conservation of salt mass.",
        applicableBasis: "Salt Conservation Closure",
        author: "Core Registry",
        dateModified: new Date("2026-01-28").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            feedFlowRate: { unit: "L/min", label: "Feed Flow", default: 10.0 },
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 },
            productFlowRate: { unit: "L/min", label: "Product Flow", default: 9.52 },
            rejectFlowRate: { unit: "L/min", label: "Reject Flow", default: 0.48 }
        },
        dependencyChain: ["Brine Stream Sizing", "Desorption Salinity Peak", "Zero Liquid Discharge Compliance"]
    },

    // =========================================================================
    // DOMAIN 08 — PROCESS FEASIBILITY & SCREENING (3 Equations)
    // =========================================================================
    {
        id: "EQ-08-01",
        name: "Feed Salinity Operating Envelope Check",
        formula: "feedTds <= 5000 ? 1 : 0",
        factoryFormula: "feedTds <= 5000 ? 1 : 0",
        category: "Optimization",
        units: "compliance",
        sourceClassification: "Design Constraint",
        description: "Project screening rule of thumb verifying that feed salinity is within practical CDI/MCDI economic operating envelope (<= 5,000 mg/L).",
        applicableBasis: "Project Screening Envelope Assumption",
        author: "Core Registry",
        dateModified: new Date("2026-02-01").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Influent Feed TDS", default: 500.0 }
        },
        dependencyChain: ["Technology Screening Gate", "Process Viability Indicator"]
    },
    {
        id: "EQ-08-02",
        name: "Feed Hardness Precipitation Limit",
        formula: "feedHardness <= 250 ? 1 : 0",
        factoryFormula: "feedHardness <= 250 ? 1 : 0",
        category: "Optimization",
        units: "compliance",
        sourceClassification: "Design Constraint",
        description: "Project screening guideline validating that feed calcium/magnesium hardness does not exceed scaling risk threshold (<= 250 mg/L as CaCO3).",
        applicableBasis: "Project Scaling Risk Assumption",
        author: "Core Registry",
        dateModified: new Date("2026-02-01").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedHardness: { unit: "mg/L", label: "Feed Total Hardness", default: 150.0 }
        },
        dependencyChain: ["Pretreatment Sizing", "Antiscalant Requirement", "Membrane Scaling Risk"]
    },
    {
        id: "EQ-08-03",
        name: "Multi-Technology Feasibility Gate",
        formula: "feedTds <= maxTdsLimit ? 1 : 0",
        factoryFormula: "feedTds <= maxTdsLimit ? 1 : 0",
        category: "Optimization",
        units: "index",
        sourceClassification: "Optimization Metric",
        description: "Automated feasibility dispatch evaluating whether selected CDI, MCDI, FCDI, or EDI module matches stream chemistry.",
        applicableBasis: "Decision Tree Screening Rule",
        author: "Core Registry",
        dateModified: new Date("2026-02-01").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            maxTdsLimit: { unit: "mg/L", label: "Upper Feasibility Bound", default: 3500.0 }
        },
        dependencyChain: ["Process Recommendation Engine", "CDI vs MCDI vs EDI Ranking"]
    },

    // =========================================================================
    // DOMAIN 09 — CAD & STACK GEOMETRY (5 Equations)
    // =========================================================================
    {
        id: "EQ-09-01",
        name: "Electrode Active Area Unit Conversion",
        formula: "area_cm2 * 0.0001",
        factoryFormula: "area_cm2 * 0.0001",
        category: "Hydraulic",
        units: "m²",
        sourceClassification: "First Principles",
        description: "Converts electrode geometric area from square centimeters (cm²) to SI square meters (m²).",
        applicableBasis: "Geometric Unit Conversion",
        author: "Core Registry",
        dateModified: new Date("2026-02-05").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            area_cm2: { unit: "cm²", label: "Electrode Area in cm²", default: 350.0 }
        },
        dependencyChain: ["Current Density", "Total Stack Active Area", "Electrode Mass"]
    },
    {
        id: "EQ-09-02",
        name: "Total Active Stack Surface Area",
        formula: "cellPairs * (electrodeArea_cm2 * 0.0001) * 2",
        factoryFormula: "cellPairs * (electrodeArea_cm2 * 0.0001) * 2",
        category: "Hydraulic",
        units: "m²",
        sourceClassification: "First Principles",
        description: "Evaluates total cumulative active electrode surface area across all stacked cell pairs (anode + cathode).",
        applicableBasis: "Bipolar Stacking Active Surface",
        author: "Core Registry",
        dateModified: new Date("2026-02-05").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellPairs: { unit: "count", label: "Cell Pair Count", default: 68 },
            electrodeArea_cm2: { unit: "cm²", label: "Single Electrode Area", default: 350.0 }
        },
        dependencyChain: ["CapEx Sizing", "Total Carbon Mass", "Faradaic Flux"]
    },
    {
        id: "EQ-09-03A",
        name: "Active Stack Core Layer Height",
        formula: "cellPairs * (electrodeThickness + spacerThickness + membraneThickness)",
        factoryFormula: "cellPairs * (electrodeThickness + spacerThickness + membraneThickness)",
        category: "Hydraulic",
        units: "mm",
        sourceClassification: "Engineering Model",
        description: "Calculates net active cell repeat unit core height from individual compressed layer thicknesses (without end plates).",
        applicableBasis: "Active Core Geometry (Net Cell Stack)",
        author: "Core Registry",
        dateModified: new Date("2026-02-05").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellPairs: { unit: "count", label: "Cell Pairs", default: 68 },
            electrodeThickness: { unit: "mm", label: "Electrode Sheet", default: 0.60 },
            spacerThickness: { unit: "mm", label: "Mesh Spacer Gap", default: 0.50 },
            membraneThickness: { unit: "mm", label: "IEM Membrane", default: 0.15 }
        },
        dependencyChain: ["Stack Compression", "Active Core Height", "CAD Module Viewer"]
    },
    {
        id: "EQ-09-03B",
        name: "Total Stack Assembly Envelope Height",
        formula: "(cellPairs * cellPitch) + endPlateThickness",
        factoryFormula: "(cellPairs * cellPitch) + endPlateThickness",
        category: "Hydraulic",
        units: "mm",
        sourceClassification: "Engineering Model",
        description: "Calculates total physical outer envelope height of the assembled stack module including structural end plates and manifold compression blocks.",
        applicableBasis: "CAD Enclosure Assembly Envelope",
        author: "Core Registry",
        dateModified: new Date("2026-02-05").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellPairs: { unit: "count", label: "Cell Pairs", default: 68 },
            cellPitch: { unit: "mm", label: "Unit Cell Pitch", default: 2.0 },
            endPlateThickness: { unit: "mm", label: "Combined End Plate Rigging", default: 40.0 }
        },
        dependencyChain: ["Enclosure Sizing", "Skid Geometry", "Tie-Rod Sizing"]
    },
    {
        id: "EQ-09-04",
        name: "Total Electrode Carbon Mass",
        formula: "2 * cellPairs * (electrodeArea_cm2 * 0.0001) * (thickness / 1000) * density * (1 - porosity)",
        factoryFormula: "2 * cellPairs * (electrodeArea_cm2 * 0.0001) * (thickness / 1000) * density * (1 - porosity)",
        category: "Mass Transfer",
        units: "kg",
        sourceClassification: "First Principles",
        description: "Calculates total dry mass of active porous carbon electrodes contained across all stack cell pairs.",
        applicableBasis: "Porous Matrix Solid Phase",
        author: "Core Registry",
        dateModified: new Date("2026-02-05").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellPairs: { unit: "count", label: "Cell Pairs", default: 68 },
            electrodeArea_cm2: { unit: "cm²", label: "Electrode Area", default: 350.0 },
            thickness: { unit: "mm", label: "Sheet Thickness", default: 0.60 },
            density: { unit: "kg/m³", label: "Carbon Matrix Density", default: 1200.0 },
            porosity: { unit: "fraction", label: "Electrode Porosity", default: 0.65 }
        },
        dependencyChain: ["Stack Mass", "Electrode Replacement Cost", "CapEx"]
    },

    // =========================================================================
    // DOMAIN 10 — DYNAMIC CYCLE & TRANSIENTS (4 Equations)
    // =========================================================================
    {
        id: "EQ-10-01",
        name: "Operational Batch Cycle Time",
        formula: "t_adsorption + t_desorption + t_rinse",
        factoryFormula: "t_adsorption + t_desorption + t_rinse",
        category: "Performance",
        units: "minutes",
        sourceClassification: "Engineering Model",
        description: "Total elapsed time for one full batch CDI/MCDI deionization, desorption regeneration, and rinse sequence.",
        applicableBasis: "Batch Cyclic Operation Profile",
        author: "Core Registry",
        dateModified: new Date("2026-02-08").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            t_adsorption: { unit: "min", label: "Adsorption Phase Duration", default: 5.0 },
            t_desorption: { unit: "min", label: "Desorption Phase Duration", default: 1.0 },
            t_rinse: { unit: "min", label: "Rinse Flushing Duration", default: 1.0 }
        },
        dependencyChain: ["12-Minute Cycle Simulation", "Product Throughput Sizing"]
    },
    {
        id: "EQ-10-02",
        name: "Transient Concentration Response Profile",
        formula: "feedTds - (feedTds - targetTds) * (1 - exp(-t / tau))",
        factoryFormula: "feedTds - (feedTds - targetTds) * (1 - exp(-t / tau))",
        category: "Performance",
        units: "mg/L",
        sourceClassification: "Engineering Model",
        description: "First-order dynamic response modeling illustrative effluent salinity trajectory during adsorption step.",
        applicableBasis: "Transient CSTR Response Model",
        author: "Core Registry",
        dateModified: new Date("2026-02-08").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            targetTds: { unit: "mg/L", label: "Steady-State Target TDS", default: 49.8 },
            t: { unit: "min", label: "Elapsed Time Step", default: 2.5 },
            tau: { unit: "min", label: "Hydraulic Time Constant", default: 1.2 }
        },
        dependencyChain: ["12-Minute Dynamic Simulation Graphs", "Transient Product Curve"]
    },
    {
        id: "EQ-10-03",
        name: "Cycle-Integrated Salt Adsorption Capacity (SAC)",
        formula: "((tdsIn - tdsOut) * (flowRate / 60) * (adsorptionTime * 60)) / (totalCarbonMass * 1000)",
        factoryFormula: "((tdsIn - tdsOut) * (flowRate / 60) * (adsorptionTime * 60)) / (totalCarbonMass * 1000)",
        category: "Mass Transfer",
        units: "mg/g",
        sourceClassification: "Engineering Model",
        description: "Cycle-integrated gravimetric salt adsorption capacity per gram of active carbon electrode mass across adsorption half-cycle.",
        applicableBasis: "Half-Cycle Carbon Adsorption Mass Integral",
        author: "Core Registry",
        dateModified: new Date("2026-02-08").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            tdsIn: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            tdsOut: { unit: "mg/L", label: "Product TDS", default: 49.8 },
            flowRate: { unit: "L/min", label: "Volumetric Flow Rate", default: 10.0 },
            adsorptionTime: { unit: "min", label: "Adsorption Duration", default: 5.0 },
            totalCarbonMass: { unit: "kg", label: "Total Carbon Electrode Mass", default: 2.50 }
        },
        dependencyChain: ["Electrode Mass Sizing", "Cycle Duration", "Stack Cell Pairs", "Regeneration Frequency"]
    },
    {
        id: "EQ-10-04",
        name: "Coulombic Cycle Efficiency",
        formula: "(chargeDesorbed / chargeAdsorbed) * 100",
        factoryFormula: "(chargeDesorbed / chargeAdsorbed) * 100",
        category: "Electrochemical",
        units: "%",
        sourceClassification: "First Principles",
        description: "Measures reversible charge recovery during desorption and regeneration relative to adsorption charge investment.",
        applicableBasis: "Cyclic Charge Reversibility Definition",
        author: "Core Registry",
        dateModified: new Date("2026-02-08").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            chargeDesorbed: { unit: "C", label: "Charge Recovered during Desorption", default: 85.0 },
            chargeAdsorbed: { unit: "C", label: "Charge Invested during Adsorption", default: 100.0 }
        },
        dependencyChain: ["Desorption Yield", "Cycle Reversibility", "Energy Recovery Credit", "Net SEC"]
    },

    // =========================================================================
    // DOMAIN 11 — DESIGN CONSTRAINTS & LIMITS (3 Equations)
    // =========================================================================
    {
        id: "EQ-11-01",
        name: "Product Water Quality Limit Compliance",
        formula: "productTds <= targetTds ? 1 : 0",
        factoryFormula: "productTds <= targetTds ? 1 : 0",
        category: "Performance",
        units: "compliance",
        sourceClassification: "Design Constraint",
        description: "Binary pass/fail constraint verifying that effluent product TDS satisfies user specification (<= 50 mg/L).",
        applicableBasis: "Effluent Water Quality Standard",
        author: "Core Registry",
        dateModified: new Date("2026-02-10").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 },
            targetTds: { unit: "mg/L", label: "Target Permissible TDS", default: 50.0 }
        },
        dependencyChain: ["Design Quality Compliance Check", "Technology Feasibility Rating"]
    },
    {
        id: "EQ-11-02",
        name: "Water Recovery Floor Constraint",
        formula: "recovery >= 95.0 ? 1 : 0",
        factoryFormula: "recovery >= 95.0 ? 1 : 0",
        category: "Performance",
        units: "compliance",
        sourceClassification: "Design Constraint",
        description: "Evaluates whether operating design meets minimum allowable water recovery threshold (>= 95.0%).",
        applicableBasis: "Water Conservation Standard",
        author: "Core Registry",
        dateModified: new Date("2026-02-10").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            recovery: { unit: "%", label: "Operating Recovery", default: 95.2 }
        },
        dependencyChain: ["Recovery Compliance Check", "Brine Minimization"]
    },
    {
        id: "EQ-11-03",
        name: "Cell Voltage Upper Operating Bound",
        formula: "cellVoltage <= 1.60 ? 1 : 0",
        factoryFormula: "cellVoltage <= 1.60 ? 1 : 0",
        category: "Electrical",
        units: "compliance",
        sourceClassification: "Design Constraint",
        description: "Verifies cell potential remains safely below thermodynamic water splitting boundary (<= 1.60 V) to prevent Faradaic side reactions.",
        applicableBasis: "Electrochemical Safety Boundary",
        author: "Core Registry",
        dateModified: new Date("2026-02-10").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellVoltage: { unit: "V", label: "Single Cell Potential", default: 1.20 }
        },
        dependencyChain: ["Electrolysis Avoidance", "Power Supply Setpoint Dispatch"]
    },

    // =========================================================================
    // EXTENDED TECHNO-ECONOMIC, THERMODYNAMIC & OPTIMIZATION (12 Equations)
    // =========================================================================
    {
        id: "EQ-EXT-01",
        name: "Stack Resistance (Ohm's Law)",
        formula: "V / I",
        factoryFormula: "V / I",
        category: "Electrical",
        units: "Ω",
        sourceClassification: "First Principles",
        description: "Calculates total apparent direct-current resistance across cell pairs, spacers, and ionic solutions.",
        applicableBasis: "Ohmic Stack Domain",
        author: "Factory Registry",
        dateModified: new Date("2026-02-12").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            V: { unit: "V", label: "Stack Voltage", default: 81.6 },
            I: { unit: "A", label: "Stack Current", default: 1.98 }
        },
        dependencyChain: ["Ohmic Voltage Losses", "Cell Pair Resistance", "Gross Electrical SEC"]
    },
    {
        id: "EQ-EXT-02",
        name: "Hydraulic Residence Time",
        formula: "reactorVolume / (flowRate / 60000)",
        factoryFormula: "reactorVolume / (flowRate / 60000)",
        category: "Hydraulic",
        units: "seconds",
        sourceClassification: "Engineering Model",
        description: "Determines fluid residence time inside active treatment spacer volume.",
        applicableBasis: "Hydraulic Channel Sizing",
        author: "Factory Registry",
        dateModified: new Date("2026-02-12").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            reactorVolume: { unit: "m³", label: "Active Spacer Volume", default: 0.005 },
            flowRate: { unit: "L/min", label: "Feed Flow", default: 10.0 }
        },
        dependencyChain: ["Adsorption Kinetics", "Desalination Rate", "Channel Velocity"]
    },
    {
        id: "EQ-EXT-03",
        name: "Required Faraday Current",
        formula: "(((tdsIn - tdsOut) / 58.44) * (flowRate / 60) * 96485) / (cellPairs * (chargeEfficiency / 100) * 1000)",
        factoryFormula: "(((tdsIn - tdsOut) / 58.44) * (flowRate / 60) * 96485) / (cellPairs * (chargeEfficiency / 100) * 1000)",
        category: "Electrochemical",
        units: "A",
        sourceClassification: "First Principles",
        description: "Calculates total direct current required to remove target salt mass flow at specified charge efficiency.",
        applicableBasis: "Faraday Mass Transfer Equivalence",
        author: "Factory Registry",
        dateModified: new Date("2026-02-12").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            tdsIn: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            tdsOut: { unit: "mg/L", label: "Product TDS", default: 49.8 },
            flowRate: { unit: "L/min", label: "Feed Flow", default: 10.0 },
            cellPairs: { unit: "count", label: "Cell Pairs", default: 68 },
            chargeEfficiency: { unit: "%", label: "Charge Efficiency", default: 92.0 }
        },
        dependencyChain: ["Power Supply Sizing", "Current Density", "Gross Stack Electrical Power"]
    },
    {
        id: "EQ-EXT-04",
        name: "Simplified Osmotic Minimum Work Estimate (Dilute Screening)",
        formula: "2 * 8.314 * (273.15 + temp) * ((tdsIn - tdsOut) / 58440) * 0.0002778",
        factoryFormula: "2 * 8.314 * (273.15 + temp) * ((tdsIn - tdsOut) / 58440) * 0.0002778",
        category: "Electrochemical",
        units: "kWh/m³",
        sourceClassification: "Engineering Model",
        description: "Screening estimate of minimum thermodynamic energy of separation based on ideal dilute van 't Hoff osmotic pressure delta. Rigorous multicomponent chemical potential calculations required for detailed engineering design.",
        applicableBasis: "Simplified Reversible Osmotic Limit (Dilute NaCl Basis, van 't Hoff)",
        author: "Factory Registry",
        dateModified: new Date("2026-02-14").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            temp: { unit: "°C", label: "Feed Temperature", default: 25.0 },
            tdsIn: { unit: "mg/L", label: "Feed Salinity", default: 500.0 },
            tdsOut: { unit: "mg/L", label: "Product Salinity", default: 49.8 }
        },
        dependencyChain: ["Second-Law Thermodynamic Efficiency", "Exergy Analysis"]
    },
    {
        id: "EQ-EXT-05",
        name: "Thermodynamic Energy Efficiency",
        formula: "(thermodynamicMinWork / netSEC) * 100",
        factoryFormula: "(thermodynamicMinWork / netSEC) * 100",
        category: "Energy",
        units: "%",
        sourceClassification: "First Principles",
        description: "Second-law thermodynamic efficiency: ratio of ideal Gibbs separation work to actual net system SEC.",
        applicableBasis: "Second-Law Exergy Efficiency Formulation",
        author: "Factory Registry",
        dateModified: new Date("2026-02-14").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            thermodynamicMinWork: { unit: "kWh/m³", label: "Thermodynamic Minimum Work", default: 0.038 },
            netSEC: { unit: "kWh/m³", label: "Net System SEC", default: 0.286 }
        },
        dependencyChain: ["Exergy Analysis", "Optimization Frontier", "Technology Rating"]
    },
    {
        id: "EQ-EXT-06",
        name: "Annual Energy Cost",
        formula: "netSEC * (purifiedFlowRate * 0.06) * 8760 * electricityTariff",
        factoryFormula: "netSEC * (purifiedFlowRate * 0.06) * 8760 * electricityTariff",
        category: "Economics",
        units: "$/year",
        sourceClassification: "Economic Model",
        description: "Estimated annual operating electricity cost for 24/7 continuous operation (8760 h/yr) at regional tariff.",
        applicableBasis: "Annual Continuous Operation Model",
        author: "Factory Registry",
        dateModified: new Date("2026-02-18").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            netSEC: { unit: "kWh/m³", label: "Net System SEC", default: 0.286 },
            purifiedFlowRate: { unit: "L/min", label: "Purified Product Flow", default: 9.52 },
            electricityTariff: { unit: "$/kWh", label: "Electricity Cost Rate", default: 0.12 }
        },
        dependencyChain: ["Total Annual OPEX", "Levelized Cost of Water (LCOW)", "Payback Period"]
    },
    {
        id: "EQ-EXT-07",
        name: "Annual Electricity Consumption",
        formula: "netSEC * (purifiedFlowRate * 0.06) * 8760",
        factoryFormula: "netSEC * (purifiedFlowRate * 0.06) * 8760",
        category: "Economics",
        units: "kWh/year",
        sourceClassification: "Economic Model",
        description: "Total annual electricity energy consumption required to operate the CDI/EDI plant continuous base load.",
        applicableBasis: "Base Load Power Grid Connection Model",
        author: "Factory Registry",
        dateModified: new Date("2026-02-18").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            netSEC: { unit: "kWh/m³", label: "Net System SEC", default: 0.286 },
            purifiedFlowRate: { unit: "L/min", label: "Purified Product Flow", default: 9.52 }
        },
        dependencyChain: ["Utility Connection Sizing", "Annual Energy Cost", "Carbon Footprint"]
    },
    {
        id: "EQ-EXT-08",
        name: "Annual Electrode Replacement Cost",
        formula: "(electrodeMass * carbonPriceKg) / carbonLifeYears",
        factoryFormula: "(electrodeMass * carbonPriceKg) / carbonLifeYears",
        category: "Economics",
        units: "$/year",
        sourceClassification: "Economic Model",
        description: "Amortized annual recurring cost for activated carbon electrode periodic replacement.",
        applicableBasis: "Component Lifecycle Amortization Model",
        author: "Factory Registry",
        dateModified: new Date("2026-02-20").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            electrodeMass: { unit: "kg", label: "Total Carbon Electrode Mass", default: 2.50 },
            carbonPriceKg: { unit: "$/kg", label: "Porous Carbon Unit Price", default: 60.0 },
            carbonLifeYears: { unit: "years", label: "Electrode Useful Service Life", default: 4.0 }
        },
        dependencyChain: ["Recurring OPEX", "Levelized Cost of Water (LCOW)"]
    },
    {
        id: "EQ-EXT-09",
        name: "Levelized Cost of Water (LCOW)",
        formula: "(annualOpex + (capitalCost * 0.10)) / (purifiedFlowRate * 0.06 * 8760)",
        factoryFormula: "(annualOpex + (capitalCost * 0.10)) / (purifiedFlowRate * 0.06 * 8760)",
        category: "Economics",
        units: "$/m³",
        sourceClassification: "Economic Model",
        description: "Comprehensive Levelized Cost of Water combining annual operating expenditure and 10% annualized CapEx.",
        applicableBasis: "Full Lifecycle Cost Model",
        author: "Factory Registry",
        dateModified: new Date("2026-02-20").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            annualOpex: { unit: "$/year", label: "Annual Total OPEX", default: 350.0 },
            capitalCost: { unit: "$", label: "Total Turnkey CapEx", default: 3800.0 },
            purifiedFlowRate: { unit: "L/min", label: "Purified Flow Rate", default: 9.52 }
        },
        dependencyChain: ["Techno-Economic Feasibility", "Technology Commercial Viability"]
    },
    {
        id: "EQ-EXT-10",
        name: "Multi-Objective Penalty Function",
        formula: "SEC + 0.5 * ((targetTds - outletTds) > 0 ? (targetTds - outletTds) : 0)",
        factoryFormula: "SEC + 0.5 * ((targetTds - outletTds) > 0 ? (targetTds - outletTds) : 0)",
        category: "Optimization",
        units: "cost unit",
        sourceClassification: "Optimization Metric",
        description: "Multi-objective loss function balancing minimal specific energy with stringent target TDS penalty compliance.",
        applicableBasis: "Pareto Objective Formulation",
        author: "Factory Registry",
        dateModified: new Date("2026-02-22").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            SEC: { unit: "kWh/m³", label: "Specific Energy Consumption", default: 0.286 },
            targetTds: { unit: "mg/L", label: "Permissible Product TDS Target", default: 50.0 },
            outletTds: { unit: "mg/L", label: "Calculated Product TDS", default: 49.8 }
        },
        dependencyChain: ["Pareto Optimal Frontier", "Automated Parameter Optimization", "Setpoint Dispatch"]
    },
    {
        id: "EQ-EXT-11",
        name: "Technology Screening Suitability Index",
        formula: "0.40 * (1 / (netSEC + 0.01)) + 0.35 * (waterRecovery / 100) + 0.25 * (saltRemovalEfficiency / 100)",
        factoryFormula: "0.40 * (1 / (netSEC + 0.01)) + 0.35 * (waterRecovery / 100) + 0.25 * (saltRemovalEfficiency / 100)",
        category: "Optimization",
        units: "index",
        sourceClassification: "Optimization Metric",
        description: "Multi-criteria decision screening score evaluating technology fit across energy, recovery, and deionization yield.",
        applicableBasis: "Composite Normalization Model",
        author: "Factory Registry",
        dateModified: new Date("2026-02-22").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            netSEC: { unit: "kWh/m³", label: "Net System SEC", default: 0.286 },
            waterRecovery: { unit: "%", label: "Water Recovery Percentage", default: 95.2 },
            saltRemovalEfficiency: { unit: "%", label: "TDS Removal Efficiency", default: 90.04 }
        },
        dependencyChain: ["Technology Recommendation", "CDI vs MCDI vs FCDI vs EDI Ranking"]
    },
    {
        id: "EQ-EXT-12",
        name: "Normalized Skid Capital Cost Metric",
        formula: "cellPairs * ((electrodeArea_cm2 * 0.0001) * 250) + 1200",
        factoryFormula: "cellPairs * ((electrodeArea_cm2 * 0.0001) * 250) + 1200",
        category: "Economics",
        units: "$",
        sourceClassification: "Economic Model",
        description: "Estimates total turnkey capital equipment investment cost based on active area and enclosure module base.",
        applicableBasis: "Equipment Cost Correlation Model",
        author: "Factory Registry",
        dateModified: new Date("2026-02-24").toISOString(),
        version: "1.0.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellPairs: { unit: "count", label: "Cell Pairs", default: 68 },
            electrodeArea_cm2: { unit: "cm²", label: "Electrode Area", default: 350.0 }
        },
        dependencyChain: ["CapEx Sizing", "Levelized Cost of Water (LCOW)"]
    }
];

export default DEFAULT_EQUATIONS_DATABASE;
