function stackDesigner(feedWater, cellDesign, engineering) {

    const cellPairs = Number(cellDesign.cellPairs);

    const electrodeThickness = 0.6;   // mm
    const spacerThickness = 0.8;      // mm
    const membraneThickness = 0.15;   // mm

    const stackThickness =
        cellPairs *
        (
            2 * electrodeThickness +
            spacerThickness +
            membraneThickness
        );

    const stackHeight =
        Math.sqrt(engineering.electrodeArea);

    const stackWidth =
        engineering.electrodeArea /
        stackHeight;

    const reactorLength =
        stackThickness / 10;

    const residenceTime =
        cellDesign.residenceTime;

    return {

        stackHeight:
            Number(stackHeight.toFixed(1)),

        stackWidth:
            Number(stackWidth.toFixed(1)),

        stackThickness:
            Number(stackThickness.toFixed(2)),

        reactorLength:
            Number(reactorLength.toFixed(2)),

        residenceTime

    };

}

module.exports = stackDesigner;