const simulationEngine =
require("../services/simulationEngine");


const aiRecommendation =
require("../services/aiRecommendation");



exports.generateDesign=(req,res)=>{


try{


const input=req.body;



const recommendation =
aiRecommendation(input.feedWater);



const simulation =
simulationEngine(input);



res.json({

success:true,


recommendation,


simulation


});


}



catch(error){


res.status(500).json({

success:false,

message:error.message

});


}



};