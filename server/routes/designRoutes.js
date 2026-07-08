const express = require("express");
const router = express.Router();

const aiRecommendation = require("../services/aiRecommendation");
const simulationEngine = require("../services/simulationEngine");
const getParameters = require("../services/designParameters");
const engineeringCalculator = require("../services/engineeringCalculator");
const ComponentSizing = require("../services/componentSizing");
const optimize = require("../services/designOptimizer");
const performanceCalculator = require("../services/performanceCalculator");
const cdiDesign = require("../services/cdiDesignCalculator");
router.post("/design", (req, res) => {

    try {

        console.log("INPUT FROM FRONTEND");
        console.log(req.body);

        // AI Recommendation
        const recommendation = aiRecommendation(req.body);

        // Design Parameters
        const designParameters = getParameters(
            recommendation.technology
        );

        // Engineering Calculations
        const engineering = engineeringCalculator(
            req.body,
            designParameters
        );
         const cellDesign =
cdiDesign(
    req.body,
    engineering
);
        // Component Sizing
        const sizing = ComponentSizing.calculate(
            req.body,
            recommendation.technology
        );

        // Simulation  <-- FIXED
        const simulation = simulationEngine(
            recommendation.technology,
            req.body,
            designParameters
        );
        const optimization =
optimize(
    req.body,
    sizing,
    engineering
);
        const performance =
performanceCalculator(
    req.body,
    simulation,
    engineering
);
       

   res.json({

    success:true,

    recommendation,

    designParameters,

    engineering,

    sizing,

    simulation,

    optimization,

    performance,
    cellDesign,

});

    } catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

module.exports = router;