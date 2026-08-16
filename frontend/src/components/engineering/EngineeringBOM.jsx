import React from "react";
import { FileSpreadsheet, Package, Layers, DollarSign } from "lucide-react";

/**
 * EngineeringBOM
 * Automatically generates a complete commercial Engineering Bill of Materials (BOM) schedule
 * including manufacturer, part numbers, unit prices, total pricing, and estimated CAPEX summary.
 */
export default function EngineeringBOM({
    technology = "CDI",
    labels = {},
    feedWater = {},
    engineering = {},
    optimization = {}
}) {
    const flowRate = Number(feedWater.flowRate || 10);
    const cellPairs = Number(optimization.cellPairs || engineering.cellPairs || 36);
    const electrodeArea = Number(optimization.electrodeArea || engineering.electrodeArea || 250);
    const voltage = Number(optimization.voltage || engineering.voltage || 1.2);
    const current = Number(optimization.current || engineering.current || 5.0);

    const totalElectrodes = cellPairs * 2;
    const totalSurfaceAreaM2 = Number(((totalElectrodes * electrodeArea) / 10000).toFixed(2));
    const isMembraneTech = technology === "MCDI" || technology === "EDI" || technology === "FCDI";
    const pumpRatingKw = (flowRate * 0.08).toFixed(2);
    const tankVolumeL = (flowRate * 12).toFixed(0);
    const resinVolL = Number(engineering.resinVolumeLiters || ((cellPairs * electrodeArea * 0.5) / 1000).toFixed(2));

    // Commercial Cost Estimation Model
    const equipmentItems = [
        { tag: "TK-101", name: "Feed Water Tank", spec: `${tankVolumeL} L (HDPE Composite)`, mfr: "Snyder Industries", partNo: "TK-HDPE-500L", qty: 1, unitPrice: 450 },
        { tag: "P-101", name: "Feed Booster Pump", spec: `${pumpRatingKw} kW (${flowRate} L/min)`, mfr: "Grundfos / Siemens", partNo: "CRN-10-04-A-FG", qty: 1, unitPrice: 1250 },
        { tag: "R-101", name: `${technology} Module Reactor`, spec: `${cellPairs} Cell Pairs (${electrodeArea} cm²)`, mfr: technology === "EDI" ? "SnowPure / Evoqua" : "Industrial OEM", partNo: `${technology}-STACK-${electrodeArea}X`, qty: 1, unitPrice: technology === "EDI" ? 3800 : 2600 },
        { tag: "TK-102", name: "Product Water Tank", spec: `${tankVolumeL} L (PVDF/Polypropylene)`, mfr: "Georg Fischer / Chem-Tainer", partNo: "TK-PVDF-500L", qty: 1, unitPrice: 650 }
    ];

    const ediStackItems = [
        { name: "Titanium MMO Anode Plate", spec: "Titanium Grade 2 (MMO Coated)", mfr: "De Nora Tech", partNo: "MMO-ANODE-Ti2", qty: "1 Plate", unitPrice: 480, total: 480 },
        { name: "Titanium MMO Cathode Plate", spec: "Titanium Grade 2 (MMO Coated)", mfr: "De Nora Tech", partNo: "MMO-CATHODE-Ti2", qty: "1 Plate", unitPrice: 420, total: 420 },
        { name: "Mixed-Bed Resin (SAC + SBA)", spec: `${resinVolL} L (${(resinVolL * 0.75).toFixed(2)} kg @ 0.75 kg/L)`, mfr: "DuPont AmberLite / Dow", partNo: "UP6150-MB", qty: `${resinVolL} L`, unitPrice: 45, total: Math.round(resinVolL * 45) },
        { name: "Anion Exchange Membrane (AEM)", spec: `${totalSurfaceAreaM2} m² Total Membrane Area`, mfr: "Astom / AGC Corp", partNo: "NEOSEPTA-AMX", qty: `${cellPairs} Sheets`, unitPrice: 180, total: Math.round(totalSurfaceAreaM2 * 180) },
        { name: "Cation Exchange Membrane (CEM)", spec: `${totalSurfaceAreaM2} m² Total Membrane Area`, mfr: "Astom / AGC Corp", partNo: "NEOSEPTA-CMX", qty: `${cellPairs} Sheets`, unitPrice: 180, total: Math.round(totalSurfaceAreaM2 * 180) },
        { name: "Titanium End & Pressure Plates", spec: "High Strength Grade 2 Titanium", mfr: "Custom Machined", partNo: "PRESS-PLATE-Ti2", qty: "2 Plates", unitPrice: 350, total: 700 },
        { name: "Gaskets & Tie Bolt Assembly", spec: "EPDM Gaskets, 316L SS Hardware", mfr: "McMaster-Carr", partNo: "SEAL-EPDM-316", qty: "1 Set", unitPrice: 280, total: 280 }
    ];

    const cdiStackItems = [
        { name: "Porous Carbon Electrodes", spec: `${totalSurfaceAreaM2} m² Active Carbon Area`, mfr: "Calgon / Kurita", partNo: "CARB-PLATE-250", qty: `${totalElectrodes} Plates`, unitPrice: 25, total: totalElectrodes * 25 },
        { name: "Flow Mesh Spacers", spec: `${labels.sac || "0.5 mm"} Spacer Gap`, mfr: "Nirako Mesh", partNo: "MESH-SPACER-05", qty: `${cellPairs} Sheets`, unitPrice: 12, total: cellPairs * 12 },
        { name: "CEM Membranes", spec: isMembraneTech ? `${totalSurfaceAreaM2} m²` : "N/A", mfr: isMembraneTech ? "Fumatech" : "N/A", partNo: isMembraneTech ? "FUMASEP-FKB" : "N/A", qty: isMembraneTech ? `${cellPairs} Sheets` : "0", unitPrice: isMembraneTech ? 140 : 0, total: isMembraneTech ? Math.round(totalSurfaceAreaM2 * 140) : 0 },
        { name: "AEM Membranes", spec: isMembraneTech ? `${totalSurfaceAreaM2} m²` : "N/A", mfr: isMembraneTech ? "Fumatech" : "N/A", partNo: isMembraneTech ? "FUMASEP-FAB" : "N/A", qty: isMembraneTech ? `${cellPairs} Sheets` : "0", unitPrice: isMembraneTech ? 140 : 0, total: isMembraneTech ? Math.round(totalSurfaceAreaM2 * 140) : 0 }
    ];

    const stackItems = technology === "EDI" ? ediStackItems : cdiStackItems;

    const totalEqCost = equipmentItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
    const totalStackCost = stackItems.reduce((sum, item) => sum + item.total, 0);
    const totalPlantCapex = totalEqCost + totalStackCost;

    return (
        <div className="engineering-bom-container" style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #CBD5E1",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
            padding: "20px",
            marginTop: "20px"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ background: "#EFF6FF", padding: "8px", borderRadius: "8px", color: "#2563EB" }}>
                        <FileSpreadsheet size={22} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                            Commercial Bill of Materials (BOM) &amp; Cost Estimation
                        </h3>
                        <span style={{ fontSize: "12px", color: "#64748B" }}>
                            Complete equipment schedule with manufacturer, part numbers, unit prices &amp; total CAPEX
                        </span>
                    </div>
                </div>
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "6px 14px", borderRadius: "8px", color: "#166534", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <DollarSign size={16} /> Total Estimated CAPEX: ${totalPlantCapex.toLocaleString()} USD
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Process Equipment Schedule */}
                <div style={{ background: "#F8FAFC", borderRadius: "10px", padding: "14px", border: "1px solid #E2E8F0" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#1E293B", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Package size={16} color="#2563EB" /> Process Equipment Schedule
                    </h4>
                    <table style={{ width: "100%", fontSize: "11.5px", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1.5px solid #CBD5E1", color: "#64748B", textAlign: "left" }}>
                                <th style={{ paddingBottom: "6px" }}>Tag</th>
                                <th style={{ paddingBottom: "6px" }}>Equipment / Specs</th>
                                <th style={{ paddingBottom: "6px" }}>Mfr &amp; Part No</th>
                                <th style={{ paddingBottom: "6px", textAlign: "right" }}>Unit ($)</th>
                                <th style={{ paddingBottom: "6px", textAlign: "right" }}>Total ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipmentItems.map((item) => (
                                <tr key={item.tag} style={{ borderBottom: "1px solid #E2E8F0" }}>
                                    <td style={{ padding: "6px 0", fontWeight: "700", color: "#2563EB" }}>{item.tag}</td>
                                    <td>
                                        <strong style={{ color: "#1F2937", display: "block" }}>{item.name}</strong>
                                        <span style={{ fontSize: "10.5px", color: "#64748B" }}>{item.spec}</span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: "600", color: "#334155" }}>{item.mfr}</div>
                                        <span style={{ fontSize: "10px", color: "#2563EB", fontFamily: "monospace" }}>{item.partNo}</span>
                                    </td>
                                    <td style={{ textAlign: "right", color: "#475569" }}>${item.unitPrice}</td>
                                    <td style={{ textAlign: "right", fontWeight: "700", color: "#0F172A" }}>${item.unitPrice * item.qty}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Stack Components & Materials */}
                <div style={{ background: "#F8FAFC", borderRadius: "10px", padding: "14px", border: "1px solid #E2E8F0" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#1E293B", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Layers size={16} color="#7C3AED" /> Stack Component Quantities &amp; Pricing
                    </h4>
                    <table style={{ width: "100%", fontSize: "11.5px", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1.5px solid #CBD5E1", color: "#64748B", textAlign: "left" }}>
                                <th style={{ paddingBottom: "6px" }}>Component</th>
                                <th style={{ paddingBottom: "6px" }}>Mfr &amp; Part No</th>
                                <th style={{ paddingBottom: "6px" }}>Qty / Specs</th>
                                <th style={{ paddingBottom: "6px", textAlign: "right" }}>Total ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stackItems.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "600", color: "#1F2937" }}>{item.name}</td>
                                    <td>
                                        <div style={{ color: "#334155" }}>{item.mfr}</div>
                                        <span style={{ fontSize: "10px", color: "#7C3AED", fontFamily: "monospace" }}>{item.partNo}</span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: "600", color: "#0F172A" }}>{item.qty}</div>
                                        <span style={{ fontSize: "10.5px", color: "#64748B" }}>{item.spec}</span>
                                    </td>
                                    <td style={{ textAlign: "right", fontWeight: "700", color: "#0F172A" }}>${item.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
