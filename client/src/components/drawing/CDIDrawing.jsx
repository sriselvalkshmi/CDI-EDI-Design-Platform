import React from "react";

export default function CDIDrawing() {
  return (
    <svg width="100%" height="220">

      <rect
        x="40"
        y="60"
        width="70"
        height="100"
        fill="#4caf50"
      />

      <rect
        x="180"
        y="60"
        width="70"
        height="100"
        fill="#2196f3"
      />

      <line
        x1="110"
        y1="110"
        x2="180"
        y2="110"
        stroke="black"
        strokeWidth="3"
      />

      <text x="55" y="50">
        Anode
      </text>

      <text x="190" y="50">
        Cathode
      </text>

    </svg>
  );
}