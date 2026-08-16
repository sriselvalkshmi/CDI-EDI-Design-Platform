import React from "react";
import TankComponent from "./TankComponent";
import PumpComponent from "./PumpComponent";
import MembraneComponent from "./MembraneComponent";
import FlowAnimation from "./FlowAnimation";
import ElectricFieldOverlay from "./ElectricFieldOverlay";
import InstrumentationLayer from "./InstrumentationLayer";

/**
 * EDISchematic
 * Dedicated Electrodeionization (EDI) Process Schematic.
 * Displays explicit EDI physical internals:
 * - EDI Stack Shell (R-101) & DC Power Supply Unit
 * - Anode (+) and Cathode (-) Electrode Chambers
 * - Cation Exchange Membranes (CEM) & Anion Exchange Membranes (AEM)
 * - Mixed-Bed Resin Chambers (Cation Amber & Anion Blue Resin Spheres)
 * - Dilute Channels -> Product Water Outlet
 * - Concentrate Channels -> Concentrate Outlet
 */
export default function EDISchematic({
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
    const { voltage = 25.0, current = 2.1, currentDensity = 450 } = electrical;

    const vCell = (engineering.voltageCell || 5.0).toFixed(2);
    const vStack = (engineering.voltageStack || (engineering.cellPairs * Number(vCell))).toFixed(1);
    const iCurrent = (engineering.current || 0.14).toFixed(2);
    const pPower = (engineering.power || (Number(vStack) * Number(iCurrent))).toFixed(1);

    // Positions
    const feedTankX = 35;
    const feedTankY = 135;
    const feedTankW = 95;
    const feedTankH = 130;

    const feedPumpCx = 175;
    const feedPumpCy = CY;

    const flowMeterX = 240;

    const stackX = 350;
    const stackY = 90;
    const stackWidth = 260;
    const stackHeight = 220;

    const prodTankX = 730;
    const prodTankY = 135;
    const prodTankW = 110;
    const prodTankH = 130;

    const reactorSpec = {
        name: "EDI Polishing Stack Reactor (R-101)",
        tag: "R-101",
        type: "Continuous Electrodeionization High-Purity Stack Module",
        resinBed: "Mixed-Bed Strong Acid Cation (Amber) & Strong Base Anion (Blue) Ion Exchange Resin",
        regeneration: "In-situ Water Splitting (H+ / OH-) Continuous Electrochemical Auto-regeneration",
        targetPurity: "Ultrapure Water (< 0.1 to 1 ppm TDS / up to 18.2 MΩ·cm)",
        cellVoltage: `${vCell} V`,
        stackVoltage: `${vStack} V`,
        current: `${iCurrent} A`,
        power: `${pPower} W (P = V_stack × I)`,
        chargeEfficiency: "98.0 %",
        chemicalRegeneration: "0% Hazardous Acid/Caustic Required (Eco-friendly)",
        dimensions: `${stackWidth}px L × ${stackHeight}px H`
    };

    return (
        <g id="edi_dedicated_schematic">

            {/* --- MAIN DILUTE WATER FLOW PIPELINES (LEFT TO RIGHT) --- */}

            {/* 1. Feed Tank to Feed Pump */}
            <FlowAnimation
                pathD={`M ${feedTankX + feedTankW} ${CY} L ${feedPumpCx - 20} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.5}
            />

            {/* 2. Feed Pump to Flow Meter to EDI Stack Entrance */}
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

            {/* 3. EDI Product Outlet to Ultrapure Product Storage Tank */}
            <FlowAnimation
                pathD={`M ${stackX + stackWidth} ${CY} L ${prodTankX} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#16A34A"
                strokeWidth={4.0}
                showIons={true}
                particleOffset={particleOffset}
                ionStartX={stackX + stackWidth + 10}
                ionStartY={CY}
                ionDistance={prodTankX - (stackX + stackWidth) - 20}
            />

            {/* 4. Concentrate Stream Outlet Pipeline (Bottom Drain) */}
            <path
                d={`M ${stackX + stackWidth - 30} ${stackY + stackHeight} L ${stackX + stackWidth - 30} 360 L ${prodTankX + prodTankW / 2} 360`}
                stroke="#7C3AED"
                strokeWidth="2.5"
                strokeDasharray="5,3"
                fill="none"
            />
            <text x={stackX + stackWidth - 25} y="354" fontSize="8.5" fontWeight="700" fill="#7C3AED">CONCENTRATE OUTLET</text>

            {/* --- ANSI INSTRUMENTATION TAGS --- */}
            <InstrumentationLayer
                x={flowMeterX}
                y={CY - 28}
                tag="FT101"
                type="FT"
                value={`${(feedWater.flowRate || 10).toFixed(1)} L/min`}
                label="Feed Flow Rate"
                onHover={onHover}
            />

            <InstrumentationLayer
                x={645}
                y={CY - 28}
                tag="CT101"
                type="CT"
                value={`${(engineering.outletTDS || 0.5).toFixed(1)} ppm`}
                label="Ultrapure TDS"
                onHover={onHover}
            />

            {/* --- 1. FEED STORAGE TANK (TK-101) --- */}
            <TankComponent
                x={feedTankX}
                y={feedTankY}
                width={feedTankW}
                height={feedTankH}
                tag="TK-101"
                name={engineering.isRoPretreatmentRequired ? "RO Permeate Tank" : "Feed Storage Tank"}
                type="process"
                flowRate={feedWater.flowRate || 10}
                tds={engineering.isRoPretreatmentRequired ? (engineering.roPermeateTds || 15) : (feedWater.tds || 500)}
                onHover={onHover}
                onClick={onClickEquipment}
            />

            {/* --- 2. EDI FEED WATER PUMP (P-101) --- */}
            <PumpComponent
                cx={feedPumpCx}
                cy={feedPumpCy}
                r={20}
                flowRate={feedWater.flowRate || 10}
                pressure={feedWater.pressure || 1.0}
                tag="P-101"
                name="EDI Feed Pump"
                type="Centrifugal Feed Pump"
                tagPosition="bottom"
                onHover={onHover}
                onClick={onClickEquipment}
            />

            {/* --- 3. DEDICATED EDI STACK MODULE (R-101) --- */}
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
                <rect x={stackX} y={stackY} width={stackWidth} height={stackHeight} fill="#FFFFFF" stroke="#7C3AED" strokeWidth="3" rx="10" />

                {/* DC Power Supply Box */}
                <g transform={`translate(${stackX - 45}, ${CY - 25})`}>
                    <rect x="0" y="0" width="34" height="50" fill="#1E1B4B" stroke="#6D28D9" strokeWidth="2" rx="4" />
                    <text x="17" y="18" textAnchor="middle" fill="#A5B4FC" fontSize="9" fontWeight="800">DC</text>
                    <text x="17" y="30" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="700">{vStack}V</text>
                    <text x="17" y="42" textAnchor="middle" fill="#38BDF8" fontSize="7.5" fontWeight="700">{iCurrent}A</text>
                </g>
                <path d={`M ${stackX - 11} ${CY - 10} L ${stackX + 25} ${CY - 10} L ${stackX + 25} ${stackY + 25}`} stroke="#EF4444" strokeWidth="1.8" strokeDasharray="3,2" fill="none" />
                <path d={`M ${stackX - 11} ${CY + 10} L ${stackX + stackWidth - 25} ${CY + 10} L ${stackX + stackWidth - 25} ${stackY + 25}`} stroke="#3B82F6" strokeWidth="1.8" strokeDasharray="3,2" fill="none" />

                {/* Header Banner */}
                <rect x={stackX + stackWidth / 2 - 65} y={stackY - 20} width="130" height="16" fill="#7C3AED" rx="4" />
                <text x={stackX + stackWidth / 2} y={stackY - 8} textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="9.5">EDI R-101 (HIGH PURITY)</text>

                {/* Anode Electrode Chamber (+) */}
                <rect x={stackX + 15} y={stackY + 25} width="20" height={stackHeight - 50} fill="#6D28D9" rx="3" />
                <text x={stackX + 25} y={CY} textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800" transform={`rotate(-90 ${stackX + 25} ${CY})`}>ANODE (+)</text>

                {/* Anion Exchange Membrane (AEM) */}
                <MembraneComponent x={stackX + 38} y={stackY + 25} width={5} thickness={stackHeight - 50} type="AEM" onHover={onHover} />

                {/* --- CENTRAL DILUTE CHANNEL WITH MIXED-BED ION EXCHANGE RESIN --- */}
                <rect x={stackX + 46} y={stackY + 25} width={stackWidth - 92} height={stackHeight - 50} fill="#FAF5FF" stroke="#DDD6FE" strokeWidth="1.2" rx="4" />
                <text x={stackX + 46 + (stackWidth - 92) / 2} y={stackY + 38} textAnchor="middle" fill="#6D28D9" fontSize="9.5" fontWeight="800">DILUTE CHAMBER (MIXED-BED RESIN)</text>

                {/* Mixed-Bed Resin Spherical Beads (Cation Amber & Anion Blue) */}
                {Array.from({ length: 40 }).map((_, i) => {
                    const row = Math.floor(i / 8);
                    const col = i % 8;
                    const bx = stackX + 60 + col * ((stackWidth - 120) / 7);
                    const by = stackY + 52 + row * ((stackHeight - 90) / 4);
                    const isCation = (row + col) % 2 === 0;
                    return (
                        <circle
                            key={`edi_resin_${i}`}
                            cx={bx}
                            cy={by}
                            r="4.5"
                            fill={isCation ? "#D97706" : "#2563EB"}
                            stroke="#FFFFFF"
                            strokeWidth="0.8"
                        />
                    );
                })}

                {/* Water Splitting Callout Text inside Resin Bed */}
                <rect x={stackX + stackWidth / 2 - 50} y={CY + 35} width="100" height="14" fill="#FFFFFF" opacity="0.9" rx="3" stroke="#A78BFA" strokeWidth="0.8" />
                <text x={stackX + stackWidth / 2} y={CY + 45} textAnchor="middle" fill="#5B21B6" fontSize="8" fontWeight="800">H+ / OH- AUTO-REGEN</text>

                {/* Cation Exchange Membrane (CEM) */}
                <MembraneComponent x={stackX + stackWidth - 43} y={stackY + 25} width={5} thickness={stackHeight - 50} type="CEM" onHover={onHover} />

                {/* Cathode Electrode Chamber (-) */}
                <rect x={stackX + stackWidth - 35} y={stackY + 25} width="20" height={stackHeight - 50} fill="#4C1D95" rx="3" />
                <text x={stackX + stackWidth - 25} y={CY} textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800" transform={`rotate(-90 ${stackX + stackWidth - 25} ${CY})`}>CATHODE (-)</text>
            </g>

            {/* --- 4. ULTRAPURE PRODUCT STORAGE TANK (TK-103) --- */}
            <TankComponent
                x={prodTankX}
                y={prodTankY}
                width={prodTankW}
                height={prodTankH}
                tag="TK-103"
                name="Ultrapure Product Tank"
                type="product"
                flowRate={feedWater.flowRate || 10}
                tds={engineering.outletTDS || 0.5}
                onHover={onHover}
                onClick={onClickEquipment}
            />

        </g>
    );
}
