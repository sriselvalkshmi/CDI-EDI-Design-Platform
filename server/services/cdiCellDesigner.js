"use strict";


//======================================================
// CDI CELL DESIGNER
// Calculates:
// - electrode dimensions
// - channel geometry
// - hydraulic parameters
// - cell pairs
// - pressure drop
//======================================================


function cdiCellDesigner(
    feedWater,
    optimization,
    engineering
){


    //--------------------------------------------------
    // INPUTS
    //--------------------------------------------------

    const flowRate =

        Number(
            feedWater.flowRate || 10
        );


    const electrodeArea =

        Number(

            optimization?.optimizedElectrodeArea ||

            engineering?.electrodeArea ||

            250

        );



    const cellPairs =

        Number(

            optimization?.optimizedCellPairs ||

            engineering?.cellPairs ||

            20

        );



    const spacerThickness =

        Number(

            optimization?.spacerThickness ||

            engineering?.spacerThickness ||

            0.5

        );




    //--------------------------------------------------
    // ELECTRODE DIMENSION
    //--------------------------------------------------


    const electrodeLength = 200;


    const electrodeWidth =


        electrodeArea /

        electrodeLength;



    const electrodeThickness = 0.6;





    //--------------------------------------------------
    // CHANNEL DESIGN
    //--------------------------------------------------


    const channelHeight =

        spacerThickness;



    const channelWidth =

        electrodeWidth;



    const channelLength =

        electrodeLength;






    //--------------------------------------------------
    // FLOW VELOCITY
    //--------------------------------------------------


    const flowArea =


        (

            channelHeight *

            channelWidth

        )

        /

        10000;



    const flow_m3_s =


        (

            flowRate /

            1000

        )

        /

        60;



    const velocity =


        flow_m3_s /

        Math.max(

            flowArea,

            0.000001

        );







    //--------------------------------------------------
    // HYDRAULIC DIAMETER
    //--------------------------------------------------


    const hydraulicDiameter =


        (

            4 *

            channelHeight *

            channelWidth

        )

        /

        (

            2 *

            (

                channelHeight +

                channelWidth

            )

        );







    //--------------------------------------------------
    // PRESSURE DROP
    //--------------------------------------------------


    const viscosity =

        0.001;


    const pressureDrop =


        (

            12 *

            viscosity *

            channelLength *

            velocity

        )

        /

        (

            hydraulicDiameter *

            hydraulicDiameter

        );







    //--------------------------------------------------
    // STACK HEIGHT
    //--------------------------------------------------


    const cellThickness =


        electrodeThickness +

        spacerThickness;



    const stackHeight =


        cellThickness *

        cellPairs;






    //--------------------------------------------------
    // RETURN
    //--------------------------------------------------


    return {



        technology:"CDI",



        electrode:{


            length:

                Number(
                    electrodeLength.toFixed(2)
                ),


            width:

                Number(
                    electrodeWidth.toFixed(2)
                ),


            thickness:

                electrodeThickness


        },



        channel:{


            height:

                channelHeight,


            width:

                Number(
                    channelWidth.toFixed(2)
                ),


            length:

                channelLength


        },



        hydraulic:{


            flowVelocity:

                Number(
                    velocity.toFixed(3)
                ),


            hydraulicDiameter:

                Number(
                    hydraulicDiameter.toFixed(3)
                ),


            pressureDrop:

                Number(
                    pressureDrop.toFixed(2)
                )


        },



        stack:{


            cellPairs,


            stackHeight:

                Number(
                    stackHeight.toFixed(2)
                )

        }



    };


}



module.exports = cdiCellDesigner;