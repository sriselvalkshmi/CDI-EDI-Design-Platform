import React from "react";
import { useApp } from "../context/AppContext";

export default function ValidationPanel() {
    const { designResult } = useApp();

    if (!designResult || !designResult.engineering) {
        return null;
    }

    const feedWater = designResult?.input?.feedWater || {};
    const engineering = designResult?.engineering || {};
    const process = designResult?.process || {};
    const overall = process.overall || {};
    const validation = designResult?.validation || {};

    const inletTDS = Number(feedWater.tds || 500);
    const targetTDS = Number(feedWater.targetTds || 50);

    const requiredRemovalNum = inletTDS > 0 ? Math.max(0, ((inletTDS - targetTDS) / inletTDS) * 100) : 90.0;
    const currentRemovalNum = Number(overall.removalEfficiency ?? engineering.removalEfficiency ?? 0);
    
    const tech = overall.recommendedProcess || overall.technology || engineering.technology || "CDI";
    const maxAchievableNum = tech.includes("EDI") ? 99.9 : (tech.includes("FCDI") ? 95.0 : (tech.includes("MCDI") ? 94.0 : 85.0));

    const status = validation.status || "VALID";

    let statusBg = "#F0FDF4";
    let statusBorder = "#BBF7D0";
    let titleColor = "#15803D";
    let badgeBg = "#DCFCE7";
    let badgeColor = "#166534";
    let titleText = "✓ Design Validation Status: Feasible";

    if (status === "TARGET NOT ACHIEVABLE") {
        statusBg = "#FEF2F2";
        statusBorder = "#FCA5A5";
        titleColor = "#991B1B";
        badgeBg = "#FEE2E2";
        badgeColor = "#991B1B";
        titleText = "✕ TARGET NOT ACHIEVABLE";
    } else if (status === "OPTIMIZATION REQUIRED") {
        statusBg = "#FFFBEB";
        statusBorder = "#FDE68A";
        titleColor = "#92400E";
        badgeBg = "#FEF3C7";
        badgeColor = "#92400E";
        titleText = "⚠ OPTIMIZATION REQUIRED";
    }

    return (
        <div className="panel validation-panel" style={{
            background: statusBg,
            border: `1px solid ${statusBorder}`,
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px"
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: titleColor }}>
                    {titleText}
                </h3>
                <span style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    background: badgeBg,
                    color: badgeColor
                }}>
                    {status}
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

            {/* Messages / Suggestions */}
            {validation.messages && validation.messages.length > 0 && (
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: `1px solid ${statusBorder}` }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: titleColor, marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Validation Notes &amp; Recommendations</span>
                        {validation.recommendedProcess && (
                            <span style={{ fontSize: "11px", background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "6px", fontWeight: "700" }}>
                                Recommended Process: {validation.recommendedProcess}
                            </span>
                        )}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: titleColor, lineHeight: "1.6" }}>
                        {validation.messages.map((msg, idx) => (
                            <li key={idx}>{msg}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

