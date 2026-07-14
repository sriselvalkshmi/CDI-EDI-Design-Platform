function calculateCDIDesign(feedWater, engineering) {

    //--------------------------------------------------
    // Feed Water
    //--------------------------------------------------

    const flowRate =
        Number(feedWater.flowRate);

    const inletTDS =
        Number(feedWater.tds);

    const targetTDS =
        Number(feedWater.targetTds);

    //--------------------------------------------------
    // Engineering Inputs
    //--------------------------------------------------

    const voltage =
        Number(engineering.voltage || 1.2);

    const current =
        Number(engineering.current || 5);

    const currentDensity =
        Number(engineering.currentDensity || 20);

    const electrodeArea =
        Number(engineering.electrodeArea || 250);

    const electrodeThickness =
        Number(engineering.electrodeThickness || 0.6);

    const spacerThickness =
        Number(engineering.spacerThickness || 0.8);

    const residenceTime =
        Number(engineering.residenceTime || 5);

    const cellPairs =
        Number(engineering.cellPairs || 30);

    //--------------------------------------------------
    // Material Properties
    //--------------------------------------------------

    const carbonDensity = 0.45;      // g/cm³

    const porosity = 0.72;

    const conductivity = 5.0;        // S/m

    //--------------------------------------------------
    // Salt Removal
    //--------------------------------------------------

    const saltRemoval =

        Math.max(

            0,

            inletTDS -

            targetTDS

        );

    //--------------------------------------------------
    // Electrode Geometry
    //--------------------------------------------------

    const electrodeLength =

        Math.sqrt(

            electrodeArea * 2

        );

    const electrodeWidth =

        electrodeArea /

        electrodeLength;

    const electrodeVolume =

        electrodeArea *

        (electrodeThickness / 10);

    const electrodeMass =

        electrodeVolume *

        carbonDensity;

    //--------------------------------------------------
    // SAC
    //--------------------------------------------------

    const SAC =

        saltRemoval /

        Math.max(

            electrodeMass,

            1

        );

    //--------------------------------------------------
    // Carbon Loading
    //--------------------------------------------------

    const carbonLoading =

        electrodeMass /

        electrodeArea;

    //--------------------------------------------------
    // Flow Channel
    //--------------------------------------------------

    const flowChannelHeight =

        spacerThickness / 1000;

    const flowArea =

        electrodeWidth / 100 *

        flowChannelHeight;

    //--------------------------------------------------
    // Flow Velocity
    //--------------------------------------------------

    const flowRateM3s =

        flowRate /

        1000 /

        60;

    const flowVelocity =

        flowRateM3s /

        Math.max(

            flowArea,

            1e-8

        );

    //--------------------------------------------------
    // Hydraulic Diameter
    //--------------------------------------------------

    const hydraulicDiameter =

        2 *

        (electrodeWidth / 100) *

        flowChannelHeight /

        (

            (electrodeWidth / 100)

            +

            flowChannelHeight

        );

    //--------------------------------------------------
    // Reynolds Number
    //--------------------------------------------------

    const density = 1000;

    const viscosity = 0.001;

    const reynolds =

        density *

        flowVelocity *

        hydraulicDiameter /

        viscosity;

    //--------------------------------------------------
    // Pressure Drop
    //--------------------------------------------------

    const friction =

        reynolds < 2300

            ?

            64 /

            Math.max(reynolds,1)

            :

            0.316 /

            Math.pow(reynolds,0.25);

    const pressureDrop =

        friction *

        0.20 /

        hydraulicDiameter *

        density *

        flowVelocity *

        flowVelocity /

        2;

    //--------------------------------------------------
    // Electrical
    //--------------------------------------------------

    const resistance =

        voltage /

        Math.max(

            current,

            0.01

        );

    const power =

        voltage *

        current;

    //--------------------------------------------------
    // Charge Efficiency
    //--------------------------------------------------

    const chargeEfficiency =

        Math.min(

            0.99,

            0.75 +

            voltage * 0.08

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
    // Stack Geometry
    //--------------------------------------------------

    const stackThickness =

        cellPairs *

        (

            2 *

            electrodeThickness +

            spacerThickness

        );

    const stackVolume =

        electrodeArea *

        stackThickness /

        1000;

    //--------------------------------------------------
    // Return
    //--------------------------------------------------

    return {

        inletTDS,

        targetTDS,

        saltRemoval,

        voltage,

        current,

        power,

        resistance:

            Number(

                resistance.toFixed(3)

            ),

        chargeEfficiency:

            Number(

                chargeEfficiency.toFixed(3)

            ),

        electrodeArea,

        electrodeLength:

            Number(

                electrodeLength.toFixed(2)

            ),

        electrodeWidth:

            Number(

                electrodeWidth.toFixed(2)

            ),

        electrodeThickness,

        electrodeVolume:

            Number(

                electrodeVolume.toFixed(2)

            ),

        electrodeMass:

            Number(

                electrodeMass.toFixed(2)

            ),

        carbonLoading:

            Number(

                carbonLoading.toFixed(3)

            ),

        porosity,

        SAC:

            Number(

                SAC.toFixed(3)

            ),

        utilization:

            Number(

                utilization.toFixed(3)

            ),

        spacerThickness,

        flowChannelHeight:

            Number(

                flowChannelHeight.toFixed(5)

            ),

        residenceTime,

        flowVelocity:

            Number(

                flowVelocity.toFixed(3)

            ),

        hydraulicDiameter:

            Number(

                hydraulicDiameter.toFixed(5)

            ),

        reynolds:

            Number(

                reynolds.toFixed(0)

            ),

        pressureDrop:

            Number(

                pressureDrop.toFixed(2)

            ),

        cellPairs,

        stackThickness:

            Number(

                stackThickness.toFixed(2)

            ),

        stackVolume:

            Number(

                stackVolume.toFixed(2)

            )

    };

}

module.exports = calculateCDIDesign;