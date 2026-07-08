function simulate(technology, feedWater, parameters) {

    const inputTDS = Number(feedWater.tds);
    const flowRate = Number(feedWater.flowRate);
    const hardness = Number(feedWater.hardness || 0);

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

    }

    //--------------------------------------------------
    // Dynamic cycle time calculations
    //--------------------------------------------------

    let adsorptionTime =
        Math.round(
            10 +
            inputTDS / 150 +
            hardness / 100 -
            flowRate / 5
        );

    adsorptionTime = Math.max(10, adsorptionTime);

    let desorptionTime =
        Math.round(adsorptionTime * 0.5);

    const totalTime =
        adsorptionTime + desorptionTime;

    //--------------------------------------------------
    // Graph arrays
    //--------------------------------------------------

    const time = [];
    const voltage = [];
    const current = [];
    const tds = [];

    const appliedVoltage =
        parameters.voltage || 1.2;

    const maxCurrent =
        flowRate * 0.5 + 2;

    for (let i = 0; i <= totalTime; i++) {

        time.push(i);

        //--------------------------------------
        // ADSORPTION
        //--------------------------------------

        if (i <= adsorptionTime) {

            voltage.push(appliedVoltage);

            const currentValue =
                maxCurrent *
                Math.exp(-i / adsorptionTime);

            current.push(
                Number(currentValue.toFixed(2))
            );

            const tdsValue =
                inputTDS -
                (inputTDS * removal / 100) *
                (i / adsorptionTime);

            tds.push(
                Number(tdsValue.toFixed(1))
            );

        }

        //--------------------------------------
        // DESORPTION
        //--------------------------------------

        else {

            voltage.push(0);

            current.push(0);

            const fraction =
                (i - adsorptionTime) /
                desorptionTime;

            const tdsValue =
                inputTDS -
                (inputTDS * removal / 100) *
                (1 - fraction);

            tds.push(
                Number(tdsValue.toFixed(1))
            );

        }

    }

    //--------------------------------------------------

    const energy =
        appliedVoltage *
        maxCurrent *
        adsorptionTime /
        60;

    //--------------------------------------------------

    return {

        inputTDS,

        outputTDS:
            tds[adsorptionTime],

        removal,

        adsorptionTime,

        desorptionTime,

        energy:
            Number(energy.toFixed(2)),

        voltage,

        current,

        tds,

        time

    };

}

module.exports = simulate;