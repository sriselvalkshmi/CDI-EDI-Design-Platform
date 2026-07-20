"use strict";

const axios = require("axios");

async function verifyReportAndSystem() {
    const baseURL = "http://localhost:5007/api";
    console.log("==========================================================");
    console.log("   SYSTEM REPORT & AUTHENTICATION INTEGRITY VERIFICATION");
    console.log("==========================================================\n");

    let passCount = 0;
    let failCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  [PASS] ${message}`);
            passCount++;
        } else {
            console.error(`  [FAIL] ${message}`);
            failCount++;
        }
    }

    // 1. Check Backend Health & Design calculation route
    console.log("1. Testing Design Endpoint for Complete Report Data Payload...");
    try {
        const res = await axios.post(`${baseURL}/design`, {
            technology: "CDI",
            tds: 500,
            conductivity: 780,
            hardness: 200,
            ph: 7.2,
            temperature: 25,
            pressure: 2.0,
            flowRate: 100,
            targetTds: 20
        });

        assert(res.status === 200 && res.data.success, "Design calculation executed successfully.");
        assert(res.data.stack && res.data.stack.cellPairs !== undefined, "Stack design data returned.");
        assert(res.data.electrode && res.data.electrode.electrodeMass !== undefined, "Electrode design data returned.");
        assert(res.data.performance && res.data.performance.removalEfficiency !== undefined, "Performance KPI data returned.");
        assert(res.data.optimization && res.data.optimization.optimizedVoltage !== undefined, "Optimization data returned.");
    } catch (e) {
        assert(false, `Design payload test failed: ${e.message}`);
    }

    // 2. Check Admin Credentials & Excel Logs
    console.log("\n2. Testing Administrator Session & Log Retrieval...");
    try {
        const adminRes = await axios.post(`${baseURL}/auth/login`, {
            identifier: "admin",
            password: "Admin@123"
        });
        assert(adminRes.status === 200 && adminRes.data.user.role === "Administrator", "Administrator logged in.");

        const cookie = adminRes.headers["set-cookie"] ? adminRes.headers["set-cookie"][0] : "";
        const logsRes = await axios.get(`${baseURL}/logs/all`, { headers: { Cookie: cookie } });
        assert(logsRes.status === 200 && logsRes.data.success, "Admin retrieved audit logs successfully.");
    } catch (e) {
        assert(false, `Admin session test failed: ${e.message}`);
    }

    console.log("\n==========================================================");
    console.log(`   VERIFICATION COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("==========================================================");
}

verifyReportAndSystem();
