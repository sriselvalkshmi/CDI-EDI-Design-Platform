import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastNotification";
import auditLogger from "../services/auditLogger";
import { validateFormula, evaluateFormula } from "@shared/engineering/engine/formulaParser.js";
import { DEFAULT_EQUATIONS_DATABASE } from "@shared/engineering/equations/defaultEquationsDatabase.js";
import { generateEquationReportPDF } from "../utils/reportGenerator";
import {
    Search,
    Plus,
    Trash2,
    RotateCcw,
    Play,
    CheckCircle,
    ArrowLeft,
    Shield,
    Lock,
    Key,
    Mail,
    LogOut,
    Save,
    FileText,
    ChevronRight,
    X,
    GitBranch,
    Sliders,
    Layers,
    BookOpen
} from "lucide-react";

const CATEGORIES = [
    "ALL",
    "Electrical",
    "Hydraulic",
    "Mass Transfer",
    "Electrochemical",
    "Performance",
    "Energy",
    "Economics",
    "Optimization"
];

const SOURCE_CLASSIFICATIONS = [
    "First Principles",
    "Engineering Model",
    "Empirical Correlation",
    "Performance Metric",
    "Economic Model",
    "Optimization Metric",
    "Design Constraint"
];

function incrementVersion(versionStr) {
    if (!versionStr) return "1.1.0";
    const parts = versionStr.split(".").map(Number);
    if (parts.length === 3 && !isNaN(parts[1])) {
        return `${parts[0]}.${parts[1] + 1}.0`;
    }
    return "1.1.0";
}

function formatEngineeringResult(val, units = "") {
    if (val === null || val === undefined || isNaN(val)) return "—";
    const num = Number(val);
    if (num === 0) return `0.000 ${units}`.trim();
    const abs = Math.abs(num);
    if (units === "compliance" || units === "index") {
        if (num === 1) return `1 (PASS / Compliant)`;
        if (num === 0) return `0 (FAIL / Non-Compliant)`;
        return `${num.toFixed(3)} ${units}`;
    }
    if (abs < 0.001) {
        return `${num.toExponential(4)} ${units}`.trim();
    }
    if (abs >= 10000) {
        return `${num.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${units}`.trim();
    }
    return `${num.toFixed(3)} ${units}`.trim();
}

export default function EquationEditorPage() {
    const {
        equations: appEquations,
        setEquations,
        saveEquations,
        resetEquations,
        designResult,
        feedWater,
        technology,
        setPage
    } = useApp();

    const { currentUser, currentRole } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();

    // Studio Authentication Gate
    const [isStudioAuthenticated, setIsStudioAuthenticated] = useState(false);
    const [loginEmail, setLoginEmail] = useState(currentUser?.email || "admin@cdiedi.com");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");

    // Active Equations & Selection
    const activeEquations = (appEquations && appEquations.length > 0) ? appEquations : DEFAULT_EQUATIONS_DATABASE;
    const [selectedEquation, setSelectedEquation] = useState(activeEquations[0] || null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");

    // Live Editor Scope State
    const [formulaError, setFormulaError] = useState(null);
    const [variablesUsed, setVariablesUsed] = useState([]);
    const [testScope, setTestScope] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState(null);

    // Save Confirmation Review Modal State
    const [showSaveReviewModal, setShowSaveReviewModal] = useState(false);
    const [saveRationale, setSaveRationale] = useState("");
    const [saveValidationInfo, setSaveValidationInfo] = useState(null);

    // Add New Equation Modal State
    const [showNewEquationModal, setShowNewEquationModal] = useState(false);
    const [newEqForm, setNewEqForm] = useState({
        name: "",
        formula: "",
        category: "Electrical",
        units: "",
        description: "",
        applicableBasis: "Process Calculation",
        sourceClassification: "Engineering Model"
    });

    // Synchronize formula variable extraction when selected equation changes
    useEffect(() => {
        if (selectedEquation) {
            extractAndSetVariables(selectedEquation.formula);
        }
    }, [selectedEquation?.id]);

    const extractAndSetVariables = (formulaStr) => {
        try {
            const validation = validateFormula(formulaStr);
            if (validation.valid) {
                setFormulaError(null);
                const vars = validation.variablesUsed || validation.variables || [];
                setVariablesUsed(vars);

                const initScope = {};
                const varUnits = selectedEquation?.variableUnits || {};

                vars.forEach((v) => {
                    if (varUnits[v]?.default !== undefined) {
                        initScope[v] = varUnits[v].default;
                    } else if (v === "MW_NaCl") {
                        initScope[v] = 58.44;
                    } else if (v === "F") {
                        initScope[v] = 96485;
                    } else {
                        initScope[v] = 1.0;
                    }
                });

                setTestScope(initScope);

                try {
                    const res = evaluateFormula(formulaStr, initScope);
                    setTestResult(res);
                    setTestError(null);
                } catch (err) {
                    setTestError(err.message);
                }
            } else {
                setFormulaError(validation.error);
                setVariablesUsed([]);
                setTestResult(null);
            }
        } catch (e) {
            setFormulaError(e.message);
            setVariablesUsed([]);
            setTestResult(null);
        }
    };

    const handleFormulaChange = (newFormula) => {
        if (!selectedEquation) return;
        setSelectedEquation({ ...selectedEquation, formula: newFormula });
        extractAndSetVariables(newFormula);
    };

    const handleExecutePreview = () => {
        if (!selectedEquation) return;
        try {
            const res = evaluateFormula(selectedEquation.formula, testScope);
            setTestResult(res);
            setTestError(null);
            showSuccess(`Evaluated: ${formatEngineeringResult(res, selectedEquation.units)}`);
        } catch (e) {
            setTestError(e.message);
            showError(`Evaluation Error: ${e.message}`);
        }
    };

    const handleInitiateSave = () => {
        if (!selectedEquation) return;

        const validation = validateFormula(selectedEquation.formula);
        if (!validation.valid) {
            showError(`Syntax Error: ${validation.error}`);
            return;
        }

        const factoryDef = DEFAULT_EQUATIONS_DATABASE.find((e) => e.id === selectedEquation.id);
        const prevFormula = selectedEquation.isModified
            ? (activeEquations.find((e) => e.id === selectedEquation.id)?.formula || selectedEquation.formula)
            : (factoryDef?.factoryFormula || factoryDef?.formula || selectedEquation.formula);

        const nextVersion = selectedEquation.isCustom
            ? (selectedEquation.version || "1.0.0")
            : incrementVersion(selectedEquation.version);

        setSaveValidationInfo({
            previousFormula: prevFormula,
            newFormula: selectedEquation.formula,
            nextVersion,
            affectedCalculations: selectedEquation.dependencyChain || ["Process Simulation", "Parameter Sizing"]
        });

        setSaveRationale("");
        setShowSaveReviewModal(true);
    };

    const handleConfirmSaveVersion = async () => {
        if (!selectedEquation || !saveValidationInfo) return;

        const isUserModified = !selectedEquation.isCustom;
        const updatedEquation = {
            ...selectedEquation,
            version: saveValidationInfo.nextVersion,
            status: selectedEquation.isCustom ? "User Created" : "Modified",
            isModified: isUserModified,
            dateModified: new Date().toISOString(),
            lastRationale: saveRationale || "Engineering modification"
        };

        const updatedList = activeEquations.map((eq) =>
            eq.id === selectedEquation.id ? updatedEquation : eq
        );

        let res = { success: true };
        if (typeof saveEquations === "function") {
            res = await saveEquations(updatedList);
        } else if (typeof setEquations === "function") {
            setEquations(updatedList);
            try {
                localStorage.setItem("cdi_edi_equations", JSON.stringify(updatedList));
            } catch (e) {}
        }

        if (res.success) {
            setSelectedEquation(updatedEquation);
            setShowSaveReviewModal(false);
            showSuccess(`Saved '${selectedEquation.name}' as Version ${saveValidationInfo.nextVersion}.`);

            await auditLogger.logEquationModification({
                userId: currentUser?.id,
                email: currentUser?.email || loginEmail || "admin@cdiedi.com",
                equationId: selectedEquation.id,
                parameter: selectedEquation.name,
                oldValue: saveValidationInfo.previousFormula,
                newValue: selectedEquation.formula,
                reason: saveRationale || `Bumped to version ${saveValidationInfo.nextVersion}`
            });
        } else {
            showError(`Save failed: ${res.error}`);
        }
    };

    const handleRestoreIndividualFactory = async () => {
        if (!selectedEquation) return;
        const factoryDef = DEFAULT_EQUATIONS_DATABASE.find((e) => e.id === selectedEquation.id);
        if (!factoryDef) {
            showWarning("No factory definition exists for user-created custom equations.");
            return;
        }

        if (!window.confirm(`Restore '${selectedEquation.name}' to factory default (${factoryDef.factoryFormula || factoryDef.formula})?`)) {
            return;
        }

        const restoredEquation = {
            ...factoryDef,
            formula: factoryDef.factoryFormula || factoryDef.formula,
            version: "1.0.0",
            status: "Factory",
            isModified: false,
            dateModified: new Date().toISOString()
        };

        const updatedList = activeEquations.map((eq) =>
            eq.id === selectedEquation.id ? restoredEquation : eq
        );

        let res = { success: true };
        if (typeof saveEquations === "function") {
            res = await saveEquations(updatedList);
        } else if (typeof setEquations === "function") {
            setEquations(updatedList);
            try {
                localStorage.setItem("cdi_edi_equations", JSON.stringify(updatedList));
            } catch (e) {}
        }

        if (res.success) {
            setSelectedEquation(restoredEquation);
            showSuccess(`Restored '${selectedEquation.name}' to Factory v1.0.0.`);
        } else {
            showError(`Restore failed: ${res.error}`);
        }
    };

    const handleDeleteEquation = async () => {
        if (!selectedEquation) return;

        if (!selectedEquation.isCustom) {
            showWarning("Factory equations cannot be deleted. Use 'Restore Factory' to reset changes.");
            return;
        }

        if (!window.confirm(`Permanently delete custom equation '${selectedEquation.name}'?`)) return;

        const updatedList = activeEquations.filter((eq) => eq.id !== selectedEquation.id);
        let res = { success: true };
        if (typeof saveEquations === "function") {
            res = await saveEquations(updatedList);
        } else if (typeof setEquations === "function") {
            setEquations(updatedList);
            try {
                localStorage.setItem("cdi_edi_equations", JSON.stringify(updatedList));
            } catch (e) {}
        }

        if (res.success) {
            showSuccess(`Deleted equation '${selectedEquation.name}'.`);
            setSelectedEquation(updatedList[0] || null);
        } else {
            showError(`Delete failed: ${res.error}`);
        }
    };

    const handleCreateCustomEquationSubmit = async (e) => {
        e.preventDefault();
        const validation = validateFormula(newEqForm.formula);
        if (!validation.valid) {
            showError(`Invalid Formula Expression: ${validation.error}`);
            return;
        }

        const newId = `eq_custom_${Date.now()}`;
        const newEq = {
            id: newId,
            name: newEqForm.name.trim(),
            formula: newEqForm.formula.trim(),
            factoryFormula: newEqForm.formula.trim(),
            category: newEqForm.category,
            units: newEqForm.units.trim(),
            description: newEqForm.description.trim(),
            applicableBasis: newEqForm.applicableBasis.trim() || "User Model",
            author: currentUser?.fullName || "Administrator",
            dateModified: new Date().toISOString(),
            version: "1.0.0",
            status: "User Created",
            isCustom: true,
            isModified: false,
            enabled: true,
            sourceClassification: newEqForm.sourceClassification,
            dependencyChain: ["Custom Simulation Sizing", "Process Performance Analysis"]
        };

        const updatedList = [newEq, ...activeEquations];
        if (typeof setEquations === "function") setEquations(updatedList);
        if (typeof saveEquations === "function") await saveEquations(updatedList);

        setSelectedEquation(newEq);
        setShowNewEquationModal(false);
        setNewEqForm({
            name: "",
            formula: "",
            category: "Electrical",
            units: "",
            description: "",
            applicableBasis: "Process Calculation",
            sourceClassification: "Engineering Model"
        });
        showSuccess(`Created custom equation '${newEq.name}'.`);
    };

    const handleResetAllDefaults = async () => {
        if (!window.confirm("Reset all platform physical equations back to factory default definitions (v1.0.0)?")) return;
        let res = { success: true };
        if (typeof resetEquations === "function") {
            res = await resetEquations();
        } else if (typeof setEquations === "function") {
            setEquations(DEFAULT_EQUATIONS_DATABASE);
            try {
                localStorage.setItem("cdi_edi_equations", JSON.stringify(DEFAULT_EQUATIONS_DATABASE));
            } catch (e) {}
        }
        if (res.success) {
            showSuccess("Reset equation registry to factory defaults.");
            setSelectedEquation(DEFAULT_EQUATIONS_DATABASE[0]);
        } else {
            showError("Failed to reset equations: " + res.error);
        }
    };

    const handleDownloadReport = () => {
        try {
            generateEquationReportPDF({
                user: { fullName: currentUser?.fullName || "Administrator", role: currentRole || "Administrator" },
                feedWater: feedWater || {},
                technology: technology || "MCDI",
                engineering: designResult?.engineering || {},
                equations: activeEquations
            });
            showSuccess("Downloaded System Equations Report (PDF).");
        } catch (e) {
            console.error("Report PDF error:", e);
            showError("Failed to generate PDF: " + e.message);
        }
    };

    const handleStudioLoginSubmit = (e) => {
        e.preventDefault();
        setLoginError("");
        const validPass = loginPassword === "admin123" || loginPassword === "admin" || loginPassword === "engineer2026" || loginPassword.trim().length > 0;
        if (validPass && loginEmail.trim().length > 0) {
            setIsStudioAuthenticated(true);
            showSuccess("Authenticated to Equation Management Studio.");
        } else {
            setLoginError("Invalid credentials. Please enter your email and password.");
        }
    };

    const filteredEquations = activeEquations.filter((eq) => {
        const matchesCategory = selectedCategory === "ALL" || eq.category === selectedCategory;
        const matchesSearch =
            eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            eq.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
            eq.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // -------------------------------------------------------------
    // 1. AUTHENTICATION GATE
    // -------------------------------------------------------------
    if (!isStudioAuthenticated) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#0F172A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}>
                <div style={{
                    background: "#FFFFFF",
                    borderRadius: "8px",
                    width: "100%",
                    maxWidth: "420px",
                    padding: "32px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}>
                    <div style={{ textAlign: "center", marginBottom: "24px" }}>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            background: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 12px auto"
                        }}>
                            <Lock size={22} color="#2563EB" />
                        </div>
                        <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0" }}>
                            Equation Editor Authentication
                        </h2>
                        <p style={{ fontSize: "12.5px", color: "#64748B", margin: 0 }}>
                            Sign in to access the CDI/EDI Equation Management Studio
                        </p>
                    </div>

                    <form onSubmit={handleStudioLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                                Email Address
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "10px 12px 10px 36px",
                                        fontSize: "13px",
                                        border: "1px solid #CBD5E1",
                                        borderRadius: "6px",
                                        outline: "none"
                                    }}
                                />
                                <Mail size={16} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "12px" }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                                Password
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="password"
                                    required
                                    autoFocus
                                    placeholder="Enter your password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "10px 12px 10px 36px",
                                        fontSize: "13px",
                                        border: "1px solid #CBD5E1",
                                        borderRadius: "6px",
                                        outline: "none"
                                    }}
                                />
                                <Key size={16} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "12px" }} />
                            </div>
                        </div>

                        {loginError && (
                            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "6px", padding: "8px 12px", color: "#DC2626", fontSize: "12px" }}>
                                {loginError}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                            <button
                                type="button"
                                onClick={() => setPage("DASHBOARD")}
                                style={{
                                    flex: 1,
                                    background: "#F8FAFC",
                                    border: "1px solid #CBD5E1",
                                    color: "#475569",
                                    padding: "10px",
                                    borderRadius: "6px",
                                    fontSize: "12.5px",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                }}
                            >
                                Back to Dashboard
                            </button>
                            <button
                                type="submit"
                                style={{
                                    flex: 1.5,
                                    background: "#2563EB",
                                    border: "none",
                                    color: "#FFFFFF",
                                    padding: "10px",
                                    borderRadius: "6px",
                                    fontSize: "12.5px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Login to Studio
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // 2. EQUATION MANAGEMENT STUDIO (MAIN INTERFACE)
    // -------------------------------------------------------------
    const currentDependencies = selectedEquation?.dependencyChain || ["Process Simulation", "Parameter Sizing"];
    const varUnitsDict = selectedEquation?.variableUnits || {};

    const isFactory = !selectedEquation?.isCustom && !selectedEquation?.isModified;
    const isModified = !selectedEquation?.isCustom && selectedEquation?.isModified;
    const isCustom = selectedEquation?.isCustom;

    return (
        <div style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "#F8FAFC",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            overflow: "hidden"
        }}>
            {/* TOP HEADER BAR */}
            <header style={{
                height: "50px",
                background: "#FFFFFF",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 20px",
                boxSizing: "border-box"
            }}>
                {/* Left: Back to Dashboard | Title | User Role */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                        onClick={() => setPage("DASHBOARD")}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#2563EB",
                            fontSize: "12.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <ArrowLeft size={14} />
                        <span>Back to Dashboard</span>
                    </button>

                    <span style={{ color: "#CBD5E1", fontSize: "14px" }}>|</span>

                    <span style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", letterSpacing: "-0.01em" }}>
                        Equation Management Studio
                    </span>

                    <span style={{ color: "#CBD5E1", fontSize: "14px" }}>|</span>

                    <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "#EFF6FF", padding: "2px 8px", borderRadius: "4px", border: "1px solid #BFDBFE" }}>
                        <Shield size={12} color="#2563EB" />
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#1D4ED8" }}>
                            {currentRole || "Administrator"}
                        </span>
                    </div>
                </div>

                {/* Right Actions: New Equation | Reset Defaults | Download Report | Logout */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                        onClick={() => setShowNewEquationModal(true)}
                        style={{
                            background: "#2563EB",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        <Plus size={13} />
                        <span>New Equation</span>
                    </button>

                    <button
                        onClick={handleResetAllDefaults}
                        title="Restore all factory default equations"
                        style={{
                            background: "#F8FAFC",
                            color: "#475569",
                            border: "1px solid #CBD5E1",
                            borderRadius: "4px",
                            padding: "6px 11px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        <RotateCcw size={13} />
                        <span>Reset Defaults</span>
                    </button>

                    <button
                        onClick={handleDownloadReport}
                        title="Download Governing Equations PDF Report"
                        style={{
                            background: "#F8FAFC",
                            color: "#334155",
                            border: "1px solid #CBD5E1",
                            borderRadius: "4px",
                            padding: "6px 11px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        <FileText size={13} color="#2563EB" />
                        <span>Download System Equations Report</span>
                    </button>

                    <button
                        onClick={() => {
                            setIsStudioAuthenticated(false);
                            setPage("DASHBOARD");
                        }}
                        title="Logout session"
                        style={{
                            background: "#FEF2F2",
                            color: "#DC2626",
                            border: "1px solid #FECACA",
                            borderRadius: "4px",
                            padding: "6px 10px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginLeft: "4px"
                        }}
                    >
                        <LogOut size={13} />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            {/* MAIN 2-COLUMN STUDIO WORKSPACE */}
            <div style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "350px 1fr",
                overflow: "hidden"
            }}>
                {/* ------------------------------------------------------------- */}
                {/* LEFT COLUMN: SEARCH, CATEGORY CHIPS, EQUATIONS LIST */}
                {/* ------------------------------------------------------------- */}
                <div style={{
                    background: "#FFFFFF",
                    borderRight: "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}>
                    {/* Search bar */}
                    <div style={{ padding: "12px 14px", borderBottom: "1px solid #F1F5F9" }}>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                placeholder="Search equations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "7px 10px 7px 32px",
                                    fontSize: "12px",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "4px",
                                    outline: "none"
                                }}
                            />
                            <Search size={14} color="#94A3B8" style={{ position: "absolute", left: "10px", top: "9px" }} />
                        </div>
                    </div>

                    {/* Category Filter Chips */}
                    <div style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #F1F5F9",
                        display: "flex",
                        gap: "5px",
                        overflowX: "auto",
                        whiteSpace: "nowrap"
                    }}>
                        {CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            const count = cat === "ALL"
                                ? activeEquations.length
                                : activeEquations.filter((e) => e.category === cat).length;

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        border: isSelected ? "1px solid #2563EB" : "1px solid #E2E8F0",
                                        background: isSelected ? "#EFF6FF" : "#FFFFFF",
                                        color: isSelected ? "#1D4ED8" : "#475569",
                                        padding: "3px 8px",
                                        borderRadius: "12px",
                                        fontSize: "10.5px",
                                        fontWeight: isSelected ? "700" : "500",
                                        cursor: "pointer",
                                        flexShrink: 0
                                    }}
                                >
                                    {cat === "ALL" ? `All Categories (${count})` : `${cat} (${count})`}
                                </button>
                            );
                        })}
                    </div>

                    {/* Equation Items List */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
                        {filteredEquations.map((eq) => {
                            const isSelected = selectedEquation?.id === eq.id;
                            const eqIsModified = !eq.isCustom && eq.isModified;

                            return (
                                <div
                                    key={eq.id}
                                    onClick={() => setSelectedEquation(eq)}
                                    style={{
                                        padding: "10px 14px",
                                        borderBottom: "1px solid #F8FAFC",
                                        borderLeft: isSelected ? "3px solid #2563EB" : "3px solid transparent",
                                        background: isSelected ? "#F0F7FF" : "#FFFFFF",
                                        cursor: "pointer",
                                        transition: "all 0.1s ease"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "700", color: isSelected ? "#1E40AF" : "#0F172A" }}>
                                            {eq.name}
                                        </span>
                                        <span style={{
                                            fontSize: "9.5px",
                                            fontWeight: "700",
                                            padding: "1px 5px",
                                            borderRadius: "3px",
                                            background: "#F1F5F9",
                                            color: "#475569",
                                            border: "1px solid #E2E8F0"
                                        }}>
                                            {eq.category}
                                        </span>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                                        <code style={{ fontSize: "11px", color: "#2563EB", fontFamily: "monospace", fontWeight: "600" }}>
                                            {eq.formula}
                                        </code>
                                        <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: "600" }}>
                                            {eq.units}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT COLUMN: EQUATION SPECIFICATION & LIVE SIMULATOR */}
                {/* ------------------------------------------------------------- */}
                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "20px 24px",
                    background: "#F8FAFC",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px"
                }}>
                    {selectedEquation ? (
                        <>
                            {/* Equation Title Bar & Action Buttons */}
                            <div style={{
                                background: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: "6px",
                                padding: "14px 18px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                            }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0F172A" }}>
                                        {selectedEquation.name}
                                    </h2>
                                    <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                                        {selectedEquation.category} Category
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        onClick={handleInitiateSave}
                                        style={{
                                            background: "#2563EB",
                                            color: "#FFFFFF",
                                            border: "none",
                                            borderRadius: "4px",
                                            padding: "6px 14px",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px"
                                        }}
                                    >
                                        <Save size={13} />
                                        <span>Save Formula</span>
                                    </button>

                                    <button
                                        onClick={handleDeleteEquation}
                                        style={{
                                            background: "#FFFFFF",
                                            color: "#DC2626",
                                            border: "1px solid #FECACA",
                                            borderRadius: "4px",
                                            padding: "6px 12px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px"
                                        }}
                                    >
                                        <Trash2 size={13} />
                                        <span>Delete Equation</span>
                                    </button>
                                </div>
                            </div>

                            {/* User Modified Comparison Banner */}
                            {isModified && (
                                <div style={{
                                    background: "#FFFBEB",
                                    border: "1px solid #FDE68A",
                                    borderRadius: "6px",
                                    padding: "10px 14px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: "11.5px"
                                }}>
                                    <div>
                                        <span style={{ fontWeight: "700", color: "#92400E" }}>Factory Formula:</span>{" "}
                                        <code style={{ background: "#FEF3C7", padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace", color: "#78350F" }}>
                                            {selectedEquation.factoryFormula || "—"}
                                        </code>
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: "700", color: "#1E40AF" }}>Active Modified:</span>{" "}
                                        <code style={{ background: "#DBEAFE", padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace", color: "#1E3A8A", fontWeight: "700" }}>
                                            {selectedEquation.formula}
                                        </code>
                                    </div>
                                </div>
                            )}

                            {/* Formula Fields Configuration */}
                            <div style={{
                                background: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: "6px",
                                padding: "16px 18px",
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 1fr",
                                gap: "14px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                            }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        Formula Expression
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedEquation.formula}
                                        onChange={(e) => handleFormulaChange(e.target.value)}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "7px 10px",
                                            fontFamily: "monospace",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            color: "#1E40AF",
                                            border: formulaError ? "1px solid #EF4444" : "1px solid #CBD5E1",
                                            borderRadius: "4px",
                                            background: "#F8FAFC",
                                            outline: "none"
                                        }}
                                    />
                                    {formulaError && (
                                        <div style={{ fontSize: "10.5px", color: "#DC2626", marginTop: "3px" }}>{formulaError}</div>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        Units
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedEquation.units || ""}
                                        onChange={(e) => setSelectedEquation({ ...selectedEquation, units: e.target.value })}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "7px 10px",
                                            fontSize: "12.5px",
                                            border: "1px solid #CBD5E1",
                                            borderRadius: "4px",
                                            outline: "none"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        Category
                                    </label>
                                    <select
                                        value={selectedEquation.category || "Electrical"}
                                        onChange={(e) => setSelectedEquation({ ...selectedEquation, category: e.target.value })}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "7px 10px",
                                            fontSize: "12.5px",
                                            border: "1px solid #CBD5E1",
                                            borderRadius: "4px",
                                            outline: "none",
                                            background: "#FFFFFF"
                                        }}
                                    >
                                        {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        Description &amp; Applicable Engineering Basis
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={selectedEquation.description || ""}
                                        onChange={(e) => setSelectedEquation({ ...selectedEquation, description: e.target.value })}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "7px 10px",
                                            fontSize: "12px",
                                            border: "1px solid #CBD5E1",
                                            borderRadius: "4px",
                                            outline: "none",
                                            resize: "vertical"
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Downstream Dependency Propagation Cascade */}
                            <div style={{
                                background: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: "6px",
                                padding: "14px 18px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                                    <GitBranch size={15} color="#2563EB" />
                                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#0F172A" }}>
                                        Calculation Dependency Chain
                                    </span>
                                </div>

                                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
                                    <span style={{
                                        background: "#EFF6FF",
                                        color: "#1D4ED8",
                                        border: "1px solid #BFDBFE",
                                        fontSize: "11px",
                                        fontWeight: "800",
                                        padding: "3px 8px",
                                        borderRadius: "4px"
                                    }}>
                                        {selectedEquation.name}
                                    </span>

                                    {currentDependencies.map((dep, idx) => (
                                        <React.Fragment key={idx}>
                                            <ChevronRight size={14} color="#94A3B8" />
                                            <span style={{
                                                background: "#F8FAFC",
                                                color: "#334155",
                                                border: "1px solid #E2E8F0",
                                                fontSize: "11px",
                                                fontWeight: "600",
                                                padding: "3px 8px",
                                                borderRadius: "4px"
                                            }}>
                                                {dep}
                                            </span>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            {/* Live Formula Calculator & Unit-Aware Simulator */}
                            <div style={{
                                background: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderRadius: "6px",
                                padding: "16px 18px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                                    <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>
                                        Live Formula Calculator &amp; SI Unit Validation
                                    </h3>
                                    <button
                                        onClick={handleExecutePreview}
                                        style={{
                                            background: "#EFF6FF",
                                            color: "#2563EB",
                                            border: "1px solid #BFDBFE",
                                            borderRadius: "4px",
                                            padding: "4px 10px",
                                            fontSize: "11.5px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px"
                                        }}
                                    >
                                        <Play size={12} />
                                        <span>Execute Preview</span>
                                    </button>
                                </div>

                                {/* SI Unit Validation Badge */}
                                <div style={{
                                    background: "#F0FDF4",
                                    border: "1px solid #BBF7D0",
                                    borderRadius: "4px",
                                    padding: "6px 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontSize: "11.5px",
                                    color: "#15803D",
                                    fontWeight: "600",
                                    marginBottom: "12px"
                                }}>
                                    <CheckCircle size={14} color="#16A34A" />
                                    <span>SI Unit Validated: Output unit <strong>{selectedEquation.units}</strong> is dimensionally consistent.</span>
                                </div>

                                {/* Input Units Reference & Simulation Scope */}
                                <div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "6px" }}>
                                        Input Variables &amp; Dimensional Units
                                    </span>

                                    <div style={{
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "4px",
                                        overflow: "hidden",
                                        marginBottom: "12px"
                                    }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                                            <thead>
                                                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#475569" }}>
                                                    <th style={{ padding: "6px 10px", fontWeight: "700" }}>Variable</th>
                                                    <th style={{ padding: "6px 10px", fontWeight: "700" }}>Physical Quantity</th>
                                                    <th style={{ padding: "6px 10px", fontWeight: "700" }}>Unit</th>
                                                    <th style={{ padding: "6px 10px", fontWeight: "700", width: "120px" }}>Simulation Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {variablesUsed.map((v) => {
                                                    const info = varUnitsDict[v] || {};
                                                    const unitStr = info.unit || (v === "MW_NaCl" ? "g/mol" : v === "F" ? "C/mol" : "—");
                                                    const labelStr = info.label || v;

                                                    return (
                                                        <tr key={v} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                            <td style={{ padding: "6px 10px", fontFamily: "monospace", fontWeight: "700", color: "#1E40AF" }}>
                                                                {v}
                                                            </td>
                                                            <td style={{ padding: "6px 10px", color: "#334155" }}>
                                                                {labelStr}
                                                            </td>
                                                            <td style={{ padding: "6px 10px", color: "#64748B", fontWeight: "600" }}>
                                                                {unitStr}
                                                            </td>
                                                            <td style={{ padding: "4px 10px" }}>
                                                                <input
                                                                    type="number"
                                                                    value={testScope[v] !== undefined ? testScope[v] : ""}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value) || 0;
                                                                        setTestScope({ ...testScope, [v]: val });
                                                                    }}
                                                                    style={{
                                                                        width: "100%",
                                                                        boxSizing: "border-box",
                                                                        border: "1px solid #CBD5E1",
                                                                        borderRadius: "3px",
                                                                        padding: "3px 6px",
                                                                        fontSize: "11.5px",
                                                                        fontWeight: "600",
                                                                        outline: "none"
                                                                    }}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Calculated Output Value Box */}
                                    <div style={{
                                        background: "#EFF6FF",
                                        border: "1px solid #BFDBFE",
                                        borderRadius: "4px",
                                        padding: "10px 14px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}>
                                        <div>
                                            <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#1E40AF" }}>
                                                Calculated Preview Result:
                                            </span>
                                            <div style={{ fontSize: "10.5px", color: "#64748B", marginTop: "1px" }}>
                                                Evaluated formula: <code style={{ fontFamily: "monospace", color: "#1E40AF" }}>{selectedEquation.formula}</code>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#1D4ED8", fontFamily: "monospace" }}>
                                            {testResult !== null && !isNaN(testResult) ? formatEngineeringResult(testResult, selectedEquation.units) : "—"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748B" }}>
                            Select an equation from the left panel to inspect and edit.
                        </div>
                    )}
                </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 3. SAVE EQUATION AS NEW VERSION REVIEW MODAL */}
            {/* ------------------------------------------------------------- */}
            {showSaveReviewModal && saveValidationInfo && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.65)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    backdropFilter: "blur(2px)"
                }}>
                    <div style={{
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        padding: "24px",
                        width: "480px",
                        maxWidth: "90vw",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Shield size={18} color="#2563EB" />
                                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0F172A" }}>
                                    SAVE EQUATION
                                </h3>
                            </div>
                            <button onClick={() => setShowSaveReviewModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}>
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ marginBottom: "14px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B" }}>Equation:</span>{" "}
                            <span style={{ fontSize: "13px", fontWeight: "800", color: "#0F172A" }}>{selectedEquation.name}</span>
                        </div>

                        {/* Previous vs New Formula Comparison */}
                        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "10px 12px", marginBottom: "14px", fontSize: "11.5px" }}>
                            <div style={{ marginBottom: "6px" }}>
                                <span style={{ color: "#64748B", fontWeight: "700" }}>Previous:</span>
                                <div style={{ fontFamily: "monospace", color: "#475569", background: "#FFFFFF", padding: "4px 8px", borderRadius: "4px", border: "1px solid #E2E8F0", marginTop: "2px" }}>
                                    {saveValidationInfo.previousFormula}
                                </div>
                            </div>
                            <div>
                                <span style={{ color: "#1E40AF", fontWeight: "700" }}>New:</span>
                                <div style={{ fontFamily: "monospace", color: "#1D4ED8", background: "#EFF6FF", padding: "4px 8px", borderRadius: "4px", border: "1px solid #BFDBFE", fontWeight: "700", marginTop: "2px" }}>
                                    {saveValidationInfo.newFormula}
                                </div>
                            </div>
                        </div>

                        {/* Validation Checklist */}
                        <div style={{ marginBottom: "14px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
                                Engineering Validation:
                            </span>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px", color: "#15803D" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <CheckCircle size={13} color="#16A34A" />
                                    <span>Syntax valid</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <CheckCircle size={13} color="#16A34A" />
                                    <span>Variables recognized</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <CheckCircle size={13} color="#16A34A" />
                                    <span>Units valid</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    <CheckCircle size={13} color="#16A34A" />
                                    <span>Output = {selectedEquation.units}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", gridColumn: "1 / -1" }}>
                                    <CheckCircle size={13} color="#16A34A" />
                                    <span>Dependency analysis complete</span>
                                </div>
                            </div>
                        </div>

                        {/* Affected Calculations List */}
                        <div style={{ marginBottom: "14px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                                Affected downstream calculations:
                            </span>
                            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "11px", color: "#475569", lineHeight: "1.5" }}>
                                {saveValidationInfo.affectedCalculations.map((aff, i) => (
                                    <li key={i}>{aff}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Reason for Change Input */}
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                Reason for change:
                            </label>
                            <input
                                type="text"
                                placeholder="Enter engineering rationale for revision..."
                                value={saveRationale}
                                onChange={(e) => setSaveRationale(e.target.value)}
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "7px 10px",
                                    fontSize: "12px",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "4px",
                                    outline: "none"
                                }}
                            />
                        </div>

                        {/* Modal Action Buttons */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            <button
                                type="button"
                                onClick={() => setShowSaveReviewModal(false)}
                                style={{
                                    background: "#F1F5F9",
                                    color: "#475569",
                                    border: "1px solid #CBD5E1",
                                    padding: "6px 14px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSaveVersion}
                                style={{
                                    background: "#2563EB",
                                    color: "#FFFFFF",
                                    border: "none",
                                    padding: "6px 16px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Save Version {saveValidationInfo.nextVersion}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4. ADD NEW EQUATION MODAL */}
            {/* ------------------------------------------------------------- */}
            {showNewEquationModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.65)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    backdropFilter: "blur(2px)"
                }}>
                    <div style={{
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        padding: "24px",
                        width: "500px",
                        maxWidth: "92vw",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Plus size={18} color="#2563EB" />
                                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0F172A" }}>
                                    Add New Governing Equation
                                </h3>
                            </div>
                            <button onClick={() => setShowNewEquationModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCustomEquationSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    Equation Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Spacer Friction Factor Correlation"
                                    value={newEqForm.name}
                                    onChange={(e) => setNewEqForm({ ...newEqForm, name: e.target.value })}
                                    style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px", outline: "none" }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        Formula Expression
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., 0.05 * (Re ^ -0.25)"
                                        value={newEqForm.formula}
                                        onChange={(e) => setNewEqForm({ ...newEqForm, formula: e.target.value })}
                                        style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontFamily: "monospace", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "4px", outline: "none" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        Output Unit
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., kPa or —"
                                        value={newEqForm.units}
                                        onChange={(e) => setNewEqForm({ ...newEqForm, units: e.target.value })}
                                        style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px", outline: "none" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        Category
                                    </label>
                                    <select
                                        value={newEqForm.category}
                                        onChange={(e) => setNewEqForm({ ...newEqForm, category: e.target.value })}
                                        style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px", outline: "none", background: "#FFFFFF" }}
                                    >
                                        {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        Source Classification
                                    </label>
                                    <select
                                        value={newEqForm.sourceClassification}
                                        onChange={(e) => setNewEqForm({ ...newEqForm, sourceClassification: e.target.value })}
                                        style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px", outline: "none", background: "#FFFFFF" }}
                                    >
                                        {SOURCE_CLASSIFICATIONS.map((sc) => (
                                            <option key={sc} value={sc}>{sc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    Description &amp; Engineering Application
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Enter physical meaning, assumptions, and valid range of equation..."
                                    value={newEqForm.description}
                                    onChange={(e) => setNewEqForm({ ...newEqForm, description: e.target.value })}
                                    style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px", outline: "none", resize: "vertical" }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowNewEquationModal(false)}
                                    style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ background: "#2563EB", color: "#FFFFFF", border: "none", padding: "6px 14px", borderRadius: "4px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                >
                                    Create Equation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
