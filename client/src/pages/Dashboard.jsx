import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PIDDiagram from "../components/PIDDiagram";
import EquipmentPanel from "../components/EquipmentPanel";
import SimulationGraphs from "../components/SimulationGraphs";
import KPIDashboard from "../components/KPIDashboard";
import EngineeringPanel from "../components/EngineeringPanel";
import OptimizationPanel from "../components/OptimizationPanel";
import RecommendationPanel from "../components/RecommendationPanel";
import ValidationPanel from "../components/ValidationPanel";
import { useApp } from "../context/AppContext";

export default function Dashboard() {
    const { designGenerated, designResult } = useApp();

    const isReady = designGenerated || (designResult?.engineering != null);

    return (
        <div className="dashboard-app-wrapper">
            <Navbar />
            <div className="dashboard-body">
                {/* LEFT FIXED CONTROL SIDEBAR */}
                <Sidebar />

                {/* MAIN ENGINEERING WORKSPACE AREA */}
                <div className="main-workspace-container">
                    {isReady ? (
                        <div className="grid-workspace-layout">
                            {/* LEFT COLUMN: VALIDATION, P&ID, EQUIPMENT, SIMULATION */}
                            <div className="left-column">
                                <ValidationPanel />
                                <PIDDiagram />
                                <EquipmentPanel />
                                <SimulationGraphs />
                            </div>

                            {/* RIGHT COLUMN: KPI DASHBOARD, AI RECOMMENDATION, ENGINEERING ANALYSIS, OPTIMIZATION */}
                            <div className="right-column">
                                <KPIDashboard />
                                <RecommendationPanel />
                                <EngineeringPanel />
                                <OptimizationPanel />
                            </div>
                        </div>
                    ) : (
                        <div className="placeholder-container">
                            <div className="placeholder-card">
                                <div className="placeholder-icon-badge">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                </div>
                                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937", margin: "12px 0 6px 0" }}>CDI / EDI Engineering Design System</h2>
                                <p style={{ fontSize: "14px", color: "#6B7280", margin: 0 }}>Configure feed water parameters in the sidebar and click <b>Generate Design</b>.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}