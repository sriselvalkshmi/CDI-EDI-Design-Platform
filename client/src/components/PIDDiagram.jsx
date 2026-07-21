import React from "react";
import { useApp } from "../context/AppContext";
import "../styles/pid.css";

export default function PIDDiagram() {
    const {
        designResult,
        selectedDesign,
        setSelectedEquipment
    } = useApp();

    const feedWater = designResult?.input?.feedWater || {};
    const engineering = designResult?.engineering;
    const simulation = designResult?.simulation;
    const layout = designResult?.pid;

    if (!designResult || !designResult.engineering || !designResult.pid) {
        return (
            <div className="panel">
                <h2>P&amp;ID Diagram</h2>
                <p>Generate a design first.</p>
            </div>
        );
    }

    const activeTech = engineering?.technology || selectedDesign || "CDI";
    const reactorColor = {
        CDI: "#99ffcc",
        MCDI: "#D9EAD3",
        FCDI: "#CFE2F3",
        EDI: "#F4CCCC"
    }[activeTech] || "#FFE699";

    const { equipment, pipes } = layout;

    return (
        <div className="panel">
            <h2>P&amp;ID Diagram</h2>
            <svg width="100%" height="420" viewBox="0 0 1000 420">
                {/* Render Pipes */}
                {pipes && pipes.map((pipe) => {
                    const pointsStr = pipe.points.map(p => p.join(",")).join(" ");
                    return (
                        <g key={pipe.id}>
                            <polyline
                                points={pointsStr}
                                className="pipe"
                                fill="none"
                                stroke="black"
                                strokeWidth="3"
                            />
                            <polyline
                                points={pointsStr}
                                className="waterFlow"
                                fill="none"
                                stroke="#1976d2"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                        </g>
                    );
                })}

                {/* Render Equipment */}
                {equipment && equipment.map((eq) => {
                    if (eq.type === "tank") {
                        const isProduct = eq.id === "PROD_TANK";
                        return (
                            <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                if (isProduct) {
                                    setSelectedEquipment({
                                        name: "Product Tank",
                                        type: "Storage Tank",
                                        OutletTDS: (simulation?.outputTDS ?? eq.data?.outletTDS) + " ppm",
                                        FlowRate: feedWater.flowRate + " L/min",
                                        Recovery: (simulation?.waterRecovery ?? eq.data?.recovery) + " %"
                                    });
                                } else {
                                    setSelectedEquipment({
                                        name: "Feed Tank",
                                        type: "Storage Tank",
                                        material: "HDPE",
                                        TDS: feedWater.tds + " ppm",
                                        FlowRate: feedWater.flowRate + " L/min",
                                        Pressure: feedWater.pressure + " bar",
                                        Temperature: feedWater.temperature + " °C"
                                    });
                                }
                            }}>
                                <rect
                                    x={eq.x}
                                    y={eq.y}
                                    width={eq.width}
                                    height={eq.height}
                                    fill={isProduct ? "#d9ffd9" : "#d9f0ff"}
                                    stroke="black"
                                    strokeWidth="2"
                                    rx="5"
                                />
                                <text x={eq.x + 15} y={eq.y + 30} fontWeight="bold" fontSize="13">{eq.name}</text>
                                <text x={eq.x + 15} y={eq.y + 60} fontSize="11" fill="#555">
                                    {isProduct ? `${simulation?.outputTDS ?? eq.data?.outletTDS} ppm` : `${feedWater.tds} ppm`}
                                </text>
                            </g>
                        );
                    }

                    if (eq.type === "instrument") {
                        const isPressure = eq.id === "PG";
                        return (
                            <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                if (isPressure) {
                                    setSelectedEquipment({
                                        name: "Pressure Gauge",
                                        tag: "PT",
                                        Pressure: feedWater.pressure + " bar",
                                        Status: "Normal"
                                    });
                                } else {
                                    setSelectedEquipment({
                                        name: "Flow Meter",
                                        tag: "FT",
                                        FlowRate: feedWater.flowRate + " L/min",
                                        Status: "Running"
                                    });
                                }
                            }}>
                                <circle
                                    cx={eq.x}
                                    cy={eq.y}
                                    r={eq.radius}
                                    fill="white"
                                    stroke={isPressure ? "red" : "blue"}
                                    strokeWidth="3"
                                />
                                <text x={eq.x - 8} y={eq.y + 4} fontSize="10" fontWeight="bold">
                                    {isPressure ? "PT" : "FT"}
                                </text>
                                <text x={eq.x - 30} y={eq.y - 25} fontSize="12" fill={isPressure ? "red" : "blue"}>
                                    {isPressure ? `${feedWater.pressure} bar` : `${feedWater.flowRate} L/min`}
                                </text>
                            </g>
                        );
                    }

                    if (eq.type === "pump") {
                        const isSlurry = eq.id === "SPUMP";
                        return (
                            <g key={eq.id} style={{ cursor: "pointer" }} onClick={() => {
                                setSelectedEquipment({
                                    name: isSlurry ? "Slurry Pump" : "Feed Pump",
                                    type: "Centrifugal Pump",
                                    FlowRate: feedWater.flowRate + " L/min",
                                    Pressure: feedWater.pressure + " bar",
                                    Power: engineering.power + " W"
                                });
                            }}>
                                <circle
                                    cx={eq.x}
                                    cy={eq.y}
                                    r={eq.radius}
                                    fill={isSlurry ? "#ffe599" : "#98fb98"}
                                    stroke="black"
                                    strokeWidth="3"
                                />
                                <text x={eq.x - 18} y={eq.y + 5} fontSize="11" fontWeight="bold">
                                    {isSlurry ? "Slurry" : "Pump"}
                                </text>
                            </g>
                        );
                    }

                    if (eq.type === "reactor") {
                        const condSensorX = eq.x + eq.width + 60;
                        return (
                            <g key={eq.id}>
                                {/* Reactor block */}
                                <g style={{ cursor: "pointer" }} onClick={() => {
                                    setSelectedEquipment({
                                        name: activeTech + " Reactor",
                                        Technology: activeTech,
                                        Voltage: engineering.voltage + " V",
                                        Current: engineering.current + " A",
                                        Power: engineering.power + " W",
                                        CurrentDensity: engineering.currentDensity + " A/m²",
                                        ElectrodeArea: engineering.electrodeArea + " cm²"
                                    });
                                }}>
                                    <rect
                                        x={eq.x}
                                        y={eq.y}
                                        width={eq.width}
                                        height={eq.height}
                                        fill={reactorColor}
                                        stroke="black"
                                        strokeWidth="2.5"
                                        rx="8"
                                    />
                                    <text x={eq.x + eq.width/2 - 40} y={eq.y + 35} fontWeight="bold" fontSize="15">{activeTech} Reactor</text>
                                    <text x={eq.x + 15} y={eq.y + 65} fontSize="13">Voltage: {engineering.voltage} V</text>
                                    <text x={eq.x + 15} y={eq.y + 95} fontSize="13">Current: {engineering.current} A</text>
                                    <text x={eq.x + 15} y={eq.y + 125} fontSize="11" fill="#444">Pairs: {engineering.cellPairs}</text>
                                </g>

                                {/* Conductivity Sensor (CT) */}
                                <g style={{ cursor: "pointer" }} onClick={() => {
                                    setSelectedEquipment({
                                        name: "Conductivity Sensor",
                                        tag: "CT",
                                        Conductivity: feedWater.conductivity + " µS/cm",
                                        OutletTDS: simulation.outputTDS + " ppm"
                                    });
                                }}>
                                    <circle
                                        cx={condSensorX}
                                        cy="190"
                                        r="18"
                                        fill="white"
                                        stroke="green"
                                        strokeWidth="3"
                                    />
                                    <text x={condSensorX - 7} y="194" fontSize="10" fontWeight="bold">CT</text>
                                </g>
                            </g>
                        );
                    }

                    if (eq.type === "electrode") {
                        return (
                            <rect
                                key={eq.id}
                                x={eq.x}
                                y={eq.y}
                                width={eq.width}
                                height={eq.height}
                                fill="#888"
                                stroke="black"
                                opacity="0.4"
                            />
                        );
                    }

                    return null;
                })}
            </svg>
        </div>
    );
}