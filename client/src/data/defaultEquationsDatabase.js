export const DEFAULT_EQUATIONS_DATABASE = [
    // -------------------------------------------------------------
    // 1. ELECTRICAL CATEGORY
    // -------------------------------------------------------------
    {
        id: "eq_elec_01",
        name: "Power",
        formula: "V * I",
        category: "Electrical",
        units: "W",
        description: "Calculates instantaneous electric power consumed by the CDI/EDI cell or stack.",
        reference: { title: "Electrochemical Principles of CDI", year: "2024", doi: "10.1016/j.desal.2024.101" },
        author: "Administrator",
        dateModified: new Date("2026-01-15").toISOString(),
        version: "1.2.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },
    {
        id: "eq_elec_02",
        name: "Current Density",
        formula: "I / electrodeArea",
        category: "Electrical",
        units: "A/m²",
        description: "Determines operational current density per unit electrode surface area.",
        reference: { title: "Electrode Design for Capacitive Deionization", year: "2023" },
        author: "Administrator",
        dateModified: new Date("2026-01-20").toISOString(),
        version: "1.1.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },
    {
        id: "eq_elec_03",
        name: "Stack Resistance (Ohm's Law)",
        formula: "V / I",
        category: "Electrical",
        units: "Ω",
        description: "Calculates total electrical resistance across cell pairs and ionic solutions.",
        reference: { title: "EDI Cell Pair Impedance Analysis", year: "2025" },
        author: "Administrator",
        dateModified: new Date("2026-02-01").toISOString(),
        version: "1.0.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },

    // -------------------------------------------------------------
    // 2. HYDRAULIC CATEGORY
    // -------------------------------------------------------------
    {
        id: "eq_hyd_01",
        name: "Residence Time",
        formula: "reactorVolume / flowRate",
        category: "Hydraulic",
        units: "seconds",
        description: "Determines fluid residence time inside active treatment channels.",
        reference: { title: "Hydraulics of Thin Spacer Channels", year: "2024" },
        author: "Administrator",
        dateModified: new Date("2026-01-10").toISOString(),
        version: "1.3.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },
    {
        id: "eq_hyd_02",
        name: "Flow Velocity",
        formula: "flowRate / channelArea",
        category: "Hydraulic",
        units: "m/s",
        description: "Calculates average linear fluid velocity inside the spacer channel.",
        reference: { title: "Fluid Dynamics in EDI Modules", year: "2022" },
        author: "Administrator",
        dateModified: new Date("2026-01-12").toISOString(),
        version: "1.0.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },
    {
        id: "eq_hyd_03",
        name: "Pressure Drop",
        formula: "f * (L / D) * (rho * (v ^ 2) / 2)",
        category: "Hydraulic",
        units: "kPa",
        description: "Evaluates hydraulic friction pressure drop along stack spacer channel.",
        reference: { title: "Friction Losses in Narrow Channels", year: "2025" },
        author: "Administrator",
        dateModified: new Date("2026-02-10").toISOString(),
        version: "1.1.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },
    {
        id: "eq_hyd_04",
        name: "Pump Power",
        formula: "(flowRate * pressureDrop) / (3600 * pumpEfficiency)",
        category: "Hydraulic",
        units: "W",
        description: "Calculates mechanical pumping power required for feed solution delivery.",
        reference: { title: "Pump Efficiency Modeling", year: "2024" },
        author: "Administrator",
        dateModified: new Date("2026-02-12").toISOString(),
        version: "1.0.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },

    // -------------------------------------------------------------
    // 3. MASS TRANSFER CATEGORY
    // -------------------------------------------------------------
    {
        id: "eq_mass_01",
        name: "Salt Removal",
        formula: "tdsIn - tdsOut",
        category: "Mass Transfer",
        units: "mg/L",
        description: "Absolute reduction of Total Dissolved Solids between feed and outlet.",
        reference: { title: "Capacitive Deionization Fundamentals", year: "2024" },
        author: "Administrator",
        dateModified: new Date("2026-01-18").toISOString(),
        version: "2.0.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },
    {
        id: "eq_mass_02",
        name: "Salt Adsorption Capacity (SAC)",
        formula: "((tdsIn - tdsOut) * flowRate) / (cellPairs * electrodeArea * 0.0001)",
        category: "Mass Transfer",
        units: "mg/g",
        description: "Quantifies mass of dissolved salts adsorbed per gram of carbon electrode material.",
        reference: { title: "Electrode Salt Loading Capacity", year: "2025" },
        author: "Administrator",
        dateModified: new Date("2026-02-04").toISOString(),
        version: "1.0.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },

    // -------------------------------------------------------------
    // 4. ELECTROCHEMICAL CATEGORY
    // -------------------------------------------------------------
    {
        id: "eq_elem_01",
        name: "Charge Efficiency",
        formula: "(((tdsIn - tdsOut) * (flowRate / 3600) * 96485) / (58.44 * I * cellPairs)) * 100",
        category: "Electrochemical",
        units: "%",
        description: "Ratio of ionic charge removed to total electric charge passed.",
        reference: { title: "Faradaic Reactions and Charge Efficiency in CDI", year: "2023" },
        author: "Administrator",
        dateModified: new Date("2026-02-05").toISOString(),
        version: "1.4.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },
    {
        id: "eq_elem_02",
        name: "Coulombic Efficiency",
        formula: "(chargeDesorbed / chargeAdsorbed) * 100",
        category: "Electrochemical",
        units: "%",
        description: "Measures reversible charge recovery during desorption cycles.",
        reference: { title: "Reversibility in Electro-adsorption", year: "2025" },
        author: "Administrator",
        dateModified: new Date("2026-02-08").toISOString(),
        version: "1.0.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },

    // -------------------------------------------------------------
    // 5. PERFORMANCE CATEGORY
    // -------------------------------------------------------------
    {
        id: "eq_perf_01",
        name: "Removal Efficiency",
        formula: "((tdsIn - tdsOut) / tdsIn) * 100",
        category: "Performance",
        units: "%",
        description: "Percentage reduction of Total Dissolved Solids (TDS) across treatment module.",
        reference: { title: "Water Desalination Performance Standard", year: "2024" },
        author: "Administrator",
        dateModified: new Date("2026-01-08").toISOString(),
        version: "1.0.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },
    {
        id: "eq_perf_02",
        name: "Water Recovery Ratio",
        formula: "(purifiedFlowRate / totalFeedFlowRate) * 100",
        category: "Performance",
        units: "%",
        description: "Percentage of feed water recovered as high-purity product water.",
        reference: { title: "Industrial EDI System Optimization", year: "2025" },
        author: "Administrator",
        dateModified: new Date("2026-02-12").toISOString(),
        version: "1.1.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },

    // -------------------------------------------------------------
    // 6. ENERGY CATEGORY
    // -------------------------------------------------------------
    {
        id: "eq_eng_01",
        name: "Specific Energy Consumption (SEC)",
        formula: "power / purifiedFlowRate",
        category: "Energy",
        units: "kWh/m³",
        description: "Electric energy consumed per cubic meter of purified water produced.",
        reference: { title: "Energy Footprint of Desalination Technologies", year: "2024" },
        author: "Administrator",
        dateModified: new Date("2026-01-22").toISOString(),
        version: "2.1.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },

    // -------------------------------------------------------------
    // 7. ECONOMICS CATEGORY
    // -------------------------------------------------------------
    {
        id: "eq_econ_01",
        name: "Annual Energy Cost",
        formula: "(V * I / 1000) * 8760 * 0.12",
        category: "Economics",
        units: "$/year",
        description: "Estimated annual electricity cost assuming continuous operation at 0.12 $/kWh.",
        reference: { title: "Techno-Economic Modeling of Water Treatment", year: "2025" },
        author: "Administrator",
        dateModified: new Date("2026-02-18").toISOString(),
        version: "1.0.0",
        status: "Published",
        isCustom: false,
        enabled: true
    },

    // -------------------------------------------------------------
    // 8. OPTIMIZATION CATEGORY
    // -------------------------------------------------------------
    {
        id: "eq_opt_01",
        name: "Objective Function",
        formula: "SEC + 0.5 * ((targetTds - outletTds) > 0 ? (targetTds - outletTds) : 0)",
        category: "Optimization",
        units: "cost unit",
        description: "Multi-objective penalty function balancing low energy consumption and target TDS compliance.",
        reference: { title: "AI-Driven Optimization of Electrochemical Deionization", year: "2026" },
        author: "Administrator",
        dateModified: new Date("2026-02-25").toISOString(),
        version: "1.0.0",
        status: "Published",
        isCustom: false,
        enabled: true
    }
];

export default DEFAULT_EQUATIONS_DATABASE;
