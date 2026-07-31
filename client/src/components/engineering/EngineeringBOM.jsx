import React from "react";
import { FileSpreadsheet, Package, Layers, Zap, Gauge } from "lucide-react";

/**
 * EngineeringBOM
 * Automatically generates a complete Engineering Bill of Materials (BOM) schedule
 * including equipment lists, piping schedules, pump ratings, power supply ratings,
 * electrode plate quantities, and membrane area specifications.
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
    const totalSurfaceAreaM2 = ((totalElectrodes * electrodeArea) / 10000).toFixed(2);
    const isMembraneTech = technology === "MCDI" || technology === "EDI" || technology === "FCDI";
    const totalMembranes = isMembraneTech ? cellPairs * 2 : 0;
    const membraneAreaM2 = isMembraneTech ? totalSurfaceAreaM2 : 0;
    const powerKw = ((voltage * current) / 1000).toFixed(3);
    const pumpRatingKw = (flowRate * 0.08).toFixed(2);
    const tankVolumeL = (flowRate * 12).toFixed(0);

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
                            Bill of Materials
                        </h3>
                    </div>
                </div>
                <span style={{ background: "#F1F5F9", color: "#334155", padding: "4px 12px", borderRadius: "6px", fontWeight: "700", fontSize: "12px" }}>
                    TECH: {technology}
                </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Equipment Schedule */}
                <div style={{ background: "#F8FAFC", borderRadius: "10px", padding: "14px", border: "1px solid #E2E8F0" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#1E293B", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Package size={16} color="#2563EB" /> Process Equipment Schedule
                    </h4>
                    <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #CBD5E1", color: "#64748B", textAlign: "left" }}>
                                <th style={{ paddingBottom: "6px" }}>Tag</th>
                                <th style={{ paddingBottom: "6px" }}>Equipment Name</th>
                                <th style={{ paddingBottom: "6px" }}>Specification</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                <td style={{ padding: "5px 0", fontWeight: "700", color: "#2563EB" }}>TK-101</td>
                                <td>Feed Water Tank</td>
                                <td>{tankVolumeL} L (HDPE Composite)</td>
                            </tr>
                            <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                <td style={{ padding: "5px 0", fontWeight: "700", color: "#2563EB" }}>P-101</td>
                                <td>Feed Booster Pump</td>
                                <td>{pumpRatingKw} kW ({flowRate} L/min)</td>
                            </tr>
                            <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                <td style={{ padding: "5px 0", fontWeight: "700", color: "#2563EB" }}>R-101</td>
                                <td>{technology} Module Reactor</td>
                                <td>{cellPairs} Cell Pairs ({electrodeArea} cm²)</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "5px 0", fontWeight: "700", color: "#16A34A" }}>TK-102</td>
                                <td>Product Water Tank</td>
                                <td>{tankVolumeL} L (PVDF/Polypropylene)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Stack Component Quantities */}
                <div style={{ background: "#F8FAFC", borderRadius: "10px", padding: "14px", border: "1px solid #E2E8F0" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#1E293B", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Layers size={16} color="#7C3AED" /> Stack Component Quantities &amp; Materials
                    </h4>
                    {technology === "EDI" ? (
                        <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #CBD5E1", color: "#64748B", textAlign: "left" }}>
                                    <th style={{ paddingBottom: "6px" }}>Component</th>
                                    <th style={{ paddingBottom: "6px" }}>Quantity / Specs</th>
                                    <th style={{ paddingBottom: "6px" }}>Material / Metric</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>Titanium MMO Anode</td>
                                    <td>1 Plate</td>
                                    <td>Titanium Grade 2 (MMO Coated, 8-10 yr life)</td>
                                </tr>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>Titanium MMO Cathode</td>
                                    <td>1 Plate</td>
                                    <td>Titanium Grade 2 (MMO Coated, 8-10 yr life)</td>
                                </tr>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>Mixed-Bed Resin Chamber</td>
                                    <td>{cellPairs} Chambers</td>
                                    <td>{engineering.resinVolumeLiters || ((cellPairs * electrodeArea * 0.5) / 1000).toFixed(2)} L ({engineering.resinWeightKg || (((cellPairs * electrodeArea * 0.5) / 1000) * 0.75).toFixed(2)} kg @ 0.75 kg/L)</td>
                                </tr>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "500", paddingLeft: "10px" }}>↳ Strong Acid Cation (SAC) Resin</td>
                                    <td>50% Vol Ratio</td>
                                    <td>{((engineering.resinVolumeLiters || ((cellPairs * electrodeArea * 0.5) / 1000)) * 0.5).toFixed(2)} L ({((engineering.resinWeightKg || (((cellPairs * electrodeArea * 0.5) / 1000) * 0.75)) * 0.5).toFixed(2)} kg)</td>
                                </tr>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "500", paddingLeft: "10px" }}>↳ Strong Base Anion (SBA) Resin</td>
                                    <td>50% Vol Ratio</td>
                                    <td>{((engineering.resinVolumeLiters || ((cellPairs * electrodeArea * 0.5) / 1000)) * 0.5).toFixed(2)} L ({((engineering.resinWeightKg || (((cellPairs * electrodeArea * 0.5) / 1000) * 0.75)) * 0.5).toFixed(2)} kg)</td>
                                </tr>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>Anion Exchange Membrane (AEM)</td>
                                    <td>{cellPairs} Sheets</td>
                                    <td>{totalSurfaceAreaM2} m² Area (Heterogeneous/Homogeneous)</td>
                                </tr>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>Cation Exchange Membrane (CEM)</td>
                                    <td>{cellPairs} Sheets</td>
                                    <td>{totalSurfaceAreaM2} m² Area (Heterogeneous/Homogeneous)</td>
                                </tr>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>Titanium End &amp; Pressure Plates</td>
                                    <td>2 Assembly Plates</td>
                                    <td>High-Strength Titanium Grade 2 / Epoxy Coated</td>
                                </tr>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>Current Collectors &amp; Bus Bars</td>
                                    <td>2 Bus Bars</td>
                                    <td>Heavy Duty Copper / Silver Plated</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>Gaskets &amp; Tie Bolts</td>
                                    <td>1 Set (Full Stack)</td>
                                    <td>EPDM / Viton Gaskets, 316L SS Bolts</td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #CBD5E1", color: "#64748B", textAlign: "left" }}>
                                    <th style={{ paddingBottom: "6px" }}>Component</th>
                                    <th style={{ paddingBottom: "6px" }}>Quantity</th>
                                    <th style={{ paddingBottom: "6px" }}>Total Metric</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>Porous Carbon Electrodes</td>
                                    <td>{totalElectrodes} Plates</td>
                                    <td>{totalSurfaceAreaM2} m² Area</td>
                                </tr>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>Flow Mesh Spacers</td>
                                    <td>{cellPairs} Mesh Sheets</td>
                                    <td>{labels.sac || "0.5 mm"} Gap</td>
                                </tr>
                                <tr style={{ borderBottom: "1px stroke #E2E8F0" }}>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>CEM Membranes</td>
                                    <td>{isMembraneTech ? cellPairs : 0} Sheets</td>
                                    <td>{membraneAreaM2} m² Area</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: "5px 0", fontWeight: "600" }}>AEM Membranes</td>
                                    <td>{isMembraneTech ? cellPairs : 0} Sheets</td>
                                    <td>{membraneAreaM2} m² Area</td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
