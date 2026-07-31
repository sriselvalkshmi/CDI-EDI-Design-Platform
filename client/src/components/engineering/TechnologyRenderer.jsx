import React, { useState, useEffect, useMemo } from "react";
import generateStructure from "../../engineering/structureGenerator";
import CDISchematic from "./CDISchematic";
import MCDISchematic from "./MCDISchematic";
import FCDISchematic from "./FCDISchematic";
import EDISchematic from "./EDISchematic";
import MultiStageSchematic from "./MultiStageSchematic";
import EngineeringBOM from "./EngineeringBOM";
import EquipmentInspectorModal from "./EquipmentInspectorModal";
import TechComparisonModal from "./TechComparisonModal";
import { BarChart2, Layers, GitMerge } from "lucide-react";

/**
 * TechnologyRenderer
 * Master technology renderer delegating schematics dynamically to CDISchematic,
 * MCDISchematic, FCDISchematic, EDISchematic, or MultiStageSchematic.
 * Includes automated Engineering Bill of Materials (BOM) schedule.
 */
export default function TechnologyRenderer({
    technology = "CDI",
    engineering = {},
    optimization = {},
    sizing = {},
    feedWater = {},
    simulation = {}
}) {
    const [hoverSpec, setHoverSpec] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [forceMultiStage, setForceMultiStage] = useState(false);
    const [particleOffset, setParticleOffset] = useState(0);

    // Particle Animation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setParticleOffset(prev => (prev + 2) % 100);
        }, 40);
        return () => clearInterval(interval);
    }, []);

    // Generate Dynamic Structural Model
    const structure = useMemo(() => {
        return generateStructure({
            technology,
            engineering,
            optimization,
            sizing,
            feedWater,
            simulation
        });
    }, [technology, engineering, optimization, sizing, feedWater, simulation]);

    const {
        technology: activeTech,
        labels,
        geometry,
        electrical,
        equipment
    } = structure;

    // Detect if Multi-Stage system is required (e.g. Feed TDS > 2000 ppm and Target TDS < 100 ppm)
    const isMultiStageRequired = forceMultiStage || (feedWater.tds > 2000 && (engineering.outletTDS || 50) < 100);

    const handleHover = (spec, e) => {
        if (!spec) {
            setHoverSpec(null);
            return;
        }
        setHoverSpec(spec);
        if (e && e.clientX && e.clientY) {
            setTooltipPos({ x: e.clientX + 14, y: e.clientY + 14 });
        }
    };

    return (
        <div className="technology-renderer-container" style={{
            position: "relative",
            width: "100%",
            background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
            borderRadius: "14px",
            border: "1px solid #CBD5E1",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
            padding: "18px",
            boxSizing: "border-box"
        }}>
            {/* Top Bar with Mode Toggles */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                flexWrap: "wrap",
                gap: "10px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {isMultiStageRequired && (
                        <button
                            onClick={() => setForceMultiStage(!forceMultiStage)}
                            style={{
                                background: "#4F46E5",
                                color: "#FFFFFF",
                                border: "1px solid #CBD5E1",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                fontWeight: "700",
                                fontSize: "12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.2s"
                            }}
                        >
                            <GitMerge size={15} /> Sequential Multi-Stage Active (FCDI → EDI)
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Technology Comparison Button */}
                    <button
                        onClick={() => setIsCompareOpen(true)}
                        style={{
                            background: "#1E293B",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <BarChart2 size={15} /> Compare CDI / MCDI / FCDI / EDI
                    </button>
                </div>
            </div>

            {/* Overlaid Engineering Parameter Labels Bar */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "8px",
                marginBottom: "16px",
                background: "#F1F5F9",
                borderRadius: "10px",
                padding: "10px 14px",
                border: "1px solid #E2E8F0"
            }}>
                <div style={{ fontSize: "11px" }}>
                    <span style={{ color: "#64748B", display: "block" }}>Electrode Area</span>
                    <strong style={{ color: "#1F2937", fontSize: "12.5px" }}>{labels.electrodeArea}</strong>
                </div>
                <div style={{ fontSize: "11px" }}>
                    <span style={{ color: "#64748B", display: "block" }}>Cell Pairs</span>
                    <strong style={{ color: "#1F2937", fontSize: "12.5px" }}>{labels.cellPairs}</strong>
                </div>
                <div style={{ fontSize: "11px" }}>
                    <span style={{ color: "#64748B", display: "block" }}>Voltage / Current</span>
                    <strong style={{ color: "#2563EB", fontSize: "12.5px" }}>{labels.voltage} / {labels.current}</strong>
                </div>
                <div style={{ fontSize: "11px" }}>
                    <span style={{ color: "#64748B", display: "block" }}>Flow / Pressure</span>
                    <strong style={{ color: "#0284C7", fontSize: "12.5px" }}>{labels.flowRate} ({labels.pressure})</strong>
                </div>
                <div style={{ fontSize: "11px" }}>
                    <span style={{ color: "#64748B", display: "block" }}>Removal / Recovery</span>
                    <strong style={{ color: "#16A34A", fontSize: "12.5px" }}>{labels.removalEfficiency} / {labels.waterRecovery}</strong>
                </div>
                <div style={{ fontSize: "11px" }}>
                    <span style={{ color: "#64748B", display: "block" }}>{technology === "EDI" ? "Current Eff / SEC" : "SAC / SEC"}</span>
                    <strong style={{ color: "#7C3AED", fontSize: "12.5px" }}>{technology === "EDI" ? (labels.currentEfficiency || labels.chargeEfficiency || "98.0 %") : labels.sac} / {labels.sec}</strong>
                </div>
            </div>

            {/* DYNAMIC SCHEMATIC SVG CANVAS */}
            <div className="svg-canvas-wrapper" style={{
                background: "#FAFAFA",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                position: "relative",
                overflowX: "auto"
            }}>
                <svg width="1060" height="410" viewBox="0 0 1060 410" style={{ width: "100%", height: "auto", minWidth: "980px" }}>
                    {/* CAD Grid Pattern */}
                    <g opacity="0.15">
                        <pattern id="cadGridTech" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748B" strokeWidth="0.5" />
                        </pattern>
                        <rect width="1060" height="410" fill="url(#cadGridTech)" />
                    </g>

                    {/* Render MultiStage or Single Tech Schematic */}
                    {isMultiStageRequired ? (
                        <MultiStageSchematic
                            geometry={geometry}
                            electrical={electrical}
                            labels={labels}
                            feedWater={feedWater}
                            engineering={engineering}
                            particleOffset={particleOffset}
                            onHover={handleHover}
                        />
                    ) : (
                        <>
                            {activeTech === "CDI" && (
                                <CDISchematic
                                    geometry={geometry}
                                    electrical={electrical}
                                    labels={labels}
                                    feedWater={feedWater}
                                    engineering={engineering}
                                    particleOffset={particleOffset}
                                    onHover={handleHover}
                                />
                            )}
                            {activeTech === "MCDI" && (
                                <MCDISchematic
                                    geometry={geometry}
                                    electrical={electrical}
                                    labels={labels}
                                    feedWater={feedWater}
                                    engineering={engineering}
                                    optimization={optimization}
                                    particleOffset={particleOffset}
                                    onHover={handleHover}
                                />
                            )}
                            {activeTech === "FCDI" && (
                                <FCDISchematic
                                    geometry={geometry}
                                    electrical={electrical}
                                    labels={labels}
                                    feedWater={feedWater}
                                    engineering={engineering}
                                    particleOffset={particleOffset}
                                    onHover={handleHover}
                                />
                            )}
                            {activeTech === "EDI" && (
                                <EDISchematic
                                    geometry={geometry}
                                    electrical={electrical}
                                    labels={labels}
                                    feedWater={feedWater}
                                    engineering={engineering}
                                    particleOffset={particleOffset}
                                    onHover={handleHover}
                                />
                            )}
                        </>
                    )}
                </svg>
            </div>

            {/* AUTOMATED ENGINEERING BILL OF MATERIALS (BOM) */}
            <EngineeringBOM
                technology={activeTech}
                labels={labels}
                feedWater={feedWater}
                engineering={engineering}
                optimization={optimization}
            />

            {/* Hover Specs Tooltip */}
            {hoverSpec && (
                <div style={{
                    position: "fixed",
                    left: `${tooltipPos.x}px`,
                    top: `${tooltipPos.y}px`,
                    background: "#0F172A",
                    color: "#FFFFFF",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                    fontSize: "11.5px",
                    zIndex: 99999,
                    pointerEvents: "none",
                    border: "1px solid #334155"
                }}>
                    <strong style={{ color: "#38BDF8", fontSize: "12px", display: "block", marginBottom: "4px" }}>
                        {hoverSpec.name || hoverSpec.tag}
                    </strong>
                    {Object.entries(hoverSpec).map(([k, v]) => {
                        if (k === "name") return null;
                        return (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "12px", margin: "2px 0" }}>
                                <span style={{ color: "#94A3B8", textTransform: "capitalize" }}>{k}:</span>
                                <span style={{ fontWeight: "700", color: "#F8FAFC" }}>{v}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <EquipmentInspectorModal
                equipment={selectedEquipment}
                onClose={() => setSelectedEquipment(null)}
            />
            <TechComparisonModal
                isOpen={isCompareOpen}
                onClose={() => setIsCompareOpen(false)}
                currentTech={activeTech}
                engineering={engineering}
            />
        </div>
    );
}
