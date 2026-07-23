import calculateEngineering from "./engineeringEquationEngine.js";

/**
 * AI Technology Recommendation Engine
 * Evaluates physical feasibility and runs engineering equations to produce calculated recommendations.
 */
function aiRecommendation(feedWater = {}) {
    const tds = Number(feedWater.tds ?? 500);
    const targetTds = Number(feedWater.targetTds ?? 50);
    const flowRate = Number(feedWater.flowRate ?? 10);

    const requiredRemoval = tds > 0 ? Math.max(0, ((tds - targetTds) / tds) * 100) : 90.0;
    const maxFCDIRemoval = 95.0; // Physical removal limit of single-stage FCDI

    let selectedTechnology = "CDI";
    let recommendedProcess = "CDI";
    let reason = "";

    if (tds > 3000) {
        // High TDS (>3000 ppm): Do NOT recommend MCDI.
        const expectedOutletSingleStage = tds * (1 - maxFCDIRemoval / 100);
        if (requiredRemoval > maxFCDIRemoval || expectedOutletSingleStage > targetTds) {
            selectedTechnology = "FCDI + EDI (Two-Stage)";
            recommendedProcess = "FCDI → EDI";
            reason = "High feed TDS (>3000 ppm) with high removal requirement exceeds single-stage FCDI limits. Recommended process: FCDI → EDI — FCDI performs bulk desalination and EDI performs polishing as required removal exceeds single-stage capability.";
        } else {
            selectedTechnology = "FCDI";
            recommendedProcess = "FCDI";
            reason = "High feed TDS (>3000 ppm) stream favors Flowable Electrode CDI (FCDI) continuous slurry desalting.";
        }
    } else if (tds < 100 || targetTds < 10) {
        selectedTechnology = "EDI";
        recommendedProcess = "EDI";
        reason = "Low feed TDS / ultra-pure polishing requirement is ideal for EDI resin-membrane stack.";
    } else if (tds <= 1000) {
        if (requiredRemoval > 85.0) {
            selectedTechnology = "MCDI";
            recommendedProcess = "MCDI";
            reason = "Moderate salinity feed water with high removal target favors membrane-assisted CDI (MCDI).";
        } else {
            selectedTechnology = "CDI";
            recommendedProcess = "CDI";
            reason = "Low-to-moderate salinity feed water is suitable for standard capacitive deionization (CDI).";
        }
    } else {
        // 1000 - 3000 ppm
        if (requiredRemoval > maxFCDIRemoval) {
            selectedTechnology = "FCDI + EDI (Two-Stage)";
            recommendedProcess = "FCDI → EDI";
            reason = "Feed water salinity and target purity requirement exceeds single-stage capacity. Recommended process: FCDI → EDI — FCDI performs bulk desalination and EDI performs polishing as required removal exceeds single-stage capability.";
        } else {
            selectedTechnology = "FCDI";
            recommendedProcess = "FCDI";
            reason = "Salinity level favors Flowable Electrode CDI (FCDI) continuous desalting.";
        }
    }

    const techForCalculation = selectedTechnology.includes("FCDI") ? "FCDI" : (selectedTechnology.includes("EDI") ? "EDI" : selectedTechnology);

    // Run exact physical engineering calculation for the recommended technology
    const eng = calculateEngineering({
        technology: techForCalculation,
        feedWater,
        flowRate
    });

    return {
        selectedTechnology,
        technology: selectedTechnology,
        recommendedProcess,
        confidence: 95,
        reason,
        voltage: eng.voltage,
        current: eng.current,
        cellPairs: eng.cellPairs,
        electrodeArea: eng.electrodeArea,
        flowRate: eng.flowRate,
        flowVelocity: eng.flowVelocity,
        residenceTime: eng.residenceTime,
        pressureDrop: eng.pressureDrop,
        pumpPower: eng.pumpPower,
        waterRecovery: eng.waterRecovery,
        recommendedVoltage: eng.voltage,
        recommendedCurrent: eng.current,
        recommendedCellPairs: eng.cellPairs,
        expectedRemoval: eng.removalEfficiency,
        expectedOutletTDS: eng.outletTDS,
        expectedSEC: eng.sec,
        operatingMode: selectedTechnology.includes("EDI") ? "Continuous Ion Migration" : (selectedTechnology.includes("FCDI") ? "Continuous Slurry Flow" : "Adsorption / Desorption")
    };
}

export default aiRecommendation;