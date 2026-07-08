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
import KPIDashboard from "../components/KPIDashboard";
import SimulationGraphs from "../components/SimulationGraphs";
import ProcessFlow from "../components/ProcessFlow";
import OptimizationPanel from "../components/OptimizationPanel";
import PerformancePanel from "../components/PerformancePanel";
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

<ComponentLibrary/>

<ProcessFlow/>

<DesignBuilder/>

</div>






{/* RIGHT INFORMATION PANEL */}

<div className="right-area">

<KPIDashboard />


<RecommendationPanel />


<ParameterPanel />


<ComponentSizing />


<EngineeringPanel />


<DesignSummary />

<OptimizationPanel />

<PerformancePanel />

<ResultPanel />


</div>



</div>


</div>

);

}