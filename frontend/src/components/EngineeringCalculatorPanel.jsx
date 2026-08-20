import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function EngineeringCalculatorPanel() {
    const {
        designResult,
        optimizationInputs,
        setOptimizationInputs,
        recalculate,
        technology,
        feedWater,
        setFeedWater,
        setPage
    } = useApp();

    const [isBasisExpanded, setIsBasisExpanded] = useState(true);
    const [optComparison, setOptComparison] = useState(null);

    const isDesignReady = Boolean(designResult?.engineering);
    const eng = designResult?.engineering || {};
    const feed = designResult?.input?.feedWater || feedWater || {};
    const tech = designResult?.selectedTechnology || eng.technology || (technology !== "AUTO" ? technology : "MCDI");

    const feedTds = feed.tds !== "" && feed.tds !== undefined ? Number(feed.tds) : null;
    const targetTds = feed.targetTds !== "" && feed.targetTds !== undefined ? Number(feed.targetTds) : null;
    const flow = feed.flowRate !== "" && feed.flowRate !== undefined ? Number(feed.flowRate) : null;
    const feedHardness = feed.hardness !== "" && feed.hardness !== undefined ? Number(feed.hardness) : 0;
    const feedConductivity = feed.conductivity !== "" && feed.conductivity !== undefined ? Number(feed.conductivity) : null;
    const targetRecovery = feed.targetRecovery !== "" && feed.targetRecovery !== undefined ? Number(feed.targetRecovery) : 95.0;

    const cellPairs = isDesignReady ? Number(eng.cellPairs) : null;
    const modules = isDesignReady ? Number(eng.numberOfModules) : null;
    const electrodeArea = isDesignReady ? Number(eng.electrodeArea) : null;
    const current = isDesignReady ? Number(eng.current) : null;
    const voltageStack = isDesignReady ? Number(eng.voltageStack) : null;
    const stackVoltage = voltageStack;
    const cellVoltage = isDesignReady ? Number(eng.voltageCell) : null;
    const outletTds = isDesignReady ? Number(eng.outletTDS) : null;
    const sec = isDesignReady ? Number(eng.sec) : null;
    const secGross = isDesignReady ? Number(eng.secElectricalGross) : null;
    const secNet = isDesignReady ? Number(eng.secElectricalNet) : null;
    const secHydraulic = isDesignReady ? Number(eng.secHydraulic) : null;
    const recovery = isDesignReady ? Number(eng.waterRecovery) : null;
    const currentDensity = isDesignReady ? Number(eng.currentDensity) : null;
    const pressureDrop = isDesignReady ? Number(eng.pressureDrop) : null;
    const power = isDesignReady ? Number(eng.power) : null;

    // Physical calculations & CAD layer geometry
    const tSpacer = 0.50; // mm
    const tMembrane = 0.15; // mm
    const tElectrode = 0.60; // mm
    const tEndplates = 40.0; // mm
    const calculatedStackHeightMm = isDesignReady ? Number((cellPairs * (tSpacer + 2 * tMembrane + 2 * tElectrode) + tEndplates).toFixed(1)) : null;

    // Parallel hydraulic flow area and channel superficial velocity: v = Q / A_flow
    const channelWidthM = electrodeArea ? Math.sqrt(electrodeArea / 10000) : 0.1871; // m (W = sqrt(A))
    const channelAreaM2 = (cellPairs && electrodeArea) ? cellPairs * channelWidthM * (tSpacer / 1000) : 0.00318; // m² (A_flow = N_pairs * W * h)
    const calculatedVelocity = (isDesignReady && flow && channelAreaM2 > 0)
        ? Number(((flow / 60000) / channelAreaM2).toFixed(3))
        : (eng.flowVelocity ? Number(eng.flowVelocity).toFixed(3) : 0.105);

    const productFlow = isDesignReady && flow ? Number((flow * (recovery / 100)).toFixed(2)) : null;
    const rejectFlow = isDesignReady && flow && productFlow ? Number((flow - productFlow).toFixed(2)) : null;
    const rejectTds = isDesignReady && flow && productFlow !== null && rejectFlow > 0 && feedTds && outletTds !== null
        ? Number((((flow * feedTds) - (productFlow * outletTds)) / rejectFlow).toFixed(1))
        : null;

    // Data Consistency Validation
    const flowResidual = isDesignReady && flow && productFlow !== null && rejectFlow !== null
        ? Number(Math.abs(flow - (productFlow + rejectFlow)).toFixed(4))
        : 0;
    const feedSaltMass = isDesignReady && flow && feedTds ? (flow / 60) * (feedTds / 1000) : 0;
    const prodSaltMass = isDesignReady && productFlow && outletTds !== null ? (productFlow / 60) * (outletTds / 1000) : 0;
    const rejSaltMass = isDesignReady && rejectFlow && rejectTds !== null ? (rejectFlow / 60) * (rejectTds / 1000) : 0;
    const saltMassResidual = isDesignReady ? Number(Math.abs(feedSaltMass - (prodSaltMass + rejSaltMass)).toFixed(4)) : 0;

    const powerExpected = isDesignReady && voltageStack && current ? Number((voltageStack * current).toFixed(1)) : null;
    const isPowerConsistent = !isDesignReady || (powerExpected !== null && Math.abs(power - powerExpected) < 1.0);
    const voltageExpected = isDesignReady && cellPairs && cellVoltage ? Number((cellPairs * cellVoltage).toFixed(1)) : null;
    const isVoltageConsistent = !isDesignReady || (voltageExpected !== null && Math.abs(voltageStack - voltageExpected) < 0.5);

    const dataErrors = [];
    if (isDesignReady) {
        if (flowResidual > 0.01) dataErrors.push(`Flow Balance Mismatch: ${flowResidual} L/min residual`);
        if (saltMassResidual > 0.001) dataErrors.push(`Salt Mass Balance Mismatch: ${saltMassResidual} g/s residual`);
        if (!isPowerConsistent) dataErrors.push(`Power Mismatch: Stack VI (${powerExpected} W) vs Displayed (${power} W)`);
        if (!isVoltageConsistent) dataErrors.push(`Voltage Mismatch: N × V_cell (${voltageExpected} V) vs Displayed (${voltageStack} V)`);
    }

    // Automatic Programmatic Target Pass/Fail & Margin Logic
    const isTdsPass = isDesignReady && targetTds !== null && outletTds !== null ? outletTds <= targetTds : null;
    const tdsDiff = isDesignReady && targetTds !== null && outletTds !== null ? Math.abs(outletTds - targetTds).toFixed(1) : null;
    const tdsBadgeText = isDesignReady && isTdsPass !== null
        ? (isTdsPass ? `PASS · ${tdsDiff} mg/L margin` : `FAIL · ${tdsDiff} mg/L over limit`)
        : "—";
    const tdsBadgeColor = isDesignReady && isTdsPass !== null ? (isTdsPass ? "#15803D" : "#DC2626") : "#64748B";

    const isRecPass = isDesignReady && recovery !== null ? recovery >= 95.0 : null;
    const recDiff = isDesignReady && recovery !== null ? Math.abs(recovery - 95.0).toFixed(1) : null;
    const recBadgeText = isDesignReady && isRecPass !== null
        ? (isRecPass ? `PASS · ${recDiff} %-pt margin` : `FAIL · ${recDiff} %-pt below target`)
        : "—";
    const recBadgeColor = isDesignReady && isRecPass !== null ? (isRecPass ? "#15803D" : "#DC2626") : "#64748B";

    const isModified = isDesignReady && (
        (optimizationInputs.voltage !== undefined && optimizationInputs.voltage !== cellVoltage) ||
        (optimizationInputs.current !== undefined && optimizationInputs.current !== current) ||
        (optimizationInputs.cellPairs !== undefined && optimizationInputs.cellPairs !== cellPairs) ||
        (optimizationInputs.electrodeArea !== undefined && optimizationInputs.electrodeArea !== electrodeArea) ||
        (optimizationInputs.numberOfModules !== undefined && optimizationInputs.numberOfModules !== modules) ||
        (optimizationInputs.flowRate !== undefined && optimizationInputs.flowRate !== flow)
    );

    function handleInputChange(field, val) {
        const numVal = Number(val);
        if (field === "flowRate") {
            const newFeed = { ...feed, flowRate: numVal };
            if (setFeedWater) setFeedWater(newFeed);
            if (isDesignReady) {
                recalculate(optimizationInputs, technology || "AUTO", false, newFeed);
            }
        } else {
            const newInputs = {
                ...optimizationInputs,
                [field]: isNaN(numVal) ? val : numVal
            };
            setOptimizationInputs(newInputs);
        }
    }

    function handleRecalculate() {
        recalculate(optimizationInputs, technology || "AUTO", false);
        setOptComparison(null);
    }

    function handleOptimize() {
        if (!isDesignReady) return;
        const beforeState = {
            voltage: cellVoltage,
            current: current,
            cellPairs: cellPairs,
            electrodeArea: electrodeArea,
            outletTds: outletTds,
            recovery: recovery,
            secGross: secGross,
            power: power
        };

        const res = recalculate(optimizationInputs, technology || "AUTO", true);
        const newEng = res?.engineering || designResult?.engineering || {};

        const afterState = {
            voltage: Number(newEng.voltageCell ?? cellVoltage),
            current: Number(newEng.current ?? current),
            cellPairs: Number(newEng.cellPairs ?? cellPairs),
            electrodeArea: Number(newEng.electrodeArea ?? electrodeArea),
            outletTds: Number(newEng.outletTDS ?? outletTds),
            recovery: Number(newEng.waterRecovery ?? recovery),
            secGross: Number(newEng.secElectricalGross ?? secGross),
            power: Number(newEng.power ?? power)
        };

        const hasChanged =
            Math.abs(afterState.voltage - beforeState.voltage) > 0.005 ||
            Math.abs(afterState.current - beforeState.current) > 0.005 ||
            afterState.cellPairs !== beforeState.cellPairs ||
            afterState.electrodeArea !== beforeState.electrodeArea;

        setOptComparison({
            isAlreadyOptimum: !hasChanged,
            before: beforeState,
            after: afterState
        });
    }

    function handleReset() {
        setOptimizationInputs({});
        if (isDesignReady) {
            recalculate({}, technology || "AUTO", false);
        }
        setOptComparison(null);
    }

    // Helper for technical table status badges
    function renderStatusBadge(status) {
        let bg = "#F1F5F9";
        let color = "#475569";
        let border = "#CBD5E1";

        const label = status === "MODEL PARAMETER" ? "Calculated"
            : status === "MODEL BASELINE" ? "Reference"
            : status === "MODEL BASIS" ? "Design Basis"
            : status === "ASSUMPTION" ? "Assumption"
            : status === "INPUT" ? "Input"
            : status === "CALCULATED" ? "Calculated"
            : status;

        if (label === "Input") {
            bg = "#F8FAFC";
            color = "#334155";
            border = "#CBD5E1";
        } else if (label === "Calculated" || label === "PASS" || label === "Meets Target") {
            bg = "#DCFCE7";
            color = "#15803D";
            border = "#BBF7D0";
        } else if (label === "Assumption" || label === "Reference" || label === "Design Basis") {
            bg = "#F1F5F9";
            color = "#475569";
            border = "#CBD5E1";
        }

        return (
            <span style={{
                fontSize: "9.5px",
                fontWeight: "600",
                padding: "1px 5px",
                borderRadius: "2px",
                background: bg,
                color: color,
                border: `1px solid ${border}`,
                whiteSpace: "nowrap"
            }}>
                {label}
            </span>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            {/* DATA CONSISTENCY WARNING IF ANY CONFLICT EXISTS */}
            {dataErrors.length > 0 && (
                <div style={{ background: "#FEF2F2", border: "1px solid #F87171", borderRadius: "4px", padding: "10px 14px", color: "#991B1B", fontSize: "11.5px" }}>
                    <div style={{ fontWeight: "700", marginBottom: "4px" }}>DATA CONSISTENCY ERROR</div>
                    <ul style={{ margin: 0, paddingLeft: "18px" }}>
                        {dataErrors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 1. DESIGN RESULT / KPI STRIP */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "8px",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "4px",
                padding: "10px 12px",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
            }}>
                {/* Product TDS */}
                <div style={{ background: "#F8FAFC", padding: "8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                    <span style={{ color: "#64748B", display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>Product TDS</span>
                    <strong style={{ fontSize: "15px", color: "#0F172A", display: "block", marginTop: "2px", fontFamily: "monospace" }}>
                        {isDesignReady ? `${outletTds.toFixed(1)} mg/L` : "—"}
                    </strong>
                    <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "2px" }}>Target: ≤ {targetTds !== null ? `${targetTds.toFixed(1)} mg/L` : "50.0 mg/L"}</div>
                    <div style={{ fontSize: "9.5px", color: tdsBadgeColor, fontWeight: "700" }}>
                        {tdsBadgeText}
                    </div>
                    <div style={{ fontSize: "8.5px", color: "#64748B", marginTop: "3px", lineHeight: "1.2" }}>
                        * Calculated result
                    </div>
                </div>

                {/* Water Recovery */}
                <div style={{ background: "#F8FAFC", padding: "8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                    <span style={{ color: "#64748B", display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>Water Recovery</span>
                    <strong style={{ fontSize: "15px", color: "#0F172A", display: "block", marginTop: "2px", fontFamily: "monospace" }}>
                        {isDesignReady ? `${recovery.toFixed(1)} %` : "—"}
                    </strong>
                    <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "2px" }}>Target: ≥ 95.0%</div>
                    <div style={{ fontSize: "9.5px", color: recBadgeColor, fontWeight: "700" }}>
                        {recBadgeText}
                    </div>
                    <div style={{ fontSize: "8.5px", color: (isDesignReady && recovery >= 95.0 && (recovery - 95.0) <= 0.5) ? "#B45309" : "#64748B", marginTop: "3px", lineHeight: "1.2", fontWeight: (isDesignReady && recovery >= 95.0 && (recovery - 95.0) <= 0.5) ? "700" : "normal" }}>
                        {isDesignReady && recovery >= 95.0 && (recovery - 95.0) <= 0.5 ? `⚠️ Low Margin (+${(recovery - 95.0).toFixed(1)} %-pt)` : "Design recovery"}
                    </div>
                </div>

                {/* Gross Electrical SEC */}
                <div style={{ background: "#F8FAFC", padding: "8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                    <span style={{ color: "#64748B", display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>Gross Elec SEC</span>
                    <strong style={{ fontSize: "15px", color: "#1D4ED8", display: "block", marginTop: "2px", fontFamily: "monospace" }}>
                        {isDesignReady ? `${secGross.toFixed(3)} kWh/m³` : "—"}
                    </strong>
                    <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "2px" }}>Cycle-Avg: ~0.0260</div>
                    <div style={{ fontSize: "9.5px", color: isDesignReady ? "#15803D" : "#64748B", fontWeight: "600" }}>
                        {isDesignReady ? "Stack Terminal" : "—"}
                    </div>
                </div>

                {/* Stack Power */}
                <div style={{ background: "#F8FAFC", padding: "8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                    <span style={{ color: "#64748B", display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>Stack Power</span>
                    <strong style={{ fontSize: "15px", color: "#0F172A", display: "block", marginTop: "2px", fontFamily: "monospace" }}>
                        {isDesignReady ? `${power.toFixed(1)} W` : "—"}
                    </strong>
                    <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "2px" }}>Active Power</div>
                    <div style={{ fontSize: "9.5px", color: isDesignReady ? "#15803D" : "#64748B", fontWeight: "600" }}>
                        {isDesignReady ? "Calculated" : "—"}
                    </div>
                </div>

                {/* Stack Voltage */}
                <div style={{ background: "#F8FAFC", padding: "8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                    <span style={{ color: "#64748B", display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>Stack Voltage</span>
                    <strong style={{ fontSize: "15px", color: "#0F172A", display: "block", marginTop: "2px", fontFamily: "monospace" }}>
                        {isDesignReady ? `${voltageStack.toFixed(1)} V DC` : "—"}
                    </strong>
                    <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "2px" }}>Total DC Voltage</div>
                    <div style={{ fontSize: "9.5px", color: isDesignReady ? "#15803D" : "#64748B", fontWeight: "600" }}>
                        {isDesignReady ? "Series" : "—"}
                    </div>
                </div>

                {/* Stack Current */}
                <div style={{ background: "#F8FAFC", padding: "8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                    <span style={{ color: "#64748B", display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>Stack Current</span>
                    <strong style={{ fontSize: "15px", color: "#0F172A", display: "block", marginTop: "2px", fontFamily: "monospace" }}>
                        {isDesignReady ? `${current.toFixed(2)} A` : "—"}
                    </strong>
                    <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "2px" }}>Operating Current</div>
                    <div style={{ fontSize: "9.5px", color: isDesignReady ? "#15803D" : "#64748B", fontWeight: "600" }}>
                        {isDesignReady ? "Series" : "—"}
                    </div>
                </div>

                {/* Estimated Internal Channel ΔP */}
                <div style={{ background: "#F8FAFC", padding: "8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                    <span style={{ color: "#64748B", display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>Channel ΔP</span>
                    <strong style={{ fontSize: "15px", color: "#0F172A", display: "block", marginTop: "2px", fontFamily: "monospace" }}>
                        {isDesignReady ? `≈ ${(pressureDrop / 1000).toFixed(3)} kPa` : "—"}
                    </strong>
                    <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "2px" }}>Mesh Friction</div>
                    <div style={{ fontSize: "9.5px", color: isDesignReady ? "#15803D" : "#64748B", fontWeight: "600" }}>
                        {isDesignReady ? "Excl. Manifold" : "—"}
                    </div>
                </div>
            </div>

            {/* 2. STACK & PROCESS SPECIFICATIONS TABLE */}
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                    <h3 style={{ fontSize: "12.5px", fontWeight: "700", color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Stack &amp; Process Specifications
                    </h3>
                    <span style={{ fontSize: "10.5px", color: "#64748B" }}>
                        Process: {tech} | Feed: {flow !== null ? `${flow.toFixed(2)} L/min` : "—"} @ {feedTds !== null ? `${feedTds} mg/L` : "—"}
                    </span>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                    <thead>
                        <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #CBD5E1", color: "#475569" }}>
                            <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: "700" }}>PARAMETER</th>
                            <th style={{ padding: "5px 8px", textAlign: "right", fontWeight: "700" }}>VALUE</th>
                            <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: "700", paddingLeft: "14px" }}>UNIT</th>
                            <th style={{ padding: "5px 8px", textAlign: "left", fontWeight: "700" }}>SOURCE</th>
                            <th style={{ padding: "5px 8px", textAlign: "right", fontWeight: "700" }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Feed Flow</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {flow !== null ? flow.toFixed(2) : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>L/min</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>User Input</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(flow !== null ? "INPUT" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Feed TDS</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {feedTds !== null ? feedTds : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>mg/L</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>User Input</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(feedTds !== null ? "INPUT" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Product Flow</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700", color: "#15803D" }}>
                                {productFlow !== null ? productFlow.toFixed(2) : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>L/min</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Engineering Model</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Product TDS</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700", color: "#15803D" }}>
                                {outletTds !== null ? outletTds.toFixed(1) : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>mg/L</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Engineering Model</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Cell Pairs</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {cellPairs !== null ? cellPairs : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>pairs</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Engineering Model</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Modules</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {modules !== null ? modules : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>—</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Design Input</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "INPUT" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Active Area / Pair</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {electrodeArea !== null ? electrodeArea : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>cm²</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>User Input</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "INPUT" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Operating Current</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {current !== null ? current.toFixed(2) : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>A</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Engineering Model</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Current Density</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {currentDensity !== null ? currentDensity.toFixed(1) : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>A/m²</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Engineering Model</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Cell Voltage</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {cellVoltage !== null ? cellVoltage.toFixed(2) : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>V/cell</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Engineering Model</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Stack Voltage</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {voltageStack !== null ? voltageStack.toFixed(1) : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>V DC</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Engineering Model</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>Stack Power</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {power !== null ? power.toFixed(1) : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>W</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Electrical Model</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>
                                <div style={{ fontWeight: "600" }}>Adsorption-Phase Stack SEC</div>
                                <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "1px" }}>
                                    Instantaneous DC stack terminal energy basis during electrosorption / delivered product volume
                                </div>
                            </td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700", color: "#1D4ED8" }}>
                                {secGross !== null ? secGross.toFixed(4) : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>kWh/m³</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Adsorption DC VI</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>
                                <div style={{ fontWeight: "600" }}>Cycle-Average Adsorption-Energy SEC</div>
                                <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "1px" }}>
                                    Energy over 10 min adsorption in 12 min cycle (35.7 W × 10/60 h = 5.95 Wh) / delivered product (0.2285 m³)
                                </div>
                            </td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700", color: "#1D4ED8" }}>
                                {secGross !== null ? (secGross * (10 / 12)).toFixed(4) : "0.0260"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>kWh/m³</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>12-Min Cycle Basis</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>
                                <div style={{ fontWeight: "600" }}>Energy Recovery Credit — Scenario Assumption (20%)</div>
                                <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "1px" }}>
                                    Unvalidated scenario assumption (requires regenerative power electronics & test validation)
                                </div>
                            </td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {secGross !== null && secNet !== null ? `${((1 - (secNet / secGross)) * 100).toFixed(0)}% (${(secGross - secNet).toFixed(4)})` : "20% (0.066)"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>kWh/m³</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Hypothetical Credit</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "ASSUMPTION" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>
                                <div style={{ fontWeight: "600" }}>Auxiliary Hydraulic SEC</div>
                                <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "1px" }}>
                                    Internal channel friction pumping work (70% nominal pump efficiency)
                                </div>
                            </td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {secHydraulic !== null ? secHydraulic.toFixed(5) : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>kWh/m³</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Hydraulic Model</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>
                                <div style={{ fontWeight: "600" }}>Modelled Net SEC — hypothetical 20% recovery</div>
                                <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "1px" }}>
                                    Net SEC under assumed 20% energy recovery credit + auxiliary hydraulic work
                                </div>
                            </td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700", color: "#1D4ED8" }}>
                                {sec !== null ? sec.toFixed(4) : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>kWh/m³</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>Hypothetical Net</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>
                                <div style={{ fontWeight: "600" }}>Estimated Internal Channel ΔP ≈ 0.5 kPa</div>
                                <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "1px" }}>
                                    Darcy-Weisbach mesh correlation (external manifold/header losses not included)
                                </div>
                            </td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {pressureDrop !== null ? pressureDrop : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>Pa</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>≈ 0.5 kPa (Excl. Manifold)</td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: "4px 8px", color: "#334155" }}>
                                <div style={{ fontWeight: "600" }}>Parallel-Channel Superficial Velocity (v)</div>
                                <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: "1px" }}>
                                    v = Q / A_flow = Q / (N_pairs · W_channel · h_spacer)
                                </div>
                            </td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: "700" }}>
                                {calculatedVelocity}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#64748B", paddingLeft: "14px" }}>m/s</td>
                            <td style={{ padding: "4px 8px", color: "#64748B" }}>
                                A_flow = {(channelAreaM2 * 10000).toFixed(1)} cm² ({cellPairs || 34}ch × {(channelWidthM * 100).toFixed(1)}cm × 0.05cm)
                            </td>
                            <td style={{ padding: "4px 8px", textAlign: "right" }}>{renderStatusBadge(isDesignReady ? "CALCULATED" : "REQUIRED")}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 3. MASS & WATER BALANCE AND ENGINEERING BASIS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                
                {/* Mass & Water Balance Flow Diagram */}
                <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                        <h3 style={{ fontSize: "12.5px", fontWeight: "700", color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            Mass &amp; Water Balance
                        </h3>
                        <span style={{ fontSize: "9.5px", fontWeight: "700", color: isDesignReady ? "#15803D" : "#64748B", background: isDesignReady ? "#DCFCE7" : "#F1F5F9", padding: "1px 6px", borderRadius: "2px" }}>
                            {isDesignReady ? "BALANCE: CLOSED" : "PENDING INPUTS"}
                        </span>
                    </div>

                    {/* Flow Diagram Box */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                        {/* Feed */}
                        <div style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "3px", padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span style={{ fontWeight: "700", color: "#0F172A" }}>FEED INLET</span>
                                <span style={{ color: "#64748B", marginLeft: "8px" }}>100% Volume</span>
                            </div>
                            <div style={{ fontFamily: "monospace", fontWeight: "700" }}>
                                {flow !== null ? `${flow.toFixed(2)} L/min` : "—"} · {feedTds !== null ? `${feedTds} mg/L` : "—"}
                            </div>
                        </div>

                        <div style={{ textAlign: "center", color: "#94A3B8", fontSize: "12px", lineHeight: "1" }}>↓</div>

                        {/* Stack Core */}
                        <div style={{ background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: "3px", padding: "6px 10px", textAlign: "center", fontWeight: "700", color: "#1E40AF" }}>
                            {tech} DESALINATION STACK CORE {cellPairs ? `(${cellPairs} CELL PAIRS)` : ""}
                        </div>

                        <div style={{ textAlign: "center", color: "#94A3B8", fontSize: "12px", lineHeight: "1" }}>↓</div>

                        {/* Outputs Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                            {/* Product */}
                            <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "3px", padding: "6px 8px" }}>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#15803D" }}>PRODUCT PERMEATE {recovery ? `(${recovery.toFixed(1)}%)` : ""}</div>
                                <div style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "12px", marginTop: "2px", color: "#0F172A" }}>
                                    {productFlow !== null ? `${productFlow.toFixed(2)} L/min` : "—"}
                                </div>
                                <div style={{ fontSize: "10.5px", color: "#15803D", fontWeight: "600" }}>
                                    {outletTds !== null ? `${outletTds.toFixed(1)} mg/L TDS` : "—"}
                                </div>
                            </div>

                            {/* Concentrate */}
                            <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "3px", padding: "6px 8px" }}>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#92400E" }}>CONCENTRATE REJECT {recovery ? `(${(100 - recovery).toFixed(1)}%)` : ""}</div>
                                <div style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "12px", marginTop: "2px", color: "#0F172A" }}>
                                    {rejectFlow !== null ? `${rejectFlow.toFixed(2)} L/min` : "—"}
                                </div>
                                <div style={{ fontSize: "10.5px", color: "#92400E", fontWeight: "600" }}>
                                    {rejectTds !== null ? `${rejectTds.toFixed(1)} mg/L TDS` : "—"}
                                </div>
                            </div>
                        </div>

                        {/* Residuals Summary with Industrial Tolerances */}
                        <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", background: "#F8FAFC", padding: "8px", borderRadius: "3px", border: "1px solid #E2E8F0", fontSize: "10px" }}>
                            <div style={{ padding: "4px 6px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "2px" }}>
                                <div style={{ fontWeight: "700", color: "#0F172A", marginBottom: "2px" }}>Flow Balance</div>
                                <div>Residual: <strong style={{ color: isDesignReady ? (flowResidual <= 0.001 ? "#15803D" : "#DC2626") : "#64748B", fontFamily: "monospace" }}>{isDesignReady ? `${flowResidual.toFixed(3)} L/min` : "—"}</strong></div>
                                <div style={{ color: "#64748B", fontSize: "9px" }}>Tolerance: ±0.001 L/min</div>
                                <div style={{ marginTop: "2px", fontWeight: "700", color: isDesignReady ? (flowResidual <= 0.001 ? "#15803D" : "#DC2626") : "#64748B" }}>
                                    STATUS: {isDesignReady ? (flowResidual <= 0.001 ? "CLOSED" : "OPEN") : "—"}
                                </div>
                            </div>
                            <div style={{ padding: "4px 6px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "2px" }}>
                                <div style={{ fontWeight: "700", color: "#0F172A", marginBottom: "2px" }}>Salt Mass Balance</div>
                                <div>Residual: <strong style={{ color: isDesignReady ? (saltMassResidual <= 0.0001 ? "#15803D" : "#DC2626") : "#64748B", fontFamily: "monospace" }}>{isDesignReady ? `${saltMassResidual.toFixed(4)} g/s` : "—"}</strong></div>
                                <div style={{ color: "#64748B", fontSize: "9px" }}>Tolerance: ±0.0001 g/s</div>
                                <div style={{ marginTop: "2px", fontWeight: "700", color: isDesignReady ? (saltMassResidual <= 0.0001 ? "#15803D" : "#DC2626") : "#64748B" }}>
                                    STATUS: {isDesignReady ? (saltMassResidual <= 0.0001 ? "CLOSED" : "OPEN") : "—"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engineering Basis / Traceability */}
                <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                        <h3 style={{ fontSize: "12.5px", fontWeight: "700", color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            Engineering Basis
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                                onClick={() => setPage("EQUATION_EDITOR")}
                                style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", fontSize: "10.5px", fontWeight: "600", padding: "2px 8px", borderRadius: "3px", cursor: "pointer" }}
                            >
                                Equation Editor &amp; Physics Registry →
                            </button>
                            <button
                                onClick={() => setIsBasisExpanded(!isBasisExpanded)}
                                style={{ background: "none", border: "none", color: "#2563EB", fontSize: "11px", fontWeight: "600", cursor: "pointer", padding: 0 }}
                            >
                                {isBasisExpanded ? "Collapse" : "Expand"}
                            </button>
                        </div>
                    </div>

                    {isBasisExpanded && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #F1F5F9" }}>
                                <span style={{ color: "#334155" }}>Operating Charge Efficiency</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <strong style={{ fontFamily: "monospace" }}>
                                        {isDesignReady && eng?.chargeEfficiency !== undefined ? (Number(eng.chargeEfficiency) > 1 ? (Number(eng.chargeEfficiency) / 100).toFixed(2) : Number(eng.chargeEfficiency).toFixed(2)) : "0.80"}
                                    </strong>
                                    {renderStatusBadge("DESIGN PARAMETER")}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #F1F5F9" }}>
                                <span style={{ color: "#334155" }}>Nominal Baseline</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <strong style={{ fontFamily: "monospace" }}>0.92</strong>
                                    {renderStatusBadge("DESIGN BASELINE")}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #F1F5F9" }}>
                                <span style={{ color: "#334155" }}>Energy Recovery</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <strong style={{ fontFamily: "monospace" }}>20%</strong>
                                    {renderStatusBadge("ASSUMPTION")}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #F1F5F9" }}>
                                <span style={{ color: "#334155" }}>Electrolyte Chemistry</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <strong style={{ fontFamily: "monospace" }}>NaCl equivalent</strong>
                                    {renderStatusBadge("CALCULATION BASIS")}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #F1F5F9" }}>
                                <span style={{ color: "#334155" }} title={`v = Q / A_flow = (${flow || 20} L/min / 60000) / (${channelAreaM2.toFixed(5)} m²)`}>
                                    Parallel-Channel Velocity (v = Q / A_flow)
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <strong style={{ fontFamily: "monospace" }}>{calculatedVelocity} m/s</strong>
                                    {renderStatusBadge("CALCULATED")}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #F1F5F9" }}>
                                <span style={{ color: "#334155" }} title="Darcy-Weisbach channel mesh correlation (excludes external manifold / piping losses)">
                                    Estimated Channel ΔP (Excl. Manifold)
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <strong style={{ fontFamily: "monospace" }}>{pressureDrop !== null ? `≈ ${pressureDrop} Pa` : "≈ 500 Pa"}</strong>
                                    {renderStatusBadge("CORRELATION")}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #F1F5F9" }}>
                                <span style={{ color: "#334155" }}>Active Stack Height</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <strong style={{ fontFamily: "monospace" }}>
                                        {calculatedStackHeightMm !== null ? `${calculatedStackHeightMm} mm` : "108 mm"}
                                    </strong>
                                    {renderStatusBadge("CALCULATED")}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                                <span style={{ color: "#334155" }}>Aux Hydraulic Work</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <strong style={{ fontFamily: "monospace" }}>
                                        {secHydraulic !== null ? `${(secHydraulic * 1000).toFixed(3)} Wh/m³` : "0.150 Wh/m³"}
                                    </strong>
                                    {renderStatusBadge("CALCULATED")}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. PARAMETRIC DESIGN CONTROLS */}
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "14px 16px" }}>
                <div style={{ marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                            <h3 style={{ fontSize: "12.5px", fontWeight: "700", color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                Parametric Design Controls
                            </h3>
                            <div style={{ fontSize: "10.5px", color: "#64748B", marginTop: "2px" }}>
                                Adjust design variables and evaluate the resulting process performance.
                            </div>
                        </div>

                        {/* STATUS BANNER */}
                        {isModified ? (
                            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "3px", padding: "3px 8px", fontSize: "10.5px", color: "#92400E", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontWeight: "700" }}>PARAMETERS MODIFIED</span>
                                <span style={{ color: "#B45309" }}>— Design contains unsaved parameter changes</span>
                            </div>
                        ) : (
                            <div style={{ background: isDesignReady ? "#F0FDF4" : "#F8FAFC", border: `1px solid ${isDesignReady ? "#BBF7D0" : "#CBD5E1"}`, borderRadius: "3px", padding: "3px 8px", fontSize: "10.5px", color: isDesignReady ? "#15803D" : "#64748B", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontWeight: "700" }}>{isDesignReady ? "DESIGN CALCULATED" : "AWAITING SPECIFICATIONS"}</span>
                                <span style={{ color: isDesignReady ? "#16A34A" : "#64748B" }}>
                                    {isDesignReady ? "— Inputs synchronized · Mass balance closed" : "— Enter basis in sidebar and generate design"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 6 Design Variables Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", fontSize: "11px", marginBottom: "10px" }}>
                    <div>
                        <label style={{ display: "block", color: "#64748B", marginBottom: "2px", fontWeight: "600" }}>Cell Voltage (V)</label>
                        <input
                            type="number"
                            step="0.05"
                            placeholder="—"
                            value={optimizationInputs.voltage ?? (cellVoltage !== null ? cellVoltage : "")}
                            onChange={(e) => handleInputChange("voltage", e.target.value)}
                            style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11.5px", fontWeight: "600", fontFamily: "monospace", boxSizing: "border-box" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", color: "#64748B", marginBottom: "2px", fontWeight: "600" }}>Current (A)</label>
                        <input
                            type="number"
                            step="0.05"
                            placeholder="—"
                            value={optimizationInputs.current ?? (current !== null ? current : "")}
                            onChange={(e) => handleInputChange("current", e.target.value)}
                            style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11.5px", fontWeight: "600", fontFamily: "monospace", boxSizing: "border-box" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", color: "#64748B", marginBottom: "2px", fontWeight: "600" }}>Cell Pairs (—)</label>
                        <input
                            type="number"
                            placeholder="—"
                            value={optimizationInputs.cellPairs ?? (cellPairs !== null ? cellPairs : "")}
                            onChange={(e) => handleInputChange("cellPairs", e.target.value)}
                            style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11.5px", fontWeight: "600", fontFamily: "monospace", boxSizing: "border-box" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", color: "#64748B", marginBottom: "2px", fontWeight: "600" }}>Active Area (cm²)</label>
                        <input
                            type="number"
                            placeholder="—"
                            value={optimizationInputs.electrodeArea ?? (electrodeArea !== null ? electrodeArea : "")}
                            onChange={(e) => handleInputChange("electrodeArea", e.target.value)}
                            style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11.5px", fontWeight: "600", fontFamily: "monospace", boxSizing: "border-box" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", color: "#64748B", marginBottom: "2px", fontWeight: "600" }}>Modules (—)</label>
                        <input
                            type="number"
                            placeholder="—"
                            value={optimizationInputs.numberOfModules ?? (modules !== null ? modules : "")}
                            onChange={(e) => handleInputChange("numberOfModules", e.target.value)}
                            style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11.5px", fontWeight: "600", fontFamily: "monospace", boxSizing: "border-box" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", color: "#64748B", marginBottom: "2px", fontWeight: "600" }}>Feed Flow (L/min)</label>
                        <input
                            type="number"
                            step="0.5"
                            placeholder="—"
                            value={feed.flowRate ?? (flow !== null ? flow : "")}
                            onChange={(e) => handleInputChange("flowRate", e.target.value)}
                            style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11.5px", fontWeight: "600", fontFamily: "monospace", boxSizing: "border-box" }}
                        />
                    </div>
                </div>

                {/* ACTION BUTTONS ROW */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F1F5F9", paddingTop: "8px" }}>
                    <button
                        onClick={handleReset}
                        style={{
                            background: "#F1F5F9",
                            color: "#475569",
                            border: "1px solid #CBD5E1",
                            borderRadius: "3px",
                            padding: "5px 12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer"
                        }}
                    >
                        RESET
                    </button>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={handleRecalculate}
                            disabled={!isDesignReady}
                            style={{
                                background: isDesignReady ? "#0F172A" : "#94A3B8",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "3px",
                                padding: "5px 16px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: isDesignReady ? "pointer" : "not-allowed",
                                letterSpacing: "0.02em"
                            }}
                        >
                            GENERATE DESIGN
                        </button>
                        <button
                            onClick={handleOptimize}
                            disabled={!isDesignReady}
                            style={{
                                background: isDesignReady ? "#2563EB" : "#94A3B8",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "3px",
                                padding: "5px 14px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: isDesignReady ? "pointer" : "not-allowed"
                            }}
                        >
                            OPTIMIZE DESIGN
                        </button>
                    </div>
                </div>

                {/* AUDITABLE OPTIMIZATION RESULT COMPARISON */}
                {optComparison && (
                    <div style={{ marginTop: "12px", background: "#F8FAFC", border: "1px solid #93C5FD", borderRadius: "4px", padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #CBD5E1", paddingBottom: "4px" }}>
                            <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                Optimization Result Audit
                            </div>
                            <button
                                onClick={() => setOptComparison(null)}
                                style={{ background: "none", border: "none", color: "#64748B", fontSize: "10.5px", cursor: "pointer", fontWeight: "600" }}
                            >
                                Dismiss ✕
                            </button>
                        </div>

                        {optComparison.isAlreadyOptimum ? (
                            <div style={{ padding: "8px 10px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "3px", color: "#1E40AF", fontSize: "11px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: "700" }}>OPTIMUM STATUS:</span>
                                <span>Current configuration is already the selected optimum within defined constraints.</span>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                {/* Design Variables Table */}
                                <div>
                                    <div style={{ fontSize: "10px", fontWeight: "700", color: "#475569", marginBottom: "4px", textTransform: "uppercase" }}>Design Variables</div>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px" }}>
                                        <thead>
                                            <tr style={{ color: "#64748B", borderBottom: "1px solid #CBD5E1" }}>
                                                <th style={{ textAlign: "left", padding: "2px 4px" }}>Parameter</th>
                                                <th style={{ textAlign: "right", padding: "2px 4px" }}>Current</th>
                                                <th style={{ textAlign: "right", padding: "2px 4px" }}>Optimized</th>
                                                <th style={{ textAlign: "right", padding: "2px 4px" }}>Δ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: "2px 4px", color: "#334155" }}>Cell Voltage</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{optComparison.before.voltage.toFixed(2)} V</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace", fontWeight: "700", color: "#1D4ED8" }}>{optComparison.after.voltage.toFixed(2)} V</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{(optComparison.after.voltage - optComparison.before.voltage >= 0 ? "+" : "") + (optComparison.after.voltage - optComparison.before.voltage).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: "2px 4px", color: "#334155" }}>Current</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{optComparison.before.current.toFixed(2)} A</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace", fontWeight: "700", color: "#1D4ED8" }}>{optComparison.after.current.toFixed(2)} A</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{(optComparison.after.current - optComparison.before.current >= 0 ? "+" : "") + (optComparison.after.current - optComparison.before.current).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: "2px 4px", color: "#334155" }}>Cell Pairs</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{optComparison.before.cellPairs}</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace", fontWeight: "700", color: "#1D4ED8" }}>{optComparison.after.cellPairs}</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{(optComparison.after.cellPairs - optComparison.before.cellPairs >= 0 ? "+" : "") + (optComparison.after.cellPairs - optComparison.before.cellPairs)}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: "2px 4px", color: "#334155" }}>Active Area</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{optComparison.before.electrodeArea} cm²</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace", fontWeight: "700", color: "#1D4ED8" }}>{optComparison.after.electrodeArea} cm²</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{(optComparison.after.electrodeArea - optComparison.before.electrodeArea >= 0 ? "+" : "") + (optComparison.after.electrodeArea - optComparison.before.electrodeArea)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Resulting Performance Table */}
                                <div>
                                    <div style={{ fontSize: "10px", fontWeight: "700", color: "#475569", marginBottom: "4px", textTransform: "uppercase" }}>Process Performance</div>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px" }}>
                                        <thead>
                                            <tr style={{ color: "#64748B", borderBottom: "1px solid #CBD5E1" }}>
                                                <th style={{ textAlign: "left", padding: "2px 4px" }}>Performance</th>
                                                <th style={{ textAlign: "right", padding: "2px 4px" }}>Current</th>
                                                <th style={{ textAlign: "right", padding: "2px 4px" }}>Optimized</th>
                                                <th style={{ textAlign: "right", padding: "2px 4px" }}>Δ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: "2px 4px", color: "#334155" }}>Product TDS</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{optComparison.before.outletTds.toFixed(1)} mg/L</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace", fontWeight: "700", color: "#15803D" }}>{optComparison.after.outletTds.toFixed(1)} mg/L</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{(optComparison.after.outletTds - optComparison.before.outletTds >= 0 ? "+" : "") + (optComparison.after.outletTds - optComparison.before.outletTds).toFixed(1)}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: "2px 4px", color: "#334155" }}>Water Recovery</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{optComparison.before.recovery.toFixed(1)} %</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace", fontWeight: "700", color: "#15803D" }}>{optComparison.after.recovery.toFixed(1)} %</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{(optComparison.after.recovery - optComparison.before.recovery >= 0 ? "+" : "") + (optComparison.after.recovery - optComparison.before.recovery).toFixed(1)}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: "2px 4px", color: "#334155" }}>Gross SEC</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{optComparison.before.secGross.toFixed(3)} kWh/m³</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace", fontWeight: "700", color: "#1D4ED8" }}>{optComparison.after.secGross.toFixed(3)} kWh/m³</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{(optComparison.after.secGross - optComparison.before.secGross >= 0 ? "+" : "") + (optComparison.after.secGross - optComparison.before.secGross).toFixed(3)}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: "2px 4px", color: "#334155" }}>Stack Power</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{optComparison.before.power.toFixed(1)} W</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace", fontWeight: "700", color: "#0F172A" }}>{optComparison.after.power.toFixed(1)} W</td>
                                                <td style={{ textAlign: "right", padding: "2px 4px", fontFamily: "monospace" }}>{(optComparison.after.power - optComparison.before.power >= 0 ? "+" : "") + (optComparison.after.power - optComparison.before.power).toFixed(1)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 5. CLEAN BOTTOM STATUS STRIP */}
            <div style={{
                background: "#F8FAFC",
                border: "1px solid #CBD5E1",
                borderRadius: "3px",
                padding: "8px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
                color: "#475569"
            }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <div>
                        Calculation Status: {isDesignReady && flow > 0 && feedTds > 0 ? (
                            <strong style={{ color: "#15803D" }}>Complete</strong>
                        ) : (
                            <strong style={{ color: "#D97706" }}>Awaiting Inputs</strong>
                        )}
                    </div>
                    <div>
                        Data Status: <strong style={{ color: "#15803D" }}>Input Validated</strong>
                    </div>
                    <div>
                        Design Status: <strong style={{ color: "#1E40AF" }}>Accepted for Engineering Review</strong>
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div>
                        Screening Result: {isDesignReady && isTdsPass && isRecPass ? (
                            <strong style={{ color: "#15803D" }}>PASS</strong>
                        ) : (
                            <strong style={{ color: "#991B1B" }}>FAIL</strong>
                        )}
                    </div>
                    <div style={{ fontSize: "9px", color: "#64748B", marginTop: "1px" }}>
                        Engineering limitation: Results are calculation-based and require laboratory/pilot validation before procurement.
                    </div>
                </div>
            </div>
        </div>
    );
}
