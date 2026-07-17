"use strict";

const express = require("express");
const router = express.Router();
const EquationEngine = require("../services/equationEngine");
const { validateFormula } = require("../utils/formulaParser");

// GET /api/equations
router.get("/", (req, res) => {
    try {
        const equations = EquationEngine.loadEquations();
        res.json({ success: true, equations });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/equations
router.post("/", (req, res) => {
    try {
        const equations = req.body;
        if (!Array.isArray(equations)) {
            return res.status(400).json({ success: false, error: "Invalid data format. Expected an array of equations." });
        }
        EquationEngine.saveEquations(equations);
        res.json({ success: true, message: "Equations saved successfully.", equations: EquationEngine.loadEquations() });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// POST /api/equations/validate
router.post("/validate", (req, res) => {
    try {
        const { formula, allowedVariables } = req.body;
        const validation = validateFormula(formula, allowedVariables);
        res.json(validation);
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// POST /api/equations/reset
router.post("/reset", (req, res) => {
    try {
        EquationEngine.resetToDefaults();
        const equations = EquationEngine.loadEquations();
        res.json({ success: true, message: "Restored default equations successfully.", equations });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
