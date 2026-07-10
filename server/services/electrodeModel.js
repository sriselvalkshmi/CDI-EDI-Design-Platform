function electrodeModel(feedWater, engineering) {

    const area = engineering.electrodeArea;      // cm²

    const thickness = 0.06;                      // cm (0.6 mm)

    const porosity = 0.65;

    const density = 0.45;                        // g/cm³

    const volume =
        area *
        thickness;

    const solidVolume =
        volume *
        (1 - porosity);

    const mass =
        solidVolume *
        density;

    const capacitance =
        mass * 75;        // F/g activated carbon

    return {

        area,

        thickness,

        porosity,

        density,

        volume:
            Number(volume.toFixed(2)),

        electrodeMass:
            Number(mass.toFixed(2)),

        capacitance:
            Number(capacitance.toFixed(1))

    };

}

module.exports = electrodeModel;