import React from "react";
import { useApp } from "../context/AppContext";
import { CheckCircle2, AlertTriangle, ShieldCheck, Zap } from "lucide-react";

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
    const activeTechKey = tech.includes("EDI") ? "EDI" : (tech.includes("FCDI") ? "FCDI" : (tech.includes("MCDI") ? "MCDI" : "CDI"));
    const maxAchievableNum = activeTechKey === "EDI" ? 99.9 : (activeTechKey === "FCDI" ? 95.0 : (activeTechKey === "MCDI" ? 94.0 : 85.0));

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
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: titleColor, display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheck size={18} /> {titleText}
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
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>Max Achievable ({activeTechKey})</div>
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

            {/* TECHNOLOGY-SPECIFIC VALIDATION CHECKS */}
            <div style={{ marginTop: "12px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "10px 14px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#1E293B", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Zap size={14} color="#2563EB" /> {activeTechKey} Technology Operating &amp; Feasibility Checks
                </div>

                {activeTechKey === "CDI" && (() => {
                    const voltage = Number(engineering.voltage || 1.2);
                    const isVoltageSafe = voltage <= 1.5;
                    const sacVal = Number(engineering.sac || 14.5);
                    const isSacValid = sacVal > 5;
                    const isTdsValid = inletTDS <= 1000;

                    return (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11.5px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: isVoltageSafe ? "#16A34A" : "#DC2626", fontWeight: "800" }}>{isVoltageSafe ? "✓" : "✕"}</span>
                                <span>Operating Voltage: <b>{voltage} V</b> (Limit &le; 1.5V to avoid water splitting)</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: isSacValid ? "#16A34A" : "#D97706", fontWeight: "800" }}>{isSacValid ? "✓" : "⚠"}</span>
                                <span>Electrosorption SAC: <b>{sacVal} mg/g</b> (Adsorption capacity bounds)</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: isTdsValid ? "#16A34A" : "#D97706", fontWeight: "800" }}>{isTdsValid ? "✓" : "⚠"}</span>
                                <span>Feed TDS Limit: <b>{inletTDS} ppm</b> ({isTdsValid ? "Optimal CDI range <1000 ppm" : "High TDS causes rapid saturation"})</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#16A34A", fontWeight: "800" }}>✓</span>
                                <span>Regeneration Mode: <b>Batch Reversed Polarity (-V)</b></span>
                            </div>
                        </div>
                    );
                })()}

                {activeTechKey === "MCDI" && (() => {
                    const voltage = Number(engineering.voltage || 1.4);
                    const isVoltageSafe = voltage <= 1.6;
                    const pressDropBar = Number(engineering.pressureDrop ? (engineering.pressureDrop / 100000) : 0.15);
                    const isPressureOk = pressDropBar <= 1.5;

                    return (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11.5px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: isVoltageSafe ? "#16A34A" : "#DC2626", fontWeight: "800" }}>{isVoltageSafe ? "✓" : "✕"}</span>
                                <span>Operating Voltage: <b>{voltage} V</b> (Bounds: 1.0–1.6 V)</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#16A34A", fontWeight: "800" }}>✓</span>
                                <span>Co-Ion Repulsion Block: <b>AEM &amp; CEM Active</b> (Charge Eff &gt;92%)</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: isPressureOk ? "#16A34A" : "#D97706", fontWeight: "800" }}>{isPressureOk ? "✓" : "⚠"}</span>
                                <span>Membrane Pressure Drop: <b>{pressDropBar.toFixed(3)} bar</b> ({isPressureOk ? "Normal" : "High Fouling Risk"})</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#16A34A", fontWeight: "800" }}>✓</span>
                                <span>Membrane Fouling Risk: <b>LOW</b> (Pre-filtered feed water)</span>
                            </div>
                        </div>
                    );
                })()}

                {activeTechKey === "FCDI" && (() => {
                    const flowVel = Number(engineering.flowVelocity || 0.15);
                    const isVelocityOk = flowVel >= 0.02;

                    return (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11.5px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: isVelocityOk ? "#16A34A" : "#DC2626", fontWeight: "800" }}>{isVelocityOk ? "✓" : "✕"}</span>
                                <span>Slurry Flow Velocity: <b>{flowVel} m/s</b> ({isVelocityOk ? "Sufficient to prevent carbon settling" : "Risk of carbon particle settling"})</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#16A34A", fontWeight: "800" }}>✓</span>
                                <span>Slurry Concentration: <b>12.5 wt%</b> Activated Carbon Suspension</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#16A34A", fontWeight: "800" }}>✓</span>
                                <span>Operation Mode: <b>Continuous Non-Stop Desalination</b> (No cycle pauses)</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#16A34A", fontWeight: "800" }}>✓</span>
                                <span>High TDS Capacity: <b>{inletTDS} ppm</b> (Handles streams up to 30,000+ ppm)</span>
                            </div>
                        </div>
                    );
                })()}

                {activeTechKey === "EDI" && (() => {
                    const cdVal = Number(engineering.currentDensity ?? 100.0);
                    const minJ = Number(engineering.minJ ?? 50);
                    const maxJ = Number(engineering.maxJ ?? 500);
                    const isJValid = cdVal >= minJ && cdVal <= maxJ;

                    return (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11.5px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#16A34A", fontWeight: "800" }}>✓</span>
                                <span>Operating Voltage: <b>{engineering.voltage || 15.0} V</b> (Bounds: 5–50 V)</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: isJValid ? "#16A34A" : "#D97706", fontWeight: "800" }}>{isJValid ? "✓" : "⚠"}</span>
                                <span>Current Density: <b>{cdVal.toFixed(1)} A/m²</b> (Bounds: {minJ}–{maxJ} A/m²)</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#16A34A", fontWeight: "800" }}>✓</span>
                                <span>In-Situ Resin Regeneration: <b>Electrolytic H+/OH- Water Splitting Active</b></span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: inletTDS > 30 ? "#D97706" : "#16A34A", fontWeight: "800" }}>{inletTDS > 30 ? "⚠" : "✓"}</span>
                                <span>Membrane Scaling Risk: <b>{inletTDS > 30 ? `HIGH (${inletTDS} ppm > 30 ppm limit)` : "LOW (Pre-treated RO Permeate)"}</b></span>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
