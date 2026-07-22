"use strict";

/**
 * Dynamic CDI / MCDI / FCDI / EDI Simulation Engine
 * Simulates Adsorption -> Saturation -> Desorption -> Regeneration dynamic cycles.
 * Supports Multi-Stage Desalination architecture (Single, Two-Stage, Three-Stage).
 */
function simulate(
    technology = "CDI",
    feedWater = {},
    parameters = {}
) {
    const eng = parameters.engineering || {};
    const inputTDS = Number(feedWater.tds ?? 500);
    const targetTDS = Number(feedWater.targetTds ?? 50);
    const flowRate = Number(eng.flowRate ?? feedWater.flowRate ?? 10); // L/min

    const voltageValue = Number(eng.voltage ?? 1.2);
    const currentValue = Number(eng.current ?? 5.0);
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
            // Adsorption Phase (0 -> saturation)
            const frac = step / adsorptionSteps;
            // Exponential saturation kinetics
            const satFactor = Math.pow(frac, 0.8);
            const currentTds = inputTDS - (inputTDS - outletTDS) * (1 - 0.2 * satFactor);
            const currentVolt = voltageValue;
            const currentAmp = currentValue * (1 - 0.3 * frac);
            const loading = baseSac * frac;
            const lambda = Math.max(50, baseLambda - 10 * frac);

            voltageArr.push(Number(currentVolt.toFixed(2)));
            currentArr.push(Number(currentAmp.toFixed(2)));
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
            const currentAmp = -currentValue * revFactor * Math.max(0.05, 1.0 - frac);
            
            // Brine Peak Concentration Flush (TDS > feedTDS)
            const brinePeak = inputTDS + 1.2 * (inputTDS - outletTDS) * Math.exp(-2.5 * frac);
            const currentTds = Math.max(inputTDS, brinePeak);
            const loading = baseSac * (1.0 - frac);
            const lambda = 0; // Desorption phase

            voltageArr.push(Number(currentVolt.toFixed(2)));
            currentArr.push(Number(currentAmp.toFixed(2)));
            tdsArr.push(Number(currentTds.toFixed(1)));
            conductivityArr.push(Number((currentTds / 0.65).toFixed(1)));
            electrodeLoadingArr.push(Number(loading.toFixed(2)));
            chargeEfficiencyArr.push(Number(lambda.toFixed(1)));
        }
    }


    // Step 3: Multi-Stage Desalination Architecture Determination
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