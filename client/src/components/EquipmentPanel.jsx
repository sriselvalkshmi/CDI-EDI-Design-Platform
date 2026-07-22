import React from "react";
import { useApp } from "../context/AppContext";

export default function EquipmentPanel() {
    const {
        designResult,
        selectedEquipment
    } = useApp();

    const feedWater = designResult?.input?.feedWater;
    const engineering = designResult?.engineering;
    const equipmentList = designResult?.equipment || [];

    const format = (value, digits = 2) => {
        if (value === undefined || value === null || isNaN(value)) {
            return "-";
        }
        return Number(value).toFixed(digits);
    };

    if (!designResult || !designResult.engineering) {
        return (
            <div className="panel equipment-panel">
                <h3 className="panel-title">Equipment Properties</h3>
                <p style={{ color: "#6B7280", fontSize: "13px", margin: "8px 0 0 0" }}>Generate a design first.</p>
            </div>
        );
    }

    if (!selectedEquipment) {
        return (
            <div className="panel equipment-panel">
                <h3 className="panel-title" style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>Equipment Properties</h3>
                {equipmentList.length > 0 ? (
                    <div>
                        <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "12px" }}>
                            Click any equipment in the P&amp;ID diagram to inspect detailed engineering properties.
                        </p>
                        <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "#F8FAFC", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
                                    <th style={{ padding: "6px 8px" }}>ID</th>
                                    <th style={{ padding: "6px 8px" }}>Equipment Name</th>
                                    <th style={{ padding: "6px 8px" }}>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipmentList.map(eq => (
                                    <tr key={eq.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                        <td style={{ padding: "6px 8px", fontWeight: "600", color: "#2563EB" }}>{eq.id}</td>
                                        <td style={{ padding: "6px 8px" }}>{eq.name}</td>
                                        <td style={{ padding: "6px 8px", textTransform: "capitalize", color: "#6B7280" }}>{eq.type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ fontSize: "12px", color: "#6B7280" }}>
                        Click any equipment in the P&amp;ID diagram to display its engineering information.
                    </p>
                )}
            </div>
        );
    }

    // Default inspection table driven from selectedEquipment & engineering single source of truth
    return (
        <div className="panel equipment-panel">
            <h3 className="panel-title" style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>{selectedEquipment.name}</h3>

            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <tbody>
                    {Object.entries(selectedEquipment).map(([key, value]) => {
                        if (key === "name") return null;
                        return (
                            <tr key={key} style={{ borderBottom: "1px solid #E2E8F0" }}>
                                <td style={{ padding: "8px 0", color: "#6B7280", fontWeight: "500" }}>
                                    {key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
                                </td>
                                <td style={{ padding: "8px 0", textAlign: "right", fontWeight: "700", color: "#1F2937" }}>
                                    {typeof value === "number" ? format(value) : value}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}