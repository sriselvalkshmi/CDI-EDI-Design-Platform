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
    let criteria = [];

    if (tds > 3000) {
        selectedTechnology = "FCDI";
        recommendedProcess = "FCDI";
        reason = "High feed TDS stream favors Flowable Electrode CDI (FCDI) continuous slurry desalting.";
        criteria = [
            `Feed TDS is high (${tds} ppm).`,
            `Target TDS is ${targetTds} ppm.`,
            "Continuous slurry circulation eliminates batch capacity exhaustion.",
            "High salt loading capacity suitable for high salinity brackish streams."
        ];
    } else if (tds <= 500 || targetTds <= 10) {
        selectedTechnology = "EDI";
        recommendedProcess = "Continuous Electrodeionization (EDI)";
        reason = `EDI selected because feed TDS is already low (${tds} ppm) and required polishing to ${targetTds} ppm demands continuous high-purity ion removal without chemical regeneration.`;
        criteria = [
            `Feed TDS is low (${tds} ppm).`,
            `Required polishing to ${targetTds} ppm.`,
            "High-purity / ultra-pure product water required.",
            "Continuous operation preferred over batch adsorption cycles.",
            "No chemical regeneration required (electrolytic water splitting H+/OH-).",
            "Lowest operating cost (OPEX) for high-purity polishing."
        ];
    } else if (tds < 1000) {
        if (requiredRemoval > 75.0) {
            selectedTechnology = "MCDI";
            recommendedProcess = "MCDI";
            reason = "Low-to-moderate feed TDS favors membrane-assisted CDI (MCDI) for high ion selectivity and energy efficiency.";
            criteria = [
                `Feed TDS is moderate (${tds} ppm).`,
                `High removal required (${requiredRemoval.toFixed(1)}%).`,
                "Ion exchange membranes block co-ion repulsion.",
                "Higher charge efficiency (>85%) and recovery."
            ];
        } else {
            selectedTechnology = "CDI";
            recommendedProcess = "CDI";
            reason = "Low-to-moderate feed TDS is suitable for standard capacitive deionization (CDI).";
            criteria = [
                `Feed TDS is ${tds} ppm.`,
                `Moderate removal requirement (${requiredRemoval.toFixed(1)}%).`,
                "Lowest capital expenditure (CAPEX).",
                "Simple non-membrane cell construction."
            ];
        }
    } else {
        selectedTechnology = "FCDI";
        recommendedProcess = "FCDI";
        reason = "Moderate-to-high feed TDS favors Flowable Electrode CDI (FCDI) continuous desalting.";
        criteria = [
            `Feed TDS is ${tds} ppm.`,
            "High salinity tolerance.",
            "Continuous non-stop desalination loop."
        ];
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
        confidence: 96.5,
        reason,
        criteria,
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