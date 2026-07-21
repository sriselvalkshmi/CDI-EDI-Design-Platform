import React from "react";
import { useApp } from "../context/AppContext";

export default function ValidationPanel() {
    const { designResult } = useApp();

    if (!designResult || !designResult.engineering) {
        return null;
    }

    const feedWater = designResult?.input?.feedWater || {};
    const engineering = designResult?.engineering || {};
    const kpi = designResult?.kpi || {};
    const validation = designResult?.validation || {};

    const inletTDS = Number(feedWater.tds || 500);
    const targetTDS = Number(feedWater.targetTds || 50);

    const requiredRemovalNum = inletTDS > 0 ? Math.max(0, ((inletTDS - targetTDS) / inletTDS) * 100) : 90.0;
    const currentRemovalNum = Number(engineering.removalEfficiency ?? kpi.removalEfficiency ?? 0);
    
    const tech = engineering.technology || "CDI";
    const maxAchievableNum = tech === "EDI" ? 99.9 : (tech === "FCDI" ? 95.0 : (tech === "MCDI" ? 90.4 : 85.0));

    const isTargetAchieved = (engineering.outletTDS ?? kpi.outletTDS ?? inletTDS) <= targetTDS;
    const isValid = validation.status === "VALID" && isTargetAchieved;

    const suggestedImprovements = [];
    if (!isTargetAchieved || currentRemovalNum < requiredRemovalNum) {
        if (tech === "CDI") {
            suggestedImprovements.push("Switch to MCDI or FCDI for higher salinity feed water");
        } else if (tech === "MCDI") {
            suggestedImprovements.push("Switch to FCDI or EDI for ultra-high purity requirements");
        }
        suggestedImprovements.push("Increase electrode area (e.g. 250 cm² → 500 cm²)");
        suggestedImprovements.push("Increase cell pairs (e.g. 36 → 60 pairs)");
        suggestedImprovements.push("Lower flow rate to increase residence time");
        suggestedImprovements.push("Consider multi-stage operation (2-stage pass)");
    }

    return (
        <div className="panel validation-panel" style={{
            background: isValid ? "#F0FDF4" : "#FFFFE0",
            border: `1px solid ${isValid ? "#BBF7D0" : "#FDE68A"}`,
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px"
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: isValid ? "#15803D" : "#92400E" }}>
                    {isValid ? "✓ Design Validation Status: Feasible" : "⚠ Design Validation Notice"}
                </h3>
                <span style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    background: isValid ? "#DCFCE7" : "#FEF3C7",
                    color: isValid ? "#166534" : "#92400E"
                }}>
                    {isValid ? "VALIDATED" : "OPTIMIZATION RECOMMENDED"}
                </span>
            </div>

            {/* Removal Metrics Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "12px" }}>
                <div style={{ background: "white", padding: "8px 12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>Required Removal</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>{requiredRemovalNum.toFixed(1)}%</div>
                </div>
                <div style={{ background: "white", padding: "8px 12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>Current Removal</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: currentRemovalNum >= requiredRemovalNum ? "#166534" : "#D97706" }}>{currentRemovalNum.toFixed(1)}%</div>
                </div>
                <div style={{ background: "white", padding: "8px 12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>Max Achievable ({tech})</div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#1E40AF" }}>{maxAchievableNum.toFixed(1)}%</div>
                </div>
            </div>

            {/* Suggested Improvements if target not achieved */}
            {suggestedImprovements.length > 0 && (
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #FDE68A" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400E", marginBottom: "4px" }}>Suggested Improvements</div>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#78350F", lineHeight: "1.6" }}>
                        {suggestedImprovements.map((imp, idx) => (
                            <li key={idx}>{imp}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
