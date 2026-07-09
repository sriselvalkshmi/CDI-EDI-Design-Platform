import React from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import ComponentLibrary from "../components/ComponentLibrary";
import ProcessFlow from "../components/ProcessFlow";
import DesignBuilder from "../components/DesignBuilder";
import PIDDiagram from "../components/PIDDiagram";

import RecommendationPanel from "../components/RecommendationPanel";
import ParameterPanel from "../components/ParameterPanel";
import ComponentSizing from "../components/ComponentSizing";
import EngineeringPanel from "../components/EngineeringPanel";
import DesignSummary from "../components/DesignSummary";
import ResultPanel from "../components/ResultPanel";
import KPIDashboard from "../components/KPIDashboard";
import SimulationGraphs from "../components/SimulationGraphs";
import OptimizationPanel from "../components/OptimizationPanel";
import CDIPerformancePanel from "../components/CDIPerformancePanel";
import StackDesignPanel from "../components/StackDesignPanel";
import EquipmentPanel from "../components/EquipmentPanel";

export default function Dashboard() {

    return (

        <div className="dashboard">

            <Navbar />

            <div className="workspace">

                {/* LEFT PANEL */}

                <div className="sidebar-area">

                    <Sidebar />

                </div>

                {/* CENTER */}

                <div className="canvas-area">

    

                    <PIDDiagram />

                     <EquipmentPanel />

                     <SimulationGraphs />
                     < RecommendationPanel/>

                </div>

                {/* RIGHT PANEL */}

                <div className="right-area">

                   

                    <KPIDashboard />


                    <ParameterPanel />

                    <ComponentSizing />


                    <OptimizationPanel />

                    <StackDesignPanel />

                    <ResultPanel />

                </div>

            </div>

        </div>

    );

}