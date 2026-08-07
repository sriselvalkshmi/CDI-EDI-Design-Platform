import React from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { generateEngineeringReportPDF } from "../utils/reportGenerator";
import { Cpu, FileText, Calculator, Shield, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
    const {
        page,
        setPage,
        user: appUser,
        designResult,
        technology,
        equations
    } = useApp();

    const { currentUser, currentRole, logout } = useAuth();
    const isAdmin = currentRole === "Administrator" || (currentUser && currentUser.email?.toLowerCase() === "admin@cdiedi.com");

    const handleExportReport = () => {
        generateEngineeringReportPDF({
            user: { fullName: appUser?.role || "User", role: appUser?.role || "User" },
            feedWater: designResult?.input?.feedWater,
            technology: designResult?.input?.technology || technology,
            aiResult: designResult?.aiRecommendation,
            engineering: designResult?.engineering,
            simulation: designResult?.simulation,
            performance: designResult?.performance,
            optimization: designResult?.optimizedEngineering,
            equations
        });
    };

    return (
        <header className="navbar" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 16px",
            background: "#FFFFFF",
            borderBottom: "1px solid #CBD5E1",
            height: "40px",
            boxSizing: "border-box",
            userSelect: "none"
        }}>
            {/* LEFT: BRAND TITLE */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => setPage("DASHBOARD")}>
                <div style={{ background: "#2563EB", padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Cpu size={15} color="#FFFFFF" />
                </div>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.2px" }}>
                    CDI / EDI Design Platform
                </span>
            </div>

            {/* RIGHT: ACTIONS & USER PROFILE */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* User Role Badge */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#F1F5F9",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: isAdmin ? "#2563EB" : "#475569"
                }}>
                    {isAdmin ? <Shield size={13} color="#2563EB" /> : null}
                    <span>{currentUser?.fullName || (isAdmin ? "Administrator" : "John Smith")}</span>
                </div>

                {/* Export Engineering Report Button */}
                <button
                    onClick={handleExportReport}
                    style={{
                        background: "#EFF6FF",
                        color: "#2563EB",
                        border: "1px solid #BFDBFE",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                    }}
                >
                    <FileText size={13} />
                    <span>Export Engineering Report</span>
                </button>

                {/* Equation Editor Button */}
                <button
                    onClick={() => setPage("EQUATION_EDITOR")}
                    style={{
                        background: page === "EQUATION_EDITOR" ? "#2563EB" : "#F8FAFC",
                        color: page === "EQUATION_EDITOR" ? "#FFFFFF" : "#334155",
                        border: "1px solid #CBD5E1",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                    }}
                >
                    <Calculator size={13} />
                    <span>Equation Editor</span>
                </button>

                {/* Admin Dashboard Button (Admin Only) */}
                {isAdmin && (
                    <button
                        onClick={() => setPage("ADMIN_DASHBOARD")}
                        style={{
                            background: page === "ADMIN_DASHBOARD" ? "#2563EB" : "#F8FAFC",
                            color: page === "ADMIN_DASHBOARD" ? "#FFFFFF" : "#334155",
                            border: "1px solid #CBD5E1",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        <LayoutDashboard size={13} />
                        <span>Admin Dashboard</span>
                    </button>
                )}

                {/* Logout Button */}
                <button
                    onClick={logout}
                    title="Logout of session"
                    style={{
                        background: "#FEF2F2",
                        color: "#DC2626",
                        border: "1px solid #FCA5A5",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                    }}
                >
                    <LogOut size={13} />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
}