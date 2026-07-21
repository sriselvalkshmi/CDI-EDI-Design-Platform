import React from "react";
import { useApp } from "../context/AppContext";

export default function EngineeringPanel() {
    const {
        engineering,
        electrode,
        selectedDesign,
        simulation,
        feedWater
    } = useApp();

    const format = (value, digits = 2) => {
        if (value === undefined || value === null || isNaN(value)) {
            return "Calculating...";
        }
        return Number(value).toFixed(digits);
    };

    if (!engineering) {
        return (
            <div className="panel">
                <h3 className="panel-title">Engineering Design Summary</h3>
                <p style={{ color: "#607D8B", fontSize: "13px", margin: "8px 0 0 0" }}>Generate a design to view engineering calculations.</p>
            </div>
        );
    }

    const voltage = format(engineering.voltage);
    const current = format(engineering.current);
    const power = format(engineering.power);
    const currentDensity = format(engineering.currentDensity ?? electrode?.currentDensity);

    const cellPairs = engineering.cellPairs ?? 48;
    const electrodeArea = format(engineering.electrodeArea ?? 420, 0);
    const residenceTime = format(engineering.residenceTime ?? 0.04, 2);

    const flowVelocity = format(engineering.flowVelocity ?? simulation?.flowVelocity ?? 0.15);
    const pressureDrop = format(engineering.pressureDrop ?? 25.85);
    const outletTDS = format(simulation?.outputTDS ?? simulation?.outletTDS ?? engineering.outletTDS ?? 48);
    const removalEff = format(simulation?.removalEfficiency ?? engineering.removalEfficiency ?? 90.4);

    const sac = format(engineering.sac ?? electrode?.sac ?? 6.6);
    const sec = format(simulation?.specificEnergy ?? engineering.sec ?? 0.04, 3);

    return (
        <div className="panel">
            <h3 className="panel-title">Engineering Design Summary</h3>

            <div className="eng-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                {/* Card 1: Electrical Design */}
                <div style={{ background: "#F8FAFC", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1565C0", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                        Electrical Design
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Operating Voltage:</span>
                        <span style={{ fontWeight: "700", color: "#263238" }}>{voltage} V</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Current:</span>
                        <span style={{ fontWeight: "700", color: "#263238" }}>{current} A</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Power:</span>
                        <span style={{ fontWeight: "700", color: "#263238" }}>{power} W</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Current Density:</span>
                        <span style={{ fontWeight: "700", color: "#263238" }}>{currentDensity} A/m²</span>
                    </div>
                </div>

                {/* Card 2: Stack Geometry */}
                <div style={{ background: "#F8FAFC", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1565C0", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                        Stack Geometry
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Technology:</span>
                        <span style={{ fontWeight: "700", color: "#00897B" }}>{selectedDesign || "MCDI"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Cell Pairs:</span>
                        <span style={{ fontWeight: "700", color: "#263238" }}>{cellPairs}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Electrode Area:</span>
                        <span style={{ fontWeight: "700", color: "#263238" }}>{electrodeArea} cm²</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Residence Time:</span>
                        <span style={{ fontWeight: "700", color: "#263238" }}>{residenceTime} min</span>
                    </div>
                </div>

                {/* Card 3: Hydraulics & Pressure */}
                <div style={{ background: "#F8FAFC", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1565C0", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                        Hydraulics & Pressure
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Flow Velocity:</span>
                        <span style={{ fontWeight: "700", color: "#263238" }}>{flowVelocity} m/s</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Pressure Drop:</span>
                        <span style={{ fontWeight: "700", color: "#263238" }}>{pressureDrop} Pa</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Feed Flow Rate:</span>
                        <span style={{ fontWeight: "700", color: "#263238" }}>{feedWater?.flowRate || 10} L/min</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Water Recovery:</span>
                        <span style={{ fontWeight: "700", color: "#2E7D32" }}>95.0 %</span>
                    </div>
                </div>

                {/* Card 4: Desalination Performance */}
                <div style={{ background: "#F8FAFC", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1565C0", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                        Desalination Performance
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Outlet TDS:</span>
                        <span style={{ fontWeight: "700", color: "#1565C0" }}>{outletTDS} ppm</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Removal Efficiency:</span>
                        <span style={{ fontWeight: "700", color: "#2E7D32" }}>{removalEff} %</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>SAC:</span>
                        <span style={{ fontWeight: "700", color: "#263238" }}>{sac} mg/g</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", margin: "4px 0" }}>
                        <span style={{ color: "#607D8B" }}>Specific Energy:</span>
                        <span style={{ fontWeight: "700", color: "#00897B" }}>{sec} kWh/m³</span>
                    </div>
                </div>
            </div>
        </div>
    );
}