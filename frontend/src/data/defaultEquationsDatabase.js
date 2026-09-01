/**
 * COMPLETE ENGINEERING EQUATION DATABASE & FORMULA REGISTRY (46 CORE EQUATIONS)
 * 
 * Filtered for pure electrochemical, hydraulic, mass transfer, energy, 
 * performance, and optimization engineering governing relations.
 * (All duplicates and techno-economic equations removed).
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
        version: "1.1.0",
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
        version: "1.1.0",
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
        version: "1.1.0",
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
        version: "1.1.0",
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
    // DOMAIN 02 — MASS CONSERVATION & BALANCE CLOSURES (4 Equations)
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
        version: "1.1.0",
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
        version: "1.1.0",
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
        version: "1.1.0",
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
        version: "1.1.0",
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
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 },
            flowRate: { unit: "L/min", label: "Volumetric Flow Rate", default: 10.0 }
        },
        dependencyChain: ["Theoretical Faraday Current", "Stack Power", "Faradaic Efficiency"]
    },
    {
        id: "EQ-03-02",
        name: "Theoretical Faraday Charge Rate",
        formula: "(((feedTds - productTds) / 58.44) * (flowRate / 60000)) * 96485",
        factoryFormula: "(((feedTds - productTds) / 58.44) * (flowRate / 60000)) * 96485",
        category: "Electrochemical",
        units: "C/s",
        sourceClassification: "First Principles",
        description: "Calculates total stoichiometric charge transfer rate required for ion removal by Faraday's constant (96,485 C/mol).",
        applicableBasis: "Faraday's Law of Electrolysis",
        author: "Core Registry",
        dateModified: new Date("2026-01-18").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed Salinity", default: 500.0 },
            productTds: { unit: "mg/L", label: "Product Salinity", default: 49.8 },
            flowRate: { unit: "L/min", label: "Feed Flow Rate", default: 10.0 }
        },
        dependencyChain: ["Faradaic Charge Efficiency", "Stack Current Demands", "Electrochemical Kinetics"]
    },
    {
        id: "EQ-03-03",
        name: "Faradaic Charge Efficiency",
        formula: "((((feedTds - productTds) / 58.44) * (flowRate / 60) * 96485) / (I * cellPairs * 1000)) * 100",
        factoryFormula: "((((feedTds - productTds) / 58.44) * (flowRate / 60) * 96485) / (I * cellPairs * 1000)) * 100",
        category: "Electrochemical",
        units: "%",
        sourceClassification: "First Principles",
        description: "Ratio of theoretical Faraday charge required for ion extraction to actual electric charge supplied to all cell pairs in series.",
        applicableBasis: "Charge Transfer Efficiency",
        author: "Core Registry",
        dateModified: new Date("2026-01-18").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 },
            flowRate: { unit: "L/min", label: "Flow Rate", default: 10.0 },
            I: { unit: "A", label: "Stack Current", default: 1.98 },
            cellPairs: { unit: "pairs", label: "Number of Cell Pairs", default: 68 }
        },
        dependencyChain: ["Technology Benchmark", "Energy Recovery Analysis", "CDI vs MCDI Co-ion Penalty"]
    },
    {
        id: "EQ-03-04",
        name: "Operating Current Density",
        formula: "I / (electrodeArea_cm2 * 0.0001)",
        factoryFormula: "I / (electrodeArea_cm2 * 0.0001)",
        category: "Electrical",
        units: "A/m²",
        sourceClassification: "First Principles",
        description: "Area-normalized electric current passing orthogonally through active projected geometric surface of electrode pairs.",
        applicableBasis: "Electrochemical Rate Density",
        author: "Core Registry",
        dateModified: new Date("2026-01-18").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            I: { unit: "A", label: "Current per Cell Pair", default: 1.98 },
            electrodeArea_cm2: { unit: "cm²", label: "Geometric Projected Area", default: 350.0 }
        },
        dependencyChain: ["Electrochemical Overpotential", "Concentration Polarization", "Membrane Limiting Current"]
    },

    // =========================================================================
    // DOMAIN 04 — ELECTRICAL & STACK POWER (3 Equations)
    // =========================================================================
    {
        id: "EQ-04-02",
        name: "Series Stack Voltage Summation",
        formula: "cellPairs * cellVoltage",
        factoryFormula: "cellPairs * cellVoltage",
        category: "Electrical",
        units: "V",
        sourceClassification: "First Principles",
        description: "Total DC terminal voltage across series-connected cell pairs in an electrically stacked module.",
        applicableBasis: "Kirchhoff Voltage Law in Series Stack",
        author: "Core Registry",
        dateModified: new Date("2026-01-20").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellPairs: { unit: "pairs", label: "Number of Cell Pairs", default: 68 },
            cellVoltage: { unit: "V", label: "Cell Pair Voltage", default: 1.40 }
        },
        dependencyChain: ["Gross Electrical Power", "Power Supply Sizing", "Electrical Hazard Boundary"]
    },
    {
        id: "EQ-04-03",
        name: "Gross Stack Electrical Power",
        formula: "V * I",
        factoryFormula: "V * I",
        category: "Electrical",
        units: "W",
        sourceClassification: "First Principles",
        description: "Instantaneous active electrical power absorbed by electrochemical stack across DC bus.",
        applicableBasis: "Direct-Current Electrical Work Rate",
        author: "Core Registry",
        dateModified: new Date("2026-01-20").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            V: { unit: "V", label: "Total DC Stack Voltage", default: 95.2 },
            I: { unit: "A", label: "Stack Electric Current", default: 1.98 }
        },
        dependencyChain: ["Gross Electrical SEC", "Rectifier Sizing", "Thermal Heat Dissipation"]
    },
    {
        id: "EQ-04-04",
        name: "Gross Electrical SEC",
        formula: "(power / 1000) / (purifiedFlowRate * 0.06)",
        factoryFormula: "(power / 1000) / (purifiedFlowRate * 0.06)",
        category: "Energy",
        units: "kWh/m³",
        sourceClassification: "First Principles",
        description: "Specific electric energy consumed per cubic meter of purified product water delivered at module outlet.",
        applicableBasis: "Normalized Specific Energy Accounting",
        author: "Core Registry",
        dateModified: new Date("2026-01-20").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            power: { unit: "W", label: "Gross Electrical Power", default: 188.5 },
            purifiedFlowRate: { unit: "L/min", label: "Product Flow Rate", default: 9.52 }
        },
        dependencyChain: ["Total Net System SEC", "Energy Benchmark", "Technology Comparison Matrix"]
    },

    // =========================================================================
    // DOMAIN 05 — ENERGY AUDITING & HYDRAULIC AUXILIARY (3 Equations)
    // =========================================================================
    {
        id: "EQ-05-01",
        name: "Energy Recovery Credit",
        formula: "grossSEC * (1 - (recovery / 100)) * (recoveryCreditEfficiency / 100)",
        factoryFormula: "grossSEC * (1 - (recovery / 100)) * (recoveryCreditEfficiency / 100)",
        category: "Energy",
        units: "kWh/m³",
        sourceClassification: "Engineering Model",
        description: "Recoverable specific electrical energy harvested during discharge/desorption cycles via constant-current regenerative discharge circuits.",
        applicableBasis: "MCDI / CDI Discharge Regeneration",
        author: "Core Registry",
        dateModified: new Date("2026-01-22").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            grossSEC: { unit: "kWh/m³", label: "Gross Specific Energy", default: 0.330 },
            recovery: { unit: "%", label: "Water Recovery", default: 95.2 },
            recoveryCreditEfficiency: { unit: "%", label: "Energy Recovery Converter Efficiency", default: 20.0 }
        },
        dependencyChain: ["Net Electrical SEC", "Total System SEC", "Greenhouse Gas Index"]
    },
    {
        id: "EQ-05-02",
        name: "Auxiliary Hydraulic Work",
        formula: "((flowRate / 60000) * (pressureDrop * 1000)) / pumpEfficiency",
        factoryFormula: "((flowRate / 60000) * (pressureDrop * 1000)) / pumpEfficiency",
        category: "Hydraulic",
        units: "W",
        sourceClassification: "First Principles",
        description: "Mechanical shaft pumping power required to overcome frictional head loss across porous media channels and flow manifolds.",
        applicableBasis: "Fluid Mechanics Hydrodynamic Work",
        author: "Core Registry",
        dateModified: new Date("2026-01-22").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            flowRate: { unit: "L/min", label: "Feed Volumetric Rate", default: 10.0 },
            pressureDrop: { unit: "kPa", label: "Spacer Channel Friction Loss", default: 20.0 },
            pumpEfficiency: { unit: "fraction", label: "Pump Mechanical Efficiency", default: 0.70 }
        },
        dependencyChain: ["Auxiliary Hydraulic SEC", "Total Net System SEC", "Feed Booster Sizing"]
    },
    {
        id: "EQ-05-03",
        name: "Auxiliary Hydraulic SEC",
        formula: "(pumpPower / 1000) / (purifiedFlowRate * 0.06)",
        factoryFormula: "(pumpPower / 1000) / (purifiedFlowRate * 0.06)",
        category: "Energy",
        units: "kWh/m³",
        sourceClassification: "First Principles",
        description: "Hydraulic parasitic specific energy normalized per cubic meter of purified water delivered.",
        applicableBasis: "Parasitic Pumping Contribution",
        author: "Core Registry",
        dateModified: new Date("2026-01-22").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            pumpPower: { unit: "W", label: "Feed Pumping Power", default: 4.76 },
            purifiedFlowRate: { unit: "L/min", label: "Permeate Inflow Rate", default: 9.52 }
        },
        dependencyChain: ["Total Net System SEC", "Hydraulic Friction Optimization"]
    },
    {
        id: "EQ-05-04",
        name: "Total Net System SEC",
        formula: "grossSEC - energyRecoveryCredit + pumpSEC",
        factoryFormula: "grossSEC - energyRecoveryCredit + pumpSEC",
        category: "Energy",
        units: "kWh/m³",
        sourceClassification: "First Principles",
        description: "Comprehensive net process specific energy consumption accounting for gross electrical adsorption, regenerative credits, and hydraulic losses.",
        applicableBasis: "Authoritative SEC Summation Principle",
        author: "Core Registry",
        dateModified: new Date("2026-01-22").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            grossSEC: { unit: "kWh/m³", label: "Gross Electrical SEC", default: 0.330 },
            energyRecoveryCredit: { unit: "kWh/m³", label: "Energy Harvest Credit", default: 0.066 },
            pumpSEC: { unit: "kWh/m³", label: "Auxiliary Pump SEC", default: 0.008 }
        },
        dependencyChain: ["Final Verification Audit", "Technology Tradeoffs Rank", "Energy Rating"]
    },

    // =========================================================================
    // DOMAIN 06 — HYDRODYNAMICS & CHANNEL LOSSES (3 Equations)
    // =========================================================================
    {
        id: "EQ-06-01",
        name: "Channel Linear Velocity",
        formula: "(flowRate / 60000) / channelArea",
        factoryFormula: "(flowRate / 60000) / channelArea",
        category: "Hydraulic",
        units: "m/s",
        sourceClassification: "First Principles",
        description: "Superficial linear interstitial flow velocity across open cross-sectional flow channel area.",
        applicableBasis: "Continuity Equation",
        author: "Core Registry",
        dateModified: new Date("2026-01-25").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            flowRate: { unit: "L/min", label: "Flow Rate", default: 10.0 },
            channelArea: { unit: "m²", label: "Flow Cross-Section", default: 0.000175 }
        },
        dependencyChain: ["Spacer Reynolds Number", "Boundary Layer Mass Transfer", "Friction Factor"]
    },
    {
        id: "EQ-06-02",
        name: "Hydraulic Channel Diameter",
        formula: "(4 * (channelWidth * spacerThickness)) / (2 * (channelWidth + spacerThickness))",
        factoryFormula: "(4 * (channelWidth * spacerThickness)) / (2 * (channelWidth + spacerThickness))",
        category: "Hydraulic",
        units: "m",
        sourceClassification: "First Principles",
        description: "Equivalent hydraulic diameter for rectangular flow channels between parallel plate electrode assemblies.",
        applicableBasis: "Internal Flow Hydraulics",
        author: "Core Registry",
        dateModified: new Date("2026-01-25").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            channelWidth: { unit: "m", label: "Channel Width", default: 0.35 },
            spacerThickness: { unit: "m", label: "Spacer Gap Thickness", default: 0.0005 }
        },
        dependencyChain: ["Friction Factor", "Reynolds Number", "Darcy-Weisbach Pressure Drop"]
    },
    {
        id: "EQ-06-03",
        name: "Spacer Hydraulic Loss",
        formula: "f * (L / D) * (rho * (v ^ 2) / 2) / 1000",
        factoryFormula: "f * (L / D) * (rho * (v ^ 2) / 2) / 1000",
        category: "Hydraulic",
        units: "kPa",
        sourceClassification: "First Principles",
        description: "Darcy-Weisbach frictional hydrodynamic head loss along length of woven mesh spacer channel.",
        applicableBasis: "Darcy-Weisbach Formulation",
        author: "Core Registry",
        dateModified: new Date("2026-01-25").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            f: { unit: "dimensionless", label: "Darcy Friction Factor", default: 0.25 },
            L: { unit: "m", label: "Channel Length", default: 0.35 },
            D: { unit: "m", label: "Hydraulic Diameter", default: 0.000997 },
            rho: { unit: "kg/m³", label: "Fluid Density", default: 1000.0 },
            v: { unit: "m/s", label: "Interstitial Velocity", default: 0.015 }
        },
        dependencyChain: ["Auxiliary Hydraulic Work", "Pumping Power", "Manifold Balance"]
    },

    // =========================================================================
    // DOMAIN 07 — PRODUCT WATER PURITY & PREDICTION (3 Equations)
    // =========================================================================
    {
        id: "EQ-07-01",
        name: "Product TDS Concentration Prediction",
        formula: "feedTds * (1 - (removalEfficiency / 100))",
        factoryFormula: "feedTds * (1 - (removalEfficiency / 100))",
        category: "Performance",
        units: "mg/L",
        sourceClassification: "Engineering Model",
        description: "Predicts effluent purified product stream salinity based on fractional salt demineralization efficiency.",
        applicableBasis: "Fractional Demineralization",
        author: "Core Registry",
        dateModified: new Date("2026-01-28").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Influent Feed TDS", default: 500.0 },
            removalEfficiency: { unit: "%", label: "Salt Demineralization Efficiency", default: 90.0 }
        },
        dependencyChain: ["Product TDS Compliance", "Molar Removal Rate", "Salt Balance Closure"]
    },
    {
        id: "EQ-07-02",
        name: "Salt Rejection Percentage",
        formula: "((feedTds - productTds) / feedTds) * 100",
        factoryFormula: "((feedTds - productTds) / feedTds) * 100",
        category: "Performance",
        units: "%",
        sourceClassification: "Engineering Model",
        description: "Observed overall salt demineralization efficiency percentage achieved across desalter.",
        applicableBasis: "Salt Removal Metric",
        author: "Core Registry",
        dateModified: new Date("2026-01-28").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 }
        },
        dependencyChain: ["Technology Benchmark", "Design Quality Compliance", "Technology Ranking"]
    },
    {
        id: "EQ-07-03",
        name: "Concentrate Stream TDS Prediction",
        formula: "(feedTds * feedFlowRate - productTds * productFlowRate) / rejectFlowRate",
        factoryFormula: "(feedTds * feedFlowRate - productTds * productFlowRate) / rejectFlowRate",
        category: "Mass Transfer",
        units: "mg/L",
        sourceClassification: "First Principles",
        description: "Exact concentrate reject stream TDS derived directly from rigorous salt mass conservation closure.",
        applicableBasis: "Species Mass Balance Closure",
        author: "Core Registry",
        dateModified: new Date("2026-01-28").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            feedFlowRate: { unit: "L/min", label: "Feed Inflow Rate", default: 10.0 },
            productTds: { unit: "mg/L", label: "Product TDS", default: 49.8 },
            productFlowRate: { unit: "L/min", label: "Product Flow Rate", default: 9.52 },
            rejectFlowRate: { unit: "L/min", label: "Reject Flow Rate", default: 0.48 }
        },
        dependencyChain: ["Reject Salt Load", "Scaling Risk Index", "Brine Disposal Design"]
    },

    // =========================================================================
    // DOMAIN 08 — PHYSICAL GATES & CONSTRAINTS (3 Equations)
    // =========================================================================
    {
        id: "EQ-08-01",
        name: "Feed Salinity Operating Envelope Check",
        formula: "feedTds <= 5000 ? 1 : 0",
        factoryFormula: "feedTds <= 5000 ? 1 : 0",
        category: "Optimization",
        units: "compliance",
        sourceClassification: "Design Constraint",
        description: "Gating constraint verifying feed water salinity does not exceed maximum limit of candidate technology.",
        applicableBasis: "Feasibility Screening Boundary",
        author: "Core Registry",
        dateModified: new Date("2026-02-01").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed Water TDS", default: 500.0 }
        },
        dependencyChain: ["Technology Feasibility Screening", "AI Recommendation Engine"]
    },
    {
        id: "EQ-08-02",
        name: "Feed Hardness Precipitation Limit",
        formula: "feedHardness <= 250 ? 1 : 0",
        factoryFormula: "feedHardness <= 250 ? 1 : 0",
        category: "Optimization",
        units: "compliance",
        sourceClassification: "Design Constraint",
        description: "Flags severe scaling risk when total divalent hardness (Ca²⁺/Mg²⁺ as CaCO3) exceeds critical thresholds.",
        applicableBasis: "Precipitation Scaling Limit",
        author: "Core Registry",
        dateModified: new Date("2026-02-01").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedHardness: { unit: "mg/L as CaCO3", label: "Total Hardness", default: 150.0 }
        },
        dependencyChain: ["Pretreatment Advisory", "Polarity Reversal Trigger"]
    },
    {
        id: "EQ-08-03",
        name: "Multi-Technology Feasibility Gate",
        formula: "feedTds <= maxTdsLimit ? 1 : 0",
        factoryFormula: "feedTds <= maxTdsLimit ? 1 : 0",
        category: "Optimization",
        units: "index",
        sourceClassification: "Design Constraint",
        description: "Universal multi-technology gating constraint evaluating technology suitability against process boundaries.",
        applicableBasis: "Decision Tree Screening",
        author: "Core Registry",
        dateModified: new Date("2026-02-01").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            maxTdsLimit: { unit: "mg/L", label: "Max Allowable TDS Limit", default: 3000.0 }
        },
        dependencyChain: ["Autonomous Selection Hierarchy", "Technology Screening Matrix"]
    },

    // =========================================================================
    // DOMAIN 09 — STACK GEOMETRY & CARBON MASS (5 Equations)
    // =========================================================================
    {
        id: "EQ-09-01",
        name: "Electrode Active Area Unit Conversion",
        formula: "area_cm2 * 0.0001",
        factoryFormula: "area_cm2 * 0.0001",
        category: "Hydraulic",
        units: "m²",
        sourceClassification: "First Principles",
        description: "Converts projected planar geometric electrode area from cm² to standard SI units (m²).",
        applicableBasis: "Geometric Unit Conversion",
        author: "Core Registry",
        dateModified: new Date("2026-02-05").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            area_cm2: { unit: "cm²", label: "Projected Area", default: 350.0 }
        },
        dependencyChain: ["Total Active Surface Area", "Current Density", "Carbon Mass Sizing"]
    },
    {
        id: "EQ-09-02",
        name: "Total Active Stack Surface Area",
        formula: "cellPairs * (electrodeArea_cm2 * 0.0001) * 2",
        factoryFormula: "cellPairs * (electrodeArea_cm2 * 0.0001) * 2",
        category: "Hydraulic",
        units: "m²",
        sourceClassification: "First Principles",
        description: "Calculates cumulative active planar geometric electrode surface area across both anode and cathode faces.",
        applicableBasis: "Stack Geometric Dimensioning",
        author: "Core Registry",
        dateModified: new Date("2026-02-05").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellPairs: { unit: "pairs", label: "Number of Cell Pairs", default: 68 },
            electrodeArea_cm2: { unit: "cm²", label: "Single Electrode Area", default: 350.0 }
        },
        dependencyChain: ["Faraday Charge Capacity", "Total Carbon Mass", "Stack Envelope Sizing"]
    },
    {
        id: "EQ-09-03A",
        name: "Active Stack Core Layer Height",
        formula: "cellPairs * (electrodeThickness + spacerThickness + membraneThickness)",
        factoryFormula: "cellPairs * (electrodeThickness + spacerThickness + membraneThickness)",
        category: "Hydraulic",
        units: "mm",
        sourceClassification: "First Principles",
        description: "Calculates physical height of active repeating electrochemical core stack composed strictly of electrodes, spacers, and membranes.",
        applicableBasis: "Active Core Geometry Definition",
        author: "Core Registry",
        dateModified: new Date("2026-02-05").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellPairs: { unit: "pairs", label: "Number of Cell Pairs", default: 68 },
            electrodeThickness: { unit: "mm", label: "Electrode Thickness", default: 0.60 },
            spacerThickness: { unit: "mm", label: "Spacer Channel Gap", default: 0.50 },
            membraneThickness: { unit: "mm", label: "Ion Exchange Membrane Thickness", default: 0.15 }
        },
        dependencyChain: ["Assembly Envelope Height", "Manifold Routing", "Stack Mechanical Compression"]
    },
    {
        id: "EQ-09-03B",
        name: "Total Stack Assembly Envelope Height",
        formula: "(cellPairs * cellPitch) + endPlateThickness",
        factoryFormula: "(cellPairs * cellPitch) + endPlateThickness",
        category: "Hydraulic",
        units: "mm",
        sourceClassification: "First Principles",
        description: "Overall external physical height envelope of completed stack assembly including structural endplates and current collectors.",
        applicableBasis: "External Envelope Geometry Definition",
        author: "Core Registry",
        dateModified: new Date("2026-02-05").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellPairs: { unit: "pairs", label: "Number of Cell Pairs", default: 68 },
            cellPitch: { unit: "mm", label: "Unit Cell Assembly Pitch", default: 2.00 },
            endPlateThickness: { unit: "mm", label: "Dual Endplate & Collector Thickness", default: 40.0 }
        },
        dependencyChain: ["Enclosure Sizing", "Skid Layout", "Structural Engineering"]
    },
    {
        id: "EQ-09-04",
        name: "Total Electrode Carbon Mass",
        formula: "2 * cellPairs * (electrodeArea_cm2 * 0.0001) * (thickness / 1000) * density * (1 - porosity)",
        factoryFormula: "2 * cellPairs * (electrodeArea_cm2 * 0.0001) * (thickness / 1000) * density * (1 - porosity)",
        category: "Mass Transfer",
        units: "kg",
        sourceClassification: "First Principles",
        description: "Net dry solid porous carbon adsorbent mass packaged across all paired anode and cathode active layers.",
        applicableBasis: "Solid Adsorbent Mass Inventory",
        author: "Core Registry",
        dateModified: new Date("2026-02-05").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellPairs: { unit: "pairs", label: "Number of Cell Pairs", default: 68 },
            electrodeArea_cm2: { unit: "cm²", label: "Electrode Area", default: 350.0 },
            thickness: { unit: "mm", label: "Electrode Layer Thickness", default: 0.60 },
            density: { unit: "kg/m³", label: "Skeletal Carbon Density", default: 2000.0 },
            porosity: { unit: "fraction", label: "Electrode Porosity", default: 0.65 }
        },
        dependencyChain: ["Cycle-Integrated SAC", "Stack Mass Sizing", "Carbon Replacement Sizing"]
    },

    // =========================================================================
    // DOMAIN 10 — TRANSIENT DYNAMICS & CYCLE SAC (4 Equations)
    // =========================================================================
    {
        id: "EQ-10-01",
        name: "Operational Batch Cycle Time",
        formula: "t_adsorption + t_desorption + t_rinse",
        factoryFormula: "t_adsorption + t_desorption + t_rinse",
        category: "Performance",
        units: "minutes",
        sourceClassification: "Engineering Model",
        description: "Total elapsed operational batch period summing electrosorptive purification, desorption, and flush rinse steps.",
        applicableBasis: "Cyclic Batch Desalination",
        author: "Core Registry",
        dateModified: new Date("2026-02-08").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            t_adsorption: { unit: "min", label: "Adsorption Half-Cycle", default: 5.0 },
            t_desorption: { unit: "min", label: "Desorption Regeneration Step", default: 3.0 },
            t_rinse: { unit: "min", label: "Flushing Rinse Step", default: 0.5 }
        },
        dependencyChain: ["Average Throughput Capacity", "Specific Yield", "Duty Cycle Optimization"]
    },
    {
        id: "EQ-10-02",
        name: "Transient Concentration Response Profile",
        formula: "feedTds - (feedTds - targetTds) * (1 - exp(-t / tau))",
        factoryFormula: "feedTds - (feedTds - targetTds) * (1 - exp(-t / tau))",
        category: "Performance",
        units: "mg/L",
        sourceClassification: "First Principles",
        description: "Continuous dynamic effluent TDS breakthrough curve governed by 1st-order electrosorption mass-transfer kinetics.",
        applicableBasis: "Dynamic Adsorption Kinetics",
        author: "Core Registry",
        dateModified: new Date("2026-02-08").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            feedTds: { unit: "mg/L", label: "Feed Inflow TDS", default: 500.0 },
            targetTds: { unit: "mg/L", label: "Steady-State Target TDS", default: 49.8 },
            t: { unit: "min", label: "Elapsed Time", default: 2.0 },
            tau: { unit: "min", label: "Hydraulic Time Constant", default: 0.85 }
        },
        dependencyChain: ["Dynamic Breakthrough Curve", "Transient Control Loop", "Cycle Step Switching"]
    },
    {
        id: "EQ-10-03",
        name: "Cycle-Integrated Salt Adsorption Capacity (SAC)",
        formula: "((tdsIn - tdsOut) * (flowRate / 60) * (adsorptionTime * 60)) / (totalCarbonMass * 1000)",
        factoryFormula: "((tdsIn - tdsOut) * (flowRate / 60) * (adsorptionTime * 60)) / (totalCarbonMass * 1000)",
        category: "Mass Transfer",
        units: "mg/g",
        sourceClassification: "First Principles",
        description: "Gravimetric Salt Adsorption Capacity (mg NaCl captured per gram of dry porous carbon) integrated over adsorption cycle.",
        applicableBasis: "Electrochemical Adsorption Metric",
        author: "Core Registry",
        dateModified: new Date("2026-02-08").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            tdsIn: { unit: "mg/L", label: "Influent TDS", default: 500.0 },
            tdsOut: { unit: "mg/L", label: "Effluent TDS", default: 49.8 },
            flowRate: { unit: "L/min", label: "Volumetric Rate", default: 10.0 },
            adsorptionTime: { unit: "min", label: "Adsorption Duration", default: 5.0 },
            totalCarbonMass: { unit: "kg", label: "Total Carbon Adsorbent Mass", default: 2.50 }
        },
        dependencyChain: ["Electrode Material Utilization", "Cycle Optimization", "Technology Comparison Matrix"]
    },
    {
        id: "EQ-10-04",
        name: "Coulombic Cycle Efficiency",
        formula: "(chargeDesorbed / chargeAdsorbed) * 100",
        factoryFormula: "(chargeDesorbed / chargeAdsorbed) * 100",
        category: "Electrochemical",
        units: "%",
        sourceClassification: "First Principles",
        description: "Charge reversibility efficiency evaluating fractional Coulombs returned during desorption relative to Coulombs passed during adsorption.",
        applicableBasis: "Cycle Charge Conservation",
        author: "Core Registry",
        dateModified: new Date("2026-02-08").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            chargeDesorbed: { unit: "Coulombs", label: "Charge Released during Desorption", default: 535.0 },
            chargeAdsorbed: { unit: "Coulombs", label: "Charge Passed during Adsorption", default: 594.0 }
        },
        dependencyChain: ["Parasitic Faradaic Side Reactions", "Electrode Degradation", "Energy Recovery Factor"]
    },

    // =========================================================================
    // DOMAIN 11 — MANDATORY ACCEPTANCE CONSTRAINTS (3 Equations)
    // =========================================================================
    {
        id: "EQ-11-01",
        name: "Product Water Quality Limit Compliance",
        formula: "productTds <= targetTds ? 1 : 0",
        factoryFormula: "productTds <= targetTds ? 1 : 0",
        category: "Performance",
        units: "compliance",
        sourceClassification: "Design Constraint",
        description: "Mandatory compliance check verifying effluent product salinity satisfies customer target setpoint.",
        applicableBasis: "Product Specification Compliance",
        author: "Core Registry",
        dateModified: new Date("2026-02-10").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            productTds: { unit: "mg/L", label: "Predicted Product TDS", default: 49.8 },
            targetTds: { unit: "mg/L", label: "Target Setpoint Limit", default: 50.0 }
        },
        dependencyChain: ["Final Engineering Acceptance Gate", "Feasibility Ranking Engine"]
    },
    {
        id: "EQ-11-02",
        name: "Water Recovery Floor Constraint",
        formula: "recovery >= 95.0 ? 1 : 0",
        factoryFormula: "recovery >= 95.0 ? 1 : 0",
        category: "Performance",
        units: "compliance",
        sourceClassification: "Design Constraint",
        description: "Mandatory compliance condition ensuring designed water recovery meets or exceeds minimum threshold.",
        applicableBasis: "Water Conservation Compliance",
        author: "Core Registry",
        dateModified: new Date("2026-02-10").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            recovery: { unit: "%", label: "Derived Water Recovery", default: 95.2 }
        },
        dependencyChain: ["Final Engineering Acceptance Gate", "Technology Selection Tree"]
    },
    {
        id: "EQ-11-03",
        name: "Cell Voltage Upper Operating Bound",
        formula: "cellVoltage <= 1.60 ? 1 : 0",
        factoryFormula: "cellVoltage <= 1.60 ? 1 : 0",
        category: "Electrical",
        units: "compliance",
        sourceClassification: "Design Constraint",
        description: "Safety ceiling gate guarding against water hydrolysis / electrolysis breakdown and Faradaic carbon oxidation.",
        applicableBasis: "Electrochemical Stability Limit",
        author: "Core Registry",
        dateModified: new Date("2026-02-10").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            cellVoltage: { unit: "V", label: "Nominal Cell Pair Voltage", default: 1.40 }
        },
        dependencyChain: ["Faradaic Reaction Protection", "Electrode Lifespan Gate"]
    },

    // =========================================================================
    // DOMAIN 12 — EXTENDED THERMODYNAMICS & ADVANCED SCREENING (6 Equations)
    // =========================================================================
    {
        id: "EQ-EXT-01",
        name: "Stack Resistance (Ohm's Law)",
        formula: "V / I",
        factoryFormula: "V / I",
        category: "Electrical",
        units: "Ω",
        sourceClassification: "First Principles",
        description: "Total internal equivalent series resistance of stack assembly derived via Ohm's Law.",
        applicableBasis: "Direct-Current Internal Resistance",
        author: "Extended Registry",
        dateModified: new Date("2026-02-15").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            V: { unit: "V", label: "Total DC Voltage", default: 95.2 },
            I: { unit: "A", label: "Current", default: 1.98 }
        },
        dependencyChain: ["I²R Joule Heating", "Overpotential Breakdown"]
    },
    {
        id: "EQ-EXT-02",
        name: "Hydraulic Residence Time",
        formula: "reactorVolume / (flowRate / 60000)",
        factoryFormula: "reactorVolume / (flowRate / 60000)",
        category: "Hydraulic",
        units: "seconds",
        sourceClassification: "First Principles",
        description: "Mean hydrodynamic contact residence time of water parcels traveling through active interstitial channel void volume.",
        applicableBasis: "Plug-Flow Residence Dynamics",
        author: "Extended Registry",
        dateModified: new Date("2026-02-15").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            reactorVolume: { unit: "m³", label: "Active Channel Void Volume", default: 0.00595 },
            flowRate: { unit: "L/min", label: "Feed Flow Rate", default: 10.0 }
        },
        dependencyChain: ["Mass Transfer Boundary Layer", "Demineralization Extent"]
    },
    {
        id: "EQ-EXT-04",
        name: "Simplified Osmotic Minimum Work Estimate (Dilute Screening)",
        formula: "2 * 8.314 * (273.15 + temp) * ((tdsIn - tdsOut) / 58440) * 0.0002778",
        factoryFormula: "2 * 8.314 * (273.15 + temp) * ((tdsIn - tdsOut) / 58440) * 0.0002778",
        category: "Electrochemical",
        units: "kWh/m³",
        sourceClassification: "First Principles",
        description: "Theoretical thermodynamic minimum work of separation for univalent NaCl solution based on van 't Hoff osmotic equilibrium.",
        applicableBasis: "Reversible Thermodynamic Limit",
        author: "Extended Registry",
        dateModified: new Date("2026-02-15").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            temp: { unit: "°C", label: "Water Temperature", default: 25.0 },
            tdsIn: { unit: "mg/L", label: "Feed TDS", default: 500.0 },
            tdsOut: { unit: "mg/L", label: "Product TDS", default: 49.8 }
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
        description: "Second-law thermodynamic efficiency evaluating actual specific energy consumption against theoretical reversible separation limit.",
        applicableBasis: "Second-Law Thermodynamic Performance",
        author: "Extended Registry",
        dateModified: new Date("2026-02-15").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            thermodynamicMinWork: { unit: "kWh/m³", label: "Thermodynamic Minimum Work", default: 0.052 },
            netSEC: { unit: "kWh/m³", label: "Process Net SEC", default: 0.264 }
        },
        dependencyChain: ["Exergy Rating", "Technology Efficiency Comparison"]
    },
    {
        id: "EQ-EXT-10",
        name: "Multi-Objective Penalty Function",
        formula: "SEC + 0.5 * ((targetTds - outletTds) > 0 ? (targetTds - outletTds) : 0)",
        factoryFormula: "SEC + 0.5 * ((targetTds - outletTds) > 0 ? (targetTds - outletTds) : 0)",
        category: "Optimization",
        units: "cost unit",
        sourceClassification: "Design Constraint",
        description: "Pareto objective cost function balancing specific energy minimization against penalties for target TDS overshoot.",
        applicableBasis: "Multi-Objective Pareto Optimization",
        author: "Extended Registry",
        dateModified: new Date("2026-02-15").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            SEC: { unit: "kWh/m³", label: "Net SEC", default: 0.264 },
            targetTds: { unit: "mg/L", label: "Target Setpoint", default: 50.0 },
            outletTds: { unit: "mg/L", label: "Predicted Outlet Salinity", default: 49.8 }
        },
        dependencyChain: ["Pareto Frontier Generation", "Automatic Parameter Tuning"]
    },
    {
        id: "EQ-EXT-11",
        name: "Technology Screening Suitability Index",
        formula: "0.40 * (1 / (netSEC + 0.01)) + 0.35 * (waterRecovery / 100) + 0.25 * (saltRemovalEfficiency / 100)",
        factoryFormula: "0.40 * (1 / (netSEC + 0.01)) + 0.35 * (waterRecovery / 100) + 0.25 * (saltRemovalEfficiency / 100)",
        category: "Optimization",
        units: "index",
        sourceClassification: "Engineering Model",
        description: "Weighted composite multi-criteria engineering score ranking eligible candidate technologies by energy efficiency, recovery yield, and salt rejection.",
        applicableBasis: "Multi-Criteria Decision Analysis",
        author: "Extended Registry",
        dateModified: new Date("2026-02-15").toISOString(),
        version: "1.1.0",
        status: "Factory",
        isCustom: false,
        isModified: false,
        enabled: true,
        variableUnits: {
            netSEC: { unit: "kWh/m³", label: "Net Specific Energy", default: 0.264 },
            waterRecovery: { unit: "%", label: "Water Recovery", default: 95.2 },
            saltRemovalEfficiency: { unit: "%", label: "Salt Demineralization", default: 90.0 }
        },
        dependencyChain: ["Autonomous Technology Selection", "Recommendation Hierarchy"]
    }
];

export default DEFAULT_EQUATIONS_DATABASE;
