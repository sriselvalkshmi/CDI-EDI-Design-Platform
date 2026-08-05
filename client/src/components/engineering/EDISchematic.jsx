import React from "react";
import TankComponent from "./TankComponent";
import PumpComponent from "./PumpComponent";
import MembraneComponent from "./MembraneComponent";
import FlowAnimation from "./FlowAnimation";
import ElectricFieldOverlay from "./ElectricFieldOverlay";
import InstrumentationLayer from "./InstrumentationLayer";

/**
 * EDISchematic
 * Dedicated EDI process schematic featuring RO permeate feed pretreatment, booster pump,
 * Titanium MMO electrodes, alternating CEM & AEM membranes, mixed-bed ion-exchange resin beads,
 * concentrate/dilute outlets, electrolytic water splitting (H+/OH-) resin regeneration, and ultra-pure water storage tank.
 */
export default function EDISchematic({
    geometry = {},
    electrical = {},
    labels = {},
    feedWater = {},
    engineering = {},
    particleOffset = 0,
    onHover = null
}) {
    const CY = 200;
    const { plateWidthPx = 220, stackHeightPx = 180, pumpRadiusPx = 24, tankWidthPx = 100, tankHeightPx = 130 } = geometry;
    const { voltage = 15.0 } = electrical;

    const tank1X = 40;
    const tank1Width = Math.max(90, Math.min(130, tankWidthPx));
    const tank1Height = Math.max(120, Math.min(160, tankHeightPx));
    const tank1Y = CY - tank1Height / 2;

    const pumpX = tank1X + tank1Width + 90;
    const pumpR = Math.max(20, Math.min(36, pumpRadiusPx));

    const stackX = pumpX + pumpR + 110;
    const stackWidth = Math.max(160, Math.min(280, plateWidthPx + 60));
    const stackHeight = Math.max(150, Math.min(260, stackHeightPx));
    const stackY = CY - stackHeight / 2;

    const tank2X = stackX + stackWidth + 120;
    const tank2Width = tank1Width;
    const tank2Height = tank1Height;
    const tank2Y = CY - tank2Height / 2;

    const outTdsVal = Number(engineering.outletTDS ?? feedWater.targetTds ?? 5);
    const condVal = outTdsVal / 0.65;
    const resVal = 0.65 / Math.max(0.001, outTdsVal);
    const ctValue = outTdsVal <= 0.03 ? `${outTdsVal.toFixed(2)} ppm (18.2 MΩ·cm Ultrapure)` : `${outTdsVal.toFixed(1)} ppm (${condVal.toFixed(1)} µS/cm, ${resVal.toFixed(3)} MΩ·cm)`;
    const ctLabel = outTdsVal <= 0.03 ? "Ultra-Pure Resistivity" : "Product Conductivity & Resistivity";

    return (
        <g id="edi_dedicated_schematic">

            {/* Pipelines */}
            <FlowAnimation
                pathD={`M ${tank1X + tank1Width} ${CY} L ${pumpX - pumpR} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#7C3AED"
                strokeWidth={3.5}
            />
            <FlowAnimation
                pathD={`M ${pumpX + pumpR} ${CY} L ${stackX} ${CY}`}
                flowRate={feedWater.flowRate || 10}
                stroke="#7C3AED"
                strokeWidth={3.5}
            />

            {/* Product Dilute Stream */}
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

            {/* Concentrate Waste Stream Outlet (Bottom Line) */}
            <path d={`M ${stackX + stackWidth / 2} ${stackY + stackHeight} L ${stackX + stackWidth / 2} 370 L ${tank2X + tank2Width / 2} 370`} stroke="#D97706" strokeWidth="2.5" strokeDasharray="5,3" fill="none" />
            <text x={tank2X + tank2Width / 2 + 10} y="374" fill="#D97706" fontWeight="700" fontSize="10">Concentrate Waste Stream</text>

            {/* ANSI Instrumentation Tags */}
            <InstrumentationLayer
                x={(tank1X + tank1Width + pumpX - pumpR) / 2}
                y={CY - 28}
                tag="FT101"
                type="FT"
                value={`${(feedWater.flowRate || 10).toFixed(1)} L/min`}
                label="RO Permeate Flow"
                onHover={onHover}
            />
            <InstrumentationLayer
                x={(pumpX + pumpR + stackX) / 2}
                y={CY - 28}
                tag="PI101"
                type="PI"
                value={`${(feedWater.pressure || 3.5).toFixed(1)} bar`}
                label="EDI Inlet Pressure"
                onHover={onHover}
            />
            <InstrumentationLayer
                x={(stackX + stackWidth + tank2X) / 2}
                y={CY - 28}
                tag="CT101"
                type="CT"
                value={ctValue}
                label={ctLabel}
                onHover={onHover}
            />

            {/* Equipment 1: EDI Pre-treatment Feed Tank */}
            <TankComponent
                x={tank1X}
                y={tank1Y}
                width={tank1Width}
                height={tank1Height}
                tag="TK-101"
                name="EDI Feed Tank (RO Permeate)"
                type="process"
                flowRate={feedWater.flowRate || 10}
                tds={feedWater.tds || 25}
                material="FRP Composite / Polypropylene"
                onHover={onHover}
            />

            {/* Equipment 2: High Pressure Booster Pump */}
            <PumpComponent
                cx={pumpX}
                cy={CY}
                flowRate={feedWater.flowRate || 10}
                pressure={3.5}
                tag="P-101"
                name="EDI Booster Pump"
                type="Multi-Stage Centrifugal Pump"
                onHover={onHover}
            />

            {/* Equipment 3: EDI Ultra-Pure Module Stack */}
            <g
                onMouseEnter={(e) => onHover && onHover({
                    name: "EDI Continuous Resin Module Stack (R-101)",
                    type: "Electrodeionization Ultra-Pure Stack",
                    electrodeMaterial: "Titanium Grade 2 (Mixed Metal Oxide Coating)",
                    waterQuality: outTdsVal > 1.0 ? `${outTdsVal.toFixed(1)} ppm (${condVal.toFixed(1)} µS/cm)` : "Type I Ultra-Pure (Up to 18.2 MΩ·cm)",
                    resinRegeneration: "Continuous Electrolytic Water Splitting (H+ / OH-)",
                    resinVolume: `${engineering.resinVolumeLiters || ((labels.cellPairs || 36) * 0.05).toFixed(2)} L (${engineering.resinWeightKg || "0.35"} kg)`,
                    cellPairs: labels.cellPairs,
                    voltage: labels.voltage,
                    current: labels.current,
                    silicaRemoval: ">99.5%",
                    dimensions: `${stackWidth}px L x ${stackHeight}px H`
                }, e)}
                onMouseLeave={() => onHover && onHover(null)}
                style={{ cursor: "pointer" }}
            >
                <rect x={stackX} y={stackY} width={stackWidth} height={stackHeight} fill="#FFFFFF" stroke="#7C3AED" strokeWidth="3.5" rx="12" />
                <ElectricFieldOverlay x={stackX + 10} y={stackY + 10} width={stackWidth - 20} height={stackHeight - 20} voltage={voltage} technology="EDI" />

                <rect x={stackX + stackWidth / 2 - 75} y={stackY - 18} width="150" height="16" fill="#7C3AED" rx="4" />
                <text x={stackX + stackWidth / 2} y={stackY - 6} textAnchor="middle" fill="#FFFFFF" fontWeight="800" fontSize="9.5">EDI TITANIUM MMO STACK R-101</text>

                {/* Electrode Rinse Lines (Anolyte & Catholyte Rinse Streams) */}
                <path d={`M ${stackX + 23} ${stackY + 30} L ${stackX + 23} ${stackY - 5}`} stroke="#EF4444" strokeWidth="2" strokeDasharray="3,3" />
                <text x={stackX + 23} y={stackY - 8} textAnchor="middle" fill="#EF4444" fontSize="8" fontWeight="800">Anolyte Rinse</text>

                <path d={`M ${stackX + stackWidth - 23} ${stackY + 30} L ${stackX + stackWidth - 23} ${stackY - 5}`} stroke="#2563EB" strokeWidth="2" strokeDasharray="3,3" />
                <text x={stackX + stackWidth - 23} y={stackY - 8} textAnchor="middle" fill="#2563EB" fontSize="8" fontWeight="800">Catholyte Rinse</text>

                {/* Titanium MMO Anode (+) Terminal */}
                <rect x={stackX + 14} y={stackY + 30} width="18" height={stackHeight - 50} fill="#DC2626" rx="3" />
                <text x={stackX + 23} y={CY} textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="9" transform={`rotate(-90 ${stackX + 23} ${CY})`}>ANODE (+) MMO</text>

                {/* CEM Membrane */}
                <MembraneComponent x={stackX + 36} y={stackY + 30} width={7} thickness={stackHeight - 50} type="CEM" onHover={onHover} />
                <text x={stackX + 39} y={stackY + 22} textAnchor="middle" fill="#DC2626" fontSize="8" fontWeight="900">CEM</text>

                {/* Diluate (Product) Channel & Mixed-Bed Resin Chamber */}
                <rect x={stackX + 47} y={stackY + 30} width={stackWidth - 94} height={stackHeight - 50} fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" rx="4" />
                <text x={stackX + 47 + (stackWidth - 94) / 2} y={stackY + 42} textAnchor="middle" fill="#92400E" fontSize="9.5" fontWeight="900">DILUATE (PRODUCT) RESIN BED</text>
                <text x={stackX + 47 + (stackWidth - 94) / 2} y={stackHeight + stackY - 26} textAnchor="middle" fill="#B45309" fontSize="8" fontWeight="800">SAC (Cation) + SBA (Anion) Resin Beads</text>

                {/* Electrolytic Water Splitting In-Situ Regeneration (H+ and OH-) */}
                <g id="water_splitting_ions">
                    <circle cx={stackX + 65} cy={CY - 15} r="4" fill="#10B981" />
                    <text x={stackX + 65} y={CY - 12.5} textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900">H+</text>

                    <circle cx={stackX + stackWidth - 65} cy={CY + 15} r="4" fill="#8B5CF6" />
                    <text x={stackX + stackWidth - 65} y={CY + 17.5} textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900">OH-</text>
                </g>

                {/* Animated Ion Migration (Na+ -> Cathode, Cl- -> Anode) */}
                {Array.from({ length: 6 }).map((_, iIdx) => {
                    const ionX = stackX + 60 + (iIdx % 3) * ((stackWidth - 120) / 2);
                    const ionY = stackY + 58 + Math.floor(iIdx / 3) * 45;
                    const offsetPos = (particleOffset + iIdx * 15) % 30;

                    return (
                        <g key={`ionMig_${iIdx}`}>
                            {/* Cl- migrating towards Anode (left) */}
                            <circle cx={Math.max(stackX + 45, ionX - offsetPos)} cy={ionY} r="4.5" fill="#EF4444" opacity="0.85" />
                            <text x={Math.max(stackX + 45, ionX - offsetPos)} y={ionY + 2.5} textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="900">Cl-</text>

                            {/* Na+ migrating towards Cathode (right) */}
                            <circle cx={Math.min(stackX + stackWidth - 45, ionX + offsetPos)} cy={ionY + 20} r="4.5" fill="#3B82F6" opacity="0.85" />
                            <text x={Math.min(stackX + stackWidth - 45, ionX + offsetPos)} y={ionY + 22.5} textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="900">Na+</text>
                        </g>
                    );
                })}

                {/* Ion Exchange Resin Beads (Cation: SAC / Anion: SBA) */}
                {Array.from({ length: 24 }).map((_, bIdx) => {
                    const bx = stackX + 58 + (bIdx % 6) * ((stackWidth - 116) / 5);
                    const by = stackY + 75 + Math.floor(bIdx / 6) * ((stackHeight - 120) / 4);
                    const isCation = bIdx % 2 === 0;

                    return (
                        <circle
                            key={`bead_${bIdx}`}
                            cx={bx}
                            cy={by}
                            r="5.5"
                            fill={isCation ? "#3B82F6" : "#F59E0B"}
                            stroke={isCation ? "#1D4ED8" : "#D97706"}
                            strokeWidth="1"
                        />
                    );
                })}

                {/* AEM Membrane */}
                <MembraneComponent x={stackX + stackWidth - 43} y={stackY + 30} width={7} thickness={stackHeight - 50} type="AEM" onHover={onHover} />
                <text x={stackX + stackWidth - 40} y={stackY + 22} textAnchor="middle" fill="#2563EB" fontSize="8" fontWeight="900">AEM</text>

                {/* Titanium MMO Cathode (-) Terminal */}
                <rect x={stackX + stackWidth - 32} y={stackY + 30} width="18" height={stackHeight - 50} fill="#2563EB" rx="3" />
                <text x={stackX + stackWidth - 23} y={CY} textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="9" transform={`rotate(-90 ${stackX + stackWidth - 23} ${CY})`}>CATHODE (-) MMO</text>
            </g>

            {/* EDI Ultrapure Callout Banner */}
            <g transform={`translate(${stackX}, ${stackY + stackHeight + 12})`}>
                <rect width={stackWidth} height="32" fill="#FAF5FF" stroke="#E9D5FF" strokeWidth="1" rx="6" />
                <text x="8" y="14" fontSize="8.5" fontWeight="800" fill="#6B21A8">💎 EDI Ultrapure Polishing Performance:</text>
                <text x="8" y="25" fontSize="8" fontWeight="600" fill="#7E22CE">● Up to 18.2 MΩ·cm (&lt;0.03 ppm) ● H+/OH- water splitting resin regeneration</text>
            </g>

            {/* Equipment 4: Ultra-Pure Product Storage Tank */}
            <TankComponent
                x={tank2X}
                y={tank2Y}
                width={tank2Width}
                height={tank2Height}
                tag="TK-102"
                name="Product Water Tank (Ultrapure)"
                type="product"
                flowRate={feedWater.flowRate || 10}
                tds={outTdsVal}
                material="PVDF / High Purity 316L"
                onHover={onHover}
            />
        </g>
    );
}
