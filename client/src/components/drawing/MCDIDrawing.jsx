import React from "react";

export default function MCDIDrawing() {

  return (

    <svg width="500" height="250">

      <rect
        x="120"
        y="80"
        width="260"
        height="90"
        fill="#e6ffe6"
        stroke="black"
      />

      <line
        x1="150"
        y1="80"
        x2="150"
        y2="170"
        stroke="red"
        strokeWidth="4"
      />

      <line
        x1="350"
        y1="80"
        x2="350"
        y2="170"
        stroke="blue"
        strokeWidth="4"
      />

      <text
        x="180"
        y="65"
        fontSize="16"
        fontWeight="bold"
      >
        MCDI Reactor
      </text>

    </svg>

  );

}