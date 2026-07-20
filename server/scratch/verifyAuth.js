"use strict";

const authService = require("../services/authService");

async function runTests() {
    console.log("=== Verification Tests: Authentication Service ===");
    
    // 1. Load users and check seeding
    console.log("\n1. Testing user database loading...");
    const users = authService.loadUsers();
    console.log(`Successfully loaded ${users.length} users.`);
    users.forEach(u => {
        console.log(`- Username: ${u.username}, Role: ${u.role}, Status: ${u.status}`);
    });

    // 2. Authenticate default user
    console.log("\n2. Testing authentication validation (Correct credentials)...");
    const adminUser = await authService.authenticate("admin", "admin123");
    if (adminUser) {
        console.log("✅ Success: Authenticated admin.");
        console.log(`- Full Name: ${adminUser.fullName}`);
        console.log(`- Role: ${adminUser.role}`);
        console.log(`- Department: ${adminUser.department}`);
    } else {
        console.log("❌ Error: Failed to authenticate admin.");
    }

    // 3. Authenticate invalid user
    console.log("\n3. Testing authentication validation (Invalid credentials)...");
    const badUser = await authService.authenticate("admin", "wrongpassword");
    if (!badUser) {
        console.log("✅ Success: Properly rejected incorrect password.");
    } else {
        console.log("❌ Error: Allowed authentication with incorrect password.");
    }

    // 4. Password change verification
    console.log("\n4. Testing password change flow...");
    try {
        const engineer = users.find(u => u.username === "engineer");
        const success = await authService.changePassword(engineer.id, "engineer123", "newPassword123");
        if (success) {
            console.log("✅ Success: Changed password.");
            
            // Validate with new password
            const newAuth = await authService.authenticate("engineer", "newPassword123");
            if (newAuth) {
                console.log("✅ Success: Authenticated with new password.");
            } else {
                console.log("❌ Error: Failed to authenticate with new password.");
            }
            
            // Revert password back to original to keep environments consistent
            await authService.changePassword(engineer.id, "newPassword123", "engineer123");
            console.log("✅ Reverted password back to default 'engineer123'.");
        }
    } catch (e) {
        console.log("❌ Error: Password change threw an exception:", e.message);
    }
    
    console.log("\n================ Tests Completed ================");
}

runTests().catch(e => console.error("Test execution crashed:", e));
