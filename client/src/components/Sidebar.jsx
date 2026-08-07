import React from "react";
import { useApp } from "../context/AppContext";
import auditLogger from "../services/auditLogger";

export default function Sidebar() {
    const {
        technology,
        setTechnology,
        feedWater,
        setFeedWater,
        loading,
        setLoading,
        optimizationInputs,
        recalculate,
        user,
        optimizationStatus,
        setOptimizationStatus,
        setOptimizationError,
        designGenerated,
        setDesignGenerated
    } = useApp();

    function update(field, value) {
        setOptimizationStatus("idle");
        const numVal = Number(value);
        const newFeed = {
            ...feedWater,
            [field]: numVal
        };

        // Automatically scale conductivity and hardness proportionally when TDS changes
        if (field === "tds" && numVal > 0) {
            newFeed.conductivity = Math.round(numVal / 0.65);
            newFeed.hardness = Math.round(numVal * 0.30);
        }

        setFeedWater(newFeed);
        if (designGenerated) {
            recalculate(optimizationInputs, technology, false, newFeed);
        }
    }

    function handleTechnologyChange(newTech) {
        setOptimizationStatus("idle");
        setTechnology(newTech);
        if (designGenerated) {
            recalculate(optimizationInputs, newTech, false);
        }
    }

    async function generateDesign() {
        try {
            setLoading(true);
            setOptimizationStatus("idle");
            setDesignGenerated(true);
            recalculate(optimizationInputs, technology || "AUTO");
            if (user) {
                await auditLogger.logActivity(user.id, user.email, "Generate Design", "Dashboard", `Generated design for ${technology}`);
            }
        } catch (error) {
            console.error("Design Error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function optimizeDesign() {
        try {
            setOptimizationStatus("loading");
            setLoading(true);
            setOptimizationError(null);
            setDesignGenerated(true);

            await new Promise(resolve => setTimeout(resolve, 50));

            const res = recalculate(optimizationInputs, technology || "AUTO", true);

            const {
                isLimitReached = false,
                status = "OPTIMIZED",
                recommendedProcess = ""
            } = res || {};

            const isMultiStageProcess = recommendedProcess?.includes("→") || res?.recommendedProcess?.includes("→");

            if (isLimitReached && !isMultiStageProcess && status === "LIMIT_REACHED") {
                setOptimizationStatus("LIMIT_REACHED");
            } else if (res?.noImprovement || status === "NO_IMPROVEMENT") {
                setOptimizationStatus("no_improvement");
            } else {
                setOptimizationStatus("success");
            }

            if (user) {
                await auditLogger.logActivity(user.id, user.email, "Apply Optimization", "Dashboard", `Optimized parameters for ${technology}`);
            }
        } catch (error) {
            console.error("Optimization Error:", error);
            setOptimizationStatus("error");
            setOptimizationError(error.message || "Optimization execution failed.");
        } finally {
            setLoading(false);
        }
    }

    const isViewer = user && user.role === "Viewer";
    const isResearcher = user && user.role === "Researcher";
    const isLimitReachedState = optimizationStatus === "LIMIT_REACHED" || optimizationStatus === "LIMIT REACHED";

    return (
        <div className="sidebar" style={{ background: "#FFFFFF", borderRight: "1px solid #D9E2EC", padding: "10px", width: "240px", boxSizing: "border-box", overflowY: "auto" }}>
            <h2 className="sidebar-title" style={{ fontSize: "13px", fontWeight: "700", color: "#1F2937", margin: "0 0 6px 0" }}>Feed Water Input</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                <div>
                    <label style={{ fontSize: "10.5px", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "2px" }}>TDS (mg/L)</label>
                    <input
                        type="number"
                        value={feedWater.tds}
                        disabled={isViewer}
                        onChange={(e) => update("tds", e.target.value)}
                        style={{ width: "100%", padding: "3px 6px", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "11.5px", boxSizing: "border-box" }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: "10.5px", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "2px" }}>Cond (µS/cm)</label>
                    <input
                        type="number"
                        value={feedWater.conductivity}
                        disabled={isViewer}
                        onChange={(e) => update("conductivity", e.target.value)}
                        style={{ width: "100%", padding: "3px 6px", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "11.5px", boxSizing: "border-box" }}
                    />
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                <div>
                    <label style={{ fontSize: "10.5px", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "2px" }}>Hardness</label>
                    <input
                        type="number"
                        value={feedWater.hardness}
                        disabled={isViewer}
                        onChange={(e) => update("hardness", e.target.value)}
                        style={{ width: "100%", padding: "3px 6px", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "11.5px", boxSizing: "border-box" }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: "10.5px", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "2px" }}>pH Std</label>
                    <input
                        type="number"
                        step="0.1"
                        value={feedWater.ph}
                        disabled={isViewer}
                        onChange={(e) => update("ph", e.target.value)}
                        style={{ width: "100%", padding: "3px 6px", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "11.5px", boxSizing: "border-box" }}
                    />
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                <div>
                    <label style={{ fontSize: "10.5px", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "2px" }}>Temp (°C)</label>
                    <input
                        type="number"
                        value={feedWater.temperature}
                        disabled={isViewer}
                        onChange={(e) => update("temperature", e.target.value)}
                        style={{ width: "100%", padding: "3px 6px", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "11.5px", boxSizing: "border-box" }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: "10.5px", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "2px" }}>Flow (L/min)</label>
                    <input
                        type="number"
                        value={feedWater.flowRate}
                        disabled={isViewer}
                        onChange={(e) => update("flowRate", e.target.value)}
                        style={{ width: "100%", padding: "3px 6px", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "11.5px", boxSizing: "border-box" }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: "6px" }}>
                <label style={{ fontSize: "10.5px", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "2px" }}>Pressure (bar)</label>
                <input
                    type="number"
                    step="0.1"
                    value={feedWater.pressure}
                    disabled={isViewer}
                    onChange={(e) => update("pressure", e.target.value)}
                    style={{ width: "100%", padding: "3px 6px", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "11.5px", boxSizing: "border-box" }}
                />
            </div>

            <hr style={{ margin: "8px 0", border: 0, borderTop: "1px solid #E5E7EB" }} />

            <h2 className="sidebar-title" style={{ fontSize: "13px", fontWeight: "700", color: "#1F2937", margin: "0 0 6px 0" }}>Target Specifications</h2>

            <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "10.5px", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "2px" }}>Target TDS (mg/L)</label>
                <input
                    type="number"
                    value={feedWater.targetTds}
                    disabled={isViewer}
                    onChange={(e) => update("targetTds", e.target.value)}
                    style={{ width: "100%", padding: "3px 6px", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "11.5px", boxSizing: "border-box" }}
                />
            </div>

            <hr style={{ margin: "8px 0", border: 0, borderTop: "1px solid #E5E7EB" }} />

            {/* TECHNOLOGY SELECTION */}
            <h2 className="sidebar-title" style={{ fontSize: "13px", fontWeight: "700", color: "#1F2937", margin: "0 0 6px 0" }}>Technology Selection</h2>

            <div style={{ marginBottom: "10px" }}>
                <select
                    value={technology}
                    disabled={isViewer}
                    onChange={(e) => handleTechnologyChange(e.target.value)}
                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "11.5px", boxSizing: "border-box", fontWeight: "600" }}
                >
                    <option value="AUTO">Auto (AI Recommendation)</option>
                    <option value="CDI">CDI (Capacitive Deionization)</option>
                    <option value="MCDI">MCDI (Membrane CDI)</option>
                    <option value="FCDI">FCDI (Flow Electrode CDI)</option>
                    <option value="EDI">EDI (Electrodeionization)</option>
                </select>
            </div>

            <hr style={{ margin: "8px 0", border: 0, borderTop: "1px solid #E5E7EB" }} />

            {/* DESIGN ACTIONS */}
            <h2 className="sidebar-title" style={{ fontSize: "13px", fontWeight: "700", color: "#1F2937", margin: "0 0 8px 0" }}>Design Actions</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                    className="btn-generate-design"
                    onClick={generateDesign}
                    disabled={loading || isViewer}
                    style={{
                        width: "100%",
                        padding: "8px",
                        background: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        fontSize: "12px",
                        cursor: "pointer"
                    }}
                >
                    {loading ? "Generating..." : "Generate Design"}
                </button>

                <button
                    className="btn-optimize-design"
                    onClick={optimizeDesign}
                    disabled={loading || optimizationStatus === "loading" || isViewer || isResearcher}
                    style={{
                        width: "100%",
                        padding: "8px",
                        background: isLimitReachedState ? "#DC2626" : "#0F172A",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        fontSize: "12px",
                        cursor: "pointer"
                    }}
                >
                    {optimizationStatus === "loading"
                        ? "Optimizing..."
                        : isLimitReachedState
                        ? "Limit Reached"
                        : "Apply AI Optimization"}
                </button>
            </div>
        </div>
    );
}
