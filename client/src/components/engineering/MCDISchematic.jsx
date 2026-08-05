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
 * Anion Exchange Membrane (AEM) & Cation Exchange Membrane (CEM), selective ion transport,
 * Flow Meter FM-101, waste drain line, and MCDI vs CDI advantage callouts.
 */
export default function MCDISchematic({
    geometry = {},
    electrical = {},
    labels = {},
    feedWater = {},
    engineering = {},
    optimization = {},
    particleOffset = 0,
    cycleStep = "ADSORPTION",
    onHover = null
}) {
    const CY = 200;
    const { plateWidthPx = 200, stackHeightPx = 180, pumpRadiusPx = 24, tankWidthPx = 100, tankHeightPx = 130, membraneThicknessPx = 6 } = geometry;
    const { voltage = 1.4, current = 7.0, currentDensity = 220 } = electrical;

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
                stroke={isDesorption ? "#DC2626" : "#16A34A"}
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
            <text x={tank2X + tank2Width + 10} y="374" fill="#DC2626" fontWeight="700" fontSize="10">Waste Drain (Regeneration)</text>

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
                    chargeEfficiency: ">92.0% (Blocks Co-Ion Repulsion)",
                    operatingMode: isDesorption ? "Desorption / Regeneration (-V)" : "Adsorption / Desalting (+V)",
                    improvementsOverCDI: "Higher removal (up to 94%), higher recovery (95%), lower SEC",
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
                    stroke={isDesorption ? "#DC2626" : "#0284C7"}
                    strokeWidth="3"
                    rx="8"
                />

                {/* Electric Field & Thermal Heatmap */}
                <ElectricFieldOverlay
                    x={stackX + 10}
                    y={stackY + 10}
                    width={stackWidth - 20}
                    height={stackHeight - 20}
                    voltage={isDesorption ? -voltage : voltage}
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
                    y={stackY + 22}
                    width={stackWidth - 40}
                    height={10}
                    polarity={isDesorption ? "negative" : "positive"}
                    currentDensity={currentDensity}
                    onHover={onHover}
                />

                {/* Anion Exchange Membrane (AEM) */}
                <MembraneComponent
                    x={stackX + 20}
                    y={stackY + 36}
                    width={stackWidth - 40}
                    thickness={Math.max(4, membraneThicknessPx)}
                    type="AEM"
                    onHover={onHover}
                />
                <text x={stackX + 25} y={stackY + 34} fontSize="8" fontWeight="800" fill="#2563EB">AEM (Anion Exchange Membrane)</text>

                {/* Central Water Channel */}
                <rect
                    x={stackX + 20}
                    y={stackY + 48}
                    width={stackWidth - 40}
                    height={stackHeight - 96}
                    fill="#E0F2FE"
                    stroke="#7DD3FC"
                    strokeWidth="0.8"
                    strokeDasharray="4,2"
                />

                {/* Animated Ion Selective Migration through Membranes */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const ionX = stackX + 45 + (i * (stackWidth - 90)) / 5;
                    const offset = (particleOffset + i * 14) % 18;
                    return (
                        <g key={`mcdi_ion_${i}`}>
                            {/* Cl- passing through AEM to Anode */}
                            <circle cx={ionX} cy={stackY + 48 - offset * 0.5} r="3.8" fill="#EF4444" opacity="0.95" />
                            <text x={ionX} y={stackY + 48 - offset * 0.5 + 2} textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900">Cl-</text>

                            {/* Na+ passing through CEM to Cathode */}
                            <circle cx={ionX + 8} cy={stackY + stackHeight - 48 + offset * 0.5} r="3.8" fill="#3B82F6" opacity="0.95" />
                            <text x={ionX + 8} y={stackY + stackHeight - 48 + offset * 0.5 + 2} textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900">Na+</text>
                        </g>
                    );
                })}

                {/* Cation Exchange Membrane (CEM) */}
                <MembraneComponent
                    x={stackX + 20}
                    y={stackY + stackHeight - 44}
                    width={stackWidth - 40}
                    thickness={Math.max(4, membraneThicknessPx)}
                    type="CEM"
                    onHover={onHover}
                />
                <text x={stackX + 25} y={stackY + stackHeight - 46} fontSize="8" fontWeight="800" fill="#DC2626">CEM (Cation Exchange Membrane)</text>

                {/* Negative Cathode Electrode */}
                <ElectrodeComponent
                    x={stackX + 20}
                    y={stackY + stackHeight - 32}
                    width={stackWidth - 40}
                    height={10}
                    polarity={isDesorption ? "positive" : "negative"}
                    currentDensity={currentDensity}
                    onHover={onHover}
                />

                {/* Tag Header */}
                <rect x={stackX + stackWidth / 2 - 50} y={stackY - 18} width="100" height="16" fill={isDesorption ? "#DC2626" : "#0284C7"} rx="4" />
                <text x={stackX + stackWidth / 2} y={stackY - 6} textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="10">
                    MCDI R-101 ({isDesorption ? "DESORPTION" : "ADSORPTION"})
                </text>
            </g>

            {/* MCDI Improvement Callout Banner */}
            <g transform={`translate(${stackX}, ${stackY + stackHeight + 12})`}>
                <rect width={stackWidth} height="32" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1" rx="6" />
                <text x="8" y="14" fontSize="8.5" fontWeight="800" fill="#15803D">✓ MCDI Enhancements over CDI:</text>
                <text x="8" y="25" fontSize="8" fontWeight="600" fill="#166534">● Charge Eff &gt;92% (Co-ion block) ● Removal up to 94% ● Recovery 95%</text>
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
