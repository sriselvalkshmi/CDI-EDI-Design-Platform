import calculateEngineering from "../engine/engineeringEquationEngine.js";
import aiRecommendation, { evaluateTechnologyCandidate, rankFeasibleCandidates, rankAllCandidates, TECHNOLOGY_BOUNDARIES } from "./aiRecommendation.js";
import { calculateMCDIChargeEfficiency } from "../models/mCDIModel.js";
import calculateTEA, { DEFAULT_TEA_INPUTS } from "../tea/technoEconomicEngine.js";


/**
 * Searches allowable technology configurations and operating variables for a scenario point.
 * Evaluates candidate technologies (MCDI, CDI, FCDI, EDI) and searches modular design alternatives
 * (cell pairs, operating current density, cell voltage, electrode area) to achieve target specifications.
 * Primary objective: achieve target TDS and recovery within allowable envelope bounds.
 * Ranks feasible configurations by lowest SEC and highest target margin.
 */
export function optimizeScenarioTechnology({
    scFeed,
    scOptInputs = {},
    parameter = "Feed TDS",
    baseTech = "AUTO",
    baselinePressureDrop = 406,
    baseline = null
}) {
    // All registered technologies to evaluate in scenario discovery
    const isEdRequested = baseTech === "ED" || baseTech === "EDR";
    const allRegisteredTechs = isEdRequested ? ["MCDI", "FCDI", "CDI", "EDI", "ED", "EDR"] : ["MCDI", "FCDI", "CDI", "EDI"];
    const targetTds = Number(scFeed.targetTds ?? 3.0);
    const targetRecovery = Number(scFeed.targetRecovery ?? 95.0);
    const feedTds = Number(scFeed.tds ?? 500);
    const flowRate = Number(scFeed.flowRate ?? 10);
    const flowM3s = (flowRate / 1000) / 60;

    const evaluatedTechnologies = [];
    const feasibleOptions = [];
    let bestInfeasible = null;

    // --- 1. EVALUATE MCDI ---
    {
        const isSweepPairs = parameter === "Cell Pairs";
        const isSweepVoltage = parameter === "Cell Voltage";
        const isSweepArea = parameter === "Active Area";
        const isSweepRecovery = parameter === "Recovery";

        const voltageToTest = isSweepVoltage ? [Number(scOptInputs.voltage)] : [Number(scOptInputs.voltage ?? 1.40)];
        const areaToTest = isSweepArea ? Number(scOptInputs.electrodeArea) : 350;
        const planarAreaM2 = Math.max(0.01, areaToTest / 10000);
        const modulesToTest = isSweepPairs
            ? [Math.max(1, Math.round(Number(scOptInputs.cellPairs) / 34))]
            : [1, 2, 3, 4, 5];

        const deltaTds = Math.max(0, feedTds - targetTds);
        const molarRemoval = (flowM3s * deltaTds) / 58.44;

        let bestMcdiOption = null;

        for (const vCell of voltageToTest) {
            const lambda = calculateMCDIChargeEfficiency(vCell, feedTds, {});
            const totalFaradayCurrent = (molarRemoval * 96485) / lambda;

            for (const mods of modulesToTest) {
                const pairs = isSweepPairs ? Math.round(Number(scOptInputs.cellPairs)) : mods * 34;
                if (pairs > 180) continue;

                const cellCurrent = totalFaradayCurrent / pairs;
                const j = cellCurrent / planarAreaM2;

                if (j >= 0.1 && j <= 250.0) {
                    try {
                        const res = calculateEngineering({
                            technology: "MCDI",
                            feedWater: scFeed,
                            cellPairs: pairs,
                            current: Number(cellCurrent.toFixed(2)),
                            voltage: vCell,
                            electrodeArea: areaToTest,
                            targetTds,
                            targetRecovery: isSweepRecovery ? scFeed.targetRecovery : targetRecovery,
                            waterRecovery: isSweepRecovery ? scFeed.targetRecovery : targetRecovery
                        });

                        const cand = evaluateTechnologyCandidate({
                            key: "MCDI",
                            name: "MCDI",
                            feedWater: scFeed,
                            model: res,
                            targetTds,
                            targetRecovery: isSweepRecovery ? scFeed.targetRecovery : targetRecovery
                        });

                        const resRec = ((res.waterRecoveryPct ?? res.waterRecovery ?? 0) <= 1.0 && (res.waterRecoveryPct ?? res.waterRecovery ?? 0) > 0)
                            ? (res.waterRecoveryPct ?? res.waterRecovery) * 100
                            : (res.waterRecoveryPct ?? res.waterRecovery ?? 0);
                        const isTargetMet = res.outletTds <= targetTds + 0.05 && resRec >= targetRecovery - 0.1;
                        const isFeasible = cand.isFeasible && isTargetMet;
                        const isOperatingConfigInEnvelope = (vCell <= 1.55) && (j <= 200.0) && (resRec <= 95.5);
                        const isInRecommended = isOperatingConfigInEnvelope;

                        const option = {
                            engModel: res,
                            selectedCandidate: cand,
                            tech: "MCDI",
                            isFeasible,
                            isInRecommended,
                            pairs,
                            modules: mods,
                            cellCurrent: Number(cellCurrent.toFixed(2)),
                            currentDensity: Number(j.toFixed(1)),
                            cellVoltage: vCell,
                            electrodeArea: areaToTest,
                            sec: res.secElectricalGross ?? res.sec ?? 0,
                            outletTds: res.outletTds,
                            recovery: resRec,
                            reason: isFeasible
                                ? (isInRecommended ? "Fully compliant with all engineering targets and envelope bounds." : "Meets targets, but operating configuration operates in extended parameter envelope.")
                                : cand.rejectionReason
                        };

                        if (isFeasible) {
                            feasibleOptions.push(option);
                        }

                        const isBetterMcdi = !bestMcdiOption ||
                            (option.isFeasible && !bestMcdiOption.isFeasible) ||
                            (option.isFeasible && option.isInRecommended && !bestMcdiOption.isInRecommended) ||
                            (option.isFeasible && (option.isInRecommended === bestMcdiOption.isInRecommended) && option.sec < bestMcdiOption.sec);

                        if (isBetterMcdi) {
                            bestMcdiOption = option;
                        }
                    } catch (err) {}
                }
            }
        }

        evaluatedTechnologies.push({
            tech: "MCDI",
            name: "Membrane CDI",
            isFeasible: bestMcdiOption?.isFeasible ?? false,
            isInRecommended: bestMcdiOption?.isInRecommended ?? false,
            status: bestMcdiOption?.isFeasible ? (bestMcdiOption.isInRecommended ? "FEASIBLE" : "FEASIBLE WITH WARNING") : "NOT FEASIBLE",
            outletTds: bestMcdiOption?.outletTds ?? null,
            recovery: bestMcdiOption?.recovery ?? null,
            sec: bestMcdiOption?.sec ?? null,
            reason: bestMcdiOption?.reason ?? "Violates current density or physical equipment limits."
        });

        if (!bestMcdiOption?.isFeasible && !bestInfeasible) {
            bestInfeasible = bestMcdiOption;
        }
    }

    // --- 2. EVALUATE FCDI ---
    {
        const isSweepVoltage = parameter === "Cell Voltage";
        const isSweepRecovery = parameter === "Recovery";
        const fcdiVoltages = isSweepVoltage ? [Number(scOptInputs.voltage)] : [Number(scOptInputs.voltage ?? 1.40)];
        const fcdiSlurryConcs = [10.0, 15.0, 5.0];
        const fcdiSlurryRatios = [1.2, 1.5, 1.0];
        const allowableFcdiRec = Math.min(targetRecovery, 95.0);

        let bestFcdiOption = null;

        for (const v of fcdiVoltages) {
            for (const sConc of fcdiSlurryConcs) {
                for (const sRatio of fcdiSlurryRatios) {
                    try {
                        const res = calculateEngineering({
                            technology: "FCDI",
                            feedWater: scFeed,
                            voltage: v,
                            slurryConcentrationWt: sConc,
                            slurryFlowRatio: sRatio,
                            targetTds,
                            targetRecovery: isSweepRecovery ? scFeed.targetRecovery : allowableFcdiRec,
                            waterRecovery: isSweepRecovery ? scFeed.targetRecovery : allowableFcdiRec
                        });

                        const cand = evaluateTechnologyCandidate({
                            key: "FCDI",
                            name: "FCDI",
                            feedWater: scFeed,
                            model: res,
                            targetTds,
                            targetRecovery: isSweepRecovery ? scFeed.targetRecovery : allowableFcdiRec
                        });

                        const resRec = ((res.waterRecoveryPct ?? res.waterRecovery ?? 0) <= 1.0 && (res.waterRecoveryPct ?? res.waterRecovery ?? 0) > 0)
                            ? (res.waterRecoveryPct ?? res.waterRecovery) * 100
                            : (res.waterRecoveryPct ?? res.waterRecovery ?? 0);
                        const isTargetMet = res.outletTds <= targetTds + 0.05 && resRec >= targetRecovery - 0.5;
                        const isFeasible = cand.isFeasible && isTargetMet;
                        const isOperatingConfigInEnvelope = (v <= 1.55) && (resRec <= 95.5) && (feedTds <= 15000);
                        const isInRecommended = isOperatingConfigInEnvelope;

                        const option = {
                            engModel: res,
                            selectedCandidate: cand,
                            tech: "FCDI",
                            isFeasible,
                            isInRecommended,
                            pairs: res.cellPairs ?? 34,
                            modules: res.numberOfModules ?? 1,
                            cellCurrent: Number(res.current ?? 0),
                            currentDensity: Number(res.actualCurrentDensityAm2 ?? res.currentDensity ?? 0),
                            cellVoltage: v,
                            electrodeArea: Number(res.electrodeArea ?? 350),
                            sec: res.secElectricalGross ?? res.sec ?? 0,
                            outletTds: res.outletTds,
                            recovery: resRec,
                            reason: isFeasible
                                ? (isInRecommended ? "Fully compliant with all engineering targets and envelope bounds." : "Meets targets, but operating configuration operates in extended parameter envelope.")
                                : (res.outletTds > targetTds + 0.05 ? `Single-stage removal benchmark (95%) leaves product TDS at ${res.outletTds.toFixed(1)} mg/L (target ≤ ${targetTds} mg/L).` : cand.rejectionReason)
                        };

                        if (isFeasible) {
                            feasibleOptions.push(option);
                        }

                        const isBetterFcdi = !bestFcdiOption ||
                            (option.isFeasible && !bestFcdiOption.isFeasible) ||
                            (option.isFeasible && option.isInRecommended && !bestFcdiOption.isInRecommended) ||
                            (option.isFeasible && (option.isInRecommended === bestFcdiOption.isInRecommended) && option.sec < bestFcdiOption.sec);

                        if (isBetterFcdi) {
                            bestFcdiOption = option;
                        }
                    } catch (err) {}
                }
            }
        }

        evaluatedTechnologies.push({
            tech: "FCDI",
            name: "Flow-Electrode CDI",
            isFeasible: bestFcdiOption?.isFeasible ?? false,
            isInRecommended: bestFcdiOption?.isInRecommended ?? false,
            status: bestFcdiOption?.isFeasible ? (bestFcdiOption.isInRecommended ? "FEASIBLE" : "FEASIBLE WITH WARNING") : "NOT FEASIBLE",
            outletTds: bestFcdiOption?.outletTds ?? null,
            recovery: bestFcdiOption?.recovery ?? null,
            sec: bestFcdiOption?.sec ?? null,
            reason: bestFcdiOption?.reason ?? `Single-stage removal benchmark (95%) leaves product TDS at ${(feedTds * 0.05).toFixed(1)} mg/L (target ≤ ${targetTds} mg/L).`
        });

        if (!bestInfeasible && !bestFcdiOption?.isFeasible) {
            bestInfeasible = bestFcdiOption;
        }
    }

    // --- 3. EVALUATE CDI ---
    {
        const maxCdiRemoval = 0.70;
        const minCdiOutlet = feedTds * (1 - maxCdiRemoval);
        const isTdsPhysicallyPossible = minCdiOutlet <= targetTds + 0.05;
        const isRecPhysicallyPossible = targetRecovery <= 85.0;

        let bestCdiOption = null;

        if (isTdsPhysicallyPossible && isRecPhysicallyPossible) {
            for (const v of [1.2, 1.4]) {
                for (const p of [34, 68, 102]) {
                    try {
                        const res = calculateEngineering({
                            technology: "CDI",
                            feedWater: scFeed,
                            voltage: v,
                            cellPairs: p,
                            targetTds,
                            targetRecovery
                        });
                        const cand = evaluateTechnologyCandidate({
                            key: "CDI",
                            name: "CDI",
                            feedWater: scFeed,
                            model: res,
                            targetTds,
                            targetRecovery
                        });
                        const resRec = ((res.waterRecoveryPct ?? res.waterRecovery ?? 0) <= 1.0 && (res.waterRecoveryPct ?? res.waterRecovery ?? 0) > 0)
                            ? (res.waterRecoveryPct ?? res.waterRecovery) * 100
                            : (res.waterRecoveryPct ?? res.waterRecovery ?? 0);
                        const isTargetMet = res.outletTds <= targetTds + 0.05 && resRec >= targetRecovery - 0.1;
                        const isFeasible = cand.isFeasible && isTargetMet;
                        const isInRecommended = isFeasible;

                        const option = {
                            engModel: res,
                            selectedCandidate: cand,
                            tech: "CDI",
                            isFeasible,
                            isInRecommended,
                            pairs: p,
                            modules: 1,
                            cellCurrent: Number(res.current ?? 0),
                            currentDensity: Number(res.currentDensity ?? 0),
                            cellVoltage: v,
                            electrodeArea: Number(res.electrodeArea ?? 350),
                            sec: res.secElectricalGross ?? res.sec ?? 0,
                            outletTds: res.outletTds,
                            recovery: resRec,
                            reason: isFeasible ? "Fully compliant." : cand.rejectionReason
                        };

                        if (isFeasible) {
                            feasibleOptions.push(option);
                        }
                        if (!bestCdiOption || (option.isFeasible && !bestCdiOption.isFeasible)) {
                            bestCdiOption = option;
                        }
                    } catch (e) {}
                }
            }
        }

        const cdiReason = !isTdsPhysicallyPossible
            ? `Membrane-free CDI co-ion expulsion limits maximum single-stage removal to ~70% (minimum product TDS ${minCdiOutlet.toFixed(1)} mg/L > target ${targetTds} mg/L).`
            : (!isRecPhysicallyPossible ? `Membrane-free CDI cycle recovery is limited to ~83.3% by desorption flush volume (target ≥ ${targetRecovery}%).` : (bestCdiOption?.reason ?? "Targets not met."));

        evaluatedTechnologies.push({
            tech: "CDI",
            name: "Capacitive Deionization",
            isFeasible: bestCdiOption?.isFeasible ?? false,
            isInRecommended: bestCdiOption?.isInRecommended ?? false,
            status: bestCdiOption?.isFeasible ? "FEASIBLE" : "NOT FEASIBLE",
            outletTds: bestCdiOption?.outletTds ?? minCdiOutlet,
            recovery: bestCdiOption?.recovery ?? 83.3,
            sec: bestCdiOption?.sec ?? null,
            reason: cdiReason
        });

        if (!bestInfeasible && !bestCdiOption?.isFeasible) {
            bestInfeasible = bestCdiOption;
        }
    }

    // --- 4. EVALUATE EDI ---
    {
        const isEdiFeedCompliant = feedTds <= 30.0 && (scFeed.hardness ?? 0) <= 0.5;
        let bestEdiOption = null;

        if (isEdiFeedCompliant) {
            for (const v of [2.5, 3.5, 4.5]) {
                for (const rec of [90, 85, 95]) {
                    try {
                        const res = calculateEngineering({
                            technology: "EDI",
                            feedWater: scFeed,
                            voltage: v,
                            waterRecovery: rec,
                            targetTds,
                            targetRecovery: rec
                        });
                        const cand = evaluateTechnologyCandidate({
                            key: "EDI",
                            name: "EDI",
                            feedWater: scFeed,
                            model: res,
                            targetTds,
                            targetRecovery: rec
                        });
                        const resRec = ((res.waterRecoveryPct ?? res.waterRecovery ?? 0) <= 1.0 && (res.waterRecoveryPct ?? res.waterRecovery ?? 0) > 0)
                            ? (res.waterRecoveryPct ?? res.waterRecovery) * 100
                            : (res.waterRecoveryPct ?? res.waterRecovery ?? 0);
                        const isTargetMet = res.outletTds <= targetTds + 0.05 && resRec >= targetRecovery - 0.5;
                        const isFeasible = cand.isFeasible && isTargetMet;
                        const isInRecommended = isFeasible;

                        const option = {
                            engModel: res,
                            selectedCandidate: cand,
                            tech: "EDI",
                            isFeasible,
                            isInRecommended,
                            pairs: res.cellPairs ?? 30,
                            modules: 1,
                            cellCurrent: Number(res.current ?? 0),
                            currentDensity: Number(res.currentDensity ?? 0),
                            cellVoltage: v,
                            electrodeArea: Number(res.electrodeArea ?? 350),
                            sec: res.secElectricalGross ?? res.sec ?? 0,
                            outletTds: res.outletTds,
                            recovery: resRec,
                            reason: isFeasible ? "Fully compliant." : cand.rejectionReason
                        };
                        if (isFeasible) feasibleOptions.push(option);
                        if (!bestEdiOption || (option.isFeasible && !bestEdiOption.isFeasible)) bestEdiOption = option;
                    } catch (e) {}
                }
            }
        }

        const ediReason = !isEdiFeedCompliant
            ? `Pretreatment required (Feed TDS ${feedTds} mg/L > 30 mg/L or Hardness ${scFeed.hardness ?? 0} mg/L > 0.5 mg/L violates DuPont EDI-310 limits).`
            : (bestEdiOption?.reason ?? "Targets not met.");

        evaluatedTechnologies.push({
            tech: "EDI",
            name: "Electrodeionization",
            isFeasible: bestEdiOption?.isFeasible ?? false,
            isInRecommended: bestEdiOption?.isInRecommended ?? false,
            status: isEdiFeedCompliant ? (bestEdiOption?.isFeasible ? "FEASIBLE" : "NOT FEASIBLE") : "PRETREATMENT REQUIRED",
            outletTds: bestEdiOption?.outletTds ?? null,
            recovery: bestEdiOption?.recovery ?? null,
            sec: bestEdiOption?.sec ?? null,
            reason: ediReason
        });

        if (!bestInfeasible && !bestEdiOption?.isFeasible) {
            bestInfeasible = bestEdiOption;
        }
     // --- 5. EVALUATE ED (when requested) ---
    if (isEdRequested) {
        const isEdFeedCompliant = feedTds <= 12000.0 && (scFeed.hardness ?? 0) <= 400.0;
        let bestEdOption = null;

        if (isEdFeedCompliant) {
            for (const v of [1.0, 1.2, 1.4]) {
                for (const p of [50, 100, 150]) {
                    try {
                        const res = calculateEngineering({
                            technology: "ED",
                            feedWater: scFeed,
                            voltage: v,
                            cellPairs: p,
                            targetTds,
                            targetRecovery
                        });
                        const cand = evaluateTechnologyCandidate({
                            key: "ED",
                            name: "ED",
                            feedWater: scFeed,
                            model: res,
                            targetTds,
                            targetRecovery
                        });
                        const resRec = ((res.waterRecoveryPct ?? res.waterRecovery ?? 0) <= 1.0 && (res.waterRecoveryPct ?? res.waterRecovery ?? 0) > 0)
                            ? (res.waterRecoveryPct ?? res.waterRecovery) * 100
                            : (res.waterRecoveryPct ?? res.waterRecovery ?? 0);
                        const isTargetMet = res.outletTds <= targetTds + 0.05 && resRec >= targetRecovery - 0.5;
                        const isFeasible = cand.isFeasible && isTargetMet;
                        const isInRecommended = isFeasible && (v <= 1.4);

                        const option = {
                            engModel: res,
                            selectedCandidate: cand,
                            tech: "ED",
                            isFeasible,
                            isInRecommended,
                            pairs: res.cellPairs ?? p,
                            modules: 1,
                            cellCurrent: Number(res.current ?? 0),
                            currentDensity: Number(res.currentDensity ?? 0),
                            cellVoltage: v,
                            electrodeArea: Number(res.electrodeArea ?? 350),
                            sec: res.secElectricalGross ?? res.sec ?? 0,
                            outletTds: res.outletTds,
                            recovery: resRec,
                            reason: isFeasible ? "Fully compliant with ED operational envelope." : cand.rejectionReason
                        };
                        if (isFeasible) feasibleOptions.push(option);
                        if (!bestEdOption || (option.isFeasible && !bestEdOption.isFeasible)) bestEdOption = option;
                    } catch (e) {}
                }
            }
        }

        const edReason = !isEdFeedCompliant
            ? `Feed violates ED maximum limits (Feed TDS ${feedTds} mg/L > 12000 mg/L or Hardness ${scFeed.hardness ?? 0} mg/L > 400 mg/L).`
            : (bestEdOption?.reason ?? "Targets not met.");

        evaluatedTechnologies.push({
            tech: "ED",
            name: "Electrodialysis",
            isFeasible: bestEdOption?.isFeasible ?? false,
            isInRecommended: bestEdOption?.isInRecommended ?? false,
            status: isEdFeedCompliant ? (bestEdOption?.isFeasible ? "FEASIBLE" : "NOT FEASIBLE") : "CONSTRAINTS EXCEEDED",
            outletTds: bestEdOption?.outletTds ?? null,
            recovery: bestEdOption?.recovery ?? null,
            sec: bestEdOption?.sec ?? null,
            reason: edReason
        });

        if (!bestInfeasible && !bestEdOption?.isFeasible) {
            bestInfeasible = bestEdOption;
        }
    }

    // --- 6. EVALUATE EDR (when requested) ---
    if (isEdRequested) {
        const isEdrFeedCompliant = feedTds <= 15000.0 && (scFeed.hardness ?? 0) <= 800.0;
        let bestEdrOption = null;

        if (isEdrFeedCompliant) {
            for (const v of [1.0, 1.2, 1.4]) {
                for (const p of [50, 100, 150]) {
                    try {
                        const res = calculateEngineering({
                            technology: "EDR",
                            feedWater: scFeed,
                            voltage: v,
                            cellPairs: p,
                            targetTds,
                            targetRecovery
                        });
                        const cand = evaluateTechnologyCandidate({
                            key: "EDR",
                            name: "EDR",
                            feedWater: scFeed,
                            model: res,
                            targetTds,
                            targetRecovery
                        });
                        const resRec = ((res.waterRecoveryPct ?? res.waterRecovery ?? 0) <= 1.0 && (res.waterRecoveryPct ?? res.waterRecovery ?? 0) > 0)
                            ? (res.waterRecoveryPct ?? res.waterRecovery) * 100
                            : (res.waterRecoveryPct ?? res.waterRecovery ?? 0);
                        const isTargetMet = res.outletTds <= targetTds + 0.05 && resRec >= targetRecovery - 0.5;
                        const isFeasible = cand.isFeasible && isTargetMet;
                        const isInRecommended = isFeasible && (v <= 1.4);

                        const option = {
                            engModel: res,
                            selectedCandidate: cand,
                            tech: "EDR",
                            isFeasible,
                            isInRecommended,
                            pairs: res.cellPairs ?? p,
                            modules: 1,
                            cellCurrent: Number(res.current ?? 0),
                            currentDensity: Number(res.currentDensity ?? 0),
                            cellVoltage: v,
                            electrodeArea: Number(res.electrodeArea ?? 350),
                            sec: res.secElectricalGross ?? res.sec ?? 0,
                            outletTds: res.outletTds,
                            recovery: resRec,
                            reason: isFeasible ? "Fully compliant with EDR high-scaling operational envelope." : cand.rejectionReason
                        };
                        if (isFeasible) feasibleOptions.push(option);
                        if (!bestEdrOption || (option.isFeasible && !bestEdrOption.isFeasible)) bestEdrOption = option;
                    } catch (e) {}
                }
            }
        }

        const edrReason = !isEdrFeedCompliant
            ? `Feed violates EDR maximum limits (Feed TDS ${feedTds} mg/L > 15000 mg/L or Hardness ${scFeed.hardness ?? 0} mg/L > 800 mg/L).`
            : (bestEdrOption?.reason ?? "Targets not met.");

        evaluatedTechnologies.push({
            tech: "EDR",
            name: "Electrodialysis Reversal",
            isFeasible: bestEdrOption?.isFeasible ?? false,
            isInRecommended: bestEdrOption?.isInRecommended ?? false,
            status: isEdrFeedCompliant ? (bestEdrOption?.isFeasible ? "FEASIBLE" : "NOT FEASIBLE") : "CONSTRAINTS EXCEEDED",
            outletTds: bestEdrOption?.outletTds ?? null,
            recovery: bestEdrOption?.recovery ?? null,
            sec: bestEdrOption?.sec ?? null,
            reason: edrReason
        });

        if (!bestInfeasible && !bestEdrOption?.isFeasible) {
            bestInfeasible = bestEdrOption;
        }
    }
    }

    // --- SYNTHESIZE FEASIBLE TECHNOLOGIES & SELECT BEST CANDIDATE ---
    // Strictly evaluate configurations in the RECOMMENDED envelope
    const recommendedFeasibleOptions = feasibleOptions.filter(o => o.isFeasible && o.isInRecommended);
    const candidatePool = recommendedFeasibleOptions;
    const feasibleTechs = Array.from(new Set(candidatePool.map(o => o.tech)));

    let chosenOption = null;
    if (candidatePool.length > 0) {
        // Authoritative platform ranking using rankFeasibleCandidates
        const candidates = candidatePool.map(o => o.selectedCandidate);
        const rankedCandidates = rankFeasibleCandidates(candidates, targetTds, targetRecovery, feedTds);
        const bestCandidate = rankedCandidates[0];
        chosenOption = candidatePool.find(o => o.selectedCandidate === bestCandidate || o.tech === bestCandidate?.key) || candidatePool[0];
    } else if (baseTech && baseTech !== "AUTO" && feasibleOptions.filter(o => o.tech === baseTech).length > 0) {
        // Available in extended envelope for baseTech
        chosenOption = feasibleOptions.find(o => o.tech === baseTech);
    }

    const summaryStr = feasibleTechs.length > 0 ? feasibleTechs.join(", ") : "None";

    if (chosenOption) {
        return {
            ...chosenOption,
            feasibleTechnologies: feasibleTechs,
            feasibleTechSummary: summaryStr,
            evaluatedTechnologies
        };
    }

    const techSpecificInfeasible = (baseTech && baseTech !== "AUTO")
        ? evaluatedTechnologies.find(t => t.tech === baseTech)
        : null;

    return bestInfeasible ? {
        ...bestInfeasible,
        tech: baseTech !== "AUTO" ? baseTech : (bestInfeasible.tech || "NONE"),
        isFeasible: false,
        isInRecommended: false,
        feasibleTechnologies: [],
        feasibleTechSummary: "None",
        evaluatedTechnologies,
        reason: techSpecificInfeasible?.reason || bestInfeasible.reason || "Physical constraints not met."
    } : {
        tech: baseTech !== "AUTO" ? baseTech : "NONE",
        isFeasible: false,
        isInRecommended: false,
        feasibleTechnologies: [],
        feasibleTechSummary: "None",
        evaluatedTechnologies,
        reason: techSpecificInfeasible?.reason || "No registered configuration satisfies all engineering constraints within envelope."
    };
}

/**
 * Supported sweep parameters and their physical metadata
 */
export const SWEEP_PARAMETERS = {
    "Feed TDS": {
        key: "feedTds",
        unit: "mg/L",
        defaultFrom: 500,
        defaultTo: 1000,
        min: 1,
        max: 30000,
        step: 50,
        description: "Influent total dissolved solids concentration"
    },
    "Feed Flow": {
        key: "feedFlow",
        unit: "L/min",
        defaultFrom: 5,
        defaultTo: 25,
        min: 0.5,
        max: 100,
        step: 1,
        description: "Influent volumetric feed flow rate"
    },
    "Recovery": {
        key: "recovery",
        unit: "%",
        defaultFrom: 85,
        defaultTo: 98,
        min: 10,
        max: 99,
        step: 1,
        description: "Target volumetric clean water recovery"
    },
    "Cell Voltage": {
        key: "cellVoltage",
        unit: "V",
        defaultFrom: 1.0,
        defaultTo: 1.6,
        min: 0.5,
        max: 2.0,
        step: 0.1,
        description: "Individual unit cell operating potential"
    },
    "Cell Pairs": {
        key: "cellPairs",
        unit: "pairs",
        defaultFrom: 20,
        defaultTo: 60,
        min: 2,
        max: 500,
        step: 5,
        description: "Number of repeating cell pairs in stack"
    },
    "Active Area": {
        key: "activeArea",
        unit: "cm²",
        defaultFrom: 200,
        defaultTo: 500,
        min: 50,
        max: 2000,
        step: 50,
        description: "Active projected electrode area per cell pair"
    }
};

/**
 * Generates an array of evenly spaced numeric scenario values.
 */
export function generateScenarioValues({ from, to, count }) {
    const numFrom = Number(from);
    const numTo = Number(to);
    const numCount = Math.max(2, Math.min(20, Math.round(Number(count) || 6)));

    if (isNaN(numFrom) || isNaN(numTo) || numFrom >= numTo || numFrom <= 0 || numTo <= 0) {
        return [];
    }

    const step = (numTo - numFrom) / (numCount - 1);
    const values = [];
    for (let i = 0; i < numCount; i++) {
        const val = numFrom + (i * step);
        // Round to reasonable precision based on magnitude
        const precision = Math.abs(step) < 0.1 ? 3 : Math.abs(step) < 1 ? 2 : 1;
        values.push(Number(val.toFixed(precision)));
    }
    return values;
}

/**
 * Formats sweep points display cleanly with arrow separators.
 * For larger counts (> 6 cases), displays condensed summary: e.g. "500 → 550 → 600 → ... → 1000 mg/L".
 */
export function formatSweepPoints(values = [], unit = "") {
    if (!Array.isArray(values) || values.length === 0) {
        return { formatted: "—", isCondensed: false, fullList: [] };
    }

    if (values.length <= 6) {
        return {
            formatted: `${values.join(" → ")} ${unit}`.trim(),
            isCondensed: false,
            fullList: values
        };
    }

    // Condensed format for > 6 cases to preserve clean industrial layout
    const firstThree = values.slice(0, 3);
    const last = values[values.length - 1];
    return {
        formatted: `${firstThree.join(" → ")} → ... → ${last} ${unit}`.trim(),
        isCondensed: true,
        fullList: values
    };
}

/**
 * Validates sweep configuration before scenario execution.
 */
export function validateSweepConfig({ parameter, from, to, count }) {
    const errors = [];
    const meta = SWEEP_PARAMETERS[parameter];

    if (!meta) {
        errors.push(`Unsupported sweep parameter: "${parameter}".`);
        return { isValid: false, errors };
    }

    const numFrom = Number(from);
    const numTo = Number(to);
    const numCount = Number(count);

    if (isNaN(numFrom) || isNaN(numTo)) {
        errors.push("Both 'From' and 'To' values must be valid numbers.");
    }

    if (numFrom <= 0) {
        errors.push(`'From' value must be greater than zero.`);
    }

    if (numTo <= 0) {
        errors.push(`'To' value must be greater than zero.`);
    }

    if (numFrom >= numTo) {
        errors.push(`'From' value (${numFrom}) must be strictly less than 'To' value (${numTo}) for an increasing parameter sweep.`);
    }

    if (isNaN(numCount) || numCount < 2 || numCount > 20) {
        errors.push("Number of scenario cases must be between 2 and 20.");
    }

    if (parameter === "Recovery") {
        if (numFrom < 10 || numTo >= 100) {
            errors.push("Water recovery must be between 10% and 99%.");
        }
    } else if (parameter === "Cell Voltage") {
        if (numFrom < 0.1 || numTo > 3.0) {
            errors.push("Cell voltage must be between 0.1 V and 3.0 V.");
        }
    } else if (numFrom < meta.min || numTo > meta.max) {
        errors.push(`${parameter} values should stay within physical range [${meta.min} ${meta.unit}, ${meta.max} ${meta.unit}].`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Runs full engineering scenario and sensitivity analysis over the existing physics models.
 * 
 * @param {Object} options
 * @param {Object} options.baseline Current baseline design state
 * @param {string} options.parameter Name of the varying parameter (e.g. 'Feed TDS')
 * @param {number[]} options.values Array of generated parameter values
 * @returns {Object} Scenario analysis results, summary metrics, and recommended operating region
 */
export function runScenarioAnalysis({ baseline = {}, parameter = "Feed TDS", values = [], recalculatePipeline = null, teaInputs = null }) {
    const meta = SWEEP_PARAMETERS[parameter];
    if (!meta || !Array.isArray(values) || values.length === 0) {
        return {
            scenarios: [],
            summary: {
                totalScenarios: 0,
                feasibleCount: 0,
                warningCount: 0,
                infeasibleCount: 0,
                bestRegion: null
            }
        };
    }

    // Extract baseline inputs safely with active design defaults (Target TDS default 50 mg/L)
    const baselineFeed = baseline.feedWater || baseline.feed || {};
    const baseTds = Number(baselineFeed.tds ?? baseline.engineering?.tds ?? baseline.engineering?.feedTds ?? 500);
    const baseFlow = Number(baselineFeed.flowRate ?? baseline.engineering?.flowRate ?? 10);
    const baseTargetTds = Number(baselineFeed.targetTds ?? baseline.engineering?.targetTds ?? 50);
    let rawBaseTargetRecovery = Number(baselineFeed.targetRecovery ?? baselineFeed.recovery ?? baseline.engineering?.targetRecovery ?? baseline.engineering?.waterRecovery ?? 95.0);
    if (rawBaseTargetRecovery > 0 && rawBaseTargetRecovery <= 1.0) rawBaseTargetRecovery *= 100;
    const baseTargetRecovery = rawBaseTargetRecovery;
    const baseHardness = Number(baselineFeed.hardness ?? Math.round(baseTds * 0.3));
    const baseConductivity = Number(baselineFeed.conductivity ?? Math.round(baseTds / 0.65));
    const basePh = Number(baselineFeed.ph ?? 7.2);
    const baseTemp = Number(baselineFeed.temperature ?? 25);
    const basePressure = Number(baselineFeed.pressure ?? 1.0);

    const baseTech = baseline.technology || baseline.input?.technology || "AUTO";
    const baseInputs = baseline.optimizationInputs || {};

    const baseVoltage = Number(baseInputs.voltage ?? baseline.engineering?.voltageCell ?? baseline.engineering?.voltage ?? 1.4);
    const basePairs = Number(baseInputs.cellPairs ?? baseline.engineering?.cellPairs ?? 34);
    const baseArea = Number(baseInputs.electrodeArea ?? baseline.engineering?.electrodeArea ?? 350);
    const baseModules = Number(baseInputs.numberOfModules ?? baseline.engineering?.numberOfModules ?? 1);
    const baseCurrent = (baseInputs.current !== undefined && baseInputs.current !== null && !isNaN(Number(baseInputs.current)))
        ? Number(baseInputs.current)
        : (baseline.engineering?.current !== undefined && baseline.engineering?.current !== null && !isNaN(Number(baseline.engineering.current)))
            ? Number(baseline.engineering.current)
            : null;

    // Clean immutable baseline input template without locking manual current across sweep
    const baselineTemplate = {
        feedWater: {
            tds: baseTds,
            flowRate: baseFlow,
            targetTds: baseTargetTds,
            targetRecovery: baseTargetRecovery,
            conductivity: baseConductivity,
            hardness: baseHardness,
            ph: basePh,
            temperature: baseTemp,
            pressure: basePressure
        },
        technology: baseTech,
        optimizationInputs: {
            voltage: baseVoltage,
            cellPairs: basePairs,
            electrodeArea: baseArea,
            numberOfModules: baseModules
        }
    };

    const scenarios = [];

    values.forEach((val, index) => {
        const scenarioId = `S${String(index + 1).padStart(2, "0")}`;

        // PROBLEM 3 & 4: Deep clone immutable snapshot per scenario.
        // Change ONLY the selected parameter; do not mutate baseline or leak values between scenarios.
        const scInput = JSON.parse(JSON.stringify(baselineTemplate));

        switch (parameter) {
            case "Feed TDS":
                scInput.feedWater.tds = val;
                scInput.feedWater.conductivity = Math.round(val / 0.65);
                scInput.feedWater.hardness = Math.round(val * 0.30);
                scInput.optimizationInputs.tds = val;
                break;
            case "Feed Flow":
                scInput.feedWater.flowRate = val;
                scInput.optimizationInputs.flowRate = val;
                break;
            case "Recovery":
                // PROBLEM 6: Recovery is an INPUT TARGET for scenario generation.
                // Do not set waterRecovery; allow the authoritative model to calculate resulting recovery.
                scInput.feedWater.targetRecovery = val;
                scInput.optimizationInputs.targetRecovery = val;
                break;
            case "Cell Voltage":
                scInput.optimizationInputs.voltage = val;
                break;
            case "Cell Pairs":
                scInput.optimizationInputs.cellPairs = Math.round(val);
                break;
            case "Active Area":
                scInput.optimizationInputs.electrodeArea = val;
                break;
            default:
                break;
        }

        // Check if current scenario reproduces baseline design inputs exactly
        const isBaselineCase = index === 0 && (
            (parameter === "Feed TDS" && Math.abs(val - baseTds) < 0.01) ||
            (parameter === "Feed Flow" && Math.abs(val - baseFlow) < 0.01) ||
            (parameter === "Recovery" && Math.abs(val - baseTargetRecovery) < 0.01) ||
            (parameter === "Cell Voltage" && Math.abs(val - baseVoltage) < 0.01) ||
            (parameter === "Cell Pairs" && Math.abs(val - basePairs) < 0.01) ||
            (parameter === "Active Area" && Math.abs(val - baseArea) < 0.01)
        );

        const baseMode = baseline.engineering?.calculationMode || baseline.inputs?.calculationMode || (baseInputs.current ? "CURRENT_CONTROLLED" : "TARGET_CONTROLLED");
        if (isBaselineCase && baseMode === "CURRENT_CONTROLLED" && baseCurrent !== null) {
            scInput.optimizationInputs.current = baseCurrent;
            scInput.optimizationInputs.calculationMode = "CURRENT_CONTROLLED";
        }

        const scFeed = scInput.feedWater;
        const scOptInputs = scInput.optimizationInputs;

        // Authoritative calculation pipeline & multi-technology scenario optimizer execution
        let unifiedResult = null;
        let engModel = null;
        let aiResult = null;
        let pipelineTech = null;
        let optConfig = null;

        if (typeof recalculatePipeline === "function") {
            try {
                unifiedResult = recalculatePipeline(scOptInputs, baseTech, scFeed);
                engModel = unifiedResult?.engineering;
                aiResult = unifiedResult?.aiRecommendation;
                pipelineTech = unifiedResult?.selectedTechnology;
            } catch (err) {
                console.error("recalculatePipeline scenario execution error:", err);
            }
        }

        if (unifiedResult && unifiedResult.selectedTechnology === null && Array.isArray(unifiedResult.aiRecommendation?.rankedCandidates) && unifiedResult.aiRecommendation.rankedCandidates.length === 0) {
            pipelineTech = "NONE";
            engModel = null;
        } else {
            // Always run multi-technology scenario discovery evaluating registered technologies for EVERY scenario
            optConfig = optimizeScenarioTechnology({
                scFeed,
                scOptInputs,
                parameter,
                baseTech,
                baseline
            });

            const isBaselineSyncCase = Boolean(baseline.engineering) && isBaselineCase;
            if (isBaselineSyncCase) {
                // S01: Strictly consume and independently execute active authoritative model
                const activeBaselineTech = baseline.engineering?.technology || (baseTech !== "AUTO" ? baseTech : (optConfig?.tech || "MCDI"));
                pipelineTech = activeBaselineTech;

                try {
                    const s01CalcInputs = {
                        technology: activeBaselineTech,
                        feedWater: scFeed,
                        ...scOptInputs,
                        ...(baseline.inputs || {})
                    };
                    if (baseMode === "CURRENT_CONTROLLED" && baseCurrent !== null) {
                        s01CalcInputs.current = baseCurrent;
                        s01CalcInputs.calculationMode = "CURRENT_CONTROLLED";
                    } else {
                        delete s01CalcInputs.current;
                        s01CalcInputs.targetTds = scFeed.targetTds;
                        s01CalcInputs.targetRecovery = scFeed.targetRecovery;
                    }
                    engModel = calculateEngineering(s01CalcInputs);
                } catch (e) {
                    console.error("[DesignExplorer] S01 authoritative baseline calculation error:", e);
                }

                // Independent verification that S01 reproduces active baseline engineering metrics
                if (baseline.engineering && engModel) {
                    const baseEng = baseline.engineering;
                    const baseOutlet = Number(baseEng.outletTDS ?? baseEng.outletTds ?? 0);
                    const calcOutlet = Number(engModel.outletTDS ?? engModel.outletTds ?? 0);
                    const baseRec = Number(baseEng.waterRecoveryPct ?? baseEng.waterRecovery ?? 0);
                    const calcRec = Number(engModel.waterRecoveryPct ?? engModel.waterRecovery ?? 0);
                    const isVerified = Math.abs(baseOutlet - calcOutlet) <= 0.05 && Math.abs(baseRec - calcRec) <= 0.1;
                    if (!isVerified) {
                        console.warn(`[DesignExplorer] S01 baseline verification: Active=${baseOutlet} mg/L, Calculated=${calcOutlet} mg/L`);
                    }
                }
            } else if (baseTech !== "AUTO") {
                pipelineTech = baseTech;
                const dynamicPairs = (parameter !== "Cell Pairs" && optConfig?.tech === baseTech && optConfig?.pairs) 
                    ? optConfig.pairs 
                    : scOptInputs.cellPairs;
                try {
                    engModel = calculateEngineering({
                        technology: baseTech,
                        feedWater: scFeed,
                        ...scOptInputs,
                        ...(dynamicPairs ? { cellPairs: dynamicPairs } : {}),
                        targetTds: scFeed.targetTds,
                        targetRecovery: scFeed.targetRecovery
                    });
                } catch (e) {}
            } else {
                if (optConfig?.engModel) {
                    engModel = optConfig.engModel;
                    pipelineTech = optConfig.tech;
                } else {
                    try {
                        engModel = calculateEngineering({
                            technology: optConfig?.tech || "MCDI",
                            feedWater: scFeed,
                            ...scOptInputs
                        });
                        pipelineTech = optConfig?.tech || "MCDI";
                    } catch (e) {}
                }
            }
        }

        if (!aiResult) {
            aiResult = aiRecommendation(scFeed);
        }

        // Determine displayed technology:
        let displayTech = baseTech !== "AUTO" ? baseTech : (pipelineTech || optConfig?.tech || aiResult?.selectedTechnology || "MCDI");
        if (displayTech === "AUTO") {
            displayTech = optConfig?.tech || aiResult?.selectedTechnology || "MCDI";
        }
        if (!engModel) {
            displayTech = baseTech !== "AUTO" ? baseTech : "NONE";
            try {
                engModel = calculateEngineering({
                    technology: displayTech !== "NONE" ? displayTech : "MCDI",
                    feedWater: scFeed,
                    ...scOptInputs
                });
            } catch (e) {
                // ignore
            }
        }

        // Evaluate candidate technology compliance
        const selectedCandidate = optConfig?.selectedCandidate || evaluateTechnologyCandidate({
            key: displayTech !== "NONE" ? displayTech : "MCDI",
            name: displayTech !== "NONE" ? displayTech : "NONE",
            feedWater: scFeed,
            model: engModel,
            targetTds: scFeed.targetTds,
            targetRecovery: scFeed.targetRecovery
        });

        // Recalculate dependent engineering variables from authoritative physical model
        const outletTds = Number((engModel?.outletTDS ?? engModel?.outletTds ?? 0).toFixed(1));
        let rawRecovery = engModel?.waterRecoveryPct ?? engModel?.waterRecovery ?? (displayTech === "CDI" ? 83.3 : 95.2);
        if (rawRecovery > 0 && rawRecovery <= 1.0) {
            rawRecovery = rawRecovery * 100;
        }
        const recovery = Number(rawRecovery.toFixed(1));
        const sec = Number((engModel?.secElectricalGross ?? engModel?.secTotalGross ?? engModel?.sec ?? 0).toFixed(3));
        const secGross = sec;
        const secNet = Number((engModel?.secElectricalNet ?? engModel?.secTotalNet ?? engModel?.sec ?? 0).toFixed(4));
        const secPump = Number((engModel?.secPump ?? engModel?.secHydraulic ?? 0).toFixed(5));
        const secHydraulic = secPump;
        const pressureDrop = Number((engModel?.pressureDropPa ?? engModel?.pressureDrop ?? engModel?.HydraulicResult?.totalPressureDrop?.value ?? 220).toFixed(0));
        const cellPairs = isBaselineCase
            ? Number(engModel?.cellPairs ?? basePairs)
            : (parameter === "Cell Pairs" ? Math.round(val) : Number(engModel?.cellPairs ?? optConfig?.pairs ?? scOptInputs.cellPairs ?? 34));
        const electrodeArea = isBaselineCase
            ? Number(engModel?.electrodeArea ?? baseArea)
            : (parameter === "Active Area" ? val : Number(engModel?.electrodeArea ?? optConfig?.electrodeArea ?? scOptInputs.electrodeArea ?? 350));
        const cellVoltage = isBaselineCase
            ? Number(engModel?.voltageCell ?? engModel?.voltage ?? baseVoltage)
            : (parameter === "Cell Voltage" ? val : Number(engModel?.voltageCell ?? engModel?.voltage ?? optConfig?.cellVoltage ?? scOptInputs.voltage ?? 1.4));
        const voltageStack = Number((engModel?.voltageStack ?? (cellVoltage * cellPairs)).toFixed(2));
        const operatingCurrent = isBaselineCase
            ? Number((engModel?.cellCurrent ?? engModel?.current ?? 0).toFixed(4))
            : Number((engModel?.cellCurrent ?? engModel?.current ?? optConfig?.cellCurrent ?? scOptInputs.current ?? 0).toFixed(4));
        const power = Number((engModel?.stackElectricalPowerW ?? engModel?.power ?? (operatingCurrent * voltageStack)).toFixed(1));
        const currentDensity = Number((engModel?.currentDensity ?? (operatingCurrent / (Math.max(0.01, electrodeArea / 10000)))).toFixed(1));
        const flowVelocity = Number((engModel?.flowVelocity ?? engModel?.flowVelocityWater ?? 0.035).toFixed(4));
        const recoveryType = engModel?.recoveryType || (parameter === "Recovery" ? "SWEEP TARGET" : "DESIGN CONSTRAINT");

        // Flow & Salt Mass Balance recalculation and exact residuals
        const prodFlow = Number((engModel?.productFlowLmin ?? (scFeed.flowRate * (recovery / 100))).toFixed(3));
        const rejFlow = Number((engModel?.concentrateFlowLmin ?? Math.max(0, scFeed.flowRate - prodFlow)).toFixed(3));
        const flowResidual = Number(Math.abs(scFeed.flowRate - (prodFlow + rejFlow)).toFixed(4));

        const feedSaltMass = (scFeed.flowRate / 60) * (scFeed.tds / 1000);
        const prodSaltMass = (prodFlow / 60) * (outletTds / 1000);
        const rejTds = Number((engModel?.concentrateTds ?? (rejFlow > 0 ? (((scFeed.flowRate * scFeed.tds) - (prodFlow * outletTds)) / rejFlow) : 0)).toFixed(1));
        const rejSaltMass = (rejFlow / 60) * (rejTds / 1000);
        const saltResidual = Number(Math.abs(feedSaltMass - (prodSaltMass + rejSaltMass)).toFixed(5));

        const isMassBalanceClosed = flowResidual <= 0.005;
        const isSaltBalanceClosed = saltResidual <= 0.001;
        const isBalanceClosed = isMassBalanceClosed && isSaltBalanceClosed;
        const massBalanceStatus = isMassBalanceClosed ? "CLOSED" : "OPEN";
        const saltBalanceStatus = isSaltBalanceClosed ? "CLOSED" : "OPEN";
        const balanceStatus = isBalanceClosed ? "CLOSED" : "OPEN";

        // Feasibility & Operating Range classification
        let feasibilityStatus = "FEASIBLE";
        let feasibilityBadge = "FEASIBLE";
        let feasibilityReason = "Fully compliant with all engineering targets and envelope bounds.";
        let operatingRange = "RECOMMENDED";

        if (optConfig) {
            if (optConfig.isFeasible && optConfig.isInRecommended) {
                feasibilityStatus = "FEASIBLE";
                feasibilityBadge = "FEASIBLE";
                feasibilityReason = "Fully compliant with all engineering targets and envelope bounds.";
                operatingRange = "RECOMMENDED";
            } else if (optConfig.isFeasible && !optConfig.isInRecommended) {
                feasibilityStatus = "FEASIBLE WITH WARNING";
                feasibilityBadge = "FEASIBLE WITH WARNING";
                feasibilityReason = optConfig.reason || "Meets targets, but operates in extended literature range.";
                operatingRange = "EXTENDED RANGE";
            } else {
                feasibilityStatus = "NOT FEASIBLE";
                feasibilityBadge = "NOT FEASIBLE";
                feasibilityReason = optConfig.reason || "No registered technology/configuration satisfies: TDS ≤ 3 mg/L and Recovery ≥ 95% within hard engineering limits.";
                operatingRange = "OUTSIDE LIMITS";
            }
        } else if (displayTech === "NONE") {
            feasibilityStatus = "NOT FEASIBLE";
            feasibilityBadge = "NOT FEASIBLE";
            feasibilityReason = aiResult?.reason || "No registered technology/configuration satisfies: TDS ≤ 3 mg/L and Recovery ≥ 95% within hard engineering limits.";
            operatingRange = "OUTSIDE LIMITS";
        } else if (!selectedCandidate?.isFeasible || !isBalanceClosed) {
            feasibilityStatus = "NOT FEASIBLE";
            feasibilityBadge = "NOT FEASIBLE";
            feasibilityReason = !isBalanceClosed 
                ? "Mass or salt balance residual exceeded tolerance limit."
                : (selectedCandidate?.rejectionReason || "Operating target or physical constraint not met.");
            operatingRange = "OUTSIDE LIMITS";
        } else {
            // Evaluates whether actual operating configuration operates in an extended envelope
            const isOperatingInExtendedEnvelope = cellVoltage > 1.55 || currentDensity > 200.0 || recovery > 95.5;
            if (isOperatingInExtendedEnvelope) {
                feasibilityStatus = "FEASIBLE WITH WARNING";
                feasibilityBadge = "FEASIBLE WITH WARNING";
                feasibilityReason = "Meets targets, but operating configuration operates in extended parameter envelope.";
                operatingRange = "EXTENDED RANGE";
            } else {
                feasibilityStatus = "FEASIBLE";
                feasibilityBadge = "FEASIBLE";
                feasibilityReason = "Fully compliant with all engineering targets and envelope bounds.";
                operatingRange = "RECOMMENDED";
            }
        }

        // Align technology recommendation status with feasibility outcome
        let recomStatus = "RECOMMENDED";
        if (baseTech === "AUTO") {
            if (feasibilityStatus === "FEASIBLE") {
                recomStatus = "RECOMMENDED";
            } else if (feasibilityStatus === "FEASIBLE WITH WARNING") {
                recomStatus = "RECOMMENDED WITH WARNING";
            } else {
                recomStatus = displayTech !== "NONE" ? "BEST AVAILABLE (INFEASIBLE)" : "NONE";
            }
        } else {
            if (feasibilityStatus === "FEASIBLE") {
                recomStatus = "FEASIBLE";
            } else if (feasibilityStatus === "FEASIBLE WITH WARNING") {
                recomStatus = "RECOMMENDED WITH WARNING";
            } else {
                recomStatus = "NOT FEASIBLE";
            }
        }

        // PROBLEM 14: Diagnostic Logging for scenario tracing
        console.log(`[${scenarioId}]
Feed TDS: ${scFeed.tds}
Technology: ${displayTech}
Product TDS: ${outletTds}
Recovery: ${recovery}
SEC: ${sec}
Current: ${operatingCurrent}
Voltage: ${cellVoltage}
Power: ${power}
ΔP: ${pressureDrop}
Mass residual: ${flowResidual}
Salt residual: ${saltResidual}
Operating range: ${operatingRange}
Feasibility: ${feasibilityStatus}`);

        // TEA Economic Analysis for Scenario
        const scenarioTea = calculateTEA({
            engineering: engModel || {
                flowRate: scFeed.flowRate,
                feedFlow: scFeed.flowRate,
                productFlowLmin: prodFlow,
                waterRecoveryPct: recovery,
                waterRecovery: recovery,
                secElectricalGross: sec,
                sec,
                stackElectricalPowerW: power,
                power,
                technology: displayTech,
                cellPairs,
                electrodeArea,
                numberOfModules: optConfig?.modules ?? engModel?.numberOfModules ?? scOptInputs.numberOfModules ?? 1
            },
            economicInputs: teaInputs || baseline?.teaInputs || DEFAULT_TEA_INPUTS,
            scaleWithDesign: true
        });

        scenarios.push({
            id: scenarioId,
            scenarioId,
            parameter,
            parameterName: parameter,
            paramValue: val,
            parameterValue: val,
            paramFormatted: `${val} ${meta.unit}`,
            feedTds: scFeed.tds,
            feedFlow: scFeed.flowRate,
            targetTds: scFeed.targetTds,
            targetRecovery: scFeed.targetRecovery,
            scenarioInputs: {
                tds: scFeed.tds,
                flowRate: scFeed.flowRate,
                targetTds: scFeed.targetTds,
                targetRecovery: scFeed.targetRecovery
            },
            candidateResults: optConfig?.candidateResults || aiResult?.technologyAssessment?.allCandidates || [],
            recommendedTechnology: optConfig?.tech || aiResult?.selectedTechnology || "MCDI",
            selectedTechnology: baseTech !== "AUTO" ? baseTech : (optConfig?.tech || aiResult?.selectedTechnology || "MCDI"),
            selectionReason: optConfig?.reason || aiResult?.reason || feasibilityReason,
            cellVoltage,
            cellPairs,
            activeArea: electrodeArea,
            electrodeArea,
            technology: displayTech,
            outletTds,
            productTds: outletTds,
            recovery,
            calculatedRecovery: recovery,
            recoveryType,
            stackVoltage: voltageStack,
            voltageStack,
            power,
            stackPower: power,
            current: operatingCurrent,
            currentDensity,
            sec,
            secGross,
            secNet,
            secPump,
            secHydraulic,
            electricalSec: sec,
            hydraulicSec: secPump,
            pressureDrop,
            channelPressureDropPa: pressureDrop,
            flowVelocity,
            chargeEfficiency: Number(engModel?.chargeEfficiency ?? 90),
            sac: Number(engModel?.sac ?? 0),
            productFlow: prodFlow,
            rejectFlow: rejFlow,
            concentrateTds: rejTds,
            flowResidual,
            flowBalanceResidual: flowResidual,
            saltResidual,
            saltBalanceResidual: saltResidual,
            massBalanceStatus,
            saltBalanceStatus,
            balanceStatus,
            waterBalance: {
                residual: flowResidual,
                tolerance: 0.005,
                status: massBalanceStatus,
                isBalanced: isMassBalanceClosed
            },
            saltBalance: {
                residual: saltResidual,
                tolerance: 0.001,
                status: saltBalanceStatus,
                isBalanced: isSaltBalanceClosed
            },
            faradayBalance: {
                faradaySaltRateMgS: Number((engModel?.faradayChargeReconciliation?.faradaySaltRemovalMgS ?? (operatingCurrent * cellPairs * (Number(engModel?.chargeEfficiency ?? 90) / 100) / 96485 * 58.44 * 1000)).toFixed(4)),
                streamSaltRateMgS: Number((engModel?.faradayChargeReconciliation?.streamSaltRemovalMgS ?? Math.max(0, (feedSaltMass - prodSaltMass) * 1000)).toFixed(4)),
                residualMg: Number(Math.abs((engModel?.faradayChargeReconciliation?.faradaySaltRemovedPerCycleMg ?? 0) - (engModel?.faradayChargeReconciliation?.streamSaltRemovedPerCycleMg ?? 0)).toFixed(2)),
                relativeErrorPct: Number((engModel?.faradayChargeReconciliation?.chargeBalanceRelativeErrorPct ?? 0).toFixed(4)),
                tolerancePct: 0.5,
                status: (engModel?.faradayChargeReconciliation?.isConserved ?? true) ? "CLOSED" : "DISCREPANCY"
            },
            faradayBalanceStatus: (engModel?.faradayChargeReconciliation?.isConserved ?? true) ? "CLOSED" : "DISCREPANCY",
            isFaradayBalanceClosed: Boolean(engModel?.faradayChargeReconciliation?.isConserved ?? true),
            calculationTrace: {
                technology: displayTech,
                modelId: engModel?.modelPedigree ? `${displayTech}-FIRST-PRINCIPLES` : `${displayTech}-MODEL`,
                equationId: engModel?.faradayChargeReconciliation?.equationId || "EQ-03-04",
                inputs: {
                    feedTds: scFeed.tds,
                    feedFlowLmin: scFeed.flowRate,
                    targetTds: scFeed.targetTds,
                    targetRecovery: scFeed.targetRecovery,
                    recoveryType,
                    cellVoltage,
                    cellPairs,
                    electrodeArea,
                    current: operatingCurrent
                },
                outputs: {
                    productFlowLmin: prodFlow,
                    concentrateFlowLmin: rejFlow,
                    outletTds,
                    concentrateTds: rejTds,
                    stackVoltage: voltageStack,
                    powerW: power,
                    secElectricalGross: sec,
                    secHydraulic: secPump,
                    pressureDropPa: pressureDrop,
                    flowVelocity
                },
                balances: {
                    waterResidualLmin: flowResidual,
                    saltResidualGs: saltResidual,
                    faradayDiscrepancyPct: Number((engModel?.faradayChargeReconciliation?.chargeBalanceRelativeErrorPct ?? 0).toFixed(4))
                },
                governingEquations: ["EQ-01-02", "EQ-02-02", "EQ-03-04", "EQ-03-05", "EQ-03-06"],
                operatingRange,
                feasibility: feasibilityStatus
            },
            operatingRange,
            feasibility: feasibilityStatus,
            feasibilityBadge,
            feasibilityReason,
            reason: feasibilityReason,
            failureReason: feasibilityStatus === "FEASIBLE" ? null : feasibilityReason,
            isFeasible: feasibilityStatus === "FEASIBLE",
            isWarning: feasibilityStatus === "FEASIBLE WITH WARNING",
            isPass: feasibilityStatus === "FEASIBLE" || feasibilityStatus === "FEASIBLE WITH WARNING",
            score: selectedCandidate?.score ?? 50,
            // TEA Economic outputs
            capex: scenarioTea.capexInr,
            annualOpex: scenarioTea.annualOpexInr,
            energyCost: scenarioTea.annualEnergyCostInr,
            operatingTreatmentCost: scenarioTea.operatingTreatmentCostInrPerM3,
            treatmentCost: scenarioTea.operatingTreatmentCostInrPerM3,
            annualProductWater: scenarioTea.annualProductWaterM3,
            annualEnergyKwh: scenarioTea.annualEnergyConsumptionKwh,
            tea: scenarioTea,
            // Detailed scenario inspection payload
            inputs: {
                feedTds: scFeed.tds,
                feedFlow: scFeed.flowRate,
                targetTds: scFeed.targetTds,
                targetRecovery: scFeed.targetRecovery,
                recovery: scFeed.targetRecovery,
                recoveryType,
                cellVoltage: parameter === "Cell Voltage" ? val : Number(scOptInputs.voltage ?? baseVoltage ?? 1.4),
                cellPairs,
                activeArea: electrodeArea,
                modules: optConfig?.modules ?? engModel?.numberOfModules ?? scOptInputs.numberOfModules ?? 1,
                current: operatingCurrent
            },
            outputs: {
                productTds: outletTds,
                productFlow: prodFlow,
                rejectFlow: rejFlow,
                recovery,
                recoveryType,
                sec,
                electricalSec: sec,
                hydraulicSec: secPump,
                stackPower: power,
                stackVoltage: voltageStack,
                pressureDrop,
                flowVelocity,
                capex: scenarioTea.capexInr,
                annualOpex: scenarioTea.annualOpexInr,
                energyCost: scenarioTea.annualEnergyCostInr,
                operatingTreatmentCost: scenarioTea.operatingTreatmentCostInrPerM3,
                treatmentCost: scenarioTea.operatingTreatmentCostInrPerM3
            },
            balances: {
                flowResidual,
                saltResidual,
                balanceStatus
            },
            feasibilityDetail: {
                tdsTarget: scFeed.targetTds,
                recoveryTarget: scFeed.targetRecovery,
                isTdsPass: Boolean(selectedCandidate?.isTdsPass),
                isRecPass: Boolean(selectedCandidate?.isRecPass),
                isHardLimitPass: Boolean(selectedCandidate?.isHardLimitPass),
                isInRecommendedRange: Boolean(selectedCandidate?.isInRecommendedRange),
                requiresPretreatment: Boolean(selectedCandidate?.requiresPretreatment || selectedCandidate?.isActionRequired),
                finalFeasibility: feasibilityStatus
            },
            feasibleTechnologies: optConfig?.feasibleTechnologies || [displayTech],
            feasibleTechSummary: optConfig?.feasibleTechSummary || displayTech,
            allEvaluatedTechs: optConfig?.evaluatedTechnologies || [],
            technologyDetail: {
                selectedTechnology: displayTech,
                recommendationStatus: recomStatus,
                reason: feasibilityReason,
                feasibleTechnologies: optConfig?.feasibleTechnologies || [displayTech],
                feasibleTechSummary: optConfig?.feasibleTechSummary || displayTech,
                allEvaluatedTechs: optConfig?.evaluatedTechnologies || []
            }
        });
    });

    // PROBLEM 9: Compute Summary & Best Case strictly on RECOMMENDED + FEASIBLE configurations
    const totalScenarios = scenarios.length;
    const feasibleCases = scenarios.filter(s => s.feasibility === "FEASIBLE" && s.operatingRange === "RECOMMENDED");
    const infeasibleCases = scenarios.filter(s => s.feasibility !== "FEASIBLE" || s.operatingRange !== "RECOMMENDED");

    // Feasible-design discovery filter: Only keep scenarios that satisfy engineering targets and are RECOMMENDED + FEASIBLE
    // Infeasible, extended-envelope, and warning candidate cases are automatically discarded from displayed results
    const displayedScenarios = scenarios.filter(s => s.feasibility === "FEASIBLE" && s.operatingRange === "RECOMMENDED");

    let bestRegion = null;

    if (feasibleCases.length > 0) {
        // Strictly FEASIBLE: lowest SEC, then highest recovery
        const sortedFeasible = [...feasibleCases].sort((a, b) => {
            if (Math.abs(a.sec - b.sec) > 0.0001) return a.sec - b.sec;
            return b.recovery - a.recovery;
        });

        const bestScenario = sortedFeasible[0];
        const minVal = Math.min(...feasibleCases.map(s => s.paramValue));
        const maxVal = Math.max(...feasibleCases.map(s => s.paramValue));

        const bestCaseFormatted = bestScenario.paramFormatted;
        bestRegion = {
            isFeasibleFound: true,
            isWarningFound: false,
            status: "FEASIBLE",
            title: "BEST CASE — FEASIBLE",
            statusLabel: "FEASIBLE",
            rangeLabel: "Tested Feasible Range",
            bestCaseFormatted,
            bestScenarioId: bestScenario.id,
            bestParamValue: bestScenario.paramValue,
            bestParamFormatted: bestScenario.paramFormatted,
            bestTechnology: bestScenario.technology,
            bestSec: bestScenario.sec,
            bestOutletTds: bestScenario.outletTds,
            bestRecovery: bestScenario.recovery,
            bestPressureDrop: bestScenario.pressureDrop,
            bestReason: "Lowest SEC among tested fully feasible scenarios.",
            rangeMin: minVal,
            rangeMax: maxVal,
            rangeFormatted: minVal === maxVal 
                ? `${minVal} ${meta.unit}`
                : `${minVal}–${maxVal} ${meta.unit}`,
            rationale: `Best feasible configuration in tested range at ${bestScenario.paramFormatted} (${bestScenario.technology}) achieves product TDS of ${bestScenario.outletTds} mg/L at minimum SEC of ${bestScenario.sec.toFixed(3)} kWh/m³ with closed mass/salt balances.`
        };
    } else {
        // Zero fully feasible cases in recommended operating envelope
        bestRegion = {
            isFeasibleFound: false,
            isWarningFound: false,
            status: "NOT FEASIBLE",
            title: "NO FEASIBLE CASE IN TESTED RANGE",
            statusLabel: "NO FEASIBLE CASES",
            rangeLabel: "Tested Range",
            bestCaseFormatted: "—",
            bestScenarioId: "—",
            bestParamValue: null,
            bestParamFormatted: "—",
            bestTechnology: "—",
            bestSec: null,
            bestOutletTds: null,
            bestRecovery: null,
            bestPressureDrop: null,
            bestReason: "All evaluated scenarios violate target specifications or hard engineering boundaries.",
            rangeFormatted: "None within current constraint limits",
            rationale: "All evaluated scenarios violate target specifications or hard engineering boundaries. Adjust baseline targets or expand stack sizing parameters."
        };
    }

    // PROBLEM 9 & 13: Objective, data-driven engineering insight based on discovered feasible scenarios
    let engineeringInsight = "";
    if (displayedScenarios.length >= 2) {
        const firstSc = displayedScenarios[0];
        const lastSc = displayedScenarios[displayedScenarios.length - 1];
        const secDiff = lastSc.sec - firstSc.sec;
        const secPct = firstSc.sec > 0 ? Math.round((Math.abs(secDiff) / firstSc.sec) * 100) : 0;

        if (parameter === "Feed TDS") {
            if (secDiff > 0.005) {
                engineeringInsight = `SEC increases from ${firstSc.sec.toFixed(3)} to ${lastSc.sec.toFixed(3)} kWh/m³ (+${secPct}%) with increasing feed TDS. Mass and salt balances close across all cases.`;
            } else {
                engineeringInsight = `Feed TDS sweep maintains closed mass and salt balances across all ${displayedScenarios.length} feasible cases.`;
            }
        } else if (parameter === "Recovery") {
            engineeringInsight = `Target recovery evaluated from ${firstSc.paramFormatted} to ${lastSc.paramFormatted}. Model calculated recovery remains at ${firstSc.recovery}% based on stack cycle times.`;
        } else if (parameter === "Cell Voltage") {
            engineeringInsight = `Stack active power and SEC scale with cell voltage from ${firstSc.sec.toFixed(3)} to ${lastSc.sec.toFixed(3)} kWh/m³.`;
        } else if (parameter === "Feed Flow") {
            engineeringInsight = `Product flow scales from ${firstSc.productFlow.toFixed(1)} to ${lastSc.productFlow.toFixed(1)} L/min across the tested feed flow range.`;
        } else if (parameter === "Cell Pairs") {
            engineeringInsight = `Cell pairs scale from ${firstSc.cellPairs} to ${lastSc.cellPairs} pairs, distributing current while maintaining product desalination.`;
        } else if (parameter === "Active Area") {
            engineeringInsight = `Active area scales from ${firstSc.activeArea} to ${lastSc.activeArea} cm², reducing current density from ${firstSc.currentDensity} to ${lastSc.currentDensity} A/m² and channel pressure drop from ${firstSc.pressureDrop} to ${lastSc.pressureDrop} Pa.`;
        } else {
            engineeringInsight = `${displayedScenarios.length} of ${totalScenarios} tested cases meet design targets.`;
        }
    } else if (displayedScenarios.length === 1) {
        engineeringInsight = `1 feasible scenario discovered meeting all design targets at ${displayedScenarios[0].paramFormatted} (${displayedScenarios[0].technology}).`;
    } else {
        engineeringInsight = `All evaluated scenarios violate target specifications (target TDS ≤ ${baseTargetTds} mg/L or Target Recovery ≥ ${baseTargetRecovery}%).`;
    }

    return {
        parameter,
        unit: meta.unit,
        baselineSummary: {
            feedTds: baseTds,
            feedFlow: baseFlow,
            targetTds: baseTargetTds,
            targetRecovery: baseTargetRecovery,
            technology: baseTech,
            cellVoltage: baseVoltage,
            cellPairs: basePairs,
            electrodeArea: baseArea
        },
        scenarios: displayedScenarios,
        allScenarios: scenarios,
        summary: {
            totalCandidateCases: totalScenarios,
            totalScenarios,
            feasibleCount: feasibleCases.length,
            warningCount: 0,
            discardedCount: infeasibleCases.length,
            infeasibleCount: infeasibleCases.length,
            bestCaseTech: bestRegion?.bestTechnology,
            bestRegion
        },
        engineeringInsight
    };
}
