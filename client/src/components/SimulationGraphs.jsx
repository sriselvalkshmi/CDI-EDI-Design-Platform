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
    ReferenceArea,
    ReferenceLine
} from "recharts";

function GraphCard({ title, data, dataKey, unit, color }) {

    const adsorptionTime = data[0]?.adsorption || 13;
    const totalTime = data[0]?.total || 20;

    return (

        <div className="graph-card">

            <h3>{title}</h3>

            <ResponsiveContainer width="100%" height={280}>

                <LineChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 20,
                        left: 20,
                        bottom: 20
                    }}
                >

                    {/* Adsorption */}
                    <ReferenceArea
                        x1={0}
                        x2={adsorptionTime}
                        fill="#E3F2FD"
                        fillOpacity={0.35}
                        label={{
                            value: "Adsorption",
                            position: "insideTop",
                            fill: "#1976D2",
                            fontSize: 12
                        }}
                    />

                    {/* Desorption */}
                    <ReferenceArea
                        x1={adsorptionTime}
                        x2={totalTime}
                        fill="#FFF3E0"
                        fillOpacity={0.35}
                        label={{
                            value: "Desorption",
                            position: "insideTop",
                            fill: "#EF6C00",
                            fontSize: 12
                        }}
                    />

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#d8d8d8"
                    />

                    <ReferenceLine
                        y={0}
                        stroke="#000"
                        strokeWidth={2}
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
                        domain={[
                            (dataMin) => Math.floor(dataMin * 1.2),
                            (dataMax) => Math.ceil(dataMax * 1.2)
                        ]}
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
                            border: "1px solid #ccc"
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
                            r: 6,
                            fill: color
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

        tds: simulation.tds[i],

        conductivity: simulation.conductivity?.[i] ?? 0,

        charge: simulation.charge?.[i] ?? 0,

        resistance: simulation.resistance?.[i] ?? 0,

        currentDensity: simulation.currentDensity?.[i] ?? 0,

        electrodePotential: simulation.electrodePotential?.[i] ?? 0,

        coulombicEfficiency: simulation.coulombicEfficiency?.[i] ?? 0,

        adsorptionRate: simulation.adsorptionRate?.[i] ?? 0,

        waterRecovery: simulation.waterRecovery?.[i] ?? 0,

        adsorption: simulation.adsorptionTime,

        total:
            simulation.adsorptionTime +
            simulation.desorptionTime

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
                    title="TDS Removal"
                    data={graphData}
                    dataKey="tds"
                    unit="TDS (ppm)"
                    color="#E53935"
                />

                <GraphCard
                    title="Conductivity"
                    data={graphData}
                    dataKey="conductivity"
                    unit="µS/cm"
                    color="#8E24AA"
                />

                <GraphCard
                    title="Charge"
                    data={graphData}
                    dataKey="charge"
                    unit="C"
                    color="#F9A825"
                />

                <GraphCard
                    title="Resistance"
                    data={graphData}
                    dataKey="resistance"
                    unit="Ω"
                    color="#00897B"
                />

                <GraphCard
                    title="Current Density"
                    data={graphData}
                    dataKey="currentDensity"
                    unit="A/m²"
                    color="#6A1B9A"
                />

                <GraphCard
                    title="Electrode Potential"
                    data={graphData}
                    dataKey="electrodePotential"
                    unit="V"
                    color="#1565C0"
                />

                <GraphCard
                    title="Charge Efficiency"
                    data={graphData}
                    dataKey="coulombicEfficiency"
                    unit="Λ"
                    color="#2E7D32"
                />

                <GraphCard
                    title="Adsorption Rate"
                    data={graphData}
                    dataKey="adsorptionRate"
                    unit="mg/min"
                    color="#FB8C00"
                />

                <GraphCard
                    title="Water Recovery"
                    data={graphData}
                    dataKey="waterRecovery"
                    unit="%"
                    color="#0097A7"
                />

            </div>



         </div>

    );

}