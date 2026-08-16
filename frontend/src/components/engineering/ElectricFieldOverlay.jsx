import React from "react";

/**
 * ElectricFieldOverlay
 * Renders electric field lines (E-field vectors) and voltage glow aura
 * between positive and negative electrodes, scaling with operating voltage.
 */
export default function ElectricFieldOverlay({
    x = 0,
    y = 0,
    width = 160,
    height = 160,
    voltage = 1.2, // V
    technology = "CDI"
}) {
    // Glow Filter Intensity & Aura Radius
    const maxV = technology === "EDI" ? 30.0 : 2.0;
    const intensity = Math.min(1.0, Math.max(0.2, voltage / maxV));
    const glowId = `vGlow_${Math.round(x)}_${Math.round(y)}`;

    return (
        <g className="electric-field-overlay">
            <defs>
                <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation={3 + intensity * 6} result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Glowing Electrical Boundary Box */}
            <rect
                x={x - 4}
                y={y - 4}
                width={width + 8}
                height={height + 8}
                fill="none"
                stroke={technology === "EDI" ? "#A855F7" : technology === "FCDI" ? "#6366F1" : "#3B82F6"}
                strokeWidth="1.5"
                strokeDasharray="6,3"
                rx="8"
                filter={`url(#${glowId})`}
                opacity={0.3 + intensity * 0.7}
            />

            {/* Electric Field Vector Arrows (E-field) */}
            {Array.from({ length: 4 }).map((_, idx) => {
                const vectorY = y + 25 + idx * ((height - 50) / 3);
                return (
                    <g key={idx} opacity={0.4 + intensity * 0.6}>
                        <line
                            x1={x + 20}
                            y1={vectorY}
                            x2={x + width - 20}
                            y2={vectorY}
                            stroke={technology === "EDI" ? "#A855F7" : "#3B82F6"}
                            strokeWidth="1"
                            strokeDasharray="4,2"
                        />
                        <polygon
                            points={`${x + width - 16},${vectorY} ${x + width - 24},${vectorY - 3} ${x + width - 24},${vectorY + 3}`}
                            fill={technology === "EDI" ? "#A855F7" : "#3B82F6"}
                        />
                    </g>
                );
            })}
        </g>
    );
}
