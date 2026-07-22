"use strict";

/**
 * Water Chemistry Module
 * Analyzes multi-ionic speciation (Na+, Ca2+, Mg2+, K+, Cl-, SO42-, HCO3-),
 * ionic strength, electrical conductivity, osmotic pressure, and scaling index (LSI).
 */
export function analyzeWaterChemistry(feedWater = {}) {
    const tds = Number(feedWater.tds ?? 500); // mg/L
    const tempC = Number(feedWater.temperature ?? 25); // °C
    const ph = Number(feedWater.ph ?? 7.2);
    const hardness = Number(feedWater.hardness ?? 150); // mg/L as CaCO3

    // Approximate ion speciation based on typical natural brackish water ratios if individual ions not provided
    const Na = Number(feedWater.na ?? (tds * 0.30)); // mg/L
    const Ca = Number(feedWater.ca ?? (hardness * 0.70 * 0.40)); // mg/L
    const Mg = Number(feedWater.mg ?? (hardness * 0.30 * 0.24)); // mg/L
    const K = Number(feedWater.k ?? (tds * 0.02)); // mg/L

    const Cl = Number(feedWater.cl ?? (tds * 0.45)); // mg/L
    const SO4 = Number(feedWater.so4 ?? (tds * 0.15)); // mg/L
    const HCO3 = Number(feedWater.hco3 ?? (tds * 0.08)); // mg/L
    const silica = Number(feedWater.silica ?? 15.0); // mg/L

    // Molar masses (g/mol)
    const MW = { Na: 22.99, Ca: 40.08, Mg: 24.31, K: 39.10, Cl: 35.45, SO4: 96.06, HCO3: 61.02 };
    // Charge numbers
    const Z = { Na: 1, Ca: 2, Mg: 2, K: 1, Cl: 1, SO4: 2, HCO3: 1 };

    // Concentrations in mol/L (M)
    const c = {
        Na: (Na / 1000) / MW.Na,
        Ca: (Ca / 1000) / MW.Ca,
        Mg: (Mg / 1000) / MW.Mg,
        K: (K / 1000) / MW.K,
        Cl: (Cl / 1000) / MW.Cl,
        SO4: (SO4 / 1000) / MW.SO4,
        HCO3: (HCO3 / 1000) / MW.HCO3
    };

    // 1. Ionic Strength: I = 0.5 * sum(c_i * z_i^2)  (mol/L)
    let ionicStrength = 0;
    Object.keys(c).forEach(ion => {
        ionicStrength += 0.5 * c[ion] * Math.pow(Z[ion], 2);
    });

    // 2. Electrical Conductivity: conductivity ~ TDS / 0.65 (uS/cm)
    const conductivity = Number(feedWater.conductivity ?? (tds / 0.65));

    // 3. Osmotic Pressure: Pi = sum(c_i) * R * T  (bar)
    // R = 0.08314 L.bar/(mol.K), T in Kelvin
    const tempK = tempC + 273.15;
    const totalMolarity = Object.values(c).reduce((a, b) => a + b, 0);
    const osmoticPressure = totalMolarity * 0.08314 * tempK; // bar

    // 4. Langelier Saturation Index (LSI) for CaCO3 scaling potential
    // LSI = pH - pHs
    // pHs = (9.3 + A + B) - (C + D)
    const A = (Math.log10(tds) - 1) / 10;
    const B = -13.12 * Math.log10(tempK) + 34.55;
    const C = Math.log10(Math.max(1, Ca * 2.497)) - 0.4;
    const D = Math.log10(Math.max(1, HCO3 * 0.82));
    const pHs = (9.3 + A + B) - (C + D);
    const lsi = ph - pHs;

    let scalingRisk = "Low (Non-Scaling)";
    if (lsi > 0.5) scalingRisk = "High (Severe CaCO3 Scaling Risk)";
    else if (lsi > 0.0) scalingRisk = "Moderate (Slight Scaling Potential)";

    return {
        tds,
        conductivity: Number(conductivity.toFixed(1)),
        hardness: Number(hardness.toFixed(1)),
        ionicStrength: Number(ionicStrength.toFixed(4)),
        osmoticPressure: Number(osmoticPressure.toFixed(2)),
        lsi: Number(lsi.toFixed(2)),
        scalingRisk,
        ions: {
            Na: Number(Na.toFixed(1)),
            Ca: Number(Ca.toFixed(1)),
            Mg: Number(Mg.toFixed(1)),
            K: Number(K.toFixed(1)),
            Cl: Number(Cl.toFixed(1)),
            SO4: Number(SO4.toFixed(1)),
            HCO3: Number(HCO3.toFixed(1)),
            silica: Number(silica.toFixed(1))
        }
    };
}

export default analyzeWaterChemistry;
