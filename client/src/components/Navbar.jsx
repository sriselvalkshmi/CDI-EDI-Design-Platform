import React from "react";
import { useApp } from "../context/AppContext";
import { generateEngineeringReportPDF } from "../utils/reportGenerator";

export default function Navbar() {
    const {
        setPage,
        logout,
        user,
        isAuthenticated,
        designResult,
        technology,
        equations
    } = useApp();

    const handleExportReport = () => {
        generateEngineeringReportPDF({
            user,
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
                <h1 style={styles.navTitle}>CDI / EDI Design Platform</h1>
            </div>

            <div style={styles.userSection}>
                <button
                    onClick={handleExportReport}
                    style={styles.reportBtn}
                    title="Export Complete Engineering Report PDF"
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
        background: "#FFFFFF",
        borderBottom: "1px solid #D9E2EC",
        height: "60px",
        boxSizing: "border-box",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        flexShrink: 0
    },
    brandGroup: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    navTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#1F2937",
        margin: 0,
        letterSpacing: "-0.3px"
    },
    userSection: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    reportBtn: {
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
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
        backgroundColor: "#1F2937",
        color: "#FFFFFF",
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
        backgroundColor: "#DC2626",
        color: "#FFFFFF",
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