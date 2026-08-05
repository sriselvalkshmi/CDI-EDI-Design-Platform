import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import CalculationTraceabilityModal from "./engineering/CalculationTraceabilityModal";
import { Calculator, Info } from "lucide-react";

export default function KPIDashboard() {
    const { designResult, feedWater, optimizationInputs } = useApp();
    const [selectedTraceParam, setSelectedTraceParam] = useState(null);

    const format = (value, digits = 2) => {
        if (value === undefined || value === null || isNaN(value)) {
            return "N/A";
        }
        return Number(value).toFixed(digits);
    };

    if (!designResult || !designResult.kpi || designResult.kpi.outletTDS == null) {
        return (
            <div className="panel">
                <h3 className="panel-title">Key Performance Indicators</h3>
                <p style={{ color: "#6B7280", fontSize: "14px", margin: "10px 0 0 0" }}>Generate a design to calculate KPIs.</p>
            </div>
        );
    }

    const processOverall = designResult?.process?.overall || {};
    const engineering = designResult?.engineering || {};
    const kpi = designResult?.kpi || {};

    const outletTDS = format(processOverall?.outletTDS ?? kpi?.outletTDS);
    const removalEff = format(processOverall?.removalEfficiency ?? kpi?.removalEfficiency);
    const power = format(processOverall?.totalPower ?? engineering?.power ?? kpi?.power);
    const sec = format(processOverall?.sec ?? kpi?.SEC, 4);
    const flowVel = format(engineering?.flowVelocity ?? kpi?.flowVelocity, 3);
    const pressDrop = format(engineering?.pressureDrop ?? kpi?.pressureDrop, 1);
    const activeTech = processOverall?.recommendedProcess || processOverall?.technology || engineering?.technology || "CDI";

    const openTrace = (paramKey) => {
        let traceConfig = {
            title: "Outlet TDS",
            symbol: "C_out",
            value: outletTDS,
            unit: "ppm",
            equation: "C_out = C_in * (1 - η_removal / 100)",
            description: "Final desalinated product water total dissolved solids concentration.",
            inputs: [
                { name: "Inlet Feed TDS", symbol: "C_in", value: `${feedWater.tds || 500}`, unit: "ppm" },
                { name: "Salt Removal Efficiency", symbol: "η_removal", value: `${removalEff}`, unit: "%" }
            ],
            steps: [
                `Extract feed water salinity C_in = ${feedWater.tds || 500} ppm.`,
                `Apply electrosorption & ion-exchange kinetic model: η_removal = ${removalEff}%.`,
                `Compute product concentration C_out = ${feedWater.tds || 500} * (1 - ${removalEff}/100) = ${outletTDS} ppm.`
            ],
            sourceModule: "performanceCalculator.js & engineeringEquationEngine.js"
        };

        if (paramKey === "power") {
            traceConfig = {
                title: "Power Consumption & Pump Derivation",
                symbol: "P_total",
                value: power,
                unit: "W",
                equation: "P_total = P_dc + P_pump = (V_cell * I_cell) + (Q * ΔP / η_pump)",
                description: "Total electrical power drawn by stack rectifiers and hydraulic booster pump.",
                inputs: [
                    { name: "Stack Terminal Voltage", symbol: "V_cell", value: `${optimizationInputs.voltage || 1.2}`, unit: "V" },
                    { name: "Faraday Operating Current", symbol: "I_cell", value: `${engineering.current || optimizationInputs.current || 15.0}`, unit: "A" },
                    { name: "Hydraulic Pump Motor Rating", symbol: "P_motor", value: `${engineering.pumpPowerKw || 0.40}`, unit: "kW" }
                ],
                steps: [
                    `Compute Faraday stack DC power: P_dc = ${optimizationInputs.voltage || 1.2} V * ${engineering.current || 15.0} A = ${(Number(optimizationInputs.voltage || 1.2) * Number(engineering.current || 15.0)).toFixed(2)} W.`,
                    `Compute hydraulic fluid power: P_hyd = Q * ΔP = ${((feedWater.flowRate || 10) / 60000).toFixed(5)} m³/s * ${pressDrop} Pa = ${(engineering.hydraulicPowerWatts || 0.10).toFixed(2)} W.`,
                    `Compute pump shaft & motor power: P_motor = P_hyd / (η_pump * η_motor) = ${(engineering.motorPowerKw || 0.40)} kW.`,
                    `Sum total system power requirement P_total = ${power} W.`
                ],
                sourceModule: "stackDesigner.js & engineeringEquationEngine.js"
            };
        } else if (paramKey === "sec") {
            traceConfig = {
                title: "Specific Energy Consumption",
                symbol: "SEC",
                value: sec,
                unit: "kWh/m³",
                equation: "SEC = (P_total / 1000) / Q_product_m3h",
                description: "Electrical energy required per cubic meter of desalinated product water produced.",
                inputs: [
                    { name: "Total Power Draw", symbol: "P_total", value: `${power}`, unit: "W" },
                    { name: "Product Flow Rate", symbol: "Q_product", value: `${feedWater.flowRate || 10}`, unit: "L/min" }
                ],
                steps: [
                    `Convert flow rate Q = ${(feedWater.flowRate || 10)} L/min to m³/h (Q_m3h = ${((feedWater.flowRate || 10) * 0.06).toFixed(2)} m³/h).`,
                    `Calculate specific energy index SEC = (${power} / 1000) / ${((feedWater.flowRate || 10) * 0.06).toFixed(2)} = ${sec} kWh/m³.`
                ],
                sourceModule: "performanceCalculator.js & economicsEngine.js"
            };
        } else if (paramKey === "removal") {
            traceConfig = {
                title: "Removal Efficiency",
                symbol: "η_removal",
                value: `${removalEff}`,
                unit: "%",
                equation: "η = ((C_in - C_out) / C_in) * 100%",
                description: "Percentage of total dissolved ions removed from the feed water stream.",
                inputs: [
                    { name: "Inlet TDS", symbol: "C_in", value: `${feedWater.tds || 500}`, unit: "ppm" },
                    { name: "Outlet TDS", symbol: "C_out", value: `${outletTDS}`, unit: "ppm" }
                ],
                steps: [
                    `Compute ion mass delta: C_in - C_out = ${(feedWater.tds || 500) - parseFloat(outletTDS)} ppm.`,
                    `Normalize over feed concentration: η = (${(feedWater.tds || 500) - parseFloat(outletTDS)} / ${feedWater.tds || 500}) * 100% = ${removalEff}%.`
                ],
                sourceModule: "performanceCalculator.js"
            };
        } else if (paramKey === "velocity") {
            traceConfig = {
                title: "Flow Velocity",
                symbol: "v_flow",
                value: flowVel,
                unit: "m/s",
                equation: "v = Q / (N_channels * A_channel)",
                description: "Average linear water flow velocity inside cell spacer channels.",
                inputs: [
                    { name: "Volumetric Flow Rate", symbol: "Q", value: `${feedWater.flowRate || 10}`, unit: "L/min" },
                    { name: "Number of Cell Channels", symbol: "N_channels", value: `${optimizationInputs.cellPairs || 36}`, unit: "channels" }
                ],
                steps: [
                    `Compute cross-sectional channel flow area A_channel.`,
                    `Divide flow rate by total flow area to get linear channel velocity v = ${flowVel} m/s.`
                ],
                sourceModule: "componentSizing.js & layoutGenerator.js"
            };
        } else if (paramKey === "pressure") {
            traceConfig = {
                title: "Hydraulic Pressure Drop (Darcy-Weisbach & Ergun)",
                symbol: "ΔP",
                value: pressDrop,
                unit: "Pa",
                equation: "ΔP = f * (L / D_h) * (ρ * v^2 / 2)",
                description: "Frictional pressure head loss across packed spacer mesh.",
                inputs: [
                    { name: "Flow Velocity", symbol: "v", value: `${flowVel}`, unit: "m/s" },
                    { name: "Hydraulic Diameter", symbol: "D_h", value: `${engineering.hydraulicDiameter || 0.0012}`, unit: "m" },
                    { name: "Reynolds Number", symbol: "Re", value: `${engineering.reynoldsNumber || 14.5}`, unit: "dimensionless" },
                    { name: "Ergun Friction Factor", symbol: "f", value: `${engineering.darcyFrictionFactor || 0.045}`, unit: "dimensionless" }
                ],
                steps: [
                    `Evaluate Hydraulic Diameter: D_h = 2 * (w * d) / (w + d) = ${engineering.hydraulicDiameter || 0.0012} m.`,
                    `Compute Reynolds Number: Re = (ρ * v * D_h) / μ = ${engineering.reynoldsNumber || 14.5} (${engineering.flowRegime || "Laminar"}).`,
                    `Evaluate Ergun Friction Factor: f = 150/Re + 1.75 = ${engineering.darcyFrictionFactor || 0.045}.`,
                    `Calculate Darcy-Weisbach head loss: ΔP = f * (L/D_h) * (ρ v^2 / 2) = ${pressDrop} Pa.`
                ],
                sourceModule: "engineeringEquationEngine.js & hydrodynamicEngine.js"
            };
        }

        setSelectedTraceParam(traceConfig);
    };

    return (
        <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 className="panel-title" style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1F2937" }}>Key Performance Indicators</h3>
                <span style={{ fontSize: "12px", background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: "12px", fontWeight: "600" }}>● {activeTech} System</span>
            </div>

            <div className="kpi-grid-container" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {/* Card 1: Outlet TDS & Product Water Quality */}
                <div className="kpi-card" onClick={() => openTrace("tds")} style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px", cursor: "pointer", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>Outlet TDS / Quality</div>
                        <Calculator size={14} color="#3B82F6" />
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#1F2937", marginTop: "4px" }}>
                        {outletTDS} <span style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280" }}>ppm</span>
                        {activeTech.includes("EDI") && (
                            <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#2563EB", display: "block", marginTop: "2px" }}>
                                {Number(outletTDS) <= 0.03 
                                    ? "(18.2 MΩ·cm Ultrapure)" 
                                    : `(${ (Number(outletTDS) / 0.65).toFixed(1) } µS/cm, ${ (0.65 / Math.max(0.001, Number(outletTDS))).toFixed(3) } MΩ·cm)`}
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: "11px", color: "#16A34A", marginTop: "4px", fontWeight: "600" }}>↓ {removalEff}% Removal (Inspect Formula)</div>
                </div>

                {/* Card 2: Power Consumption */}
                <div className="kpi-card" onClick={() => openTrace("power")} style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>Power Consumption</div>
                        <Calculator size={14} color="#3B82F6" />
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937", marginTop: "4px" }}>{power} <span style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280" }}>W</span></div>
                    <div style={{ fontSize: "11px", color: "#2563EB", marginTop: "4px" }}>P = V × I + P_pump (Inspect Formula)</div>
                </div>

                {/* Card 3: Specific Energy */}
                <div className="kpi-card" onClick={() => openTrace("sec")} style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>Specific Energy</div>
                        <Calculator size={14} color="#3B82F6" />
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937", marginTop: "4px" }}>{sec} <span style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280" }}>kWh/m³</span></div>
                    <div style={{ fontSize: "11px", color: "#2563EB", marginTop: "4px" }}>SEC Index (Inspect Formula)</div>
                </div>

                {/* Card 4: Removal Efficiency */}
                <div className="kpi-card" onClick={() => openTrace("removal")} style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>Removal Efficiency</div>
                        <Calculator size={14} color="#3B82F6" />
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937", marginTop: "4px" }}>{removalEff}%</div>
                    <div style={{ fontSize: "11px", color: "#16A34A", marginTop: "4px" }}>((Cin-Cout)/Cin)×100 (Inspect)</div>
                </div>

                {/* Card 5: Flow Velocity */}
                <div className="kpi-card" onClick={() => openTrace("velocity")} style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>Flow Velocity</div>
                        <Calculator size={14} color="#3B82F6" />
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937", marginTop: "4px" }}>{flowVel} <span style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280" }}>m/s</span></div>
                    <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>v = Q / A (Inspect Formula)</div>
                </div>

                {/* Card 6: Pressure Drop */}
                <div className="kpi-card" onClick={() => openTrace("pressure")} style={{ background: "#FFFFFF", border: "1px solid #D9E2EC", borderRadius: "8px", padding: "12px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "500" }}>Pressure Drop</div>
                        <Calculator size={14} color="#3B82F6" />
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#1F2937", marginTop: "4px" }}>{pressDrop} <span style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280" }}>Pa</span></div>
                    <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>Darcy-Weisbach Re (Inspect)</div>
                </div>
            </div>

            {/* Formula & Calculation Traceability Modal */}
            <CalculationTraceabilityModal
                paramData={selectedTraceParam}
                onClose={() => setSelectedTraceParam(null)}
            />
        </div>
    );
}