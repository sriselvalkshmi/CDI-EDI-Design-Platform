const express = require("express");
const router = express.Router();


// Services

const aiRecommendation =
require("../services/aiRecommendation");

const getParameters =
require("../services/designParameters");

const engineeringCalculator =
require("../services/engineeringCalculator");

const modelParameters =
require("../services/modelParameters");

const simulationEngine =
require("../services/simulationEngine");

const ComponentSizing =
require("../services/componentSizing");

const optimize =
require("../services/designOptimizer");

const cdiDesign =
require("../services/cdiDesignCalculator");

const stackDesigner =
require("../services/stackDesigner");

const performanceCalculator =
require("../services/performanceCalculator");

const layoutGenerator =
require("../services/layoutGenerator");

const electrodeModel =
require("../services/electrodeModel");




// ========================================
// DESIGN GENERATION API
// ========================================


router.post("/design",(req,res)=>{


try{


console.log("=================================");
console.log("INPUT FROM FRONTEND");
console.log(req.body);
console.log("=================================");



// ----------------------------------------
// 1. TECHNOLOGY SELECTION
// ----------------------------------------


// User selected technology

let selectedTechnology;



if(req.body.technology){

    selectedTechnology =
    req.body.technology;

}

else{


    const ai =
    aiRecommendation(req.body);


    selectedTechnology =
    ai.technology;

}



console.log(
"Selected Technology:",
selectedTechnology
);



// create recommendation object

const recommendation = {


    technology:
    selectedTechnology,


    confidence:
    95,


    reason:
    "Technology selected based on feed water properties and target water quality."


};





// ----------------------------------------
// 2. DESIGN PARAMETERS
// ----------------------------------------


const designParameters =
getParameters(
selectedTechnology
);



console.log(
"✓ Design Parameters OK"
);





// ----------------------------------------
// 3. ENGINEERING CALCULATION
// ----------------------------------------


const engineering =
engineeringCalculator(

req.body,

designParameters,

selectedTechnology

);



console.log(
"✓ Engineering OK"
);






// ----------------------------------------
// 4. ELECTRODE MODEL
// ----------------------------------------


const electrode =
electrodeModel(

req.body,

engineering

);



console.log(
"✓ Electrode OK"
);






// ----------------------------------------
// 5. COMPONENT SIZING
// ----------------------------------------


const sizing =
ComponentSizing.calculate(

req.body,

selectedTechnology

);



console.log(
"✓ Component Sizing OK"
);






// ----------------------------------------
// 6. SIMULATION
// ----------------------------------------


const simulationParameters = {


...modelParameters,


...(req.body.optimizationParameters || {})


};



const simulation =
simulationEngine(

selectedTechnology,

req.body,

simulationParameters

);



console.log(
"✓ Simulation OK"
);






// ----------------------------------------
// 7. CELL DESIGN
// ----------------------------------------


const cellDesign =
cdiDesign(

req.body,

engineering

);



console.log(
"✓ Cell Design OK"
);






// ----------------------------------------
// 8. STACK DESIGN
// ----------------------------------------


const stack =
stackDesigner(

req.body,

cellDesign,

engineering

);



console.log(
"✓ Stack Design OK"
);






// ----------------------------------------
// 9. LAYOUT GENERATION
// ----------------------------------------


const layout =
layoutGenerator(

stack,

engineering

);



console.log(
"✓ Layout OK"
);






// ----------------------------------------
// 10. PERFORMANCE
// ----------------------------------------


const performance =
performanceCalculator(

req.body,

simulation,

engineering,

cellDesign

);



console.log(
"✓ Performance OK"
);






// ----------------------------------------
// 11. OPTIMIZATION
// ----------------------------------------


const optimization =
optimize(

req.body,

sizing,

engineering

);



console.log(
"✓ Optimization OK"
);







console.log(
"✓ ALL CALCULATIONS COMPLETED"
);




// ========================================
// RESPONSE
// ========================================


res.json({


success:true,


selectedTechnology,


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



catch(err){


console.error(
"SERVER ERROR"
);


console.error(err);



res.status(500).json({


success:false,


message:
err.message,


stack:
err.stack


});


}



});



module.exports = router;