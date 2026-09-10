import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useApp } from "../context/AppContext";
import {
    SWEEP_PARAMETERS,
    generateScenarioValues,
    validateSweepConfig,
    runScenarioAnalysis,
    formatSweepPoints
} from "@shared/engineering/core/designExplorerEngine.js";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine
} from "recharts";

export default function DesignExplorerPanel() {
    const {
        feedWater,
        technology,
        optimizationInputs,
        designResult,
        recalculate
    } = useApp();

    const isDesignActive = Boolean(designResult?.engineering || (feedWater?.tds && feedWater.tds !== ""));

    // 1. BASELINE CASE STATE: Synchronize with current active design or default to zero awaiting generation
    const [baselineState, setBaselineState] = useState(() => {
        if (!isDesignActive) {
            return {
                feedTds: 0,
                feedFlow: 0,
                targetTds: 0,
                targetRecovery: 0,
                technology: technology || "AUTO",
                cellVoltage: 0,
                cellPairs: 0,
                electrodeArea: 0,
                numberOfModules: 0,
                current: 0
            };
        }
        const feed = designResult?.input?.feedWater || (feedWater?.tds ? feedWater : {});
        const eng = designResult?.engineering || {};
        const rawTds = (feed.tds !== undefined && feed.tds !== "" && !isNaN(Number(feed.tds)))
            ? Number(feed.tds)
            : (eng.tds ? Number(eng.tds) : (eng.feedTds ? Number(eng.feedTds) : 0));
        const rawFlow = (feed.flowRate !== undefined && feed.flowRate !== "" && !isNaN(Number(feed.flowRate)))
            ? Number(feed.flowRate)
            : (eng.flowRate ? Number(eng.flowRate) : 0);
        const rawTargetTds = (feed.targetTds !== undefined && feed.targetTds !== "" && !isNaN(Number(feed.targetTds)))
            ? Number(feed.targetTds)
            : (eng.targetTds ? Number(eng.targetTds) : 0);
        const rawTargetRecovery = (feed.targetRecovery !== undefined && feed.targetRecovery !== "" && !isNaN(Number(feed.targetRecovery)))
            ? Number(feed.targetRecovery)
            : (eng.targetRecovery ? Number(eng.targetRecovery) : (eng.waterRecovery ? Number(eng.waterRecovery) : 0));

        return {
            feedTds: rawTds,
            feedFlow: rawFlow,
            targetTds: rawTargetTds,
            targetRecovery: rawTargetRecovery,
            technology: technology || designResult?.input?.technology || "AUTO",
            cellVoltage: Number(optimizationInputs?.voltage ?? eng.voltageCell ?? eng.voltage ?? 0),
            cellPairs: Number(optimizationInputs?.cellPairs ?? eng.cellPairs ?? 0),
            electrodeArea: Number(optimizationInputs?.electrodeArea ?? eng.electrodeArea ?? 0),
            numberOfModules: Number(optimizationInputs?.numberOfModules ?? eng.numberOfModules ?? 0),
            current: Number(optimizationInputs?.current ?? eng.current ?? 0)
        };
    });

    const [isBaselineLoaded, setIsBaselineLoaded] = useState(true);

    // 2. PARAMETER TO VARY STATE
    const [selectedParam, setSelectedParam] = useState("Feed TDS");
    const [fromVal, setFromVal] = useState(() => {
        if (!isDesignActive) return 0;
        const feed = designResult?.input?.feedWater || (feedWater?.tds ? feedWater : {});
        const eng = designResult?.engineering || {};
        const rawTds = (feed.tds !== undefined && feed.tds !== "" && !isNaN(Number(feed.tds)))
            ? Number(feed.tds)
            : (eng.tds ? Number(eng.tds) : (eng.feedTds ? Number(eng.feedTds) : 0));
        return rawTds;
    });
    const [toVal, setToVal] = useState(() => (isDesignActive ? 1000 : 0));
    const [caseCount, setCaseCount] = useState(6);

    // 3. EXECUTION & RESULTS STATE
    const [isRunning, setIsRunning] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState("IDLE"); // IDLE | RUNNING | COMPLETE
    const [analysisResult, setAnalysisResult] = useState(null);
    const [executionError, setExecutionError] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState("outletTds");
    const [expandedScenarioId, setExpandedScenarioId] = useState(null);

    // Helper to calculate default sweep values based on parameter and baseline
    const getParamDefaults = (paramKey, currentBaseline) => {
        const meta = SWEEP_PARAMETERS[paramKey] || SWEEP_PARAMETERS["Feed TDS"];
        let baseVal = meta.defaultFrom;
        let endVal = meta.defaultTo;

        if (paramKey === "Feed TDS") {
            baseVal = currentBaseline?.feedTds || 500;
            endVal = 1000;
            if (baseVal >= endVal) {
                endVal = Math.round(baseVal * 2);
            }
        } else if (paramKey === "Feed Flow") {
            baseVal = Math.max(1, Math.round((currentBaseline?.feedFlow || 10) * 0.5));
            endVal = Math.round((currentBaseline?.feedFlow || 10) * 2.5);
        } else if (paramKey === "Recovery") {
            baseVal = currentBaseline?.targetRecovery ? Math.max(50, Math.round(currentBaseline.targetRecovery - 10)) : 85;
            endVal = currentBaseline?.targetRecovery ? Math.min(99, Math.round(currentBaseline.targetRecovery + 3)) : 98;
        } else if (paramKey === "Cell Voltage") {
            baseVal = currentBaseline?.cellVoltage > 0 ? Number((currentBaseline.cellVoltage * 0.8).toFixed(1)) : 1.0;
            endVal = currentBaseline?.cellVoltage > 0 ? Number((currentBaseline.cellVoltage * 1.2).toFixed(1)) : 1.6;
        } else if (paramKey === "Cell Pairs") {
            baseVal = Math.max(10, Math.round((currentBaseline?.cellPairs || 34) * 0.6));
            endVal = Math.round((currentBaseline?.cellPairs || 34) * 1.8);
        } else if (paramKey === "Active Area") {
            baseVal = Math.max(50, Math.round((currentBaseline?.electrodeArea || 350) * 0.6));
            endVal = Math.round((currentBaseline?.electrodeArea || 350) * 1.8);
        }

        return { from: baseVal, to: endVal };
    };

    // Synchronize baseline from current platform design state without mutating main design
    const loadCurrentBaseline = useCallback(() => {
        const eng = designResult?.engineering || {};
        const feed = designResult?.input?.feedWater || (feedWater?.tds ? feedWater : {});
        const hasActiveDesign = Boolean(designResult?.engineering || (feedWater?.tds && feedWater.tds !== ""));

        if (!hasActiveDesign) {
            const zeroBaseline = {
                feedTds: 0,
                feedFlow: 0,
                targetTds: 0,
                targetRecovery: 0,
                technology: technology || "AUTO",
                cellVoltage: 0,
                cellPairs: 0,
                electrodeArea: 0,
                numberOfModules: 0,
                current: 0
            };
            setBaselineState(zeroBaseline);
            setFromVal(0);
            setToVal(0);
            setAnalysisResult(null);
            setAnalysisStatus("IDLE");
            return;
        }

        const rawTds = (feed.tds !== undefined && feed.tds !== "" && !isNaN(Number(feed.tds)))
            ? Number(feed.tds)
            : (eng.tds ? Number(eng.tds) : (eng.feedTds ? Number(eng.feedTds) : 500));

        const rawFlow = (feed.flowRate !== undefined && feed.flowRate !== "" && !isNaN(Number(feed.flowRate)))
            ? Number(feed.flowRate)
            : (eng.flowRate ? Number(eng.flowRate) : 10);

        const rawTargetTds = (feed.targetTds !== undefined && feed.targetTds !== "" && !isNaN(Number(feed.targetTds)))
            ? Number(feed.targetTds)
            : (eng.targetTds ? Number(eng.targetTds) : 50);

        const rawTargetRecovery = (feed.targetRecovery !== undefined && feed.targetRecovery !== "" && !isNaN(Number(feed.targetRecovery)))
            ? Number(feed.targetRecovery)
            : (eng.targetRecovery ? Number(eng.targetRecovery) : (eng.waterRecovery ? Number(eng.waterRecovery) : 95.0));

        const techVal = technology || designResult?.input?.technology || "AUTO";

        const voltVal = (optimizationInputs?.voltage && Number(optimizationInputs.voltage) > 0) 
            ? Number(optimizationInputs.voltage) 
            : Number(eng.voltageCell ?? eng.voltage ?? 1.40);
        const pairsVal = (optimizationInputs?.cellPairs && Number(optimizationInputs.cellPairs) > 0)
            ? Number(optimizationInputs.cellPairs)
            : Number(eng.cellPairs ?? 34);
        const areaVal = (optimizationInputs?.electrodeArea && Number(optimizationInputs.electrodeArea) > 0)
            ? Number(optimizationInputs.electrodeArea)
            : Number(eng.electrodeArea ?? 350);
        const modVal = (optimizationInputs?.numberOfModules && Number(optimizationInputs.numberOfModules) > 0)
            ? Number(optimizationInputs.numberOfModules)
            : Number(eng.numberOfModules ?? 1);
        const currentVal = (optimizationInputs?.current && Number(optimizationInputs.current) > 0)
            ? Number(optimizationInputs.current)
            : Number(eng.current ?? 3.96);

        const newBaseline = {
            feedTds: rawTds,
            feedFlow: rawFlow,
            targetTds: rawTargetTds,
            targetRecovery: rawTargetRecovery,
            technology: techVal,
            cellVoltage: voltVal,
            cellPairs: pairsVal,
            electrodeArea: areaVal,
            numberOfModules: modVal,
            current: currentVal
        };

        setBaselineState(newBaseline);
        setIsBaselineLoaded(true);

        const defaults = getParamDefaults(selectedParam, newBaseline);
        setFromVal(defaults.from);
        setToVal(defaults.to);

        // Run scenario analysis with updated baseline
        executeAnalysis(newBaseline, selectedParam, defaults.from, defaults.to, caseCount);
    }, [designResult, feedWater, technology, optimizationInputs, selectedParam, caseCount]);

    // Automatically synchronize baseline when active design in AppContext changes or becomes ready
    useEffect(() => {
        if (designResult?.engineering || (feedWater?.tds && feedWater.tds !== "")) {
            loadCurrentBaseline();
        } else {
            setBaselineState({
                feedTds: 0,
                feedFlow: 0,
                targetTds: 0,
                targetRecovery: 0,
                technology: technology || "AUTO",
                cellVoltage: 0,
                cellPairs: 0,
                electrodeArea: 0,
                numberOfModules: 0,
                current: 0
            });
            setFromVal(0);
            setToVal(0);
            setAnalysisResult(null);
            setAnalysisStatus("IDLE");
            setExecutionError(null);
        }
    }, [designResult, feedWater?.tds, feedWater?.flowRate, feedWater?.targetTds, feedWater?.targetRecovery]);

    // Handle parameter dropdown selection
    const handleParamChange = (newParam) => {
        setSelectedParam(newParam);
        const defaults = getParamDefaults(newParam, baselineState);
        setFromVal(defaults.from);
        setToVal(defaults.to);
    };

    // 1. Single source of truth for parameter sweep validation (synchronous)
    const sweepValidation = useMemo(() => {
        return validateSweepConfig({
            parameter: selectedParam,
            from: fromVal,
            to: toVal,
            count: caseCount
        });
    }, [selectedParam, fromVal, toVal, caseCount]);

    const isSweepValid = sweepValidation.isValid;

    // Combined validation & execution errors list
    const validationErrors = useMemo(() => {
        if (!isDesignActive && fromVal === 0 && toVal === 0) return [];
        const errs = [...sweepValidation.errors];
        if (executionError) errs.push(`Analysis calculation failed: ${executionError}`);
        return errs;
    }, [sweepValidation.errors, executionError, isDesignActive, fromVal, toVal]);

    // Current parameter metadata (unit, bounds, step)
    const currentMeta = SWEEP_PARAMETERS[selectedParam] || SWEEP_PARAMETERS["Feed TDS"];
    const currentUnit = currentMeta.unit;

    // Auto-generate preview values strictly when configuration is valid
    const previewValues = useMemo(() => {
        if (!isSweepValid) return [];
        return generateScenarioValues({ from: fromVal, to: toVal, count: caseCount });
    }, [fromVal, toVal, caseCount, isSweepValid]);

    // Formatted sweep points string (arrow notation and condensed when > 6)
    // When range is invalid (e.g. From >= To), displays "—"
    const sweepPointDisplay = useMemo(() => {
        if (!isDesignActive && fromVal === 0 && toVal === 0) {
            return { formatted: "0", isCondensed: false, fullList: ["0"] };
        }
        if (!isSweepValid || previewValues.length === 0) {
            return { formatted: "—", isCondensed: false, fullList: [] };
        }
        return formatSweepPoints(previewValues, currentUnit);
    }, [previewValues, currentUnit, isSweepValid, isDesignActive, fromVal, toVal]);

    // Validate inputs - Immediately clear stale results and chart when inputs become invalid
    useEffect(() => {
        if (!isSweepValid) {
            setAnalysisResult(null);
            setAnalysisStatus("IDLE");
        }
    }, [isSweepValid]);

    // Internal scenario analysis execution function - Authoritative pipeline execution
    const executeAnalysis = (baselineObj, paramName, fromNum, toNum, countNum) => {
        const validation = validateSweepConfig({
            parameter: paramName,
            from: fromNum,
            to: toNum,
            count: countNum
        });

        if (!validation.isValid) {
            setAnalysisResult(null);
            setAnalysisStatus("IDLE");
            return;
        }

        setIsRunning(true);
        setAnalysisStatus("RUNNING");
        setExecutionError(null);

        try {
            const values = generateScenarioValues({ from: fromNum, to: toNum, count: countNum });
            const optInputs = {};
            if (baselineObj.cellVoltage > 0) optInputs.voltage = baselineObj.cellVoltage;
            if (baselineObj.cellPairs > 0) optInputs.cellPairs = baselineObj.cellPairs;
            if (baselineObj.electrodeArea > 0) optInputs.electrodeArea = baselineObj.electrodeArea;
            if (baselineObj.numberOfModules > 0) optInputs.numberOfModules = baselineObj.numberOfModules;
            if (baselineObj.current > 0) optInputs.current = baselineObj.current;

            const baselinePayload = {
                feedWater: {
                    tds: baselineObj.feedTds,
                    flowRate: baselineObj.feedFlow,
                    targetTds: baselineObj.targetTds,
                    targetRecovery: baselineObj.targetRecovery,
                    hardness: Math.round(baselineObj.feedTds * 0.3),
                    conductivity: Math.round(baselineObj.feedTds / 0.65)
                },
                technology: baselineObj.technology,
                optimizationInputs: optInputs,
                engineering: designResult?.engineering || null
            };

            const result = runScenarioAnalysis({
                baseline: baselinePayload,
                parameter: paramName,
                values
            });

            setAnalysisResult(result);
            setAnalysisStatus("COMPLETE");
        } catch (err) {
            console.error("Scenario Analysis Error:", err);
            setExecutionError(err.message);
            setAnalysisResult(null);
            setAnalysisStatus("IDLE");
        } finally {
            setIsRunning(false);
        }
    };

    // User trigger for RUN SCENARIO ANALYSIS button
    const handleRunAnalysis = () => {
        if (!isSweepValid) {
            setAnalysisResult(null);
            return;
        }
        setExecutionError(null);
        executeAnalysis(baselineState, selectedParam, fromVal, toVal, caseCount);
    };

    // Reset analysis handler
    const handleResetAnalysis = () => {
        setAnalysisResult(null);
        setAnalysisStatus("IDLE");
        setExpandedScenarioId(null);
        setSelectedParam("Feed TDS");
        setSelectedMetric("outletTds");
        if (isDesignActive) {
            const defaults = getParamDefaults("Feed TDS", baselineState);
            setFromVal(defaults.from);
            setToVal(defaults.to);
        } else {
            setFromVal(0);
            setToVal(0);
        }
        setCaseCount(6);
        setExecutionError(null);
    };

    // Run initial baseline scenario analysis on component mount only if design is active with positive parameters
    useEffect(() => {
        if (isDesignActive && baselineState.feedTds > 0 && baselineState.cellVoltage > 0) {
            executeAnalysis(baselineState, selectedParam, fromVal, toVal, caseCount);
        }
    }, []);

    // Metric options for chart visualization
    const METRIC_CONFIG = {
        outletTds: { label: "Product TDS", unit: "mg/L", color: "#2563EB", refVal: baselineState.targetTds, refLabel: `Target: ${baselineState.targetTds} mg/L` },
        productTds: { label: "Product TDS", unit: "mg/L", color: "#2563EB", refVal: baselineState.targetTds, refLabel: `Target: ${baselineState.targetTds} mg/L` },
        recovery: { label: "Water Recovery", unit: "%", color: "#16A34A", refVal: baselineState.targetRecovery, refLabel: `Target: ${baselineState.targetRecovery}%` },
        sec: { label: "Gross Electrical SEC", unit: "kWh/m³", color: "#D97706", refVal: null, refLabel: null },
        pressureDrop: { label: "Channel Pressure Drop (ΔP)", unit: "Pa", color: "#9333EA", refVal: null, refLabel: null },
        power: { label: "Stack Active Power", unit: "W", color: "#0F172A", refVal: null, refLabel: null },
        productFlow: { label: "Product Flow", unit: "L/min", color: "#0284C7", refVal: null, refLabel: null }
    };

    // Chart dataset preparation (reads exact same scenario result fields used by Scenario Results table)
    const chartData = useMemo(() => {
        if (!analysisResult?.scenarios) return [];
        return analysisResult.scenarios.map((sc) => ({
            scenario: sc.id,
            paramValue: sc.paramValue,
            paramFormatted: sc.paramFormatted,
            technology: sc.technology,
            outletTds: sc.outletTds,
            productTds: sc.outletTds,
            recovery: sc.recovery,
            sec: sc.sec,
            pressureDrop: sc.pressureDrop,
            power: sc.power,
            productFlow: sc.productFlow,
            feasibility: sc.feasibility
        }));
    }, [analysisResult]);

    // Custom Dot renderer indicating feasibility on chart (only feasible scenarios are plotted)
    const renderFeasibilityDot = (props) => {
        const { cx, cy, payload } = props;
        if (!cx || !cy) return null;

        return (
            <circle
                key={`dot-${payload.scenario}`}
                cx={cx}
                cy={cy}
                r={5}
                fill="#16A34A"
                stroke="#FFFFFF"
                strokeWidth={1.5}
            />
        );
    };

    return (
        <section
            id="design-explorer-section"
            className="design-explorer-panel"
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
            {/* 1. HEADER & INDUSTRIAL TRACEABILITY IDENTITY */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h2 style={{ fontSize: "13.5px", fontWeight: "800", color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            DESIGN EXPLORER
                        </h2>
                        <span style={{ fontSize: "10px", fontWeight: "700", color: "#2563EB", background: "#EFF6FF", border: "1px solid #BFDBFE", padding: "1px 6px", borderRadius: "3px" }}>
                            SCENARIO &amp; SENSITIVITY ENGINE
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "3px", fontSize: "10.5px", color: "#64748B" }}>
                        <span>
                            ENGINEERING MODEL: <strong style={{ color: "#334155" }}>Existing authoritative calculation pipeline</strong>
                        </span>
                        <span>•</span>
                        <span>
                            SCENARIO BASIS: <strong style={{ color: "#334155" }}>Active multi-technology scenario discovery &amp; design optimization</strong>
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                        onClick={handleResetAnalysis}
                        title="Reset scenario analysis and clear results"
                        style={{
                            background: "#FFFFFF",
                            color: "#475569",
                            border: "1px solid #CBD5E1",
                            padding: "5px 12px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        <span>↺</span>
                        <span>RESET ANALYSIS</span>
                    </button>

                    <button
                        onClick={loadCurrentBaseline}
                        title="Synchronize baseline parameters from active design state"
                        style={{
                            background: "#F8FAFC",
                            color: "#0F172A",
                            border: "1px solid #CBD5E1",
                            padding: "5px 12px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <span style={{ fontSize: "12px", color: "#2563EB" }}>⟳</span>
                        <span>LOAD BASELINE</span>
                    </button>
                </div>
            </div>

            {/* 2. BASELINE CASE & PARAMETER TO VARY CONTROLS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.3fr", gap: "12px" }}>
                
                {/* BASELINE CASE CARD: Displays distinct baseline parameters */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #CBD5E1", paddingBottom: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                {isDesignActive ? "BASELINE CASE — SYNCHRONIZED WITH CURRENT DESIGN" : "BASELINE CASE — AWAITING DESIGN GENERATION"}
                            </span>
                            <span style={{
                                fontSize: "9px",
                                fontWeight: "700",
                                padding: "1px 5px",
                                borderRadius: "2px",
                                background: isDesignActive ? "#DCFCE7" : "#F1F5F9",
                                color: isDesignActive ? "#15803D" : "#475569",
                                border: `1px solid ${isDesignActive ? "#BBF7D0" : "#CBD5E1"}`
                            }}>
                                {isDesignActive ? "SYNCHRONIZED" : "DEFAULT (0)"}
                            </span>
                        </div>
                    </div>

                    {isDesignActive && designResult?.engineering && (
                        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "3px", padding: "4px 8px", fontSize: "10.5px", color: "#1E40AF", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                            <span style={{ fontWeight: "700" }}>Active Dashboard Baseline Performance:</span>
                            <span style={{ fontFamily: "monospace" }}>
                                Product TDS: <strong>{Number(designResult.engineering.outletTDS ?? designResult.engineering.outletTds ?? 0).toFixed(1)} mg/L</strong> &nbsp;|&nbsp; 
                                Recovery: <strong>{Number(designResult.engineering.waterRecovery ?? 95.2).toFixed(1)}%</strong> &nbsp;|&nbsp; 
                                Gross SEC: <strong>{Number(designResult.engineering.secElectricalGross ?? designResult.engineering.sec ?? 0).toFixed(3)} kWh/m³</strong>
                            </span>
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", fontSize: "11px" }}>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Feed TDS</span>
                            <strong style={{ fontSize: "12px", color: "#0F172A", fontFamily: "monospace" }}>
                                {baselineState.feedTds} mg/L
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Feed Flow</span>
                            <strong style={{ fontSize: "12px", color: "#0F172A", fontFamily: "monospace" }}>
                                {baselineState.feedFlow} L/min
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Target TDS</span>
                            <strong style={{ fontSize: "12px", color: "#15803D", fontFamily: "monospace" }}>
                                ≤ {baselineState.targetTds} mg/L
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Recovery Target</span>
                            <strong style={{ fontSize: "12px", color: "#0F172A", fontFamily: "monospace" }}>
                                ≥ {baselineState.targetRecovery}%
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Technology</span>
                            <strong style={{ fontSize: "12px", color: "#2563EB", fontFamily: "monospace" }}>
                                {baselineState.technology}
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Cell Pairs</span>
                            <strong style={{ fontSize: "12px", color: "#0F172A", fontFamily: "monospace" }}>
                                {baselineState.cellPairs} pairs
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Active Area</span>
                            <strong style={{ fontSize: "12px", color: "#0F172A", fontFamily: "monospace" }}>
                                {baselineState.electrodeArea} cm²
                            </strong>
                        </div>
                        <div style={{ background: "#FFFFFF", padding: "5px 7px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: "9.5px", color: "#64748B", display: "block", fontWeight: "600" }}>Cell Voltage</span>
                            <strong style={{ fontSize: "12px", color: "#0F172A", fontFamily: "monospace" }}>
                                {Number(baselineState.cellVoltage).toFixed(2)} V
                            </strong>
                        </div>
                    </div>
                </div>

                {/* PARAMETER TO VARY CARD */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "4px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #CBD5E1", paddingBottom: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            PARAMETER TO VARY
                        </span>
                        <span style={{ fontSize: "10px", color: "#64748B" }}>
                            Units update dynamically per selection
                        </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: "8px", fontSize: "11px" }}>
                        {/* Parameter Select */}
                        <div>
                            <label style={{ display: "block", color: "#475569", marginBottom: "2px", fontWeight: "600" }}>
                                Parameter
                            </label>
                            <select
                                value={selectedParam}
                                onChange={(e) => handleParamChange(e.target.value)}
                                style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11.5px", fontWeight: "700", background: "#FFFFFF", color: "#0F172A" }}
                            >
                                {Object.keys(SWEEP_PARAMETERS).map((paramName) => (
                                    <option key={paramName} value={paramName}>
                                        {paramName} ({SWEEP_PARAMETERS[paramName].unit})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* From with dynamic unit */}
                        <div>
                            <label style={{ display: "block", color: "#475569", marginBottom: "2px", fontWeight: "600" }}>
                                From ({currentUnit})
                            </label>
                            <input
                                type="number"
                                step={currentMeta.step || 1}
                                min="0.01"
                                value={fromVal}
                                onChange={(e) => setFromVal(Number(e.target.value))}
                                style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11.5px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                            />
                        </div>

                        {/* To with dynamic unit */}
                        <div>
                            <label style={{ display: "block", color: "#475569", marginBottom: "2px", fontWeight: "600" }}>
                                To ({currentUnit})
                            </label>
                            <input
                                type="number"
                                step={currentMeta.step || 1}
                                min="0.01"
                                value={toVal}
                                onChange={(e) => setToVal(Number(e.target.value))}
                                style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11.5px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                            />
                        </div>

                        {/* Number of Cases */}
                        <div>
                            <label style={{ display: "block", color: "#475569", marginBottom: "2px", fontWeight: "600" }}>
                                Number of Cases
                            </label>
                            <input
                                type="number"
                                min="2"
                                max="20"
                                value={caseCount}
                                onChange={(e) => setCaseCount(Math.max(2, Math.min(20, Number(e.target.value))))}
                                style={{ width: "100%", padding: "4px 6px", border: "1px solid #CBD5E1", borderRadius: "3px", fontSize: "11.5px", fontWeight: "700", fontFamily: "monospace", boxSizing: "border-box" }}
                            />
                        </div>
                    </div>

                    {/* Sweep Points Display & Action Button Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "10.5px", color: "#475569", fontWeight: "700" }}>Sweep Points:</span>
                            <span
                                title={sweepPointDisplay.fullList.join(", ")}
                                style={{
                                    fontSize: "11px",
                                    fontFamily: "monospace",
                                    fontWeight: "700",
                                    background: "#F1F5F9",
                                    color: isSweepValid ? "#0F172A" : "#64748B",
                                    border: "1px solid #CBD5E1",
                                    padding: "2px 8px",
                                    borderRadius: "3px"
                                }}
                            >
                                {sweepPointDisplay.formatted}
                            </span>
                        </div>

                        <button
                            onClick={handleRunAnalysis}
                            disabled={isRunning || !isSweepValid || validationErrors.length > 0}
                            style={{
                                background: (!isSweepValid || validationErrors.length > 0) ? "#94A3B8" : (isRunning ? "#475569" : "#0F172A"),
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "4px",
                                padding: "6px 14px",
                                fontSize: "11px",
                                fontWeight: "800",
                                cursor: (isRunning || !isSweepValid || validationErrors.length > 0) ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                letterSpacing: "0.02em"
                            }}
                        >
                            <span>▶</span>
                            <span>{isRunning ? `RUNNING SCENARIO ANALYSIS...` : "RUN SCENARIO ANALYSIS"}</span>
                        </button>
                    </div>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "3px", padding: "5px 8px", color: "#991B1B", fontSize: "10.5px" }}>
                            {validationErrors.map((err, i) => (
                                <div key={i}>⚠ {err}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. SCENARIO SUMMARY & BEST FEASIBLE CASE IN TESTED RANGE */}
            {analysisResult && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "12px" }}>
                    
                    {/* SUMMARY COUNTERS CARD */}
                    <div style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #E2E8F0", paddingBottom: "3px" }}>
                            SCENARIO SUMMARY
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", textAlign: "center" }}>
                            <div style={{ background: "#FFFFFF", padding: "8px 6px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                                <span style={{ fontSize: "9px", color: "#64748B", display: "block", fontWeight: "700", whiteSpace: "nowrap" }}>TOTAL CANDIDATE CASES</span>
                                <strong style={{ fontSize: "17px", color: "#0F172A", fontFamily: "monospace" }}>
                                    {analysisResult.summary.totalCandidateCases ?? analysisResult.summary.totalScenarios}
                                </strong>
                            </div>
                            <div style={{ background: "#F0FDF4", padding: "8px 6px", borderRadius: "3px", border: "1px solid #BBF7D0" }}>
                                <span style={{ fontSize: "9px", color: "#166534", display: "block", fontWeight: "700", whiteSpace: "nowrap" }}>FEASIBLE SCENARIOS</span>
                                <strong style={{ fontSize: "17px", color: "#15803D", fontFamily: "monospace" }}>
                                    {analysisResult.summary.feasibleCount}
                                </strong>
                            </div>
                        </div>

                        {/* Summary highlights */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "8px", fontSize: "11px", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "8px 10px", borderRadius: "3px" }}>
                            <div>
                                <span style={{ color: "#64748B", display: "block", fontSize: "9.5px", fontWeight: "600" }}>BEST CASE:</span>
                                <strong style={{ color: "#0F172A", fontFamily: "monospace", fontSize: "12px" }}>
                                    {analysisResult.summary.bestRegion?.bestCaseFormatted || analysisResult.summary.bestRegion?.bestScenarioId || "—"}
                                </strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748B", display: "block", fontSize: "9.5px", fontWeight: "600" }}>TESTED FEASIBLE RANGE:</span>
                                <strong style={{
                                    color: analysisResult.summary.bestRegion?.status === "FEASIBLE" ? "#15803D" : "#DC2626",
                                    fontFamily: "monospace",
                                    fontSize: "12px"
                                }}>
                                    {analysisResult.summary.bestRegion?.rangeFormatted || "None"}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* BEST FEASIBLE CASE / BEST OPERATING REGION CARD */}
                    <div style={{
                        background: analysisResult.summary.bestRegion?.isFeasibleFound ? "#F0FDF4" : "#FEF2F2",
                        border: `1px solid ${analysisResult.summary.bestRegion?.isFeasibleFound ? "#86EFAC" : "#FECACA"}`,
                        borderRadius: "4px",
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                    }}>
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                <span style={{
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    color: analysisResult.summary.bestRegion?.isFeasibleFound ? "#15803D" : "#991B1B",
                                    letterSpacing: "0.02em"
                                }}>
                                    {analysisResult.summary.bestRegion?.title || "BEST CASE"}
                                </span>
                                <span style={{
                                    fontSize: "10px",
                                    fontWeight: "700",
                                    color: analysisResult.summary.bestRegion?.isFeasibleFound ? "#15803D" : "#991B1B",
                                    background: analysisResult.summary.bestRegion?.isFeasibleFound ? "#DCFCE7" : "#FEE2E2",
                                    padding: "1px 6px",
                                    borderRadius: "2px"
                                }}>
                                    {analysisResult.summary.bestRegion?.bestCaseFormatted || analysisResult.summary.bestRegion?.bestParamFormatted}
                                </span>
                            </div>
                            <p style={{ fontSize: "11px", color: "#334155", margin: "2px 0 6px 0", lineHeight: "1.4" }}>
                                {analysisResult.summary.bestRegion?.rationale}
                            </p>
                        </div>

                        {analysisResult.summary.bestRegion?.isFeasibleFound ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px", fontSize: "10.5px", color: "#1E293B", borderTop: "1px solid #BBF7D0", paddingTop: "5px" }}>
                                <div>
                                    <span style={{ color: "#64748B", display: "block" }}>Parameter:</span>
                                    <strong style={{ fontFamily: "monospace" }}>{analysisResult.summary.bestRegion.bestParamFormatted}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748B", display: "block" }}>Technology:</span>
                                    <strong style={{ color: "#2563EB" }}>{analysisResult.summary.bestRegion.bestTechnology}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748B", display: "block" }}>Product TDS:</span>
                                    <strong style={{ color: "#15803D", fontFamily: "monospace" }}>{analysisResult.summary.bestRegion.bestOutletTds} mg/L</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748B", display: "block" }}>Recovery:</span>
                                    <strong style={{ fontFamily: "monospace" }}>{analysisResult.summary.bestRegion.bestRecovery}%</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748B", display: "block" }}>Gross SEC:</span>
                                    <strong style={{ color: "#1D4ED8", fontFamily: "monospace" }}>{analysisResult.summary.bestRegion.bestSec?.toFixed(3)} kWh/m³</strong>
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: "10.5px", color: "#991B1B", borderTop: "1px solid #FECACA", paddingTop: "4px" }}>
                                ⚠ {analysisResult.summary.bestRegion?.bestReason}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 5. SCENARIO RESULTS TABLE (11 COLUMNS AS SPECIFIED) */}
            {analysisResult && (
                <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "12px 14px", overflowX: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px", flexWrap: "wrap", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                SCENARIO RESULTS
                            </span>
                            <span style={{ fontSize: "10.5px", color: "#64748B" }}>
                                (Only successful scenarios are displayed — {analysisResult.scenarios.length} of {analysisResult.summary.totalCandidateCases ?? analysisResult.summary.totalScenarios} candidate cases discovered)
                            </span>
                        </div>
                        <span style={{ fontSize: "10px", color: "#64748B" }}>
                            Click any row to inspect inputs, mass balance residuals &amp; power diagnostics
                        </span>
                    </div>

                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}>
                        <thead>
                            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #CBD5E1", color: "#475569" }}>
                                <th style={{ padding: "6px 7px", fontWeight: "700" }}>SCENARIO</th>
                                <th style={{ padding: "6px 7px", fontWeight: "700" }}>PARAMETER</th>
                                <th style={{ padding: "6px 7px", fontWeight: "700" }}>TECHNOLOGY</th>
                                <th style={{ padding: "6px 7px", textAlign: "right", fontWeight: "700" }}>PRODUCT TDS</th>
                                <th style={{ padding: "6px 7px", textAlign: "right", fontWeight: "700" }}>RECOVERY</th>
                                <th style={{ padding: "6px 7px", textAlign: "right", fontWeight: "700" }}>SEC</th>
                                <th style={{ padding: "6px 7px", textAlign: "right", fontWeight: "700" }}>PRESSURE DROP</th>
                                <th style={{ padding: "6px 7px", textAlign: "center", fontWeight: "700" }}>MASS BALANCE</th>
                                <th style={{ padding: "6px 7px", textAlign: "center", fontWeight: "700" }}>SALT BALANCE</th>
                                <th style={{ padding: "6px 7px", textAlign: "center", fontWeight: "700" }}>OPERATING RANGE</th>
                                <th style={{ padding: "6px 7px", textAlign: "center", fontWeight: "700" }}>FEASIBILITY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analysisResult.scenarios.length === 0 ? (
                                <tr>
                                    <td colSpan="11" style={{ padding: "28px 14px", textAlign: "center", background: "#FEF2F2", color: "#991B1B" }}>
                                        <div style={{ fontWeight: "800", fontSize: "12px", marginBottom: "4px" }}>
                                            No feasible configurations discovered meeting target specifications.
                                        </div>
                                        <div style={{ fontSize: "10.5px", color: "#64748B" }}>
                                            All evaluated candidate cases violated engineering bounds or required pretreatment.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                analysisResult.scenarios.map((sc) => {
                                    const isExpanded = expandedScenarioId === sc.id;
                                    const isOptimal = analysisResult.summary.bestRegion?.bestScenarioId === sc.id && analysisResult.summary.bestRegion?.isFeasibleFound;
                                    const baselineParamKey = SWEEP_PARAMETERS[selectedParam]?.key;
                                    const isBaselineVal = baselineParamKey && sc.paramValue === Number(baselineState[baselineParamKey]);

                                    let badgeBg = "#DCFCE7";
                                    let badgeColor = "#15803D";
                                let badgeBorder = "#BBF7D0";

                                if (sc.feasibility === "FEASIBLE WITH WARNING") {
                                    badgeBg = "#FEF3C7";
                                    badgeColor = "#92400E";
                                    badgeBorder = "#FDE68A";
                                } else if (sc.feasibility === "NOT FEASIBLE") {
                                    badgeBg = "#FEE2E2";
                                    badgeColor = "#991B1B";
                                    badgeBorder = "#FECACA";
                                }

                                return (
                                    <React.Fragment key={sc.id}>
                                        <tr
                                            onClick={() => setExpandedScenarioId(isExpanded ? null : sc.id)}
                                            style={{
                                                borderBottom: "1px solid #F1F5F9",
                                                background: isOptimal ? "#F0FDF4" : (isExpanded ? "#F8FAFC" : "transparent"),
                                                cursor: "pointer",
                                                transition: "background 0.15s ease"
                                            }}
                                        >
                                            <td style={{ padding: "6px 7px", fontWeight: "700", fontFamily: "monospace", color: isOptimal ? "#15803D" : "#0F172A" }}>
                                                {sc.id} {isOptimal && "★"}
                                            </td>
                                            <td style={{ padding: "6px 7px", fontWeight: "700", fontFamily: "monospace" }}>
                                                {sc.paramFormatted}
                                                {isBaselineVal && (
                                                    <span style={{ marginLeft: "5px", fontSize: "8.5px", padding: "1px 4px", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: "2px", fontWeight: "700" }}>
                                                        BASELINE
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: "6px 7px" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                        <span style={{
                                                            fontWeight: "800",
                                                            color: sc.technology === "NONE" ? "#64748B" : "#1E40AF",
                                                            background: sc.technology === "NONE" ? "#F1F5F9" : "#EFF6FF",
                                                            border: `1px solid ${sc.technology === "NONE" ? "#CBD5E1" : "#BFDBFE"}`,
                                                            padding: "1px 5px",
                                                            borderRadius: "2px",
                                                            fontSize: "10px"
                                                        }}>
                                                            {sc.technology}
                                                        </span>
                                                        <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#15803D", background: "#DCFCE7", border: "1px solid #BBF7D0", padding: "0.5px 3px", borderRadius: "2px" }}>
                                                            BEST
                                                        </span>
                                                    </div>
                                                    {sc.feasibleTechnologies && sc.feasibleTechnologies.length > 1 && (
                                                        <span style={{ fontSize: "8.5px", color: "#059669", fontWeight: "600", whiteSpace: "nowrap" }} title={`Discovered feasible technologies: ${sc.feasibleTechnologies.join(", ")}`}>
                                                            ✓ Feasible: {sc.feasibleTechnologies.join(", ")}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: "6px 7px", textAlign: "right", fontFamily: "monospace", fontWeight: "700", color: sc.outletTds <= sc.targetTds ? "#15803D" : "#DC2626" }}>
                                                {sc.outletTds.toFixed(1)} mg/L
                                            </td>
                                            <td style={{ padding: "6px 7px", textAlign: "right", fontFamily: "monospace", fontWeight: "700", color: sc.recovery >= sc.targetRecovery ? "#0F172A" : "#DC2626" }}>
                                                {sc.recovery.toFixed(1)} %
                                            </td>
                                            <td style={{ padding: "6px 7px", textAlign: "right", fontFamily: "monospace", fontWeight: "700", color: "#1D4ED8" }}>
                                                {sc.sec.toFixed(3)} kWh/m³
                                            </td>
                                            <td style={{ padding: "6px 7px", textAlign: "right", fontFamily: "monospace", color: "#475569" }}>
                                                {sc.pressureDrop} Pa
                                            </td>
                                            <td style={{ padding: "6px 7px", textAlign: "center" }}>
                                                <span style={{ fontSize: "9.5px", fontWeight: "700", color: sc.massBalanceStatus === "CLOSED" ? "#15803D" : "#DC2626" }}>
                                                    {sc.massBalanceStatus === "CLOSED" ? "✓ CLOSED" : "✕ OPEN"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "6px 7px", textAlign: "center" }}>
                                                <span style={{ fontSize: "9.5px", fontWeight: "700", color: sc.saltBalanceStatus === "CLOSED" ? "#15803D" : "#DC2626" }}>
                                                    {sc.saltBalanceStatus === "CLOSED" ? "✓ CLOSED" : "✕ OPEN"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "6px 7px", textAlign: "center" }}>
                                                <span style={{
                                                    fontSize: "9px",
                                                    fontWeight: "700",
                                                    color: sc.operatingRange === "RECOMMENDED" ? "#15803D" : (sc.operatingRange === "EXTENDED RANGE" ? "#92400E" : "#64748B"),
                                                    background: sc.operatingRange === "RECOMMENDED" ? "#DCFCE7" : (sc.operatingRange === "EXTENDED RANGE" ? "#FEF3C7" : "#F1F5F9"),
                                                    padding: "1px 5px",
                                                    borderRadius: "2px"
                                                }}>
                                                    {sc.operatingRange}
                                                </span>
                                            </td>
                                            <td style={{ padding: "6px 7px", textAlign: "center" }}>
                                                <span style={{
                                                    fontSize: "9.5px",
                                                    fontWeight: "800",
                                                    padding: "2px 6px",
                                                    borderRadius: "2px",
                                                    background: badgeBg,
                                                    color: badgeColor,
                                                    border: `1px solid ${badgeBorder}`,
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {sc.feasibilityBadge}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* 6. EXPANDED SCENARIO DETAIL INSPECTION SECTION */}
                                        {isExpanded && (
                                            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #CBD5E1" }}>
                                                <td colSpan="11" style={{ padding: "10px 14px", fontSize: "11px", color: "#334155" }}>
                                                    <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "10px 12px" }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px", marginBottom: "8px" }}>
                                                            <strong style={{ fontSize: "11.5px", color: "#0F172A", textTransform: "uppercase" }}>
                                                                SCENARIO DETAIL INSPECTION — {sc.id} ({sc.paramFormatted})
                                                            </strong>
                                                            <span style={{ fontSize: "10px", color: "#64748B" }}>
                                                                Technology: <strong style={{ color: "#2563EB" }}>{sc.technology}</strong>
                                                            </span>
                                                        </div>

                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
                                                            {/* INPUTS */}
                                                            <div style={{ background: "#F8FAFC", padding: "6px 8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                                                                <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>
                                                                    INPUTS
                                                                </span>
                                                                <div style={{ fontSize: "10.5px", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "2px" }}>
                                                                    <div>Feed TDS: <strong>{sc.inputs.feedTds} mg/L</strong></div>
                                                                    <div>Feed Flow: <strong>{sc.inputs.feedFlow} L/min</strong></div>
                                                                    <div>Recovery: <strong>{sc.inputs.recovery}%</strong></div>
                                                                    <div>Voltage: <strong>{sc.inputs.cellVoltage} V</strong></div>
                                                                    <div>Cell Pairs: <strong>{sc.inputs.cellPairs}</strong></div>
                                                                    <div>Active Area: <strong>{sc.inputs.activeArea} cm²</strong></div>
                                                                    <div>Modules: <strong>{sc.inputs.modules ?? sc.modules ?? 1}</strong></div>
                                                                </div>
                                                            </div>

                                                            {/* OUTPUTS */}
                                                            <div style={{ background: "#F8FAFC", padding: "6px 8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                                                                <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>
                                                                    OUTPUTS
                                                                </span>
                                                                <div style={{ fontSize: "10.5px", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "2px" }}>
                                                                    <div>Product TDS: <strong style={{ color: sc.outputs.productTds <= sc.targetTds ? "#15803D" : "#DC2626" }}>{sc.outputs.productTds} mg/L</strong></div>
                                                                    <div>Product Flow: <strong>{sc.outputs.productFlow} L/min</strong></div>
                                                                    <div>Reject Flow: <strong>{sc.outputs.rejectFlow} L/min</strong></div>
                                                                    <div>Recovery: <strong>{sc.outputs.recovery}%</strong></div>
                                                                    <div>SEC: <strong style={{ color: "#1D4ED8" }}>{sc.outputs.sec} kWh/m³</strong></div>
                                                                    <div>Stack Power: <strong>{sc.outputs.stackPower} W</strong></div>
                                                                    <div>Pressure Drop: <strong>{sc.outputs.pressureDrop} Pa</strong></div>
                                                                </div>
                                                            </div>

                                                            {/* BALANCES */}
                                                            <div style={{ background: "#F8FAFC", padding: "6px 8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                                                                <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>
                                                                    BALANCES
                                                                </span>
                                                                <div style={{ fontSize: "10.5px", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "2px" }}>
                                                                    <div>Flow Residual: <strong>{sc.balances.flowResidual} L/min</strong></div>
                                                                    <div style={{ color: "#64748B", fontSize: "9.5px" }}>(target ≤ 0.005)</div>
                                                                    <div>Salt Residual: <strong>{sc.balances.saltResidual} g/s</strong></div>
                                                                    <div style={{ color: "#64748B", fontSize: "9.5px" }}>(target ≤ 0.001)</div>
                                                                    <div>Status: <strong style={{ color: sc.balances.balanceStatus === "CLOSED" ? "#15803D" : "#DC2626" }}>{sc.balances.balanceStatus}</strong></div>
                                                                </div>
                                                            </div>

                                                            {/* FEASIBILITY */}
                                                            <div style={{ background: "#F8FAFC", padding: "6px 8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                                                                <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>
                                                                    FEASIBILITY
                                                                </span>
                                                                <div style={{ fontSize: "10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                                                                    <div>TDS Target: <strong style={{ color: sc.feasibilityDetail.isTdsPass ? "#15803D" : "#DC2626" }}>{sc.feasibilityDetail.isTdsPass ? "PASS" : "FAIL"}</strong></div>
                                                                    <div>Recovery Target: <strong style={{ color: sc.feasibilityDetail.isRecPass ? "#15803D" : "#DC2626" }}>{sc.feasibilityDetail.isRecPass ? "PASS" : "FAIL"}</strong></div>
                                                                    <div>Operating Range: <strong>{sc.operatingRange}</strong></div>
                                                                    <div>Feasibility: <strong style={{ color: "#15803D" }}>{sc.feasibility}</strong></div>
                                                                </div>
                                                            </div>

                                                            {/* TECHNOLOGY & REASON */}
                                                            <div style={{ background: "#F8FAFC", padding: "6px 8px", borderRadius: "3px", border: "1px solid #E2E8F0" }}>
                                                                <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>
                                                                    TECHNOLOGY
                                                                </span>
                                                                <div style={{ fontSize: "10.5px", display: "flex", flexDirection: "column", gap: "3px" }}>
                                                                    <div>Technology: <strong style={{ color: "#2563EB" }}>{sc.technology}</strong></div>
                                                                    <div>Status: <strong>{sc.technologyDetail.recommendationStatus}</strong></div>
                                                                    <div style={{ fontSize: "9.5px", color: "#475569", marginTop: "2px", lineHeight: "1.3" }}>
                                                                        {sc.technologyDetail.reason}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* MULTI-TECHNOLOGY FEASIBILITY AUDIT SECTION */}
                                                        {sc.allEvaluatedTechs && sc.allEvaluatedTechs.length > 0 && (
                                                            <div style={{ marginTop: "10px", borderTop: "1px solid #E2E8F0", paddingTop: "8px" }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                                                    <span style={{ fontSize: "10px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                                                                        Multi-Technology Feasibility Audit (All 4 Registered Technologies Evaluated)
                                                                    </span>
                                                                    <span style={{ fontSize: "9.5px", color: "#64748B" }}>
                                                                        Feasible Technologies: <strong style={{ color: "#15803D" }}>{sc.feasibleTechSummary || sc.technology}</strong>
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                                                                    {sc.allEvaluatedTechs.map(ev => {
                                                                        const isWinner = ev.tech === sc.technology;
                                                                        return (
                                                                            <div key={ev.tech} style={{
                                                                                background: ev.isFeasible ? (isWinner ? "#EFF6FF" : "#F0FDF4") : "#F8FAFC",
                                                                                border: `1px solid ${ev.isFeasible ? (isWinner ? "#93C5FD" : "#BBF7D0") : "#E2E8F0"}`,
                                                                                borderRadius: "3px",
                                                                                padding: "6px 8px"
                                                                            }}>
                                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                                                                                    <strong style={{ fontSize: "11px", color: "#0F172A" }}>{ev.name || ev.tech}</strong>
                                                                                    <span style={{
                                                                                        fontSize: "8.5px",
                                                                                        fontWeight: "700",
                                                                                        padding: "1px 4px",
                                                                                        borderRadius: "2px",
                                                                                        background: ev.isFeasible ? "#DCFCE7" : "#FEE2E2",
                                                                                        color: ev.isFeasible ? "#15803D" : "#991B1B",
                                                                                        border: `1px solid ${ev.isFeasible ? "#BBF7D0" : "#FECACA"}`
                                                                                    }}>
                                                                                        {isWinner ? "SELECTED BEST" : (ev.isFeasible ? "FEASIBLE" : "INFEASIBLE")}
                                                                                    </span>
                                                                                </div>
                                                                                <div style={{ fontSize: "9.5px", color: "#475569", lineHeight: "1.3" }}>
                                                                                    {ev.isFeasible ? (
                                                                                        <div>
                                                                                            <div>Product TDS: <strong>{ev.outletTds?.toFixed(1)} mg/L</strong></div>
                                                                                            <div>Gross SEC: <strong>{ev.sec?.toFixed(3)} kWh/m³</strong></div>
                                                                                            <div style={{ color: "#15803D", marginTop: "2px" }}>✓ Meets all targets</div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div style={{ color: "#64748B" }}>
                                                                                            {ev.reason}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            }))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 6. COMPARISON VISUALIZATION (CHART WITH FEASIBILITY DOTS) */}
            {analysisResult && chartData.length > 0 && (
                <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                COMPARISON VISUALIZATION
                            </h3>
                            <span style={{ fontSize: "10.5px", color: "#64748B" }}>
                                (X-Axis: {selectedParam} ({currentUnit}) vs Y-Axis: {METRIC_CONFIG[selectedMetric]?.label} ({METRIC_CONFIG[selectedMetric]?.unit}))
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", marginLeft: "8px" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16A34A", display: "inline-block" }}></span>
                                    <span style={{ fontWeight: "700", color: "#166534" }}>Feasible (Recommended)</span>
                                </span>
                            </div>
                        </div>

                        {/* Switchable Metric Dropdown (including Product Flow) */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <label style={{ fontSize: "11px", color: "#475569", fontWeight: "600" }}>Plot Output Metric:</label>
                            <select
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value)}
                                style={{
                                    padding: "3px 8px",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "3px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    background: "#FFFFFF",
                                    color: "#0F172A"
                                }}
                            >
                                <option value="outletTds">Product TDS (mg/L)</option>
                                <option value="recovery">Water Recovery (%)</option>
                                <option value="sec">Gross SEC (kWh/m³)</option>
                                <option value="pressureDrop">Channel ΔP (Pa)</option>
                                <option value="power">Stack Active Power (W)</option>
                                <option value="productFlow">Product Flow (L/min)</option>
                            </select>
                        </div>
                    </div>

                    {/* Recharts Container */}
                    <div style={{ width: "100%", height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 15, right: 35, left: 20, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="paramValue"
                                    tick={{ fill: "#475569", fontSize: 10.5 }}
                                    unit={` ${currentUnit}`}
                                    label={{
                                        value: `${selectedParam} (${currentUnit})`,
                                        position: "insideBottom",
                                        offset: -12,
                                        fill: "#0F172A",
                                        fontSize: 11,
                                        fontWeight: 700
                                    }}
                                />
                                <YAxis
                                    tick={{ fill: "#475569", fontSize: 10.5 }}
                                    unit={` ${METRIC_CONFIG[selectedMetric]?.unit}`}
                                    domain={["auto", "auto"]}
                                    label={{
                                        value: `${METRIC_CONFIG[selectedMetric]?.label} (${METRIC_CONFIG[selectedMetric]?.unit})`,
                                        angle: -90,
                                        position: "insideLeft",
                                        offset: 5,
                                        fill: "#0F172A",
                                        fontSize: 11,
                                        fontWeight: 700
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#0F172A",
                                        border: "1px solid #334155",
                                        borderRadius: "4px",
                                        color: "#FFFFFF",
                                        fontSize: "11px"
                                    }}
                                    formatter={(value) => [`${value} ${METRIC_CONFIG[selectedMetric]?.unit}`, METRIC_CONFIG[selectedMetric]?.label]}
                                    labelFormatter={(label) => `${selectedParam}: ${label} ${currentUnit}`}
                                />
                                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                                {METRIC_CONFIG[selectedMetric]?.refVal !== null && METRIC_CONFIG[selectedMetric]?.refVal !== undefined && (
                                    <ReferenceLine
                                        y={METRIC_CONFIG[selectedMetric].refVal}
                                        stroke="#DC2626"
                                        strokeDasharray="4 4"
                                        label={{
                                            value: METRIC_CONFIG[selectedMetric].refLabel,
                                            fill: "#DC2626",
                                            fontSize: 10.5,
                                            fontWeight: 700,
                                            position: "insideTopLeft",
                                            offset: 10
                                        }}
                                    />
                                )}
                                <Line
                                    type="monotone"
                                    dataKey={selectedMetric}
                                    name={METRIC_CONFIG[selectedMetric]?.label}
                                    stroke={METRIC_CONFIG[selectedMetric]?.color || "#2563EB"}
                                    strokeWidth={2.5}
                                    dot={renderFeasibilityDot}
                                    activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {!analysisResult && (
                <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: "4px", padding: "28px 16px", textAlign: "center", color: "#64748B" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "4px" }}>
                        {isDesignActive ? "Scenario Analysis Ready" : "Awaiting Design Generation"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>
                        {isDesignActive
                            ? 'Configure parameters above and click "RUN SCENARIO ANALYSIS" to evaluate parameter sensitivity.'
                            : 'Enter feed water design basis and click "GENERATE DESIGN" in the sidebar to run design exploration.'}
                    </div>
                </div>
            )}
        </section>
    );
}
