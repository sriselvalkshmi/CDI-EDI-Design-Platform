"use strict";


const express = require("express");

const cors = require("cors");
require('dotenv').config();
const session = require('express-session');


const app = express();

// Trust proxy (required for production reverse proxies like Render/Railway/Heroku)
app.set("trust proxy", 1);

// 1. CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://effulgent-twilight-1ce68d.netlify.app",
  process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith(".netlify.app")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
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
const isProduction = process.env.NODE_ENV === "production";
app.use(
  session({
    name: 'cdi_edi_sid', // Custom cookie name
    secret: process.env.SESSION_SECRET || 'replace_this_secret',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { 
      httpOnly: true,
      secure: isProduction, // secure in production (HTTPS)
      sameSite: isProduction ? 'none' : 'lax', // required for cross-domain cookies in production
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


// Health Check Endpoint for Render / Cloud Monitors
app.get("/", (req, res) => {
  res.json({
    status: "online",
    application: "CDI / EDI Design Platform",
    version: "2.0"
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


const PORT = process.env.PORT || 5007;

app.listen(PORT, () => {
  console.log("=================================");
  console.log("CDI/EDI Backend Started");
  console.log(`Running on port: ${PORT}`);
  console.log("=================================");
});