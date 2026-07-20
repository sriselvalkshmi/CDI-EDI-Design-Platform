"use strict";


const express = require("express");

const cors = require("cors");
require('dotenv').config();
const session = require('express-session');


const app = express();

// 1. CORS (supports credentials and points specifically to client ports)
app.use(
  cors({
    origin: ["http://localhost:5174", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "X-From-Equation-Editor"],
  })
);

// 2. Express JSON body parser
app.use(express.json({ limit: "10mb" }));

// 3. Express URLencoded parser
app.use(express.urlencoded({ extended: true }));

// 4. Session middleware
app.use(
  session({
    name: 'cdi_edi_sid', // Custom cookie name to avoid localhost clashes
    secret: process.env.SESSION_SECRET || 'replace_this_secret',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { 
      httpOnly: true,
      secure: false, // http only
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000 
    },
  })
);

// Auth & Audit services/middlewares
const fs = require("fs");
const excelHelper = require("./utils/excelHelper");
const { isAuthenticated, authorize } = require("./middleware/authMiddleware");
const authRoutes = require("./routes/authRoutes");




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








//======================================================
// MIDDLEWARE
//======================================================











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




const logsRoutes = require("./routes/logsRoutes");

//======================================================
// ROUTES
//======================================================

app.use("/api/auth", authRoutes);

// Admin-only audit logs API (for Admin Panel)
app.use("/api/logs", isAuthenticated, authorize(["Administrator"]), logsRoutes);

// Public engineering routes
app.use("/api/optimize", optimizeRoute);

// Protected equation editor routes
app.use("/api/equations", isAuthenticated, equationsRoutes);

// Public design routes
app.use("/api", designRoutes);






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


const PORT = 5007;


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