"use strict";

const axios = require("axios");

async function verify() {
    const baseURL = "http://localhost:5007/api";
    console.log("=== Verification of Equation Editor endpoints ===");

    // Step 1: Login to establish a session
    console.log("\nLogging in...");
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
        username: "admin",
        password: "admin123"
    });
    
    const cookie = loginRes.headers["set-cookie"];
    console.log("Cookie received:", cookie ? "Yes" : "No");

    const authHeaders = {
        headers: {
            Cookie: cookie ? cookie[0] : ""
        }
    };

    // Step 2: GET /api/auth/me
    console.log("\nVerifying GET /api/auth/me...");
    const meRes = await axios.get(`${baseURL}/auth/me`, authHeaders);
    console.log("Status:", meRes.status);
    console.log("User:", meRes.data.user.username);

    // Step 3: GET /api/equations
    console.log("\nVerifying GET /api/equations...");
    const getRes = await axios.get(`${baseURL}/equations`, authHeaders);
    console.log("Status:", getRes.status);
    console.log("Number of equations:", getRes.data.equations.length);
    const firstEq = getRes.data.equations[0];
    console.log("First equation ID:", firstEq.id);

    // Step 4: POST /api/equations (create single custom equation)
    console.log("\nVerifying POST /api/equations (adding custom equation)...");
    const testId = `test_eq_${Date.now()}`;
    const newEq = {
        id: testId,
        name: "Test Custom Equation",
        formula: "V * 2.5",
        category: "Electrical",
        units: "W",
        enabled: true,
        description: "Test equation description",
        example: "V=1 => 2.5"
    };
    const postRes = await axios.post(`${baseURL}/equations`, newEq, authHeaders);
    console.log("Status:", postRes.status);
    console.log("Success:", postRes.data.success);
    console.log("Created Equation:", postRes.data.equation.id);

    // Step 5: PUT /api/equations/:id
    console.log(`\nVerifying PUT /api/equations/${testId}...`);
    const putRes = await axios.put(`${baseURL}/equations/${testId}`, {
        formula: "V * 3.5"
    }, authHeaders);
    console.log("Status:", putRes.status);
    console.log("Updated formula:", putRes.data.equation.formula);

    // Step 6: DELETE /api/equations/:id
    console.log(`\nVerifying DELETE /api/equations/${testId}...`);
    const deleteRes = await axios.delete(`${baseURL}/equations/${testId}`, authHeaders);
    console.log("Status:", deleteRes.status);
    console.log("Success:", deleteRes.data.success);

    // Step 7: GET /api/design
    console.log("\nVerifying GET /api/design...");
    const getDesignRes = await axios.get(`${baseURL}/design`, authHeaders);
    console.log("Status:", getDesignRes.status);
    console.log("Technology:", getDesignRes.data.technology);

    // Step 8: POST /api/design
    console.log("\nVerifying POST /api/design...");
    const postDesignRes = await axios.post(`${baseURL}/design`, {
        technology: "CDI",
        tds: 500,
        flowRate: 10
    }, authHeaders);
    console.log("Status:", postDesignRes.status);
    console.log("Success:", postDesignRes.data.success);

    // Step 9: POST /api/optimize
    console.log("\nVerifying POST /api/optimize...");
    const postOptRes = await axios.post(`${baseURL}/optimize`, {
        technology: "CDI",
        tds: 500,
        flowRate: 10,
        optimizationMode: "AI",
        optimizationInputs: {
            voltage: 1.2,
            current: 5
        }
    }, authHeaders);
    console.log("Status:", postOptRes.status);
    console.log("Success:", postOptRes.data.success);

    // Step 9.5: GET /api/logs/download
    console.log("\nVerifying GET /api/logs/download...");
    const downloadRes = await axios.get(`${baseURL}/logs/download`, {
        ...authHeaders,
        responseType: "arraybuffer"
    });
    console.log("Status:", downloadRes.status);
    console.log("Content-Type:", downloadRes.headers["content-type"]);
    console.log("Content-Length:", downloadRes.data.byteLength);

    // Step 10: Logout
    console.log("\nLogging out...");
    const logoutRes = await axios.post(`${baseURL}/auth/logout`, {}, authHeaders);
    console.log("Status:", logoutRes.status);
    console.log("Success:", logoutRes.data.success);

    console.log("\n=== All endpoint verifications succeeded! ===");
}

verify().catch(err => {
    console.error("Verification failed with error:", err.message);
    if (err.response) {
        console.error("Response data:", err.response.data);
    }
});
