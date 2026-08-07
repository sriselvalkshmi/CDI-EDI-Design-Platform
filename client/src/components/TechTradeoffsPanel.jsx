import React from "react";
import { useApp } from "../context/AppContext";

export default function TechTradeoffsPanel() {
    const { designResult, technology, setTechnology, recalculate, optimizationInputs } = useApp();
    if (!designResult || !designResult.engineering) return null;

    const engineering = designResult.engineering || {};
    const feedWater = designResult.input?.feedWater || {};
    const selectedTech = engineering.technology || "CDI";
    const aiRec = designResult.aiRecommendation || {};
    const evaluations = aiRec.evaluations || [];

    const feedTds = feedWater.tds || 500;
    const targetTds = feedWater.targetTds || 50;

    const handleSelectTech = (techKey) => {
        setTechnology(techKey);
        recalculate({ ...optimizationInputs, cellPairs: undefined, electrodeArea: undefined, voltage: undefined, current: undefined }, techKey, false);
    };

    return (
        <div className="panel tech-tradeoffs-panel" style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "14px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
        }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                Standardized Desalination Technology Evaluation &amp; Comparison Matrix
            </h3>

            {/* STANDARDIZED MULTI-TECHNOLOGY EVALUATION TABLE */}
            {evaluations.length > 0 && (
                <div style={{ overflowX: "auto", marginBottom: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Technology</th>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Feed TDS</th>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Target TDS</th>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Model-Predicted Outlet</th>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Target Status</th>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Removal %</th>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Recovery %</th>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Model SEC</th>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Power</th>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Pressure Drop</th>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Feed Feasibility</th>
                                <th style={{ padding: "8px", color: "#64748B", fontWeight: "700" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evaluations.map(e => {
                                const isSelected = e.technology === selectedTech;
                                const activeEng = isSelected ? engineering : e.engineering;
                                const isDirectFeasible = e.technology !== "EDI" || (feedWater.tds <= 30 && feedWater.hardness <= 0.5);

                                // Authoritative metrics directly from active engineering result or evaluation object
                                const displayOutlet = isSelected ? engineering.outletTDS : e.outletTDS;
                                const displayRemoval = isSelected ? engineering.removalEfficiency : e.removalEfficiency;
                                const displaySec = isSelected ? engineering.sec : e.sec;
                                const displayPower = isSelected ? engineering.power : e.power;
                                const displayDrop = isSelected ? engineering.pressureDrop : (activeEng?.pressureDrop || 276);

                                const isTargetAchieved = displayOutlet <= targetTds + 0.5;
                                const deficit = Number((displayOutlet - targetTds).toFixed(1));

                                return (
                                    <tr key={e.technology} style={{
                                        borderBottom: "1px solid #F1F5F9",
                                        background: isSelected ? "#EFF6FF" : "transparent"
                                    }}>
                                        <td style={{ padding: "8px", fontWeight: "700", color: "#0F172A" }}>{e.technology}</td>
                                        <td style={{ padding: "8px", color: "#475569" }}>{feedTds} ppm</td>
                                        <td style={{ padding: "8px", color: "#475569" }}>{targetTds} ppm</td>
                                        <td style={{ padding: "8px", fontWeight: "600", color: isTargetAchieved ? "#16A34A" : "#DC2626" }}>
                                            {displayOutlet} ppm
                                        </td>
                                        <td style={{ padding: "8px" }}>
                                            <span style={{
                                                fontSize: "10.5px",
                                                fontWeight: "700",
                                                color: isTargetAchieved ? "#15803D" : "#B91C1C",
                                                background: isTargetAchieved ? "#DCFCE7" : "#FEE2E2",
                                                padding: "2px 6px",
                                                borderRadius: "4px"
                                            }}>
                                                {isTargetAchieved ? "Achieved" : `Not Achieved (+${deficit} ppm)`}
                                            </span>
                                        </td>
                                        <td style={{ padding: "8px", fontWeight: "600", color: "#334155" }}>{displayRemoval}%</td>
                                        <td style={{ padding: "8px", fontWeight: "600", color: "#334155" }}>{e.recovery}%</td>
                                        <td style={{ padding: "8px", fontWeight: "600", color: "#334155" }}>{displaySec} kWh/m³</td>
                                        <td style={{ padding: "8px", fontWeight: "600", color: "#334155" }}>{displayPower} W</td>
                                        <td style={{ padding: "8px", fontWeight: "600", color: "#334155" }}>{displayDrop} Pa</td>
                                        <td style={{ padding: "8px", fontWeight: "700", color: isDirectFeasible ? "#16A34A" : "#D97706" }}>
                                            {isDirectFeasible ? "Direct Feed" : "RO Pretreatment Req."}
                                        </td>
                                        <td style={{ padding: "8px" }}>
                                            <button
                                                onClick={() => handleSelectTech(e.technology)}
                                                style={{
                                                    padding: "3px 8px",
                                                    background: isSelected ? "#2563EB" : "#F1F5F9",
                                                    color: isSelected ? "#FFFFFF" : "#475569",
                                                    border: "1px solid #CBD5E1",
                                                    borderRadius: "4px",
                                                    fontSize: "11px",
                                                    fontWeight: "700",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {isSelected ? "Active" : "Select"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TECHNOLOGY COMPARISON OPERATING ENVELOPES */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "10px" }}>
                {/* CDI CARD */}
                <div onClick={() => handleSelectTech("CDI")} style={{ background: selectedTech === "CDI" ? "#EFF6FF" : "#F8FAFC", border: `1px solid ${selectedTech === "CDI" ? "#2563EB" : "#E2E8F0"}`, borderRadius: "6px", padding: "10px", cursor: "pointer" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "2px" }}>CDI</div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "6px" }}>Membrane-free Carbon Electrodes</div>
                    <div style={{ fontSize: "11px", color: "#334155" }}>Charge Eff: <strong>80 - 82%</strong></div>
                    <div style={{ fontSize: "11px", color: "#334155" }}>Feed Limits: <strong>&lt; 1,000 ppm</strong></div>
                    <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px" }}>Advantage: Lowest CAPEX</div>
                    <div style={{ fontSize: "11px", color: "#DC2626" }}>Limitation: Co-ion expulsion penalty</div>
                </div>

                {/* MCDI CARD */}
                <div onClick={() => handleSelectTech("MCDI")} style={{ background: selectedTech === "MCDI" ? "#EFF6FF" : "#F8FAFC", border: `1px solid ${selectedTech === "MCDI" ? "#2563EB" : "#E2E8F0"}`, borderRadius: "6px", padding: "10px", cursor: "pointer" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "2px" }}>MCDI</div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "6px" }}>AEM &amp; CEM Membrane Block</div>
                    <div style={{ fontSize: "11px", color: "#334155" }}>Charge Eff: <strong>92 - 95%</strong></div>
                    <div style={{ fontSize: "11px", color: "#334155" }}>Feed Limits: <strong>500 – 3,000 ppm</strong></div>
                    <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px" }}>Advantage: High energy efficiency</div>
                    <div style={{ fontSize: "11px", color: "#DC2626" }}>Limitation: Membrane capital cost</div>
                </div>

                {/* FCDI CARD */}
                <div onClick={() => handleSelectTech("FCDI")} style={{ background: selectedTech === "FCDI" ? "#EFF6FF" : "#F8FAFC", border: `1px solid ${selectedTech === "FCDI" ? "#2563EB" : "#E2E8F0"}`, borderRadius: "6px", padding: "10px", cursor: "pointer" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "2px" }}>FCDI</div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "6px" }}>Circulating Carbon Slurry</div>
                    <div style={{ fontSize: "11px", color: "#334155" }}>Operation: <strong>Non-stop Continuous</strong></div>
                    <div style={{ fontSize: "11px", color: "#334155" }}>Feed Limits: <strong>3,000 – 15,000 ppm</strong></div>
                    <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px" }}>Advantage: No batch saturation</div>
                    <div style={{ fontSize: "11px", color: "#DC2626" }}>Limitation: Slurry pump power duty</div>
                </div>

                {/* EDI CARD */}
                <div onClick={() => handleSelectTech("EDI")} style={{ background: selectedTech === "EDI" ? "#EFF6FF" : "#F8FAFC", border: `1px solid ${selectedTech === "EDI" ? "#2563EB" : "#E2E8F0"}`, borderRadius: "6px", padding: "10px", cursor: "pointer" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "2px" }}>EDI</div>
                    <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "6px" }}>Mixed-Bed Resin &amp; Auto-Regen</div>
                    <div style={{ fontSize: "11px", color: "#334155" }}>Polishing Outlet: <strong>&lt; 10 ppm</strong></div>
                    <div style={{ fontSize: "11px", color: "#334155" }}>Feed Limits: <strong>&lt; 30 mg/L (RO Permeate)</strong></div>
                    <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px" }}>Advantage: Ultra-pure water quality</div>
                    <div style={{ fontSize: "11px", color: "#DC2626" }}>Limitation: Requires RO pretreatment</div>
                </div>
            </div>
        </div>
    );
}
