"use strict";

const express = require("express");
const router = express.Router();
const excelHelper = require("../utils/excelHelper");
const { isAuthenticated, authorize } = require("../middleware/authMiddleware");

const fs = require("fs");

// GET /api/logs/all - Accessible ONLY to Administrator
router.get("/all", isAuthenticated, authorize(["Administrator"]), async (req, res) => {
    try {
        const data = await excelHelper.readLogsData();
        return res.json({
            success: true,
            ...data
        });
    } catch (e) {
        console.error("Error reading log data for Admin Panel:", e);
        return res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/logs/download - Accessible ONLY to Administrator
router.get("/download", isAuthenticated, authorize(["Administrator"]), async (req, res) => {
    try {
        const filePath = excelHelper.getFilePath();
        if (fs.existsSync(filePath)) {
            return res.download(filePath, "Audit_Logs.xlsx");
        } else {
            return res.status(404).json({ success: false, message: "Audit log file does not exist yet" });
        }
    } catch (e) {
        console.error("Error downloading log data:", e);
        return res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
