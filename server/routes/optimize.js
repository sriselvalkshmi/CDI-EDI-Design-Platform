"use strict";

const express = require("express");
const router = express.Router();

//------------------------------------------------------
// SERVICES
//------------------------------------------------------
const aiRecommendation = require("../services/aiRecommendation");
const getParameters = require("../services/designParameters");
const engineeringCalculator = require("../services/engineeringCalculator");
const engineeringEquationEngine = require("../services/engineeringEquationEngine");
const electrodeModel = require("../services/electrodeModel");
const simulationEngine = require("../services/simulationEngine");
const componentSizingModule = require("../services/componentSizing");
const componentSizing = typeof componentSizingModule === "function" ? componentSizingModule : componentSizingModule.calculate;
const cdiDesign = require("../services/cdiDesignCalculator");
const stackDesigner = require("../services/stackDesigner");
const layoutGenerator = require("../services/layoutGenerator");
const performanceCalculator = require("../services/performanceCalculator");

// Helper to evaluate a complete stack design using parameters
function evaluateDesign(params, feedWater, technology) {
    // 1. Recalculate engineering via Equation Engine
    const eng = engineeringEquationEngine({
        technology,
        feedWater,
        ...params
    });

    // 2. Electrode model
    const elect = electrodeModel(feedWater, eng);

    // 3. Sizing
    const size = componentSizing(eng, technology);

    // 4. Simulation
    const sim = simulationEngine(technology, feedWater, {
        engineering: eng,
        electrode: elect
    });

    // 5. Cell design
    let cellDes = null;
    try {
        cellDes = cdiDesign(feedWater, eng);
    } catch (e) {
        console.warn("CDI cell design skipped in evaluation:", e.message);
    }

    // 6. Stack Designer
    let stk = null;
    try {
        stk = stackDesigner(feedWater, cellDes, eng);
    } catch (e) {
        console.warn("Stack design skipped in evaluation:", e.message);
    }

    // 7. Layout
    const lay = layoutGenerator(stk, eng, feedWater, sim, technology);

    // 8. Performance
    const perf = performanceCalculator(feedWater, sim, eng, cellDes, elect);

    return {
        engineering: eng,
        simulation: sim,
        performance: perf,
        layout: lay,
        sizing: size,
        electrode: elect,
        stack: stk,
        cellGeometry: cellDes
    };
}

//======================================================
// OPTIMIZATION API
//======================================================
router.post("/", (req, res) => {
    try {
        console.log("--------------------------------");
        console.log("HYBRID/MANUAL OPTIMIZATION REQUEST");
        console.log(req.body);
        console.log("--------------------------------");

        const feedWater = {
            tds: Number(req.body.tds ?? 500),
            conductivity: Number(req.body.conductivity ?? 300),
            hardness: Number(req.body.hardness ?? 150),
            ph: Number(req.body.ph ?? 7),
            temperature: Number(req.body.temperature ?? 25),
            pressure: Number(req.body.pressure ?? 1),
            flowRate: Number(req.body.flowRate ?? 10),
            targetTds: Number(req.body.targetTds ?? req.body.targetTDS ?? 50)
        };

        const technology = req.body.technology || "CDI";
        const optimizationMode = req.body.optimizationMode || "AI";
        const userInputs = req.body.optimizationInputs || {};
        const locked = req.body.lockedParameters || {};

        //------------------------------------------------------
        // 1. GET ORIGINAL AI PARAMETERS
        //------------------------------------------------------
        const aiRec = aiRecommendation(feedWater);
        const baseParams = getParameters(technology);
        
        const originalAIParameters = {
            voltage: Number(aiRec.recommendedVoltage ?? baseParams.voltage ?? 1.2),
            current: Number(aiRec.recommendedCurrent ?? baseParams.current ?? 5),
            cellPairs: Number(aiRec.recommendedCellPairs ?? baseParams.electrodePairs ?? 20),
            electrodeArea: Number(baseParams.electrodeArea ?? 250),
            electrodeThickness: Number(baseParams.electrodeThickness ?? 0.6),
            spacerThickness: Number(baseParams.spacerThickness ?? baseParams.electrodeSpacing ?? 0.5),
            flowRate: Number(feedWater.flowRate ?? baseParams.flowRate ?? 10),
            flowVelocity: Number(baseParams.flowVelocity ?? 0.15),
            residenceTime: Number(baseParams.residenceTime ?? 10)
        };

        //------------------------------------------------------
        // 2. DETERMINE USER PARAMETERS & MERGE FOR OPTIMIZATION
        //------------------------------------------------------
        const userParameters = {
            voltage: Number(userInputs.voltage ?? originalAIParameters.voltage),
            current: Number(userInputs.current ?? originalAIParameters.current),
            cellPairs: Number(userInputs.cellPairs ?? originalAIParameters.cellPairs),
            electrodeArea: Number(userInputs.electrodeArea ?? originalAIParameters.electrodeArea),
            electrodeThickness: Number(userInputs.electrodeThickness ?? originalAIParameters.electrodeThickness),
            spacerThickness: Number(userInputs.spacerThickness ?? originalAIParameters.spacerThickness),
            flowRate: Number(userInputs.flowRate ?? originalAIParameters.flowRate),
            flowVelocity: Number(userInputs.flowVelocity ?? originalAIParameters.flowVelocity),
            residenceTime: Number(userInputs.residenceTime ?? originalAIParameters.residenceTime)
        };

        const optimizedParameters = { ...originalAIParameters };

        if (optimizationMode === "MANUAL") {
            Object.assign(optimizedParameters, userParameters);
        } else if (optimizationMode === "HYBRID") {
            // In hybrid, use user values for locked parameters, AI values for unlocked
            for (const key of Object.keys(originalAIParameters)) {
                if (locked[key]) {
                    optimizedParameters[key] = userParameters[key];
                }
            }
        }

        //------------------------------------------------------
        // 3. RUN EVALUATIONS
        //------------------------------------------------------
        // Evaluate original AI design for comparison
        const aiEval = evaluateDesign(originalAIParameters, feedWater, technology);

        // Evaluate optimized design
        const optEval = evaluateDesign(optimizedParameters, feedWater, technology);

        //------------------------------------------------------
        // 4. CALCULATE IMPROVEMENT SCORE
        //------------------------------------------------------
        const aiEnergy = aiEval.performance.specificEnergy || 0.001;
        const optEnergy = optEval.performance.specificEnergy || 0.001;
        const energyImprovement = ((aiEnergy - optEnergy) / aiEnergy) * 100;

        const aiTds = aiEval.performance.outletTDS || 0.001;
        const optTds = optEval.performance.outletTDS || 0.001;
        const tdsImprovement = ((aiTds - optTds) / aiTds) * 100;

        const aiEff = aiEval.performance.removalEfficiency || 0.001;
        const optEff = optEval.performance.removalEfficiency || 0.001;
        const efficiencyImprovement = ((optEff - aiEff) / aiEff) * 100;

        const improvementScore = {
            energy: Number(energyImprovement.toFixed(2)),
            tds: Number(tdsImprovement.toFixed(2)),
            efficiency: Number(efficiencyImprovement.toFixed(2)),
            totalImprovement: Number(((energyImprovement + tdsImprovement + efficiencyImprovement) / 3).toFixed(2))
        };

        const optimizationObj = {
            success: true,
            optimizationMode,
            originalAIParameters,
            userParameters,
            optimizedParameters,
            improvementScore,
            originalAIDesign: {
                voltage: originalAIParameters.voltage,
                current: originalAIParameters.current,
                power: Number((originalAIParameters.voltage * originalAIParameters.current).toFixed(2)),
                outletTDS: Number(aiTds.toFixed(2)),
                energy: Number(aiEnergy.toFixed(4))
            },
            optimizedDesign: {
                voltage: optimizedParameters.voltage,
                current: optimizedParameters.current,
                power: Number((optimizedParameters.voltage * optimizedParameters.current).toFixed(2)),
                outletTDS: Number(optTds.toFixed(2)),
                energy: Number(optEnergy.toFixed(4))
            },
            score: optEval.simulation.optimizationScore ?? optEval.simulation.score ?? 90,
            confidence: 95
        };

        //------------------------------------------------------
        // 5. RESPONSE
        //------------------------------------------------------
        res.json({
            success: true,
            optimizationMode,
            originalAIParameters,
            userParameters,
            optimizedParameters,
            optimization: optimizationObj,
            
            // Output parameters matching expected dashboard structure
            engineering: optEval.engineering,
            simulation: optEval.simulation,
            performance: optEval.performance,
            layout: optEval.layout,
            sizing: optEval.sizing,
            electrode: optEval.electrode,
            stack: optEval.stack,
            cellGeometry: optEval.cellGeometry,
            
            // Comparative scoring
            improvementScore,
            originalAIDesign: optimizationObj.originalAIDesign,
            optimizedDesign: optimizationObj.optimizedDesign
        });

    } catch (error) {
        console.error("OPTIMIZATION ERROR:", error.stack);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;