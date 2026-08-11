import React from "react";
import {
    calculateValidationStats,
    checkValidationBoundary,
    applyExperimentalCalibration,
    LITERATURE_BENCHMARKS
} from "../engineering/experimentalValidation";

export default function ValidationDashboard({ engineering, feedWater, technology }) {
    if (!engineering) return null;

    const activeTech = engineering.technology || (technology !== "AUTO" ? technology : "CDI");
    const feed = feedWater || engineering.feedWater || {};

    const stats = calculateValidationStats(undefined, activeTech);
    const boundary = checkValidationBoundary(activeTech, feed, engineering);
    const calibrated = applyExperimentalCalibration(engineering, activeTech);
    const litBenchmark = LITERATURE_BENCHMARKS[activeTech] || null;

    const metrics = stats.metrics;

    return (
        <div style={{
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: "8px",
            padding: "14px",
            marginTop: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
            {/* COMPREHENSIVE 4-TIER MODEL VALIDATION HIERARCHY */}
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", marginBottom: "10px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px" }}>
                Experimental Validation &amp; Model Calibration Dashboard
            </div>

            {/* TIER 1: ENGINEERING DESIGN (PHYSICS MODEL PREDICTION vs VALIDATED PREDICTION) */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "10px 12px", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#0F172A" }}>
                        1. Engineering Design (First-Principles Physics)
                    </span>
                    <span style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: boundary.isValidatedRange ? "#DCFCE7" : "#FEF3C7",
                        color: boundary.isValidatedRange ? "#166534" : "#B45309"
                    }}>
                        {boundary.statusLabel}
                    </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", fontSize: "11.5px" }}>
                    <div>First-Principles Outlet: <strong>{calibrated.physicsOutletTds} mg/L</strong></div>
                    <div>Calibration Multiplier: <strong>×{calibrated.calibrationFactor}</strong></div>
                    <div>Calibrated Prediction: <strong style={{ color: "#2563EB" }}>{calibrated.correctedOutletTds} mg/L</strong></div>
                </div>
            </div>

            {/* TIER 2: EXPERIMENTAL VALIDATION (PREDICTED vs MEASURED, RMSE, MAE, R², BIAS) */}
            <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "6px", padding: "10px 12px", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#166534" }}>
                        2. Pilot Experimental Validation ({stats.statusLabel})
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#15803D" }}>
                        Runs: {stats.runCount} Pilot Runs
                    </span>
                </div>

                {stats.runCount > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", fontSize: "11px", color: "#14532D" }}>
                        <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: "4px", border: "1px solid #BBF7D0" }}>
                            <div style={{ fontWeight: "700", color: "#166534", marginBottom: "2px" }}>Outlet TDS Metrics</div>
                            <div>RMSE: <strong>{metrics.outletTds.rmse} mg/L</strong></div>
                            <div>MAE: <strong>{metrics.outletTds.mae} mg/L</strong></div>
                            <div>Bias: <strong>{metrics.outletTds.bias > 0 ? `+${metrics.outletTds.bias}` : metrics.outletTds.bias} mg/L</strong></div>
                            <div>R² Fit: <strong>{metrics.outletTds.r2}</strong></div>
                        </div>

                        <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: "4px", border: "1px solid #BBF7D0" }}>
                            <div style={{ fontWeight: "700", color: "#166534", marginBottom: "2px" }}>Stack Power Metrics</div>
                            <div>RMSE: <strong>{metrics.power.rmse} W</strong></div>
                            <div>MAE: <strong>{metrics.power.mae} W</strong></div>
                            <div>Bias: <strong>{metrics.power.bias > 0 ? `+${metrics.power.bias}` : metrics.power.bias} W</strong></div>
                            <div>R² Fit: <strong>{metrics.power.r2}</strong></div>
                        </div>

                        <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: "4px", border: "1px solid #BBF7D0" }}>
                            <div style={{ fontWeight: "700", color: "#166534", marginBottom: "2px" }}>Hydraulic Pressure Drop</div>
                            <div>RMSE: <strong>{metrics.pressureDrop.rmse} Pa</strong></div>
                            <div>MAE: <strong>{metrics.pressureDrop.mae} Pa</strong></div>
                            <div>Bias: <strong>{metrics.pressureDrop.bias > 0 ? `+${metrics.pressureDrop.bias}` : metrics.pressureDrop.bias} Pa</strong></div>
                            <div>R² Fit: <strong>{metrics.pressureDrop.r2}</strong></div>
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: "11.5px", color: "#B45309" }}>
                        No experimental pilot runs recorded for this technology in the active database. Model relies strictly on first-principles transport equations and literature calibration.
                    </div>
                )}
            </div>

            {/* TIER 3: LITERATURE BENCHMARK COMPARISON */}
            {litBenchmark && (
                <div style={{ background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: "6px", padding: "10px 12px", marginBottom: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#1E40AF", marginBottom: "4px" }}>
                        3. Published Literature Benchmark Comparison
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#1E3A8A", lineHeight: "1.4" }}>
                        <div>Published Pilot SEC Range: <strong>{litBenchmark.secKwhPerM3} ± {litBenchmark.secUncertainty} kWh/m³</strong></div>
                        <div>Published Salt Removal: <strong>{litBenchmark.saltRemovalPct}%</strong> | Recovery: <strong>{litBenchmark.waterRecoveryPct}%</strong></div>
                        <div style={{ fontSize: "11px", color: "#1D4ED8", marginTop: "3px" }}>
                            <em>{litBenchmark.notes}</em>
                        </div>
                    </div>
                </div>
            )}

            {/* TIER 4: MODEL PEDIGREE CATEGORIZATION */}
            <div style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "10px 12px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                    4. Model Pedigree Categorization
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px", color: "#334155" }}>
                    <div>• <strong>First Principles:</strong> Water/salt mass balances, Faraday charge transfer, stoichiometry</div>
                    <div>• <strong>Literature Supported:</strong> Membrane stack architecture, flow electrode concentration windows</div>
                    <div>• <strong>Experimentally Calibrated:</strong> Empirical charge efficiency, viscous drag multipliers</div>
                    <div>• <strong>Project Assumptions:</strong> Modular sizing parameters, baseline pump mechanical efficiencies</div>
                </div>
            </div>
        </div>
    );
}
