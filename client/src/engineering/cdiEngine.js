function calculateCDIDesign(data) {

    //---------------------------------------------------------
    // INPUTS
    //---------------------------------------------------------

    const {

        technology = "CDI",

        tds = 500,

        targetTds = 50,

        conductivity = 300,

        hardness = 150,

        ph = 7,

        temperature = 25,

        pressure = 1,

        flowRate = 10,

        optimizationMode = "AI",

        optimizationInputs = {},

        lockedParameters = {}

    } = data;

    //---------------------------------------------------------
    // CONSTANTS
    //---------------------------------------------------------

    const FARADAY = 96485;

    const WATER_DENSITY = 1000;

    const WATER_VISCOSITY = 0.001;

    const CELL_WIDTH = 0.10;

    const CELL_LENGTH = 0.20;

    const DEFAULT_SPACER = 0.0005;

    const DEFAULT_ELECTRODE = 0.0006;

    //---------------------------------------------------------
    // TECHNOLOGY DATABASE
    //---------------------------------------------------------

    const technologyData = {

        CDI: {

            voltage: 1.20,

            chargeEfficiency: 0.85,

            SAC: 20,

            specificCapacitance: 50,

            utilization: 0.85

        },

        MCDI: {

            voltage: 1.40,

            chargeEfficiency: 0.92,

            SAC: 25,

            specificCapacitance: 65,

            utilization: 0.90

        },

        FCDI: {

            voltage: 1.50,

            chargeEfficiency: 0.95,

            SAC: 30,

            specificCapacitance: 75,

            utilization: 0.94

        },

        EDI: {

            voltage: 80,

            chargeEfficiency: 0.98,

            SAC: 10,

            specificCapacitance: 15,

            utilization: 0.99

        }

    };

    const tech = technologyData[technology] || technologyData.CDI;

    //---------------------------------------------------------
    // FEED WATER
    //---------------------------------------------------------

    const saltRemoved = Math.max(0, tds - targetTds);

    const removalEfficiency =

        (saltRemoved / Math.max(tds,1)) * 100;

    //---------------------------------------------------------
    // DEFAULT AI VALUES
    //---------------------------------------------------------

    let voltage = tech.voltage;

    let current = 5;

    let electrodeArea = 250;

    let cellPairs = 36;

    let spacerThickness = 0.5;

    let flowVelocity = 0.15;

    let residenceTime = 10;

    //---------------------------------------------------------
    // APPLY MANUAL VALUES
    //---------------------------------------------------------

    if (optimizationMode === "Manual") {

        voltage = optimizationInputs.voltage ?? voltage;

        current = optimizationInputs.current ?? current;

        electrodeArea =
            optimizationInputs.electrodeArea ??
            electrodeArea;

        cellPairs =
            optimizationInputs.cellPairs ??
            cellPairs;

        flowVelocity =
            optimizationInputs.flowVelocity ??
            flowVelocity;

        residenceTime =
            optimizationInputs.residenceTime ??
            residenceTime;

        spacerThickness =
            optimizationInputs.spacerThickness ??
            spacerThickness;

    }

    //---------------------------------------------------------
    // HYBRID MODE
    //---------------------------------------------------------

    if (optimizationMode === "Hybrid") {

        if (lockedParameters.voltage)

            voltage = optimizationInputs.voltage;

        if (lockedParameters.current)

            current = optimizationInputs.current;

        if (lockedParameters.cellPairs)

            cellPairs = optimizationInputs.cellPairs;

        if (lockedParameters.electrodeArea)

            electrodeArea =
                optimizationInputs.electrodeArea;

        if (lockedParameters.flowVelocity)

            flowVelocity =
                optimizationInputs.flowVelocity;

        if (lockedParameters.residenceTime)

            residenceTime =
                optimizationInputs.residenceTime;

        if (lockedParameters.spacerThickness)

            spacerThickness =
                optimizationInputs.spacerThickness;

    }

    //---------------------------------------------------------
    // ELECTRODE MODEL
    //---------------------------------------------------------

    const electrodeMass =

        saltRemoved /

        Math.max(tech.SAC,1);

    const capacitance =

        electrodeMass *

        tech.specificCapacitance;

    const charge =

        capacitance *

        voltage *

        tech.chargeEfficiency;
        //---------------------------------------------------------
    // ELECTRICAL DESIGN
    //---------------------------------------------------------

    const power =

        voltage * current;

    const currentDensity =

        current /

        Math.max(electrodeArea / 10000, 0.0001);

    //---------------------------------------------------------
    // HYDRAULIC DESIGN
    //---------------------------------------------------------

    const flowRateM3s =

        flowRate / 1000 / 60;

    const flowArea =

        CELL_WIDTH *

        (spacerThickness / 1000);

    const calculatedVelocity =

        flowRateM3s /

        Math.max(flowArea, 1e-9);

    if (optimizationMode !== "Manual") {

        flowVelocity = calculatedVelocity;

    }

    //---------------------------------------------------------
    // REYNOLDS NUMBER
    //---------------------------------------------------------

    const hydraulicDiameter =

        2 *

        (spacerThickness / 1000);

    const reynolds =

        (WATER_DENSITY *

            flowVelocity *

            hydraulicDiameter)

        /

        WATER_VISCOSITY;

    //---------------------------------------------------------
    // FRICTION FACTOR
    //---------------------------------------------------------

    let frictionFactor;

    if (reynolds < 2300) {

        frictionFactor =

            64 /

            Math.max(reynolds,1);

    }

    else {

        frictionFactor =

            0.3164 *

            Math.pow(reynolds,-0.25);

    }

    //---------------------------------------------------------
    // PRESSURE DROP
    //---------------------------------------------------------

    const pressureDrop =

        frictionFactor *

        (CELL_LENGTH /

            hydraulicDiameter)

        *

        (

            WATER_DENSITY *

            Math.pow(flowVelocity,2)

        )

        /2;

    //---------------------------------------------------------
    // PUMP POWER
    //---------------------------------------------------------

    const pumpPower =

        pressureDrop *

        flowRateM3s;

    //---------------------------------------------------------
    // STACK DESIGN
    //---------------------------------------------------------

    const stackWidth =

        100;

    const stackLength =

        200;

    const stackHeight =

        Number(

            (

                cellPairs *

                (

                    spacerThickness +

                    DEFAULT_ELECTRODE*1000

                )

            ).toFixed(2)

        );

    const reactorVolume =

        (

            stackLength/1000 *

            stackWidth/1000 *

            stackHeight/1000

        );

    //---------------------------------------------------------
    // EBCT
    //---------------------------------------------------------

    const ebct =

        reactorVolume /

        Math.max(flowRateM3s,1e-8);

    //---------------------------------------------------------
    // WATER RECOVERY
    //---------------------------------------------------------

    const waterRecovery =

        Math.max(

            80,

            100 -

            pressureDrop/200

        );

    //---------------------------------------------------------
    // ENERGY CONSUMPTION
    //---------------------------------------------------------

    const specificEnergy =

        power /

        (

            flowRate *

            60

        );

    //---------------------------------------------------------
    // PERFORMANCE PREDICTION
    //---------------------------------------------------------

    const outletTDS =

        Math.max(

            targetTds,

            tds -

            saltRemoved *

            tech.utilization

        );

    const predictedRemoval =

        (

            (tds-outletTDS)

            /

            tds

        )*100;

    //---------------------------------------------------------
    // OPTIMIZATION SCORE
    //---------------------------------------------------------

    let score =

        100;

    if(voltage>1.4 && technology!=="EDI")

        score-=8;

    if(flowVelocity<0.05)

        score-=5;

    if(flowVelocity>0.30)

        score-=4;

    if(pressureDrop>5000)

        score-=6;

    if(currentDensity>80)

        score-=7;

    score=Math.max(50,Math.min(score,99));
        //---------------------------------------------------------
    // RETURN RESULTS
    //---------------------------------------------------------

    return {

        engineering: {

            voltage,

            current,

            power: Number(power.toFixed(3)),

            currentDensity: Number(currentDensity.toFixed(2)),

            electrodeArea: Number(electrodeArea.toFixed(2)),

            electrodeMass: Number(electrodeMass.toFixed(2)),

            capacitance: Number(capacitance.toFixed(2)),

            cellPairs,

            residenceTime,

            flowVelocity: Number(flowVelocity.toFixed(3)),

            reactorVolume: Number(reactorVolume.toFixed(4)),

            ebct: Number(ebct.toFixed(2))

        },

        electrode: {

            SAC,

            electrodeMass: Number(electrodeMass.toFixed(2)),

            capacitance: Number(capacitance.toFixed(2))

        },

        componentSizing: {

            stackLength,

            stackWidth,

            stackHeight,

            electrodeThickness: Number((DEFAULT_ELECTRODE * 1000).toFixed(2)),

            spacerThickness

        },

        stack: {

            stackLength,

            stackWidth,

            stackHeight,

            stackThickness: stackHeight,

            reactorLength: CELL_LENGTH * 100,

            residenceTime

        },

        performance: {

            saltRemoved: Number(saltRemoved.toFixed(2)),

            outletTDS: Number(outletTDS.toFixed(2)),

            removalEfficiency: Number(predictedRemoval.toFixed(2)),

            chargeEfficiency: Number((tech.chargeEfficiency * 100).toFixed(2)),

            waterRecovery: Number(waterRecovery.toFixed(2)),

            pressureDrop: Number(pressureDrop.toFixed(2)),

            pumpPower: Number(pumpPower.toFixed(4)),

            specificEnergy: Number(specificEnergy.toFixed(5))

        },

        simulation: {

            outputTDS: Number(outletTDS.toFixed(2)),

            saltRemoval: Number(saltRemoved.toFixed(2)),

            removalEfficiency: Number(predictedRemoval.toFixed(2)),

            pressureDrop: Number(pressureDrop.toFixed(2)),

            pumpPower: Number(pumpPower.toFixed(4)),

            waterRecovery: Number(waterRecovery.toFixed(2)),

            specificEnergy: Number(specificEnergy.toFixed(5)),

            averageVelocity: Number(flowVelocity.toFixed(3)),

            averageVoltage: voltage,

            averageCurrent: current,

            optimizationScore: score

        },

        optimization: {

            mode: optimizationMode,

            score,

            confidence: 95,

            optimizedVoltage: voltage,

            optimizedCurrent: current,

            optimizedFlowRate: flowRate,

            optimizedResidenceTime: residenceTime,

            optimizedVelocity: Number(flowVelocity.toFixed(3))

        }

    };
}