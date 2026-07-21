"use strict";

const express = require("express");
const router = express.Router();
const EquationEngine = require("../services/equationEngine");
const { validateFormula } = require("../utils/formulaParser");
const auditService = require("../services/auditService");
const { isAuthenticated, authorize } = require("../middleware/authMiddleware");

// GET /api/equations - View equations library (Authenticated users)
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id;
        const email = req.user?.email || "Anonymous";
        const equations = EquationEngine.loadEquations();

        // Log viewing activity
        await auditService.logActivity(userId, email, "Open Equation Editor", "Equation Editor", `Opened equation library (${equations.length} equations)`);

        res.json({ success: true, equations });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/equations - Add, Save, or Import Equations (Authenticated users)
router.post("/", isAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id;
        const email = req.user?.email || "Anonymous";
        const role = req.user?.role || "Engineer";
        let equations = EquationEngine.loadEquations() || [];
        
        if (Array.isArray(req.body)) {
            const newEquations = req.body;
            
            for (const newEq of newEquations) {
                const oldEq = equations.find(o => o.id === newEq.id);
                if (!oldEq) {
                    await auditService.logActivity(userId, email, "Save Equation", "Equation Editor", `Added equation: ${newEq.name}`);
                    await auditService.logModification(userId, `Equation Added: ${newEq.name}`, "", newEq.formula, "New equation creation");
                } else if (newEq.formula !== oldEq.formula) {
                    await auditService.logActivity(userId, email, "Edit Equation", "Equation Editor", `Modified equation formula: ${newEq.name}`);
                    await auditService.logModification(userId, `Equation Formula: ${newEq.name}`, oldEq.formula, newEq.formula, "Formula changed");
                }
            }

            // Check if any deleted
            for (const oldEq of equations) {
                const newEq = newEquations.find(n => n.id === oldEq.id);
                if (!newEq) {
                    if (role !== "Administrator") {
                        return res.status(403).json({
                            success: false,
                            error: "403 Unauthorized: Only Administrator can delete equations."
                        });
                    }
                    await auditService.logActivity(userId, email, "Delete Equation", "Equation Editor", `Deleted equation: ${oldEq.name}`);
                    await auditService.logModification(userId, `Equation Deleted: ${oldEq.name}`, oldEq.formula, "", "Equation deleted");
                }
            }

            EquationEngine.saveEquations(newEquations);
            return res.json({ success: true, message: "Equations saved successfully.", equations: EquationEngine.loadEquations() });
        } else {
            const newEq = req.body;
            if (!newEq.id || !newEq.name || !newEq.formula) {
                return res.status(400).json({ success: false, error: "Missing required equation fields (id, name, formula)." });
            }
            
            const exists = equations.find(e => e.id === newEq.id);
            if (exists) {
                return res.status(400).json({ success: false, error: `Equation with id ${newEq.id} already exists.` });
            }

            equations.push(newEq);
            EquationEngine.saveEquations(equations);

            await auditService.logActivity(userId, email, "Save Equation", "Equation Editor", `Created equation: ${newEq.name}`);
            await auditService.logModification(userId, `Equation Added: ${newEq.name}`, "", newEq.formula, "New equation created");

            return res.status(200).json({ success: true, message: "Equation created successfully.", equation: newEq, equations: EquationEngine.loadEquations() });
        }
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// PUT /api/equations/:id - Edit Equation (Authenticated users)
router.put("/:id", isAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id;
        const email = req.user?.email || "Anonymous";
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

        await auditService.logActivity(userId, email, "Edit Equation", "Equation Editor", `Modified equation: ${updatedEq.name}`);
        if (updatedFields.formula && updatedFields.formula !== oldEq.formula) {
            await auditService.logModification(userId, `Equation Formula: ${updatedEq.name}`, oldEq.formula, updatedEq.formula, "Formula changed");
        }

        res.json({ success: true, message: "Equation updated successfully.", equation: equations[index], equations: EquationEngine.loadEquations() });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// DELETE /api/equations/:id - Delete Equation (Administrator ONLY)
router.delete("/:id", isAuthenticated, authorize(["Administrator"]), async (req, res) => {
    try {
        const userId = req.user?.id;
        const email = req.user?.email || "Anonymous";
        const { id } = req.params;
        let equations = EquationEngine.loadEquations() || [];
        
        const oldEq = equations.find(e => e.id === id);
        if (!oldEq) {
            return res.status(404).json({ success: false, error: `Equation with id ${id} not found.` });
        }
        
        const filtered = equations.filter(e => e.id !== id);
        EquationEngine.saveEquations(filtered);

        await auditService.logActivity(userId, email, "Delete Equation", "Equation Editor", `Deleted equation: ${oldEq.name}`);
        await auditService.logModification(userId, `Equation Deleted: ${oldEq.name}`, oldEq.formula, "", "Equation deleted");

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
router.post("/reset", isAuthenticated, authorize(["Administrator"]), async (req, res) => {
    try {
        const userId = req.user?.id;
        const email = req.user?.email || "Anonymous";
        EquationEngine.resetToDefaults();
        const equations = EquationEngine.loadEquations();
        
        await auditService.logActivity(userId, email, "Reset Equation Library", "Equation Editor", "Restored default equations library.");
        
        res.json({ success: true, message: "Restored default equations successfully.", equations });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
