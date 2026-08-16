import React from "react";

/**
 * MembraneComponent
 * Renders Cation Exchange Membrane (CEM) and Anion Exchange Membrane (AEM)
 * with dynamic thickness scaling.
 */
export default function MembraneComponent({
    x = 0,
    y = 0,
    width = 120,
    thickness = 4, // mm visual scale
    type = "CEM", // "CEM" | "AEM"
    material = "Fixed Ion Polymer Membrane",
    selectivity = "98.5%",
    onHover = null
}) {
    const isCEM = type === "CEM";
    const strokeColor = isCEM ? "#059669" : "#D97706";
    const fillColor = isCEM ? "#10B981" : "#F59E0B";

    return (
        <g
            className="membrane-component"
            onMouseEnter={(e) => onHover && onHover({
                name: isCEM ? "Cation Exchange Membrane (CEM)" : "Anion Exchange Membrane (AEM)",
                type: `${type} Ion Exchange Membrane`,
                material,
                thickness: `${thickness.toFixed(2)} mm`,
                selectivity,
                permselectivity: "High Permselectivity (>98%)"
            }, e)}
            onMouseLeave={() => onHover && onHover(null)}
            style={{ cursor: "pointer", transition: "all 0.3s ease" }}
        >
            {/* Membrane Rectangle */}
            <rect
                x={x}
                y={y}
                width={width}
                height={Math.max(2, thickness)}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="1"
                rx="1"
            />

            {/* Membrane Hatch Line Overlay */}
            <line
                x1={x}
                y1={y + thickness / 2}
                x2={x + width}
                y2={y + thickness / 2}
                stroke="#FFFFFF"
                strokeWidth="0.8"
                strokeDasharray="4,2"
            />

            {/* Membrane Tag Symbol */}
            <rect
                x={x + width + 4}
                y={y - 2}
                width="24"
                height="12"
                fill={fillColor}
                rx="2"
            />
            <text
                x={x + width + 16}
                y={y + 7}
                textAnchor="middle"
                fill="#FFFFFF"
                fontWeight="800"
                fontSize="8"
            >
                {type}
            </text>
        </g>
    );
}
