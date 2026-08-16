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
    ReferenceLine
} from "recharts";

// Custom Tooltip with stream identity & operating phase clarity
function CustomSimTooltip({ active, payload, label, unit, dataKey }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
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
                    {payload[0].name || "Value"}: {payload[0].value} {unit}
                </div>
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
    yDomain
}) {
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
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#1E293B" }}>{title}</span>
                    {subtitle && (
                        <div style={{ fontSize: "10px", color: "#64748B", marginTop: "1px" }}>{subtitle}</div>
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
                    <XAxis dataKey="time" stroke="#64748B" fontSize={9.5} />
                    <YAxis stroke="#64748B" fontSize={9.5} domain={yDomain || ["auto", "auto"]} />
                    <Tooltip content={<CustomSimTooltip unit={unit} dataKey={dataKey} />} />
                    
                    {/* Vertical Phase Boundaries: 5m, 6m, 7m */}
                    <ReferenceLine x="5m" stroke="#94A3B8" strokeDasharray="3 3" strokeWidth={1} />
                    <ReferenceLine x="6m" stroke="#94A3B8" strokeDasharray="3 3" strokeWidth={1} />
                    <ReferenceLine x="7m" stroke="#94A3B8" strokeDasharray="3 3" strokeWidth={1} />

                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#${gradientId})`}
                        isAnimationActive={false}
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
    const [viewMode, setViewMode] = useState("CYCLE"); // "CYCLE" (12 min) or "ADSORPTION" (5 min)

    const simulation = designResult?.simulation;
    const engineering = designResult?.engineering || {};
    const feedWater = designResult?.input?.feedWater || {};
    const targetTDS = Number(feedWater.targetTds ?? 50);

    if (!designResult || !simulation) {
        return null;
    }

    const steadyCurrent = engineering.current ? Number(engineering.current) : 1.98;
    const voltageStack = engineering.voltageStack ? Number(engineering.voltageStack) : 95.2;
    const calcOutlet = engineering.outletTDS ? Number(engineering.outletTDS) : 49.8;
    const feedTds = Number(feedWater.tds ?? 500);

    // Exact 12-minute cycle with high-resolution phase boundaries
    // Phase 1: 0 - 5 min (Adsorption / Product)
    // Phase 2: 5 - 6 min (Desorption / Concentrate Brine)
    // Phase 3: 6 - 7 min (Rinse Effluent)
    // Phase 4: 7 - 12 min (Adsorption / Product)
    const cycleTimePoints = [
        0, 0.5, 1, 1.5, 2, 3, 4, 4.8, 5,
        5.2, 5.5, 5.8, 6,
        6.2, 6.5, 6.8, 7,
        7.2, 7.5, 8, 9, 10, 11, 12
    ];

    const cycleData = cycleTimePoints.map((t) => {
        let tds = calcOutlet;
        let curr = steadyCurrent;
        let volt = voltageStack;
        let eff = 92.0;
        let phase = "Adsorption (0–5m)";
        let streamType = "Product Outlet Stream";

        if (t >= 5 && t <= 6) {
            phase = "Desorption (5–6m)";
            streamType = "Desorption / Concentrate Stream (Brine Peak)";
            const progress = (t - 5);
            tds = feedTds + 880 * Math.sin(progress * Math.PI); 
            curr = -steadyCurrent * 0.8; // Reverse-polarity discharge
            volt = -voltageStack * 0.5; // Reverse polarity voltage
            eff = 0.0; // Desorption release
        } else if (t > 6 && t <= 7) {
            phase = "Rinse (6–7m)";
            streamType = "Rinse / Flush Stream";
            const progress = (t - 6);
            tds = (feedTds * 0.5) * (1 - progress * 0.7);
            curr = 0.0; // Zero current flush
            volt = 0.0;
            eff = 0.0;
        } else if (t > 7) {
            phase = "Adsorption (7–12m)";
            streamType = "Product Outlet Stream";
            tds = calcOutlet + (t < 7.5 ? (feedTds - calcOutlet) * 0.15 : 0);
            curr = steadyCurrent;
            volt = voltageStack;
            eff = 92.0;
        } else {
            // Initial adsorption startup
            phase = "Adsorption (0–5m)";
            streamType = "Product Outlet Stream";
            tds = calcOutlet + (t < 1 ? (feedTds - calcOutlet) * 0.25 * (1 - t) : 0);
            curr = steadyCurrent;
            volt = voltageStack;
            eff = 92.0;
        }

        return {
            time: `${t}m`,
            tds: Number(tds.toFixed(1)),
            current: Number(curr.toFixed(2)),
            voltage: Number(volt.toFixed(1)),
            chargeEfficiency: Number(eff.toFixed(1)),
            phase,
            streamType
        };
    });

    const adsorptionOnlyData = cycleData.filter((d) => {
        const tVal = parseFloat(d.time);
        return tVal <= 5;
    });

    const activeData = viewMode === "CYCLE" ? cycleData : adsorptionOnlyData;

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
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 12px;
                    margin-top: 10px;
                    width: 100%;
                }
                @media (max-width: 900px) {
                    .simulation-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            {/* HEADER WITH CYCLE PHASE BADGES */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "8px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h3 style={{ margin: 0, fontSize: "12.5px", fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            Dynamic Process Simulation ({engineering.technology || "MCDI"})
                        </h3>
                        <span style={{ fontSize: "9.5px", fontWeight: "700", color: "#1E40AF", background: "#EFF6FF", padding: "1px 6px", borderRadius: "2px", border: "1px solid #BFDBFE" }}>
                            12-MINUTE OPERATING CYCLE
                        </span>
                    </div>
                    
                    {/* Visual Cycle Timeline Indicator */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10.5px", color: "#64748B", marginTop: "4px" }}>
                        <span style={{ fontWeight: "700", color: "#334155" }}>Cycle Sequence:</span>
                        <span style={{ background: "#F1F5F9", padding: "1px 6px", borderRadius: "2px", border: "1px solid #E2E8F0" }}>0–5m: Adsorption (Product)</span>
                        <span>→</span>
                        <span style={{ background: "#FEF3C7", color: "#92400E", padding: "1px 6px", borderRadius: "2px", border: "1px solid #FDE68A" }}>5–6m: Desorption (RPD Discharge)</span>
                        <span>→</span>
                        <span style={{ background: "#F1F5F9", padding: "1px 6px", borderRadius: "2px", border: "1px solid #E2E8F0" }}>6–7m: Rinse</span>
                        <span>→</span>
                        <span style={{ background: "#F1F5F9", padding: "1px 6px", borderRadius: "2px", border: "1px solid #E2E8F0" }}>7–12m: Adsorption (Product)</span>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ display: "flex", background: "#F1F5F9", borderRadius: "4px", padding: "2px", border: "1px solid #CBD5E1" }}>
                        <button
                            onClick={() => setViewMode("CYCLE")}
                            style={{
                                border: "none",
                                background: viewMode === "CYCLE" ? "#2563EB" : "transparent",
                                color: viewMode === "CYCLE" ? "#FFFFFF" : "#475569",
                                borderRadius: "3px",
                                padding: "4px 9px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            Full 12-min Cycle
                        </button>
                        <button
                            onClick={() => setViewMode("ADSORPTION")}
                            style={{
                                border: "none",
                                background: viewMode === "ADSORPTION" ? "#2563EB" : "transparent",
                                color: viewMode === "ADSORPTION" ? "#FFFFFF" : "#475569",
                                borderRadius: "3px",
                                padding: "4px 9px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            Adsorption (0–5 min)
                        </button>
                    </div>
                </div>
            </div>

            {/* 2-Column Grid with 4 main charts */}
            <div className="simulation-grid">
                {/* 1. Modeled Outlet TDS by Operating Phase */}
                <ChartCard
                    title="Modeled Outlet TDS by Operating Phase"
                    subtitle="Product TDS during Adsorption (~49.8 mg/L) | Desorption Concentrate TDS during Regeneration"
                    data={activeData}
                    dataKey="tds"
                    unit="mg/L"
                    color="#2563EB"
                    gradientId="gradTds"
                    targetValue={targetTDS}
                />

                {/* 2. Modeled Stack Current */}
                <ChartCard
                    title="Modeled Stack Current"
                    subtitle={`Adsorption: +${steadyCurrent.toFixed(2)} A | Desorption: -${(steadyCurrent * 0.8).toFixed(2)} A (Model-derived dynamics)`}
                    data={activeData}
                    dataKey="current"
                    unit="A"
                    color="#16A34A"
                    gradientId="gradCurr"
                />

                {/* 3. Stack Voltage / Polarity Reversal */}
                <ChartCard
                    title="Stack Voltage / Polarity Reversal"
                    subtitle={`Adsorption: +${voltageStack.toFixed(1)} V DC | Desorption: -${(voltageStack * 0.5).toFixed(1)} V DC (Reverse Polarity)`}
                    data={activeData}
                    dataKey="voltage"
                    unit="V"
                    color="#D97706"
                    gradientId="gradVolt"
                />

                {/* 4. Modeled Charge Efficiency */}
                <ChartCard
                    title="Modeled Charge Efficiency (Λ)"
                    subtitle="Λ = 0.92 (92.0%) assumed unless experimentally calibrated"
                    data={activeData}
                    dataKey="chargeEfficiency"
                    unit="%"
                    color="#0284C7"
                    gradientId="gradEff"
                    yDomain={[0, 100]}
                />
            </div>
        </div>
    );
}