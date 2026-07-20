"use strict";

const axios = require("axios");

async function verifyAll() {
    const baseURL = "http://localhost:5007/api";
    console.log("==========================================================");
    console.log("   FULL SYSTEM VERIFICATION: ROLE-BASED AUTH & AUDIT");
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

    // 1. Unauthenticated checks
    console.log("1. Testing Unauthenticated Access Restrictions...");
    try {
        await axios.get(`${baseURL}/equations`);
        assert(false, "Unauthenticated GET /api/equations should be blocked!");
    } catch (e) {
        assert(e.response?.status === 401, "Unauthenticated GET /api/equations returns 401 Unauthorized.");
    }

    try {
        await axios.get(`${baseURL}/logs/all`);
        assert(false, "Unauthenticated GET /api/logs/all should be blocked!");
    } catch (e) {
        assert(e.response?.status === 401, "Unauthenticated GET /api/logs/all returns 401 Unauthorized.");
    }

    // 2. Public Engineering Routes
    console.log("\n2. Testing Public Engineering Routes...");
    try {
        const desRes = await axios.post(`${baseURL}/design`, { technology: "CDI", tds: 500 });
        assert(desRes.status === 200 && desRes.data.success, "Public POST /api/design executes without login.");
    } catch (e) {
        assert(false, `Public POST /api/design failed: ${e.message}`);
    }

    // 3. Login as Engineer
    console.log("\n3. Testing Engineer Credentials & Permissions...");
    let engCookie = null;
    try {
        const res = await axios.post(`${baseURL}/auth/login`, { username: "engineer", password: "engineer123" });
        assert(res.status === 200 && res.data.user.role === "Engineer", "Engineer logged in successfully.");
        engCookie = res.headers["set-cookie"] ? res.headers["set-cookie"][0] : "";
    } catch (e) {
        assert(false, `Engineer login failed: ${e.message}`);
    }

    const engHeaders = { headers: { Cookie: engCookie } };

    // Engineer can view & add equations
    try {
        const getRes = await axios.get(`${baseURL}/equations`, engHeaders);
        assert(getRes.status === 200 && getRes.data.equations.length > 0, "Engineer can view equations.");
    } catch (e) {
        assert(false, `Engineer GET /api/equations failed: ${e.message}`);
    }

    // Engineer CANNOT delete equations or access logs
    try {
        await axios.delete(`${baseURL}/equations/power`, engHeaders);
        assert(false, "Engineer DELETE /api/equations should be forbidden!");
    } catch (e) {
        assert(e.response?.status === 403 || e.response?.status === 401, "Engineer DELETE /api/equations blocked with 403/401.");
    }

    try {
        await axios.get(`${baseURL}/logs/all`, engHeaders);
        assert(false, "Engineer GET /api/logs/all should be forbidden!");
    } catch (e) {
        assert(e.response?.status === 403 || e.response?.status === 401, "Engineer access to Admin Audit Logs blocked with 403/401.");
    }

    // Logout Engineer
    try {
        await axios.post(`${baseURL}/auth/logout`, {}, engHeaders);
        console.log("  Logged out Engineer.");
    } catch (e) {}

    // 4. Login as Researcher
    console.log("\n4. Testing Researcher Credentials & Permissions...");
    let resCookie = null;
    try {
        const res = await axios.post(`${baseURL}/auth/login`, { username: "researcher", password: "researcher123" });
        assert(res.status === 200 && res.data.user.role === "Researcher", "Researcher logged in successfully.");
        resCookie = res.headers["set-cookie"] ? res.headers["set-cookie"][0] : "";
    } catch (e) {
        assert(false, `Researcher login failed: ${e.message}`);
    }

    const resHeaders = { headers: { Cookie: resCookie } };

    // Researcher can view equations
    try {
        const getRes = await axios.get(`${baseURL}/equations`, resHeaders);
        assert(getRes.status === 200, "Researcher can view equation library.");
    } catch (e) {
        assert(false, `Researcher GET /api/equations failed: ${e.message}`);
    }

    // Researcher CANNOT edit equations
    try {
        await axios.put(`${baseURL}/equations/power`, { formula: "V * 10" }, resHeaders);
        assert(false, "Researcher PUT /api/equations should be forbidden!");
    } catch (e) {
        assert(e.response?.status === 403 || e.response?.status === 401, "Researcher edit equation blocked with 403/401.");
    }

    // Logout Researcher
    try {
        await axios.post(`${baseURL}/auth/logout`, {}, resHeaders);
        console.log("  Logged out Researcher.");
    } catch (e) {}

    // 5. Login as Viewer
    console.log("\n5. Testing Viewer Credentials & Restrictions...");
    let viewCookie = null;
    try {
        const res = await axios.post(`${baseURL}/auth/login`, { username: "viewer", password: "viewer123" });
        assert(res.status === 200 && res.data.user.role === "Viewer", "Viewer logged in successfully.");
        viewCookie = res.headers["set-cookie"] ? res.headers["set-cookie"][0] : "";
    } catch (e) {
        assert(false, `Viewer login failed: ${e.message}`);
    }

    const viewHeaders = { headers: { Cookie: viewCookie } };

    // Viewer CANNOT access Equation Editor API
    try {
        await axios.get(`${baseURL}/equations`, viewHeaders);
        assert(false, "Viewer GET /api/equations should be forbidden!");
    } catch (e) {
        assert(e.response?.status === 403 || e.response?.status === 401, "Viewer equation access blocked with 403/401.");
    }

    // Logout Viewer
    try {
        await axios.post(`${baseURL}/auth/logout`, {}, viewHeaders);
        console.log("  Logged out Viewer.");
    } catch (e) {}

    // 6. Login as Administrator
    console.log("\n6. Testing Administrator Credentials & Admin Audit Panel Access...");
    let adminCookie = null;
    try {
        const res = await axios.post(`${baseURL}/auth/login`, { username: "admin", password: "admin123" });
        assert(res.status === 200 && res.data.user.role === "Administrator", "Administrator logged in successfully.");
        adminCookie = res.headers["set-cookie"] ? res.headers["set-cookie"][0] : "";
    } catch (e) {
        assert(false, `Admin login failed: ${e.message}`);
    }

    const adminHeaders = { headers: { Cookie: adminCookie } };

    // Administrator CAN access Admin Audit Logs
    try {
        const logsRes = await axios.get(`${baseURL}/logs/all`, adminHeaders);
        assert(logsRes.status === 200 && logsRes.data.success, "Administrator retrieved Admin Audit Logs successfully.");
        assert(Array.isArray(logsRes.data.loginHistory) && logsRes.data.loginHistory.length > 0, "Login_History worksheet contains logged logins.");
        assert(Array.isArray(logsRes.data.userActivity) && logsRes.data.userActivity.length > 0, "User_Activity worksheet contains logged activities.");
        assert(Array.isArray(logsRes.data.engineeringModifications), "Engineering_Modifications worksheet initialized.");
    } catch (e) {
        assert(false, `Administrator GET /api/logs/all failed: ${e.message}`);
    }

    // Logout Administrator
    try {
        await axios.post(`${baseURL}/auth/logout`, {}, adminHeaders);
        console.log("  Logged out Administrator.");
    } catch (e) {}

    console.log("\n==========================================================");
    console.log(`   VERIFICATION COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("==========================================================");
}

verifyAll();
