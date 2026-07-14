function performanceCalculator(
    feedWater,
    simulation,
    engineering,
    cellDesign
) {

    //--------------------------------------------------
    // Inputs
    //--------------------------------------------------

    const inputTDS =
        Number(feedWater.tds || 500);

    const outputTDS =
        Number(simulation.outputTDS || inputTDS);

    const voltage =
        Number(engineering.voltage || 1.2);

    const current =
        Number(engineering.current || 5);

    const power =
        Number(engineering.power || voltage * current);

    const flowRate =
        Number(feedWater.flowRate || 10);

    //--------------------------------------------------
    // Salt Removal
    //--------------------------------------------------

    const saltRemoval =
        inputTDS - outputTDS;

    const removalEfficiency =
        inputTDS > 0
            ? (saltRemoval / inputTDS) * 100
            : 0;

    //--------------------------------------------------
    // Energy
    //--------------------------------------------------

    const specificEnergy =
        Number(simulation.specificEnergy || 0);

    //--------------------------------------------------
    // Cell Design
    //--------------------------------------------------

    const cellPairs =
        Number(
            engineering.cellPairs ||
            cellDesign.cellPairs ||
            5
        );

    //--------------------------------------------------
    // Optimization Score
    //--------------------------------------------------

    const optimizationScore =
        Number(
            simulation.optimizationScore ||
            removalEfficiency * 0.75
        );

    //--------------------------------------------------
    // Return
    //--------------------------------------------------

    return {

        technology: engineering.technology || "CDI",

        inputTDS,

        outputTDS,

        outletTDS: outputTDS,

        saltRemoval,

        removalEfficiency,

        voltage,

        current,

        power,

        flowRate,

        cellPairs,

        specificEnergy,

        optimizationScore,

        chargeEfficiency:
            simulation.chargeEfficiency || 0.8,

        sac:
            simulation.sac || 15,

        pressureDrop:
            simulation.pressureDrop || 0,

        waterRecovery:
            simulation.recovery || 95

    };

}

module.exports = performanceCalculator;