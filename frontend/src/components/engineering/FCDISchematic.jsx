import React from "react";
import TankComponent from "./TankComponent";
import PumpComponent from "./PumpComponent";
import MembraneComponent from "./MembraneComponent";
import FlowAnimation from "./FlowAnimation";
import ElectricFieldOverlay from "./ElectricFieldOverlay";
import InstrumentationLayer from "./InstrumentationLayer";

/**
 * FCDISchematic
 * Dedicated FCDI process flow schematic with fixed industrial P&ID sequence,
 * smart line-wrapped text containment inside tanks, non-overlapping pump tags,
 * and zero pixel collisions.
 */
export default function FCDISchematic({
    geometry = {},
    electrical = {},
    labels = {},
    feedWater = {},
    engineering = {},
    particleOffset = 0,
    onHover = null,
    onClickEquipment = null
}) {
    const CY = 200; // Main water flow centerline
    const { voltage = 1.8 } = electrical;

    // Fixed non-overlapping component coordinates
    const feedTankX = 35;
    const feedTankY = 135;
    const feedTankW = 95;
    const feedTankH = 130;

    const feedPumpCx = 175;
    const feedPumpCy = CY;

    const flowMeterX = 240;

    const stackX = 370;
    const stackY = 115;
    const stackWidth = 210;
    const stackHeight = 170;

    const prodTankX = 730;
    const prodTankY = 135;
    const prodTankW = 110;
    const prodTankH = 130;

    const vCell = (engineering.voltageCell || engineering.voltage || 1.2).toFixed(2);
    const vStack = (engineering.voltageStack || (engineering.cellPairs * Number(vCell))).toFixed(1);
    const iCurrent = (engineering.current || 5.0).toFixed(2);
    const pPower = (engineering.power || (Number(vStack) * Number(iCurrent))).toFixed(1);

    const reactorSpec = {
        name: "FCDI Continuous Slurry Cell Reactor (R-101)",
        tag: "R-101",
        type: "Flow-Electrode Capacitive Deionization Reactor",
        operation: "Continuous Non-stop Desalination (No Cycle Pauses)",
        slurryDensity: "10-15 wt% Activated Carbon Suspension",
        highTDSHandling: "Capable of handling feed TDS > 3,000 ppm up to 30,000 ppm",
        cellVoltage: `${vCell} V`,
        stackVoltage: `${vStack} V`,
        current: `${iCurrent} A`,
        power: `${pPower} W`,
        removalEfficiency: `${(engineering.removalEfficiency || 90.0).toFixed(1)} %`,
        dimensions: `${stackWidth}px L × ${stackHeight}px H`
    };

    return (
        <g id="fcdi_dedicated_schematic">

            {/* --- MAIN WATER FLOW PIPELINES (LEFT TO RIGHT) --- */}

            {/* 1. Feed Tank to Feed Pump */}
            <FlowAnimation
                pathD={`M ${feedTankX + feedTankW} ${CY} L ${feedPumpCx - 20} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.5}
            />

            {/* 2. Feed Pump to Flow Meter to Stack Entrance */}
            <FlowAnimation
                pathD={`M ${feedPumpCx + 20} ${CY} L ${flowMeterX - 16} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.5}
            />
            <FlowAnimation
                pathD={`M ${flowMeterX + 16} ${CY} L ${stackX} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.5}
            />

            {/* 3. Stack Outlet to Product Tank */}
            <FlowAnimation
                pathD={`M ${stackX + stackWidth} ${CY} L ${prodTankX} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#16A34A"
                strokeWidth={3.5}
                showIons={true}
                particleOffset={particleOffset}
                ionStartX={stackX + stackWidth + 10}
                ionStartY={CY}
                ionDistance={prodTankX - (stackX + stackWidth) - 20}
            />

            {/* --- ANSI INSTRUMENTATION TAGS --- */}
            <InstrumentationLayer
                x={flowMeterX}
                y={CY - 28}
                tag="FT101"
                type="FT"
                value={`${(feedWater.flowRate || 10).toFixed(1)} L/min`}
                label="Water Flow Rate"
                onHover={onHover}
            />

            <InstrumentationLayer
                x={645}
                y={CY - 28}
                tag="CT101"
                type="CT"
                value={`${(engineering.outletTDS || 50).toFixed(0)} ppm`}
                label="Product TDS"
                onHover={onHover}
            />

            {/* --- 1. RAW FEED WATER STORAGE TANK (TK-101) --- */}
            <TankComponent
                x={feedTankX}
                y={feedTankY}
                width={feedTankW}
                height={feedTankH}
                tag="TK-101"
                name="Feed Storage Tank"
                type="process"
                flowRate={feedWater.flowRate || 10}
                tds={feedWater.tds || 500}
                onHover={onHover}
                onClick={onClickEquipment}
            />

            {/* --- 2. CENTRIFUGAL FEED WATER PUMP (P-101) --- */}
            <PumpComponent
                cx={feedPumpCx}
                cy={feedPumpCy}
                r={20}
                flowRate={feedWater.flowRate || 10}
                pressure={feedWater.pressure || 1.0}
                tag="P-101"
                name="Feed Water Pump"
                type="Centrifugal Feed Pump"
                tagPosition="bottom"
                onHover={onHover}
                onClick={onClickEquipment}
            />

            {/* --- 3. TOP ANOLYTE CARBON SLURRY CIRCULATION LOOP A --- */}
            <g id="anolyte_slurry_loop_a">
                {/* Anolyte Slurry Tank A (Top Left offset at X=265, Y=12) */}
                <TankComponent
                    x={265}
                    y={12}
                    width={95}
                    height={70}
                    tag="TK-102A"
                    name="Anolyte Slurry Tank A"
                    type="slurry"
                    flowRate={feedWater.flowRate || 10}
                    tds={15000}
                    onHover={onHover}
                    onClick={onClickEquipment}
                />

                {/* Anolyte Slurry Hose Pump A (Top Mid) */}
                <PumpComponent
                    cx={405}
                    cy={47.5}
                    r={18}
                    flowRate={feedWater.flowRate || 10}
                    pressure={1.5}
                    tag="SP-101A"
                    name="Anolyte Slurry Hose Pump A"
                    type="Slurry Peristaltic Hose Pump"
                    tagPosition="right"
                    onHover={onHover}
                    onClick={onClickEquipment}
                />

                {/* Piping Loop A */}
                {/* Tank to Pump */}
                <path d="M 360 47.5 L 387 47.5" stroke="#4338CA" strokeWidth="3" />
                {/* Pump to Anode Slurry Channel Top Entrance (X=395, Y=135) */}
                <path d="M 423 47.5 L 450 47.5 L 450 80 L 395 80 L 395 135" stroke="#4338CA" strokeWidth="3" fill="none" />
                {/* Anode Slurry Channel Bottom Outlet (X=395, Y=265) return to Tank A */}
                <path d="M 395 265 L 312 265 L 312 82" stroke="#6366F1" strokeWidth="2.5" strokeDasharray="5,3" fill="none" />

                {/* Animated Carbon Slurry Particles Loop A */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <circle
                        key={`slurryA_${i}`}
                        cx={360 + (i * 25 + particleOffset * 2) % 63}
                        cy="47.5"
                        r="3.5"
                        fill="#6366F1"
                    />
                ))}
            </g>

            {/* --- 4. CENTRAL FCDI CONTINUOUS REACTOR STACK (R-101) --- */}
            <g
                onMouseEnter={(e) => onHover && onHover(reactorSpec, e)}
                onMouseLeave={() => onHover && onHover(null)}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onClickEquipment) onClickEquipment(reactorSpec);
                }}
                style={{ cursor: "pointer" }}
            >
                <rect x={stackX} y={stackY} width={stackWidth} height={stackHeight} fill="#F8FAFC" stroke="#4F46E5" strokeWidth="3" rx="10" />
                <ElectricFieldOverlay x={stackX + 10} y={stackY + 10} width={stackWidth - 20} height={stackHeight - 20} voltage={voltage} technology="FCDI" />

                {/* Header Tag Banner (Y = 95..111) */}
                <rect x={stackX + stackWidth / 2 - 65} y={stackY - 20} width="130" height="16" fill="#4F46E5" rx="4" />
                <text x={stackX + stackWidth / 2} y={stackY - 8} textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="9.5">FCDI R-101 (CONTINUOUS)</text>

                {/* Anode Carbon Slurry Flow Channel */}
                <rect x={stackX + 15} y={stackY + 20} width="20" height={stackHeight - 40} fill="#312E81" rx="3" />
                <text x={stackX + 25} y={CY} textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700" transform={`rotate(-90 ${stackX + 25} ${CY})`}>ANODE SLURRY</text>

                {/* AEM Ion Exchange Membrane */}
                <MembraneComponent x={stackX + 38} y={stackY + 20} width={5} thickness={stackHeight - 40} type="AEM" onHover={onHover} />

                {/* Central Purified Water Desalination Channel */}
                <rect x={stackX + 48} y={stackY + 20} width={stackWidth - 96} height={stackHeight - 40} fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1" rx="4" />
                <text x={stackX + 48 + (stackWidth - 96) / 2} y={CY} textAnchor="middle" fill="#1D4ED8" fontSize="10.5" fontWeight="800">WATER CHANNEL</text>

                {/* CEM Ion Exchange Membrane */}
                <MembraneComponent x={stackX + stackWidth - 43} y={stackY + 20} width={5} thickness={stackHeight - 40} type="CEM" onHover={onHover} />

                {/* Cathode Carbon Slurry Flow Channel */}
                <rect x={stackX + stackWidth - 35} y={stackY + 20} width="20" height={stackHeight - 40} fill="#1E3A8A" rx="3" />
                <text x={stackX + stackWidth - 25} y={CY} textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700" transform={`rotate(-90 ${stackX + stackWidth - 25} ${CY})`}>CATHODE SLURRY</text>
            </g>

            {/* FCDI Operation Callout Banner (Y = 295..325) */}
            <g transform={`translate(${stackX}, ${stackY + stackHeight + 10})`}>
                <rect width={stackWidth} height="30" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1" rx="6" />
                <text x="8" y="13" fontSize="8.5" fontWeight="800" fill="#3730A3">FCDI Continuous Slurry Operation:</text>
                <text x="8" y="24" fontSize="8" fontWeight="600" fill="#4338CA">● High TDS (&gt;3,000 ppm) ● Non-stop desalting ● Higher pump power</text>
            </g>

            {/* --- 5. BOTTOM CATHOLYTE CARBON SLURRY CIRCULATION LOOP B --- */}
            <g id="catholyte_slurry_loop_b">
                {/* Catholyte Slurry Hose Pump B (Bottom Mid) */}
                <PumpComponent
                    cx={475}
                    cy={382.5}
                    r={18}
                    flowRate={feedWater.flowRate || 10}
                    pressure={1.5}
                    tag="SP-101B"
                    name="Catholyte Slurry Hose Pump B"
                    type="Slurry Peristaltic Hose Pump"
                    tagPosition="left"
                    onHover={onHover}
                    onClick={onClickEquipment}
                />

                {/* Catholyte Slurry Tank B (Bottom Right offset at X=600, Y=350) */}
                <TankComponent
                    x={600}
                    y={350}
                    width={95}
                    height={70}
                    tag="TK-102B"
                    name="Catholyte Slurry Tank B"
                    type="slurry"
                    flowRate={feedWater.flowRate || 10}
                    tds={15000}
                    onHover={onHover}
                    onClick={onClickEquipment}
                />

                {/* Piping Loop B */}
                {/* Tank B to Pump B */}
                <path d="M 600 382.5 L 493 382.5" stroke="#1E3A8A" strokeWidth="3" />
                {/* Pump B to Cathode Slurry Channel Bottom (X=555, Y=265) */}
                <path d="M 457 382.5 L 440 382.5 L 440 335 L 555 335 L 555 265" stroke="#1E3A8A" strokeWidth="3" fill="none" />
                {/* Cathode Slurry Channel Top (X=555, Y=135) return to Tank B */}
                <path d="M 555 135 L 647.5 135 L 647.5 350" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="5,3" fill="none" />

                {/* Animated Carbon Slurry Particles Loop B */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <circle
                        key={`slurryB_${i}`}
                        cx={600 - (i * 25 + particleOffset * 2) % 100}
                        cy="382.5"
                        r="3.5"
                        fill="#3B82F6"
                    />
                ))}
            </g>

            {/* --- 6. PURIFIED PRODUCT STORAGE TANK (TK-103) --- */}
            <TankComponent
                x={prodTankX}
                y={prodTankY}
                width={prodTankW}
                height={prodTankH}
                tag="TK-103"
                name="Product Storage Tank"
                type="product"
                flowRate={feedWater.flowRate || 10}
                tds={engineering.outletTDS || 50}
                onHover={onHover}
                onClick={onClickEquipment}
            />

        </g>
    );
}
