function engineeringCalculator(feedWater, designParameters, technology) {

    let voltage = designParameters.voltage;

    let current = feedWater.flowRate * 0.5;

    let electrodeArea = 250;

    switch (technology) {

        case "MCDI":

            voltage = 1.4;
            electrodeArea = 220;
            break;

        case "FCDI":

            voltage = 1.8;
            electrodeArea = 300;
            break;

        case "EDI":

            voltage = 15;
            electrodeArea = 500;
            break;

        default:

            voltage = 1.2;
            electrodeArea = 250;

    }

    const currentDensity =
        current / electrodeArea;

    const power =
        voltage * current;

    const reactorVolume =
        (feedWater.flowRate * 5) / 1000;

    const ebct =
        reactorVolume /
        (feedWater.flowRate / 1000);

    const sac =
        (feedWater.tds - feedWater.targetTds) / 20;

    return {

        voltage,

        current,

        power,

        electrodeArea,

        currentDensity:
            Number(currentDensity.toFixed(4)),

        reactorVolume:
            Number(reactorVolume.toFixed(3)),

        ebct:
            Number(ebct.toFixed(2)),

        sac:
            Number(sac.toFixed(2))

    };

}

module.exports = engineeringCalculator;