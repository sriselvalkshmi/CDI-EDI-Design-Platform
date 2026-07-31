"use strict";

/**
 * Dynamic CDI / MCDI / FCDI / EDI Simulation Engine
 * Simulates Exponential Adsorption Kinetics -> Saturation -> Breakthrough -> Reversed Polarity Desorption.
 * Supports Multi-Stage Desalination architecture (Single, Two-Stage, Three-Stage).
 */
function simulate(
    technology = "CDI",
    feedWater = {},
    parameters = {}
) {
    const eng = parameters.engineering || {};
    const rawInputTDS = Number(feedWater.tds ?? 500);
    const rawCond = Number(feedWater.conductivity ?? (rawInputTDS / 0.65));
    const inputTDS = Math.round(Math.max(rawInputTDS, rawCond * 0.65)); // Conductivity-coupled TDS
    const targetTDS = Number(feedWater.targetTds ?? 50);
    const flowRate = Number(eng.flowRate ?? feedWater.flowRate ?? 10); // L/min

    const voltageValue = Number(eng.voltage ?? 1.2);
    // Requirement 3: Current Graph Peak synchronized with operating current KPI (0.13 - 0.15 A)
    const currentValue = Number(eng.current ?? 0.13);
    const outletTDS = Number(eng.outletTDS ?? (inputTDS * 0.1));
    const removalEfficiency = Number(eng.removalEfficiency ?? (((inputTDS - outletTDS) / inputTDS) * 100));

    // Dynamic Time-Dependent Simulation Cycles (Adsorption -> Saturation -> Desorption -> Regeneration)
    const totalSteps = 30;
    const adsorptionSteps = 20;
    const desorptionSteps = 10;

    const timeArr = [];
    const voltageArr = [];
    const currentArr = [];
    const tdsArr = [];
    const conductivityArr = [];
    const electrodeLoadingArr = [];
    const chargeEfficiencyArr = [];

    const baseSac = Number(eng.sac ?? 15.0);
    const baseLambda = Number(eng.chargeEfficiency ?? 85.0);

    for (let step = 0; step <= totalSteps; step++) {
        const t = step * 1.0; // minutes
        timeArr.push(t);

        if (step <= adsorptionSteps) {
            // Adsorption Phase (Exponential Adsorption Kinetics C(t) = Cout + (Cin-Cout)*(1 - exp(-k*t)))
            const ka = 0.25; // kinetic constant
            const expDecay = Math.exp(-ka * t);
            const currentTds = Math.max(outletTDS, outletTDS + (inputTDS - outletTDS) * expDecay);
            const currentVolt = voltageValue;
            // Peak current strictly synchronized with operating current (currentValue)
            const currentAmp = Math.max(0.02, currentValue * Math.exp(-0.08 * t));
            // Electrode adsorption loading growth
            const loading = baseSac * (1 - Math.exp(-0.2 * t));
            const lambda = Math.max(50, baseLambda - 5 * (t / 10));

            voltageArr.push(Number(currentVolt.toFixed(2)));
            currentArr.push(Number(currentAmp.toFixed(3)));
            tdsArr.push(Number(currentTds.toFixed(1)));
            conductivityArr.push(Number((currentTds / 0.65).toFixed(1)));
            electrodeLoadingArr.push(Number(loading.toFixed(2)));
            chargeEfficiencyArr.push(Number(lambda.toFixed(1)));
        } else {
            // Desorption / Regeneration Phase (Reversed Polarity -V, -I)
            const frac = (step - adsorptionSteps) / desorptionSteps;
            const revFactor = technology === "MCDI" ? 1.0 : (technology === "EDI" ? 1.0 : 0.8);
            
            // Reversed Voltage Polarity (-V)
            const currentVolt = -voltageValue * revFactor;
            
            // Reversed Discharging Current Polarity (-I decaying as double-layer discharges)
            const currentAmp = -currentValue * revFactor * Math.exp(-0.35 * (step - adsorptionSteps));
            
            // Exponential Brine Peak Concentration Flush (TDS > feedTDS)
            const brinePeak = inputTDS + 1.8 * (inputTDS - outletTDS) * Math.exp(-0.6 * (step - adsorptionSteps));
            const currentTds = Math.max(inputTDS, brinePeak);
            const loading = baseSac * Math.exp(-0.3 * (step - adsorptionSteps));
            const lambda = 0; // Desorption phase

            voltageArr.push(Number(currentVolt.toFixed(2)));
            currentArr.push(Number(currentAmp.toFixed(3)));
            tdsArr.push(Number(currentTds.toFixed(1)));
            conductivityArr.push(Number((currentTds / 0.65).toFixed(1)));
            electrodeLoadingArr.push(Number(loading.toFixed(2)));
            chargeEfficiencyArr.push(Number(lambda.toFixed(1)));
        }
    }

    // Multi-Stage Desalination Architecture Determination
    const requiredRemoval = inputTDS > 0 ? ((inputTDS - targetTDS) / inputTDS) * 100 : 90;
    const stages = [];

    if (inputTDS > 5000) {
        // 3-Stage Desalination
        const stage1Outlet = Number((inputTDS * 0.30).toFixed(1));
        const stage2Outlet = Number((stage1Outlet * 0.20).toFixed(1));
        const stage3Outlet = Math.min(targetTDS, Number((stage2Outlet * 0.05).toFixed(1)));

        stages.push({ stage: 1, technology: "FCDI", feedTds: inputTDS, outletTds: stage1Outlet, removal: 70.0 });
        stages.push({ stage: 2, technology: "MCDI", feedTds: stage1Outlet, outletTds: stage2Outlet, removal: 80.0 });
        stages.push({ stage: 3, technology: "EDI", feedTds: stage2Outlet, outletTds: stage3Outlet, removal: 95.0 });
    } else if (inputTDS > 1500 || requiredRemoval > 90.0) {
        // 2-Stage Desalination
        const stage1Outlet = Number((inputTDS * 0.25).toFixed(1));
        const stage2Outlet = Math.min(targetTDS, Number((stage1Outlet * 0.15).toFixed(1)));

        stages.push({ stage: 1, technology: technology === "EDI" ? "MCDI" : technology, feedTds: inputTDS, outletTds: stage1Outlet, removal: 75.0 });
        stages.push({ stage: 2, technology: "EDI", feedTds: stage1Outlet, outletTds: stage2Outlet, removal: 85.0 });
    } else {
        stages.push({ stage: 1, technology, feedTds: inputTDS, outletTds: outletTDS, removal: removalEfficiency });
    }

    return {
        technology,
        inputTDS,
        targetTDS,
        outletTDS,
        removalEfficiency,
        stageCount: stages.length,
        stages,

        // Dynamic Time-Dependent Simulation Data
        charts: {
            voltage: { x: timeArr, y: voltageArr },
            current: { x: timeArr, y: currentArr },
            tds: { x: timeArr, y: tdsArr },
            conductivity: { x: timeArr, y: conductivityArr },
            electrodeLoading: { x: timeArr, y: electrodeLoadingArr },
            chargeEfficiency: { x: timeArr, y: chargeEfficiencyArr }
        },

        time: timeArr,
        voltage: voltageArr,
        current: currentArr,
        tds: tdsArr,
        conductivity: conductivityArr,
        electrodeLoading: electrodeLoadingArr,
        chargeEfficiency: chargeEfficiencyArr,
        specificEnergy: eng.sec,
        pressureDrop: eng.pressureDrop,
        pumpPower: eng.pumpPower,
        waterRecovery: eng.waterRecovery
    };
}

export default simulate;