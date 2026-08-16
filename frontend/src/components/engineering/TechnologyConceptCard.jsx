import React from "react";
import { TECHNOLOGY_FUNDAMENTALS } from "@shared/engineering/core/technologyFundamentals.js";

/**
 * TechnologyConceptCard Component
 * Displays the 10 literature-backed concept dimensions for CDI, MCDI, FCDI, and EDI:
 * 1. Structure
 * 2. Flow Direction
 * 3. Ion Movement
 * 4. Electrical Polarity
 * 5. Desalination Mechanism
 * 6. Regeneration Mechanism
 * 7. Operation Type (Continuous vs Cyclic)
 * 8. Advantages
 * 9. Limitations
 * 10. Pretreatment Requirements
 */
export default function TechnologyConceptCard({ technology = "MCDI" }) {
    const techKey = (technology && TECHNOLOGY_FUNDAMENTALS[technology]) ? technology : "MCDI";
    const fund = TECHNOLOGY_FUNDAMENTALS[techKey] || TECHNOLOGY_FUNDAMENTALS.MCDI;

    const isContinuous = fund.operationType?.toLowerCase().includes("continuous");

    const dimensions = [
        {
            num: "1",
            title: "Structure & Electrodes",
            value: fund.electrodeConfiguration,
            sub: `Membranes: ${fund.membraneConfiguration}`
        },
        {
            num: "2",
            title: "Flow Paths & Manifold",
            value: fund.feedWaterFlowDirection,
            sub: `Product: ${fund.productWaterFlowPath} | Reject: ${fund.concentrateRejectFlowPath}`
        },
        {
            num: "3",
            title: "Ion Movement",
            value: fund.ionTransportDirection,
            sub: "Electrostatic attraction vs Electromigration through membranes"
        },
        {
            num: "4",
            title: "Electrical Polarity Field",
            value: fund.electricalPolarity,
            sub: "DC electric field potential & desorption switching"
        },
        {
            num: "5",
            title: "Desalination Mechanism",
            value: fund.desalinationMechanism,
            sub: "Electrosorption into pore EDLs vs Resin exchange"
        },
        {
            num: "6",
            title: "Regeneration Mechanism",
            value: fund.regenerationMechanism,
            sub: "Short-circuit desorption vs External uncharging vs H+/OH- water splitting"
        },
        {
            num: "7",
            title: "Operation Type",
            value: fund.operationType,
            sub: isContinuous ? "Continuous non-stop water production" : "Alternating adsorption and desorption cycles"
        },
        {
            num: "8",
            title: "Pretreatment Requirements",
            value: fund.pretreatmentRequirements,
            sub: `Operating Envelope: ${fund.operatingEnvelope}`
        }
    ];

    return (
        <div style={{
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: "8px",
            padding: "14px",
            marginBottom: "12px"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #E2E8F0", pb: "8px" }}>
                <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
                        Technology Concept &amp; Fundamental Topology: {fund.name}
                    </h4>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                        Literature Source: {fund.literatureRange?.source} | Pedigree: [{fund.pedigree}]
                    </span>
                </div>
                <span style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: isContinuous ? "#DCFCE7" : "#FEF3C7",
                    color: isContinuous ? "#166534" : "#B45309"
                }}>
                    {isContinuous ? "CONTINUOUS OPERATION" : "CYCLIC BATCH OPERATION"}
                </span>
            </div>

            {/* 10 DIMENSIONS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                {dimensions.map((d) => (
                    <div key={d.num} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "8px 10px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#2563EB", marginBottom: "2px" }}>
                            {d.num}. {d.title}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#1E293B", lineHeight: "1.35", fontWeight: "500" }}>
                            {d.value}
                        </div>
                        <div style={{ fontSize: "10.5px", color: "#64748B", marginTop: "3px" }}>
                            {d.sub}
                        </div>
                    </div>
                ))}
            </div>

            {/* ADVANTAGES & LIMITATIONS COMPARISON */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", borderTop: "1px dashed #E2E8F0", paddingTop: "10px" }}>
                <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "6px", padding: "8px 10px" }}>
                    <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#166534", marginBottom: "4px" }}>
                        Key Technical Advantages
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "#14532D" }}>
                        {fund?.advantages?.map((adv, idx) => (
                            <li key={idx} style={{ marginBottom: "2px" }}>{adv}</li>
                        ))}
                    </ul>
                </div>
                <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "6px", padding: "8px 10px" }}>
                    <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#92400E", marginBottom: "4px" }}>
                        Engineering Limitations &amp; Risks
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "#78350F" }}>
                        {fund?.limitations?.map((lim, idx) => (
                            <li key={idx} style={{ marginBottom: "2px" }}>{lim}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
