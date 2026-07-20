"use strict";

const axios = require("axios");

async function verifyNewAuthSystem() {
    const baseURL = "http://localhost:5007/api";
    console.log("==========================================================");
    console.log("   SYSTEM VERIFICATION: SIGN UP, LOGIN & ADMIN MONITORING");
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

    // 1. Mandatory Entry Check (Unauthenticated endpoints)
    console.log("1. Testing Entry Access Restrictions...");
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

    // 2. Admin Login
    console.log("\n2. Testing Administrator Credentials (admin / Admin@123)...");
    let adminCookie = null;
    try {
        const adminRes = await axios.post(`${baseURL}/auth/login`, {
            identifier: "admin",
            password: "Admin@123"
        });
        assert(adminRes.status === 200 && adminRes.data.user.role === "Administrator", "Administrator logged in successfully.");
        adminCookie = adminRes.headers["set-cookie"] ? adminRes.headers["set-cookie"][0] : "";
    } catch (e) {
        assert(false, `Administrator login failed: ${e.message}`);
    }

    const adminHeaders = { headers: { Cookie: adminCookie } };

    // 3. Admin Access to User List & Logs
    console.log("\n3. Testing Admin Access to Audit Logs & User List...");
    try {
        const logsRes = await axios.get(`${baseURL}/logs/all`, adminHeaders);
        assert(logsRes.status === 200 && logsRes.data.success, "Admin retrieved audit logs successfully.");
        assert(Array.isArray(logsRes.data.loginHistory), "Login_History sheet returned.");
        assert(Array.isArray(logsRes.data.userActivity), "User_Activity sheet returned.");
    } catch (e) {
        assert(false, `Admin logs query failed: ${e.message}`);
    }

    try {
        const usersRes = await axios.get(`${baseURL}/auth/users`, adminHeaders);
        assert(usersRes.status === 200 && usersRes.data.success, "Admin retrieved registered user list.");
    } catch (e) {
        assert(false, `Admin user list query failed: ${e.message}`);
    }

    // 4. User Registration (Sign Up)
    console.log("\n4. Testing Account Registration (Sign Up)...");
    const testEmail = `testuser_${Date.now()}@domain.com`;
    let newUserId = null;
    try {
        const regRes = await axios.post(`${baseURL}/auth/register`, {
            fullName: "Test Engineer User",
            email: testEmail,
            company: "Acme Water Systems",
            password: "UserPass123"
        });
        assert(regRes.status === 200 && regRes.data.success, "New user registered successfully.");
        assert(regRes.data.user.role === "User", "Role automatically assigned as 'User'.");
        newUserId = regRes.data.user.id;
    } catch (e) {
        assert(false, `User registration failed: ${e.message}`);
    }

    // Duplicate Registration Block Check
    try {
        await axios.post(`${baseURL}/auth/register`, {
            fullName: "Duplicate User",
            email: testEmail,
            password: "UserPass123"
        });
        assert(false, "Duplicate email registration should be blocked!");
    } catch (e) {
        assert(e.response?.status === 400, "Duplicate email registration blocked with 400 Bad Request.");
    }

    // 5. Normal User Login with Email & Password
    console.log("\n5. Testing Registered User Login with Email & Password...");
    let userCookie = null;
    try {
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            identifier: testEmail,
            password: "UserPass123"
        });
        assert(loginRes.status === 200 && loginRes.data.user.email === testEmail, "Registered user logged in using Email & Password.");
        userCookie = loginRes.headers["set-cookie"] ? loginRes.headers["set-cookie"][0] : "";
    } catch (e) {
        assert(false, `User login failed: ${e.message}`);
    }

    const userHeaders = { headers: { Cookie: userCookie } };

    // 6. Normal User Permissions (View & Edit allowed, Delete & Admin Panel blocked)
    console.log("\n6. Testing Normal User Permissions & Restrictions...");
    try {
        const eqRes = await axios.get(`${baseURL}/equations`, userHeaders);
        assert(eqRes.status === 200 && eqRes.data.equations.length > 0, "Normal user can view equations.");
    } catch (e) {
        assert(false, `User GET /api/equations failed: ${e.message}`);
    }

    try {
        await axios.get(`${baseURL}/logs/all`, userHeaders);
        assert(false, "Normal user GET /api/logs/all should be forbidden!");
    } catch (e) {
        assert(e.response?.status === 403 || e.response?.status === 401, "Normal user access to Admin Panel logs blocked with 403/401.");
    }

    try {
        await axios.delete(`${baseURL}/equations/power`, userHeaders);
        assert(false, "Normal user DELETE /api/equations should be forbidden!");
    } catch (e) {
        assert(e.response?.status === 403 || e.response?.status === 401, "Normal user equation deletion blocked with 403/401.");
    }

    // 7. Admin User Management (Reset password & Delete user)
    console.log("\n7. Testing Admin User Management (Password Reset & User Deletion)...");
    if (newUserId) {
        try {
            const resetRes = await axios.post(`${baseURL}/auth/users/${newUserId}/reset-password`, {
                newPassword: "NewUserPass456"
            }, adminHeaders);
            assert(resetRes.status === 200 && resetRes.data.success, "Admin reset user password successfully.");

            const delRes = await axios.delete(`${baseURL}/auth/users/${newUserId}`, adminHeaders);
            assert(delRes.status === 200 && delRes.data.success, "Admin deleted user account successfully.");
        } catch (e) {
            assert(false, `Admin user management failed: ${e.message}`);
        }
    }

    console.log("\n==========================================================");
    console.log(`   VERIFICATION COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("==========================================================");
}

verifyNewAuthSystem();
