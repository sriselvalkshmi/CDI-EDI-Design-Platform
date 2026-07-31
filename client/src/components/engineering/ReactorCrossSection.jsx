import React from "react";

/**
 * ReactorCrossSection
 * Renders microscopic physical cross-section details for CDI, MCDI, FCDI, and EDI.
 */
export default function ReactorCrossSection({
    technology = "CDI",
    cellPairs = 36,
    electrodeArea = 250,
    electrodeThickness = 0.6,
    spacerThickness = 0.5,
    membraneThickness = 0.15,
    voltage = 1.2,
    currentDensity = 150,
    particleOffset = 0
}) {
    const isCDI = technology === "CDI";
    const isMCDI = technology === "MCDI";
    const isFCDI = technology === "FCDI";
    const isEDI = technology === "EDI";

    return (
        <div className="reactor-cross-section-container" style={{
            background: "#0F172A",
            color: "#FFFFFF",
            borderRadius: "12px",
            padding: "16px",
            marginTop: "16px",
            border: "1px solid #334155",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                        background: "#2563EB",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontWeight: "800",
                        fontSize: "11px"
                    }}>
                        MICROSCOPIC CROSS-SECTION
                    </span>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#F8FAFC" }}>
                        {technology} Internal Physical Cell Structure
                    </h4>
                </div>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    Area: {electrodeArea} cm² | Cell Pairs: {cellPairs} | Voltage: {voltage}V
                </span>
            </div>

            <div style={{ background: "#1E293B", borderRadius: "8px", padding: "12px", overflowX: "auto" }}>
                <svg width="900" height="240" viewBox="0 0 900 240" style={{ width: "100%", height: "auto" }}>
                    {/* Background Grid */}
                    <g opacity="0.1">
                        <pattern id="crossGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="20" y2="0" stroke="#FFFFFF" strokeWidth="0.5" />
                            <line x1="0" y1="0" x2="0" y2="20" stroke="#FFFFFF" strokeWidth="0.5" />
                        </pattern>
                        <rect width="900" height="240" fill="url(#crossGrid)" />
                    </g>

                    {/* ===================================================================== */}
                    {/* 1. CDI CROSS-SECTION (NO MEMBRANES)                                  */}
                    {/* ===================================================================== */}
                    {isCDI && (
                        <g id="cdi_cross_section">
                            {/* Positive Carbon Anode Plate */}
                            <rect x="60" y="30" width="780" height="35" fill="#334155" stroke="#EF4444" strokeWidth="2" rx="4" />
                            <text x="70" y="52" fill="#EF4444" fontWeight="800" fontSize="12">ANODE (+): Activated Carbon Porous Electrode</text>

                            {/* Porous Carbon Pores */}
                            {Array.from({ length: 18 }).map((_, i) => (
                                <circle key={i} cx={100 + i * 42} cy="48" r="6" fill="#1E293B" stroke="#64748B" strokeWidth="1" />
                            ))}

                            {/* Central Open Water Flow Spacer Channel */}
                            <rect x="60" y="75" width="780" height="90" fill="#0F172A" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="6,3" rx="4" />
                            <text x="450" y="125" textAnchor="middle" fill="#38BDF8" fontWeight="800" fontSize="13">
                                OPEN FLOW SPACER CHANNEL (Desalination Stream)
                            </text>

                            {/* Adsorbed Ions onto Carbon Pores */}
                            <g className="adsorbed-ions">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <g key={i}>
                                        {/* Cl- Adsorbed to Anode */}
                                        <circle cx={90 + i * 60} cy="70" r="5" fill="#EF4444" />
                                        <text x={90 + i * 60} y="73.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="900">Cl-</text>

                                        {/* Na+ Adsorbed to Cathode */}
                                        <circle cx={90 + i * 60} cy="170" r="5" fill="#3B82F6" />
                                        <text x={90 + i * 60} y={173.5} textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="900">Na+</text>
                                    </g>
                                ))}
                            </g>

                            {/* Negative Carbon Cathode Plate */}
                            <rect x="60" y="175" width="780" height="35" fill="#334155" stroke="#2563EB" strokeWidth="2" rx="4" />
                            <text x="70" y="197" fill="#60A5FA" fontWeight="800" fontSize="12">CATHODE (-): Activated Carbon Porous Electrode</text>
                        </g>
                    )}

                    {/* ===================================================================== */}
                    {/* 2. MCDI CROSS-SECTION (SHOWING CEM & AEM MEMBRANES)                 */}
                    {/* ===================================================================== */}
                    {isMCDI && (
                        <g id="mcdi_cross_section">
                            {/* Anode Plate */}
                            <rect x="60" y="20" width="780" height="28" fill="#334155" stroke="#EF4444" strokeWidth="2" rx="3" />
                            <text x="70" y="38" fill="#EF4444" fontWeight="800" fontSize="11">ANODE (+)</text>

                            {/* Anion Exchange Membrane (AEM) */}
                            <rect x="60" y="52" width="780" height="18" fill="#F59E0B" rx="2" />
                            <text x="450" y="65" textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="10">
                                ANION EXCHANGE MEMBRANE (AEM) — Blocks Co-ion Repulsion
                            </text>

                            {/* Water Channel */}
                            <rect x="60" y="74" width="780" height="92" fill="#0F172A" stroke="#0284C7" strokeWidth="1" rx="4" />

                            {/* Cation Exchange Membrane (CEM) */}
                            <rect x="60" y="170" width="780" height="18" fill="#10B981" rx="2" />
                            <text x="450" y="183" textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="10">
                                CATION EXCHANGE MEMBRANE (CEM) — Blocks Co-ion Repulsion
                            </text>

                            {/* Cathode Plate */}
                            <rect x="60" y="192" width="780" height="28" fill="#334155" stroke="#2563EB" strokeWidth="2" rx="3" />
                            <text x="70" y="210" fill="#60A5FA" fontWeight="800" fontSize="11">CATHODE (-)</text>
                        </g>
                    )}

                    {/* ===================================================================== */}
                    {/* 3. FCDI CROSS-SECTION (FLOWING CARBON SLURRY PARTICLES)              */}
                    {/* ===================================================================== */}
                    {isFCDI && (
                        <g id="fcdi_cross_section">
                            {/* Flowing Anode Slurry Channel */}
                            <rect x="60" y="20" width="780" height="40" fill="#312E81" stroke="#4338CA" strokeWidth="2" rx="4" />
                            <text x="70" y="44" fill="#C7D2FE" fontWeight="800" fontSize="12">FLOWING ANODE CARBON SLURRY CHANNEL (Circulating Loop A)</text>
                            {/* Carbon Particles moving */}
                            {Array.from({ length: 20 }).map((_, i) => (
                                <circle key={i} cx={80 + (i * 38 + particleOffset * 2) % 740} cy="40" r="5" fill="#6366F1" />
                            ))}

                            {/* AEM Membrane */}
                            <rect x="60" y="64" width="780" height="12" fill="#F59E0B" rx="1" />

                            {/* Central Water Channel */}
                            <rect x="60" y="80" width="780" height="80" fill="#0F172A" stroke="#3B82F6" strokeWidth="1.5" rx="4" />
                            <text x="450" y="125" textAnchor="middle" fill="#60A5FA" fontWeight="800" fontSize="12">CENTRAL DESALINATION WATER STREAM</text>

                            {/* CEM Membrane */}
                            <rect x="60" y="164" width="780" height="12" fill="#10B981" rx="1" />

                            {/* Flowing Cathode Slurry Channel */}
                            <rect x="60" y="180" width="780" height="40" fill="#1E3A8A" stroke="#1E40AF" strokeWidth="2" rx="4" />
                            <text x="70" y="204" fill="#93C5FD" fontWeight="800" fontSize="12">FLOWING CATHODE CARBON SLURRY CHANNEL (Circulating Loop B)</text>
                            {/* Carbon Particles moving */}
                            {Array.from({ length: 20 }).map((_, i) => (
                                <circle key={i} cx={80 + (i * 38 + particleOffset * 2) % 740} cy="200" r="5" fill="#3B82F6" />
                            ))}
                        </g>
                    )}

                    {/* ===================================================================== */}
                    {/* 4. EDI CROSS-SECTION (MIXED RESIN BEADS & REGENERATION)              */}
                    {/* ===================================================================== */}
                    {isEDI && (
                        <g id="edi_cross_section">
                            {/* Anode Terminal */}
                            <rect x="60" y="20" width="780" height="25" fill="#DC2626" rx="3" />
                            <text x="70" y="37" fill="#FFFFFF" fontWeight="800" fontSize="11">ANODE TERMINAL (+): Titanium MMO-Coated Electrode (Grade 2 Titanium)</text>

                            {/* CEM Membrane */}
                            <rect x="60" y="48" width="780" height="12" fill="#10B981" rx="1" />

                            {/* Mixed-Bed Resin Chamber */}
                            <rect x="60" y="64" width="780" height="112" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" rx="4" />
                            <text x="450" y="82" textAnchor="middle" fill="#92400E" fontWeight="800" fontSize="11">MIXED-BED ION EXCHANGE RESIN CHAMBER (Strong Acid Cation &amp; Strong Base Anion)</text>

                            {/* Cation & Anion Resin Beads */}
                            {Array.from({ length: 48 }).map((_, bIdx) => {
                                const bx = 80 + (bIdx % 16) * 46;
                                const by = 100 + Math.floor(bIdx / 16) * 26;
                                const isCation = bIdx % 2 === 0;

                                return (
                                    <circle
                                        key={bIdx}
                                        cx={bx}
                                        cy={by}
                                        r="6"
                                        fill={isCation ? "#3B82F6" : "#F59E0B"}
                                        stroke={isCation ? "#1D4ED8" : "#D97706"}
                                        strokeWidth="1"
                                    />
                                );
                            })}

                            {/* AEM Membrane */}
                            <rect x="60" y="180" width="780" height="12" fill="#F59E0B" rx="1" />

                            {/* Cathode Terminal */}
                            <rect x="60" y="195" width="780" height="25" fill="#2563EB" rx="3" />
                            <text x="70" y="212" fill="#FFFFFF" fontWeight="800" fontSize="11">CATHODE TERMINAL (-): Titanium MMO-Coated Electrode (Grade 2 Titanium)</text>
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
}
