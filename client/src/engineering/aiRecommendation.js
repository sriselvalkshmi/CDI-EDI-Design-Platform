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
        scores.EDI += 60;
        scores.MCDI += 20;
        reasons.push("Low feed TDS is ideal for EDI high-purity polishing.");
    } else if (tds <= 1000) {
        scores.CDI += 50;
        scores.MCDI += 60;
        reasons.push("Moderate TDS feed water is well suited for CDI/MCDI.");
    } else if (tds <= 5000) {
        scores.FCDI += 70;
        scores.MCDI += 20;
        reasons.push("High TDS stream favors Flowable Electrode CDI (FCDI).");
    } else {
        scores.FCDI += 100;
        reasons.push("Very high salinity feed requires FCDI continuous slurry operation.");
    }

    if (hardness > 250) {
        scores.MCDI += 30;
        reasons.push("High hardness stream benefits from MCDI ion exchange membranes.");
    }

    if (conductivity > 1500) {
        scores.FCDI += 20;
        reasons.push("High ionic conductivity optimizes slurry charge transport.");
    }

    if (targetTds < 10) {
        scores.EDI += 50;
        reasons.push("Ultra-pure target salinity requires EDI continuous regeneration.");
    } else if (targetTds < 100) {
        scores.MCDI += 20;
    }

    if (flowRate > 50) {
        scores.FCDI += 25;
        reasons.push("High volumetric flow rate operates efficiently with scalable cell stacks.");
    }

    const ranking = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const technology = ranking[0][0];
    const bestScore = ranking[0][1];
    const secondScore = ranking[1][1];

    let confidence = 70;
    const gap = bestScore - secondScore;

    if (gap > 50) confidence = 99;
    else if (gap > 35) confidence = 95;
    else if (gap > 20) confidence = 90;
    else if (gap > 10) confidence = 85;
    else confidence = 80;

    const defaults = {
        CDI: { voltage: 1.2, current: 5.0, cellPairs: 20, electrodeArea: 250, flowVelocity: 0.15, residenceTime: 10.0, pressureDrop: 180.5, pumpPower: 0.05, waterRecovery: 90.0, removal: 70 },
        MCDI: { voltage: 1.4, current: 5.0, cellPairs: 30, electrodeArea: 250, flowVelocity: 0.18, residenceTime: 8.0, pressureDrop: 210.0, pumpPower: 0.07, waterRecovery: 92.0, removal: 85 },
        FCDI: { voltage: 1.8, current: 8.0, cellPairs: 40, electrodeArea: 300, flowVelocity: 0.25, residenceTime: 6.0, pressureDrop: 320.0, pumpPower: 0.12, waterRecovery: 94.0, removal: 95 },
        EDI: { voltage: 15.0, current: 2.0, cellPairs: 100, electrodeArea: 500, flowVelocity: 0.35, residenceTime: 3.0, pressureDrop: 450.0, pumpPower: 0.20, waterRecovery: 98.0, removal: 99 }
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