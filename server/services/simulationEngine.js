function simulate(technology, feedWater, parameters) {

    //--------------------------------------------------
    // Feed Water
    //--------------------------------------------------

    const inputTDS = Number(feedWater.tds || 500);
    const flowRate = Number(feedWater.flowRate || 10);
    const hardness = Number(feedWater.hardness || 0);

    //--------------------------------------------------
    // Technology Parameters
    //--------------------------------------------------

    let removal = 70;
    let chargeEfficiency = 0.80;
    let sacMax = 15;

    switch (technology) {

        case "CDI":
            removal = 70;
            chargeEfficiency = 0.80;
            sacMax = 15;
            break;

        case "MCDI":
            removal = 85;
            chargeEfficiency = 0.90;
            sacMax = 25;
            break;

        case "FCDI":
            removal = 92;
            chargeEfficiency = 0.95;
            sacMax = 40;
            break;

        case "EDI":
            removal = 98;
            chargeEfficiency = 0.99;
            sacMax = 45;
            break;

        default:
            removal = 70;

    }

    //--------------------------------------------------
    // Cycle Time
    //--------------------------------------------------

    let adsorptionTime = Math.round(

        10 +
        inputTDS / 150 +
        hardness / 100 -
        flowRate / 5

    );

    adsorptionTime = Math.max(10, adsorptionTime);

    const desorptionTime =
        Math.round(adsorptionTime * 0.5);

    const totalTime =
        adsorptionTime + desorptionTime;

    //--------------------------------------------------
    // Electrical Constants
    //--------------------------------------------------

    const appliedVoltage =
        Number(parameters.voltage || 1.2);

    const R = 2.5;          // Ohm
    const C = 500;          // Farad
    const tau = R * C;

    const electrodeMass = 200;     // g
    const electrodeArea =
        Number(parameters.electrodeArea || 250); // cm²

    //--------------------------------------------------
    // Hydraulic Constants
    //--------------------------------------------------

    const channelWidth = 0.002;
    const channelHeight = 0.0008;
    const channelLength = 0.20;

    const hydraulicDiameter =
        2 * channelWidth * channelHeight /
        (channelWidth + channelHeight);

    const density = 1000;
    const viscosity = 0.001;

    const pumpEfficiency = 0.70;

    //--------------------------------------------------
    // Arrays
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
    // Running Variables
    //--------------------------------------------------

    let accumulatedCharge = 0;
    //--------------------------------------------------
// Simulation Loop
//--------------------------------------------------

for (let t = 0; t <= totalTime; t++) {

    time.push(t);

    let V = 0;
    let I = 0;
    let outletTDS = inputTDS;

    //--------------------------------------------------
    // ADSORPTION
    //--------------------------------------------------

    if (t <= adsorptionTime) {

        const sec = t * 60;

        // RC Charging
        V =
            appliedVoltage *
            (1 - Math.exp(-sec / tau));

        I =
            (appliedVoltage / R) *
            Math.exp(-sec / tau);

        accumulatedCharge += I * 60;

        outletTDS =
            inputTDS -
            (inputTDS * removal / 100) *
            (1 - Math.exp(-3 * t / adsorptionTime));

    }

    //--------------------------------------------------
    // DESORPTION
    //--------------------------------------------------

    else {

        const td =
            (t - adsorptionTime) * 60;

        // Reverse polarity
        V =
            -appliedVoltage *
            Math.exp(-td / tau);

        I =
            -(appliedVoltage / R) *
            Math.exp(-td / tau);

        accumulatedCharge += I * 60;

        const fraction =
            (t - adsorptionTime) /
            desorptionTime;

        // Salt released back to concentrate
        outletTDS =
            inputTDS -
            (inputTDS * removal / 100) *
            (1 - fraction);

    }

    //--------------------------------------------------
    // Water Properties
    //--------------------------------------------------

    const cond =
        outletTDS * 2;

    const cellResistance =
        R +
        1000 / Math.max(cond, 1);

    const saltRemoved =
        inputTDS - outletTDS;

    const sacValue =
        saltRemoved /
        electrodeMass;

    //--------------------------------------------------
    // Store Main Results
    //--------------------------------------------------

    voltage.push(
        Number(V.toFixed(3))
    );

    current.push(
        Number(I.toFixed(3))
    );

    tds.push(
        Number(outletTDS.toFixed(1))
    );

    conductivity.push(
        Number(cond.toFixed(1))
    );

    resistance.push(
        Number(cellResistance.toFixed(2))
    );

    charge.push(
        Number(accumulatedCharge.toFixed(2))
    );

    sac.push(
        Number(sacValue.toFixed(3))
    );

    //--------------------------------------------------
    // Current Density
    //--------------------------------------------------

    const jd =
        I /
        (electrodeArea / 10000);

    currentDensity.push(
        Number(jd.toFixed(2))
    );

    //--------------------------------------------------
    // Electrode Potential
    //--------------------------------------------------

    electrodePotential.push(
        Number((V / 2).toFixed(3))
    );

    //--------------------------------------------------
    // Coulombic Efficiency
    //--------------------------------------------------

    const lambda =
        chargeEfficiency *
        Math.exp(-0.02 * t);

    coulombicEfficiency.push(
        Number(lambda.toFixed(3))
    );

    //--------------------------------------------------
    // Adsorption Rate
    //--------------------------------------------------

    adsorptionRate.push(
        Number(
            (
                saltRemoved /
                Math.max(t + 1, 1)
            ).toFixed(3)
        )
    );

    //--------------------------------------------------
    // Water Recovery
    //--------------------------------------------------

    waterRecovery.push(
        Number(
            (
                95 -
                0.02 * t
            ).toFixed(2)
        )
    );

    //--------------------------------------------------
    // Hydraulic Model
    //--------------------------------------------------

    const flowRateM3s =
        flowRate / 1000 / 60;

    const area =
        channelWidth *
        channelHeight;

    const velocity =
        flowRateM3s / area;

    const Re =
        density *
        velocity *
        hydraulicDiameter /
        viscosity;

    const friction =
        Re < 2300
            ? 64 / Re
            : 0.316 / Math.pow(Re, 0.25);

    const deltaP =
        friction *
        (channelLength / hydraulicDiameter) *
        density *
        velocity *
        velocity / 2;

    const pump =
        deltaP *
        flowRateM3s /
        pumpEfficiency;

    flowVelocity.push(
        Number(velocity.toFixed(3))
    );

    reynolds.push(
        Number(Re.toFixed(0))
    );

    pressureDrop.push(
        Number(deltaP.toFixed(2))
    );

    pumpPower.push(
        Number(pump.toFixed(3))
    );

}
//--------------------------------------------------
// Performance Calculations
//--------------------------------------------------

const averageCurrent =
    current.reduce(
        (sum, value) => sum + Math.abs(value),
        0
    ) / current.length;

const averageVoltage =
    voltage.reduce(
        (sum, value) => sum + Math.abs(value),
        0
    ) / voltage.length;

// Electrical Energy (Wh)
const energyWh =
    averageVoltage *
    averageCurrent *
    totalTime /
    60;

// Water processed (L)
const processedVolume =
    flowRate *
    totalTime;

// Specific Energy (kWh/m³)
const specificEnergy =
    processedVolume > 0
        ? (energyWh / 1000) /
          (processedVolume / 1000)
        : 0;

// Average Pump Power
const averagePumpPower =
    pumpPower.reduce(
        (sum, value) => sum + value,
        0
    ) / pumpPower.length;

// Total Pump Energy (Wh)
const pumpEnergy =
    averagePumpPower *
    totalTime /
    60;

// Total System Energy
const totalEnergy =
    energyWh + pumpEnergy;

// Salt Adsorption Capacity (mg/g)
const finalSAC =
    sac[sac.length - 1];

// Final Water Recovery
const finalRecovery =
    waterRecovery[waterRecovery.length - 1];

// Average Conductivity
const averageConductivity =
    conductivity.reduce(
        (sum, value) => sum + value,
        0
    ) / conductivity.length;

// Average Resistance
const averageResistance =
    resistance.reduce(
        (sum, value) => sum + value,
        0
    ) / resistance.length;

// Average Current Density
const averageCurrentDensity =
    currentDensity.reduce(
        (sum, value) => sum + value,
        0
    ) / currentDensity.length;

// Average Coulombic Efficiency
const averageCE =
    coulombicEfficiency.reduce(
        (sum, value) => sum + value,
        0
    ) / coulombicEfficiency.length;
    //--------------------------------------------------
// Return Results
//--------------------------------------------------

return {

    inputTDS,

    outputTDS:
        tds[adsorptionTime],

    removal,

    adsorptionTime,

    desorptionTime,

    energy:
        Number(energyWh.toFixed(3)),

    pumpEnergy:
        Number(pumpEnergy.toFixed(3)),

    totalEnergy:
        Number(totalEnergy.toFixed(3)),

    specificEnergy:
        Number(specificEnergy.toFixed(3)),

    recovery:
        Number(finalRecovery.toFixed(2)),

    chargeEfficiency:
        Number(averageCE.toFixed(3)),

    sacMax,

    finalSAC:
        Number(finalSAC.toFixed(3)),

    averageConductivity:
        Number(averageConductivity.toFixed(2)),

    averageResistance:
        Number(averageResistance.toFixed(2)),

    averageCurrentDensity:
        Number(averageCurrentDensity.toFixed(2)),

    voltage,
    current,
    tds,
    conductivity,
    resistance,
    charge,
    sac,
    currentDensity,
    coulombicEfficiency,
    electrodePotential,
    adsorptionRate,
    waterRecovery,
    flowVelocity,
    reynolds,
    pressureDrop,
    pumpPower,
    time

};

}

module.exports = simulate;