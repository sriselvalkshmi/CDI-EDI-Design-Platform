function simulateFCDI(input){

    return{

        technology:"FCDI",

        outletTDS:input.tds*0.08,

        saltRemoval:92,

        SAC:30,

        slurryFlowRate:2.5,

        energy:1.1,

        recovery:90

    }

}

module.exports=simulateFCDI;