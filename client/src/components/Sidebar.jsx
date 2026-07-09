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
        setSimulation,
        setEngineering,
        setComponentSizing,
        setOptimization,
        setPerformance,
        setStack,
        setLayout

    } = useApp();

    function update(field, value) {

        setFeedWater({

            ...feedWater,

            [field]: Number(value)

        });

    }

    async function generateDesign() {

        try {

            setLoading(true);

            setAiResult(null);

            const response = await api.post("/design", {

                ...feedWater,

                technology

            });

            console.log("AI RESULT:", response.data);

            const data = response.data;

            setAiResult(data);

            if (data.recommendation) {

                console.log(
                    "Selected Technology:",
                    data.recommendation.technology
                );

                setSelectedDesign(
                    data.recommendation.technology
                );

            }

            if (data.designParameters) {

                setDesignParameters(
                    data.designParameters
                );

            }

            if (data.engineering) {

                setEngineering(
                    data.engineering
                );

            }

            if (data.sizing) {

                setComponentSizing(
                    data.sizing
                );

            }

            if (data.simulation) {

                setSimulation(
                    data.simulation
                );

            }

            if (data.optimization) {

                setOptimization(
                    data.optimization
                );

            }

            if (data.performance) {

                setPerformance(
                    data.performance
                );

            }

            if (data.stack) {

                setStack(
                    data.stack
                );

            }

            if(response.data.layout){

                 setLayout(
                   response.data.layout
                );

            }

        }

        catch (error) {

            console.error(error);

            alert("AI server error");

        }

        finally {

            setLoading(false);

        }

    }

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

            <label>Hardness (mg/L as CaCO₃)</label>

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

                <option value="CDI">CDI</option>

                <option value="MCDI">MCDI</option>

                <option value="FCDI">FCDI</option>

                <option value="EDI">EDI</option>

            </select>

            <button

                onClick={generateDesign}

                disabled={loading}

            >

                {loading
                    ? "Generating..."
                    : "Generate Design"}

            </button>

        </div>

    );

}