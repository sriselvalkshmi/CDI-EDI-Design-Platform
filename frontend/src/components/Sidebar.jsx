import React from "react";
import { useApp } from "../context/AppContext";
import auditLogger from "../services/auditLogger";

export default function Sidebar() {
    const {
        technology,
        setTechnology,
        feedWater,
        setFeedWater,
        loading,
        setLoading,
        optimizationInputs,
        setOptimizationInputs,
        recalculate,
        user,
        designResult
    } = useApp();

    const eng = designResult?.engineering || null;
    const isDesignReady = Boolean(eng);
    const outletTds = isDesignReady ? Number(eng.outletTDS) : "—";
    const recovery = isDesignReady ? Number(eng.waterRecovery).toFixed(1) + "%" : "—";

    function getFieldStatus(field, val) {
        if (val === "" || val === undefined || val === null) {
            return "REQUIRED";
        }
        const num = Number(val);
        if (isNaN(num)) return "INVALID";

        switch (field) {
            case "tds":
                return (num >= 10 && num <= 30000) ? "VALID" : "INVALID";
            case "conductivity":
                return (num > 0 && num <= 60000) ? "VALID" : "INVALID";
            case "hardness":
                return (num >= 0 && num <= 5000) ? "VALID" : "INVALID";
            case "ph":
                return (num >= 4.0 && num <= 10.0) ? "VALID" : "INVALID";
            case "temperature":
                return (num >= 5 && num <= 50) ? "VALID" : "INVALID";
            case "flowRate":
                return (num >= 0.1 && num <= 1000) ? "VALID" : "INVALID";
            case "pressure":
                return (num >= 0.1 && num <= 10) ? "VALID" : "INVALID";
            case "targetTds":
                const feedTdsNum = Number(feedWater.tds);
                return (num >= 1 && (!feedTdsNum || num < feedTdsNum)) ? "VALID" : "INVALID";
            default:
                return "VALID";
        }
    }

    function renderBadge(status) {
        if (status === "VALID") {
            return (
                <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#15803D", background: "#DCFCE7", border: "1px solid #BBF7D0", padding: "1px 4px", borderRadius: "2px", width: "48px", textAlign: "center", display: "inline-block" }}>
                    VALID
                </span>
            );
        }
        if (status === "INVALID") {
            return (
                <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#991B1B", background: "#FEE2E2", border: "1px solid #FECACA", padding: "1px 4px", borderRadius: "2px", width: "48px", textAlign: "center", display: "inline-block" }}>
                    INVALID
                </span>
            );
        }
        return (
            <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#64748B", background: "#F1F5F9", border: "1px solid #CBD5E1", padding: "1px 4px", borderRadius: "2px", width: "48px", textAlign: "center", display: "inline-block" }}>
                REQUIRED
            </span>
        );
    }

    const tdsStatus = getFieldStatus("tds", feedWater.tds);
    const condStatus = getFieldStatus("conductivity", feedWater.conductivity);
    const hardStatus = getFieldStatus("hardness", feedWater.hardness);
    const phStatus = getFieldStatus("ph", feedWater.ph);
    const tempStatus = getFieldStatus("temperature", feedWater.temperature);
    const flowStatus = getFieldStatus("flowRate", feedWater.flowRate);
    const pressStatus = getFieldStatus("pressure", feedWater.pressure);
    const targetStatus = getFieldStatus("targetTds", feedWater.targetTds);

    const isFormValid =
        tdsStatus === "VALID" &&
        condStatus === "VALID" &&
        hardStatus === "VALID" &&
        phStatus === "VALID" &&
        tempStatus === "VALID" &&
        flowStatus === "VALID" &&
        pressStatus === "VALID" &&
        targetStatus === "VALID";

    function update(field, value) {
        const numVal = Number(value);
        const newFeed = {
            ...feedWater,
            [field]: value === "" ? "" : (isNaN(numVal) ? value : numVal)
        };

        if (field === "tds" && numVal > 0) {
            if (newFeed.conductivity === "" || newFeed.conductivity === undefined) {
                newFeed.conductivity = Math.round(numVal / 0.65);
            }
            if (newFeed.hardness === "" || newFeed.hardness === undefined) {
                newFeed.hardness = Math.round(numVal * 0.30);
            }
        }

        setFeedWater(newFeed);
    }

    function handleTechnologyChange(newTech) {
        setTechnology(newTech);
        if (isDesignReady) {
            recalculate(optimizationInputs, newTech, false);
        }
    }

    function handleGenerateDesign() {
        if (!isFormValid) return;
        recalculate(optimizationInputs, technology || "AUTO", false);
    }

    function handleReset() {
        const emptyFeed = {
            tds: "",
            conductivity: "",
            hardness: "",
            ph: "",
            temperature: "",
            flowRate: "",
            pressure: "",
            targetTds: ""
        };
        setFeedWater(emptyFeed);
        setOptimizationInputs({});
        setDesignResult(null);
        setDesignGenerated(false);
    }

    const isViewer = user && user.role === "Viewer";

    return (
        <aside className="sidebar" style={{
            background: "#FFFFFF",
            borderRight: "1px solid #CBD5E1",
            padding: "12px",
            width: "250px",
            boxSizing: "border-box",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
            {/* 1. FEED WATER DESIGN BASIS */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", borderBottom: "1px solid #E2E8F0", paddingBottom: "3px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Feed Water Design Basis
                    </span>
                    {renderBadge(isFormValid ? "VALID" : (Object.values(feedWater).some(v => v !== "") ? "REQUIRED" : "REQUIRED"))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {/* TDS */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ fontSize: "11px", color: "#475569", fontWeight: "500" }}>TDS (mg/L)</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                                type="number"
                                placeholder="—"
                                value={feedWater.tds}
                                disabled={isViewer}
                                onChange={(e) => update("tds", e.target.value)}
                                style={{ width: "70px", padding: "3px 5px", border: `1px solid ${tdsStatus === "INVALID" ? "#DC2626" : "#CBD5E1"}`, borderRadius: "3px", fontSize: "11px", fontWeight: "600", textAlign: "right", fontFamily: "monospace" }}
                            />
                            {renderBadge(tdsStatus)}
                        </div>
                    </div>

                    {/* Conductivity */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label 
                            style={{ fontSize: "11px", color: "#475569", fontWeight: "500", cursor: "help" }}
                            title="Conductivity is an independent user-entered parameter (TDS ≈ 0.65 × σ). The screening model uses TDS for mass and Faraday charge transport balances."
                        >
                            Conductivity (µS/cm) ℹ️
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                                type="number"
                                placeholder="—"
                                value={feedWater.conductivity}
                                disabled={isViewer}
                                title="Independent diagnostic parameter (TDS ≈ 0.65 × Conductivity)"
                                onChange={(e) => update("conductivity", e.target.value)}
                                style={{ width: "70px", padding: "3px 5px", border: `1px solid ${condStatus === "INVALID" ? "#DC2626" : "#CBD5E1"}`, borderRadius: "3px", fontSize: "11px", fontWeight: "600", textAlign: "right", fontFamily: "monospace" }}
                            />
                            {renderBadge(condStatus)}
                        </div>
                    </div>

                    {/* Hardness */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ fontSize: "11px", color: "#475569", fontWeight: "500" }}>Hardness (mg/L)</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                                type="number"
                                placeholder="—"
                                value={feedWater.hardness}
                                disabled={isViewer}
                                onChange={(e) => update("hardness", e.target.value)}
                                style={{ width: "70px", padding: "3px 5px", border: `1px solid ${hardStatus === "INVALID" ? "#DC2626" : "#CBD5E1"}`, borderRadius: "3px", fontSize: "11px", fontWeight: "600", textAlign: "right", fontFamily: "monospace" }}
                            />
                            {renderBadge(hardStatus)}
                        </div>
                    </div>

                    {/* pH */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ fontSize: "11px", color: "#475569", fontWeight: "500" }}>pH (—)</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="—"
                                value={feedWater.ph}
                                disabled={isViewer}
                                onChange={(e) => update("ph", e.target.value)}
                                style={{ width: "70px", padding: "3px 5px", border: `1px solid ${phStatus === "INVALID" ? "#DC2626" : "#CBD5E1"}`, borderRadius: "3px", fontSize: "11px", fontWeight: "600", textAlign: "right", fontFamily: "monospace" }}
                            />
                            {renderBadge(phStatus)}
                        </div>
                    </div>

                    {/* Temperature */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ fontSize: "11px", color: "#475569", fontWeight: "500" }}>Temperature (°C)</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                                type="number"
                                placeholder="—"
                                value={feedWater.temperature}
                                disabled={isViewer}
                                onChange={(e) => update("temperature", e.target.value)}
                                style={{ width: "70px", padding: "3px 5px", border: `1px solid ${tempStatus === "INVALID" ? "#DC2626" : "#CBD5E1"}`, borderRadius: "3px", fontSize: "11px", fontWeight: "600", textAlign: "right", fontFamily: "monospace" }}
                            />
                            {renderBadge(tempStatus)}
                        </div>
                    </div>

                    {/* Flow */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ fontSize: "11px", color: "#475569", fontWeight: "500" }}>Feed Flow (L/min)</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                                type="number"
                                step="0.5"
                                placeholder="—"
                                value={feedWater.flowRate}
                                disabled={isViewer}
                                onChange={(e) => update("flowRate", e.target.value)}
                                style={{ width: "70px", padding: "3px 5px", border: `1px solid ${flowStatus === "INVALID" ? "#DC2626" : "#CBD5E1"}`, borderRadius: "3px", fontSize: "11px", fontWeight: "600", textAlign: "right", fontFamily: "monospace" }}
                            />
                            {renderBadge(flowStatus)}
                        </div>
                    </div>

                    {/* Pressure */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ fontSize: "11px", color: "#475569", fontWeight: "500" }}>Feed Pressure (bar)</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="—"
                                value={feedWater.pressure}
                                disabled={isViewer}
                                onChange={(e) => update("pressure", e.target.value)}
                                style={{ width: "70px", padding: "3px 5px", border: `1px solid ${pressStatus === "INVALID" ? "#DC2626" : "#CBD5E1"}`, borderRadius: "3px", fontSize: "11px", fontWeight: "600", textAlign: "right", fontFamily: "monospace" }}
                            />
                            {renderBadge(pressStatus)}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. PRODUCT QUALITY TARGET */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", borderBottom: "1px solid #E2E8F0", paddingBottom: "3px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Product Quality Target
                    </span>
                    {renderBadge(targetStatus)}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ fontSize: "11px", color: "#475569", fontWeight: "500" }}>Target TDS (mg/L)</label>
                        <input
                            type="number"
                            placeholder="—"
                            value={feedWater.targetTds}
                            disabled={isViewer}
                            onChange={(e) => update("targetTds", e.target.value)}
                            style={{ width: "70px", padding: "3px 5px", border: `1px solid ${targetStatus === "INVALID" ? "#DC2626" : "#CBD5E1"}`, borderRadius: "3px", fontSize: "11px", fontWeight: "700", color: "#0F172A", textAlign: "right", fontFamily: "monospace" }}
                        />
                    </div>

                    <div 
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10.5px", color: "#64748B", background: "#F8FAFC", padding: "4px 6px", borderRadius: "3px", cursor: "help" }}
                        title="Calculated Product TDS: Faradaic-design calculation — requires experimental validation"
                    >
                        <span>Product TDS:</span>
                        <strong style={{ color: isDesignReady ? (outletTds <= Number(feedWater.targetTds) ? "#15803D" : "#DC2626") : "#64748B", fontFamily: "monospace" }}>
                            {isDesignReady ? `${outletTds} mg/L` : "—"}
                        </strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10.5px", color: "#64748B", background: "#F8FAFC", padding: "4px 6px", borderRadius: "3px" }}>
                        <span>Target Recovery (≥ 95%):</span>
                        <span style={{
                            color: isDesignReady ? (Number(eng.waterRecovery ?? eng.waterRecoveryPct ?? 0) >= 94.95 ? "#15803D" : "#DC2626") : "#0F172A",
                            fontWeight: "700",
                            fontFamily: "monospace"
                        }}>
                            {isDesignReady ? `${recovery} ${Number(eng.waterRecovery ?? eng.waterRecoveryPct ?? 0) >= 94.95 ? "✓ PASS" : "⚠ FAIL"}` : "—"}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. PROCESS SELECTION */}
            <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "6px", borderBottom: "1px solid #E2E8F0", paddingBottom: "3px" }}>
                    Process Selection
                </div>
                <select
                    value={technology}
                    disabled={isViewer}
                    onChange={(e) => handleTechnologyChange(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "5px 6px",
                        border: "1px solid #CBD5E1",
                        borderRadius: "3px",
                        fontSize: "11.5px",
                        fontWeight: "600",
                        boxSizing: "border-box",
                        background: "#FFFFFF",
                        color: "#0F172A"
                    }}
                >
                    <option value="AUTO">AUTO (Screening Selection)</option>
                    <option value="MCDI">MCDI (Membrane Capacitive Deion.)</option>
                    <option value="CDI">CDI (Standard Capacitive Deion.)</option>
                    <option value="FCDI">FCDI (Flow-Electrode Deion.)</option>
                    <option value="EDI">EDI (Electrodeionization)</option>
                </select>
            </div>

            {/* 4. ACTIONS */}
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                    onClick={handleGenerateDesign}
                    disabled={!isFormValid || loading || isViewer}
                    style={{
                        width: "100%",
                        background: isFormValid ? "#0F172A" : "#94A3B8",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "4px",
                        padding: "7px 10px",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        cursor: isFormValid ? "pointer" : "not-allowed",
                        letterSpacing: "0.02em",
                        opacity: isFormValid ? 1.0 : 0.7
                    }}
                >
                    {loading ? "Calculating..." : "GENERATE DESIGN"}
                </button>

                <button
                    onClick={handleReset}
                    disabled={loading || isViewer}
                    style={{
                        width: "100%",
                        background: "#F8FAFC",
                        color: "#475569",
                        border: "1px solid #CBD5E1",
                        borderRadius: "4px",
                        padding: "5px 10px",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    RESET
                </button>
            </div>
        </aside>
    );
}
