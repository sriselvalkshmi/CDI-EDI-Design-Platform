import React from "react";
import { useApp } from "../context/AppContext";

export default function OptimizationPanel() {
    const {
        optimizationInputs,
        setOptimizationInputs,
        designResult,
        recalculate,
        technology,
        user,
        setOptimizationStatus,
        setOptimizationError
    } = useApp();

    if (!designResult || !designResult.engineering) {
        return null;
    }

    const isResearcher = user && user.role === "Researcher";
    const isViewer = user && user.role === "Viewer";
    const disabled = isResearcher || isViewer;

    const eng = designResult.engineering;
    const optEng = designResult.optimizedEngineering || {};
    const prevEng = optEng.previousEngineering || {};
    const feedWater = designResult.input?.feedWater || {};
    const activeTech = designResult?.selectedTechnology || eng.technology || "MCDI";

    function handleInputChange(field, val) {
        setOptimizationStatus("idle");
        const numVal = parseFloat(val);
        const newInputs = {
            ...optimizationInputs,
            [field]: val === "" || isNaN(numVal) ? (typeof val === "string" ? val : "") : numVal
        };
        setOptimizationInputs(newInputs);
        recalculate(newInputs, technology, false);
    }

    function handleRunAIOptimization() {
        try {
            setOptimizationStatus("loading");
            setOptimizationError(null);
            recalculate(optimizationInputs, technology, true);
            setOptimizationStatus("success");
        } catch (err) {
            setOptimizationStatus("error");
            setOptimizationError(err.message);
        }
    }

    const rows = [
        { key: "voltage", label: "Cell Voltage", val: eng.voltageCell || eng.voltage || 1.2, calc: `${Number(eng.voltageCell || eng.voltage || 1.2).toFixed(2)} V`, unit: "V" },
        { key: "current", label: "Operating Current", val: eng.current || 5.0, calc: `${Number(eng.current || 5.0).toFixed(2)} A`, unit: "A" },
        { key: "cellPairs", label: "Cell Pairs", val: eng.cellPairs || 36, calc: `${Number(eng.cellPairs || 36)} pairs`, unit: "pairs" },
        { key: "electrodeArea", label: "Electrode Area", val: eng.electrodeArea || 250, calc: `${Number(eng.electrodeArea || 250)} cm²`, unit: "cm²" },
        { key: "electrodeThickness", label: "Electrode Thickness", val: eng.electrodeThickness || 0.6, calc: `${Number(eng.electrodeThickness || 0.6).toFixed(2)} mm`, unit: "mm" },
        { key: "spacerThickness", label: "Spacer Thickness", val: eng.spacerThickness || 0.5, calc: `${Number(eng.spacerThickness || 0.5).toFixed(2)} mm`, unit: "mm" },
        { key: "membraneThickness", label: "Membrane Thickness", val: eng.membraneThickness || 0.15, calc: `${Number(eng.membraneThickness || 0.15).toFixed(2)} mm`, unit: "mm" },
        { key: "flowRate", label: "Feed Flow Rate", val: eng.flowRate || feedWater.flowRate || 10, calc: `${Number(eng.flowRate || 10).toFixed(1)} L/min`, unit: "L/min" },
        { key: "flowVelocity", label: "Flow Velocity", val: eng.flowVelocity || 0.035, calc: `${Number(eng.flowVelocity || 0.035).toFixed(3)} m/s`, unit: "m/s" },
        { key: "residenceTime", label: "Residence Time (tau)", val: eng.residenceTime || 0.045, calc: `${Number(eng.residenceTime || 0.045).toFixed(4)} min`, unit: "min" }
    ];

    const prevV = prevEng.voltage !== undefined ? `${Number(prevEng.voltage).toFixed(2)} V` : "Initial";
    const prevI = prevEng.current !== undefined ? `${Number(prevEng.current).toFixed(2)} A` : "Initial";
    const prevCells = prevEng.cellPairs !== undefined ? prevEng.cellPairs : "Initial";
    const prevArea = prevEng.electrodeArea !== undefined ? `${prevEng.electrodeArea} cm²` : "Initial";
    const prevTds = prevEng.outletTDS !== undefined ? `${prevEng.outletTDS} ppm` : `${feedWater.tds || 500} ppm (Feed)`;
    const prevRem = prevEng.removalEfficiency !== undefined ? `${prevEng.removalEfficiency}%` : "0%";
    const prevSec = prevEng.sec !== undefined ? `${prevEng.sec} kWh/m³` : "Initial";

    return (
        <div className="panel optimization-panel" style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "14px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
        }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                Engineering Optimization &amp; Parameter Controls
            </h3>

            {/* DYNAMIC OPTIMIZATION RESULTS SUMMARY BOX */}
            <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "6px", padding: "10px 12px", marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#166534", marginBottom: "6px" }}>
                    Dynamic Optimization Results ({activeTech})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", fontSize: "11.5px", color: "#15803D" }}>
                    <div>Cell Voltage: <strong>{prevV} → {Number(eng.voltageCell || eng.voltage || 1.2).toFixed(2)} V</strong></div>
                    <div>Operating Current: <strong>{prevI} → {Number(eng.current || 5.0).toFixed(2)} A</strong></div>
                    <div>Cell Pairs: <strong>{prevCells} → {eng.cellPairs}</strong></div>
                    <div>Electrode Area: <strong>{prevArea} → {eng.electrodeArea} cm²</strong></div>
                    <div>Residence Time (τ): <strong>{Number(eng.residenceTime).toFixed(4)} min</strong></div>
                    <div>Outlet TDS: <strong>{prevTds} → {eng.outletTDS} ppm</strong></div>
                    <div>Removal Efficiency: <strong>{prevRem} → {eng.removalEfficiency}%</strong></div>
                    <div>Specific Energy: <strong>{prevSec} → {eng.sec} kWh/m³</strong></div>
                </div>
            </div>

            {/* OPTIMIZATION MODE HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>
                    Manual Optimization ({activeTech})
                </div>
                <button
                    onClick={handleRunAIOptimization}
                    disabled={disabled}
                    style={{
                        padding: "6px 14px",
                        background: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer"
                    }}
                >
                    Apply Optimization
                </button>
            </div>

            {/* MANUAL CONTROLS LIST */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {rows.map(row => (
                    <div
                        key={row.key}
                        style={{
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: "4px",
                            padding: "6px 10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        <span style={{ fontSize: "12px", color: "#0F172A", fontWeight: "600" }}>
                            {row.label}
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                                type="number"
                                step="any"
                                value={optimizationInputs[row.key] ?? row.val}
                                disabled={disabled}
                                onChange={(e) => handleInputChange(row.key, e.target.value)}
                                style={{
                                    width: "60px",
                                    padding: "2px 4px",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "4px",
                                    fontSize: "11.5px",
                                    fontWeight: "700",
                                    textAlign: "right",
                                    background: "#FFFFFF"
                                }}
                            />
                            <span style={{ fontSize: "11px", color: "#64748B", minWidth: "30px" }}>
                                {row.unit}
                            </span>
                            <span style={{ fontSize: "10.5px", color: "#059669", fontWeight: "600" }}>
                                ({row.calc})
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}