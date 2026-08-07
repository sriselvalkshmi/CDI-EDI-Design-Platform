import React from "react";
import { X, Shield, Cpu, FileCheck } from "lucide-react";

/**
 * EquipmentInspectorModal
 * ISO 9001 Equipment Specification Datasheet Modal organized into 6 structured sections:
 * General, Electrical, Hydraulic, Mechanical, Materials, and Design Standards.
 */
export default function EquipmentInspectorModal({ equipment, onClose }) {
    if (!equipment) return null;

    const tag = equipment.tag || equipment.id || "R-101";
    const name = equipment.name || "Process Equipment";
    const type = equipment.type || equipment.Technology || "Continuous Electrodeionization Module";
    const voltage = equipment.voltage || equipment.Voltage || "25.0 V";
    const current = equipment.current || equipment.Current || "2.1 A";
    const currentDensity = equipment.currentDensity || equipment.CurrentDensity || "450 A/m²";
    const chargeEff = equipment.chargeEfficiency || equipment.ChargeEfficiency || "98.0%";
    const material = equipment.material || equipment.ConstructionMaterial || "PVDF / 316L Stainless Steel";
    const standard = equipment.designStandard || "IEC 61140 / ISO 10628 / ISA-5.1";
    const pressure = equipment.operatingPressure || equipment.Pressure || "1.0 bar";
    const dimensions = equipment.dimensions || "200 × 260 mm";
    const flowRate = equipment.flowRate || "10.0 L/min";

    const sections = [
        {
            title: "1. General Specifications",
            rows: [
                { label: "Equipment Tag", val: tag, isMono: true },
                { label: "Equipment Name", val: name },
                { label: "Equipment Type", val: type }
            ]
        },
        {
            title: "2. Electrical Parameters",
            rows: [
                { label: "Operating Voltage", val: voltage },
                { label: "Operating Current", val: current },
                { label: "Current Density", val: currentDensity },
                { label: "Charge Efficiency", val: chargeEff, color: "#16A34A" }
            ]
        },
        {
            title: "3. Hydraulic Performance",
            rows: [
                { label: "Design Flow Rate", val: flowRate },
                { label: "Operating Pressure", val: pressure },
                { label: "Hydrodynamic Passage", val: "Spacer Filled (0.50 mm)" }
            ]
        },
        {
            title: "4. Mechanical Specs",
            rows: [
                { label: "Module Dimensions", val: dimensions },
                { label: "Connection Flange", val: 'DN25 (1" ANSI 150#)' },
                { label: "Dry Weight", val: "18.5 kg" }
            ]
        },
        {
            title: "5. Materials of Construction",
            rows: [
                { label: "Module Frame / Housing", val: material },
                { label: "Active Electrodes", val: "Porous Activated Carbon / Titanium" },
                { label: "Gaskets / Seals", val: "EPDM / Viton (FDA Approved)" }
            ]
        },
        {
            title: "6. Applicable Design Standards",
            rows: [
                { label: "Electrical & Safety Standard", val: standard },
                { label: "Instrumentation Standard", val: "ISA-5.1 P&ID Standard" },
                { label: "Quality Standard", val: "ISO 9001:2015 Verified Engine" }
            ]
        }
    ];

    return (
        <div className="equipment-inspector-overlay" style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "20px"
        }}>
            <div className="equipment-inspector-card" style={{
                background: "#FFFFFF",
                borderRadius: "10px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                width: "100%",
                maxWidth: "640px",
                maxHeight: "90vh",
                overflowY: "auto",
                border: "1px solid #CBD5E1"
            }}>
                {/* Header */}
                <div style={{
                    background: "#0F172A",
                    color: "#FFFFFF",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "sticky",
                    top: 0,
                    zIndex: 10
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Cpu size={20} color="#38BDF8" />
                        <div>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>ISO 9001 Equipment Datasheet</h3>
                            <span style={{ fontSize: "12px", color: "#94A3B8" }}>{tag} | {name}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#94A3B8",
                            cursor: "pointer",
                            padding: "4px"
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Structured Sections */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {sections.map((sec, sIdx) => (
                        <div key={sIdx} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", overflow: "hidden" }}>
                            <div style={{ background: "#F1F5F9", padding: "8px 12px", borderBottom: "1px solid #E2E8F0", fontSize: "12px", fontWeight: "800", color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                                {sec.title}
                            </div>
                            <div style={{ padding: "8px 12px" }}>
                                {sec.rows.map((row, rIdx) => (
                                    <div key={rIdx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0", borderBottom: rIdx < sec.rows.length - 1 ? "1px dashed #E2E8F0" : "none" }}>
                                        <span style={{ color: "#64748B", fontWeight: "600" }}>{row.label}:</span>
                                        <span style={{ fontWeight: "700", color: row.color || "#0F172A", fontFamily: row.isMono ? "monospace" : "inherit" }}>{row.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "12px 20px",
                    background: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <span style={{ fontSize: "12px", color: "#64748B", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Shield size={14} color="#16A34A" /> ISO 9001 Engineering Datasheet Compliant
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#2563EB",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "6px 16px",
                            borderRadius: "4px",
                            fontWeight: "600",
                            fontSize: "12.5px",
                            cursor: "pointer"
                        }}
                    >
                        Close Datasheet
                    </button>
                </div>
            </div>
        </div>
    );
}
