"use strict";

const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const excelHelper = require("../utils/excelHelper");
const { isAuthenticated, authorize } = require("../middleware/authMiddleware");

// POST /api/auth/register - Public Sign Up
router.post("/register", async (req, res) => {
    try {
        const { fullName, email, company, password } = req.body;
        const user = await authService.registerUser({ fullName, email, company, password });
        return res.json({ success: true, message: "Account created successfully. Please sign in.", user });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
});

// POST /api/auth/login - Sign In (Email for Users, Username/Email for Admin)
router.post("/login", async (req, res) => {
    try {
        const { identifier, username, email, password } = req.body;
        const loginId = identifier || email || username;

        if (!loginId || !password) {
            return res.status(400).json({ success: false, message: "Email/Username and password are required" });
        }

        const user = await authService.authenticate(loginId, password);

        if (!user) {
            await excelHelper.logLogin(null, req, false);
            return res.status(401).json({ success: false, message: "Invalid email/username or password" });
        }

        // Establish session
        req.session.user = user;

        req.session.save(async (err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ success: false, message: "Session save failed" });
            }

            // Log login to Excel audit sheets
            await excelHelper.logLogin(user, req, true);

            return res.json({ success: true, user });
        });
    } catch (e) {
        console.error("Exception caught in login route:", e);
        return res.status(500).json({ success: false, message: "Internal server error during login" });
    }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.json({ success: true, message: "Already logged out" });
        }

        const user = req.session.user;

        // Log logout to Excel audit sheets
        await excelHelper.logLogout(user.fullName || user.username, user.email);

        req.session.destroy((err) => {
            if (err) {
                console.error("Session destroy error:", err);
                return res.status(500).json({ success: false, message: "Logout failed" });
            }
            res.clearCookie("cdi_edi_sid");
            return res.json({ success: true });
        });
    } catch (e) {
        console.error("Logout route error:", e);
        return res.status(500).json({ success: false, message: "Internal server error during logout" });
    }
});

// GET /api/auth/me
router.get("/me", (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ success: true, authenticated: true, user: req.session.user });
    }
    return res.json({ success: false, authenticated: false, user: null });
});

// ADMIN USER MANAGEMENT ENDPOINTS
// GET /api/auth/users - List all users (Admin ONLY)
router.get("/users", isAuthenticated, authorize(["Administrator"]), (req, res) => {
    try {
        const users = authService.getAllUsers();
        return res.json({ success: true, users });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// DELETE /api/auth/users/:id - Delete user (Admin ONLY)
router.delete("/users/:id", isAuthenticated, authorize(["Administrator"]), async (req, res) => {
    try {
        await authService.deleteUser(req.params.id);
        const adminUser = req.session.user;
        await excelHelper.logActivity(
            adminUser.fullName || adminUser.username,
            adminUser.email,
            "Delete User Account",
            "User Management",
            `Deleted user ID: ${req.params.id}`
        );
        return res.json({ success: true, message: "User deleted successfully" });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
});

// POST /api/auth/users/:id/reset-password - Admin reset user password
router.post("/users/:id/reset-password", isAuthenticated, authorize(["Administrator"]), async (req, res) => {
    try {
        const { newPassword } = req.body;
        await authService.resetUserPassword(req.params.id, newPassword);
        const adminUser = req.session.user;
        await excelHelper.logActivity(
            adminUser.fullName || adminUser.username,
            adminUser.email,
            "Reset User Password",
            "User Management",
            `Reset password for user ID: ${req.params.id}`
        );
        return res.json({ success: true, message: "User password reset successfully" });
    } catch (e) {
        return res.status(400).json({ success: false, message: e.message });
    }
});

module.exports = router;
