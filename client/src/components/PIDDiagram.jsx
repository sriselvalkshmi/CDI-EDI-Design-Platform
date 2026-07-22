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

    // Single Source of Truth: designResult.engineering.technology
    const activeTech = engineering.technology || "CDI";
    const status = validation.status || "VALID";

    const statusBadgeColor = status === "VALID" ? "#16A34A" : (status === "OPTIMIZATION REQUIRED" ? "#F59E0B" : "#DC2626");
    const statusBadgeText = status === "VALID" ? "RUNNING" : (status === "OPTIMIZATION REQUIRED" ? "WARNING" : "ALARM");

    const { equipment, pipes } = layout;

    return (
        <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 className="panel-title" style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>Process &amp; Instrumentation Diagram (P&amp;ID)</h3>
                <span style={{
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "600",
                    backgroundColor: status === "VALID" ? "#DCFCE7" : "#FEF3C7",
                    color: statusBadgeColor
                }}>
                    ● {statusBadgeText} ({status})
                </span>
            </div>

            <svg width="100%" height="400" viewBox="0 0 1000 400" style={{ background: "#FFFFFF", borderRadius: "8px", border: "1px solid #D9E2EC" }}>
                {/* Pipes */}
                {pipes && pipes.map((pipe) => {
                    const pointsStr = pipe.points.map(p => p.join(",")).join(" ");
                    return (
                        <g key={pipe.id}>
                            <polyline
                                points={pointsStr}
                                fill="none"
                                stroke="#CBD5E1"
                                strokeWidth="5"
                                strokeLinecap="round"
                            />
                            <polyline
                                points={pointsStr}
                                fill="none"
                                stroke="#2563EB"
                                strokeWidth="2.5"
                                strokeDasharray="6,4"
                                strokeDashoffset={-particleOffset}
                            />
                        </g>
                    );
                })}

                {/* Equipment Blocks */}
                {equipment && equipment.map((eq) => {
                    if (eq.type === "tank") {
                        const isProduct = eq.id === "PROD_TANK";
                        return (
                            <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                setSelectedEquipment({
                                    name: isProduct ? "Product Water Storage Tank" : "Feed Water Storage Tank",
                                    type: "Process Tank",
                                    TDS: (isProduct ? engineering.outletTDS : feedWater.tds) + " ppm",
                                    FlowRate: engineering.flowRate + " L/min",
                                    Recovery: engineering.waterRecovery + " %"
                                });
                            }}>
                                <rect
                                    x={eq.x}
                                    y={eq.y}
                                    width={eq.width}
                                    height={eq.height}
                                    fill={isProduct ? "#F0FDF4" : "#EFF6FF"}
                                    stroke={isProduct ? "#16A34A" : "#2563EB"}
                                    strokeWidth="2"
                                    rx="6"
                                />
                                <text x={eq.x + 12} y={eq.y + 24} fontWeight="600" fontSize="12" fill="#1F2937">{eq.name}</text>
                                <text x={eq.x + 12} y={eq.y + 44} fontSize="11" fill="#6B7280">TDS: {isProduct ? engineering.outletTDS : feedWater.tds} ppm</text>
                                <text x={eq.x + 12} y={eq.y + 60} fontSize="11" fill="#6B7280">Flow: {engineering.flowRate} L/min</text>
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
                                    FlowRate: engineering.flowRate + " L/min",
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
                        return (
                            <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                setSelectedEquipment({
                                    name: activeTech + " Desalination Reactor",
                                    Technology: activeTech,
                                    Voltage: engineering.voltage + " V",
                                    Current: engineering.current + " A",
                                    Power: engineering.power + " W",
                                    CurrentDensity: engineering.currentDensity + " A/m²",
                                    ElectrodeArea: engineering.electrodeArea + " cm²",
                                    FlowRate: engineering.flowRate + " L/min",
                                    ResidenceTime: engineering.residenceTime + " min",
                                    CellPairs: engineering.cellPairs
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
                                <text x={eq.x + eq.width / 2 - 40} y={eq.y + 26} fontWeight="700" fontSize="13" fill="#2563EB">{activeTech} Reactor</text>
                                <text x={eq.x + 15} y={eq.y + 52} fontSize="11" fill="#1F2937">Voltage: {engineering.voltage} V</text>
                                <text x={eq.x + 15} y={eq.y + 72} fontSize="11" fill="#1F2937">Current: {engineering.current} A</text>
                                <text x={eq.x + 15} y={eq.y + 92} fontSize="11" fill="#1F2937">Power: {engineering.power} W</text>
                                <text x={eq.x + 15} y={eq.y + 112} fontSize="11" fill="#6B7280">Cell Pairs: {engineering.cellPairs}</text>
                            </g>
                        );
                    }

                    return null;
                })}
            </svg>
        </div>
    );
}