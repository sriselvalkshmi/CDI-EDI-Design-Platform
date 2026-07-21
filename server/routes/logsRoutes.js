"use strict";

const express = require("express");
const router = express.Router();
const auditService = require("../services/auditService");
const { isAuthenticated, authorize } = require("../middleware/authMiddleware");

// GET /api/logs/all - Accessible ONLY to Administrator
router.get("/all", isAuthenticated, authorize(["Administrator"]), async (req, res) => {
    try {
        const data = await auditService.readLogsData();
        return res.json({
            success: true,
            ...data
        });
    } catch (e) {
        console.error("Error reading audit logs for Admin Panel:", e);
        return res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
