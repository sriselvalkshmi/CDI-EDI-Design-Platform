"use strict";

/**
 * Authoritative Engineering P&ID Layout Generator
 * Generates standardized P&ID equipment nodes and pipeline connections for CDI, MCDI, FCDI, and EDI.
 */
function generateLayout(designResult = {}) {
    const engineering = designResult.engineering || {};
    const feedWater = designResult.input?.feedWater || {};
    const technology = engineering.technology || feedWater.technology || "CDI";

    const flowRate = Number(feedWater.flowRate ?? 10);
    const feedTDS = Number(feedWater.tds ?? 500);
    const targetTDS = Number(feedWater.targetTds ?? 50);
    const outletTDS = Number(engineering.outletTDS ?? 50);
    const targetMargin = Number((targetTDS - outletTDS).toFixed(1));
    const targetDeviation = Number(Math.abs(outletTDS - targetTDS).toFixed(1));

    const cellPairs = engineering.cellPairs || 68;
    const electrodeArea = engineering.electrodeArea || 600;

    const equipment = [];
    const pipes = [];

    const tankY = 130;
    const tankHeight = 120;
    const reactorWidth = 140;
    const reactorHeight = 130;

    if (technology === "EDI") {
        // EDI TRAIN P&ID LAYOUT
        equipment.push({
            id: "TK101",
            type: "tank",
            name: "Raw Water Tank",
            x: 20,
            y: tankY,
            width: 85,
            height: tankHeight,
            data: { tds: feedTDS, conductivity: feedWater.conductivity || (feedTDS / 0.65) }
        });

        equipment.push({
            id: "P101",
            type: "pump",
            name: "Feed Pump P-101",
            x: 115,
            y: 170,
            width: 40,
            height: 40,
            data: { flowRate, head: 35.0, power: 0.75 }
        });

        equipment.push({
            id: "F101",
            type: "filter",
            name: "Multimedia Pre-filter F-101",
            x: 200,
            y: 155,
            width: 90,
            height: 70,
            data: { micron: 5, pressureDrop: 45.0 }
        });

        equipment.push({
            id: "RO101",
            type: "ro_skid",
            name: "RO Pretreatment Skid RO-101",
            x: 330,
            y: 150,
            width: 85,
            height: 80,
            data: { permeateTDS: 15.0, recovery: 75.0, rejection: 97.0 }
        });

        equipment.push({
            id: "P102",
            type: "pump",
            name: "RO Permeate Booster P-102",
            x: 425,
            y: 170,
            width: 40,
            height: 40,
            data: { flowRate: flowRate * 0.75, head: 45.0, power: 1.1 }
        });

        equipment.push({
            id: "REACTOR",
            type: "reactor",
            technology: "EDI",
            name: "EDI Stack Module (EDI-101)",
            material: "Titanium Grade 2 / FRP Composite",
            designStandard: "DuPont EDI-310 / ASTM / IEC",
            x: 520,
            y: 190 - reactorHeight / 2,
            width: reactorWidth,
            height: reactorHeight,
            data: {
                voltageCell: engineering?.voltageCell || 5.0,
                voltageModule: engineering?.voltageModule || 150.0,
                voltageStack: engineering?.voltageStack || 990.0,
                numberOfModules: engineering?.numberOfModules || 6,
                current: engineering?.current || 0.69,
                power: engineering?.power || 683.1,
                electrodeArea,
                cellPairs,
                outletTDS,
                targetMargin,
                targetDeviation,
                waterRecovery: 95.0
            }
        });

        equipment.push({
            id: "TK103",
            type: "tank",
            name: "Ultrapure Product Tank",
            x: 820,
            y: tankY,
            width: 95,
            height: tankHeight,
            data: { outletTDS, flowRate: flowRate * 0.71, recovery: 95.0 }
        });

        pipes.push({ id: "PIPE1", points: [[105, 190], [115, 190]] });
        pipes.push({ id: "PIPE2", points: [[155, 190], [200, 190]] });
        pipes.push({ id: "PIPE3", points: [[290, 190], [330, 190]] });
        pipes.push({ id: "PIPE4", points: [[415, 190], [425, 190]] });
        pipes.push({ id: "PIPE5", points: [[465, 190], [520, 190]] });
        pipes.push({ id: "PIPE6", points: [[660, 190], [820, 190]] });
    } else {
        // STANDARD CDI / MCDI / FCDI P&ID LAYOUT
        equipment.push({
            id: "TK101",
            type: "tank",
            name: "Feed Water Tank TK-101",
            x: 30,
            y: tankY,
            width: 90,
            height: tankHeight,
            data: { tds: feedTDS }
        });

        equipment.push({
            id: "P101",
            type: "pump",
            name: "Feed Pump P-101",
            x: 150,
            y: 170,
            width: 45,
            height: 45,
            data: { flowRate, head: 30.0, power: 0.55 }
        });

        equipment.push({
            id: "F101",
            type: "filter",
            name: "Pre-Filter F-101",
            x: 230,
            y: 155,
            width: 90,
            height: 70,
            data: { micron: 5, pressureDrop: 35.0 }
        });

        equipment.push({
            id: "REACTOR",
            type: "reactor",
            technology,
            name: `${technology} Stack Unit R-101`,
            x: 420,
            y: 190 - reactorHeight / 2,
            width: reactorWidth,
            height: reactorHeight,
            data: {
                voltageCell: engineering?.voltageCell || 1.2,
                voltageModule: engineering?.voltageModule || 56.0,
                voltageStack: engineering?.voltageStack || 168.0,
                numberOfModules: engineering?.numberOfModules || 3,
                current: engineering?.current || 1.45,
                power: engineering?.power || 243.6,
                electrodeArea,
                cellPairs,
                outletTDS,
                targetMargin,
                targetDeviation,
                waterRecovery: engineering?.waterRecovery || 90.0
            }
        });

        equipment.push({
            id: "TK102",
            type: "tank",
            name: "Product Water Tank TK-102",
            x: 750,
            y: tankY,
            width: 95,
            height: tankHeight,
            data: { outletTDS, flowRate: flowRate * 0.9, recovery: engineering?.waterRecovery || 90.0 }
        });

        pipes.push({ id: "PIPE1", points: [[120, 190], [150, 190]] });
        pipes.push({ id: "PIPE2", points: [[195, 190], [230, 190]] });
        pipes.push({ id: "PIPE3", points: [[320, 190], [420, 190]] });
        pipes.push({ id: "PIPE4", points: [[560, 190], [750, 190]] });
    }

    return { equipment, pipes, technology };
}

export default generateLayout;
export { generateLayout };