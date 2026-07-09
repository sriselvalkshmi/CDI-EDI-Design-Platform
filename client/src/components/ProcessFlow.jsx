import React from "react";
import { useApp } from "../context/AppContext";

export default function ProcessFlow() {

    const {
        selectedDesign,
        feedWater,
        engineering,
        simulation
    } = useApp();

    if (!engineering) {
        return (
            <div className="panel">
                <h2>Process Flow Diagram</h2>
                <p>Generate a design first.</p>
            </div>
        );
    }

    return (

        <div className="panel">

            <h2>Interactive Process Flow</h2>

            <svg
                width="100%"
                height="280"
                viewBox="0 0 1000 280"
            >

                {/* Flow Lines */}

                <line x1="120" y1="140" x2="240" y2="140"
                    stroke="#0077cc"
                    strokeWidth="5"
                    strokeDasharray="10 6">

                    <animate
                        attributeName="stroke-dashoffset"
                        from="16"
                        to="0"
                        dur="0.6s"
                        repeatCount="indefinite"
                    />

                </line>

                <line x1="330" y1="140" x2="460" y2="140"
                    stroke="#0077cc"
                    strokeWidth="5"
                    strokeDasharray="10 6">

                    <animate
                        attributeName="stroke-dashoffset"
                        from="16"
                        to="0"
                        dur="0.6s"
                        repeatCount="indefinite"
                    />

                </line>

                <line x1="610" y1="140" x2="760" y2="140"
                    stroke="#0077cc"
                    strokeWidth="5"
                    strokeDasharray="10 6">

                    <animate
                        attributeName="stroke-dashoffset"
                        from="16"
                        to="0"
                        dur="0.6s"
                        repeatCount="indefinite"
                    />

                </line>

                {/* Feed Tank */}

                <rect
                    x="40"
                    y="100"
                    width="80"
                    height="80"
                    fill="#d8ecff"
                    stroke="black"
                />

                <text x="50" y="120" fontSize="14">
                    Feed Tank
                </text>

                <text x="48" y="145" fontSize="13">
                    {feedWater.tds} ppm
                </text>

                {/* Pump */}

                <circle
                    cx="285"
                    cy="140"
                    r="28"
                    fill="#99dd99"
                    stroke="black"
                />

                <text
                    x="270"
                    y="145"
                    fontSize="12"
                >
                    Pump
                </text>

                <text
                    x="245"
                    y="90"
                    fill="blue"
                    fontSize="13"
                >
                    {feedWater.flowRate} L/min
                </text>

                {/* Reactor */}

                <rect
                    x="460"
                    y="85"
                    width="150"
                    height="110"
                    fill="#ffe38d"
                    stroke="black"
                />

                <text
                    x="510"
                    y="110"
                    fontWeight="bold"
                >
                    {selectedDesign}
                </text>

                <text
                    x="485"
                    y="135"
                    fontSize="13"
                >
                    {engineering.voltage} V
                </text>

                <text
                    x="485"
                    y="160"
                    fontSize="13"
                >
                    {engineering.current} A
                </text>

                {/* Product Tank */}

                <rect
                    x="760"
                    y="100"
                    width="100"
                    height="80"
                    fill="#d7f4d7"
                    stroke="black"
                />

                <text
                    x="772"
                    y="122"
                    fontSize="13"
                >
                    Product
                </text>

                <text
                    x="772"
                    y="145"
                    fontSize="13"
                >
                    {simulation.outputTDS} ppm
                </text>

                {/* Pressure */}

                <text
                    x="360"
                    y="110"
                    fill="red"
                >
                    {feedWater.pressure} bar
                </text>

            </svg>

        </div>

    );

}