const express=require("express");

const router=express.Router();


const calculateCDIDesign =
require("../engineering/cdiEngine");



router.post("/",(req,res)=>{


    console.log(
        "CDI Optimization:",
        req.body
    );


    const result =
    calculateCDIDesign(req.body);



    res.json(result);


});


module.exports=router;