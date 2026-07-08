function getParameters(technology) {

    let params = {};

    switch (technology) {

        case "CDI":

            params = {
                technology: "CDI",
                electrodeArea: 250,
                electrodeThickness: 0.5,
                electrodePairs: 10,
                electrodeSpacing: 1,
                voltage: 1.2,
                flowRate: 10,
                SAC: 15,
                chargeEfficiency: 0.85
            };

            break;

        case "MCDI":

            params = {
                technology: "MCDI",
                electrodeArea: 250,
                electrodePairs: 15,
                electrodeSpacing: 1,
                voltage: 1.4,
                flowRate: 10,
                SAC: 25,
                chargeEfficiency: 0.95,
                membraneResistance: 2
            };

            break;

        case "FCDI":

            params = {
                technology: "FCDI",
                membraneArea: 500,
                voltage: 1.6,
                slurryFlowRate: 50,
                flowElectrodeConcentration: 10
            };

            break;

        case "EDI":

            params = {
                technology: "EDI",
                membraneArea: 500,
                currentDensity: 50,
                voltage: 20,
                resinVolume: 200,
                flowRate: 20
            };

            break;

        default:

            params = {
                technology: "CDI"
            };

    }

    return params;

}

module.exports = getParameters;