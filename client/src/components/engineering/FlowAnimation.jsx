import React from "react";

/**
 * FlowAnimation
 * Dynamic vector flow lines and TDS-driven ion transport particles.
 * Arrow thickness scales with flow rate Q.
 * Pressure drop drives pipe status color.
 * Clean particle animation without visual clutter.
 */
export default function FlowAnimation({
    pathD = "",
    flowRate = 10,
    stroke = "#2563EB",
    strokeWidth = 3.5,
    showIons = false,
    initialIonCount = 10,
    remainingIonCount = 3,
    particleOffset = 0,
    ionStartX = 400,
    ionStartY = 200,
    ionDistance = 120
}) {
    const durationSec = Math.max(0.25, Math.min(2.5, 2.0 / (Math.max(1, flowRate) / 10)));
    const animId = `flowDashAnim_${Math.round(flowRate * 100)}`;

    return (
        <g className="flow-animation-group">
            <style>{`
                @keyframes ${animId} {
                    0% { stroke-dashoffset: 40; }
                    100% { stroke-dashoffset: 0; }
                }
                .pipe-dash-line-${animId} {
                    stroke-dasharray: 10, 6;
                    animation: ${animId} ${durationSec.toFixed(2)}s linear infinite;
                }
            `}</style>

            {/* Base Pipe Line */}
            {pathD && (
                <path
                    d={pathD}
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth={strokeWidth + 1.5}
                    strokeLinecap="round"
                />
            )}

            {/* Animated Water Stream Dash Line */}
            {pathD && (
                <path
                    d={pathD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className={`pipe-dash-line-${animId}`}
                />
            )}

            {/* Clean Animated Ion Particles (Sleek Blue Na+ & Red Cl- Dots) */}
            {showIons && (
                <g className="ion-transport-particles">
                    {Array.from({ length: initialIonCount }).map((_, idx) => {
                        const progress = (particleOffset + (idx * (100 / initialIonCount))) % 100;
                        const isDisappeared = progress > 75 && idx >= remainingIonCount;
                        if (isDisappeared) return null; // Ion adsorbed

                        const currentX = ionStartX + (progress / 100) * ionDistance;
                        const isNa = idx % 2 === 0;

                        return (
                            <circle
                                key={idx}
                                cx={currentX}
                                cy={isNa ? ionStartY - 6 : ionStartY + 6}
                                r="3.5"
                                fill={isNa ? "#2563EB" : "#EF4444"}
                                stroke="#FFFFFF"
                                strokeWidth="0.8"
                                opacity={progress > 65 ? 1 - (progress - 65) / 35 : 1.0}
                            />
                        );
                    })}
                </g>
            )}
        </g>
    );
}
