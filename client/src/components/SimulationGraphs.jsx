import React from "react";
import { useApp } from "../context/AppContext";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceArea
} from "recharts";

function GraphCard({ title, data, dataKey, unit, color = "#2563EB" }) {
    return (
        <div style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#1F2937", marginBottom: "8px" }}>{title}</h4>
            <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data}>
                    {/* Phase 1: Adsorption (+V, +I Desalination) */}
                    <ReferenceArea x1="0 min" x2="20 min" fill="#EFF6FF" fillOpacity={0.6} label={{ value: "Adsorption Phase", fill: "#2563EB", fontSize: 10, position: "insideTopLeft" }} />
                    {/* Phase 2: Desorption (-V, -I Regeneration) */}
                    <ReferenceArea x1="20 min" x2="30 min" fill="#FEF3C7" fillOpacity={0.6} label={{ value: "Desorption Phase", fill: "#D97706", fontSize: 10, position: "insideTopRight" }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", color: "#1E293B" }} />
                    <Legend />
                    <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
            <p style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>{unit}</p>
        </div>
    );
}

export default function SimulationGraphs() {
    const { designResult } = useApp();
    const simulation = designResult?.simulation;

    if (!designResult || !simulation || !simulation.time) {
        return (
            <div className="panel">
                <h2>Dynamic Simulation Profiles</h2>
                <p style={{ color: "#6B7280" }}>Generate design to load simulation profiles.</p>
            </div>
        );
    }

    const graphData = simulation.time.map((t, i) => ({
        time: `${t} min`,
        voltage: simulation.voltage?.[i] ?? 0,
        current: simulation.current?.[i] ?? 0,
        tds: simulation.tds?.[i] ?? 0,
        loading: simulation.electrodeLoading?.[i] ?? 0,
        chargeEfficiency: simulation.chargeEfficiency?.[i] ?? 0
    }));

    return (
        <div className="panel">
            <h3 className="panel-title" style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>Dynamic Simulation Profiles</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                <GraphCard title="Outlet TDS vs Time" data={graphData} dataKey="tds" unit="TDS (ppm)" color="#2563EB" />
                <GraphCard title="Electrode Loading" data={graphData} dataKey="loading" unit="SAC (mg/g)" color="#7C3AED" />
                <GraphCard title="Operating Voltage" data={graphData} dataKey="voltage" unit="Voltage (V)" color="#D97706" />
                <GraphCard title="Cell Current" data={graphData} dataKey="current" unit="Current (A)" color="#16A34A" />
                <GraphCard title="Charge Efficiency" data={graphData} dataKey="chargeEfficiency" unit="Charge Efficiency Λ (%)" color="#DB2777" />
            </div>
        </div>
    );
}