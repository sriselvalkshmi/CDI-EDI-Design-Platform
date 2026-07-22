import calculateEngineering from "./engineeringEquationEngine.js";


/**
 * AI Technology Recommendation Engine
 * Evaluates physical feasibility and runs engineering equations to produce calculated recommendations.
 */
function aiRecommendation(feedWater = {}) {
    const tds = Number(feedWater.tds ?? 500);
    const conductivity = Number(feedWater.conductivity ?? 300);
    const hardness = Number(feedWater.hardness ?? 150);
    const flowRate = Number(feedWater.flowRate ?? 10);
    const targetTds = Number(feedWater.targetTds ?? 50);

    const scores = { CDI: 0, MCDI: 0, FCDI: 0, EDI: 0 };
    const reasons = [];

    if (tds < 100 || targetTds < 10) {
        scores.EDI += 70;
        scores.MCDI += 20;
        reasons.push("Low feed TDS / ultra-pure polishing requirement is ideal for EDI resin-membrane stack.");
    } else if (tds <= 1000) {
        scores.MCDI += 65;
        scores.CDI += 40;
        reasons.push("Moderate salinity feed water with dissolved minerals favors membrane-assisted CDI (MCDI).");
    } else if (tds <= 5000) {
        scores.FCDI += 75;
        scores.MCDI += 20;
        reasons.push("High TDS stream favors Flowable Electrode CDI (FCDI) continuous slurry desalting.");
    } else {
        scores.FCDI += 100;
        reasons.push("Very high salinity feed requires FCDI continuous slurry operation.");
    }

    if (hardness >= 100) {
        scores.MCDI += 35;
        reasons.push("Presence of scale-forming hardness ions requires membrane ion selectivity.");
    }

    if (conductivity > 1500) {
        scores.FCDI += 20;
        reasons.push("High ionic conductivity optimizes slurry charge transport.");
    }

    if (targetTds <= 50) {
        scores.MCDI += 25;
        scores.EDI += 30;
        reasons.push("Stringent target TDS requires membrane co-ion blocking.");
    }

    const ranking = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const technology = ranking[0][0];
    const bestScore = ranking[0][1];
    const secondScore = ranking[1][1];

    let confidence = 92;
    const gap = bestScore - secondScore;
    if (gap > 50) confidence = 95;
    else if (gap > 30) confidence = 92;
    else if (gap > 15) confidence = 88;
    else confidence = 82;

    // Run exact physical engineering calculation for the recommended technology
    const eng = calculateEngineering({
        technology,
        feedWater,
        flowRate
    });

    return {
        selectedTechnology: technology,
        technology,
        confidence,
        scores,
        reason: reasons.join(" "),
        voltage: eng.voltage,
        current: eng.current,
        cellPairs: eng.cellPairs,
        electrodeArea: eng.electrodeArea,
        flowRate: eng.flowRate,
        flowVelocity: eng.flowVelocity,
        residenceTime: eng.residenceTime,
        pressureDrop: eng.pressureDrop,
        pumpPower: eng.pumpPower,
        waterRecovery: eng.waterRecovery,
        recommendedVoltage: eng.voltage,
        recommendedCurrent: eng.current,
        recommendedCellPairs: eng.cellPairs,
        expectedRemoval: eng.removalEfficiency,
        expectedOutletTDS: eng.outletTDS,
        expectedSEC: eng.sec,
        operatingMode: technology === "EDI" ? "Continuous Ion Migration" : (technology === "FCDI" ? "Continuous Slurry Flow" : "Adsorption / Desorption")
    };
}

export default aiRecommendation;