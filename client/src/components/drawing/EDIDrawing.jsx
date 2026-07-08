import React from "react";

export default function EDIDrawing() {

  return (

    <svg width="100%" height="300">

      <text
        x="130"
        y="25"
        fontSize="18"
        fontWeight="bold"
      >
        EDI System
      </text>

      {/* Inlet */}

      <line
        x1="10"
        y1="140"
        x2="60"
        y2="140"
        stroke="black"
        strokeWidth="3"
      />

      <text x="5" y="125">
        Inlet
      </text>

      {/* Electrode */}

      <rect
        x="60"
        y="60"
        width="18"
        height="160"
        fill="red"
      />

      {/* Resin */}

      <rect
        x="78"
        y="60"
        width="140"
        height="160"
        fill="#ffe082"
        stroke="black"
      />

      <text x="105" y="145">
        Resin Chamber
      </text>

      {/* Electrode */}

      <rect
        x="218"
        y="60"
        width="18"
        height="160"
        fill="blue"
      />

      {/* Membrane Stack */}

      <line x1="100" y1="60" x2="100" y2="220" stroke="gray" strokeWidth="2"/>

      <line x1="130" y1="60" x2="130" y2="220" stroke="gray" strokeWidth="2"/>

      <line x1="160" y1="60" x2="160" y2="220" stroke="gray" strokeWidth="2"/>

      <line x1="190" y1="60" x2="190" y2="220" stroke="gray" strokeWidth="2"/>

      <text x="90" y="240">
        Membrane Stack
      </text>

      {/* Outlet */}

      <line
        x1="236"
        y1="140"
        x2="300"
        y2="140"
        stroke="black"
        strokeWidth="3"
      />

      <text x="305" y="125">
        Outlet
      </text>

    </svg>

  );

}