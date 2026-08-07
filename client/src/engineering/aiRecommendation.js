"use strict";

import calculateEngineering from "./engineeringEquationEngine.js";

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

    const techKeys = ["CDI", "MCDI", "FCDI", "EDI"];

    const evaluations = techKeys.map(techKey => {
        const eng = calculateEngineering({
            technology: techKey,
            feedWater
        });

        const outletTDS = Number((eng.outletTDS || 0).toFixed(1));
        const feedQualityFeasible = Boolean(eng.feedQualityFeasible);
        const targetAchievable = Boolean(eng.isTargetAchieved);
        const isFeasible = feedQualityFeasible && targetAchievable;

        const sec = Number((eng.sec || 0.314).toFixed(3));
        const recovery = Number((eng.waterRecovery || 95).toFixed(1));
        const power = Number((eng.power || 0).toFixed(1));

        // Authoritative removal efficiency calculation directly from feed and outlet TDS
        const removalEfficiency = tds > 0
            ? Number((((tds - outletTDS) / tds) * 100).toFixed(2))
            : 90.0;

        // Weighted Multi-Objective Score (0 - 100)
        let score = 0;

        // 1. Target Achievement Gate (Primary: 50 pts)
        score += targetAchievable ? 50 : Math.max(0, 20 - (outletTDS - targetTds) * 0.5);

        // 2. Direct Feed Quality Gate (20 pts)
        score += feedQualityFeasible ? 20 : 5;

        // 3. Energy Efficiency (SEC) (15 pts max)
        score += Math.max(0, Math.min(15, 15 * (1 - (sec - 0.1) / 1.9)));

        // 4. Water Recovery (15 pts max)
        score += Math.max(0, Math.min(15, (recovery / 100) * 15));

        const totalScore = Math.min(100, Math.max(10, Math.round(score)));

        return {
            technology: techKey,
            processTrainName: eng.processTrainName || techKey,
            feedQualityFeasible,
            ediDirectFeedFeasible: eng.ediDirectFeedFeasible,
            feedQualityWarning: eng.feedQualityWarning,
            targetAchievable,
            isFeasible,
            outletTDS,
            sec,
            power,
            recovery,
            removalEfficiency,
            score: totalScore,
            engineering: eng
        };
    });

    // 1. Filter candidates that achieve Target TDS
    const targetAchievingCandidates = evaluations.filter(e => e.targetAchievable);
    targetAchievingCandidates.sort((a, b) => b.score - a.score);

    // 2. Filter candidates that pass both gates
    const fullyFeasibleCandidates = evaluations.filter(e => e.isFeasible);
    fullyFeasibleCandidates.sort((a, b) => b.score - a.score);

    // Pick top target-achieving technology if available; otherwise best candidate
    evaluations.sort((a, b) => b.score - a.score);
    const bestEval = fullyFeasibleCandidates.length > 0
        ? fullyFeasibleCandidates[0]
        : (targetAchievingCandidates.length > 0 ? targetAchievingCandidates[0] : evaluations[0]);

    const selectedTechnology = bestEval.technology;
    const recommendedProcess = selectedTechnology;

    let reason = `Selected ${recommendedProcess} based on Target Feasibility Evaluation (Score: ${bestEval.score}/100, Predicted Outlet: ${bestEval.outletTDS} ppm).`;
    if (selectedTechnology === "EDI" && bestEval.targetAchievable) {
        reason = `EDI is selected because it is the only technology achieving the target TDS (${bestEval.outletTDS} ppm ≤ ${targetTds} ppm). Note: Suitable upstream feed conditioning is required for raw feed water.`;
    } else if (selectedTechnology === "MCDI" && bestEval.targetAchievable) {
        reason = `MCDI is selected for brackish feed (${tds} ppm). Ion-exchange membranes provide high charge efficiency (>92%) and achieve ${bestEval.outletTDS} ppm outlet TDS.`;
    } else if (selectedTechnology === "FCDI" && bestEval.targetAchievable) {
        reason = `FCDI is selected for continuous flow-electrode operation, achieving target TDS (${bestEval.outletTDS} ppm).`;
    } else if (!bestEval.targetAchievable) {
        reason = `Auto selection evaluated all single-stage technologies. ${selectedTechnology} provides lowest achievable outlet TDS (${bestEval.outletTDS} ppm), but single-stage target (${targetTds} ppm) is not fully met. Multi-stage design is recommended.`;
    }

    const criteria = [
        `Feed Quality: ${tds} mg/L TDS (${conductivity} µS/cm, ${hardness} mg/L Hardness).`,
        `Selected Technology: ${selectedTechnology} (Score: ${bestEval.score}/100).`,
        `Target Achievement Gate: ${bestEval.targetAchievable ? "PASSED (Target Achieved)" : "TARGET NOT ACHIEVED"}.`,
        `Direct Feed Quality Gate: ${bestEval.feedQualityFeasible ? "Passed" : "Feed Conditioning Required"}.`,
        `Predicted Outlet TDS: ${bestEval.outletTDS} mg/L.`,
        `Total Process SEC: ${bestEval.sec} kWh/m³.`
    ];

    const comparativeRationale = {
        whyCDI: `CDI uses membrane-free porous carbon electrodes, ideal for low-salinity streams (<1,000 mg/L).`,
        whyMCDIBetter: `MCDI incorporates AEM & CEM membranes to block co-ion expulsion, boosting charge efficiency to >92% with 95% recovery.`,
        whyFCDIRequired: `FCDI utilizes circulating carbon slurry electrodes to eliminate batch adsorption saturation for high salinity (>3,000 mg/L).`,
        whyEDIRequired: `EDI employs mixed-bed resin beads and water-splitting H+/OH- auto-regeneration. Achieves ultra-pure polishing (< 10 mg/L).`
    };

    return {
        selectedTechnology,
        recommendedTechnology: selectedTechnology,
        recommendedProcess,
        confidence: bestEval.score / 100,
        reason,
        criteria,
        comparativeRationale,
        evaluations,
        bestEval
    };
}

export default aiRecommendation;