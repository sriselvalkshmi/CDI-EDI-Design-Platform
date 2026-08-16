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
    }
};

export default TECHNOLOGY_FUNDAMENTALS;
