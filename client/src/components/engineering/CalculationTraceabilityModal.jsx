import React from "react";
import { X, Calculator, ArrowRight, ShieldCheck, Cpu, Code2, BookOpen, Layers } from "lucide-react";

/**
 * CalculationTraceabilityModal
 * Displays full engineering governing equations, input variables, numerical step-by-step
 * calculation substitutions, and source code module reference for transparency.
 */
export default function CalculationTraceabilityModal({ paramData, onClose }) {
    if (!paramData) return null;

    const {
        title = "Current Density",
        symbol = "J",
        value = "150.0",
        unit = "A/m²",
        equation = "J = I / A_electrode",
        description = "Electric current per unit cross-sectional surface area of electrode plates.",
        inputs = [],
        steps = [],
        sourceModule = "engineeringEquationEngine.js",
        status = "VERIFIED (ISO/ISA 5.1)"
    } = paramData;

    return (
        <div className="calculation-modal-overlay" style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            padding: "20px"
        }}>
            <div className="calculation-modal-card" style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
                width: "100%",
                maxWidth: "660px",
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
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            background: "rgba(37, 99, 235, 0.25)",
                            padding: "8px",
                            borderRadius: "8px",
                            color: "#60A5FA"
                        }}>
                            <Calculator size={22} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>
                                {title} ({symbol}) Derivation &amp; Formula Breakdown
                            </h3>
                            <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                                Numerical Step-by-Step Substitution Trail
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
                            padding: "4px",
                            borderRadius: "6px"
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: "24px", maxHeight: "76vh", overflowY: "auto" }}>
                    {/* Final Calculated Result Banner */}
                    <div style={{
                        background: "#EFF6FF",
                        border: "1px solid #BFDBFE",
                        borderRadius: "12px",
                        padding: "16px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px"
                    }}>
                        <div>
                            <span style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", fontWeight: "700" }}>
                                Calculated Value
                            </span>
                            <div style={{ fontSize: "24px", fontWeight: "900", color: "#1D4ED8", marginTop: "2px" }}>
                                {value} <span style={{ fontSize: "15px", color: "#3B82F6", fontWeight: "700" }}>{unit}</span>
                            </div>
                        </div>
                        <span style={{
                            background: "#DCFCE7",
                            color: "#15803D",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontWeight: "700",
                            fontSize: "11.5px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                        }}>
                            <ShieldCheck size={14} /> {status}
                        </span>
                    </div>

                    {/* Governing Equation Box */}
                    <div style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <BookOpen size={15} /> Governing Physical Equation
                        </div>
                        <div style={{
                            background: "#0F172A",
                            color: "#38BDF8",
                            padding: "14px 18px",
                            borderRadius: "10px",
                            fontFamily: "monospace",
                            fontSize: "16px",
                            fontWeight: "700",
                            textAlign: "center",
                            border: "1px solid #334155"
                        }}>
                            {equation}
                        </div>
                        <p style={{ fontSize: "12px", color: "#64748B", marginTop: "6px", marginBottom: 0 }}>
                            {description}
                        </p>
                    </div>

                    {/* Input Variables Table */}
                    {inputs && inputs.length > 0 && (
                        <div style={{ marginBottom: "20px" }}>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>
                                Input Variables
                            </div>
                            <div style={{ background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "10px 14px" }}>
                                {inputs.map((inp, idx) => (
                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: idx < inputs.length - 1 ? "1px dashed #E2E8F0" : "none", fontSize: "12.5px" }}>
                                        <span style={{ color: "#475569", fontWeight: "500" }}>{inp.name} ({inp.symbol})</span>
                                        <strong style={{ color: "#0F172A" }}>{inp.value} {inp.unit}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step-by-step Numerical Substitution Trail */}
                    {steps && steps.length > 0 && (
                        <div style={{ marginBottom: "20px" }}>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>
                                Step-by-Step Numerical Substitution Trail
                            </div>
                            <div style={{ background: "#F1F5F9", borderRadius: "8px", padding: "12px 14px" }}>
                                {steps.map((st, idx) => (
                                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px", fontSize: "12px" }}>
                                        <span style={{ background: "#2563EB", color: "#FFFFFF", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800", flexShrink: 0 }}>
                                            {idx + 1}
                                        </span>
                                        <span style={{ color: "#334155", fontFamily: "monospace", fontSize: "12px" }}>{st}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Code Source Reference */}
                    <div style={{
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        fontSize: "11.5px",
                        color: "#64748B",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}>
                        <Code2 size={15} color="#2563EB" /> Source Calculation Engine: <code style={{ color: "#2563EB", fontWeight: "700" }}>{sourceModule}</code>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "14px 24px",
                    background: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "flex-end"
                }}>
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
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
