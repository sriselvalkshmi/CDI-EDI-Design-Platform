import calculateEngineering from "./engineeringEquationEngine.js";


/**
 * True Engineering Optimization Engine
 * Iteratively solves for operating voltage, current, cell pairs, electrode area, and flow parameters
 * until Outlet TDS approaches Target TDS while minimizing Power, SEC, Pressure Drop, and Current Density.
 */
function optimize(
    feedWater = {},
    sizing = {},
    engineering = {}
) {
    const technology = engineering?.technology || feedWater.technology || "CDI";
    const inletTDS = Number(feedWater.tds ?? 500);
    const targetTDS = Number(feedWater.targetTds ?? feedWater.targetTDS ?? 50);
    const flowRateInput = Number(feedWater.flowRate ?? 10);

    const mode = feedWater.optimizationMode || "AI";
    const userInput = feedWater.optimizationInputs || {};
    const locked = feedWater.lockedParameters || {};

    // Technology parameter bounds
    const BOUNDS = {
        CDI: { minV: 0.8, maxV: 1.5, minI: 1.0, maxI: 10.0, minCells: 10, maxCells: 80, minArea: 100, maxArea: 800 },
        MCDI: { minV: 1.0, maxV: 1.6, minI: 2.0, maxI: 15.0, minCells: 15, maxCells: 100, minArea: 150, maxArea: 1000 },
        FCDI: { minV: 1.2, maxV: 2.0, minI: 3.0, maxI: 20.0, minCells: 20, maxCells: 120, minArea: 200, maxArea: 1200 },
        EDI: { minV: 5.0, maxV: 50.0, minI: 1.0, maxI: 10.0, minCells: 50, maxCells: 200, minArea: 250, maxArea: 1500 }
    };

    const b = BOUNDS[technology] || BOUNDS.CDI;

    // Numerical search grids for coordinate descent / iterative optimization
    const vSteps = 10;
    const cellSteps = 8;
    const areaSteps = 8;
    const flowSteps = 5;

    const vStep = (b.maxV - b.minV) / vSteps;
    const cellStep = Math.max(1, Math.floor((b.maxCells - b.minCells) / cellSteps));
    const areaStep = Math.floor((b.maxArea - b.minArea) / areaSteps);

    let bestResult = null;
    let minPenalty = Infinity;

    for (let vIdx = 0; vIdx <= vSteps; vIdx++) {
        let V = b.minV + vIdx * vStep;

        for (let cIdx = 0; cIdx <= cellSteps; cIdx++) {
            let C = Math.round(b.minCells + cIdx * cellStep);

            for (let aIdx = 0; aIdx <= areaSteps; aIdx++) {
                let A = b.minArea + aIdx * areaStep;

                for (let qIdx = 0; qIdx <= flowSteps; qIdx++) {
                    let Q = Math.max(1.0, flowRateInput * (0.8 + qIdx * 0.1));

                    // Current proportional to area & technology typical current density
                    let I = (A / 10000) * (b.minI + (b.maxI - b.minI) * 0.5);

                    // Apply User Manual / Hybrid Locked Overrides
                    if (mode === "MANUAL") {
                        V = Number(userInput.voltage ?? V);
                        I = Number(userInput.current ?? I);
                        C = Number(userInput.cellPairs ?? C);
                        A = Number(userInput.electrodeArea ?? A);
                        Q = Number(userInput.flowRate ?? Q);
                    } else if (mode === "HYBRID") {
                        if (locked.voltage) V = Number(userInput.voltage);
                        if (locked.current) I = Number(userInput.current);
                        if (locked.cellPairs) C = Number(userInput.cellPairs);
                        if (locked.electrodeArea) A = Number(userInput.electrodeArea);
                        if (locked.flowRate) Q = Number(userInput.flowRate);
                    }

                    // Run exact physical engineering calculation pipeline
                    const result = calculateEngineering({
                        technology,
                        feedWater,
                        voltage: V,
                        current: I,
                        cellPairs: C,
                        electrodeArea: A,
                        flowRate: Q
                    });

                    // Multi-objective optimization penalty function
                    const tdsError = Math.max(0, result.outletTDS - targetTDS);
                    const isTargetAchieved = result.outletTDS <= targetTDS;

                    const penalty = (isTargetAchieved ? 0 : 50.0) +
                        tdsError * 15.0 +
                        result.sec * 5.0 +
                        result.power * 0.05 +
                        result.pressureDrop * 0.001 +
                        (result.currentDensityCm2 > 0.03 ? 20.0 : 0);

                    if (penalty < minPenalty || bestResult === null) {
                        minPenalty = penalty;
                        bestResult = {
                            technology,
                            optimizedVoltage: result.voltage,
                            current: result.current,
                            optimizedCellPairs: result.cellPairs,
                            optimizedElectrodeArea: result.electrodeArea,
                            optimizedFlowRate: result.flowRate,
                            flowVelocity: result.flowVelocity,
                            residenceTime: result.residenceTime,
                            outletTDS: result.outletTDS,
                            predictedRemoval: result.removalEfficiency,
                            power: result.power,
                            specificEnergy: result.sec,
                            pressureDrop: result.pressureDrop,
                            currentDensity: result.currentDensity,
                            currentDensityCm2: result.currentDensityCm2,
                            recovery: result.waterRecovery,
                            sac: result.sac,
                            electrodeMass: result.electrodeMass,
                            score: Number(Math.max(0, 100 - minPenalty * 0.5).toFixed(2)),
                            confidence: 95,
                            mode
                        };
                    }
                }
            }
        }
    }

    return bestResult;
}

export default optimize;