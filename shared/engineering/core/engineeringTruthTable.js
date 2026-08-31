"use strict";

/**
 * Authoritative Internal Engineering Truth Table for Desalination Technologies
 * Single Source of Truth across 18 columns for CDI, MCDI, FCDI, and EDI.
 * Categorizes all parameters across 6 explicit provenance tiers:
 * - FIRST_PRINCIPLES
 * - LITERATURE_SUPPORTED
 * - PROJECT_ASSUMPTION
 * - EXPERIMENTALLY_CALIBRATED
 * - EXTRAPOLATED
 * - VENDOR_SPECIFICATION
 */

export const ENGINEERING_TRUTH_TABLE = {
    CDI: {
        technology: "CDI",
        name: "Capacitive Deionization (CDI)",
        electrodeType: "Fixed Porous Carbon (Activated Carbon / Aerogel)",
        electrodeMobility: "Fixed Stationary Electrodes",
        aemPresent: false,
        cemPresent: false,
        ionExchangeResinPresent: false,
        primaryMechanism: "Electrical Double Layer (EDL) Non-Faradaic Electrosorption",
        ionTransportPath: "Cations migrate directly to Cathode (-) EDL; Anions migrate directly to Anode (+) EDL",
        feedFlowPath: "Flow-between or Flow-through porous carbon channel",
        electrodeFlowPath: "Direct fluid-electrode contact inside open spacer channel",
        regenerationMechanism: "Cyclic batch zero-voltage short-circuit or reverse-potential desorption",
        operationType: "Cyclic Batch Operation",
        typicalApplication: "Low-salinity brackish water desalination (100 – 1,000 mg/L TDS)",
        advantages: [
            "No ion-exchange membranes required (lower initial stack CAPEX) [LITERATURE_SUPPORTED]",
            "Simple flat-sheet / spiral stack design with minimal hydraulic resistance [LITERATURE_SUPPORTED]",
            "Energy-efficient electrosorption for low-TDS feedwater [FIRST_PRINCIPLES]"
        ],
        limitations: [
            "Co-ion expulsion reduces charge efficiency to 40–70% [LITERATURE_SUPPORTED]",
            "Finite carbon electrode salt-storage capacity (SAC) [FIRST_PRINCIPLES]",
            "Requires cyclic stream switching between desalinated product and reject brine [PROJECT_ASSUMPTION]"
        ],
        pretreatmentRequirements: "Suspended solids filtration (5 µm cartridge filter), oil/grease removal",
        currentModelEnvelope: { minTds: 100, maxTds: 1000, unit: "mg/L TDS", provenance: "PROJECT_ASSUMPTION" },
        literatureEnvelope: { minTds: 100, maxTds: 3000, unit: "mg/L TDS", source: "Porada et al., 2013", provenance: "LITERATURE_SUPPORTED" }
    },

    MCDI: {
        technology: "MCDI",
        name: "Membrane Capacitive Deionization (MCDI)",
        electrodeType: "Fixed Porous Carbon + Ion Exchange Membranes",
        electrodeMobility: "Fixed Stationary Electrodes",
        aemPresent: true,
        cemPresent: true,
        ionExchangeResinPresent: false,
        primaryMechanism: "Membrane-Assisted EDL Electrosorption with Co-ion Expulsion Suppression",
        ionTransportPath: "Anions → AEM → Anode (+) EDL; Cations → CEM → Cathode (-) EDL",
        feedFlowPath: "Flow-between desalination channel bounded by AEM and CEM sheets",
        electrodeFlowPath: "Stationary fluid behind ion-exchange membrane sheets",
        regenerationMechanism: "Reverse Polarity Desorption (RPD) or zero-voltage short-circuiting",
        operationType: "Cyclic Batch Operation",
        typicalApplication: "Low-to-medium salinity brackish water desalination (500 – 3,000 mg/L TDS)",
        advantages: [
            "High charge efficiency (> 85–95%) due to 100% co-ion expulsion blocking [FIRST_PRINCIPLES]",
            "Faster desorption kinetics and higher Salt Adsorption Capacity (SAC) [LITERATURE_SUPPORTED]",
            "20% Reverse Polarity Desorption (RPD) electrical energy recovery [LITERATURE_SUPPORTED]"
        ],
        limitations: [
            "Higher stack CAPEX due to cost of AEM and CEM membrane sheets [PROJECT_ASSUMPTION]",
            "Membrane biofouling and inorganic scaling risks on membrane surfaces [LITERATURE_SUPPORTED]",
            "Requires cyclic stream switching between product and reject lines [PROJECT_ASSUMPTION]"
        ],
        pretreatmentRequirements: "Pre-filtration (< 5 µm), turbidity < 1 NTU, anti-scalant or softening if feed hardness > 200 mg/L as CaCO3",
        currentModelEnvelope: { minTds: 500, maxTds: 3000, unit: "mg/L TDS", provenance: "PROJECT_ASSUMPTION" },
        literatureEnvelope: { minTds: 100, maxTds: 5000, unit: "mg/L TDS", source: "Zhao et al. 2012; Dykstra et al. 2016", provenance: "LITERATURE_SUPPORTED" }
    },

    FCDI: {
        technology: "FCDI",
        name: "Flow-Electrode Capacitive Deionization (FCDI)",
        electrodeType: "Flowing Conductive Carbon Slurry (Suspended Activated Carbon in Electrolyte)",
        electrodeMobility: "Flowing Continuous Slurry Electrodes",
        aemPresent: true,
        cemPresent: true,
        ionExchangeResinPresent: false,
        primaryMechanism: "Continuous Electrosorption onto Mobile Carbon Slurry Micro-particles",
        ionTransportPath: "Anions → AEM → Anode Slurry Loop; Cations → CEM → Cathode Slurry Loop",
        feedFlowPath: "Central treated-water channel physically separate from slurry circuits",
        electrodeFlowPath: "Two independent circulating carbon-slurry loops (Positive Anode & Negative Cathode)",
        regenerationMechanism: "Continuous external slurry uncharging / mixing in external reservoir tanks",
        operationType: "Continuous Operation",
        typicalApplication: "High-salinity brackish water & brine concentration (1,000 – 15,000+ mg/L TDS)",
        advantages: [
            "Continuous uninterrupted product water flow (no batch cycle switching) [LITERATURE_SUPPORTED]",
            "No electrode saturation limit inside cell stack (scalable by external carbon inventory) [FIRST_PRINCIPLES]",
            "Capable of continuous elevated-salinity desalination and brine concentration [LITERATURE_SUPPORTED]"
        ],
        limitations: [
            "Higher pumping SEC due to non-Newtonian viscous drag of carbon slurry [FIRST_PRINCIPLES]",
            "Carbon slurry settling, clogging, and hydraulic pressure drop losses [PROJECT_ASSUMPTION]",
            "Membrane hydrodynamic abrasion from circulating slurry particles [LITERATURE_SUPPORTED]"
        ],
        pretreatmentRequirements: "Fine feed filtration, carbon slurry formulation, viscosity and pH stabilization",
        currentModelEnvelope: { minTds: 1000, maxTds: 15000, unit: "mg/L TDS", provenance: "PROJECT_ASSUMPTION" },
        literatureEnvelope: { minTds: 1000, maxTds: 50000, unit: "mg/L TDS", source: "Jeon et al. 2013; Rommerskirchen et al. 2018; arXiv:2204.08897", provenance: "LITERATURE_SUPPORTED" }
    },

    EDI: {
        technology: "EDI",
        name: "Electrodeionization (EDI)",
        electrodeType: "Dedicated End Terminal Electrode Plates (MMO Anode, Stainless Steel Cathode)",
        electrodeMobility: "Stationary Terminal Electrodes",
        aemPresent: true,
        cemPresent: true,
        ionExchangeResinPresent: true,
        primaryMechanism: "Ion Exchange + Continuous Electromigration + Electrochemical Water Splitting",
        ionTransportPath: "Ions exchange onto resin beads in Dilute channels → electromigrate through conductive resin → pass AEM/CEM → Concentrate channel",
        feedFlowPath: "Continuous parallel flow through resin-filled Dilute product compartments",
        electrodeFlowPath: "Dedicated electrode rinse channels contacting terminal electrode plates",
        regenerationMechanism: "Continuous in-situ H+ / OH- electrochemical water splitting at resin-membrane interfaces",
        operationType: "Continuous Operation",
        typicalApplication: "Ultrapure water polishing from pre-treated RO permeate (0.05 – 30.0 mg/L TDS)",
        advantages: [
            "Produces ultrapure water continuously (up to 18.2 MΩ·cm resistivity) [VENDOR_SPECIFICATION]",
            "Chemical-free continuous operation (eliminates acid/caustic regenerant chemicals) [FIRST_PRINCIPLES]",
            "High removal efficiency for weakly ionized species (silica, boron, CO2) [LITERATURE_SUPPORTED]"
        ],
        limitations: [
            "Strict RO permeate feed quality gating (TDS ≤ 30 mg/L, Hardness ≤ 0.5 mg/L as CaCO3) [VENDOR_SPECIFICATION]",
            "Extreme CaCO3 / Mg(OH)2 scaling risk in concentrate channels under high pH water-splitting [LITERATURE_SUPPORTED]",
            "Requires RO pretreatment (RO → EDI process train required for raw feed) [VENDOR_SPECIFICATION]"
        ],
        pretreatmentRequirements: "Reverse Osmosis (RO) permeate feed required (TDS ≤ 30 mg/L, Hardness ≤ 0.5 mg/L as CaCO3, TOC < 0.5 ppm)",
        currentModelEnvelope: { minTds: 0.05, maxTds: 30.0, unit: "mg/L TDS", provenance: "VENDOR_SPECIFICATION" },
        literatureEnvelope: { minTds: 0.05, maxTds: 50.0, unit: "mg/L TDS", source: "DuPont EDI-310 Manual; Glaeser et al. 2014", provenance: "LITERATURE_SUPPORTED" }
    }
};

export default ENGINEERING_TRUTH_TABLE;
