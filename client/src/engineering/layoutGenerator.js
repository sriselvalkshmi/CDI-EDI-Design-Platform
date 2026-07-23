"use strict";

/*
=========================================================
DYNAMIC LAYOUT GENERATOR
Calculates SVG positions, sizes, and connections based on
flow rate, cell pairs, electrode area, and stack height.
=========================================================
*/

function generateLayout(
    stack,
    engineering,
    feedWater,
    simulation,
    technology = "CDI",
    processObj = null
) {
    const equipment = [];
    const pipes = [];

    const flowRate = Number(feedWater?.flowRate ?? 10);
    const electrodeArea = Number(engineering?.electrodeArea ?? 250);
    const cellPairs = Number(engineering?.cellPairs ?? 36);

    const isTwoStage = processObj?.isMultiStage || technology?.includes("Two-Stage") || (Number(feedWater?.tds || 500) > 3000) || engineering?.isMultiStage;

    const stage1Data = processObj?.stages?.[0] || {};
    const stage2Data = processObj?.stages?.[1] || {};
    const overall = processObj?.overall || {};

    const reactorWidth = isTwoStage ? 140 : Math.max(140, Math.min(240, 180 * Math.sqrt(electrodeArea / 250)));
    const reactorHeight = isTwoStage ? 130 : Math.max(120, Math.min(220, 160 * (cellPairs / 36)));

    const tankHeight = Math.max(100, Math.min(180, 140 * (flowRate / 10)));
    const tankY = 190 - tankHeight / 2;

    // 1. FEED TANK
    equipment.push({
        id: "FT",
        type: "tank",
        name: "Feed Tank",
        x: 40,
        y: tankY,
        width: 110,
        height: tankHeight,
        data: {
            tds: feedWater?.tds ?? 500,
            flowRate,
            pressure: feedWater?.pressure ?? 1,
            temperature: feedWater?.temperature ?? 25
        }
    });

    // 2. FLOW METER & PUMP
    equipment.push({
        id: "FM",
        type: "instrument",
        name: "Flow Meter",
        x: 190,
        y: 190,
        radius: 16,
        data: { flowRate }
    });

    equipment.push({
        id: "P101",
        type: "pump",
        name: "Feed Pump",
        x: 270,
        y: 190,
        radius: 26,
        data: {
            pressure: feedWater?.pressure ?? 1,
            flowRate,
            power: engineering?.power ?? 6
        }
    });

    if (isTwoStage) {
        // 3. FCDI REACTOR (STAGE 1)
        const fcdiX = 350;
        equipment.push({
            id: "FCDI_STAGE1",
            type: "reactor",
            technology: "FCDI",
            name: "FCDI Reactor (Stage 1)",
            x: fcdiX,
            y: 190 - 65,
            width: 140,
            height: 130,
            data: {
                voltage: stage1Data.voltage || engineering?.voltage || 1.8,
                current: stage1Data.current || engineering?.current || 5.2,
                power: stage1Data.power || 9.36,
                electrodeArea: stage1Data.electrodeArea || 500,
                cellPairs: stage1Data.cellPairs || 36,
                inletTDS: stage1Data.inletTDS || feedWater?.tds || 5000,
                outletTDS: stage1Data.outletTDS || 1941,
                removalEfficiency: stage1Data.removalEfficiency || 61.2
            }
        });

        // 4. INTERMEDIATE TANK
        const intX = 520;
        equipment.push({
            id: "INT_TANK",
            type: "tank",
            name: "Intermediate Tank",
            x: intX,
            y: tankY,
            width: 100,
            height: tankHeight,
            data: {
                tds: stage1Data.outletTDS || 1941,
                flowRate,
                stage: "Intermediate (Stage 1 → Stage 2)"
            }
        });

        // 5. EDI STACK (STAGE 2)
        const ediX = 660;
        equipment.push({
            id: "EDI_STAGE2",
            type: "edi_polishing",
            technology: "EDI",
            name: "EDI Stack (Stage 2)",
            x: ediX,
            y: 190 - 60,
            width: 130,
            height: 120,
            data: {
                voltage: stage2Data.voltage || 25.0,
                current: stage2Data.current || 2.1,
                power: stage2Data.power || 52.5,
                electrodeArea: stage2Data.electrodeArea || 400,
                cellPairs: stage2Data.cellPairs || 50,
                inletTDS: stage2Data.inletTDS || 1941,
                outletTDS: stage2Data.outletTDS || feedWater?.targetTds || 5,
                removalEfficiency: stage2Data.removalEfficiency || 99.7
            }
        });

        // 6. PRODUCT TANK
        const prodX = 830;
        equipment.push({
            id: "PROD_TANK",
            type: "tank",
            name: "Product Tank",
            x: prodX,
            y: tankY,
            width: 110,
            height: tankHeight,
            data: {
                outletTDS: overall.outletTDS || stage2Data.outletTDS || feedWater?.targetTds || 5,
                flowRate,
                recovery: overall.waterRecovery || 90.25
            }
        });

        // PIPES CONNECTIONS
        pipes.push({ id: "PIPE1", points: [[150, 190], [244, 190]] });
        pipes.push({ id: "PIPE2", points: [[296, 190], [fcdiX, 190]] });
        pipes.push({ id: "PIPE3", points: [[fcdiX + 140, 190], [intX, 190]] });
        pipes.push({ id: "PIPE4", points: [[intX + 100, 190], [ediX, 190]] });
        pipes.push({ id: "PIPE5", points: [[ediX + 130, 190], [prodX, 190]] });

    } else {
        // SINGLE STAGE LAYOUT
        const reactorX = 450;
        equipment.push({
            id: "REACTOR",
            type: "reactor",
            technology: technology,
            name: technology + " Reactor",
            x: reactorX,
            y: 190 - reactorHeight / 2,
            width: reactorWidth,
            height: reactorHeight,
            data: {
                voltage: engineering?.voltage ?? 1.2,
                current: engineering?.current ?? 5,
                electrodeArea,
                cellPairs,
                outletTDS: engineering?.outletTDS || 50,
                pressureDrop: engineering?.pressureDrop ?? 0
            }
        });

        equipment.push({
            id: "PROD_TANK",
            type: "tank",
            name: "Product Tank",
            x: 820,
            y: tankY,
            width: 110,
            height: tankHeight,
            data: {
                outletTDS: engineering?.outletTDS ?? 50,
                flowRate,
                recovery: engineering?.waterRecovery ?? 95
            }
        });

        pipes.push({ id: "PIPE1", points: [[150, 190], [244, 190]] });
        pipes.push({ id: "PIPE2", points: [[296, 190], [reactorX, 190]] });
        pipes.push({ id: "PIPE3", points: [[reactorX + reactorWidth, 190], [820, 190]] });
    }

    return {
        skidLength: 1000,
        skidWidth: 420,
        equipment,
        pipes
    };
}

export default generateLayout;