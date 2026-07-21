import React from "react";
import { useApp } from "../context/AppContext";

export default function EngineeringPanel() {
    const { designResult, selectedDesign } = useApp();
    const engineering = designResult?.engineering;
    const kpi = designResult?.kpi;
    const feedWater = designResult?.input?.feedWater;
    const activeTech = designResult?.input?.technology || selectedDesign || "-";

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
                <p style={{ color: "#607D8B", fontSize: "13px", margin: "8px 0 0 0" }}>Generate a design to view engineering calculations.</p>
            </div>
        );
    }

    const voltage = format(engineering?.voltage);
    const current = format(engineering?.current);
    const power = format(engineering?.power);
    const currentDensity = format(engineering?.currentDensity);
    const cellPairs = engineering?.cellPairs ?? "-";
    const electrodeArea = format(engineering?.electrodeArea, 0);
    const residenceTime = format(engineering?.residenceTime, 2);
    const flowVelocity = format(engineering?.flowVelocity ?? kpi?.flowVelocity);
    const pressureDrop = format(engineering?.pressureDrop ?? kpi?.pressureDrop);
    const outletTDS = format(kpi?.outletTDS);
    const removalEff = format(kpi?.removalEfficiency);
    const sac = format(engineering?.sac);
    const sec = format(kpi?.SEC, 3);
    const waterRecovery = format(kpi?.waterRecovery ?? engineering?.waterRecovery ?? 95.0);

    return (
        <div className="panel">
            <h3 className="panel-title">Engineering Design Summary</h3>
            <div className="eng-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                {/* Electrical Design Card */}
                <div style={{ background: "#F8FAFC", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1565C0", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>Electrical Design</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Operating Voltage:</span><span style={{ fontWeight: "700", color: "#263238" }}>{voltage} V</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Current:</span><span style={{ fontWeight: "700", color: "#263238" }}>{current} A</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Power:</span><span style={{ fontWeight: "700", color: "#263238" }}>{power} W</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Current Density:</span><span style={{ fontWeight: "700", color: "#263238" }}>{currentDensity} A/m²</span></div>
                </div>
                {/* Stack Geometry Card */}
                <div style={{ background: "#F8FAFC", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1565C0", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>Stack Geometry</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Technology:</span><span style={{ fontWeight: "700", color: "#00897B" }}>{activeTech}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Cell Pairs:</span><span style={{ fontWeight: "700", color: "#263238" }}>{cellPairs}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Electrode Area:</span><span style={{ fontWeight: "700", color: "#263238" }}>{electrodeArea} cm²</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Residence Time:</span><span style={{ fontWeight: "700", color: "#263238" }}>{residenceTime} min</span></div>
                </div>
                {/* Hydraulics & Pressure Card */}
                <div style={{ background: "#F8FAFC", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1565C0", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>Hydraulics & Pressure</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Flow Velocity:</span><span style={{ fontWeight: "700", color: "#263238" }}>{flowVelocity} m/s</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Pressure Drop:</span><span style={{ fontWeight: "700", color: "#263238" }}>{pressureDrop} Pa</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Feed Flow Rate:</span><span style={{ fontWeight: "700", color: "#263238" }}>{feedWater?.flowRate ?? "-"} L/min</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Water Recovery:</span><span style={{ fontWeight: "700", color: "#2E7D32" }}>{waterRecovery} %</span></div>
                </div>
                {/* Desalination Performance Card */}
                <div style={{ background: "#F8FAFC", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1565C0", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>Desalination Performance</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Outlet TDS:</span><span style={{ fontWeight: "700", color: "#1565C0" }}>{outletTDS} ppm</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Removal Efficiency:</span><span style={{ fontWeight: "700", color: "#2E7D32" }}>{removalEff} %</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>SAC:</span><span style={{ fontWeight: "700", color: "#263238" }}>{sac} mg/g</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}><span style={{ color: "#607D8B" }}>Specific Energy:</span><span style={{ fontWeight: "700", color: "#00897B" }}>{sec} kWh/m³</span></div>
                </div>
            </div>
        </div>
    );
}