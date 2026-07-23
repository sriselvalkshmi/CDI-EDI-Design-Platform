import React from "react";
import { useApp } from "../context/AppContext";

export default function RecommendationPanel() {
    const { designResult } = useApp();

    const aiRecommendation = designResult?.aiRecommendation;
    const engineering = designResult?.engineering;

    if (!designResult || !aiRecommendation) {
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
    const recommendedProcess = process.recommendedProcess || aiRecommendation.recommendedProcess || "-";

    return (
        <div className="panel">
            <h3 className="panel-title" style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>AI Technology Recommendation</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>Selected Engineering Technology</div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#2563EB", marginTop: "4px" }}>{activeTechnology}</div>
                </div>

                <div style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>Recommended Process</div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#16A34A", marginTop: "4px" }}>{recommendedProcess}</div>
                </div>
            </div>

            <div style={{ marginTop: "12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "10px", fontSize: "12px" }}>
                <div style={{ color: "#1F2937", fontWeight: "600", marginBottom: "4px" }}>AI Recommendation Rationale</div>
                <div style={{ color: "#4B5563" }}>{aiRecommendation.reason || "Recommended technology based on feed water salinity and target purity."}</div>
                <div style={{ marginTop: "6px", color: "#6B7280" }}>Model Confidence: <b>{format(aiRecommendation.confidence, 1)}%</b></div>
            </div>
        </div>
    );
}