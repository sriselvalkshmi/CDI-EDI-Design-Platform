import calculateEngineering from "./engineeringEquationEngine.js";

/**
 * AI Technology Recommendation Engine
 * Evaluates physical feasibility and runs engineering equations to produce calculated recommendations.
 * Clearly explains why CDI, MCDI, FCDI, or EDI was selected / required with full engineering rationale:
 * - CDI: Selected for low TDS (<500 ppm), simple non-membrane cell design, lowest CAPEX.
 * - MCDI: Better than CDI (membranes eliminate co-ion expulsion, >92% charge efficiency, higher removal & recovery).
 * - FCDI: Required for high TDS (>1500-3000+ ppm), continuous flow-electrode slurry eliminates batch adsorption saturation.
 * - EDI: Required for ultra-pure polishing (target TDS < 10 ppm or RO permeate feed <= 30 ppm), continuous H+/OH- water splitting resin regeneration.
 */
function aiRecommendation(feedWater = {}) {
    const tds = Number(feedWater.tds ?? 500);
    const targetTds = Number(feedWater.targetTds ?? 50);
    const flowRate = Number(feedWater.flowRate ?? 10);

    const requiredRemoval = tds > 0 ? Math.max(0, ((tds - targetTds) / tds) * 100) : 90.0;

    let selectedTechnology = "CDI";
    let recommendedProcess = "CDI";
    let reason = "";
    let criteria = [];
    let comparativeRationale = {
        whyCDI: "",
        whyMCDIBetter: "",
        whyFCDIRequired: "",
        whyEDIRequired: ""
    };

    if (tds > 3000) {
        selectedTechnology = "FCDI";
        recommendedProcess = targetTds <= 10 ? "FCDI → EDI Polishing" : "Flowable Electrode CDI (FCDI)";
        reason = `High feed TDS stream (${tds} ppm) requires Flowable Electrode CDI (FCDI). Continuous carbon slurry circulation avoids adsorption saturation encountered in static electrode CDI/MCDI.`;
        criteria = [
            `High feed TDS stream (${tds} ppm > 3,000 ppm limit for static electrodes).`,
            `Target TDS is ${targetTds} ppm.`,
            "Continuous carbon slurry circulation eliminates batch capacity exhaustion and cycle pauses.",
            "High salt loading capacity suitable for high-salinity brackish streams."
        ];
    } else if (tds <= 30 || targetTds <= 10) {
        if (tds <= 30) {
            selectedTechnology = "EDI";
            recommendedProcess = "Continuous Electrodeionization (EDI Polishing)";
            reason = `Pre-treated low TDS stream (${tds} ppm) requires Continuous Electrodeionization (EDI). In-situ electrolytic water splitting (H+/OH-) continuously regenerates mixed-bed ion-exchange resin beads without chemical regenerants.`;
            criteria = [
                `Feed TDS is low (${tds} ppm - RO permeate quality).`,
                `Target TDS is ${targetTds} ppm (Ultra-pure polishing).`,
                "Direct continuous EDI polishing without chemical regeneration.",
                "In-situ electrolytic water splitting (H+/OH-) maintains active ion-exchange resin sites.",
                "Eliminates membrane scaling risk and achieves high electrical charge efficiency (>95%)."
            ];
        } else {
            selectedTechnology = "EDI";
            recommendedProcess = "MCDI → EDI Polishing (Multi-Stage)";
            reason = `Feed TDS (${tds} ppm) with ultra-pure target (${targetTds} ppm) requires Sequential Multi-Stage (Stage 1 MCDI bulk desalting down to ~25 ppm followed by Stage 2 EDI polishing). Direct single-stage EDI on high TDS causes membrane scaling and high current density.`;
            criteria = [
                `Feed TDS is ${tds} ppm (requires Stage 1 bulk desalination).`,
                `Target purity is ${targetTds} ppm (requires Stage 2 EDI polishing).`,
                `Stage 1 (MCDI/RO): Bulk ion removal from ${tds} ppm down to ~25 ppm.`,
                `Stage 2 (EDI): High-purity final deionization to ${targetTds} ppm.`,
                "Prevents membrane scaling and avoids excessive current density in EDI module."
            ];
        }
    } else if (tds <= 1000) {
        if (requiredRemoval > 75.0) {
            selectedTechnology = "MCDI";
            recommendedProcess = "Membrane Capacitive Deionization (MCDI)";
            reason = `Moderate feed TDS (${tds} ppm) with high removal requirement (${requiredRemoval.toFixed(1)}%) favors MCDI. Ion-exchange membranes (AEM & CEM) block co-ion expulsion, increasing charge efficiency to >92% compared to standard CDI (~82%).`;
            criteria = [
                `Feed TDS is moderate (${tds} ppm).`,
                `High removal required (${requiredRemoval.toFixed(1)}%).`,
                "AEM & CEM ion exchange membranes eliminate co-ion repulsion.",
                "Higher charge efficiency (>92%) and higher water recovery (95%)."
            ];
        } else {
            selectedTechnology = "CDI";
            recommendedProcess = "Capacitive Deionization (CDI)";
            reason = `Low feed TDS (${tds} ppm) with moderate removal requirement (${requiredRemoval.toFixed(1)}%) is optimal for standard CDI. Lowest capital investment (CAPEX) due to non-membrane cell design.`;
            criteria = [
                `Feed TDS is low (${tds} ppm).`,
                `Moderate removal requirement (${requiredRemoval.toFixed(1)}%).`,
                "Lowest capital expenditure (CAPEX) with simple cell construction.",
                "Non-membrane carbon electrode architecture."
            ];
        }
    } else {
        selectedTechnology = "FCDI";
        recommendedProcess = "Flowable Electrode CDI (FCDI)";
        reason = `Brackish feed TDS (${tds} ppm) favors Flowable Electrode CDI (FCDI) continuous desalting without batch cycle pauses.`;
        criteria = [
            `Feed TDS is ${tds} ppm.`,
            "High salinity tolerance via carbon slurry flow.",
            "Continuous non-stop desalination loop."
        ];
    }

    // Technology comparative reasoning matrix
    comparativeRationale = {
        whyCDI: `CDI is optimal for low feed TDS (<500 ppm) when lowest capital cost (CAPEX) is prioritized. It uses simple porous carbon electrodes without ion-exchange membranes, suitable for moderate desalting requirements.`,
        whyMCDIBetter: `MCDI improves upon CDI by adding Anion and Cation Exchange Membranes (AEM & CEM). Membranes block co-ion repulsion during charging, increasing charge efficiency from ~82% to >92%, boosting salt removal capacity, and achieving 95% water recovery.`,
        whyFCDIRequired: `FCDI is required for high feed TDS streams (>1,500 - 3,000+ ppm) where static carbon electrodes in CDI/MCDI rapidly reach saturation. FCDI uses continuous carbon slurry circulation loops (Anolyte & Catholyte) to provide unlimited electrosorption capacity without batch cycle pauses.`,
        whyEDIRequired: `EDI is required for ultra-pure water production (target TDS < 10 ppm or resistivity up to 18.2 MΩ·cm). EDI combines mixed-bed ion-exchange resins with AEM/CEM membranes and Titanium MMO electrodes. In-situ electrolytic water splitting (H+/OH-) continuously regenerates the resin bed without chemical reagents.`
    };

    const techForCalculation = selectedTechnology.includes("FCDI") ? "FCDI" : (selectedTechnology.includes("EDI") ? "EDI" : selectedTechnology);

    // Run exact physical engineering calculation for the recommended technology
    const eng = calculateEngineering({
        technology: techForCalculation,
        feedWater,
        flowRate
    });

    // Dynamic Rule-Based AI Confidence Calculation
    let confidence = 94.0;
    if (tds <= 30 && selectedTechnology === "EDI") confidence += 4.5;
    else if (tds <= 1000 && selectedTechnology === "MCDI") confidence += 3.5;
    else if (tds > 1500 && selectedTechnology === "FCDI") confidence += 3.0;
    else if (tds <= 500 && selectedTechnology === "CDI") confidence += 2.0;

    if (requiredRemoval > 90.0 && selectedTechnology === "CDI") confidence -= 5.0;
    if (tds > 100 && selectedTechnology === "EDI" && !recommendedProcess.includes("→")) confidence -= 6.0;

    const dynamicConfidence = Math.min(98.5, Math.max(82.0, Number(confidence.toFixed(1))));

    return {
        selectedTechnology,
        technology: selectedTechnology,
        recommendedProcess,
        confidence: dynamicConfidence,
        reason,
        criteria,
        comparativeRationale,
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
        operatingMode: selectedTechnology.includes("EDI") ? "Continuous Ion Migration & Water Splitting" : (selectedTechnology.includes("FCDI") ? "Continuous Slurry Flow" : "Adsorption / Desorption")
    };
}

export default aiRecommendation;