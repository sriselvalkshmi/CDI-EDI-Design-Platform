import React from "react";

/**
 * PumpComponent
 * Renders ANSI standard centrifugal or slurry peristaltic pump symbols
 * with dynamic sizing, customizable tag badge positioning, and interactive inspection.
 */
export default function PumpComponent({
    cx = 200,
    cy = 200,
    r = null,
    flowRate = 10, // L/min
    pressure = 1.0, // bar
    tag = "P-101",
    name = "Feed Pump",
    type = "Centrifugal Pump",
    material = "316L Stainless Steel",
    power = 0.75, // kW
    tagPosition = "bottom", // "top" | "bottom" | "right" | "left"
    onHover = null,
    onClick = null
}) {
    const radius = r || Math.max(18, Math.min(32, Math.round(20 * Math.pow(Math.max(1, flowRate) / 10, 0.35))));
    const isSlurry = tag.includes("SP");

    const specObj = {
        name,
        tag,
        type: isSlurry ? "Slurry Peristaltic Hose Pump" : type,
        material,
        flowRate: `${flowRate.toFixed(1)} L/min`,
        pressure: `${pressure.toFixed(2)} bar`,
        power: `${power.toFixed(2)} kW`,
        efficiency: "82%"
    };

    const badgeWidth = Math.max(46, tag.length * 7.5 + 8);

    let badgeX = cx - badgeWidth / 2;
    let badgeY = cy + radius + 6;

    if (tagPosition === "top") {
        badgeY = cy - radius - 20;
    } else if (tagPosition === "right") {
        badgeX = cx + radius + 6;
        badgeY = cy - 8;
    } else if (tagPosition === "left") {
        badgeX = cx - radius - badgeWidth - 6;
        badgeY = cy - 8;
    }

    return (
        <g
            className="pump-component"
            onMouseEnter={(e) => onHover && onHover(specObj, e)}
            onMouseLeave={() => onHover && onHover(null)}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(specObj);
            }}
            style={{ cursor: "pointer", transition: "all 0.3s ease" }}
        >
            {/* Pump Motor Drive Box */}
            <rect
                x={cx - 10}
                y={cy - radius - 12}
                width="20"
                height="12"
                fill="#334155"
                rx="3"
            />
            {/* Motor Cooling Fins */}
            <line x1={cx - 6} y1={cy - radius - 12} x2={cx - 6} y2={cy - radius} stroke="#94A3B8" strokeWidth="1" />
            <line x1={cx} y1={cy - radius - 12} x2={cx} y2={cy - radius} stroke="#94A3B8" strokeWidth="1" />
            <line x1={cx + 6} y1={cy - radius - 12} x2={cx + 6} y2={cy - radius} stroke="#94A3B8" strokeWidth="1" />

            {/* Pump Casing Outer Circle */}
            <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="#FFFFFF"
                stroke={isSlurry ? "#4F46E5" : "#0284C7"}
                strokeWidth="2.5"
            />

            {/* Tangential Nozzle Triangle / Impeller Blade */}
            <path
                d={`M ${cx - radius + 4} ${cy} L ${cx} ${cy - radius + 4} L ${cx} ${cy + radius - 4} Z`}
                fill={isSlurry ? "#4F46E5" : "#0284C7"}
            />
            <circle cx={cx} cy={cy} r="3.5" fill="#0369A1" />

            {/* Equipment Tag Badge */}
            <rect
                x={badgeX}
                y={badgeY}
                width={badgeWidth}
                height="15"
                fill={isSlurry ? "#4338CA" : "#0284C7"}
                rx="3"
            />
            <text
                x={badgeX + badgeWidth / 2}
                y={badgeY + 11}
                textAnchor="middle"
                fill="#FFFFFF"
                fontWeight="800"
                fontSize="9.5"
            >
                {tag}
            </text>
        </g>
    );
}
