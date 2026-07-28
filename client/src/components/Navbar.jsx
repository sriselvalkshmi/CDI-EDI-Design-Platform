import React from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { generateEngineeringReportPDF } from "../utils/reportGenerator";
import { Shield, Calculator, FileText, LogOut, User, LayoutDashboard } from "lucide-react";

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

    const rawRole = currentRole || appUser?.role || "User";
    const userRole = (rawRole === "Administrator" || currentUser?.email?.toLowerCase() === "admin@cdiedi.com") ? "Administrator" : "User";

    const handleExportReport = () => {
        generateEngineeringReportPDF({
            user: { fullName: userRole, role: userRole },
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
        <header className="navbar" style={styles.navContainer}>
            <div style={styles.brandGroup}>
                <h1
                    style={{ ...styles.navTitle, cursor: "pointer" }}
                    onClick={() => setPage("DASHBOARD")}
                    title="Click to go to Main Dashboard"
                >
                    CDI / EDI Design Platform
                </h1>

                {/* ROLE ONLY DISPLAY (NO PERSONAL NAME) */}
                <div style={styles.userBadgeBox}>
                    <User size={14} color="#64748B" />
                    <span style={styles.rolePill(userRole)}>{userRole}</span>
                </div>
            </div>

            <div style={styles.userSection}>
                {page === "EQUATION_EDITOR" && (
                    <button
                        onClick={() => setPage("DASHBOARD")}
                        style={styles.mainDashBtn}
                        title="Return to Main Engineering Dashboard"
                    >
                        <LayoutDashboard size={15} />
                        <span>Main Dashboard</span>
                    </button>
                )}

                <button
                    onClick={handleExportReport}
                    style={styles.reportBtn}
                    title="Export Complete Engineering Report PDF"
                >
                    <FileText size={15} />
                    <span>Export Engineering Report</span>
                </button>

                <button
                    onClick={() => setPage(page === "EQUATION_EDITOR" ? "DASHBOARD" : "EQUATION_EDITOR")}
                    style={page === "EQUATION_EDITOR" ? styles.activeEqBtn : styles.equationBtn}
                    title="Equation Editor & Formulas"
                >
                    <Calculator size={15} />
                    <span>Equation Editor</span>
                </button>

                {/* ONLY RENDER ONE BUTTON FOR ADMINISTRATORS: ADMIN DASHBOARD OR MAIN DASHBOARD */}
                {userRole === "Administrator" && (
                    page === "ADMIN_DASHBOARD" ? (
                        <button
                            onClick={() => setPage("DASHBOARD")}
                            style={styles.mainDashBtn}
                            title="Return to Main Engineering Dashboard"
                        >
                            <LayoutDashboard size={15} />
                            <span>Main Dashboard</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setPage("ADMIN_DASHBOARD")}
                            style={styles.adminBtn}
                            title="Enterprise Security & Admin Dashboard"
                        >
                            <Shield size={15} />
                            <span>Admin Dashboard</span>
                        </button>
                    )
                )}

                <button
                    onClick={logout}
                    style={styles.logoutBtn}
                    title="Sign out of system"
                >
                    <LogOut size={15} />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
}

const styles = {
    navContainer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 20px",
        background: "#FFFFFF",
        borderBottom: "1px solid #D9E2EC",
        height: "60px",
        boxSizing: "border-box",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
    },
    brandGroup: {
        display: "flex",
        alignItems: "center",
        gap: "14px"
    },
    navTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#0F172A",
        margin: 0,
        letterSpacing: "-0.3px"
    },
    userBadgeBox: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "#F8FAFC",
        border: "1px solid #E2E8F0",
        padding: "4px 10px",
        borderRadius: "20px"
    },
    rolePill: (role) => ({
        fontSize: "12px",
        fontWeight: "700",
        color: role === "Administrator" ? "#1D4ED8" : "#047857"
    }),
    userSection: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    mainDashBtn: {
        backgroundColor: "#0F172A",
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
    reportBtn: {
        backgroundColor: "#F1F5F9",
        color: "#334155",
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
    equationBtn: {
        backgroundColor: "#EFF6FF",
        color: "#2563EB",
        border: "1px solid #BFDBFE",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    activeEqBtn: {
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        border: "1px solid #2563EB",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    adminBtn: {
        backgroundColor: "#2563EB",
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
    activeAdminBtn: {
        backgroundColor: "#1E40AF",
        color: "#FFFFFF",
        border: "1px solid #1D4ED8",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    logoutBtn: {
        backgroundColor: "#FEF2F2",
        color: "#DC2626",
        border: "1px solid #FCA5A5",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    }
};