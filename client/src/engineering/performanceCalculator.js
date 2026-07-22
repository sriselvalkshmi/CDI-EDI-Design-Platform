import EquationEngine from "./equationEngine.js";


function performanceCalculator(
    feedWater,
    simulation,
    engineering,
    cellDesign,
    electrode
) {


    //--------------------------------------------------
    // INPUTS
    //--------------------------------------------------

    const inputTDS =
        Number(feedWater.tds || 500);


    const targetTDS =
        Number(feedWater.targetTds || 50);


    const flowRate =
        Number(feedWater.flowRate || 10);



    const voltage =
        Number(
            engineering?.voltage ||
            simulation?.averageVoltage ||
            1.2
        );



    const current =
        Number(
            engineering?.current ||
            simulation?.averageCurrent ||
            5
        );



    const power =
        Number(
            engineering?.power ||
            voltage * current
        );





    const cellPairs =
        Number(
            engineering?.cellPairs ??
            cellDesign?.cellPairs ??
            36
        );

    const electrodeArea =
        Number(
            engineering?.electrodeArea ??
            electrode?.area ??
            250
        );

    //--------------------------------------------------
    // DYNAMIC EQUATION RESOLVER
    //--------------------------------------------------

    
    // Initial guess/fallbacks helper
    const getScalar = (val, fallback = 0) => {
        if (Array.isArray(val)) return Number(val[0]) || fallback;
        if (typeof val === "number") return val;
        if (typeof val === "string") return Number(val) || fallback;
        return fallback;
    };

    const initialProductFlow = Number(getScalar(simulation?.productFlow, flowRate * 0.98));
    const initialWaterRecovery = Number((initialProductFlow / Math.max(flowRate, 0.001) * 100).toFixed(2));
    const initialOutputTDS = Math.max(0, Number(getScalar(simulation?.outputTDS ?? simulation?.outletTDS, inputTDS)));
    const initialSaltRemoval = Math.max(0, inputTDS - initialOutputTDS);
    const initialRemovalEfficiency = inputTDS > 0 ? Number((initialSaltRemoval / inputTDS * 100).toFixed(2)) : 0;
    
    const initialCapacitance = Number(electrode?.capacitance ?? engineering?.capacitance ?? 0);
    const initialElectrodeMass = Number(electrode?.electrodeMass ?? engineering?.electrodeMass ?? 0);
    const initialSAC = Number(electrode?.SAC ?? getScalar(simulation?.sac) ?? engineering?.sac ?? 0);
    
    const initialChargeEfficiency = (() => {
        let eff = getScalar(simulation?.chargeEfficiency, getScalar(engineering?.chargeEfficiency, 85));
        if (eff <= 1) eff = eff * 100;
        return Number(eff.toFixed(2));
    })();
    
    const initialSpecificEnergy = (() => {
        const flow_m3_hr = (flowRate / 1000) * 60;
        return flow_m3_hr > 0 ? Number(((power / 1000) / flow_m3_hr).toFixed(5)) : 0;
    })();


    const evalInputs = {
        voltage,
        current,
        cellPairs,
        electrodeArea,
        electrodeThickness: engineering?.electrodeThickness ?? electrode?.thickness ?? 0.6,
        spacerThickness: engineering?.spacerThickness ?? 0.5,
        flowRate,
        flowVelocity: engineering?.flowVelocity ?? simulation?.flowVelocity ?? 0.15,
        residenceTime: engineering?.residenceTime ?? 10,
        feedPressure: feedWater.pressure ?? 1.0,
        stackLength: engineering?.stackLength ?? 200,
        stackWidth: engineering?.stackWidth ?? 100,
        pumpEfficiency: 75,
        electrodeDensity: electrode?.density ?? 0.45,
        electrodePorosity: electrode?.porosity ?? 0.65,
        feedTds: inputTDS,
        outletTds: initialOutputTDS,
        waterRecovery: initialWaterRecovery,
        f: 0.03,
        fluidDensity: 1000,
        
        WaterProduced: initialProductFlow,
        SaltRemoved: initialSaltRemoval * flowRate,
        RemovedCharge: ((initialSaltRemoval * flowRate) / 1000 / 58.44) * 96485 / 60,
        SuppliedCharge: current,
        
        Power: power,
        DeltaP: engineering?.pressureDrop ?? simulation?.pressureDrop ?? 180,
        PumpPower: engineering?.pumpPower ?? simulation?.pumpPower ?? 0.04
    };

    const resolved = EquationEngine.evaluateAll(evalInputs);

    // Apply resolved variables
    const outputTDS = Math.max(0, engineering?.outletTDS ?? simulation?.outputTDS ?? simulation?.outletTDS ?? resolved.OutletTDS ?? initialOutputTDS);
    const saltRemoval = Math.max(0, inputTDS - outputTDS);
    const removalEfficiency = inputTDS > 0 ? Number(((saltRemoval / inputTDS) * 100).toFixed(2)) : 0;
    
    const productFlow = initialProductFlow;
    const concentrateFlow = Number((flowRate - productFlow).toFixed(3));
    const waterRecovery = Number((resolved.waterRecovery ?? initialWaterRecovery).toFixed(2));

    const specificEnergy = Number((resolved.SEC ?? initialSpecificEnergy).toFixed(5));
    const area_m2 = electrodeArea / 10000;
    const currentDensity = Number((resolved.CurrentDensity ?? resolved.J ?? (area_m2 > 0 ? (current / area_m2) : 0)).toFixed(2));

    const SAC = Number((resolved.SAC ?? initialSAC).toFixed(2));
    const electrodeMass = Number((resolved.ElectrodeMass ?? resolved.Mass ?? initialElectrodeMass).toFixed(2));
    const capacitance = initialCapacitance;
    
    // Charge Efficiency
    let chargeEfficiency = resolved.Lambda ?? resolved.ChargeEfficiency ?? (initialChargeEfficiency / 100);
    if (chargeEfficiency <= 1) chargeEfficiency = chargeEfficiency * 100;
    chargeEfficiency = Number(chargeEfficiency.toFixed(2));

    // Optimization Score
    const optimizationScore = Number(
        (
            resolved.OptimizationScore ?? 
            resolved.Score ?? 
            (removalEfficiency * 0.60 + chargeEfficiency * 0.20 + waterRecovery * 0.10 + Math.max(0, 10 - specificEnergy))
        ).toFixed(2)
    );









    //--------------------------------------------------
    // PERFORMANCE INDEX
    //--------------------------------------------------


    const performanceIndex =


        Number(

            (

                removalEfficiency *

                chargeEfficiency /

                Math.max(
                    specificEnergy,
                    0.001
                )

            )
            .toFixed(2)

        );









    //--------------------------------------------------
    // RETURN
    //--------------------------------------------------


    return {


        technology:

            engineering?.technology ||

            simulation?.technology ||

            "CDI",




        inputTDS,


        targetTDS,


        outputTDS,


        outletTDS:
            outputTDS,



        saltRemoval,


        removalEfficiency,


        saltRemovalPercentage:
            removalEfficiency,



        voltage,


        current,


        power,



        flowRate,


        productFlow,


        concentrateFlow,


        waterRecovery,



        cellPairs,



        electrodeArea,


        currentDensity,



        specificEnergy,



        optimizationScore,


        performanceIndex,



        chargeEfficiency,



        SAC,


        electrodeMass,


        capacitance,



        pressureDrop:

            Number(

                engineering?.pressureDrop ??

                simulation?.pressureDrop ??

                0

            ),



        pumpPower:

            Number(

                simulation?.pumpPower ??

                (
                    power *
                    0.001
                )

            ),



        conductivity:

            Number(

                simulation?.conductivity ??

                0

            )

    };


}



export default performanceCalculator;