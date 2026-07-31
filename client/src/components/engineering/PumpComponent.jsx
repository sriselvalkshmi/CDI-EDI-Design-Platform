import React from "react";

/**
 * PumpComponent
 * Renders ANSI standard centrifugal or slurry peristaltic pump symbols
 * with dynamic sizing based on flow rate.
 */
export default function PumpComponent({
    cx = 200,
    cy = 200,
    flowRate = 10, // L/min
    pressure = 1.0, // bar
    tag = "P-101",
    name = "Feed Pump",
    type = "Centrifugal Pump",
    material = "316L Stainless Steel",
    power = 0.75, // kW
    onHover = null
}) {
    // Dynamic pump size scaling (scales smoothly with flow rate Q)
    const radius = Math.max(18, Math.min(38, Math.round(20 * Math.pow(Math.max(1, flowRate) / 10, 0.35))));
    const isSlurry = tag.includes("SP");

    return (
        <g
            className="pump-component"
            onMouseEnter={(e) => onHover && onHover({
                name,
                tag,
                type: isSlurry ? "Slurry Peristaltic Hose Pump" : type,
                material,
                flowRate: `${flowRate.toFixed(1)} L/min`,
                pressure: `${pressure.toFixed(2)} bar`,
                power: `${power.toFixed(2)} kW`,
                efficiency: "82%"
            }, e)}
            onMouseLeave={() => onHover && onHover(null)}
            style={{ cursor: "pointer", transition: "all 0.3s ease" }}
        >
            {/* Pump Motor Drive Box */}
            <rect
                x={cx - 12}
                y={cy - radius - 14}
                width="24"
                height="14"
                fill="#334155"
                rx="3"
            />
            {/* Motor Cooling Fins */}
            <line x1={cx - 8} y1={cy - radius - 14} x2={cx - 8} y2={cy - radius} stroke="#94A3B8" strokeWidth="1" />
            <line x1={cx} y1={cy - radius - 14} x2={cx} y2={cy - radius} stroke="#94A3B8" strokeWidth="1" />
            <line x1={cx + 8} y1={cy - radius - 14} x2={cx + 8} y2={cy - radius} stroke="#94A3B8" strokeWidth="1" />

            {/* Pump Casing Outer Circle */}
            <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="#FFFFFF"
                stroke={isSlurry ? "#4936E4" : "#0284C7"}
                strokeWidth="3"
            />

            {/* Tangential Nozzle Triangle / Impeller Blade */}
            <path
                d={`M ${cx - radius + 4} ${cy} L ${cx} ${cy - radius + 4} L ${cx} ${cy + radius - 4} Z`}
                fill={isSlurry ? "#4936E4" : "#0284C7"}
            />
            <circle cx={cx} cy={cy} r="4" fill="#0369A1" />

            {/* Equipment Tag Badge */}
            <rect
                x={cx - 24}
                y={cy + radius + 6}
                width="48"
                height="16"
                fill={isSlurry ? "#4F46E5" : "#0284C7"}
                rx="4"
            />
            <text
                x={cx}
                y={cy + radius + 18}
                textAnchor="middle"
                fill="#FFFFFF"
                fontWeight="800"
                fontSize="10"
            >
                {tag}
            </text>
        </g>
    );
}
