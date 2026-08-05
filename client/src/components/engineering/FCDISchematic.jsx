import React from "react";
import TankComponent from "./TankComponent";
import PumpComponent from "./PumpComponent";
import MembraneComponent from "./MembraneComponent";
import FlowAnimation from "./FlowAnimation";
import ElectricFieldOverlay from "./ElectricFieldOverlay";
import InstrumentationLayer from "./InstrumentationLayer";

/**
 * FCDISchematic
 * Dedicated FCDI process schematic featuring dual carbon slurry circulation loops,
 * peristaltic slurry pumps, flow-electrodes, ion exchange membranes, central desalination channel,
 * and high-salinity continuous desalting callouts.
 */
export default function FCDISchematic({
    geometry = {},
    electrical = {},
    labels = {},
    feedWater = {},
    engineering = {},
    particleOffset = 0,
    onHover = null
}) {
    const CY = 200;
    const { plateWidthPx = 200, stackHeightPx = 180, tankWidthPx = 100, tankHeightPx = 130 } = geometry;
    const { voltage = 1.8, currentDensity = 320 } = electrical;

    const stackX = 400;
    const stackWidth = Math.max(160, Math.min(260, plateWidthPx + 40));
    const stackHeight = Math.max(160, Math.min(240, stackHeightPx));
    const stackY = CY - stackHeight / 2;

    const tank2X = stackX + stackWidth + 140;
    const tank2Width = Math.max(90, Math.min(130, tankWidthPx));
    const tank2Height = Math.max(120, Math.min(160, tankHeightPx));
    const tank2Y = CY - tank2Height / 2;

    return (
        <g id="fcdi_dedicated_schematic">

            {/* Central Water Desalination Pipeline (Feed -> Reactor -> Product Tank) */}
            <FlowAnimation
                pathD={`M 40 ${CY} L ${stackX} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#3B82F6"
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

            {/* ANSI Instrumentation Tags */}
            <InstrumentationLayer
                x={200}
                y={CY - 28}
                tag="FT101"
                type="FT"
                value={`${(feedWater.flowRate || 10).toFixed(1)} L/min`}
                label="Water Flow Rate"
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

            {/* --- TOP SLURRY LOOP A (ANOLYTE FLOW ELECTRODE) --- */}
            <g id="slurry_loop_a">
                {/* Slurry Tank A (Top Left) */}
                <TankComponent
                    x={50}
                    y={40}
                    width={110}
                    height={100}
                    tag="TK-101A"
                    name="Anolyte Slurry Tank A"
                    type="slurry"
                    flowRate={feedWater.flowRate || 10}
                    tds={15000}
                    onHover={onHover}
                />

                {/* Slurry Pump A */}
                <PumpComponent
                    cx={230}
                    cy={90}
                    flowRate={feedWater.flowRate || 10}
                    pressure={1.5}
                    tag="SP-101A"
                    name="Slurry Pump A"
                    type="Slurry Peristaltic Hose Pump"
                    onHover={onHover}
                />

                {/* Pipelines Loop A */}
                <path d="M 160 90 L 210 90" stroke="#4338CA" strokeWidth="4" />
                <path d={`M 250 90 L ${stackX + 25} 90 L ${stackX + 25} ${stackY + 20}`} stroke="#4338CA" strokeWidth="4" fill="none" />
                {/* Return Loop A */}
                <path d={`M ${stackX + 45} ${stackY + 20} L ${stackX + 45} 60 L 105 60`} stroke="#6366F1" strokeWidth="3" strokeDasharray="5,3" fill="none" />

                {/* Flowing Carbon Slurry Particles Loop A */}
                {Array.from({ length: 14 }).map((_, i) => (
                    <circle
                        key={`slurryA_${i}`}
                        cx={80 + (i * 42 + particleOffset * 2) % 700}
                        cy="60"
                        r="4.5"
                        fill="#6366F1"
                    />
                ))}
            </g>

            {/* --- BOTTOM SLURRY LOOP B (CATHOLYTE FLOW ELECTRODE) --- */}
            <g id="slurry_loop_b">
                {/* Slurry Pump B */}
                <PumpComponent
                    cx={670}
                    cy={305}
                    flowRate={feedWater.flowRate || 10}
                    pressure={1.5}
                    tag="SP-101B"
                    name="Slurry Pump B"
                    type="Slurry Peristaltic Hose Pump"
                    onHover={onHover}
                />

                {/* Slurry Tank B (Bottom Right) */}
                <TankComponent
                    x={740}
                    y={255}
                    width={110}
                    height={100}
                    tag="TK-101B"
                    name="Catholyte Slurry Tank B"
                    type="slurry"
                    flowRate={feedWater.flowRate || 10}
                    tds={15000}
                    onHover={onHover}
                />

                {/* Pipelines Loop B */}
                <path d={`M ${stackX + stackWidth - 25} ${stackY + stackHeight - 20} L ${stackX + stackWidth - 25} 305 L 650 305`} stroke="#1E3A8A" strokeWidth="4" fill="none" />
                <path d="M 690 305 L 740 305" stroke="#1E3A8A" strokeWidth="4" />
                {/* Return Loop B */}
                <path d={`M 795 355 L 795 380 L ${stackX + stackWidth - 45} 380 L ${stackX + stackWidth - 45} ${stackY + stackHeight - 20}`} stroke="#3B82F6" strokeWidth="3" strokeDasharray="5,3" fill="none" />

                {/* Flowing Carbon Slurry Particles Loop B */}
                {Array.from({ length: 14 }).map((_, i) => (
                    <circle
                        key={`slurryB_${i}`}
                        cx={795 - (i * 42 + particleOffset * 2) % 700}
                        cy="380"
                        r="4.5"
                        fill="#3B82F6"
                    />
                ))}
            </g>

            {/* --- CENTRAL FCDI REACTOR MODULE --- */}
            <g
                onMouseEnter={(e) => onHover && onHover({
                    name: "FCDI Continuous Slurry Cell Reactor (R-101)",
                    type: "Flow-Electrode Capacitive Deionization Reactor",
                    operation: "Continuous Non-stop Desalination (No Cycle Pauses)",
                    slurryDensity: "10-15 wt% Activated Carbon Suspension",
                    highTDSHandling: "Capable of handling feed TDS > 3,000 ppm up to 30,000 ppm",
                    voltage: labels.voltage,
                    current: labels.current,
                    removalEfficiency: labels.removalEfficiency,
                    dimensions: `${stackWidth}px L x ${stackHeight}px H`
                }, e)}
                onMouseLeave={() => onHover && onHover(null)}
                style={{ cursor: "pointer" }}
            >
                <rect x={stackX} y={stackY} width={stackWidth} height={stackHeight} fill="#F8FAFC" stroke="#4F46E5" strokeWidth="3" rx="10" />
                <ElectricFieldOverlay x={stackX + 10} y={stackY + 10} width={stackWidth - 20} height={stackHeight - 20} voltage={voltage} technology="FCDI" />

                <rect x={stackX + stackWidth / 2 - 50} y={stackY - 18} width="100" height="16" fill="#4F46E5" rx="4" />
                <text x={stackX + stackWidth / 2} y={stackY - 6} textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="10">FCDI R-101 (CONTINUOUS)</text>

                {/* Flow Anode Slurry Channel */}
                <rect x={stackX + 15} y={stackY + 30} width="22" height={stackHeight - 50} fill="#312E81" rx="3" />
                <text x={stackX + 26} y={CY} textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="700" transform={`rotate(-90 ${stackX + 26} ${CY})`}>ANODE SLURRY</text>

                {/* AEM Membrane */}
                <MembraneComponent x={stackX + 40} y={stackY + 30} width={6} thickness={stackHeight - 50} type="AEM" onHover={onHover} />

                {/* Central Water Channel */}
                <rect x={stackX + 53} y={stackY + 30} width={stackWidth - 106} height={stackHeight - 50} fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1" rx="4" />
                <text x={stackX + 53 + (stackWidth - 106) / 2} y={CY} textAnchor="middle" fill="#1D4ED8" fontSize="10.5" fontWeight="800">WATER CHANNEL</text>

                {/* CEM Membrane */}
                <MembraneComponent x={stackX + stackWidth - 48} y={stackY + 30} width={6} thickness={stackHeight - 50} type="CEM" onHover={onHover} />

                {/* Flow Cathode Slurry Channel */}
                <rect x={stackX + stackWidth - 37} y={stackY + 30} width="22" height={stackHeight - 50} fill="#1E3A8A" rx="3" />
                <text x={stackX + stackWidth - 26} y={CY} textAnchor="middle" fill="#FFFFFF" fontSize="8.5" fontWeight="700" transform={`rotate(-90 ${stackX + stackWidth - 26} ${CY})`}>CATHODE SLURRY</text>
            </g>

            {/* FCDI High TDS Callout Banner */}
            <g transform={`translate(${stackX}, ${stackY + stackHeight + 12})`}>
                <rect width={stackWidth} height="32" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1" rx="6" />
                <text x="8" y="14" fontSize="8.5" fontWeight="800" fill="#3730A3">⚡ FCDI Continuous Slurry Operation:</text>
                <text x="8" y="25" fontSize="8" fontWeight="600" fill="#4338CA">● High TDS (&gt;3,000 ppm) ● Non-stop desalting ● Higher pump power</text>
            </g>

            {/* Product Tank */}
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
