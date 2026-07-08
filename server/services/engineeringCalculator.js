const EquationEngine = require("./equationEngine");

function engineeringCalculator(input, design) {

    const area =
        EquationEngine.electrodeArea(
            20,
            12.5
        );

    const reactorVolume =
        EquationEngine.reactorVolume(
            design.filterDiameter || 0.25,
            design.filterHeight || 0.5
        );

    const ebct =
        EquationEngine.emptyBedContactTime(
            reactorVolume,
            input.flowRate
        );

    const sac =
        EquationEngine.saltAdsorptionCapacity(
            120,
            8
        );

    return {

        area,

        reactorVolume,

        ebct,

        sac

    };

}

module.exports = engineeringCalculator;