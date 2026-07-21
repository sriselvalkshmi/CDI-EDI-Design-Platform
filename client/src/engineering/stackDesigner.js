function stackDesigner(
    feedWater,
    cellDesign,
    engineering
) {


    //--------------------------------------------------
    // INPUT PARAMETERS
    //--------------------------------------------------

    const cellPairs =

        Number(

            engineering.cellPairs ||

            cellDesign.cellPairs ||

            5

        );


    const voltage =

        Number(

            engineering.voltage ||

            1.2

        );


    const current =

        Number(

            engineering.current ||

            5

        );


    //--------------------------------------------------
    // CDI STACK CALCULATION
    //--------------------------------------------------

    const activeArea =

        Number(

            engineering.electrodeArea ||

            250

        );


    const electrodeThickness =

        Number(

            engineering.electrodeThickness ||

            0.6

        );


    const spacerThickness =

        Number(

            engineering.spacerThickness ||

            0.5

        );


    //--------------------------------------------------
    // CELL DIMENSIONS
    //--------------------------------------------------

    const electrodeLength =

        Number(

            engineering.electrodeLength ||

            100

        );


    const electrodeWidth =

        Number(

            engineering.electrodeWidth ||

            50

        );


    //--------------------------------------------------
    // STACK SIZE
    //--------------------------------------------------

    const cellHeight =

        electrodeThickness +

        spacerThickness;



    const stackHeight =

        cellHeight *

        cellPairs;



    const stackLength =

        electrodeLength;



    const stackWidth =

        electrodeWidth;



    //--------------------------------------------------
    // MASS ESTIMATION
    //--------------------------------------------------

    const electrodeVolume =

        (
            electrodeLength *

            electrodeWidth *

            electrodeThickness
        )

        /

        1000;



    const electrodeMass =

        electrodeVolume *

        0.45;



    //--------------------------------------------------
    // RETURN STACK DATA
    //--------------------------------------------------

    return {


        technology:

            "CDI",



        cellPairs,


        voltage,


        current,



        dimensions:{


            length:

                Number(
                    stackLength.toFixed(2)
                ),


            width:

                Number(
                    stackWidth.toFixed(2)
                ),


            height:

                Number(
                    stackHeight.toFixed(2)
                )


        },



        stackLength:

            Number(
                stackLength.toFixed(2)
            ),



        stackWidth:

            Number(
                stackWidth.toFixed(2)
            ),



        stackHeight:

            Number(
                stackHeight.toFixed(2)
            ),



        electrodeArea:

            Number(
                activeArea.toFixed(2)
            ),



        electrodeMass:

            Number(
                electrodeMass.toFixed(3)
            ),



        electrodeThickness,


        spacerThickness,



        description:


            "CDI stack consisting of activated carbon electrodes with spacer channels and automatic polarity reversal capability."

    };


}



export default stackDesigner;