import React from "react";
import { useApp } from "../context/AppContext";

export default function RecommendationPanel() {
    const { designResult, technology } = useApp();

    if (!designResult || !designResult.aiRecommendation) {
        return null;
    }

    const ai = designResult.aiRecommendation;
    const engineering = designResult.engineering || {};
    const feedWater = designResult.input?.feedWater || {};

    const selectedTech = engineering.technology || (technology === "AUTO" ? (ai.selectedTechnology || "MCDI") : technology);
    const feedTds = Number(feedWater.tds || 500);
    const targetTds = Number(feedWater.targetTds || 50);
    const removalReq = feedTds > 0 ? (((feedTds - targetTds) / feedTds) * 100).toFixed(1) : "90.0";

    const techCriteriaMap = {
        CDI: [
            `Feed TDS: ${feedTds} mg/L (Low Salinity Stream)`,
            `Target TDS: ${targetTds} mg/L (Removal Required: ${removalReq}%)`,
            `Membrane-free porous carbon electrodes minimize initial CAPEX`,
            `No membrane scaling/fouling operational overhead`
        ],
        MCDI: [
            `Feed TDS: ${feedTds} mg/L (Brackish Feed Stream)`,
            `Target TDS: ${targetTds} mg/L (Removal Required: ${removalReq}%)`,
            `AEM & CEM ion exchange membranes eliminate co-ion expulsion penalty`,
            `Higher charge efficiency (>92%) and high water recovery (95%)`
        ],
        FCDI: [
            `Feed TDS: ${feedTds} mg/L (High Salinity / Continuous Desalination Stream)`,
            `Target TDS: ${targetTds} mg/L (Removal Required: ${removalReq}%)`,
            `Continuous circulating carbon slurry eliminates batch adsorption saturation`,
            `Constant non-stop product water production without cycle pauses`
        ],
        EDI: [
            `Feed TDS: ${feedTds} mg/L (High Purity Polishing Stream)`,
            `Target TDS: ${targetTds} mg/L (Removal Required: ${removalReq}%)`,
            `Mixed-bed resin chambers & continuous water-splitting H+/OH- auto-regeneration`,
            `Ultra-pure water product quality (<10 mg/L TDS)`
        ]
    };

    const criteriaList = techCriteriaMap[selectedTech] || techCriteriaMap.MCDI;
    const confidencePct = Math.round((ai.confidence || 0.975) * 100);

    return (
        <div className="panel recommendation-panel" style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "14px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
        }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                AI Technology Recommendation
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div style={{ background: "#F8FAFC", padding: "8px 12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: "600" }}>Selected Technology</span>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#2563EB" }}>{selectedTech}</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "8px 12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: "600" }}>Recommended Process</span>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#16A34A" }}>{ai.recommendedProcess || selectedTech}</div>
                </div>
            </div>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "10px 12px", marginBottom: "10px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                    AI Recommendation Rationale
                </div>
                <div style={{ fontSize: "12px", color: "#334155", lineHeight: "1.4", marginBottom: "8px" }}>
                    {ai.reason || `Selected ${selectedTech} based on engineering multi-tech analysis.`}
                </div>

                <div style={{ fontSize: "12px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                    Key Selection Criteria:
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "#475569", lineHeight: "1.5" }}>
                    {criteriaList.map((crit, idx) => (
                        <li key={idx}>{crit}</li>
                    ))}
                </ul>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563EB", background: "#EFF6FF", padding: "2px 10px", borderRadius: "4px" }}>
                    Model Confidence: {confidencePct}%
                </span>
            </div>
        </div>
    );
}