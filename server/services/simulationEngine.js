function simulate(technology, feedWater, parameters) {

    // Safety defaults
    if (!parameters) {
        parameters = {
            voltage: 1.2,
            flowRate: feedWater.flowRate || 10
        };
    }

    const inputTDS = Number(feedWater.tds);

    let removal = 70;

    switch (technology) {

        case "CDI":
            removal = 70;
            break;

        case "MCDI":
            removal = 85;
            break;

        case "FCDI":
            removal = 92;
            break;

        case "EDI":
            removal = 98;
            break;

        default:
            removal = 70;
    }

    const adsorptionTime = 20;
    const desorptionTime = 10;
    const totalTime = adsorptionTime + desorptionTime;

    const time = [];
    const voltage = [];
    const current = [];
    const tds = [];

    for (let i = 0; i <= totalTime; i++) {

        time.push(i);

        if (i <= adsorptionTime) {

            voltage.push(parameters.voltage ?? 1.2);

            current.push(
                Math.max(5 - i * 0.12, 0)
            );

            const value =
                inputTDS -
                (inputTDS * removal / 100) *
                (i / adsorptionTime);

            tds.push(Number(value.toFixed(2)));

        } else {

            voltage.push(0);

            current.push(0);

            tds.push(inputTDS);

        }

    }

    return {

        inputTDS,

        outputTDS: tds[adsorptionTime],

        adsorptionTime,

        desorptionTime,

        voltage,

        current,

        tds,

        time

    };

}

module.exports = simulate;