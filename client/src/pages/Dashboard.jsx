import React from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import ComponentLibrary from "../components/ComponentLibrary";
import DesignBuilder from "../components/DesignBuilder";
import SystemDrawing from "../components/SystemDrawing";

import RecommendationPanel from "../components/RecommendationPanel";
import ParameterPanel from "../components/ParameterPanel";
import ComponentSizing from "../components/ComponentSizing";
import EngineeringPanel from "../components/EngineeringPanel";
import DesignSummary from "../components/DesignSummary";
import ResultPanel from "../components/ResultPanel";

import SimulationGraphs from "../components/SimulationGraphs";


export default function Dashboard(){

return (

<div className="dashboard">


<Navbar />



<div className="workspace">



{/* LEFT INPUT PANEL */}

<div className="sidebar-area">

<Sidebar />

</div>





{/* CENTER DESIGN + SIMULATION */}

<div className="canvas-area">


<ComponentLibrary />


<SystemDrawing />


<DesignBuilder />



<h2>
CDI/EDI Simulation Results
</h2>


<SimulationGraphs />


</div>






{/* RIGHT INFORMATION PANEL */}

<div className="right-area">


<RecommendationPanel />


<ParameterPanel />


<ComponentSizing />


<EngineeringPanel />


<DesignSummary />


<ResultPanel />


</div>



</div>


</div>

);

}