import React from "react";
import { useApp } from "../context/AppContext";

export default function OptimizationPanel() {
    const {
        designResult,
        optimizationMode,
        setOptimizationMode,
        optimizationInputs,
        setOptimizationInputs,
        loading,
        setLoading,
        user,
        technology,
        recalculate,
        optimizationStatus,
        setOptimizationStatus,
        optimizationError,
        setOptimizationError
    } = useApp();

    const engineering = designResult?.engineering;
    const optimization = designResult?.optimizedEngineering;

    // Single Source of Truth: designResult.engineering.technology
    const tech = engineering?.technology || "CDI";

    const getEngineeringValue = (parameter) => {
        if (engineering && engineering[parameter] !== undefined) {
            return engineering[parameter];
        }
        if (optimization?.originalAIParameters && optimization.originalAIParameters[parameter] !== undefined) {
            return optimization.originalAIParameters[parameter];
        }
        return "-";
    };

    const format = (value, digits = 2) => {
        if (value === undefined || value === null || isNaN(value)) {
            return "-";
        }
        return Number(value).toFixed(digits);
    };

    function updateParameter(parameter, value) {
        setOptimizationStatus("idle");
        setOptimizationInputs(prev => ({
            ...prev,
            [parameter]: value === "" ? "" : Number(value)
        }));
    }

    async function handleApplyOptimization() {
        try {
            setOptimizationStatus("loading");
            setLoading(true);
            setOptimizationError(null);

            await new Promise(resolve => setTimeout(resolve, 50));

            const res = recalculate(optimizationInputs, technology, true);

            const {
                isLimitReached = false,
                status = "OPTIMIZED"
            } = res || {};

            if (isLimitReached || status === "LIMIT_REACHED" || res?.isLimitReached) {
                setOptimizationStatus("LIMIT_REACHED");
            } else if (res?.noImprovement || status === "NO_IMPROVEMENT") {
                setOptimizationStatus("no_improvement");
            } else {
                setOptimizationStatus("success");
            }
        } catch (error) {
            console.error("Optimization Error:", error);
            setOptimizationStatus("error");
            setOptimizationError(error.message || "Failed to run optimization engine.");
        } finally {
            setLoading(false);
        }
    }

    function ParameterCardRow({ label, parameter, units, step, min, max }) {
        const engValue = getEngineeringValue(parameter);
        const userValue = (optimizationInputs[parameter] !== undefined && optimizationInputs[parameter] !== "") 
            ? optimizationInputs[parameter] 
            : (engineering?.[parameter] ?? "");

        const isViewerOrResearcher = user && (user.role === "Viewer" || user.role === "Researcher");
        const isDisabled = optimizationMode === "AI" || isViewerOrResearcher;
        const displayValue = isDisabled ? engValue : userValue;

        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                padding: "8px 0",
                borderBottom: "1px solid #E2E8F0"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#1F2937" }}>{label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                            type="number"
                            step={step || "1"}
                            min={min || "0"}
                            max={max || "10000"}
                            value={displayValue}
                            disabled={isDisabled}
                            onChange={(e) => updateParameter(parameter, e.target.value)}
                            style={{
                                width: "90px",
                                padding: "4px 8px",
                                border: "1px solid #D9E2EC",
                                borderRadius: "4px",
                                fontSize: "13px",
                                background: isDisabled ? "#F8FAFC" : "#FFFFFF",
                                color: isDisabled ? "#6B7280" : "#1F2937",
                                textAlign: "right",
                                boxSizing: "border-box"
                            }}
                        />
                        <span style={{ fontSize: "11px", color: "#6B7280", minWidth: "35px" }}>{units}</span>
                    </div>
                </div>
                <div style={{
                    fontSize: "11px",
                    color: "#6B7280",
                    marginTop: "2px",
                    display: "flex",
                    justifyContent: "space-between"
                }}>
                    <span>Calculated: {format(engValue)} {units}</span>
                    {!isDisabled && (
                        <span style={{ color: "#2563EB", fontWeight: "600" }}>Manual Input</span>
                    )}
                </div>
            </div>
        );
    }

    if (!designResult || !designResult.engineering) {
        return (
            <div className="panel">
                <h3 className="panel-title">Optimization &amp; Parameters</h3>
                <p style={{ color: "#6B7280", fontSize: "13px", margin: "8px 0 0 0" }}>Generate a design first to enable optimization.</p>
            </div>
        );
    }

    const isViewerOrResearcher = user && (user.role === "Viewer" || user.role === "Researcher");
    const prev = optimization?.previousEngineering;
    const process = designResult?.process || {};
    const isMultiStage = Boolean(process.isMultiStage || engineering?.isMultiStage);
    const isValidationValid = designResult?.validation?.status === "VALID" || process?.overall?.status === "VALID";

    const isLimitReached = !isMultiStage && !isValidationValid && Boolean(optimization?.isLimitReached || (optimizationStatus === "LIMIT_REACHED" || optimizationStatus === "LIMIT REACHED"));
    const feedWater = designResult?.input?.feedWater || {};
    const inletTDS = feedWater.tds || 500;
    const targetTDS = feedWater.targetTds || 50;

    const overall = process.overall || {};
    const currOutlet = overall.outletTDS || engineering.outletTDS;
    const currRemoval = overall.removalEfficiency || engineering.removalEfficiency;
    const currSec = overall.sec || engineering.sec;

    const comparisonItems = (prev && !isLimitReached) ? [
        { label: "Voltage", prev: `${format(prev.voltage)} V`, curr: `${format(engineering.voltage)} V`, changed: Math.abs(prev.voltage - engineering.voltage) > 0.01 },
        { label: "Current", prev: `${format(prev.current)} A`, curr: `${format(engineering.current)} A`, changed: Math.abs(prev.current - engineering.current) > 0.01 },
        { label: "Cell Pairs", prev: `${prev.cellPairs}`, curr: `${engineering.cellPairs}`, changed: prev.cellPairs !== engineering.cellPairs },
        { label: "Electrode Area", prev: `${format(prev.electrodeArea, 0)} cm²`, curr: `${format(engineering.electrodeArea, 0)} cm²`, changed: Math.abs(prev.electrodeArea - engineering.electrodeArea) > 1 },
        { label: "Residence Time", prev: `${format(prev.residenceTime, 2)} min`, curr: `${format(engineering.residenceTime, 2)} min`, changed: Math.abs(prev.residenceTime - engineering.residenceTime) > 0.01 },
        { label: "Outlet TDS", prev: `${format(prev.outletTDS ?? prev.overall?.outletTDS, 0)} ppm`, curr: `${format(currOutlet, 0)} ppm`, changed: Math.abs((prev.outletTDS ?? prev.overall?.outletTDS ?? currOutlet) - currOutlet) > 0.5 },
        { label: "Removal Efficiency", prev: `${format(prev.removalEfficiency ?? prev.overall?.removalEfficiency, 1)}%`, curr: `${format(currRemoval, 1)}%`, changed: Math.abs((prev.removalEfficiency ?? prev.overall?.removalEfficiency ?? currRemoval) - currRemoval) > 0.1 },
        { label: "Specific Energy", prev: `${format(prev.sec ?? prev.overall?.sec, 4)} kWh/m³`, curr: `${format(currSec, 4)} kWh/m³`, changed: Math.abs((prev.sec ?? prev.overall?.sec ?? currSec) - currSec) > 0.0001 }
    ] : [];

    const hasChangedItems = comparisonItems.some(item => item.changed);

    return (
        <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 className="panel-title" style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>Optimization &amp; Manual Controls</h3>
                {loading && <span style={{ color: "#2563EB", fontSize: "12px", fontWeight: "600" }}>⚡ Recalculating...</span>}
            </div>

            {/* Issue 1: Large Warning Card when Target Cannot Be Achieved */}
            {isLimitReached && (
                <div style={{
                    background: "#FEF2F2",
                    border: "2px solid #FCA5A5",
                    borderRadius: "10px",
                    padding: "18px",
                    marginBottom: "16px",
                    color: "#991B1B"
                }}>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", fontWeight: "800", color: "#991B1B" }}>
                        ⚠️ TARGET CANNOT BE ACHIEVED
                    </h3>
                    <div style={{ fontSize: "13px", margin: "4px 0" }}>
                        <strong>Requested:</strong> {inletTDS} ppm → {targetTDS} ppm
                    </div>
                    <div style={{ fontSize: "13px", margin: "4px 0" }}>
                        <strong>Maximum achievable with {tech}:</strong> ≈95% removal
                    </div>
                    <div style={{ fontSize: "13px", margin: "4px 0" }}>
                        <strong>Best outlet:</strong> {engineering.outletTDS} ppm
                    </div>

                    <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #FECACA", marginTop: "12px", marginBottom: "12px" }}>
                        <div style={{ fontSize: "12px", color: "#7F1D1D", fontWeight: "700", marginBottom: "6px" }}>Recommended process:</div>
                        <div style={{ fontSize: "16px", fontWeight: "800", color: "#2563EB", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>{process.stages?.[0]?.technology || (tech.includes("MCDI") ? "MCDI" : "FCDI")}</span>
                            <span style={{ fontSize: "16px", color: "#64748B" }}>↓</span>
                            <span>EDI</span>
                        </div>
                    </div>

                    <div style={{ fontSize: "12px", color: "#7F1D1D", lineHeight: "1.5" }}>
                        <strong>Reason:</strong> Use {process.stages?.[0]?.technology || "MCDI"} for bulk desalination. Use EDI polishing to reach final target.
                    </div>
                </div>
            )}

            {/* Optimization Status when optimal */}
            {!isLimitReached && (
                <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #CBD5E1",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "14px"
                }}>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>
                        ✨ Optimization Results
                    </h4>
                    {hasChangedItems ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                            {comparisonItems.map((item, idx) => (
                                <div key={idx} style={{
                                    background: item.changed ? "#ECFDF5" : "#FFFFFF",
                                    border: `1px solid ${item.changed ? "#A7F3D0" : "#E2E8F0"}`,
                                    borderRadius: "6px",
                                    padding: "6px 8px",
                                    fontSize: "11.5px"
                                }}>
                                    <div style={{ color: "#64748B", fontWeight: "500" }}>{item.label}</div>
                                    <div style={{ fontWeight: "700", color: item.changed ? "#047857" : "#334155", marginTop: "2px" }}>
                                        {item.prev} → <span>{item.curr}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontSize: "12.5px", color: "#475569", lineHeight: "1.4" }}>
                            No optimization changes required. Current design is already optimal.
                        </div>
                    )}
                </div>
            )}

            <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B7280", display: "block", marginBottom: "4px" }}>Optimization Mode</label>
                <select
                    value={optimizationMode}
                    disabled={isViewerOrResearcher || isLimitReached}
                    onChange={(e) => {
                        setOptimizationStatus("idle");
                        setOptimizationMode(e.target.value);
                    }}
                    style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #D9E2EC",
                        background: "#FFFFFF",
                        color: "#1F2937",
                        fontSize: "13px",
                        fontWeight: "600"
                    }}
                >
                    <option value="AI">🤖 AI Auto-Optimization ({tech})</option>
                    <option value="MANUAL">⚙ Manual Parameter Override</option>
                </select>
            </div>

            {/* Issue 2: Disable / Hide Manual Controls when Limit Reached */}
            {isLimitReached ? (
                <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "16px",
                    textAlign: "center",
                    color: "#64748B",
                    fontSize: "13px",
                    margin: "12px 0"
                }}>
                    <div style={{ fontWeight: "700", color: "#1F2937", fontSize: "14px", marginBottom: "4px" }}>Technology limit reached.</div>
                    <div>Upgrade process required.</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "12px" }}>
                    <ParameterCardRow label="Operating Voltage" parameter="voltage" units="V" step="0.1" min="0.5" max="50" />
                    <ParameterCardRow label="Operating Current" parameter="current" units="A" step="0.1" min="0.1" max="100" />
                    <ParameterCardRow label="Cell Pairs" parameter="cellPairs" units="pairs" step="1" min="1" max="500" />
                    <ParameterCardRow label="Electrode Area" parameter="electrodeArea" units="cm²" step="10" min="10" max="5000" />
                    <ParameterCardRow label="Feed Flow Rate" parameter="flowRate" units="L/min" step="1" min="1" max="500" />
                    <ParameterCardRow label="Flow Velocity" parameter="flowVelocity" units="m/s" step="0.01" min="0.01" max="5" />
                    <ParameterCardRow label="Residence Time" parameter="residenceTime" units="min" step="0.1" min="0.1" max="60" />
                </div>
            )}

            {/* Issue 6: Optimization button behavior */}
            <button
                className="btn-optimize-design"
                onClick={handleApplyOptimization}
                disabled={loading || optimizationStatus === "loading" || isViewerOrResearcher}
                style={{
                    width: "100%",
                    padding: "10px 16px",
                    backgroundColor: isLimitReached ? "#DC2626" : "#2563EB",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "background-color 0.2s"
                }}
            >
                {optimizationStatus === "loading"
                    ? "Applying Optimization..."
                    : isLimitReached
                    ? "Technology Limit Reached"
                    : optimizationStatus === "success"
                    ? "✓ Optimization Complete"
                    : optimizationStatus === "no_improvement"
                    ? "Current Design Optimal"
                    : optimizationStatus === "error"
                    ? "Optimization Failed"
                    : "Apply Optimization"}
            </button>
            {optimizationStatus === "error" && optimizationError && (
                <div style={{ color: "#DC2626", fontSize: "11px", marginTop: "6px" }}>
                    Optimization Failed: {optimizationError}
                </div>
            )}
        </div>
    );
}