import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function KPIDashboard({ onSelectKpi }) {
    const { designResult } = useApp();
    const [selectedKpi, setSelectedKpi] = useState(null);

    if (!designResult || !designResult.engineering) {
        return null;
    }

    const engineering = designResult.engineering;
    const feedWater = designResult.input?.feedWater || {};

    const format = (val, digits = 2) => {
        if (val === undefined || val === null || isNaN(val)) return "-";
        return Number(val).toFixed(digits);
    };

    const outletTDS = format(engineering.outletTDS, 1);
    const removalEff = format(engineering.removalEfficiency, 2);
    const sec = format(engineering.sec, 4);
    const power = format(engineering.power, 1);
    const recovery = format(engineering.waterRecovery || engineering.recovery || 95.0, 1);
    const pressureDrop = format(engineering.pressureDrop, 0);

    const kpis = [
        {
            key: "outletTDS",
            label: "Outlet TDS",
            value: `${outletTDS} ppm`,
            color: "#2563EB",
            equation: "C_out = C_feed × (1 - η_rem / 100)",
            variablesList: [
                { name: "C_feed (Feed TDS)", val: `${feedWater.tds || 500} ppm` },
                { name: "η_rem (Removal Efficiency)", val: `${removalEff} %` }
            ],
            resultVal: `${outletTDS} ppm`,
            notes: "Single-stage MCDI electro-adsorption mass balance calculation based on Faradaic charge transfer."
        },
        {
            key: "removal",
            label: "Removal",
            value: `${removalEff} %`,
            color: "#16A34A",
            equation: "η_rem = ((C_feed - C_out) / C_feed) × 100%",
            variablesList: [
                { name: "C_feed (Feed TDS)", val: `${feedWater.tds || 500} ppm` },
                { name: "C_out (Outlet TDS)", val: `${outletTDS} ppm` }
            ],
            resultVal: `${removalEff} %`,
            notes: "Fraction of dissolved ionic species removed across the capacitive electrode stack matrix."
        },
        {
            key: "recovery",
            label: "Recovery",
            value: `${recovery} %`,
            color: "#16A34A",
            equation: "R = (Q_product / Q_feed) × 100%",
            variablesList: [
                { name: "Q_product (Product Flow Rate)", val: `${(feedWater.flowRate * (recovery / 100)).toFixed(1)} L/min` },
                { name: "Q_feed (Feed Flow Rate)", val: `${feedWater.flowRate || 10} L/min` }
            ],
            resultVal: `${recovery} %`,
            notes: "Percentage of feed water converted into purified product water."
        },
        {
            key: "sec",
            label: "SEC",
            value: `${sec} kWh/m³`,
            color: "#D97706",
            equation: "SEC = (V_stack × I) / (Q_product × 60)  [kWh/m³]",
            variablesList: [
                { name: "V_cell (Cell Pair Voltage)", val: `${engineering.voltageCell || engineering.voltage || 1.2} V` },
                { name: "V_stack (N_cells × V_cell)", val: `${(engineering.voltageStack || (engineering.cellPairs * (engineering.voltageCell || 1.2))).toFixed(1)} V` },
                { name: "I (Operating Current)", val: `${engineering.current || 5.0} A` },
                { name: "Q_product", val: `${(feedWater.flowRate * (recovery / 100)).toFixed(1)} L/min` }
            ],
            resultVal: `${sec} kWh/m³`,
            notes: "Specific energy consumption per unit volume of purified product water."
        },
        {
            key: "power",
            label: "Power",
            value: `${power} W`,
            color: "#0284C7",
            equation: "P = V_stack × I = (N_cells × V_cell) × I  [W]",
            variablesList: [
                { name: "V_cell (Cell Pair Voltage)", val: `${engineering.voltageCell || engineering.voltage || 1.2} V` },
                { name: "N_cells (Cell Pairs)", val: `${engineering.cellPairs || 36}` },
                { name: "V_stack (Total Stack Voltage)", val: `${(engineering.voltageStack || (engineering.cellPairs * (engineering.voltageCell || 1.2))).toFixed(1)} V` },
                { name: "I (Operating Current)", val: `${engineering.current || 5.0} A` }
            ],
            resultVal: `${power} W`,
            notes: "Total real-time DC electrical power dissipated across reactor stack electrodes (P = V_stack × I)."
        },
        {
            key: "pressureDrop",
            label: "Pressure Drop",
            value: `${pressureDrop} Pa`,
            color: "#0F172A",
            equation: "ΔP = f × (L / D_h) × (ρ × v² / 2)  [Pa]",
            variablesList: [
                { name: "f (Friction Factor)", val: "0.045" },
                { name: "L (Channel Length)", val: "0.15 m" },
                { name: "v (Flow Velocity)", val: `${(engineering.flowVelocity || 0.035).toFixed(3)} m/s` }
            ],
            resultVal: `${pressureDrop} Pa`,
            notes: "Darcy-Weisbach pressure drop formulation through net-type spacer channel matrix."
        }
    ];

    const handleClick = (kpi) => {
        if (onSelectKpi) {
            onSelectKpi(kpi.key);
        } else {
            setSelectedKpi(kpi);
        }
    };

    return (
        <div className="panel kpi-panel" style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "6px",
            padding: "8px 10px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)"
        }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                {kpis.map((kpi, idx) => (
                    <div
                        key={idx}
                        onClick={() => handleClick(kpi)}
                        style={{
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: "4px",
                            padding: "8px 10px",
                            cursor: "pointer",
                            transition: "border-color 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center"
                        }}
                    >
                        <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: "600" }}>{kpi.label}</div>
                        <div style={{ fontSize: "15px", fontWeight: "700", color: kpi.color, marginTop: "2px" }}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Governing Equation Slide Drawer / Modal */}
            {selectedKpi && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999
                }}>
                    <div style={{
                        background: "#FFFFFF",
                        borderRadius: "8px",
                        border: "1px solid #CBD5E1",
                        width: "100%",
                        maxWidth: "460px",
                        padding: "16px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #E2E8F0", paddingBottom: "8px" }}>
                            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
                                {selectedKpi.label} Governing Equation
                            </h4>
                            <button
                                onClick={() => setSelectedKpi(null)}
                                style={{ background: "none", border: "none", fontSize: "16px", fontWeight: "700", color: "#64748B", cursor: "pointer" }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Equation Box */}
                        <div style={{ background: "#0F172A", color: "#38BDF8", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", fontSize: "13px", fontWeight: "700", marginBottom: "12px", textAlign: "center" }}>
                            {selectedKpi.equation}
                        </div>

                        {/* Variables List */}
                        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "10px", marginBottom: "12px" }}>
                            <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#64748B", marginBottom: "6px" }}>Variables</div>
                            {selectedKpi.variablesList.map((v, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", margin: "3px 0" }}>
                                    <span style={{ color: "#475569" }}>{v.name}</span>
                                    <span style={{ fontWeight: "700", color: "#0F172A" }}>{v.val}</span>
                                </div>
                            ))}
                        </div>

                        {/* Calculated Result */}
                        <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "6px", padding: "8px 12px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#166534" }}>Calculated Result</span>
                            <span style={{ fontSize: "14px", fontWeight: "800", color: "#166534" }}>{selectedKpi.resultVal}</span>
                        </div>

                        {/* Engineering Notes */}
                        <div style={{ fontSize: "11.5px", color: "#64748B", lineHeight: "1.4", marginBottom: "14px" }}>
                            <strong>Engineering Note:</strong> {selectedKpi.notes}
                        </div>

                        <button
                            onClick={() => setSelectedKpi(null)}
                            style={{ width: "100%", padding: "7px", background: "#2563EB", color: "#FFFFFF", border: "none", borderRadius: "4px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                        >
                            Close Inspector
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}