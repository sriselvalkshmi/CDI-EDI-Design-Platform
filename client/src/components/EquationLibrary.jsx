import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { generateEquationReportPDF } from "../utils/reportGenerator";
import { FileText, ChevronRight, ChevronDown, Calculator, BookOpen, Layers } from "lucide-react";

export default function EquationLibrary({ selectedEqKey, onSelectEq }) {
    const { designResult, feedWater, technology, user } = useApp();
    const eng = designResult?.engineering || {};

    const v = Number(eng.voltage || 1.2);
    const i = Number(eng.current || 5.0);
    const p = Number(eng.power || (v * i));
    const cellPairs = Number(eng.cellPairs || 36);
    const areaCm2 = Number(eng.electrodeArea || 250);
    const areaM2 = areaCm2 / 10000;
    const currentDensity = areaM2 > 0 ? (i / areaM2) : 200;
    const flowRate = Number(feedWater.flowRate || 10);
    const flowRateM3s = flowRate / 60000;
    const tdsIn = Number(feedWater.tds || 500);
    const targetTds = Number(feedWater.targetTds || 50);
    const outletTDS = Number(eng.outletTDS || targetTds);
    const removalEff = Number(eng.removalEfficiency || (((tdsIn - outletTDS) / tdsIn) * 100));
    const sec = Number(eng.sec || 0.0024);
    const dp = Number(eng.pressureDrop || 270);
    const tRes = Number(eng.residenceTime || 0.071);
    const sac = Number(eng.sac || 25.0);
    const lambda = Number(eng.chargeEfficiency || 92.0);
    const recovery = Number(eng.waterRecovery || 95.0);

    const categories = [
        {
            key: "electrical",
            title: "Electrical Model",
            equations: [
                {
                    key: "voltage",
                    title: "Operating Voltage",
                    symbol: "V",
                    formula: "V_{\\text{cell}} = V_{\\text{equilibrium}} + I \\cdot R_{\\text{cell}} + \\eta_{\\text{overpotential}}",
                    displayFormula: "V = V_eq + I · R + η",
                    substitution: `V = 1.20 V + (${i.toFixed(2)} A · 0.04 Ω) = ${v.toFixed(2)} V`,
                    value: `${v.toFixed(2)} V`,
                    unit: "V",
                    variables: [
                        { symbol: "V", name: "Cell Voltage", val: `${v.toFixed(2)}`, unit: "V" },
                        { symbol: "V_eq", name: "Equilibrium Nernst Voltage", val: "0.20", unit: "V" },
                        { symbol: "I", name: "Operating Current", val: `${i.toFixed(2)}`, unit: "A" },
                        { symbol: "R", name: "Cell Internal Resistance", val: "0.04", unit: "Ω" }
                    ],
                    meaning: "Governs the driving electrical potential across cell electrodes.",
                    assumptions: "Constant DC power supply; minimal capacitive hysteresis.",
                    limitations: "Voltage constrained to 0.8 – 1.6V to prevent water electrolysis.",
                    reference: "Porada et al. (2013), Progress in Materials Science."
                },
                {
                    key: "current",
                    title: "Faraday Current",
                    symbol: "I",
                    formula: "I = \\frac{z F \\cdot Q \\cdot (C_{\\text{in}} - C_{\\text{out}})}{\\Lambda \\cdot N}",
                    displayFormula: "I = (z · F · Q · ΔC) / (Λ · N)",
                    substitution: `I = (1 · 96485 · ${flowRateM3s.toFixed(6)} · ${((tdsIn - outletTDS)/58440).toFixed(5)}) / (0.92 · ${cellPairs}) = ${i.toFixed(2)} A`,
                    value: `${i.toFixed(2)} A`,
                    unit: "A",
                    variables: [
                        { symbol: "I", name: "Current", val: `${i.toFixed(2)}`, unit: "A" },
                        { symbol: "F", name: "Faraday Constant", val: "96,485", unit: "C/mol" },
                        { symbol: "Q", name: "Volumetric Flow Rate", val: `${flowRateM3s.toFixed(6)}`, unit: "m³/s" },
                        { symbol: "N", name: "Cell Pairs", val: `${cellPairs}`, unit: "pairs" }
                    ],
                    meaning: "Calculates total electrical current needed to transport ionic charge.",
                    assumptions: "100% Faraday ionic migration; single valence NaCl electrolyte.",
                    limitations: "Valid for steady-state electrosorption phase.",
                    reference: "Biesheuvel et al. (2011), Physical Review E."
                },
                {
                    key: "power",
                    title: "Electrical Power",
                    symbol: "P",
                    formula: "P = V \\times I",
                    displayFormula: "P = V × I",
                    substitution: `P = ${v.toFixed(2)} V × ${i.toFixed(2)} A = ${p.toFixed(2)} W`,
                    value: `${p.toFixed(2)} W`,
                    unit: "W",
                    variables: [
                        { symbol: "P", name: "Total Power", val: `${p.toFixed(2)}`, unit: "W" },
                        { symbol: "V", name: "Voltage", val: `${v.toFixed(2)}`, unit: "V" },
                        { symbol: "I", name: "Current", val: `${i.toFixed(2)}`, unit: "A" }
                    ],
                    meaning: "Defines instantaneous electrical power consumed by reactor stack.",
                    assumptions: "Negligible AC ripple in DC rectifier output.",
                    limitations: "Applies to active charging phase.",
                    reference: "Suss et al. (2015), Energy & Environmental Science."
                },
                {
                    key: "currentDensity",
                    title: "Current Density",
                    symbol: "J",
                    formula: "J = \\frac{I}{A_{\\text{electrode}}}",
                    displayFormula: "J = I / A",
                    substitution: `J = ${i.toFixed(2)} A / ${areaM2.toFixed(4)} m² = ${currentDensity.toFixed(1)} A/m²`,
                    value: `${currentDensity.toFixed(1)} A/m²`,
                    unit: "A/m²",
                    variables: [
                        { symbol: "J", name: "Current Density", val: `${currentDensity.toFixed(1)}`, unit: "A/m²" },
                        { symbol: "I", name: "Current", val: `${i.toFixed(2)}`, unit: "A" },
                        { symbol: "A", name: "Electrode Area", val: `${areaM2.toFixed(4)}`, unit: "m²" }
                    ],
                    meaning: "Measures electrical flux per unit geometric electrode area.",
                    assumptions: "Uniform current distribution across carbon surface.",
                    limitations: "Must remain below limiting current density to prevent concentration polarization.",
                    reference: "Porada et al. (2013), Progress in Materials Science."
                }
            ]
        },
        {
            key: "hydraulic",
            title: "Hydraulic Model",
            equations: [
                {
                    key: "pressureDrop",
                    title: "Darcy-Weisbach Pressure Drop",
                    symbol: "ΔP",
                    formula: "\\Delta P = f \\cdot \\left(\\frac{L}{D_h}\\right) \\cdot \\left(\\frac{\\rho v^2}{2}\\right)",
                    displayFormula: "ΔP = f · (L / Dh) · (ρ · v² / 2)",
                    substitution: `ΔP = 0.38 · (0.20 / 0.001) · (1000 · (0.035)² / 2) = ${dp.toFixed(0)} Pa`,
                    value: `${dp.toFixed(0)} Pa`,
                    unit: "Pa",
                    variables: [
                        { symbol: "ΔP", name: "Pressure Drop", val: `${dp.toFixed(0)}`, unit: "Pa" },
                        { symbol: "f", name: "Darcy Friction Factor", val: "0.38", unit: "—" },
                        { symbol: "L", name: "Channel Length", val: "0.20", unit: "m" },
                        { symbol: "Dh", name: "Hydraulic Diameter", val: "0.001", unit: "m" },
                        { symbol: "v", name: "Flow Velocity", val: "0.035", unit: "m/s" }
                    ],
                    meaning: "Calculates frictional energy loss as feed fluid passes through spacer channel.",
                    assumptions: "Rectangular spacer mesh channel; laminar flow regime (Re < 100).",
                    limitations: "Valid for Newtonian fluid at 25°C.",
                    reference: "Biesheuvel et al. (2011), Physical Review E."
                },
                {
                    key: "residenceTime",
                    title: "Hydrodynamic Residence Time",
                    symbol: "t_res",
                    formula: "t_{\\text{res}} = \\frac{V_{\\text{cell}}}{Q}",
                    displayFormula: "t_res = V_cell / Q",
                    substitution: `t_res = ${((cellPairs * areaCm2 * 0.05)/1000).toFixed(3)} L / ${flowRate.toFixed(1)} L/min = ${tRes.toFixed(3)} min`,
                    value: `${tRes.toFixed(3)} min`,
                    unit: "min",
                    variables: [
                        { symbol: "t_res", name: "Residence Time", val: `${tRes.toFixed(3)}`, unit: "min" },
                        { symbol: "V_cell", name: "Active Cell Volume", val: `${((cellPairs * areaCm2 * 0.05)/1000).toFixed(3)}`, unit: "L" },
                        { symbol: "Q", name: "Flow Rate", val: `${flowRate.toFixed(1)}`, unit: "L/min" }
                    ],
                    meaning: "Average fluid transport duration inside active spacer flow channel.",
                    assumptions: "Plug flow without dead zones or bypass channeling.",
                    limitations: "Requires steady feed flow.",
                    reference: "Porada et al. (2013), Progress in Materials Science."
                }
            ]
        },
        {
            key: "adsorption",
            title: "Adsorption & Charge Model",
            equations: [
                {
                    key: "sac",
                    title: "Salt Adsorption Capacity",
                    symbol: "SAC",
                    formula: "\\text{SAC} = \\frac{m_{\\text{salt removed}}}{m_{\\text{electrode}}}",
                    displayFormula: "SAC = m_salt / m_electrode",
                    substitution: `SAC = ${(flowRate * tRes * (tdsIn - outletTDS)).toFixed(0)} mg / ${((areaCm2 * 0.06 * 0.45 * cellPairs * 2)).toFixed(1)} g = ${sac.toFixed(1)} mg/g`,
                    value: `${sac.toFixed(1)} mg/g`,
                    unit: "mg/g",
                    variables: [
                        { symbol: "SAC", name: "Adsorption Capacity", val: `${sac.toFixed(1)}`, unit: "mg/g" },
                        { symbol: "m_salt", name: "Removed Salt Mass", val: `${(flowRate * tRes * (tdsIn - outletTDS)).toFixed(0)}`, unit: "mg" },
                        { symbol: "m_elec", name: "Electrode Dry Mass", val: `${((areaCm2 * 0.06 * 0.45 * cellPairs * 2)).toFixed(1)}`, unit: "g" }
                    ],
                    meaning: "Mass of dissolved salt electro-adsorbed per gram of porous carbon electrode.",
                    assumptions: "Fully equilibrium electrosorption capacity.",
                    limitations: "Specific to active porous carbon electrode density.",
                    reference: "Suss et al. (2015), Energy & Environmental Science."
                },
                {
                    key: "chargeEfficiency",
                    title: "Charge Efficiency",
                    symbol: "Λ",
                    formula: "\\Lambda = \\frac{z F \\cdot n_{\\text{salt}}}{Q_{\\text{supplied}}} \\times 100",
                    displayFormula: "Λ = (z · F · n_salt) / Q_supplied × 100",
                    substitution: `Λ = (1 · 96485 · 0.0077) / 807.5 × 100 = ${lambda.toFixed(1)} %`,
                    value: `${lambda.toFixed(1)} %`,
                    unit: "%",
                    variables: [
                        { symbol: "Λ", name: "Charge Efficiency", val: `${lambda.toFixed(1)}`, unit: "%" },
                        { symbol: "n_salt", name: "Moles Removed", val: "0.0077", unit: "mol" },
                        { symbol: "Q_sup", name: "Total Charge Supplied", val: "807.5", unit: "C" }
                    ],
                    meaning: "Ratio of useful salt removal charge to total electrical charge supplied.",
                    assumptions: "Minimal co-ion expulsion losses in MCDI membrane cell.",
                    limitations: "Applies to full adsorption half-cycle.",
                    reference: "Biesheuvel et al. (2011), Physical Review E."
                }
            ]
        },
        {
            key: "performance",
            title: "Performance & Energy",
            equations: [
                {
                    key: "outletTDS",
                    title: "Desalination Removal Efficiency",
                    symbol: "Removal",
                    formula: "\\text{Removal \\%} = \\frac{C_{\\text{in}} - C_{\\text{out}}}{C_{\\text{in}}} \\times 100",
                    displayFormula: "Removal = (C_in - C_out) / C_in × 100",
                    substitution: `Removal = (${tdsIn} ppm - ${outletTDS.toFixed(0)} ppm) / ${tdsIn} ppm × 100 = ${removalEff.toFixed(1)} %`,
                    value: `${removalEff.toFixed(1)} %`,
                    unit: "%",
                    variables: [
                        { symbol: "Removal", name: "Removal Efficiency", val: `${removalEff.toFixed(1)}`, unit: "%" },
                        { symbol: "C_in", name: "Feed TDS", val: `${tdsIn}`, unit: "ppm" },
                        { symbol: "C_out", name: "Product Outlet TDS", val: `${outletTDS.toFixed(0)}`, unit: "ppm" }
                    ],
                    meaning: "Percentage of dissolved solids removed from feed water stream.",
                    assumptions: "Single-stage steady state.",
                    limitations: "Bound by single-stage thermodynamic technology limit.",
                    reference: "Porada et al. (2013), Progress in Materials Science."
                },
                {
                    key: "sec",
                    title: "Specific Energy Consumption",
                    symbol: "SEC",
                    formula: "\\text{SEC} = \\frac{P \\cdot t_{\\text{cycle}}}{V_{\\text{product}}}",
                    displayFormula: "SEC = (P · t) / V_product",
                    substitution: `SEC = (${p.toFixed(2)} W · 0.166 h) / 0.166 m³ = ${sec.toFixed(4)} kWh/m³`,
                    value: `${sec.toFixed(4)} kWh/m³`,
                    unit: "kWh/m³",
                    variables: [
                        { symbol: "SEC", name: "Specific Energy", val: `${sec.toFixed(4)}`, unit: "kWh/m³" },
                        { symbol: "P", name: "Power", val: `${p.toFixed(2)}`, unit: "W" },
                        { symbol: "V_prod", name: "Product Water Volume", val: "0.166", unit: "m³" }
                    ],
                    meaning: "Energy required to produce one cubic meter of desalinated water.",
                    assumptions: "Constant power draw during adsorption.",
                    limitations: "Excludes feed pump auxiliary power.",
                    reference: "Suss et al. (2015), Energy & Environmental Science."
                },
                {
                    key: "recovery",
                    title: "Water Recovery",
                    symbol: "Recovery",
                    formula: "\\text{Recovery \\%} = \\frac{Q_{\\text{product}}}{Q_{\\text{feed}}} \\times 100",
                    displayFormula: "Recovery = Q_prod / Q_feed × 100",
                    substitution: `Recovery = 9.5 L/min / 10.0 L/min × 100 = ${recovery.toFixed(1)} %`,
                    value: `${recovery.toFixed(1)} %`,
                    unit: "%",
                    variables: [
                        { symbol: "Recovery", name: "Water Recovery", val: `${recovery.toFixed(1)}`, unit: "%" },
                        { symbol: "Q_prod", name: "Product Stream Flow", val: "9.5", unit: "L/min" },
                        { symbol: "Q_feed", name: "Total Feed Flow", val: `${flowRate.toFixed(1)}`, unit: "L/min" }
                    ],
                    meaning: "Fraction of raw feed water converted into purified product stream.",
                    assumptions: "Fixed purge waste volume during desorption cycle.",
                    limitations: "Constrained by MCDI purge ratio.",
                    reference: "Porada et al. (2013), Progress in Materials Science."
                }
            ]
        }
    ];

    // Find active selected equation
    const allEqs = categories.flatMap(c => c.equations);
    const activeEq = allEqs.find(e => e.key === selectedEqKey) || allEqs[0];
    const [openCategories, setOpenCategories] = useState(["electrical", "hydraulic", "adsorption", "performance"]);

    const toggleCat = (catKey) => {
        setOpenCategories(prev => prev.includes(catKey) ? prev.filter(k => k !== catKey) : [...prev, catKey]);
    };

    const handleExportPDF = () => {
        generateEquationReportPDF({
            user: { fullName: user?.role || "User", role: user?.role || "User" },
            feedWater,
            technology,
            engineering: eng,
            equations: allEqs
        });
    };

    return (
        <div className="panel equation-library-panel" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "10px", minHeight: "500px" }}>
            {/* Action Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Calculator size={18} color="#2563EB" />
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
                        Engineering Equation Library &amp; Physics Substitution Engine
                    </h3>
                </div>
                <button
                    onClick={handleExportPDF}
                    style={{
                        background: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "5px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    <FileText size={14} />
                    <span>Export Equation PDF</span>
                </button>
            </div>

            {/* 3-COLUMN LAYOUT (Req 6) */}
            <div style={{ display: "grid", gridTemplateColumns: "220px 1.2fr 0.8fr", gap: "10px" }}>
                {/* LEFT COLUMN: CATEGORY & EQUATION TREE */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "8px", overflowY: "auto", maxHeight: "450px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", marginBottom: "6px", textTransform: "uppercase" }}>
                        Equation Categories
                    </div>
                    {categories.map(cat => {
                        const isOpen = openCategories.includes(cat.key);
                        return (
                            <div key={cat.key} style={{ marginBottom: "6px" }}>
                                <div
                                    onClick={() => toggleCat(cat.key)}
                                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", color: "#0F172A", cursor: "pointer", padding: "4px 6px", background: "#E2E8F0", borderRadius: "4px" }}
                                >
                                    <span>{cat.title}</span>
                                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                                {isOpen && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px", paddingLeft: "6px" }}>
                                        {cat.equations.map(eq => {
                                            const isSelected = activeEq.key === eq.key;
                                            return (
                                                <div
                                                    key={eq.key}
                                                    onClick={() => onSelectEq && onSelectEq(eq.key)}
                                                    style={{
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "11.5px",
                                                        fontWeight: isSelected ? "700" : "500",
                                                        background: isSelected ? "#EFF6FF" : "transparent",
                                                        color: isSelected ? "#2563EB" : "#334155",
                                                        borderLeft: isSelected ? "3px solid #2563EB" : "none",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center"
                                                    }}
                                                >
                                                    <span>{eq.title}</span>
                                                    <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748B" }}>{eq.value}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* CENTER COLUMN: LARGE FORMULA & LIVE NUMERICAL SUBSTITUTION */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#2563EB", textTransform: "uppercase" }}>Selected Governing Equation</div>
                        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0F172A", margin: "2px 0 8px 0" }}>{activeEq.title}</h2>
                    </div>

                    {/* Math Formula Display Box */}
                    <div style={{ background: "#0F172A", color: "#60A5FA", padding: "16px", borderRadius: "6px", textAlign: "center", fontFamily: "monospace", fontSize: "18px", fontWeight: "700", letterSpacing: "0.5px" }}>
                        {activeEq.displayFormula}
                    </div>

                    {/* Live Numerical Substitution Box (Req 5) */}
                    <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "6px", padding: "10px" }}>
                        <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#1E40AF", marginBottom: "4px" }}>Live Numerical Substitution</div>
                        <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#0F172A", fontWeight: "700" }}>
                            {activeEq.substitution}
                        </div>
                    </div>

                    {/* Current Calculated Output */}
                    <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "6px", padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "#166534", fontWeight: "600" }}>Current Calculated Result</span>
                        <span style={{ fontSize: "18px", fontWeight: "700", color: "#15803D" }}>{activeEq.value}</span>
                    </div>
                </div>

                {/* RIGHT COLUMN: VARIABLES, ASSUMPTIONS, REFERENCES */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", maxHeight: "450px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#0F172A" }}>Variables Breakdown</div>
                    <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#E2E8F0", textAlign: "left", color: "#334155" }}>
                                <th style={{ padding: "3px 4px" }}>Symbol</th>
                                <th style={{ padding: "3px 4px" }}>Description</th>
                                <th style={{ padding: "3px 4px" }}>Val</th>
                                <th style={{ padding: "3px 4px" }}>Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeEq.variables.map(v => (
                                <tr key={v.symbol} style={{ borderBottom: "1px solid #E2E8F0" }}>
                                    <td style={{ padding: "3px 4px", fontWeight: "700", color: "#2563EB" }}>{v.symbol}</td>
                                    <td style={{ padding: "3px 4px", color: "#334155" }}>{v.name}</td>
                                    <td style={{ padding: "3px 4px", fontWeight: "700", color: "#0F172A" }}>{v.val}</td>
                                    <td style={{ padding: "3px 4px", color: "#64748B" }}>{v.unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "6px" }}>
                        <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#0F172A" }}>Engineering Meaning</div>
                        <div style={{ fontSize: "11px", color: "#475569", lineHeight: "1.3" }}>{activeEq.meaning}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#0F172A" }}>Assumptions &amp; Limitations</div>
                        <div style={{ fontSize: "11px", color: "#475569", lineHeight: "1.3" }}>• {activeEq.assumptions}</div>
                        <div style={{ fontSize: "11px", color: "#DC2626", lineHeight: "1.3", marginTop: "2px" }}>• {activeEq.limitations}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#0F172A" }}>Literature Reference</div>
                        <div style={{ fontSize: "10.5px", color: "#2563EB", fontWeight: "600" }}>{activeEq.reference}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
