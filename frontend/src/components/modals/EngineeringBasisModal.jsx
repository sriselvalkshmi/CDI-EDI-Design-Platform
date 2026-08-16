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
                                    2. Charge Efficiency (Λ)
                                </h3>
                                <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
                                    Ratio of salt adsorbed over total electric charge supplied to the cell pairs:
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    Λ = (z · F · Δn_salt) / I_total_charge
                                </div>
                                <p style={{ margin: "6px 0 0 0", color: "#64748B", fontSize: "12px" }}>
                                    • CDI (no membranes): Λ ≈ 0.65 - 0.80 due to co-ion expulsion.<br/>
                                    • MCDI (AEM/CEM membranes): Λ ≈ 0.90 - 0.98 due to membrane permselective exclusion.
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
                                    1. Superficial & Interstitial Flow Velocity
                                </h3>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    A_flow = N_cell_pairs · W_electrode · h_spacer<br/>
                                    u_superficial = Q_feed / A_flow<br/>
                                    u_interstitial = u_superficial / ε_spacer  (ε ≈ 0.55 spacer porosity)
                                </div>
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
                                    ΔP = f_spacer · (L_stack / D_h) · (ρ · u² / 2)<br/>
                                    where f_spacer = (64 / Re) + 0.35,  D_h = 2 · W · h / (W + h)
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
                                    2. Net Energy Accounting with Energy Recovery
                                </h3>
                                <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
                                    If an active reverse-electrodialysis/capacitive energy recovery mechanism is present:
                                </p>
                                <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "6px", fontFamily: "monospace", border: "1px solid #E2E8F0", color: "#0F172A" }}>
                                    SEC_net = SEC_electrical_gross - SEC_recovered + SEC_hydraulic<br/>
                                    where SEC_recovered = η_recovery · SEC_electrical_gross (e.g., 20% for MCDI RPD)
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
                                    Employs fixed porous carbon electrodes flanked by Anion and Cation Exchange Membranes. Membranes prevent co-ion release during charging and enhance charge efficiency to &gt;90%.
                                </p>
                            </div>

                            <div style={{ border: "1px solid #E2E8F0", borderRadius: "6px", padding: "12px" }}>
                                <h4 style={{ margin: "0 0 4px 0", color: "#0F172A" }}>CDI (Standard Capacitive Deionization)</h4>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                                    Direct contact between solution and carbon electrodes without membranes. Characterized by simple design but lower charge efficiency due to co-ion repulsion.
                                </p>
                            </div>

                            <div style={{ border: "1px solid #E2E8F0", borderRadius: "6px", padding: "12px" }}>
                                <h4 style={{ margin: "0 0 4px 0", color: "#0F172A" }}>FCDI (Flow-Electrode Capacitive Deionization)</h4>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                                    Utilizes circulating carbon slurry channels behind ion exchange membranes. Continuous charge percolation enables continuous steady-state desalination without cyclic regeneration downtime.
                                </p>
                            </div>

                            <div style={{ border: "1px solid #E2E8F0", borderRadius: "6px", padding: "12px" }}>
                                <h4 style={{ margin: "0 0 4px 0", color: "#0F172A" }}>EDI (Electrodeionization)</h4>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                                    Combines ion exchange resin beads in dilute channels with electric field migration and continuous electrochemical water splitting for ultra-pure water polishing.
                                </p>
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
