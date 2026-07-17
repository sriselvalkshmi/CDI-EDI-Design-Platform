import React from "react";
import api from "../services/api";
import { useApp } from "../context/AppContext";

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

        // NEW
        setLayout,
        setStack,
        setCellGeometry,

        optimizationMode,
        optimizationInputs,
        lockedParameters

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

            // Clear previous results

            setAiResult(null);
            setEngineering(null);
            setSimulation(null);
            setOptimization(null);
            setPerformance(null);
            setElectrode(null);
            setComponentSizing(null);

            // NEW
            setLayout(null);
            setStack(null);
            setCellGeometry(null);

            const payload = {

                ...feedWater,
                technology,

                optimizationMode,
                optimizationInputs,
                lockedParameters

            };

            console.log("Design Payload:", payload);

            const response = await api.post("/design", payload);

            console.log("Design Response:", response.data);

            const data = response.data;

            //---------------------------------
            // STORE COMPLETE RESPONSE
            //---------------------------------

            setAiResult(data);

            //---------------------------------
            // TECHNOLOGY
            //---------------------------------

            setSelectedDesign(
                data.selectedTechnology || technology
            );

            //---------------------------------
            // DESIGN PARAMETERS
            //---------------------------------

            if (data.designParameters)
                setDesignParameters(data.designParameters);

            //---------------------------------
            // ENGINEERING
            //---------------------------------

            if (data.engineering)
                setEngineering(data.engineering);

            //---------------------------------
            // SIMULATION
            //---------------------------------

            if (data.simulation)
                setSimulation(data.simulation);

            //---------------------------------
            // COMPONENT SIZING
            //---------------------------------

            if (data.sizing)
                setComponentSizing(data.sizing);

            //---------------------------------
            // ELECTRODE
            //---------------------------------

            if (data.electrode)
                setElectrode(data.electrode);

            //---------------------------------
            // PERFORMANCE
            //---------------------------------

            if (data.performance)
                setPerformance(data.performance);

            //---------------------------------
            // OPTIMIZATION
            //---------------------------------

            if (data.optimization)
                setOptimization(data.optimization);

            //---------------------------------
            // STACK
            //---------------------------------

            if (data.stack)
                setStack(data.stack);

            //---------------------------------
            // CELL GEOMETRY
            //---------------------------------

            if (data.cellGeometry)
                setCellGeometry(data.cellGeometry);

            //---------------------------------
            // P&ID LAYOUT
            //---------------------------------

            if (data.layout) {

                console.log("Layout Loaded");

                setLayout(data.layout);

            } else {

                console.warn("No layout received from backend");

            }

        }

        catch (error) {

            console.error("Design Error:", error);

            alert("Unable to generate design.");

        }

        finally {

            setLoading(false);

        }

    }
    //-----------------------------------------------------
// OPTIMIZE DESIGN
//-----------------------------------------------------

async function optimizeDesign() {

    try {

        setLoading(true);

        const payload = {

            ...feedWater,

            technology,

            optimizationMode,

            optimizationInputs,

            lockedParameters

        };

        console.log("Optimization Payload:", payload);

        const response = await api.post(
            "/optimize",
            payload
        );

        console.log(
            "Optimization Response:",
            response.data
        );

        const data = response.data;

        //---------------------------------
// STORE P&ID LAYOUT
//---------------------------------

if (data.layout) {
    console.log("Saving Layout:", data.layout);
    setLayout(data.layout);
} else {
    console.warn("No layout received from backend");
}

        //---------------------------------
        // ENGINEERING
        //---------------------------------

        if (data.engineering) {

            setEngineering(data.engineering);

        }

        //---------------------------------
        // SIMULATION
        //---------------------------------

        if (data.simulation) {

            setSimulation(data.simulation);

        }

        //---------------------------------
        // COMPONENT SIZING
        //---------------------------------

        if (data.sizing) {

            setComponentSizing(data.sizing);

        }

        //---------------------------------
        // ELECTRODE
        //---------------------------------

        if (data.electrode) {

            setElectrode(data.electrode);

        }

        //---------------------------------
        // PERFORMANCE
        //---------------------------------

        if (data.performance) {

            setPerformance(data.performance);

        }

        //---------------------------------
        // OPTIMIZATION
        //---------------------------------

        if (data.optimization) {

            setOptimization(data.optimization);

        }

        //---------------------------------
        // STACK
        //---------------------------------

        if (data.stack) {

            setStack(data.stack);

        }

        //---------------------------------
        // CELL GEOMETRY
        //---------------------------------

        if (data.cellGeometry) {

            setCellGeometry(data.cellGeometry);

        }

        //---------------------------------
        // P&ID LAYOUT
        //---------------------------------

        if (data.layout) {

            setLayout(data.layout);

        }

        //---------------------------------
        // TECHNOLOGY
        //---------------------------------

        if (data.selectedTechnology) {

            setSelectedDesign(
                data.selectedTechnology
            );

        }

        alert("Optimization completed successfully.");

    }

    catch (error) {

        console.error(
            "Optimization Error:",
            error
        );

        if (error.response) {

            console.error(
                error.response.data
            );

            alert(
                error.response.data.error ||
                "Optimization failed."
            );

        }

        else {

            alert("Optimization failed.");

        }

    }

    finally {

        setLoading(false);

    }

}
    //-----------------------------------------------------
    // UI
    //-----------------------------------------------------

    return (

        <div className="sidebar">

            <h2>Feed Water Input</h2>

            <label>TDS (mg/L)</label>
            <input
                type="number"
                value={feedWater.tds}
                onChange={(e) => update("tds", e.target.value)}
            />

            <label>Conductivity (µS/cm)</label>
            <input
                type="number"
                value={feedWater.conductivity}
                onChange={(e) => update("conductivity", e.target.value)}
            />

            <label>Hardness (mg/L)</label>
            <input
                type="number"
                value={feedWater.hardness}
                onChange={(e) => update("hardness", e.target.value)}
            />

            <label>pH</label>
            <input
                type="number"
                step="0.1"
                value={feedWater.ph}
                onChange={(e) => update("ph", e.target.value)}
            />

            <label>Temperature (°C)</label>
            <input
                type="number"
                value={feedWater.temperature}
                onChange={(e) => update("temperature", e.target.value)}
            />

            <label>Flow Rate (L/min)</label>
            <input
                type="number"
                value={feedWater.flowRate}
                onChange={(e) => update("flowRate", e.target.value)}
            />

            <label>Pressure (bar)</label>
            <input
                type="number"
                value={feedWater.pressure}
                onChange={(e) => update("pressure", e.target.value)}
            />

            <label>Target TDS (mg/L)</label>
            <input
                type="number"
                value={feedWater.targetTds}
                onChange={(e) => update("targetTds", e.target.value)}
            />

            <hr />

            <h2>Technology</h2>

             <select
    value={technology}
    onChange={(e) => setTechnology(e.target.value)}
>

    <option value="AUTO">
        AI Recommendation
    </option>

    <option value="CDI">
        CDI
    </option>

    <option value="MCDI">
        MCDI
    </option>

    <option value="FCDI">
        FCDI
    </option>

    <option value="EDI">
        EDI
    </option>

</select>
            <button
                className="primaryButton"
                onClick={generateDesign}
                disabled={loading}
            >
                {loading ? "Generating..." : "Generate Design"}
            </button>

            <button
                className="secondaryButton"
                onClick={optimizeDesign}
                disabled={loading}
                style={{
                    marginTop: 12,
                    background: "#1565c0",
                    color: "#fff"
                }}
            >
                {loading ? "Optimizing..." : "Optimize Design"}
            </button>

        </div>

    );

}