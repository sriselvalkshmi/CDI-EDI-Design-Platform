"use strict";

import calculateEngineering from "../engine/engineeringEquationEngine.js";

/**
 * Standard Literature Operating Envelope Boundaries & Hard Engineering Limits
 * Recommended: Published literature sweet-spots (Zhao et al., Porada et al., Jeon et al., DuPont EDI)
 * Hard limits: Physical equipment, model domain, and hydraulic limits
 */
export const TECHNOLOGY_BOUNDARIES = {
    CDI: { 
        tdsMin: 100, 
        tdsMax: 1000, 
        flowMax: 15,
        hardMaxTds: 1000,
        hardMaxFlow: 50,
        hardMaxVoltage: 1.5
    },
    MCDI: { 
        tdsMin: 100, 
        tdsMax: 3000, 
        flowMax: 15,
        hardMaxTds: 3000,
        hardMaxFlow: 50,
        hardMaxVoltage: 1.6
    },
    FCDI: { 
        tdsMin: 3000, 
        tdsMax: 15000, 
        flowMax: 20,
        hardMaxTds: 50000,
        hardMaxFlow: 50,
        hardMaxVoltage: 1.8
    },
    EDI: { 
        tdsMin: 0.05, 
        tdsMax: 30, 
        flowMax: 10,
        hardMaxTds: 30, // Standalone direct feed without RO pretreatment
        hardMaxHardness: 0.5,
        hardMaxFlow: 50
    }
};

/**
 * Evaluates an individual technology candidate dynamically against feed-water constraints.
 * Central single source of truth function for feasibility across the platform.
 * 
 * Strict Hierarchy:
 * 1. Hard Engineering Constraints (TDS, Recovery, Pretreatment, Hard Equipment Limits) -> Feasibility Gate
 * 2. Literature Operating Range (Recommended Sweet-Spot vs Extended Range) -> Warning/Applicability
 */
export function evaluateTechnologyCandidate({
    key,
    name,
    desc,
    basis,
    feedWater = {},
    model = null,
    targetTds = null,
    targetRecovery = null
}) {
    const techKey = key;
    const tds = Number(feedWater.tds ?? 500);
    const flow = Number(feedWater.flowRate ?? feedWater.flow ?? 10);
    const hardness = Number(feedWater.hardness ?? 0);
    const tTds = targetTds !== null && targetTds !== undefined ? Number(targetTds) : Number(feedWater.targetTds ?? 50);
    const tRec = targetRecovery !== null && targetRecovery !== undefined ? Number(targetRecovery) : (feedWater.targetRecovery !== undefined && feedWater.targetRecovery !== null ? Number(feedWater.targetRecovery) : null);

    const eng = model || calculateEngineering({ technology: techKey, feedWater });

    const outletTDS = Number((eng.outletTDS ?? eng.outletTds ?? 0).toFixed(1));
    const recovery = Number((eng.waterRecovery ?? eng.waterRecoveryPct ?? (techKey === "CDI" ? 83.3 : (techKey === "FCDI" ? 90.0 : 95.0))).toFixed(1));
    const sec = Number((eng.sec ?? eng.secTotal ?? eng.secElectricalGross ?? 0).toFixed(3));
    const power = Number((eng.power ?? 0).toFixed(1));
    const pressureDrop = Number(eng.pressureDrop ?? 0);

    const b = TECHNOLOGY_BOUNDARIES[techKey] || { 
        tdsMin: 0, 
        tdsMax: 20000, 
        flowMax: 50, 
        hardMaxTds: 20000, 
        hardMaxFlow: 50 
    };

    // 1. HARD Engineering Constraint Checks (Mandatory Feasibility Gate)
    const isTdsPass = outletTDS <= tTds + 0.05;
    const isRecPass = tRec !== null ? recovery >= tRec - 0.05 : recovery >= (techKey === "CDI" ? 75.0 : 85.0);

    // EDI Pretreatment requirement (DuPont/SnowPure EDI envelope: direct feed TDS <= 30 mg/L, hardness <= 0.5 mg/L)
    const isEdiPretreatmentRequired = (techKey === "EDI") ? (tds > 30.0 || hardness > 0.5) : false;
    const feedQualityFeasible = techKey === "EDI" ? !isEdiPretreatmentRequired : Boolean(eng.feedQualityFeasible !== false);

    // Hard physical/equipment and model limit checks
    const isEquipmentPass = eng.equipmentStatus !== "EXCEEDED";
    const isHardLimitPass = tds <= b.hardMaxTds && flow <= b.hardMaxFlow && eng.envelopeStatus !== "HARD_LIMIT_EXCEEDED" && isEquipmentPass;

    // Hard Feasibility: ALL mandatory physical & specification conditions must pass
    const isFeasible = isTdsPass && isRecPass && feedQualityFeasible && isHardLimitPass && !isEdiPretreatmentRequired && isEquipmentPass;

    // 2. Recommended Literature Operating Range Classification (Applicability Warning)
    const isInRecommendedRange = tds >= b.tdsMin && tds <= b.tdsMax && flow <= b.flowMax && eng.envelopeStatus !== "OUTSIDE_ENVELOPE";
    
    let operatingApplicability = "IN_RECOMMENDED_RANGE";
    let operatingRangeLabel = "Recommended";
    if (!isHardLimitPass) {
        operatingApplicability = "HARD_LIMIT_EXCEEDED";
        operatingRangeLabel = "Hard Limit Exceeded";
    } else if (!isInRecommendedRange) {
        operatingApplicability = "OUTSIDE_RECOMMENDED_RANGE";
        operatingRangeLabel = "Extended Range (Warning)";
    }

    // AUTO Eligibility Classification
    let autoEligibility = "ELIGIBLE";
    if (isEdiPretreatmentRequired || !isFeasible) {
        autoEligibility = "REJECTED";
    } else if (!isInRecommendedRange) {
        autoEligibility = "ELIGIBLE_WITH_WARNING";
    }

    // Overall Feasibility & Rejection Reason Formulations
    let evaluation = "";
    let overallFeasibility = "";
    let rejectionReason = "";

    if (isEdiPretreatmentRequired) {
        evaluation = "Requires Pretreatment";
        overallFeasibility = "NOT FEASIBLE (Requires Pretreatment)";
        rejectionReason = `Pretreatment required (Feed TDS ${tds} mg/L > 30 mg/L or Hardness ${hardness} mg/L > 0.5 mg/L).`;
    } else if (!isHardLimitPass) {
        evaluation = "Hard Limit Exceeded";
        overallFeasibility = "NOT FEASIBLE (Hard Limit Exceeded)";
        rejectionReason = `Hard physical/equipment limit exceeded (Feed ${tds} mg/L vs max limit ${b.hardMaxTds} mg/L).`;
    } else if (!isTdsPass && !isRecPass) {
        evaluation = "TDS + Recovery Fail";
        overallFeasibility = "NOT FEASIBLE (TDS + Recovery Fail)";
        rejectionReason = `Both product TDS (${outletTDS.toFixed(1)} mg/L) and recovery (${recovery.toFixed(1)}%) fail target specifications.`;
    } else if (!isTdsPass) {
        evaluation = "TDS Exceeded";
        overallFeasibility = "NOT FEASIBLE (TDS Exceeded)";
        rejectionReason = `Product TDS (${outletTDS.toFixed(1)} mg/L) exceeds target (≤ ${tTds.toFixed(1)} mg/L).`;
    } else if (!isRecPass) {
        evaluation = "Recovery Deficit";
        overallFeasibility = "NOT FEASIBLE (Recovery Deficit)";
        rejectionReason = `Water recovery (${recovery.toFixed(1)}%) below target (≥ ${(tRec ?? 95.0).toFixed(1)}%).`;
    } else if (isFeasible && !isInRecommendedRange) {
        evaluation = "Meets Target (Extended Range)";
        overallFeasibility = "FEASIBLE (WITH WARNING)";
        rejectionReason = `Satisfies mandatory engineering targets (TDS & Recovery), but operates in extended range outside standard literature envelope (${b.tdsMin}–${b.tdsMax} mg/L).`;
    } else if (isFeasible) {
        evaluation = "Meets Target";
        overallFeasibility = "FEASIBLE";
        rejectionReason = "Fully compliant with all specifications & operating constraints.";
    } else {
        evaluation = "Non-Compliant";
        overallFeasibility = "NOT FEASIBLE";
        rejectionReason = "Operating constraints not satisfied.";
    }

    const removalEfficiency = tds > 0
        ? Number((((tds - outletTDS) / tds) * 100).toFixed(2))
        : 90.0;

    let score = 0;
    score += isFeasible ? 40 : 0;
    score += isTdsPass ? 30 : Math.max(0, 10 - (outletTDS - tTds) * 0.2);
    score += feedQualityFeasible ? 15 : 0;
    score += Math.max(0, Math.min(10, 10 * (1 - (sec - 0.1) / 1.9)));
    score += Math.max(0, Math.min(5, (recovery / 100) * 5));

    const totalScore = Math.min(100, Math.max(5, Math.round(score)));

    return {
        key: techKey,
        technology: techKey,
        name: name || techKey,
        desc: desc || techKey,
        basis: basis || techKey,
        productTarget: `${outletTDS.toFixed(1)} mg/L`,
        outlet: outletTDS,
        outletTDS,
        recoveryVal: recovery,
        recovery: isEdiPretreatmentRequired ? "—" : `${recovery.toFixed(1)}%`,
        waterRecovery: recovery,
        secVal: sec,
        sec,
        secFormatted: `${sec.toFixed(3)} kWh/m³`,
        power,
        pressureDrop,
        removalEfficiency,
        isTdsPass,
        isRecPass,
        envelopeOK: isInRecommendedRange,
        inEnvelope: isInRecommendedRange,
        isEnvelopePass: isHardLimitPass,
        isHardLimitPass,
        isInRecommendedRange,
        operatingApplicability,
        operatingRangeLabel,
        autoEligibility,
        overallFeasibility,
        requiresPretreatment: isEdiPretreatmentRequired,
        isActionRequired: isEdiPretreatmentRequired,
        feedQualityFeasible,
        targetAchievable: isTdsPass,
        isEquipmentPass,
        isFeasible,
        isPass: isFeasible,
        evaluation,
        rejectionReason,
        score: totalScore,
        engineering: eng,
        model: eng
    };
}

/**
 * Deterministic ranking function for fully feasible technology candidates.
 * Hierarchy:
 * Priority 1: Full specification compliance (pre-filtered)
 * Priority 2: Lower Total Net System SEC / Capital cost for low-salinity
 * Priority 3: Higher recovery margin
 * Priority 4: Better TDS margin (positive margin)
 * Priority 5: Lower hydraulic burden / pressure drop
 */
export function rankFeasibleCandidates(candidates = [], targetTds = 50, targetRecovery = 95.0, feedTds = 500) {
    if (!candidates || candidates.length === 0) return [];
    const feasible = candidates.filter(c => c.isFeasible || c.isPass);
    return [...feasible].sort((a, b) => {
        // Priority 6 / CAPEX advantage: For low salinity streams (feedTds <= 400) where CDI is feasible and recovery target is not strict (>85%),
        // CDI has significant CAPEX advantage (membrane-free) over MCDI
        const isLowSalinity = feedTds <= 400 && (targetRecovery === null || targetRecovery === undefined || targetRecovery <= 85.0);
        if (isLowSalinity) {
            if (a.key === "CDI" && b.key !== "CDI") return -1;
            if (b.key === "CDI" && a.key !== "CDI") return 1;
        }

        // Priority 2: Lower Net SEC
        const secA = Number(a.secVal ?? a.sec ?? 0);
        const secB = Number(b.secVal ?? b.sec ?? 0);
        if (Math.abs(secA - secB) > 0.01) {
            return secA - secB;
        }

        // Priority 3: Higher recovery margin
        const recMarginA = Number(a.recoveryVal ?? a.waterRecovery ?? 0) - targetRecovery;
        const recMarginB = Number(b.recoveryVal ?? b.waterRecovery ?? 0) - targetRecovery;
        if (Math.abs(recMarginA - recMarginB) > 0.1) {
            return recMarginB - recMarginA;
        }

        // Priority 4: Better TDS margin (target - outlet)
        const tdsMarginA = targetTds - Number(a.outlet ?? a.outletTDS ?? 0);
        const tdsMarginB = targetTds - Number(b.outlet ?? b.outletTDS ?? 0);
        if (Math.abs(tdsMarginA - tdsMarginB) > 0.1) {
            return tdsMarginB - tdsMarginA;
        }

        // Priority 5: Lower hydraulic burden
        const dpA = Number(a.pressureDrop ?? a.model?.pressureDrop ?? a.engineering?.pressureDrop ?? 0);
        const dpB = Number(b.pressureDrop ?? b.model?.pressureDrop ?? b.engineering?.pressureDrop ?? 0);
        if (Math.abs(dpA - dpB) > 10) {
            return dpA - dpB;
        }

        return 0;
    });
}

/**
 * AI Technology Recommendation Engine & Multi-Tech Feasibility Evaluator
 * Enforces strict feasibility-first gating without array-order bias.
 */
function aiRecommendation(feedWater = {}) {
    const tds = Number(feedWater.tds ?? 500);
    const targetTds = Number(feedWater.targetTds ?? 50);
    const hardness = Number(feedWater.hardness ?? 150);
    const conductivity = Number(feedWater.conductivity ?? (tds / 0.65));
    const flow = Number(feedWater.flowRate ?? feedWater.flow ?? 10);
    const targetRecovery = feedWater.targetRecovery !== undefined && feedWater.targetRecovery !== null ? Number(feedWater.targetRecovery) : null;

    const techKeys = ["CDI", "MCDI", "FCDI", "EDI"];

    // Evaluate every technology using first-principles engineering models
    const rawCandidates = techKeys.map(key => {
        return evaluateTechnologyCandidate({
            key,
            feedWater,
            targetTds,
            targetRecovery
        });
    });

    // Hard Feasibility Gate: Only candidates passing ALL mandatory conditions are feasible
    const feasibleCandidates = rankFeasibleCandidates(rawCandidates, targetTds, targetRecovery, tds);
    const autoCandidate = feasibleCandidates.length > 0 ? feasibleCandidates[0] : null;
    const isAutoFeasible = Boolean(autoCandidate);
    
    // Ultrapure handling (RO -> EDI recommendation for ultrapure setpoint <= 1.0 mg/L)
    const isUltrapureTarget = targetTds <= 1.0;
    const selectedTechnology = isAutoFeasible 
        ? autoCandidate.key 
        : (isUltrapureTarget ? "EDI" : null);
    
    const feasibleCount = feasibleCandidates.length;
    const isEdiPretreatmentRequired = tds > 30.0 || hardness > 0.5;

    let recommendedProcess = "NONE — DESIGN ENVELOPE EXCEEDED";
    if (isAutoFeasible) {
        recommendedProcess = autoCandidate.engineering?.processTrainName || autoCandidate.key;
    } else if (isUltrapureTarget) {
        recommendedProcess = "RO → EDI";
    }

    let reason = "";
    if (!isAutoFeasible) {
        if (isUltrapureTarget) {
            reason = `Target TDS (${targetTds} mg/L) requires ultrapure EDI polishing. Raw feed (${tds} mg/L TDS, ${hardness} mg/L Hardness) exceeds direct EDI limits (max 30 mg/L TDS, 0.5 mg/L Hardness). RO → EDI process train is recommended.`;
        } else {
            reason = `No single-stage technology satisfies the complete target specification (${targetTds} mg/L TDS, ${targetRecovery ? `${targetRecovery}% recovery` : "operating constraints"}) within direct operating limits (0 / 4 feasible). Multi-stage train staging or pre-treatment (e.g. RO → EDI) is required.`;
        }
    } else if (selectedTechnology === "EDI") {
        reason = `EDI is selected for ultrapure polishing (${autoCandidate.outletTDS} mg/L). Feed is within DuPont EDI-310 limits (<30 mg/L TDS, <0.5 mg/L hardness).`;
    } else if (selectedTechnology === "CDI") {
        reason = `Membrane-free CDI is selected for low-salinity stream (${tds} ppm). Achieves target TDS (${autoCandidate.outletTDS} ppm) with lowest capital cost.`;
    } else if (selectedTechnology === "MCDI") {
        reason = `MCDI is selected for brackish feed (${tds} ppm). Ion-exchange membranes provide high charge efficiency and achieve target TDS (${autoCandidate.outletTDS} ppm) at ${autoCandidate.recovery} recovery.`;
    } else if (selectedTechnology === "FCDI") {
        reason = `FCDI is selected for continuous flow-electrode operation (${tds} ppm), achieving target TDS (${autoCandidate.outletTDS} ppm) at ${autoCandidate.recovery} recovery.`;
    } else {
        reason = `Selected ${recommendedProcess} based on Hard Feasibility & Engineering Performance Ranking.`;
    }

    const criteria = !isAutoFeasible ? [
        `Feed Quality: ${tds} mg/L TDS (${conductivity} µS/cm, ${hardness} mg/L Hardness).`,
        `Selected Technology: ${selectedTechnology || "NONE"} (${isUltrapureTarget ? "RO → EDI Train Required" : "Direct Design Envelope Exceeded"}).`,
        `Target Achievement Gate: ${isUltrapureTarget ? "Ultrapure Setpoint Requires RO Pre-Desalination" : "TARGET NOT ACHIEVED BY DIRECT SINGLE-STAGE"}.`,
        `Direct Feed Quality Gate: ${isEdiPretreatmentRequired ? "Feed Pretreatment Required" : "Multi-stage train required"}.`,
        `Target Setpoint: ${targetTds} mg/L TDS.`
    ] : [
        `Feed Quality: ${tds} mg/L TDS (${conductivity} µS/cm, ${hardness} mg/L Hardness).`,
        `Selected Technology: ${selectedTechnology} (Rank #1 / ${feasibleCount} Feasible).`,
        `Target Achievement Gate: PASSED (${autoCandidate.outletTDS} mg/L ≤ ${targetTds} mg/L).`,
        `Water Recovery Gate: PASSED (${autoCandidate.recovery}).`,
        `Direct Feed Quality Gate: Passed.`,
        `Total Process SEC: ${autoCandidate.secFormatted}.`
    ];

    const comparativeRationale = {
        whyCDI: `CDI uses membrane-free porous carbon electrodes, ideal for low-salinity streams (<1,000 mg/L).`,
        whyMCDIBetter: `MCDI incorporates AEM & CEM membranes to block co-ion expulsion, boosting charge efficiency to >92% with 95% recovery.`,
        whyFCDIRequired: `FCDI utilizes circulating carbon slurry electrodes to eliminate batch adsorption saturation for high salinity (>3,000 mg/L).`,
        whyEDIRequired: `EDI employs mixed-bed resin beads and water-splitting H+/OH- auto-regeneration. Requires RO permeate feed (<30 mg/L TDS) to achieve ultra-pure polishing (<0.1 mg/L / 18.2 MΩ·cm).`
    };

    // Screening map for backwards-compatibility
    const screening = {};
    rawCandidates.forEach(cand => {
        const isBest = cand.key === selectedTechnology && isAutoFeasible;
        let status = "FEASIBLE";
        if (isBest) {
            status = "RECOMMENDED";
        } else if (cand.requiresPretreatment) {
            status = "PRETREATMENT_REQUIRED";
        } else if (!cand.isTdsPass) {
            status = "TARGET_NOT_ACHIEVED";
        } else if (!cand.envelopeOK) {
            status = "OUT_OF_RANGE";
        } else if (!cand.isFeasible) {
            status = "NOT_FEASIBLE";
        } else {
            status = "FEASIBLE";
        }

        screening[cand.key] = {
            technology: cand.key,
            feasible: cand.isFeasible,
            feedQualityFeasible: cand.feedQualityFeasible,
            envelopeOK: cand.envelopeOK,
            targetAchievable: cand.isTdsPass,
            inEnvelope: cand.envelopeOK,
            predictedOutletTDS: cand.outletTDS,
            removalPercent: cand.removalEfficiency,
            recoveryPercent: cand.recoveryVal,
            estimatedSEC: cand.secVal,
            power: cand.power,
            score: cand.score,
            status,
            reason: cand.rejectionReason
        };
    });

    const selectionAudit = {
        input: {
            tds,
            conductivity,
            hardness,
            pH: Number(feedWater.ph ?? feedWater.pH ?? 7.2),
            temperature: Number(feedWater.temperature ?? 25),
            flow: Number(feedWater.flowRate ?? feedWater.flow ?? 10),
            pressure: Number(feedWater.pressure ?? 1.0),
            targetTDS: targetTds,
            targetRecovery
        },
        candidates: screening,
        feasibleCandidates: feasibleCandidates.map(f => f.key),
        selectedTechnology,
        selectionRule: "Strict Feasibility Gate followed by SEC & Recovery Margin Ranking",
        verified: true,
        reason
    };

    let feedGating = "PASSED";
    if (!isAutoFeasible) {
        if (isUltrapureTarget || isEdiPretreatmentRequired) {
            feedGating = "FEED PRETREATMENT REQUIRED";
        } else {
            feedGating = "DESIGN ENVELOPE EXCEEDED";
        }
    } else if (isEdiPretreatmentRequired) {
        feedGating = "FEED PRETREATMENT REQUIRED";
    } else {
        feedGating = autoCandidate?.engineering?.feedGatingStatus || "PASSED";
    }

    return {
        technology: selectedTechnology,
        selectedTechnology,
        recommendedTechnology: selectedTechnology,
        recommendedProcess,
        recommendation: isAutoFeasible ? selectedTechnology : (isUltrapureTarget ? "EDI" : "NONE"),
        feasibleCount,
        confidence: autoCandidate ? Number((autoCandidate.score / 100).toFixed(2)) : (isUltrapureTarget ? 0.95 : 0),
        reason,
        criteria,
        comparativeRationale,
        screening,
        selectionAudit,
        input: selectionAudit.input,
        feedGating,
        modelPedigree: autoCandidate?.engineering?.modelPedigree || "PHYSICS_FIRST_PRINCIPLES",
        predictedOutletQuality: autoCandidate ? {
            outletTDS: autoCandidate.outletTDS,
            resistivityMohmCm: autoCandidate.engineering?.predictedOutletResistivity,
            conductivityUsCm: autoCandidate.engineering?.predictedOutletConductivity
        } : null,
        energyEstimate: autoCandidate ? {
            electricalSEC: autoCandidate.engineering?.secElectrical,
            hydraulicSEC: autoCandidate.engineering?.secHydraulic,
            totalSEC: autoCandidate.secVal
        } : null,
        evaluations: rawCandidates,
        feasibleCandidates,
        bestEval: autoCandidate
    };
}

// Explicit Decision Function for Hard Feasibility Verification (Step 2)
export function selectBestTechnology(screeningMap = {}) {
    const feasible = Object.entries(screeningMap)
        .filter(([, result]) => result && result.feasible)
        .sort((a, b) => b[1].score - a[1].score);

    if (feasible.length === 0) {
        return {
            technology: null,
            score: 0,
            reason: "No technology satisfies the complete operating constraints. Pretreatment / Multi-stage process train required."
        };
    }

    const [technology, result] = feasible[0];
    return {
        technology,
        score: result.score,
        reason: result.reason
    };
}

export default aiRecommendation;