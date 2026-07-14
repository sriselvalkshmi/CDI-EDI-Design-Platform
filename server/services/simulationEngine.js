function simulate(technology, feedWater, parameters) {

    "use strict";

    //--------------------------------------------------
    // PHYSICAL CONSTANTS
    //--------------------------------------------------

    const FARADAY = 96485;              // C/mol
    const NaClMW = 58.44;               // g/mol
    const WATER_DENSITY = 1000;         // kg/m³
    const WATER_VISCOSITY = 0.001;      // Pa·s
    const GRAVITY = 9.81;

    //--------------------------------------------------
    // FEED WATER
    //--------------------------------------------------

    const inputTDS =
        Number(feedWater.tds || 500);

    const flowRate =
        Number(feedWater.flowRate || 10);

    const hardness =
        Number(feedWater.hardness || 150);

    const conductivityIn =
        Number(feedWater.conductivity || 800);

    const temperature =
        Number(feedWater.temperature || 25);

    const pressure =
        Number(feedWater.pressure || 1);

    const targetTDS =
        Number(feedWater.targetTds || 50);

    const opt =
        feedWater.optimization || {};

    //--------------------------------------------------
    // TECHNOLOGY DATABASE
    //--------------------------------------------------

    const DATABASE = {

        CDI: {
            removal: 70,
            chargeEfficiency: 0.80,
            SAC: 15,
            voltage: 1.2
        },

        MCDI: {
            removal: 85,
            chargeEfficiency: 0.90,
            SAC: 25,
            voltage: 1.4
        },

        FCDI: {
            removal: 92,
            chargeEfficiency: 0.95,
            SAC: 40,
            voltage: 1.6
        },

        EDI: {
            removal: 98,
            chargeEfficiency: 0.99,
            SAC: 45,
            voltage: 2.0
        }

    };

    const tech =
        DATABASE[technology] ||
        DATABASE.CDI;

    //--------------------------------------------------
    // TECHNOLOGY PARAMETERS
    //--------------------------------------------------

    const removalEfficiency =
        tech.removal;

    const chargeEfficiency =
        tech.chargeEfficiency;

    const sacLimit =
        tech.SAC;

    //--------------------------------------------------
    // TIME
    //--------------------------------------------------

    const adsorptionTime =
        Number(opt.adsorptionTime || 20);

    const desorptionTime =
        Number(opt.desorptionTime || 10);

    const totalTime =
        adsorptionTime +
        desorptionTime;

    //--------------------------------------------------
    // ELECTRICAL PARAMETERS
    //--------------------------------------------------

    const voltageValue =
        Number(
            opt.voltage ||
            parameters.voltage ||
            tech.voltage
        );

    const cellResistance =
        Number(
            opt.cellResistance || 2.5
        );

    const capacitance =
        Number(
            opt.capacitance || 500
        );

    const tau =
        cellResistance *
        capacitance;

    //--------------------------------------------------
    // ELECTRODE PARAMETERS
    //--------------------------------------------------

    const electrodeArea =
        Number(
            opt.electrodeArea ||
            parameters.electrodeArea ||
            250
        );

    const electrodeMass =
        Number(
            opt.electrodeMass || 200
        );

    const electrodeThickness =
        Number(
            opt.electrodeThickness || 0.0006
        );

    const electrodePorosity =
        Number(
            opt.porosity || 0.65
        );

    //--------------------------------------------------
    // HYDRAULICS
    //--------------------------------------------------

    const channelWidth =
        Number(
            opt.channelWidth || 0.01
        );

    const channelHeight =
        Number(
            opt.channelHeight || 0.001
        );

    const channelLength =
        Number(
            opt.channelLength || 0.20
        );

    const spacerThickness =
        Number(
            opt.spacerThickness || 0.0003
        );

    const hydraulicArea =
        channelWidth *
        channelHeight;

    const hydraulicDiameter =
        (
            2 *
            channelWidth *
            channelHeight
        ) /
        (
            channelWidth +
            channelHeight
        );

    const pumpEfficiency = 0.70;

    //--------------------------------------------------
    // STORAGE ARRAYS
    //--------------------------------------------------

    const time = [];
    const voltage = [];
    const current = [];
    const tds = [];
    const conductivity = [];
    const resistance = [];
    const charge = [];
    const sac = [];
    const currentDensity = [];
    const electrodePotential = [];
    const coulombicEfficiency = [];
    const adsorptionRate = [];
    const waterRecovery = [];
    const flowVelocity = [];
    const reynolds = [];
    const pressureDrop = [];
    const pumpPower = [];

    //--------------------------------------------------
    // RUNNING VARIABLES
    //--------------------------------------------------

    let accumulatedCharge = 0;
    let accumulatedEnergy = 0;
    let accumulatedSalt = 0;

    const flowM3s =
        flowRate / 1000 / 60;
//--------------------------------------------------
// SIMULATION LOOP
//--------------------------------------------------

    for (let t = 0; t <= totalTime; t++) {

        time.push(t);

        let V = 0;
        let I = 0;
        let outletTDS = inputTDS;
        let saltRemoved = 0;

        //--------------------------------------------------
        // ADSORPTION
        //--------------------------------------------------

        if (t <= adsorptionTime) {

            const seconds = t * 60;

            // RC charging equation

            V =
                voltageValue *
                (
                    1 -
                    Math.exp(-seconds / tau)
                );

            I =
                (
                    voltageValue /
                    cellResistance
                ) *
                Math.exp(-seconds / tau);

        }

        //--------------------------------------------------
        // DESORPTION
        //--------------------------------------------------

        else {

            const seconds =
                (t - adsorptionTime) * 60;

            V =
                -voltageValue *
                Math.exp(-seconds / tau);

            I =
                -(
                    voltageValue /
                    cellResistance
                ) *
                Math.exp(-seconds / tau);

        }

        //--------------------------------------------------
        // CHARGE TRANSFER
        //--------------------------------------------------

        const dt = 60;

        accumulatedCharge +=
            Math.abs(I) * dt;

        //--------------------------------------------------
        // ELECTRICAL ENERGY
        //--------------------------------------------------

        accumulatedEnergy +=
            Math.abs(V * I * dt);

        //--------------------------------------------------
        // FARADAY LAW
        //--------------------------------------------------

        const dynamicCE =
            chargeEfficiency *
            Math.exp(
                -accumulatedCharge / 15000
            );

        const chargeStored =
            accumulatedCharge *
            dynamicCE;

        const molesRemoved =
            chargeStored /
            FARADAY;

        const saltMass =
            molesRemoved *
            NaClMW;

        saltRemoved =
            saltMass * 1000;

        //--------------------------------------------------
        // MAX REMOVAL
        //--------------------------------------------------

        const maximumRemoval =
            inputTDS *
            (
                removalEfficiency /
                100
            );

        saltRemoved =
            Math.min(
                saltRemoved,
                maximumRemoval
            );

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
                outletTDS,
                inputTDS -
                maximumRemoval
            );

        //--------------------------------------------------
        // CONDUCTIVITY MODEL
        //--------------------------------------------------

        const temperatureFactor =
            1 +
            0.02 *
            (
                temperature -
                25
            );

        const conductivityFactor =
            0.64;

        const cond =
            outletTDS /
            conductivityFactor *
            temperatureFactor;

        //--------------------------------------------------
        // CELL RESISTANCE
        //--------------------------------------------------

        const electrolyteResistance =
            1500 /
            Math.max(cond, 10);

        const membraneResistance =
            technology === "MCDI"
                ? 0.40
                : 0;

        const cellR =
            cellResistance +
            electrolyteResistance +
            membraneResistance;

        //--------------------------------------------------
        // SAC MODEL
        //--------------------------------------------------

        const utilization = 0.90;

        const theoreticalSAC =
            sacLimit *
            utilization *
            electrodePorosity;

        const chargeFraction =
            Math.min(
                accumulatedCharge /
                15000,
                1
            );

        const sacValue =
            theoreticalSAC *
            (
                1 -
                Math.exp(
                    -3 *
                    chargeFraction
                )
            );

        //--------------------------------------------------
        // CURRENT DENSITY
        //--------------------------------------------------

        const areaM2 =
            electrodeArea / 10000;

        const jd =
            I /
            Math.max(areaM2, 1e-8);

        //--------------------------------------------------
        // ELECTRODE POTENTIAL
        //--------------------------------------------------

        const electrodeV =
            V / 2;

        //--------------------------------------------------
        // ADSORPTION RATE
        //--------------------------------------------------

        const rate =
            saltRemoved /
            Math.max(
                t + 1,
                1
            );

        //--------------------------------------------------
        // WATER RECOVERY
        //--------------------------------------------------

        const recovery =
            Math.max(
                90,
                95 -
                0.10 * t
            );

        //--------------------------------------------------
        // FLOW VELOCITY
        //--------------------------------------------------

        const effectiveArea =
            hydraulicArea *
            electrodePorosity;

        let velocity =
            flowM3s /
            Math.max(
                effectiveArea,
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
            hydraulicDiameter /
            WATER_VISCOSITY;

        //--------------------------------------------------
        // FRICTION FACTOR
        //--------------------------------------------------

        let friction;

        if (Re < 2300) {

            friction =
                64 /
                Math.max(Re, 1);

        }

        else {

            friction =
                0.3164 /
                Math.pow(
                    Re,
                    0.25
                );

        }

        //--------------------------------------------------
        // POROUS MEDIA LOSS
        //--------------------------------------------------

        const porousLoss =
            1 +
            (
                electrodeThickness /
                spacerThickness
            );

        //--------------------------------------------------
        // PRESSURE DROP
        //--------------------------------------------------

        let deltaP =
            friction *
            (
                channelLength /
                hydraulicDiameter
            ) *
            (
                WATER_DENSITY *
                velocity *
                velocity /
                2
            ) *
            porousLoss;

        deltaP =
            Math.max(
                20,
                Math.min(
                    deltaP,
                    5000
                )
            );

        //--------------------------------------------------
        // PUMP POWER
        //--------------------------------------------------

        const pump =
            deltaP *
            flowM3s /
            pumpEfficiency;

        //--------------------------------------------------
        // STORE ARRAYS
        //--------------------------------------------------

        voltage.push(Number(V.toFixed(3)));
        current.push(Number(I.toFixed(3)));
        tds.push(Number(outletTDS.toFixed(2)));
        conductivity.push(Number(cond.toFixed(2)));
        resistance.push(Number(cellR.toFixed(3)));
        charge.push(Number(accumulatedCharge.toFixed(2)));
        sac.push(Number(sacValue.toFixed(3)));
        currentDensity.push(Number(jd.toFixed(3)));
        electrodePotential.push(Number(electrodeV.toFixed(3)));
        coulombicEfficiency.push(Number(dynamicCE.toFixed(3)));
        adsorptionRate.push(Number(rate.toFixed(3)));
        waterRecovery.push(Number(recovery.toFixed(2)));
        flowVelocity.push(Number(velocity.toFixed(3)));
        reynolds.push(Number(Re.toFixed(0)));
        pressureDrop.push(Number(deltaP.toFixed(2)));
        pumpPower.push(Number(pump.toFixed(4)));

    }
        //--------------------------------------------------
    // PERFORMANCE CALCULATIONS
    //--------------------------------------------------

    const averageCurrent =
        current.reduce((a, b) => a + Math.abs(b), 0) /
        Math.max(current.length, 1);

    const averageVoltage =
        voltage.reduce((a, b) => a + Math.abs(b), 0) /
        Math.max(voltage.length, 1);

    //--------------------------------------------------
    // TOTAL ELECTRICAL ENERGY
    //--------------------------------------------------

    const electricalEnergyWh =
        accumulatedEnergy / 3600;

    //--------------------------------------------------
    // WATER PROCESSED
    //--------------------------------------------------

    const processedVolume =
        flowRate * totalTime;

    //--------------------------------------------------
    // SPECIFIC ENERGY
    // kWh/m³
    //--------------------------------------------------

    const specificEnergy =
        processedVolume > 0
            ?
            (electricalEnergyWh / 1000) /
            (processedVolume / 1000)
            :
            0;

    //--------------------------------------------------
    // AVERAGE VALUES
    //--------------------------------------------------

    const averageResistance =
        resistance.reduce((a, b) => a + b, 0) /
        Math.max(resistance.length, 1);

    const averageConductivity =
        conductivity.reduce((a, b) => a + b, 0) /
        Math.max(conductivity.length, 1);

    const averageCurrentDensity =
        currentDensity.reduce((a, b) => a + b, 0) /
        Math.max(currentDensity.length, 1);

    const averageCE =
        coulombicEfficiency.reduce((a, b) => a + b, 0) /
        Math.max(coulombicEfficiency.length, 1);

    const averageVelocity =
        flowVelocity.reduce((a, b) => a + b, 0) /
        Math.max(flowVelocity.length, 1);

    const averagePressureDrop =
        pressureDrop.reduce((a, b) => a + b, 0) /
        Math.max(pressureDrop.length, 1);

    const averagePumpPower =
        pumpPower.reduce((a, b) => a + b, 0) /
        Math.max(pumpPower.length, 1);

    const averageRecovery =
        waterRecovery.reduce((a, b) => a + b, 0) /
        Math.max(waterRecovery.length, 1);

    //--------------------------------------------------
    // FINAL PERFORMANCE
    //--------------------------------------------------

    const finalOutletTDS =
        tds[Math.min(
            adsorptionTime,
            tds.length - 1
        )];

    const saltRemoval =
        inputTDS -
        finalOutletTDS;

    const removalPercent =
        (saltRemoval / inputTDS) * 100;

    //--------------------------------------------------
    // FINAL SAC
    //--------------------------------------------------

    const finalSAC =
        accumulatedSalt /
        electrodeMass;

    //--------------------------------------------------
    // OPTIMIZATION SCORE
    //--------------------------------------------------

    const optimizationScore =
        Math.min(
            100,

            removalPercent * 0.60 +

            averageCE * 100 * 0.20 +

            Math.max(
                0,
                10 - specificEnergy
            ) +

            averageRecovery * 0.10
        );

    //--------------------------------------------------
    // ENGINEERING SUMMARY
    //--------------------------------------------------

    const engineeringSummary = {

        voltage:
            Number(averageVoltage.toFixed(3)),

        current:
            Number(averageCurrent.toFixed(3)),

        conductivity:
            Number(averageConductivity.toFixed(2)),

        resistance:
            Number(averageResistance.toFixed(3)),

        currentDensity:
            Number(averageCurrentDensity.toFixed(3)),

        flowVelocity:
            Number(averageVelocity.toFixed(3)),

        pressureDrop:
            Number(averagePressureDrop.toFixed(2)),

        pumpPower:
            Number(averagePumpPower.toFixed(4)),

        chargeEfficiency:
            Number(averageCE.toFixed(3)),

        specificEnergy:
            Number(specificEnergy.toFixed(4)),

        waterRecovery:
            Number(averageRecovery.toFixed(2))
    };
        //--------------------------------------------------
    // RETURN RESULTS
    //--------------------------------------------------

    return {

        //--------------------------------------------------
        // BASIC RESULTS
        //--------------------------------------------------

        technology,

        inputTDS,

        outputTDS: Number(finalOutletTDS.toFixed(2)),

        saltRemoval: Number(saltRemoval.toFixed(2)),

        removal: Number(removalPercent.toFixed(2)),

        removalEfficiency: Number(removalPercent.toFixed(2)),

        adsorptionTime,

        desorptionTime,

        //--------------------------------------------------
        // ELECTRICAL PERFORMANCE
        //--------------------------------------------------

        energy: Number(electricalEnergyWh.toFixed(3)),

        specificEnergy: Number(specificEnergy.toFixed(4)),

        averageVoltage: Number(averageVoltage.toFixed(3)),

        averageCurrent: Number(averageCurrent.toFixed(3)),

        averageResistance: Number(averageResistance.toFixed(3)),

        chargeEfficiency: Number(averageCE.toFixed(3)),

        //--------------------------------------------------
        // ELECTRODE PERFORMANCE
        //--------------------------------------------------

        sac: Number(finalSAC.toFixed(3)),

        sacLimit,

        averageCurrentDensity:
            Number(averageCurrentDensity.toFixed(3)),

        //--------------------------------------------------
        // HYDRAULICS
        //--------------------------------------------------

        averageVelocity:
            Number(averageVelocity.toFixed(3)),

        pressureDrop:
            Number(averagePressureDrop.toFixed(2)),

        pumpPower:
            Number(averagePumpPower.toFixed(4)),

        waterRecovery:
            Number(averageRecovery.toFixed(2)),

        //--------------------------------------------------
        // ENGINEERING SUMMARY
        //--------------------------------------------------

        engineeringSummary,

        //--------------------------------------------------
        // AI SCORE
        //--------------------------------------------------

        optimizationScore:
            Number(optimizationScore.toFixed(2)),

        //--------------------------------------------------
        // CHART DATA
        //--------------------------------------------------

        time,

        voltage,

        current,

        tds,

        conductivity,

        resistance,

        charge,

        sac,

        currentDensity,

        electrodePotential,

        coulombicEfficiency,

        adsorptionRate,

        waterRecovery,

        flowVelocity,

        reynolds,

        pressureDrop,

        pumpPower

    };

}

module.exports = simulate;