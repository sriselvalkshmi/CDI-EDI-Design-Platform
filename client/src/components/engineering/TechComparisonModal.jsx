import React, { useState } from "react";
import { X, CheckCircle2, AlertTriangle, Cpu, DollarSign, Layers, Zap } from "lucide-react";

export default function TechComparisonModal({ isOpen, onClose, currentTech = "CDI", engineering = {} }) {
    if (!isOpen) return null;

    const [selectedCategory, setSelectedCategory] = useState("all");

    const COMPARISON_DATA = [
        {
            tech: "CDI",
            name: "Capacitive Deionization",
            structure: "Feed Tank → Pump → CDI Cell (Porous Carbon Anode / Spacer / Carbon Cathode) → Outlet",
            advantages: [
                "Simple cell structure without ion exchange membranes",
                "Lowest capital investment cost (CAPEX)",
                "Low operating pressure drop",
                "Easy electrode replacement and maintenance"
            ],
            disadvantages: [
                "Lower charge efficiency due to co-ion repulsion during charging",
                "Lower maximum removal efficiency (75 - 85%)",
                "pH fluctuations during adsorption/desorption cycles"
            ],
            applications: "Brackish water desalination (<2,000 ppm), residential water softeners, boiler feed pre-treatment.",
            power: "0.2 - 0.5 kWh/m³",
            sec: "0.35 kWh/m³",
            removal: "75 - 85 %",
            recovery: "80 - 90 %",
            complexity: "Low",
            cost: "$ (Lowest CAPEX / Moderate OPEX)"
        },
        {
            tech: "MCDI",
            name: "Membrane Capacitive Deionization",
            structure: "Feed Tank → Pump → MCDI Cell (AEM / Anode / Spacer / Cathode / CEM) → Outlet",
            advantages: [
                "Ion Exchange Membranes (AEM/CEM) block co-ion repulsion",
                "Higher charge efficiency (>85%) and faster ion sorption",
                "Increased salt adsorption capacity (SAC)",
                "Higher water recovery during desorption"
            ],
            disadvantages: [
                "Higher initial membrane purchase cost",
                "Potential membrane fouling and scaling",
                "Slightly higher hydraulic pressure drop"
            ],
            applications: "Industrial brackish water (<5,000 ppm), agricultural irrigation water, heavy metal removal.",
            power: "0.3 - 0.7 kWh/m³",
            sec: "0.42 kWh/m³",
            removal: "85 - 94 %",
            recovery: "85 - 92 %",
            complexity: "Moderate",
            cost: "$$ (Moderate CAPEX / Low OPEX)"
        },
        {
            tech: "FCDI",
            name: "Flow-Electrode Capacitive Deionization",
            structure: "Slurry Tank A → Slurry Pump A → Flow Anode → AEM → Water Channel → CEM → Flow Cathode → Slurry Pump B → Slurry Tank B → Return Loops",
            advantages: [
                "Continuous non-stop desalination without charging/discharging cycles",
                "Extremely high feed salinity tolerance (up to 30,000+ ppm TDS)",
                "Unlimited salt adsorption capacity via slurry circulation",
                "High water recovery (>90%)"
            ],
            disadvantages: [
                "Requires dual slurry pumps and active slurry mixing tanks",
                "Slurry rheology management and carbon settling risk",
                "Higher mechanical pumping energy"
            ],
            applications: "High-salinity industrial wastewater, seawater pretreatment, concentrate volume reduction (ZLD).",
            power: "0.8 - 2.5 kWh/m³",
            sec: "1.20 kWh/m³",
            removal: "90 - 96 %",
            recovery: "88 - 95 %",
            complexity: "High (Dual Slurry Loops)",
            cost: "$$$ (High CAPEX / High Slurry OPEX)"
        },
        {
            tech: "EDI",
            name: "Electrodeionization",
            structure: "Feed → Anode → CEM → Mixed-Bed Ion Exchange Resin Chamber → AEM → Cathode → Product Water",
            advantages: [
                "Produces ultra-pure water (resistivity up to 18.2 MΩ·cm)",
                "Continuous chemical-free electrolytic resin regeneration",
                "High removal efficiency (>99.9%) for silica, boron, and trace ions",
                "Compact modular stack footprint"
            ],
            disadvantages: [
                "Requires pre-treated low TDS feed (<40 ppm, RO permeate)",
                "Higher operating voltage requirements (20 - 50 V)",
                "Strict scaling limits (hardness & silica restrictions)"
            ],
            applications: "Pharmaceutical WFI water, semiconductor manufacturing, power plant high-pressure boiler feed.",
            power: "0.5 - 1.8 kWh/m³",
            sec: "0.85 kWh/m³",
            removal: "99.0 - 99.9 %",
            recovery: "90 - 98 %",
            complexity: "Moderate-High (Resin + Membranes)",
            cost: "$$$$ (High CAPEX / Low Chemical OPEX)"
        }
    ];

    return (
        <div className="tech-comparison-overlay" style={{
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
            zIndex: 9999,
            padding: "24px"
        }}>
            <div className="tech-comparison-card" style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
                width: "100%",
                maxWidth: "1150px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                border: "1px solid #E2E8F0"
            }}>
                {/* Header */}
                <div style={{
                    background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                    color: "#FFFFFF",
                    padding: "20px 28px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
                            <Layers color="#3B82F6" size={24} /> CDI vs MCDI vs FCDI vs EDI Technology Comparison
                        </h2>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94A3B8" }}>
                            Comparative engineering analysis across structural architecture, performance, power, SEC, and cost metrics.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "none",
                            color: "#FFFFFF",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "8px"
                        }}
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Body Table */}
                <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                        {COMPARISON_DATA.map((t) => {
                            const isCurrent = currentTech.toUpperCase() === t.tech;
                            return (
                                <div
                                    key={t.tech}
                                    style={{
                                        border: isCurrent ? "2px solid #2563EB" : "1px solid #E2E8F0",
                                        borderRadius: "12px",
                                        background: isCurrent ? "#F0F6FF" : "#FAFAFA",
                                        padding: "18px",
                                        display: "flex",
                                        flexDirection: "column",
                                        position: "relative"
                                    }}
                                >
                                    {isCurrent && (
                                        <div style={{
                                            position: "absolute",
                                            top: "-12px",
                                            right: "16px",
                                            background: "#2563EB",
                                            color: "#FFFFFF",
                                            fontSize: "10.5px",
                                            fontWeight: "700",
                                            padding: "2px 10px",
                                            borderRadius: "10px"
                                        }}>
                                            SELECTED TECHNOLOGY
                                        </div>
                                    )}
                                    <div style={{ fontSize: "20px", fontWeight: "800", color: isCurrent ? "#1D4ED8" : "#1F2937" }}>
                                        {t.tech}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748B", fontWeight: "600", marginBottom: "12px" }}>
                                        {t.name}
                                    </div>

                                    {/* Structural Overview */}
                                    <div style={{ background: "#FFFFFF", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "14px", fontSize: "11.5px" }}>
                                        <strong style={{ color: "#334155", display: "block", marginBottom: "4px" }}>📐 Structure Flow:</strong>
                                        <div style={{ color: "#475569", lineHeight: "1.4" }}>{t.structure}</div>
                                    </div>

                                    {/* Key KPI Specs Grid */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                                        <div style={{ background: "#FFFFFF", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                                            <span style={{ fontSize: "10px", color: "#64748B", display: "block" }}>SEC Power</span>
                                            <strong style={{ fontSize: "12.5px", color: "#2563EB" }}>{t.sec}</strong>
                                        </div>
                                        <div style={{ background: "#FFFFFF", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                                            <span style={{ fontSize: "10px", color: "#64748B", display: "block" }}>Removal %</span>
                                            <strong style={{ fontSize: "12.5px", color: "#16A34A" }}>{t.removal}</strong>
                                        </div>
                                        <div style={{ background: "#FFFFFF", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                                            <span style={{ fontSize: "10px", color: "#64748B", display: "block" }}>Recovery %</span>
                                            <strong style={{ fontSize: "12.5px", color: "#0284C7" }}>{t.recovery}</strong>
                                        </div>
                                        <div style={{ background: "#FFFFFF", padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                                            <span style={{ fontSize: "10px", color: "#64748B", display: "block" }}>Complexity</span>
                                            <strong style={{ fontSize: "12px", color: "#7C3AED" }}>{t.complexity}</strong>
                                        </div>
                                    </div>

                                    {/* Advantages */}
                                    <div style={{ marginBottom: "12px" }}>
                                        <strong style={{ fontSize: "12px", color: "#15803D", display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
                                            <CheckCircle2 size={14} /> Advantages
                                        </strong>
                                        <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "#374151", lineHeight: "1.4" }}>
                                            {t.advantages.map((adv, i) => (
                                                <li key={i} style={{ marginBottom: "4px" }}>{adv}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Disadvantages */}
                                    <div style={{ marginBottom: "12px" }}>
                                        <strong style={{ fontSize: "12px", color: "#B91C1C", display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
                                            <AlertTriangle size={14} /> Disadvantages
                                        </strong>
                                        <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "#374151", lineHeight: "1.4" }}>
                                            {t.disadvantages.map((dis, i) => (
                                                <li key={i} style={{ marginBottom: "4px" }}>{dis}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Applications */}
                                    <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: "1px dashed #CBD5E1", fontSize: "11px" }}>
                                        <span style={{ fontWeight: "700", color: "#475569" }}>Primary Applications: </span>
                                        <span style={{ color: "#64748B" }}>{t.applications}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "16px 28px",
                    background: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                        Data synchronized with AppContext engineering equation engine &amp; ISO/ISA standards.
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#1E293B",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "8px 20px",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer"
                        }}
                    >
                        Close Comparison Matrix
                    </button>
                </div>
            </div>
        </div>
    );
}
