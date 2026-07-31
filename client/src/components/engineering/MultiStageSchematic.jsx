import React from "react";
import TankComponent from "./TankComponent";
import PumpComponent from "./PumpComponent";
import FlowAnimation from "./FlowAnimation";
import InstrumentationLayer from "./InstrumentationLayer";

/**
 * MultiStageSchematic
 * Renders sequential multi-stage desalination process architecture when target TDS
 * requires multi-stage treatment (e.g. Stage 1 FCDI bulk desalting -> Intermediate Tank -> Stage 2 EDI polishing).
 */
export default function MultiStageSchematic({
    geometry = {},
    electrical = {},
    labels = {},
    feedWater = {},
    engineering = {},
    particleOffset = 0,
    onHover = null
}) {
    const CY = 200;
    const flowRate = feedWater.flowRate || 10;
    const inletTDS = feedWater.tds || 5000;
    const intermediateTDS = Math.round(inletTDS * 0.35); // Stage 1 output (1738 ppm)
    const finalTDS = Number(engineering.outletTDS || 50);

    return (
        <g id="multi_stage_process_schematic">
            {/* Stage 1 Pipeline (Feed Tank -> Pump P-101 -> Stage 1 FCDI Reactor) */}
            <FlowAnimation
                pathD={`M 140 ${CY} L 220 ${CY}`}
                flowRate={flowRate}
                stroke="#0284C7"
                strokeWidth={3.5}
            />
            <FlowAnimation
                pathD={`M 260 ${CY} L 320 ${CY}`}
                flowRate={flowRate}
                stroke="#0284C7"
                strokeWidth={3.5}
            />
            {/* Stage 1 to Intermediate Tank TK-102 Pipeline */}
            <FlowAnimation
                pathD={`M 440 ${CY} L 500 ${CY}`}
                flowRate={flowRate}
                stroke="#F59E0B"
                strokeWidth={3.5}
                showIons={true}
                particleOffset={particleOffset}
                ionStartX={445}
                ionStartY={CY}
                ionDistance={50}
            />

            {/* Intermediate Tank TK-102 to Stage 2 Pump P-102 Pipeline */}
            <FlowAnimation
                pathD={`M 600 ${CY} L 660 ${CY}`}
                flowRate={flowRate}
                stroke="#F59E0B"
                strokeWidth={3.5}
            />
            {/* Stage 2 Pump P-102 to Stage 2 EDI Stack Pipeline */}
            <FlowAnimation
                pathD={`M 700 ${CY} L 760 ${CY}`}
                flowRate={flowRate}
                stroke="#7C3AED"
                strokeWidth={3.5}
            />
            {/* Stage 2 EDI Stack to Final Product Tank TK-103 Pipeline */}
            <FlowAnimation
                pathD={`M 880 ${CY} L 940 ${CY}`}
                flowRate={flowRate}
                stroke="#16A34A"
                strokeWidth={3.5}
                showIons={true}
                particleOffset={particleOffset}
                ionStartX={885}
                ionStartY={CY}
                ionDistance={50}
            />

            {/* Instrumentation Tags */}
            <InstrumentationLayer x={180} y={CY - 28} tag="FT101" type="FT" value={`${flowRate} L/min`} label="Feed Flow" onHover={onHover} />
            <InstrumentationLayer x={470} y={CY - 28} tag="CT102" type="CT" value={`${intermediateTDS} ppm`} label="Intermediate TDS" onHover={onHover} />
            <InstrumentationLayer x={910} y={CY - 28} tag="CT103" type="CT" value={`${finalTDS} ppm`} label="Final Product TDS" onHover={onHover} />

            {/* Equipment 1: Feed Tank TK-101 */}
            <TankComponent
                x={40}
                y={CY - 60}
                width={100}
                height={120}
                tag="TK-101"
                name="Feed Tank"
                type="process"
                flowRate={flowRate}
                tds={inletTDS}
                onHover={onHover}
            />

            {/* Equipment 2: Feed Pump P-101 */}
            <PumpComponent
                cx={240}
                cy={CY}
                flowRate={flowRate}
                tag="P-101"
                name="Stage 1 Feed Pump"
                onHover={onHover}
            />

            {/* Equipment 3: Stage 1 FCDI Reactor Module */}
            <g
                onMouseEnter={(e) => onHover && onHover({
                    name: "Stage 1: FCDI Bulk Desalting Reactor (FCDI-101)",
                    type: "Flow-Electrode Reactor (Stage 1 Bulk Desalting)",
                    inletTDS: `${inletTDS} ppm`,
                    outletTDS: `${intermediateTDS} ppm`,
                    removal: "65.2% Bulk Removal",
                    status: "STAGE 1 ACTIVE"
                }, e)}
                onMouseLeave={() => onHover && onHover(null)}
                style={{ cursor: "pointer" }}
            >
                <rect x={320} y={CY - 65} width={120} height={130} fill="#FFFFFF" stroke="#4F46E5" strokeWidth="3" rx="8" />
                <rect x={330} y={CY - 50} width={100} height={100} fill="#EEF2FF" rx="4" />
                <text x={380} y={CY - 10} textAnchor="middle" fontWeight="900" fontSize="12" fill="#312E81">STAGE 1</text>
                <text x={380} y={CY + 10} textAnchor="middle" fontWeight="800" fontSize="11" fill="#4338CA">FCDI Bulk</text>
                <text x={380} y={CY + 28} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#6366F1">{intermediateTDS} ppm</text>
                <rect x={340} y={CY - 80} width="80" height="15" fill="#4F46E5" rx="3" />
                <text x={380} y={CY - 69} textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800">FCDI-101</text>
            </g>

            {/* Equipment 4: Intermediate Buffer Tank TK-102 */}
            <TankComponent
                x={500}
                y={CY - 60}
                width={100}
                height={120}
                tag="TK-102"
                name="Buffer Tank"
                type="process"
                flowRate={flowRate}
                tds={intermediateTDS}
                onHover={onHover}
            />

            {/* Equipment 5: Stage 2 Booster Pump P-102 */}
            <PumpComponent
                cx={680}
                cy={CY}
                flowRate={flowRate}
                tag="P-102"
                name="Stage 2 Booster Pump"
                onHover={onHover}
            />

            {/* Equipment 6: Stage 2 EDI Polishing Stack Module */}
            <g
                onMouseEnter={(e) => onHover && onHover({
                    name: "Stage 2: EDI Polishing Stack Module (EDI-101)",
                    type: "Electrodeionization Polishing Stack (Stage 2)",
                    inletTDS: `${intermediateTDS} ppm`,
                    outletTDS: `${finalTDS} ppm`,
                    removal: ">97.1% High Purity Polishing",
                    status: "STAGE 2 ACTIVE"
                }, e)}
                onMouseLeave={() => onHover && onHover(null)}
                style={{ cursor: "pointer" }}
            >
                <rect x={760} y={CY - 65} width={120} height={130} fill="#FFFFFF" stroke="#7C3AED" strokeWidth="3" rx="8" />
                <rect x={770} y={CY - 50} width={100} height={100} fill="#F5F3FF" rx="4" />
                <text x={820} y={CY - 10} textAnchor="middle" fontWeight="900" fontSize="12" fill="#4C1D95">STAGE 2</text>
                <text x={820} y={CY + 10} textAnchor="middle" fontWeight="800" fontSize="11" fill="#6D28D9">EDI Polishing</text>
                <text x={820} y={CY + 28} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#7C3AED">{finalTDS} ppm</text>
                <rect x={780} y={CY - 80} width="80" height="15" fill="#7C3AED" rx="3" />
                <text x={820} y={CY - 69} textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800">EDI-101</text>
            </g>

            {/* Equipment 7: Final Ultra-Pure Product Tank TK-103 */}
            <TankComponent
                x={940}
                y={CY - 60}
                width={100}
                height={120}
                tag="TK-103"
                name="Product Tank"
                type="product"
                flowRate={flowRate}
                tds={finalTDS}
                onHover={onHover}
            />
        </g>
    );
}
