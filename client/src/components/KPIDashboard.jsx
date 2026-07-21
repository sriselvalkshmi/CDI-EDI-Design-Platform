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
                <h3 className="panel-title">System Performance KPI</h3>
                <p style={{ color: "#607D8B", fontSize: "14px", margin: "10px 0 0 0" }}>Generate a design to calculate KPIs.</p>
            </div>
        );
    }

    const engineering = designResult?.engineering;
    const kpi = designResult?.kpi;
    const outletTDS = format(kpi?.outletTDS);
    const removalEff = format(kpi?.removalEfficiency);
    const power = format(engineering?.power ?? kpi?.power);
    const sec = format(kpi?.SEC, 3);
    const flowVel = format(engineering?.flowVelocity ?? kpi?.flowVelocity);
    const pressDrop = format(engineering?.pressureDrop ?? kpi?.pressureDrop);
    const activeTech = engineering?.technology || kpi?.technology || "-";

    return (
        <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 className="panel-title" style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#263238" }}>System Performance KPI</h3>
                <span style={{ fontSize: "12px", background: "#E8F5E9", color: "#2E7D32", padding: "4px 8px", borderRadius: "12px", fontWeight: "600" }}>● {activeTech} Operational</span>
            </div>
            <div className="kpi-grid-container">
                {/* Card 1: Outlet TDS */}
                <div className="kpi-card">
                    <div className="kpi-card-title">Outlet TDS</div>
                    <div className="kpi-card-value">{outletTDS}<span style={{ fontSize: "11px", fontWeight: "500", color: "#607D8B" }}>ppm</span></div>
                    <div className="kpi-card-subtitle">↓ {removalEff}% Removal</div>
                </div>
                {/* Card 2: Power Consumption */}
                <div className="kpi-card">
                    <div className="kpi-card-title">Power Consumption</div>
                    <div className="kpi-card-value">{power}<span style={{ fontSize: "11px", fontWeight: "500", color: "#607D8B" }}>W</span></div>
                    <div className="kpi-card-subtitle">DC Stack Power</div>
                </div>
                {/* Card 3: Specific Energy */}
                <div className="kpi-card">
                    <div className="kpi-card-title">Specific Energy</div>
                    <div className="kpi-card-value">{sec}<span style={{ fontSize: "11px", fontWeight: "500", color: "#607D8B" }}>kWh/m³</span></div>
                    <div className="kpi-card-subtitle">High Efficiency</div>
                </div>
                {/* Card 4: Removal Efficiency */}
                <div className="kpi-card">
                    <div className="kpi-card-title">Removal Efficiency</div>
                    <div className="kpi-card-value">{removalEff}%</div>
                    <div className="kpi-card-subtitle">Desalination Rate</div>
                </div>
                {/* Card 5: Flow Velocity */}
                <div className="kpi-card">
                    <div className="kpi-card-title">Flow Velocity</div>
                    <div className="kpi-card-value">{flowVel}<span style={{ fontSize: "11px", fontWeight: "500", color: "#607D8B" }}>m/s</span></div>
                    <div className="kpi-card-subtitle">Laminar Flow</div>
                </div>
                {/* Card 6: Pressure Drop */}
                <div className="kpi-card">
                    <div className="kpi-card-title">Pressure Drop</div>
                    <div className="kpi-card-value">{pressDrop}<span style={{ fontSize: "11px", fontWeight: "500", color: "#607D8B" }}>Pa</span></div>
                    <div className="kpi-card-subtitle">Hydraulic Loss</div>
                </div>
            </div>
            {designResult.optimization && designResult.optimization.originalAIDesign && (
                <div style={{ marginTop: "12px", borderTop: "1px solid #E0E6ED", paddingTop: "12px" }}>
                    <div style={{ fontSize: "13px", color: "#1565C0", fontWeight: "600", marginBottom: "8px" }}>AI Design vs User Optimized Design</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div style={{ padding: "8px", background: "#F1F5F9", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "12px" }}>
                            <div style={{ fontWeight: "600", color: "#475569", marginBottom: "4px" }}>AI Design</div>
                            <div>Voltage: <b>{designResult.optimization.originalAIDesign.voltage} V</b></div>
                            <div>Power: <b>{designResult.optimization.originalAIDesign.power} W</b></div>
                            <div>Outlet: <b>{format(designResult.optimization.originalAIDesign.outletTDS)} ppm</b></div>
                        </div>
                        <div style={{ padding: "8px", background: "#E8F5E9", borderRadius: "6px", border: "1px solid #C8E6C9", fontSize: "12px" }}>
                            <div style={{ fontWeight: "600", color: "#2E7D32", marginBottom: "4px" }}>Optimized</div>
                            <div>Voltage: <b>{designResult.optimization.optimizedDesign.voltage} V</b></div>
                            <div>Power: <b>{designResult.optimization.optimizedDesign.power} W</b></div>
                            <div>Outlet: <b>{format(designResult.optimization.optimizedDesign.outletTDS)} ppm</b></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}