import React from "react";

export default function FCDIDrawing() {

  return (

    <svg width="100%" height="320">

      <text x="120" y="25" fontSize="18" fontWeight="bold">
        FCDI System
      </text>

      {/* Slurry Tank */}

      <rect
        x="20"
        y="70"
        width="80"
        height="80"
        fill="#8bc34a"
        stroke="black"
      />

      <text x="30" y="170">
        Slurry Tank
      </text>

      {/* Pump */}

      <circle
        cx="150"
        cy="110"
        r="22"
        fill="#03a9f4"
        stroke="black"
      />

      <text x="138" y="115">
        Pump
      </text>

      {/* Reactor */}

      <rect
        x="220"
        y="60"
        width="80"
        height="120"
        fill="#ffcc80"
        stroke="black"
      />

      <text x="230" y="200">
        Reactor
      </text>

      {/* Pipes */}

      <line
        x1="100"
        y1="110"
        x2="128"
        y2="110"
        stroke="black"
        strokeWidth="3"
      />

      <line
        x1="172"
        y1="110"
        x2="220"
        y2="110"
        stroke="black"
        strokeWidth="3"
      />

      {/* Return Line */}

      <line
        x1="260"
        y1="180"
        x2="260"
        y2="260"
        stroke="green"
        strokeWidth="3"
      />

      <line
        x1="260"
        y1="260"
        x2="60"
        y2="260"
        stroke="green"
        strokeWidth="3"
      />

      <line
        x1="60"
        y1="260"
        x2="60"
        y2="150"
        stroke="green"
        strokeWidth="3"
      />

      <text x="140" y="280">
        Slurry Return Line
      </text>

    </svg>

  );

}