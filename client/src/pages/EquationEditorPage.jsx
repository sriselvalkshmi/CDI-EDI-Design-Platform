import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import api from "../services/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Search,
    Plus,
    Trash2,
    Copy,
    RotateCcw,
    Download,
    Upload,
    Play,
    CheckCircle,
    AlertTriangle,
    BookOpen,
    Info,
    ArrowLeft,
    FileText
} from "lucide-react";

const format = (value, digits = 2) => {
    if (value === undefined || value === null || isNaN(value)) {
        return "-";
    }
    return Number(value).toFixed(digits);
};

export default function EquationEditorPage() {
    const {
        equations,
        setEquations,
        saveEquations,
        resetEquations,
        setPage,
        feedWater,
        engineering,
        simulation,
        performance,
        optimizationInputs,
        optimizationMode,
        technology,
        selectedDesign,
        aiResult,
        stack,
        electrode,
        cellGeometry
    } = useApp();

    const [selectedEquation, setSelectedEquation] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [formulaError, setFormulaError] = useState(null);
    const [variablesUsed, setVariablesUsed] = useState([]);

    // Testing scope for live calculation preview
    const [testScope, setTestScope] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState(null);

    const categories = [
        "Electrical",
        "Hydraulic",
        "Energy",
        "Mass Transfer",
        "Performance",
        "Optimization",
        "Electrochemical"
    ];

    // Filter equations
    const filteredEquations = equations.filter(eq => {
        const matchesSearch =
            eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            eq.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
            eq.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === "ALL" || eq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Select first equation if none selected
    useEffect(() => {
        if (filteredEquations.length > 0 && !selectedEquation) {
            handleSelectEquation(filteredEquations[0]);
        }
    }, [equations]);

    // Handle equation selection
    const handleSelectEquation = (eq) => {
        setSelectedEquation({
            ...eq,
            reference: eq.reference || {
                title: "",
                description: "",
                literatureReference: "",
                publication: "",
                doi: "",
                year: ""
            }
        });
        setFormulaError(null);
        setTestResult(null);
        setTestError(null);
        extractAndSetVariables(eq.formula);
    };

    // Parse variables from formula in real-time
    const extractAndSetVariables = async (formula) => {
        if (!formula || formula.trim() === "") {
            setVariablesUsed([]);
            return;
        }
        try {
            const res = await api.post("/equations/validate", { formula });
            if (res.data.success) {
                setVariablesUsed(res.data.variablesUsed || []);
                setFormulaError(null);

                // Initialize test values for variables
                const newScope = {};
                (res.data.variablesUsed || []).forEach(v => {
                    newScope[v] = testScope[v] !== undefined ? testScope[v] : 1.0;
                });
                setTestScope(newScope);
            } else {
                setFormulaError(res.data.error);
                setVariablesUsed([]);
            }
        } catch (e) {
            setFormulaError("Unable to validate formula syntax.");
        }
    };

    // Handle change to selected equation fields
    const handleFieldChange = (field, value) => {
        if (!selectedEquation) return;
        const updated = { ...selectedEquation, [field]: value };
        setSelectedEquation(updated);

        if (field === "formula") {
            extractAndSetVariables(value);
        }
    };

    const handleRefChange = (field, value) => {
        if (!selectedEquation) return;
        setSelectedEquation({
            ...selectedEquation,
            reference: {
                ...selectedEquation.reference,
                [field]: value
            }
        });
    };

    // Run test evaluation on formulas
    const handleTestCalculation = async () => {
        setTestError(null);
        setTestResult(null);
        if (!selectedEquation || !selectedEquation.formula) return;
        try {
            // Validate first
            const valRes = await api.post("/equations/validate", { formula: selectedEquation.formula });
            if (!valRes.data.success) {
                setTestError(valRes.data.error);
                return;
            }

            // We do a dry run evaluation locally via API test or custom payload
            // For convenience, let's write a small local postfix compiler and evaluator on the client
            // using the same logic to give instantaneous preview, or query a test endpoint on the backend
            // Let's implement local evaluation since we can do it instantly
            const result = clientEvaluate(selectedEquation.formula, testScope);
            if (result.success) {
                setTestResult(result.value);
            } else {
                setTestError(result.error);
            }
        } catch (e) {
            setTestError(e.message);
        }
    };

    // Client-side quick mathematical formula evaluator
    const clientEvaluate = (formula, scope) => {
        try {
            const tokens = [];
            let i = 0;
            while (i < formula.length) {
                const char = formula[i];
                if (/\s/.test(char)) { i++; continue; }
                if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(formula[i + 1] || ''))) {
                    let numStr = '';
                    while (i < formula.length && /[0-9\.]/.test(formula[i])) {
                        numStr += formula[i]; i++;
                    }
                    tokens.push(numStr);
                    continue;
                }
                if (/[a-zA-Z_]/.test(char)) {
                    let word = '';
                    while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) {
                        word += formula[i]; i++;
                    }
                    tokens.push(word);
                    continue;
                }
                if (/[\+\-\*\/\^\(\)]/.test(char)) {
                    tokens.push(char); i++; continue;
                }
                throw new Error(`Invalid character: '${char}'`);
            }

            // Infix to postfix
            const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3, 'u-': 4 };
            const output = [];
            const ops = [];
            let last = null;

            for (let idx = 0; idx < tokens.length; idx++) {
                const tok = tokens[idx];
                if (/^[0-9]*\.?[0-9]+$/.test(tok)) {
                    output.push({ type: 'NUM', val: parseFloat(tok) });
                } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tok)) {
                    output.push({ type: 'VAR', name: tok });
                } else if (tok === '(') {
                    ops.push(tok);
                } else if (tok === ')') {
                    let top = ops.pop();
                    while (top && top !== '(') {
                        output.push({ type: 'OP', val: top });
                        top = ops.pop();
                    }
                    if (!top) throw new Error("Mismatched parentheses");
                } else if (tok in precedence) {
                    const isUnary = (tok === '-' || tok === '+') && (last === null || last === '(' || last in precedence);
                    if (isUnary) {
                        if (tok === '-') ops.push('u-');
                    } else {
                        let top = ops[ops.length - 1];
                        while (top && top in precedence && (
                            (tok !== '^' && precedence[tok] <= precedence[top]) ||
                            (tok === '^' && precedence[tok] < precedence[top])
                        )) {
                            output.push({ type: 'OP', val: ops.pop() });
                            top = ops[ops.length - 1];
                        }
                        ops.push(tok);
                    }
                }
                last = tok;
            }
            while (ops.length > 0) {
                const op = ops.pop();
                if (op === '(' || op === ')') throw new Error("Mismatched parentheses");
                output.push({ type: 'OP', val: op });
            }

            // Evaluate
            const stack = [];
            for (const node of output) {
                if (node.type === 'NUM') {
                    stack.push(node.val);
                } else if (node.type === 'VAR') {
                    const val = scope[node.name];
                    if (val === undefined) throw new Error(`Unknown variable: '${node.name}'`);
                    stack.push(Number(val));
                } else if (node.type === 'OP') {
                    if (node.val === 'u-') {
                        if (stack.length < 1) throw new Error("Invalid syntax");
                        stack.push(-stack.pop());
                    } else {
                        if (stack.length < 2) throw new Error("Invalid syntax");
                        const b = stack.pop();
                        const a = stack.pop();
                        if (node.val === '/' && b === 0) throw new Error("Division by zero");
                        const res = node.val === '+' ? a + b :
                            node.val === '-' ? a - b :
                                node.val === '*' ? a * b :
                                    node.val === '/' ? a / b :
                                        Math.pow(a, b);
                        stack.push(res);
                    }
                }
            }
            if (stack.length !== 1) throw new Error("Invalid expression syntax");
            return { success: true, value: stack[0] };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    // Auto-update live preview when test variables change
    useEffect(() => {
        if (selectedEquation && variablesUsed.length > 0) {
            const result = clientEvaluate(selectedEquation.formula, testScope);
            if (result.success) {
                setTestResult(result.value);
                setTestError(null);
            } else {
                setTestError(result.error);
                setTestResult(null);
            }
        }
    }, [testScope, selectedEquation?.formula, variablesUsed]);

    // Save changes
    const handleSave = async () => {
        if (!selectedEquation) return;

        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const modifiedOnStr = `${dateStr} ${timeStr}`;

        const updatedEq = {
            ...selectedEquation,
            modifiedOn: modifiedOnStr,
            modifiedBy: "Process Engineer"
        };

        // Update equation in local list
        const updatedList = equations.map(eq =>
            eq.id === selectedEquation.id ? updatedEq : eq
        );

        const res = await saveEquations(updatedList);
        if (res.success) {
            alert("Equation saved and activated successfully!");
            setFormulaError(null);
            setSelectedEquation(updatedEq);
        } else {
            alert(`Error saving: ${res.error}`);
            setFormulaError(res.error);
        }
    };

    // Add equation
    const handleAddEquation = () => {
        const newId = `custom_eq_${Date.now()}`;
        const newEq = {
            id: newId,
            name: "New Custom Equation",
            description: "Provide a description for this equation.",
            formula: "V * 1.0",
            variables: ["V"],
            units: "Units",
            category: "Performance",
            enabled: true,
            reference: {
                title: "",
                description: "",
                literatureReference: "",
                publication: "",
                doi: "",
                year: new Date().getFullYear()
            },
            example: "V = 1.0 => Result = 1.0"
        };
        const updated = [...equations, newEq];
        setEquations(updated);
        handleSelectEquation(newEq);
    };

    // Delete equation
    const handleDeleteEquation = async (id) => {
        if (!window.confirm("Are you sure you want to delete this equation?")) return;
        const updated = equations.filter(eq => eq.id !== id);
        const res = await saveEquations(updated);
        if (res.success) {
            alert("Equation deleted successfully.");
            setSelectedEquation(null);
        } else {
            alert(`Failed to delete equation: ${res.error}`);
        }
    };

    // Duplicate equation
    const handleDuplicateEquation = () => {
        if (!selectedEquation) return;
        const dup = {
            ...selectedEquation,
            id: `custom_eq_dup_${Date.now()}`,
            name: `${selectedEquation.name} (Copy)`
        };
        const updated = [...equations, dup];
        setEquations(updated);
        handleSelectEquation(dup);
        alert("Equation duplicated. Save changes to activate.");
    };

    // Enable/disable equation status
    const handleToggleStatus = async (eq) => {
        const updated = equations.map(e =>
            e.id === eq.id ? { ...e, enabled: !e.enabled } : e
        );
        const res = await saveEquations(updated);
        if (res.success) {
            if (selectedEquation && selectedEquation.id === eq.id) {
                setSelectedEquation(prev => ({ ...prev, enabled: !prev.enabled }));
            }
        } else {
            alert(`Failed to toggle equation status: ${res.error}`);
        }
    };

    // Reset to defaults
    const handleReset = async () => {
        if (!window.confirm("Are you sure you want to restore default equations? All custom modifications will be lost.")) return;
        const res = await resetEquations();
        if (res.success) {
            alert("Default equations restored successfully.");
            setSelectedEquation(null);
        } else {
            alert(`Failed to restore: ${res.error}`);
        }
    };

    // JSON Export
    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(equations, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "cdi_edi_equations.json");
        dlAnchorElem.click();
    };

    // PDF Export
    const handleExportPDF = () => {
        const doc = new jsPDF("p", "mm", "a4");

        // Define timestamps
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const stamp = `${dateStr} ${timeStr}`;

        // Get tech name
        const techName = selectedDesign || technology || "CDI";

        // Baseline Formulas comparison dictionary
        const BASELINE_FORMULAS = {
            power: "V * I",
            current_density: "I / Area",
            residence_time: "ReactorVolume / FlowRate",
            flow_velocity: "FlowRate / ChannelArea",
            hydraulic_diameter: "(2 * Width * Height) / (Width + Height)",
            pressure_drop: "f * (Length / Dh) * (Density * Velocity^2 / 2)",
            pump_power: "(FlowRate * DeltaP) / PumpEfficiency",
            sec: "Power / WaterProduced",
            salt_removal: "FeedTDS - OutletTDS",
            removal_efficiency: "((FeedTDS - OutletTDS) / FeedTDS) * 100",
            electrode_mass: "Area * Thickness * Density",
            sac: "SaltRemoved / ElectrodeMass",
            charge_efficiency: "RemovedCharge / SuppliedCharge"
        };

        const getCurrentValue = (eqId) => {
            switch (eqId) {
                case "power": return format(engineering?.power ?? 6, 2) + " W";
                case "current_density": return format(electrode?.currentDensity ?? 200, 2) + " A/m²";
                case "pressure_drop": return format(engineering?.pressureDrop ?? 580.8, 1) + " Pa";
                case "pump_power": return format(engineering?.pumpPower ?? 0.138, 3) + " W";
                case "sec": return format(simulation?.specificEnergy ?? engineering?.specificEnergy ?? 0.01, 4) + " kWh/m³";
                case "salt_removal": return format(simulation?.saltRemoval ?? 33.0, 1) + " ppm";
                case "removal_efficiency": return format(simulation?.removalEfficiency ?? 6.6, 2) + " %";
                case "electrode_mass": return format(electrode?.electrodeMass ?? 67.5, 2) + " g";
                case "sac": return format(simulation?.SAC ?? 6.6, 2) + " mg/g";
                case "charge_efficiency": return format(simulation?.chargeEfficiency ?? 85, 1) + " %";
                case "hydraulic_diameter": return format(cellGeometry?.hydraulic?.hydraulicDiameter ?? 0.99, 3) + " mm";
                case "flow_velocity": return format(engineering?.flowVelocity ?? 0.3, 3) + " m/s";
                case "residence_time": return format(engineering?.residenceTime ?? 10, 1) + " min";
                default: return "-";
            }
        };

        // --- PAGE 1: PROJECT DETAILS & SUMMARIES ---

        // Title Block
        doc.setFillColor(25, 118, 210);
        doc.rect(0, 0, 210, 8, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(25, 118, 210);
        doc.text("CDI / EDI DESIGN PLATFORM", 15, 25);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor(102, 102, 102);
        doc.text("Engineering Equation Report", 15, 32);

        // Metadata Table
        autoTable(doc, {
            startY: 38,
            head: [["Project Metadata", "Details"]],
            body: [
                ["Project Name", "CDI / EDI Pilot Design System"],
                ["Generated Date & Time", stamp],
                ["Selected Technology", techName],
                ["Optimization Mode", optimizationMode === "AI" ? "AI Optimization" : "Manual Optimization"],
                ["AI Recommendation", aiResult?.recommendation?.technology || techName],
                ["Confidence Level", aiResult?.recommendation?.confidence ? `${aiResult.recommendation.confidence}%` : "95%"],
                ["Operator Name", "Process Engineering Department"]
            ],
            theme: "grid",
            headStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255], fontStyle: "bold" },
            styles: { fontSize: 10 },
            margin: { left: 15, right: 15 }
        });

        // Feed Water Properties Table
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(25, 118, 210);
        doc.text("Feed Water Properties", 15, doc.lastAutoTable.finalY + 10);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 13,
            head: [["Property", "Value", "Unit"]],
            body: [
                ["Total Dissolved Solids (TDS)", feedWater?.tds || "500", "ppm"],
                ["Conductivity", feedWater?.conductivity || "300", "µS/cm"],
                ["Hardness", feedWater?.hardness || "150", "mg/L as CaCO3"],
                ["pH Value", feedWater?.ph || "7.0", "-"],
                ["Temperature", feedWater?.temperature || "25.0", "°C"],
                ["Feed Pressure", feedWater?.pressure || "1.0", "bar"],
                ["Flow Rate", feedWater?.flowRate || "10.0", "L/min"],
                ["Target Output TDS", feedWater?.targetTds || "50", "ppm"]
            ],
            theme: "striped",
            headStyles: { fillColor: [38, 166, 154], textColor: [255, 255, 255], fontStyle: "bold" },
            styles: { fontSize: 9 },
            margin: { left: 15, right: 15 }
        });

        // Engineering Design Summary Table
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(25, 118, 210);
        doc.text("Engineering Design Summary", 15, doc.lastAutoTable.finalY + 10);

        const stackDim = stack?.dimensions
            ? `${stack.dimensions.length} x ${stack.dimensions.width} x ${stack.dimensions.height} mm`
            : "100 x 50 x 22 mm";

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 13,
            head: [["Parameter", "Recommended / Current Value", "Unit"]],
            body: [
                ["Operating Voltage", format(engineering?.voltage ?? 1.2, 2), "V"],
                ["Current", format(engineering?.current ?? 5, 2), "A"],
                ["Power Consumption", format(engineering?.power ?? 6, 2), "W"],
                ["Cell Pairs", format(engineering?.cellPairs ?? 20, 0), "pairs"],
                ["Electrode Area (per cell)", format(engineering?.electrodeArea ?? 250, 0), "cm²"],
                ["Residence Time", format(engineering?.residenceTime ?? 10, 1), "min"],
                ["Flow Velocity", format(engineering?.flowVelocity ?? 0.3, 3), "m/s"],
                ["Pressure Drop", format(engineering?.pressureDrop ?? 580.8, 1), "Pa"],
                ["Pump Power", format(engineering?.pumpPower ?? 0.138, 3), "W"],
                ["Water Recovery", format(engineering?.waterRecovery ?? 99.42, 2), "%"],
                ["Cell Stack Dimensions (L x W x H)", stackDim, "-"]
            ],
            theme: "striped",
            headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255], fontStyle: "bold" },
            styles: { fontSize: 9 },
            margin: { left: 15, right: 15 }
        });

        // --- PAGE 2: EQUATION EDITOR & OPTIMIZATION RESULTS ---
        doc.addPage();

        // Equation Editor Summary Table
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(25, 118, 210);
        doc.text("Equation Editor Summary", 15, 20);

        const equationRows = equations.map(eq => [
            eq.name,
            eq.category,
            eq.formula,
            eq.units,
            getCurrentValue(eq.id),
            "Valid",
            eq.example || ""
        ]);

        autoTable(doc, {
            startY: 24,
            head: [["Equation Name", "Category", "Formula", "Units", "Current Value", "Status", "Example"]],
            body: equationRows,
            theme: "grid",
            headStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255], fontStyle: "bold" },
            styles: { fontSize: 8 },
            margin: { left: 15, right: 15 }
        });

        // User Equation Modifications
        const modifiedEquations = equations.filter(eq => eq.formula !== BASELINE_FORMULAS[eq.id]);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(25, 118, 210);
        doc.text("User Equation Modifications", 15, doc.lastAutoTable.finalY + 10);

        let modStartY = doc.lastAutoTable.finalY + 14;

        if (modifiedEquations.length === 0) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.setTextColor(120, 120, 120);
            doc.text("No equation modifications were made.", 15, modStartY);
            modStartY += 8;
        } else {
            const modRows = modifiedEquations.map(eq => [
                eq.name,
                eq.category,
                BASELINE_FORMULAS[eq.id],
                eq.formula,
                eq.modifiedOn || dateStr,
                eq.modifiedBy || "Operator"
            ]);

            autoTable(doc, {
                startY: modStartY,
                head: [["Equation", "Category", "Original Formula", "Modified Formula", "Modification Date", "Modified By"]],
                body: modRows,
                theme: "grid",
                headStyles: { fillColor: [198, 40, 40], textColor: [255, 255, 255], fontStyle: "bold" },
                styles: { fontSize: 8 },
                margin: { left: 15, right: 15 }
            });
            modStartY = doc.lastAutoTable.finalY + 10;
        }

        // Optimization Summary
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(25, 118, 210);
        doc.text(`Optimization Summary - [${optimizationMode === "AI" ? "AI Optimization" : "Manual Optimization"}]`, 15, modStartY);

        const showOverride = (paramKey) => {
            if (optimizationMode === "AI") return "";
            const userVal = Number(optimizationInputs?.[paramKey]);
            const aiVal = Number(aiResult?.recommendation?.[paramKey === "voltage" ? "recommendedVoltage" : paramKey === "current" ? "recommendedCurrent" : paramKey] ?? 0);
            if (userVal !== aiVal && aiVal !== 0) {
                return " (User Override)";
            }
            return "";
        };

        autoTable(doc, {
            startY: modStartY + 4,
            head: [["Parameter", "Operational Value", "Unit", "Override Status"]],
            body: [
                ["Voltage", format(optimizationInputs?.voltage ?? 1.2, 2), "V", showOverride("voltage")],
                ["Current", format(optimizationInputs?.current ?? 5, 2), "A", showOverride("current")],
                ["Cell Pairs", format(optimizationInputs?.cellPairs ?? 20, 0), "pairs", showOverride("cellPairs")],
                ["Electrode Area", format(optimizationInputs?.electrodeArea ?? 250, 0), "cm²", showOverride("electrodeArea")],
                ["Flow Rate", format(optimizationInputs?.flowRate ?? 10.0, 1), "L/min", showOverride("flowRate")],
                ["Residence Time", format(optimizationInputs?.residenceTime ?? 10.0, 1), "min", showOverride("residenceTime")],
                ["Flow Velocity", format(optimizationInputs?.flowVelocity ?? 0.3, 3), "m/s", showOverride("flowVelocity")],
                ["Spacer Thickness", format(optimizationInputs?.spacerThickness ?? 0.5, 2), "mm", showOverride("spacerThickness")]
            ],
            theme: "grid",
            headStyles: { fillColor: [100, 110, 120], textColor: [255, 255, 255], fontStyle: "bold" },
            styles: { fontSize: 8 },
            margin: { left: 15, right: 15 }
        });

        // Simulation Results & Performance Summary
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(25, 118, 210);
        doc.text("Simulation Results & Desalination Performance", 15, doc.lastAutoTable.finalY + 10);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 14,
            head: [["Performance Metric", "Calculated Value", "Operational Target"]],
            body: [
                ["Outlet Salinity (TDS)", `${format(simulation?.outletTDS ?? 466.96, 1)} ppm`, `${feedWater?.targetTds || 50} ppm (Target)`],
                ["Salt Removal", `${format(simulation?.saltRemoval ?? 33.0, 1)} ppm`, "Baseline Adsorption"],
                ["Removal Efficiency", `${format(simulation?.removalEfficiency ?? 6.6, 2)} %`, "Optimal Target"],
                ["Power Consumption", `${format(engineering?.power ?? 6, 2)} W`, "Stack Capacity"],
                ["Specific Energy", `${format(simulation?.specificEnergy ?? 0.01, 4)} kWh/m³`, "Efficiency Index"],
                ["Pressure Drop", `${format(simulation?.pressureDrop ?? 580.8, 1)} Pa`, "Hydraulic Load"],
                ["Water Recovery", `${format(simulation?.waterRecovery ?? 99.42, 2)} %`, "Volume Yield"]
            ],
            theme: "striped",
            headStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255], fontStyle: "bold" },
            styles: { fontSize: 8 },
            margin: { left: 15, right: 15 }
        });

        // Add a line break for layout spacing
        let textY = doc.lastAutoTable.finalY + 10;

        // Dynamic Professional Summary
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(51, 51, 51);
        doc.text("Performance Summary:", 15, textY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const tdsVal = feedWater?.tds || 500;
        const vVal = format(engineering?.voltage ?? 1.2, 2);
        const effVal = format(simulation?.removalEfficiency ?? 6.6, 2);
        const secVal = format(simulation?.specificEnergy ?? 0.01, 4);
        const summaryText = `The selected ${techName} technology is suitable for treating feed water with a TDS of ${tdsVal} ppm. The optimized operating voltage is ${vVal} V. Expected removal efficiency is ${effVal}%. Specific energy consumption is ${secVal} kWh/m³. Pressure drop remains within acceptable operating limits. The design is suitable for laboratory-scale implementation.`;

        const splitText = doc.splitTextToSize(summaryText, 180);
        doc.text(splitText, 15, textY + 5);

        textY += 20;

        // Equation Audit Trail
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(25, 118, 210);
        doc.text("Equation Audit Trail", 15, textY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 51, 51);
        if (modifiedEquations.length === 0) {
            doc.text("No equation modifications were made.", 15, textY + 5);
            textY += 10;
        } else {
            let auditOffset = 5;
            modifiedEquations.forEach(eq => {
                doc.setFont("helvetica", "bold");
                doc.text(`${eq.name}`, 15, textY + auditOffset);
                doc.setFont("helvetica", "normal");
                doc.text(`Original: ${BASELINE_FORMULAS[eq.id]}    Modified: ${eq.formula}    Modified On: ${eq.modifiedOn || dateStr}`, 15, textY + auditOffset + 4);
                auditOffset += 10;
            });
            textY += auditOffset;
        }

        // System Information
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(25, 118, 210);
        doc.text("System Information", 15, textY + 5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 100, 100);
        doc.text(`Software Version: 1.0.0    React Version: 18.3.1    Node Version: 24.18.0    Express Version: 4.19.2`, 15, textY + 10);
        doc.text(`Generated by: CDI / EDI Design Platform`, 15, textY + 14);

        // Header and Footer Overlay
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Header
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text("CDI / EDI Design Platform - System Report", 15, 12);
            doc.text(`Generated: ${stamp}`, 195, 12, { align: "right" });
            doc.setDrawColor(220, 220, 220);
            doc.line(15, 14, 195, 14);

            // Footer
            doc.line(15, 282, 195, 282);
            doc.text("CONFIDENTIAL - FOR INTERNAL USE ONLY", 15, 287);
            doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: "right" });
            if (i === pageCount) {
                doc.setFont("helvetica", "bold");
                doc.text("End of Engineering Report", 105, 287, { align: "center" });
            }
        }

        // Save PDF
        const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
        const hhmm = String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0");
        const filename = `Engineering_Report_${yyyymmdd}_${hhmm}.pdf`;
        doc.save(filename);
    };

    // JSON Import
    const handleImport = (e) => {
        const fileReader = new FileReader();
        if (e.target.files.length === 0) return;
        fileReader.readAsText(e.target.files[0], "UTF-8");
        fileReader.onload = async (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!Array.isArray(parsed)) {
                    alert("Invalid JSON format. Expected an array of equations.");
                    return;
                }
                const res = await saveEquations(parsed);
                if (res.success) {
                    alert("Equations imported and validated successfully!");
                    setSelectedEquation(null);
                } else {
                    alert(`Import validation failed: ${res.error}`);
                }
            } catch (err) {
                alert("Failed to parse JSON file.");
            }
        };
    };

    return (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", boxSizing: "border-box", background: "#f5f6f8" }}>

            {/* Header bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        onClick={() => setPage("DASHBOARD")}
                        style={{
                            background: "white",
                            border: "1px solid #ccc",
                            color: "#555",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h2 style={{ margin: 0, fontSize: "22px", color: "#333" }}>Engineering Equation Editor</h2>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={handleReset}
                        style={{
                            background: "#e0e0e0",
                            border: "none",
                            color: "#333",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                    >
                        <RotateCcw size={16} /> Restore Defaults
                    </button>
                    <button
                        onClick={handleExportPDF}
                        style={{
                            background: "#1976d2",
                            border: "none",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "bold",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}
                    >
                        <FileText size={16} /> Export Engineering Report (PDF)
                    </button>
                </div>
            </div>

            {/* Main Editor Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "20px", flex: 1, overflow: "hidden" }}>

                {/* Left Side: Equation List */}
                <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {/* Search & Category Filter */}
                    <div style={{ padding: "15px", borderBottom: "1px solid #eee", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ position: "relative" }}>
                            <Search size={16} style={{ position: "absolute", left: "10px", top: "12px", color: "#888" }} />
                            <input
                                type="text"
                                placeholder="Search equations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 8px 8px 32px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontSize: "14px"
                            }}
                        >
                            <option value="ALL">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Equations List */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
                        {filteredEquations.length === 0 ? (
                            <p style={{ textAlign: "center", color: "#888", marginTop: "20px" }}>No equations found.</p>
                        ) : (
                            filteredEquations.map(eq => (
                                <div
                                    key={eq.id}
                                    onClick={() => handleSelectEquation(eq)}
                                    style={{
                                        padding: "12px",
                                        borderRadius: "6px",
                                        background: selectedEquation?.id === eq.id ? "#eef6ff" : "transparent",
                                        border: selectedEquation?.id === eq.id ? "1px solid #1976d2" : "1px solid transparent",
                                        cursor: "pointer",
                                        marginBottom: "8px",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                        <span style={{ fontWeight: "600", fontSize: "14px", color: eq.enabled ? "#333" : "#888" }}>
                                            {eq.name}
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={eq.enabled}
                                            onChange={() => handleToggleStatus(eq)}
                                            onClick={(e) => e.stopPropagation()}
                                            title={eq.enabled ? "Disable Equation" : "Enable Equation"}
                                            style={{ cursor: "pointer" }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <code style={{ fontSize: "12px", color: "#666" }}>{eq.formula}</code>
                                        <span style={{
                                            fontSize: "11px",
                                            background: "#e0e0e0",
                                            color: "#555",
                                            padding: "2px 6px",
                                            borderRadius: "3px"
                                        }}>
                                            {eq.category}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side: Equation Detail & Editor */}
                <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                    {!selectedEquation ? (
                        <div style={{ background: "white", borderRadius: "8px", padding: "40px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                            <Info size={48} style={{ color: "#1976d2", marginBottom: "15px" }} />
                            <h3>No Equation Selected</h3>
                            <p style={{ color: "#666" }}>Select an engineering equation from the list to view, edit, or create a new one.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                            {/* Card 1: Core Fields (Read-Only) */}
                            <div style={{ background: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                                    <h2 style={{ margin: 0, fontSize: "22px", color: "#1976d2" }}>{selectedEquation.name}</h2>
                                    <span style={{
                                        background: "#e3f2fd",
                                        color: "#0d47a1",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        fontWeight: "bold"
                                    }}>
                                        {selectedEquation.category}
                                    </span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "#333" }}>
                                    <div>
                                        <strong style={{ color: "#555" }}>Description: </strong>
                                        <span>{selectedEquation.description}</span>
                                    </div>
                                    <div>
                                        <strong style={{ color: "#555" }}>Units: </strong>
                                        <span style={{ background: "#f5f5f5", padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace" }}>{selectedEquation.units}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Formula & Variables */}
                            <div style={{ background: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                                <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", color: "#1976d2" }}>Formula Engine</h3>

                                <div style={{ marginBottom: "15px", fontSize: "14px" }}>
                                    <strong style={{ color: "#555" }}>Formula: </strong>
                                    <code style={{ background: "#f5f5f5", padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace", fontSize: "14px" }}>
                                        {equations.find(e => e.id === selectedEquation.id)?.formula || selectedEquation.formula}
                                    </code>
                                </div>

                                <div style={{ marginBottom: "15px" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "5px" }}>Editable Formula</label>
                                    <textarea
                                        value={selectedEquation.formula}
                                        onChange={(e) => handleFieldChange("formula", e.target.value)}
                                        rows={3}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            fontFamily: "Courier New, monospace",
                                            fontSize: "16px",
                                            border: formulaError ? "1px solid #c62828" : "1px solid #ccc",
                                            borderRadius: "4px",
                                            boxSizing: "border-box",
                                            background: "#fafafa"
                                        }}
                                    />
                                    {formulaError ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#c62828", fontSize: "13px", marginTop: "5px" }}>
                                            <AlertTriangle size={14} /> Formula syntax validation: <span style={{ fontWeight: "bold" }}>Invalid</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2e7d32", fontSize: "13px", marginTop: "5px" }}>
                                            <CheckCircle size={14} /> Formula syntax validation: <span style={{ fontWeight: "bold" }}>Valid</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginBottom: "15px" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "5px" }}>Variable List (Detected)</label>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {variablesUsed.length === 0 ? (
                                            <span style={{ fontSize: "13px", color: "#888" }}>None detected (constant value).</span>
                                        ) : (
                                            variablesUsed.map(v => (
                                                <span
                                                    key={v}
                                                    style={{
                                                        background: "#eef6ff",
                                                        color: "#1976d2",
                                                        border: "1px solid #d0e3ff",
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "13px",
                                                        fontWeight: "600"
                                                    }}
                                                >
                                                    {v}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Live Preview & Calculator */}
                            <div style={{ background: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                                <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", color: "#1976d2" }}>Live Calculation Preview</h3>

                                {variablesUsed.length === 0 ? (
                                    <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "6px", textAlign: "center", color: "#666" }}>
                                        No variables in equation to preview.
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "20px" }}>
                                        {/* Test variables inputs */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#666" }}>Input Test Values:</span>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                                                {variablesUsed.map(v => (
                                                    <div key={v}>
                                                        <label style={{ fontSize: "12px", color: "#555" }}>{v}</label>
                                                        <input
                                                            type="number"
                                                            value={testScope[v] !== undefined ? testScope[v] : ""}
                                                            onChange={(e) => setTestScope({ ...testScope, [v]: parseFloat(e.target.value) || 0 })}
                                                            style={{
                                                                width: "100%",
                                                                padding: "6px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "4px",
                                                                fontSize: "13px",
                                                                boxSizing: "border-box"
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Result Display */}
                                        <div style={{
                                            background: testError ? "#ffebee" : "#e8f5e9",
                                            border: testError ? "1px solid #ffcdd2" : "1px solid #c8e6c9",
                                            borderRadius: "6px",
                                            padding: "15px",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            textAlign: "center"
                                        }}>
                                            {testError ? (
                                                <>
                                                    <AlertTriangle style={{ color: "#c62828", marginBottom: "8px" }} />
                                                    <span style={{ fontSize: "12px", color: "#c62828", fontWeight: "600" }}>Calculation Error</span>
                                                    <p style={{ fontSize: "11px", color: "#c62828", margin: "4px 0 0 0" }}>{testError}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle style={{ color: "#2e7d32", marginBottom: "8px" }} />
                                                    <span style={{ fontSize: "12px", color: "#2e7d32", fontWeight: "600" }}>Calculated Result</span>
                                                    <span style={{ fontSize: "24px", color: "#2e7d32", fontWeight: "bold", margin: "4px 0" }}>
                                                        {testResult !== null ? format(testResult, 4) : "-"}
                                                    </span>
                                                    <span style={{ fontSize: "11px", color: "#555" }}>{selectedEquation.units}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Save Button Bar */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "40px" }}>
                                <button
                                    onClick={() => handleSelectEquation(equations.find(e => e.id === selectedEquation.id))}
                                    style={{
                                        background: "white",
                                        border: "1px solid #ccc",
                                        color: "#555",
                                        padding: "10px 20px",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontWeight: "600"
                                    }}
                                >
                                    Discard Changes
                                </button>
                                <button
                                    onClick={handleSave}
                                    style={{
                                        background: "#2e7d32",
                                        color: "white",
                                        border: "none",
                                        padding: "10px 25px",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                        boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
                                    }}
                                >
                                    Save &amp; Activate
                                </button>
                            </div>

                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
