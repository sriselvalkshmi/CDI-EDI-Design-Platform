"use strict";

/**
 * Authoritative Engineering Fundamentals for Electrochemical Desalination Technologies
 * CDI, MCDI, FCDI, EDI
 * Single source of truth for qualitative concepts, operating principles, and process topologies.
 */

export const TECHNOLOGY_FUNDAMENTALS = {
    CDI: {
        name: "Capacitive Deionization (CDI)",
        operatingPrinciple: "Non-Faradaic electrosorption of dissolved ions into the electrical double layers (EDLs) formed inside porous carbon electrodes under an applied low-voltage DC electric field (typically < 1.2–1.4 V).",
        electrodeConfiguration: "Fixed porous carbon electrodes (e.g., activated carbon cloth, monolithic carbon, carbon aerogels) attached to current collectors.",
        membraneConfiguration: "NONE (Membrane-free architecture; feed water directly contacts porous carbon electrode surfaces).",
        feedWaterFlowDirection: "Flow-between or flow-through along the fixed porous electrode channels during the adsorption step.",
        productWaterFlowPath: "Treated desalinated water collected from cell channel outlet during the charging (adsorption) phase.",
        concentrateRejectFlowPath: "Concentrated waste brine stream discharged during the electrical zero-voltage or reverse-polarity desorption phase.",
        electricalPolarity: "Cyclic DC potential (0.8–1.4 V forward charging during adsorption; 0 V short-circuit or -0.8 to -1.2 V reverse potential during desorption).",
        ionTransportDirection: "Cations migrate directly to cathode EDL; anions migrate directly to anode EDL (subject to co-ion expulsion during initial charging).",
        desalinationMechanism: "Electrosorption into pore EDLs driven by electrostatic attraction without Faradaic chemical reactions.",
        regenerationMechanism: "Cyclic discharge / desorption achieved by zero-voltage short-circuiting or reverse electrical potential.",
        operationType: "Cyclic Batch Operation (alternating adsorption and desorption cycles).",
        pretreatmentRequirements: "Suspended solids filtration (5 µm cartridge filter) to prevent pore fouling; anti-scalant or hardness control if feed scaling risk is high.",
        operatingEnvelope: "Low-salinity feed water (typically 100–1,000 mg/L TDS; max validated ~3,000 mg/L TDS).",
        literatureRange: { min: 100, max: 1000, unit: "mg/L TDS", source: "Porada et al., 2013" },
        projectValidatedRange: { min: 100, max: 1000, unit: "mg/L TDS", status: "Literature-Supported" },
        pedigree: "LITERATURE_SUPPORTED",
        advantages: [
            "No ion-exchange membranes required (lower initial CAPEX)",
            "Simple stack construction and low hydraulic pressure drop",
            "Effective for low-salinity streams"
        ],
        limitations: [
            "Co-ion expulsion reduces charge efficiency (typically 40–70%)",
            "Inherent cyclic batch operation requires stream switching",
            "Susceptible to pore clogging and scaling on porous electrode matrix"
        ]
    },

    MCDI: {
        name: "Membrane Capacitive Deionization (MCDI)",
        operatingPrinciple: "Membrane-assisted electrosorption with fixed porous carbon electrodes where an Anion Exchange Membrane (AEM) is placed adjacent to the positive anode (+) and a Cation Exchange Membrane (CEM) is placed adjacent to the negative cathode (-). During charging, anions migrate through the AEM to the anode and cations through the CEM to the cathode, suppressing co-ion expulsion.",
        electrodeConfiguration: "Fixed porous carbon electrodes (cathode and anode) attached to stationary current collectors.",
        membraneConfiguration: "Ion-exchange membranes: AEM adjacent to anode (+); CEM adjacent to cathode (-).",
        feedWaterFlowDirection: "Flow-between desalination channel bounded by AEM and CEM sheets.",
        productWaterFlowPath: "High-purity desalinated product water produced during the charging (adsorption) phase.",
        concentrateRejectFlowPath: "Concentrated brine reject stream produced during zero-voltage short-circuit or Reverse Polarity Desorption (RPD) phase.",
        electricalPolarity: "Cyclic DC potential (1.0–1.6 V forward charging during adsorption; 0 V or reverse -0.2 to -1.2 V potential during desorption).",
        ionTransportDirection: "Cations pass through CEM into cathode EDL; anions pass through AEM into anode EDL. Co-ions are trapped inside electrode pore fluid, preventing co-ion expulsion.",
        desalinationMechanism: "Membrane-assisted electrosorption with 100% theoretical co-ion expulsion blocking.",
        regenerationMechanism: "Reverse Polarity Desorption (RPD) or voltage zeroing yielding high charge efficiency (> 85–95%) and 20% energy recovery.",
        operationType: "Cyclic Batch Operation (alternating adsorption and desorption cycles; reverse polarity desorption enabled by membranes).",
        pretreatmentRequirements: "Pre-filtration (5 µm cartridge filter), turbidity < 1 NTU, anti-scalant or softening if feed hardness is elevated.",
        operatingEnvelope: "Low-to-medium salinity brackish feed water (typically 100–3,000 mg/L TDS; max validated ~5,000 mg/L TDS).",
        literatureRange: { min: 100, max: 3000, unit: "mg/L TDS", source: "Zhao et al. 2012; Dykstra et al. 2016" },
        projectValidatedRange: { min: 500, max: 3000, unit: "mg/L TDS", status: "First-Principles Validated" },
        pedigree: "FIRST_PRINCIPLES",
        advantages: [
            "High charge efficiency (typically > 85–95%) due to co-ion expulsion prevention",
            "Higher salt adsorption capacity (SAC) and faster desorption kinetics",
            "Allows reverse polarity regeneration for enhanced desorption efficiency"
        ],
        limitations: [
            "Higher stack CAPEX due to cost of ion-exchange membrane sheets",
            "Membrane biofouling and organic/mineral scaling risks on membrane surfaces",
            "Requires cyclic stream switching between product and reject lines"
        ]
    },

    FCDI: {
        name: "Flow-Electrode Capacitive Deionization (FCDI)",
        operatingPrinciple: "Continuous desalination where feed water flows through a central desalination channel bounded by ion-exchange membranes. Two separate carbon-slurry electrode streams circulate on either side of the membranes. Ions migrate from the central feed through the appropriate membrane into the flowing slurry electrodes, which are regenerated externally in uncharging reservoirs.",
        electrodeConfiguration: "Flowing carbon slurry micro-electrodes circulating through slurry channels behind stationary current collectors.",
        membraneConfiguration: "CEM separating cathode slurry channel from central feed channel; AEM separating anode slurry channel from central feed channel.",
        feedWaterFlowDirection: "Central treated-water channel with continuous feed flow, physically separate from the two carbon slurry circulation loops.",
        productWaterFlowPath: "Continuous desalinated product water stream flowing out of the central feed channel.",
        concentrateRejectFlowPath: "Continuous concentrated brine / regenerated slurry stream from external slurry un-charging reservoir tanks or secondary cells.",
        electricalPolarity: "Continuous DC potential (1.0–1.8 V across flowing slurry micro-electrode channels via graphite current collectors).",
        ionTransportDirection: "Cations electromigrate continuously through CEM into cathode slurry; anions electromigrate continuously through AEM into anode slurry.",
        desalinationMechanism: "Continuous electrosorption onto mobile, suspended carbon slurry micro-particles in slurry channels.",
        regenerationMechanism: "Continuous external slurry regeneration (e.g., mixing anode and cathode slurries in external uncharged reservoir tanks or secondary discharge cells) without stopping desalination flow.",
        operationType: "Continuous Operation (uninterrupted desalination in main cell module).",
        pretreatmentRequirements: "Fine filtration for feed water; slurry formulation, pH, and viscosity control for carbon loops.",
        operatingEnvelope: "Medium-to-high salinity feed water (typically 1,000–15,000 mg/L TDS; scalable up to 50,000 mg/L TDS).",
        literatureRange: { min: 1000, max: 15000, unit: "mg/L TDS", source: "Jeon et al. 2013; Rommerskirchen et al. 2018" },
        projectValidatedRange: { min: 1000, max: 15000, unit: "mg/L TDS", status: "Literature-Supported" },
        pedigree: "LITERATURE_SUPPORTED",
        advantages: [
            "Continuous uninterrupted product water production (eliminates batch cycle switching)",
            "No carbon adsorption saturation limit inside the stack (scalable by external slurry volume)",
            "Capable of handling higher feed salinities (brackish to high-salinity brines)"
        ],
        limitations: [
            "Higher energy demand for pumping viscous carbon slurry streams",
            "Slurry viscosity, carbon particle settling, and potential clogging in channels",
            "Membrane abrasion from circulating slurry particles"
        ]
    },

    EDI: {
        name: "Electrodeionization (EDI)",
        operatingPrinciple: "Continuous electrochemical deionization combining ion-exchange membranes and mixed-bed ion-exchange resin beads driven by a continuous DC electric field, with continuous in-situ H+/OH- water splitting auto-regeneration.",
        electrodeConfiguration: "Dedicated end anode (+) and cathode (-) electrode compartments contacting terminal electrode plates (e.g., MMO anode, stainless steel cathode).",
        membraneConfiguration: "Alternating array of AEM and CEM sheets creating alternating Dilute (product) and Concentrate (reject) compartments.",
        feedWaterFlowDirection: "Continuous parallel flow through Dilute compartments (resin-filled), Concentrate compartments, and dedicated Electrode Rinse compartments.",
        productWaterFlowPath: "Continuous high-purity or ultrapure water stream flowing out of Dilute resin-filled compartments.",
        concentrateRejectFlowPath: "Continuous concentrate reject stream carrying migrated ions out of Concentrate compartments (recirculated or wasted).",
        electricalPolarity: "Continuous high DC electric field (tens to hundreds of volts stack voltage; 1.0–6.0 V per cell pair; constant polarization field).",
        ionTransportDirection: "Ions exchange onto resin beads in Dilute channels, electromigrate through conductive resin bed under electric field, pass through AEM/CEM into Concentrate channels.",
        desalinationMechanism: "Hybrid ion exchange + continuous electromigration across resin matrix and ion-selective membranes.",
        regenerationMechanism: "Continuous in-situ electrochemical water splitting (H2O -> H+ + OH-) at resin-membrane interfaces continuously regenerating resin beads without chemical regenerants.",
        operationType: "Continuous Operation (no cyclic batch switching, no chemical regeneration pauses).",
        pretreatmentRequirements: "Reverse Osmosis (RO) pretreatment or equivalent feed conditioning (low TDS, low hardness < 1 ppm CaCO3, low TOC/silica) as appropriate for target application and module design.",
        operatingEnvelope: "Pre-conditioned low-TDS feed water (typically RO permeate feed, TDS < 30–50 mg/L; producing up to 18.2 MΩ·cm ultrapure water).",
        literatureRange: { min: 0.05, max: 30.0, unit: "mg/L TDS", source: "DuPont EDI-310 Vendor Spec; Glaeser et al. 2014" },
        projectValidatedRange: { min: 0.05, max: 30.0, unit: "mg/L TDS", status: "Literature-Supported Vendor Bound" },
        pedigree: "LITERATURE_SUPPORTED",
        advantages: [
            "Produces high-purity to ultrapure water continuously (up to 18.2 MΩ·cm resistivity)",
            "Chemical-free continuous operation (no hazardous acid/caustic regenerant chemicals)",
            "High removal of weakly ionized species (silica, boron, carbon dioxide)"
        ],
        limitations: [
            "Requires pre-conditioned low-TDS feed (typically RO permeate feed) to prevent scaling and excessive energy consumption",
            "Sensitive to hardness (Ca2+/Mg2+) and silica scaling in concentrate channels under high pH water-splitting conditions",
            "Complex multi-compartment fluid manifolds and electrode gas venting requirements"
        ]
    },

    ED: {
        name: "Electrodialysis (ED)",
        operatingPrinciple: "Continuous electrochemical transport where an applied DC electric field drives ions from alternating dilute feed channels through ion-selective membranes (CEM for cations, AEM for anions) into adjacent concentrate channels without resin beads.",
        electrodeConfiguration: "Terminal anode (+) and cathode (-) electrode compartments contacting platinized titanium or mixed metal oxide (MMO) electrodes with dedicated rinse streams.",
        membraneConfiguration: "Multi-cell repeating stack of alternating Cation Exchange Membranes (CEM) and Anion Exchange Membranes (AEM) separated by flow spacers.",
        feedWaterFlowDirection: "Continuous parallel flow through dilute and concentrate channels bounded by alternating CEM and AEM sheets.",
        productWaterFlowPath: "Continuous desalinated product water stream flowing out of dilute compartment manifold.",
        concentrateRejectFlowPath: "Continuous concentrated brine stream exiting concentrate compartment manifold (with optional recirculation loop).",
        electricalPolarity: "Continuous constant DC electric field (typically 0.8–1.5 V per cell pair; constant polarity during operation).",
        ionTransportDirection: "Cations electromigrate through CEM toward cathode; anions electromigrate through AEM toward anode; retention occurs in concentrate channels.",
        desalinationMechanism: "Electromigration across ion-selective membranes driven by applied electric field potential gradient.",
        regenerationMechanism: "Continuous process requiring no cyclic regeneration; periodic chemical cleaning-in-place (CIP) with dilute acid used to clear scale.",
        operationType: "Continuous Operation (steady-state dilute and concentrate flows).",
        pretreatmentRequirements: "Cartridge filtration (5–10 µm), turbidity < 1 NTU, acid or antiscalant dosing required if feed Langelier Saturation Index (LSI) > 0.2.",
        operatingEnvelope: "Medium-to-high salinity brackish water (typically 1,000–12,000 mg/L TDS; max validated ~15,000 mg/L TDS).",
        literatureRange: { min: 500, max: 12000, unit: "mg/L TDS", source: "Strathmann 2004; Valero et al. 2011" },
        projectValidatedRange: { min: 1000, max: 12000, unit: "mg/L TDS", status: "First-Principles Validated" },
        pedigree: "FIRST_PRINCIPLES",
        advantages: [
            "Continuous high water recovery (85–94%) across moderate-to-high salinity brackish water",
            "Proven industrial track record with long membrane service lifetime",
            "High concentration factor capability in concentrate stream"
        ],
        limitations: [
            "Susceptible to mineral scaling on membrane surfaces without acid or antiscalant dosing",
            "Subject to Sherwood limiting current density (I_lim) polarization boundaries",
            "Requires chemical cleaning (CIP) intervals"
        ]
    },

    EDR: {
        name: "Electrodialysis Reversal (EDR)",
        operatingPrinciple: "Self-cleaning electrodialysis process where the DC electric field polarity is periodically reversed (every 15–45 minutes) alongside automated 4-way valve stream switching. Polarity reversal dissolves colloidal fouling and mineral scale in-situ, eliminating continuous acid/antiscalant dosing.",
        electrodeConfiguration: "Dual reversible mixed metal oxide (MMO) electrodes capable of operating alternately as anode and cathode without accelerated degradation.",
        membraneConfiguration: "Symmetric multi-cell repeating stack of alternating CEM and AEM membranes separated by identical reversible flow spacers.",
        feedWaterFlowDirection: "Reversible flow channels where dilute and concentrate streams swap identities upon automated 4-way valve inversion.",
        productWaterFlowPath: "Desalinated product water stream flowing out of active dilute channels, routed to product tank via 3-way flush divert valve.",
        concentrateRejectFlowPath: "Concentrated brine reject stream routed to discharge, plus 60–120s transition flush water diverted to waste after each reversal.",
        electricalPolarity: "Periodic reversible DC potential (+V_stack in forward phase, -V_stack in reversed phase; switched every 15–45 minutes).",
        ionTransportDirection: "Reverses direction every cycle: ions move out of active dilute channels and into active concentrate channels under the prevailing field.",
        desalinationMechanism: "Electromigration across ion-selective membranes with periodic polarity inversion for in-situ scale dissolution.",
        regenerationMechanism: "In-situ self-cleaning scale dissolution induced by local pH shift and concentration reversal during polarity switching.",
        operationType: "Periodic Reversing Continuous Operation (continuous feed with automated stream inversion and short flush purge).",
        pretreatmentRequirements: "Cartridge filtration (10 µm); tolerant to higher hardness (up to 800 mg/L) and scaling indices (LSI up to +2.0) without acid dosing.",
        operatingEnvelope: "High-scaling brackish water (typically 1,000–15,000 mg/L TDS; hardness up to 800 mg/L as CaCO3).",
        literatureRange: { min: 500, max: 15000, unit: "mg/L TDS", source: "Allison 1993; SUEZ EDR Engineering Handbook" },
        projectValidatedRange: { min: 1000, max: 15000, unit: "mg/L TDS", status: "First-Principles Validated" },
        pedigree: "FIRST_PRINCIPLES",
        advantages: [
            "In-situ scale dissolution eliminates or drastically minimizes continuous acid and antiscalant addition",
            "High tolerance for elevated feed hardness (up to 800 mg/L) and supersaturated silica/calcium salts",
            "Extended membrane life and reduced chemical cleaning (CIP) frequency"
        ],
        limitations: [
            "Transition flush purge volume reduces net water recovery by 5–8% compared to standard ED",
            "Requires automated 4-way and 3-way actuated reversing valves and MMO electrodes",
            "Slightly higher instrumentation and valve maintenance requirements"
        ]
    }
};

export default TECHNOLOGY_FUNDAMENTALS;
