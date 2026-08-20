import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { generateEngineeringReportPDF } from "../utils/reportGenerator";
import { exportDesignReportToExcel } from "../services/excelExporter";
import { Cpu, FileText, Download, Shield, LogOut, User, Lock, Key, X } from "lucide-react";

export default function Navbar() {
    const {
        page,
        setPage,
        designResult,
        feedWater,
        technology,
        equations
    } = useApp();

    const { currentUser, currentRole, logout } = useAuth();
    const isAdmin = currentRole === "Administrator" || (currentUser && currentUser.email?.toLowerCase() === "admin@cdiedi.com");

    const [showEquationAuthModal, setShowEquationAuthModal] = useState(false);
    const [equationEmail, setEquationEmail] = useState("");
    const [equationPassword, setEquationPassword] = useState("");
    const [equationAuthError, setEquationAuthError] = useState("");
    const [isEquationUnlocked, setIsEquationUnlocked] = useState(false);

    const eng = designResult?.engineering || {};
    const feed = designResult?.input?.feedWater || feedWater || {};
    const tech = designResult?.selectedTechnology || eng.technology || (technology !== "AUTO" ? technology : "MCDI");

    const handleExportPDF = () => {
        try {
            generateEngineeringReportPDF({
                user: { fullName: currentUser?.fullName || "Lead Process Engineer", role: currentRole || "Process Engineer" },
                feedWater: feed,
                technology: tech,
                aiResult: designResult?.aiRecommendation,
                engineering: eng,
                simulation: designResult?.simulation,
                performance: designResult?.performance,
                optimization: designResult?.optimizedEngineering,
                equations
            });
        } catch (e) {
            console.error("PDF generation error:", e);
        }
    };

    const handleExportExcel = () => {
        try {
            exportDesignReportToExcel(designResult);
        } catch (err) {
            console.error("Excel Export Error:", err);
        }
    };

    const handleOpenEquationEditor = () => {
        if (page === "EQUATION_EDITOR") {
            setPage("DASHBOARD");
        } else {
            setPage("EQUATION_EDITOR");
        }
    };

    return (
        <>
            <header style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 20px",
                height: "48px",
                background: "#FFFFFF",
                color: "#0F172A",
                borderBottom: "1px solid #E2E8F0",
                userSelect: "none",
                boxSizing: "border-box",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)"
            }}>
                {/* BRAND & LOGO */}
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div
                        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                        onClick={() => setPage("DASHBOARD")}
                        title="Return to Main Dashboard"
                    >
                        <div style={{ background: "#2563EB", padding: "5px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Cpu size={14} color="#FFFFFF" />
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", letterSpacing: "-0.01em" }}>
                            CDI-EDI Design Platform
                        </span>
                    </div>
                </div>

                {/* RIGHT SIDE TOOLS: EXPORT, EQUATION EDITOR (PASSWORD PROTECTED), ADMIN PANEL & USER */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                        onClick={handleExportExcel}
                        title="Export Design Package to Excel (.xlsx)"
                        style={{
                            background: "#F8FAFC",
                            color: "#334155",
                            border: "1px solid #CBD5E1",
                            padding: "5px 9px",
                            borderRadius: "4px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        <Download size={12} color="#2563EB" />
                        <span>Export Excel</span>
                    </button>

                    <button
                        onClick={handleExportPDF}
                        title="Export Engineering Report (.pdf)"
                        style={{
                            background: "#F8FAFC",
                            color: "#334155",
                            border: "1px solid #CBD5E1",
                            padding: "5px 9px",
                            borderRadius: "4px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        <FileText size={12} color="#2563EB" />
                        <span>Export PDF</span>
                    </button>

                    {/* EQUATION EDITOR (PASSWORD PROTECTED) */}
                    <button
                        onClick={handleOpenEquationEditor}
                        title="Access Governing Equation Registry (Password Protected)"
                        style={{
                            background: page === "EQUATION_EDITOR" ? "#2563EB" : "#F8FAFC",
                            color: page === "EQUATION_EDITOR" ? "#FFFFFF" : "#1E293B",
                            border: page === "EQUATION_EDITOR" ? "1px solid #1D4ED8" : "1px solid #CBD5E1",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        <Lock size={12} color={page === "EQUATION_EDITOR" ? "#FFFFFF" : "#D97706"} />
                        <span>{page === "EQUATION_EDITOR" ? "Dashboard View" : "Equation Editor"}</span>
                    </button>

                    {/* ADMIN PANEL */}
                    <button
                        onClick={() => setPage(page === "ADMIN_DASHBOARD" ? "DASHBOARD" : "ADMIN_DASHBOARD")}
                        title="Open Administrative & System Audit Dashboard"
                        style={{
                            background: page === "ADMIN_DASHBOARD" ? "#7C3AED" : "#F8FAFC",
                            color: page === "ADMIN_DASHBOARD" ? "#FFFFFF" : "#6D28D9",
                            border: page === "ADMIN_DASHBOARD" ? "1px solid #5B21B6" : "1px solid #DDD6FE",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        <Shield size={12} color={page === "ADMIN_DASHBOARD" ? "#FFFFFF" : "#7C3AED"} />
                        <span>{page === "ADMIN_DASHBOARD" ? "Dashboard" : "Admin Panel"}</span>
                    </button>

                    {/* USER PROFILE & LOGOUT */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", borderLeft: "1px solid #E2E8F0", paddingLeft: "12px", marginLeft: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ background: "#F1F5F9", padding: "4px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <User size={12} color="#64748B" />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1.15" }}>
                                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#1E293B" }}>
                                    {currentUser?.fullName || currentUser?.email?.split("@")[0] || "Administrator"}
                                </span>
                                <span style={{ fontSize: "9.5px", color: "#64748B" }}>
                                    {currentRole || "Process Engineer"}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            title="Logout session"
                            style={{
                                background: "#FEF2F2",
                                color: "#DC2626",
                                border: "1px solid #FECACA",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "600",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                            }}
                        >
                            <LogOut size={12} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>
        </>
    );
}