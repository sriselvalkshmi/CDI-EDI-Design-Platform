import React from "react";
import { useApp } from "../context/AppContext";

export default function EquipmentPanel() {
    const { designResult, setSelectedEquipment } = useApp();

    if (!designResult) {
        return null;
    }

    const engineering = designResult.engineering || {};
    const feedWater = designResult.input?.feedWater || {};
    const technology = engineering.technology || "MCDI";
    const flowRate = Number(engineering.flowRate || feedWater.flowRate || 10);

    const voltageStack = Number(engineering.voltageStack || (engineering.cellPairs * Number(engineering.voltageCell || 1.2))).toFixed(1);

    // Dynamically Calculated Equipment Schedule Table
    const equipmentItems = [
        { tag: "TK-101", name: "Feed Storage Tank", type: "Process Tank", sizing: `${Math.round(flowRate * 60)} L`, status: "Active" },
        { tag: "FL-101", name: "Pretreatment Cartridge Filter", type: "Microfiltration", sizing: "5 µm Cartridge (Pre-filtration)", status: "Active" },
        { tag: "P-101", name: "Feed Water Pump", type: "Centrifugal Pump", sizing: `${(engineering.power * 0.002 + 0.35).toFixed(2)} kW (${flowRate} L/min)`, status: "Active" },
        { tag: "FM-101", name: "Electromagnetic Flow Meter", type: "Instrumentation", sizing: `0 - ${Math.round(flowRate * 1.5)} L/min`, status: "Active" },
        { tag: "R-101", name: `${technology} Reactor Stack Module`, type: `${technology} Stack`, sizing: `${engineering.cellPairs} pairs (${engineering.electrodeArea} cm²), V_stack=${voltageStack}V`, status: "Active" },
        ...(technology === "FCDI" ? [
            { tag: "TK-102A", name: "Anolyte Carbon Slurry Tank A", type: "Slurry Tank", sizing: `${Math.round(flowRate * 25)} L (15 wt% Carbon Suspension)`, status: "Active" },
            { tag: "TK-102B", name: "Catholyte Carbon Slurry Tank B", type: "Slurry Tank", sizing: `${Math.round(flowRate * 25)} L (15 wt% Carbon Suspension)`, status: "Active" },
            { tag: "SP-101A", name: "Anolyte Slurry Pump A", type: "Peristaltic Pump", sizing: "1.2 kW Slurry Duty (Continuous)", status: "Active" },
            { tag: "SP-101B", name: "Catholyte Slurry Pump B", type: "Peristaltic Pump", sizing: "1.2 kW Slurry Duty (Continuous)", status: "Active" },
            { tag: "SEP-101", name: "Carbon Slurry Separator / Hydrocyclone", type: "Separator Loop", sizing: "Continuous Slurry Regeneration", status: "Active" }
        ] : []),
        ...(technology === "EDI" ? [
            { tag: "REC-101", name: "DC Power Rectifier Module", type: "Power Supply", sizing: `${voltageStack} V DC / ${engineering.current} A`, status: "Active" }
        ] : []),
        { tag: "TK-103", name: "Product Storage Tank", type: "Product Tank", sizing: `${Math.round(flowRate * 50)} L`, status: "Active" }
    ];

    function handleInspect(item) {
        let spec = {
            tag: item.tag,
            name: item.name,
            type: item.type,
            sizing: item.sizing,
            technology,
            operatingFlow: `${flowRate} L/min`,
            operatingPressure: `${(engineering.pressureDrop / 100000 + 1.0).toFixed(1)} bar`,
            voltage: item.tag === "R-101" ? `${engineering.voltage} V` : "N/A",
            current: item.tag === "R-101" ? `${engineering.current} A` : "N/A",
            cellPairs: engineering.cellPairs,
            electrodeArea: `${engineering.electrodeArea} cm²`,
            material: item.tag === "R-101" ? "PVDF Enclosure + Porous Carbon Electrodes" : "316L Stainless Steel / HDPE",
            designStandard: "ISO 10628 / ASME Sec VIII",
            notes: "Dynamically sized based on literature Faraday calculations."
        };

        if (setSelectedEquipment) {
            setSelectedEquipment(spec);
        }
    }

    return (
        <div className="panel equipment-panel" style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
        }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                Dynamically Calculated Equipment Schedule
            </h3>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                        <th style={{ padding: "8px 10px", fontWeight: "600" }}>Tag</th>
                        <th style={{ padding: "8px 10px", fontWeight: "600" }}>Equipment Name</th>
                        <th style={{ padding: "8px 10px", fontWeight: "600" }}>Type</th>
                        <th style={{ padding: "8px 10px", fontWeight: "600" }}>Calculated Sizing</th>
                        <th style={{ padding: "8px 10px", fontWeight: "600" }}>Status</th>
                        <th style={{ padding: "8px 10px", fontWeight: "600", textAlign: "right" }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {equipmentItems.map((eq) => (
                        <tr key={eq.tag} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "8px 10px", fontWeight: "600", fontFamily: "monospace", color: "#2563EB" }}>
                                {eq.tag}
                            </td>
                            <td style={{ padding: "8px 10px", fontWeight: "600", color: "#0F172A" }}>
                                {eq.name}
                            </td>
                            <td style={{ padding: "8px 10px", color: "#475569" }}>
                                {eq.type}
                            </td>
                            <td style={{ padding: "8px 10px", fontWeight: "700", color: "#059669" }}>
                                {eq.sizing}
                            </td>
                            <td style={{ padding: "8px 10px", fontWeight: "600", color: "#16A34A" }}>
                                {eq.status}
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "right" }}>
                                <button
                                    onClick={() => handleInspect(eq)}
                                    style={{
                                        background: "#EFF6FF",
                                        color: "#2563EB",
                                        border: "1px solid #BFDBFE",
                                        borderRadius: "4px",
                                        padding: "3px 8px",
                                        fontSize: "11.5px",
                                        fontWeight: "600",
                                        cursor: "pointer"
                                    }}
                                >
                                    Inspect
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}