import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import EngineeringCalculatorPanel from "../components/EngineeringCalculatorPanel";
import TechTradeoffsPanel from "../components/TechTradeoffsPanel";
import PIDDiagram from "../components/PIDDiagram";
import SimulationGraphs from "../components/SimulationGraphs";

import EquipmentInspectionModal from "../components/engineering/EquipmentInspectionModal";
import DesignTraceModal from "../components/modals/DesignTraceModal";
import EngineeringBasisModal from "../components/modals/EngineeringBasisModal";
import SelectionLogicModal from "../components/modals/SelectionLogicModal";

import { useApp } from "../context/AppContext";

export default function Dashboard() {
    const { selectedEquipment, setSelectedEquipment } = useApp();

    return (
        <div className="dashboard-app-wrapper" style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", background: "#F1F5F9" }}>
            {/* 1. PROFESSIONAL INDUSTRIAL HEADER */}
            <Navbar />

            {/* MAIN WORKSPACE BODY: LEFT FEED & TARGET CONTROLS + RIGHT PROCESS WORKSPACE */}
            <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", height: "calc(100vh - 44px)", overflow: "hidden" }}>
                {/* 2 & 3. FEED WATER DESIGN BASIS & PRODUCT QUALITY TARGET */}
                <Sidebar />

                {/* ACTIVE PROCESS ENGINEERING DASHBOARD */}
                <main style={{ overflowY: "auto", padding: "14px 18px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "14px" }}>
                    {/* 4, 6, 7, 8, 9, 12. DESIGN RESULT / KPI STRIP, STACK & PROCESS SPECIFICATIONS, MASS BALANCE, BASIS, CONTROLS */}
                    <EngineeringCalculatorPanel />

                    {/* 5. TECHNOLOGY SCREENING MATRIX */}
                    <TechTradeoffsPanel />

                    {/* 10. STACK GEOMETRY & PROCESS FLOW */}
                    <PIDDiagram />

                    {/* 11. DYNAMIC PROCESS SIMULATION */}
                    <SimulationGraphs />
                </main>
            </div>

            {/* GLOBAL ENGINEERING MODALS */}
            {selectedEquipment && (
                <EquipmentInspectionModal
                    equipment={selectedEquipment}
                    onClose={() => setSelectedEquipment(null)}
                />
            )}
            <DesignTraceModal />
            <EngineeringBasisModal />
            <SelectionLogicModal />
        </div>
    );
}