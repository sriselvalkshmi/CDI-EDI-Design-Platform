import React from "react";
import { useApp } from "../context/AppContext";

export default function EngineeringPanel() {
    const { designResult } = useApp();
    const engineering = designResult?.engineering;

    const format = (value, digits = 2) => {
        if (value === undefined || value === null || isNaN(value)) {
            return "N/A";
        }
        return Number(value).toFixed(digits);
    };

    if (!designResult || !designResult.engineering) {
        return (
            <div className="panel">
                <h3 className="panel-title">Engineering Design Summary</h3>
                <p style={{ color: "#6B7280", fontSize: "13px", margin: "8px 0 0 0" }}>Generate a design to view engineering calculations.</p>
            </div>
        );
    }

    // Single Source of Truth: designResult.engineering
    const activeTech = engineering.technology || "-";
    const voltage = format(engineering.voltage);
    const current = format(engineering.current);
    const power = format(engineering.power);
    const currentDensity = format(engineering.currentDensity);
    const cellPairs = engineering.cellPairs ?? "-";
    const electrodeArea = format(engineering.electrodeArea, 0);
    const residenceTime = format(engineering.residenceTime, 2);
    const flowVelocity = format(engineering.flowVelocity, 3);
    const pressureDrop = format(engineering.pressureDrop, 1);
    const outletTDS = format(engineering.outletTDS, 1);
    const removalEff = format(engineering.removalEfficiency, 1);
    const sac = format(engineering.sac);
    const sec = format(engineering.sec, 4);
    const feedFlowRate = format(engineering.flowRate, 1);
    const waterRecovery = format(engineering.waterRecovery ?? 95.0, 1);

    return (
        <div className="panel">
            <h3 className="panel-title">Engineering Design Summary</h3>
            <div className="eng-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                {/* Electrical Design Card */}
                <div style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#2563EB", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>Electrical Design</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Operating Voltage:</span><span style={{ fontWeight: "700", color: "#1F2937" }}>{voltage} V</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Current:</span><span style={{ fontWeight: "700", color: "#1F2937" }}>{current} A</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Power:</span><span style={{ fontWeight: "700", color: "#1F2937" }}>{power} W</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Current Density:</span><span style={{ fontWeight: "700", color: "#1F2937" }}>{currentDensity} A/m²</span></div>
                </div>

                {/* Stack Geometry Card */}
                <div style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#2563EB", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>Stack Geometry</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Technology:</span><span style={{ fontWeight: "700", color: "#2563EB" }}>{activeTech}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Cell Pairs:</span><span style={{ fontWeight: "700", color: "#1F2937" }}>{cellPairs}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Electrode Area:</span><span style={{ fontWeight: "700", color: "#1F2937" }}>{electrodeArea} cm²</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Residence Time:</span><span style={{ fontWeight: "700", color: "#1F2937" }}>{residenceTime} min</span></div>
                </div>

                {/* Hydraulics & Pressure Card */}
                <div style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#2563EB", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>Hydraulics &amp; Pressure</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Flow Velocity:</span><span style={{ fontWeight: "700", color: "#1F2937" }}>{flowVelocity} m/s</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Pressure Drop:</span><span style={{ fontWeight: "700", color: "#1F2937" }}>{pressureDrop} Pa</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Feed Flow Rate:</span><span style={{ fontWeight: "700", color: "#1F2937" }}>{feedFlowRate} L/min</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Water Recovery:</span><span style={{ fontWeight: "700", color: "#16A34A" }}>{waterRecovery} %</span></div>
                </div>

                {/* Desalination Performance Card */}
                <div style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#2563EB", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>Desalination Performance</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Outlet TDS:</span><span style={{ fontWeight: "700", color: "#2563EB" }}>{outletTDS} ppm</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Removal Efficiency:</span><span style={{ fontWeight: "700", color: "#16A34A" }}>{removalEff} %</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>SAC:</span><span style={{ fontWeight: "700", color: "#1F2937" }}>{sac} mg/g</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "4px 0" }}><span style={{ color: "#6B7280" }}>Specific Energy:</span><span style={{ fontWeight: "700", color: "#2563EB" }}>{sec} kWh/m³</span></div>
                </div>
            </div>
        </div>
    );
}