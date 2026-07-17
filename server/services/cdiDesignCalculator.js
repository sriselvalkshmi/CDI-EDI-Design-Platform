"use strict";


//======================================================
// CDI PHYSICS OPTIMIZER
//======================================================


function calculateCDIDesign(input){



    //--------------------------------------------------
    // INPUTS
    //--------------------------------------------------


    const tds =

        Number(input.tds || 500);



    const targetTds =

        Number(input.targetTds || 50);



    const flowRate =

        Number(input.flowRate || 10);



    const conductivity =

        Number(input.conductivity || 300);




    //--------------------------------------------------
    // CDI PARAMETERS
    //--------------------------------------------------


    const SAC = 80;   
    // mg salt / g electrode


    const chargeEfficiency = 0.85;


    const Faraday = 96485;



    const saltMolecularWeight = 58.5;






    //--------------------------------------------------
    // SALT REMOVAL REQUIRED
    //--------------------------------------------------


    const saltRemoval =

        Math.max(

            0,

            tds-targetTds

        );






    //--------------------------------------------------
    // WATER LOAD
    //--------------------------------------------------


    const flow_L_hr =

        flowRate * 60;



    const waterMass =

        flow_L_hr;



    const saltMassRemoved =


        (

            saltRemoval *

            waterMass

        )

        /

        1000000;






    //--------------------------------------------------
    // REQUIRED CHARGE
    //--------------------------------------------------


    const molesSalt =


        saltMassRemoved /

        saltMolecularWeight;



    const chargeRequired =


        molesSalt *

        Faraday *

        1000;



    const correctedCharge =


        chargeRequired /

        chargeEfficiency;







    //--------------------------------------------------
    // ELECTRODE MASS
    //--------------------------------------------------


    const electrodeMass =


        correctedCharge /

        3600 /

        SAC;






    //--------------------------------------------------
    // ELECTRODE AREA
    //--------------------------------------------------


    const area =


        electrodeMass *

        100;







    //--------------------------------------------------
    // CELL PAIRS
    //--------------------------------------------------


    const cellPairs =


        Math.ceil(

            area /

            10

        );






    //--------------------------------------------------
    // VOLTAGE OPTIMIZATION
    //--------------------------------------------------


    let voltage = 1.2;



    if(tds > 1000)

        voltage = 1.8;


    else if(tds > 500)

        voltage = 1.6;


    else

        voltage = 1.2;







    //--------------------------------------------------
    // CURRENT
    //--------------------------------------------------


    const current =


        area *

        0.02;







    //--------------------------------------------------
    // RESIDENCE TIME
    //--------------------------------------------------


    const residenceTime =


        (

            cellPairs *

            0.5

        )

        /

        flowRate;








    //--------------------------------------------------
    // PREDICT OUTLET
    //--------------------------------------------------


    const predictedRemoval =


        Math.min(

            95,

            (

                electrodeMass *

                SAC *

                chargeEfficiency

            )

            /

            Math.max(

                saltMassRemoved,

                0.001

            )

            *

            100

        );







    const outletTDS =


        tds *

        (

            1 -

            predictedRemoval/100

        );







    //--------------------------------------------------
    // ENERGY
    //--------------------------------------------------


    const power =


        voltage *

        current;



    const specificEnergy =


        (

            power /

            1000

        )

        /

        (

            flowRate /

            1000

        );








    //--------------------------------------------------
    // SCORE
    //--------------------------------------------------


    const score =


        predictedRemoval

        -

        specificEnergy *

        5;







    //--------------------------------------------------
    // RETURN
    //--------------------------------------------------


    return {


        technology:

            "CDI",



        optimizedVoltage:

            Number(
                voltage.toFixed(2)
            ),



        current:

            Number(
                current.toFixed(2)
            ),



        optimizedElectrodeArea:

            Number(
                area.toFixed(2)
            ),



        optimizedCellPairs:

            cellPairs,



        predictedRemoval:

            Number(
                predictedRemoval.toFixed(2)
            ),



        outletTDS:

            Number(
                outletTDS.toFixed(2)
            ),



        electrodeMass:

            Number(
                electrodeMass.toFixed(3)
            ),



        SAC,



        chargeEfficiency,



        residenceTime:

            Number(
                residenceTime.toFixed(2)
            ),



        power:

            Number(
                power.toFixed(2)
            ),



        specificEnergy:

            Number(
                specificEnergy.toFixed(4)
            ),



        score:

            Number(
                score.toFixed(2)
            ),



        confidence:95


    };


}




module.exports = calculateCDIDesign;