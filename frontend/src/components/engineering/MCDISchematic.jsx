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
 * Dedicated MCDI process schematic with enlarged equipment, uniform CY = 200 alignment,
 * porous carbon electrodes, AEM & CEM membranes, and clean vector flow lines.
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
    onHover = null,
    onClickEquipment = null
}) {
    const CY = 200;
    const cellPairsNum = Number(engineering.cellPairs || labels.cellPairs || 95);
    const electrodeAreaNum = Number(engineering.electrodeArea || 150);
    const spacerThicknessNum = Number(engineering.spacerThickness || 0.5);
    const electrodeThicknessNum = Number(engineering.electrodeThickness || 0.6);

    // DYNAMIC PARAMETRIC GEOMETRY (Responds to design inputs)
    const stackWidth = Math.min(310, Math.max(210, 210 + (electrodeAreaNum - 100) * 0.7));
    const stackHeight = Math.min(250, Math.max(150, 140 + (cellPairsNum - 20) * 0.9));
    const electrodeThicknessPx = Math.min(16, Math.max(8, 8 + (electrodeThicknessNum - 0.3) * 10));
    const stackY = CY - stackHeight / 2;

    // Equipment positions
    const tank1X = 35;
    const tank1Width = 100;
    const tank1Height = 140;
    const tank1Y = CY - tank1Height / 2;

    const pumpX = tank1X + tank1Width + 65;
    const pumpR = 26;

    const flowMeterX = pumpX + pumpR + 50;

    const stackX = flowMeterX + 55;

    const tank2X = stackX + stackWidth + 95;
    const tank2Width = tank1Width;
    const tank2Height = tank1Height;
    const tank2Y = CY - tank2Height / 2;

    const isDesorption = cycleStep === "REGENERATION";
    const { voltage = 1.2, current = 15.0, currentDensity = 94.7 } = electrical;

    const displayVoltage = isDesorption ? -Math.abs(voltage) : Math.abs(voltage);
    const displayCurrent = isDesorption ? -Math.abs(current) : Math.abs(current);

    const reactorSpec = {
        name: `MCDI Membrane Stack Reactor (R-101) [${cellPairsNum} Pairs]`,
        tag: "R-101",
        type: "Membrane Capacitive Deionization Reactor",
        cellPairs: `${cellPairsNum} pairs`,
        voltage: `${displayVoltage.toFixed(2)} V`,
        current: `${displayCurrent.toFixed(2)} A`,
        currentDensity: `${currentDensity.toFixed(1)} A/m²`,
        electrodeArea: `${electrodeAreaNum} cm²`,
        membranes: "AEM & CEM Ion Exchange Membranes (>98% Selectivity)",
        chargeEfficiency: ">92.0% (Blocks Co-Ion Repulsion)",
        operatingMode: isDesorption ? "Desorption / Regeneration (-V)" : "Adsorption / Desalting (+V)",
        dimensions: `${stackWidth.toFixed(0)}mm L × ${stackHeight.toFixed(0)}mm H`
    };

    return (
        <g id="mcdi_dedicated_schematic">
            {/* DC Power Supply Unit & Wires */}
            <g transform={`translate(${stackX - 45}, ${CY - 20})`}>
                <rect x="0" y="0" width="30" height="40" fill="#FFFFFF" stroke="#475569" strokeWidth="1.5" rx="4" />
                <text x="15" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0F172A">DC</text>
                <text x="15" y="28" textAnchor="middle" fontSize="8" fontWeight="600" fill="#64748B">PWR</text>
            </g>

            {/* DC Electrical Supply Lines to Electrodes */}
            <path d={`M ${stackX - 30} ${CY - 10} L ${stackX - 10} ${CY - 10} L ${stackX - 10} ${stackY + 28} L ${stackX + 20} ${stackY + 28}`} stroke="#EF4444" strokeWidth="1.8" strokeDasharray="3,2" fill="none" />
            <path d={`M ${stackX - 30} ${CY + 10} L ${stackX - 10} ${CY + 10} L ${stackX - 10} ${stackY + stackHeight - 28} L ${stackX + 20} ${stackY + stackHeight - 28}`} stroke="#3B82F6" strokeWidth="1.8" strokeDasharray="3,2" fill="none" />

            {/* Pipelines */}
            <FlowAnimation
                pathD={`M ${tank1X + tank1Width} ${CY} L ${pumpX - pumpR} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#0284C7"
                strokeWidth={3.5}
            />
            <FlowAnimation
                pathD={`M ${pumpX + pumpR} ${CY} L ${flowMeterX - 16} ${CY}`}
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

            {/* Flow Meter FM-101 */}
            <g transform={`translate(${flowMeterX}, ${CY})`} style={{ cursor: "pointer" }} onClick={() => onClickEquipment && onClickEquipment({ name: "Flow Meter FM-101", tag: "FM-101", type: "Electromagnetic Flowmeter", flowRate: `${(feedWater.flowRate || 10).toFixed(1)} L/min` })}>
                <circle cx="0" cy="0" r="15" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" />
                <path d="M -9 -7 L 9 7 M -9 7 L 9 -7" stroke="#0284C7" strokeWidth="2" />
                <text x="0" y="26" textAnchor="middle" fontWeight="700" fontSize="10" fill="#0284C7">FM-101</text>
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
                r={pumpR}
                flowRate={feedWater.flowRate || 10}
                pressure={feedWater.pressure || 1.0}
                tag="P-101"
                name="Feed Pump"
                type="Centrifugal Pump"
                onHover={onHover}
                onClick={onClickEquipment}
            />

            {/* Equipment 3: MCDI Reactor Stack Module */}
            <g
                onMouseEnter={(e) => onHover && onHover(reactorSpec, e)}
                onMouseLeave={() => onHover && onHover(null)}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onClickEquipment) onClickEquipment(reactorSpec);
                }}
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

                {/* Operating Mode Banner */}
                <text x={stackX + stackWidth / 2} y={stackY + 16} textAnchor="middle" fontSize="9" fontWeight="700" fill={isDesorption ? "#DC2626" : "#16A34A"}>
                    {isDesorption ? "● DESORPTION MODE (-V)" : "● ADSORPTION MODE (+V)"}
                </text>

                {/* Positive Anode / Cathode Polarity Label */}
                <text x={stackX + 25} y={stackY + 31} fontSize="8.5" fontWeight="700" fill="#EF4444">
                    {isDesorption ? "Cathode (-)" : "Anode (+)"} — AEM Attached
                </text>

                {/* Positive Anode Electrode */}
                <ElectrodeComponent
                    x={stackX + 20}
                    y={stackY + 34}
                    width={stackWidth - 40}
                    height={12}
                    polarity={isDesorption ? "negative" : "positive"}
                    currentDensity={currentDensity}
                    onHover={onHover}
                />

                {/* Anion Exchange Membrane (AEM) & Direction Label */}
                <MembraneComponent
                    x={stackX + 20}
                    y={stackY + 50}
                    width={stackWidth - 40}
                    thickness={6}
                    type="AEM"
                    onHover={onHover}
                />
                <text x={stackX + stackWidth - 25} y={stackY + 46} textAnchor="end" fontSize="8" fontWeight="700" fill="#7C3AED">
                    AEM (Anions ↑)
                </text>

                {/* Central Water Channel */}
                <rect
                    x={stackX + 20}
                    y={stackY + 62}
                    width={stackWidth - 40}
                    height={stackHeight - 124}
                    fill="#E0F2FE"
                    stroke="#7DD3FC"
                    strokeWidth="0.8"
                    strokeDasharray="4,2"
                />

                {/* Sleek Animated Ion Particles (Cl- Anions & Na+ Cations) */}
                {Array.from({ length: 6 }).map((_, i) => {
                    const ionX = stackX + 45 + (i * (stackWidth - 90)) / 5;
                    const offset = (particleOffset + i * 14) % 22;
                    return (
                        <g key={`mcdi_ion_${i}`}>
                            <circle cx={ionX} cy={stackY + 62 - offset * 0.5} r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.95" />
                            <circle cx={ionX + 10} cy={stackY + stackHeight - 62 + offset * 0.5} r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.95" />
                        </g>
                    );
                })}

                {/* Cation Exchange Membrane (CEM) & Direction Label */}
                <MembraneComponent
                    x={stackX + 20}
                    y={stackY + stackHeight - 56}
                    width={stackWidth - 40}
                    thickness={6}
                    type="CEM"
                    onHover={onHover}
                />
                <text x={stackX + stackWidth - 25} y={stackY + stackHeight - 60} textAnchor="end" fontSize="8" fontWeight="700" fill="#2563EB">
                    CEM (Cations ↓)
                </text>

                {/* Negative Cathode Electrode */}
                <ElectrodeComponent
                    x={stackX + 20}
                    y={stackY + stackHeight - 44}
                    width={stackWidth - 40}
                    height={12}
                    polarity={isDesorption ? "positive" : "negative"}
                    currentDensity={currentDensity}
                    onHover={onHover}
                />

                {/* Negative Cathode / Anode Polarity Label */}
                <text x={stackX + 25} y={stackY + stackHeight - 31} fontSize="8.5" fontWeight="700" fill="#3B82F6">
                    {isDesorption ? "Anode (+)" : "Cathode (-)"} — CEM Attached
                </text>

                {/* Tag Header */}
                <rect x={stackX + stackWidth / 2 - 40} y={stackY - 18} width="80" height="16" fill={isDesorption ? "#DC2626" : "#0284C7"} rx="4" />
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
