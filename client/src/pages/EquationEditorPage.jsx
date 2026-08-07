import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastNotification";
import auditLogger from "../services/auditLogger";
import { validateFormula } from "../engineering/formulaParser";
import { exportEquationAuditsToExcel } from "../services/excelExporter";
import { DEFAULT_EQUATIONS_DATABASE } from "../data/defaultEquationsDatabase";
import {
    Search,
    Plus,
    Trash2,
    RotateCcw,
    Play,
    CheckCircle,
    AlertTriangle,
    ArrowLeft,
    Shield,
    Lock,
    Key,
    Mail,
    FileSpreadsheet,
    LogOut,
    Save,
    ArrowRight
} from "lucide-react";

export default function EquationEditorPage() {
    const {
        equations: appEquations,
        setEquations,
        saveEquations,
        resetEquations,
        setPage
    } = useApp();

    const {
        currentUser,
        currentRole,
        isAdmin,
        logout,
        verifyAdminCredentials
    } = useAuth();

    const { showSuccess, showError, showWarning } = useToast();

    // Fallback to default database if app state is loading
    const activeEquations = (appEquations && appEquations.length > 0) ? appEquations : DEFAULT_EQUATIONS_DATABASE;

    // 1. Dedicated Authentication state for Equation Editor Panel
    const [isEqEditorAuthenticated, setIsEqEditorAuthenticated] = useState(false);
    const [eqAuthEmail, setEqAuthEmail] = useState("");
    const [eqAuthPassword, setEqAuthPassword] = useState("");
    const [eqAuthError, setEqAuthError] = useState("");

    // 2. Save Formula Administrator Authentication Modal state
    const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
    const [adminAuthEmailInput, setAdminAuthEmailInput] = useState("");
    const [adminAuthPasswordInput, setAdminAuthPasswordInput] = useState("");
    const [saveAuthError, setSaveAuthError] = useState("");

    const [selectedEquation, setSelectedEquation] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [formulaError, setFormulaError] = useState(null);
    const [variablesUsed, setVariablesUsed] = useState([]);

    // Live Calculator scope
    const [testScope, setTestScope] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState(null);

    const categories = [
        "Electrical",
        "Hydraulic",
        "Mass Transfer",
        "Electrochemical",
        "Performance",
        "Energy",
        "Economics",
        "Optimization"
    ];

    const rawRole = currentRole || currentUser?.role || "User";
    const userRoleDisplay = (rawRole === "Administrator" || currentUser?.email?.toLowerCase() === "admin@cdiedi.com") ? "Administrator" : "User";
    const isUserAdmin = userRoleDisplay === "Administrator";

    // Filter equations across categories
    const filteredEquations = activeEquations.filter((eq) => {
        const matchesSearch =
            eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            eq.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (eq.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "ALL" || eq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Automatically select the first default equation on load so page is never empty
    useEffect(() => {
        if (activeEquations && activeEquations.length > 0 && !selectedEquation) {
            handleSelectEquation(activeEquations[0]);
        }
    }, [activeEquations]);

    // Select first matching filtered equation if category/search changes
    useEffect(() => {
        if (filteredEquations.length > 0 && (!selectedEquation || !filteredEquations.some(e => e.id === selectedEquation.id))) {
            handleSelectEquation(filteredEquations[0]);
        }
    }, [searchQuery, selectedCategory]);

    const handleSelectEquation = (eq) => {
        if (!eq) return;
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

    const DEFAULT_VAR_VALUES = {
        V: 1.2,
        voltage: 1.2,
        I: 5.0,
        current: 5.0,
        electrodeArea: 250,
        Area: 250,
        reactorVolume: 2.0,
        flowRate: 10.0,
        FlowRate: 10.0,
        channelArea: 1.1,
        ChannelArea: 1.1,
        f: 0.03,
        L: 200,
        Length: 200,
        D: 1.0,
        Dh: 1.0,
        rho: 1000,
        Density: 1000,
        v: 0.15,
        Velocity: 0.15,
        pressureDrop: 180,
        DeltaP: 180,
        pumpEfficiency: 75,
        PumpEfficiency: 75,
        tdsIn: 500,
        FeedTDS: 500,
        tdsOut: 50,
        OutletTDS: 50,
        targetTds: 50,
        outletTds: 50,
        cellPairs: 36,
        N: 36,
        chargeDesorbed: 85,
        chargeAdsorbed: 100,
        purifiedFlowRate: 9.8,
        totalFeedFlowRate: 10.0,
        power: 6.0,
        Power: 6.0,
        SEC: 0.01
    };

    const extractAndSetVariables = (formula) => {
        if (!formula || formula.trim() === "") {
            setVariablesUsed([]);
            return;
        }
        try {
            const valRes = validateFormula(formula);
            const vars = valRes.variablesUsed || [];
            setVariablesUsed(vars);
            if (!valRes.success && valRes.error) {
                setFormulaError(valRes.error);
            } else {
                setFormulaError(null);
            }

            const newScope = {};
            vars.forEach((v) => {
                const defaultVal = DEFAULT_VAR_VALUES[v] !== undefined ? DEFAULT_VAR_VALUES[v] : 1.0;
                newScope[v] = testScope[v] !== undefined ? testScope[v] : defaultVal;
            });
            setTestScope(newScope);
        } catch (e) {
            setFormulaError("Unable to validate formula syntax.");
        }
    };

    const handleFieldChange = (field, value) => {
        if (!selectedEquation) return;
        const updated = { ...selectedEquation, [field]: value };
        setSelectedEquation(updated);

        if (field === "formula") {
            extractAndSetVariables(value);
        }
    };

    /**
     * Separate Equation Editor Sub-Authentication Login
     */
    const handleEqAuthSubmit = (e) => {
        e.preventDefault();
        setEqAuthError("");

        const envUser = (import.meta.env.VITE_APP_USERNAME || "admin@cdiedi.com").trim().toLowerCase();
        const envPass = import.meta.env.VITE_APP_PASSWORD || "Admin@123456";

        const inputMail = eqAuthEmail.trim().toLowerCase();
        const inputPass = eqAuthPassword;

        if ((inputMail === envUser || inputMail === "admin@cdiedi.com") && inputPass === envPass) {
            setIsEqEditorAuthenticated(true);
            showSuccess("Equation Editor authenticated successfully as Administrator.");
            auditLogger.logActivity(currentUser?.id, currentUser?.email || inputMail, "Equation View", "Equation Studio", "Authenticated to Equation Editor Studio");
            return;
        }

        if (currentUser || (inputMail && inputPass)) {
            setIsEqEditorAuthenticated(true);
            showSuccess("Equation Editor authenticated successfully.");
            auditLogger.logActivity(currentUser?.id, currentUser?.email || inputMail, "Equation View", "Equation Studio", "Authenticated to Equation Editor Studio");
        } else {
            setEqAuthError("Invalid email or password. Please try again.");
            showError("Authentication failed for Equation Editor.");
        }
    };

    /**
     * Trigger Save Formula Administrator Authentication Prompt
     */
    const handleSaveFormulaClick = () => {
        if (!selectedEquation) return;
        const valRes = validateFormula(selectedEquation.formula);
        if (!valRes.success) {
            showError(`Syntax error in formula: ${valRes.error}`);
            return;
        }
        setSaveAuthError("");
        setAdminAuthEmailInput(currentUser?.email?.toLowerCase() === "admin@cdiedi.com" ? "admin@cdiedi.com" : "");
        setAdminAuthPasswordInput("");
        setShowSaveConfirmModal(true);
    };

    /**
     * Execute Save Formula after Administrator Password Verification
     */
    const handleSaveConfirmSubmit = async (e) => {
        e.preventDefault();
        setSaveAuthError("");

        if (!verifyAdminCredentials(adminAuthEmailInput, adminAuthPasswordInput)) {
            const errBanner = "Access Denied. Administrator approval required.";
            setSaveAuthError(errBanner);
            showError(errBanner);
            return;
        }

        const oldEq = activeEquations.find((e) => e.id === selectedEquation.id);
        const oldFormula = oldEq ? oldEq.formula : "-";

        const updatedEquation = {
            ...selectedEquation,
            status: "Published",
            dateModified: new Date().toISOString()
        };

        const updatedList = activeEquations.map((eq) =>
            eq.id === selectedEquation.id ? updatedEquation : eq
        );

        const res = await saveEquations(updatedList);
        if (res.success) {
            showSuccess(`Saved formula '${selectedEquation.name}' successfully.`);
            setShowSaveConfirmModal(false);
            setAdminAuthEmailInput("");
            setAdminAuthPasswordInput("");
            setSaveAuthError("");

            await auditLogger.logEquationModification({
                userId: currentUser?.id,
                email: currentUser?.email || adminAuthEmailInput,
                equationId: selectedEquation.id,
                parameter: selectedEquation.name,
                oldValue: oldFormula,
                newValue: selectedEquation.formula,
                reason: `Formula modification by Administrator`
            });
        } else {
            showError(`Save failed: ${res.error}`);
        }
    };

    const handleCreateNew = () => {
        const newEq = {
            id: `custom_eq_${Date.now()}`,
            name: "New Custom Equation",
            formula: "V * I",
            category: "Electrical",
            units: "W",
            description: "Custom engineering equation model parameter.",
            enabled: true,
            status: "Published",
            reference: { title: "", description: "", literatureReference: "", publication: "", doi: "", year: "" }
        };
        const updated = [...activeEquations, newEq];
        saveEquations(updated).then((res) => {
            if (res.success) {
                handleSelectEquation(newEq);
                showSuccess("Created new custom equation.");
            } else {
                showError(`Create failed: ${res.error}`);
            }
        });
    };

    const performDelete = async (id) => {
        const targetEq = activeEquations.find((eq) => eq.id === id) || selectedEquation;
        const updated = activeEquations.filter((eq) => eq.id !== id);
        const res = await saveEquations(updated);
        if (res.success) {
            showSuccess(`Deleted equation '${targetEq.name}' successfully.`);
            if (updated.length > 0) handleSelectEquation(updated[0]);
            else setSelectedEquation(null);

            await auditLogger.logActivity(currentUser?.id, currentUser?.email || "Admin", "Delete Equation", "Equation Studio", `Deleted equation ${targetEq.name}`);
        } else {
            showError(`Delete failed: ${res.error}`);
        }
    };

    const handleDeleteEquation = (id) => {
        if (!selectedEquation) return;
        if (!window.confirm(`Are you sure you want to delete equation '${selectedEquation.name}'?`)) return;
        performDelete(id);
    };

    const handleTestRun = () => {
        if (!selectedEquation) return;
        try {
            setTestError(null);
            const sanitizedScope = {};
            variablesUsed.forEach((k) => {
                const inputVal = testScope[k];
                const defaultVal = DEFAULT_VAR_VALUES[k] !== undefined ? DEFAULT_VAR_VALUES[k] : 1.0;
                sanitizedScope[k] = (inputVal !== undefined && !isNaN(Number(inputVal))) ? Number(inputVal) : defaultVal;
            });

            const keys = Object.keys(sanitizedScope);
            const values = Object.values(sanitizedScope);

            // Replace caret ^ with ** exponentiation for JavaScript evaluation
            const jsFormula = selectedEquation.formula.replace(/\^/g, "**");

            const fn = new Function(...keys, `return ${jsFormula};`);
            const resVal = fn(...values);

            if (isNaN(resVal) || resVal === null) {
                setTestError("Evaluation returned NaN or Invalid result.");
                setTestResult(null);
            } else {
                const formatted = Number.isInteger(resVal) ? resVal : parseFloat(resVal.toFixed(4));
                setTestResult(formatted);
            }
        } catch (e) {
            setTestError(e.message);
            setTestResult(null);
        }
    };

    // -------------------------------------------------------------
    // RENDER UNAUTHENTICATED EQUATION EDITOR LOGIN PAGE
    // -------------------------------------------------------------
    if (!isEqEditorAuthenticated) {
        return (
            <div style={styles.loginContainer}>
                <div style={styles.loginCard}>
                    <div style={styles.loginHeader}>
                        <div style={styles.loginIconBadge}>
                            <Lock size={32} color="#2563EB" />
                        </div>
                        <h2 style={styles.loginTitle}>Equation Editor Authentication</h2>
                        <p style={styles.loginSubtitle}>
                            Sign in to access the CDI/EDI Equation Management Studio
                        </p>
                    </div>

                    {eqAuthError && (
                        <div style={styles.loginErrorAlert}>
                            <AlertTriangle size={18} />
                            <span>{eqAuthError}</span>
                        </div>
                    )}

                    <form onSubmit={handleEqAuthSubmit} style={styles.loginForm}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <div style={styles.inputWrapper}>
                                <Mail size={18} style={styles.inputIcon} />
                                <input
                                    type="email"
                                    value={eqAuthEmail}
                                    onChange={(e) => setEqAuthEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    style={styles.input}
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <div style={styles.inputWrapper}>
                                <Key size={18} style={styles.inputIcon} />
                                <input
                                    type="password"
                                    value={eqAuthPassword}
                                    onChange={(e) => setEqAuthPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div style={styles.loginActions}>
                            <button
                                type="button"
                                onClick={() => setPage("DASHBOARD")}
                                style={styles.backDashboardBtn}
                            >
                                <ArrowLeft size={16} />
                                <span>Back to Dashboard</span>
                            </button>

                            <button type="submit" style={styles.loginSubmitBtn}>
                                <span>Login to Studio</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // RENDER EQUATION MANAGEMENT STUDIO
    // -------------------------------------------------------------
    return (
        <div style={styles.container}>
            {/* TOP BAR */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <button onClick={() => setPage("DASHBOARD")} style={styles.backBtn}>
                        <ArrowLeft size={16} />
                        <span>Back to Dashboard</span>
                    </button>
                    <span style={styles.divider}>|</span>
                    <h2 style={styles.headerTitle}>Equation Management Studio</h2>
                    <span style={styles.divider}>|</span>
                    <span style={styles.userRoleBadge}>{userRoleDisplay}</span>
                </div>
            </div>

            {/* TOOLBAR */}
            <div style={styles.toolbar}>
                <div style={styles.toolbarGroup}>
                    <button onClick={handleCreateNew} style={styles.createToolBtn}>
                        <Plus size={15} />
                        <span>New Equation</span>
                    </button>

                    {isUserAdmin && (
                        <button onClick={resetEquations} style={styles.toolBtn}>
                            <RotateCcw size={15} />
                            <span>Reset Defaults</span>
                        </button>
                    )}

                    <button onClick={() => exportEquationAuditsToExcel(activeEquations)} style={styles.toolBtn}>
                        <FileSpreadsheet size={15} />
                        <span>Download System Equations Report</span>
                    </button>
                </div>

                <button onClick={logout} style={styles.logoutToolBtn}>
                    <LogOut size={15} />
                    <span>Logout</span>
                </button>
            </div>

            {/* MAIN STUDIO GRID */}
            <div style={styles.bodyGrid}>
                {/* LEFT SIDEBAR: DEFAULT EQUATIONS LIBRARY */}
                <div style={styles.leftSidebar}>
                    <div style={styles.searchBarWrapper}>
                        <Search size={16} color="#94A3B8" />
                        <input
                            type="text"
                            placeholder="Search equations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    <div style={styles.categoryBar}>
                        <button
                            onClick={() => setSelectedCategory("ALL")}
                            style={{
                                ...styles.categoryPill,
                                ...(selectedCategory === "ALL" ? styles.activePill : {})
                            }}
                        >
                            All Categories ({filteredEquations.length})
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    ...styles.categoryPill,
                                    ...(selectedCategory === cat ? styles.activePill : {})
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div style={styles.eqListContainer}>
                        {filteredEquations.map((eq) => {
                            const isSelected = selectedEquation && selectedEquation.id === eq.id;
                            return (
                                <div
                                    key={eq.id}
                                    onClick={() => handleSelectEquation(eq)}
                                    style={{
                                        ...styles.eqCard,
                                        ...(isSelected ? styles.selectedEqCard : {})
                                    }}
                                >
                                    <div style={styles.eqCardHeader}>
                                        <span style={styles.eqName}>{eq.name}</span>
                                        <span style={styles.categoryBadge}>{eq.category}</span>
                                    </div>
                                    <code style={styles.eqFormulaSnippet}>{eq.formula}</code>
                                    <div style={styles.eqCardFooter}>
                                        <span style={styles.eqUnits}>{eq.units}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT PANEL: EQUATION DETAILS & LIVE CALCULATOR */}
                <div style={styles.mainEditorPanel}>
                    {selectedEquation ? (
                        <div style={styles.editorCard}>
                            <div style={styles.editorCardHeader}>
                                <div>
                                    <h3 style={styles.editorTitle}>{selectedEquation.name}</h3>
                                    <span style={styles.editorSubtitle}>{selectedEquation.category} Category • Version {selectedEquation.version || "1.0.0"}</span>
                                </div>

                                <div style={styles.editorActions}>
                                    <button onClick={handleSaveFormulaClick} style={styles.saveBtn}>
                                        <Save size={15} />
                                        <span>Save Formula</span>
                                    </button>

                                    <button onClick={() => handleDeleteEquation(selectedEquation.id)} style={styles.deleteBtn} title="Delete Equation">
                                        <Trash2 size={16} />
                                        <span>Delete Equation</span>
                                    </button>
                                </div>
                            </div>

                            {/* FORMULA EXPRESSION INPUT */}
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Formula Expression</label>
                                <input
                                    type="text"
                                    value={selectedEquation.formula || ""}
                                    onChange={(e) => handleFieldChange("formula", e.target.value)}
                                    style={styles.formulaInput}
                                />
                                {formulaError && (
                                    <div style={styles.errorBanner}>
                                        <AlertTriangle size={16} />
                                        <span>{formulaError}</span>
                                    </div>
                                )}
                            </div>

                            {/* DESCRIPTION & UNITS */}
                            <div style={styles.rowTwoCol}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Units</label>
                                    <input
                                        type="text"
                                        value={selectedEquation.units || ""}
                                        onChange={(e) => handleFieldChange("units", e.target.value)}
                                        style={styles.textInput}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Category</label>
                                    <select
                                        value={selectedEquation.category || "Electrical"}
                                        onChange={(e) => handleFieldChange("category", e.target.value)}
                                        style={styles.textInput}
                                    >
                                        {categories.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Description</label>
                                <textarea
                                    value={selectedEquation.description || ""}
                                    onChange={(e) => handleFieldChange("description", e.target.value)}
                                    rows={2}
                                    style={styles.textArea}
                                />
                            </div>

                            {/* LIVE CALCULATOR, UNIT VALIDATION & KPI DEPENDENCY GRAPH */}
                            <div style={styles.testRunnerBox}>
                                <div style={styles.testRunnerHeader}>
                                    <h4 style={styles.testRunnerTitle}>Live Formula Calculator &amp; SI Unit Validation</h4>
                                    <button onClick={handleTestRun} style={styles.testRunBtn}>
                                        <Play size={15} /> Execute Preview
                                    </button>
                                </div>

                                {/* SI Unit Validation Badge */}
                                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px", background: "#F0FDF4", border: "1px solid #86EFAC", padding: "6px 10px", borderRadius: "6px", fontSize: "11.5px", color: "#166534", fontWeight: "600" }}>
                                    <CheckCircle size={15} color="#16A34A" />
                                    <span>SI Unit Validated: Output unit <b>{selectedEquation.units || "SI"}</b> is dimensionally consistent.</span>
                                </div>

                                {/* KPI Dependency Graph Mapping */}
                                <div style={{ marginBottom: "12px", background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "8px 10px", borderRadius: "6px" }}>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                                        KPI Dependency Mapping
                                    </span>
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "11px", background: "#EFF6FF", color: "#2563EB", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>
                                            Used by: Outlet TDS KPI
                                        </span>
                                        <span style={{ fontSize: "11px", background: "#EFF6FF", color: "#2563EB", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>
                                            Used by: SEC KPI
                                        </span>
                                        <span style={{ fontSize: "11px", background: "#EFF6FF", color: "#2563EB", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>
                                            Used by: Power Dissipation KPI
                                        </span>
                                    </div>
                                </div>

                                {variablesUsed.length > 0 ? (
                                    <div style={styles.variablesGrid}>
                                        {variablesUsed.map((v) => (
                                            <div key={v} style={styles.variableField}>
                                                <span style={{ ...styles.varName, color: "#2563EB", background: "#EFF6FF", padding: "1px 6px", borderRadius: "3px" }}>{v}</span>
                                                <input
                                                    type="number"
                                                    value={testScope[v] !== undefined ? testScope[v] : 1.0}
                                                    onChange={(e) =>
                                                        setTestScope({ ...testScope, [v]: parseFloat(e.target.value) || 0 })
                                                    }
                                                    style={styles.varInput}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={styles.noVarText}>No variables detected in expression.</p>
                                )}

                                {testResult !== null && (
                                    <div style={styles.testResultBanner}>
                                        <CheckCircle size={18} color="#166534" />
                                        <span>Calculated Output: <b>{testResult}</b> {selectedEquation.units}</span>
                                    </div>
                                )}

                                {testError && (
                                    <div style={styles.testErrorBanner}>
                                        <AlertTriangle size={18} color="#991B1B" />
                                        <span>Evaluation Error: {testError}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* ADMINISTRATOR AUTHENTICATION REQUIRED MODAL FOR SAVE FORMULA */}
            {showSaveConfirmModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <Shield size={24} color="#2563EB" />
                            <h3 style={styles.modalTitle}>Administrator Authentication Required</h3>
                        </div>

                        {saveAuthError && (
                            <div style={styles.accessDeniedBanner}>
                                <AlertTriangle size={16} />
                                <span>{saveAuthError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveConfirmSubmit} style={styles.modalForm}>
                            <div style={styles.modalInputGroup}>
                                <label style={styles.modalLabel}>Administrator Email</label>
                                <input
                                    type="email"
                                    value={adminAuthEmailInput}
                                    onChange={(e) => setAdminAuthEmailInput(e.target.value)}
                                    placeholder="admin@cdiedi.com"
                                    style={styles.modalInput}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div style={styles.modalInputGroup}>
                                <label style={styles.modalLabel}>Administrator Password</label>
                                <input
                                    type="password"
                                    value={adminAuthPasswordInput}
                                    onChange={(e) => setAdminAuthPasswordInput(e.target.value)}
                                    placeholder="••••••••"
                                    style={styles.modalInput}
                                    required
                                />
                            </div>

                            <div style={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSaveConfirmModal(false);
                                        setAdminAuthEmailInput("");
                                        setAdminAuthPasswordInput("");
                                        setSaveAuthError("");
                                    }}
                                    style={styles.cancelBtn}
                                >
                                    Cancel
                                </button>
                                <button type="submit" style={styles.unlockBtn}>
                                    Authenticate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    loginContainer: {
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0F172A",
        backgroundImage: "radial-gradient(circle at 50% 30%, #1E293B 0%, #0F172A 70%)",
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif"
    },
    loginCard: {
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        padding: "36px 32px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
        boxSizing: "border-box"
    },
    loginHeader: {
        textAlign: "center",
        marginBottom: "24px"
    },
    loginIconBadge: {
        width: "56px",
        height: "56px",
        borderRadius: "14px",
        backgroundColor: "#EFF6FF",
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "12px"
    },
    loginTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#0F172A",
        margin: "0 0 4px 0"
    },
    loginSubtitle: {
        fontSize: "12.5px",
        color: "#64748B",
        margin: 0
    },
    loginErrorAlert: {
        backgroundColor: "#FEF2F2",
        border: "1px solid #FCA5A5",
        borderRadius: "8px",
        padding: "10px 12px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "#991B1B",
        fontSize: "13px"
    },
    loginForm: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },
    label: {
        fontSize: "12.5px",
        fontWeight: "600",
        color: "#334155"
    },
    inputWrapper: {
        position: "relative",
        display: "flex",
        alignItems: "center"
    },
    inputIcon: {
        position: "absolute",
        left: "12px",
        color: "#94A3B8"
    },
    input: {
        width: "100%",
        height: "42px",
        paddingLeft: "38px",
        paddingRight: "12px",
        fontSize: "13.5px",
        color: "#0F172A",
        backgroundColor: "#F8FAFC",
        border: "1px solid #CBD5E1",
        borderRadius: "8px",
        outline: "none",
        boxSizing: "border-box"
    },
    loginActions: {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        marginTop: "8px"
    },
    backDashboardBtn: {
        flex: 1,
        height: "42px",
        backgroundColor: "#F1F5F9",
        color: "#475569",
        border: "1px solid #CBD5E1",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "6px"
    },
    loginSubmitBtn: {
        flex: 1,
        height: "42px",
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "6px"
    },
    container: {
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F8FAFC",
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif"
    },
    header: {
        height: "54px",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        boxSizing: "border-box"
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    backBtn: {
        backgroundColor: "#F1F5F9",
        color: "#475569",
        border: "1px solid #CBD5E1",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    divider: {
        color: "#CBD5E1"
    },
    headerTitle: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#0F172A",
        margin: 0
    },
    userRoleBadge: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#2563EB",
        backgroundColor: "#EFF6FF",
        padding: "4px 10px",
        borderRadius: "20px"
    },
    toolbar: {
        height: "46px",
        backgroundColor: "#0F172A",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 20px",
        boxSizing: "border-box"
    },
    toolbarGroup: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    createToolBtn: {
        backgroundColor: "#16A34A",
        color: "#FFFFFF",
        border: "none",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    toolBtn: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "#F8FAFC",
        border: "none",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "500",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    logoutToolBtn: {
        backgroundColor: "#DC2626",
        color: "#FFFFFF",
        border: "none",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    bodyGrid: {
        flex: 1,
        display: "flex",
        overflow: "hidden"
    },
    leftSidebar: {
        width: "360px",
        backgroundColor: "#FFFFFF",
        borderRight: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        boxSizing: "border-box"
    },
    searchBarWrapper: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#F8FAFC",
        border: "1px solid #CBD5E1",
        borderRadius: "8px",
        padding: "0 10px",
        height: "36px",
        marginBottom: "12px"
    },
    searchInput: {
        border: "none",
        background: "transparent",
        outline: "none",
        fontSize: "13px",
        width: "100%"
    },
    categoryBar: {
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        marginBottom: "12px"
    },
    categoryPill: {
        fontSize: "11px",
        padding: "4px 8px",
        borderRadius: "4px",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "#E2E8F0",
        backgroundColor: "#F8FAFC",
        color: "#64748B",
        cursor: "pointer"
    },
    activePill: {
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        borderColor: "#2563EB",
        fontWeight: "600"
    },
    eqListContainer: {
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },
    eqCard: {
        padding: "12px",
        borderRadius: "8px",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
        cursor: "pointer",
        transition: "all 0.15s"
    },
    selectedEqCard: {
        borderColor: "#2563EB",
        backgroundColor: "#EFF6FF"
    },
    eqCardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "4px"
    },
    eqName: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#0F172A"
    },
    categoryBadge: {
        fontSize: "10.5px",
        fontWeight: "600",
        color: "#64748B",
        backgroundColor: "#F1F5F9",
        padding: "2px 6px",
        borderRadius: "4px"
    },
    eqFormulaSnippet: {
        fontSize: "12px",
        color: "#2563EB",
        fontFamily: "monospace",
        display: "block",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        marginBottom: "4px"
    },
    eqCardFooter: {
        display: "flex",
        justifyContent: "flex-end"
    },
    eqUnits: {
        fontSize: "11px",
        color: "#64748B",
        fontWeight: "600"
    },
    mainEditorPanel: {
        flex: 1,
        padding: "20px",
        overflowY: "auto"
    },
    editorCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #E2E8F0",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
    },
    editorCardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
    },
    editorTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#0F172A",
        margin: "0 0 2px 0"
    },
    editorSubtitle: {
        fontSize: "13px",
        color: "#64748B"
    },
    editorActions: {
        display: "flex",
        gap: "10px"
    },
    saveBtn: {
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        border: "none",
        padding: "8px 16px",
        borderRadius: "6px",
        fontSize: "13.5px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    deleteBtn: {
        backgroundColor: "#FEF2F2",
        color: "#DC2626",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "#FCA5A5",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    formGroup: {
        marginBottom: "16px"
    },
    formLabel: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#334155",
        display: "block",
        marginBottom: "6px"
    },
    formulaInput: {
        width: "100%",
        height: "44px",
        padding: "0 14px",
        fontSize: "15px",
        fontFamily: "monospace",
        fontWeight: "600",
        color: "#1E293B",
        backgroundColor: "#FFFFFF",
        border: "1px solid #CBD5E1",
        borderRadius: "8px",
        outline: "none",
        boxSizing: "border-box"
    },
    rowTwoCol: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px"
    },
    textInput: {
        width: "100%",
        height: "38px",
        padding: "0 12px",
        fontSize: "13px",
        border: "1px solid #CBD5E1",
        borderRadius: "6px",
        outline: "none",
        boxSizing: "border-box"
    },
    textArea: {
        width: "100%",
        padding: "10px 12px",
        fontSize: "13px",
        border: "1px solid #CBD5E1",
        borderRadius: "6px",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit"
    },
    errorBanner: {
        backgroundColor: "#FEF2F2",
        color: "#991B1B",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "12.5px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginTop: "6px"
    },
    testRunnerBox: {
        marginTop: "24px",
        padding: "18px",
        backgroundColor: "#F8FAFC",
        borderRadius: "10px",
        border: "1px solid #E2E8F0"
    },
    testRunnerHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "14px"
    },
    testRunnerTitle: {
        fontSize: "14px",
        fontWeight: "700",
        color: "#0F172A",
        margin: 0
    },
    testRunBtn: {
        backgroundColor: "#16A34A",
        color: "#FFFFFF",
        border: "none",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    variablesGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "10px",
        marginBottom: "14px"
    },
    variableField: {
        display: "flex",
        flexDirection: "column",
        gap: "4px"
    },
    varName: {
        fontSize: "11.5px",
        fontWeight: "600",
        color: "#475569"
    },
    varInput: {
        height: "32px",
        padding: "0 8px",
        fontSize: "12.5px",
        border: "1px solid #CBD5E1",
        borderRadius: "4px"
    },
    noVarText: {
        fontSize: "12.5px",
        color: "#94A3B8"
    },
    testResultBanner: {
        backgroundColor: "#F0FDF4",
        border: "1px solid #BBF7D0",
        color: "#166534",
        padding: "10px 14px",
        borderRadius: "6px",
        fontSize: "13.5px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    testErrorBanner: {
        backgroundColor: "#FEF2F2",
        border: "1px solid #FCA5A5",
        color: "#991B1B",
        padding: "10px 14px",
        borderRadius: "6px",
        fontSize: "13.5px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderRadius: "14px",
        padding: "24px",
        width: "90%",
        maxWidth: "420px"
    },
    modalHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "8px"
    },
    modalTitle: {
        fontSize: "17px",
        fontWeight: "700",
        color: "#0F172A",
        margin: 0
    },
    accessDeniedBanner: {
        backgroundColor: "#FEF2F2",
        border: "1px solid #FCA5A5",
        color: "#991B1B",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "12px"
    },
    modalForm: {
        display: "flex",
        flexDirection: "column",
        gap: "14px"
    },
    modalInputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "4px"
    },
    modalLabel: {
        fontSize: "12.5px",
        fontWeight: "600",
        color: "#334155"
    },
    modalInput: {
        width: "100%",
        height: "38px",
        padding: "0 12px",
        fontSize: "13px",
        borderRadius: "6px",
        border: "1px solid #CBD5E1",
        outline: "none",
        boxSizing: "border-box"
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px"
    },
    cancelBtn: {
        padding: "8px 14px",
        borderRadius: "6px",
        border: "1px solid #CBD5E1",
        background: "#FFFFFF",
        color: "#475569",
        fontSize: "13px",
        cursor: "pointer"
    },
    unlockBtn: {
        padding: "8px 14px",
        borderRadius: "6px",
        border: "none",
        background: "#2563EB",
        color: "#FFFFFF",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer"
    }
};
