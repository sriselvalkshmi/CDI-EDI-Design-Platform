import React from "react";
import { useApp } from "../context/AppContext";
import engineeringEquationEngine from "@shared/engineering/engine/engineeringEquationEngine.js";

export default function TechTradeoffsPanel() {
    const { designResult, technology, setTechnology, recalculate, optimizationInputs } = useApp();
    if (!designResult || !designResult.engineering) return null;

    const engineering = designResult.engineering || {};
    const feedWater = designResult.input?.feedWater || {};
    const selectedTech = engineering.technology || (technology !== "AUTO" ? technology : "MCDI");

    const feedTds = Number(feedWater.tds ?? 500);
    const targetTds = Number(feedWater.targetTds ?? 50);

    const handleSelectTech = (techKey) => {
        setTechnology(techKey);
        recalculate({ ...optimizationInputs, cellPairs: undefined, electrodeArea: undefined, voltage: undefined, current: undefined }, techKey, false);
    };

    // Evaluate each technology dynamically against the exact user feedWater
    const mcdiModel = selectedTech === "MCDI" ? engineering : engineeringEquationEngine({ technology: "MCDI", feedWater });
    const cdiModel = selectedTech === "CDI" ? engineering : engineeringEquationEngine({ technology: "CDI", feedWater });
    const fcdiModel = selectedTech === "FCDI" ? engineering : engineeringEquationEngine({ technology: "FCDI", feedWater });
    const ediModel = selectedTech === "EDI" ? engineering : engineeringEquationEngine({ technology: "EDI", feedWater });

    const isMcdiPass = Number(mcdiModel.outletTDS) <= targetTds;
    const isCdiPass = Number(cdiModel.outletTDS) <= targetTds;
    const isFcdiPass = Number(fcdiModel.outletTDS) <= targetTds;
    const isEdiPass = Number(ediModel.outletTDS) <= targetTds;

    const isEdiFeedViolated = feedTds > 30 || Number(feedWater.hardness || 0) > 0.5;

    const techRows = [
        {
            key: "MCDI",
            name: "MCDI",
            desc: "Membrane Capacitive Deionization (AEM/CEM Pairing)",
            feedEnvelope: feedTds >= 100 && feedTds <= 3000 ? "PASS" : (feedTds < 100 ? "REVIEW" : "FAIL"),
            feedDetails: "100–3,000 mg/L",
            productTarget: isMcdiPass ? "PASS" : "FAIL",
            productDetails: `${Number(mcdiModel.outletTDS).toFixed(1)} mg/L`,
            grossSec: `${Number(mcdiModel.secElectricalGross).toFixed(3)} kWh/m³`,
            directFeed: "YES",
            directDetails: "Hardness ≤ 200 mg/L",
            result: isMcdiPass ? "PASS" : "FAIL",
            resultType: isMcdiPass ? "PASS" : "FAIL"
        },
        {
            key: "CDI",
            name: "CDI",
            desc: "Capacitive Deionization (Membrane-Free)",
            feedEnvelope: feedTds <= 1000 ? "PASS" : "REVIEW",
            feedDetails: "100–1,000 mg/L",
            productTarget: isCdiPass ? "PASS" : "FAIL",
            productDetails: `${Number(cdiModel.outletTDS).toFixed(1)} mg/L ceiling`,
            grossSec: `${Number(cdiModel.secElectricalGross).toFixed(3)} kWh/m³`,
            directFeed: "YES",
            directDetails: "Direct feed ok",
            result: isCdiPass ? "PASS" : "FAIL",
            resultType: isCdiPass ? "PASS" : "FAIL"
        },
        {
            key: "FCDI",
            name: "FCDI",
            desc: "Flow-Electrode CDI (Circulating Carbon Slurry)",
            feedEnvelope: feedTds >= 1000 && feedTds <= 15000 ? "PASS" : "REVIEW",
            feedDetails: "Preferred 1,000–15,000 mg/L",
            productTarget: isFcdiPass ? "PASS" : "FAIL",
            productDetails: `${Number(fcdiModel.outletTDS).toFixed(1)} mg/L`,
            grossSec: `${Number(fcdiModel.secElectricalGross).toFixed(3)} kWh/m³`,
            directFeed: "YES",
            directDetails: "Slurry pump duty",
            result: isFcdiPass ? "PASS" : "CONDITIONAL",
            resultType: isFcdiPass ? "PASS" : "REVIEW"
        },
        {
            key: "EDI",
            name: "EDI",
            desc: "Electrodeionization (Continuous Mixed-Bed Resin)",
            feedEnvelope: !isEdiFeedViolated ? "PASS" : "FAIL",
            feedDetails: "Requires < 30 mg/L",
            productTarget: isEdiPass ? "PASS" : "FAIL",
            productDetails: `${Number(ediModel.outletTDS).toFixed(1)} mg/L`,
            grossSec: `${Number(ediModel.secElectricalGross).toFixed(3)} kWh/m³`,
            directFeed: !isEdiFeedViolated ? "YES" : "NO",
            directDetails: "Hardness ≤ 0.5 mg/L limit",
            result: !isEdiFeedViolated && isEdiPass ? "PASS" : "FAIL",
            resultType: !isEdiFeedViolated && isEdiPass ? "PASS" : "FAIL"
        }
    ];

    return (
        <div className="panel tech-tradeoffs-panel" style={{
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: "4px",
            padding: "14px 16px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "12.5px", fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Technology Screening
                    </h3>
                    <span style={{ fontSize: "10.5px", color: "#64748B" }}>
                        Feed: {feedTds} mg/L TDS | Target: ≤ {targetTds} mg/L (NaCl-equivalent basis)
                    </span>
                </div>
                <div style={{ fontSize: "11px", color: "#334155" }}>
                    Active Configuration: <strong style={{ color: "#1D4ED8" }}>{selectedTech}</strong>
                </div>
            </div>

            {/* INDUSTRIAL CONSTRAINT EVALUATION TABLE */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}>
                    <thead>
                        <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #CBD5E1", color: "#475569" }}>
                            <th style={{ padding: "6px 8px", fontWeight: "700" }}>Technology</th>
                            <th style={{ padding: "6px 8px", fontWeight: "700" }}>Feed Envelope</th>
                            <th style={{ padding: "6px 8px", fontWeight: "700" }}>Product Target</th>
                            <th style={{ padding: "6px 8px", fontWeight: "700" }}>Gross SEC</th>
                            <th style={{ padding: "6px 8px", fontWeight: "700" }}>Direct Feed</th>
                            <th style={{ padding: "6px 8px", fontWeight: "700" }}>Constraint Result</th>
                            <th style={{ padding: "6px 8px", fontWeight: "700", textAlign: "right" }}>Selection</th>
                        </tr>
                    </thead>
                    <tbody>
                        {techRows.map((row) => {
                            const isSelected = selectedTech === row.key;
                            const isFail = row.resultType === "FAIL";

                            let statusBadgeBg = "#DCFCE7";
                            let statusBadgeColor = "#15803D";
                            let statusBorder = "#BBF7D0";

                            if (row.resultType === "FAIL") {
                                statusBadgeBg = "#FEE2E2";
                                statusBadgeColor = "#991B1B";
                                statusBorder = "#FECACA";
                            } else if (row.resultType === "REVIEW") {
                                statusBadgeBg = "#FEF3C7";
                                statusBadgeColor = "#92400E";
                                statusBorder = "#FDE68A";
                            }

                            return (
                                <tr
                                    key={row.key}
                                    style={{
                                        borderBottom: "1px solid #F1F5F9",
                                        background: isSelected ? "#EFF6FF" : "transparent"
                                    }}
                                >
                                    <td style={{ padding: "6px 8px", fontWeight: "700", color: "#0F172A" }}>
                                        <div>{row.name}</div>
                                        <div style={{ fontSize: "9.5px", color: "#64748B", fontWeight: "400" }}>{row.desc}</div>
                                    </td>
                                    <td style={{ padding: "6px 8px" }}>
                                        <span style={{ fontWeight: "600", color: row.feedEnvelope === "PASS" ? "#15803D" : row.feedEnvelope === "FAIL" ? "#991B1B" : "#92400E" }}>
                                            {row.feedEnvelope}
                                        </span>
                                        <div style={{ fontSize: "9.5px", color: "#64748B" }}>{row.feedDetails}</div>
                                    </td>
                                    <td style={{ padding: "6px 8px" }}>
                                        <span style={{ fontWeight: "600", color: row.productTarget === "PASS" ? "#15803D" : "#991B1B" }}>
                                            {row.productTarget}
                                        </span>
                                        <div style={{ fontSize: "9.5px", color: "#64748B" }}>{row.productDetails}</div>
                                    </td>
                                    <td style={{ padding: "6px 8px", fontWeight: "600", color: "#0F172A", fontFamily: "monospace" }}>
                                        {row.grossSec}
                                    </td>
                                    <td style={{ padding: "6px 8px" }}>
                                        <span style={{ fontWeight: "600", color: row.directFeed === "YES" ? "#15803D" : "#991B1B" }}>
                                            {row.directFeed}
                                        </span>
                                        <div style={{ fontSize: "9.5px", color: "#64748B" }}>{row.directDetails}</div>
                                    </td>
                                    <td style={{ padding: "6px 8px" }}>
                                        <span style={{
                                            fontSize: "9.5px",
                                            fontWeight: "700",
                                            padding: "2px 6px",
                                            borderRadius: "2px",
                                            background: statusBadgeBg,
                                            color: statusBadgeColor,
                                            border: `1px solid ${statusBorder}`
                                        }}>
                                            {row.result}
                                        </span>
                                    </td>
                                    <td style={{ padding: "6px 8px", textAlign: "right" }}>
                                        {isSelected ? (
                                            <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#1D4ED8", background: "#DBEAFE", padding: "2px 8px", borderRadius: "2px", border: "1px solid #93C5FD" }}>
                                                SELECTED
                                            </span>
                                        ) : isFail ? (
                                            <span style={{ fontSize: "11px", color: "#94A3B8" }}>—</span>
                                        ) : (
                                            <button
                                                onClick={() => handleSelectTech(row.key)}
                                                style={{
                                                    padding: "2px 8px",
                                                    background: "#F1F5F9",
                                                    color: "#334155",
                                                    border: "1px solid #CBD5E1",
                                                    borderRadius: "2px",
                                                    fontSize: "10.5px",
                                                    fontWeight: "600",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Select
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
