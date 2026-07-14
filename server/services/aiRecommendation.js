function aiRecommendation(feedWater) {

    //--------------------------------------------------
    // Inputs
    //--------------------------------------------------

    const tds =
        Number(feedWater.tds || 500);

    const conductivity =
        Number(feedWater.conductivity || 500);

    const hardness =
        Number(feedWater.hardness || 150);

    const ph =
        Number(feedWater.ph || 7);

    const temperature =
        Number(feedWater.temperature || 25);

    const flowRate =
        Number(feedWater.flowRate || 10);

    const pressure =
        Number(feedWater.pressure || 1);

    const targetTDS =
        Number(feedWater.targetTds || 50);

    //--------------------------------------------------
    // Technology Scores
    //--------------------------------------------------

    const scores = {

        CDI: 0,

        MCDI: 0,

        FCDI: 0,

        EDI: 0

    };

    const reasons = [];

    //--------------------------------------------------
    // TDS Evaluation
    //--------------------------------------------------

    if (tds < 100) {

        scores.EDI += 50;

        reasons.push(
            "Very low salinity suitable for EDI."
        );

    }

    else if (tds <= 1200) {

        scores.CDI += 40;
        scores.MCDI += 45;

        reasons.push(
            "Moderate salinity suitable for CDI/MCDI."
        );

    }

    else if (tds <= 5000) {

        scores.FCDI += 55;

        reasons.push(
            "High salinity favors Flow CDI."
        );

    }

    else {

        scores.FCDI += 70;

        reasons.push(
            "Very high salinity requires Flow CDI."
        );

    }

    //--------------------------------------------------
    // Hardness
    //--------------------------------------------------

    if (hardness > 250) {

        scores.MCDI += 25;

        reasons.push(
            "High hardness favors membrane protected electrodes."
        );

    }

    //--------------------------------------------------
    // Conductivity
    //--------------------------------------------------

    if (conductivity > 1500) {

        scores.FCDI += 20;

        reasons.push(
            "High conductivity benefits Flow CDI."
        );

    }

    //--------------------------------------------------
    // Target Water Quality
    //--------------------------------------------------

    if (targetTDS < 20) {

        scores.EDI += 40;

        reasons.push(
            "Ultra-pure water target favors EDI."
        );

    }

    else if (targetTDS < 100) {

        scores.MCDI += 10;

    }

    //--------------------------------------------------
    // Flow Rate
    //--------------------------------------------------

    if (flowRate > 50) {

        scores.FCDI += 20;

        reasons.push(
            "Large flow rate favors Flow CDI."
        );

    }

    //--------------------------------------------------
    // pH
    //--------------------------------------------------

    if (ph < 6 || ph > 8.5) {

        scores.MCDI += 15;

        reasons.push(
            "Extreme pH favors membrane protected CDI."
        );

    }

    //--------------------------------------------------
    // Temperature
    //--------------------------------------------------

    if (temperature > 35) {

        scores.FCDI += 10;

    }

    //--------------------------------------------------
    // Pressure
    //--------------------------------------------------

    if (pressure > 3) {

        scores.EDI += 5;

    }

    //--------------------------------------------------
    // Select Best Technology
    //--------------------------------------------------

    let technology = "CDI";

    let confidence = -1;

    for (const tech in scores) {

        if (scores[tech] > confidence) {

            confidence = scores[tech];

            technology = tech;

        }

    }

    //--------------------------------------------------
    // Engineering Defaults
    //--------------------------------------------------

    let recommendedVoltage = 1.2;

    let recommendedCellPairs = 20;

    let expectedRemoval = 70;

    switch (technology) {

        case "CDI":

            recommendedVoltage = 1.2;
            recommendedCellPairs = 20;
            expectedRemoval = 70;

            break;

        case "MCDI":

            recommendedVoltage = 1.4;
            recommendedCellPairs = 30;
            expectedRemoval = 85;

            break;

        case "FCDI":

            recommendedVoltage = 1.8;
            recommendedCellPairs = 40;
            expectedRemoval = 95;

            break;

        case "EDI":

            recommendedVoltage = 15;
            recommendedCellPairs = 100;
            expectedRemoval = 99;

            break;

    }

    //--------------------------------------------------
    // Return
    //--------------------------------------------------

    return {

        technology,

        confidence,

        scores,

        recommendedVoltage,

        recommendedCellPairs,

        expectedRemoval,

        reason:

            reasons.join(" "),

        operatingMode:

            technology === "EDI"

                ?

                "Continuous ion migration"

                :

                "Adsorption / Desorption"

    };

}

module.exports = aiRecommendation;