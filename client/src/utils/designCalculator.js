export default function designCalculator(feedWater, technology) {

    const tds = Number(feedWater.tds || 500);
    const flowRate = Number(feedWater.flowRate || 10);

    let design = {};

    switch (technology) {

        case "CDI":

            design = {

                filterDiameter: (0.18 + flowRate * 0.005).toFixed(3),

                filterHeight: (0.45 + flowRate * 0.02).toFixed(3),

                electrodePairs: Math.ceil(tds / 100),

                electrodeArea: (tds * 0.35).toFixed(1),

                electrodeSpacing: 1,

                electrodeThickness: 0.5,

                voltage: 1.2,

                ebct: (2.5 + flowRate * 0.05).toFixed(2),

                inletDiameter: 25,

                outletDiameter: 25

            };

            break;

        case "MCDI":

            design = {

                filterDiameter: (0.20 + flowRate * 0.006).toFixed(3),

                filterHeight: (0.60 + flowRate * 0.02).toFixed(3),

                electrodePairs: Math.ceil(tds / 80),

                membraneArea: (tds * 0.40).toFixed(1),

                voltage: 1.4,

                ebct: (3 + flowRate * 0.05).toFixed(2),

                inletDiameter: 32,

                outletDiameter: 32

            };

            break;

        case "FCDI":

            design = {

                reactorDiameter: (0.30 + flowRate * 0.01).toFixed(3),

                reactorHeight: (0.80 + flowRate * 0.03).toFixed(3),

                slurryFlowRate: flowRate * 2,

                membraneArea: (tds * 0.55).toFixed(1),

                voltage: 1.6,

                ebct: (4 + flowRate * 0.08).toFixed(2)

            };

            break;

        case "EDI":

            design = {

                stackHeight: (0.80 + flowRate * 0.04).toFixed(3),

                membranePairs: Math.ceil(tds / 150),

                resinVolume: (flowRate * 2).toFixed(1),

                currentDensity: 50,

                voltage: 18,

                ebct: (5 + flowRate * 0.08).toFixed(2)

            };

            break;

        default:

            design = {};

    }

    return design;

}