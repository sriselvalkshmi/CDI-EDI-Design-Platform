import React from "react";
import TankComponent from "./TankComponent";
import PumpComponent from "./PumpComponent";
import FlowAnimation from "./FlowAnimation";
import InstrumentationLayer from "./InstrumentationLayer";

/**
 * EDRSchematic
 * Dedicated Electrodialysis Reversal (EDR) Process Schematic.
 * Displays explicit EDR physical components:
 * - Feed Tank (TK-101) & Feed Pump (P-101)
 * - 4-Way Reversal Valve V-101 (Inlet stream reversing)
 * - EDR Stack (R-101) with Reversible MMO Electrodes (Terminal A / Terminal B)
 * - 4-Way Reversal Valve V-102 (Outlet stream reversing)
 * - 3-Way Flush Divert Valve V-103 (Purges off-spec transition water)
 * - Product Water Tank & Brine/Flush Discharge
 */
export default function EDRSchematic({
    geometry = {},
    electrical = {},
    labels = {},
    feedWater = {},
    engineering = {},
    particleOffset = 0,
    cycleStep = "FORWARD",
    onHover = null,
    onClickEquipment = null
}) {
    const CY = 200; // Main flow centerline
    const { voltage = 48.0, current = 4.2, currentDensity = 120 } = electrical;

    const vCell = (engineering.voltageCell || 1.2).toFixed(2);
    const vStack = (engineering.voltageStack || (engineering.cellPairs * Number(vCell))).toFixed(1);
    const iCurrent = (engineering.current || current || 4.2).toFixed(2);
    const pPower = (engineering.power || (Number(vStack) * Number(iCurrent))).toFixed(1);
    const pairs = engineering.cellPairs || 50;
    const reversalPeriod = engineering.reversalPeriodMin || 20;
    const flushDuration = engineering.flushDurationSec || 90;

    // Positions
    const feedTankX = 30;
    const feedTankY = 135;
    const feedTankW = 90;
    const feedTankH = 130;

    const feedPumpCx = 160;
    const feedPumpCy = CY;

    const valveV101X = 250;
    const valveV101Y = CY;

    const stackX = 350;
    const stackY = 85;
    const stackWidth = 260;
    const stackHeight = 230;

    const valveV102X = 660;
    const valveV102Y = CY;

    const valveV103X = 720;
    const valveV103Y = CY;

    const prodTankX = 790;
    const prodTankY = 135;
    const prodTankW = 100;
    const prodTankH = 130;

    const edrStackSpec = {
        name: "Electrodialysis Reversal Stack (R-101)",
        tag: "EDR-101",
        type: "Self-Cleaning Reversible Electrodialysis Stack",
        reversalPeriod: `${reversalPeriod} minutes`,
        flushDivertPeriod: `${flushDuration} seconds`,
        membranePairs: `${pairs} Repeating Pairs (Chlorine/Oxygen Resistant MMO)`,
        currentDensity: `${Number(currentDensity).toFixed(1)} A/m²`,
        operatingVoltage: `${vStack} V (Reversible Polarity)`,
        current: `${iCurrent} A`,
        power: `${pPower} W`,
        scaleDissolutionMechanism: "In-situ Periodic Polarity Reversal (No continuous acid/antiscalant)",
        netWaterRecovery: `${(engineering.waterRecovery || 85.0).toFixed(1)} % (Accounts for transition flush purge)`
    };

    const valveV101Spec = {
        name: "4-Way Inlet Stream Reversal Valve (V-101)",
        tag: "V-101",
        type: "Pneumatic 4-Way Reversing Valve",
        action: "Swaps dilute and concentrate feed streams every 15-45 minutes"
    };

    const valveV103Spec = {
        name: "3-Way Flush Divert Valve (V-103)",
        tag: "V-103",
        type: "Pneumatic 3-Way Divert Valve",
        action: "Diverts off-spec transition water to drain for 60-120s following reversal"
    };

    return (
        <g id="edr_dedicated_schematic">

            {/* --- PIPELINES --- */}

            {/* 1. Feed Tank to Feed Pump */}
            <FlowAnimation
                pathD={`M ${feedTankX + feedTankW} ${CY} L ${feedPumpCx - 20} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.5}
            />

            {/* 2. Feed Pump to 4-Way Valve V-101 */}
            <FlowAnimation
                pathD={`M ${feedPumpCx + 20} ${CY} L ${valveV101X - 16} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.5}
            />

            {/* 3. V-101 Dual Feeds into EDR Stack */}
            <FlowAnimation
                pathD={`M ${valveV101X + 16} ${CY - 20} L ${stackX} ${CY - 20}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.0}
            />
            <path
                d={`M ${valveV101X + 16} ${CY + 20} L ${stackX} ${CY + 20}`}
                stroke="#DC2626"
                strokeWidth="2.5"
                fill="none"
            />

            {/* 4. EDR Stack to 4-Way Valve V-102 */}
            <FlowAnimation
                pathD={`M ${stackX + stackWidth} ${CY - 20} L ${valveV102X - 16} ${CY - 20}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#16A34A"
                strokeWidth={3.5}
            />
            <path
                d={`M ${stackX + stackWidth} ${CY + 20} L ${valveV102X - 16} ${CY + 20}`}
                stroke="#DC2626"
                strokeWidth="2.5"
                fill="none"
            />

            {/* 5. V-102 to Flush Divert Valve V-103 */}
            <FlowAnimation
                pathD={`M ${valveV102X + 16} ${CY} L ${valveV103X - 16} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#16A34A"
                strokeWidth={3.5}
            />

            {/* 6. V-103 to Product Tank */}
            <FlowAnimation
                pathD={`M ${valveV103X + 16} ${CY} L ${prodTankX} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#16A34A"
                strokeWidth={4.0}
                showIons={true}
                particleOffset={particleOffset}
                ionStartX={valveV103X + 16}
                ionStartY={CY}
                ionDistance={prodTankX - valveV103X - 25}
            />

            {/* 7. V-103 Flush Purge Line (Bottom Waste Drain) */}
            <path
                d={`M ${valveV103X} ${CY + 16} L ${valveV103X} 360 L ${prodTankX + 60} 360`}
                stroke="#D97706"
                strokeWidth="2.5"
                strokeDasharray="5,3"
                fill="none"
            />
            <text x={valveV103X + 8} y="354" fontSize="8.5" fontWeight="700" fill="#D97706">TRANSITION FLUSH PURGE (OFF-SPEC DIVERT)</text>

            {/* --- ANSI INSTRUMENTATION TAGS --- */}
            <InstrumentationLayer
                x={205}
                y={CY - 28}
                tag="FT101"
                type="FT"
                value={`${(feedWater.flowRate || 10).toFixed(1)} L/min`}
                label="Feed Flow Rate"
                onHover={onHover}
            />

            <InstrumentationLayer
                x={755}
                y={CY - 48}
                tag="CT101"
                type="CT"
                value={`${(engineering.outletTDS || 65).toFixed(0)} mg/L`}
                label="Product TDS"
                onHover={onHover}
            />

            {/* --- EQUIPMENT COMPONENTS --- */}

            {/* Feed Tank */}
            <TankComponent
                x={feedTankX}
                y={feedTankY}
                width={feedTankW}
                height={feedTankH}
                fillLevel={0.72}
                tag="TK-101"
                label="Feed Tank"
                color="#0284C7"
                onHover={onHover}
                spec={{
                    name: "Raw Feed Storage Tank (TK-101)",
                    type: "Atmospheric Feed Tank",
                    hardness: `${feedWater.hardness || 350} mg/L (High Scaling Tolerant)`,
                    tds: `${feedWater.tds || 3000} mg/L`
                }}
            />

            {/* Feed Pump */}
            <PumpComponent
                cx={feedPumpCx}
                cy={feedPumpCy}
                r={22}
                tag="P-101"
                label="Feed Pump"
                running={true}
                onHover={onHover}
                spec={{
                    name: "Feed Water Booster Pump (P-101)",
                    flow: `${(feedWater.flowRate || 10).toFixed(1)} L/min`,
                    pressure: "3.0 bar"
                }}
            />

            {/* 4-Way Reversal Valve V-101 */}
            <g
                id="valve_v101"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => onHover && onHover(valveV101Spec, e)}
                onMouseLeave={() => onHover && onHover(null)}
                onClick={() => onClickEquipment && onClickEquipment(valveV101Spec)}
            >
                <circle cx={valveV101X} cy={valveV101Y} r="14" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="2" />
                <polygon points={`${valveV101X - 8},${CY - 8} ${valveV101X + 8},${CY + 8} ${valveV101X + 8},${CY - 8} ${valveV101X - 8},${CY + 8}`} fill="#FFFFFF" />
                <text x={valveV101X} y={CY - 18} fontSize="9" fontWeight="800" fill="#6D28D9" textAnchor="middle">V-101</text>
                <text x={valveV101X} y={CY + 26} fontSize="7" fontWeight="700" fill="#4B5563" textAnchor="middle">4-WAY INLET</text>
            </g>

            {/* 4-Way Reversal Valve V-102 */}
            <g
                id="valve_v102"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => onHover && onHover({ name: "4-Way Outlet Reversal Valve (V-102)", tag: "V-102", type: "Pneumatic 4-Way Valve" }, e)}
                onMouseLeave={() => onHover && onHover(null)}
            >
                <circle cx={valveV102X} cy={valveV102Y} r="14" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="2" />
                <polygon points={`${valveV102X - 8},${CY - 8} ${valveV102X + 8},${CY + 8} ${valveV102X + 8},${CY - 8} ${valveV102X - 8},${CY + 8}`} fill="#FFFFFF" />
                <text x={valveV102X} y={CY - 18} fontSize="9" fontWeight="800" fill="#6D28D9" textAnchor="middle">V-102</text>
                <text x={valveV102X} y={CY + 26} fontSize="7" fontWeight="700" fill="#4B5563" textAnchor="middle">4-WAY OUTLET</text>
            </g>

            {/* 3-Way Flush Divert Valve V-103 */}
            <g
                id="valve_v103"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => onHover && onHover(valveV103Spec, e)}
                onMouseLeave={() => onHover && onHover(null)}
                onClick={() => onClickEquipment && onClickEquipment(valveV103Spec)}
            >
                <circle cx={valveV103X} cy={valveV103Y} r="13" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
                <polygon points={`${valveV103X - 6},${CY - 6} ${valveV103X + 6},${CY + 6} ${valveV103X - 6},${CY + 6}`} fill="#FFFFFF" />
                <text x={valveV103X} y={CY - 17} fontSize="9" fontWeight="800" fill="#D97706" textAnchor="middle">V-103</text>
                <text x={valveV103X} y={CY + 25} fontSize="7" fontWeight="700" fill="#B45309" textAnchor="middle">FLUSH DIVERT</text>
            </g>

            {/* Product Tank */}
            <TankComponent
                x={prodTankX}
                y={prodTankY}
                width={prodTankW}
                height={prodTankH}
                fillLevel={0.80}
                tag="TK-102"
                label="Product Tank"
                color="#16A34A"
                onHover={onHover}
                spec={{
                    name: "EDR Product Water Tank (TK-102)",
                    type: "Purified Water Storage",
                    targetTds: `${(engineering.outletTDS || 65).toFixed(0)} mg/L`
                }}
            />

            {/* --- EDR REVERSIBLE STACK (R-101) --- */}
            <g
                id="edr_stack_core"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => onHover && onHover(edrStackSpec, e)}
                onMouseLeave={() => onHover && onHover(null)}
                onClick={() => onClickEquipment && onClickEquipment(edrStackSpec)}
            >
                {/* Stack Outer Housing */}
                <rect
                    x={stackX}
                    y={stackY}
                    width={stackWidth}
                    height={stackHeight}
                    rx="8"
                    fill="#F8FAFC"
                    stroke="#7C3AED"
                    strokeWidth="2.5"
                />

                {/* Header Banner */}
                <rect x={stackX} y={stackY} width={stackWidth} height="26" rx="8" fill="#5B21B6" />
                <rect x={stackX} y={stackY + 16} width={stackWidth} height="10" fill="#5B21B6" />
                <text x={stackX + stackWidth / 2} y={stackY + 17} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">
                    EDR REVERSIBLE MEMBRANE STACK (R-101)
                </text>

                {/* Reversible Terminal A (Left) */}
                <rect x={stackX + 12} y={stackY + 34} width="16" height={stackHeight - 44} fill="#8B5CF6" rx="3" />
                <text x={stackX + 20} y={stackY + 54} fill="#FFFFFF" fontSize="11" fontWeight="900" textAnchor="middle">±</text>
                <text x={stackX + 20} y={stackY + stackHeight - 20} fill="#FFFFFF" fontSize="6.5" fontWeight="700" textAnchor="middle">MMO A</text>

                {/* Reversible Terminal B (Right) */}
                <rect x={stackX + stackWidth - 28} y={stackY + 34} width="16" height={stackHeight - 44} fill="#8B5CF6" rx="3" />
                <text x={stackX + stackWidth - 20} y={stackY + 54} fill="#FFFFFF" fontSize="11" fontWeight="900" textAnchor="middle">∓</text>
                <text x={stackX + stackWidth - 20} y={stackY + stackHeight - 20} fill="#FFFFFF" fontSize="6.5" fontWeight="700" textAnchor="middle">MMO B</text>

                {/* Alternating CEM / AEM Membranes and Reversible Channels */}
                {[0, 1, 2, 3, 4].map((i) => {
                    const stepX = stackX + 44 + i * 38;
                    return (
                        <g key={`edr_cell_${i}`}>
                            <line x1={stepX} y1={stackY + 34} x2={stepX} y2={stackY + stackHeight - 14} stroke="#10B981" strokeWidth="2.5" />
                            <rect x={stepX + 3} y={stackY + 36} width="13" height={stackHeight - 52} fill="#C7D2FE" opacity="0.8" />
                            <text x={stepX + 9} y={stackY + 70} fill="#4338CA" fontSize="6.5" fontWeight="800" textAnchor="middle">D↔C</text>

                            <line x1={stepX + 19} y1={stackY + 34} x2={stepX + 19} y2={stackY + stackHeight - 14} stroke="#F59E0B" strokeWidth="2.5" />
                            <rect x={stepX + 22} y={stackY + 36} width="13" height={stackHeight - 52} fill="#DDD6FE" opacity="0.8" />
                            <text x={stepX + 28} y={stackY + 70} fill="#6D28D9" fontSize="6.5" fontWeight="800" textAnchor="middle">C↔D</text>
                        </g>
                    );
                })}

                {/* Stack Legend */}
                <rect x={stackX + 24} y={stackY + stackHeight - 20} width={stackWidth - 48} height="14" fill="#EDE9FE" rx="3" />
                <circle cx={stackX + 36} cy={stackY + stackHeight - 13} r="3" fill="#8B5CF6" />
                <text x={stackX + 44} y={stackY + stackHeight - 10} fontSize="7" fill="#5B21B6" fontWeight="600">Reversible MMO</text>

                <circle cx={stackX + 110} cy={stackY + stackHeight - 13} r="3" fill="#10B981" />
                <text x={stackX + 118} y={stackY + stackHeight - 10} fontSize="7" fill="#5B21B6" fontWeight="600">CEM</text>

                <circle cx={stackX + 145} cy={stackY + stackHeight - 13} r="3" fill="#F59E0B" />
                <text x={stackX + 153} y={stackY + stackHeight - 10} fontSize="7" fill="#5B21B6" fontWeight="600">AEM</text>

                <text x={stackX + 185} y={stackY + stackHeight - 10} fontSize="7" fill="#6D28D9" fontWeight="700">Reversal: 20 min</text>
            </g>
        </g>
    );
}
