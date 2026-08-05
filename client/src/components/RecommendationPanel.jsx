import React from "react";
import { useApp } from "../context/AppContext";
import { AlertTriangle } from "lucide-react";

export default function RecommendationPanel() {
    const { designResult, feedWater } = useApp();

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

    const isHighSalinityFeed = feedTDS > 1500;

    return (
        <div className="panel">
            <h3 className="panel-title" style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>
                AI Technology Recommendation
            </h3>

            {/* Selected Technology & Recommended Process Cards */}
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

            {/* AI Recommendation Rationale & Model Confidence */}
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
                
                <div style={{ color: "#6B7280", fontSize: "11px" }}>
                    Model Confidence: <b>{format(aiRec.confidence, 1)}%</b>
                </div>
            </div>
        </div>
    );
}