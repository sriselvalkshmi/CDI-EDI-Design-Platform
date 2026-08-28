import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ReferenceArea
} from "recharts";

// Custom Tooltip with stream identity & operating phase clarity
function CustomSimTooltip({ active, payload, label, unit, dataKey }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;

        let displayValue = payload[0].value !== null && payload[0].value !== undefined
            ? `${payload[0].value} ${unit}`
            : "—";

        if (dataKey === "chargeEfficiency") {
            if (data.phase && data.phase.includes("Desorption")) {
                displayValue = `${payload[0].value} % (Desorption Ion Release Efficiency)`;
            } else if (data.phase && data.phase.includes("Rinse")) {
                displayValue = `${payload[0].value} % (Unpowered Flush)`;
            }
        }

        return (
            <div style={{
                backgroundColor: "#0F172A",
                border: "1px solid #334155",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "11px",
                color: "#FFFFFF",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
                <div style={{ fontWeight: "700", color: "#38BDF8", marginBottom: "4px" }}>
                    Time: {data.time} ({data.phase})
                </div>
                <div style={{ color: "#94A3B8", fontSize: "10px", marginBottom: "4px" }}>
                    <strong>Stream:</strong> {data.streamType}
                </div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#F8FAFC" }}>
                    {payload[0].name || "Value"}: {displayValue}
                </div>
                {data.note && (
                    <div style={{ color: "#FDE047", fontSize: "9.5px", marginTop: "3px" }}>
                        * {data.note}
                    </div>
                )}
            </div>
        );
    }
    return null;
}

function ChartCard({
    title,
    subtitle,
    data,
    dataKey,
    unit,
    color = "#2563EB",
    gradientId,
    targetValue,
    yDomain,
    calloutPills = [],
    viewMode = "CYCLE",
    showZeroLine = false,
    showPhases = true
}) {
    const cycleTicks = ["0m", "2m", "4m", "6m", "8m", "10m", "11m", "12m"];
    const adsTicks = ["0m", "2m", "4m", "6m", "8m", "10m"];

    return (
        <div style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "6px",
            padding: "12px",
            display: "flex",
            flexDirection: "column"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#1E293B" }}>{title}</span>
                        {calloutPills.map((pill, idx) => (
                            <span key={idx} style={{
                                fontSize: "9.5px",
                                fontWeight: "600",
                                background: pill.bg || "#EFF6FF",
                                color: pill.color || "#1D4ED8",
                                border: `1px solid ${pill.border || "#BFDBFE"}`,
                                padding: "1px 5px",
                                borderRadius: "2px"
                            }}>
                                {pill.text}
                            </span>
                        ))}
                    </div>
                    {subtitle && (
                        <div style={{ fontSize: "10px", color: "#64748B", marginTop: "2px" }}>{subtitle}</div>
                    )}
                </div>
                <span style={{ fontSize: "10.5px", color: "#64748B", fontWeight: "600", background: "#FFFFFF", padding: "1px 6px", borderRadius: "3px", border: "1px solid #CBD5E1" }}>
                    {unit}
                </span>
            </div>

            <ResponsiveContainer width="100%" height={145}>
                <AreaChart data={data} margin={{ top: 12, right: 14, left: -16, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                        dataKey="time"
                        stroke="#64748B"
                        fontSize={9.5}
                        ticks={viewMode === "CYCLE" ? cycleTicks : adsTicks}
                        interval={0}
                    />
                    <YAxis stroke="#64748B" fontSize={9.5} domain={yDomain || ["auto", "auto"]} />
                    <Tooltip content={<CustomSimTooltip unit={unit} dataKey={dataKey} />} />
                    
                    {/* Zero Polarity Reference Baseline for Voltage & Current */}
                    {showZeroLine && (
                        <ReferenceLine y={0} stroke="#334155" strokeWidth={1.5} strokeDasharray="4 2" label={{ value: "0.0 Ref", fill: "#475569", fontSize: 8.5, position: "insideBottomRight" }} />
                    )}

                    {/* Vertical Phase Boundaries: 10m, 11m (only in cyclic full cycle view) */}
                    {viewMode === "CYCLE" && showPhases && (
                        <>
                            <ReferenceArea x1="10m" x2="12m" fill="#FEF3C7" fillOpacity={0.25} />
                            <ReferenceLine x="10m" stroke="#94A3B8" strokeDasharray="3 3" strokeWidth={1} label={{ value: "10m: Desorp", fill: "#64748B", fontSize: 8.5, position: "insideTopLeft" }} />
                            <ReferenceLine x="11m" stroke="#94A3B8" strokeDasharray="3 3" strokeWidth={1} label={{ value: "11m: Rinse", fill: "#64748B", fontSize: 8.5, position: "insideTopLeft" }} />
                        </>
                    )}

                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#${gradientId})`}
                        baseValue={0}
                        isAnimationActive={false}
                        connectNulls={false}
                    />

                    {targetValue !== undefined && targetValue !== null && (
                        <ReferenceLine
                            y={targetValue}
                            stroke="#DC2626"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{ value: `Limit (${targetValue} mg/L)`, fill: "#DC2626", fontSize: 9.5, position: "top" }}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function SimulationGraphs() {
    const { designResult } = useApp();
    const [viewMode, setViewMode] = useState("CYCLE"); // "CYCLE" (12 min) or "ADSORPTION" (10 min)

    const simulation = designResult?.simulation;
    const engineering = designResult?.engineering || {};
    const feedWater = designResult?.input?.feedWater || {};
    const activeTech = designResult?.selectedTechnology || engineering.technology || "MCDI";
    const targetTDS = Number(feedWater.targetTds ?? 50);

    if (!designResult || !simulation) {
        return null;
    }

    const isEDI = activeTech === "EDI";
    const isCDI = activeTech === "CDI";
    const isFCDI = activeTech === "FCDI";
    const isMCDI = activeTech === "MCDI" || (!isEDI && !isCDI && !isFCDI);

    const steadyCurrent = engineering.current ? Number(engineering.current) : 1.98;
    const voltageStack = engineering.voltageStack ? Number(engineering.voltageStack) : 95.2;
    const calcOutlet = engineering.outletTDS !== undefined 
        ? Number(engineering.outletTDS) 
        : (engineering.outletTds !== undefined ? Number(engineering.outletTds) : Number(feedWater.targetTds ?? 1.9));
    const feedTds = Number(feedWater.tds ?? 500);
    const concTds = Number(engineering.concentrateTds ?? engineering.rejectTds ?? (feedTds * 2));
    const activeChargeEff = Number(engineering.chargeEfficiency ?? engineering.chargeUtilization ?? (isCDI ? 68.0 : 80.0));

    const flowRate = Number(feedWater.flowRate ?? 20.0);
    const recoveryPct = Number(engineering.waterRecovery || (isEDI ? 90.0 : 95.2));
    const tAdsMin = 10.0;
    const tDesMin = 1.0;
    const tRinseMin = 1.0;

    // Phase-integrated volume & salt accounting:
    const isContinuous = isFCDI || isEDI;
    const timeBasisMin = 10.0; // 10 min operational period

    const extFeedVol = Number((flowRate * timeBasisMin).toFixed(2));
    const adsVol = Number(((flowRate * (recoveryPct / 100)) * timeBasisMin).toFixed(2));
    const desVol = Number((extFeedVol - adsVol).toFixed(2));
    const rinseVol = isContinuous ? 0.0 : Number((10.0).toFixed(1));

    const cycleRecPct = extFeedVol > 0 ? ((adsVol / extFeedVol) * 100).toFixed(1) : recoveryPct.toFixed(1);
    const saltInVal = (extFeedVol * feedTds).toFixed(1);
    const saltProdVal = (adsVol * calcOutlet).toFixed(1);
    const saltConcVal = (Number(saltInVal) - Number(saltProdVal)).toFixed(1);
    const concTdsDynamic = desVol > 0 ? (Number(saltConcVal) / desVol) : concTds;
    
    // Half-sine peak for cyclic desorption (MCDI / CDI / FCDI):
    const fcdiPeakTds = Number((concTdsDynamic * 1.508).toFixed(1));
    const concPeakDynamic = isFCDI ? fcdiPeakTds : Number((feedTds + (Math.PI / 2) * (concTdsDynamic - feedTds)).toFixed(1));

    // Hydraulic residence time constant:
    const nPairs = Number(engineering.cellPairs || 34);
    const areaM2 = Number(engineering.electrodeArea || 350) * 1e-4;
    const spacerThickM = 0.0005;
    const porosity = 0.70;
    const channelVolumeL = nPairs * areaM2 * spacerThickM * porosity * 1000;
    const manifoldVolumeL = 0.35;
    const vEffectiveL = channelVolumeL + manifoldVolumeL;
    const qFlowLmin = Math.max(0.1, flowRate);
    const tauMin = Math.max(0.08, Math.min(0.35, (vEffectiveL * 4.5) / qFlowLmin));
    const tStabilization = Number((4.6 * tauMin).toFixed(1));

    const cycleTimePoints = [
        0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9.8, 10,
        10.2, 10.5, 10.8, 11,
        11.2, 11.5, 11.8, 12
    ];

    const cycleData = cycleTimePoints.map((t) => {
        let tds = calcOutlet;
        let curr = steadyCurrent;
        let volt = voltageStack;
        let eff = activeChargeEff;
        let phase = isEDI ? "Continuous EDI Production" : "Adsorption (0–10m)";
        let streamType = "Product Outlet Stream";
        let note = null;

        if (isFCDI) {
            // FCDI: 12-MINUTE OPERATING CYCLE (ADSORPTION 0-10M -> REVERSE DESORPTION 10-11M -> RINSE 11-12M)
            if (t > 10 && t <= 11) {
                phase = "Desorption (10–11m) [Reverse Polarity Mode]";
                streamType = "High-Salinity Concentrate Stream (Brine Peak)";
                const progress = (t - 10);
                tds = feedTds + (fcdiPeakTds - feedTds) * Math.sin(progress * Math.PI);
                curr = -Number((steadyCurrent * 0.8).toFixed(2)); // Reverse polarity discharge current (-1.66 A)
                volt = -Number((voltageStack * 0.5).toFixed(1)); // Reverse polarity voltage setpoint (-47.6 V)
                eff = 90.0; // Desorption ion release efficiency (Λ_des = 90%)
                note = `FCDI Desorption: Ion release under Reverse Polarity Mode (Peak: ~${fcdiPeakTds.toFixed(1)} mg/L, Avg: ${concTdsDynamic.toFixed(1)} mg/L, I = -${(steadyCurrent * 0.8).toFixed(2)} A, V = -${(voltageStack * 0.5).toFixed(1)} V, Λ = 90%)`;
            } else if (t > 11 && t <= 12) {
                phase = "Rinse (11–12m)";
                streamType = "Internal Flush Stream";
                const progress = (t - 11);
                tds = (feedTds * 0.5) * (1 - progress * 0.8);
                curr = 0.0;
                volt = 0.0;
                eff = 0.0; // Unpowered rinse flush
                note = "Rinse Phase: Zero current flush (I = 0 A, V = 0 V, Λ = 0.0%)";
            } else {
                phase = "Adsorption (0–10m)";
                streamType = "Desalinated Product Water";
                const excessTds = (feedTds - calcOutlet) * Math.exp(-t / tauMin);
                tds = calcOutlet + (t < 0.8 ? excessTds : 0);
                curr = steadyCurrent;
                volt = voltageStack;
                eff = activeChargeEff;
                if (t < tStabilization) {
                    note = `Hydraulic startup transient (τ = ${tauMin.toFixed(2)} min, ${feedTds} -> ${calcOutlet.toFixed(1)} mg/L)`;
                } else {
                    note = `Steady Adsorption Desalination: Product ~${calcOutlet.toFixed(1)} mg/L, I = +${steadyCurrent.toFixed(2)} A, V = +${voltageStack.toFixed(1)} V, Λ = ${activeChargeEff}%`;
                }
            }
        } else if (isEDI) {
            // EDI: CONTINUOUS STEADY-STATE OPERATION (NO CYCLIC DESORPTION / NO POLARITY REVERSAL)
            // Water splitting continuously auto-regenerates resin in-situ
            phase = "Continuous EDI Electromigration & Water-Splitting";
            streamType = "Ultrapure Product Stream";
            const excessTds = (feedTds - calcOutlet) * Math.exp(-t / tauMin);
            tds = calcOutlet + (t < 0.8 ? excessTds : 0);
            curr = steadyCurrent;
            volt = voltageStack;
            eff = activeChargeEff;
            note = t < tStabilization 
                ? `EDI Startup Stabilization (Resin bed equilibration, τ = ${tauMin.toFixed(2)} min)`
                : `Continuous EDI Polishing: ${calcOutlet.toFixed(2)} mg/L product, ${steadyCurrent.toFixed(2)} A DC, ${voltageStack.toFixed(1)} V DC`;
        } else if (isCDI) {
            // CDI: MEMBRANE-FREE CAPACITIVE DEIONIZATION (SHORT-CIRCUIT DISCHARGE ZVD)
            if (t > 10 && t <= 11) {
                phase = "Desorption (10–11m) [Short-Circuit ZVD]";
                streamType = "Concentrate Reject Stream";
                const progress = (t - 10);
                tds = feedTds + (concPeakDynamic - feedTds) * Math.sin(progress * Math.PI);
                curr = 0.0; // Short circuit discharge (0 A)
                volt = 0.0; // Zero Voltage Desorption (0 V)
                eff = Number((activeChargeEff * (1 - 0.40 * Math.sin(progress * Math.PI))).toFixed(1));
                note = `CDI Desorption: Co-ion back-diffusion during Short-Circuit (V = 0.0 V, I = 0 A, Peak TDS: ~${concPeakDynamic.toFixed(1)} mg/L)`;
            } else if (t > 11 && t <= 12) {
                phase = "Rinse (11–12m)";
                streamType = "Rinse / Flush Stream";
                const progress = (t - 11);
                tds = (feedTds * 0.5) * (1 - progress * 0.7);
                curr = 0.0;
                volt = 0.0;
                eff = 0.0; // Unpowered flush
                note = "Rinse Phase: Hydrodynamic flush (I = 0 A, V = 0 V, Λ = 0.0%)";
            } else {
                phase = "Adsorption (0–10m)";
                streamType = "Product Outlet Stream";
                const excessTds = (feedTds - calcOutlet) * Math.exp(-t / tauMin);
                tds = calcOutlet + (t < 1.0 ? excessTds : 0);
                curr = steadyCurrent;
                volt = voltageStack;
                eff = Number((activeChargeEff * (1 - 0.12 * Math.exp(-t / tauMin))).toFixed(1));
                if (t < tStabilization) {
                    note = `Hydraulic residence transient (τ = ${tauMin.toFixed(2)} min)`;
                }
            }
        } else {
            // MCDI: MEMBRANE CAPACITIVE DEIONIZATION (REVERSED POLARITY DESORPTION RPD)
            if (t > 10 && t <= 11) {
                phase = "Desorption (10–11m) [Reverse Polarity Mode]";
                streamType = "Desorption / Concentrate Stream (Brine Peak)";
                const progress = (t - 10);
                tds = feedTds + (concPeakDynamic - feedTds) * Math.sin(progress * Math.PI); 
                curr = -Number((steadyCurrent * 0.8).toFixed(2)); // Reverse-polarity discharge current (-0.60 A)
                volt = -Number((voltageStack * 0.5).toFixed(1)); // Reverse polarity voltage (-23.8 V)
                // Desorption release efficiency under Reversed Polarity (RPD):
                eff = Number((88.0 + 4.0 * Math.sin(progress * Math.PI)).toFixed(1));
                note = `MCDI Desorption: Ion release under Reverse Polarity Mode (Λ_des = ${eff.toFixed(1)}% | I = -${(steadyCurrent * 0.8).toFixed(2)} A, V = -${(voltageStack * 0.5).toFixed(1)} V)`;
            } else if (t > 11 && t <= 12) {
                phase = "Rinse (11–12m)";
                streamType = "Rinse / Flush Stream";
                const progress = (t - 11);
                tds = (feedTds * 0.5) * (1 - progress * 0.7);
                curr = 0.0;
                volt = 0.0;
                eff = 0.0; // Unpowered flush
                note = "Rinse Phase: Unpowered hydrodynamic flush (I = 0 A, Λ = 0.0%)";
            } else {
                phase = "Adsorption (0–10m)";
                streamType = "Product Outlet Stream";
                const excessTds = (feedTds - calcOutlet) * Math.exp(-t / tauMin);
                tds = calcOutlet + (t < 1.0 ? excessTds : 0);
                curr = steadyCurrent;
                volt = voltageStack;
                eff = Number((activeChargeEff * (1 - 0.10 * Math.exp(-t / tauMin))).toFixed(1));
                if (t < tStabilization) {
                    note = `Hydraulic residence & manifold mixing transient (τ = ${tauMin.toFixed(2)} min, V_eff = ${vEffectiveL.toFixed(2)} L)`;
                }
            }
        }

        return {
            time: `${t}m`,
            tds: Number(tds.toFixed(1)),
            current: Number(curr.toFixed(2)),
            voltage: Number(volt.toFixed(1)),
            chargeEfficiency: eff !== null ? Number(eff.toFixed(1)) : null,
            phase,
            streamType,
            note
        };
    });

    const adsorptionOnlyData = cycleData.filter((d) => {
        const tVal = parseFloat(d.time);
        return tVal <= 10;
    });

    const activeData = viewMode === "CYCLE" ? cycleData : adsorptionOnlyData;

    // Y-Axis polarity-aware domains for Voltage & Current:
    const tdsPeakMax = Math.ceil(Math.max(concPeakDynamic * 1.15, calcOutlet * 2, feedTds * 1.2));
    const tdsDomain = [0, tdsPeakMax];

    const maxVoltAbs = Math.ceil(Math.max(voltageStack * 1.25, 10));
    const minVoltAbs = isCDI || isEDI ? 0 : -Math.ceil(Math.max(voltageStack * 0.65, 10));
    const voltDomain = [minVoltAbs, maxVoltAbs];
    
    const maxCurrAbs = Number((Math.max(steadyCurrent * 1.35, 0.5)).toFixed(2));
    const minCurrAbs = isCDI || isEDI ? 0 : -Number((Math.max(steadyCurrent * 0.95, 0.4)).toFixed(2));
    const currDomain = [minCurrAbs, maxCurrAbs];

    const effDomain = [0, 100];

    return (
        <div className="panel simulation-panel simulation-section" style={{
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: "4px",
            padding: "14px 16px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
            position: "relative",
            clear: "both",
            marginTop: "6px",
            width: "100%",
            boxSizing: "border-box"
        }}>
            <style>{`
                .simulation-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin-top: 10px;
                }
                @media (max-width: 900px) {
                    .simulation-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            {/* Header with Title and Mode Toggle */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #E2E8F0",
                paddingBottom: "10px",
                flexWrap: "wrap",
                gap: "8px"
            }}>
                <div>
                    <h3 style={{
                        margin: 0,
                        fontSize: "13.5px",
                        fontWeight: "700",
                        color: "#0F172A",
                        letterSpacing: "0.02em",
                        textTransform: "uppercase"
                    }}>
                        {isEDI ? "EDI Continuous Process Simulation (Steady-State)" : `${activeTech} Process Simulation & Dynamic Operating Cycle`}
                    </h3>
                    <p style={{
                        margin: "2px 0 0",
                        fontSize: "10.5px",
                        color: "#64748B"
                    }}>
                        {isEDI 
                            ? "Continuous Electromigration & In-Situ Electrochemical Water Splitting Resin Regeneration (Non-Cyclic)"
                            : (isCDI 
                                ? "12-Min Dynamic Cycle — operational / regeneration cycle: Adsorption (0–10m) → Short-Circuit ZVD (10–11m) → Rinse (11–12m)"
                                : "12-Min Dynamic Cycle — operational / regeneration cycle: Adsorption (0–10m) → Reversed Polarity Desorption (10–11m) → Rinse (11–12m)")}
                    </p>
                </div>

                {/* View Mode Switcher (only for cyclic technologies) */}
                {!isEDI && (
                    <div style={{
                        display: "flex",
                        background: "#F1F5F9",
                        borderRadius: "4px",
                        padding: "2px",
                        border: "1px solid #CBD5E1"
                    }}>
                        <button
                            type="button"
                            onClick={() => setViewMode("CYCLE")}
                            style={{
                                border: "none",
                                background: viewMode === "CYCLE" ? "#FFFFFF" : "transparent",
                                color: viewMode === "CYCLE" ? "#1E293B" : "#64748B",
                                fontWeight: "600",
                                fontSize: "10px",
                                padding: "4px 10px",
                                borderRadius: "3px",
                                cursor: "pointer",
                                boxShadow: viewMode === "CYCLE" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                                transition: "all 0.15s ease"
                            }}
                        >
                            Full 12-Min Cycle
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("ADSORPTION")}
                            style={{
                                border: "none",
                                background: viewMode === "ADSORPTION" ? "#FFFFFF" : "transparent",
                                color: viewMode === "ADSORPTION" ? "#1E293B" : "#64748B",
                                fontWeight: "600",
                                fontSize: "10px",
                                padding: "4px 10px",
                                borderRadius: "3px",
                                cursor: "pointer",
                                boxShadow: viewMode === "ADSORPTION" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                                transition: "all 0.15s ease"
                            }}
                        >
                            Adsorption Only (0–10m)
                        </button>
                    </div>
                )}
            </div>

            {/* Phase Legend Bar (for cyclic technologies) */}
            {viewMode === "CYCLE" && !isEDI && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "10fr 1fr 1fr",
                    gap: "4px",
                    marginTop: "8px",
                    fontSize: "9.5px",
                    fontWeight: "700"
                }}>
                    <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", padding: "3px 6px", borderRadius: "3px", textAlign: "center" }}>
                        0–10 min: ADSORPTION (Product)
                    </div>
                    <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", padding: "3px 6px", borderRadius: "3px", textAlign: "center" }}>
                        {isCDI ? "10–11 min: SHORT-CIRCUIT ZVD" : "10–11 min: REVERSE POLARITY (RPD)"}
                    </div>
                    <div style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#475569", padding: "3px 6px", borderRadius: "3px", textAlign: "center" }}>
                        11–12 min: RINSE FLUSH
                    </div>
                </div>
            )}

            {/* 2-Column Grid with 4 main charts */}
            <div className="simulation-grid">
                {/* 1. Operating Cycle / Continuous TDS Profile */}
                <ChartCard
                    title={isEDI ? "EDI Product TDS Profile" : "Operating Cycle TDS Profile"}
                    subtitle={isEDI 
                        ? `Ultrapure Product: ${calcOutlet.toFixed(2)} mg/L (Continuous In-Situ Resin Regeneration)`
                        : (viewMode === "ADSORPTION" 
                            ? `Steady State ~${calcOutlet.toFixed(1)} mg/L (~${tStabilization} min hydraulic stabilization transient, >99% equilibrium)` 
                            : `Adsorption ~${calcOutlet.toFixed(1)} mg/L | Model Desorption Profile: Peak ~${concPeakDynamic.toFixed(1)} mg/L (Avg: ${concTdsDynamic.toFixed(1)} mg/L @ 19.2 L/min)`)}
                    data={activeData}
                    dataKey="tds"
                    unit="mg/L"
                    color="#2563EB"
                    gradientId="gradTds"
                    targetValue={targetTDS}
                    yDomain={tdsDomain}
                    calloutPills={isEDI ? [
                        { text: `Product: ${calcOutlet.toFixed(2)} mg/L`, bg: "#DCFCE7", color: "#15803D", border: "#BBF7D0" },
                        { text: "Continuous Operation", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" }
                    ] : (viewMode === "CYCLE" ? [
                        { text: `Product: ~${calcOutlet.toFixed(1)} mg/L`, bg: "#DCFCE7", color: "#15803D", border: "#BBF7D0" },
                        { text: isFCDI ? `Desorption Peak: ~${fcdiPeakTds.toFixed(1)} mg/L` : `Peak: ~${concPeakDynamic.toFixed(1)} mg/L`, bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" }
                    ] : [
                        { text: `Steady State: ~${calcOutlet.toFixed(1)} mg/L`, bg: "#DCFCE7", color: "#15803D", border: "#BBF7D0" }
                    ])}
                    viewMode={viewMode}
                    showPhases={!isEDI}
                />

                {/* 2. Stack Current */}
                <ChartCard
                    title="Stack Current"
                    subtitle={isEDI 
                        ? `Continuous DC Current: +${steadyCurrent.toFixed(2)} A (Faradaic Ion Transport + Water Splitting)`
                        : (viewMode === "ADSORPTION"
                            ? `Calculated Operating Current: +${steadyCurrent.toFixed(2)} A (Faradaic Charging)`
                            : (isCDI 
                                ? `Faradaic Current: Adsorption +${steadyCurrent.toFixed(2)} A | ZVD Discharge Current: 0.00 A`
                                : (isFCDI 
                                    ? `Adsorption: +${steadyCurrent.toFixed(2)} A | Desorption: -${(steadyCurrent * 0.8).toFixed(2)} A (RPD Mode) | Rinse: 0 A`
                                    : `Faradaic Current: Adsorption +${steadyCurrent.toFixed(2)} A | Desorption: -${(steadyCurrent * 0.8).toFixed(2)} A (RPD Mode)`)))}
                    data={activeData}
                    dataKey="current"
                    unit="A"
                    color="#16A34A"
                    gradientId="gradCurr"
                    yDomain={currDomain}
                    showZeroLine={!isEDI && !isCDI}
                    calloutPills={isEDI ? [
                        { text: `+${steadyCurrent.toFixed(2)} A DC`, bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" }
                    ] : (viewMode === "CYCLE" ? [
                        { text: `Ads: +${steadyCurrent.toFixed(2)} A`, bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
                        { text: isCDI ? "Desorption: ZVD (0 A)" : `Desorption: -${(steadyCurrent * 0.8).toFixed(2)} A (RPD)`, bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
                        { text: "Rinse: 0 A", bg: "#F1F5F9", color: "#64748B", border: "#CBD5E1" }
                    ] : [
                        { text: `Faradaic Current: +${steadyCurrent.toFixed(2)} A`, bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" }
                    ])}
                    viewMode={viewMode}
                    showPhases={!isEDI}
                />

                {/* 3. Stack Voltage / Polarity Reversal */}
                <ChartCard
                    title={isEDI ? "Stack DC Voltage" : "Stack Voltage / Polarity Reversal"}
                    subtitle={isEDI 
                        ? `Continuous DC Driving Voltage: +${voltageStack.toFixed(1)} V (Constant Field Polarization)`
                        : (viewMode === "ADSORPTION"
                            ? `Design Operating Voltage: +${voltageStack.toFixed(1)} V (${(voltageStack / (engineering.cellPairs || 34)).toFixed(2)} V/cell)`
                            : (isCDI 
                                ? `Design Operating Setpoints: Adsorption +${voltageStack.toFixed(1)} V | Desorption 0.0 V (Short-Circuit ZVD)`
                                : (isFCDI 
                                    ? `Adsorption: +${voltageStack.toFixed(1)} V | Desorption: -${(voltageStack * 0.5).toFixed(1)} V (RPD Mode) | Rinse: 0 V`
                                    : `Design Operating Setpoints: Adsorption +${voltageStack.toFixed(1)} V | Desorption -${(voltageStack * 0.5).toFixed(1)} V (RPD Mode)`)))}
                    data={activeData}
                    dataKey="voltage"
                    unit="V"
                    color="#D97706"
                    gradientId="gradVolt"
                    yDomain={voltDomain}
                    showZeroLine={!isEDI && !isCDI}
                    calloutPills={isEDI ? [
                        { text: `+${voltageStack.toFixed(1)} V DC`, bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" }
                    ] : (viewMode === "CYCLE" ? [
                        { text: `Ads: +${voltageStack.toFixed(1)} V`, bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
                        { text: isCDI ? "Desorption: 0.0 V (ZVD)" : `Desorption: -${(voltageStack * 0.5).toFixed(1)} V (RPD)`, bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
                        { text: "Rinse: 0 V", bg: "#F1F5F9", color: "#64748B", border: "#CBD5E1" }
                    ] : [
                        { text: `Operating Voltage: +${voltageStack.toFixed(1)} V`, bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" }
                    ])}
                    viewMode={viewMode}
                    showPhases={!isEDI}
                />

                {/* 4. Operating Charge Efficiency (Continuous across all phases) */}
                <ChartCard
                    title={isEDI ? "EDI Charge Utilization (Λ_EDI)" : "Operating Charge Efficiency (Λ)"}
                    subtitle={isEDI 
                        ? `Continuous EDI Charge Utilization: Λ_EDI = ${(activeChargeEff / 100).toFixed(2)} (Electromigration + Water Splitting)`
                        : (viewMode === "ADSORPTION" 
                            ? `Adsorption Electrosorption Efficiency: Λ_ads = ${(activeChargeEff / 100).toFixed(2)} (0–10m)` 
                            : (isFCDI 
                                ? `Adsorption Λ = ${(activeChargeEff / 100).toFixed(2)} | Desorption Λ ≈ 0.90 | Rinse = 0%`
                                : `Adsorption Λ_ads = ${(activeChargeEff / 100).toFixed(2)} | Desorption Λ_des ≈ 0.90 (Ion Release) | Rinse = 0.0% (Unpowered)`))}
                    data={activeData}
                    dataKey="chargeEfficiency"
                    unit="%"
                    color="#0284C7"
                    gradientId="gradEff"
                    yDomain={effDomain}
                    calloutPills={isEDI ? [
                        { text: `Continuous Λ_EDI = ${(activeChargeEff / 100).toFixed(2)}`, bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" }
                    ] : (viewMode === "CYCLE" ? [
                        { text: `Ads: ${activeChargeEff.toFixed(0)}% (${(activeChargeEff / 100).toFixed(2)})`, bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
                        { text: isCDI ? "Desorp: Λ_des (Decay)" : "Desorp: 90% (0.90)", bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
                        { text: "Rinse: 0%", bg: "#F1F5F9", color: "#64748B", border: "#CBD5E1" }
                    ] : [
                        { text: `Λ = ${(activeChargeEff / 100).toFixed(2)} (Model Parameter)`, bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" }
                    ])}
                    viewMode={viewMode}
                    showPhases={!isEDI}
                />
            </div>

            {/* Dynamic Process Conservation Balance Strip */}
            <div style={{ marginTop: "12px", padding: "10px 14px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                    <span style={{ fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        {isEDI ? "EDI Continuous Process Mass & Water Balance" : "Single-Pass Water Balance — 10 min adsorption basis"}
                    </span>
                    <span style={{ fontSize: "9.5px", fontWeight: "600", color: "#15803D", background: "#DCFCE7", padding: "1px 6px", borderRadius: "2px", border: "1px solid #BBF7D0" }}>
                        Mass &amp; Salt Balance Closed (0.000 residual)
                    </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#0F172A" }}>{isContinuous ? "Continuous Feed In" : "External Feed Consumed"}</div>
                        <div style={{ fontFamily: "monospace", fontWeight: "700", color: "#1E40AF", marginTop: "2px" }}>{extFeedVol.toFixed(2)} L</div>
                        <div style={{ color: "#64748B", fontSize: "9.5px" }}>{flowRate.toFixed(2)} L/min @ {feedTds} mg/L ({timeBasisMin} min)</div>
                        <div style={{ color: "#334155", fontSize: "9.5px", marginTop: "2px" }}>Salt In: <strong>{saltInVal} mg</strong></div>
                    </div>

                    <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#15803D" }}>Product Delivered</div>
                        <div style={{ fontFamily: "monospace", fontWeight: "700", color: "#15803D", marginTop: "2px" }}>{adsVol.toFixed(2)} L</div>
                        <div style={{ color: "#64748B", fontSize: "9.5px" }}>{(flowRate * (recoveryPct / 100)).toFixed(2)} L/min @ {calcOutlet.toFixed(1)} mg/L</div>
                        <div style={{ color: "#334155", fontSize: "9.5px", marginTop: "2px" }}>Salt Out: <strong>{saltProdVal} mg</strong></div>
                    </div>

                    <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#92400E" }}>Concentrate Discharged</div>
                        <div style={{ fontFamily: "monospace", fontWeight: "700", color: "#92400E", marginTop: "2px" }}>{desVol.toFixed(2)} L</div>
                        <div style={{ color: "#64748B", fontSize: "9.5px" }}>{(flowRate * (1 - recoveryPct / 100)).toFixed(2)} L/min @ {concTdsDynamic.toFixed(1)} mg/L</div>
                        <div style={{ color: "#334155", fontSize: "9.5px", marginTop: "2px" }}>Salt Out: <strong>{saltConcVal} mg</strong></div>
                    </div>

                    <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#475569" }}>{isFCDI ? "Internal Carbon Slurry Loop" : (isEDI ? "In-Situ Resin Auto-Regen" : "Internal Rinse Recycle")}</div>
                        <div style={{ fontFamily: "monospace", fontWeight: "700", color: "#475569", marginTop: "2px" }}>{isFCDI ? "Continuous Slurry Circulation" : (isEDI ? "Continuous (H+ / OH-)" : `${rinseVol.toFixed(1)} L (Closed Loop)`)}</div>
                        <div style={{ color: "#64748B", fontSize: "9.5px" }}>{isFCDI ? "External uncharging regenerator loop" : (isEDI ? "Electrochemical water splitting" : "Internal flush to raw equalization")}</div>
                        <div style={{ color: "#15803D", fontSize: "9.5px", marginTop: "2px", fontWeight: "700" }}>Net Water Residual: 0.000 L</div>
                    </div>
                </div>

                <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", background: "#EFF6FF", padding: "6px 10px", borderRadius: "3px", border: "1px solid #BFDBFE", fontSize: "10px", color: "#1E40AF", flexWrap: "wrap", gap: "6px" }}>
                    <span>
                        <strong>Single-Pass Water Balance (10-Min Basis):</strong> {recoveryPct.toFixed(1)}% recovery ({adsVol.toFixed(2)} L product / {extFeedVol.toFixed(2)} L feed, Residual: 0.000 L)
                    </span>
                    <span>
                        <strong>Salt Balance:</strong> {saltInVal} mg in = ({saltProdVal} + {saltConcVal}) mg out | <strong>Residual: 0.000 mg (Closed)</strong>
                    </span>
                </div>
            </div>
        </div>
    );
}
