import React from "react";

/**
 * TankComponent
 * Renders ANSI standard cylindrical process tanks or slurry agitator tanks
 * with dynamic volume scaling, liquid level sensors, level transmitter tags,
 * smart line-wrapped text containment, and interactive onClick equipment inspection support.
 */
export default function TankComponent({
    x = 40,
    y = 100,
    width = 100,
    height = 140,
    tag = "TK-101",
    name = "Feed Tank",
    type = "process", // "process" | "slurry" | "product"
    flowRate = 10,
    tds = 500,
    material = "HDPE / 316L Stainless",
    onHover = null,
    onClick = null
}) {
    const isSlurry = type === "slurry";
    const isProduct = type === "product";

    const strokeColor = isProduct ? "#16A34A" : isSlurry ? "#4338CA" : "#2563EB";
    const bodyFill = isProduct ? "#F0FDF4" : isSlurry ? "#1E1B4B" : "#EFF6FF";
    const levelFill = isProduct ? "#DCFCE7" : isSlurry ? "#312E81" : "#DBEAFE";
    const badgeFill = isProduct ? "#15803D" : isSlurry ? "#4F46E5" : "#1D4ED8";

    const specObj = {
        name,
        tag,
        type: isSlurry ? "Slurry Agitated Tank (Carbon Suspension)" : isProduct ? "Product Storage Tank" : "Feed Water Pretreatment Tank",
        material,
        volume: `${(flowRate * 12).toFixed(0)} L (Est.)`,
        tds: `${tds} ppm`,
        designPressure: "Atmospheric (1.0 bar)"
    };

    // Smart line splitting for names to prevent horizontal overflow in compact tanks
    const words = name.split(" ");
    let nameLines = [];
    if (words.length > 2) {
        nameLines = [
            words.slice(0, Math.ceil(words.length / 2)).join(" "),
            words.slice(Math.ceil(words.length / 2)).join(" ")
        ];
    } else {
        nameLines = [name];
    }

    const badgeWidth = Math.max(52, tag.length * 7.5 + 8);

    return (
        <g
            className="tank-component"
            onMouseEnter={(e) => onHover && onHover(specObj, e)}
            onMouseLeave={() => onHover && onHover(null)}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick(specObj);
            }}
            style={{ cursor: "pointer", transition: "all 0.3s ease" }}
        >
            {/* Cylindrical Metallic Tank Main Shell */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={bodyFill}
                stroke={strokeColor}
                strokeWidth="2.5"
                rx="8"
            />

            {/* Top & Bottom Dish Caps */}
            <ellipse cx={x + width / 2} cy={y} rx={width / 2} ry="8" fill={levelFill} stroke={strokeColor} strokeWidth="1.5" />
            <ellipse cx={x + width / 2} cy={y + height} rx={width / 2} ry="8" fill={levelFill} stroke={strokeColor} strokeWidth="1.5" />

            {/* Liquid Level Gauge Fill */}
            <rect
                x={x + 4}
                y={y + 20}
                width={width - 8}
                height={height - 24}
                fill={levelFill}
                opacity="0.85"
                rx="4"
            />
            <line x1={x + 4} y1={y + 20} x2={x + width - 4} y2={y + 20} stroke={strokeColor} strokeWidth="2" strokeDasharray="4,2" />

            {/* FCDI Impeller Mixer Shaft & Blades (Rendered subtly behind text) */}
            {isSlurry && (
                <g opacity="0.6">
                    <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height - 20} stroke="#818CF8" strokeWidth="2" />
                    <path d={`M ${x + width / 2 - 12} ${y + height - 18} L ${x + width / 2 + 12} ${y + height - 18}`} stroke="#A5B4FC" strokeWidth="2" />
                </g>
            )}

            {/* Equipment Tag Header Badge */}
            <rect
                x={x + width / 2 - badgeWidth / 2}
                y={y + 6}
                width={badgeWidth}
                height="16"
                fill={badgeFill}
                rx="4"
            />
            <text
                x={x + width / 2}
                y={y + 18}
                textAnchor="middle"
                fill="#FFFFFF"
                fontWeight="800"
                fontSize="9.5"
            >
                {tag}
            </text>

            {/* Tank Name Text (Smart Multi-line Wrap) */}
            <text
                x={x + width / 2}
                y={y + (nameLines.length > 1 ? height / 2 - 6 : height / 2 - 2)}
                textAnchor="middle"
                fontWeight="800"
                fontSize={width < 90 ? "9" : "10"}
                fill={isSlurry ? "#FFFFFF" : "#0F172A"}
            >
                {nameLines.map((line, idx) => (
                    <tspan key={idx} x={x + width / 2} dy={idx === 0 ? 0 : 12}>
                        {line}
                    </tspan>
                ))}
            </text>

            {/* Content TDS Value (Positioned cleanly at bottom dish area) */}
            <text
                x={x + width / 2}
                y={y + height - 10}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="800"
                fill={isProduct ? "#15803D" : isSlurry ? "#A5B4FC" : "#1D4ED8"}
            >
                {tds} ppm
            </text>
        </g>
    );
}
