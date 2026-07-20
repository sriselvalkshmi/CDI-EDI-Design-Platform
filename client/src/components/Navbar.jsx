import React from "react";
import { useApp } from "../context/AppContext";
import { generateEngineeringReportPDF } from "../utils/reportGenerator";

export default function Navbar() {
    const {
        setPage,
        logout,
        user,
        isAuthenticated,
        feedWater,
        technology,
        aiResult,
        engineering,
        simulation,
        performance,
        optimization,
        equations
    } = useApp();

    const handleExportReport = () => {
        generateEngineeringReportPDF({
            user,
            feedWater,
            technology,
            aiResult,
            engineering,
            simulation,
            performance,
            optimization,
            equations
        });
    };

    return (
        <div className="navbar" style={styles.navContainer}>
            <div style={styles.brandGroup}>
                <h1 style={styles.navTitle}>CDI / EDI Design Platform</h1>
            </div>

            <div style={styles.userSection}>
                <button
                    onClick={handleExportReport}
                    style={styles.reportBtn}
                    title="Generate & Download Complete Engineering PDF Report"
                >
                    📄 Export Engineering Report
                </button>

                <button
                    onClick={() => setPage("EQUATION_EDITOR")}
                    style={styles.equationBtn}
                >
                    🧮 Equation Editor
                </button>

                {isAuthenticated && (
                    <button
                        onClick={logout}
                        style={styles.logoutBtn}
                    >
                        Logout 🚪
                    </button>
                )}
            </div>
        </div>
    );
}

const styles = {
    navContainer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 20px",
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        height: "60px",
        boxSizing: "border-box",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        fontFamily: "'Segoe UI', Roboto, sans-serif"
    },
    brandGroup: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    navTitle: {
        fontSize: "18px",
        fontWeight: "600",
        color: "#1e293b",
        margin: 0
    },
    userSection: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    reportBtn: {
        backgroundColor: "#0f172a",
        color: "#ffffff",
        border: "none",
        padding: "8px 14px",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "13px",
        cursor: "pointer",
        transition: "background-color 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    equationBtn: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        padding: "8px 16px",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "13px",
        cursor: "pointer",
        transition: "background-color 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    logoutBtn: {
        backgroundColor: "#dc2626",
        color: "#ffffff",
        border: "none",
        padding: "8px 14px",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "13px",
        cursor: "pointer",
        transition: "background-color 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    }
};