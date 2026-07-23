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
        designGenerated,
        designResult,
        user,
        optimizationStatus,
        setOptimizationStatus,
        optimizationError,
        setOptimizationError
    } = useApp();

    function update(field, value) {
        setOptimizationStatus("idle");
        setFeedWater(prev => ({
            ...prev,
            [field]: Number(value)
        }));
    }

    async function generateDesign() {
        try {
            setLoading(true);
            setOptimizationStatus("idle");
            recalculate(optimizationInputs, technology);
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

            await new Promise(resolve => setTimeout(resolve, 50));

            const res = recalculate(optimizationInputs, technology, true);

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
        <div className="sidebar">
            <h2 className="sidebar-title">Feed Water Input</h2>

            <div className="form-group">
                <label>TDS (mg/L)</label>
                <input
                    type="number"
                    value={feedWater.tds}
                    disabled={isViewer}
                    onChange={(e) => update("tds", e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Conductivity (µS/cm)</label>
                <input
                    type="number"
                    value={feedWater.conductivity}
                    disabled={isViewer}
                    onChange={(e) => update("conductivity", e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Hardness (mg/L)</label>
                <input
                    type="number"
                    value={feedWater.hardness}
                    disabled={isViewer}
                    onChange={(e) => update("hardness", e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>pH</label>
                <input
                    type="number"
                    step="0.1"
                    value={feedWater.ph}
                    disabled={isViewer}
                    onChange={(e) => update("ph", e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Temperature (°C)</label>
                <input
                    type="number"
                    value={feedWater.temperature}
                    disabled={isViewer}
                    onChange={(e) => update("temperature", e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Flow Rate (L/min)</label>
                <input
                    type="number"
                    value={feedWater.flowRate}
                    disabled={isViewer}
                    onChange={(e) => update("flowRate", e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Pressure (bar)</label>
                <input
                    type="number"
                    value={feedWater.pressure}
                    disabled={isViewer}
                    onChange={(e) => update("pressure", e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Target TDS (mg/L)</label>
                <input
                    type="number"
                    value={feedWater.targetTds}
                    disabled={isViewer}
                    onChange={(e) => update("targetTds", e.target.value)}
                />
            </div>

            <hr className="sidebar-divider" />

            <h2 className="sidebar-title">Technology Selection</h2>

            <div className="form-group">
                <select
                    value={technology}
                    disabled={isViewer}
                    onChange={(e) => {
                        setOptimizationStatus("idle");
                        setTechnology(e.target.value);
                    }}
                >
                    <option value="AUTO">AI Recommendation</option>
                    <option value="CDI">CDI</option>
                    <option value="MCDI">MCDI</option>
                    <option value="FCDI">FCDI</option>
                    <option value="EDI">EDI</option>
                </select>
            </div>

            <button
                className="btn-generate-design"
                onClick={generateDesign}
                disabled={loading || isViewer}
            >
                {loading ? "Generating AI Design..." : (designGenerated ? "Design Generated ✓" : "Generate Design")}
            </button>

            <button
                className="btn-optimize-design"
                onClick={optimizeDesign}
                disabled={loading || optimizationStatus === "loading" || isViewer || isResearcher}
                style={{
                    backgroundColor: isLimitReachedState ? "#DC2626" : undefined,
                    color: "#3e20e8ff"
                }}
            >
                {optimizationStatus === "loading"
                    ? "Applying Optimization..."
                    : isLimitReachedState
                    ? "Technology Limit Reached"
                    : optimizationStatus === "success"
                    ? "✓ Optimization Complete"
                    : optimizationStatus === "no_improvement"
                    ? "Current Design Optimal"
                    : optimizationStatus === "error"
                    ? "Optimization Failed"
                    : "Apply Optimization"}
            </button>
            {isLimitReachedState && (
                <div style={{
                    background: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    borderRadius: "6px",
                    padding: "8px",
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#991B1B",
                    textAlign: "center",
                    lineHeight: "1.4"
                }}>
                    <div><b>Target Not Achievable</b></div>
                    <div>Upgrade Required: <b>{designResult?.validation?.recommendedProcess || "FCDI → EDI"}</b></div>
                </div>
            )}
            {optimizationStatus === "error" && optimizationError && (
                <div style={{ color: "#DC2626", fontSize: "11px", marginTop: "6px" }}>
                    Optimization Failed: {optimizationError}
                </div>
            )}
        </div>
    );
}
