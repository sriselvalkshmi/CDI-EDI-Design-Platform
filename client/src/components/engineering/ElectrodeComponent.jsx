import React from "react";

/**
 * ElectrodeComponent
 * Renders porous carbon electrodes with current-density driven heatmap gradient
 * (Blue -> Green -> Yellow -> Red) and animated electron flow along terminal busbars.
 */
export default function ElectrodeComponent({
    x = 0,
    y = 0,
    width = 120,
    height = 8,
    polarity = "positive", // "positive" | "negative"
    currentDensity = 150, // A/m²
    electronSpeedSec = 1.0,
    material = "Activated Carbon",
    onHover = null
}) {
    // Current Density Heatmap Scale (Requirement 9)
    let heatColor = "#3B82F6"; // Blue (< 100 A/m²)
    let heatLabel = "Low Current Density";
    if (currentDensity > 300) {
        heatColor = "#EF4444"; // Red (> 300 A/m²)
        heatLabel = "Very High Thermal Load";
    } else if (currentDensity > 200) {
        heatColor = "#F97316"; // Orange (200-300 A/m²)
        heatLabel = "High Current Load";
    } else if (currentDensity > 100) {
        heatColor = "#EAB308"; // Yellow (100-200 A/m²)
        heatLabel = "Medium Current Load";
    } else if (currentDensity > 50) {
        heatColor = "#22C55E"; // Green (50-100 A/m²)
        heatLabel = "Normal Current Load";
    }

    const isTitanium = material && material.includes("Titanium");
    const electrodeName = isTitanium 
        ? (isAnode ? "Titanium MMO Anode Plate" : "Titanium MMO Cathode Plate") 
        : (isAnode ? "Anode (+) Carbon Electrode Plate" : "Cathode (-) Carbon Electrode Plate");
    const electrodeType = isTitanium ? "Titanium MMO-coated Electrode" : "Porous Carbon Electrode";

    return (
        <g
            className="electrode-component"
            onMouseEnter={(e) => onHover && onHover({
                name: electrodeName,
                type: electrodeType,
                material: isTitanium ? "Titanium Grade 2 (Mixed Metal Oxide Coating, 8–10 yr life)" : material,
                currentDensity: `${currentDensity.toFixed(1)} A/m²`,
                thermalStatus: heatLabel,
                formulaUsed: "J = I / A_electrode",
                calculationSource: "engineeringEquationEngine & electrodeModel",
                dimensions: `${width}px L x ${height}px H`
            }, e)}
            onMouseLeave={() => onHover && onHover(null)}
            style={{ cursor: "pointer", transition: "all 0.3s ease" }}
        >
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={isAnode ? "#334155" : "#1E293B"} />
                    <stop offset="50%" stopColor={heatColor} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={isAnode ? "#334155" : "#1E293B"} />
                </linearGradient>

                {/* Carbon Porous Texture Pattern */}
                <pattern id="porousCarbonPattern" width="6" height="6" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#FFFFFF" opacity="0.15" />
                    <circle cx="5" cy="5" r="1" fill="#FFFFFF" opacity="0.12" />
                </pattern>

                {/* Animated Electron Keyframes */}
                <style>{`
                    @keyframes ${animId} {
                        0% { stroke-dashoffset: 20; }
                        100% { stroke-dashoffset: 0; }
                    }
                    .electron-flow-${animId} {
                        stroke-dasharray: 4, 4;
                        animation: ${animId} ${electronSpeedSec.toFixed(2)}s linear infinite;
                    }
                `}</style>
            </defs>

            {/* Electrode Main Rect */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={`url(#${gradientId})`}
                stroke={isAnode ? "#EF4444" : "#2563EB"}
                strokeWidth="1.5"
                rx="2"
            />

            {/* Porous Texture Overlay */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="url(#porousCarbonPattern)"
                rx="2"
            />

            {/* Terminal Busbar Connection Line with Animated Electron Dots */}
            <line
                x1={x}
                y1={y + height / 2}
                x2={x + width}
                y2={y + height / 2}
                stroke={isAnode ? "#FCA5A5" : "#93C5FD"}
                strokeWidth="1.5"
                className={`electron-flow-${animId}`}
            />

            {/* Polarity Sign Icon */}
            <circle
                cx={x - 10}
                cy={y + height / 2}
                r="7"
                fill={isAnode ? "#EF4444" : "#2563EB"}
            />
            <text
                x={x - 10}
                y={y + height / 2 + 3.5}
                textAnchor="middle"
                fill="#FFFFFF"
                fontWeight="900"
                fontSize="10"
            >
                {isAnode ? "+" : "-"}
            </text>
        </g>
    );
}
