import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { AlertTriangle, ChevronDown, ChevronUp, Cpu, Info, CheckCircle2, Zap } from "lucide-react";

export default function RecommendationPanel() {
    const { designResult, feedWater } = useApp();
    const [showComparativeRationale, setShowComparativeRationale] = useState(true);

    const aiRec = designResult?.aiRecommendation;
    const engineering = designResult?.engineering || {};

    if (!designResult || !aiRec) {
        return (
            <div className="panel">
                <h3 className="panel-title">AI Technology Recommendation</h3>
                <p style={{ color: "#6B7280", fontSize: "13px", margin: "8px 0 0 0" }}>Generate design to view AI recommendation.</p>
            </div>
        );
    }

    const format = (value, digits = 1) => {
        if (value === undefined || value === null || isNaN(value)) {
            return "-";
        }
        return Number(value).toFixed(digits);
    };

    const process = designResult?.process || {};
    const activeTechnology = process.technology || engineering?.technology || "-";
    const recommendedProcess = process.recommendedProcess || aiRec.recommendedProcess || "-";
    const feedTDS = feedWater.tds || 500;
    const targetTDS = feedWater.targetTds || 50;
    const rationale = aiRec.comparativeRationale || {};

    const isHighSalinityFeed = feedTDS > 1500;

    return (
        <div className="panel">
            <h3 className="panel-title" style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>
                AI Technology Recommendation Engine
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>Selected Technology</div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#2563EB", marginTop: "4px" }}>{activeTechnology}</div>
                </div>

                <div style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>Recommended Process</div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#16A34A", marginTop: "4px" }}>{recommendedProcess}</div>
                </div>
            </div>

            {/* High Salinity FCDI Operation Rationale Banner */}
            {isHighSalinityFeed && engineering.limitationReason && (
                <div style={{ marginTop: "10px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "8px", padding: "10px 14px", fontSize: "11.5px", color: "#92400E" }}>
                    <strong style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "3px" }}>
                        <AlertTriangle size={14} /> High Salinity FCDI Operation Rationale:
                    </strong>
                    {engineering.limitationReason}
                </div>
            )}

            {/* AI Recommendation Summary */}
            <div style={{ marginTop: "10px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "12px", fontSize: "12px" }}>
                <div style={{ color: "#1F2937", fontWeight: "700", marginBottom: "6px" }}>AI Recommendation Rationale</div>
                <div style={{ color: "#374151", marginBottom: "8px", lineHeight: "1.4" }}>
                    {aiRec.reason || "Recommended technology based on feed water salinity and target purity."}
                </div>
                
                {aiRec.criteria && aiRec.criteria.length > 0 && (
                    <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "8px 12px", marginBottom: "8px" }}>
                        <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#2563EB", marginBottom: "4px" }}>
                            Key Selection Criteria:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "16px", color: "#4B5563", fontSize: "11.5px" }}>
                            {aiRec.criteria.map((c, i) => (
                                <li key={i} style={{ marginBottom: "2px" }}>{c}</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#6B7280", fontSize: "11px" }}>Model Confidence: <b>{format(aiRec.confidence, 1)}%</b></span>
                    <button
                        onClick={() => setShowComparativeRationale(!showComparativeRationale)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#2563EB",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                        }}
                    >
                        {showComparativeRationale ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {showComparativeRationale ? "Hide Engineering Technology Trade-offs" : "Show Engineering Technology Trade-offs"}
                    </button>
                </div>
            </div>

            {/* Detailed Comparative Rationale (Why CDI, Why MCDI is better, Why FCDI is required, Why EDI is required) */}
            {showComparativeRationale && rationale.whyCDI && (
                <div style={{ marginTop: "12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Cpu size={16} color="#2563EB" /> Engineering Technology Selection Rationale (CDI vs MCDI vs FCDI vs EDI)
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", fontSize: "11.5px" }}>
                        {/* Why CDI */}
                        <div style={{ background: activeTechnology === "CDI" ? "#EFF6FF" : "#FAFAFA", padding: "8px 12px", borderRadius: "6px", border: activeTechnology === "CDI" ? "1px solid #93C5FD" : "1px solid #E2E8F0" }}>
                            <strong style={{ color: activeTechnology === "CDI" ? "#1D4ED8" : "#334155", display: "block", marginBottom: "2px" }}>
                                🔹 Why CDI is Selected:
                            </strong>
                            <span style={{ color: "#475569", lineHeight: "1.4" }}>{rationale.whyCDI}</span>
                        </div>

                        {/* Why MCDI is Better */}
                        <div style={{ background: activeTechnology === "MCDI" ? "#F0FDF4" : "#FAFAFA", padding: "8px 12px", borderRadius: "6px", border: activeTechnology === "MCDI" ? "1px solid #86EFAC" : "1px solid #E2E8F0" }}>
                            <strong style={{ color: activeTechnology === "MCDI" ? "#15803D" : "#334155", display: "block", marginBottom: "2px" }}>
                                🟢 Why MCDI is Better:
                            </strong>
                            <span style={{ color: "#475569", lineHeight: "1.4" }}>{rationale.whyMCDIBetter}</span>
                        </div>

                        {/* Why FCDI is Required */}
                        <div style={{ background: activeTechnology === "FCDI" ? "#EEF2FF" : "#FAFAFA", padding: "8px 12px", borderRadius: "6px", border: activeTechnology === "FCDI" ? "1px solid #C7D2FE" : "1px solid #E2E8F0" }}>
                            <strong style={{ color: activeTechnology === "FCDI" ? "#4338CA" : "#334155", display: "block", marginBottom: "2px" }}>
                                ⚡ Why FCDI is Required:
                            </strong>
                            <span style={{ color: "#475569", lineHeight: "1.4" }}>{rationale.whyFCDIRequired}</span>
                        </div>

                        {/* Why EDI is Required */}
                        <div style={{ background: activeTechnology === "EDI" ? "#FAF5FF" : "#FAFAFA", padding: "8px 12px", borderRadius: "6px", border: activeTechnology === "EDI" ? "1px solid #E9D5FF" : "1px solid #E2E8F0" }}>
                            <strong style={{ color: activeTechnology === "EDI" ? "#7E22CE" : "#334155", display: "block", marginBottom: "2px" }}>
                                💎 Why EDI is Required:
                            </strong>
                            <span style={{ color: "#475569", lineHeight: "1.4" }}>{rationale.whyEDIRequired}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}