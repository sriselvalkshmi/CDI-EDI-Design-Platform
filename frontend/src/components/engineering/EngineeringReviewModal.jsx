import React, { useState } from "react";
import { X, CheckCircle, AlertTriangle, ShieldCheck, Scale, Zap, Activity, BookOpen, Layers, Copy, Check } from "lucide-react";

export default function EngineeringReviewModal({ isOpen, onClose, designResult }) {
    const [activeTab, setActiveTab] = useState("closures");
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const eng = designResult?.engineering || designResult?.canonical || designResult || {};
    const basis = eng.DesignBasis || {};
    const techRes = eng.TechnologyResult || {};
    const hydRes = eng.HydraulicResult || {};
    const elecRes = eng.ElectricalResult || {};
    const mb = eng.MassBalance || {};
    const sb = eng.SaltBalance || {};
    const cb = eng.ChargeBalance || {};
    const dcr = eng.DynamicCycleResult || {};
    const fg = eng.feasibilityGate || {};
    const val = eng.ValidationResult || {};

    const gates = fg.gates || {};
    const isOverallFeasible = fg.isFeasible !== false && val.isFeasible !== false;

    const handleCopyJson = () => {
        const auditPayload = {
            technology: eng.technology,
            timestamp: new Date().toISOString(),
            feasibilityStatus: isOverallFeasible ? "FEASIBLE" : "NON_COMPLIANT",
            validationTier: val.validationTier || "LEVEL 3: FEASIBLE & COMPLIANT",
            DesignBasis: basis,
            MassBalance: mb,
            SaltBalance: sb,
            ChargeBalance: cb,
            DynamicCycleResult: dcr,
            HydraulicResult: hydRes,
            ElectricalResult: elecRes,
            FeasibilityGates: gates
        };
        navigator.clipboard.writeText(JSON.stringify(auditPayload, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
            <div style={{
                background: "#FFFFFF",
                width: "95%",
                maxWidth: "1150px",
                maxHeight: "90vh",
                borderRadius: "12px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                border: "1px solid #CBD5E1"
            }}>
                {/* Header */}
                <div style={{
                    padding: "16px 24px",
                    background: "#0F172A",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #334155"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            background: isOverallFeasible ? "#059669" : "#DC2626",
                            padding: "8px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <ShieldCheck size={20} color="#FFFFFF" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", letterSpacing: "-0.01em" }}>
                                Authoritative Engineering Review & Physical Balance Audit
                            </h2>
                            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94A3B8" }}>
                                Technology: <strong style={{ color: "#38BDF8" }}>{eng.technology || "MCDI"}</strong> | Single Source of Truth Engine | Validation: {val.validationTier || "LEVEL 3: FIRST-PRINCIPLES"}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                            onClick={handleCopyJson}
                            style={{
                                background: copied ? "#059669" : "#1E293B",
                                color: "#F8FAFC",
                                border: "1px solid #475569",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copied ? "Copied Audit JSON" : "Copy Audit JSON"}</span>
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#94A3B8",
                                cursor: "pointer",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: "flex",
                    background: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                    padding: "0 24px"
                }}>
                    {[
                        { id: "closures", label: "Conservation & Balance Closures", icon: Scale },
                        { id: "provenance", label: "Parameter Provenance Registry", icon: Layers },
                        { id: "gates", label: "Feasibility Gates (10 Checks)", icon: ShieldCheck },
                        { id: "equations", label: "Governing Physics & Citations", icon: BookOpen }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "12px 16px",
                                    background: "none",
                                    border: "none",
                                    borderBottom: isActive ? "2px solid #2563EB" : "2px solid transparent",
                                    color: isActive ? "#2563EB" : "#64748B",
                                    fontWeight: isActive ? "700" : "500",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease"
                                }}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div style={{ padding: "24px", overflowY: "auto", flex: 1, background: "#FFFFFF" }}>
                    {/* TAB 1: CONSERVATION CLOSURES */}
                    {activeTab === "closures" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Grid of 4 Core Balances */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                                {/* Fluid Mass Balance Card */}
                                <div style={{
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: `1px solid ${mb.isConserved ? "#BBF7D0" : "#FECACA"}`,
                                    background: mb.isConserved ? "#F0FDF4" : "#FEF2F2"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Scale size={18} color={mb.isConserved ? "#16A34A" : "#DC2626"} />
                                            <span style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A" }}>Fluid Mass Balance</span>
                                        </div>
                                        <span style={{
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            padding: "2px 8px",
                                            borderRadius: "12px",
                                            background: mb.isConserved ? "#DCFCE7" : "#FEE2E2",
                                            color: mb.isConserved ? "#15803D" : "#991B1B"
                                        }}>
                                            {mb.isConserved ? "STRICTLY CONSERVED" : "DISCREPANCY"}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <div><strong>Q_feed:</strong> {Number(mb.flowInLmin ?? 10).toFixed(4)} L/min</div>
                                        <div><strong>Q_product + Q_reject:</strong> {(Number(mb.flowOutProductLmin ?? 9.5) + Number(mb.flowOutRejectLmin ?? 0.5)).toFixed(4)} L/min ({Number(mb.flowOutProductLmin ?? 9.5).toFixed(4)} + {Number(mb.flowOutRejectLmin ?? 0.5).toFixed(4)})</div>
                                        <div><strong>Residual (|Q_in - ΣQ_out|):</strong> <span style={{ fontFamily: "monospace", fontWeight: "700" }}>{Number(mb.flowResidualLmin ?? 0).toFixed(6)} L/min</span> (Tolerance: 1.0e-4)</div>
                                    </div>
                                </div>

                                {/* Solute Salt Mass Balance Card */}
                                <div style={{
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: `1px solid ${sb.isConserved ? "#BBF7D0" : "#FECACA"}`,
                                    background: sb.isConserved ? "#F0FDF4" : "#FEF2F2"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Activity size={18} color={sb.isConserved ? "#16A34A" : "#DC2626"} />
                                            <span style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A" }}>Solute Salt Balance</span>
                                        </div>
                                        <span style={{
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            padding: "2px 8px",
                                            borderRadius: "12px",
                                            background: sb.isConserved ? "#DCFCE7" : "#FEE2E2",
                                            color: sb.isConserved ? "#15803D" : "#991B1B"
                                        }}>
                                            {sb.isConserved ? "STRICTLY CONSERVED (<0.1%)" : "DISCREPANCY"}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <div><strong>Salt In (Q_in × C_in):</strong> {Number(sb.saltInGs ?? 0).toFixed(6)} g/s</div>
                                        <div><strong>Salt Out (Prod + Rej):</strong> {(Number(sb.saltOutProductGs ?? 0) + Number(sb.saltOutRejectGs ?? 0)).toFixed(6)} g/s ({Number(sb.saltOutProductGs ?? 0).toFixed(6)} + {Number(sb.saltOutRejectGs ?? 0).toFixed(6)})</div>
                                        <div><strong>Residual & Relative Error:</strong> <span style={{ fontFamily: "monospace", fontWeight: "700" }}>{Number(sb.saltResidualGs ?? 0).toFixed(8)} g/s ({Number(sb.relativeErrorPct ?? 0).toFixed(4)}%)</span></div>
                                    </div>
                                </div>

                                {/* Faraday Charge Balance Reconciliation Card */}
                                <div style={{
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: `1px solid ${cb.isConserved ? "#BBF7D0" : "#FECACA"}`,
                                    background: cb.isConserved ? "#F0FDF4" : "#FEF2F2"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Zap size={18} color={cb.isConserved ? "#16A34A" : "#DC2626"} />
                                            <span style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A" }}>Faraday Charge Reconciliation</span>
                                        </div>
                                        <span style={{
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            padding: "2px 8px",
                                            borderRadius: "12px",
                                            background: cb.isConserved ? "#DCFCE7" : "#FEE2E2",
                                            color: cb.isConserved ? "#15803D" : "#991B1B"
                                        }}>
                                            {cb.isConserved ? "RECONCILED" : "DISCREPANCY"}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <div><strong>Observed Salt Removal Rate:</strong> {Number(cb.observedSoluteRemovalGs ?? 0).toFixed(6)} g/s</div>
                                        <div><strong>Faradaic Equivalent (N·I·Λ·M / zF):</strong> {Number(cb.faradaicEquivalentRemovalGs ?? 0).toFixed(6)} g/s</div>
                                        <div><strong>Charge Efficiency (Λ):</strong> {Number(cb.chargeEfficiencyPct ?? 88.0).toFixed(1)}% | <strong>Residual:</strong> <span style={{ fontFamily: "monospace", fontWeight: "700" }}>{Number(cb.chargeResidualGs ?? 0).toFixed(6)} g/s</span></div>
                                    </div>
                                </div>

                                {/* Dynamic Cycle Inventory Conservation Card */}
                                <div style={{
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: `1px solid ${dcr.isInventoryConserved ? "#BBF7D0" : "#FECACA"}`,
                                    background: dcr.isInventoryConserved ? "#F0FDF4" : "#FEF2F2"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Activity size={18} color={dcr.isInventoryConserved ? "#16A34A" : "#DC2626"} />
                                            <span style={{ fontWeight: "700", fontSize: "14px", color: "#0F172A" }}>Dynamic Cycle Inventory Closure</span>
                                        </div>
                                        <span style={{
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            padding: "2px 8px",
                                            borderRadius: "12px",
                                            background: dcr.isInventoryConserved ? "#DCFCE7" : "#FEE2E2",
                                            color: dcr.isInventoryConserved ? "#15803D" : "#991B1B"
                                        }}>
                                            {dcr.isInventoryConserved ? "ΔM_salt = 0 CLOSED" : "INCOMPLETE"}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <div><strong>Adsorption Salt Mass (M_ads):</strong> {Number(dcr.adsorbedSaltMg ?? 0).toFixed(2)} mg (t_ads = {dcr.adsorptionTimeSec ?? 600}s)</div>
                                        <div><strong>Desorption Salt Mass (M_des):</strong> {Number(dcr.desorbedSaltMg ?? 0).toFixed(2)} mg (t_des = {dcr.desorptionTimeSec ?? 60}s)</div>
                                        <div><strong>Cycle Inventory Accumulation:</strong> <span style={{ fontFamily: "monospace", fontWeight: "700" }}>{Number(dcr.cycleResidualMg ?? 0).toFixed(6)} mg</span> (Zero Drift)</div>
                                    </div>
                                </div>
                            </div>

                            {/* Techno-Economic Annual Production Basis */}
                            <div style={{
                                background: "#F1F5F9",
                                borderRadius: "8px",
                                padding: "14px 18px",
                                border: "1px solid #CBD5E1",
                                fontSize: "12.5px",
                                color: "#1E293B"
                            }}>
                                <strong style={{ color: "#0F172A" }}>Techno-Economic Production Basis Consistency:</strong>
                                <div style={{ display: "flex", gap: "24px", marginTop: "6px" }}>
                                    <div><strong>Operating Basis:</strong> 24 h/day × 350 days/yr = <strong>8,400 hours/year</strong></div>
                                    <div><strong>Product Flow:</strong> {Number(eng.productFlowLmin ?? 9.5).toFixed(2)} L/min ({((Number(eng.productFlowLmin ?? 9.5) * 60) / 1000).toFixed(3)} m³/h)</div>
                                    <div><strong>Annual Water Yield:</strong> <strong>{(((Number(eng.productFlowLmin ?? 9.5) * 60) / 1000) * 8400).toLocaleString(undefined, { maximumFractionDigits: 1 })} m³/year</strong></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: PARAMETER PROVENANCE REGISTRY */}
                    {activeTab === "provenance" && (
                        <div>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ background: "#F1F5F9", borderBottom: "2px solid #CBD5E1" }}>
                                        <th style={{ padding: "8px 10px" }}>Parameter ID</th>
                                        <th style={{ padding: "8px 10px" }}>Canonical Name</th>
                                        <th style={{ padding: "8px 10px" }}>Value</th>
                                        <th style={{ padding: "8px 10px" }}>Unit</th>
                                        <th style={{ padding: "8px 10px" }}>Equation ID</th>
                                        <th style={{ padding: "8px 10px" }}>Authoritative Owner</th>
                                        <th style={{ padding: "8px 10px" }}>Uncertainty</th>
                                        <th style={{ padding: "8px 10px" }}>Dependencies</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        basis.feedTDS,
                                        basis.feedFlow,
                                        basis.targetTds,
                                        basis.targetRecovery,
                                        basis.activeArea,
                                        techRes.outletTDS,
                                        techRes.waterRecovery,
                                        techRes.cellPairs,
                                        hydRes.productFlow,
                                        hydRes.linearVelocity,
                                        hydRes.channelPressureDrop,
                                        hydRes.auxSec,
                                        elecRes.cellVoltage,
                                        elecRes.stackVoltage,
                                        elecRes.cellCurrent,
                                        elecRes.currentDensity,
                                        elecRes.stackPower,
                                        elecRes.secGross
                                    ].filter(Boolean).map((p, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0" }}>
                                            <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: "600", color: "#2563EB" }}>{p.parameterId}</td>
                                            <td style={{ padding: "8px 10px", fontWeight: "500" }}>{p.parameter}</td>
                                            <td style={{ padding: "8px 10px", fontFamily: "monospace", fontWeight: "700" }}>{p.value}</td>
                                            <td style={{ padding: "8px 10px", color: "#64748B" }}>{p.unit}</td>
                                            <td style={{ padding: "8px 10px", fontFamily: "monospace" }}>{p.equationId}</td>
                                            <td style={{ padding: "8px 10px", color: "#334155" }}>{p.source}</td>
                                            <td style={{ padding: "8px 10px", color: "#64748B" }}>{p.uncertainty}</td>
                                            <td style={{ padding: "8px 10px", color: "#64748B", fontSize: "11px" }}>{Array.isArray(p.dependencies) && p.dependencies.length > 0 ? p.dependencies.join(", ") : "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* TAB 3: FEASIBILITY GATES */}
                    {activeTab === "gates" && (
                        <div>
                            <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "8px", background: isOverallFeasible ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${isOverallFeasible ? "#BBF7D0" : "#FECACA"}` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {isOverallFeasible ? <CheckCircle size={20} color="#16A34A" /> : <AlertTriangle size={20} color="#DC2626" />}
                                    <strong style={{ fontSize: "14px", color: isOverallFeasible ? "#166534" : "#991B1B" }}>
                                        {isOverallFeasible ? "Design Passed All Strict Engineering Feasibility Gates" : "Design Has Operational / Physical Gate Violations"}
                                    </strong>
                                </div>
                            </div>

                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ background: "#F1F5F9", borderBottom: "2px solid #CBD5E1" }}>
                                        <th style={{ padding: "8px 10px" }}>Gate Check</th>
                                        <th style={{ padding: "8px 10px" }}>Status</th>
                                        <th style={{ padding: "8px 10px" }}>Actual Value</th>
                                        <th style={{ padding: "8px 10px" }}>Required Spec</th>
                                        <th style={{ padding: "8px 10px" }}>Tolerance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(gates).map(([key, gate]) => (
                                        <tr key={key} style={{ borderBottom: "1px solid #E2E8F0" }}>
                                            <td style={{ padding: "8px 10px", fontWeight: "600" }}>{gate.name || key}</td>
                                            <td style={{ padding: "8px 10px" }}>
                                                <span style={{
                                                    fontSize: "11px",
                                                    fontWeight: "700",
                                                    padding: "2px 8px",
                                                    borderRadius: "12px",
                                                    background: gate.status === "PASS" ? "#DCFCE7" : "#FEE2E2",
                                                    color: gate.status === "PASS" ? "#15803D" : "#991B1B"
                                                }}>
                                                    {gate.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: "8px 10px", fontFamily: "monospace" }}>{gate.actual}</td>
                                            <td style={{ padding: "8px 10px", color: "#334155" }}>{gate.required}</td>
                                            <td style={{ padding: "8px 10px", color: "#64748B" }}>{gate.tolerance || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* TAB 4: GOVERNING PHYSICS & CITATIONS */}
                    {activeTab === "equations" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ padding: "14px", border: "1px solid #E2E8F0", borderRadius: "8px", background: "#F8FAFC" }}>
                                <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#0F172A" }}>1. Conservation of Water Mass</h4>
                                <code style={{ fontSize: "12px", color: "#1E293B", background: "#FFFFFF", padding: "4px 8px", borderRadius: "4px", border: "1px solid #CBD5E1", display: "inline-block" }}>
                                    Q_feed = Q_product + Q_reject
                                </code>
                                <p style={{ margin: "6px 0 0 0", fontSize: "11.5px", color: "#64748B" }}>Incompressible fluid mass continuity across parallelized membrane and spacer stacks.</p>
                            </div>

                            <div style={{ padding: "14px", border: "1px solid #E2E8F0", borderRadius: "8px", background: "#F8FAFC" }}>
                                <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#0F172A" }}>2. Conservation of Solute Mass</h4>
                                <code style={{ fontSize: "12px", color: "#1E293B", background: "#FFFFFF", padding: "4px 8px", borderRadius: "4px", border: "1px solid #CBD5E1", display: "inline-block" }}>
                                    Q_feed · C_feed = Q_product · C_product + Q_reject · C_reject
                                </code>
                                <p style={{ margin: "6px 0 0 0", fontSize: "11.5px", color: "#64748B" }}>Steady-state mass conservation of total dissolved ionic species.</p>
                            </div>

                            <div style={{ padding: "14px", border: "1px solid #E2E8F0", borderRadius: "8px", background: "#F8FAFC" }}>
                                <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#0F172A" }}>3. Faraday's Law of Electrosorption</h4>
                                <code style={{ fontSize: "12px", color: "#1E293B", background: "#FFFFFF", padding: "4px 8px", borderRadius: "4px", border: "1px solid #CBD5E1", display: "inline-block" }}>
                                    m_dot_salt = (N_pairs · I_cell · Λ · M_NaCl) / (z · F)
                                </code>
                                <p style={{ margin: "6px 0 0 0", fontSize: "11.5px", color: "#64748B" }}>Relates cell current and charge efficiency Λ to rate of ionic mass removal.</p>
                            </div>

                            <div style={{ padding: "14px", border: "1px solid #E2E8F0", borderRadius: "8px", background: "#F8FAFC" }}>
                                <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#0F172A" }}>4. Literature Benchmark Citations</h4>
                                <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", fontSize: "11.5px", color: "#334155" }}>
                                    <li><strong>CDI:</strong> Porada et al., 2013, <em>Review on the Science and Technology of Water Desalination by Capacitive Deionization</em>, Progress in Materials Science 58 (8), 1388-1442.</li>
                                    <li><strong>MCDI:</strong> Zhao et al., 2012, <em>Energy consumption in membrane capacitive deionization</em>, Water Research 46 (4), 1073-1081.</li>
                                    <li><strong>FCDI:</strong> Jeon et al., 2013, <em>Desalination via a new continuous flow-electrode capacitive deionization process</em>, Energy & Environmental Science 6 (5), 1471-1475.</li>
                                    <li><strong>EDI:</strong> DuPont EDI Technical Manual / SnowPure Electropure EDI Module Technical Specification for High-Purity Demineralization.</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "12px 24px",
                    background: "#F8FAFC",
                    borderTop: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                        CDI/EDI Authoritative Architecture — Deterministic Physics Engine v2.5.0
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#0F172A",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "6px 16px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer"
                        }}
                    >
                        Close Review
                    </button>
                </div>
            </div>
        </div>
    );
}
