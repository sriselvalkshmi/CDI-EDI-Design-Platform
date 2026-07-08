import React from "react";
import api from "../services/api";
import { useApp } from "../context/AppContext";

export default function Sidebar() {

const {

    technology,
    setTechnology,

    feedWater,
    setFeedWater,

    componentSizing,
    setComponentSizing,

    loading,
    setLoading,

    setAiResult,
    setSelectedDesign,
    setDesignParameters,
    setSimulation,
    setEngineering,

    setOptimization

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

            setAiResult(response.data);

            if (response.data.recommendation) {

             console.log(
             "Selected Technology:",
              response.data.recommendation.technology
    );

           setSelectedDesign(
         response.data.recommendation.technology
    );

}

            if (response.data.designParameters) {

                setDesignParameters(
                    response.data.designParameters
                );

            }

            if (response.data.simulation) {

                setSimulation(
                    response.data.simulation
                );

            }
            if(response.data.optimization){

    setOptimization(
        response.data.optimization
    );
             

}

            if (response.data.engineering) {

                setEngineering(
                    response.data.engineering
                );

            }

            
         if (response.data.sizing) {

    setComponentSizing(
        response.data.sizing
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
onChange={(e)=>update("tds",e.target.value)}
/>

<label>Conductivity (µS/cm)</label>
<input
type="number"
value={feedWater.conductivity}
onChange={(e)=>update("conductivity",e.target.value)}
/>

<label>Hardness (mg/L as CaCO₃)</label>
<input
type="number"
value={feedWater.hardness}
onChange={(e)=>update("hardness",e.target.value)}
/>

<label>pH</label>
<input
type="number"
step="0.1"
value={feedWater.ph}
onChange={(e)=>update("ph",e.target.value)}
/>

<label>Temperature (°C)</label>
<input
type="number"
value={feedWater.temperature}
onChange={(e)=>update("temperature",e.target.value)}
/>

<label>Flow Rate (L/min)</label>
<input
type="number"
value={feedWater.flowRate}
onChange={(e)=>update("flowRate",e.target.value)}
/>

<label>Pressure (bar)</label>
<input
type="number"
value={feedWater.pressure}
onChange={(e)=>update("pressure",e.target.value)}
/>

<label>Target TDS (mg/L)</label>
<input
type="number"
value={feedWater.targetTds}
onChange={(e)=>update("targetTds",e.target.value)}
/>

<hr/>

<h2>Technology</h2>

<select
value={technology}
onChange={(e)=>setTechnology(e.target.value)}
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

{loading ? "Generating..." : "Generate Design"}

</button>

</div>

);

}