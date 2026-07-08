class CDIModel {

    static calculate(input) {

        const tds = Number(input.tds);
        const flowRate = Number(input.flowRate);

        // Assumed design target
        const targetTDS = Number(input.targetTDS || 100);

        const removal = ((tds - targetTDS) / tds) * 100;

        const electrodeArea = flowRate * 25;

        const electrodePairs = Math.ceil(tds / 150);

        const voltage = 1.2;

        const ebct = 2 + flowRate * 0.08;

        const energy = (
            voltage *
            flowRate *
            0.08
        ).toFixed(2);

        return {

            inputTDS: tds,

            targetTDS,

            removal: removal.toFixed(1),

            electrodeArea,

            electrodePairs,

            voltage,

            ebct: ebct.toFixed(2),

            energy

        };

    }

}

module.exports = CDIModel;