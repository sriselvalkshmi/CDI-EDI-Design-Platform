import EquationEngine from "./equationEngine";
import { parseFormula, evaluatePostfix } from "./formulaParser";

function optimize(
    feedWater = {},
    sizing = {},
    engineering = {}
) {
    // Compile active equations once at the start of the optimization search
    const equations = EquationEngine.loadEquations();
    const active = equations.filter(e => e.enabled);
    const activeParsed = active.map(eq => {
        try {
            const { postfix } = parseFormula(eq.formula);
            return { id: eq.id, name: eq.name, postfix };
        } catch (e) {
            return null;
        }
    }).filter(Boolean);

    function evalEq(id, scope, fallback) {
        const eq = activeParsed.find(e => e.id === id);
        if (!eq) return fallback;
        try {
            const currentScope = { ...scope };
            if (id === 'electrode_mass') {
                currentScope.Density = scope.electrodeDensity ?? scope.Density ?? 0.45;
            } else if (id === 'pressure_drop') {
                currentScope.Density = scope.fluidDensity ?? scope.Density ?? 1000;
            }
            return evaluatePostfix(eq.postfix, currentScope);
        } catch (e) {
            return fallback;
        }
    }




    //--------------------------------------------------
    // INPUT WATER
    //--------------------------------------------------


    const inletTDS =
        Number(feedWater.tds ?? 500);


    const targetTDS =
        Number(
            feedWater.targetTds ??
            feedWater.targetTDS ??
            50
        );




    //--------------------------------------------------
    // MODE
    //--------------------------------------------------


    const mode =
        feedWater.optimizationMode || "AI";


    const userInput =
        feedWater.optimizationInputs || {};


    const locked =
        feedWater.lockedParameters || {};





    //--------------------------------------------------
    // DEFAULT SEARCH VALUES
    //--------------------------------------------------


    const voltages =
    [
        1.0,
        1.2,
        1.4,
        1.6,
        1.8
    ];



    const flowRates =
    [
        5,
        8,
        10,
        12,
        15
    ];



    const areas =
    [
        200,
        250,
        300,
        350,
        400
    ];



    const cells =
    [
        20,
        30,
        40,
        50,
        60
    ];





    //--------------------------------------------------
    // BEST DESIGN
    //--------------------------------------------------


    let best = null;





    //--------------------------------------------------
    // OPTIMIZATION LOOP
    //--------------------------------------------------


    for(const voltage of voltages){


        for(const flowRate of flowRates){


            for(const area of areas){


                for(const cellPairs of cells){



                    let V = voltage;

                    let Q = flowRate;

                    let A = area;

                    let C = cellPairs;




                    //--------------------------------------------------
                    // MANUAL OVERRIDE
                    //--------------------------------------------------


                    if(mode==="MANUAL"){


                        V =
                        Number(
                            userInput.voltage ??
                            V
                        );


                        Q =
                        Number(
                            userInput.flowRate ??
                            Q
                        );


                        A =
                        Number(
                            userInput.electrodeArea ??
                            A
                        );


                        C =
                        Number(
                            userInput.cellPairs ??
                            C
                        );


                    }




                    //--------------------------------------------------
                    // HYBRID LOCKED PARAMETERS
                    //--------------------------------------------------


                    if(mode==="HYBRID"){


                        if(locked.voltage)
                            V=userInput.voltage;


                        if(locked.flowRate)
                            Q=userInput.flowRate;


                        if(locked.electrodeArea)
                            A=userInput.electrodeArea;


                        if(locked.cellPairs)
                            C=userInput.cellPairs;


                    }





                    //--------------------------------------------------
                    // CALCULATIONS
                    //--------------------------------------------------


                    const current = Q * 0.5;

                    const currentDensity = evalEq(
                        'current_density',
                        { I: current, Area: A },
                        current / Math.max(A, 1)
                    );

                    const residenceTime = evalEq(
                        'residence_time',
                        { ReactorVolume: (A * C * 2 * 0.6 / 10) / 1000, FlowRate: Q },
                        (A * C) / (Q * 100)
                    );

                    let removal = 40 + V * 20 + Math.log(A) * 6 + residenceTime * 2 - Q * 0.8;

                    removal = Math.min(
                        99,
                        Math.max(
                            50,
                            removal
                        )
                    );

                    const outletTDS = inletTDS * (1 - removal / 100);

                    const power = evalEq(
                        'power',
                        { V, I: current },
                        V * current
                    );

                    const energy = power * residenceTime / 60;

                    const specificEnergy = evalEq(
                        'sec',
                        { Power: power, WaterProduced: Q * 0.98 },
                        energy / Math.max(Q / 1000, 0.001)
                    );

                    const flowVelocity = evalEq(
                        'flow_velocity',
                        { FlowRate: Q, ChannelArea: (100 * 0.5) / 100 },
                        Q / 1.1
                    );

                    const pressureDrop = evalEq(
                        'pressure_drop',
                        { f: 0.03, Length: 200, Dh: 1.0, Density: 1000, Velocity: flowVelocity },
                        0.03 * Q * Q / Math.max(A, 1)
                    );

                    const score = removal - specificEnergy * 0.8 - pressureDrop * 2 - Math.abs(targetTDS - outletTDS) * 0.2;








                    if(
                        best===null ||
                        score>best.score
                    ){


                        best={


                            optimizedVoltage:
                            Number(V.toFixed(2)),


                            optimizedFlowRate:
                            Number(Q.toFixed(2)),


                            optimizedElectrodeArea:
                            Number(A.toFixed(2)),


                            optimizedCellPairs:
                            Number(C),



                            current:
                            Number(current.toFixed(3)),


                            currentDensity:
                            Number(currentDensity.toFixed(4)),


                            residenceTime:
                            Number(residenceTime.toFixed(3)),


                            outletTDS:
                            Number(outletTDS.toFixed(2)),


                            predictedRemoval:
                            Number(removal.toFixed(2)),


                            power:
                            Number(power.toFixed(3)),


                            specificEnergy:
                            Number(specificEnergy.toFixed(5)),


                            pressureDrop:
                            Number(pressureDrop.toFixed(5)),


                            recovery:
                            Number(
                                Math.min(
                                    95,
                                    removal
                                ).toFixed(2)
                            ),


                            score:
                            Number(score.toFixed(2)),


                            mode


                        };


                    }



                }

            }

        }

    }





    return best;



}




export default optimize;