function getParameters(technology) {

    let params = {};

    switch (technology) {

        //--------------------------------------------------
        // Capacitive Deionization
        //--------------------------------------------------

        case "CDI":

            params = {

                technology: "CDI",

                //--------------------------------------------------
                // Electrical
                //--------------------------------------------------

                voltage: 1.2,

                currentDensity: 20,

                chargeEfficiency: 0.85,

                specificCapacitance: 75,

                //--------------------------------------------------
                // Electrode
                //--------------------------------------------------

                electrodeArea: 250,

                electrodeThickness: 0.6,

                electrodePairs: 20,

                electrodeSpacing: 0.8,

                porosity: 0.65,

                density: 0.45,

                conductivity: 120,

                //--------------------------------------------------
                // Adsorption
                //--------------------------------------------------

                SAC: 15,

                ASAR: 1.2,

                adsorptionTime: 20,

                desorptionTime: 10,

                //--------------------------------------------------
                // Hydraulic
                //--------------------------------------------------

                flowRate: 10,

                flowVelocity: 0.15,

                residenceTime: 5,

                recovery: 90,

                //--------------------------------------------------
                // Performance
                //--------------------------------------------------

                expectedRemoval: 70

            };

            break;

        //--------------------------------------------------
        // Membrane CDI
        //--------------------------------------------------

        case "MCDI":

            params = {

                technology: "MCDI",

                voltage: 1.4,

                currentDensity: 25,

                chargeEfficiency: 0.92,

                specificCapacitance: 85,

                electrodeArea: 250,

                electrodeThickness: 0.6,

                electrodePairs: 30,

                electrodeSpacing: 0.8,

                porosity: 0.65,

                density: 0.45,

                conductivity: 120,

                membraneResistance: 2,

                membraneThickness: 0.15,

                SAC: 25,

                ASAR: 2.0,

                adsorptionTime: 18,

                desorptionTime: 9,

                flowRate: 10,

                flowVelocity: 0.18,

                residenceTime: 4,

                recovery: 92,

                expectedRemoval: 85

            };

            break;

        //--------------------------------------------------
        // Flow CDI
        //--------------------------------------------------

        case "FCDI":

            params = {

                technology: "FCDI",

                voltage: 1.8,

                currentDensity: 30,

                chargeEfficiency: 0.95,

                specificCapacitance: 95,

                electrodeArea: 300,

                electrodeThickness: 0.7,

                electrodePairs: 40,

                electrodeSpacing: 1.0,

                porosity: 0.70,

                density: 0.50,

                conductivity: 150,

                membraneThickness: 0.18,

                slurryFlowRate: 50,

                slurryConcentration: 10,

                SAC: 40,

                ASAR: 3.5,

                adsorptionTime: 15,

                desorptionTime: 7,

                flowRate: 20,

                flowVelocity: 0.25,

                residenceTime: 3,

                recovery: 94,

                expectedRemoval: 95

            };

            break;

        //--------------------------------------------------
        // Electrodeionization
        //--------------------------------------------------

        case "EDI":

            params = {

                technology: "EDI",

                voltage: 15,

                currentDensity: 50,

                chargeEfficiency: 0.99,

                membraneArea: 500,

                membraneThickness: 0.20,

                resinVolume: 200,

                electrodePairs: 100,

                conductivity: 200,

                flowRate: 20,

                flowVelocity: 0.35,

                residenceTime: 2,

                recovery: 98,

                expectedRemoval: 99,

                operatingMode:

                    "Continuous"

            };

            break;

        //--------------------------------------------------
        // Default
        //--------------------------------------------------

        default:

            params = {

                technology: "CDI",

                voltage: 1.2,

                electrodeArea: 250

            };

    }

    return params;

}

module.exports = getParameters;