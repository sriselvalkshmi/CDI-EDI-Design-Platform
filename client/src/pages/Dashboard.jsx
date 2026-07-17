import React from "react";


import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import PIDDiagram from "../components/PIDDiagram";

import EquipmentPanel from "../components/EquipmentPanel";
import SimulationGraphs from "../components/SimulationGraphs";
import RecommendationPanel from "../components/RecommendationPanel";

import KPIDashboard from "../components/KPIDashboard";
import EngineeringPanel from "../components/EngineeringPanel";
import OptimizationPanel from "../components/OptimizationPanel";




export default function Dashboard(){



return(



<div className="dashboard">



<Navbar />






<div className="workspace">






{/* LEFT CONTROL PANEL */}



<div className="sidebar-area">


<Sidebar />


</div>








{/* MAIN DESIGN WORKSPACE */}



<div className="canvas-area">





{/* PROCESS FLOW */}

<PIDDiagram />






{/* SELECTED EQUIPMENT */}

<EquipmentPanel />






{/* CDI DYNAMIC SIMULATION */}

<SimulationGraphs />











</div>









{/* ENGINEERING ANALYSIS PANEL */}



<div className="right-area">





<KPIDashboard />





<EngineeringPanel />





<OptimizationPanel />











</div>







</div>







</div>



);


}