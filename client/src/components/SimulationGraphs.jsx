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

function ChartCard({ title, data, dataKey, unit, color = "#2563EB", gradientId, targetValue }) {
    return (
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B" }}>{title}</span>
                <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "500" }}>{unit}</span>
            </div>
            <ResponsiveContainer width="100%" height={135}>
                <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "6px", fontSize: "12px", color: "#FFFFFF" }} />
                    <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#${gradientId})`} isAnimationActive={false} />
                    {targetValue !== undefined && targetValue !== null && (
                        <ReferenceLine
                            y={targetValue}
                            stroke="#DC2626"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{ value: `Target (${targetValue} ppm)`, fill: "#DC2626", fontSize: 10, position: "top" }}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function SimulationGraphs() {
    const { designResult } = useApp();
    const [showAdvanced, setShowAdvanced] = useState(false);

    const simulation = designResult?.simulation;
    const engineering = designResult?.engineering || {};
    const feedWater = designResult?.input?.feedWater || {};
    const targetTDS = Number(feedWater.targetTds ?? 50);

    if (!designResult || !simulation || !simulation.time) {
        return null;
    }

    const steadyCurrent = engineering.current ? `${Number(engineering.current).toFixed(2)} A` : "1.45 A";
    const voltageStack = engineering.voltageStack ? `${Number(engineering.voltageStack).toFixed(1)} V` : "130.2 V";

    const fullData = simulation.time.map((t, i) => ({
        time: `${t}m`,
        tds: simulation.tds?.[i] ?? 0,
        loading: simulation.electrodeLoading?.[i] ?? 0,
        voltage: simulation.voltage?.[i] ?? 0,
        current: simulation.current?.[i] ?? 0,
        chargeEfficiency: simulation.chargeEfficiency?.[i] ?? 99.9
    }));

    return (
        <div className="panel simulation-panel simulation-section" style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
            position: "relative",
            clear: "both",
            marginTop: "12px",
            width: "100%",
            boxSizing: "border-box"
        }}>
            <style>{`
                .simulation-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                    margin-bottom: 10px;
                    width: 100%;
                }
                @media (max-width: 900px) {
                    .simulation-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                    Dynamic Process Simulation ({engineering.processTrainName || engineering.technology || technology || "CDI"})
                </h3>

                {/* Simulation Live Status Badge */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "3px 10px", borderRadius: "12px" }}>
                        <span style={{ height: "8px", width: "8px", borderRadius: "50%", background: "#16A34A", display: "inline-block" }}></span>
                        <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#15803D" }}>
                            Dynamic Model Simulation
                        </span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748B" }}>Computational model — not experimental validation</div>
                </div>
            </div>

            {/* 2-Column Grid with 4 main charts */}
            <div className="simulation-grid">
                <ChartCard
                    title="Outlet TDS vs Time (Transient -> Steady State)"
                    data={fullData}
                    dataKey="tds"
                    unit="ppm"
                    color="#2563EB"
                    gradientId="gradTds"
                    targetValue={targetTDS}
                />
                <ChartCard
                    title={`Cell Current vs Time (Steady-State: ${steadyCurrent})`}
                    data={fullData}
                    dataKey="current"
                    unit="A"
                    color="#16A34A"
                    gradientId="gradCurr"
                />
                <ChartCard title={`System Stack Voltage vs Time (V_system: ${voltageStack})`} data={fullData} dataKey="voltage" unit="V" color="#D97706" gradientId="gradVolt" />
                <ChartCard title="Charge Efficiency vs Time" data={fullData} dataKey="chargeEfficiency" unit="%" color="#0284C7" gradientId="gradEff" />
            </div>

            {/* Expandable Advanced Section for Electrode Loading */}
            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "8px" }}>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#2563EB",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        padding: 0
                    }}
                >
                    {showAdvanced ? "Hide Advanced Profiles" : "Show Advanced Profiles"}
                </button>

                {showAdvanced && (
                    <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                        <ChartCard title="Flow Electrode Loading vs Time" data={fullData} dataKey="loading" unit="mg/g" color="#7C3AED" gradientId="gradSac" />
                    </div>
                )}
            </div>
        </div>
    );
}