function calculatePerformance(feedWater, simulation, engineering, cellDesign) {

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

    // -------- CDI Performance --------

    const electrodeMass =
        Number(cellDesign?.electrodeMass || 100);

    const adsorptionTime =
        simulation.adsorptionTime || 20;

    const SAC =
        saltRemoved / electrodeMass;

    const ASAR =
        SAC / adsorptionTime;

    const chargeEfficiency = 85;

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
            saltRemoved.toFixed(1),

        SAC:
            SAC.toFixed(2),

        ASAR:
            ASAR.toFixed(2),

        chargeEfficiency:
            chargeEfficiency.toFixed(1)

    };

}

module.exports = calculatePerformance;