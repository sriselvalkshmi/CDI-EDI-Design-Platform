"use strict";

const express = require("express");
const router = express.Router();
const excelHelper = require("../utils/excelHelper");

const cdiCellDesigner =
require("../services/cdiCellDesigner");
//======================================================
// SAFE FUNCTION LOADER
//======================================================

function loadFunction(path, aliases = []) {

    const module = require(path);


    if (typeof module === "function") {
        return module;
    }


    for (const name of aliases) {

        if (typeof module[name] === "function") {
            return module[name];
        }

    }


    console.error(
        "FAILED LOADING:",
        path,
        module
    );


    throw new Error(
        "Function export missing from " + path
    );

}



//======================================================
// SERVICES
//======================================================


const aiRecommendation =
loadFunction(
    "../services/aiRecommendation",
    [
        "recommend",
        "aiRecommendation"
    ]
);



const getParameters =
loadFunction(
    "../services/designParameters",
    [
        "getParameters"
    ]
);



const engineeringCalculator =
loadFunction(
    "../services/engineeringCalculator",
    [
        "calculateEngineering"
    ]
);



const electrodeModel =
loadFunction(
    "../services/electrodeModel",
    [
        "calculateElectrode"
    ]
);



const ComponentSizing =
loadFunction(
    "../services/componentSizing",
    [
        "calculate",
        "calculateSizing"
    ]
);



const simulationEngine =
loadFunction(
    "../services/simulationEngine",
    [
        "simulate",
        "simulationEngine"
    ]
);



const optimize =
loadFunction(
    "../services/designOptimizer",
    [
        "optimize",
        "designOptimizer"
    ]
);



const cdiDesign =
loadFunction(
    "../services/cdiDesignCalculator",
    [
        "calculateCDIDesign"
    ]
);



const stackDesigner =
loadFunction(
    "../services/stackDesigner",
    [
        "stackDesigner",
        "designStack"
    ]
);



const layoutGenerator =
loadFunction(
    "../services/layoutGenerator",
    [
        "generateLayout"
    ]
);



const performanceCalculator =
loadFunction(
    "../services/performanceCalculator",
    [
        "performanceCalculator",
        "calculatePerformance"
    ]
);



//======================================================
// DESIGN API
// GET /api/design
router.get(
"/design",
(req, res) => {
    try {
        const getParameters = require("../services/designParameters");
        const technology = req.session?.designInputs?.technology || "CDI";
        const designParameters = getParameters(technology);
        res.json({ success: true, technology, designParameters });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/design
//======================================================


router.post(
"/design",
async (req,res)=>{


try{
        const username = req.session?.user?.username || "Anonymous";
        const role = req.session?.user?.role || "Public/Guest";
        await excelHelper.logActivity(username, role, "Generate Design", "Design Builder", `Generated stack design using technology: ${req.body.technology || "CDI"}`);
        await excelHelper.logActivity(username, role, "Generate P&ID", "Design Builder", "Generated process flow diagram layout.");
        await excelHelper.logActivity(username, role, "Run Simulation", "Simulation Engine", "Executed CDI/EDI dynamic process simulation.");
        
        if (req.session.designInputs) {
            const changeReason = req.body.changeReason || "Generate Design";
            await excelHelper.compareAndLogParameters(username, role, req.session.designInputs, req.body, changeReason, "Design Builder");
        }
        req.session.designInputs = JSON.parse(JSON.stringify(req.body));

        console.log("\n====================================");
console.log("NEW DESIGN REQUEST");
console.log(req.body);
console.log("====================================");



//------------------------------------------------------
// FEED WATER
//------------------------------------------------------


const feedWater = {

    ...req.body,


    tds:

    Number(
        req.body.tds ?? 500
    ),


    conductivity:

    Number(
        req.body.conductivity ?? 300
    ),


    hardness:

    Number(
        req.body.hardness ?? 150
    ),


    ph:

    Number(
        req.body.ph ?? 7
    ),


    temperature:

    Number(
        req.body.temperature ?? 25
    ),


    pressure:

    Number(
        req.body.pressure ?? 1
    ),


    flowRate:

    Number(
        req.body.flowRate ?? 10
    ),


    targetTds:

    Number(
        req.body.targetTds ??
        req.body.targetTDS ??
        50
    )

};
//------------------------------------------------------
// AI RECOMMENDATION
//------------------------------------------------------

const ai = aiRecommendation(feedWater);

console.log("=================================");
console.log("AI Recommendation");
console.log(ai);
console.log("=================================");

//------------------------------------------------------
// TECHNOLOGY SELECTION
//------------------------------------------------------

let technology;

// Manual override
if (
    feedWater.technology &&
    feedWater.technology !== "AUTO"
) {

    technology = feedWater.technology;

    console.log("Manual Technology:", technology);

}
else {

    technology = ai.technology;

    console.log("AI Selected Technology:", technology);

}
//------------------------------------------------------
// PARAMETERS
//------------------------------------------------------


//------------------------------------------------------
// DESIGN PARAMETERS
//------------------------------------------------------

const designParameters =
getParameters(technology);

console.log(
    "Design Parameters:",
    designParameters
);
//------------------------------------------------------
// ENGINEERING
//------------------------------------------------------

const engineering =
engineeringCalculator(

    feedWater,

    designParameters,

    technology

);

engineering.recommendedVoltage =
ai.recommendedVoltage;

engineering.recommendedCurrent =
ai.recommendedCurrent;

engineering.expectedRemoval =
ai.expectedRemoval;



//------------------------------------------------------
// ELECTRODE
//------------------------------------------------------


const electrode =
electrodeModel(

    feedWater,

    engineering

);


console.log(
"Electrode completed"
);




//------------------------------------------------------
// SIZING
//------------------------------------------------------


const sizing =
ComponentSizing(

    engineering,

    technology

);


console.log(
"Sizing completed"
);




//------------------------------------------------------
// SIMULATION
//------------------------------------------------------


const simulation =
simulationEngine(

    technology,

    feedWater,

    {

        engineering,

        electrode

    }

);


console.log(
"Simulation completed"
);




//------------------------------------------------------
// CELL DESIGN
//------------------------------------------------------


let cellDesign = null;


try{


cellDesign =
cdiDesign(

    feedWater,

    engineering

);


}
catch(e){

console.log(
"CDI cell design skipped:",
e.message
);

}




//------------------------------------------------------
// STACK
//------------------------------------------------------


let stack = null;


try{


stack =
stackDesigner(

    feedWater,

    cellDesign,

    engineering

);


}
catch(e){

console.log(
"Stack skipped:",
e.message
);

}




//------------------------------------------------------
// LAYOUT
//------------------------------------------------------
const layout =
layoutGenerator(

stack,

engineering,

feedWater,

simulation

);





//------------------------------------------------------
// PERFORMANCE
//------------------------------------------------------


const performance =

performanceCalculator(

    feedWater,

    simulation,

    engineering,

    cellDesign,

    electrode

);



console.log(
"Performance calculated"
);




//------------------------------------------------------
// OPTIMIZATION
//------------------------------------------------------


const optimization =

optimize(

{

    ...feedWater,

    technology,

    engineering,

    simulation,

    sizing,


    optimizationInputs:

    req.body.optimizationInputs || {},


    lockedParameters:

    req.body.lockedParameters || {},


    optimizationMode:

    req.body.optimizationMode || "AI"


},

sizing,

engineering

);



console.log(
"Optimization completed"
);

//--------------------------------------------------
// CDI CELL DESIGN
//--------------------------------------------------

const cellGeometry =

cdiCellDesigner(

    feedWater,

    optimization,

    engineering

);


console.log(
"CDI Cell Geometry Completed"
);


//======================================================
// RESPONSE
//======================================================
res.json({

success:true,

recommendation: ai,

selectedTechnology: technology,

designParameters,

engineering,

sizing,

simulation,

optimization,

cellGeometry,

stack,

cellDesign,

layout,

electrode,

performance

});


}


catch(error){


console.error(
"=============================="
);


console.error(
"DESIGN API ERROR"
);


console.error(
error.stack
);


console.error(
"=============================="
);



res.status(500).json({

success:false,

error:
error.message

});


}


});





module.exports = router;