function calculatePerformance(feedWater, simulation, engineering) {

    const inletTDS = feedWater.tds;
    const outletTDS = simulation.outputTDS;

    const removalEfficiency =
        ((inletTDS - outletTDS) / inletTDS) * 100;

    const waterRecovery = 90;

    const energyConsumption =
        (
            engineering.voltage *
            engineering.current *
            simulation.adsorptionTime
        ) / 60000;

    const saltRemoved =
        inletTDS - outletTDS;

    const specificEnergy =
        energyConsumption /
        (feedWater.flowRate / 1000);

    return {

        inletTDS,

        outletTDS,

        removalEfficiency:
            removalEfficiency.toFixed(2),

        waterRecovery:
            waterRecovery.toFixed(1),

        energyConsumption:
            energyConsumption.toFixed(4),

        specificEnergy:
            specificEnergy.toFixed(3),

        saltRemoved:
            saltRemoved.toFixed(1)

    };

}

module.exports = calculatePerformance;