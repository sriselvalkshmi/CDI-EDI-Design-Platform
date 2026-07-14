function engineeringCalculator(feedWater, designParameters, technology) {

    //-----------------------------------------
    // INPUTS
    //-----------------------------------------

    const inputTDS = Number(feedWater.tds || 500);
    const targetTDS = Number(feedWater.targetTDS || 50);
    const flowRate = Number(feedWater.flowRate || 10);

    //-----------------------------------------
    // REQUIRED REMOVAL
    //-----------------------------------------

    const requiredRemoval = Math.max(
        0,
        inputTDS - targetTDS
    );

    const removalFraction =
        requiredRemoval / Math.max(inputTDS, 1);

    //-----------------------------------------
    // TECHNOLOGY LIMITS
    //-----------------------------------------

    let voltage = designParameters.voltage || 1.2;
    let currentDensity = designParameters.currentDensity || 20;

    switch (technology) {

        case "CDI":
            voltage = 1.2;
            currentDensity = 20;
            break;

        case "MCDI":
            voltage = 1.4;
            currentDensity = 18;
            break;

        case "FCDI":
            voltage = 1.5;
            currentDensity = 25;
            break;

        case "EDI":
            voltage = 2.0;
            currentDensity = 35;
            break;

    }

    //-----------------------------------------
    // CURRENT
    //-----------------------------------------

    const current =
        Math.max(
            2,
            flowRate * 0.5
        );

    //-----------------------------------------
    // POWER
    //-----------------------------------------

    const power =
        voltage * current;

    //-----------------------------------------
    // ELECTRODE AREA
    //-----------------------------------------

    const electrodeArea =
        Math.max(
            150,
            flowRate * 25
        );

    //-----------------------------------------
    // CELL PAIRS
    //-----------------------------------------

    const cellPairs =
        Math.max(
            5,
            Math.round(
                removalFraction * 40
            )
        );

    //-----------------------------------------
    // HYDRAULICS
    //-----------------------------------------

    const flowVelocity =
        0.10 +
        flowRate * 0.005;

    const residenceTime =
        Math.max(
            2,
            100 / flowRate
        );

    //-----------------------------------------
    // RETURN
    //-----------------------------------------

    return {

        technology,

        voltage,

        current,

        power,

        currentDensity,

        electrodeArea,

        cellPairs,

        flowVelocity,

        residenceTime,

        requiredRemoval,

        predictedRemoval:
            Number(
                (removalFraction * 100).toFixed(2)
            )

    };

}

module.exports = engineeringCalculator;