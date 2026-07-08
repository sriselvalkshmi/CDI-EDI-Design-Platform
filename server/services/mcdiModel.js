class MCDIModel {

    static calculate(input) {

        const tds = Number(input.tds);

        const flow = Number(input.flowRate);

        const target = Number(input.targetTDS || 50);

        const removal = ((tds - target) / tds) * 100;

        return {

            inputTDS: tds,

            targetTDS: target,

            removal: removal.toFixed(1),

            electrodeArea: flow * 28,

            membraneArea: flow * 15,

            electrodePairs: Math.ceil(tds / 120),

            voltage: 1.4,

            ebct: (2.5 + flow * 0.08).toFixed(2),

            energy: (flow * 0.09).toFixed(2)

        };

    }

}

module.exports = MCDIModel;