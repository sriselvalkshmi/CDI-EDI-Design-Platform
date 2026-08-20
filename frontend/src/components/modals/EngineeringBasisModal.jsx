import React, { useState } from "react";
import { useApp } from "../../context/AppContext";

export default function EngineeringBasisModal() {
    const { showEngineeringBasis, setShowEngineeringBasis } = useApp();
    const [activeTab, setActiveTab] = useState("MASS_BALANCE");

    if (!showEngineeringBasis) return null;

    const sections = [
        { id: "MASS_BALANCE", label: "Mass & Water Balance" },
        { id: "ELECTROCHEMICAL", label: "Faraday & Electrochemistry" },
        { id: "HYDRODYNAMICS", label: "Hydraulics & Pressure Drop" },
        { id: "ENERGY_SEC", label: "Power & SEC Formulation" },
        { id: "TECH_MODELS", label: "Technology Specifics (MCDI/FCDI/EDI)" },
        { id: "REFERENCES", label: "References & Standards" }
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
                maxWidth: "850px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}>
                {/* HEADER */}
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
                            Theoretical Foundation
                        </div>
                        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A", margin: "2px 0 0 0" }}>
                            Engineering Calculation Basis & Reference Manual
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowEngineeringBasis(false)}
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

                {/* TABS */}
                <div style={{
                    display: "flex",
                    borderBottom: "1px solid #E2E8F0",
                    background: "#F1F5F9",
                    padding: "0 12px",
                    overflowX: "auto"
                }}>
                    {sections.map(sec => (
                        <button
                            key={sec.id}
                            onClick={() => setActiveTab(sec.id)}
                            style={{
                                padding: "10px 14px",
                                fontSize: "12px",
                                fontWeight: activeTab === sec.id ? "700" : "500",
                                color: activeTab === sec.id ? "#2563EB" : "#64748B",
                                borderBottom: activeTab === sec.id ? "2px solid #2563EB" : "2px solid transparent",
                                background: "transparent",
                                borderTop: "none",
                                borderLeft: "none",
                                borderRight: "none",
                                cursor: "pointer",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {sec.label}
                        </button>
                    ))}
                </div>

                {/* CONTENT AREA */}
                <div style={{ padding: "20px", overflowY: "auto", flex: 1, fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                    {activeTab === "MASS_BALANCE" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    1. Water Mass Conservation
                                </h3>
                                <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
                                    Under steady-state continuous or cyclic operation, total feed flow equals product permeate flow plus reject concentrate flow:
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    Q_feed = Q_product + Q_reject
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    2. Salt Mass Balance
                                </h3>
                                <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
                                    Conservation of dissolved solute mass species:
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    Q_feed · C_feed = Q_product · C_product + Q_reject · C_reject
                                </div>
                                <p style={{ margin: "8px 0 0 0", color: "#64748B" }}>
                                    Rearranging for concentrate brine TDS (C_reject):
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A", marginTop: "4px" }}>
                                    C_reject = (Q_feed · C_feed - Q_product · C_product) / Q_reject
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    3. Desalination Removal & Water Recovery
                                </h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                        Removal % = ((C_feed - C_product) / C_feed) × 100
                                    </div>
                                    <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                        Recovery % = (Q_product / Q_feed) × 100
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    4. Cyclic Operation & Rinse Water Mass Balance
                                </h3>
                                <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
                                    In cyclic electrosorption (MCDI / CDI), water recovery is cycle-integrated:
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A", fontSize: "12px" }}>
                                    R_cycle = (t_ads · Q_ads) / (t_ads · Q_ads + t_des · Q_des) × 100%<br/>
                                    • Adsorption (10 min at 20 L/min) = 200 L product volume<br/>
                                    • Desorption (1 min at 10 L/min) = 10 L reject concentrate volume<br/>
                                    • Recovery R = 200 / (200 + 10) = 95.24% ≈ 95.2%<br/>
                                    • Rinse effluent (1 min) is displaced/recycled to the raw feed equalization tank.
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    5. Water Chemistry: Conductivity vs. TDS Relationship
                                </h3>
                                <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
                                    In aqueous systems, Total Dissolved Solids (TDS in mg/L) and Electrical Conductivity (σ in µS/cm) are correlated by the standard empirical conversion factor:
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A", fontSize: "12px" }}>
                                    TDS = k · σ &nbsp;&nbsp;&nbsp;&nbsp; (where k ≈ 0.65 for typical NaCl / brackish feed)<br/>
                                    • At TDS = 39 mg/L: σ = 39 / 0.65 ≈ <strong>60.0 µS/cm</strong><br/>
                                    • <em>Note:</em> Conductivity is an independent user-entered diagnostic parameter. The first-principles electrochemical screening calculation uses TDS directly for mass conservation and Faraday charge transport balances.
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "ELECTROCHEMICAL" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    1. Faraday Law of Electrochemical Charge
                                </h3>
                                <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
                                    The theoretical charge transfer required for removing dissolved ionic moles per unit time:
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    n_dot = ṁ_salt / M_NaCl = Q · (C_in - C_out) / M_NaCl
                                </div>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A", marginTop: "6px" }}>
                                    Q_charge = n · z · F  (where F = 96,485 C/mol, z = 1 for NaCl)
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    2. Charge Efficiency (Λ) & Floor Bound Formulation
                                </h3>
                                <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
                                    Ratio of salt adsorbed over total electric charge supplied to the cell pairs:
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    Λ = (z · F · Δn_salt) / I_total_charge<br/>
                                    Λ_raw = Λ₀ · [1 - 0.04 · (V_cell - 1.4)/1.4] · max(0.8696, C_feed / 500)<br/>
                                    Λ_operating = max(0.80, min(0.98, Λ_raw))
                                </div>
                                <p style={{ margin: "6px 0 0 0", color: "#64748B", fontSize: "12px" }}>
                                    • At 39 mg/L feed: Raw correlation gives Λ_raw = 0.92 × 1.0 × 0.8696 = 0.800 (80.0%), adhering to the 80.0% physical membrane selectivity floor.<br/>
                                    • At 500 mg/L feed: Evaluates at nominal literature baseline Λ₀ = 0.92 (92.0%).<br/>
                                    • CDI (no membranes): Λ ≈ 0.65 - 0.80 due to co-ion expulsion.
                                </p>
                            </div>

                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    3. Series Electrical Topology
                                </h3>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    V_module = N_pairs_per_mod · V_cell<br/>
                                    V_system = N_modules · V_module<br/>
                                    P_electrical = V_system · I_stack
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "HYDRODYNAMICS" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    1. Superficial & Parallel Interstitial Flow Velocity
                                </h3>
                                <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
                                    In a multi-cell stack, total feed flow divides across all parallel spacer channels:
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    A_flow_total = N_cell_pairs · W_channel · h_spacer<br/>
                                    u_channel = Q_feed / A_flow_total
                                </div>
                                <p style={{ margin: "6px 0 0 0", color: "#64748B", fontSize: "12px" }}>
                                    • For 34 cell pairs, 350 cm² active area (W = 187.1 mm), and 0.50 mm spacer:<br/>
                                    &nbsp;&nbsp;A_flow_total = 34 × 0.1871 m × 0.0005 m = 0.00318 m² = 31.8 cm²<br/>
                                    &nbsp;&nbsp;At Q = 20 L/min (0.000333 m³/s): u_channel = 0.000333 / 0.00318 = <strong>0.105 m/s</strong>.
                                </p>
                            </div>

                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    2. Hydraulic Residence Time
                                </h3>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    V_reactor = N_pairs · A_electrode · h_spacer<br/>
                                    τ = V_reactor / Q_feed
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    3. Pressure Drop Model (Darcy-Weisbach with Spacer Mesh Drag)
                                </h3>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    ΔP = f_spacer · (L_channel / D_h) · (ρ · u² / 2)<br/>
                                    where:<br/>
                                    • Channel Width (W) = 187.1 mm, Channel Length (L) = 187.1 mm, Spacer Height (h) = 0.50 mm<br/>
                                    • Hydraulic Diameter: D_h = 2 · W · h / (W + h) ≈ 0.995 mm ≈ 1.0 mm<br/>
                                    • Reynolds Number: Re = (ρ · u · D_h) / μ ≈ (1000 · 0.1048 · 0.001) / 0.001 ≈ 105 (Laminar)<br/>
                                    • Spacer Drag Factor: f_spacer = (64 / Re) + 0.35 ≈ 0.61 + 0.35 = 0.96<br/>
                                    • Estimated Nominal Stack Drag: ΔP ≈ 500 Pa (ESTIMATE; excludes external manifold and header losses).
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "ENERGY_SEC" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    1. Specific Energy Consumption (SEC) Framework
                                </h3>
                                <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
                                    Volumetric energy required per cubic meter of purified product water:
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    SEC_electrical_gross = (P_stack / 1000) / Q_product_m3h
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    2. Net Energy Accounting with Assumed Energy Recovery
                                </h3>
                                <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
                                    When capacitive / RPD desorption energy recovery is modeled:
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    SEC_electrical_net = SEC_electrical_gross · (1 - ER_fraction)  [where ER = 20% ASSUMPTION]<br/>
                                    SEC_total_net = SEC_electrical_net + SEC_hydraulic
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                                    3. Hydraulic Pumping Energy
                                </h3>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    P_hydraulic = (Q_feed_m3s · ΔP) / η_pump<br/>
                                    SEC_hydraulic = (P_hydraulic / 1000) / Q_product_m3h
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "TECH_MODELS" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ border: "1px solid #E2E8F0", borderRadius: "6px", padding: "12px" }}>
                                <h4 style={{ margin: "0 0 4px 0", color: "#0F172A" }}>MCDI (Membrane Capacitive Deionization)</h4>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                                    Employs fixed porous carbon electrodes flanked by Anion and Cation Exchange Membranes. Membranes prevent co-ion release during charging, maintaining high charge efficiency (80% - 98%).
                                </p>
                            </div>

                            <div style={{ border: "1px solid #E2E8F0", borderRadius: "6px", padding: "12px" }}>
                                <h4 style={{ margin: "0 0 4px 0", color: "#0F172A" }}>CDI (Standard Capacitive Deionization)</h4>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                                    Direct contact between solution and carbon electrodes without membranes. Subject to co-ion expulsion and physical electrosorption ceiling (~85% max removal).
                                </p>
                            </div>

                            <div style={{ border: "1px solid #E2E8F0", borderRadius: "6px", padding: "12px" }}>
                                <h4 style={{ margin: "0 0 4px 0", color: "#0F172A" }}>FCDI (Flow-Electrode Capacitive Deionization)</h4>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                                    Utilizes circulating carbon slurry channels behind ion exchange membranes for continuous steady-state desalination without cyclic regeneration downtime.
                                </p>
                            </div>

                            <div style={{ border: "1px solid #E2E8F0", borderRadius: "6px", padding: "12px" }}>
                                <h4 style={{ margin: "0 0 4px 0", color: "#0F172A" }}>EDI (Electrodeionization) — Multi-Gate Quality Framework</h4>
                                <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#64748B" }}>
                                    Combines ion exchange resin beads in dilute channels with continuous electrochemical water splitting for ultrapure water polishing (10 - 18.2 MΩ·cm resistivity).
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: "4px", fontSize: "11px", color: "#334155", border: "1px solid #E2E8F0" }}>
                                    <strong>Manufacturer Feed Gating Specifications (DuPont EDI-310 / SnowPure Electropure):</strong><br/>
                                    • Hardness: ≤ 0.5 mg/L as CaCO₃ (at 90% recovery); ≤ 0.10 mg/L (at 95% recovery; DuPont EDI-310)<br/>
                                    • Feed Conductivity Equivalent (FCE): FCE = Conductivity + 2.79×CO₂ + 1.94×SiO₂; max &lt; 33 µS/cm (optimum &lt; 9 µS/cm; SnowPure)<br/>
                                    • Feed TDS: No universal EDI TDS limit (evaluated via FCE &amp; ionic load; typical RO permeate &lt; 30 mg/L guideline)<br/>
                                    • Secondary Contaminants: Reactive Silica &lt; 0.5 mg/L (&lt; 0.2 optimum), Free CO₂ &lt; 5.0 mg/L (&lt; 2 optimum), TOC &lt; 0.5 mg/L, Fe/Mn &lt; 0.01 mg/L<br/>
                                    • Free Chlorine / Oxidants: DuPont EDI-310 ≤ 0.05 mg/L Cl₂; SnowPure: Non-Detectable (ND)<br/>
                                    • Operating Range: pH 5–9 (DuPont) / 5–9.5 (SnowPure); Temp 10–38°C (DuPont) / 5–35°C (SnowPure); Feed Pressure ≤ 5–6.9 bar<br/>
                                    <em>Direct Feed Screening:</em> High hardness or ionic load triggers upstream RO + softening pretreatment requirement before EDI polishing.
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "REFERENCES" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ fontSize: "12.5px", color: "#334155" }}>
                                <strong>1. Zhao, R., et al. (2012)</strong>. <em>"Energy consumption in membrane capacitive deionization for water desalination."</em> Energy & Environmental Science, 5(11), 9536-9542.
                            </div>
                            <div style={{ fontSize: "12.5px", color: "#334155" }}>
                                <strong>2. Biesheuvel, P. M., & van der Wal, A. (2010)</strong>. <em>"Theory of capacitive deionization with ion exchange membranes."</em> Journal of Membrane Science, 346(2), 256-262.
                            </div>
                            <div style={{ fontSize: "12.5px", color: "#334155" }}>
                                <strong>3. Dykstra, J. E., et al. (2016)</strong>. <em>"Theory of transport and chemical reactions in capacitive deionization."</em> Physical Review E, 94(4), 042602.
                            </div>
                            <div style={{ fontSize: "12.5px", color: "#334155" }}>
                                <strong>4. Porada, S., et al. (2013)</strong>. <em>"Review on the science and technology of water desalination by capacitive deionization."</em> Progress in Materials Science, 58(8), 1388-1442.
                            </div>
                            <div style={{ fontSize: "12.5px", color: "#334155" }}>
                                <strong>5. Jeon, S. I., et al. (2013)</strong>. <em>"Desalination via a new membrane capacitive deionization process utilizing flow-electrodes."</em> Energy & Environmental Science, 6(5), 1471-1475.
                            </div>
                            <div style={{ fontSize: "12.5px", color: "#334155" }}>
                                <strong>6. ASME PTC 19.1 / ISO 5167</strong>. <em>"Measurement of Fluid Flow by Means of Pressure Differential Devices."</em>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div style={{
                    padding: "12px 20px",
                    borderTop: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end"
                }}>
                    <button
                        onClick={() => setShowEngineeringBasis(false)}
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
                        Close Manual
                    </button>
                </div>
            </div>
        </div>
    );
}
