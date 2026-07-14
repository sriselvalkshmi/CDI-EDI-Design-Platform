function generateLayout(stack, engineering) {

    //--------------------------------------------------
    // Inputs
    //--------------------------------------------------

    const stackWidth =
        Number(stack.stackWidth || 300);

    const stackHeight =
        Number(stack.stackHeight || 300);

    const stackThickness =
        Number(stack.stackThickness || 60);

    const electrodeArea =
        Number(engineering.electrodeArea || 250);

    const cellPairs =
        Number(engineering.cellPairs || 30);

    //--------------------------------------------------
    // Equipment Dimensions
    //--------------------------------------------------

    const feedTank = {

        x: 60,
        y: 220,

        width: 80,
        height: 120

    };

    const feedPump = {

        x: 190,
        y: 250,

        diameter: 40

    };

    const filter = {

        x: 290,
        y: 230,

        width: 50,
        height: 80

    };

    const stackModule = {

        x: 420,
        y: 170,

        width: stackWidth,

        height: stackHeight,

        thickness: stackThickness

    };

    const powerSupply = {

        x: 820,
        y: 60,

        width: 120,

        height: 70

    };

    const productTank = {

        x: 920,
        y: 220,

        width: 80,

        height: 120

    };

    const brineTank = {

        x: 920,
        y: 390,

        width: 80,

        height: 120

    };

    //--------------------------------------------------
    // Pipe Routing
    //--------------------------------------------------

    const pipes = [

        {

            from: "Feed Tank",

            to: "Pump",

            start: [140,280],

            end: [190,270]

        },

        {

            from: "Pump",

            to: "Filter",

            start: [230,270],

            end: [290,270]

        },

        {

            from: "Filter",

            to: "CDI Stack",

            start: [340,270],

            end: [420,270]

        },

        {

            from: "CDI Stack",

            to: "Product Tank",

            start: [

                420 + stackWidth,

                250

            ],

            end: [

                920,

                270

            ]

        },

        {

            from: "CDI Stack",

            to: "Brine Tank",

            start: [

                420 + stackWidth,

                330

            ],

            end: [

                920,

                450

            ]

        }

    ];

    //--------------------------------------------------
    // Overall Skid
    //--------------------------------------------------

    const skidLength =

        1100;

    const skidWidth =

        650;

    const skidArea =

        skidLength *

        skidWidth /

        1000000;

    //--------------------------------------------------
    // Return
    //--------------------------------------------------

    return {

        //--------------------------------------------------
        // Overall Layout
        //--------------------------------------------------

        skidLength,

        skidWidth,

        skidArea:
            Number(skidArea.toFixed(2)),

        //--------------------------------------------------
        // Stack
        //--------------------------------------------------

        stack: stackModule,

        stackWidth,

        stackHeight,

        stackThickness,

        electrodeArea,

        cellPairs,

        //--------------------------------------------------
        // Equipment
        //--------------------------------------------------

        feedTank,

        feedPump,

        filter,

        powerSupply,

        productTank,

        brineTank,

        //--------------------------------------------------
        // Pipes
        //--------------------------------------------------

        pipes,

        //--------------------------------------------------
        // Connection Points
        //--------------------------------------------------

        inlet: {

            x: stackModule.x,

            y: stackModule.y + 100

        },

        outlet: {

            x: stackModule.x + stackWidth,

            y: stackModule.y + 100

        }

    };

}

module.exports = generateLayout;