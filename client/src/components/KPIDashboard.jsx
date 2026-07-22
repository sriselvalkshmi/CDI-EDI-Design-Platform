import React from "react";
import { useApp } from "../context/AppContext";

export default function KPIDashboard() {
    const { designResult } = useApp();

    const format = (value, digits = 2) => {
        if (value === undefined || value === null || isNaN(value)) {
            return "N/A";
        }
        return Number(value).toFixed(digits);
    };

    if (!designResult || !designResult.kpi || designResult.kpi.outletTDS == null) {
        return (
            <div className="panel">
                <h3 className="panel-title">Key Performance Indicators</h3>
                <p style={{ color: "#6B7280", fontSize: "14px", margin: "10px 0 0 0" }}>Generate a design to calculate KPIs.</p>
            </div>
        );
    }

    const engineering = designResult?.engineering;
    const kpi = designResult?.kpi;
    const outletTDS = format(kpi?.outletTDS);
    const removalEff = format(kpi?.removalEfficiency);
    const power = format(engineering?.power ?? kpi?.power);
    const sec = format(kpi?.SEC, 4);
    const flowVel = format(engineering?.flowVelocity ?? kpi?.flowVelocity, 3);
    const pressDrop = format(engineering?.pressureDrop ?? kpi?.pressureDrop, 1);
    const activeTech = engineering?.technology || kpi?.technology || "-";

    return (
        <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 className="panel-title" style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>Key Performance Indicators</h3>
                <span style={{ fontSize: "12px", background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: "12px", fontWeight: "600" }}>● {activeTech} System</span>
            </div>

            <div className="kpi-grid-container" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {/* Card 1: Outlet TDS */}
                <div className="kpi-card" style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500", marginBottom: "4px" }}>Outlet TDS</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937" }}>{outletTDS} <span style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280" }}>ppm</span></div>
                    <div style={{ fontSize: "11px", color: "#16A34A", marginTop: "4px", fontWeight: "600" }}>↓ {removalEff}% Removal</div>
                </div>

                {/* Card 2: Power Consumption */}
                <div className="kpi-card" style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500", marginBottom: "4px" }}>Power Consumption</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937" }}>{power} <span style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280" }}>W</span></div>
                    <div style={{ fontSize: "11px", color: "#2563EB", marginTop: "4px" }}>DC Power</div>
                </div>

                {/* Card 3: Specific Energy */}
                <div className="kpi-card" style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500", marginBottom: "4px" }}>Specific Energy</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937" }}>{sec} <span style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280" }}>kWh/m³</span></div>
                    <div style={{ fontSize: "11px", color: "#2563EB", marginTop: "4px" }}>SEC Index</div>
                </div>

                {/* Card 4: Removal Efficiency */}
                <div className="kpi-card" style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500", marginBottom: "4px" }}>Removal Efficiency</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937" }}>{removalEff}%</div>
                    <div style={{ fontSize: "11px", color: "#16A34A", marginTop: "4px" }}>Desalination Rate</div>
                </div>

                {/* Card 5: Flow Velocity */}
                <div className="kpi-card" style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500", marginBottom: "4px" }}>Flow Velocity</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937" }}>{flowVel} <span style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280" }}>m/s</span></div>
                    <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>{engineering?.flowRegime || "Laminar"}</div>
                </div>

                {/* Card 6: Pressure Drop */}
                <div className="kpi-card" style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500", marginBottom: "4px" }}>Pressure Drop</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937" }}>{pressDrop} <span style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280" }}>Pa</span></div>
                    <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>Hydraulic Loss</div>
                </div>
            </div>
        </div>
    );
}