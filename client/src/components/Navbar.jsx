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
        <header className="navbar" style={styles.navContainer}>
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
        </header>
    );
}

const styles = {
    navContainer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 20px",
        background: "#ffffff",
        borderBottom: "1px solid #D9E2EC",
        height: "56px",
        boxSizing: "border-box",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        flexShrink: 0
    },
    brandGroup: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    navTitle: {
        fontSize: "24px",
        fontWeight: "700",
        color: "#0F172A",
        margin: 0,
        letterSpacing: "-0.5px"
    },
    userSection: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    reportBtn: {
        backgroundColor: "#0F172A",
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
        backgroundColor: "#1565C0",
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
        backgroundColor: "#C62828",
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