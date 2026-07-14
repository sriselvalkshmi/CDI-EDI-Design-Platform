const express = require("express");
const cors = require("cors");

const designRoutes = require("./routes/designRoutes");
const optimizeRoute = require("./routes/optimize");

const app = express();


// Middleware

app.use(cors());

app.use(express.json());


// Test route

app.get("/", (req, res) => {

    res.send(
        "CDI EDI Design Platform Server Running"
    );

});


// Design API

app.use(
    "/api",
    designRoutes
);


// Optimization API

app.use(
    "/api/optimize",
    optimizeRoute
);


// Server

const PORT = 5000;


app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});