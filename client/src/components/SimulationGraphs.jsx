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

function GraphCard({ title, data, dataKey, unit, color }) {

    return (

        <div className="graph-card">

            <h3>{title}</h3>

            <ResponsiveContainer width="100%" height={280}>

                <LineChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 20,
                        left: 10,
                        bottom: 20
                    }}
                >

                    {/* Adsorption */}

                    <ReferenceArea
                        x1={0}
                        x2={13}
                        fill="#E3F2FD"
                        fillOpacity={0.6}
                        label={{
                            value: "Adsorption",
                            position: "insideTop",
                            fill: "#1976D2",
                            fontSize: 12
                        }}
                    />

                    {/* Desorption */}

                    <ReferenceArea
                        x1={13}
                        x2={20}
                        fill="#FFF3E0"
                        fillOpacity={0.7}
                        label={{
                            value: "Desorption",
                            position: "insideTop",
                            fill: "#EF6C00",
                            fontSize: 12
                        }}
                    />

                    <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="#d0d0d0"
                    />

                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 12 }}
                        label={{
                            value: "Time (min)",
                            position: "insideBottom",
                            offset: -8
                        }}
                    />

                    <YAxis
                        tick={{ fontSize: 12 }}
                        label={{
                            value: unit,
                            angle: -90,
                            position: "insideLeft"
                        }}
                    />

                    <Tooltip
                        contentStyle={{
                            borderRadius: 8,
                            border: "1px solid #ddd",
                            background: "#ffffff"
                        }}
                    />

                    <Legend />

                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{
                            r:6,
                            stroke:color,
                            strokeWidth:2,
                            fill:"#fff"
                        }}
                    />

                </LineChart>

            </ResponsiveContainer>

        </div>

    );

}

export default function SimulationGraphs() {

    const { simulation } = useApp();

    if (!simulation || !simulation.time) {

        return (

            <div className="panel">

                <h2>Simulation Graphs</h2>

                <p>Generate a design first.</p>

            </div>

        );

    }

    const graphData = simulation.time.map((t, i) => ({

        time: t,

        voltage: simulation.voltage[i],

        current: simulation.current[i],

        tds: simulation.tds[i]

    }));

    return (

        <div className="panel">

            <h2>CDI Cell Dynamic Simulation</h2>

            <div className="graphs-container">

                <GraphCard
                    title="Voltage Profile"
                    data={graphData}
                    dataKey="voltage"
                    unit="Voltage (V)"
                    color="#1976D2"
                />

                <GraphCard
                    title="Current Profile"
                    data={graphData}
                    dataKey="current"
                    unit="Current (A)"
                    color="#43A047"
                />

                <GraphCard
                    title="TDS Removal Curve"
                    data={graphData}
                    dataKey="tds"
                    unit="TDS (ppm)"
                    color="#E53935"
                />

            </div>

        </div>

    );

}