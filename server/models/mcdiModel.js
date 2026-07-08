function simulateMCDI(input){

    const base=require("./cdiModel")(input);

    base.technology="MCDI";

    base.saltRemoval+=5;

    base.recovery=95;

    return base;

}

module.exports=simulateMCDI;