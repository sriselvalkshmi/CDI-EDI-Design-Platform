"use strict";

const express = require("express");
const router = express.Router();
const EquationEngine = require("../services/equationEngine");
const { validateFormula } = require("../utils/formulaParser");
const excelHelper = require("../utils/excelHelper");
const { authorize } = require("../middleware/authMiddleware");

// GET /api/equations - Allowed for Administrator, User, Engineer, Researcher
router.get("/", authorize(["Administrator", "User", "Engineer", "Researcher"]), async (req, res) => {
    try {
        const username = req.session?.user?.fullName || req.session?.user?.username || "Anonymous";
        const email = req.session?.user?.email || "N/A";
        const role = req.session?.user?.role || "User";
        const equations = EquationEngine.loadEquations();

        // Log viewing activity
        await excelHelper.logActivity(username, email, "Open Equation Editor", "Equation Editor", `Opened equation library (${equations.length} equations)`);

        res.json({ success: true, equations });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/equations - Add, Save, or Import Equations (Administrator, User, Engineer)
router.post("/", authorize(["Administrator", "User", "Engineer"]), async (req, res) => {
    try {
        const username = req.session?.user?.fullName || req.session?.user?.username || "Anonymous";
        const email = req.session?.user?.email || "N/A";
        const role = req.session?.user?.role || "User";
        let equations = EquationEngine.loadEquations() || [];
        
        if (Array.isArray(req.body)) {
            const newEquations = req.body;
            
            // Log actions & modifications
            for (const newEq of newEquations) {
                const oldEq = equations.find(o => o.id === newEq.id);
                if (!oldEq) {
                    await excelHelper.logActivity(username, email, "Equation Added", "Equation Editor", `Added equation: ${newEq.name}`);
                    await excelHelper.logModification(username, email, "Equation Editor", `Equation Added: ${newEq.name}`, "", newEq.formula, "New equation creation");
                } else if (newEq.formula !== oldEq.formula) {
                    await excelHelper.logActivity(username, email, "Edit Equation", "Equation Editor", `Modified equation formula: ${newEq.name}`);
                    await excelHelper.logModification(username, email, "Equation Editor", `Equation Formula: ${newEq.name}`, oldEq.formula, newEq.formula, "Formula changed");
                }
            }
            for (const oldEq of equations) {
                const newEq = newEquations.find(n => n.id === oldEq.id);
                if (!newEq) {
                    // Only Admin can delete
                    if (role === "Administrator") {
                        await excelHelper.logActivity(username, email, "Delete Equation", "Equation Editor", `Deleted equation: ${oldEq.name}`);
                        await excelHelper.logModification(username, email, "Equation Editor", `Equation Deleted: ${oldEq.name}`, oldEq.formula, "", "Equation deleted");
                    }
                }
            }

            // Overwrite array mode
            EquationEngine.saveEquations(newEquations);
            return res.json({ success: true, message: "Equations saved successfully.", equations: EquationEngine.loadEquations() });
        } else {
            // Create/Append mode
            const newEq = req.body;
            if (!newEq.id || !newEq.name || !newEq.formula) {
                return res.status(400).json({ success: false, error: "Missing required equation fields (id, name, formula)." });
            }
            
            // Check if already exists
            const exists = equations.find(e => e.id === newEq.id);
            if (exists) {
                return res.status(400).json({ success: false, error: `Equation with id ${newEq.id} already exists.` });
            }

            equations.push(newEq);
            EquationEngine.saveEquations(equations);

            // Log activity and modification
            await excelHelper.logActivity(username, email, "Save Equation", "Equation Editor", `Created equation: ${newEq.name}`);
            await excelHelper.logModification(username, email, "Equation Editor", `Equation Added: ${newEq.name}`, "", newEq.formula, "New equation created");

            return res.status(200).json({ success: true, message: "Equation created successfully.", equation: newEq, equations: EquationEngine.loadEquations() });
        }
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// PUT /api/equations/:id - Edit Equation (Administrator, User, Engineer)
router.put("/:id", authorize(["Administrator", "User", "Engineer"]), async (req, res) => {
    try {
        const username = req.session?.user?.username || "Anonymous";
        const role = req.session?.user?.role || "Unknown";
        const { id } = req.params;
        const updatedFields = req.body;
        let equations = EquationEngine.loadEquations() || [];
        
        const index = equations.findIndex(e => e.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: `Equation with id ${id} not found.` });
        }
        
        const oldEq = equations[index];
        const updatedEq = {
            ...oldEq,
            ...updatedFields,
            id: id
        };
        
        equations[index] = updatedEq;
        EquationEngine.saveEquations(equations);

        // Log edit action
        await excelHelper.logActivity(username, role, "Edit Equation", "Equation Editor", `Modified equation: ${updatedEq.name}`);
        if (updatedFields.formula && updatedFields.formula !== oldEq.formula) {
            await excelHelper.logModification(username, role, "Equation Editor", `Equation Formula: ${updatedEq.name}`, oldEq.formula, updatedEq.formula, "Formula changed");
        }

        res.json({ success: true, message: "Equation updated successfully.", equation: equations[index], equations: EquationEngine.loadEquations() });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// DELETE /api/equations/:id - Delete Equation (Administrator ONLY)
router.delete("/:id", authorize(["Administrator"]), async (req, res) => {
    try {
        const username = req.session?.user?.username || "Anonymous";
        const role = req.session?.user?.role || "Unknown";
        const { id } = req.params;
        let equations = EquationEngine.loadEquations() || [];
        
        const oldEq = equations.find(e => e.id === id);
        if (!oldEq) {
            return res.status(404).json({ success: false, error: `Equation with id ${id} not found.` });
        }
        
        const filtered = equations.filter(e => e.id !== id);
        EquationEngine.saveEquations(filtered);

        // Log delete action
        await excelHelper.logActivity(username, role, "Delete Equation", "Equation Editor", `Deleted equation: ${oldEq.name}`);
        await excelHelper.logModification(username, role, "Equation Editor", `Equation Deleted: ${oldEq.name}`, oldEq.formula, "", "Equation deleted");

        res.json({ success: true, message: "Equation deleted successfully.", equations: EquationEngine.loadEquations() });
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

// POST /api/equations/reset - Reset Library to Defaults (Administrator ONLY)
router.post("/reset", authorize(["Administrator"]), async (req, res) => {
    try {
        const username = req.session?.user?.username || "Anonymous";
        const role = req.session?.user?.role || "Unknown";
        EquationEngine.resetToDefaults();
        const equations = EquationEngine.loadEquations();
        
        // Log restore default action
        await excelHelper.logActivity(username, role, "Reset Equation Library", "Equation Editor", "Restored default equations library.");
        
        res.json({ success: true, message: "Restored default equations successfully.", equations });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
