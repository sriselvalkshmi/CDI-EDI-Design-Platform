function optimize(feedWater, sizing, engineering) {

    let bestDesign = null;

    const voltages = [1.0, 1.2, 1.4, 1.6];
    const flowRates = [5, 8, 10, 12, 15];

    for (const voltage of voltages) {

        for (const flowRate of flowRates) {

            const removal =
                Math.min(
                    99,
                    (voltage * 35) +
                    (1000 / feedWater.tds) * 20 -
                    flowRate * 1.2
                );

            const energy =
                voltage *
                flowRate *
                0.03;

            const score =
                removal -
                energy * 5;

            if (!bestDesign || score > bestDesign.score) {

                bestDesign = {

                    optimizedVoltage: voltage,

                    optimizedFlowRate: flowRate,

                    predictedRemoval:
                        removal.toFixed(1),

                    energy:
                        energy.toFixed(2),

                    adsorptionTime:
                        Math.round(feedWater.tds / 35),

                    desorptionTime:
                        Math.round(feedWater.tds / 70),

                    recovery:
                        Math.min(95, removal).toFixed(1),

                    score

                };

            }

        }

    }

    return bestDesign;

}

module.exports = optimize;