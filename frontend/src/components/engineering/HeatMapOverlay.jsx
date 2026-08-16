import React from "react";

/**
 * HeatMapOverlay
 * Renders thermal dissipation heatmaps across electrode boundaries
 * driven by Current Density (A/m²).
 */
export default function HeatMapOverlay({
    x = 0,
    y = 0,
    width = 160,
    height = 120,
    currentDensity = 150 // A/m²
}) {
    let heatmapColor = "#22C55E"; // Green
    let label = "Cool (<100 A/m²)";

    if (currentDensity > 300) {
        heatmapColor = "#EF4444"; // Red
        label = "High Thermal (>300 A/m²)";
    } else if (currentDensity > 200) {
        heatmapColor = "#F97316"; // Orange
        label = "Warm (200-300 A/m²)";
    } else if (currentDensity > 100) {
        heatmapColor = "#EAB308"; // Yellow
        label = "Moderate (100-200 A/m²)";
    }

    const heatId = `heatMapGrad_${Math.round(x)}_${Math.round(y)}`;

    return (
        <g className="heatmap-overlay-group">
            <defs>
                <radialGradient id={heatId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={heatmapColor} stopOpacity="0.45" />
                    <stop offset="70%" stopColor={heatmapColor} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={heatmapColor} stopOpacity="0.0" />
                </radialGradient>
            </defs>

            {/* Radial Thermal Dissipation Glow */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={`url(#${heatId})`}
                rx="6"
                style={{ pointerEvents: "none" }}
            />
        </g>
    );
}
