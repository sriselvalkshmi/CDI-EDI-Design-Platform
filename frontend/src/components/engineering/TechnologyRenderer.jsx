import React, { useState, useEffect, useMemo } from "react";
import generateStructure from "@shared/engineering/core/structureGenerator.js";
import TechErrorBoundary from "./TechErrorBoundary";
import CDISchematic from "./CDISchematic";
import MCDISchematic from "./MCDISchematic";
import FCDISchematic from "./FCDISchematic";
import EDISchematic from "./EDISchematic";
import MultiStageSchematic from "./MultiStageSchematic";
import EquipmentInspectorModal from "./EquipmentInspectorModal";

/**
 * TechnologyRenderer
 * Clean, centered CAD Schematic Canvas displaying equipment, tags, vector flow lines,
 * and ion animation without redundant parameter summary bars.
 */
export default function TechnologyRenderer({
    technology = "CDI",
    engineering = {},
    optimization = {},
    sizing = {},
    feedWater = {},
    simulation = {},
    cycleStep = "ADSORPTION"
}) {
    const [hoverSpec, setHoverSpec] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [particleOffset, setParticleOffset] = useState(0);

    // Particle Animation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setParticleOffset(prev => (prev + 2) % 100);
        }, 40);
        return () => clearInterval(interval);
    }, []);

    // Memoize primitive values
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
        electrical = {}
    } = structure || {};

    const isMultiStageRequired = feedWater.tds > 2000 && (engineering.outletTDS || 50) < 100;

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

    const handleEquipmentClick = (spec) => {
        if (spec) {
            setSelectedEquipment(spec);
        }
    };

    return (
        <TechErrorBoundary key={activeTech} onReset={() => setParticleOffset(0)}>
            <div className="technology-renderer-container" style={{
                position: "relative",
                width: "100%",
                background: "#FFFFFF",
                borderRadius: "8px",
                border: "1px solid #D9DEE7",
                padding: "14px",
                boxSizing: "border-box"
            }}>
                {/* DYNAMIC SCHEMATIC SVG CANVAS */}
                <div className="svg-canvas-wrapper" style={{
                    background: "#FAFAFA",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    position: "relative",
                    overflowX: "auto",
                    minHeight: "450px"
                }}>
                    <svg width="980" height="440" viewBox="0 0 980 440" style={{ width: "100%", height: "440px", minWidth: "850px", display: "block" }}>
                        {/* CAD Grid Pattern */}
                        <g opacity="0.15">
                            <pattern id="cadGridTech" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748B" strokeWidth="0.5" />
                            </pattern>
                            <rect width="980" height="440" fill="url(#cadGridTech)" />
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
                                cycleStep={cycleStep}
                                onHover={handleHover}
                                onClickEquipment={handleEquipmentClick}
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
                                        onClickEquipment={handleEquipmentClick}
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
                                        onClickEquipment={handleEquipmentClick}
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
                                        cycleStep={cycleStep}
                                        onHover={handleHover}
                                        onClickEquipment={handleEquipmentClick}
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
                                        cycleStep={cycleStep}
                                        onHover={handleHover}
                                        onClickEquipment={handleEquipmentClick}
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
                        padding: "8px 12px",
                        borderRadius: "6px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
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

                {/* Datasheet Modal */}
                <EquipmentInspectorModal
                    equipment={selectedEquipment}
                    onClose={() => setSelectedEquipment(null)}
                />
            </div>
        </TechErrorBoundary>
    );
}
