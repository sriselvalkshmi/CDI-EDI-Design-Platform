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
        user
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
        setOptimizationInputs(prev => ({
            ...prev,
            [parameter]: value === "" ? "" : Number(value)
        }));
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

    return (
        <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 className="panel-title" style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>Optimization &amp; Manual Controls</h3>
                {loading && <span style={{ color: "#2563EB", fontSize: "12px", fontWeight: "600" }}>⚡ Recalculating...</span>}
            </div>

            <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#6B7280", display: "block", marginBottom: "4px" }}>Optimization Mode</label>
                <select
                    value={optimizationMode}
                    disabled={isViewerOrResearcher}
                    onChange={(e) => setOptimizationMode(e.target.value)}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <ParameterCardRow label="Operating Voltage" parameter="voltage" units="V" step="0.1" min="0.5" max="50" />
                <ParameterCardRow label="Operating Current" parameter="current" units="A" step="0.1" min="0.1" max="100" />
                <ParameterCardRow label="Cell Pairs" parameter="cellPairs" units="pairs" step="1" min="1" max="500" />
                <ParameterCardRow label="Electrode Area" parameter="electrodeArea" units="cm²" step="10" min="10" max="5000" />
                <ParameterCardRow label="Feed Flow Rate" parameter="flowRate" units="L/min" step="1" min="1" max="500" />
                <ParameterCardRow label="Flow Velocity" parameter="flowVelocity" units="m/s" step="0.01" min="0.01" max="5" />
                <ParameterCardRow label="Residence Time" parameter="residenceTime" units="min" step="0.1" min="0.1" max="60" />
            </div>
        </div>
    );
}