const express = require("express");
const cors = require("cors");


const designRoutes = require("./routes/designRoutes");


const app = express();


app.use(cors());


app.use(express.json());



app.get("/",(req,res)=>{

    res.send(
        "CDI EDI Design Platform Server Running"
    );

});



app.use(
    "/api",
    designRoutes
);



const PORT = 5000;


app.listen(PORT,()=>{

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});