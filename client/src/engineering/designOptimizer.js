import calculateEngineering from "./engineeringEquationEngine.js";

/**
 * Target-Driven Design Optimizer
 * Iteratively solves for operating voltage, current, cell pairs, electrode area, and flow parameters
 * to achieve Target TDS as an active setpoint while minimizing SEC and over-treatment.
 * Primary Objective: minimize |Outlet TDS - Target TDS| subject to Outlet TDS <= Target TDS + 0.5 ppm
 * Secondary Objective: minimize Specific Energy Consumption (SEC)
 */
function optimize(
    feedWater = {},
    sizing = {},
    engineering = {}
) {
    try {
        const technology = engineering?.technology || feedWater.technology || "CDI";
        const inletTDS = Number(feedWater.tds ?? 500);
        const targetTDS = Number(feedWater.targetTds ?? feedWater.targetTDS ?? 50);
        const flowRateInput = Number(feedWater.flowRate ?? 10);

        const mode = feedWater.optimizationMode || "AI";
        const userInput = feedWater.optimizationInputs || {};
        const locked = feedWater.lockedParameters || {};

        // Technology Parameter Search Bounds
        const BOUNDS = {
            CDI: { minV: 0.8, maxV: 1.5, minI: 1.0, maxI: 10.0, minCells: 12, maxCells: 150, minArea: 150, maxArea: 1200 },
            MCDI: { minV: 1.0, maxV: 1.6, minI: 2.0, maxI: 15.0, minCells: 15, maxCells: 180, minArea: 200, maxArea: 1600 },
            FCDI: { minV: 1.2, maxV: 2.0, minI: 3.0, maxI: 20.0, minCells: 20, maxCells: 180, minArea: 250, maxArea: 1800 },
            EDI: { minV: 5.0, maxV: 50.0, minI: 0.1, maxI: 10.0, minCells: 30, maxCells: 200, minArea: 200, maxArea: 1800 }
        };

        const b = BOUNDS[technology] || BOUNDS.CDI;

        // Baseline target-driven auto calculation
        const baseAutoResult = calculateEngineering({ technology, feedWater });
        let bestResult = null;
        let minPenalty = Infinity;

        if (baseAutoResult) {
            const isBaseAchieved = baseAutoResult.outletTDS <= targetTDS + 0.5;
            const targetDiff = Math.abs(baseAutoResult.outletTDS - targetTDS);
            const overtreat = baseAutoResult.outletTDS < targetTDS ? (targetTDS - baseAutoResult.outletTDS) * 15.0 : 0;
            const basePenalty = (isBaseAchieved ? 0 : 5000.0) + targetDiff * 30.0 + overtreat + baseAutoResult.sec * 10.0;
            minPenalty = basePenalty;

            bestResult = {
                ...baseAutoResult,
                optimizedVoltage: baseAutoResult.voltage,
                optimizedCellPairs: baseAutoResult.cellPairs,
                optimizedElectrodeArea: baseAutoResult.electrodeArea,
                optimizedFlowRate: baseAutoResult.flowRate,
                isTargetAchieved: isBaseAchieved,
                score: Number(Math.max(0, 100 - minPenalty * 0.05).toFixed(2)),
                mode
            };
        }

        // Numerical search grid
        const vSteps = 6;
        const cellSteps = 8;
        const areaSteps = 8;

        const vStep = (b.maxV - b.minV) / Math.max(1, vSteps);
        const cellStep = Math.max(1, Math.floor((b.maxCells - b.minCells) / Math.max(1, cellSteps)));
        const areaStep = Math.max(10, Math.floor((b.maxArea - b.minArea) / Math.max(1, areaSteps)));

        for (let vIdx = 0; vIdx <= vSteps; vIdx++) {
            let V = b.minV + vIdx * vStep;

            for (let cIdx = 0; cIdx <= cellSteps; cIdx++) {
                let C = Math.round(b.minCells + cIdx * cellStep);

                for (let aIdx = 0; aIdx <= areaSteps; aIdx++) {
                    let A = b.minArea + aIdx * areaStep;
                    let Q = flowRateInput;

                    if (mode === "MANUAL") {
                        V = Number(userInput.voltage ?? V);
                        C = Number(userInput.cellPairs ?? C);
                        A = Number(userInput.electrodeArea ?? A);
                        Q = Number(userInput.flowRate ?? Q);
                    } else if (mode === "HYBRID") {
                        if (locked.voltage) V = Number(userInput.voltage);
                        if (locked.cellPairs) C = Number(userInput.cellPairs);
                        if (locked.electrodeArea) A = Number(userInput.electrodeArea);
                        if (locked.flowRate) Q = Number(userInput.flowRate);
                    }

                    const result = calculateEngineering({
                        technology,
                        feedWater,
                        voltage: V,
                        cellPairs: C,
                        electrodeArea: A,
                        flowRate: Q
                    });

                    const isAchieved = result.outletTDS <= targetTDS + 0.5;
                    const targetDiff = Math.abs(result.outletTDS - targetTDS);
                    const overtreat = result.outletTDS < targetTDS ? (targetTDS - result.outletTDS) * 15.0 : 0;

                    // Penalty function: Primary target setpoint match + Over-treatment penalty + Secondary SEC minimization
                    const penalty = (isAchieved ? 0 : 5000.0) +
                        targetDiff * 30.0 +
                        overtreat +
                        result.sec * 10.0 +
                        result.power * 0.01;

                    if (penalty < minPenalty) {
                        minPenalty = penalty;
                        bestResult = {
                            ...result,
                            optimizedVoltage: result.voltage,
                            optimizedCellPairs: result.cellPairs,
                            optimizedElectrodeArea: result.electrodeArea,
                            optimizedFlowRate: result.flowRate,
                            isTargetAchieved: isAchieved,
                            score: Number(Math.max(0, 100 - minPenalty * 0.05).toFixed(2)),
                            mode
                        };
                    }
                }
            }
        }

        const isTargetAchieved = bestResult ? bestResult.isTargetAchieved : false;

        if (bestResult) {
            bestResult.isLimitReached = !isTargetAchieved;
            bestResult.status = isTargetAchieved ? "OPTIMIZED" : "LIMIT_REACHED";
            bestResult.recommendedProcess = bestResult.processTrainName || technology;
            bestResult.reason = isTargetAchieved
                ? `Single-stage ${technology} target-driven optimization achieved setpoint (${bestResult.outletTDS} ppm ≈ ${targetTDS} ppm).`
                : `Target ${targetTDS} ppm not achievable within ${technology} single-stage physical bounds (${bestResult.outletTDS} ppm achieved). Multi-stage or EDI process train required.`;
        }

        const finalResult = bestResult || {
            technology,
            isLimitReached: true,
            status: "LIMIT_REACHED",
            recommendedProcess: technology,
            reason: "Optimization bounds reached."
        };

        return {
            ...finalResult,
            engineering: finalResult,
            optimizedEngineering: finalResult,
            status: finalResult.status,
            isLimitReached: Boolean(finalResult.isLimitReached),
            recommendedProcess: finalResult.recommendedProcess,
            reason: finalResult.reason
        };
    } catch (error) {
        console.error("Optimization Error in designOptimizer:", error);
        return {
            engineering: engineering || {},
            optimizedEngineering: engineering || {},
            status: "FAILED",
            isLimitReached: false,
            recommendedProcess: null,
            reason: error?.message || "Optimization failed."
        };
    }
}

export default optimize;
