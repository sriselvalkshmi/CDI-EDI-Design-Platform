function electrodeModel(feedWater, engineering) {

    //--------------------------------------------------
    // Inputs
    //--------------------------------------------------

    const area =
        Number(engineering.electrodeArea || 250);      // cm²

    const thickness =
        Number(engineering.electrodeThickness || 0.06); // cm

    const voltage =
        Number(engineering.voltage || 1.2);

    const current =
        Number(engineering.current || 5);

    //--------------------------------------------------
    // Material Properties
    //--------------------------------------------------

    const porosity = 0.65;

    const density = 0.45;                 // g/cm³

    const conductivity = 120;             // S/m

    const specificCapacitance = 75;       // F/g

    const specificSurfaceArea = 1500;     // m²/g

    const averagePoreDiameter = 2.5;      // nm

    //--------------------------------------------------
    // Geometry
    //--------------------------------------------------

    const volume =
        area * thickness;

    const solidVolume =
        volume * (1 - porosity);

    const poreVolume =
        volume * porosity;

    //--------------------------------------------------
    // Mass
    //--------------------------------------------------

    const mass =
        solidVolume * density;

    //--------------------------------------------------
    // Electrical Properties
    //--------------------------------------------------

    const capacitance =
        mass * specificCapacitance;

    const resistance =
        thickness /
        (conductivity * (area / 10000));

    const storedEnergy =
        0.5 *
        capacitance *
        voltage *
        voltage;

    //--------------------------------------------------
    // Surface Properties
    //--------------------------------------------------

    const totalSurfaceArea =
        mass *
        specificSurfaceArea;

    //--------------------------------------------------
    // Salt Adsorption
    //--------------------------------------------------

    const saltRemoved =
        Math.max(
            0,
            feedWater.tds -
            feedWater.targetTds
        );

    const SAC =
        saltRemoved /
        Math.max(mass, 1);

    //--------------------------------------------------
    // Charge Efficiency
    //--------------------------------------------------

    const chargeEfficiency =
        Math.min(
            0.99,
            0.80 +
            voltage * 0.05
        );

    //--------------------------------------------------
    // Utilization
    //--------------------------------------------------

    const utilization =
        Math.min(
            1,
            SAC / 20
        );

    //--------------------------------------------------
    // Current Density
    //--------------------------------------------------

    const currentDensity =
        current /
        (area / 10000);

    //--------------------------------------------------
    // Return
    //--------------------------------------------------

    return {

        //--------------------------------------------------
        // Geometry
        //--------------------------------------------------

        area,

        thickness,

        volume:
            Number(volume.toFixed(2)),

        solidVolume:
            Number(solidVolume.toFixed(2)),

        poreVolume:
            Number(poreVolume.toFixed(2)),

        //--------------------------------------------------
        // Material
        //--------------------------------------------------

        density,

        porosity,

        conductivity,

        averagePoreDiameter,

        specificSurfaceArea,

        //--------------------------------------------------
        // Mass
        //--------------------------------------------------

        electrodeMass:
            Number(mass.toFixed(2)),

        //--------------------------------------------------
        // Electrical
        //--------------------------------------------------

        capacitance:
            Number(capacitance.toFixed(2)),

        resistance:
            Number(resistance.toFixed(4)),

        storedEnergy:
            Number(storedEnergy.toFixed(2)),

        currentDensity:
            Number(currentDensity.toFixed(2)),

        //--------------------------------------------------
        // Electrochemical
        //--------------------------------------------------

        SAC:
            Number(SAC.toFixed(3)),

        chargeEfficiency:
            Number(chargeEfficiency.toFixed(3)),

        utilization:
            Number(utilization.toFixed(3)),

        totalSurfaceArea:
            Number(totalSurfaceArea.toFixed(2))

    };

}

module.exports = electrodeModel;