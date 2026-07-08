const CDI=require("../models/cdiModel");

const MCDI=require("../models/mcdiModel");

const FCDI=require("../models/fcdiModel");

const EDI=require("../models/ediModel");

module.exports=function(data){

switch(data.technology){

case "CDI":

return CDI(data);

case "MCDI":

return MCDI(data);

case "FCDI":

return FCDI(data);

case "EDI":

return EDI(data);

default:

return{

error:"Technology not supported"

}

}

}