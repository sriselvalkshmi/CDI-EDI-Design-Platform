import React from "react";
import { useApp } from "../context/AppContext";

export default function EngineeringLayout() {

    const { layout } = useApp();

    if (!layout) {

        return (

            <div className="panel">

                <h2>Engineering Layout</h2>

                <p>Generate a design first.</p>

            </div>

        );

    }

    return (

        <div className="panel">

            <h2>Engineering Layout</h2>

            <svg width="100%" height="300">

                <rect
                    x="70"
                    y="60"
                    width="260"
                    height="140"
                    fill="#f2f2f2"
                    stroke="black"
                />

                {
                    Array.from({
                        length: layout.cellPairs
                    }).map((_, i) => (

                        <line

                            key={i}

                            x1={85 + i * 10}

                            y1="60"

                            x2={85 + i * 10}

                            y2="200"

                            stroke="steelblue"

                            strokeWidth="2"

                        />

                    ))
                }

                <line
                    x1="20"
                    y1="130"
                    x2="70"
                    y2="130"
                    stroke="green"
                    strokeWidth="4"
                />

                <line
                    x1="330"
                    y1="130"
                    x2="380"
                    y2="130"
                    stroke="red"
                    strokeWidth="4"
                />

                <text x="5" y="120">
                    Inlet
                </text>

                <text x="385" y="120">
                    Outlet
                </text>

            </svg>

        </div>

    );

}