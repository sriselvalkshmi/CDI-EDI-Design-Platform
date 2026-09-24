import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import StructureRenderer from "./engineering/StructureRenderer";
import CAD3DStackViewer from "./engineering/CAD3DStackViewer";
import layoutGenerator from "@shared/engineering/core/layoutGenerator.js";
import "../styles/pid.css";

export default function PIDDiagram() {
    const {
        designResult,
        setSelectedEquipment,
        technology: selectedTech,
        optimizationInputs
    } = useApp();

    const [viewMode, setViewMode] = useState("PID"); // "PID" | "DYNAMIC_STRUCTURE" | "3D_CAD"
    const [particleOffset, setParticleOffset] = useState(0);
    const [cycleStep, setCycleStep] = useState("ADSORPTION");

    useEffect(() => {
        const interval = setInterval(() => {
            setParticleOffset(prev => (prev + 2) % 100);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const layout = useMemo(() => {
        if (designResult?.pid?.equipment && designResult.pid.equipment.length > 0) {
            return designResult.pid;
        }
        if (designResult?.engineering) {
            try {
                return layoutGenerator({
                    engineering: designResult.engineering,
                    input: designResult.input || { feedWater: designResult.engineering }
                }) || {};
            } catch (err) {
                console.warn("PID fallback layout generation error:", err);
            }
        }
        return {};
    }, [designResult?.pid, designResult?.engineering, designResult?.input]);

    const equipment = layout.equipment || [];
    const pipes = layout.pipes || [];

    // Dynamic responsive SVG bounding box to ensure P&ID fits 100% inside any panel width/height
    // Declared before any early returns to strictly comply with React Rules of Hooks
    const viewBoxStr = useMemo(() => {
        const defaultVb = "0 0 940 340";
        if (!equipment || equipment.length === 0) return defaultVb;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        equipment.forEach(eq => {
            const r = eq.radius || 0;
            const w = eq.width || (r ? r * 2 : 40);
            const h = eq.height || (r ? r * 2 : 40);
            const x1 = r ? eq.x - r : eq.x;
            const y1 = r ? eq.y - r : eq.y;
            const x2 = x1 + w;
            const y2 = y1 + h;
            if (x1 < minX) minX = x1;
            if (y1 < minY) minY = y1;
            if (x2 > maxX) maxX = x2;
            if (y2 > maxY) maxY = y2;
        });

        if (pipes && pipes.length > 0) {
            pipes.forEach(pipe => {
                if (pipe.points) {
                    pipe.points.forEach(([px, py]) => {
                        if (px < minX) minX = px;
                        if (py < minY) minY = py;
                        if (px > maxX) maxX = px;
                        if (py > maxY) maxY = py;
                    });
                }
            });
        }

        if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
            return defaultVb;
        }

        const padding = 24;
        const x = Math.floor(minX - padding);
        const y = Math.floor(minY - padding);
        const w = Math.ceil(maxX - minX + padding * 2);
        const h = Math.ceil(maxY - minY + padding * 2);

        return `${x} ${y} ${w} ${h}`;
    }, [equipment, pipes]);

    if (!designResult || !designResult.engineering) {
        return null;
    }

    const feedWater = designResult.input?.feedWater || {};
    const engineering = designResult.engineering || {};
    const validation = designResult.validation || {};
    const simulation = designResult.simulation || {};

    const activeTech = designResult?.selectedTechnology || engineering.technology || (selectedTech !== "AUTO" ? selectedTech : "MCDI");
    const status = validation.status || "VALID";

    const statusBadgeColor = status === "VALID" ? "#16A34A" : (status === "OPTIMIZATION REQUIRED" ? "#D97706" : "#DC2626");

    const process = designResult?.process || {};
    const stage1Data = process?.stages?.[0] || {};
    const stage2Data = process?.stages?.[1] || {};
    const overall = process.overall || {};

    const currentFlowRate = feedWater.flowRate || overall.flowRate || engineering.flowRate;

    return (
        <div className="panel pid-panel cad-section" style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "14px 16px", width: "100%", minHeight: "480px", boxSizing: "border-box", display: "flex", flexDirection: "column", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            {/* Header & Sub-Tabs Switcher */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: "12.5px", fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Process Flow &amp; P&amp;ID Workspace
                    </h3>

                    {/* Highlighted Tab Buttons */}
                    <div style={{
                        display: "flex",
                        background: "#F1F5F9",
                        padding: "2px",
                        borderRadius: "4px",
                        border: "1px solid #CBD5E1"
                    }}>
                        <button
                            onClick={() => setViewMode("PID")}
                            style={{
                                background: viewMode === "PID" ? "#2563EB" : "transparent",
                                color: viewMode === "PID" ? "#FFFFFF" : "#64748B",
                                border: "none",
                                padding: "4px 12px",
                                borderRadius: "3px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            Industrial P&amp;ID
                        </button>
                        <button
                            onClick={() => setViewMode("DYNAMIC_STRUCTURE")}
                            style={{
                                background: viewMode === "DYNAMIC_STRUCTURE" ? "#2563EB" : "transparent",
                                color: viewMode === "DYNAMIC_STRUCTURE" ? "#FFFFFF" : "#64748B",
                                border: "none",
                                padding: "4px 12px",
                                borderRadius: "3px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            Dynamic Flow
                        </button>
                        <button
                            onClick={() => setViewMode("3D_CAD")}
                            style={{
                                background: viewMode === "3D_CAD" ? "#2563EB" : "transparent",
                                color: viewMode === "3D_CAD" ? "#FFFFFF" : "#64748B",
                                border: "none",
                                padding: "4px 12px",
                                borderRadius: "3px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            3D Stack Geometry
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

            {/* TAB 1: PARAMETRIC 3D CAD VISUALIZATION */}
            {viewMode === "3D_CAD" && (
                <CAD3DStackViewer technology={activeTech} />
            )}
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
                <div
                    className="pid-svg-container"
                    style={{
                        background: "#FAFAFA",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        padding: "12px",
                        width: "100%",
                        minHeight: "420px",
                        height: "420px",
                        boxSizing: "border-box",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    <svg
                        viewBox={viewBoxStr}
                        style={{
                            width: "100%",
                            height: "100%",
                            maxHeight: "395px",
                            display: "block"
                        }}
                        preserveAspectRatio="xMidYMid meet"
                    >
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
                                const isProduct = eq.id === "PROD_TANK" || eq.id === "TK102" || eq.id === "TK103";
                                const isIntermediate = eq.id === "INT_TANK";
                                const isBrine = eq.id === "TK103_BRINE" || eq.id === "TK104" || eq.id === "TK201_SLURRY";
                                const tankTDS = isProduct 
                                    ? (overall.outletTDS || engineering.outletTDS || 500)
                                    : (isIntermediate ? (stage1Data?.outletTDS || 1913) : (isBrine ? (engineering.concentrateTds || (feedWater.tds * 5)) : feedWater.tds));
                                const tankFlow = isProduct
                                    ? (engineering.productFlow !== undefined ? Number(engineering.productFlow).toFixed(2) : (Number(currentFlowRate) * 0.9).toFixed(2))
                                    : (isBrine ? (engineering.rejectFlow !== undefined ? Number(engineering.rejectFlow).toFixed(2) : (Number(currentFlowRate) * 0.1).toFixed(2)) : Number(currentFlowRate).toFixed(2));
                                
                                const maxChars = Math.floor((eq.width - 16) / 6.5);
                                const displayName = eq.name && eq.name.length > maxChars ? eq.name.slice(0, maxChars - 1) + "…" : eq.name;

                                return (
                                    <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                        setSelectedEquipment && setSelectedEquipment({
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
                                            dimensions: `${eq.width || 140} × ${eq.height || 120} mm`
                                        });
                                    }}>
                                        <rect
                                            x={eq.x}
                                            y={eq.y}
                                            width={eq.width}
                                            height={eq.height}
                                            fill={isProduct ? "#F0FDF4" : (isIntermediate ? "#FEF3C7" : (isBrine ? "#FFF7ED" : "#EFF6FF"))}
                                            stroke={isProduct ? "#16A34A" : (isIntermediate ? "#D97706" : (isBrine ? "#EA580C" : "#2563EB"))}
                                            strokeWidth="2"
                                            rx="6"
                                        />
                                        <text x={eq.x + 8} y={eq.y + 20} fontWeight="700" fontSize="10.5" fill="#1F2937">{displayName}</text>
                                        <text x={eq.x + 8} y={eq.y + 40} fontSize="10" fill="#4B5563">TDS: {tankTDS} mg/L</text>
                                        <text x={eq.x + 8} y={eq.y + 58} fontSize="10" fill="#4B5563">Flow: {tankFlow} L/min</text>
                                    </g>
                                );
                            }

                            if (eq.type === "pump") {
                                const isSlurry = eq.id === "SPUMP" || eq.id === "P201_SLURRY";
                                return (
                                    <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                        setSelectedEquipment && setSelectedEquipment({
                                            tag: isSlurry ? "SP-101" : (eq.id || "P-101"),
                                            name: isSlurry ? "Slurry Circulation Pump" : (eq.name || "Feed Water Pump"),
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
                                        <text x={eq.x} y={eq.y + 3.5} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1F2937">
                                            {isSlurry ? "SPUMP" : "PUMP"}
                                        </text>
                                    </g>
                                );
                            }

                            if (eq.type === "valve") {
                                const vx = eq.x;
                                const vy = eq.y;
                                const vw = eq.width || 36;
                                const vh = eq.height || 36;
                                const midX = vx + vw / 2;
                                const midY = vy + vh / 2;
                                return (
                                    <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                        setSelectedEquipment && setSelectedEquipment({
                                            tag: eq.id || "V-101",
                                            name: eq.name || "4-Way Process Valve",
                                            type: "Automated Reversal / Divert Valve",
                                            operatingPressure: "1.0 bar",
                                            dimensions: `${vw} × ${vh} mm`
                                        });
                                    }}>
                                        {/* Valve Bowtie Shape */}
                                        <polygon
                                            points={`${vx},${vy + 6} ${midX},${midY} ${vx},${vy + vh - 6}`}
                                            fill="#F8FAFC"
                                            stroke="#475569"
                                            strokeWidth="2"
                                        />
                                        <polygon
                                            points={`${vx + vw},${vy + 6} ${midX},${midY} ${vx + vw},${vy + vh - 6}`}
                                            fill="#F8FAFC"
                                            stroke="#475569"
                                            strokeWidth="2"
                                        />
                                        {/* Actuator stem & circle */}
                                        <line x1={midX} y1={midY} x2={midX} y2={vy} stroke="#475569" strokeWidth="2" />
                                        <circle cx={midX} cy={vy} r="4" fill="#0284C7" stroke="#0369A1" strokeWidth="1" />
                                        <text x={midX} y={vy + vh + 10} fontSize="8.5" fontWeight="700" fill="#334155" textAnchor="middle">
                                            {eq.id || "VALVE"}
                                        </text>
                                    </g>
                                );
                            }

                            if (eq.type === "filter") {
                                return (
                                    <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                        setSelectedEquipment && setSelectedEquipment({
                                            tag: eq.id || "F-101",
                                            name: eq.name || "Pre-Filter F-101",
                                            type: "Multimedia Cartridge Filter",
                                            material: "Polypropylene Housing / 5µm Cartridge",
                                            operatingPressure: "0.35 bar",
                                            dimensions: `${eq.width} × ${eq.height} mm`
                                        });
                                    }}>
                                        <rect x={eq.x} y={eq.y} width={eq.width} height={eq.height} fill="#F8FAFC" stroke="#0284C7" strokeWidth="2" rx="4" />
                                        <polygon points={`${eq.x + 10},${eq.y + 10} ${eq.x + eq.width - 10},${eq.y + 10} ${eq.x + eq.width / 2},${eq.y + eq.height - 18}`} fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
                                        <text x={eq.x + eq.width / 2} y={eq.y + eq.height - 6} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#0369A1">{eq.name || "Pre-Filter"}</text>
                                    </g>
                                );
                            }

                            if (eq.type === "ro_skid") {
                                return (
                                    <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                        setSelectedEquipment && setSelectedEquipment({
                                            tag: eq.id || "RO-101",
                                            name: eq.name || "RO Pretreatment Skid RO-101",
                                            type: "Reverse Osmosis Skid Unit",
                                            material: "Polyamide Thin-Film Composite / FRP Pressure Vessels",
                                            operatingPressure: "12.5 bar",
                                            dimensions: `${eq.width} × ${eq.height} mm`
                                        });
                                    }}>
                                        <rect x={eq.x} y={eq.y} width={eq.width} height={eq.height} fill="#F0FDF4" stroke="#16A34A" strokeWidth="2" rx="6" />
                                        <line x1={eq.x + 8} y1={eq.y + 25} x2={eq.x + eq.width - 8} y2={eq.y + 25} stroke="#16A34A" strokeWidth="3" />
                                        <line x1={eq.x + 8} y1={eq.y + 45} x2={eq.x + eq.width - 8} y2={eq.y + 45} stroke="#16A34A" strokeWidth="3" />
                                        <text x={eq.x + eq.width / 2} y={eq.y + eq.height - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#15803D">RO Skid</text>
                                    </g>
                                );
                            }

                            if (eq.type === "reactor") {
                                const s1Eng = stage1Data?.engineering || stage1Data || {};
                                const actVoltage = Number(s1Eng.voltageStack || s1Eng.voltage || engineering.voltageStack || engineering.voltage || 47.6);
                                const actCurrent = Number(s1Eng.current || engineering.current || 0.40);
                                const actModules = Number(s1Eng.numberOfModules || engineering.numberOfModules || engineering.modules || 1);
                                const actCurrentDensity = Number(s1Eng.currentDensity || engineering.currentDensity || 14.5);
                                const displayVolt = `${actVoltage.toFixed(1)} V DC`;
                                const displayCurr = actModules > 1 ? `${(actCurrent * actModules).toFixed(1)} A (${actModules}×${actCurrent.toFixed(1)}A)` : `${actCurrent.toFixed(2)} A`;
                                const displayDensity = `${actCurrentDensity.toFixed(1)} A/m²`;

                                const maxChars = Math.floor((eq.width - 20) / 7.2);
                                const rawName = eq.name || (activeTech + " Reactor");
                                const displayName = rawName.length > maxChars ? rawName.slice(0, maxChars - 1) + "…" : rawName;

                                return (
                                    <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                        setSelectedEquipment && setSelectedEquipment({
                                            tag: "R-101",
                                            name: eq.name || (activeTech + " Desalination Reactor Stack"),
                                            type: activeTech + " Module Stack",
                                            voltage: `${actVoltage.toFixed(1)} V DC`,
                                            current: displayCurr,
                                            currentDensity: displayDensity,
                                            chargeEfficiency: (engineering.chargeEfficiency || 88.0) + "%",
                                            material: "PVDF Housing / Porous Carbon Flow-Electrodes",
                                            designStandard: "IEC 61140 / ISO 10628",
                                            operatingPressure: "1.0 bar",
                                            dimensions: `${eq.width || 170} × ${eq.height || 120} mm`
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
                                        <text x={eq.x + 10} y={eq.y + 20} fontWeight="700" fontSize="11" fill="#2563EB">{displayName}</text>
                                        <text x={eq.x + 10} y={eq.y + 39} fontSize="10" fill="#1F2937">Voltage: {displayVolt}</text>
                                        <text x={eq.x + 10} y={eq.y + 57} fontSize="10" fill="#1F2937">Current: {displayCurr}</text>
                                        <text x={eq.x + 10} y={eq.y + 75} fontSize="10" fill="#1F2937">Outlet: {stage1Data?.outletTDS || s1Eng.outletTDS || engineering.outletTDS || 500} ppm</text>
                                        <text x={eq.x + 10} y={eq.y + 93} fontSize="9.5" fill="#6B7280">Cell Pairs: {s1Eng.cellPairs || engineering.cellPairs || 510} ({engineering.numberOfModules || 15} mods)</text>
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