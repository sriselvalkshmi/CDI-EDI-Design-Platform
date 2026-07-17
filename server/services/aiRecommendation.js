"use strict";

/*
==========================================================
AI TECHNOLOGY RECOMMENDATION ENGINE
Supports:
- CDI
- MCDI
- FCDI
- EDI
==========================================================
*/

function aiRecommendation(feedWater = {}) {

    //------------------------------------------------------
    // INPUTS
    //------------------------------------------------------

    const tds = Number(feedWater.tds ?? 500);
    const conductivity = Number(feedWater.conductivity ?? 300);
    const hardness = Number(feedWater.hardness ?? 150);
    const ph = Number(feedWater.ph ?? 7);
    const temperature = Number(feedWater.temperature ?? 25);
    const flowRate = Number(feedWater.flowRate ?? 10);
    const pressure = Number(feedWater.pressure ?? 1);
    const targetTds = Number(feedWater.targetTds ?? 50);

    //------------------------------------------------------
    // INITIAL SCORES
    //------------------------------------------------------

    const scores = {
        CDI: 0,
        MCDI: 0,
        FCDI: 0,
        EDI: 0
    };

    const reasons = [];

    //------------------------------------------------------
    // TDS
    //------------------------------------------------------

    if (tds < 100) {

        scores.EDI += 60;
        scores.MCDI += 20;
        reasons.push("Very low salinity.");

    }
    else if (tds <= 1000) {

        scores.CDI += 50;
        scores.MCDI += 60;
        reasons.push("Moderate salinity.");

    }
    else if (tds <= 5000) {

        scores.FCDI += 70;
        scores.MCDI += 20;
        reasons.push("High salinity.");

    }
    else {

        scores.FCDI += 100;
        reasons.push("Very high salinity.");

    }

    //------------------------------------------------------
    // HARDNESS
    //------------------------------------------------------

    if (hardness > 250) {

        scores.MCDI += 30;
        reasons.push("High hardness.");

    }

    //------------------------------------------------------
    // CONDUCTIVITY
    //------------------------------------------------------

    if (conductivity > 1500) {

        scores.FCDI += 20;
        reasons.push("High conductivity.");

    }

    //------------------------------------------------------
    // TARGET TDS
    //------------------------------------------------------

    if (targetTds < 10) {

        scores.EDI += 50;
        reasons.push("Ultra-pure water required.");

    }
    else if (targetTds < 100) {

        scores.MCDI += 20;

    }

    //------------------------------------------------------
    // FLOW RATE
    //------------------------------------------------------

    if (flowRate > 50) {

        scores.FCDI += 25;
        reasons.push("Large flow rate.");

    }

    //------------------------------------------------------
    // pH
    //------------------------------------------------------

    if (ph < 6 || ph > 8.5) {

        scores.MCDI += 15;
        reasons.push("Extreme pH.");

    }

    //------------------------------------------------------
    // TEMPERATURE
    //------------------------------------------------------

    if (temperature > 35) {

        scores.FCDI += 10;

    }

    //------------------------------------------------------
    // PRESSURE
    //------------------------------------------------------

    if (pressure > 3) {

        scores.EDI += 5;

    }

    //------------------------------------------------------
    // FIND BEST TECHNOLOGY
    //------------------------------------------------------

    const ranking = Object.entries(scores)
        .sort((a, b) => b[1] - a[1]);

    const technology = ranking[0][0];
    const bestScore = ranking[0][1];
    const secondScore = ranking[1][1];

    //------------------------------------------------------
    // CONFIDENCE
    //------------------------------------------------------

    let confidence = 70;

    const gap = bestScore - secondScore;

    if (gap > 50)
        confidence = 99;
    else if (gap > 35)
        confidence = 95;
    else if (gap > 20)
        confidence = 90;
    else if (gap > 10)
        confidence = 85;
    else
        confidence = 80;

    //------------------------------------------------------
    // ENGINEERING DEFAULTS
    //------------------------------------------------------

    const defaults = {

        CDI: {

            voltage: 1.2,
            current: 5,
            cellPairs: 20,
            removal: 70

        },

        MCDI: {

            voltage: 1.4,
            current: 5,
            cellPairs: 30,
            removal: 85

        },

        FCDI: {

            voltage: 1.8,
            current: 8,
            cellPairs: 40,
            removal: 95

        },

        EDI: {

            voltage: 15,
            current: 2,
            cellPairs: 100,
            removal: 99

        }

    };

    //------------------------------------------------------
    // RETURN
    //------------------------------------------------------

    return {

        technology,

        confidence,

        scores,

        recommendedVoltage:
            defaults[technology].voltage,

        recommendedCurrent:
            defaults[technology].current,

        recommendedCellPairs:
            defaults[technology].cellPairs,

        expectedRemoval:
            defaults[technology].removal,

        operatingMode:
            technology === "EDI"
                ? "Continuous Ion Migration"
                : "Adsorption / Desorption",

        reason:
            reasons.join(" ")

    };

}

module.exports = aiRecommendation;