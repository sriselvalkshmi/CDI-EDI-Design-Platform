const EquationEngine = require("./equationEngine");

function electrodeModel(feedWater, engineering) {


    //--------------------------------------------------
    // INPUT PARAMETERS
    //--------------------------------------------------


    const area =

        Number(
            engineering.electrodeArea || 250
        );



    const thickness =

        Number(
            engineering.electrodeThickness || 0.6
        );



    const voltage =

        Number(
            engineering.voltage || 1.2
        );



    const current =

        Number(
            engineering.current || 5
        );



    //--------------------------------------------------
    // THICKNESS CONVERSION
    //--------------------------------------------------


    const thicknessCm =

        thickness / 10;




    //--------------------------------------------------
    // CARBON ELECTRODE PROPERTIES
    //--------------------------------------------------


    const density = 0.45;      
    // g/cm3


    const porosity = 0.65;


    const conductivity = 120;
    // S/m


    const specificCapacitance = 75;
    // F/g


    const specificSurfaceArea = 1500;
    // m2/g


    const poreDiameter = 2.5;
    // nm




    //--------------------------------------------------
    // ELECTRODE GEOMETRY
    //--------------------------------------------------


    const volume =

        area *
        thicknessCm;



    const solidVolume =

        volume *
        (1 - porosity);



    const poreVolume =

        volume *
        porosity;



    //--------------------------------------------------
    // ELECTRODE MASS
    //--------------------------------------------------


    const electrodeMass =

        EquationEngine.evaluate(
            'Electrode Mass',
            { Area: area, Thickness: thickness, Density: density },
            solidVolume * density
        );





    //--------------------------------------------------
    // CAPACITANCE
    //--------------------------------------------------


    const capacitance =

        electrodeMass *
        specificCapacitance;




    //--------------------------------------------------
    // ELECTRICAL RESISTANCE
    //--------------------------------------------------


    const resistance =

        thicknessCm /

        (
            conductivity *
            (area / 10000)
        );





    //--------------------------------------------------
    // ENERGY STORAGE
    //--------------------------------------------------


    const storedEnergy =

        0.5 *
        capacitance *
        voltage *
        voltage;





    //--------------------------------------------------
    // SURFACE AREA
    //--------------------------------------------------


    const totalSurfaceArea =

        electrodeMass *
        specificSurfaceArea;




    //--------------------------------------------------
    // SALT REMOVAL
    //--------------------------------------------------


    const inletTDS =

        Number(
            feedWater.tds || 500
        );



    const targetTDS =

        Number(
            feedWater.targetTds || 50
        );



    const saltRemoved =

        Math.max(

            0,

            inletTDS -
            targetTDS

        );





    //--------------------------------------------------
    // SALT ADSORPTION CAPACITY
    //--------------------------------------------------


    const SAC =

        EquationEngine.evaluate(
            'Salt Adsorption Capacity',
            { SaltRemoved: saltRemoved, ElectrodeMass: electrodeMass },
            saltRemoved / Math.max(electrodeMass, 0.001)
        );






    //--------------------------------------------------
    // CHARGE EFFICIENCY
    //--------------------------------------------------


    const chargeEfficiency =

        Math.min(

            0.99,

            0.80 +
            voltage * 0.05

        );





    //--------------------------------------------------
    // ELECTRODE UTILIZATION
    //--------------------------------------------------


    const utilization =


        Math.min(

            1,

            SAC / 20

        );





    //--------------------------------------------------
    // CURRENT DENSITY
    //--------------------------------------------------


    const currentDensity =


        current /

        (area / 10000);





    //--------------------------------------------------
    // RETURN MODEL
    //--------------------------------------------------


    return {


        // Geometry

        electrodeArea:

            Number(
                area.toFixed(2)
            ),


        thickness:

            Number(
                thickness.toFixed(2)
            ),


        volume:

            Number(
                volume.toFixed(3)
            ),


        solidVolume:

            Number(
                solidVolume.toFixed(3)
            ),


        poreVolume:

            Number(
                poreVolume.toFixed(3)
            ),



        // Material

        density,


        porosity,


        conductivity,


        poreDiameter,


        specificSurfaceArea,



        // Electrode properties shown in UI

        electrodeMass:

            Number(
                electrodeMass.toFixed(3)
            ),



        capacitance:

            Number(
                capacitance.toFixed(3)
            ),



        SAC:

            Number(
                SAC.toFixed(3)
            ),



        // Electrical

        resistance:

            Number(
                resistance.toFixed(5)
            ),



        storedEnergy:

            Number(
                storedEnergy.toFixed(3)
            ),



        currentDensity:

            Number(
                currentDensity.toFixed(2)
            ),



        // Electrochemical

        chargeEfficiency:

            Number(
                (
                    chargeEfficiency *
                    100
                )
                .toFixed(2)
            ),



        utilization:

            Number(
                (
                    utilization *
                    100
                )
                .toFixed(2)
            ),



        totalSurfaceArea:

            Number(
                totalSurfaceArea.toFixed(2)
            )

    };


}


module.exports = electrodeModel;