import React, { useState } from "react";
import { useApp } from "../../context/AppContext";

export default function CAD3DStackViewer() {
    const { designResult, technology } = useApp();

    const [rotX, setRotX] = useState(25);
    const [rotY, setRotY] = useState(-35);
    const [zoom, setZoom] = useState(100);
    const [isExploded, setIsExploded] = useState(false);
    const [activeComponent, setActiveComponent] = useState(null);

    const eng = designResult?.engineering || {};
    const tech = technology || eng.technology || "MCDI";
    
    // Dynamic 3D Dimensions driven by engineering parameters
    const totalCellPairs = Number(eng.cellPairs || 36);
    const visualCellPairs = Math.max(4, Math.min(24, Math.ceil(totalCellPairs / 4))); // Dynamic visible pairs
    const areaScale = Math.max(0.7, Math.min(1.4, (Number(eng.electrodeArea || 250) / 250))); // Dynamic plate area scale

    const handleExportCAD = (format) => {
        const text = `HEADER;\nCAD MODEL: ${tech} DESALINATION STACK\nCELL PAIRS: ${totalCellPairs}\nELECTRODE AREA: ${eng.electrodeArea || 250} CM2\nFORMAT: ${format}\nENDSEC;\n`;
        const blob = new Blob([text], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${tech}_Stack_Model.${format.toLowerCase()}`;
        link.click();
    };

    return (
        <div className="cad-3d-wrapper" style={{
            background: "#0F172A",
            borderRadius: "8px",
            padding: "16px",
            color: "#F8FAFC",
            border: "1px solid #334155"
        }}>
            {/* CAD Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #334155", paddingBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#38BDF8" }}>
                        3D Isometric CAD Stack Viewer ({tech} Reactor)
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#94A3B8" }}>
                        Cell Pairs: {totalCellPairs} | Electrode Area: {eng.electrodeArea || 250} cm² | Stack Height: {(totalCellPairs * 0.85).toFixed(0)} mm
                    </div>
                </div>

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                        onClick={() => setIsExploded(!isExploded)}
                        style={{
                            background: isExploded ? "#2563EB" : "#1E293B",
                            color: "#FFFFFF",
                            border: "1px solid #3B82F6",
                            borderRadius: "4px",
                            padding: "4px 10px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            cursor: "pointer"
                        }}
                    >
                        {isExploded ? "Collapse Stack" : "Explode Assembly View"}
                    </button>

                    <button
                        onClick={() => { setRotX(25); setRotY(-35); setZoom(100); }}
                        style={{
                            background: "#1E293B",
                            color: "#94A3B8",
                            border: "1px solid #475569",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            fontSize: "11.5px",
                            cursor: "pointer"
                        }}
                    >
                        Reset Camera
                    </button>

                    <button
                        onClick={() => handleExportCAD("STEP")}
                        style={{
                            background: "#16A34A",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 10px",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            cursor: "pointer"
                        }}
                    >
                        Export STEP / STL
                    </button>
                </div>
            </div>

            {/* Viewport & Controls Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "12px" }}>
                {/* 3D SVG Isometric Viewport */}
                <div style={{
                    background: "#020617",
                    border: "1px solid #1E293B",
                    borderRadius: "6px",
                    position: "relative",
                    overflow: "hidden",
                    height: "360px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <svg
                        width="100%"
                        height="360"
                        viewBox="-250 -180 500 360"
                        style={{ transform: `scale(${zoom / 100})`, transition: "transform 0.15s ease" }}
                    >
                        <defs>
                            <linearGradient id="anodeGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#DC2626" />
                                <stop offset="100%" stopColor="#991B1B" />
                            </linearGradient>
                            <linearGradient id="cathodeGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#2563EB" />
                                <stop offset="100%" stopColor="#1E3A8A" />
                            </linearGradient>
                            <linearGradient id="aemGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.5" />
                            </linearGradient>
                            <linearGradient id="cemGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#D97706" stopOpacity="0.5" />
                            </linearGradient>
                            <linearGradient id="spacerGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#047857" stopOpacity="0.3" />
                            </linearGradient>
                        </defs>

                        <g transform={`rotate(${rotX}) rotate(${rotY} 0 0) scale(${areaScale})`}>
                            {/* Endplates */}
                            <path d="M -120 -80 L 80 -80 L 120 -30 L -80 -30 Z" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
                            <path d="M 80 -80 L 80 80 L 120 130 L 120 -30 Z" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />

                            {/* Anode Terminal (+) */}
                            <g transform={`translate(0, ${isExploded ? -70 : -35})`} onClick={() => setActiveComponent("Anode Collector")}>
                                <path d="M -100 -50 L 60 -50 L 90 -15 L -70 -15 Z" fill="url(#anodeGrad)" stroke="#EF4444" strokeWidth="1.5" />
                                <text x="-20" y="-30" fill="#FFFFFF" fontSize="10" fontWeight="700">Anode Terminal (+V)</text>
                            </g>

                            {/* Dynamic Stack Layer Cell Pairs */}
                            {Array.from({ length: visualCellPairs }).map((_, idx) => {
                                const offset = isExploded ? idx * 22 - 40 : idx * 6 - (visualCellPairs * 3);
                                return (
                                    <g key={idx} transform={`translate(0, ${offset})`} style={{ cursor: "pointer" }} onClick={() => setActiveComponent(`Cell Pair #${idx + 1}`)}>
                                        {/* AEM Membrane (MCDI/FCDI/EDI) */}
                                        {tech !== "CDI" && (
                                            <path d="M -95 -40 L 55 -40 L 82 -10 L -68 -10 Z" fill="url(#aemGrad)" stroke="#0284C7" strokeWidth="0.8" />
                                        )}
                                        {/* Flow Spacer / Slurry Channel / Resin Chamber */}
                                        <path d="M -93 -38 L 53 -38 L 80 -8 L -66 -8 Z" fill="url(#spacerGrad)" stroke="#059669" strokeWidth="0.8" />
                                        {/* CEM Membrane (MCDI/FCDI/EDI) */}
                                        {tech !== "CDI" && (
                                            <path d="M -91 -36 L 51 -36 L 78 -6 L -64 -6 Z" fill="url(#cemGrad)" stroke="#D97706" strokeWidth="0.8" />
                                        )}
                                    </g>
                                );
                            })}

                            {/* Cathode Terminal (-) */}
                            <g transform={`translate(0, ${isExploded ? 90 : (visualCellPairs * 6)})`} onClick={() => setActiveComponent("Cathode Collector")}>
                                <path d="M -100 20 L 60 20 L 90 55 L -70 55 Z" fill="url(#cathodeGrad)" stroke="#3B82F6" strokeWidth="1.5" />
                                <text x="-20" y="40" fill="#FFFFFF" fontSize="10" fontWeight="700">Cathode Terminal (-V)</text>
                            </g>

                            {/* Dynamic Manifolds for FCDI / EDI / CDI / MCDI */}
                            <line x1="-110" y1="-70" x2="-110" y2="100" stroke="#38BDF8" strokeWidth="4" strokeDasharray="4,2" />
                            <text x="-140" y="20" fill="#38BDF8" fontSize="9" fontWeight="700">{tech === "FCDI" ? "Slurry Feed" : "Feed Inlet"}</text>

                            <line x1="100" y1="-70" x2="100" y2="100" stroke="#4ADE80" strokeWidth="4" strokeDasharray="4,2" />
                            <text x="105" y="20" fill="#4ADE80" fontSize="9" fontWeight="700">{tech === "EDI" ? "Ultra Pure Water" : "Product"}</text>
                        </g>
                    </svg>

                    {/* Active Component Tag */}
                    {activeComponent && (
                        <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(15,23,42,0.9)", border: "1px solid #38BDF8", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", color: "#38BDF8", fontWeight: "700" }}>
                            Selected Component: {activeComponent}
                        </div>
                    )}
                </div>

                {/* 3D Camera Controls & Layer Specs */}
                <div style={{ background: "#020617", border: "1px solid #1E293B", borderRadius: "6px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#38BDF8", borderBottom: "1px solid #1E293B", paddingBottom: "4px" }}>
                        3D Viewport Controls
                    </div>

                    <div>
                        <label style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "2px" }}>Rotation X ({rotX}°)</label>
                        <input
                            type="range"
                            min="-90"
                            max="90"
                            value={rotX}
                            onChange={(e) => setRotX(Number(e.target.value))}
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "2px" }}>Rotation Y ({rotY}°)</label>
                        <input
                            type="range"
                            min="-180"
                            max="180"
                            value={rotY}
                            onChange={(e) => setRotY(Number(e.target.value))}
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "2px" }}>Zoom ({zoom}%)</label>
                        <input
                            type="range"
                            min="50"
                            max="180"
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div style={{ borderTop: "1px solid #1E293B", paddingTop: "8px", fontSize: "11px" }}>
                        <span style={{ color: "#94A3B8", display: "block", fontWeight: "600", marginBottom: "4px" }}>Stack Components:</span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "10.5px" }}>
                            <span style={{ color: "#EF4444" }}>Red: Anode Electrode (+V)</span>
                            <span style={{ color: "#3B82F6" }}>Blue: Cathode Electrode (-V)</span>
                            {tech !== "CDI" && <span style={{ color: "#38BDF8" }}>Cyan: Anion Exchange (AEM)</span>}
                            {tech !== "CDI" && <span style={{ color: "#F59E0B" }}>Yellow: Cation Exchange (CEM)</span>}
                            <span style={{ color: "#10B981" }}>Green: Woven Flow Mesh / Slurry Channel</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
