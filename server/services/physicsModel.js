function physicsModel(
technology,
params,
feedWater
){


let result={};



let tds =
Number(feedWater.tds);



switch(technology){


case "CDI":


let cdiRemoval =
(
params.SAC *
params.electrodePairs *
params.chargeEfficiency
)/100;


result={

technology:"CDI",

saltRemoval:
cdiRemoval.toFixed(2),

outputTDS:
(
tds*(1-cdiRemoval/100)
).toFixed(2),


energy:
(
params.voltage *
params.flowRate
).toFixed(2)

};


break;



case "MCDI":


let mcdiRemoval =
(
params.SAC *
params.electrodePairs *
(params.chargeEfficiency/100)
*1.3
);



result={

technology:"MCDI",

saltRemoval:
mcdiRemoval.toFixed(2),

outputTDS:
(
tds*(1-mcdiRemoval/100)
).toFixed(2),


energy:
(
params.voltage *
params.flowRate
).toFixed(2)

};


break;



case "FCDI":


let fcdiRemoval =
(
params.membraneArea *
0.08
);



result={


technology:"FCDI",


saltRemoval:
fcdiRemoval.toFixed(2),


outputTDS:
(
tds*(1-fcdiRemoval/100)
).toFixed(2),


energy:
(
params.voltage *
params.slurryFlowRate
).toFixed(2)


};



break;



case "EDI":



let ediRemoval =
(
params.currentDensity *
0.5
);



result={


technology:"EDI",


saltRemoval:
ediRemoval.toFixed(2),


outputTDS:
(
tds*(1-ediRemoval/100)
).toFixed(2),


energy:
(
params.voltage *
params.currentDensity
).toFixed(2)


};



break;


}



return result;


}


module.exports=physicsModel;