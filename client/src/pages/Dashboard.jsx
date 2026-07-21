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
        <div className="dashboard">
            <Navbar />
            <div className="workspace">
                {/* LEFT CONTROL PANEL */}
                <div className="sidebar-area">
                    <Sidebar />
                </div>

                {designGenerated ? (
                    <>
                        {/* MAIN DESIGN WORKSPACE */}
                        <div className="canvas-area">
                            <PIDDiagram />
                            <EquipmentPanel />
                            <SimulationGraphs />
                        </div>

                        {/* ENGINEERING ANALYSIS PANEL */}
                        <div className="right-area">
                            <KPIDashboard />
                            <EngineeringPanel />
                            <OptimizationPanel />
                        </div>
                    </>
                ) : (
                    <div
                        className="canvas-area placeholder-container"
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: 1,
                            minHeight: "75vh",
                            padding: "60px 40px",
                            textAlign: "center",
                            background: "rgba(15, 23, 42, 0.4)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "16px",
                            margin: "16px",
                            color: "#94a3b8"
                        }}
                    >
                        <div
                            style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(14, 165, 233, 0.2))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "24px",
                                border: "1px solid rgba(56, 189, 248, 0.3)",
                                boxShadow: "0 0 30px rgba(56, 189, 248, 0.2)"
                            }}
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: "24px", color: "#f8fafc", marginBottom: "12px", fontWeight: "600" }}>
                            CDI / EDI Engineering Design System
                        </h2>
                        <p style={{ fontSize: "16px", color: "#94a3b8", maxWidth: "480px", lineHeight: "1.6" }}>
                            Enter feed water properties and click <strong style={{ color: "#38bdf8" }}>Generate Design</strong> to compute electro-thermodynamic calculations, AI recommendations, system sizing, and dynamic simulations.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}