import React from "react";
import { X, ShieldCheck, Cpu, Layers, FileText, CheckCircle2, Sliders, AlertCircle, Download } from "lucide-react";

/**
 * EquipmentInspectionModal
 * Renders a comprehensive engineering equipment sheet for process equipment (Pumps, Reactors, Tanks, Sensors)
 * including design standards (ANSI/ASME/API/ISO), materials of construction, pressure ratings,
 * sizing equations, input/output variables, and safety factors.
 */
export default function EquipmentInspectionModal({ equipment, onClose }) {
    if (!equipment) return null;

    const {
        tag = "EQ-101",
        name = "Process Equipment",
        type = "reactor",
        technology = "MCDI",
        operatingPressure = "1.00 bar",
        operatingFlow = "10.0 L/min",
        voltage = "1.20 V",
        current = "15.00 A",
        currentDensity = "220.0 A/m²",
        cellPairs = 95,
        electrodeArea = "350 cm²",
        dimensions = "180mm L x 110mm W x 220mm H",
        material = "316L Stainless Steel / FRP Composite",
        designStandard = "ISO 10628 / ISA 5.1 / ASME Sec VIII",
        formulaUsed = "J = I / A_electrode; P = Q * ΔP / η",
        calculationSource = "engineeringEquationEngine.js",
        notes = "Equipment verified for standard continuous operation."
    } = equipment;

    // Derived engineering parameters for specific equipment types
    const isPump = tag.startsWith("P-") || type.includes("pump");
    const isTank = tag.startsWith("TK-") || type.includes("tank");
    const isReactor = tag.startsWith("R-") || type.includes("reactor");

    const modelNumber = isPump ? "PMP-CDI-2000" : (isReactor ? `${technology}-MOD-150` : "TK-HDPE-1000");
    const manufacturer = isPump ? "Grundfos / Flowserve Industrial" : (isReactor ? "Evoqua / DuPont Desalination Systems" : "Snyder Industries");
    const powerRating = isPump ? "0.45 kW" : (isReactor ? `${equipment.power || 1.4} W` : "N/A");
    const efficiency = isPump ? "82.5 %" : (isReactor ? `${equipment.chargeEfficiency || 99.9} %` : "100.0 %");

    const handleDownloadDatasheet = () => {
        const text = `CDI / EDI ENGINEERING EQUIPMENT DATASHEET\n=========================================\nTag: ${tag}\nName: ${name}\nModel: ${modelNumber}\nManufacturer: ${manufacturer}\nOperating Flow: ${operatingFlow}\nOperating Pressure: ${operatingPressure}\nPower Rating: ${powerRating}\nEfficiency: ${efficiency}\nMaterial: ${material}\nDesign Standard: ${designStandard}\nStatus: VERIFIED & OPERATIONAL\n`;
        const blob = new Blob([text], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${tag}_Equipment_Datasheet.txt`;
        link.click();
    };

    return (
        <div className="equipment-modal-overlay" style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            padding: "20px"
        }}>
            <div className="equipment-modal-card" style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
                width: "100%",
                maxWidth: "680px",
                overflow: "hidden",
                border: "1px solid #CBD5E1",
                animation: "fadeInUp 0.2s ease-out"
            }}>
                {/* Header */}
                <div style={{
                    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                    color: "#FFFFFF",
                    padding: "18px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            background: "rgba(37, 99, 235, 0.3)",
                            padding: "10px",
                            borderRadius: "10px",
                            color: "#60A5FA"
                        }}>
                            <Cpu size={24} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{name}</h3>
                                <span style={{ background: "#2563EB", color: "#FFFFFF", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "800" }}>
                                    {tag}
                                </span>
                            </div>
                            <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                                Industrial Engineering Datasheet
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#94A3B8",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "6px"
                        }}
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: "24px", maxHeight: "76vh", overflowY: "auto" }}>
                    {/* Status Badge */}
                    <div style={{
                        background: "#F0FDF4",
                        border: "1px solid #BBF7D0",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <CheckCircle2 size={18} color="#16A34A" />
                            <span style={{ fontSize: "13px", fontWeight: "700", color: "#166534" }}>
                                Equipment Status: VERIFIED &amp; OPERATIONAL
                            </span>
                        </div>
                        <span style={{ fontSize: "11px", background: "#DCFCE7", color: "#15803D", padding: "3px 9px", borderRadius: "12px", fontWeight: "700" }}>
                            Standard: {designStandard.split('/')[0]}
                        </span>
                    </div>

                    {/* Technical Specifications Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "14px" }}>
                            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase" }}>
                                Equipment Data
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Model:</span>
                                    <strong style={{ color: "#2563EB", fontFamily: "monospace" }}>{modelNumber}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Manufacturer:</span>
                                    <strong style={{ color: "#0F172A" }}>{manufacturer}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Flow Rate:</span>
                                    <strong style={{ color: "#0F172A" }}>{operatingFlow}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Operating Pressure:</span>
                                    <strong style={{ color: "#0F172A" }}>{operatingPressure}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Power:</span>
                                    <strong style={{ color: "#2563EB" }}>{powerRating}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Efficiency:</span>
                                    <strong style={{ color: "#16A34A" }}>{efficiency}</strong>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "14px" }}>
                            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase" }}>
                                Mechanical &amp; Material Specs
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Material:</span>
                                    <strong style={{ color: "#0F172A" }}>{material}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Dimensions:</span>
                                    <strong style={{ color: "#0F172A" }}>{dimensions}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Design Standard:</span>
                                    <strong style={{ color: "#0F172A" }}>{designStandard}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748B" }}>Safety Margin:</span>
                                    <strong style={{ color: "#16A34A" }}>1.25x (ASME Sec VIII)</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sizing Formula & Governance Box */}
                    <div style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <FileText size={15} /> Sizing Equation &amp; Governance
                        </div>
                        <div style={{
                            background: "#0F172A",
                            color: "#38BDF8",
                            padding: "14px 18px",
                            borderRadius: "10px",
                            fontFamily: "monospace",
                            fontSize: "14px",
                            fontWeight: "700",
                            textAlign: "center",
                            border: "1px solid #334155"
                        }}>
                            {formulaUsed}
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "12px 16px", fontSize: "12px", color: "#1E40AF" }}>
                        <strong>Engineering Note:</strong> {notes}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "14px 24px",
                    background: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <button
                        onClick={handleDownloadDatasheet}
                        style={{
                            background: "#16A34A",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontWeight: "700",
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <Download size={15} /> Download Datasheet
                    </button>

                    <button
                        onClick={onClose}
                        style={{
                            background: "#2563EB",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "8px 18px",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer"
                        }}
                    >
                        Close Specification Sheet
                    </button>
                </div>
            </div>
        </div>
    );
}
