import calculateEngineering from "../shared/engineering/engine/engineeringEquationEngine.js";
import { auditEngineeringDesign } from "../shared/engineering/core/engineeringAudit.js";

console.log("==================================================================");
console.log("🚀 CROSS-TECHNOLOGY CONSISTENCY & MULTI-REGIME BENCHMARK SUITE");
console.log("==================================================================\n");

const regimes = [
    {
        name: "Benchmark 1: Tap / Low-Salinity Water",
        feedWater: {
            tds: 39,
            hardness: 10,
            conductivity: 60,
            ph: 7.0,
            temperature: 25,
            flowRate: 20,
            pressure: 1.0,
            targetTds: 2.0,
            targetRecovery: 95.0
        },
        expectedWinner: "MCDI"
    },
    {
        name: "Benchmark 2: Standard Brackish Water",
        feedWater: {
            tds: 500,
            hardness: 150,
            conductivity: 769,
            ph: 7.2,
            temperature: 25,
            flowRate: 20,
            pressure: 1.0,
            targetTds: 50.0,
            targetRecovery: 95.0
        },
        expectedWinner: "MCDI"
    },
    {
        name: "Benchmark 3: High-Salinity Feed (3000 mg/L)",
        feedWater: {
            tds: 3000,
            hardness: 400,
            conductivity: 4600,
            ph: 7.5,
            temperature: 25,
            flowRate: 15,
            pressure: 1.0,
            targetTds: 300.0,
            targetRecovery: 90.0
        },
        expectedWinner: "FCDI" // or MCDI depending on energy/slurry trade-off
    },
    {
        name: "Benchmark 4: RO Permeate Ultrapure Feed",
        feedWater: {
            tds: 15,
            hardness: 0.1,
            conductivity: 23,
            ph: 6.8,
            temperature: 25,
            flowRate: 10,
            pressure: 1.0,
            targetTds: 0.05,
            targetRecovery: 90.0
        },
        expectedWinner: "EDI"
    }
];

const technologies = ["MCDI", "CDI", "FCDI", "EDI"];

regimes.forEach((regime, idx) => {
    console.log(`==================================================================`);
    console.log(`REGIME ${idx + 1}: ${regime.name}`);
    console.log(`Feed: ${regime.feedWater.tds} mg/L TDS, ${regime.feedWater.hardness} mg/L Hardness, ${regime.feedWater.flowRate} L/min | Target: ≤ ${regime.feedWater.targetTds} mg/L`);
    console.log(`==================================================================`);

    const comparisonTable = [];

    technologies.forEach(tech => {
        const res = calculateEngineering({
            technology: tech,
            feedWater: regime.feedWater
        });

        const outletTds = res.outletTDS ?? res.outletTds;
        const recovery = res.waterRecovery ?? res.waterRecoveryPct;
        const secGross = res.secElectricalGross ?? res.secGross;
        const secNet = res.secElectricalNet ?? res.secNet ?? res.sec;
        const power = res.power ?? res.electricalPower;
        const productFlow = res.productFlowLmin ?? (regime.feedWater.flowRate * (recovery / 100));
        const rejectFlow = res.concentrateFlowLmin ?? (regime.feedWater.flowRate - productFlow);
        const isFeasible = res.feedQualityFeasible ?? res.isFeedFeasible;
        const targetAchieved = outletTds <= regime.feedWater.targetTds + 0.05;

        // Mass balance checks
        const flowResidual = Math.abs(regime.feedWater.flowRate - (productFlow + rejectFlow));
        const saltIn = (regime.feedWater.flowRate / 60) * (regime.feedWater.tds / 1000);
        const saltProd = (productFlow / 60) * (outletTds / 1000);
        const concentrateTds = res.concentrateTds ?? (rejectFlow > 0 ? (((regime.feedWater.flowRate * regime.feedWater.tds) - (productFlow * outletTds)) / rejectFlow) : regime.feedWater.tds);
        const saltRej = (rejectFlow / 60) * (concentrateTds / 1000);
        const saltResidual = Math.abs(saltIn - (saltProd + saltRej));

        let statusText = "PASS";
        let reason = "Target and recovery met";

        if (!isFeasible) {
            statusText = "FAIL (Pretreatment Required)";
            reason = res.feedQualityWarning ?? "Feed water exceeds scaling/hardness limit";
        } else if (!targetAchieved) {
            statusText = "FAIL (Target Exceeded)";
            reason = `Single-pass cut capped (Outlet ${outletTds.toFixed(1)} mg/L > ${regime.feedWater.targetTds} mg/L)`;
        } else if (recovery < regime.feedWater.targetRecovery - 5.0) {
            statusText = "FAIL (Recovery Deficit)";
            reason = `Recovery ${recovery.toFixed(1)}% < Target ${regime.feedWater.targetRecovery}%`;
        }

        comparisonTable.push({
            Technology: tech,
            "Outlet TDS (mg/L)": outletTds.toFixed(2),
            "Recovery (%)": recovery.toFixed(1),
            "SEC (kWh/m³)": secGross.toFixed(4),
            "Power (W)": power.toFixed(1),
            "Flow Res (L/min)": flowResidual.toExponential(1),
            "Salt Res (g/s)": saltResidual.toExponential(1),
            "Feasibility": isFeasible ? "FEASIBLE" : "INFEASIBLE",
            "Design Status": statusText,
            "Reason": reason
        });
    });

    console.table(comparisonTable);
    console.log("");
});
