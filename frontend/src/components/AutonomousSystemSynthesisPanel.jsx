import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { 
    Layers, 
    ArrowRight, 
    CheckCircle, 
    AlertTriangle, 
    Info, 
    Zap, 
    Droplets, 
    Activity, 
    Sliders, 
    FileText, 
    RefreshCw,
    ShieldAlert
} from "lucide-react";
import { synthesizeAutonomousSystem } from "../engineering/models/treatmentTrainSynthesisEngine.js";

export default function AutonomousSystemSynthesisPanel() {
    const { designResult, technology, setTechnology, recalculate, optimizationInputs } = useApp();
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [activeTab, setActiveTab] = useState("FLOWSHEET"); // "FLOWSHEET", "STREAMS", "EQUIPMENT", "CANDIDATES"

    if (!designResult || !designResult.engineering) return null;

    const feedWater = designResult.input?.feedWater || {};
    const rawTds = Number(feedWater.tds ?? 39);
    const rawHardness = Number(feedWater.hardness ?? 10);
    const rawFlow = Number(feedWater.flowRate ?? 20);
    const targetTds = Number(feedWater.targetTds ?? 2.0);
    const targetRecovery = Number(feedWater.targetRecovery ?? 95.0);
    const currentTech = technology || "AUTO";

    // Run Autonomous System Synthesis:
    const synthResult = synthesizeAutonomousSystem(
        feedWater, 
        { targetTds, targetRecovery }, 
        { technology: selectedCandidateId ? selectedCandidateId.replace("TRAIN_", "") : currentTech }
    );

    const activeTrain = synthResult.selectedTrain;
    const isOverallPass = synthResult.systemMetrics.isSystemPass;

    return (
        <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "16px 18px", marginTop: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            {/* 1. TOP HEADER: AUTONOMOUS SYSTEM SYNTHESIS STATUS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #E2E8F0", paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h2 style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Layers size={16} color="#2563EB" />
                            Autonomous Engineering System Synthesis
                        </h2>
                        <span style={{ 
                            fontSize: "10px", 
                            fontWeight: "800", 
                            padding: "2px 8px", 
                            borderRadius: "3px", 
                            background: isOverallPass ? "#DCFCE7" : "#FEF3C7", 
                            color: isOverallPass ? "#15803D" : "#92400E",
                            border: `1px solid ${isOverallPass ? "#86EFAC" : "#FDE68A"}`
                        }}>
                            {isOverallPass ? "SYSTEM CONSTRAINTS SATISFIED" : "CONDITIONAL FEASIBILITY / ADVISORY"}
                        </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#475569", marginTop: "3px" }}>
                        Selected Process Train: <strong style={{ color: "#1E40AF" }}>{activeTrain.name}</strong> ({activeTrain.shortDesc})
                    </div>
                </div>

                {/* KPI SUMMARY CARDS */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <div style={{ background: "#F8FAFC", padding: "4px 10px", borderRadius: "4px", border: "1px solid #E2E8F0", textAlign: "right" }}>
                        <div style={{ fontSize: "9px", color: "#64748B", fontWeight: "700" }}>FINAL PRODUCT TDS</div>
                        <div style={{ fontSize: "12px", fontWeight: "800", color: activeTrain.isTargetTdsMet ? "#15803D" : "#DC2626" }}>
                            {activeTrain.finalProductTds.toFixed(2)} mg/L <span style={{ fontSize: "9px", fontWeight: "500", color: "#64748B" }}>(≤ {targetTds})</span>
                        </div>
                    </div>

                    <div style={{ background: "#F8FAFC", padding: "4px 10px", borderRadius: "4px", border: "1px solid #E2E8F0", textAlign: "right" }}>
                        <div style={{ fontSize: "9px", color: "#64748B", fontWeight: "700" }}>OVERALL SYSTEM RECOVERY</div>
                        <div style={{ fontSize: "12px", fontWeight: "800", color: activeTrain.isTargetRecoveryMet ? "#15803D" : "#D97706" }}>
                            {activeTrain.overallRecoveryPct.toFixed(1)}% <span style={{ fontSize: "9px", fontWeight: "500", color: "#64748B" }}>(≥ {targetRecovery}%)</span>
                        </div>
                    </div>

                    <div style={{ background: "#F8FAFC", padding: "4px 10px", borderRadius: "4px", border: "1px solid #E2E8F0", textAlign: "right" }}>
                        <div style={{ fontSize: "9px", color: "#64748B", fontWeight: "700" }}>TOTAL SYSTEM SEC</div>
                        <div style={{ fontSize: "12px", fontWeight: "800", color: "#0F172A" }}>
                            {activeTrain.totalSecKwhM3.toFixed(4)} kWh/m³
                        </div>
                    </div>

                    <div style={{ background: "#F8FAFC", padding: "4px 10px", borderRadius: "4px", border: "1px solid #E2E8F0", textAlign: "right" }}>
                        <div style={{ fontSize: "9px", color: "#64748B", fontWeight: "700" }}>TOTAL SYSTEM POWER</div>
                        <div style={{ fontSize: "12px", fontWeight: "800", color: "#0F172A" }}>
                            {activeTrain.totalPowerW.toFixed(1)} W
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. SUB-NAVIGATION TABS */}
            <div style={{ display: "flex", gap: "4px", marginTop: "10px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px" }}>
                {[
                    { id: "FLOWSHEET", label: "Process Flowsheet (PFD)", icon: <Layers size={13} /> },
                    { id: "CANDIDATES", label: "Candidate Train Ranking (MCDA)", icon: <Activity size={13} /> },
                    { id: "STREAMS", label: "Process Stream Table (S-101..S-106)", icon: <Droplets size={13} /> },
                    { id: "EQUIPMENT", label: "Equipment Schedule & Sizing", icon: <Sliders size={13} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: activeTab === tab.id ? "#EFF6FF" : "transparent",
                            border: `1px solid ${activeTab === tab.id ? "#BFDBFE" : "transparent"}`,
                            color: activeTab === tab.id ? "#1D4ED8" : "#475569",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: activeTab === tab.id ? "700" : "500",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT 1: PROCESS FLOWSHEET */}
            {activeTab === "FLOWSHEET" && (
                <div style={{ marginTop: "12px" }}>
                    {/* VISUAL PFD FLOW DIAGRAM */}
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "14px 16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                            Synthesized Multi-Stage Process Topology
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", paddingBottom: "8px" }}>
                            {/* Raw Feed Tank */}
                            <div style={{ minWidth: "120px", background: "#FFFFFF", border: "1.5px solid #CBD5E1", borderRadius: "4px", padding: "8px 10px", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                                <div style={{ fontSize: "9px", fontWeight: "700", color: "#64748B" }}>RAW INLET</div>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#0F172A", marginTop: "2px" }}>TK-101</div>
                                <div style={{ fontSize: "9.5px", color: "#334155", marginTop: "2px" }}>{rawFlow.toFixed(1)} L/min</div>
                                <div style={{ fontSize: "9px", color: "#64748B" }}>{rawTds} mg/L TDS</div>
                            </div>

                            <ArrowRight size={18} color="#94A3B8" />

                            {/* Dynamically Rendered Stages */}
                            {activeTrain.stages.map((stage, sIdx) => {
                                const isLast = sIdx === activeTrain.stages.length - 1;
                                return (
                                    <React.Fragment key={stage.unitId}>
                                        <div style={{ 
                                            minWidth: "150px", 
                                            background: isLast ? "#F0FDF4" : "#FFFFFF", 
                                            border: `1.5px solid ${isLast ? "#86EFAC" : "#93C5FD"}`, 
                                            borderRadius: "4px", 
                                            padding: "8px 10px", 
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.02)" 
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontSize: "9px", fontWeight: "800", color: isLast ? "#15803D" : "#1D4ED8" }}>STAGE 0{sIdx + 1}</span>
                                                <span style={{ fontSize: "8.5px", background: isLast ? "#DCFCE7" : "#DBEAFE", color: isLast ? "#15803D" : "#1E40AF", padding: "1px 4px", borderRadius: "2px", fontWeight: "700" }}>
                                                    {stage.unitId}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "10.5px", fontWeight: "700", color: "#0F172A", marginTop: "2px", lineHeight: "1.2" }}>
                                                {stage.name}
                                            </div>
                                            <div style={{ marginTop: "6px", fontSize: "9.5px", color: "#475569", display: "flex", flexDirection: "column", gap: "1px" }}>
                                                <div>Prod: <strong>{stage.productStream.flowRate} L/min</strong></div>
                                                <div>TDS: <strong style={{ color: isLast ? "#15803D" : "#0F172A" }}>{stage.productStream.tds} mg/L</strong></div>
                                                <div>Hardness: <strong>{stage.productStream.hardness} mg/L</strong></div>
                                                <div>SEC: <strong>{stage.secKwhM3.toFixed(4)} kWh/m³</strong></div>
                                            </div>
                                        </div>

                                        <ArrowRight size={18} color="#94A3B8" />
                                    </React.Fragment>
                                );
                            })}

                            {/* Product Storage Tank */}
                            <div style={{ minWidth: "130px", background: "#DCFCE7", border: "1.5px solid #86EFAC", borderRadius: "4px", padding: "8px 10px", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                                <div style={{ fontSize: "9px", fontWeight: "700", color: "#15803D" }}>FINAL PRODUCT</div>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#15803D", marginTop: "2px" }}>TK-102</div>
                                <div style={{ fontSize: "9.5px", color: "#166534", marginTop: "2px", fontWeight: "700" }}>{activeTrain.finalProductStream.flowRate} L/min</div>
                                <div style={{ fontSize: "9px", color: "#15803D", fontWeight: "700" }}>{activeTrain.finalProductTds.toFixed(2)} mg/L TDS</div>
                                <div style={{ fontSize: "8.5px", color: "#166534", marginTop: "2px" }}>Rec: {activeTrain.overallRecoveryPct.toFixed(1)}%</div>
                            </div>
                        </div>

                        {/* RATIONALE BANNER */}
                        <div style={{ marginTop: "10px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "4px", padding: "8px 12px", fontSize: "11px", color: "#1E40AF" }}>
                            <strong>Process Design Rationale:</strong> {activeTrain.rationale}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 2: CANDIDATE TRAIN RANKING */}
            {activeTab === "CANDIDATES" && (
                <div style={{ marginTop: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "8px" }}>
                        The Autonomous Synthesis Engine evaluated all technically valid treatment train permutations against your feed water chemistry and constraints:
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px", textAlign: "left", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "4px" }}>
                            <thead>
                                <tr style={{ background: "#F1F5F9", color: "#334155", fontWeight: "700", borderBottom: "1px solid #CBD5E1" }}>
                                    <th style={{ padding: "6px 8px" }}>Rank &amp; Train</th>
                                    <th style={{ padding: "6px 8px" }}>Process Route</th>
                                    <th style={{ padding: "6px 8px" }}>Final Product TDS</th>
                                    <th style={{ padding: "6px 8px" }}>Overall Recovery</th>
                                    <th style={{ padding: "6px 8px" }}>Total SEC</th>
                                    <th style={{ padding: "6px 8px" }}>Status</th>
                                    <th style={{ padding: "6px 8px", textAlign: "right" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {synthResult.allCandidateTrains
                                    .sort((a, b) => b.mcdaScore - a.mcdaScore)
                                    .map((trn, idx) => {
                                        const isSelected = activeTrain.trainId === trn.trainId;
                                        return (
                                            <tr key={trn.trainId} style={{ 
                                                borderBottom: "1px solid #F1F5F9", 
                                                background: isSelected ? "#F0FDF4" : "#FFFFFF" 
                                            }}>
                                                <td style={{ padding: "6px 8px", fontWeight: "700" }}>
                                                    <span style={{ 
                                                        background: idx === 0 ? "#FEF08A" : "#F1F5F9", 
                                                        color: idx === 0 ? "#854D0E" : "#475569", 
                                                        padding: "1px 5px", 
                                                        borderRadius: "2px", 
                                                        marginRight: "6px",
                                                        fontSize: "9.5px"
                                                    }}>
                                                        #{idx + 1}
                                                    </span>
                                                    {trn.name}
                                                </td>
                                                <td style={{ padding: "6px 8px", color: "#475569" }}>{trn.shortDesc}</td>
                                                <td style={{ padding: "6px 8px", fontWeight: "700", color: trn.isTargetTdsMet ? "#15803D" : "#DC2626" }}>
                                                    {trn.finalProductTds.toFixed(1)} mg/L
                                                </td>
                                                <td style={{ padding: "6px 8px", fontWeight: "700", color: trn.isTargetRecoveryMet ? "#15803D" : "#D97706" }}>
                                                    {trn.overallRecoveryPct.toFixed(1)}%
                                                </td>
                                                <td style={{ padding: "6px 8px" }}>{trn.totalSecKwhM3.toFixed(4)} kWh/m³</td>
                                                <td style={{ padding: "6px 8px" }}>
                                                    <span style={{ 
                                                        fontSize: "9px", 
                                                        fontWeight: "700", 
                                                        padding: "2px 6px", 
                                                        borderRadius: "2px", 
                                                        background: trn.status === "FEASIBLE" ? "#DCFCE7" : (trn.status === "RECOVERY_DEFICIT" ? "#FEF3C7" : "#FEE2E2"),
                                                        color: trn.status === "FEASIBLE" ? "#15803D" : (trn.status === "RECOVERY_DEFICIT" ? "#92400E" : "#B91C1C")
                                                    }}>
                                                        {trn.statusLabel}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "6px 8px", textAlign: "right" }}>
                                                    <button
                                                        onClick={() => setSelectedCandidateId(trn.trainId)}
                                                        disabled={isSelected}
                                                        style={{
                                                            background: isSelected ? "#15803D" : "#2563EB",
                                                            color: "#FFFFFF",
                                                            border: "none",
                                                            borderRadius: "3px",
                                                            padding: "3px 8px",
                                                            fontSize: "10px",
                                                            fontWeight: "700",
                                                            cursor: isSelected ? "default" : "pointer"
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
                </div>
            )}

            {/* TAB CONTENT 3: PROCESS STREAM TABLE */}
            {activeTab === "STREAMS" && (
                <div style={{ marginTop: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "8px" }}>
                        Full Stream Balance Table for <strong>{activeTrain.name}</strong>:
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", textAlign: "left", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "4px" }}>
                            <thead>
                                <tr style={{ background: "#F1F5F9", color: "#334155", fontWeight: "700", borderBottom: "1px solid #CBD5E1" }}>
                                    <th style={{ padding: "5px 6px" }}>Stream ID</th>
                                    <th style={{ padding: "5px 6px" }}>Description</th>
                                    <th style={{ padding: "5px 6px" }}>From Unit → To Unit</th>
                                    <th style={{ padding: "5px 6px", textAlign: "right" }}>Flow (L/min)</th>
                                    <th style={{ padding: "5px 6px", textAlign: "right" }}>TDS (mg/L)</th>
                                    <th style={{ padding: "5px 6px", textAlign: "right" }}>Hardness (mg/L)</th>
                                    <th style={{ padding: "5px 6px", textAlign: "right" }}>Pressure (bar)</th>
                                    <th style={{ padding: "5px 6px", textAlign: "right" }}>Salt Flow (g/s)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {synthResult.streamTable.map((stream, idx) => (
                                    <tr key={stream.streamId} style={{ borderBottom: "1px solid #F1F5F9", background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}>
                                        <td style={{ padding: "5px 6px", fontWeight: "800", color: "#1D4ED8" }}>{stream.streamId}</td>
                                        <td style={{ padding: "5px 6px", fontWeight: "600", color: "#0F172A" }}>{stream.description}</td>
                                        <td style={{ padding: "5px 6px", color: "#475569" }}>{stream.fromUnit} → {stream.toUnit}</td>
                                        <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>{stream.flowRateLmin.toFixed(2)}</td>
                                        <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>{stream.tdsMgL.toFixed(1)}</td>
                                        <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: "monospace" }}>{stream.hardnessMgL.toFixed(2)}</td>
                                        <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: "monospace" }}>{stream.pressureBar.toFixed(2)}</td>
                                        <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: "monospace" }}>{stream.saltMassRateGs.toFixed(6)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MASS AND WATER BALANCE CLOSURES */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
                        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "8px 10px", borderRadius: "4px", fontSize: "10.5px" }}>
                            <div style={{ fontWeight: "700", color: "#15803D", display: "flex", justifyContent: "space-between" }}>
                                <span>WATER MASS BALANCE CLOSURE</span>
                                <span>STATUS: {synthResult.balances.waterBalance.status}</span>
                            </div>
                            <div style={{ color: "#166534", marginTop: "3px" }}>
                                Qin ({synthResult.balances.waterBalance.inletLmin.toFixed(2)} L/min) = Qproduct ({synthResult.balances.waterBalance.productLmin.toFixed(2)}) + Qreject ({synthResult.balances.waterBalance.rejectLmin.toFixed(2)}) | Residual: <strong>{synthResult.balances.waterBalance.residualLmin.toFixed(4)} L/min</strong>
                            </div>
                        </div>

                        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "8px 10px", borderRadius: "4px", fontSize: "10.5px" }}>
                            <div style={{ fontWeight: "700", color: "#15803D", display: "flex", justifyContent: "space-between" }}>
                                <span>DISSOLVED SALT BALANCE CLOSURE</span>
                                <span>STATUS: {synthResult.balances.saltBalance.status}</span>
                            </div>
                            <div style={{ color: "#166534", marginTop: "3px" }}>
                                Salt_in ({synthResult.balances.saltBalance.inletGs.toFixed(6)} g/s) = Salt_out ({(synthResult.balances.saltBalance.productGs + synthResult.balances.saltBalance.rejectGs).toFixed(6)} g/s) | Residual: <strong>{synthResult.balances.saltBalance.residualGs.toFixed(6)} g/s</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 4: EQUIPMENT SCHEDULE */}
            {activeTab === "EQUIPMENT" && (
                <div style={{ marginTop: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "8px" }}>
                        Tagged Equipment Schedule and Technical Sizing for <strong>{activeTrain.name}</strong>:
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
                        {activeTrain.stages.map((stage, sIdx) => (
                            <div key={stage.unitId} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px", padding: "10px 12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#1E40AF" }}>{stage.unitId}</span>
                                    <span style={{ fontSize: "9px", fontWeight: "700", color: "#475569" }}>{stage.technology}</span>
                                </div>
                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#0F172A", marginTop: "4px" }}>
                                    {stage.name}
                                </div>
                                <div style={{ marginTop: "6px", fontSize: "10px", color: "#334155", display: "flex", flexDirection: "column", gap: "3px" }}>
                                    {Object.entries(stage.equipment).map(([k, v]) => (
                                        <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#64748B" }}>{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                            <strong style={{ color: "#0F172A", textAlign: "right" }}>{String(v)}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
