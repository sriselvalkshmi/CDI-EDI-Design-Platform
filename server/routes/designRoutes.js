const express = require("express");
const router = express.Router();

const aiRecommendation = require("../services/aiRecommendation");
const getParameters = require("../services/designParameters");
const engineeringCalculator = require("../services/engineeringCalculator");
const simulationEngine = require("../services/simulationEngine");
const ComponentSizing = require("../services/componentSizing");
const optimize = require("../services/designOptimizer");
const cdiDesign = require("../services/cdiDesignCalculator");
const stackDesigner = require("../services/stackDesigner");
const performanceCalculator = require("../services/performanceCalculator");
const layoutGenerator = require("../services/layoutGenerator");
router.post("/design", (req, res) => {

    try {

        console.log("=================================");
        console.log("INPUT FROM FRONTEND");
        console.log(req.body);
        console.log("=================================");

        //----------------------------------------
        // AI Recommendation
        //----------------------------------------

        const recommendation = aiRecommendation(req.body);

        //----------------------------------------
        // Design Parameters
        //----------------------------------------

        const designParameters = getParameters(
            recommendation.technology
        );

        //----------------------------------------
        // Engineering
        //----------------------------------------

        const engineering = engineeringCalculator(
            req.body,
            designParameters,
            recommendation.technology
        );

        //----------------------------------------
        // Component Sizing
        //----------------------------------------

        const sizing = ComponentSizing.calculate(
            req.body,
            recommendation.technology
        );

        //----------------------------------------
        // Simulation
        //----------------------------------------

        const simulation = simulationEngine(
            recommendation.technology,
            req.body,
            designParameters
        );

        //----------------------------------------
        // CDI Cell Design
        //----------------------------------------

        const cellDesign = cdiDesign(
            req.body,
            engineering
        );

        //----------------------------------------
        // Stack Design
        //----------------------------------------

        const stack = stackDesigner(
            req.body,
            cellDesign,
            engineering
        );

        const layout =
          layoutGenerator(
          stack,
          engineering
        );

        //----------------------------------------
        // Performance
        //----------------------------------------

        const performance = performanceCalculator(
            req.body,
            simulation,
            engineering,
            cellDesign
        );

        //----------------------------------------
        // Optimization
        //----------------------------------------

        const optimization = optimize(
            req.body,
            sizing,
            engineering
        );

        //----------------------------------------
        // Response
        //----------------------------------------

        res.json({

            success: true,

            recommendation,

            designParameters,

            engineering,

            sizing,

            simulation,

            optimization,

            stack,

            cellDesign,

            layout,

            performance

        });

    }

    catch (err) {

        console.error("SERVER ERROR");
        console.error(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

module.exports = router;