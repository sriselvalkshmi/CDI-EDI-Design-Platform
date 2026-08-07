import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import StructureRenderer from "./engineering/StructureRenderer";
import "../styles/pid.css";

export default function PIDDiagram() {
    const {
        designResult,
        setSelectedEquipment,
        technology: selectedTech,
        optimizationInputs
    } = useApp();

    const [viewMode, setViewMode] = useState("DYNAMIC_STRUCTURE"); // "DYNAMIC_STRUCTURE" | "PID"
    const [particleOffset, setParticleOffset] = useState(0);
    const [cycleStep, setCycleStep] = useState("ADSORPTION");

    useEffect(() => {
        const interval = setInterval(() => {
            setParticleOffset(prev => (prev + 2) % 100);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    if (!designResult || !designResult.engineering) {
        return (
            <div className="panel" style={{ background: "#FFFFFF", border: "1px solid #D9DEE7", borderRadius: "8px", padding: "16px" }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>Process Flow &amp; P&amp;ID</h3>
                <p style={{ color: "#64748B", fontSize: "13px" }}>Generate a design to load process schematics.</p>
            </div>
        );
    }

    const feedWater = designResult.input?.feedWater || {};
    const engineering = designResult.engineering || {};
    const validation = designResult.validation || {};
    const layout = designResult.pid || {};
    const simulation = designResult.simulation || {};

    const activeTech = engineering.technology || (selectedTech === "AUTO" ? "CDI" : selectedTech);
    const status = validation.status || "VALID";

    const statusBadgeColor = status === "VALID" ? "#16A34A" : (status === "OPTIMIZATION REQUIRED" ? "#D97706" : "#DC2626");

    const { equipment, pipes } = layout;

    const process = designResult?.process || {};
    const stage1Data = process?.stages?.[0] || {};
    const stage2Data = process?.stages?.[1] || {};
    const overall = process.overall || {};

    const currentFlowRate = feedWater.flowRate || overall.flowRate || engineering.flowRate;

    return (
        <div className="panel pid-panel" style={{ background: "#FFFFFF", border: "1px solid #D9DEE7", borderRadius: "8px", padding: "16px", minHeight: "520px" }}>
            {/* Header & Sub-Tabs Switcher */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                        Process Flow &amp; P&amp;ID
                    </h3>

                    {/* Highlighted Tab Buttons */}
                    <div style={{
                        display: "flex",
                        background: "#F1F5F9",
                        padding: "3px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0"
                    }}>
                        <button
                            onClick={() => setViewMode("DYNAMIC_STRUCTURE")}
                            style={{
                                background: viewMode === "DYNAMIC_STRUCTURE" ? "#2563EB" : "transparent",
                                color: viewMode === "DYNAMIC_STRUCTURE" ? "#FFFFFF" : "#64748B",
                                border: "none",
                                padding: "5px 14px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                                boxShadow: viewMode === "DYNAMIC_STRUCTURE" ? "0 1px 3px rgba(0,0,0,0.15)" : "none"
                            }}
                        >
                            Dynamic Schematic
                        </button>
                        <button
                            onClick={() => setViewMode("PID")}
                            style={{
                                background: viewMode === "PID" ? "#2563EB" : "transparent",
                                color: viewMode === "PID" ? "#FFFFFF" : "#64748B",
                                border: "none",
                                padding: "5px 14px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                                boxShadow: viewMode === "PID" ? "0 1px 3px rgba(0,0,0,0.15)" : "none"
                            }}
                        >
                            Industrial P&amp;ID
                        </button>
                    </div>
                </div>

                {/* ADSORPTION / DESORPTION CYCLE STEP TOGGLE */}
                {viewMode === "DYNAMIC_STRUCTURE" && (
                    <button
                        onClick={() => setCycleStep(prev => (prev === "ADSORPTION" ? "REGENERATION" : "ADSORPTION"))}
                        style={{
                            padding: "5px 12px",
                            background: cycleStep === "ADSORPTION" ? "#16A34A" : "#DC2626",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}
                    >
                        {cycleStep === "ADSORPTION" ? "ADSORPTION MODE (+V)" : "DESORPTION MODE (-V)"}
                    </button>
                )}
            </div>

            {/* TAB 1: DYNAMIC SCHEMATIC */}
            {viewMode === "DYNAMIC_STRUCTURE" && (
                <StructureRenderer
                    technology={activeTech}
                    engineering={engineering}
                    optimization={optimizationInputs}
                    feedWater={feedWater}
                    simulation={simulation}
                    cycleStep={cycleStep}
                    particleOffset={particleOffset}
                    onClickEquipment={(eq) => setSelectedEquipment && setSelectedEquipment(eq)}
                />
            )}

            {/* TAB 2: INDUSTRIAL P&ID DIAGRAM */}
            {viewMode === "PID" && (
                <div className="pid-svg-container" style={{ background: "#FAFAFA", borderRadius: "6px", border: "1px solid #E2E8F0", padding: "12px", minHeight: "410px" }}>
                    <svg width="980" height="380" viewBox="0 0 980 380" style={{ width: "100%", height: "380px", display: "block" }}>
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
                                    : (isIntermediate ? (stage1Data?.outletTDS || 1913) : feedWater.tds);
                                
                                return (
                                    <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                        setSelectedEquipment({
                                            tag: eq.id || "TK-101",
                                            name: eq.name || (isProduct ? "Product Storage Tank" : (isIntermediate ? "Intermediate Storage Tank" : "Feed Storage Tank")),
                                            type: "Process Storage Tank",
                                            voltage: "0.0 V",
                                            current: "0.0 A",
                                            currentDensity: "N/A",
                                            chargeEfficiency: "100.0%",
                                            material: "High-Density Polyethylene (HDPE)",
                                            designStandard: "API 650 / ISO 10628",
                                            operatingPressure: "1.0 bar",
                                            dimensions: `${eq.width || 100} × ${eq.height || 130} mm`
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
                                            tag: isSlurry ? "SP-101" : "P-101",
                                            name: isSlurry ? "Slurry Circulation Pump" : "Feed Water Pump",
                                            type: isSlurry ? "Slurry Hose Peristaltic Pump" : "Centrifugal Feed Pump",
                                            voltage: "230 V (AC)",
                                            current: "1.5 A",
                                            currentDensity: "N/A",
                                            chargeEfficiency: "85.0%",
                                            material: "316L Stainless Steel / Duplex",
                                            designStandard: "ISO 2858 / DIN EN 733",
                                            operatingPressure: (engineering.pressureDrop ? (engineering.pressureDrop / 100000).toFixed(2) : "0.15") + " bar",
                                            dimensions: "Ø 140 mm"
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
                                const s1Eng = stage1Data?.engineering || stage1Data || {};
                                return (
                                    <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                        setSelectedEquipment({
                                            tag: "R-101",
                                            name: eq.name || (activeTech + " Desalination Reactor Stack"),
                                            type: activeTech + " Module Stack",
                                            voltage: (s1Eng.voltage || engineering.voltage) + " V",
                                            current: (s1Eng.current || engineering.current) + " A",
                                            currentDensity: (s1Eng.currentDensity || engineering.currentDensity || 150) + " A/m²",
                                            chargeEfficiency: (engineering.chargeEfficiency || 92.0) + "%",
                                            material: "PVDF Housing / Porous Carbon Electrodes",
                                            designStandard: "IEC 61140 / ISO 10628",
                                            operatingPressure: "1.0 bar",
                                            dimensions: `${eq.width || 180} × ${eq.height || 180} mm`
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
                                        <text x={eq.x + 10} y={eq.y + 82} fontSize="10.5" fill="#1F2937">Outlet: {stage1Data?.outletTDS || s1Eng.outletTDS || engineering.outletTDS} ppm</text>
                                        <text x={eq.x + 10} y={eq.y + 100} fontSize="10.5" fill="#6B7280">Cell Pairs: {s1Eng.cellPairs || engineering.cellPairs}</text>
                                    </g>
                                );
                            }

                            return null;
                        })}
                    </svg>
                </div>
            )}
        </div>
    );
}