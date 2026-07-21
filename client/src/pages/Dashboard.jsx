import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PIDDiagram from "../components/PIDDiagram";
import EquipmentPanel from "../components/EquipmentPanel";
import SimulationGraphs from "../components/SimulationGraphs";
import KPIDashboard from "../components/KPIDashboard";
import EngineeringPanel from "../components/EngineeringPanel";
import OptimizationPanel from "../components/OptimizationPanel";
import { useApp } from "../context/AppContext";

export default function Dashboard() {
    const { designGenerated } = useApp();

    return (
        <div className="dashboard-app-wrapper">
            <Navbar />
            <div className="dashboard-body">
                {/* LEFT FIXED CONTROL SIDEBAR (320px) */}
                <Sidebar />

                {/* MAIN ENGINEERING WORKSPACE AREA */}
                <div className="main-workspace-container">
                    {designGenerated ? (
                        <div className="grid-workspace-layout">
                            {/* LEFT COLUMN: DIAGRAMS, EQUIPMENT, SIMULATIONS */}
                            <div className="left-column">
                                <PIDDiagram />
                                <EquipmentPanel />
                                <SimulationGraphs />
                            </div>

                            {/* RIGHT COLUMN: KPI DASHBOARD, ENGINEERING ANALYSIS, OPTIMIZATION */}
                            <div className="right-column">
                                <KPIDashboard />
                                <EngineeringPanel />
                                <OptimizationPanel />
                            </div>
                        </div>
                    ) : (
                        <div className="placeholder-container">
                            <div className="placeholder-card">
                                <div className="placeholder-icon-badge">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                </div>
                                <h2>CDI / EDI Engineering Design System</h2>
                                <p>Enter feed water properties and generate design.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}