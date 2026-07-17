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
    technology = "CDI"
) {
    const equipment = [];
    const pipes = [];

    const flowRate = Number(feedWater?.flowRate ?? 10);
    const electrodeArea = Number(engineering?.electrodeArea ?? 250);
    const cellPairs = Number(engineering?.cellPairs ?? 36);

    //--------------------------------------------------
    // DYNAMIC SIZING CALCULATIONS
    //--------------------------------------------------
    // Scale reactor dimensions based on area and cell pairs
    const reactorWidth = Math.max(140, Math.min(240, 180 * Math.sqrt(electrodeArea / 250)));
    const reactorHeight = Math.max(120, Math.min(220, 160 * (cellPairs / 36)));
    
    const reactorX = 520;
    const reactorY = 190 - reactorHeight / 2; // Center reactor around the y = 190 centerline

    // Scale Feed and Product Tanks height based on flow rate as a visualization cue
    const tankHeight = Math.max(100, Math.min(180, 140 * (flowRate / 10)));
    const tankY = 190 - tankHeight / 2;

    //--------------------------------------------------
    // FEED TANK
    //--------------------------------------------------
    equipment.push({
        id: "FT",
        type: "tank",
        name: "Feed Tank",
        x: 40,
        y: tankY,
        width: 120,
        height: tankHeight,
        data: {
            tds: feedWater?.tds ?? 500,
            flowRate,
            pressure: feedWater?.pressure ?? 1,
            temperature: feedWater?.temperature ?? 25
        }
    });

    //--------------------------------------------------
    // FLOW METER
    //--------------------------------------------------
    equipment.push({
        id: "FM",
        type: "instrument",
        name: "Flow Meter",
        x: 220,
        y: 190,
        radius: 18,
        data: {
            flowRate
        }
    });

    //--------------------------------------------------
    // PUMP
    //--------------------------------------------------
    equipment.push({
        id: "P101",
        type: "pump",
        name: "Feed Pump",
        x: 340,
        y: 190,
        radius: 30,
        data: {
            pressure: feedWater?.pressure ?? 1,
            flowRate,
            power: engineering?.power ?? 6
        }
    });

    //--------------------------------------------------
    // PRESSURE GAUGE
    //--------------------------------------------------
    equipment.push({
        id: "PG",
        type: "instrument",
        name: "Pressure Gauge",
        x: 340,
        y: 110,
        radius: 16,
        data: {
            pressure: feedWater?.pressure ?? 1
        }
    });

    //--------------------------------------------------
    // REACTOR
    //--------------------------------------------------
    equipment.push({
        id: "REACTOR",
        type: "reactor",
        technology: technology,
        name: technology + " Reactor",
        x: reactorX,
        y: reactorY,
        width: reactorWidth,
        height: reactorHeight,
        data: {
            voltage: engineering?.voltage ?? 1.2,
            current: engineering?.current ?? 5,
            electrodeArea,
            cellPairs,
            pressureDrop: engineering?.pressureDrop ?? 0
        }
    });

    //--------------------------------------------------
    // FCDI SLURRY SYSTEM
    //--------------------------------------------------
    if (technology === "FCDI") {
        equipment.push({
            id: "SLURRY",
            type: "tank",
            name: "Slurry Tank",
            x: reactorX - 50,
            y: 20,
            width: 90,
            height: 70
        });

        equipment.push({
            id: "SPUMP",
            type: "pump",
            name: "Slurry Pump",
            x: reactorX + reactorWidth - 80,
            y: 55,
            radius: 20
        });
    }

    //--------------------------------------------------
    // EDI ELECTRODES
    //--------------------------------------------------
    if (technology === "EDI") {
        equipment.push({
            id: "ANODE",
            type: "electrode",
            name: "Anode",
            x: reactorX + 5,
            y: reactorY,
            width: 12,
            height: reactorHeight
        });

        equipment.push({
            id: "CATHODE",
            type: "electrode",
            name: "Cathode",
            x: reactorX + reactorWidth - 17,
            y: reactorY,
            width: 12,
            height: reactorHeight
        });
    }

    //--------------------------------------------------
    // PRODUCT TANK
    //--------------------------------------------------
    equipment.push({
        id: "PROD_TANK",
        type: "tank",
        name: "Product Tank",
        x: 850,
        y: tankY,
        width: 120,
        height: tankHeight,
        data: {
            outletTDS: simulation?.outputTDS ?? 50,
            flowRate,
            recovery: simulation?.waterRecovery ?? 98
        }
    });

    //--------------------------------------------------
    // PIPES CONNECTIONS
    //--------------------------------------------------
    // Pipe from Feed Tank to Pump (FM at 220)
    pipes.push({
        id: "PIPE1",
        points: [
            [160, 190],
            [310, 190]
        ]
    });

    // Pipe from Pump to Reactor
    pipes.push({
        id: "PIPE2",
        points: [
            [370, 190],
            [reactorX, 190]
        ]
    });

    // Pipe from Reactor to Product Tank
    pipes.push({
        id: "PIPE3",
        points: [
            [reactorX + reactorWidth, 190],
            [850, 190]
        ]
    });

    // FCDI slurry loop
    if (technology === "FCDI") {
        pipes.push({
            id: "SLURRY_LOOP",
            points: [
                [reactorX + reactorWidth - 80, 55],
                [reactorX + reactorWidth - 80, reactorY],
                [reactorX - 50, reactorY],
                [reactorX - 50, 55]
            ]
        });
    }

    return {
        skidLength: 1000,
        skidWidth: 420,
        equipment,
        pipes
    };
}

module.exports = generateLayout;