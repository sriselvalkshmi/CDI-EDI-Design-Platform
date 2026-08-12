"use strict";

/**
 * Authoritative Engineering Fundamentals for Electrochemical Desalination Technologies
 * CDI, MCDI, FCDI, EDI
 * Single source of truth for qualitative concepts, operating principles, and process topologies.
 */

export const TECHNOLOGY_FUNDAMENTALS = {
    CDI: {
        name: "Capacitive Deionization (CDI)",
        principle: "Electrosorption of dissolved ions into the electrical double layers (EDLs) formed inside porous carbon electrodes under an applied low-voltage DC electric field (typically < 1.2–1.4 V).",
        electrodeConfiguration: "Fixed porous carbon electrodes (e.g., activated carbon cloth, monolithic carbon, aerogels) attached to current collectors.",
        membraneConfiguration: "NONE (Membrane-free architecture; feed water directly contacts porous carbon electrode surfaces).",
        flowConfiguration: "Feed water flows through or between electrode channels; operation is inherently cyclic (alternating electrosorption/desalination and desorption/regeneration phases).",
        ionTransport: "Electrostatic migration of cations and anions directly into cathode and anode EDLs. Subject to co-ion expulsion penalty during initial charging.",
        regenerationMode: "Cyclic discharge / desorption achieved by zero-voltage short-circuiting or reverse electrical potential.",
        advantages: [
            "No ion-exchange membranes required (lower initial CAPEX)",
            "Simple stack construction and low hydraulic pressure drop",
            "Effective for low-salinity streams"
        ],
        limitations: [
            "Co-ion expulsion reduces charge efficiency (typically 40–70%)",
            "Inherent cyclic batch operation requires stream switching",
            "Susceptible to pore clogging and scaling on porous electrode matrix"
        ],
        pretreatment: "Suspended solids filtration (5 µm cartridge filter) to prevent pore fouling; anti-scalant or hardness control if feed scaling risk is high."
    },

    MCDI: {
        name: "Membrane Capacitive Deionization (MCDI)",
        principle: "Membrane-assisted electrosorption where Cation Exchange Membranes (CEM) and Anion Exchange Membranes (AEM) are placed in front of fixed porous carbon electrodes to eliminate co-ion expulsion.",
        electrodeConfiguration: "Fixed porous carbon electrodes (cathode and anode) attached to current collectors.",
        membraneConfiguration: "Ion-exchange membranes: CEM in front of cathode; AEM in front of anode.",
        flowConfiguration: "Treated-water flow through channels bounded by ion-exchange membranes; cyclic operation (charging desalination phase and discharging regeneration phase).",
        ionTransport: "Cations pass through CEM into cathode EDL; anions pass through AEM into anode EDL. Co-ions are trapped inside electrode pore fluid during desorption, blocking co-ion expulsion.",
        regenerationMode: "Fast desorption by voltage zeroing or reverse-polarity electrical potential without re-adsorbing co-ions.",
        advantages: [
            "High charge efficiency (typically > 85–95%) due to co-ion expulsion prevention",
            "Higher salt adsorption capacity (SAC) and faster desorption kinetics",
            "Allows reverse polarity regeneration for enhanced desorption efficiency"
        ],
        limitations: [
            "Higher stack CAPEX due to cost of ion-exchange membrane sheets",
            "Membrane biofouling and organic/mineral scaling risks on membrane surfaces",
            "Requires cyclic stream switching between product and reject lines"
        ],
        pretreatment: "Pre-filtration (cartridge/multimedia filter), turbidity < 1 NTU, anti-scalant or softening if feed hardness is elevated."
    },

    FCDI: {
        name: "Flow-Electrode Capacitive Deionization (FCDI)",
        principle: "Continuous desalination utilizing pumpable carbon slurry electrodes (suspended carbon particles in aqueous electrolyte) flowing continuously behind ion-exchange membranes.",
        electrodeConfiguration: "Flowing carbon slurry micro-electrodes circulating through slurry channels behind stationary current collectors.",
        membraneConfiguration: "CEM separating cathode slurry channel from central water feed; AEM separating anode slurry channel from central water feed.",
        flowConfiguration: "Continuous dual-loop flow: separate central treated-water channel with continuous feed flow + external circulating anode and cathode slurry electrode loops.",
        ionTransport: "Ions electromigrate continuously from central water channel through CEM/AEM into mobile, suspended carbon slurry particles.",
        regenerationMode: "Continuous external slurry regeneration (e.g., mixing/discharge in external uncharged reservoir tanks or secondary discharge cells) without stopping desalination flow.",
        advantages: [
            "Continuous uninterrupted product water production (eliminates batch cycle switching)",
            "No carbon adsorption saturation limit inside the stack (scalable by external slurry volume)",
            "Capable of handling higher feed salinities (brackish to high-salinity brines)"
        ],
        limitations: [
            "Higher energy demand for pumping viscous carbon slurry streams",
            "Slurry viscosity, carbon particle settling, and potential clogging in channels",
            "Membrane abrasion from circulating slurry particles"
        ],
        pretreatment: "Fine filtration for feed water; slurry formulation, pH, and viscosity control for carbon loops."
    },

    EDI: {
        name: "Electrodeionization (EDI)",
        principle: "Continuous electrochemical deionization combining ion-exchange membranes and mixed-bed ion-exchange resin beads driven by a continuous DC electric field, with continuous in-situ H+/OH- water splitting auto-regeneration.",
        electrodeConfiguration: "Dedicated end anode (+) and cathode (-) electrode compartments contacting terminal electrode plates (e.g., MMO anode, stainless steel cathode).",
        membraneConfiguration: "Alternating array of AEM and CEM sheets creating alternating Dilute (product) and Concentrate (reject) compartments.",
        flowConfiguration: "Continuous parallel flow through Dilute compartments (resin-filled), Concentrate compartments, and dedicated Electrode Rinse compartments.",
        ionTransport: "Ions exchange onto resin beads in Dilute channels, electromigrate through conductive resin matrix under electric field, pass through AEM/CEM into Concentrate channels.",
        regenerationMode: "Continuous in-situ electrochemical water splitting (H2O -> H+ + OH-) at resin-membrane interfaces continuously regenerating resin beads without chemical regenerants.",
        advantages: [
            "Produces high-purity to ultrapure water continuously (up to 18.2 MΩ·cm resistivity)",
            "Chemical-free continuous operation (no hazardous acid/caustic regenerant chemicals)",
            "High removal of weakly ionized species (silica, boron, carbon dioxide)"
        ],
        limitations: [
            "Requires pre-conditioned low-TDS feed (typically RO permeate feed) to prevent scaling and excessive energy consumption",
            "Sensitive to hardness (Ca2+/Mg2+) and silica scaling in concentrate channels under high pH water-splitting conditions",
            "Complex multi-compartment fluid manifolds and electrode gas venting requirements"
        ],
        pretreatment: "Reverse Osmosis (RO) pretreatment or equivalent feed conditioning (low TDS, low hardness < 1 ppm CaCO3, low TOC/silica) as appropriate for target application and module design."
    }
};

export default TECHNOLOGY_FUNDAMENTALS;
