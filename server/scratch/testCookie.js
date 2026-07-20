"use strict";

const axios = require("axios");

async function testCookiePersistence() {
    console.log("=== Testing Cookie Persistence on Localhost:5006 ===");
    
    // Create an axios instance with a cookie jar or just manually parse and send cookie
    const client = axios.create({
        baseURL: "http://localhost:5006/api",
        withCredentials: true
    });

    try {
        // 1. Initial GET /auth/me -> should be 401
        console.log("\n1. Making initial GET /auth/me (unauthenticated)...");
        try {
            await client.get("/auth/me");
            console.log("❌ Error: Expected 401, but request succeeded.");
        } catch (err) {
            console.log(`✅ Success: Received expected status ${err.response?.status} (${err.response?.data?.message})`);
        }

        // 2. POST /auth/login -> should be 200 and return a Set-Cookie header
        console.log("\n2. Making POST /auth/login with valid credentials...");
        const loginRes = await client.post("/auth/login", {
            username: "admin",
            password: "admin123"
        });
        
        console.log("✅ Success: Login responded with status", loginRes.status);
        
        // Extract cookie
        const setCookieHeaders = loginRes.headers["set-cookie"];
        console.log("   Set-Cookie Header from server:", setCookieHeaders);
        if (!setCookieHeaders || setCookieHeaders.length === 0) {
            console.log("❌ Error: No Set-Cookie header received from server!");
            return;
        }

        const sessionCookie = setCookieHeaders[0].split(";")[0];
        console.log("   Extracted Cookie:", sessionCookie);

        // 3. GET /auth/me -> should be 200 with the cookie attached
        console.log("\n3. Making GET /auth/me with the session cookie attached...");
        const meRes = await client.get("/auth/me", {
            headers: {
                Cookie: sessionCookie
            }
        });
        
        console.log("✅ Success: GET /auth/me responded with status", meRes.status);
        console.log("   Response User:", meRes.data.user);

    } catch (e) {
        console.error("❌ Test crashed:", e.message);
        if (e.response) {
            console.error("   Response data:", e.response.data);
        }
    }
}

testCookiePersistence();
