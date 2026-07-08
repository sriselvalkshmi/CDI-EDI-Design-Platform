class ComponentSizing {

    static calculate(input, technology) {

        const flow = Number(input.flowRate);
        const tds = Number(input.tds);

        let sizing = {};

        switch (technology) {

            case "CDI":

                sizing = {
                    reactorDiameter: (0.15 + flow * 0.006).toFixed(3),
                    reactorHeight: (0.50 + flow * 0.03).toFixed(3),
                    electrodeLength: (25 + flow).toFixed(1),
                    electrodeWidth: 15,
                    electrodeThickness: 0.6,
                    spacerThickness: 0.5,
                    collectorThickness: 1.5,
                    inletDiameter: 25,
                    outletDiameter: 25,
                    cellPairs: Math.ceil(tds / 120)
                };

                break;

            case "MCDI":

                sizing = {
                    reactorDiameter: (0.18 + flow * 0.006).toFixed(3),
                    reactorHeight: (0.60 + flow * 0.03).toFixed(3),
                    membraneArea: (flow * 30).toFixed(1),
                    membraneThickness: 0.15,
                    electrodeLength: (28 + flow).toFixed(1),
                    spacerThickness: 0.4,
                    inletDiameter: 32,
                    outletDiameter: 32,
                    cellPairs: Math.ceil(tds / 100)
                };

                break;

            case "FCDI":

                sizing = {
                    reactorDiameter: (0.30 + flow * 0.01).toFixed(3),
                    reactorHeight: (1.00 + flow * 0.04).toFixed(3),
                    slurryTank: (flow * 5).toFixed(1),
                    slurryFlow: (flow * 2).toFixed(1),
                    membraneArea: (flow * 35).toFixed(1)
                };

                break;

            case "EDI":

                sizing = {
                    stackHeight: (0.80 + flow * 0.04).toFixed(3),
                    stackWidth: 0.30,
                    membranePairs: Math.ceil(tds / 150),
                    resinVolume: (flow * 2).toFixed(1),
                    electrodeArea: (flow * 25).toFixed(1)
                };

                break;

            default:

                sizing = {};

        }

        return sizing;
    }

}

module.exports = ComponentSizing;