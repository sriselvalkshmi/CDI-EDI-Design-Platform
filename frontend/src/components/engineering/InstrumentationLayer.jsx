import React from "react";

/**
 * InstrumentationLayer
 * Renders ANSI standard instrument bubbles (FT101, PT101, PI101, CT101, TT101, LT101)
 * displaying live engineering calculation values directly bound to calculation outputs.
 */
export default function InstrumentationLayer({
    x = 0,
    y = 0,
    tag = "FT101",
    type = "FT", // "FT" | "PT" | "PI" | "CT" | "TT" | "LT"
    value = "10 L/min",
    label = "Flow Rate",
    onHover = null
}) {
    const isFlow = type === "FT" || type === "FI";
    const isPressure = type === "PT" || type === "PI";
    const isConductivity = type === "CT";
    const isTemp = type === "TT";

    const badgeColor = isFlow ? "#0284C7" : isPressure ? "#D97706" : isConductivity ? "#16A34A" : isTemp ? "#DC2626" : "#7C3AED";

    return (
        <g
            className="instrumentation-tag-bubble"
            onMouseEnter={(e) => onHover && onHover({
                name: `ANSI Instrument: ${tag}`,
                type: `ISA 5.1 ${type} Transmitter`,
                tag,
                parameter: label,
                liveValue: value,
                signalType: "4-20mA / HART Protocol"
            }, e)}
            onMouseLeave={() => onHover && onHover(null)}
            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
        >
            {/* Connecting Impulse Line */}
            <line x1={x} y1={y} x2={x} y2={y + 12} stroke="#64748B" strokeWidth="1.2" strokeDasharray="3,2" />

            {/* Instrument Bubble Circle */}
            <circle cx={x} cy={y} r="13" fill="#FFFFFF" stroke={badgeColor} strokeWidth="1.8" />
            <line x1={x - 13} y1={y} x2={x + 13} y2={y} stroke={badgeColor} strokeWidth="1" />

            {/* Tag Type Header */}
            <text x={x} y={y - 3} textAnchor="middle" fontSize="8" fontWeight="800" fill={badgeColor}>
                {type}
            </text>
            {/* Tag Number */}
            <text x={x} y={y + 8} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#334155">
                {tag.replace(/[^\d]/g, '') || "101"}
            </text>

            {/* Live Parameter Box */}
            <rect
                x={x - 30}
                y={y - 30}
                width="60"
                height="13"
                fill="#F8FAFC"
                stroke={badgeColor}
                strokeWidth="0.8"
                rx="3"
            />
            <text
                x={x}
                y={y - 20}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="800"
                fill="#0F172A"
            >
                {value}
            </text>
        </g>
    );
}
