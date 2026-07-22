import EquationEngine from "./equationEngine";

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
    // ELECTRODE MATERIAL DATABASE
    //--------------------------------------------------
    const MATERIALS = {
        "Activated Carbon": { density: 0.45, porosity: 0.65, conductivity: 120, specificCapacitance: 75, specificSurfaceArea: 1500, sac: 15.0, costPerKg: 15.0, poreDiameter: 2.5 },
        "Carbon Aerogel": { density: 0.20, porosity: 0.85, conductivity: 500, specificCapacitance: 120, specificSurfaceArea: 1100, sac: 28.0, costPerKg: 45.0, poreDiameter: 4.0 },
        "Graphene": { density: 0.15, porosity: 0.90, conductivity: 2000, specificCapacitance: 180, specificSurfaceArea: 2600, sac: 42.0, costPerKg: 120.0, poreDiameter: 1.8 },
        "Carbon Nanotube": { density: 0.25, porosity: 0.80, conductivity: 1500, specificCapacitance: 150, specificSurfaceArea: 1800, sac: 35.0, costPerKg: 95.0, poreDiameter: 3.0 },
        "MXene": { density: 0.60, porosity: 0.75, conductivity: 3500, specificCapacitance: 250, specificSurfaceArea: 800, sac: 55.0, costPerKg: 150.0, poreDiameter: 2.0 }
    };

    const materialName = engineering?.material || "Activated Carbon";
    const mat = MATERIALS[materialName] || MATERIALS["Activated Carbon"];

    const density = mat.density;
    const porosity = mat.porosity;
    const conductivity = mat.conductivity;
    const specificCapacitance = mat.specificCapacitance;
    const specificSurfaceArea = mat.specificSurfaceArea;
    const poreDiameter = mat.poreDiameter || 2.5;
    const SAC = mat.sac;






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


    const calculatedSac =
        EquationEngine.evaluate(
            'Salt Adsorption Capacity',
            { SaltRemoved: saltRemoved, ElectrodeMass: electrodeMass },
            mat.sac || (saltRemoved / Math.max(electrodeMass, 0.001))
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


export default electrodeModel;