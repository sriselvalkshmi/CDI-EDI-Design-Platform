"use strict";

/**
 * Authoritative Engineering P&ID Layout Generator V2 (Phase 15)
 * Dynamically synthesizes technology-specific P&ID diagrams:
 * - CDI: Feed → Filter → CDI Stack → Product, plus Desorption Brine stream
 * - MCDI: Feed → Filter → AEM/CEM MCDI Stack → Product, plus RPD Concentrate Brine stream
 * - FCDI: Water side (Feed → Filter → FCDI Stack → Product) PLUS dedicated Flow Electrode Loop (Reservoir → Pump → Electrode Chambers → Reservoir)
 * - EDI: Pretreatment Train (Raw → Filter → RO Skid → Booster Pump) → EDI Dilute Chambers → Ultrapure Product, plus Concentrate & Electrode loops
 */
function generateLayout(designResult = {}) {
    let engineering = {};
    let feedWater = {};

    if (designResult && typeof designResult === "object" && (designResult.engineering || designResult.input)) {
        engineering = designResult.engineering || {};
        feedWater = designResult.input?.feedWater || {};
    } else if (arguments.length > 0) {
        engineering = arguments[0] || {};
        feedWater = arguments[2] || {};
    }

    const technology = engineering.technology || feedWater.technology || arguments[4] || "MCDI";

    const flowRate = Number(feedWater.flowRate ?? 10);
    const feedTDS = Number(feedWater.tds ?? 500);
    const targetTDS = Number(feedWater.targetTds ?? 50);
    const outletTDS = Number(engineering.outletTDS ?? engineering.outletTds ?? 50);
    const targetMargin = Number((targetTDS - outletTDS).toFixed(1));
    const targetDeviation = Number(Math.abs(outletTDS - targetTDS).toFixed(1));

    const cellPairs = engineering.cellPairs || 68;
    const electrodeArea = engineering.electrodeArea || 350;
    const recovery = Number(engineering.waterRecovery ?? 95.0);

    const equipment = [];
    const pipes = [];

    const tankY = 45;
    const tankHeight = 120;
    const reactorHeight = 120;
    const tankWidth = 140;
    const CY = 105;

    if (technology === "EDI") {
        // =====================================================================
        // EDI P&ID: RO Pretreatment Skid + EDI Dilute & Concentrate System
        // =====================================================================
        equipment.push({
            id: "TK101",
            type: "tank",
            name: "Raw Feed Tank TK-101",
            x: 20,
            y: tankY,
            width: 110,
            height: tankHeight,
            data: { tds: feedTDS, conductivity: feedWater.conductivity || (feedTDS / 0.65) }
        });

        equipment.push({
            id: "P101",
            type: "pump",
            name: "Feed Pump P-101",
            x: 170,
            y: CY,
            radius: 22,
            width: 44,
            height: 44,
            data: { flowRate, head: 35.0, power: 0.75 }
        });

        equipment.push({
            id: "F101",
            type: "filter",
            name: "Cartridge Pre-filter F-101",
            x: 240,
            y: CY - 35,
            width: 75,
            height: 70,
            data: { micron: 5, pressureDrop: 35.0 }
        });

        equipment.push({
            id: "RO101",
            type: "ro_skid",
            name: "RO Pretreatment Skid RO-101",
            x: 345,
            y: CY - 40,
            width: 95,
            height: 80,
            data: { permeateTDS: 15.0, recovery: 75.0, rejection: 97.0 }
        });

        equipment.push({
            id: "P102",
            type: "pump",
            name: "RO Permeate Booster P-102",
            x: 470,
            y: CY,
            radius: 22,
            width: 44,
            height: 44,
            data: { flowRate: flowRate * 0.75, head: 45.0, power: 1.1 }
        });

        equipment.push({
            id: "REACTOR",
            type: "reactor",
            technology: "EDI",
            name: "EDI Stack Module (EDI-101)",
            material: "Titanium Anode / Stainless Steel Cathode / FRP",
            designStandard: "DuPont EDI-310 / IEC",
            x: 545,
            y: tankY,
            width: 160,
            height: reactorHeight,
            data: {
                voltageCell: engineering?.voltageCell || 3.5,
                voltageModule: engineering?.voltageModule || 119.0,
                voltageStack: engineering?.voltageStack || 119.0,
                numberOfModules: engineering?.numberOfModules || 1,
                current: engineering?.current || 0.69,
                power: engineering?.power || 120.0,
                electrodeArea,
                cellPairs,
                outletTDS,
                resistivity: engineering?.predictedOutletResistivity || "18.2 MΩ·cm",
                waterRecovery: recovery
            }
        });

        equipment.push({
            id: "TK103",
            type: "tank",
            name: "Ultrapure Product Tank TK-103",
            x: 750,
            y: tankY,
            width: 130,
            height: tankHeight,
            data: { outletTDS, flowRate: flowRate * 0.71, recovery }
        });

        // EDI Concentrate Reject Tank
        equipment.push({
            id: "TK104",
            type: "tank",
            name: "EDI Concentrate Tank TK-104",
            x: 545,
            y: 220,
            width: 130,
            height: 85,
            data: { tds: engineering?.concentrateTds || (feedTDS * 10), flowRate: flowRate * 0.1 }
        });

        pipes.push({ id: "PIPE1", points: [[130, CY], [170, CY]] });
        pipes.push({ id: "PIPE2", points: [[170, CY], [240, CY]] });
        pipes.push({ id: "PIPE3", points: [[315, CY], [345, CY]] });
        pipes.push({ id: "PIPE4", points: [[440, CY], [470, CY]] });
        pipes.push({ id: "PIPE5", points: [[470, CY], [545, CY]] });
        pipes.push({ id: "PIPE6", points: [[705, CY], [750, CY]] });
        // Concentrate stream down to TK104
        pipes.push({ id: "PIPE7_CONC", points: [[625, tankY + reactorHeight], [625, 220]] });

    } else if (technology === "FCDI") {
        // =====================================================================
        // FCDI P&ID: Central Desalination Channel + Continuous Slurry Loop
        // =====================================================================
        equipment.push({
            id: "TK101",
            type: "tank",
            name: "Feed Water Tank TK-101",
            x: 30,
            y: tankY,
            width: 120,
            height: tankHeight,
            data: { tds: feedTDS }
        });

        equipment.push({
            id: "P101",
            type: "pump",
            name: "Feed Pump P-101",
            x: 190,
            y: CY,
            radius: 22,
            width: 44,
            height: 44,
            data: { flowRate, head: 30.0, power: 0.55 }
        });

        equipment.push({
            id: "F101",
            type: "filter",
            name: "Pre-Filter F-101",
            x: 270,
            y: CY - 35,
            width: 80,
            height: 70,
            data: { micron: 5, pressureDrop: 35.0 }
        });

        equipment.push({
            id: "REACTOR",
            type: "reactor",
            technology: "FCDI",
            name: "FCDI Flow-Electrode Stack R-101",
            x: 400,
            y: tankY,
            width: 170,
            height: reactorHeight,
            data: {
                voltageCell: engineering?.voltageCell || 1.4,
                voltageStack: engineering?.voltageStack || 47.6,
                numberOfModules: engineering?.numberOfModules || 1,
                current: engineering?.current || 2.1,
                power: engineering?.power || 100.0,
                electrodeArea,
                cellPairs,
                outletTDS,
                waterRecovery: recovery
            }
        });

        equipment.push({
            id: "TK102",
            type: "tank",
            name: "Product Water Tank TK-102",
            x: 640,
            y: tankY,
            width: 130,
            height: tankHeight,
            data: { outletTDS, flowRate: flowRate * (recovery / 100), recovery }
        });

        // Dedicated Flow-Electrode Slurry Circulation Loop (Phase 15 requirement)
        equipment.push({
            id: "TK201_SLURRY",
            type: "tank",
            name: "Carbon Slurry Reservoir TK-201",
            x: 400,
            y: 225,
            width: 120,
            height: 85,
            data: { slurryConcentration: `${engineering?.slurryConcentrationWt || 10} wt% Carbon`, volume: "100 L" }
        });

        equipment.push({
            id: "P201_SLURRY",
            type: "pump",
            name: "Slurry Recirculation Pump P-201",
            x: 550,
            y: 260,
            radius: 20,
            width: 40,
            height: 40,
            data: { flowRate: flowRate * 1.2, type: "Progressive Cavity / Slurry" }
        });

        // Water line
        pipes.push({ id: "PIPE1", points: [[150, CY], [190, CY]] });
        pipes.push({ id: "PIPE2", points: [[190, CY], [270, CY]] });
        pipes.push({ id: "PIPE3", points: [[350, CY], [400, CY]] });
        pipes.push({ id: "PIPE4", points: [[570, CY], [640, CY]] });

        // Slurry circulation loop
        pipes.push({ id: "PIPE_SLURRY_OUT", points: [[520, 260], [550, 260]] });
        pipes.push({ id: "PIPE_SLURRY_FEED", points: [[570, 260], [570, tankY + reactorHeight], [485, tankY + reactorHeight]] });
        pipes.push({ id: "PIPE_SLURRY_RETURN", points: [[430, tankY + reactorHeight], [430, 225]] });

    } else if (technology === "ED") {
        // =====================================================================
        // Electrodialysis (ED) P&ID: Feed -> Pre-filter -> ED Stack -> Diluate Product
        // Plus Concentrate Recirculation Loop and Electrode Rinse System
        // =====================================================================
        equipment.push({
            id: "TK101",
            type: "tank",
            name: "Feed Water Tank TK-101",
            x: 25,
            y: tankY,
            width: 120,
            height: tankHeight,
            data: { tds: feedTDS }
        });

        equipment.push({
            id: "P101",
            type: "pump",
            name: "Feed Pump P-101",
            x: 180,
            y: CY,
            radius: 22,
            width: 44,
            height: 44,
            data: { flowRate, head: 35.0, power: 0.75 }
        });

        equipment.push({
            id: "F101",
            type: "filter",
            name: "Cartridge Filter F-101 (5µm)",
            x: 260,
            y: CY - 35,
            width: 80,
            height: 70,
            data: { micron: 5, pressureDrop: 25.0 }
        });

        equipment.push({
            id: "REACTOR",
            type: "reactor",
            technology: "ED",
            name: "ED Multi-Cell Stack ED-101",
            x: 400,
            y: tankY,
            width: 180,
            height: reactorHeight,
            data: {
                voltageCell: engineering?.voltageCell || 1.0,
                voltageStack: engineering?.voltageStack || 103.0,
                numberOfModules: engineering?.numberOfModules || 2,
                current: engineering?.current || 6.0,
                power: engineering?.power || 618.0,
                limitingCurrentDensity: engineering?.limitingCurrentDensityAm2 || 150,
                concentrationPolarization: engineering?.concentrationPolarizationFactor || 0.65,
                electrodeArea,
                cellPairs,
                outletTDS,
                waterRecovery: recovery
            }
        });

        equipment.push({
            id: "TK102",
            type: "tank",
            name: "Demineralized Product Tank TK-102",
            x: 660,
            y: tankY,
            width: 130,
            height: tankHeight,
            data: { outletTDS, flowRate: flowRate * (recovery / 100), recovery }
        });

        equipment.push({
            id: "TK103_BRINE",
            type: "tank",
            name: "Concentrate Brine Tank TK-103",
            x: 400,
            y: 225,
            width: 120,
            height: 85,
            data: { tds: engineering?.concentrateTds || (feedTDS * 4), recovery }
        });

        equipment.push({
            id: "P102_CONC",
            type: "pump",
            name: "Concentrate Recirculation Pump P-102",
            x: 550,
            y: 260,
            radius: 20,
            width: 40,
            height: 40,
            data: { flowRate: flowRate * 0.40, type: "Centrifugal Brine" }
        });

        pipes.push({ id: "PIPE1", points: [[145, CY], [180, CY]] });
        pipes.push({ id: "PIPE2", points: [[180, CY], [260, CY]] });
        pipes.push({ id: "PIPE3", points: [[340, CY], [400, CY]] });
        pipes.push({ id: "PIPE4", points: [[580, CY], [660, CY]] });

        // Concentrate recirculation loop
        pipes.push({ id: "PIPE_CONC_BLEED", points: [[490, tankY + reactorHeight], [490, 225]] });
        pipes.push({ id: "PIPE_CONC_RECIRC", points: [[520, 260], [550, 260]] });
        pipes.push({ id: "PIPE_CONC_RETURN", points: [[570, 260], [570, tankY + reactorHeight], [530, tankY + reactorHeight]] });

    } else if (technology === "EDR") {
        // =====================================================================
        // Electrodialysis Reversal (EDR) P&ID: 4-Way Reversing Valves + Stack
        // In-Situ Polarity Reversal Scale Dissolution Architecture
        // =====================================================================
        equipment.push({
            id: "TK101",
            type: "tank",
            name: "Feed Water Tank TK-101",
            x: 20,
            y: tankY,
            width: 110,
            height: tankHeight,
            data: { tds: feedTDS }
        });

        equipment.push({
            id: "P101",
            type: "pump",
            name: "Feed Pump P-101",
            x: 165,
            y: CY,
            radius: 22,
            width: 44,
            height: 44,
            data: { flowRate, head: 35.0, power: 0.75 }
        });

        equipment.push({
            id: "F101",
            type: "filter",
            name: "Cartridge Pre-Filter F-101",
            x: 240,
            y: CY - 35,
            width: 75,
            height: 70,
            data: { micron: 10, pressureDrop: 25.0 }
        });

        // 4-Way Hydraulic Reversing Valve (Inlet)
        equipment.push({
            id: "V101_REV",
            type: "valve",
            name: "4-Way Inlet Reversal Valve V-101",
            x: 345,
            y: CY - 20,
            width: 40,
            height: 40,
            data: { reversalInterval: `${engineering?.reversalCycleMin || 20} min`, status: "POLARITY_A" }
        });

        equipment.push({
            id: "REACTOR",
            type: "reactor",
            technology: "EDR",
            name: "EDR Self-Cleaning Stack EDR-101",
            x: 420,
            y: tankY,
            width: 175,
            height: reactorHeight,
            data: {
                voltageCell: engineering?.voltageCell || 1.0,
                voltageStack: engineering?.voltageStack || 103.0,
                current: engineering?.current || 6.0,
                reversalCycleMin: engineering?.reversalCycleMin || 20,
                flushDurationMin: engineering?.flushDurationMin || 1.5,
                scaleControl: "In-Situ DC Polarity Reversal",
                electrodeArea,
                cellPairs,
                outletTDS,
                waterRecovery: recovery
            }
        });

        // 4-Way Hydraulic Reversing Valve (Outlet)
        equipment.push({
            id: "V102_REV",
            type: "valve",
            name: "4-Way Outlet Reversal Valve V-102",
            x: 620,
            y: CY - 20,
            width: 40,
            height: 40,
            data: { status: "STREAM_INVERSION_ACTIVE" }
        });

        // Off-Spec Flush Divert Valve
        equipment.push({
            id: "V103_DIVERT",
            type: "valve",
            name: "Flush Divert Valve V-103",
            x: 685,
            y: 200,
            width: 35,
            height: 35,
            data: { divertDuration: "90 sec transition purge" }
        });

        equipment.push({
            id: "TK102",
            type: "tank",
            name: "Product Water Tank TK-102",
            x: 740,
            y: tankY,
            width: 120,
            height: tankHeight,
            data: { outletTDS, flowRate: flowRate * (recovery / 100), recovery }
        });

        equipment.push({
            id: "TK103_BRINE",
            type: "tank",
            name: "EDR Concentrate & Purge Tank TK-103",
            x: 420,
            y: 225,
            width: 125,
            height: 85,
            data: { tds: engineering?.concentrateTds || (feedTDS * 4), scaleRisk: "DISSOLVED" }
        });

        pipes.push({ id: "PIPE1", points: [[130, CY], [165, CY]] });
        pipes.push({ id: "PIPE2", points: [[165, CY], [240, CY]] });
        pipes.push({ id: "PIPE3", points: [[315, CY], [345, CY]] });
        pipes.push({ id: "PIPE4", points: [[385, CY], [420, CY]] });
        pipes.push({ id: "PIPE5", points: [[595, CY], [620, CY]] });
        pipes.push({ id: "PIPE6", points: [[660, CY], [740, CY]] });

        // Flush divert & brine lines
        pipes.push({ id: "PIPE_DIVERT", points: [[640, CY + 20], [640, 215], [685, 215]] });
        pipes.push({ id: "PIPE_BRINE_OUT", points: [[500, tankY + reactorHeight], [500, 225]] });

    } else {
        // =====================================================================
        // CDI & MCDI P&ID: Feed Line + Stack + Product + Desorption Brine Line
        // =====================================================================
        equipment.push({
            id: "TK101",
            type: "tank",
            name: "Feed Water Tank TK-101",
            x: 30,
            y: tankY,
            width: tankWidth,
            height: tankHeight,
            data: { tds: feedTDS }
        });

        equipment.push({
            id: "P101",
            type: "pump",
            name: "Feed Pump P-101",
            x: 215,
            y: CY,
            radius: 22,
            width: 44,
            height: 44,
            data: { flowRate, head: 30.0, power: 0.55 }
        });

        equipment.push({
            id: "F101",
            type: "filter",
            name: "Pre-Filter F-101",
            x: 295,
            y: CY - 35,
            width: 85,
            height: 70,
            data: { micron: 5, pressureDrop: 35.0 }
        });

        equipment.push({
            id: "REACTOR",
            type: "reactor",
            technology,
            name: technology === "MCDI" ? "MCDI Membrane Stack R-101" : "CDI Electrosorption Stack R-101",
            x: 430,
            y: tankY,
            width: 170,
            height: reactorHeight,
            data: {
                voltageCell: engineering?.voltageCell || (technology === "MCDI" ? 1.4 : 1.2),
                voltageModule: engineering?.voltageModule || 47.6,
                voltageStack: engineering?.voltageStack || 95.2,
                numberOfModules: engineering?.numberOfModules || 2,
                current: engineering?.current || 1.98,
                power: engineering?.power || 188.5,
                electrodeArea,
                cellPairs,
                outletTDS,
                waterRecovery: recovery
            }
        });

        equipment.push({
            id: "TK102",
            type: "tank",
            name: "Purified Product Tank TK-102",
            x: 680,
            y: tankY,
            width: 140,
            height: tankHeight,
            data: { outletTDS, flowRate: flowRate * (recovery / 100), recovery }
        });

        // Regeneration / Desorption Concentrate Brine Tank
        equipment.push({
            id: "TK103_BRINE",
            type: "tank",
            name: "Desorption Brine Tank TK-103",
            x: 430,
            y: 220,
            width: 130,
            height: 85,
            data: { tds: engineering?.concentrateTds || (feedTDS * 10), recovery }
        });

        // Product Line
        pipes.push({ id: "PIPE1", points: [[170, CY], [215, CY]] });
        pipes.push({ id: "PIPE2", points: [[215, CY], [295, CY]] });
        pipes.push({ id: "PIPE3", points: [[380, CY], [430, CY]] });
        pipes.push({ id: "PIPE4", points: [[600, CY], [680, CY]] });

        // Concentrate / Desorption Line to TK103
        pipes.push({ id: "PIPE_BRINE", points: [[515, tankY + reactorHeight], [515, 220]] });
    }

    return { equipment, pipes, technology };
}

export default generateLayout;
export { generateLayout };