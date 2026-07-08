function aiRecommendation(feedWater) {

    const tds = Number(feedWater.tds);
    const hardness = Number(feedWater.hardness);
    const conductivity = Number(feedWater.conductivity);
    const target = Number(feedWater.targetTds);
    const flow = Number(feedWater.flowRate);
    const ph = Number(feedWater.ph);

    let scores = {
        CDI: 0,
        MCDI: 0,
        FCDI: 0,
        EDI: 0
    };

    // ---------------- TDS ----------------

    if (tds < 100) {

        scores.EDI += 50;

    }
    else if (tds < 1500) {

        scores.CDI += 40;
        scores.MCDI += 45;

    }
    else {

        scores.FCDI += 50;

    }

    // ---------------- Hardness ----------------

    if (hardness > 250) {

        scores.MCDI += 30;

    }

    // ---------------- Conductivity ----------------

    if (conductivity > 1500) {

        scores.FCDI += 20;

    }

    // ---------------- Target Water ----------------

    if (target < 20) {

        scores.EDI += 40;

    }

    // ---------------- Flow ----------------

    if (flow > 50) {

        scores.FCDI += 20;

    }

    // ---------------- pH ----------------

    if (ph < 6 || ph > 8.5) {

        scores.MCDI += 10;

    }

    let technology = "CDI";
    let bestScore = -1;

    for (const tech in scores) {

        if (scores[tech] > bestScore) {

            bestScore = scores[tech];
            technology = tech;

        }

    }

    return {

        technology,

        confidence: bestScore,

        scores,

        reason: `Selected ${technology} based on feed water characteristics.`

    };

}

module.exports = aiRecommendation;