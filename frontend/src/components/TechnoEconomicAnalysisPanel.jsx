import React from "react";
import { useApp } from "../context/AppContext";
import { validateEconomicInputs, DEFAULT_TEA_INPUTS } from "@shared/engineering/tea/technoEconomicEngine.js";

/**
 * Format currency in Indian Rupees format (e.g. ₹ 1,20,000)
 */
function formatInr(val, decimals = 0) {
    if (val === null || val === undefined || isNaN(Number(val))) return "₹ —";
    const num = Number(val);
    return `₹ ${num.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })}`;
}

/**
 * Format generic numbers with decimal places
 */
function formatNum(val, decimals = 2) {
    if (val === null || val === undefined || isNaN(Number(val))) return "—";
    return Number(val).toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

export default function TechnoEconomicAnalysisPanel() {
    const { designResult, teaInputs, setTeaInputs, resetTeaInputs, setPage } = useApp();

    if (!designResult || !designResult.engineering) {
        return null;
    }

    const engineering = designResult.engineering;
    const tea = designResult.tea || {};
    const validation = tea.validation || validateEconomicInputs(teaInputs || {});
    const isReady = validation.isValid;

    const handleInputChange = (field, rawVal) => {
        // Prevent negative values if typed
        if (rawVal !== "" && Number(rawVal) < 0) return;
        setTeaInputs(prev => ({
            ...prev,
            [field]: rawVal === "" ? "" : Number(rawVal)
        }));
    };

    return (
        <section
            id="techno-economic-analysis-section"
            className="tea-panel"
            style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "16px 18px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}
        >
            {/* 1. INDUSTRIAL HEADER & STATUS IDENTITY */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h2 style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            TECHNO-ECONOMIC ANALYSIS (TEA)
                        </h2>
                        <span style={{
                            fontSize: "10px",
                            fontWeight: "800",
                            padding: "2px 8px",
                            borderRadius: "3px",
                            background: isReady ? "#DCFCE7" : "#FEF3C7",
                            color: isReady ? "#15803D" : "#92400E",
                            border: `1px solid ${isReady ? "#BBF7D0" : "#FDE68A"}`
                        }}>
                            {validation.status}
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                        onClick={() => setPage("EQUATION_EDITOR")}
                        title="Open central Equation Editor to inspect and calibrate TEA governing equations"
                        style={{
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            border: "1px solid #BFDBFE",
                            padding: "5px 12px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        EQUATION EDITOR →
                    </button>

                    <button
                        onClick={resetTeaInputs}
                        title="Reset economic parameters to default industrial benchmark assumptions"
                        style={{
                            background: "#F8FAFC",
                            color: "#475569",
                            border: "1px solid #CBD5E1",
                            padding: "5px 12px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        RESET DEFAULTS
                    </button>
                </div>
            </div>


            {/* VALIDATION WARNING BANNER IF INCOMPLETE */}
            {!isReady && validation.errors.length > 0 && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "4px", padding: "8px 12px", color: "#991B1B", fontSize: "11px" }}>
                    <strong style={{ display: "block", marginBottom: "3px" }}>⚠ Required Economic Inputs Incomplete:</strong>
                    <ul style={{ margin: 0, paddingLeft: "18px" }}>
                        {validation.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 2. TECHNO-ECONOMIC SUMMARY CARD (LIGHT THEME) */}
            <div style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "14px 18px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "8px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            TECHNO-ECONOMIC SUMMARY
                        </span>
                        <span style={{ fontSize: "9.5px", fontWeight: "700", color: "#0D9488", background: "#CCFBF1", border: "1px solid #99F6E4", padding: "1px 6px", borderRadius: "3px" }}>
                            KEY FINANCIAL METRICS
                        </span>
                    </div>
                    <span style={{ fontSize: "10.5px", color: "#64748B" }}>
                        Technology: <strong style={{ color: "#2563EB" }}>{engineering.technology}</strong> | Product Flow: <strong style={{ color: "#0F172A" }}>{Number(tea.engineeringBasis?.productFlowLmin ?? 0).toFixed(2)} L/min</strong>
                    </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", textAlign: "left" }}>
                    {/* Total CAPEX */}
                    <div style={{ background: "#F8FAFC", padding: "10px 12px", borderRadius: "4px", border: "1px solid #E2E8F0" }}>
                        <span style={{ fontSize: "9.5px", color: "#64748B", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                            Total CAPEX
                        </span>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A", fontFamily: "monospace" }}>
                            {formatInr(tea.capexInr)}
                        </div>
                        <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", marginTop: "3px" }}>
                            6 Capital Components
                        </span>
                    </div>

                    {/* Annual OPEX */}
                    <div style={{ background: "#FFFBEB", padding: "10px 12px", borderRadius: "4px", border: "1px solid #FDE68A" }}>
                        <span style={{ fontSize: "9.5px", color: "#92400E", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                            Annual OPEX
                        </span>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#B45309", fontFamily: "monospace" }}>
                            {formatInr(tea.annualOpexInr)}
                        </div>
                        <span style={{ fontSize: "9.5px", color: "#A16207", display: "block", marginTop: "3px" }}>
                            per year · Sum of Operational Expenses
                        </span>
                    </div>

                    {/* Energy Cost */}
                    <div style={{ background: "#EFF6FF", padding: "10px 12px", borderRadius: "4px", border: "1px solid #BFDBFE" }}>
                        <span style={{ fontSize: "9.5px", color: "#1E40AF", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                            Energy Cost
                        </span>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#2563EB", fontFamily: "monospace" }}>
                            {formatInr(tea.annualEnergyCostInr)}
                        </div>
                        <span style={{ fontSize: "9.5px", color: "#3B82F6", display: "block", marginTop: "3px" }}>
                            per year @ {teaInputs?.electricityTariff} ₹/kWh
                        </span>
                    </div>

                    {/* Operating Treatment Cost */}
                    <div style={{ background: "#F0FDF4", padding: "10px 12px", borderRadius: "4px", border: "1px solid #86EFAC" }}>
                        <span style={{ fontSize: "9.5px", color: "#166534", fontWeight: "800", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                            Operating Treatment Cost
                        </span>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#15803D", fontFamily: "monospace" }}>
                            {formatInr(tea.operatingTreatmentCostInrPerM3, 2)} / m³
                        </div>
                        <span style={{ fontSize: "9.5px", color: "#16A34A", display: "block", marginTop: "3px" }}>
                            Annual Operational Treatment Cost per m³
                        </span>
                    </div>

                    {/* Annual Product Water */}
                    <div style={{ background: "#F0FDFA", padding: "10px 12px", borderRadius: "4px", border: "1px solid #99F6E4" }}>
                        <span style={{ fontSize: "9.5px", color: "#0F766E", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                            Annual Product Water
                        </span>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#0D9488", fontFamily: "monospace" }}>
                            {formatNum(tea.annualProductWaterM3, 1)} m³
                        </div>
                        <span style={{ fontSize: "9.5px", color: "#0F766E", display: "block", marginTop: "3px" }}>
                            {formatNum(tea.engineeringBasis?.productFlowM3h ?? ((tea.engineeringBasis?.productFlowLmin || 0) * 0.06), 3)} m³/h × {Number(teaInputs?.operatingHoursPerDay || 24) * Number(teaInputs?.operatingDaysPerYear || 350)} h/yr
                        </span>
                    </div>
                </div>
            </div>


            {/* 3. TWO-COLUMN LAYOUT: ECONOMIC INPUTS + AUTHORITATIVE PIPELINE COUPLING */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "14px" }}>
                
                {/* ECONOMIC INPUTS PANEL */}
                <div style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            ECONOMIC INPUTS &amp; COMMERCIAL PARAMETERS
                        </span>
                        <span style={{ fontSize: "10px", color: "#64748B" }}>
                            User-editable • Non-negative values
                        </span>
                    </div>

                    {/* A. Operational Parameters */}
                    <div>
                        <span style={{ fontSize: "10px", fontWeight: "700", color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                            A. Operational Assumptions
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#475569", fontWeight: "600", marginBottom: "2px" }} title="Industrial electricity tariff rate in Indian Rupees per kilowatt-hour">
                                    Electricity Tariff (₹/kWh) ℹ️
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.5"
                                    value={teaInputs.electricityTariff}
                                    onChange={(e) => handleInputChange("electricityTariff", e.target.value)}
                                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#475569", fontWeight: "600", marginBottom: "2px" }} title="Daily operating operating duration (maximum 24 h/day)">
                                    Operating Hours (h/day) ℹ️
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="24"
                                    step="1"
                                    value={teaInputs.operatingHoursPerDay}
                                    onChange={(e) => handleInputChange("operatingHoursPerDay", e.target.value)}
                                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#475569", fontWeight: "600", marginBottom: "2px" }} title="Annual operating days per calendar year (typically 330-365 days)">
                                    Operating Days (days/yr) ℹ️
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    step="1"
                                    value={teaInputs.operatingDaysPerYear}
                                    onChange={(e) => handleInputChange("operatingDaysPerYear", e.target.value)}
                                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* B. CAPEX Components */}
                    <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                            <span style={{ fontSize: "10px", fontWeight: "700", color: "#334155", textTransform: "uppercase" }}>
                                B. Capital Expenditures (CAPEX)
                            </span>
                            <span style={{ fontSize: "10.5px", fontWeight: "800", color: "#0F172A", fontFamily: "monospace" }}>
                                Sum: {formatInr(tea.capexInr)}
                            </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#475569", fontWeight: "600", marginBottom: "2px" }} title="Structural base skid, process piping, manifold, and automation valves">
                                    Equipment Cost (₹) ℹ️
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={teaInputs.equipmentCost}
                                    onChange={(e) => handleInputChange("equipmentCost", e.target.value)}
                                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#475569", fontWeight: "600", marginBottom: "2px" }} title="Core electrochemical desalination stack enclosure and current collectors">
                                    Stack Cost (₹) ℹ️
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={teaInputs.stackCost}
                                    onChange={(e) => handleInputChange("stackCost", e.target.value)}
                                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#475569", fontWeight: "600", marginBottom: "2px" }} title="Feed, booster, and concentrate recirculation pumps">
                                    Pump Cost (₹) ℹ️
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={teaInputs.pumpCost}
                                    onChange={(e) => handleInputChange("pumpCost", e.target.value)}
                                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#475569", fontWeight: "600", marginBottom: "2px" }} title="Programmable DC power supply / rectifier and electrical protection">
                                    Power Supply (₹) ℹ️
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={teaInputs.powerSupplyCost}
                                    onChange={(e) => handleInputChange("powerSupplyCost", e.target.value)}
                                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#475569", fontWeight: "600", marginBottom: "2px" }} title="Ion-exchange membrane sheets and porous carbon electrode initial charge">
                                    Membrane/Electrode (₹) ℹ️
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={teaInputs.membraneElectrodeCost}
                                    onChange={(e) => handleInputChange("membraneElectrodeCost", e.target.value)}
                                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#475569", fontWeight: "600", marginBottom: "2px" }} title="On-site mechanical civil, electrical installation, and commissioning">
                                    Installation Cost (₹) ℹ️
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={teaInputs.installationCost}
                                    onChange={(e) => handleInputChange("installationCost", e.target.value)}
                                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* C. OPEX Maintenance & Replacement */}
                    <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "8px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "700", color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                            C. Annual Fixed OPEX Components
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#475569", fontWeight: "600", marginBottom: "2px" }} title="Routine annual mechanical, pump seal, and sensor calibration maintenance">
                                    Annual Maintenance Cost (₹/year) ℹ️
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={teaInputs.annualMaintenanceCost}
                                    onChange={(e) => handleInputChange("annualMaintenanceCost", e.target.value)}
                                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "10px", color: "#475569", fontWeight: "600", marginBottom: "2px" }} title="Annual consumable replacement and amortized membrane/electrode periodic changeout">
                                    Annual Replacement Cost (₹/year) ℹ️
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={teaInputs.annualReplacementCost}
                                    onChange={(e) => handleInputChange("annualReplacementCost", e.target.value)}
                                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* READ-ONLY AUTHORITATIVE ENGINEERING PIPELINE VALUES */}
                <div style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            AUTHORITATIVE ENGINEERING PIPELINE VALUES
                        </span>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#15803D", background: "#DCFCE7", border: "1px solid #BBF7D0", padding: "1px 5px", borderRadius: "2px" }}>
                            AUTO-SYNCED
                        </span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748B", marginBottom: "4px" }}>
                        The TEA module updates automatically whenever the engineering design changes.
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", fontSize: "11px" }}>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Selected Technology</span>
                            <strong style={{ fontSize: "12px", color: "#2563EB" }}>
                                {engineering.technology}
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Feed Flow Rate</span>
                            <strong style={{ fontSize: "12px", color: "#0F172A", fontFamily: "monospace" }}>
                                {Number(engineering.flowRate ?? 10).toFixed(2)} L/min
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Product Flow</span>
                            <strong style={{ fontSize: "12px", color: "#15803D", fontFamily: "monospace" }}>
                                {Number(tea.engineeringBasis?.productFlowLmin ?? 0).toFixed(2)} L/min
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Water Recovery</span>
                            <strong style={{ fontSize: "12px", color: "#0F172A", fontFamily: "monospace" }}>
                                {Number(tea.engineeringBasis?.recoveryPct ?? 95.0).toFixed(1)} %
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Gross Electrical SEC</span>
                            <strong style={{ fontSize: "12px", color: "#D97706", fontFamily: "monospace" }}>
                                {Number(tea.engineeringBasis?.grossSecKwhM3 ?? 0).toFixed(4)} kWh/m³
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Stack Power</span>
                            <strong style={{ fontSize: "12px", color: "#0F172A", fontFamily: "monospace" }}>
                                {Number(tea.engineeringBasis?.stackPowerW ?? 0).toFixed(1)} W
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Stack Modules</span>
                            <strong style={{ fontSize: "12px", color: "#0F172A", fontFamily: "monospace" }}>
                                {tea.engineeringBasis?.modules ?? 1} module(s)
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Cell Pairs &amp; Area</span>
                            <strong style={{ fontSize: "12px", color: "#0F172A", fontFamily: "monospace" }}>
                                {tea.engineeringBasis?.cellPairs} pairs / {tea.engineeringBasis?.activeAreaCm2} cm²
                            </strong>
                        </div>
                    </div>

                    {/* Energy Balance Mathematical Reconciliation Card */}
                    {tea.energyReconciliation && (
                        <div style={{
                            marginTop: "8px",
                            padding: "8px 10px",
                            background: tea.energyReconciliation.isReconciled ? "#F0FDF4" : "#FEF2F2",
                            border: `1px solid ${tea.energyReconciliation.isReconciled ? "#BBF7D0" : "#FECACA"}`,
                            borderRadius: "4px",
                            fontSize: "10.5px"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                <span style={{ fontWeight: "700", color: tea.energyReconciliation.isReconciled ? "#166534" : "#991B1B" }}>
                                    ⚡ Mathematical Energy Reconciliation
                                </span>
                                <span style={{
                                    fontSize: "9px",
                                    fontWeight: "800",
                                    padding: "1px 6px",
                                    borderRadius: "3px",
                                    background: tea.energyReconciliation.isReconciled ? "#DCFCE7" : "#FEE2E2",
                                    color: tea.energyReconciliation.isReconciled ? "#15803D" : "#B91C1C",
                                    border: `1px solid ${tea.energyReconciliation.isReconciled ? "#86EFAC" : "#FCA5A5"}`
                                }}>
                                    {tea.energyReconciliation.status} (Δ {tea.energyReconciliation.relativeErrorPct}%)
                                </span>
                            </div>
                            <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#334155" }}>
                                E(SEC) = {tea.energyReconciliation.annualEnergyFromSec} kWh ≡ E(P×H) = {tea.energyReconciliation.annualEnergyFromPower} kWh
                            </div>
                            <div style={{ fontSize: "9px", color: "#64748B", marginTop: "2px" }}>
                                Residual: {tea.energyReconciliation.energyResidualKwh} kWh (tolerance: ≤ {tea.energyReconciliation.tolerancePct}%)
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. DETAILED ECONOMIC BREAKDOWN TABLE */}
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "4px", overflowX: "auto" }}>
                <div style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            ECONOMIC PARAMETER BREAKDOWN &amp; AUDIT SUMMARY
                        </span>
                    </div>
                    <button
                        onClick={() => setPage("EQUATION_EDITOR")}
                        title="View and edit governing equations in the Equation Editor"
                        style={{
                            background: "#FFFFFF",
                            color: "#2563EB",
                            border: "1px solid #BFDBFE",
                            padding: "3px 10px",
                            borderRadius: "3px",
                            fontSize: "10.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                        }}
                    >
                        <span>📐</span>
                        <span>VIEW EQUATIONS IN EQUATION EDITOR ↗</span>
                    </button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}>
                    <thead>
                        <tr style={{ background: "#F1F5F9", color: "#475569", fontWeight: "700", borderBottom: "1px solid #CBD5E1" }}>
                            <th style={{ padding: "6px 10px" }}>Parameter</th>
                            <th style={{ padding: "6px 10px" }}>Metric Code</th>
                            <th style={{ padding: "6px 10px", textAlign: "right" }}>Calculated Value</th>
                            <th style={{ padding: "6px 10px", textAlign: "left" }}>Unit</th>
                            <th style={{ padding: "6px 10px" }}>Classification &amp; Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "6px 10px", fontWeight: "600" }}>Selected Technology</td>
                            <td style={{ padding: "6px 10px", color: "#64748B", fontFamily: "monospace" }}>TECH_CORE</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", color: "#2563EB" }}>{engineering.technology}</td>
                            <td style={{ padding: "6px 10px" }}>—</td>
                            <td style={{ padding: "6px 10px", color: "#475569", fontSize: "10.5px" }}>Recommended Candidate from Multi-Tech Screening</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "6px 10px", fontWeight: "600" }}>Product Water (Instantaneous)</td>
                            <td style={{ padding: "6px 10px", color: "#64748B", fontFamily: "monospace" }}>Q_prod</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", fontFamily: "monospace" }}>{formatNum(tea.engineeringBasis?.productFlowLmin, 2)}</td>
                            <td style={{ padding: "6px 10px" }}>L/min</td>
                            <td style={{ padding: "6px 10px", color: "#475569", fontSize: "10.5px" }}>Hydraulic Permeate Flow Output</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#F8FAFC" }}>
                            <td style={{ padding: "6px 10px", fontWeight: "700", color: "#0F172A" }}>Annual Product Water</td>
                            <td style={{ padding: "6px 10px", color: "#64748B", fontFamily: "monospace" }}>EQ-TEA-01</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "800", color: "#0F172A", fontFamily: "monospace" }}>{formatNum(tea.annualProductWaterM3, 1)}</td>
                            <td style={{ padding: "6px 10px", fontWeight: "700" }}>m³/year</td>
                            <td style={{ padding: "6px 10px", color: "#475569", fontSize: "10.5px" }}>
                                {formatNum(tea.engineeringBasis?.productFlowM3h ?? ((tea.engineeringBasis?.productFlowLmin || 0) * 0.06), 3)} m³/h × {Number(teaInputs?.operatingHoursPerDay || 24) * Number(teaInputs?.operatingDaysPerYear || 350)} h/yr (Formula: Q_prod × 60 ÷ 1,000 × {teaInputs?.operatingHoursPerDay} × {teaInputs?.operatingDaysPerYear})
                            </td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "6px 10px", fontWeight: "600" }}>Gross Electrical SEC</td>
                            <td style={{ padding: "6px 10px", color: "#64748B", fontFamily: "monospace" }}>SEC_gross</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", color: "#D97706", fontFamily: "monospace" }}>{formatNum(tea.engineeringBasis?.grossSecKwhM3, 4)}</td>
                            <td style={{ padding: "6px 10px" }}>kWh/m³</td>
                            <td style={{ padding: "6px 10px", color: "#475569", fontSize: "10.5px" }}>Specific Electrical Energy Normalized to Permeate Volume</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "6px 10px", fontWeight: "600" }}>Electricity Tariff</td>
                            <td style={{ padding: "6px 10px", color: "#64748B", fontFamily: "monospace" }}>TARIFF_RATE</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", fontFamily: "monospace" }}>{formatNum(teaInputs.electricityTariff, 2)}</td>
                            <td style={{ padding: "6px 10px" }}>₹/kWh</td>
                            <td style={{ padding: "6px 10px", color: "#475569", fontSize: "10.5px" }}>Commercial Grid Power Tariff Input</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "6px 10px", fontWeight: "600" }}>Annual Energy Consumption</td>
                            <td style={{ padding: "6px 10px", color: "#64748B", fontFamily: "monospace" }}>EQ-TEA-02</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", fontFamily: "monospace" }}>{formatNum(tea.annualEnergyConsumptionKwh, 1)}</td>
                            <td style={{ padding: "6px 10px" }}>kWh/year</td>
                            <td style={{ padding: "6px 10px", color: "#475569", fontSize: "10.5px" }}>Annual Grid Power Energy Requirement</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#F8FAFC" }}>
                            <td style={{ padding: "6px 10px", fontWeight: "700", color: "#0F172A" }}>Annual Energy Cost</td>
                            <td style={{ padding: "6px 10px", color: "#64748B", fontFamily: "monospace" }}>EQ-TEA-03</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "800", color: "#2563EB", fontFamily: "monospace" }}>{formatInr(tea.annualEnergyCostInr)}</td>
                            <td style={{ padding: "6px 10px", fontWeight: "700" }}>₹/year</td>
                            <td style={{ padding: "6px 10px", color: "#475569", fontSize: "10.5px" }}>Electricity Utility Annual Expenditure</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "6px 10px", fontWeight: "700", color: "#0F172A" }}>Total Capital Expenditure (CAPEX)</td>
                            <td style={{ padding: "6px 10px", color: "#64748B", fontFamily: "monospace" }}>EQ-TEA-04</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "800", color: "#0F172A", fontFamily: "monospace" }}>{formatInr(tea.capexInr)}</td>
                            <td style={{ padding: "6px 10px", fontWeight: "700" }}>₹</td>
                            <td style={{ padding: "6px 10px", color: "#475569", fontSize: "10.5px" }}>Turnkey Capital Investment (6 Equipment Components)</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "6px 10px", fontWeight: "600" }}>Annual Maintenance Cost</td>
                            <td style={{ padding: "6px 10px", color: "#64748B", fontFamily: "monospace" }}>OPEX_MAINT</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", fontFamily: "monospace" }}>{formatInr(teaInputs.annualMaintenanceCost)}</td>
                            <td style={{ padding: "6px 10px" }}>₹/year</td>
                            <td style={{ padding: "6px 10px", color: "#475569", fontSize: "10.5px" }}>Routine Preventive Mechanical &amp; Electrical Servicing</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "6px 10px", fontWeight: "600" }}>Annual Replacement Cost</td>
                            <td style={{ padding: "6px 10px", color: "#64748B", fontFamily: "monospace" }}>OPEX_REPL</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "700", fontFamily: "monospace" }}>{formatInr(teaInputs.annualReplacementCost)}</td>
                            <td style={{ padding: "6px 10px" }}>₹/year</td>
                            <td style={{ padding: "6px 10px", color: "#475569", fontSize: "10.5px" }}>Consumable &amp; Amortized Part Spares Provision</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FFFBEB" }}>
                            <td style={{ padding: "6px 10px", fontWeight: "800", color: "#92400E" }}>Annual OPEX</td>
                            <td style={{ padding: "6px 10px", color: "#92400E", fontFamily: "monospace" }}>EQ-TEA-05</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "800", color: "#B45309", fontFamily: "monospace" }}>{formatInr(tea.annualOpexInr)}</td>
                            <td style={{ padding: "6px 10px", fontWeight: "800", color: "#92400E" }}>₹/year</td>
                            <td style={{ padding: "6px 10px", color: "#A16207", fontSize: "10.5px" }}>Total Annual Operational Expenditure (Energy, Maintenance, and Replacements)</td>
                        </tr>
                        <tr style={{ background: "#F0FDF4" }}>
                            <td style={{ padding: "8px 10px", fontWeight: "800", color: "#166534", fontSize: "11.5px" }}>Operating Treatment Cost</td>
                            <td style={{ padding: "8px 10px", color: "#166534", fontWeight: "700", fontFamily: "monospace" }}>EQ-TEA-06</td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "900", color: "#15803D", fontSize: "13px", fontFamily: "monospace" }}>{formatInr(tea.operatingTreatmentCostInrPerM3, 2)}</td>
                            <td style={{ padding: "8px 10px", fontWeight: "800", color: "#166534" }}>₹/m³</td>
                            <td style={{ padding: "8px 10px", color: "#166534", fontSize: "11px", fontWeight: "600" }}>Unit Operating Water Treatment Cost per m³ Permeate</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </section>
    );
}
