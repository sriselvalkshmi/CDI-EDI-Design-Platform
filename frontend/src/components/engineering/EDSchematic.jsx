import React from "react";
import TankComponent from "./TankComponent";
import PumpComponent from "./PumpComponent";
import FlowAnimation from "./FlowAnimation";
import InstrumentationLayer from "./InstrumentationLayer";

/**
 * EDSchematic
 * Dedicated Electrodialysis (ED) Process Schematic.
 * Displays explicit ED physical components:
 * - Feed Tank (TK-101) & Dilute Feed Pump (P-101)
 * - Concentrate Recirculation Loop & Pump (P-102)
 * - Multi-cell ED Stack (R-101) with alternating AEM/CEM membrane pairs
 * - Anode (+) and Cathode (-) electrode rinse streams
 * - Product Water Line with CT-101 & Concentrate Blowdown
 */
export default function EDSchematic({
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
    const { voltage = 48.0, current = 4.5, currentDensity = 125 } = electrical;

    const vCell = (engineering.voltageCell || 1.2).toFixed(2);
    const vStack = (engineering.voltageStack || (engineering.cellPairs * Number(vCell))).toFixed(1);
    const iCurrent = (engineering.current || current || 4.5).toFixed(2);
    const pPower = (engineering.power || (Number(vStack) * Number(iCurrent))).toFixed(1);
    const iLim = (engineering.limitingCurrentDensity || 180).toFixed(1);
    const pairs = engineering.cellPairs || 50;

    // Positions
    const feedTankX = 35;
    const feedTankY = 135;
    const feedTankW = 95;
    const feedTankH = 130;

    const feedPumpCx = 175;
    const feedPumpCy = CY;

    const flowMeterX = 240;

    const stackX = 340;
    const stackY = 85;
    const stackWidth = 270;
    const stackHeight = 230;

    const prodTankX = 740;
    const prodTankY = 135;
    const prodTankW = 110;
    const prodTankH = 130;

    const edStackSpec = {
        name: "Electrodialysis Membrane Stack (R-101)",
        tag: "ED-101",
        type: "Multi-Cell Electrodialysis Stack",
        membranePairs: `${pairs} AEM/CEM Repeating Cell Pairs`,
        limitingCurrentDensity: `${iLim} A/m²`,
        operatingCurrentDensity: `${Number(currentDensity).toFixed(1)} A/m²`,
        currentPolarizationRatio: `${((Number(currentDensity) / Number(iLim)) * 100).toFixed(1)} % (Safe < 85%)`,
        cellVoltage: `${vCell} V/pair`,
        stackVoltage: `${vStack} V`,
        current: `${iCurrent} A`,
        power: `${pPower} W`,
        chargeEfficiency: `${(engineering.chargeEfficiency || 90.0).toFixed(1)} %`,
        recovery: `${(engineering.waterRecovery || 90.0).toFixed(1)} %`,
        dimensions: `${stackWidth}px L × ${stackHeight}px H`
    };

    return (
        <g id="ed_dedicated_schematic">

            {/* --- PIPELINES --- */}

            {/* 1. Feed Tank to Dilute Pump */}
            <FlowAnimation
                pathD={`M ${feedTankX + feedTankW} ${CY} L ${feedPumpCx - 20} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.5}
            />

            {/* 2. Dilute Pump to Flow Meter to ED Stack */}
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

            {/* 3. ED Product Outlet to Storage Tank */}
            <FlowAnimation
                pathD={`M ${stackX + stackWidth} ${CY - 20} L ${prodTankX} ${CY - 20}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#16A34A"
                strokeWidth={4.0}
                showIons={true}
                particleOffset={particleOffset}
                ionStartX={stackX + stackWidth + 10}
                ionStartY={CY - 20}
                ionDistance={prodTankX - (stackX + stackWidth) - 20}
            />

            {/* 4. Concentrate Recirculation Loop */}
            <path
                d={`M ${stackX + stackWidth} ${CY + 50} L ${stackX + stackWidth + 30} ${CY + 50} L ${stackX + stackWidth + 30} 360 L ${stackX - 30} 360 L ${stackX - 30} ${CY + 50} L ${stackX} ${CY + 50}`}
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeDasharray="6,3"
                fill="none"
            />
            <text x={stackX + 20} y="354" fontSize="9" fontWeight="700" fill="#DC2626">CONCENTRATE RECIRCULATION LOOP (P-102)</text>

            {/* Concentrate Blowdown Drain */}
            <path
                d={`M ${stackX + stackWidth + 30} 360 L ${prodTankX + 50} 360`}
                stroke="#991B1B"
                strokeWidth="2.0"
                fill="none"
            />
            <text x={prodTankX - 30} y="354" fontSize="8.5" fontWeight="700" fill="#991B1B">BRINE BLOWDOWN</text>

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
                x={655}
                y={CY - 48}
                tag="CT101"
                type="CT"
                value={`${(engineering.outletTDS || 50).toFixed(0)} mg/L`}
                label="Product TDS"
                onHover={onHover}
            />

            <InstrumentationLayer
                x={475}
                y={stackY - 22}
                tag="JT101"
                type="JT"
                value={`${Number(currentDensity).toFixed(1)} A/m²`}
                label="Current Density"
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
                    capacity: `${((feedWater.flowRate || 10) * 60).toFixed(0)} L`,
                    tds: `${feedWater.tds || 2500} mg/L`
                }}
            />

            {/* Dilute Booster Pump */}
            <PumpComponent
                cx={feedPumpCx}
                cy={feedPumpCy}
                r={22}
                tag="P-101"
                label="Dilute Pump"
                running={true}
                onHover={onHover}
                spec={{
                    name: "Dilute Stream Feed Pump (P-101)",
                    type: "Centrifugal Booster Pump",
                    flow: `${(feedWater.flowRate || 10).toFixed(1)} L/min`,
                    pressure: "2.5 bar"
                }}
            />

            {/* Product Tank */}
            <TankComponent
                x={prodTankX}
                y={prodTankY}
                width={prodTankW}
                height={prodTankH}
                fillLevel={0.82}
                tag="TK-102"
                label="Product Tank"
                color="#16A34A"
                onHover={onHover}
                spec={{
                    name: "Desalinated Product Water Tank (TK-102)",
                    type: "Potable / Industrial Storage Tank",
                    targetTds: `${(engineering.outletTDS || 50).toFixed(0)} mg/L`
                }}
            />

            {/* --- ED MULTI-CELL MEMBRANE STACK (R-101) --- */}
            <g
                id="ed_stack_core"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => onHover && onHover(edStackSpec, e)}
                onMouseLeave={() => onHover && onHover(null)}
                onClick={() => onClickEquipment && onClickEquipment(edStackSpec)}
            >
                {/* Stack Outer Housing */}
                <rect
                    x={stackX}
                    y={stackY}
                    width={stackWidth}
                    height={stackHeight}
                    rx="8"
                    fill="#F8FAFC"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                />

                {/* Header Banner */}
                <rect x={stackX} y={stackY} width={stackWidth} height="26" rx="8" fill="#1E3A8A" />
                <rect x={stackX} y={stackY + 16} width={stackWidth} height="10" fill="#1E3A8A" />
                <text x={stackX + stackWidth / 2} y={stackY + 17} textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="700">
                    ED REPEATING MEMBRANE STACK (R-101)
                </text>

                {/* Anode (+) Terminal (Left) */}
                <rect x={stackX + 12} y={stackY + 34} width="16" height={stackHeight - 44} fill="#DC2626" rx="3" />
                <text x={stackX + 20} y={stackY + 54} fill="#FFFFFF" fontSize="11" fontWeight="900" textAnchor="middle">+</text>
                <text x={stackX + 20} y={stackY + stackHeight - 20} fill="#FFFFFF" fontSize="7.5" fontWeight="700" textAnchor="middle">ANODE</text>

                {/* Cathode (-) Terminal (Right) */}
                <rect x={stackX + stackWidth - 28} y={stackY + 34} width="16" height={stackHeight - 44} fill="#2563EB" rx="3" />
                <text x={stackX + stackWidth - 20} y={stackY + 54} fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle">-</text>
                <text x={stackX + stackWidth - 20} y={stackY + stackHeight - 20} fill="#FFFFFF" fontSize="7.5" fontWeight="700" textAnchor="middle">CATHODE</text>

                {/* Multi-Cell Alternating Membrane Pairs (CEM = Green, AEM = Orange) */}
                {[0, 1, 2, 3, 4].map((i) => {
                    const stepX = stackX + 44 + i * 40;
                    return (
                        <g key={`ed_cell_${i}`}>
                            {/* CEM Membrane */}
                            <line x1={stepX} y1={stackY + 34} x2={stepX} y2={stackY + stackHeight - 14} stroke="#10B981" strokeWidth="3" />
                            {/* Dilute Channel Spacer */}
                            <rect x={stepX + 3} y={stackY + 36} width="14" height={stackHeight - 52} fill="#E0F2FE" opacity="0.8" />
                            <text x={stepX + 10} y={stackY + 70} fill="#0369A1" fontSize="7.5" fontWeight="800" textAnchor="middle">D</text>

                            {/* AEM Membrane */}
                            <line x1={stepX + 20} y1={stackY + 34} x2={stepX + 20} y2={stackY + stackHeight - 14} stroke="#F59E0B" strokeWidth="3" />
                            {/* Concentrate Channel Spacer */}
                            <rect x={stepX + 23} y={stackY + 36} width="14" height={stackHeight - 52} fill="#FEE2E2" opacity="0.8" />
                            <text x={stepX + 30} y={stackY + 70} fill="#B91C1C" fontSize="7.5" fontWeight="800" textAnchor="middle">C</text>
                        </g>
                    );
                })}

                {/* Stack Legend at Bottom */}
                <rect x={stackX + 36} y={stackY + stackHeight - 20} width={stackWidth - 72} height="14" fill="#E2E8F0" rx="3" />
                <circle cx={stackX + 48} cy={stackY + stackHeight - 13} r="3" fill="#10B981" />
                <text x={stackX + 56} y={stackY + stackHeight - 10} fontSize="7.5" fill="#334155" fontWeight="600">CEM</text>

                <circle cx={stackX + 90} cy={stackY + stackHeight - 13} r="3" fill="#F59E0B" />
                <text x={stackX + 98} y={stackY + stackHeight - 10} fontSize="7.5" fill="#334155" fontWeight="600">AEM</text>

                <rect x={stackX + 130} y={stackY + stackHeight - 16} width="8" height="6" fill="#E0F2FE" stroke="#0284C7" strokeWidth="0.5" />
                <text x={stackX + 142} y={stackY + stackHeight - 10} fontSize="7.5" fill="#334155" fontWeight="600">Dilute (D)</text>

                <rect x={stackX + 190} y={stackY + stackHeight - 16} width="8" height="6" fill="#FEE2E2" stroke="#DC2626" strokeWidth="0.5" />
                <text x={stackX + 202} y={stackY + stackHeight - 10} fontSize="7.5" fill="#334155" fontWeight="600">Conc (C)</text>
            </g>
        </g>
    );
}
