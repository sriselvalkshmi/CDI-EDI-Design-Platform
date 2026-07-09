function generateLayout(stack, engineering) {

    return {

        width: stack.stackWidth,

        height: stack.stackHeight,

        thickness: stack.stackThickness,

        electrodeArea: engineering.electrodeArea,

        cellPairs: Math.round(stack.stackThickness / 2),

        inletX: 20,

        outletX: stack.stackWidth - 20

    };

}

module.exports = generateLayout;