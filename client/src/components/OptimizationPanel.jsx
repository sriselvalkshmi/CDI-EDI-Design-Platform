import React from "react";
import { useApp } from "../context/AppContext";

const defaultAiValues = {
    CDI: {
        voltage: 1.2,
        current: 5,
        cellPairs: 20,
        electrodeArea: 250,
        electrodeThickness: 0.6,
        spacerThickness: 0.5,
        flowRate: 10,
        flowVelocity: 0.15,
        residenceTime: 5
    },
    MCDI: {
        voltage: 1.4,
        current: 5,
        cellPairs: 30,
        electrodeArea: 250,
        electrodeThickness: 0.6,
        spacerThickness: 0.5,
        flowRate: 10,
        flowVelocity: 0.18,
        residenceTime: 4
    },
    FCDI: {
        voltage: 1.8,
        current: 8,
        cellPairs: 40,
        electrodeArea: 300,
        electrodeThickness: 0.7,
        spacerThickness: 0.5,
        flowRate: 20,
        flowVelocity: 0.25,
        residenceTime: 3
    },
    EDI: {
        voltage: 15,
        current: 2,
        cellPairs: 100,
        electrodeArea: 500,
        electrodeThickness: 0.6,
        spacerThickness: 0.5,
        flowRate: 20,
        flowVelocity: 0.35,
        residenceTime: 2
    }
};

export default function OptimizationPanel() {
    const {
        designResult,
        selectedDesign,
        optimizationMode,
        setOptimizationMode,
        optimizationInputs,
        setOptimizationInputs,
        lockedParameters,
        setLockedParameters,
        loading,
        recalculate,
        user
    } = useApp();

    const engineering = designResult?.engineering;
    const simulation = designResult?.simulation;
    const optimization = designResult?.optimizedEngineering;
    const kpi = designResult?.kpi;

    const tech = selectedDesign || "CDI";

    const getAIValue = (parameter) => {
        if (optimization?.originalAIParameters && optimization.originalAIParameters[parameter] !== undefined) {
            return optimization.originalAIParameters[parameter];
        }
        if (engineering && engineering[parameter] !== undefined) {
            return engineering[parameter];
        }
        return defaultAiValues[tech]?.[parameter] ?? "-";
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

    function toggleLock(parameter) {
        setLockedParameters(prev => ({
            ...prev,
            [parameter]: !prev[parameter]
        }));
    }

    function ParameterCardRow({ label, parameter, units, step, min, max }) {
        const aiValue = getAIValue(parameter);
        const userValue = optimizationInputs[parameter] !== undefined ? optimizationInputs[parameter] : "";

        // Determine if the input box should be disabled:
        const isViewerOrResearcher = user && (user.role === "Viewer" || user.role === "Researcher");
        const isDisabled = optimizationMode === "AI" || isViewerOrResearcher;

        // Display value
        const displayValue = isDisabled ? aiValue : userValue;

        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                padding: "10px 0",
                borderBottom: "1px solid #f0f0f0"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>{label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
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
                                    padding: "6px 8px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    background: isDisabled ? "#f5f5f5" : "white",
                                    color: isDisabled ? "#666" : "#333",
                                    textAlign: "right",
                                    boxSizing: "border-box"
                                }}
                            />
                            <span style={{ fontSize: "12px", color: "#888", marginLeft: "4px", minWidth: "35px" }}>{units}</span>
                        </div>
                    </div>
                </div>
                <div style={{
                    fontSize: "11px",
                    color: "#888",
                    marginTop: "2px",
                    display: "flex",
                    justifyContent: "space-between"
                }}>
                    <span>AI: {format(aiValue)} {units}</span>
                    {!isDisabled && (
                        <span style={{ color: "#1976d2", fontWeight: "bold" }}>User Override</span>
                    )}
                </div>
            </div>
        );
    }

    if (!designResult || !designResult.engineering) {
        return (
            <div className="panel" style={{ padding: "20px", borderRadius: "8px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <h2 style={{ color: "#1976d2", margin: "0 0 10px 0" }}>Optimization &amp; Parameters</h2>
                <hr style={{ border: "0", borderTop: "1px solid #eee", marginBottom: "15px" }} />
                <p style={{ color: "#666" }}>Generate a design first to enable optimization.</p>
            </div>
        );
    }

            const isViewerOrResearcher = user && (user.role === "Viewer" || user.role === "Researcher");

            return (
                <div className="panel" style={{
                    padding: "20px",
                    borderRadius: "8px",
                    background: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <h2 style={{ color: "#1976d2", margin: 0 }}>Optimization &amp; Parameters</h2>
                        {loading && <span style={{ color: "#1976d2", fontSize: "13px", fontWeight: "bold" }}>⚡ Recalculating...</span>}
                    </div>
                    <hr style={{ border: "0", borderTop: "1px solid #eee", marginBottom: "15px" }} />
        
                    <h3 style={{ fontSize: "14px", margin: "10px 0 8px 0", color: "#555", fontWeight: "bold" }}>Optimization Mode</h3>
                    <select
                        value={optimizationMode}
                        disabled={isViewerOrResearcher}
                        onChange={(e) => setOptimizationMode(e.target.value)}
                style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                    marginBottom: "20px",
                    background: "#f9f9f9"
                }}
            >
                <option value="AI">AI Optimization</option>
                <option value="MANUAL">Manual Optimization</option>
            </select>

            {optimizationMode === "AI" ? (
                <div style={{
                    marginBottom: "20px",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #e0e0e0",
                    background: "#fafafa"
                }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#1976d2", fontSize: "14px", borderBottom: "1.5px solid #1976d2", paddingBottom: "4px" }}>AI Recommended Values</h4>
                    <ParameterCardRow label="Voltage" parameter="voltage" units="V" step="0.1" min="0.1" max="100" />
                    <ParameterCardRow label="Current" parameter="current" units="A" step="0.5" min="0.1" max="200" />
                    <ParameterCardRow label="Cell Pairs" parameter="cellPairs" units="pairs" step="1" min="1" max="1000" />
                    <ParameterCardRow label="Electrode Area" parameter="electrodeArea" units="cm²" step="10" min="10" max="10000" />
                    <ParameterCardRow label="Flow Rate" parameter="flowRate" units="L/min" step="0.5" min="0.1" max="100" />
                    <ParameterCardRow label="Residence Time" parameter="residenceTime" units="min" step="0.1" min="0.01" max="120" />
                </div>
            ) : (
                <div style={{
                    marginBottom: "20px",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #e0e0e0",
                    background: "#fafafa"
                }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#2e7d32", fontSize: "14px", borderBottom: "1.5px solid #2e7d32", paddingBottom: "4px" }}>User Editable Values</h4>
                    <ParameterCardRow label="Voltage" parameter="voltage" units="V" step="0.1" min="0.1" max="100" />
                    <ParameterCardRow label="Current" parameter="current" units="A" step="0.5" min="0.1" max="200" />
                    <ParameterCardRow label="Cell Pairs" parameter="cellPairs" units="pairs" step="1" min="1" max="1000" />
                    <ParameterCardRow label="Electrode Area" parameter="electrodeArea" units="cm²" step="10" min="10" max="10000" />
                    <ParameterCardRow label="Flow Rate" parameter="flowRate" units="L/min" step="0.5" min="0.1" max="100" />
                    <ParameterCardRow label="Flow Velocity" parameter="flowVelocity" units="m/s" step="0.01" min="0.001" max="10" />
                    <ParameterCardRow label="Residence Time" parameter="residenceTime" units="min" step="0.1" min="0.01" max="120" />
                    <ParameterCardRow label="Spacer Thickness" parameter="spacerThickness" units="mm" step="0.05" min="0.05" max="10" />
                </div>
            )}

            <hr style={{ border: "0", borderTop: "1px solid #eee", marginBottom: "15px" }} />
            <h3 style={{ fontSize: "14px", margin: "15px 0 8px 0", color: "#555", fontWeight: "bold" }}>Design KPIs</h3>
            
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "8px 10px", fontSize: "13px", color: "#666" }}>Technology</td>
                        <td style={{ padding: "8px 10px", fontSize: "13px", fontWeight: "bold", color: "#333", textAlign: "right" }}>
                            {engineering?.technology || tech}
                        </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "8px 10px", fontSize: "13px", color: "#666" }}>Performance Score</td>
                        <td style={{ padding: "8px 10px", fontSize: "13px", fontWeight: "bold", color: "#2e7d32", textAlign: "right" }}>
                            {format(simulation?.optimizationScore ?? simulation?.score ?? engineering?.score ?? 90)} %
                        </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "8px 10px", fontSize: "13px", color: "#666" }}>Specific Energy</td>
                        <td style={{ padding: "8px 10px", fontSize: "13px", fontWeight: "bold", color: "#c62828", textAlign: "right" }}>
                            {format(kpi?.SEC ?? simulation?.specificEnergy ?? engineering?.sec, 4)} kWh/m³
                        </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "8px 10px", fontSize: "13px", color: "#666" }}>Pressure Drop</td>
                        <td style={{ padding: "8px 10px", fontSize: "13px", fontWeight: "bold", color: "#333", textAlign: "right" }}>
                            {format(engineering?.pressureDrop ?? simulation?.pressureDrop, 2)} Pa
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}