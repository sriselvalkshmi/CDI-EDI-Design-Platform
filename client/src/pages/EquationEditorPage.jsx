import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import api from "../services/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { generateEngineeringReportPDF } from "../utils/reportGenerator";
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
    FileText,
    RefreshCw,
    Shield,
    LogOut,
    Users,
    Key
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
        user,
        fetchEquations,
        logout
    } = useApp();

    const isAdmin = user && user.role === "Administrator";
    const isNormalUser = user && user.role === "User";
    const isEditable = true; // All authenticated users (Admin and User) can view/edit/save equations

    const [activeTab, setActiveTab] = useState("EQUATION_EDITOR"); // "EQUATION_EDITOR" | "ADMIN_PANEL"
    const [adminLogSubTab, setAdminLogSubTab] = useState("LOGIN_HISTORY"); // "LOGIN_HISTORY" | "USER_ACTIVITY" | "ENGINEERING_MODS"

    // Admin Panel Data State
    const [usersList, setUsersList] = useState([]);
    const [logsData, setLogsData] = useState({ loginHistory: [], userActivity: [], engineeringModifications: [] });
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsError, setLogsError] = useState(null);

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

    // Fetch equations on mount
    useEffect(() => {
        fetchEquations();
    }, []);

    // Select first equation if none selected
    useEffect(() => {
        if (filteredEquations.length > 0 && !selectedEquation) {
            handleSelectEquation(filteredEquations[0]);
        }
    }, [equations]);

    // Fetch Admin Panel Data (Supabase Audit Logs)
    const fetchAdminData = async () => {
        if (!isAdmin) return;
        setLogsLoading(true);
        setLogsError(null);
        try {
            const logsRes = await api.get("/logs/all");
            if (logsRes.data.success) {
                setLogsData({
                    loginHistory: logsRes.data.loginHistory || [],
                    userActivity: logsRes.data.userActivity || [],
                    engineeringModifications: logsRes.data.engineeringModifications || []
                });
            }
        } catch (e) {
            setLogsError(e.response?.data?.message || "403 Unauthorized: Unable to load administrator logs.");
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "ADMIN_PANEL" && isAdmin) {
            fetchAdminData();
        }
    }, [activeTab, isAdmin]);

    // Admin User Management Actions
    const handleDeleteUser = async (userId, userName) => {
        if (!isAdmin) return;
        if (!window.confirm(`Are you sure you want to delete user account "${userName}"?`)) return;
        try {
            const res = await api.delete(`/auth/users/${userId}`);
            if (res.data.success) {
                alert("User account deleted successfully.");
                fetchAdminData();
            } else {
                alert(`Failed to delete user: ${res.data.message}`);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete user.");
        }
    };

    const handleResetUserPassword = async (userId, userName) => {
        if (!isAdmin) return;
        const newPass = prompt(`Enter new password for user "${userName}":`, "UserPass@123");
        if (!newPass) return;
        try {
            const res = await api.post(`/auth/users/${userId}/reset-password`, { newPassword: newPass });
            if (res.data.success) {
                alert(`Password for user "${userName}" reset successfully.`);
            } else {
                alert(`Failed to reset password: ${res.data.message}`);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to reset user password.");
        }
    };

    // Equation Selection & Variable Parsing
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

    const handleFieldChange = (field, value) => {
        if (!selectedEquation) return;
        const updated = { ...selectedEquation, [field]: value };
        setSelectedEquation(updated);

        if (field === "formula") {
            extractAndSetVariables(value);
        }
    };

    const handleSave = async () => {
        if (!selectedEquation) return;
        const valRes = await api.post("/equations/validate", { formula: selectedEquation.formula });
        if (!valRes.data.success) {
            alert(`Cannot save formula due to syntax error: ${valRes.data.error}`);
            return;
        }

        const updatedList = equations.map(eq =>
            eq.id === selectedEquation.id ? selectedEquation : eq
        );

        const res = await saveEquations(updatedList);
        if (res.success) {
            alert("Equation saved successfully.");
        } else {
            alert(`Failed to save equation: ${res.error}`);
        }
    };

    const handleCreateNew = () => {
        const newEq = {
            id: `custom_eq_${Date.now()}`,
            name: "New Custom Equation",
            formula: "V * I",
            category: "Electrical",
            units: "W",
            description: "Custom mathematical model equation.",
            enabled: true,
            reference: { title: "", description: "", literatureReference: "", publication: "", doi: "", year: "" }
        };
        const updated = [...equations, newEq];
        setEquations(updated);
        handleSelectEquation(newEq);
    };

    const handleDeleteEquation = async (id) => {
        const eqToDelete = equations.find(e => e.id === id);
        const isCustom = id.includes("custom") || (eqToDelete && eqToDelete.isCustom);
        if (!isAdmin && !isCustom) {
            alert("Deletion of standard system equations is restricted to Administrator role. You can delete newly added custom equations.");
            return;
        }
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

    const handleReset = async () => {
        if (!isAdmin) {
            alert("Reset permission is restricted to Administrator role.");
            return;
        }
        if (!window.confirm("Are you sure you want to restore default equations? All custom modifications will be lost.")) return;
        const res = await resetEquations();
        if (res.success) {
            alert("Default equations restored successfully.");
            setSelectedEquation(null);
        } else {
            alert(`Failed to reset equations: ${res.error}`);
        }
    };

    const handleExportJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(equations, null, 2));
        const dlAnchorElem = document.createElement("a");
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "cdi_edi_equations.json");
        dlAnchorElem.click();
    };

    const handleImportJSON = (e) => {
        const fileReader = new FileReader();
        if (e.target.files && e.target.files[0]) {
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
                    } else {
                        alert(`Import failed: ${res.error}`);
                    }
                } catch (err) {
                    alert("Failed to parse JSON file.");
                }
            };
        }
    };

    const handleTestRun = () => {
        if (!selectedEquation) return;
        try {
            setTestError(null);
            const sanitizedScope = {};
            Object.keys(testScope).forEach(k => {
                sanitizedScope[k] = Number(testScope[k]);
            });

            const keys = Object.keys(sanitizedScope);
            const values = Object.values(sanitizedScope);
            const fn = new Function(...keys, `return ${selectedEquation.formula};`);
            const resVal = fn(...values);
            if (isNaN(resVal) || resVal === null) {
                setTestError("Evaluation returned NaN or Invalid result.");
                setTestResult(null);
            } else {
                setTestResult(resVal);
            }
        } catch (e) {
            setTestError(e.message);
            setTestResult(null);
        }
    };

    const handleExportPDF = () => {
        generateEngineeringReportPDF({
            user,
            feedWater,
            technology,
            engineering,
            simulation,
            performance,
            optimization: optimizationInputs,
            equations,
            modifications: logsData?.engineeringModifications || []
        });
    };

    return (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", boxSizing: "border-box", background: "#f8fafc" }}>

            {/* Top Navigation Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", background: "white", padding: "12px 20px", borderRadius: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <button
                        onClick={() => setPage("DASHBOARD")}
                        style={{
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            color: "#334155",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600"
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>

                    <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>
                        Equation Management Studio
                    </h2>

                    {/* Role Badge */}
                    <span style={{
                        background: isAdmin ? "#fee2e2" : "#dbeafe",
                        color: isAdmin ? "#991b1b" : "#1e40af",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                    }}>
                        <Shield size={12} /> {user?.role || "User"}
                    </span>
                </div>

                {/* Center Tabs for Administrator ONLY (To view User Activity, Login History, Engineering Modifications, User Accounts) */}
                {isAdmin && (
                    <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "8px", gap: "4px" }}>
                        <button
                            onClick={() => setActiveTab("EQUATION_EDITOR")}
                            style={{
                                border: "none",
                                background: activeTab === "EQUATION_EDITOR" ? "white" : "transparent",
                                color: activeTab === "EQUATION_EDITOR" ? "#2563eb" : "#64748b",
                                fontWeight: "600",
                                padding: "6px 16px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                boxShadow: activeTab === "EQUATION_EDITOR" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                            }}
                        >
                            🧮 Equation Library
                        </button>
                        <button
                            onClick={() => setActiveTab("ADMIN_PANEL")}
                            style={{
                                border: "none",
                                background: activeTab === "ADMIN_PANEL" ? "white" : "transparent",
                                color: activeTab === "ADMIN_PANEL" ? "#2563eb" : "#64748b",
                                fontWeight: "600",
                                padding: "6px 16px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                boxShadow: activeTab === "ADMIN_PANEL" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                            }}
                        >
                            📊 Admin Panel (User Activity & Logs)
                        </button>
                    </div>
                )}

                {/* Right Action Bar - Download System Equations Report available for ALL users */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {isAdmin && activeTab === "EQUATION_EDITOR" && (
                        <button
                            onClick={handleReset}
                            style={{
                                background: "#f1f5f9",
                                border: "1px solid #cbd5e1",
                                color: "#475569",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600"
                            }}
                            title="Restore default equations (Admin ONLY)"
                        >
                            <RotateCcw size={14} /> Reset Defaults
                        </button>
                    )}

                    {activeTab === "EQUATION_EDITOR" && (
                        <button
                            onClick={handleCreateNew}
                            style={{
                                background: "#2563eb",
                                border: "none",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600"
                            }}
                        >
                            <Plus size={14} /> New Equation
                        </button>
                    )}

                    {/* Download System Equations PDF Report - Available to ALL Users */}
                    <button
                        onClick={handleExportPDF}
                        style={{
                            background: "#0f172a",
                            border: "none",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600"
                        }}
                        title="Download System Equations Report (PDF)"
                    >
                        <FileText size={14} /> Download System Equations Report
                    </button>

                    <button
                        onClick={logout}
                        style={{
                            background: "#dc2626",
                            border: "none",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600"
                        }}
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </div>

            {/* TAB 1: ADMIN AUDIT PANEL (Only visible if isAdmin && activeTab === 'ADMIN_PANEL') */}
            {isAdmin && activeTab === "ADMIN_PANEL" ? (
                <div style={{ flex: 1, background: "white", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                onClick={() => setAdminLogSubTab("USER_MANAGEMENT")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: "none",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    background: adminLogSubTab === "USER_MANAGEMENT" ? "#2563eb" : "#f1f5f9",
                                    color: adminLogSubTab === "USER_MANAGEMENT" ? "white" : "#475569",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                <Users size={14} /> User Accounts ({usersList.length})
                            </button>
                            <button
                                onClick={() => setAdminLogSubTab("LOGIN_HISTORY")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: "none",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    background: adminLogSubTab === "LOGIN_HISTORY" ? "#2563eb" : "#f1f5f9",
                                    color: adminLogSubTab === "LOGIN_HISTORY" ? "white" : "#475569"
                                }}
                            >
                                🔑 Login History ({logsData.loginHistory.length})
                            </button>
                            <button
                                onClick={() => setAdminLogSubTab("USER_ACTIVITY")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: "none",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    background: adminLogSubTab === "USER_ACTIVITY" ? "#2563eb" : "#f1f5f9",
                                    color: adminLogSubTab === "USER_ACTIVITY" ? "white" : "#475569"
                                }}
                            >
                                📋 User Activity ({logsData.userActivity.length})
                            </button>
                            <button
                                onClick={() => setAdminLogSubTab("ENGINEERING_MODS")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border: "none",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    background: adminLogSubTab === "ENGINEERING_MODS" ? "#2563eb" : "#f1f5f9",
                                    color: adminLogSubTab === "ENGINEERING_MODS" ? "white" : "#475569"
                                }}
                            >
                                ⚙️ Engineering Modifications ({logsData.engineeringModifications.length})
                            </button>
                        </div>

                        <button
                            onClick={fetchAdminData}
                            disabled={logsLoading}
                            style={{
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            <RefreshCw size={14} className={logsLoading ? "spin" : ""} /> Refresh Admin Data
                        </button>
                    </div>

                    {logsError && (
                        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", padding: "10px 14px", borderRadius: "6px", marginBottom: "15px", fontSize: "13px" }}>
                            {logsError}
                        </div>
                    )}

                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {/* USER MANAGEMENT SUB-TAB */}
                        {adminLogSubTab === "USER_MANAGEMENT" && (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                                        <th style={{ padding: "10px" }}>Full Name</th>
                                        <th style={{ padding: "10px" }}>Email / Username</th>
                                        <th style={{ padding: "10px" }}>Company / University</th>
                                        <th style={{ padding: "10px" }}>Role</th>
                                        <th style={{ padding: "10px" }}>Status</th>
                                        <th style={{ padding: "10px" }}>Created Date</th>
                                        <th style={{ padding: "10px" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersList.length === 0 ? (
                                        <tr><td colSpan="7" style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No registered user accounts.</td></tr>
                                    ) : (
                                        usersList.map((u) => (
                                            <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "10px", fontWeight: "600", color: "#1e293b" }}>{u.fullName || u.username}</td>
                                                <td style={{ padding: "10px" }}>{u.email || u.username}</td>
                                                <td style={{ padding: "10px" }}>{u.company || "N/A"}</td>
                                                <td style={{ padding: "10px" }}>
                                                    <span style={{
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "11px",
                                                        fontWeight: "bold",
                                                        background: u.role === "Administrator" ? "#fee2e2" : "#dbeafe",
                                                        color: u.role === "Administrator" ? "#991b1b" : "#1e40af"
                                                    }}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "10px", color: "#166534", fontWeight: "600" }}>{u.status}</td>
                                                <td style={{ padding: "10px" }}>{u.createdDate ? new Date(u.createdDate).toLocaleDateString() : "-"}</td>
                                                <td style={{ padding: "10px" }}>
                                                    {u.role !== "Administrator" && u.id !== "u-admin" ? (
                                                        <div style={{ display: "flex", gap: "6px" }}>
                                                            <button
                                                                onClick={() => handleResetUserPassword(u.id, u.fullName || u.email)}
                                                                style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                                                                title="Reset User Password"
                                                            >
                                                                <Key size={12} /> Reset Password
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id, u.fullName || u.email)}
                                                                style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                                                                title="Delete User Account"
                                                            >
                                                                <Trash2 size={12} /> Delete
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>System Admin</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* LOGIN HISTORY SUB-TAB */}
                        {adminLogSubTab === "LOGIN_HISTORY" && (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                                        <th style={{ padding: "10px" }}>Login Time</th>
                                        <th style={{ padding: "10px" }}>Logout Time</th>
                                        <th style={{ padding: "10px" }}>User Name</th>
                                        <th style={{ padding: "10px" }}>Email</th>
                                        <th style={{ padding: "10px" }}>Role</th>
                                        <th style={{ padding: "10px" }}>Status</th>
                                        <th style={{ padding: "10px" }}>IP Address</th>
                                        <th style={{ padding: "10px" }}>Browser</th>
                                        <th style={{ padding: "10px" }}>OS</th>
                                        <th style={{ padding: "10px" }}>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logsData.loginHistory.length === 0 ? (
                                        <tr><td colSpan="10" style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No login history records found.</td></tr>
                                    ) : (
                                        logsData.loginHistory.map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "10px" }}>{row.loginTime}</td>
                                                <td style={{ padding: "10px" }}>{row.logoutTime}</td>
                                                <td style={{ padding: "10px", fontWeight: "600", color: "#1e293b" }}>{row.username}</td>
                                                <td style={{ padding: "10px" }}>{row.email}</td>
                                                <td style={{ padding: "10px" }}>{row.role}</td>
                                                <td style={{ padding: "10px" }}>
                                                    <span style={{
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "11px",
                                                        fontWeight: "bold",
                                                        background: row.status === "LOGIN" ? "#dcfce7" : row.status === "FAILED LOGIN" ? "#fee2e2" : "#f1f5f9",
                                                        color: row.status === "LOGIN" ? "#166534" : row.status === "FAILED LOGIN" ? "#991b1b" : "#475569"
                                                    }}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "10px", fontFamily: "monospace" }}>{row.ip}</td>
                                                <td style={{ padding: "10px" }}>{row.browser}</td>
                                                <td style={{ padding: "10px" }}>{row.os}</td>
                                                <td style={{ padding: "10px" }}>{row.sessionDuration}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* USER ACTIVITY SUB-TAB */}
                        {adminLogSubTab === "USER_ACTIVITY" && (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                                        <th style={{ padding: "10px" }}>Date</th>
                                        <th style={{ padding: "10px" }}>Time</th>
                                        <th style={{ padding: "10px" }}>User</th>
                                        <th style={{ padding: "10px" }}>Email</th>
                                        <th style={{ padding: "10px" }}>Activity</th>
                                        <th style={{ padding: "10px" }}>Module</th>
                                        <th style={{ padding: "10px" }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logsData.userActivity.length === 0 ? (
                                        <tr><td colSpan="7" style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No user activity records found.</td></tr>
                                    ) : (
                                        logsData.userActivity.map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "10px" }}>{row.date}</td>
                                                <td style={{ padding: "10px" }}>{row.time}</td>
                                                <td style={{ padding: "10px", fontWeight: "600", color: "#1e293b" }}>{row.user}</td>
                                                <td style={{ padding: "10px" }}>{row.email}</td>
                                                <td style={{ padding: "10px", fontWeight: "600", color: "#2563eb" }}>{row.activity}</td>
                                                <td style={{ padding: "10px" }}>{row.module}</td>
                                                <td style={{ padding: "10px", color: "#475569" }}>{row.details}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* ENGINEERING MODS SUB-TAB */}
                        {adminLogSubTab === "ENGINEERING_MODS" && (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                                        <th style={{ padding: "10px" }}>Date</th>
                                        <th style={{ padding: "10px" }}>User</th>
                                        <th style={{ padding: "10px" }}>Email</th>
                                        <th style={{ padding: "10px" }}>Module</th>
                                        <th style={{ padding: "10px" }}>Parameter</th>
                                        <th style={{ padding: "10px" }}>Old Value</th>
                                        <th style={{ padding: "10px" }}>New Value</th>
                                        <th style={{ padding: "10px" }}>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logsData.engineeringModifications.length === 0 ? (
                                        <tr><td colSpan="8" style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No engineering modification records found.</td></tr>
                                    ) : (
                                        logsData.engineeringModifications.map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "10px" }}>{row.date}</td>
                                                <td style={{ padding: "10px", fontWeight: "600", color: "#1e293b" }}>{row.user}</td>
                                                <td style={{ padding: "10px" }}>{row.email}</td>
                                                <td style={{ padding: "10px" }}>{row.module}</td>
                                                <td style={{ padding: "10px", fontWeight: "600" }}>{row.parameter}</td>
                                                <td style={{ padding: "10px", color: "#dc2626" }}>{row.oldValue}</td>
                                                <td style={{ padding: "10px", color: "#16a34a", fontWeight: "bold" }}>{row.newValue}</td>
                                                <td style={{ padding: "10px", color: "#475569" }}>{row.reason}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                /* TAB 2: EQUATION LIBRARY EDITOR */
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
                                <p style={{ color: "#666" }}>Select an engineering equation from the list to view or edit.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                                {/* Card 1: Core Fields */}
                                <div style={{ background: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                                        <input
                                            type="text"
                                            value={selectedEquation.name}
                                            onChange={(e) => handleFieldChange("name", e.target.value)}
                                            style={{ fontSize: "20px", fontWeight: "bold", border: "1px solid #ccc", borderRadius: "4px", padding: "4px 8px", width: "70%" }}
                                        />
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <select
                                                value={selectedEquation.category}
                                                onChange={(e) => handleFieldChange("category", e.target.value)}
                                                style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "12px" }}
                                            >
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>

                                            {/* Delete Button - Administrator or Custom Equation */}
                                            {(isAdmin || selectedEquation.id.includes("custom")) && (
                                                <button
                                                    onClick={() => handleDeleteEquation(selectedEquation.id)}
                                                    style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer" }}
                                                    title="Delete Equation"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                                        <div>
                                            <label style={{ fontWeight: "bold", color: "#555", display: "block", marginBottom: "4px" }}>Description</label>
                                            <input
                                                type="text"
                                                value={selectedEquation.description || ""}
                                                onChange={(e) => handleFieldChange("description", e.target.value)}
                                                style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: "bold", color: "#555", display: "block", marginBottom: "4px" }}>Units</label>
                                            <input
                                                type="text"
                                                value={selectedEquation.units || ""}
                                                onChange={(e) => handleFieldChange("units", e.target.value)}
                                                style={{ width: "200px", padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Formula & Variables */}
                                <div style={{ background: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                                    <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", color: "#1976d2" }}>Formula Engine</h3>

                                    <div style={{ marginBottom: "15px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "5px" }}>Formula Expression</label>
                                        <textarea
                                            rows={3}
                                            value={selectedEquation.formula}
                                            onChange={(e) => handleFieldChange("formula", e.target.value)}
                                            style={{
                                                width: "100%",
                                                fontFamily: "monospace",
                                                fontSize: "15px",
                                                padding: "10px",
                                                borderRadius: "4px",
                                                border: formulaError ? "2px solid #c62828" : "1px solid #ccc",
                                                boxSizing: "border-box"
                                            }}
                                        />
                                        {formulaError && (
                                            <div style={{ color: "#c62828", fontSize: "12px", marginTop: "5px", fontWeight: "bold" }}>
                                                ⚠️ Syntax Error: {formulaError}
                                            </div>
                                        )}
                                    </div>

                                    {/* Real-time Variable Parser & Simulation Preview */}
                                    <div>
                                        <h4 style={{ fontSize: "14px", margin: "0 0 10px 0", color: "#555" }}>Detected Variable Parameters ({variablesUsed.length})</h4>
                                        {variablesUsed.length === 0 ? (
                                            <p style={{ fontSize: "12px", color: "#888" }}>No variables detected or formula is empty.</p>
                                        ) : (
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                                                {variablesUsed.map(varName => (
                                                    <div key={varName} style={{ background: "#f5f5f5", padding: "8px 12px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: "13px" }}>{varName}:</span>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={testScope[varName] !== undefined ? testScope[varName] : 1.0}
                                                            onChange={(e) => setTestScope({ ...testScope, [varName]: parseFloat(e.target.value) || 0 })}
                                                            style={{ width: "80px", padding: "4px", fontSize: "12px", textAlign: "right" }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleTestRun}
                                            style={{
                                                marginTop: "15px",
                                                background: "#1976d2",
                                                color: "white",
                                                border: "none",
                                                padding: "8px 16px",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}
                                        >
                                            <Play size={14} /> Live Calculation Test
                                        </button>

                                        {testResult !== null && (
                                            <div style={{ marginTop: "12px", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", color: "#166534", fontWeight: "bold" }}>
                                                Calculation Result: {format(testResult, 4)} {selectedEquation.units}
                                            </div>
                                        )}
                                        {testError && (
                                            <div style={{ marginTop: "12px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: "13px" }}>
                                                {testError}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Save Button Bar */}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "40px" }}>
                                    <button
                                        onClick={handleSave}
                                        style={{
                                            background: "#16a34a",
                                            color: "white",
                                            border: "none",
                                            padding: "10px 25px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                            fontSize: "14px",
                                            boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
                                        }}
                                    >
                                        Save &amp; Activate Formula
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
