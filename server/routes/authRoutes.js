"use strict";

const express = require("express");
const router = express.Router();
const auditService = require("../services/auditService");
const { isAuthenticated } = require("../middleware/authMiddleware");

// GET /api/auth/me - Check current Supabase authenticated user session
router.get("/me", isAuthenticated, (req, res) => {
    return res.json({
        success: true,
        authenticated: true,
        user: req.user
    });
});

// POST /api/auth/login-event - Audit log login event from client
router.post("/login-event", async (req, res) => {
    try {
        const { userId, email, success } = req.body;
        await auditService.logLogin(userId, email, req, !!success);
        return res.json({ success: true });
    } catch (e) {
        console.error("[AUTH LOG] Error logging login event:", e);
        return res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/auth/logout-event - Audit log logout event from client
router.post("/logout-event", async (req, res) => {
    try {
        const { userId, email } = req.body;
        await auditService.logLogout(userId, email);
        return res.json({ success: true });
    } catch (e) {
        console.error("[AUTH LOG] Error logging logout event:", e);
        return res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
