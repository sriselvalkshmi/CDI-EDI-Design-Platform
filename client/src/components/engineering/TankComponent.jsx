import React from "react";

/**
 * TankComponent
 * Renders ANSI standard cylindrical process tanks or slurry agitator tanks
 * with dynamic volume scaling, liquid level sensors, and level transmitter tags.
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
    onHover = null
}) {
    const isSlurry = type === "slurry";
    const isProduct = type === "product";

    const strokeColor = isProduct ? "#16A34A" : isSlurry ? "#312E81" : "#2563EB";
    const bodyFill = isProduct ? "#F0FDF4" : isSlurry ? "#312E81" : "#EFF6FF";
    const levelFill = isProduct ? "#DCFCE7" : isSlurry ? "#1E1B4B" : "#DBEAFE";

    return (
        <g
            className="tank-component"
            onMouseEnter={(e) => onHover && onHover({
                name,
                tag,
                type: isSlurry ? "Slurry Agitated Tank (Carbon Suspension)" : isProduct ? "Product Storage Tank" : "Feed Water Pretreatment Tank",
                material,
                volume: `${(flowRate * 12).toFixed(0)} L (Est.)`,
                tds: `${tds} ppm`,
                designPressure: "Atmospheric (1.0 bar)"
            }, e)}
            onMouseLeave={() => onHover && onHover(null)}
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

            {/* FCDI Impeller Mixer Shaft & Blades */}
            {isSlurry && (
                <g>
                    <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height - 20} stroke="#94A3B8" strokeWidth="3" />
                    <path d={`M ${x + width / 2 - 15} ${y + height - 20} L ${x + width / 2 + 15} ${y + height - 20} M ${x + width / 2 - 10} ${y + height - 30} L ${x + width / 2 + 10} ${y + height - 10}`} stroke="#E2E8F0" strokeWidth="2" />
                </g>
            )}

            {/* Equipment Tag Header */}
            <rect
                x={x + width / 2 - 25}
                y={y + 8}
                width="50"
                height="16"
                fill={strokeColor}
                rx="4"
            />
            <text
                x={x + width / 2}
                y={y + 20}
                textAnchor="middle"
                fill="#FFFFFF"
                fontWeight="800"
                fontSize="10"
            >
                {tag}
            </text>

            {/* Tank Name & Content Text */}
            <text x={x + width / 2} y={y + height / 2 - 4} textAnchor="middle" fontWeight="800" fontSize="11" fill={isSlurry ? "#FFFFFF" : "#1E293B"}>
                {name}
            </text>
            <text x={x + width / 2} y={y + height / 2 + 14} textAnchor="middle" fontSize="10" fontWeight="700" fill={isProduct ? "#16A34A" : isSlurry ? "#C7D2FE" : "#2563EB"}>
                {tds} ppm
            </text>
        </g>
    );
}
