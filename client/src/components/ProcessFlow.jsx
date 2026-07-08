import React from "react";
import { useApp } from "../context/AppContext";

export default function ProcessFlow() {

    const {
        feedWater,
        engineering,
        simulation,
        selectedDesign
    } = useApp();

    if (!engineering || !simulation)
        return null;

    return (

        <div className="panel">

            <h2>Process Flow Diagram</h2>

            <svg width="100%" height="260">

                {/* Feed Tank */}

                <rect
                    x="20"
                    y="80"
                    width="90"
                    height="80"
                    fill="#90caf9"
                    stroke="black"
                />

                <text x="35" y="105">
                    Feed Water
                </text>

                <text x="30" y="125">
                    {feedWater.tds} ppm
                </text>

                {/* Pump */}

                <circle
                    cx="180"
                    cy="120"
                    r="22"
                    fill="#81c784"
                    stroke="black"
                />

                <text
                    x="166"
                    y="126"
                    fontSize="11"
                >
                    Pump
                </text>

                {/* Line */}

                <line
                    x1="110"
                    y1="120"
                    x2="158"
                    y2="120"
                    stroke="black"
                    strokeWidth="3"
                />

                <line
                    x1="202"
                    y1="120"
                    x2="270"
                    y2="120"
                    stroke="black"
                    strokeWidth="3"
                />

                {/* Reactor */}

                <rect
                    x="270"
                    y="70"
                    width="130"
                    height="100"
                    fill="#ffe082"
                    stroke="black"
                />

                <text
                    x="305"
                    y="95"
                    fontWeight="bold"
                >
                    {selectedDesign}
                </text>

                <text x="285" y="120">
                    {engineering.voltage} V
                </text>

                <text x="285" y="140">
                    {engineering.current} A
                </text>

                {/* Product */}

                <line
                    x1="400"
                    y1="120"
                    x2="470"
                    y2="120"
                    stroke="black"
                    strokeWidth="3"
                />

                <rect
                    x="470"
                    y="80"
                    width="110"
                    height="80"
                    fill="#c8e6c9"
                    stroke="black"
                />

                <text x="485" y="105">
                    Product
                </text>

                <text x="485" y="125">
                    {simulation.outputTDS} ppm
                </text>

                {/* Flow */}

                <text
                    x="145"
                    y="80"
                    fill="blue"
                >
                    {feedWater.flowRate} L/min
                </text>

            </svg>

        </div>

    );

}