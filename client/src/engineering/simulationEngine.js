"use strict";


function simulate(
    technology,
    feedWater,
    parameters = {}
) {


/*
==================================================
CDI / MCDI / FCDI / EDI DYNAMIC SIMULATION ENGINE
==================================================

Inputs:
technology
feedWater
parameters

Outputs:
water performance
electrochemical performance
hydraulic performance
chart data
optimization KPI

==================================================
*/


//==================================================
// PHYSICAL CONSTANTS
//==================================================


const FARADAY = 96485;          // C/mol
const NaClMW = 58.44;           // g/mol

const WATER_DENSITY = 1000;     // kg/m3
const WATER_VISCOSITY = 0.001;  // Pa.s



//==================================================
// FEED WATER INPUT
//==================================================


const inputTDS =
Number(
    feedWater.tds ?? 500
);


const targetTDS =
Number(
    feedWater.targetTds ?? 50
);


const flowRate =
Number(
    feedWater.flowRate ?? 10
);


const conductivityIn =
Number(
    feedWater.conductivity ?? 300
);


const hardness =
Number(
    feedWater.hardness ?? 150
);


const temperature =
Number(
    feedWater.temperature ?? 25
);


const pressure =
Number(
    feedWater.pressure ?? 1
);



//==================================================
// OPTIMIZATION PARAMETERS
//==================================================


const opt =
parameters.optimizationInputs ||
feedWater.optimization ||
{};



//==================================================
// TECHNOLOGY DATABASE
//==================================================


const DATABASE = {


CDI: {

    removal:0.70,

    chargeEfficiency:0.85,

    SAC:20,

    voltage:1.2

},



MCDI: {

    removal:0.85,

    chargeEfficiency:0.90,

    SAC:30,

    voltage:1.4

},



FCDI: {

    removal:0.92,

    chargeEfficiency:0.95,

    SAC:40,

    voltage:1.6

},



EDI: {

    removal:0.98,

    chargeEfficiency:0.99,

    SAC:45,

    voltage:2.0

}


};




const tech =
DATABASE[technology]
||
DATABASE.CDI;



const chargeEfficiency =
tech.chargeEfficiency;


const sacLimit =
tech.SAC;



//==================================================
// TIME PARAMETERS
//==================================================


const adsorptionTime =
Number(
    opt.adsorptionTime ||
    parameters.adsorptionTime ||
    20
);



const desorptionTime =
Number(
    opt.desorptionTime ||
    parameters.desorptionTime ||
    10
);



const totalTime =
adsorptionTime +
desorptionTime;




//==================================================
// ELECTRICAL PARAMETERS
//==================================================


const voltageValue =
Number(

    opt.voltage ||

    parameters.voltage ||

    tech.voltage

);



const currentValue =
Number(

    opt.current ||

    parameters.current ||

    5

);



const cellResistance =
Number(

    opt.cellResistance ||

    parameters.cellResistance ||

    2.5

);



const capacitance =
Number(

    opt.capacitance ||

    parameters.capacitance ||

    500

);



const tau =
cellResistance *
capacitance;




//==================================================
// ELECTRODE PARAMETERS
//==================================================


const electrodeArea =
Number(

    opt.electrodeArea ||

    parameters.electrodeArea ||

    250

);



const electrodeMass =
Number(

    opt.electrodeMass ||

    parameters.electrodeMass ||

    2.36

);



const electrodeThickness =
Number(

    opt.electrodeThickness ||

    parameters.electrodeThickness ||

    0.6

);



const porosity =
Number(

    opt.porosity ||

    0.65

);



const density =
0.45;



//==================================================
// HYDRAULIC PARAMETERS
//==================================================


const channelWidth =
Number(
    opt.channelWidth ||
    0.01
);



const channelHeight =
Number(
    opt.channelHeight ||
    0.001
);



const channelLength =
Number(
    opt.channelLength ||
    0.20
);



const spacerThickness =
Number(
    opt.spacerThickness ||
    0.0005
);



const residenceTime =
Number(
    opt.residenceTime ||
    parameters.residenceTime ||
    10
);



const hydraulicArea =
channelWidth *
channelHeight;



const hydraulicDiameter =

(
    2 *
    channelWidth *
    channelHeight
)
/
(
    channelWidth +
    channelHeight
);



const pumpEfficiency =
0.70;



const flowM3s =
flowRate /
1000 /
60;



//==================================================
// STORAGE ARRAYS
//==================================================


const time=[];

const voltage=[];

const current=[];

const tds=[];

const conductivity=[];

const resistance=[];

const charge=[];

const sac=[];

const currentDensity=[];

const pressureDrop=[];

const pumpPower=[];

const flowVelocity=[];

const reynolds=[];

const waterRecovery=[];

const coulombicEfficiency=[];

const adsorptionRate=[];



//==================================================
// RUNNING VARIABLES
//==================================================


let accumulatedCharge = 0;


let accumulatedEnergy = 0;


let accumulatedSalt = 0;

//==================================================
// SIMULATION LOOP
//==================================================


for(
    let t = 0;
    t <= totalTime;
    t++
){


    time.push(t);



    let V = 0;

    let I = 0;



    let saltRemoved = 0;

    let outletTDS = inputTDS;



    //--------------------------------------------------
    // TECHNOLOGY RESISTANCE EFFECT
    //--------------------------------------------------


    let effectiveResistance =
        cellResistance;



    if(technology==="MCDI")
    {
        effectiveResistance *= 0.85;
    }


    if(technology==="FCDI")
    {
        effectiveResistance *= 0.70;
    }


    if(technology==="EDI")
    {
        effectiveResistance *= 0.50;
    }



    //--------------------------------------------------
    // ADSORPTION / DESORPTION CYCLE
    //--------------------------------------------------


    if(t <= adsorptionTime)
    {


        V =
        voltageValue;


        I =
        currentValue ||
        (
            V /
            effectiveResistance
        );


    }


    else
    {


        V =
        -voltageValue;


        I =
        -(
            currentValue ||
            (
                V /
                effectiveResistance
            )
        );


    }




    //--------------------------------------------------
    // CHARGE ACCUMULATION
    //--------------------------------------------------


    const dt = 60;


    accumulatedCharge +=
        Math.abs(I) *
        dt;



    //--------------------------------------------------
    // ENERGY
    //--------------------------------------------------


    accumulatedEnergy +=

        Math.abs(
            V *
            I *
            dt
        );




    //--------------------------------------------------
    // FARADAY SALT REMOVAL
    //--------------------------------------------------


    let saltFromCharge =


    (
        accumulatedCharge *
        chargeEfficiency
        /
        FARADAY
    )
    *
    NaClMW
    *
    1000;



    //--------------------------------------------------
    // SAC LIMITATION
    //--------------------------------------------------


    let maximumSalt =

        electrodeMass *
        sacLimit;



    maximumSalt *=
        tech.removal;



    saltRemoved =

        Math.min(

            saltFromCharge,

            maximumSalt,

            inputTDS *
            tech.removal

        );




    //--------------------------------------------------
    // HYDRAULIC LIMITATION
    //--------------------------------------------------


    const hydraulicFactor =


        Math.min(

            1,

            residenceTime /
            (
                flowRate *
                0.8
            )

        );



    saltRemoved *=
        hydraulicFactor;




    accumulatedSalt =
        saltRemoved;




    //--------------------------------------------------
    // OUTLET TDS
    //--------------------------------------------------


    outletTDS =


        inputTDS -
        saltRemoved;



    outletTDS =


        Math.max(

            targetTDS,

            outletTDS

        );




    //--------------------------------------------------
    // CONDUCTIVITY
    //--------------------------------------------------


    const temperatureFactor =

        1 +
        (
            0.02 *
            (
                temperature -
                25
            )
        );



    const cond =


        (
            outletTDS /
            0.64
        )
        *
        temperatureFactor;




    //--------------------------------------------------
    // CURRENT DENSITY
    //--------------------------------------------------


    const areaM2 =

        electrodeArea /
        10000;



    const jd =


        I /
        Math.max(
            areaM2,
            0.0001
        );





    //--------------------------------------------------
    // SAC
    //--------------------------------------------------


    const currentSAC =


        saltRemoved /
        Math.max(
            electrodeMass,
            0.001
        );





    //--------------------------------------------------
    // FLOW VELOCITY
    //--------------------------------------------------


    let velocity =


        flowM3s /
        Math.max(
            hydraulicArea,
            1e-8
        );



    velocity =


        Math.min(

            velocity,

            0.30

        );





    //--------------------------------------------------
    // REYNOLDS NUMBER
    //--------------------------------------------------


    const Re =


        WATER_DENSITY *
        velocity *
        hydraulicDiameter
        /
        WATER_VISCOSITY;





    //--------------------------------------------------
    // PRESSURE DROP
    //--------------------------------------------------


    let friction;



    if(Re < 2300)
    {


        friction =
            64 /
            Math.max(
                Re,
                1
            );


    }

    else
    {


        friction =

            0.3164 /
            Math.pow(
                Re,
                0.25
            );


    }





    let deltaP =


        friction *
        (
            channelLength /
            hydraulicDiameter
        )
        *
        (
            WATER_DENSITY *
            velocity *
            velocity /
            2
        );



    deltaP =


        Math.max(

            20,

            deltaP

        );





    //--------------------------------------------------
    // PUMP POWER
    //--------------------------------------------------


    const pump =


        deltaP *
        flowM3s /
        pumpEfficiency;




    //--------------------------------------------------
    // PERFORMANCE ARRAYS
    //--------------------------------------------------


    voltage.push(

        Number(
            V.toFixed(3)
        )

    );


    current.push(

        Number(
            I.toFixed(3)
        )

    );



    tds.push(

        Number(
            outletTDS.toFixed(2)
        )

    );



    conductivity.push(

        Number(
            cond.toFixed(2)
        )

    );



    charge.push(

        Number(
            accumulatedCharge.toFixed(2)
        )

    );



    sac.push(

        Number(
            currentSAC.toFixed(3)
        )

    );



    currentDensity.push(

        Number(
            jd.toFixed(3)
        )

    );



    flowVelocity.push(

        Number(
            velocity.toFixed(3)
        )

    );



    reynolds.push(

        Number(
            Re.toFixed(0)
        )

    );



    pressureDrop.push(

        Number(
            deltaP.toFixed(2)
        )

    );



    pumpPower.push(

        Number(
            pump.toFixed(5)
        )

    );



    coulombicEfficiency.push(

        Number(
            chargeEfficiency.toFixed(3)
        )

    );



    adsorptionRate.push(

        Number(
            (
                saltRemoved /
                Math.max(t+1,1)
            )
            .toFixed(3)
        )

    );



    waterRecovery.push(

        Number(

            (
                100 -
                (
                    deltaP /
                    5000 *
                    5
                )

            )
            .toFixed(2)

        )

    );


}
//==================================================
// PERFORMANCE CALCULATIONS
//==================================================


const averageCurrent =

current.reduce(
    (a,b)=>
    a + Math.abs(b),
    0
)
/
Math.max(
    current.length,
    1
);



const averageVoltage =

voltage.reduce(
    (a,b)=>
    a + Math.abs(b),
    0
)
/
Math.max(
    voltage.length,
    1
);




//==================================================
// ENERGY
//==================================================


const electricalEnergyWh =

accumulatedEnergy /
3600;



const waterVolume =

(
    flowRate *
    totalTime
)
/
1000;



const specificEnergy =


waterVolume > 0

?

(
    electricalEnergyWh /
    1000
)
/
waterVolume

:

0;




//==================================================
// FINAL WATER QUALITY
//==================================================


const finalOutletTDS =


tds[
    tds.length - 1
];



const saltRemoval =


Math.max(

    0,

    inputTDS -
    finalOutletTDS

);



const removalEfficiency =


inputTDS > 0

?

(
    saltRemoval /
    inputTDS
)
*
100

:

0;




//==================================================
// FINAL SAC
//==================================================


const finalSAC =


sac[
    sac.length-1
];




//==================================================
// AVERAGE PARAMETERS
//==================================================


const averageCE =


coulombicEfficiency.reduce(

    (a,b)=>
    a+b,

    0

)
/
Math.max(

    coulombicEfficiency.length,

    1

);



const averageVelocity =


flowVelocity.reduce(

    (a,b)=>
    a+b,

    0

)
/
Math.max(

    flowVelocity.length,

    1

);



const averagePressureDrop =


pressureDrop.reduce(

    (a,b)=>
    a+b,

    0

)
/
Math.max(

    pressureDrop.length,

    1

);



const averagePumpPower =


pumpPower.reduce(

    (a,b)=>
    a+b,

    0

)
/
Math.max(

    pumpPower.length,

    1

);



const averageRecovery =


waterRecovery.reduce(

    (a,b)=>
    a+b,

    0

)
/
Math.max(

    waterRecovery.length,

    1

);




//==================================================
// OPTIMIZATION SCORE
//==================================================


const removalScore =


Math.min(

    100,

    removalEfficiency

);



const energyScore =


Math.max(

    0,

    100 -
    (
        specificEnergy *
        100
    )

);



const hydraulicScore =


Math.min(

    100,

    averageRecovery

);



const optimizationScore =


(
    removalScore *
    0.50
)

+

(
    energyScore *
    0.25
)

+

(
    averageCE *
    100 *
    0.15
)

+

(
    hydraulicScore *
    0.10
);





//==================================================
// ENGINEERING SUMMARY
//==================================================


const engineeringSummary = {


    voltage:

    Number(
        averageVoltage.toFixed(3)
    ),



    current:

    Number(
        averageCurrent.toFixed(3)
    ),



    power:

    Number(
        (
            averageVoltage *
            averageCurrent
        )
        .toFixed(3)
    ),



    SAC:

    Number(
        finalSAC.toFixed(3)
    ),



    chargeEfficiency:

    Number(

        (
            averageCE *
            100

        )
        .toFixed(2)

    ),



    specificEnergy:

    Number(
        specificEnergy.toFixed(5)
    ),



    flowVelocity:

    Number(
        averageVelocity.toFixed(3)
    ),



    pressureDrop:

    Number(
        averagePressureDrop.toFixed(2)
    ),



    pumpPower:

    Number(
        averagePumpPower.toFixed(5)
    ),



    waterRecovery:

    Number(
        averageRecovery.toFixed(2)
    )


};





//==================================================
// FINAL RETURN
//==================================================


return {


    technology,


    //--------------------------------------------------
    // WATER QUALITY
    //--------------------------------------------------


    inputTDS,


    outputTDS:

    Number(
        finalOutletTDS.toFixed(2)
    ),


    outletTDS:

    Number(
        finalOutletTDS.toFixed(2)
    ),



    saltRemoval:

    Number(
        saltRemoval.toFixed(2)
    ),



    removalEfficiency:

    Number(
        removalEfficiency.toFixed(2)
    ),




    //--------------------------------------------------
    // ELECTRICAL KPI
    //--------------------------------------------------


    voltage:

    Number(
        averageVoltage.toFixed(3)
    ),



    current:

    Number(
        averageCurrent.toFixed(3)
    ),



    power:

    Number(

        (
            averageVoltage *
            averageCurrent
        )
        .toFixed(3)

    ),



    specificEnergy:

    Number(
        specificEnergy.toFixed(5)
    ),




    //--------------------------------------------------
    // ELECTROCHEMISTRY
    //--------------------------------------------------


    SAC:

    Number(
        finalSAC.toFixed(3)
    ),



    sac:

    Number(
        finalSAC.toFixed(3)
    ),



    chargeEfficiency:

    Number(

        (
            averageCE *
            100
        )
        .toFixed(2)

    ),





    //--------------------------------------------------
    // HYDRAULICS
    //--------------------------------------------------


    flowVelocity:

    Number(
        averageVelocity.toFixed(3)
    ),



    pressureDrop:

    Number(
        averagePressureDrop.toFixed(2)
    ),



    pumpPower:

    Number(
        averagePumpPower.toFixed(5)
    ),



    waterRecovery:

    Number(
        averageRecovery.toFixed(2)
    ),




    //--------------------------------------------------
    // AI SCORE
    //--------------------------------------------------


    optimizationScore:

    Number(
        optimizationScore.toFixed(2)
    ),




    //--------------------------------------------------
    // ENGINEERING
    //--------------------------------------------------


    engineeringSummary,




    //--------------------------------------------------
    // CHART DATA FOR REACT
    //--------------------------------------------------


    charts:{


        voltage:{

            x:time,

            y:voltage

        },


        current:{

            x:time,

            y:current

        },


        tds:{

            x:time,

            y:tds

        },


        conductivity:{

            x:time,

            y:conductivity

        },


        chargeEfficiency:{

            x:time,

            y:coulombicEfficiency

        }

    },





    //--------------------------------------------------
    // RAW ARRAYS
    //--------------------------------------------------


    time,

    voltage,

    current,

    tds,

    conductivity,

    charge,

    sac,

    currentDensity,

    flowVelocity,

    reynolds,

    pressureDrop,

    pumpPower,

    waterRecovery

};


}



export default simulate;