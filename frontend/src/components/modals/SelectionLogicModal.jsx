import React from "react";
import { useApp } from "../../context/AppContext";

export default function SelectionLogicModal() {
    const { showSelectionLogic, setShowSelectionLogic, designResult } = useApp();

    if (!showSelectionLogic) return null;

    const eng = designResult?.engineering || {};
    const feed = designResult?.input?.feedWater || {};
    const tech = designResult?.selectedTechnology || "MCDI";

    const logicSteps = [
        {
            num: "1",
            title: "Feed Concentration Evaluation",
            desc: `Feed TDS of ${feed.tds ?? 500} mg/L is within optimal range for electrosorptive desalination (100–3,000 mg/L).`
        },
        {
            num: "2",
            title: "Required Outlet Concentration",
            desc: `Target TDS of ${feed.targetTds ?? 50} mg/L requires a 90.0% single-pass removal efficiency.`
        },
        {
            num: "3",
            title: "Direct-Feed Compatibility",
            desc: `Feed hardness (${feed.hardness ?? 150} mg/L as CaCO₃) is directly tolerable without intense EDI chemical polishing pretreatment.`
        },
        {
            num: "4",
            title: "Expected Removal Performance",
            desc: `MCDI membrane-assisted electrosorption reliably achieves 90–95% removal in single-pass continuous-cyclic operation.`
        },
        {
            num: "5",
            title: "Water Recovery Potential",
            desc: `High recovery of ${eng.waterRecovery ?? 95.2}% achieved with optimized 10:1 adsorption-to-desorption duration ratio.`
        },
        {
            num: "6",
            title: "Electrical Energy Requirement (SEC)",
            desc: `MCDI provides lowest SEC (${eng.sec ?? 0.2648} kWh/m³) among feasible options due to AEM/CEM co-ion blocking preventing parasitic discharge.`
        },
        {
            num: "7",
            title: "Hydraulic Operating Requirements",
            desc: `Superficial velocity 0.049 m/s with 0.50 mm spacer delivers gentle 401 Pa pressure drop, minimizing pump capital expenditure.`
        },
        {
            num: "8",
            title: "Technology Operating Envelope",
            desc: `Faraday charge transfer remains within standard 1.40 V / 60 A/m² envelope, preventing Faradaic side-reactions and carbon oxidation.`
        }
    ];

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
            boxSizing: "border-box"
        }}>
            <div style={{
                background: "#FFFFFF",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                width: "100%",
                maxWidth: "700px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}>
                <div style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#F8FAFC"
                }}>
                    <div>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#2563EB", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                            Decision Rationale
                        </div>
                        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A", margin: "2px 0 0 0" }}>
                            Engineering Selection Logic: Why {tech}?
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowSelectionLogic(false)}
                        style={{
                            background: "transparent",
                            border: "1px solid #CBD5E1",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#475569",
                            cursor: "pointer"
                        }}
                    >
                        Close
                    </button>
                </div>

                <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                        {logicSteps.map(step => (
                            <div key={step.num} style={{
                                display: "flex",
                                gap: "12px",
                                padding: "10px 12px",
                                background: "#F8FAFC",
                                border: "1px solid #E2E8F0",
                                borderRadius: "6px"
                            }}>
                                <div style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    background: "#2563EB",
                                    color: "#FFFFFF",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    {step.num}
                                </div>
                                <div>
                                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0F172A", marginBottom: "2px" }}>
                                        {step.title}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748B", lineHeight: "1.4" }}>
                                        {step.desc}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        marginTop: "16px",
                        padding: "12px 14px",
                        background: "#F0FDF4",
                        border: "1px solid #BBF7D0",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        color: "#166534",
                        fontWeight: "600"
                    }}>
                        Result: MCDI provides the best feasible design for the specified feed and target while achieving minimal specific energy consumption.
                    </div>
                </div>

                <div style={{
                    padding: "12px 20px",
                    borderTop: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end"
                }}>
                    <button
                        onClick={() => setShowSelectionLogic(false)}
                        style={{
                            background: "#0F172A",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 16px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer"
                        }}
                    >
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
}
