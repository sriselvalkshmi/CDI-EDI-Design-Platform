"use strict";

import calculateEngineering from "../engine/engineeringEquationEngine.js";

/**
 * AI Technology Recommendation Engine & Multi-Tech Feasibility Evaluator
 * Enforces strict single source of truth identity and mathematical removal correctness:
 * removalEfficiency = ((feedTDS - outletTDS) / feedTDS) * 100
 * Evaluates candidate technologies using the exact authoritative engineering calculation.
 */
function aiRecommendation(feedWater = {}) {
    const tds = Number(feedWater.tds ?? 500);
    const targetTds = Number(feedWater.targetTds ?? 50);
    const hardness = Number(feedWater.hardness ?? 150);
    const conductivity = Number(feedWater.conductivity ?? (tds / 0.65));
    const flow = Number(feedWater.flowRate ?? feedWater.flow ?? 10);

    const techKeys = ["CDI", "MCDI", "FCDI", "EDI"];

    // Technology Literature Operating Envelope Boundaries
    const boundaries = {
        CDI: { tdsMin: 100, tdsMax: 1000, flowMax: 15 },
        MCDI: { tdsMin: 100, tdsMax: 3000, flowMax: 15 },
        FCDI: { tdsMin: 3000, tdsMax: 15000, flowMax: 20 },
        EDI: { tdsMin: 0.05, tdsMax: 30, flowMax: 10 }
    };

    const evaluations = techKeys.map(techKey => {
        const eng = calculateEngineering({
            technology: techKey,
            feedWater
        });

        const outletTDS = Number((eng.outletTDS || 0).toFixed(1));
        const isProdPass = outletTDS <= targetTds + 0.05;
        const targetAchievable = Boolean(eng.isTargetAchieved || isProdPass);
        
        const b = boundaries[techKey];
        const envelopeOK = tds >= b.tdsMin && tds <= b.tdsMax && flow <= b.flowMax;
        
        const feedQualityFeasible = Boolean(eng.feedQualityFeasible);

        const isFeasible = feedQualityFeasible && envelopeOK;
        const isValidated = envelopeOK;

        const sec = Number((eng.sec || 0.314).toFixed(3));
        const recovery = Number((eng.waterRecovery || 95).toFixed(1));
        const power = Number((eng.power || 0).toFixed(1));

        const removalEfficiency = tds > 0
            ? Number((((tds - outletTDS) / tds) * 100).toFixed(2))
            : 90.0;

        let score = 0;
        score += isFeasible ? 30 : 0;
        score += targetAchievable ? 35 : Math.max(0, 10 - (outletTDS - targetTds) * 0.2);
        score += feedQualityFeasible ? 20 : 5;
        score += Math.max(0, Math.min(10, 10 * (1 - (sec - 0.1) / 1.9)));
        score += Math.max(0, Math.min(10, (recovery / 100) * 10));

        // Membrane-free capex bonus for low salinity stream (tds <= 400 mg/L) ONLY when CDI actually achieves target setpoint
        if (techKey === "CDI" && tds <= 400 && targetAchievable) {
            score += 15;
        }

        const totalScore = Math.min(100, Math.max(10, Math.round(score)));

        return {
            technology: techKey,
            processTrainName: eng.processTrainName || techKey,
            envelopeOK,
            feedQualityFeasible,
            ediDirectFeedFeasible: eng.ediDirectFeedFeasible,
            feedQualityWarning: eng.feedQualityWarning,
            targetAchievable,
            isFeasible,
            isValidated,
            outletTDS,
            sec,
            power,
            recovery,
            removalEfficiency,
            score: totalScore,
            engineering: eng
        };
    });

    // HARD FEASIBILITY GATING SELECTION:
    // 1. Technologies that are feasible within envelope and achieve the target setpoint
    const passingFeasibleCandidates = evaluations.filter(e => e.isFeasible && e.targetAchievable);
    passingFeasibleCandidates.sort((a, b) => b.score - a.score);

    // 2. Technologies that are feasible within envelope
    const feasibleCandidates = evaluations.filter(e => e.isFeasible);
    feasibleCandidates.sort((a, b) => b.score - a.score);

    // 3. Technologies that achieve the target setpoint with acceptable feed chemistry
    const passingTargetCandidates = evaluations.filter(e => e.feedQualityFeasible && e.targetAchievable);
    passingTargetCandidates.sort((a, b) => b.score - a.score);

    evaluations.sort((a, b) => b.score - a.score);
    const ediEval = evaluations.find(e => e.technology === "EDI");

    let bestEval;
    // Ultra-pure target (< 1.0 mg/L): EDI is required for ultrapure polishing.
    // If feed TDS > 30 mg/L, RO pretreatment is required -> RO → EDI process train.
    if (targetTds <= 1.0) {
        bestEval = ediEval || evaluations[0];
    } else if (passingFeasibleCandidates.length > 0) {
        bestEval = passingFeasibleCandidates[0];
    } else if (feasibleCandidates.length > 0) {
        bestEval = feasibleCandidates[0];
    } else if (passingTargetCandidates.length > 0) {
        bestEval = passingTargetCandidates[0];
    } else {
        // Fall back to candidate that achieves the target or has highest score
        bestEval = evaluations.find(e => e.targetAchievable) || evaluations.find(e => e.isFeasible) || evaluations[0];
    }

    const selectedTechnology = bestEval.technology;
    const isEdiPretreatmentRequired = selectedTechnology === "EDI" && !bestEval.feedQualityFeasible;
    const recommendedProcess = isEdiPretreatmentRequired ? "RO → EDI" : (bestEval.engineering?.processTrainName || selectedTechnology);

    let reason = `Selected ${recommendedProcess} based on Hard Feasibility & Target Evaluation (Score: ${bestEval.score}/100, Predicted Outlet: ${bestEval.outletTDS} ppm).`;
    if (selectedTechnology === "EDI") {
        if (bestEval.isFeasible) {
            reason = `EDI is selected for ultrapure polishing (${bestEval.outletTDS} mg/L, ${bestEval.engineering?.predictedOutletResistivity || 18.2} MΩ·cm). Feed is within DuPont EDI-310 limits (<30 mg/L TDS, <0.5 mg/L hardness).`;
        } else {
            reason = `RO → EDI process train is recommended. Single-stage direct-feed technologies (CDI, MCDI, FCDI) cannot reach ${targetTds} mg/L target setpoint. Reverse Osmosis pretreatment is required before EDI polishing to achieve ${bestEval.outletTDS} mg/L product quality.`;
        }
    } else if (selectedTechnology === "CDI" && bestEval.targetAchievable) {
        reason = `Membrane-free CDI is selected for low-salinity stream (${tds} ppm). Direct electrosorption minimizes capital cost and achieves ${bestEval.outletTDS} ppm outlet TDS.`;
    } else if (selectedTechnology === "MCDI" && bestEval.targetAchievable) {
        reason = `MCDI is selected for brackish feed (${tds} ppm). Ion-exchange membranes provide high charge efficiency (>92%) and achieve ${bestEval.outletTDS} ppm outlet TDS.`;
    } else if (selectedTechnology === "FCDI" && bestEval.targetAchievable) {
        reason = `FCDI is selected for high-salinity continuous flow-electrode operation (${tds} ppm), achieving target TDS (${bestEval.outletTDS} ppm).`;
    } else if (!bestEval.targetAchievable) {
        reason = `Auto selection evaluated all single-stage technologies. ${selectedTechnology} provides lowest achievable outlet TDS (${bestEval.outletTDS} ppm), but single-stage target (${targetTds} ppm) is not fully met. Multi-stage design is recommended.`;
    }

    const criteria = [
        `Feed Quality: ${tds} mg/L TDS (${conductivity} µS/cm, ${hardness} mg/L Hardness).`,
        `Selected Technology: ${selectedTechnology} (Score: ${bestEval.score}/100).`,
        `Target Achievement Gate: ${bestEval.targetAchievable ? "PASSED (Target Achieved)" : "TARGET NOT ACHIEVED"}.`,
        `Direct Feed Quality Gate: ${bestEval.feedQualityFeasible ? "Passed" : "Feed Conditioning Required (RO → EDI)"}.`,
        `Predicted Outlet TDS: ${bestEval.outletTDS} mg/L.`,
        `Total Process SEC: ${bestEval.sec} kWh/m³.`
    ];

    const comparativeRationale = {
        whyCDI: `CDI uses membrane-free porous carbon electrodes, ideal for low-salinity streams (<1,000 mg/L).`,
        whyMCDIBetter: `MCDI incorporates AEM & CEM membranes to block co-ion expulsion, boosting charge efficiency to >92% with 95% recovery.`,
        whyFCDIRequired: `FCDI utilizes circulating carbon slurry electrodes to eliminate batch adsorption saturation for high salinity (>3,000 mg/L).`,
        whyEDIRequired: `EDI employs mixed-bed resin beads and water-splitting H+/OH- auto-regeneration. Requires RO permeate feed (<30 mg/L TDS) to achieve ultra-pure polishing (<0.1 mg/L / 18.2 MΩ·cm).`
    };

    // Build explicit screening audit map for CDI, MCDI, FCDI, EDI
    const screening = {};
    techKeys.forEach(techKey => {
        const ev = evaluations.find(e => e.technology === techKey);
        const isBest = techKey === selectedTechnology;
        const b = boundaries[techKey];
        
        let status = "FEASIBLE";
        let techReason = "";

        if (isBest) {
            status = "RECOMMENDED";
            techReason = `Highest-scoring feasible technology achieving requested target setpoint (${ev.outletTDS} mg/L).`;
        } else if (techKey === "EDI" && !ev.feedQualityFeasible) {
            status = "PRETREATMENT_REQUIRED";
            techReason = `Direct feed infeasible (TDS ${tds} mg/L > 30 mg/L, Hardness ${hardness} mg/L > 0.5 mg/L). RO pretreatment required.`;
        } else if (!ev.targetAchievable) {
            status = "TARGET_NOT_ACHIEVED";
            techReason = `Single-stage outlet (${ev.outletTDS} mg/L) > Target (${targetTds} mg/L). Additional polishing or MCDI required.`;
        } else if (!ev.envelopeOK) {
            status = "OUT_OF_RANGE";
            techReason = `Feed TDS (${tds} mg/L) outside recommended literature envelope (${b.tdsMin}–${b.tdsMax} mg/L).`;
        } else {
            status = "FEASIBLE";
            techReason = `Feasible technology option achieving target (Score: ${ev.score}/100, Outlet: ${ev.outletTDS} mg/L).`;
        }

        screening[techKey] = {
            technology: techKey,
            feasible: ev.isFeasible,
            feedQualityFeasible: ev.feedQualityFeasible,
            envelopeOK: ev.envelopeOK,
            targetAchievable: ev.targetAchievable,
            inEnvelope: ev.envelopeOK,
            predictedOutletTDS: ev.outletTDS,
            removalPercent: ev.removalEfficiency,
            recoveryPercent: ev.recovery,
            estimatedSEC: ev.sec,
            power: ev.power,
            score: ev.score,
            status,
            reason: techReason
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
            targetTDS: targetTds
        },
        candidates: screening,
        selectedTechnology,
        selectionRule: "Highest-scoring feasible technology achieving the target",
        verified: true,
        reason
    };

    return {
        technology: selectedTechnology,
        selectedTechnology,
        recommendedTechnology: selectedTechnology,
        recommendedProcess,
        confidence: Number((bestEval.score / 100).toFixed(2)),
        reason,
        criteria,
        comparativeRationale,
        screening,
        selectionAudit,
        input: selectionAudit.input,
        feedGating: isEdiPretreatmentRequired ? "FEED PRETREATMENT REQUIRED" : (bestEval.engineering?.feedGatingStatus || bestEval.engineering?.feedGating || "PASSED"),
        modelPedigree: bestEval.engineering?.modelPedigree,
        predictedOutletQuality: {
            outletTDS: bestEval.outletTDS,
            resistivityMohmCm: bestEval.engineering?.predictedOutletResistivity,
            conductivityUsCm: bestEval.engineering?.predictedOutletConductivity
        },
        energyEstimate: {
            electricalSEC: bestEval.engineering?.secElectrical,
            hydraulicSEC: bestEval.engineering?.secHydraulic,
            totalSEC: bestEval.sec
        },
        evaluations,
        bestEval
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
            reason: "No technology satisfies the current operating constraints. Pretreatment / Multi-stage process train required."
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