"use strict";

/**
 * Authoritative Unit & Dimensional Conversions Engine
 * Enforces strict, centralized dimensional transformations with validation.
 * No manual conversion constants are allowed to be scattered across UI or calculation modules.
 */

/**
 * Validates that an input is a finite, non-null numeric value.
 * @param {*} val 
 * @param {string} paramName 
 * @param {boolean} [allowZero=true]
 * @returns {number}
 */
export function validateNumeric(val, paramName = "value", allowZero = true) {
    const num = Number(val);
    if (!Number.isFinite(num) || isNaN(num)) {
        throw new TypeError(`Dimensional error: ${paramName} must be a finite number. Received: ${val}`);
    }
    if (!allowZero && num === 0) {
        throw new RangeError(`Dimensional error: ${paramName} cannot be zero.`);
    }
    if (num < 0) {
        throw new RangeError(`Dimensional error: ${paramName} cannot be negative. Received: ${num}`);
    }
    return num;
}

// =========================================================================
// 1. VOLUMETRIC FLOW RATE (L/min <-> m³/h <-> m³/s)
// =========================================================================

export function lMinToM3h(qLmin) {
    const q = validateNumeric(qLmin, "qLmin");
    return Number((q * 0.06).toFixed(8));
}

export function m3hToLmin(qM3h) {
    const q = validateNumeric(qM3h, "qM3h");
    return Number((q / 0.06).toFixed(8));
}

export function lMinToM3s(qLmin) {
    const q = validateNumeric(qLmin, "qLmin");
    return Number((q / 60000).toFixed(10));
}

export function m3sToLmin(qM3s) {
    const q = validateNumeric(qM3s, "qM3s");
    return Number((q * 60000).toFixed(8));
}

export function m3hToM3s(qM3h) {
    const q = validateNumeric(qM3h, "qM3h");
    return Number((q / 3600).toFixed(10));
}

export function m3sToM3h(qM3s) {
    const q = validateNumeric(qM3s, "qM3s");
    return Number((q * 3600).toFixed(8));
}

// =========================================================================
// 2. SURFACE AREA (cm² <-> m²)
// =========================================================================

export function cm2ToM2(areaCm2) {
    const a = validateNumeric(areaCm2, "areaCm2");
    return Number((a * 1e-4).toFixed(8));
}

export function m2ToCm2(areaM2) {
    const a = validateNumeric(areaM2, "areaM2");
    return Number((a * 1e4).toFixed(4));
}

// =========================================================================
// 3. PRESSURE & HEAD (Pa <-> bar <-> kPa <-> m H2O)
// =========================================================================

export function paToBar(pPa) {
    const p = validateNumeric(pPa, "pPa");
    return Number((p / 100000).toFixed(6));
}

export function barToPa(pBar) {
    const p = validateNumeric(pBar, "pBar");
    return Number((p * 100000).toFixed(2));
}

export function paToKpa(pPa) {
    const p = validateNumeric(pPa, "pPa");
    return Number((p / 1000).toFixed(4));
}

export function kpaToPa(pKpa) {
    const p = validateNumeric(pKpa, "pKpa");
    return Number((p * 1000).toFixed(2));
}

export function barToMHead(pBar) {
    const p = validateNumeric(pBar, "pBar");
    // 1 bar ≈ 10.197 m of water head at 20°C
    return Number((p * 10.197).toFixed(3));
}

// =========================================================================
// 4. POWER & ENERGY (W <-> kW, kWh/m³ <-> J/m³)
// =========================================================================

export function wToKw(pW) {
    const p = validateNumeric(pW, "pW");
    return Number((p / 1000).toFixed(6));
}

export function kwToW(pKw) {
    const p = validateNumeric(pKw, "pKw");
    return Number((p * 1000).toFixed(2));
}

export function secToSpecificEnergyJoules(secKwhM3) {
    const sec = validateNumeric(secKwhM3, "secKwhM3");
    // 1 kWh = 3.6e6 J
    return Number((sec * 3.6e6).toFixed(2));
}

// =========================================================================
// 5. SOLUTE MASS & FLUX (mg/L <-> g/m³ <-> g/s <-> mg/min)
// =========================================================================

export function mgLToKgM3(cMgL) {
    const c = validateNumeric(cMgL, "cMgL");
    // 1 mg/L = 1 g/m³ = 0.001 kg/m³
    return Number((c / 1000).toFixed(6));
}

export function kgM3ToMgL(cKgM3) {
    const c = validateNumeric(cKgM3, "cKgM3");
    return Number((c * 1000).toFixed(3));
}

export function mgMinToGs(mMgMin) {
    const m = validateNumeric(mMgMin, "mMgMin");
    return Number((m / 60000).toFixed(8));
}

export function gsToMgMin(mGs) {
    const m = validateNumeric(mGs, "mGs");
    return Number((m * 60000).toFixed(4));
}

/**
 * Calculates solute mass flow rate in g/s from volumetric flow (L/min) and concentration (mg/L).
 * m_dot = (Q_Lmin / 60,000 m³/s * 1000 L/m³) * (C_mgL / 1000 g/mg)
 *       = (Q_Lmin * C_mgL) / 60,000 g/s
 */
export function calculateSoluteFlowGs(qLmin, cMgL) {
    const q = validateNumeric(qLmin, "qLmin");
    const c = validateNumeric(cMgL, "cMgL");
    return Number(((q * c) / 60000).toFixed(8));
}

/**
 * Calculates electrical power in Watts from voltage (V) and current (A).
 * P = V * I
 */
export function calculateElectricalPowerW(voltageV, currentA) {
    const v = validateNumeric(voltageV, "voltageV");
    const i = validateNumeric(currentA, "currentA");
    return Number((v * i).toFixed(4));
}

/**
 * Calculates Specific Energy Consumption (SEC) in kWh/m³ from power (W) and product flow rate (L/min).
 * SEC = (P_W / 1000 kW) / (Q_prod_Lmin * 0.06 m³/h) = P_W / (60 * Q_prod_Lmin)
 */
export function calculateSecKwhM3(powerW, productFlowLmin) {
    const p = validateNumeric(powerW, "powerW");
    const q = validateNumeric(productFlowLmin, "productFlowLmin", false);
    return Number((p / (60 * q)).toFixed(6));
}
