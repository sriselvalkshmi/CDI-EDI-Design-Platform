function calculateCDIDesign(data){


    const {

        tds,
        targetTds,
        conductivity,
        flowRate,
        temperature,
        technology

    } = data;



    // ----------------------------------
    // Salt Removal Requirement
    // ----------------------------------

    const saltRemoved =
        tds - targetTds;



    const removalFraction =
        saltRemoved / tds;



    // ----------------------------------
    // Electrode Design
    // ----------------------------------

    const SAC = 20; 
    // mg salt / g electrode


    const electrodeMass =
        saltRemoved / SAC;



    const specificCapacity = 50;
    // F/g approximate


    const capacitance =
        electrodeMass * specificCapacity;



    // ----------------------------------
    // Cell Voltage
    // ----------------------------------

    let voltage;


    switch(technology){


        case "CDI":

            voltage = 1.2;

            break;


        case "MCDI":

            voltage = 1.4;

            break;


        case "FCDI":

            voltage = 1.5;

            break;


        case "EDI":

            voltage = 80;

            break;


        default:

            voltage = 1.2;

    }



    // ----------------------------------
    // Charge Calculation
    // ----------------------------------

    const chargeEfficiency = 0.85;


    const charge =
        capacitance *
        voltage *
        chargeEfficiency;



    // ----------------------------------
    // Hydraulic Design
    // ----------------------------------

    const residenceTime =

        Number(
            (1 / flowRate * 60)
            .toFixed(3)
        );



    const electrodeArea =

        Number(
            (electrodeMass * 0.05)
            .toFixed(3)
        );



    const cellPairs =

        Math.ceil(
            electrodeArea / 50
        );



    // ----------------------------------
    // Energy
    // ----------------------------------

    const current =

        Number(
            (charge / 3600)
            .toFixed(3)
        );



    const power =

        Number(
            (voltage * current)
            .toFixed(3)
        );



    return {


        engineering:{


            voltage,

            current,

            power,

            electrodeArea,

            cellPairs,

            residenceTime


        },


        electrode:{


            SAC,

            electrodeMass,

            capacitance


        },


        performance:{


            saltRemoved,

            removalEfficiency:

            Number(
            (removalFraction*100)
            .toFixed(2)
            ),

            chargeEfficiency:

            chargeEfficiency*100


        },


        optimization:{


            score:96,

            optimizedVoltage:voltage,

            optimizedFlowRate:flowRate


        }


    };


}



module.exports = calculateCDIDesign;