"use strict";

/*
==========================================================
AI TECHNOLOGY RECOMMENDATION ENGINE
Supports: CDI, MCDI, FCDI, EDI
==========================================================
*/

function aiRecommendation(feedWater = {}) {
    const tds = Number(feedWater.tds ?? 500);
    const conductivity = Number(feedWater.conductivity ?? 300);
    const hardness = Number(feedWater.hardness ?? 150);
    const ph = Number(feedWater.ph ?? 7);
    const temperature = Number(feedWater.temperature ?? 25);
    const flowRate = Number(feedWater.flowRate ?? 10);
    const pressure = Number(feedWater.pressure ?? 1);
    const targetTds = Number(feedWater.targetTds ?? 50);

    const scores = {
        CDI: 0,
        MCDI: 0,
        FCDI: 0,
        EDI: 0
    };

    const reasons = [];

    if (tds < 100) {
        scores.EDI += 70;
        scores.MCDI += 20;
        reasons.push("Low feed TDS is ideal for EDI high-purity polishing.");
    } else if (tds <= 1000) {
        scores.MCDI += 65;
        scores.CDI += 40;
        reasons.push("Moderate salinity feed water with dissolved minerals requires MCDI.");
    } else if (tds <= 5000) {
        scores.FCDI += 75;
        scores.MCDI += 20;
        reasons.push("High TDS stream favors Flowable Electrode CDI (FCDI).");
    } else {
        scores.FCDI += 100;
        reasons.push("Very high salinity feed requires FCDI continuous slurry operation.");
    }

    if (hardness >= 100) {
        scores.MCDI += 35;
        reasons.push("Presence of hardness ions requires membrane-assisted CDI (MCDI) for ion selectivity.");
    }

    if (conductivity > 1500) {
        scores.FCDI += 20;
        reasons.push("High ionic conductivity optimizes slurry charge transport.");
    }

    if (targetTds <= 50) {
        scores.MCDI += 25;
        scores.EDI += 30;
        reasons.push("Stringent target TDS requires membrane ion blocking.");
    }

    if (flowRate > 50) {
        scores.FCDI += 25;
        reasons.push("High volumetric flow rate operates efficiently with scalable cell stacks.");
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

    const defaults = {
        CDI: { voltage: 1.2, current: 6.0, cellPairs: 36, electrodeArea: 350, flowVelocity: 0.12, residenceTime: 10.0, pressureDrop: 22.5, pumpPower: 0.05, waterRecovery: 90.0, removal: 85 },
        MCDI: { voltage: 1.4, current: 8.0, cellPairs: 48, electrodeArea: 420, flowVelocity: 0.15, residenceTime: 12.0, pressureDrop: 25.85, pumpPower: 0.06, waterRecovery: 95.0, removal: 90.4 },
        FCDI: { voltage: 1.8, current: 10.0, cellPairs: 60, electrodeArea: 500, flowVelocity: 0.22, residenceTime: 15.0, pressureDrop: 32.0, pumpPower: 0.09, waterRecovery: 94.0, removal: 95 },
        EDI: { voltage: 15.0, current: 3.0, cellPairs: 100, electrodeArea: 600, flowVelocity: 0.30, residenceTime: 18.0, pressureDrop: 45.0, pumpPower: 0.15, waterRecovery: 98.0, removal: 99 }
    };

    const techDefaults = defaults[technology];

    return {
        selectedTechnology: technology,
        technology,
        confidence,
        scores,
        reason: reasons.join(" "),
        voltage: techDefaults.voltage,
        current: techDefaults.current,
        cellPairs: techDefaults.cellPairs,
        electrodeArea: techDefaults.electrodeArea,
        flowVelocity: techDefaults.flowVelocity,
        residenceTime: techDefaults.residenceTime,
        pressureDrop: techDefaults.pressureDrop,
        pumpPower: techDefaults.pumpPower,
        waterRecovery: techDefaults.waterRecovery,
        recommendedVoltage: techDefaults.voltage,
        recommendedCurrent: techDefaults.current,
        recommendedCellPairs: techDefaults.cellPairs,
        expectedRemoval: techDefaults.removal,
        operatingMode: technology === "EDI" ? "Continuous Ion Migration" : "Adsorption / Desorption"
    };
}

export default aiRecommendation;