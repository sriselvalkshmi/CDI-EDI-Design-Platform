import React from "react";
import { useApp } from "../context/AppContext";
import { generateEngineeringReportPDF } from "../utils/reportGenerator";
import auditLogger from "../services/auditLogger";

export default function Sidebar() {

    const {
        technology,
        setTechnology,
        feedWater,
        setFeedWater,
        loading,
        setLoading,
        setAiResult,
        setSelectedDesign,
        setDesignParameters,
        setEngineering,
        setSimulation,
        setComponentSizing,
        setPerformance,
        setOptimization,
        setElectrode,
        setLayout,
        setStack,
        setCellGeometry,
        optimizationMode,
        optimizationInputs,
        lockedParameters,
        recalculate,
        user
    } = useApp();

    //-----------------------------------------------------
    // UPDATE FEED WATER
    //-----------------------------------------------------

    function update(field, value) {

        setFeedWater(prev => ({
            ...prev,
            [field]: Number(value)
        }));

    }

    //-----------------------------------------------------
    // GENERATE DESIGN
    //-----------------------------------------------------

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
    //-----------------------------------------------------
    // UI
    //-----------------------------------------------------

    const isViewer = user && user.role === "Viewer";
    const isResearcher = user && user.role === "Researcher";

    return (
        <div className="sidebar">
            <h2>Feed Water Input</h2>

            <label>TDS (mg/L)</label>
            <input
                type="number"
                value={feedWater.tds}
                disabled={isViewer}
                onChange={(e) => update("tds", e.target.value)}
            />

            <label>Conductivity (µS/cm)</label>
            <input
                type="number"
                value={feedWater.conductivity}
                disabled={isViewer}
                onChange={(e) => update("conductivity", e.target.value)}
            />

            <label>Hardness (mg/L)</label>
            <input
                type="number"
                value={feedWater.hardness}
                disabled={isViewer}
                onChange={(e) => update("hardness", e.target.value)}
            />

            <label>pH</label>
            <input
                type="number"
                step="0.1"
                value={feedWater.ph}
                disabled={isViewer}
                onChange={(e) => update("ph", e.target.value)}
            />

            <label>Temperature (°C)</label>
            <input
                type="number"
                value={feedWater.temperature}
                disabled={isViewer}
                onChange={(e) => update("temperature", e.target.value)}
            />

            <label>Flow Rate (L/min)</label>
            <input
                type="number"
                value={feedWater.flowRate}
                disabled={isViewer}
                onChange={(e) => update("flowRate", e.target.value)}
            />

            <label>Pressure (bar)</label>
            <input
                type="number"
                value={feedWater.pressure}
                disabled={isViewer}
                onChange={(e) => update("pressure", e.target.value)}
            />

            <label>Target TDS (mg/L)</label>
            <input
                type="number"
                value={feedWater.targetTds}
                disabled={isViewer}
                onChange={(e) => update("targetTds", e.target.value)}
            />

            <hr />

            <h2>Technology</h2>

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

            <button
                className="primaryButton"
                onClick={generateDesign}
                disabled={loading || isViewer}
            >
                {loading ? "Generating..." : "Generate Design"}
            </button>

            <button
                className="secondaryButton"
                onClick={optimizeDesign}
                disabled={loading || isViewer || isResearcher}
                style={{
                    marginTop: 12,
                    background: (isViewer || isResearcher) ? "#cbd5e1" : "#1565c0",
                    color: (isViewer || isResearcher) ? "#94a3b8" : "#fff",
                    cursor: (isViewer || isResearcher) ? "not-allowed" : "pointer"
                }}
            >
                {loading ? "Optimizing..." : "Optimize Design"}
            </button>
        </div>

    );

}
