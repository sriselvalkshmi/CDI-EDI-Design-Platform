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
const electrodeModel = require("../services/electrodeModel");

router.post("/design", (req, res) => {

    try {

        console.log("=================================");
        console.log("INPUT FROM FRONTEND");
        console.log(req.body);
        console.log("=================================");

        console.log("1. AI Recommendation...");
        const recommendation = aiRecommendation(req.body);
        console.log("✓ AI Recommendation OK");

        console.log("2. Design Parameters...");
        const designParameters = getParameters(
            recommendation.technology
        );
        console.log("✓ Design Parameters OK");

        console.log("3. Engineering...");
        const engineering = engineeringCalculator(
            req.body,
            designParameters,
            recommendation.technology
        );
        console.log("✓ Engineering OK");

        console.log("4. Electrode...");
        const electrode = electrodeModel(
            req.body,
            engineering
        );
        console.log("✓ Electrode OK");

        console.log("5. Component Sizing...");
        const sizing = ComponentSizing.calculate(
            req.body,
            recommendation.technology
        );
        console.log("✓ Component Sizing OK");

        console.log("6. Simulation...");
        const simulation = simulationEngine(
            recommendation.technology,
            req.body,
            designParameters
        );
        console.log("✓ Simulation OK");

        console.log("7. Cell Design...");
        const cellDesign = cdiDesign(
            req.body,
            engineering
        );
        console.log("✓ Cell Design OK");

        console.log("8. Stack Design...");
        const stack = stackDesigner(
            req.body,
            cellDesign,
            engineering
        );
        console.log("✓ Stack Design OK");

        console.log("9. Layout...");
        const layout = layoutGenerator(
            stack,
            engineering
        );
        console.log("✓ Layout OK");

        console.log("10. Performance...");
        const performance = performanceCalculator(
            req.body,
            simulation,
            engineering,
            cellDesign
        );
        console.log("✓ Performance OK");

        console.log("11. Optimization...");
        const optimization = optimize(
            req.body,
            sizing,
            engineering
        );
        console.log("✓ Optimization OK");

        console.log("✓ ALL CALCULATIONS COMPLETED");

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

            electrode,

            performance

        });

    }
    catch (err) {

        console.error("=================================");
        console.error("SERVER ERROR");
        console.error(err);
        console.error(err.stack);
        console.error("=================================");

        res.status(500).json({

            success: false,

            message: err.message,
            stack: err.stack

        });

    }

});

module.exports = router;