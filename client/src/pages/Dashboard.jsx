import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PIDDiagram from "../components/PIDDiagram";
import EquipmentPanel from "../components/EquipmentPanel";
import SimulationGraphs from "../components/SimulationGraphs";
import KPIDashboard from "../components/KPIDashboard";
import EngineeringPanel from "../components/EngineeringPanel";
import OptimizationPanel from "../components/OptimizationPanel";
import ValidationPanel from "../components/ValidationPanel";
import TechTradeoffsPanel from "../components/TechTradeoffsPanel";
import ReportPanel from "../components/ReportPanel";
import { useApp } from "../context/AppContext";

export default function Dashboard() {
    const { designGenerated } = useApp();

    return (
        <div className="dashboard-app-wrapper" style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", background: "#F8FAFC" }}>
            {/* HEADER */}
            <Navbar />

            {/* MAIN WORKSPACE BODY */}
            <div className="dashboard-body" style={{ display: "grid", gridTemplateColumns: "240px 1fr", height: "calc(100vh - 40px)", overflow: "hidden" }}>
                {/* LEFT SIDEBAR: FEED WATER INPUT & TECHNOLOGY SELECTION */}
                <Sidebar />

                {/* MAIN PANEL VIEWPORT */}
                <div className="main-workspace-container" style={{ padding: "10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", height: "100%", boxSizing: "border-box" }}>
                    {designGenerated ? (
                        <>
                            {/* 1. DESIGN VALIDATION */}
                            <ValidationPanel />

                            {/* 2. TECHNOLOGY ADVANTAGES & LIMITATIONS */}
                            <TechTradeoffsPanel />

                            {/* 3. KEY PERFORMANCE INDICATORS */}
                            <KPIDashboard />

                            {/* 4. PROCESS FLOW & P&ID */}
                            <PIDDiagram />

                            {/* 5. DYNAMIC PROCESS SIMULATION */}
                            <SimulationGraphs />

                            {/* 6. ENGINEERING DESIGN SUMMARY */}
                            <EngineeringPanel />

                            {/* 7 & 8. MANUAL OPTIMIZATION & AI VS MANUAL COMPARISON */}
                            <OptimizationPanel />

                            {/* 9. ENGINEERING REPORTS */}
                            <ReportPanel />
                        </>
                    ) : (
                        <div className="placeholder-container" style={{
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "12px",
                            padding: "60px 40px",
                            textAlign: "center",
                            margin: "auto",
                            maxWidth: "520px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                        }}>
                            <div style={{
                                width: "64px",
                                height: "64px",
                                background: "#EFF6FF",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px auto"
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                    <polyline points="2 17 12 22 22 17" />
                                    <polyline points="2 12 12 17 22 12" />
                                </svg>
                            </div>
                            <h3 style={{ margin: "0 0 8px 0", color: "#0F172A", fontSize: "18px", fontWeight: "700" }}>Engineering Design Platform Ready</h3>
                            <p style={{ color: "#64748B", fontSize: "13.5px", margin: "0 0 20px 0", lineHeight: "1.5" }}>
                                Enter feed water quality parameters and target specifications in the left sidebar, then click <strong>Generate Design</strong> to execute physics calculations and view plant schematics.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}