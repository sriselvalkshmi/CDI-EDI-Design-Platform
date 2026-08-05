import React, { useState, useEffect, useMemo } from "react";
import generateStructure from "../../engineering/structureGenerator";
import TechErrorBoundary from "./TechErrorBoundary";
import CDISchematic from "./CDISchematic";
import MCDISchematic from "./MCDISchematic";
import FCDISchematic from "./FCDISchematic";
import EDISchematic from "./EDISchematic";
import MultiStageSchematic from "./MultiStageSchematic";
import EquipmentInspectorModal from "./EquipmentInspectorModal";
import TechComparisonModal from "./TechComparisonModal";
import { BarChart2, GitMerge, RotateCcw, Activity } from "lucide-react";

/**
 * TechnologyRenderer
 * Master technology renderer delegating schematics dynamically to CDISchematic,
 * MCDISchematic, FCDISchematic, EDISchematic, or MultiStageSchematic.
 * Includes TechErrorBoundary protection.
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
    const [cycleStep, setCycleStep] = useState("ADSORPTION"); // "ADSORPTION" | "REGENERATION"

    // Particle Animation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setParticleOffset(prev => (prev + 2) % 100);
        }, 40);
        return () => clearInterval(interval);
    }, []);

    // Toggle Cycle Step for Batch Electrosorption (CDI / MCDI)
    const toggleCycle = () => {
        setCycleStep(prev => prev === "ADSORPTION" ? "REGENERATION" : "ADSORPTION");
    };

    // Memoize primitive values for stable memoization
    const engVoltage = engineering?.voltage;
    const engCurrent = engineering?.current;
    const engArea = engineering?.electrodeArea;
    const engPairs = engineering?.cellPairs;
    const engFlow = engineering?.flowRate;
    const optVoltage = optimization?.voltage;
    const optCurrent = optimization?.current;
    const optArea = optimization?.electrodeArea;
    const optPairs = optimization?.cellPairs;
    const feedTdsVal = feedWater?.tds;
    const feedFlowVal = feedWater?.flowRate;

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
    }, [
        technology,
        engVoltage,
        engCurrent,
        engArea,
        engPairs,
        engFlow,
        optVoltage,
        optCurrent,
        optArea,
        optPairs,
        feedTdsVal,
        feedFlowVal
    ]);

    const {
        technology: activeTech,
        labels = {},
        geometry = {},
        electrical = {},
        equipment = []
    } = structure || {};

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
        <TechErrorBoundary key={activeTech} onReset={() => setParticleOffset(0)}>
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
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Activity size={18} color="#2563EB" />
                            {activeTech} Engineering Schematic
                        </span>

                        {(activeTech === "CDI" || activeTech === "MCDI") && (
                            <button
                                onClick={toggleCycle}
                                style={{
                                    background: cycleStep === "ADSORPTION" ? "#DCFCE7" : "#FEE2E2",
                                    color: cycleStep === "ADSORPTION" ? "#15803D" : "#B91C1C",
                                    border: `1px solid ${cycleStep === "ADSORPTION" ? "#86EFAC" : "#FCA5A5"}`,
                                    padding: "5px 12px",
                                    borderRadius: "6px",
                                    fontWeight: "700",
                                    fontSize: "11.5px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                <RotateCcw size={14} /> Cycle: {cycleStep === "ADSORPTION" ? "Adsorption (Desalting)" : "Desorption (Regeneration)"}
                            </button>
                        )}

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
                        <strong style={{ color: "#1F2937", fontSize: "12.5px" }}>{labels.electrodeArea || "350 cm²"}</strong>
                    </div>
                    <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "#64748B", display: "block" }}>Cell Pairs</span>
                        <strong style={{ color: "#1F2937", fontSize: "12.5px" }}>{labels.cellPairs || "95 pairs"}</strong>
                    </div>
                    <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "#64748B", display: "block" }}>Voltage / Current</span>
                        <strong style={{ color: "#2563EB", fontSize: "12.5px" }}>{labels.voltage || "1.20 V"} / {labels.current || "15.00 A"}</strong>
                    </div>
                    <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "#64748B", display: "block" }}>Flow / Pressure</span>
                        <strong style={{ color: "#0284C7", fontSize: "12.5px" }}>{labels.flowRate || "10.0 L/min"} ({labels.pressure || "1.00 bar"})</strong>
                    </div>
                    <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "#64748B", display: "block" }}>Removal / Recovery</span>
                        <strong style={{ color: "#16A34A", fontSize: "12.5px" }}>{labels.removalEfficiency || "90.0 %"} / {labels.waterRecovery || "95.0 %"}</strong>
                    </div>
                    <div style={{ fontSize: "11px" }}>
                        <span style={{ color: "#64748B", display: "block" }}>{activeTech === "EDI" ? "Charge Eff / SEC" : "SAC / SEC"}</span>
                        <strong style={{ color: "#7C3AED", fontSize: "12.5px" }}>{activeTech === "EDI" ? (labels.chargeEfficiency || "98.0 %") : (labels.sac || "14.5 mg/g")} / {labels.sec || "0.45 kWh/m³"}</strong>
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
                                        cycleStep={cycleStep}
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
                                        cycleStep={cycleStep}
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
                                    <span style={{ fontWeight: "700", color: "#F8FAFC" }}>{String(v)}</span>
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
                    feedWater={feedWater}
                />
            </div>
        </TechErrorBoundary>
    );
}
