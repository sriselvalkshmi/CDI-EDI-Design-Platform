import React from "react";
import TankComponent from "./TankComponent";
import PumpComponent from "./PumpComponent";
import ElectrodeComponent from "./ElectrodeComponent";
import MembraneComponent from "./MembraneComponent";
import FlowAnimation from "./FlowAnimation";
import ElectricFieldOverlay from "./ElectricFieldOverlay";
import HeatMapOverlay from "./HeatMapOverlay";
import InstrumentationLayer from "./InstrumentationLayer";

/**
 * MCDISchematic
 * Dedicated MCDI process schematic featuring porous carbon electrodes,
 * Anion Exchange Membrane (AEM) & Cation Exchange Membrane (CEM), ion transport arrows,
 * Flow Meter FM-101, waste drain line, and ANSI instrumentation. MEMBRANES CLEARLY SHOWN.
 */
export default function MCDISchematic({
    geometry = {},
    electrical = {},
    labels = {},
    feedWater = {},
    engineering = {},
    optimization = {},
    particleOffset = 0,
    onHover = null
}) {
    const CY = 200;
    const { plateWidthPx, stackHeightPx, pumpRadiusPx, tankWidthPx, tankHeightPx, membraneThicknessPx, visualCellCount, spacerThicknessPx } = geometry;
    const { voltage, current, currentDensity } = electrical;

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

    return (
        <g id="mcdi_dedicated_schematic">

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
                stroke="#16A34A"
                strokeWidth={3.5}
                showIons={true}
                particleOffset={particleOffset}
                ionStartX={stackX + stackWidth + 10}
                ionStartY={CY}
                ionDistance={tank2X - (stackX + stackWidth) - 20}
            />
            {/* Waste Drain Line */}
            <path
                d={`M ${stackX + stackWidth / 2} ${stackY + stackHeight} L ${stackX + stackWidth / 2} 370 L ${tank2X + tank2Width} 370`}
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeDasharray="5,3"
                fill="none"
            />
            <text x={tank2X + tank2Width + 10} y="374" fill="#DC2626" fontWeight="700" fontSize="10">Waste Drain</text>

            {/* ANSI Flow Meter FM-101 */}
            <g transform={`translate(${flowMeterX}, ${CY})`} style={{ cursor: "pointer" }} onClick={() => onHover && onHover({ name: "Flow Meter FM-101", type: "Electromagnetic Flowmeter", flowRate: `${(feedWater.flowRate || 10).toFixed(1)} L/min` })}>
                <circle cx="0" cy="0" r="14" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
                <path d="M -8 -6 L 8 6 M -8 6 L 8 -6" stroke="#0284C7" strokeWidth="1.5" />
                <text x="0" y="24" textAnchor="middle" fontWeight="800" fontSize="9.5" fill="#0284C7">FM-101</text>
            </g>

            {/* ANSI Instrumentation Tags */}
            <InstrumentationLayer
                x={(tank1X + tank1Width + pumpX - pumpR) / 2}
                y={CY - 28}
                tag="FT101"
                type="FT"
                value={`${(feedWater.flowRate || 10).toFixed(1)} L/min`}
                label="Feed Flow Rate"
                onHover={onHover}
            />
            <InstrumentationLayer
                x={(flowMeterX + 14 + stackX) / 2}
                y={CY - 28}
                tag="PI101"
                type="PI"
                value={`${(feedWater.pressure || 1.0).toFixed(2)} bar`}
                label="Stack Pressure"
                onHover={onHover}
            />
            <InstrumentationLayer
                x={(stackX + stackWidth + tank2X) / 2}
                y={CY - 28}
                tag="CT101"
                type="CT"
                value={`${(engineering.outletTDS || 50).toFixed(0)} ppm`}
                label="Product TDS"
                onHover={onHover}
            />

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
            />

            {/* Equipment 3: MCDI Reactor Stack Module */}
            <g
                onMouseEnter={(e) => onHover && onHover({
                    name: "MCDI Membrane Cell Stack Reactor (R-101)",
                    type: "Membrane Capacitive Deionization Reactor",
                    cellPairs: labels.cellPairs,
                    voltage: labels.voltage,
                    current: labels.current,
                    currentDensity: labels.currentDensity,
                    electrodeArea: labels.electrodeArea,
                    membranes: "AEM & CEM Ion Exchange Membranes (>98% Selectivity)",
                    dimensions: `${stackWidth}px L x ${stackHeight}px H`
                }, e)}
                onMouseLeave={() => onHover && onHover(null)}
                style={{ cursor: "pointer" }}
            >
                {/* Stack Housing */}
                <rect
                    x={stackX}
                    y={stackY}
                    width={stackWidth}
                    height={stackHeight}
                    fill="#FFFFFF"
                    stroke="#0284C7"
                    strokeWidth="3"
                    rx="8"
                />

                {/* Electric Field & Thermal Heatmap */}
                <ElectricFieldOverlay
                    x={stackX + 10}
                    y={stackY + 10}
                    width={stackWidth - 20}
                    height={stackHeight - 20}
                    voltage={voltage}
                    technology="MCDI"
                />
                <HeatMapOverlay
                    x={stackX + 15}
                    y={stackY + 15}
                    width={stackWidth - 30}
                    height={stackHeight - 30}
                    currentDensity={currentDensity}
                />

                {/* Positive Anode Electrode */}
                <ElectrodeComponent
                    x={stackX + 20}
                    y={stackY + 25}
                    width={stackWidth - 40}
                    height={10}
                    polarity="positive"
                    currentDensity={currentDensity}
                    onHover={onHover}
                />

                {/* Anion Exchange Membrane (AEM) */}
                <MembraneComponent
                    x={stackX + 20}
                    y={stackY + 40}
                    width={stackWidth - 40}
                    thickness={Math.max(4, membraneThicknessPx)}
                    type="AEM"
                    onHover={onHover}
                />

                {/* Central Water Channel */}
                <rect
                    x={stackX + 20}
                    y={stackY + 52}
                    width={stackWidth - 40}
                    height={stackHeight - 104}
                    fill="#E0F2FE"
                    stroke="#7DD3FC"
                    strokeWidth="0.8"
                    strokeDasharray="4,2"
                />

                {/* Cation Exchange Membrane (CEM) */}
                <MembraneComponent
                    x={stackX + 20}
                    y={stackY + stackHeight - 48}
                    width={stackWidth - 40}
                    thickness={Math.max(4, membraneThicknessPx)}
                    type="CEM"
                    onHover={onHover}
                />

                {/* Negative Cathode Electrode */}
                <ElectrodeComponent
                    x={stackX + 20}
                    y={stackY + stackHeight - 35}
                    width={stackWidth - 40}
                    height={10}
                    polarity="negative"
                    currentDensity={currentDensity}
                    onHover={onHover}
                />

                {/* Tag Header */}
                <rect x={stackX + stackWidth / 2 - 45} y={stackY - 18} width="90" height="16" fill="#0284C7" rx="4" />
                <text x={stackX + stackWidth / 2} y={stackY - 6} textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="10">MCDI R-101</text>
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
            />
        </g>
    );
}
