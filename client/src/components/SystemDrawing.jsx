import React from "react";
import { useApp } from "../context/AppContext";

export default function SystemDrawing() {

    const {

        selectedDesign,

        designParameters

    } = useApp();

    return (

        <div className="panel">

            <h2>Engineering Layout</h2>

            <svg
                width="100%"
                height="500"
            >

                <rect
                    x="250"
                    y="40"
                    width="200"
                    height="60"
                    fill="#4caf50"
                />

                <text
                    x="300"
                    y="75"
                >
                    Raw Water
                </text>

                <line
                    x1="350"
                    y1="100"
                    x2="350"
                    y2="160"
                    stroke="black"
                    strokeWidth="2"
                />

                {

                    selectedDesign==="CDI" &&

                    <>

                        <rect
                            x="220"
                            y="160"
                            width="260"
                            height="180"
                            fill="#eeeeee"
                            stroke="black"
                        />

                        <text
                            x="290"
                            y="190"
                        >
                            CDI Cell
                        </text>

                        <line
                            x1="240"
                            y1="230"
                            x2="460"
                            y2="230"
                            stroke="red"
                            strokeWidth="4"
                        />

                        <line
                            x1="240"
                            y1="270"
                            x2="460"
                            y2="270"
                            stroke="blue"
                            strokeWidth="4"
                        />

                    </>

                }

                {

                    selectedDesign==="MCDI" &&

                    <>

                        <rect
                            x="220"
                            y="160"
                            width="260"
                            height="220"
                            fill="#eeeeee"
                            stroke="black"
                        />

                        <text
                            x="280"
                            y="185"
                        >
                            MCDI Cell
                        </text>

                        <line
                            x1="240"
                            y1="220"
                            x2="460"
                            y2="220"
                            stroke="green"
                            strokeWidth="3"
                        />

                        <line
                            x1="240"
                            y1="240"
                            x2="460"
                            y2="240"
                            stroke="red"
                            strokeWidth="3"
                        />

                        <line
                            x1="240"
                            y1="260"
                            x2="460"
                            y2="260"
                            stroke="blue"
                            strokeWidth="3"
                        />

                        <line
                            x1="240"
                            y1="280"
                            x2="460"
                            y2="280"
                            stroke="green"
                            strokeWidth="3"
                        />

                    </>

                }

                {

                    selectedDesign==="FCDI" &&

                    <>

                        <ellipse
                            cx="350"
                            cy="240"
                            rx="120"
                            ry="80"
                            fill="#dddddd"
                            stroke="black"
                        />

                        <text
                            x="305"
                            y="245"
                        >
                            FCDI Reactor
                        </text>

                    </>

                }

                {

                    selectedDesign==="EDI" &&

                    <>

                        <rect
                            x="220"
                            y="160"
                            width="260"
                            height="220"
                            fill="#dddddd"
                            stroke="black"
                        />

                        <text
                            x="305"
                            y="185"
                        >
                            EDI Stack
                        </text>

                    </>

                }

                <line
                    x1="350"
                    y1="380"
                    x2="350"
                    y2="430"
                    stroke="black"
                    strokeWidth="2"
                />

                <rect
                    x="250"
                    y="430"
                    width="200"
                    height="60"
                    fill="#03a9f4"
                />

                <text
                    x="290"
                    y="465"
                >
                    Product Water
                </text>

            </svg>

        </div>

    );

}