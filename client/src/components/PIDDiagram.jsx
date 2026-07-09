import React from "react";
import { useApp } from "../context/AppContext";
import "../styles/pid.css";

export default function PIDDiagram() {

    const {
        feedWater,
        engineering,
        simulation,
        selectedDesign,
        setSelectedEquipment
    } = useApp();

    if (!engineering || !simulation) {
        return (
            <div className="panel">
                <h2>P&amp;ID Diagram</h2>
                <p>Generate a design first.</p>
            </div>
        );
    }

    const reactorColor = {
        CDI: "#FFE699",
        MCDI: "#D9EAD3",
        FCDI: "#CFE2F3",
        EDI: "#F4CCCC"
    }[selectedDesign] || "#FFE699";

    return (

        <div className="panel">

            <h2>P&amp;ID Diagram</h2>

            <svg width="100%" height="420" viewBox="0 0 1000 420">

                {/* Feed Tank */}

                <rect
                    x="40"
                    y="120"
                    width="120"
                    height="140"
                    fill="#d9f0ff"
                    stroke="black"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                        setSelectedEquipment({
                            name: "Feed Tank",
                            type: "Storage Tank",
                            material: "HDPE",
                            TDS: feedWater.tds + " ppm",
                            FlowRate: feedWater.flowRate + " L/min",
                            Pressure: feedWater.pressure + " bar",
                            Temperature: feedWater.temperature + " °C"
                        })
                    }
                />

                <text x="60" y="150">Feed Tank</text>

                <text x="55" y="180">
                    {feedWater.tds} ppm
                </text>

                {/* Feed Pipe */}

                <line
                    className="pipe"
                    x1="160"
                    y1="190"
                    x2="280"
                    y2="190"
                />

                <line
                    className="waterFlow"
                    x1="160"
                    y1="190"
                    x2="280"
                    y2="190"
                />

                {/* Flow Meter */}

                <circle
                    cx="220"
                    cy="190"
                    r="18"
                    fill="white"
                    stroke="blue"
                    strokeWidth="3"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                        setSelectedEquipment({
                            name: "Flow Meter",
                            tag: "FT",
                            FlowRate: feedWater.flowRate + " L/min",
                            Status: "Running"
                        })
                    }
                />

                <text
                    x="208"
                    y="196"
                    fontSize="10"
                >
                    FT
                </text>

                <text
                    x="190"
                    y="160"
                    fontSize="12"
                    fill="blue"
                >
                    {feedWater.flowRate} L/min
                </text>

                {/* Pump */}

                <circle
                    cx="340"
                    cy="190"
                    r="30"
                    fill="#98fb98"
                    stroke="black"
                    strokeWidth="3"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                        setSelectedEquipment({
                            name: "Pump",
                            type: "Centrifugal Pump",
                            FlowRate: feedWater.flowRate + " L/min",
                            Pressure: feedWater.pressure + " bar",
                            Power: engineering.power + " W"
                        })
                    }
                />

                <text
                    x="317"
                    y="196"
                >
                    Pump
                </text>

                {/* Pressure Gauge */}

                <circle
                    cx="340"
                    cy="110"
                    r="18"
                    fill="white"
                    stroke="red"
                    strokeWidth="3"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                        setSelectedEquipment({
                            name: "Pressure Gauge",
                            tag: "PT",
                            Pressure: feedWater.pressure + " bar",
                            Status: "Normal"
                        })
                    }
                />

                <text
                    x="330"
                    y="116"
                    fontSize="10"
                >
                    PT
                </text>

                <text
                    x="300"
                    y="75"
                    fill="red"
                    fontSize="12"
                >
                    {feedWater.pressure} bar
                </text>

                {/* Pipe */}

                <line
                    className="pipe"
                    x1="375"
                    y1="190"
                    x2="520"
                    y2="190"
                />

                <line
                    className="waterFlow"
                    x1="375"
                    y1="190"
                    x2="520"
                    y2="190"
                />

                {/* Reactor */}

                <rect
                    x="520"
                    y="110"
                    width="180"
                    height="160"
                    fill={reactorColor}
                    stroke="black"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                        setSelectedEquipment({
                            name: selectedDesign + " Reactor",
                            Technology: selectedDesign,
                            Voltage: engineering.voltage + " V",
                            Current: engineering.current + " A",
                            Power: engineering.power + " W",
                            CurrentDensity:
                                engineering.currentDensity + " A/cm²",
                            ElectrodeArea:
                                engineering.electrodeArea + " cm²"
                        })
                    }
                />

                <text
                    x="565"
                    y="145"
                    fontWeight="bold"
                >
                    {selectedDesign}
                </text>

                <text x="545" y="175">
                    Voltage
                </text>

                <text x="620" y="175">
                    {engineering.voltage} V
                </text>

                <text x="545" y="205">
                    Current
                </text>

                <text x="620" y="205">
                    {engineering.current} A
                </text>

                {/* Conductivity Sensor */}

                <circle
                    cx="610"
                    cy="85"
                    r="18"
                    fill="white"
                    stroke="green"
                    strokeWidth="3"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                        setSelectedEquipment({
                            name: "Conductivity Sensor",
                            tag: "CT",
                            Conductivity:
                                feedWater.conductivity + " µS/cm",
                            OutletTDS:
                                simulation.outputTDS + " ppm"
                        })
                    }
                />

                <text
                    x="598"
                    y="90"
                    fontSize="10"
                >
                    CT
                </text>

                {/* Outlet Pipe */}

                <line
                    className="pipe"
                    x1="700"
                    y1="190"
                    x2="850"
                    y2="190"
                />

                <line
                    className="waterFlow"
                    x1="700"
                    y1="190"
                    x2="850"
                    y2="190"
                />

                {/* Product Tank */}

                <rect
                    x="850"
                    y="120"
                    width="120"
                    height="140"
                    fill="#d9ffd9"
                    stroke="black"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                        setSelectedEquipment({
                            name: "Product Tank",
                            type: "Storage Tank",
                            OutletTDS:
                                simulation.outputTDS + " ppm",
                            FlowRate:
                                feedWater.flowRate + " L/min",
                            Recovery:
                                simulation.recovery + " %"
                        })
                    }
                />

                <text
                    x="870"
                    y="150"
                >
                    Product
                </text>

                <text
                    x="865"
                    y="180"
                >
                    {simulation.outputTDS} ppm
                </text>

            </svg>

        </div>

    );

}