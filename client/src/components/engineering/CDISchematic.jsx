import React from "react";
import TankComponent from "./TankComponent";
import PumpComponent from "./PumpComponent";
import ElectrodeComponent from "./ElectrodeComponent";
import FlowAnimation from "./FlowAnimation";
import ElectricFieldOverlay from "./ElectricFieldOverlay";
import HeatMapOverlay from "./HeatMapOverlay";
import InstrumentationLayer from "./InstrumentationLayer";

/**
 * CDISchematic
 * Dedicated CDI process schematic featuring porous carbon electrodes, open flow spacer channel,
 * electric field vectors, Na+ / Cl- ion electro-adsorption into Electric Double Layer (EDL),
 * flow meter FM-101, waste concentrate line, interactive onClick equipment inspection, and callouts for CDI limitations.
 * STRICTLY NO MEMBRANES.
 */
export default function CDISchematic({
    geometry = {},
    electrical = {},
    labels = {},
    feedWater = {},
    engineering = {},
    particleOffset = 0,
    cycleStep = "ADSORPTION",
    onHover = null,
    onClickEquipment = null
}) {
    const CY = 200;
    const { plateWidthPx = 200, stackHeightPx = 180, pumpRadiusPx = 24, tankWidthPx = 100, tankHeightPx = 130, visualCellCount = 6, spacerThicknessPx = 8 } = geometry;
    const { voltage = 1.2, current = 5.0, currentDensity = 150 } = electrical;

    const tank1X = 40;
    const tank1Width = Math.max(90, Math.min(130, tankWidthPx));
    const tank1Height = Math.max(120, Math.min(160, tankHeightPx));
    const tank1Y = CY - tank1Height / 2;

    const pumpX = tank1X + tank1Width + 80;
    const pumpR = Math.max(20, Math.min(36, pumpRadiusPx));

    const flowMeterX = pumpX + pumpR + 50;

    const stackX = flowMeterX + 70;
    const stackWidth = Math.max(160, Math.min(280, plateWidthPx + 20));
    const stackHeight = Math.max(150, Math.min(260, stackHeightPx));
    const stackY = CY - stackHeight / 2;

    const tank2X = stackX + stackWidth + 110;
    const tank2Width = tank1Width;
    const tank2Height = tank1Height;
    const tank2Y = CY - tank2Height / 2;

    const isDesorption = cycleStep === "REGENERATION";

    const reactorSpec = {
        name: "CDI Cell Stack Reactor (R-101)",
        tag: "R-101",
        type: "Capacitive Deionization Cell Stack",
        cellPairs: labels.cellPairs || "95 pairs",
        voltage: labels.voltage || `${voltage.toFixed(2)} V`,
        current: labels.current || `${current.toFixed(2)} A`,
        currentDensity: labels.currentDensity || `${currentDensity.toFixed(1)} A/m²`,
        electrodeArea: labels.electrodeArea || "350 cm²",
        membranes: "NONE (Open Flow Channel & Porous Carbon Electrodes)",
        operatingMode: isDesorption ? "Desorption / Regeneration (-V)" : "Adsorption / Desalting (+V)",
        sac: labels.sac || "14.5 mg/g",
        limitation: "Co-ion repulsion during charging; max removal ~85%; max TDS ~1000 ppm",
        dimensions: `${stackWidth}px L x ${stackHeight}px H`
    };

    return (
        <g id="cdi_dedicated_schematic">

            {/* Pipelines */}
            <FlowAnimation
                pathD={`M ${tank1X + tank1Width} ${CY} L ${pumpX - pumpR} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.5}
            />
            <FlowAnimation
                pathD={`M ${pumpX + pumpR} ${CY} L ${flowMeterX - 14} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.5}
            />
            <FlowAnimation
                pathD={`M ${flowMeterX + 14} ${CY} L ${stackX} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.5}
            />
            <FlowAnimation
                pathD={`M ${stackX + stackWidth} ${CY} L ${tank2X} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke={isDesorption ? "#DC2626" : "#16A34A"}
                strokeWidth={3.5}
                showIons={true}
                particleOffset={particleOffset}
                ionStartX={stackX + stackWidth + 10}
                ionStartY={CY}
                ionDistance={tank2X - (stackX + stackWidth) - 20}
            />            {/* Waste Concentrate Line */}
            <path
                d={`M ${stackX + stackWidth / 2} ${stackY + stackHeight} L ${stackX + stackWidth / 2} 370 L ${tank2X + tank2Width} 370`}
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeDasharray="5,3"
                fill="none"
            />

            {/* ANSI Flow Meter FM-101 */}
            <g transform={`translate(${flowMeterX}, ${CY})`} style={{ cursor: "pointer" }} onClick={() => onClickEquipment && onClickEquipment({ name: "Flow Meter FM-101", tag: "FM-101", type: "Electromagnetic Flowmeter", flowRate: `${(feedWater.flowRate || 10).toFixed(1)} L/min` })}>
                <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
                <path d="M -8 -6 L 8 6 M -8 6 L 8 -6" stroke="#0284C7" strokeWidth="1.5" />
                <text x="0" y="24" textAnchor="middle" fontWeight="700" fontSize="9.5" fill="#0284C7">FM-101</text>
            </g>

            {/* Equipment 1: Feed Tank */}
            <TankComponent
                x={tank1X}
                y={tank1Y}
                width={tank1Width}
                height={tank1Height}
                tag="TK-101"
                name="Feed Tank"
                type="process"
                flowRate={feedWater.flowRate || 10}
                tds={feedWater.tds || 500}
                onHover={onHover}
                onClick={onClickEquipment}
            />

            {/* Equipment 2: Feed Pump */}
            <PumpComponent
                cx={pumpX}
                cy={CY}
                flowRate={feedWater.flowRate || 10}
                pressure={feedWater.pressure || 1.0}
                tag="P-101"
                name="Feed Pump"
                type="Centrifugal Pump"
                onHover={onHover}
                onClick={onClickEquipment}
            />

            {/* Equipment 3: CDI Reactor Stack Module */}
            <g
                onMouseEnter={(e) => onHover && onHover(reactorSpec, e)}
                onMouseLeave={() => onHover && onHover(null)}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onClickEquipment) onClickEquipment(reactorSpec);
                }}
                style={{ cursor: "pointer" }}
            >
                {/* Stack Outer Shell */}
                <rect
                    x={stackX}
                    y={stackY}
                    width={stackWidth}
                    height={stackHeight}
                    fill="#FFFFFF"
                    stroke={isDesorption ? "#DC2626" : "#2563EB"}
                    strokeWidth="3"
                    rx="8"
                />

                {/* Programmatically Rendered Stacked Cell Layers */}
                <g className="cdi-stacked-cell-layers">
                    {Array.from({ length: Math.min(8, visualCellCount || 6) }).map((_, idx) => {
                        const layerY = stackY + 25 + idx * ((stackHeight - 50) / Math.min(8, visualCellCount || 6));
                        return (
                            <line
                                key={idx}
                                x1={stackX + 25}
                                y1={layerY}
                                x2={stackX + stackWidth - 25}
                                y2={layerY}
                                stroke="#94A3B8"
                                strokeWidth={Math.max(1, spacerThicknessPx / 4)}
                                strokeDasharray="3,2"
                            />
                        );
                    })}
                </g>

                {/* Top Anode Porous Carbon Electrode */}
                <ElectrodeComponent
                    x={stackX + 20}
                    y={stackY + 25}
                    width={stackWidth - 40}
                    height={12}
                    polarity={isDesorption ? "negative" : "positive"}
                    currentDensity={currentDensity}
                    onHover={onHover}
                />

                {/* Electric Double Layer (EDL) Adsorption Micro-Ions */}
                {!isDesorption ? (
                    Array.from({ length: 8 }).map((_, i) => {
                        const ionX = stackX + 45 + (i * (stackWidth - 90)) / 7;
                        const offset = (particleOffset + i * 12) % 15;
                        return (
                            <g key={`edl_${i}`}>
                                <circle cx={ionX} cy={stackY + 42 + offset * 0.4} r="3.5" fill="#EF4444" opacity="0.9" />
                                <circle cx={ionX + 10} cy={stackY + stackHeight - 42 - offset * 0.4} r="3.5" fill="#3B82F6" opacity="0.9" />
                            </g>
                        );
                    })
                ) : (
                    Array.from({ length: 8 }).map((_, i) => {
                        const ionX = stackX + 45 + (i * (stackWidth - 90)) / 7;
                        return (
                            <g key={`desorb_${i}`}>
                                <circle cx={ionX} cy={CY - 10 + (i % 3) * 10} r="4.0" fill="#DC2626" opacity="0.9" />
                            </g>
                        );
                    })
                )}

                {/* Bottom Cathode Porous Carbon Electrode */}
                <ElectrodeComponent
                    x={stackX + 20}
                    y={stackY + stackHeight - 37}
                    width={stackWidth - 40}
                    height={12}
                    polarity={isDesorption ? "positive" : "negative"}
                    currentDensity={currentDensity}
                    onHover={onHover}
                />

                {/* Tag Callout Header */}
                <rect x={stackX + stackWidth / 2 - 40} y={stackY - 18} width="80" height="16" fill={isDesorption ? "#DC2626" : "#2563EB"} rx="4" />
                <text x={stackX + stackWidth / 2} y={stackY - 6} textAnchor="middle" fill="#FFFFFF" fontWeight="700" fontSize="10">
                    R-101
                </text>
            </g>

            {/* Equipment 4: Product Storage Tank */}
            <TankComponent
                x={tank2X}
                y={tank2Y}
                width={tank2Width}
                height={tank2Height}
                tag="TK-102"
                name="Product Tank"
                type="product"
                flowRate={feedWater.flowRate || 10}
                tds={engineering.outletTDS || 50}
                onHover={onHover}
                onClick={onClickEquipment}
            />
        </g>
    );
}
