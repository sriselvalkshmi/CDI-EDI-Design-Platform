import React from "react";
import { X, CheckCircle2, AlertTriangle, Layers, Zap } from "lucide-react";
import calculateEngineering from "../../engineering/engineeringEquationEngine";

/**
 * TechComparisonModal
 * Dynamic engineering comparison matrix displaying live calculated physics metrics
 * (removal efficiency, SEC, SAC, current density, power, pressure drop, recovery, voltage, current, max TDS)
 * for CDI, MCDI, FCDI, and EDI from engineeringEquationEngine.
 */
export default function TechComparisonModal({ isOpen, onClose, currentTech = "CDI", engineering = {}, feedWater = {} }) {
    if (!isOpen) return null;

    const activeFeed = {
        tds: feedWater.tds || 500,
        conductivity: feedWater.conductivity || 769,
        flowRate: feedWater.flowRate || 10,
        pressure: feedWater.pressure || 1.0,
        targetTds: feedWater.targetTds || 50,
        temperature: feedWater.temperature || 25
    };

    // Calculate live physics metrics for all 4 technologies
    const techCalculations = {
        CDI: calculateEngineering({ technology: "CDI", feedWater: activeFeed, ...engineering }),
        MCDI: calculateEngineering({ technology: "MCDI", feedWater: activeFeed, ...engineering }),
        FCDI: calculateEngineering({ technology: "FCDI", feedWater: activeFeed, ...engineering }),
        EDI: calculateEngineering({ technology: "EDI", feedWater: activeFeed, ...engineering })
    };

    const STATIC_SPECS = {
        CDI: {
            name: "Capacitive Deionization",
            structure: "Feed Tank → Pump → CDI Cell (Porous Carbon Anode / Spacer / Carbon Cathode) → Outlet",
            advantages: [
                "Simple cell structure without ion exchange membranes",
                "Lowest capital investment cost (CAPEX)",
                "Low operating pressure drop",
                "Easy electrode replacement and maintenance"
            ],
            disadvantages: [
                "Lower charge efficiency due to co-ion expulsion during charging",
                "Lower maximum removal efficiency (75 - 85%)",
                "Batch adsorption / desorption regeneration cycles"
            ],
            applications: "Low salinity brackish water (<1,000 ppm), residential softeners, boiler pre-treatment.",
            complexity: "Low",
            cost: "$ (Lowest CAPEX / Moderate OPEX)"
        },
        MCDI: {
            name: "Membrane Capacitive Deionization",
            structure: "Feed Tank → Pump → MCDI Cell (AEM / Anode / Spacer / Cathode / CEM) → Outlet",
            advantages: [
                "Ion Exchange Membranes (AEM/CEM) block co-ion repulsion",
                "Higher charge efficiency (>92%) and faster ion sorption",
                "Increased salt adsorption capacity (SAC)",
                "Higher water recovery (95%) during desorption"
            ],
            disadvantages: [
                "Higher initial membrane purchase cost",
                "Potential membrane fouling and scaling",
                "Slightly higher hydraulic pressure drop"
            ],
            applications: "Industrial brackish water (<3,000 ppm), agricultural irrigation, heavy metal removal.",
            complexity: "Moderate",
            cost: "$$ (Moderate CAPEX / Low OPEX)"
        },
        FCDI: {
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
            complexity: "High (Dual Slurry Loops)",
            cost: "$$$ (High CAPEX / High Slurry OPEX)"
        },
        EDI: {
            name: "Electrodeionization",
            structure: "Feed → Anode → CEM → Mixed-Bed Ion Exchange Resin Chamber → AEM → Cathode → Product Water",
            advantages: [
                "Produces ultra-pure water (resistivity up to 18.2 MΩ·cm)",
                "Continuous chemical-free electrolytic resin regeneration (H+/OH-)",
                "High removal efficiency (>99.9%) for silica, boron, and trace ions",
                "Compact modular stack footprint"
            ],
            disadvantages: [
                "Requires pre-treated low TDS feed (<30 ppm, RO permeate)",
                "Higher operating voltage requirements (5 - 50 V)",
                "Strict scaling limits (hardness & silica restrictions)"
            ],
            applications: "Pharmaceutical WFI water, semiconductor manufacturing, power plant high-pressure boiler feed.",
            complexity: "Moderate-High (Resin + Membranes)",
            cost: "$$$$ (High CAPEX / Low Chemical OPEX)"
        }
    };

    const TECH_KEYS = ["CDI", "MCDI", "FCDI", "EDI"];

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
                            <Layers color="#3B82F6" size={24} /> Dynamic Engineering Comparison Matrix (Feed TDS: {activeFeed.tds} ppm)
                        </h2>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94A3B8" }}>
                            Live physics calculations synchronized with engineering equation engine across CDI, MCDI, FCDI, and EDI.
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
                <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                        {TECH_KEYS.map((techKey) => {
                            const isCurrent = currentTech.toUpperCase() === techKey;
                            const staticData = STATIC_SPECS[techKey];
                            const engCalc = techCalculations[techKey] || {};

                            const sacDisplay = engCalc.sac != null ? `${engCalc.sac.toFixed(1)} mg/g` : "Resin Bed";

                            return (
                                <div
                                    key={techKey}
                                    style={{
                                        border: isCurrent ? "2px solid #2563EB" : "1px solid #CBD5E1",
                                        borderRadius: "12px",
                                        background: isCurrent ? "#F0F6FF" : "#FAFAFA",
                                        padding: "16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        position: "relative"
                                    }}
                                >
                                    {isCurrent && (
                                        <div style={{
                                            position: "absolute",
                                            top: "-12px",
                                            right: "14px",
                                            background: "#2563EB",
                                            color: "#FFFFFF",
                                            fontSize: "10px",
                                            fontWeight: "800",
                                            padding: "2px 8px",
                                            borderRadius: "10px"
                                        }}>
                                            SELECTED
                                        </div>
                                    )}
                                    <div style={{ fontSize: "19px", fontWeight: "800", color: isCurrent ? "#1D4ED8" : "#1F2937" }}>
                                        {techKey}
                                    </div>
                                    <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: "600", marginBottom: "10px" }}>
                                        {staticData.name}
                                    </div>

                                    {/* Calculated Physics KPI Grid */}
                                    <div style={{
                                        background: "#FFFFFF",
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "8px",
                                        padding: "10px",
                                        marginBottom: "12px"
                                    }}>
                                        <div style={{ fontSize: "10.5px", fontWeight: "700", color: "#2563EB", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Zap size={12} /> Calculated Engineering Engine Parameters:
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px" }}>
                                            <div>
                                                <span style={{ color: "#64748B", display: "block" }}>Removal Eff</span>
                                                <strong style={{ color: "#16A34A" }}>{engCalc.removalEfficiency}%</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748B", display: "block" }}>Outlet TDS</span>
                                                <strong style={{ color: "#2563EB" }}>{engCalc.outletTDS} ppm</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748B", display: "block" }}>SEC Index</span>
                                                <strong style={{ color: "#7C3AED" }}>{engCalc.sec} kWh/m³</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748B", display: "block" }}>SAC Capacity</span>
                                                <strong style={{ color: "#D97706" }}>{sacDisplay}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748B", display: "block" }}>Current Density</span>
                                                <strong style={{ color: "#0284C7" }}>{engCalc.currentDensity} A/m²</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748B", display: "block" }}>Power Draw</span>
                                                <strong style={{ color: "#1F2937" }}>{engCalc.power} W</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748B", display: "block" }}>Pressure Drop</span>
                                                <strong style={{ color: "#059669" }}>{(engCalc.pressureDrop / 100000).toFixed(3)} bar</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748B", display: "block" }}>Water Recovery</span>
                                                <strong style={{ color: "#2563EB" }}>{engCalc.waterRecovery}%</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748B", display: "block" }}>Voltage / Current</span>
                                                <strong style={{ color: "#4F46E5" }}>{engCalc.voltage} V / {engCalc.current} A</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748B", display: "block" }}>Max Limit TDS</span>
                                                <strong style={{ color: "#DC2626" }}>{engCalc.maxRemoval}% ({techKey === "EDI" ? "<30" : (techKey === "FCDI" ? "30000" : "2000")} ppm)</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Advantages */}
                                    <div style={{ marginBottom: "10px" }}>
                                        <strong style={{ fontSize: "11.5px", color: "#15803D", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                                            <CheckCircle2 size={13} /> Key Advantages
                                        </strong>
                                        <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "10.5px", color: "#374151", lineHeight: "1.35" }}>
                                            {staticData.advantages.map((adv, i) => (
                                                <li key={i} style={{ marginBottom: "2px" }}>{adv}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Disadvantages */}
                                    <div style={{ marginBottom: "10px" }}>
                                        <strong style={{ fontSize: "11.5px", color: "#B91C1C", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                                            <AlertTriangle size={13} /> Engineering Limitations
                                        </strong>
                                        <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "10.5px", color: "#374151", lineHeight: "1.35" }}>
                                            {staticData.disadvantages.map((dis, i) => (
                                                <li key={i} style={{ marginBottom: "2px" }}>{dis}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Applications */}
                                    <div style={{ marginTop: "auto", paddingTop: "8px", borderTop: "1px dashed #CBD5E1", fontSize: "10.5px" }}>
                                        <span style={{ fontWeight: "700", color: "#475569" }}>Primary Applications: </span>
                                        <span style={{ color: "#64748B" }}>{staticData.applications}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "14px 28px",
                    background: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                        All parameters computed dynamically via physical engineering equations (Faraday's Law, Ergun friction factor, &amp; ion transport kinetics).
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
                        Close Matrix
                    </button>
                </div>
            </div>
        </div>
    );
}
