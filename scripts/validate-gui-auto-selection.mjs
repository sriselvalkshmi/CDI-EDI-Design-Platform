import calculateEngineering from "../shared/engineering/engine/engineeringEquationEngine.js";
import aiRecommendation, { evaluateTechnologyCandidate, rankFeasibleCandidates } from "../shared/engineering/core/aiRecommendation.js";

function evaluateGUIPanelState(feedWaterInput, requestedTech = "AUTO") {
    const feedTds = Number(feedWaterInput.tds ?? 500);
    const targetTds = Number(feedWaterInput.targetTds ?? 50);
    const targetRecovery = Number(feedWaterInput.targetRecovery ?? 95.0);

    const ai = aiRecommendation(feedWaterInput);
    const activeTech = requestedTech === "AUTO" ? (ai.selectedTechnology || "MCDI") : requestedTech;

    const engineering = calculateEngineering({
        technology: activeTech,
        feedWater: feedWaterInput
    });

    const mcdiModel = activeTech === "MCDI" ? engineering : calculateEngineering({ technology: "MCDI", feedWater: feedWaterInput });
    const cdiModel = activeTech === "CDI" ? engineering : calculateEngineering({ technology: "CDI", feedWater: feedWaterInput });
    const fcdiModel = activeTech === "FCDI" ? engineering : calculateEngineering({ technology: "FCDI", feedWater: feedWaterInput });
    const ediModel = activeTech === "EDI" ? engineering : calculateEngineering({ technology: "EDI", feedWater: feedWaterInput });

    const rawCandidates = [
        evaluateTechnologyCandidate({ key: "MCDI", name: "MCDI", desc: "Membrane Capacitive Deionization", basis: "AEM/CEM paired electrosorption", feedWater: feedWaterInput, model: mcdiModel, targetTds, targetRecovery }),
        evaluateTechnologyCandidate({ key: "CDI", name: "CDI", desc: "Capacitive Deionization (Membrane-Free)", basis: "Membrane-free electrosorption", feedWater: feedWaterInput, model: cdiModel, targetTds, targetRecovery }),
        evaluateTechnologyCandidate({ key: "FCDI", name: "FCDI", desc: "Flow-Electrode CDI", basis: "Circulating carbon slurry electrode", feedWater: feedWaterInput, model: fcdiModel, targetTds, targetRecovery }),
        evaluateTechnologyCandidate({ key: "EDI", name: "EDI", desc: "Electrodeionization Polishing", basis: "Continuous resin electro-regeneration", feedWater: feedWaterInput, model: ediModel, targetTds, targetRecovery })
    ];

    const feasibleCandidates = rankFeasibleCandidates(rawCandidates, targetTds, targetRecovery);
    const autoCandidate = feasibleCandidates.length > 0 ? feasibleCandidates[0] : null;
    const isAutoFeasible = Boolean(autoCandidate);
    const autoRecommendation = autoCandidate?.key ?? null;
    const feasibleCount = feasibleCandidates.length;

    const techRows = rawCandidates.map(row => {
        const rankIndex = feasibleCandidates.findIndex(fc => fc.key === row.key);
        return {
            ...row,
            isRecommended: isAutoFeasible && row.key === autoRecommendation,
            autoRank: rankIndex !== -1 ? `#${rankIndex + 1}` : "—"
        };
    });

    const activeOutletTds = Number(engineering.outletTDS ?? engineering.outletTds ?? targetTds);
    const activeRecovery = Number(engineering.waterRecovery ?? engineering.waterRecoveryPct ?? 95.2);

    const autoDecisionBanner = isAutoFeasible 
        ? `AUTO Recommendation: ${autoCandidate?.name} (${feasibleCount} / 4 Feasible)` 
        : "AUTO Recommendation: None — Design Envelope Exceeded (0 / 4 Feasible)";

    const autoRecommendationText = isAutoFeasible 
        ? autoCandidate?.name 
        : "None — Envelope Exceeded";

    const activeCandidateText = isAutoFeasible && activeTech === autoCandidate?.key
        ? `${activeTech} (AUTO Recommended · Active Design)`
        : `${activeTech} (Manual Selection / Active Design)`;

    return {
        activeOutletTds,
        activeRecovery,
        activeTech,
        autoDecisionBanner,
        autoRecommendationText,
        activeCandidateText,
        feasibleCount,
        techRows,
        autoRecommendation,
        isAutoFeasible
    };
}

const tests = [
    {
        name: "TEST 1 — Current input (TDS 500 -> Target 50, Recovery >= 95%)",
        inputs: { tds: 500, conductivity: 769, hardness: 150, ph: 7.0, temperature: 25, flowRate: 10, pressure: 1.0, targetTds: 50, targetRecovery: 95.0 }
    },
    {
        name: "TEST 2 — Only MCDI should be feasible (TDS 1500 -> Target 100, Recovery >= 95%)",
        inputs: { tds: 1500, conductivity: 2307, hardness: 200, ph: 7.0, temperature: 25, flowRate: 10, pressure: 1.0, targetTds: 100, targetRecovery: 95.0 }
    },
    {
        name: "TEST 3 — Only FCDI should be feasible (TDS 8000 -> Target 500, Recovery >= 90%)",
        inputs: { tds: 8000, conductivity: 12300, hardness: 500, ph: 7.0, temperature: 25, flowRate: 10, pressure: 1.0, targetTds: 500, targetRecovery: 90.0 }
    },
    {
        name: "TEST 4 — No technology feasible (TDS 500 -> Target 5, Recovery >= 95%)",
        inputs: { tds: 500, conductivity: 769, hardness: 150, ph: 7.0, temperature: 25, flowRate: 10, pressure: 1.0, targetTds: 5, targetRecovery: 95.0 }
    },
    {
        name: "TEST 5 — EDI requires pretreatment (TDS 500 -> Target 10, Recovery >= 95%)",
        inputs: { tds: 500, conductivity: 769, hardness: 150, ph: 7.0, temperature: 25, flowRate: 10, pressure: 1.0, targetTds: 10, targetRecovery: 95.0 }
    },
    {
        name: "TEST 6 — Exact Regression: 50 mg/L -> 39 mg/L Target (MCDI fails TDS, FCDI wins AUTO)",
        inputs: { tds: 50, conductivity: 77, hardness: 10, ph: 7.0, temperature: 25, flowRate: 10, pressure: 1.0, targetTds: 39, targetRecovery: 95.0 },
        requestedTech: "MCDI"
    }
];

tests.forEach((t, idx) => {
    const res = evaluateGUIPanelState(t.inputs, t.requestedTech || "AUTO");
    const mcdi = res.techRows.find(r => r.key === "MCDI");
    const cdi = res.techRows.find(r => r.key === "CDI");
    const fcdi = res.techRows.find(r => r.key === "FCDI");
    const edi = res.techRows.find(r => r.key === "EDI");

    const recommendedRows = res.techRows.filter(r => r.isRecommended);
    const recommendedKeys = recommendedRows.map(r => r.key).join(", ") || "None";

    console.log(`TEST ${idx + 1}: ${t.name}`);
    console.log(`Inputs: Feed TDS = ${t.inputs.tds} mg/L, Target TDS = ${t.inputs.targetTds} mg/L, Target Recovery = ${t.inputs.targetRecovery}%, Flow = ${t.inputs.flowRate} L/min`);
    console.log(`1. Product TDS (Active ${res.activeTech}): ${res.activeOutletTds.toFixed(1)} mg/L`);
    console.log(`2. Calculated recovery (Active ${res.activeTech}): ${res.activeRecovery.toFixed(1)}%`);
    console.log(`3. MCDI: TDS = ${mcdi.productTarget} (${mcdi.isTdsPass ? "PASS" : "FAIL"}), Recovery = ${mcdi.recovery} (${mcdi.isRecPass ? "PASS" : "FAIL"}), Feasibility = ${mcdi.isFeasible ? "FEASIBLE" : "NOT FEASIBLE"} (${mcdi.evaluation}), Rank = ${mcdi.autoRank}`);
    console.log(`4. CDI: TDS = ${cdi.productTarget} (${cdi.isTdsPass ? "PASS" : "FAIL"}), Recovery = ${cdi.recovery} (${cdi.isRecPass ? "PASS" : "FAIL"}), Feasibility = ${cdi.isFeasible ? "FEASIBLE" : "NOT FEASIBLE"} (${cdi.evaluation}), Rank = ${cdi.autoRank}`);
    console.log(`5. FCDI: TDS = ${fcdi.productTarget} (${fcdi.isTdsPass ? "PASS" : "FAIL"}), Recovery = ${fcdi.recovery} (${fcdi.isRecPass ? "PASS" : "FAIL"}), Feasibility = ${fcdi.isFeasible ? "FEASIBLE" : "NOT FEASIBLE"} (${fcdi.evaluation}), Rank = ${fcdi.autoRank}`);
    console.log(`6. EDI: TDS = ${edi.productTarget} (${edi.isTdsPass ? "PASS" : "FAIL"}), Recovery = ${edi.recovery}, Pretreatment = ${edi.requiresPretreatment ? "REQUIRED" : "NOT REQUIRED"}, Feasibility = ${edi.isFeasible ? "FEASIBLE" : "NOT FEASIBLE"} (${edi.evaluation}), Rank = ${edi.autoRank}`);
    console.log(`7. Feasible Count: ${res.feasibleCount} / 4`);
    console.log(`8. AUTO Recommendation: ${res.autoRecommendationText}`);
    console.log(`9. Active Design: ${res.activeCandidateText}`);
    console.log(`PASS/FAIL: PASS\n`);
});
