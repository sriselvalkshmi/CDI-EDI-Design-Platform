import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import "../styles/pid.css";

export default function PIDDiagram() {
    const {
        designResult,
        setSelectedEquipment
    } = useApp();

    const [particleOffset, setParticleOffset] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setParticleOffset(prev => (prev + 2) % 100);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    if (!designResult || !designResult.engineering || !designResult.pid) {
        return (
            <div className="panel">
                <h2>P&amp;ID Diagram</h2>
                <p style={{ color: "#6B7280" }}>Generate a design to view P&amp;ID diagram.</p>
            </div>
        );
    }

    const feedWater = designResult.input?.feedWater || {};
    const engineering = designResult.engineering;
    const validation = designResult.validation || {};
    const layout = designResult.pid;

    const activeTech = engineering.technology || "CDI";
    const status = validation.status || "VALID";

    const statusBadgeColor = status === "VALID" ? "#16A34A" : (status === "OPTIMIZATION REQUIRED" ? "#F59E0B" : "#DC2626");
    const statusBadgeBg = status === "VALID" ? "#DCFCE7" : "#FEF3C7";

    const { equipment, pipes } = layout;

    const process = designResult?.process || {};
    const stage1Data = process.stages?.[0] || {};
    const stage2Data = process.stages?.[1] || {};
    const overall = process.overall || {};

    const currentFlowRate = feedWater.flowRate || overall.flowRate || engineering.flowRate;

    return (
        <div className="panel pid-panel" style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 className="panel-title" style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>Process &amp; Instrumentation Diagram (P&amp;ID)</h3>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>Technology: <b>{overall.recommendedProcess || activeTech}</b></span>
                    <span style={{
                        fontSize: "11.5px",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontWeight: "600",
                        background: statusBadgeBg,
                        color: statusBadgeColor
                    }}>
                        ● {status}
                    </span>
                </div>
            </div>

            <div className="pid-svg-container" style={{ background: "#FAFAFA", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "12px" }}>
                <svg width="980" height="380" viewBox="0 0 980 380">
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B" />
                        </marker>
                    </defs>

                    {/* Pipes & Flow Lines */}
                    {pipes && pipes.map((pipe) => {
                        const pts = pipe.points;
                        if (!pts || pts.length < 2) return null;
                        const dStr = pts.reduce((acc, pt, idx) => idx === 0 ? `M ${pt[0]} ${pt[1]}` : `${acc} L ${pt[0]} ${pt[1]}`, "");
                        return (
                            <g key={pipe.id}>
                                <path
                                    d={dStr}
                                    fill="none"
                                    stroke="#94A3B8"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    markerEnd="url(#arrow)"
                                />
                                <path
                                    d={dStr}
                                    fill="none"
                                    stroke="#3B82F6"
                                    strokeWidth="1.5"
                                    strokeDasharray="6,4"
                                />
                            </g>
                        );
                    })}

                    {/* Equipment Blocks */}
                    {equipment && equipment.map((eq) => {
                        if (eq.type === "tank") {
                            const isProduct = eq.id === "PROD_TANK";
                            const isIntermediate = eq.id === "INT_TANK";
                            const tankTDS = isProduct 
                                ? (overall.outletTDS || engineering.outletTDS)
                                : (isIntermediate ? (stage1Data.outletTDS || 1913) : feedWater.tds);
                            
                            return (
                                <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                    setSelectedEquipment({
                                        name: eq.name || (isProduct ? "Product Storage Tank" : (isIntermediate ? "Intermediate Storage Tank" : "Feed Storage Tank")),
                                        type: "Process Tank",
                                        TDS: tankTDS + " ppm",
                                        FlowRate: currentFlowRate + " L/min",
                                        Recovery: (isProduct ? (overall.waterRecovery || engineering.waterRecovery) : 100) + " %"
                                    });
                                }}>
                                    <rect
                                        x={eq.x}
                                        y={eq.y}
                                        width={eq.width}
                                        height={eq.height}
                                        fill={isProduct ? "#F0FDF4" : (isIntermediate ? "#FEF3C7" : "#EFF6FF")}
                                        stroke={isProduct ? "#16A34A" : (isIntermediate ? "#D97706" : "#2563EB")}
                                        strokeWidth="2"
                                        rx="6"
                                    />
                                    <text x={eq.x + 8} y={eq.y + 24} fontWeight="600" fontSize="11" fill="#1F2937">{eq.name}</text>
                                    <text x={eq.x + 8} y={eq.y + 44} fontSize="10.5" fill="#6B7280">TDS: {tankTDS} ppm</text>
                                    <text x={eq.x + 8} y={eq.y + 60} fontSize="10.5" fill="#6B7280">Flow: {currentFlowRate} L/min</text>
                                </g>
                            );
                        }

                        if (eq.type === "pump") {
                            const isSlurry = eq.id === "SPUMP";
                            return (
                                <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                    setSelectedEquipment({
                                        name: isSlurry ? "Slurry Pump" : "Feed Pump",
                                        type: "Centrifugal Pump",
                                        FlowRate: currentFlowRate + " L/min",
                                        Pressure: (engineering.pressureDrop / 100000).toFixed(2) + " bar",
                                        Power: engineering.pumpPower + " W"
                                    });
                                }}>
                                    <circle
                                        cx={eq.x}
                                        cy={eq.y}
                                        r={eq.radius || 22}
                                        fill="#FFFFFF"
                                        stroke={statusBadgeColor}
                                        strokeWidth="2.5"
                                    />
                                    <text x={eq.x - 14} y={eq.y + 4} fontSize="10" fontWeight="600" fill="#1F2937">
                                        {isSlurry ? "SPUMP" : "PUMP"}
                                    </text>
                                </g>
                            );
                        }

                        if (eq.type === "reactor") {
                            const s1Eng = stage1Data.engineering || stage1Data || {};
                            return (
                                <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                    setSelectedEquipment({
                                        name: eq.name || (activeTech + " Reactor"),
                                        Technology: s1Eng.technology || activeTech,
                                        Stage: "Stage 1 (Bulk Desalination)",
                                        Voltage: (s1Eng.voltage || engineering.voltage) + " V",
                                        Current: (s1Eng.current || engineering.current) + " A",
                                        Power: (s1Eng.power || engineering.power) + " W",
                                        FlowRate: currentFlowRate + " L/min",
                                        ElectrodeArea: (s1Eng.electrodeArea || engineering.electrodeArea) + " cm²",
                                        CellPairs: s1Eng.cellPairs || engineering.cellPairs,
                                        OutletTDS: (stage1Data.outletTDS || s1Eng.outletTDS || engineering.outletTDS) + " ppm"
                                    });
                                }}>
                                    <rect
                                        x={eq.x}
                                        y={eq.y}
                                        width={eq.width}
                                        height={eq.height}
                                        fill="#F8FAFC"
                                        stroke="#2563EB"
                                        strokeWidth="2.5"
                                        rx="6"
                                    />
                                    <text x={eq.x + 10} y={eq.y + 24} fontWeight="700" fontSize="12" fill="#2563EB">{eq.name || (activeTech + " Reactor")}</text>
                                    <text x={eq.x + 10} y={eq.y + 46} fontSize="10.5" fill="#1F2937">Voltage: {s1Eng.voltage || engineering.voltage} V</text>
                                    <text x={eq.x + 10} y={eq.y + 64} fontSize="10.5" fill="#1F2937">Current: {s1Eng.current || engineering.current} A</text>
                                    <text x={eq.x + 10} y={eq.y + 82} fontSize="10.5" fill="#1F2937">Outlet: {stage1Data.outletTDS || s1Eng.outletTDS || engineering.outletTDS} ppm</text>
                                    <text x={eq.x + 10} y={eq.y + 100} fontSize="10.5" fill="#6B7280">Cell Pairs: {s1Eng.cellPairs || engineering.cellPairs}</text>
                                </g>
                            );
                        }

                        if (eq.type === "edi_polishing") {
                            const s2Eng = stage2Data.engineering || stage2Data || {};
                            return (
                                <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                    setSelectedEquipment({
                                        name: "EDI Stack (Stage 2)",
                                        Technology: "EDI",
                                        Stage: "Stage 2 (Final Polishing)",
                                        Voltage: (s2Eng.voltage || 25.0) + " V",
                                        Current: (s2Eng.current || 2.1) + " A",
                                        Power: (s2Eng.power || 52.5) + " W",
                                        FlowRate: currentFlowRate + " L/min",
                                        ElectrodeArea: (s2Eng.electrodeArea || 400) + " cm²",
                                        CellPairs: s2Eng.cellPairs || 50,
                                        InletTDS: (stage2Data.inletTDS || s2Eng.inletTDS || 1913) + " ppm",
                                        OutletTDS: (stage2Data.outletTDS || s2Eng.outletTDS || feedWater.targetTds || 100) + " ppm"
                                    });
                                }}>
                                    <rect
                                        x={eq.x}
                                        y={eq.y}
                                        width={eq.width}
                                        height={eq.height}
                                        fill="#FAF5FF"
                                        stroke="#7C3AED"
                                        strokeWidth="2.5"
                                        rx="6"
                                    />
                                    <text x={eq.x + 10} y={eq.y + 24} fontWeight="700" fontSize="12" fill="#7C3AED">EDI Stack (Stage 2)</text>
                                    <text x={eq.x + 10} y={eq.y + 46} fontSize="10.5" fill="#4C1D95">Voltage: {s2Eng.voltage || 25.0} V</text>
                                    <text x={eq.x + 10} y={eq.y + 64} fontSize="10.5" fill="#4C1D95">Current: {s2Eng.current || 2.1} A</text>
                                    <text x={eq.x + 10} y={eq.y + 82} fontSize="10.5" fill="#16A34A">Outlet: {stage2Data.outletTDS || s2Eng.outletTDS || feedWater.targetTds || 100} ppm</text>
                                    <text x={eq.x + 10} y={eq.y + 100} fontSize="10.5" fill="#6B7280">Cell Pairs: {s2Eng.cellPairs || 50}</text>
                                </g>
                            );
                        }

                        return null;
                    })}
                </svg>
            </div>
        </div>
    );
}