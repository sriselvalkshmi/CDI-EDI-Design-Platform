function calculate(feedWater, technology) {

    //--------------------------------------------------
    // INPUTS
    //--------------------------------------------------

    const flowRate =
        Number(feedWater.flowRate || 10);

    const inputTDS =
        Number(feedWater.tds || 500);

    //--------------------------------------------------
    // TECHNOLOGY FACTOR
    //--------------------------------------------------

    let factor = 1.0;

    switch (technology) {

        case "CDI":
            factor = 1.0;
            break;

        case "MCDI":
            factor = 1.15;
            break;

        case "FCDI":
            factor = 1.30;
            break;

        case "EDI":
            factor = 1.50;
            break;

    }

    //--------------------------------------------------
    // ELECTRODE SIZE
    //--------------------------------------------------

    const electrodeLength =
        Math.max(
            200,
            flowRate * 20
        );

    const electrodeWidth =
        Math.max(
            100,
            flowRate * 10
        );

    const electrodeThickness = 0.6;

    const spacerThickness = 0.5;

    //--------------------------------------------------
    // CELL PAIRS
    //--------------------------------------------------

    const cellPairs =
        Math.max(
            5,
            Math.round(inputTDS / 100)
        );

    //--------------------------------------------------
    // STACK DIMENSIONS
    //--------------------------------------------------

    const stackLength =
        electrodeLength;

    const stackWidth =
        electrodeWidth;

    const stackHeight =
        cellPairs *
        (
            electrodeThickness +
            spacerThickness
        );

    //--------------------------------------------------
    // REACTOR SIZE
    //--------------------------------------------------

    const reactorDiameter =
        Number(
            (
                stackWidth * 1.4
            ).toFixed(1)
        );

    const reactorHeight =
        Number(
            (
                stackHeight * 1.5
            ).toFixed(1)
        );

    //--------------------------------------------------
    // ELECTRODE AREA
    //--------------------------------------------------

    const electrodeArea =
        Number(
            (
                electrodeLength *
                electrodeWidth /
                100
            ).toFixed(1)
        );

    //--------------------------------------------------
    // RETURN
    //--------------------------------------------------

    return {

        technology,

        reactorDiameter,

        reactorHeight,

        stackLength,

        stackWidth,

        stackHeight,

        electrodeLength,

        electrodeWidth,

        electrodeArea,

        electrodeThickness,

        spacerThickness,

        collectorThickness: 1.5,

        inletDiameter: 25,

        outletDiameter: 25,

        cellPairs

    };

}

module.exports = { calculate };