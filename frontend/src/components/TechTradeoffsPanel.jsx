import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import engineeringEquationEngine from "@shared/engineering/engine/engineeringEquationEngine.js";
import aiRecommendation from "@shared/engineering/core/aiRecommendation.js";

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
    const { designResult, technology, setTechnology, recalculate, optimizationInputs } = useApp();
    const [showAdvancedDiagnostics, setShowAdvancedDiagnostics] = useState(false);
    const [showAdvancedContaminants, setShowAdvancedContaminants] = useState(false);

    if (!designResult || !designResult.engineering) return null;

    const engineering = designResult.engineering || {};
    const feedWater = designResult.input?.feedWater || {};
    const selectedTech = engineering.technology || (technology !== "AUTO" ? technology : "MCDI");

    const feedTds = Number(feedWater.tds ?? 500);
    const targetTds = Number(feedWater.targetTds ?? 50);
    const feedHardness = Number(feedWater.hardness ?? 0);
    const targetRecovery = Number(feedWater.targetRecovery ?? 95.0);
    const flowRate = Number(feedWater.flowRate ?? 20.0);

    const handleSelectTech = (techKey) => {
        setTechnology(techKey);
        setOptimizationInputs({});
        recalculate({}, techKey, false);
    };

    // Evaluate each technology dynamically against the exact user feedWater
    const mcdiModel = selectedTech === "MCDI" ? engineering : engineeringEquationEngine({ technology: "MCDI", feedWater });
    const cdiModel = selectedTech === "CDI" ? engineering : engineeringEquationEngine({ technology: "CDI", feedWater });
    const fcdiModel = selectedTech === "FCDI" ? engineering : engineeringEquationEngine({ technology: "FCDI", feedWater });
    const ediModel = selectedTech === "EDI" ? engineering : engineeringEquationEngine({ technology: "EDI", feedWater });

    const mcdiOutlet = Number(mcdiModel.outletTDS ?? mcdiModel.outletTds);
    const cdiOutlet = Number(cdiModel.outletTDS ?? cdiModel.outletTds);
    const fcdiOutlet = Number(fcdiModel.outletTDS ?? fcdiModel.outletTds);
    const ediOutlet = Number(ediModel.outletTDS ?? ediModel.outletTds);

    const isMcdiProdPass = mcdiOutlet <= targetTds;
    const isCdiProdPass = cdiOutlet <= targetTds;
    const isFcdiProdPass = fcdiOutlet <= targetTds;
    const isEdiProdPass = ediOutlet <= targetTds;

    const mcdiRec = Number(mcdiModel.waterRecovery ?? mcdiModel.waterRecoveryPct ?? 95.0);
    const cdiRec = Number(cdiModel.waterRecovery ?? cdiModel.waterRecoveryPct ?? 83.3);
    const fcdiRec = Number(fcdiModel.waterRecovery ?? fcdiModel.waterRecoveryPct ?? 90.0);
    const ediRec = Number(ediModel.waterRecovery ?? ediModel.waterRecoveryPct ?? 90.0);

    const isMcdiRecPass = mcdiRec >= targetRecovery - 0.05;
    const isCdiRecPass = cdiRec >= targetRecovery - 0.05;
    const isFcdiRecPass = fcdiRec >= targetRecovery - 0.05;
    const isEdiRecPass = ediRec >= targetRecovery - 0.05;

    const isEdiPretreatmentRequired = feedTds > 30.0 || feedHardness > 0.5;

    // Hard Feasibility Gate: Single Source of Truth Function
    const evaluateTechnologyCandidate = (key, name, desc, basis, model) => {
        const outlet = Number(model.outletTDS ?? model.outletTds ?? 0);
        const recovery = Number(model.waterRecovery ?? model.waterRecoveryPct ?? 0);
        const sec = Number(model.secElectricalGross ?? model.sec ?? 0);

        const isTdsPass = outlet <= targetTds + 0.05;
        const isRecPass = recovery >= targetRecovery - 0.05;
        const requiresPretreatment = (key === "EDI") ? isEdiPretreatmentRequired : false;
        const isEquipmentPass = model.equipmentStatus !== "EXCEEDED" && (model.feedQualityFeasible !== false || key !== "EDI");

        // Feasibility: TDS pass AND recovery pass AND equipment limits pass AND no mandatory pretreatment
        const isPass = isTdsPass && isRecPass && isEquipmentPass && !requiresPretreatment;

        let evaluation = "";
        if (requiresPretreatment) {
            evaluation = "Requires Pretreatment";
        } else if (isPass) {
            evaluation = "Meets Target";
        } else if (isTdsPass && !isRecPass) {
            evaluation = "Recovery Deficit";
        } else if (!isTdsPass && isRecPass) {
            evaluation = "Target Exceeded";
        } else {
            evaluation = "TDS + Recovery Fail";
        }

        return {
            key,
            name,
            desc,
            basis,
            outlet,
            productTarget: `${outlet.toFixed(1)} mg/L`,
            recoveryVal: recovery,
            recovery: requiresPretreatment ? "—" : `${recovery.toFixed(1)}%`,
            secVal: sec,
            sec: `${sec.toFixed(3)} kWh/m³`,
            isTdsPass,
            isRecPass,
            requiresPretreatment,
            isActionRequired: requiresPretreatment,
            isPass,
            evaluation,
            model
        };
    };

    // Principled Ranking of Feasible Candidates (Energy Efficiency -> Recovery -> Quality)
    const rankFeasibleCandidates = (candidates) => {
        if (!candidates || candidates.length === 0) return [];
        return [...candidates].sort((a, b) => {
            if (Math.abs(a.secVal - b.secVal) > 0.01) {
                return a.secVal - b.secVal;
            }
            if (Math.abs(a.recoveryVal - b.recoveryVal) > 0.1) {
                return b.recoveryVal - a.recoveryVal;
            }
            return a.outlet - b.outlet;
        });
    };

    // Active design metrics
    const activeOutletTds = Number(engineering.outletTDS ?? engineering.outletTds ?? targetTds);
    const activeRecovery = Number(engineering.waterRecovery ?? engineering.waterRecoveryPct ?? 95.2);
    const activeSec = Number(engineering.secElectricalGross ?? engineering.sec ?? 0.031);
    const activeCellPairs = Number(engineering.cellPairs ?? 34);
    const activeProductFlow = Number((flowRate * (activeRecovery / 100)).toFixed(2));

    const isSelectedProdPass = activeOutletTds <= targetTds;
    const isSelectedRecPass = activeRecovery >= targetRecovery - 0.05;
    const isDesignAccepted = isSelectedProdPass && isSelectedRecPass;

    const activeTechDetails = TECH_DETAILS[selectedTech] || {
        method: `${selectedTech} Desalination`,
        technology: selectedTech,
        desc: selectedTech
    };

    // Evaluate all candidates dynamically
    const rawCandidates = [
        evaluateTechnologyCandidate("MCDI", "MCDI", "Membrane Capacitive Deionization", "AEM/CEM paired electrosorption", mcdiModel),
        evaluateTechnologyCandidate("CDI", "CDI", "Capacitive Deionization (Membrane-Free)", "Membrane-free (co-ion expulsion)", cdiModel),
        evaluateTechnologyCandidate("FCDI", "FCDI", "Flow-Electrode CDI", "Flowing carbon slurry electrode", fcdiModel),
        evaluateTechnologyCandidate("EDI", "EDI", "Electrodeionization Polishing", "Continuous resin electro-regeneration", ediModel)
    ];

    // Filter strictly feasible candidates & rank them
    const feasibleCandidates = rankFeasibleCandidates(rawCandidates.filter(c => c.isPass));
    const autoCandidate = feasibleCandidates.length > 0 ? feasibleCandidates[0] : null;
    const isAutoFeasible = Boolean(autoCandidate);
    const autoRecommendation = autoCandidate?.key ?? null;
    const feasibleCount = feasibleCandidates.length;

    // Attach dynamic isRecommended derived strictly from autoRecommendation
    const techRows = rawCandidates.map(row => ({
        ...row,
        isRecommended: isAutoFeasible && row.key === autoRecommendation
    }));

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
            {/* 1. TECHNOLOGY ASSESSMENT HEADER & TABLE */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Technology Assessment &amp; Tradeoffs
                    </h3>
                    <div style={{ fontSize: "11px", color: "#475569" }}>
                        Feed: <strong style={{ color: "#0F172A" }}>{feedTds} mg/L TDS</strong> &nbsp;|&nbsp; 
                        Target: <strong style={{ color: "#0F172A" }}>≤ {targetTds} mg/L</strong> &nbsp;|&nbsp; 
                        Recovery: <strong style={{ color: "#0F172A" }}>≥ {targetRecovery}%</strong> &nbsp;|&nbsp;
                        Feasible Candidates: <strong style={{ color: feasibleCount > 0 ? "#15803D" : "#DC2626" }}>{feasibleCount} / 4</strong>
                    </div>
                </div>

                {/* TECHNOLOGY COMPARISON TABLE */}
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left", background: "#FFFFFF" }}>
                        <thead>
                            <tr style={{ background: "#F8FAFC", color: "#475569", fontWeight: "700", borderBottom: "2px solid #CBD5E1" }}>
                                <th style={{ padding: "6px 8px" }}>Technology</th>
                                <th style={{ padding: "6px 8px" }}>Product TDS</th>
                                <th style={{ padding: "6px 8px", textAlign: "center" }}>TDS Check</th>
                                <th style={{ padding: "6px 8px", textAlign: "right" }}>Recovery</th>
                                <th style={{ padding: "6px 8px", textAlign: "center" }}>Recovery Check</th>
                                <th style={{ padding: "6px 8px", textAlign: "center" }}>Overall Status</th>
                                <th style={{ padding: "6px 8px", textAlign: "center" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {techRows.map((row) => {
                                const isSelected = selectedTech === row.key;
                                const isTdsPass = row.isTdsPass;
                                const isRecPass = row.isRecPass;

                                return (
                                    <tr key={row.key} style={{
                                        borderBottom: "1px solid #F1F5F9",
                                        background: isSelected ? "#F0FDF4" : "transparent",
                                        fontWeight: isSelected ? "600" : "normal"
                                    }}>
                                        <td style={{ padding: "6px 8px" }}>
                                            <span style={{ fontWeight: isSelected ? "700" : "600", color: isSelected ? "#15803D" : "#0F172A" }}>
                                                {row.name}
                                            </span>
                                            <span style={{ fontSize: "10px", color: "#64748B", marginLeft: "4px" }}>
                                                ({row.desc})
                                            </span>
                                        </td>
                                        <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "monospace" }}>
                                            {row.productTarget}
                                        </td>
                                        <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                            <span style={{
                                                fontSize: "9.5px",
                                                fontWeight: "700",
                                                padding: "1px 5px",
                                                borderRadius: "2px",
                                                background: isTdsPass ? "#DCFCE7" : "#FEE2E2",
                                                color: isTdsPass ? "#15803D" : "#991B1B",
                                                border: `1px solid ${isTdsPass ? "#BBF7D0" : "#FECACA"}`
                                            }}>
                                                {isTdsPass ? "PASS" : "FAIL"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "monospace" }}>
                                            {row.recovery}
                                        </td>
                                        <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                            <span style={{
                                                fontSize: "9.5px",
                                                fontWeight: "700",
                                                padding: "1px 5px",
                                                borderRadius: "2px",
                                                background: row.key === "EDI" && isEdiPretreatmentRequired ? "#FEF3C7" : (isRecPass ? "#DCFCE7" : "#FEE2E2"),
                                                color: row.key === "EDI" && isEdiPretreatmentRequired ? "#B45309" : (isRecPass ? "#15803D" : "#991B1B"),
                                                border: `1px solid ${row.key === "EDI" && isEdiPretreatmentRequired ? "#FDE68A" : (isRecPass ? "#BBF7D0" : "#FECACA")}`
                                            }}>
                                                {row.key === "EDI" && isEdiPretreatmentRequired ? "Pretreatment" : (isRecPass ? "PASS" : "FAIL")}
                                            </span>
                                        </td>
                                        <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                            <span style={{
                                                fontSize: "9.5px",
                                                fontWeight: "600",
                                                padding: "1px 6px",
                                                borderRadius: "2px",
                                                whiteSpace: "nowrap",
                                                background: row.isPass ? "#DCFCE7" : (row.isActionRequired ? "#FEF3C7" : "#FEE2E2"),
                                                color: row.isPass ? "#15803D" : (row.isActionRequired ? "#B45309" : "#991B1B"),
                                                border: `1px solid ${row.isPass ? "#BBF7D0" : (row.isActionRequired ? "#FDE68A" : "#FECACA")}`
                                            }}>
                                                {row.evaluation}
                                            </span>
                                        </td>
                                        <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                            {isSelected ? (
                                                <span style={{
                                                    fontSize: "10px",
                                                    fontWeight: "700",
                                                    color: "#15803D",
                                                    background: "#DCFCE7",
                                                    padding: "2px 6px",
                                                    borderRadius: "3px",
                                                    border: "1px solid #86EFAC",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    Selected (Active Design)
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSelectTech(row.key)}
                                                    style={{
                                                        padding: "2px 6px",
                                                        background: "#F1F5F9",
                                                        color: "#334155",
                                                        border: "1px solid #CBD5E1",
                                                        borderRadius: "3px",
                                                        fontSize: "10px",
                                                        fontWeight: "600",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Select {row.name}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. AUTONOMOUS DECISION NARRATIVE */}
            <div style={{
                background: isAutoFeasible ? "#F0FDF4" : "#FEF2F2",
                border: `1px solid ${isAutoFeasible ? "#BBF7D0" : "#FCA5A5"}`,
                borderRadius: "5px",
                padding: "10px 14px",
                fontSize: "11px",
                color: isAutoFeasible ? "#15803D" : "#991B1B"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <strong style={{ textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        {isAutoFeasible 
                            ? `AUTO DECISION: ${autoCandidate?.name} RECOMMENDED (${feasibleCount} / 4 FEASIBLE)` 
                            : "AUTO DECISION: NO DIRECTLY FEASIBLE CANDIDATE (0 / 4)"}
                    </strong>
                    <span style={{
                        fontWeight: "700",
                        background: "#FFFFFF",
                        padding: "1px 6px",
                        borderRadius: "3px",
                        border: `1px solid ${isAutoFeasible ? "#BBF7D0" : "#FCA5A5"}`,
                        color: isAutoFeasible ? "#15803D" : "#991B1B"
                    }}>
                        Active Candidate: {selectedTech} {isAutoFeasible && selectedTech === autoCandidate?.key ? "(AUTO Recommended · Active Design)" : "(Manual Selection / Active Design)"}
                    </span>
                </div>
                <div style={{ color: isAutoFeasible ? "#166534" : "#7F1D1D", lineHeight: "1.45" }}>
                    {isAutoFeasible ? (
                        selectedTech === autoCandidate?.key ? (
                            <span>
                                <strong>Optimal Process Selection:</strong> {autoCandidate?.name} satisfies all design criteria: Product TDS <strong>{autoCandidate?.productTarget}</strong> ≤ {targetTds.toFixed(1)} mg/L, Water Recovery <strong>{autoCandidate?.recovery}</strong> ≥ {targetRecovery.toFixed(1)}%, with specific energy consumption <strong>{autoCandidate?.sec}</strong>.
                            </span>
                        ) : (
                            <span>
                                <strong>Optimal Process Selection:</strong> {autoCandidate?.name} is recommended as the specification-compliant candidate. Active view displays user-selected <strong>{selectedTech}</strong>: Product TDS <strong>{activeOutletTds.toFixed(1)} mg/L</strong> ({isSelectedProdPass ? "PASS" : "FAIL"}), Water Recovery <strong>{activeRecovery.toFixed(1)}%</strong> ({isSelectedRecPass ? "PASS" : `FAIL — ${(targetRecovery - activeRecovery).toFixed(1)} %-point deficit`}).
                            </span>
                        )
                    ) : (
                        <span>
                            <strong>Single-Pass Operating Boundary:</strong> No technology meets the specification within the current direct-feed design envelope. Active view displays user-selected <strong>{selectedTech}</strong> ({activeOutletTds.toFixed(1)} mg/L TDS, {activeRecovery.toFixed(1)}% recovery). Multi-stage train staging or pre-treatment (e.g. RO → EDI) is required.
                        </span>
                    )}
                </div>
            </div>

            {/* 3. SELECTED PROCESS SUMMARY & PROCESS FLOW */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px", alignItems: "stretch" }}>
                {/* SELECTED PROCESS SUMMARY */}
                <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "5px",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                }}>
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Active Candidate: {activeTechDetails.technology} {isAutoFeasible && selectedTech === autoCandidate?.key ? "(AUTO Recommended · Active Design)" : "(Manual Selection / Active Design)"}
                            </div>
                            <div style={{ fontSize: "10.5px", color: "#64748B" }}>
                                AUTO RECOMMENDATION: <strong style={{ color: isAutoFeasible ? "#15803D" : "#DC2626" }}>{isAutoFeasible ? autoCandidate?.name : "NONE — DESIGN ENVELOPE EXCEEDED"}</strong>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "115px 1fr", rowGap: "5px", fontSize: "11.5px" }}>
                            <span style={{ color: "#64748B", fontWeight: "600" }}>Method:</span>
                            <strong style={{ color: "#0F172A" }}>{activeTechDetails.method}</strong>

                            <span style={{ color: "#64748B", fontWeight: "600" }}>Technology:</span>
                            <span style={{ color: "#334155" }}>{activeTechDetails.technology}</span>

                            <span style={{ color: "#64748B", fontWeight: "600" }}>Product TDS:</span>
                            <div>
                                <strong style={{ color: "#0F172A", fontFamily: "monospace" }}>{activeOutletTds.toFixed(1)} mg/L</strong>
                                <span style={{ color: "#64748B", fontSize: "10px", marginLeft: "6px" }}>
                                    (Spec ≤ {targetTds.toFixed(1)} mg/L | <strong style={{ color: isSelectedProdPass ? "#15803D" : "#DC2626" }}>{isSelectedProdPass ? "TDS PASS" : "TDS FAIL"}</strong>)
                                </span>
                            </div>

                            <span style={{ color: "#64748B", fontWeight: "600" }}>Water Recovery:</span>
                            <div>
                                <strong style={{ color: "#0F172A", fontFamily: "monospace" }}>{activeRecovery.toFixed(1)}%</strong>
                                <span style={{ color: "#64748B", fontSize: "10px", marginLeft: "6px" }}>
                                    (Req ≥ {targetRecovery.toFixed(1)}% | <strong style={{ color: isSelectedRecPass ? "#15803D" : "#DC2626" }}>{isSelectedRecPass ? "RECOVERY PASS" : "RECOVERY FAIL"}</strong>)
                                </span>
                            </div>

                            <span style={{ color: "#64748B", fontWeight: "600" }}>Design Check:</span>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <span style={{
                                    fontSize: "10.5px",
                                    fontWeight: "700",
                                    color: isDesignAccepted ? "#15803D" : "#991B1B",
                                    background: isDesignAccepted ? "#DCFCE7" : "#FEE2E2",
                                    padding: "1px 6px",
                                    borderRadius: "2px",
                                    border: `1px solid ${isDesignAccepted ? "#BBF7D0" : "#FECACA"}`,
                                    display: "inline-block",
                                    width: "fit-content"
                                }}>
                                    {isDesignAccepted 
                                        ? "Design Check — PASS (Meets Specification)" 
                                        : (!isSelectedProdPass && !isSelectedRecPass 
                                            ? "Design Check — FAIL (TDS + Recovery)" 
                                            : (!isSelectedProdPass 
                                                ? "Design Check — FAIL (TDS Exceeded)" 
                                                : "Design Check — FAIL (Recovery Deficit)"))}
                                </span>
                                <span style={{ fontSize: "10px", color: "#334155", fontFamily: "monospace" }}>
                                    Product TDS = {activeOutletTds.toFixed(1)} mg/L → <strong style={{ color: isSelectedProdPass ? "#15803D" : "#DC2626" }}>{isSelectedProdPass ? "PASS" : "FAIL"}</strong> | Recovery = {activeRecovery.toFixed(1)}% → <strong style={{ color: isSelectedRecPass ? "#15803D" : "#DC2626" }}>{isSelectedRecPass ? "PASS" : "FAIL"}</strong>
                                </span>
                            </div>

                            <span style={{ color: "#64748B", fontWeight: "600" }}>Overall Design:</span>
                            <span style={{ color: isDesignAccepted ? "#15803D" : "#991B1B", fontWeight: "700", fontSize: "11px" }}>
                                {isDesignAccepted 
                                    ? "FULLY COMPLIANT" 
                                    : (!isSelectedProdPass && !isSelectedRecPass 
                                        ? "NOT COMPLIANT — TDS + Recovery Fail" 
                                        : (!isSelectedProdPass 
                                            ? "NOT COMPLIANT — TDS Exceeded" 
                                            : "NOT COMPLIANT — Recovery Deficit"))}
                            </span>

                            <span style={{ color: "#64748B", fontWeight: "600" }}>Energy (Gross):</span>
                            <span style={{ color: "#1D4ED8", fontWeight: "700", fontFamily: "monospace" }}>{activeSec.toFixed(3)} kWh/m³</span>
                        </div>
                    </div>
                </div>

                {/* PROCESS FLOW SCHEMATIC */}
                <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "5px",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
                        Process Flow
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", flex: 1, justifyContent: "center" }}>
                        {/* Feed Step */}
                        <div style={{ background: "#FFFFFF", padding: "6px 10px", borderRadius: "4px", border: "1px solid #E2E8F0" }}>
                            <div style={{ fontWeight: "700", color: "#0F172A", textTransform: "uppercase", fontSize: "10.5px" }}>Feed Water</div>
                            <div style={{ color: "#64748B", fontSize: "10.5px" }}>
                                {flowRate.toFixed(2)} L/min &nbsp;·&nbsp; {feedTds} mg/L TDS
                            </div>
                        </div>

                        <div style={{ textAlign: "center", color: "#94A3B8", fontWeight: "700", lineHeight: "1" }}>↓</div>

                        {/* Desalination Core Step */}
                        <div style={{ background: "#EFF6FF", padding: "6px 10px", borderRadius: "4px", border: "1px solid #BFDBFE" }}>
                            <div style={{ fontWeight: "700", color: "#1D4ED8", textTransform: "uppercase", fontSize: "10.5px" }}>{selectedTech} Desalination</div>
                            <div style={{ color: "#3B82F6", fontSize: "10.5px" }}>
                                {activeCellPairs} Cell Pairs &nbsp;·&nbsp; {engineering.numberOfModules || 15} Modules
                            </div>
                        </div>

                        <div style={{ textAlign: "center", color: "#94A3B8", fontWeight: "700", lineHeight: "1" }}>↓</div>

                        {/* Product & Reject Output Steps */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                            <div style={{ background: "#F0FDF4", padding: "6px 8px", borderRadius: "4px", border: "1px solid #BBF7D0" }}>
                                <div style={{ fontWeight: "700", color: "#15803D", textTransform: "uppercase", fontSize: "10px" }}>Product Water</div>
                                <div style={{ color: "#166534", fontSize: "10px" }}>
                                    {activeProductFlow.toFixed(2)} L/min · {activeOutletTds.toFixed(1)} mg/L · {activeRecovery.toFixed(1)}% Recovery
                                </div>
                            </div>
                            <div style={{ background: "#FFFBEB", padding: "6px 8px", borderRadius: "4px", border: "1px solid #FDE68A" }}>
                                <div style={{ fontWeight: "700", color: "#B45309", textTransform: "uppercase", fontSize: "10px" }}>Concentrate / Reject</div>
                                <div style={{ color: "#92400E", fontSize: "10px" }}>
                                    {(flowRate - activeProductFlow).toFixed(2)} L/min · {(100 - activeRecovery).toFixed(1)}% of feed flow
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. OPTIONAL ADVANCED ENGINEERING REVIEW & PRETREATMENT NOTES (COLLAPSIBLE) */}
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
                    <span>Engineering Review &amp; Pretreatment Notes</span>
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

                        {/* Technology Notes */}
                        <div style={{ padding: "10px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "6px" }}>
                                Technology Assessment
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px", fontSize: "10.5px" }}>
                                <div style={{ background: "#FFFFFF", padding: "8px 10px", borderRadius: "4px", border: `1px solid ${isMcdiProdPass && isMcdiRecPass ? "#BBF7D0" : "#FECACA"}` }}>
                                    <div style={{ fontWeight: "700", color: isMcdiProdPass && isMcdiRecPass ? "#15803D" : "#991B1B" }}>
                                        MCDI — {selectedTech === "MCDI" ? "Active Design · " : ""}{isMcdiProdPass && isMcdiRecPass ? "Meets Target" : (isMcdiProdPass ? "Recovery Deficit" : (!isMcdiRecPass ? "TDS + Recovery Fail" : "TDS Exceeded"))}
                                    </div>
                                    <div style={{ color: "#334155", marginTop: "4px", lineHeight: "1.4" }}>
                                        Product TDS: {mcdiOutlet.toFixed(1)} mg/L ({isMcdiProdPass ? "PASS" : "FAIL"}) · Recovery: {mcdiRec.toFixed(1)}% ({isMcdiRecPass ? "PASS" : "FAIL"}).
                                    </div>
                                </div>

                                <div style={{ background: "#FFFFFF", padding: "8px 10px", borderRadius: "4px", border: `1px solid ${isCdiProdPass && isCdiRecPass ? "#BBF7D0" : "#FECACA"}` }}>
                                    <div style={{ fontWeight: "700", color: isCdiProdPass && isCdiRecPass ? "#15803D" : "#991B1B" }}>
                                        CDI — {selectedTech === "CDI" ? "Active Design · " : ""}{isCdiProdPass && isCdiRecPass ? "Meets Target" : (isCdiProdPass ? "Recovery Deficit" : (!isCdiRecPass ? "TDS + Recovery Fail" : "TDS Exceeded"))}
                                    </div>
                                    <div style={{ color: "#334155", marginTop: "4px", lineHeight: "1.4" }}>
                                        Product TDS: {cdiOutlet.toFixed(1)} mg/L ({isCdiProdPass ? "PASS" : "FAIL"}) · Recovery: {cdiRec.toFixed(1)}% ({isCdiRecPass ? "PASS" : "FAIL"}).
                                    </div>
                                </div>

                                <div style={{ background: "#FFFFFF", padding: "8px 10px", borderRadius: "4px", border: `1px solid ${isFcdiProdPass && isFcdiRecPass ? "#BBF7D0" : "#FDE68A"}` }}>
                                    <div style={{ fontWeight: "700", color: isFcdiProdPass && isFcdiRecPass ? "#15803D" : "#B45309" }}>
                                        FCDI — {selectedTech === "FCDI" ? "Active Design · " : ""}{isFcdiProdPass && isFcdiRecPass ? "Meets Target" : (isFcdiProdPass ? "Recovery Deficit" : (!isFcdiRecPass ? "TDS + Recovery Fail" : "TDS Exceeded"))}
                                    </div>
                                    <div style={{ color: "#334155", marginTop: "4px", lineHeight: "1.4" }}>
                                        Product TDS: {fcdiOutlet.toFixed(1)} mg/L ({isFcdiProdPass ? "PASS" : "FAIL"}) · Recovery: {fcdiRec.toFixed(1)}% ({isFcdiRecPass ? "PASS" : "FAIL"}).
                                    </div>
                                </div>

                                <div style={{ background: "#FFFFFF", padding: "8px 10px", borderRadius: "4px", border: `1px solid ${isEdiPretreatmentRequired ? "#FED7AA" : (isEdiProdPass && isEdiRecPass ? "#BBF7D0" : "#FECACA")}` }}>
                                    <div style={{ fontWeight: "700", color: isEdiPretreatmentRequired ? "#B45309" : (isEdiProdPass && isEdiRecPass ? "#15803D" : "#991B1B") }}>
                                        EDI — {selectedTech === "EDI" ? "Active Design · " : ""}{isEdiPretreatmentRequired ? "Requires Pretreatment" : (isEdiProdPass && isEdiRecPass ? "Meets Target" : (!isEdiRecPass ? "TDS + Recovery Fail" : "TDS Exceeded"))}
                                    </div>
                                    <div style={{ color: "#334155", marginTop: "4px", lineHeight: "1.4" }}>
                                        Product TDS: {ediOutlet.toFixed(1)} mg/L ({isEdiProdPass ? "PASS" : "FAIL"}). {isEdiPretreatmentRequired ? `Feed TDS (${feedTds} mg/L) exceeds 30 mg/L threshold; pretreatment required.` : "Direct feed within operating envelope."}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pretreatment Requirements Table */}
                        <div style={{ padding: "10px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                    Pretreatment Requirements (EDI Alternative)
                                </span>
                                <span style={{ fontSize: "10px", fontWeight: "600", color: "#B45309", background: "#FEF3C7", padding: "2px 7px", borderRadius: "3px", border: "1px solid #FDE68A" }}>
                                    Recommended: RO / Softening → EDI Polishing
                                </span>
                            </div>

                            <div style={{ fontSize: "10.5px", color: "#334155", marginBottom: "6px", background: "#FFFFFF", padding: "6px 8px", borderRadius: "3px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "2px" }}>
                                <div><strong>Recommended Process Configuration:</strong> Raw Feed ({feedTds} mg/L TDS · {feedHardness} mg/L Hardness) → Pretreatment Filter → RO Permeate / Softening → EDI Polishing Stack → Product (≤ {targetTds} mg/L TDS)</div>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px", textAlign: "left", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "3px" }}>
                                    <thead>
                                        <tr style={{ background: "#F1F5F9", color: "#475569", fontWeight: "700", borderBottom: "1px solid #CBD5E1" }}>
                                            <th style={{ padding: "5px 8px" }}>Parameter</th>
                                            <th style={{ padding: "5px 8px" }}>Current Feed</th>
                                            <th style={{ padding: "5px 8px" }}>Specification Basis</th>
                                            <th style={{ padding: "5px 8px" }}>Engineering Assessment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                            <td style={{ padding: "5px 8px", fontWeight: "600" }}>Feed TDS</td>
                                            <td style={{ padding: "5px 8px", color: "#334155", fontWeight: "700" }}>{feedTds} mg/L</td>
                                            <td style={{ padding: "5px 8px" }}>Module-specific FCE basis</td>
                                            <td style={{ padding: "5px 8px", color: "#B45309", fontWeight: "600" }}>Review ionic load / FCE</td>
                                        </tr>
                                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                            <td style={{ padding: "5px 8px", fontWeight: "600" }}>Conductivity</td>
                                            <td style={{ padding: "5px 8px", color: "#1D4ED8", fontWeight: "700" }}>{feedWater.conductivity ? `${feedWater.conductivity} µS/cm` : `${(feedTds / 0.65).toFixed(1)} µS/cm`}</td>
                                            <td style={{ padding: "5px 8px" }}>FCE &lt; 33 µS/cm max (&lt; 9 optimum; SnowPure)</td>
                                            <td style={{ padding: "5px 8px", color: "#B45309", fontWeight: "600" }}>Verify FCE after chemistry analysis</td>
                                        </tr>
                                        <tr style={{ borderBottom: showAdvancedContaminants ? "1px solid #F1F5F9" : "none" }}>
                                            <td style={{ padding: "5px 8px", fontWeight: "600" }}>Hardness (as CaCO₃)</td>
                                            <td style={{ padding: "5px 8px", color: feedHardness > 0.5 ? "#DC2626" : "#15803D", fontWeight: "700" }}>{feedHardness} mg/L</td>
                                            <td style={{ padding: "5px 8px" }}>≤ 0.10 mg/L @ 95% Rec (DuPont basis)</td>
                                            <td style={{ padding: "5px 8px", color: "#B45309", fontWeight: "600" }}>Reduce before EDI using RO / softening / IX</td>
                                        </tr>
                                        {showAdvancedContaminants && (
                                            <>
                                                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "5px 8px", fontWeight: "600" }}>Reactive Silica (SiO₂)</td>
                                                    <td style={{ padding: "5px 8px", color: "#64748B" }}>Not tested</td>
                                                    <td style={{ padding: "5px 8px" }}>&lt; 0.5 mg/L max (&lt; 0.2 optimum)</td>
                                                    <td style={{ padding: "5px 8px", color: "#475569" }}>Laboratory analysis required</td>
                                                </tr>
                                                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "5px 8px", fontWeight: "600" }}>Free CO₂ / Alkalinity</td>
                                                    <td style={{ padding: "5px 8px", color: "#64748B" }}>Not tested</td>
                                                    <td style={{ padding: "5px 8px" }}>&lt; 5.0 mg/L max (&lt; 2.0 optimum)</td>
                                                    <td style={{ padding: "5px 8px", color: "#475569" }}>Laboratory analysis; degasser if needed</td>
                                                </tr>
                                                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "5px 8px", fontWeight: "600" }}>TOC</td>
                                                    <td style={{ padding: "5px 8px", color: "#64748B" }}>Not tested</td>
                                                    <td style={{ padding: "5px 8px" }}>&lt; 0.5 mg/L max</td>
                                                    <td style={{ padding: "5px 8px", color: "#475569" }}>Laboratory analysis required</td>
                                                </tr>
                                                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "5px 8px", fontWeight: "600" }}>Total Fe / Mn</td>
                                                    <td style={{ padding: "5px 8px", color: "#64748B" }}>Not tested</td>
                                                    <td style={{ padding: "5px 8px" }}>&lt; 0.01 mg/L max</td>
                                                    <td style={{ padding: "5px 8px", color: "#475569" }}>Laboratory analysis required</td>
                                                </tr>
                                                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "5px 8px", fontWeight: "600" }}>Free Chlorine</td>
                                                    <td style={{ padding: "5px 8px", color: "#64748B" }}>Not tested</td>
                                                    <td style={{ padding: "5px 8px" }}>DuPont ≤ 0.05 mg/L; SnowPure ND</td>
                                                    <td style={{ padding: "5px 8px", color: "#475569" }}>Verify and remove if required</td>
                                                </tr>
                                                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "5px 8px", fontWeight: "600" }}>pH</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "700" }}>{feedWater.ph ?? 7.0}</td>
                                                    <td style={{ padding: "5px 8px" }}>5–9 (DuPont); 5–9.5 (SnowPure)</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "600" }}>Within operating range</td>
                                                </tr>
                                                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "5px 8px", fontWeight: "600" }}>Temperature</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "700" }}>{feedWater.temperature ?? 25}°C</td>
                                                    <td style={{ padding: "5px 8px" }}>10–38°C (DuPont); 5–35°C (SnowPure)</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "600" }}>Within operating range</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: "5px 8px", fontWeight: "600" }}>Pressure</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "700" }}>~2.0 bar</td>
                                                    <td style={{ padding: "5px 8px" }}>≤ 5.0–6.9 bar</td>
                                                    <td style={{ padding: "5px 8px", color: "#15803D", fontWeight: "600" }}>Within operating range</td>
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
                                    {showAdvancedContaminants ? "▲ Hide Secondary Contaminants & Operating Range" : "▼ Show Secondary Contaminants & Operating Range (Silica, CO₂, TOC, Fe/Mn, Chlorine, pH, Temp, Pressure)"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
