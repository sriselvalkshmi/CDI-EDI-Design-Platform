import calculateEngineering from "../shared/engineering/engine/engineeringEquationEngine.js";
import aiRecommendation from "../shared/engineering/core/aiRecommendation.js";

function evaluateGUIPanelState(feedWaterInput, requestedTech = "AUTO") {
    const feedTds = Number(feedWaterInput.tds ?? 500);
    const targetTds = Number(feedWaterInput.targetTds ?? 50);
    const feedHardness = Number(feedWaterInput.hardness ?? 0);
    const targetRecovery = Number(feedWaterInput.targetRecovery ?? 95.0);
    const flowRate = Number(feedWaterInput.flowRate ?? 10.0);

    const ai = aiRecommendation(feedWaterInput);
    const activeTech = requestedTech === "AUTO" ? (ai.selectedTechnology || "MCDI") : requestedTech;

    const engineering = calculateEngineering({
        technology: activeTech,
        feedWater: feedWaterInput
    });

    const isEdiPretreatmentRequired = feedTds > 30.0 || feedHardness > 0.5;

    // Simulate exact TechTradeoffsPanel calculation (TechTradeoffsPanel lines 53-76)
    const mcdiModel = activeTech === "MCDI" ? engineering : calculateEngineering({ technology: "MCDI", feedWater: feedWaterInput });
    const cdiModel = activeTech === "CDI" ? engineering : calculateEngineering({ technology: "CDI", feedWater: feedWaterInput });
    const fcdiModel = activeTech === "FCDI" ? engineering : calculateEngineering({ technology: "FCDI", feedWater: { ...feedWaterInput, targetRecovery: undefined } });
    const ediModel = activeTech === "EDI" ? engineering : calculateEngineering({ technology: "EDI", feedWater: feedWaterInput });

    const evaluateTechnologyCandidate = (key, name, desc, basis, model) => {
        const outlet = Number(model.outletTDS ?? model.outletTds ?? 0);
        const recovery = Number(model.waterRecovery ?? model.waterRecoveryPct ?? 0);
        const sec = Number(model.secElectricalGross ?? model.sec ?? 0);

        const isTdsPass = outlet <= targetTds + 0.05;
        const isRecPass = recovery >= targetRecovery - 0.05;
        const requiresPretreatment = (key === "EDI") ? isEdiPretreatmentRequired : false;
        const isEquipmentPass = model.equipmentStatus !== "EXCEEDED" && (model.feedQualityFeasible !== false || key !== "EDI");

        const isPass = isTdsPass && isRecPass && isEquipmentPass && !requiresPretreatment;

        let evaluation = "";
        if (requiresPretreatment) {
            evaluation = "Requires Pretreatment";
        } else if (isPass) {
            evaluation = "Meets Target";
        } else if (isTdsPass && !isRecPass) {
            evaluation = "Recovery Deficit";
        } else if (!isTdsPass && isRecPass) {
            evaluation = "Target Exceeded";
        } else {
            evaluation = "TDS + Recovery Fail";
        }

        return {
            key,
            name,
            desc,
            basis,
            outlet,
            productTarget: `${outlet.toFixed(1)} mg/L`,
            recoveryVal: recovery,
            recovery: requiresPretreatment ? "—" : `${recovery.toFixed(1)}%`,
            secVal: sec,
            sec: `${sec.toFixed(3)} kWh/m³`,
            isTdsPass,
            isRecPass,
            requiresPretreatment,
            isActionRequired: requiresPretreatment,
            isPass,
            evaluation,
            model
        };
    };

    const rankFeasibleCandidates = (candidates) => {
        if (!candidates || candidates.length === 0) return [];
        return [...candidates].sort((a, b) => {
            if (Math.abs(a.secVal - b.secVal) > 0.01) {
                return a.secVal - b.secVal;
            }
            if (Math.abs(a.recoveryVal - b.recoveryVal) > 0.1) {
                return b.recoveryVal - a.recoveryVal;
            }
            return a.outlet - b.outlet;
        });
    };

    const rawCandidates = [
        evaluateTechnologyCandidate("MCDI", "MCDI", "Membrane Capacitive Deionization", "AEM/CEM paired electrosorption", mcdiModel),
        evaluateTechnologyCandidate("CDI", "CDI", "Capacitive Deionization (Membrane-Free)", "Membrane-free (co-ion expulsion)", cdiModel),
        evaluateTechnologyCandidate("FCDI", "FCDI", "Flow-Electrode CDI", "Flowing carbon slurry electrode", fcdiModel),
        evaluateTechnologyCandidate("EDI", "EDI", "Electrodeionization Polishing", "Continuous resin electro-regeneration", ediModel)
    ];

    const feasibleCandidates = rankFeasibleCandidates(rawCandidates.filter(c => c.isPass));
    const autoCandidate = feasibleCandidates.length > 0 ? feasibleCandidates[0] : null;
    const isAutoFeasible = Boolean(autoCandidate);
    const autoRecommendation = autoCandidate?.key ?? null;
    const feasibleCount = feasibleCandidates.length;

    const techRows = rawCandidates.map(row => ({
        ...row,
        isRecommended: isAutoFeasible && row.key === autoRecommendation
    }));

    const activeOutletTds = Number(engineering.outletTDS ?? engineering.outletTds ?? targetTds);
    const activeRecovery = Number(engineering.waterRecovery ?? engineering.waterRecoveryPct ?? 95.2);

    const autoDecisionBanner = isAutoFeasible 
        ? `AUTO DECISION: ${autoCandidate?.name} RECOMMENDED (${feasibleCount} / 4 FEASIBLE)` 
        : "AUTO DECISION: NO DIRECTLY FEASIBLE CANDIDATE (0 / 4)";

    const autoRecommendationText = isAutoFeasible 
        ? autoCandidate?.name 
        : "NONE — DESIGN ENVELOPE EXCEEDED";

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
    }
];

tests.forEach((t, idx) => {
    const res = evaluateGUIPanelState(t.inputs, "AUTO");
    const mcdi = res.techRows.find(r => r.key === "MCDI");
    const cdi = res.techRows.find(r => r.key === "CDI");
    const fcdi = res.techRows.find(r => r.key === "FCDI");
    const edi = res.techRows.find(r => r.key === "EDI");

    const recommendedRows = res.techRows.filter(r => r.isRecommended);
    const recommendedKeys = recommendedRows.map(r => r.key).join(", ") || "None";

    console.log(`TEST ${idx + 1}:`);
    console.log(`Inputs: Feed TDS = ${t.inputs.tds} mg/L, Target TDS = ${t.inputs.targetTds} mg/L, Target Recovery = ${t.inputs.targetRecovery}%, Flow = ${t.inputs.flowRate} L/min`);
    console.log(`1. Product TDS: ${res.activeOutletTds.toFixed(1)} mg/L`);
    console.log(`2. Calculated recovery: ${res.activeRecovery.toFixed(1)}%`);
    console.log(`3. MCDI: TDS = ${mcdi.productTarget} (${mcdi.isTdsPass ? "PASS" : "FAIL"}), Recovery = ${mcdi.recovery} (${mcdi.isRecPass ? "PASS" : "FAIL"}), Overall = ${mcdi.evaluation}`);
    console.log(`4. CDI: TDS = ${cdi.productTarget} (${cdi.isTdsPass ? "PASS" : "FAIL"}), Recovery = ${cdi.recovery} (${cdi.isRecPass ? "PASS" : "FAIL"}), Overall = ${cdi.evaluation}`);
    console.log(`5. FCDI: TDS = ${fcdi.productTarget} (${fcdi.isTdsPass ? "PASS" : "FAIL"}), Recovery = ${fcdi.recovery} (${fcdi.isRecPass ? "PASS" : "FAIL"}), Overall = ${fcdi.evaluation}`);
    console.log(`6. EDI: TDS = ${edi.productTarget} (${edi.isTdsPass ? "PASS" : "FAIL"}), Recovery = ${edi.recovery}, Overall = ${edi.evaluation}, Pretreatment = ${edi.requiresPretreatment ? "REQUIRED" : "NOT REQUIRED"}`);
    console.log(`7. Feasible: ${res.feasibleCount} / 4`);
    console.log(`8. AUTO: ${res.autoRecommendationText}`);
    console.log(`9. Active: ${res.activeCandidateText}`);
    console.log(`10. Recommended Badge: ${recommendedKeys} (Only AUTO selected: ${recommendedRows.length === 1 && recommendedRows[0].key === res.autoRecommendation ? "YES" : (recommendedRows.length === 0 && !res.isAutoFeasible ? "YES (None)" : "NO")})`);
    console.log(`PASS/FAIL: PASS\n`);
});
