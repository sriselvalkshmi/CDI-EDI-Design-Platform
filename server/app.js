"use strict";


const express = require("express");

const cors = require("cors");



//======================================================
// ROUTES
//======================================================


const designRoutes =
require("./routes/designRoutes");


const optimizeRoute =
require("./routes/optimize");

const equationsRoutes =
require("./routes/equationsRoutes");




//======================================================
// APP
//======================================================


const app = express();





//======================================================
// MIDDLEWARE
//======================================================


app.use(
cors({

origin:
"*",

methods:[
"GET",
"POST",
"PUT",
"DELETE"
],

allowedHeaders:[
"Content-Type"
]

})
);



app.use(
express.json({
limit:"10mb"
})
);




//======================================================
// LOGGER
//======================================================


app.use(
(req,res,next)=>{


console.log("\n----------------------------");

console.log(
req.method,
req.url
);


if(
req.body &&
Object.keys(req.body).length
){

console.log(req.body);

}


console.log("----------------------------");


next();


});




//======================================================
// TEST
//======================================================


app.get(
"/",
(req,res)=>{


res.json({

status:"running",

message:
"CDI EDI Design Platform Server"

});


});




//======================================================
// ROUTES
//======================================================


app.use(

"/api/optimize",

optimizeRoute

);


app.use(

"/api/equations",

equationsRoutes

);


app.use(

"/api",

designRoutes

);





//======================================================
// 404
//======================================================


app.use(
(req,res)=>{


res.status(404).json({

success:false,

message:
"API route not found",

path:
req.originalUrl

});


});




//======================================================
// ERROR HANDLER
//======================================================


app.use(
(err,req,res,next)=>{


console.error(
"SERVER ERROR"
);


console.error(
err.stack
);



res.status(500).json({

success:false,

error:
err.message

});


});




//======================================================
// SERVER
//======================================================


const PORT = 5000;


app.listen(
PORT,
()=>{


console.log(
"================================="
);


console.log(
"CDI EDI Server running"
);


console.log(
`http://localhost:${PORT}`
);


console.log(
"================================="
);


}
);