"use strict";

/**
 * Water Chemistry & Multi-Ion Speciation Engine
 * Processes multi-ionic water compositions, calculates charge balances, total hardness,
 * Langelier Saturation Index (LSI) scaling risk, and valency-selective transport kinetics.
 */

// Ion Molecular Weights (g/mol) and Valencies (z)
export const ION_SPECIES_DATA = {
    Na: { name: "Sodium (Na⁺)", weight: 22.99, valency: 1, charge: 1, type: "cation" },
    K: { name: "Potassium (K⁺)", weight: 39.10, valency: 1, charge: 1, type: "cation" },
    Ca: { name: "Calcium (Ca²⁺)", weight: 40.08, valency: 2, charge: 2, type: "cation" },
    Mg: { name: "Magnesium (Mg²⁺)", weight: 24.31, valency: 2, charge: 2, type: "cation" },
    NH4: { name: "Ammonium (NH₄⁺)", weight: 18.04, valency: 1, charge: 1, type: "cation" },

    Cl: { name: "Chloride (Cl⁻)", weight: 35.45, valency: 1, charge: -1, type: "anion" },
    SO4: { name: "Sulfate (SO₄²⁻)", weight: 96.06, valency: 2, charge: -2, type: "anion" },
    HCO3: { name: "Bicarbonate (HCO₃⁻)", weight: 61.02, valency: 1, charge: -1, type: "anion" },
    NO3: { name: "Nitrate (NO₃⁻)", weight: 62.00, valency: 1, charge: -1, type: "anion" },

    SiO2: { name: "Silica (SiO₂)", weight: 60.08, valency: 0, charge: 0, type: "neutral" },
    B: { name: "Boron (B / H₃BO₃)", weight: 10.81, valency: 0, charge: 0, type: "neutral" }
};

/**
 * Evaluates full ionic speciation, charge balance, total hardness, and scaling tendency.
 * @param {Object} feedWater Input feedwater composition
 * @returns {Object} Comprehensive water chemistry summary
 */
export function analyzeWaterChemistry(feedWater = {}) {
    const rawTds = Number(feedWater.tds ?? 500);
    const ph = Number(feedWater.ph ?? feedWater.pH ?? 7.2);
    const tempC = Number(feedWater.temperature ?? 25);
    const isExplicitNacl = feedWater.naclEquivalentAssumed !== false && (feedWater.na === undefined && feedWater.ca === undefined);

    // 1. Determine explicitly provided species
    const userNa = feedWater.na ?? feedWater.Na;
    const userK = feedWater.k ?? feedWater.K;
    const userCa = feedWater.ca ?? feedWater.Ca;
    const userMg = feedWater.mg ?? feedWater.Mg;
    const userNH4 = feedWater.nh4 ?? feedWater.NH4;

    const userCl = feedWater.cl ?? feedWater.Cl;
    const userSO4 = feedWater.so4 ?? feedWater.SO4;
    const userHCO3 = feedWater.hco3 ?? feedWater.HCO3;
    const userNO3 = feedWater.no3 ?? feedWater.NO3;

    // Default distribution ratios if no cations/anions supplied
    let defaultCaMgL = userCa !== undefined ? Number(userCa) : (feedWater.hardness !== undefined ? (Number(feedWater.hardness) * 0.70) / 2.497 : rawTds * 0.08);
    let defaultMgMgL = userMg !== undefined ? Number(userMg) : (feedWater.hardness !== undefined ? (Number(feedWater.hardness) * 0.30) / 4.118 : rawTds * 0.03);
    const defaultNaMgL = userNa !== undefined ? Number(userNa) : rawTds * 0.28;
    const defaultKMgL = userK !== undefined ? Number(userK) : rawTds * 0.01;
    const defaultNH4MgL = userNH4 !== undefined ? Number(userNH4) : 0.0;

    const catMeqSum = (defaultNaMgL / 22.99) + (defaultKMgL / 39.10) + ((defaultCaMgL / 40.08) * 2) + ((defaultMgMgL / 24.31) * 2) + (defaultNH4MgL / 18.04);

    // Synthesize unsupplied anions to balance total cation meq stoichiometrically
    let defaultSO4MgL = userSO4 !== undefined ? Number(userSO4) : rawTds * 0.08;
    let defaultHCO3MgL = userHCO3 !== undefined ? Number(userHCO3) : Math.min(rawTds * 0.35, Math.max(rawTds * 0.15, (catMeqSum * 0.40) * 61.02));
    let defaultNO3MgL = userNO3 !== undefined ? Number(userNO3) : 0.0;

    const currentNonClAnionMeq = ((defaultSO4MgL / 96.06) * 2) + (defaultHCO3MgL / 61.02) + (defaultNO3MgL / 62.00);
    const requiredClMeq = Math.max(0, catMeqSum - currentNonClAnionMeq);
    const defaultClMgL = userCl !== undefined ? Number(userCl) : requiredClMeq * 35.45;

    // Final parsed ionic concentrations in mg/L
    const ionsMgL = {
        Na: Number(defaultNaMgL),
        K: Number(defaultKMgL),
        Ca: Number(defaultCaMgL),
        Mg: Number(defaultMgMgL),
        NH4: Number(defaultNH4MgL),

        Cl: Number(defaultClMgL),
        SO4: Number(defaultSO4MgL),
        HCO3: Number(defaultHCO3MgL),
        NO3: Number(defaultNO3MgL),

        SiO2: Number(feedWater.sio2 ?? feedWater.SiO2 ?? 10.0),
        B: Number(feedWater.b ?? feedWater.B ?? 0.5)
    };

    // Calculate Milliequivalents per Liter (meq/L = mg/L / (MW / |z|))
    let cationMeqSum = 0;
    let anionMeqSum = 0;
    let ionicStrength = 0;

    const ionsMeqL = {};
    const ionsMolsL = {};

    Object.keys(ION_SPECIES_DATA).forEach(ionKey => {
        const spec = ION_SPECIES_DATA[ionKey];
        const concMgL = ionsMgL[ionKey] || 0;
        const molarMass = spec.weight;
        const valency = Math.abs(spec.valency);

        const concMolsL = (concMgL / 1000) / molarMass; // mol/L
        const concMeqL = valency > 0 ? (concMgL / molarMass) * valency : 0; // meq/L

        ionsMolsL[ionKey] = Number(concMolsL.toExponential(4));
        ionsMeqL[ionKey] = Number(concMeqL.toFixed(3));

        if (spec.type === "cation") cationMeqSum += concMeqL;
        if (spec.type === "anion") anionMeqSum += concMeqL;
        if (valency > 0) ionicStrength += 0.5 * concMolsL * Math.pow(valency, 2);
    });

    // Total Ionic Concentration & Charge Balance Error Check
    const totalMeqSum = cationMeqSum + anionMeqSum;
    const chargeBalanceErrorPercent = totalMeqSum > 0
        ? Number(((Math.abs(cationMeqSum - anionMeqSum) / (cationMeqSum + anionMeqSum)) * 100).toFixed(2))
        : 0.0;

    const isChargeBalanced = chargeBalanceErrorPercent <= 5.0;

    // Total Hardness Calculation (mg/L as CaCO3)
    // Hardness = 2.497 * Ca(mg/L) + 4.118 * Mg(mg/L)
    const totalHardnessMgL = Number((2.497 * ionsMgL.Ca + 4.118 * ionsMgL.Mg).toFixed(1));

    // Langelier Saturation Index (LSI) Calcium Carbonate Scaling Potential
    const logTds = Math.log10(Math.max(10, rawTds));
    const A = (logTds - 1) / 10;
    const B = -13.12 * Math.log10(tempC + 273.15) + 34.55;
    const C = Math.log10(Math.max(0.1, ionsMgL.Ca)) - 0.4;
    const D = Math.log10(Math.max(0.1, ionsMgL.HCO3));
    const pHs = (9.3 + A + B) - (C + D);
    const lsiIndex = Number((ph - pHs).toFixed(2));

    let scalingRisk = "LOW";
    let scalingMessage = "LSI < 0.0 & Hardness < 200 mg/L as CaCO3: Low CaCO3 scaling risk [SCREENING_INDICATOR].";

    if (lsiIndex > 0.5 || totalHardnessMgL >= 350) {
        scalingRisk = "HIGH";
        scalingMessage = `High Scaling Potential (Hardness = ${totalHardnessMgL} mg/L as CaCO3, LSI = ${lsiIndex > 0 ? `+${lsiIndex}` : lsiIndex}). Pretreatment or softening required.`;
    } else if (lsiIndex > 0.0 || totalHardnessMgL >= 180) {
        scalingRisk = "MODERATE";
        scalingMessage = `Moderate Scaling Risk (Hardness = ${totalHardnessMgL} mg/L as CaCO3, LSI = ${lsiIndex > 0 ? `+${lsiIndex}` : lsiIndex}). Antiscalant recommended.`;
    }

    // 5. Conductivity & TDS Ratio Consistency Diagnostic
    const condUsCm = Number(feedWater.conductivity ?? (rawTds / 0.65));
    const tdsCondRatio = condUsCm > 0 ? Number((rawTds / condUsCm).toFixed(2)) : 0.65;
    const isRatioNormal = tdsCondRatio >= 0.55 && tdsCondRatio <= 0.75;

    let conductivityDiagnosticStatus = "PASS";
    let conductivityDiagnosticMessage = "Conductivity and TDS ratio is within typical natural water bounds (0.55–0.75).";

    if (feedWater.conductivity !== undefined && feedWater.tds !== undefined) {
        if (!isRatioNormal) {
            conductivityDiagnosticStatus = "WARNING";
            conductivityDiagnosticMessage = "Conductivity-to-TDS conversion is water-chemistry dependent.";
        }
    }

    if (isExplicitNacl) {
        conductivityDiagnosticMessage = "Insufficient ion-composition data for exact consistency verification.";
    }

    const divalentCationFraction = cationMeqSum > 0 ? ((2 * (ionsMgL.Ca / 40.08 + ionsMgL.Mg / 24.31)) / cationMeqSum) : 0.2;
    const valencySelectivityFactor = Number((1.0 + 0.35 * divalentCationFraction).toFixed(3));

    return {
        tds: rawTds,
        conductivityUsCm: condUsCm,
        tdsCondRatio,
        conductivityDiagnosticStatus,
        conductivityDiagnosticMessage,
        conductivityDiagnosticProvenance: isRatioNormal ? "CALCULATED" : "PROJECT_ASSUMPTION",
        ph,
        tempC,
        naclEquivalentAssumed: isExplicitNacl,
        naclProvenance: isExplicitNacl ? "PROJECT_ASSUMPTION (NaCl-Equivalent Feed)" : "LITERATURE_SUPPORTED (Multi-Ion Composition)",
        assumptionsNotice: isExplicitNacl ? "[PROJECT_ASSUMPTION] NaCl-equivalent approximation used for unmeasured ions." : "Multi-ion composition",
        ionsMgL,
        ionsMeqL,
        ionsMolsL,
        ionicStrength: Number(ionicStrength.toFixed(4)),
        cationMeqSum: Number(cationMeqSum.toFixed(3)),
        anionMeqSum: Number(anionMeqSum.toFixed(3)),
        chargeBalanceErrorPercent,
        isChargeBalanced,
        totalHardnessMgL,
        hardnessBasis: "mg/L as CaCO3",
        hardnessProvenance: "CALCULATED (2.497*Ca + 4.118*Mg)",
        lsiIndex,
        lsiProvenance: "SCREENING_INDICATOR",
        scalingRisk,
        scalingMessage,
        divalentCationFraction: Number(divalentCationFraction.toFixed(3)),
        valencySelectivityFactor,
        valencySelectivityProvenance: "MODEL_ASSUMPTION_CALIBRATION_PARAMETER",
        summaryLabel: `Water Chemistry (${isExplicitNacl ? "NaCl-Equivalent [PROJECT_ASSUMPTION]" : "Multi-Ion"}): Hardness ${totalHardnessMgL} mg/L as CaCO3, LSI ${lsiIndex > 0 ? `+${lsiIndex}` : lsiIndex} (${scalingRisk} Scaling Risk [SCREENING_INDICATOR]), Charge Error ${chargeBalanceErrorPercent}%`
    };
}

export default analyzeWaterChemistry;

