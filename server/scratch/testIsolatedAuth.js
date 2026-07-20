"use strict";

const axios = require("axios");

async function testIsolated() {
    console.log("=== Isolating Authentication Diagnosis ===");
    try {
        // 1. Check debug-users
        console.log("\n1. Triggering GET /api/auth/debug-users...");
        const debugRes = await axios.get("http://localhost:5006/api/auth/debug-users");
        console.log("   Success:", debugRes.data.success);
        console.log("   Users loaded:");
        debugRes.data.users.forEach(u => {
            console.log(`     - Username: ${u.username}, Role: ${u.role}, Status: ${u.status}, Hash exists? ${u.hashExists}, Hash length: ${u.hashLength}, prefix: ${u.firstChars}`);
        });

        // 2. Trigger test-login
        console.log("\n2. Triggering POST /api/auth/test-login...");
        const loginRes = await axios.post("http://localhost:5006/api/auth/test-login");
        console.log("   Status:", loginRes.status);
        console.log("   Success:", loginRes.data.success);
        console.log("   Response JSON:", JSON.stringify(loginRes.data, null, 2));

    } catch (e) {
        console.error("❌ Test crashed:", e.message);
        if (e.response) {
            console.error("   Response status:", e.response.status);
            console.error("   Response data:", e.response.data);
        }
    }
}

testIsolated();
