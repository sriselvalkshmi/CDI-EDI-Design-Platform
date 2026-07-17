import React from "react";
import { useApp } from "../context/AppContext";

export default function KPIDashboard() {
    const {
        simulation,
        engineering,
        optimization
    } = useApp();

    const format = (value, digits = 2) => {
        if (value === undefined || value === null || isNaN(value)) {
            return "-";
        }
        return Number(value).toFixed(digits);
    };

    if (!simulation) {
        return (
            <div className="panel">
                <h2>System Performance KPI</h2>
                <p>Generate design to display performance.</p>
            </div>
        );
    }

    return (
        <div className="panel" style={{ padding: "15px", borderRadius: "8px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h2>System Performance KPI</h2>
            <hr style={{ border: "0", borderTop: "1px solid #eee", marginBottom: "12px" }} />

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px" }}>
                <tbody>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "6px 0", fontSize: "14px", color: "#666" }}>Outlet TDS</td>
                        <td style={{ padding: "6px 0", fontSize: "14px", fontWeight: "bold", color: "#333", textAlign: "right" }}>
                            {format(simulation.outputTDS)} ppm
                        </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "6px 0", fontSize: "14px", color: "#666" }}>Salt Removal</td>
                        <td style={{ padding: "6px 0", fontSize: "14px", fontWeight: "bold", color: "#333", textAlign: "right" }}>
                            {format(simulation.saltRemoval)} ppm
                        </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "6px 0", fontSize: "14px", color: "#666" }}>Removal Efficiency</td>
                        <td style={{ padding: "6px 0", fontSize: "14px", fontWeight: "bold", color: "#333", textAlign: "right" }}>
                            {format(simulation.removalEfficiency)} %
                        </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "6px 0", fontSize: "14px", color: "#666" }}>Power Consumption</td>
                        <td style={{ padding: "6px 0", fontSize: "14px", fontWeight: "bold", color: "#333", textAlign: "right" }}>
                            {format(engineering?.power ?? (simulation.averageVoltage * simulation.averageCurrent))} W
                        </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "6px 0", fontSize: "14px", color: "#666" }}>Specific Energy</td>
                        <td style={{ padding: "6px 0", fontSize: "14px", fontWeight: "bold", color: "#333", textAlign: "right" }}>
                            {format(simulation.specificEnergy, 4)} kWh/m³
                        </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "6px 0", fontSize: "14px", color: "#666" }}>Flow Velocity</td>
                        <td style={{ padding: "6px 0", fontSize: "14px", fontWeight: "bold", color: "#333", textAlign: "right" }}>
                            {format(simulation.averageVelocity || simulation.flowVelocity)} m/s
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* COMPARATIVE SCORECARD */}
            {optimization && optimization.originalAIDesign && (
                <div style={{ marginTop: "15px", borderTop: "2px dashed #ddd", paddingTop: "12px" }}>
                    <h3 style={{ fontSize: "14px", color: "#1976d2", margin: "0 0 10px 0", fontWeight: "bold", textAlign: "center" }}>
                        AI Design vs User Optimized Design
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                        <div style={{ padding: "10px", background: "#f5f5f5", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
                            <div style={{ fontWeight: "bold", fontSize: "12px", color: "#666", marginBottom: "6px", borderBottom: "1px solid #ddd", paddingBottom: "3px" }}>AI Design</div>
                            <div style={{ fontSize: "11px", color: "#444" }}>Voltage: <b>{optimization.originalAIDesign.voltage} V</b></div>
                            <div style={{ fontSize: "11px", color: "#444" }}>Current: <b>{optimization.originalAIDesign.current} A</b></div>
                            <div style={{ fontSize: "11px", color: "#444" }}>Power: <b>{optimization.originalAIDesign.power} W</b></div>
                            <div style={{ fontSize: "11px", color: "#444" }}>Outlet TDS: <b>{format(optimization.originalAIDesign.outletTDS)} ppm</b></div>
                            <div style={{ fontSize: "11px", color: "#444" }}>Energy: <b>{format(optimization.originalAIDesign.energy, 4)} kWh/m³</b></div>
                        </div>
                        <div style={{ padding: "10px", background: "#e8f5e9", borderRadius: "6px", border: "1px solid #c8e6c9" }}>
                            <div style={{ fontWeight: "bold", fontSize: "12px", color: "#2e7d32", marginBottom: "6px", borderBottom: "1px solid #a5d6a7", paddingBottom: "3px" }}>Optimized Design</div>
                            <div style={{ fontSize: "11px", color: "#2e7d32" }}>Voltage: <b>{optimization.optimizedDesign.voltage} V</b></div>
                            <div style={{ fontSize: "11px", color: "#2e7d32" }}>Current: <b>{optimization.optimizedDesign.current} A</b></div>
                            <div style={{ fontSize: "11px", color: "#2e7d32" }}>Power: <b>{optimization.optimizedDesign.power} W</b></div>
                            <div style={{ fontSize: "11px", color: "#2e7d32" }}>Outlet TDS: <b>{format(optimization.optimizedDesign.outletTDS)} ppm</b></div>
                            <div style={{ fontSize: "11px", color: "#2e7d32" }}>Energy: <b>{format(optimization.optimizedDesign.energy, 4)} kWh/m³</b></div>
                        </div>
                    </div>
                    
                    {optimization.improvementScore && (
                        <div style={{ padding: "10px", background: "#e3f2fd", borderRadius: "6px", border: "1px solid #bbdefb", fontSize: "12px" }}>
                            <div style={{ fontWeight: "bold", color: "#1565c0", marginBottom: "6px", borderBottom: "1px solid #90caf9", paddingBottom: "3px" }}>Improvement Metrics</div>
                            <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
                                <span style={{ color: "#555" }}>Energy Reduction:</span>
                                <span style={{ fontWeight: "bold", color: optimization.improvementScore.energy >= 0 ? "#2e7d32" : "#c62828" }}>
                                    {optimization.improvementScore.energy >= 0 ? "+" : ""}{optimization.improvementScore.energy} %
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
                                <span style={{ color: "#555" }}>Outlet TDS Quality:</span>
                                <span style={{ fontWeight: "bold", color: optimization.improvementScore.tds >= 0 ? "#2e7d32" : "#c62828" }}>
                                    {optimization.improvementScore.tds >= 0 ? "+" : ""}{optimization.improvementScore.tds} %
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
                                <span style={{ color: "#555" }}>Desalination Efficiency:</span>
                                <span style={{ fontWeight: "bold", color: optimization.improvementScore.efficiency >= 0 ? "#2e7d32" : "#c62828" }}>
                                    {optimization.improvementScore.efficiency >= 0 ? "+" : ""}{optimization.improvementScore.efficiency} %
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}