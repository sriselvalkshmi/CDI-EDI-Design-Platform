function optimize(feedWater, sizing, engineering) {

    //--------------------------------------------------
    // User Inputs
    //--------------------------------------------------

    const inletTDS =
        Number(feedWater.tds);

    const targetTDS =
        Number(feedWater.targetTds);

    const baseArea =
        Number(engineering.electrodeArea);

    //--------------------------------------------------
    // Search Space
    //--------------------------------------------------

    const voltages =
        [1.0, 1.2, 1.4, 1.6, 1.8];

    const flowRates =
        [5, 8, 10, 12, 15];

    const electrodeAreas =
        [200, 250, 300, 350, 400];

    const cellPairs =
        [20, 30, 40, 50, 60];

    //--------------------------------------------------
    // Best Design
    //--------------------------------------------------

    let bestDesign = null;

    //--------------------------------------------------
    // Optimization Loop
    //--------------------------------------------------

    for (const voltage of voltages) {

        for (const flowRate of flowRates) {

            for (const area of electrodeAreas) {

                for (const cells of cellPairs) {

                    //----------------------------------
                    // Current
                    //----------------------------------

                    const current =

                        flowRate * 0.5;

                    //----------------------------------
                    // Current Density
                    //----------------------------------

                    const currentDensity =

                        current / area;

                    //----------------------------------
                    // Residence Time
                    //----------------------------------

                    const residenceTime =

                        (area * cells) /

                        (flowRate * 100);

                    //----------------------------------
                    // Predicted Removal
                    //----------------------------------

                    let removal =

                        40 +

                        voltage * 20 +

                        Math.log(area) * 6 +

                        residenceTime * 2 -

                        flowRate * 0.8;

                    removal =

                        Math.min(

                            99,

                            Math.max(

                                50,

                                removal

                            )

                        );

                    //----------------------------------
                    // Outlet TDS
                    //----------------------------------

                    const outletTDS =

                        inletTDS *

                        (

                            1 -

                            removal / 100

                        );

                    //----------------------------------
                    // Electrical Power
                    //----------------------------------

                    const power =

                        voltage *

                        current;

                    //----------------------------------
                    // Energy
                    //----------------------------------

                    const energy =

                        power *

                        residenceTime /

                        60;

                    //----------------------------------
                    // Specific Energy
                    //----------------------------------

                    const specificEnergy =

                        energy /

                        Math.max(

                            flowRate / 1000,

                            0.001

                        );

                    //----------------------------------
                    // Pressure Drop
                    //----------------------------------

                    const pressureDrop =

                        0.03 *

                        flowRate *

                        flowRate /

                        area;

                    //----------------------------------
                    // Objective Function
                    //----------------------------------

                    const score =

                        removal

                        -

                        0.8 * specificEnergy

                        -

                        2 * pressureDrop

                        -

                        Math.abs(

                            targetTDS -

                            outletTDS

                        ) * 0.2;

                    //----------------------------------
                    // Save Best Design
                    //----------------------------------

                    if (

                        bestDesign === null ||

                        score >

                        bestDesign.score

                    ) {

                        bestDesign = {

                            optimizedVoltage:
                                voltage,

                            optimizedFlowRate:
                                flowRate,

                            optimizedElectrodeArea:
                                area,

                            optimizedCellPairs:
                                cells,

                            predictedRemoval:
                                Number(
                                    removal.toFixed(2)
                                ),

                            outletTDS:
                                Number(
                                    outletTDS.toFixed(2)
                                ),

                            current:
                                Number(
                                    current.toFixed(2)
                                ),

                            currentDensity:
                                Number(
                                    currentDensity.toFixed(4)
                                ),

                            residenceTime:
                                Number(
                                    residenceTime.toFixed(2)
                                ),

                            power:
                                Number(
                                    power.toFixed(2)
                                ),

                            energy:
                                Number(
                                    energy.toFixed(3)
                                ),

                            specificEnergy:
                                Number(
                                    specificEnergy.toFixed(3)
                                ),

                            pressureDrop:
                                Number(
                                    pressureDrop.toFixed(3)
                                ),

                            recovery:
                                Number(
                                    Math.min(
                                        95,
                                        removal
                                    ).toFixed(1)
                                ),

                            score:
                                Number(
                                    score.toFixed(2)
                                )

                        };

                    }

                }

            }

        }

    }

    return bestDesign;

}

module.exports = optimize;