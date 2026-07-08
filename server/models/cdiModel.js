function simulateCDI(input) {

    const {
        tds,
        voltage,
        flowRate,
        electrodeArea,
        cellPairs
    } = input;

    // Placeholder equations (will later be replaced by literature models)

    const saltRemoval =
        Math.min(95, voltage * 55);

    const outletTDS =
        tds * (1 - saltRemoval / 100);

    const sac =
        (tds - outletTDS) *
        flowRate /
        electrodeArea;

    return {

        technology: "CDI",

        outletTDS,

        saltRemoval,

        SAC: sac,

        energy:
            voltage * 0.62,

        recovery: 92,

        cellPairs

    };

}

module.exports = simulateCDI;