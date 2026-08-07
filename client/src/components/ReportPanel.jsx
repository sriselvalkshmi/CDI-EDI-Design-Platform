import React from "react";
import { useApp } from "../context/AppContext";
import { exportDesignReportToExcel } from "../services/excelExporter";

export default function ReportPanel() {
    const { designResult } = useApp();

    if (!designResult || !designResult.engineering) {
        return null;
    }

    const handleExportExcel = () => {
        try {
            exportDesignReportToExcel(designResult);
        } catch (err) {
            console.error("Excel Export Error:", err);
        }
    };

    return (
        <div className="panel report-panel" style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "14px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                    Engineering Reports
                </h3>

                {/* Single Clean Excel Export Button */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                        onClick={handleExportExcel}
                        style={{
                            padding: "8px 18px",
                            background: "#16A34A",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: "700",
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        Export Excel
                    </button>
                </div>
            </div>
        </div>
    );
}
