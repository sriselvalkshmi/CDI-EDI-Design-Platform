const defaultParameters = {

    voltage:1.2,

    resistance:2.5,

    capacitance:500,


    electrodeArea:250,

    electrodeMass:200,


    chargeEfficiency:0.9,


    channelWidth:0.01,

    channelHeight:0.001,

    channelLength:0.5,


    pumpEfficiency:0.7,


    equations:{


        SAC:
        "salt/electrodeMass",


        Energy:
        "Voltage*Current*time/flow",


        CurrentDensity:
        "Current/electrodeArea"


    }


};


module.exports = defaultParameters;