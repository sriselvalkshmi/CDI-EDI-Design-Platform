import React from "react";

/**
 * FlowAnimation
 * Dynamic vector flow lines, directional arrows, and TDS-driven ion transport particles.
 * Arrow thickness scales with flow rate Q.
 * Pressure drop drives pipe status color.
 * Salt removal animation shows ions disappearing near channel exit.
 */
export default function FlowAnimation({
    pathD = "",
    flowRate = 10,
    pressurePipeColor = "#22C55E",
    showIons = false,
    initialIonCount = 12,
    remainingIonCount = 2,
    particleOffset = 0,
    ionStartX = 400,
    ionStartY = 200,
    ionDistance = 120
}) {
    // Flow animation duration (sec) -> higher flow rate Q = faster animation (Requirement 7)
    const durationSec = Math.max(0.25, Math.min(2.5, 2.0 / (Math.max(1, flowRate) / 10)));
    // Arrow thickness scales directly with flow rate Q (5 L/min -> thin, 20 L/min -> thick)
    const arrowStrokeWidth = Math.max(2.5, Math.min(10, Math.round(2.5 + (flowRate / 4))));

    const animId = `flowDashAnim_${Math.round(flowRate * 100)}`;

    return (
        <g className="flow-animation-group">
            <style>{`
                @keyframes ${animId} {
                    0% { stroke-dashoffset: 40; }
                    100% { stroke-dashoffset: 0; }
                }
                .pipe-dash-line-${animId} {
                    stroke-dasharray: 12, 8;
                    animation: ${animId} ${durationSec.toFixed(2)}s linear infinite;
                }
            `}</style>

            {/* Base Pipe Outline Line */}
            {pathD && (
                <path
                    d={pathD}
                    fill="none"
                    stroke="#475569"
                    strokeWidth={arrowStrokeWidth + 1.5}
                    strokeLinecap="round"
                />
            )}

            {/* Animated Water Dash Line driven by Pressure Pipe Color */}
            {pathD && (
                <path
                    d={pathD}
                    fill="none"
                    stroke={pressurePipeColor}
                    strokeWidth={arrowStrokeWidth}
                    strokeLinecap="round"
                    className={`pipe-dash-line-${animId}`}
                />
            )}

            {/* Transporting Ions (Na+ and Cl-) along channels with Salt Removal Animation (Requirement 11 & 12) */}
            {showIons && (
                <g className="ion-transport-particles">
                    {Array.from({ length: initialIonCount }).map((_, idx) => {
                        const progress = (particleOffset + (idx * (100 / initialIonCount))) % 100;
                        const isDisappeared = progress > 70 && idx >= remainingIonCount;
                        if (isDisappeared) return null; // Ion adsorbed/removed!

                        const currentX = ionStartX + (progress / 100) * ionDistance;
                        const isNa = idx % 2 === 0;

                        return (
                            <g key={idx} opacity={progress > 60 ? 1 - (progress - 60) / 40 : 1.0}>
                                <circle
                                    cx={currentX}
                                    cy={isNa ? ionStartY - 12 : ionStartY + 14}
                                    r="4.5"
                                    fill={isNa ? "#3B82F6" : "#EF4444"}
                                    stroke={isNa ? "#1D4ED8" : "#B91C1C"}
                                    strokeWidth="1"
                                />
                                <text
                                    x={currentX}
                                    y={isNa ? ionStartY - 18 : ionStartY + 26}
                                    textAnchor="middle"
                                    fontSize="8.5"
                                    fontWeight="800"
                                    fill={isNa ? "#1D4ED8" : "#B91C1C"}
                                >
                                    {isNa ? "Na+" : "Cl-"}
                                </text>
                            </g>
                        );
                    })}
                </g>
            )}
        </g>
    );
}
