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
        user
    } = useApp();

    function update(field, value) {
        setFeedWater(prev => ({
            ...prev,
            [field]: Number(value)
        }));
    }

    async function generateDesign() {
        try {
            setLoading(true);
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
            setLoading(true);
            recalculate(optimizationInputs, technology);
            if (user) {
                await auditLogger.logActivity(user.id, user.email, "Optimize Design", "Dashboard", `Optimized parameters for ${technology}`);
            }
        } catch (error) {
            console.error("Optimization Error:", error);
        } finally {
            setLoading(false);
        }
    }

    const isViewer = user && user.role === "Viewer";
    const isResearcher = user && user.role === "Researcher";

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
                    onChange={(e) => setTechnology(e.target.value)}
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
                disabled={loading || isViewer || isResearcher}
            >
                {loading ? "Optimizing..." : "Optimize Design"}
            </button>
        </div>
    );
}
