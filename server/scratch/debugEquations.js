"use strict";

const axios = require("axios");

async function verify() {
    const baseURL = "http://localhost:5006/api";
    console.log("=== Debugging Equation Editor endpoints ===");

    try {
        console.log("\nLogging in...");
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            username: "admin",
            password: "admin123"
        });
        console.log("Login Res:", loginRes.status, loginRes.data);
    } catch (err) {
        console.error("Login failed with error message:", err.message);
        if (err.response) {
            console.error("Response data:", err.response.data);
            console.error("Response status:", err.response.status);
        } else {
            console.error("Full error:", err);
        }
    }
}

verify().catch(e => console.error("Crash:", e));
