function calculateCDIDesign(feedWater, engineering) {

    const flowRate = Number(feedWater.flowRate);      // L/min
    const inletTDS = Number(feedWater.tds);           // mg/L
    const targetTDS = Number(feedWater.targetTds);

    // Salt removal required
    const saltRemoval = Math.max(0, inletTDS - targetTDS);

    // Design assumptions
    const SAC = 12;                  // mg/g
    const carbonDensity = 0.45;      // g/cm³
    const electrodeThickness = 0.6;  // mm
    const spacerThickness = 0.8;     // mm
    const cellVoltage = engineering.voltage || 1.2;

    // Electrode mass
    const electrodeMass = saltRemoval / SAC;

    // Electrode area (cm²)
    const electrodeArea = electrodeMass * 45;

    // Cell pairs
    const cellPairs = Math.max(
        1,
        Math.ceil(flowRate / 5)
    );

    // Electrode volume
    const electrodeVolume =
        electrodeMass / carbonDensity;

    // Cell volume
    const cellVolume =
        electrodeArea *
        spacerThickness *
        cellPairs /
        1000;

    // Residence time
    const residenceTime =
        (cellVolume / flowRate) * 60;

    // Hydraulic velocity
    const hydraulicVelocity =
        flowRate /
        (electrodeArea * spacerThickness);

    // Total stack thickness
    const stackThickness =
        cellPairs *
        (2 * electrodeThickness + spacerThickness);

    return {

        inletTDS,

        targetTDS,

        saltRemoval,

        SAC,

        cellVoltage,

        electrodeMass:
            electrodeMass.toFixed(2),

        electrodeArea:
            electrodeArea.toFixed(1),

        electrodeThickness,

        spacerThickness,

        electrodeVolume:
            electrodeVolume.toFixed(2),

        cellPairs,

        cellVolume:
            cellVolume.toFixed(2),

        residenceTime:
            residenceTime.toFixed(2),

        hydraulicVelocity:
            hydraulicVelocity.toFixed(3),

        stackThickness:
            stackThickness.toFixed(2)

    };

}

module.exports = calculateCDIDesign;