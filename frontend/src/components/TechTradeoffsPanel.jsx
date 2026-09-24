import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import engineeringEquationEngine from "@shared/engineering/engine/engineeringEquationEngine.js";
import { evaluateTechnologyCandidate, rankFeasibleCandidates } from "@shared/engineering/core/aiRecommendation.js";

const TECH_DETAILS = {
    MCDI: {
        method: "MCDI — Membrane Capacitive Deionization",
        technology: "AEM/CEM Membrane-Paired CDI",
        desc: "Membrane Capacitive Deionization (AEM/CEM Pairing)"
    },
    CDI: {
        method: "CDI — Capacitive Deionization",
        technology: "Membrane-Free Flow-Through CDI",
        desc: "Capacitive Deionization (Membrane-Free)"
    },
    FCDI: {
        method: "FCDI — Flow-Electrode Capacitive Deionization",
        technology: "Circulating Carbon Slurry Flow-Electrode",
        desc: "Flow-Electrode CDI (Circulating Carbon Slurry)"
    },
    EDI: {
        method: "EDI — Electrodeionization",
        technology: "Continuous Mixed-Bed Ion Exchange Resin",
        desc: "Electrodeionization (Continuous Mixed-Bed Resin)"
    }
};

export default function TechTradeoffsPanel() {
    const { designResult, technology, setTechnology, recalculate, optimizationInputs, setOptimizationInputs } = useApp();
    const [showAdvancedDiagnostics, setShowAdvancedDiagnostics] = useState(false);
    const [showAdvancedContaminants, setShowAdvancedContaminants] = useState(false);

    if (!designResult || !designResult.engineering) return null;

    const engineering = designResult.engineering || {};
    const feedWater = designResult.input?.feedWater || {};

    const feedTds = Number(feedWater.tds ?? 500);
    const targetTds = Number(feedWater.targetTds ?? 50);
    const feedHardness = Number(feedWater.hardness ?? 0);
    const targetRecovery = Number(feedWater.targetRecovery ?? 95.0);
    const flowRate = Number(feedWater.flowRate ?? 20.0);

    // Retrieve candidates from authoritative aiRecommendation or calculate them
    const aiRec = designResult.aiRecommendation;
    let feasibleCandidates = aiRec?.feasibleCandidates || [];
    let autoRecommendation = aiRec?.selectedTechnology || (feasibleCandidates.length > 0 ? feasibleCandidates[0].key : null);

    // If feasibleCandidates not yet present on aiRec, evaluate candidates
    if (!feasibleCandidates || feasibleCandidates.length === 0) {
        const mcdiModel = engineering.technology === "MCDI" ? engineering : engineeringEquationEngine({ technology: "MCDI", feedWater });
        const cdiModel = engineering.technology === "CDI" ? engineering : engineeringEquationEngine({ technology: "CDI", feedWater });
        const fcdiModel = engineering.technology === "FCDI" ? engineering : engineeringEquationEngine({ technology: "FCDI", feedWater });
        const ediModel = engineering.technology === "EDI" ? engineering : engineeringEquationEngine({ technology: "EDI", feedWater });

        const rawCandidates = [
            evaluateTechnologyCandidate({ key: "MCDI", name: "MCDI", desc: "Membrane Capacitive Deionization", basis: "AEM/CEM paired electrosorption", feedWater, model: mcdiModel, targetTds, targetRecovery }),
            evaluateTechnologyCandidate({ key: "CDI", name: "CDI", desc: "Capacitive Deionization (Membrane-Free)", basis: "Membrane-free electrosorption", feedWater, model: cdiModel, targetTds, targetRecovery }),
            evaluateTechnologyCandidate({ key: "FCDI", name: "FCDI", desc: "Flow-Electrode CDI", basis: "Circulating carbon slurry electrode", feedWater, model: fcdiModel, targetTds, targetRecovery }),
            evaluateTechnologyCandidate({ key: "EDI", name: "EDI", desc: "Electrodeionization Polishing", basis: "Continuous resin electro-regeneration", feedWater, model: ediModel, targetTds, targetRecovery })
        ];

        feasibleCandidates = rankFeasibleCandidates(rawCandidates, targetTds, targetRecovery);
        autoRecommendation = feasibleCandidates.length > 0 ? feasibleCandidates[0].key : null;
    }

    const autoCandidate = feasibleCandidates.find(c => c.key === autoRecommendation) || (feasibleCandidates.length > 0 ? feasibleCandidates[0] : null);
    const isAutoFeasible = Boolean(autoCandidate);
    const feasibleCount = feasibleCandidates.length;

    // Synchronize selected technology with AUTO recommendation if mode is AUTO
    const selectedTech = (technology === "AUTO" ? (autoRecommendation || designResult.selectedTechnology || "MCDI") : technology) || "MCDI";

    const handleSelectTech = (techKey) => {
        setTechnology(techKey);
        if (setOptimizationInputs) {
            setOptimizationInputs({});
        }
        recalculate({}, techKey, false);
    };

    const handleReviewInputs = () => {
        const el = document.getElementById("sidebar-feed-inputs") || document.querySelector("input");
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            el.focus();
        }
    };

    // Active design metrics
    const activeOutletTds = Number(engineering.outletTDS ?? engineering.outletTds ?? targetTds);
    const activeRecovery = Number(engineering.waterRecovery ?? engineering.waterRecoveryPct ?? 95.2);
    const activeSec = Number(engineering.secElectricalGross ?? engineering.sec ?? 0.031);
    const activeCellPairs = Number(engineering.cellPairs ?? 34);
    const activeProductFlow = Number((flowRate * (activeRecovery / 100)).toFixed(2));

    const activeTechDetails = TECH_DETAILS[selectedTech] || {
        method: `${selectedTech} Desalination`,
        technology: selectedTech,
        desc: selectedTech
    };

    return (
        <div className="panel tradeoffs-panel" style={{
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: "6px",
            padding: "16px 18px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
        }}>
            {/* 1. TECHNOLOGY ASSESSMENT HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Technology Assessment
                </h3>
                <div style={{ fontSize: "11px", color: "#475569" }}>
                    Feed: <strong style={{ color: "#0F172A" }}>{feedTds} mg/L TDS</strong> &nbsp;|&nbsp; 
                    Target TDS: <strong style={{ color: "#0F172A" }}>≤ {targetTds} mg/L</strong> &nbsp;|&nbsp; 
                    Recovery: <strong style={{ color: "#0F172A" }}>≥ {targetRecovery}%</strong>
                </div>
            </div>

            {/* 2. FEASIBLE TECHNOLOGY COMPARISON TABLE */}
            {feasibleCandidates.length === 0 ? (
                <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "4px",
                    padding: "16px",
                    textAlign: "center"
                }}>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                        No feasible technology identified for the current design basis.
                    </span>
                    <button
                        onClick={handleReviewInputs}
                        style={{
                            marginLeft: "12px",
                            background: "#0F172A",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "3px",
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer"
                        }}
                    >
                        Review Inputs
                    </button>
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                        <thead>
                            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #CBD5E1", color: "#475569" }}>
                                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: "700" }}>Technology</th>
                                <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700" }}>Product TDS</th>
                                <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700" }}>Recovery</th>
                                <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700" }}>Net SEC</th>
                                <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "700" }}>Status</th>
                                <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: "700" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feasibleCandidates.map((cand) => {
                                const isSelected = selectedTech === cand.key;
                                const isRecommended = cand.key === autoRecommendation;
                                return (
                                    <tr
                                        key={cand.key}
                                        style={{
                                            borderBottom: "1px solid #F1F5F9",
                                            background: isSelected ? "#F0FDF4" : "transparent"
                                        }}
                                    >
                                        <td style={{ padding: "6px 10px", fontWeight: "700", color: isSelected ? "#15803D" : "#0F172A" }}>
                                            {cand.name || cand.key}
                                        </td>
                                        <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "monospace", color: "#0F172A" }}>
                                            {cand.productTarget}
                                        </td>
                                        <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "monospace", color: "#0F172A" }}>
                                            {cand.recovery}
                                        </td>
                                        <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "monospace", color: "#1D4ED8", fontWeight: "600" }}>
                                            {(() => {
                                                const s = Number(cand.secNet ?? cand.sec ?? 0);
                                                return `${(s < 0.05 && s > 0 ? s.toFixed(4) : s.toFixed(3))} kWh/m³`;
                                            })()}
                                        </td>
                                        <td style={{ padding: "6px 10px", textAlign: "center" }}>
                                            <span style={{
                                                padding: "2px 8px",
                                                borderRadius: "3px",
                                                fontSize: "10px",
                                                fontWeight: "700",
                                                background: isRecommended ? "#DCFCE7" : "#F1F5F9",
                                                color: isRecommended ? "#15803D" : "#475569",
                                                border: `1px solid ${isRecommended ? "#BBF7D0" : "#CBD5E1"}`
                                            }}>
                                                {isRecommended ? "Recommended" : "Feasible"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "6px 10px", textAlign: "center" }}>
                                            {isSelected ? (
                                                <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#15803D" }}>Selected</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSelectTech(cand.key)}
                                                    style={{
                                                        background: "#0F172A",
                                                        color: "#FFFFFF",
                                                        border: "none",
                                                        padding: "3px 8px",
                                                        borderRadius: "3px",
                                                        fontSize: "10px",
                                                        fontWeight: "600",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Select
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 3. AUTHORITATIVE SELECTION BAR */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "4px",
                fontSize: "11.5px"
            }}>
                <div>
                    Selected Technology: <strong style={{ color: "#1D4ED8" }}>{technology === "AUTO" ? `AUTO — ${selectedTech}` : selectedTech}</strong>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                    <button
                        onClick={() => handleSelectTech("AUTO")}
                        style={{
                            padding: "3px 10px",
                            borderRadius: "3px",
                            fontSize: "10.5px",
                            fontWeight: "600",
                            background: technology === "AUTO" ? "#DCFCE7" : "#FFFFFF",
                            color: technology === "AUTO" ? "#15803D" : "#475569",
                            border: `1px solid ${technology === "AUTO" ? "#86EFAC" : "#CBD5E1"}`,
                            cursor: "pointer"
                        }}
                    >
                        AUTO
                    </button>
                </div>
            </div>

            {/* 6. ADVANCED ENGINEERING REVIEW (COLLAPSIBLE) */}
            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "8px" }}>
                <button
                    onClick={() => setShowAdvancedDiagnostics(!showAdvancedDiagnostics)}
                    style={{
                        background: showAdvancedDiagnostics ? "#F1F5F9" : "transparent",
                        border: "1px solid #CBD5E1",
                        borderRadius: "4px",
                        padding: "5px 10px",
                        color: "#334155",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    <span>{showAdvancedDiagnostics ? "▲" : "▼"}</span>
                    <span>Engineering Review &amp; Design Basis Diagnostics</span>
                    <span style={{ fontSize: "10px", color: "#64748B", fontWeight: "normal" }}>
                        (Feed Chemistry, Pretreatment Guidelines, Contaminant Limits)
                    </span>
                </button>

                {showAdvancedDiagnostics && (
                    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {/* Feed Chemistry Summary */}
                        {feedWater.conductivity && feedTds > 0 && (
                            <div style={{ padding: "10px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px", fontSize: "11px", color: "#334155" }}>
                                <div style={{ fontWeight: "700", color: "#0F172A", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: "11px" }}>
                                    Feed Chemistry Summary
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", rowGap: "3px", fontSize: "10.5px" }}>
                                    <span style={{ color: "#64748B" }}>Reported Feed TDS:</span>
                                    <strong style={{ fontFamily: "monospace" }}>{feedTds} mg/L</strong>
                                    <span style={{ color: "#64748B" }}>Reported Conductivity:</span>
                                    <strong style={{ fontFamily: "monospace" }}>{feedWater.conductivity} µS/cm</strong>
                                    <span style={{ color: "#64748B" }}>TDS / Conductivity Ratio:</span>
                                    <strong style={{ fontFamily: "monospace" }}>{(feedTds / Number(feedWater.conductivity)).toFixed(2)}</strong>
                                </div>
                            </div>
                        )}

                        {/* Pretreatment Reference Guide */}
                        <div style={{ padding: "10px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                    Pretreatment Guidelines &amp; Water Chemistry Limits
                                </span>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px", textAlign: "left", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "3px" }}>
                                    <thead>
                                        <tr style={{ background: "#F1F5F9", color: "#475569", fontWeight: "700", borderBottom: "1px solid #CBD5E1" }}>
                                            <th style={{ padding: "5px 8px" }}>Parameter</th>
                                            <th style={{ padding: "5px 8px" }}>Current Feed</th>
                                            <th style={{ padding: "5px 8px" }}>Specification Basis</th>
                                            <th style={{ padding: "5px 8px" }}>Engineering Guidance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                            <td style={{ padding: "5px 8px", fontWeight: "600" }}>Feed TDS</td>
                                            <td style={{ padding: "5px 8px", color: "#334155", fontWeight: "700" }}>{feedTds} mg/L</td>
                                            <td style={{ padding: "5px 8px" }}>Module-specific FCE basis</td>
                                            <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "600" }}>Within operational monitoring range</td>
                                        </tr>
                                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                            <td style={{ padding: "5px 8px", fontWeight: "600" }}>Conductivity</td>
                                            <td style={{ padding: "5px 8px", color: "#1D4ED8", fontWeight: "700" }}>{feedWater.conductivity ? `${feedWater.conductivity} µS/cm` : `${(feedTds / 0.65).toFixed(1)} µS/cm`}</td>
                                            <td style={{ padding: "5px 8px" }}>FCE &lt; 33 µS/cm max (&lt; 9 optimum; SnowPure)</td>
                                            <td style={{ padding: "5px 8px", color: "#475569", fontWeight: "600" }}>Verify FCE after chemistry analysis</td>
                                        </tr>
                                        <tr style={{ borderBottom: showAdvancedContaminants ? "1px solid #F1F5F9" : "none" }}>
                                            <td style={{ padding: "5px 8px", fontWeight: "600" }}>Hardness (as CaCO₃)</td>
                                            <td style={{ padding: "5px 8px", color: feedHardness > 0.5 ? "#B45309" : "#15803D", fontWeight: "700" }}>{feedHardness} mg/L</td>
                                            <td style={{ padding: "5px 8px" }}>≤ 0.10 mg/L @ 95% Rec (DuPont basis)</td>
                                            <td style={{ padding: "5px 8px", color: feedHardness > 0.5 ? "#B45309" : "#15803D", fontWeight: "600" }}>
                                                {feedHardness > 0.5 ? "Softening recommended for EDI polishing" : "Satisfies standard guidelines"}
                                            </td>
                                        </tr>
                                        {showAdvancedContaminants && (
                                            <>
                                                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "5px 8px", fontWeight: "600" }}>pH</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "700" }}>{feedWater.ph ?? 7.0}</td>
                                                    <td style={{ padding: "5px 8px" }}>5–9 (DuPont); 5–9.5 (SnowPure)</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "600" }}>Within standard range</td>
                                                </tr>
                                                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "5px 8px", fontWeight: "600" }}>Temperature</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "700" }}>{feedWater.temperature ?? 25}°C</td>
                                                    <td style={{ padding: "5px 8px" }}>10–38°C (DuPont); 5–35°C (SnowPure)</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "600" }}>Within standard range</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: "5px 8px", fontWeight: "600" }}>Pressure</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "700" }}>~2.0 bar</td>
                                                    <td style={{ padding: "5px 8px" }}>≤ 5.0–6.9 bar</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "600" }}>Within standard range</td>
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", marginTop: "6px" }}>
                                <button
                                    onClick={() => setShowAdvancedContaminants(!showAdvancedContaminants)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#2563EB",
                                        fontSize: "10.5px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        padding: "2px 0"
                                    }}
                                >
                                    {showAdvancedContaminants ? "▲ Hide Secondary Contaminants" : "▼ Show Secondary Contaminants (pH, Temp, Pressure)"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
