"use strict";

/**
 * Formal Engineering Design Basis & Parameter Provenance Manager
 * Single source of truth for parameter classification across all 5 provenance tiers:
 * - FIRST_PRINCIPLES: Mass balance, Faraday charge transfer, stoichiometry, Nernstian equilibrium
 * - LITERATURE_SUPPORTED: Published pilot ranges, membrane properties, vendor boundaries
 * - PROJECT_ASSUMPTION: Default cell dimensions, baseline pump efficiencies
 * - EXPERIMENTALLY_CALIBRATED: Empirical charge efficiency, empirical viscous drag factors (when project data present)
 * - EXTRAPOLATED: Operating parameters outside literature envelope (e.g. Ergun packed resin bed pressure drop)
 */

export const PROVENANCE_TIERS = {
    FIRST_PRINCIPLES: {
        label: "First-Principles Physics",
        badgeBg: "#DCFCE7",
        badgeColor: "#166534",
        description: "Derived directly from physical conservation laws (mass, charge, energy, Faraday stoichiometry)."
    },
    LITERATURE_SUPPORTED: {
        label: "Literature-Supported Parameter",
        badgeBg: "#EFF6FF",
        badgeColor: "#1D4ED8",
        description: "Supported by peer-reviewed published experimental literature or vendor specifications."
    },
    PROJECT_ASSUMPTION: {
        label: "Project Baseline Assumption",
        badgeBg: "#F3E8FF",
        badgeColor: "#6B21A8",
        description: "Project assumption (e.g. default cell geometry, 75% pump centrifugal efficiency)."
    },
    EXPERIMENTALLY_CALIBRATED: {
        label: "Experimentally Calibrated",
        badgeBg: "#ECFDF5",
        badgeColor: "#047857",
        description: "Calibrated against active project empirical pilot dataset."
    },
    EXTRAPOLATED: {
        label: "Extrapolated / Estimated",
        badgeBg: "#FEF3C7",
        badgeColor: "#B45309",
        description: "Model calculation extrapolated beyond validated pilot operating envelope."
    }
};

/**
 * Extracts formal Design Basis parameter cards for any calculated engineering result.
 * @param {Object} engineering Calculated engineering result
 * @returns {Array<Object>} Parameter cards with value, unit, provenance tier, and basis description
 */
export function extractDesignBasisSummary(engineering = {}) {
    if (!engineering) return [];

    const tech = engineering.technology || "CDI";
    const cards = [];

    // 1. Water & Salt Mass Balance Conservation
    cards.push({
        parameter: "Water Mass Conservation",
        value: `${engineering.flowRateLmin || 10} L/min Feed = ${(engineering.productFlowLmin || 9.5).toFixed(2)} L/min Prod + ${(engineering.rejectFlowLmin || 0.5).toFixed(2)} L/min Rej`,
        unit: "L/min",
        provenance: "FIRST_PRINCIPLES",
        basis: "Conservation of Fluid Mass: Q_feed = Q_product + Q_reject"
    });

    cards.push({
        parameter: "Salt Mass Conservation",
        value: `Salt In (${(engineering.feedTds || 500)} mg/L) = Salt Prod (${(engineering.outletTDS || 50)} mg/L) + Salt Rej (${(engineering.rejectTds || 900)} mg/L)`,
        unit: "g/s",
        provenance: "FIRST_PRINCIPLES",
        basis: "Conservation of Solute Mass: Q_feed × C_feed = Q_prod × C_prod + Q_rej × C_rej"
    });

    // 2. Faraday Charge Transfer & Electrical Balance
    cards.push({
        parameter: "Faraday Charge Transfer",
        value: `${(engineering.totalFaradayCurrent || 14.5).toFixed(1)} A Stack Current`,
        unit: "Amperes",
        provenance: "FIRST_PRINCIPLES",
        basis: "Faraday Law of Electrolysis: I_stack = (n_dot × z × F) / Charge Efficiency"
    });

    // 3. SEC Energy Accounting & Separation Conditions
    cards.push({
        parameter: "Gross Electrical SEC",
        value: `${Number(engineering.secElectricalGross ?? engineering.secElectrical ?? 0.3307).toFixed(4)}`,
        unit: "kWh/m³",
        provenance: "FIRST_PRINCIPLES",
        basis: `Electrical power divided by product flow rate @ ${engineering.feedTds || 500} → ${engineering.outletTDS || 50} mg/L TDS`
    });

    if (tech === "MCDI" && engineering.energyRecoveryFactor > 0) {
        cards.push({
            parameter: "Energy Recovery Factor",
            value: `${(engineering.energyRecoveryFactor * 100).toFixed(1)}%`,
            unit: "Percent",
            provenance: "LITERATURE_SUPPORTED",
            basis: "MCDI Reverse Polarity Desorption (RPD) energy recovery benchmark (Zhao et al. 2012)"
        });
    }

    cards.push({
        parameter: "Total Net SEC",
        value: `${Number(engineering.secTotalNet ?? engineering.secTotal ?? 0.2648).toFixed(4)}`,
        unit: "kWh/m³",
        provenance: "FIRST_PRINCIPLES",
        basis: "Net Electrical SEC + Total Hydraulic SEC (zero contradiction)"
    });

    // 4. Technology Architecture & Membranes
    if (tech === "CDI") {
        cards.push({
            parameter: "Electrode Architecture",
            value: "Fixed Porous Carbon (Membrane-Free)",
            unit: "Architecture",
            provenance: "LITERATURE_SUPPORTED",
            basis: "Porada et al. (2013) Membrane-Free Carbon EDL Electrosorption"
        });
    } else if (tech === "MCDI") {
        cards.push({
            parameter: "Membrane Orientation",
            value: "AEM at Anode (+), CEM at Cathode (-)",
            unit: "Orientation",
            provenance: "LITERATURE_SUPPORTED",
            basis: "Zhao et al. (2012) & Biesheuvel (2010) Co-Ion Expulsion Suppression"
        });
    } else if (tech === "FCDI") {
        cards.push({
            parameter: "Flow-Electrode Loop",
            value: `Continuous Slurry (${engineering.slurryConcentrationWt || 10} wt% Carbon)`,
            unit: "wt%",
            provenance: "LITERATURE_SUPPORTED",
            basis: "Jeon et al. (2013) & Rommerskirchen et al. (2018) Continuous Flowable Slurry"
        });
        cards.push({
            parameter: "Slurry Pumping SEC",
            value: `${Number(engineering.secSlurryPump || 0.002).toFixed(5)}`,
            unit: "kWh/m³",
            provenance: "FIRST_PRINCIPLES",
            basis: "Viscous Drag Pumping Duty: P_slurry = Q_slurry × ΔP_slurry / η_pump"
        });
    } else if (tech === "EDI") {
        cards.push({
            parameter: "EDI Pretreatment Gate",
            value: engineering.isFeedFeasible !== false ? "PASSED (RO Permeate Feed)" : "PRETREATMENT REQUIRED (RO → EDI)",
            unit: "Status",
            provenance: "LITERATURE_SUPPORTED",
            basis: "DuPont EDI-310 Vendor Limit: TDS ≤ 30 mg/L, Hardness ≤ 0.5 mg/L as CaCO3"
        });
        cards.push({
            parameter: "Resin Bed Pressure Drop",
            value: `${engineering.pressureDropWaterPa || engineering.pressureDrop || 300} Pa`,
            unit: "Pascal",
            provenance: "EXTRAPOLATED",
            basis: "Ergun Packed Bed Model: Calculated porous resin drag (literature-estimated)"
        });
    }

    return cards;
}

export default extractDesignBasisSummary;
