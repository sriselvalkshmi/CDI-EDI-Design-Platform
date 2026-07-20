"use strict";

const axios = require("axios");

async function test() {
    try {
        console.log("Making POST /api/auth/login to port 5006...");
        const res = await axios.post("http://localhost:5006/api/auth/login", {
            username: "admin",
            password: "Pass@123"
        });
        console.log("Response status:", res.status);
        console.log("Response body:", res.data);
    } catch (e) {
        console.error("Error status:", e.response?.status);
        console.error("Error body:", e.response?.data);
    }
}

test();
