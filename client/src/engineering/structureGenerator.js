"use strict";

import cdiTemplate from "./templates/CDI.json";
import mcdiTemplate from "./templates/MCDI.json";
import fcdiTemplate from "./templates/FCDI.json";
import ediTemplate from "./templates/EDI.json";

const TEMPLATES = {
    CDI: cdiTemplate,
    MCDI: mcdiTemplate,
    FCDI: fcdiTemplate,
    EDI: ediTemplate
};

/**
 * Multi-Scale Parametric CAD SVG Structural Generator
 * Resizes every visual SVG element (reactor width, stack height, spacer gap distance,
 * membrane width, pipe diameter, pump radius, tank volume) aggressively according to calculated engineering values.
 */
export function generateStructure({
    technology = "CDI",
    engineering = {},
    optimization = {},
    sizing = {},
    feedWater = {},
    simulation = {}
} = {}) {
    const activeTech = (technology === "AUTO" ? (engineering.technology || "CDI") : technology).toUpperCase();
    const template = TEMPLATES[activeTech] || TEMPLATES.CDI;

    // Direct Parameter Extraction with Fallbacks
    const flowRate = Number(feedWater.flowRate ?? engineering.flowRate ?? 10); // L/min
    const feedPressure = Number(feedWater.pressure ?? engineering.feedPressure ?? 1.0); // bar
    const voltage = Number(optimization.voltage ?? engineering.voltage ?? 1.2); // V
    const current = Number(optimization.current ?? engineering.current ?? 15.0); // A
    const cellPairs = Number(optimization.cellPairs ?? engineering.cellPairs ?? 95); // pairs
    const electrodeArea = Number(optimization.electrodeArea ?? engineering.electrodeArea ?? 350); // cm²
    const electrodeThickness = Number(optimization.electrodeThickness ?? engineering.electrodeThickness ?? 0.6); // mm
    const spacerThickness = Number(optimization.spacerThickness ?? engineering.spacerThickness ?? 0.5); // mm
    const membraneThickness = Number(optimization.membraneThickness ?? engineering.membraneThickness ?? 0.15); // mm
    const flowChannelWidth = Number(optimization.flowChannelWidth ?? engineering.flowChannelWidth ?? 20); // mm
    const currentDensity = Number(engineering.currentDensity ?? (current / (electrodeArea / 10000)) ?? 220); // A/m²
    const feedTDS = Number(feedWater.tds ?? 500); // ppm
    const outletTDS = Number(engineering.outletTDS ?? 50); // ppm
    const removalEfficiency = Number(engineering.removalEfficiency ?? 90.0); // %
    const waterRecovery = Number(engineering.waterRecovery ?? engineering.recovery ?? 95.0); // %
    const residenceTime = Number(engineering.residenceTime ?? optimization.residenceTime ?? 10.0); // min
    const sac = Number(engineering.sac ?? 14.5); // mg/g
    const sec = Number(engineering.sec ?? engineering.SEC ?? 0.45); // kWh/m³
    const pressureDropBar = Number(engineering.pressureDrop ? (engineering.pressureDrop / 100000) : (feedPressure * 0.15)); // bar

    //---------------------------------------------------------
    // MULTI-SCALE PARAMETRIC CAD GEOMETRY TRANSFORMATIONS
    //---------------------------------------------------------
    
    // 1. Electrode Plates & Reactor Footprint Width (Scales aggressively with Area: 160px -> 320px)
    const areaScaleFactor = Math.sqrt(Math.max(100, electrodeArea) / 350);
    const plateWidthPx = Math.max(160, Math.min(320, Math.round(180 * areaScaleFactor)));
    const plateHeightPx = Math.max(90, Math.min(260, Math.round(110 * areaScaleFactor)));

    // 2. Stack Height & Representative Layers (Scales aggressively with Cell Pairs: 140px -> 360px)
    const visualCellCount = Math.max(4, Math.min(48, Math.round(cellPairs / (cellPairs > 60 ? 2.2 : 1.4))));
    
    // 3. Layer Graphics & Spacer Gap Distance (Scales with Spacer Thickness: 4px -> 24px)
    const electrodeThicknessPx = Math.max(3, Math.min(18, Math.round(electrodeThickness * 10)));
    const spacerThicknessPx = Math.max(4, Math.min(26, Math.round(spacerThickness * 14)));
    const membraneThicknessPx = Math.max(3, Math.min(16, Math.round(membraneThickness * 22)));
    const channelWidthPx = Math.max(14, Math.min(80, Math.round(flowChannelWidth * 2.0)));

    // 4. Overall Stack Reactor Box Height
    const stackHeightPx = Math.max(150, Math.min(360, Math.round( visualCellCount * (electrodeThicknessPx + spacerThicknessPx + 2) + 50 )));
    
    // 5. Pump Sizing Radius (Scales with Flow Rate & Hydraulic Power: 18px -> 42px)
    const pumpPowerKw = Number(engineering.pumpPowerKw ?? (flowRate * feedPressure * 0.002));
    const pumpRadiusPx = Math.max(18, Math.min(42, Math.round(22 * Math.pow(flowRate / 10, 0.38))));

    // 6. Process Tank Dimensions (Scales with Volume & Residence Time: 80px -> 180px)
    const tankWidthPx = Math.max(85, Math.min(180, Math.round(105 * Math.pow((flowRate * residenceTime) / 100, 0.28))));
    const tankHeightPx = Math.max(105, Math.min(240, Math.round(135 * Math.pow((flowRate * residenceTime) / 100, 0.32))));

    // 7. Pipe Diameter / Stroke Width (Scales with Flow Velocity & Q: 2.5px -> 9px)
    const pipeDiameterMm = Math.max(15, Math.min(100, Math.round(15 * Math.sqrt(flowRate / 10))));
    const pipeStrokeWidthPx = Math.max(2.5, Math.min(9.5, Math.round(3.0 + (flowRate / 12))));

    //---------------------------------------------------------
    // DYNAMIC FLOW ANIMATION & PRESSURE COLORING
    //---------------------------------------------------------
    const flowVelocity = Number(engineering.flowVelocity ?? (flowRate / (pipeDiameterMm * 0.05)));
    const flowAnimationDurationSec = Number((Math.max(0.2, Math.min(2.5, 2.0 / (flowRate / 10))).toFixed(2)));

    // Pressure Drop Pipe Color Scale
    let pressurePipeColor = "#22C55E"; // Green
    let pressureStatus = "LOW PRESSURE (< 0.5 bar)";
    if (pressureDropBar > 3.0) {
        pressurePipeColor = "#EF4444"; // Red
        pressureStatus = "VERY HIGH PRESSURE DROP (> 3.0 bar)";
    } else if (pressureDropBar > 1.5) {
        pressurePipeColor = "#F97316"; // Orange
        pressureStatus = "HIGH PRESSURE DROP (1.5 - 3.0 bar)";
    } else if (pressureDropBar > 0.5) {
        pressurePipeColor = "#EAB308"; // Yellow
        pressureStatus = "MEDIUM PRESSURE DROP (0.5 - 1.5 bar)";
    }

    // Current Density Thermal Heatmap Scale (Blue -> Green -> Yellow -> Red)
    let thermalHeatmapColor = "#3B82F6"; // Blue
    let thermalStatus = "LOW CURRENT DENSITY (< 100 A/m²)";
    if (currentDensity > 300) {
        thermalHeatmapColor = "#EF4444"; // Red
        thermalStatus = "VERY HIGH CURRENT DENSITY (> 300 A/m²)";
    } else if (currentDensity > 200) {
        thermalHeatmapColor = "#F97316"; // Orange
        thermalStatus = "HIGH CURRENT DENSITY (200 - 300 A/m²)";
    } else if (currentDensity > 100) {
        thermalHeatmapColor = "#EAB308"; // Yellow
        thermalStatus = "MEDIUM CURRENT DENSITY (100 - 200 A/m²)";
    } else if (currentDensity > 50) {
        thermalHeatmapColor = "#22C55E"; // Green
        thermalStatus = "NORMAL CURRENT DENSITY (50 - 100 A/m²)";
    }

    const glowIntensity = Math.min(1.0, voltage / 2.0);
    const glowFilter = voltage > 1.4 ? "url(#high-voltage-glow)" : "url(#normal-voltage-glow)";
    const electronSpeedSec = Math.max(0.2, Math.min(2.0, 1.5 - (currentDensity / 400)));
    const initialIonCount = Math.max(4, Math.min(24, Math.round(feedTDS / 80)));
    const remainingIonCount = Math.max(1, Math.round(initialIonCount * (1 - removalEfficiency / 100)));

    const labels = {
        technology: activeTech,
        electrodeArea: `${electrodeArea} cm²`,
        cellPairs: `${cellPairs} pairs`,
        currentDensity: `${currentDensity.toFixed(1)} A/m²`,
        voltage: `${voltage.toFixed(2)} V`,
        current: `${current.toFixed(2)} A`,
        flowRate: `${flowRate.toFixed(1)} L/min`,
        pressure: `${feedPressure.toFixed(2)} bar`,
        pressureDrop: `${pressureDropBar.toFixed(3)} bar`,
        residenceTime: `${residenceTime.toFixed(1)} min`,
        waterRecovery: `${waterRecovery.toFixed(1)} %`,
        removalEfficiency: `${removalEfficiency.toFixed(1)} %`,
        sac: `${sac.toFixed(2)} mg/g`,
        sec: `${sec.toFixed(3)} kWh/m³`,
        outletTDS: `${outletTDS.toFixed(0)} ppm`
    };

    const enrichedEquipment = (template.equipment || []).map((eq) => {
        let dimString = "";
        let formulaUsed = "";
        let calculationSource = "";

        if (eq.type === "tank") {
            dimString = `${tankWidthPx}mm W x ${tankHeightPx}mm H (Vol: ${(flowRate * residenceTime).toFixed(0)} L)`;
            formulaUsed = "V_tank = Q_feed * t_residence";
            calculationSource = "waterChemistry & layoutGenerator";
        } else if (eq.type === "pump" || eq.type === "slurry_pump") {
            dimString = `R: ${pumpRadiusPx}mm (DN${pipeDiameterMm})`;
            formulaUsed = "P_motor = (Q * ΔP) / (η_pump * η_motor * 60000)";
            calculationSource = "componentSizing & cdiDesignCalculator";
        } else if (eq.type === "reactor") {
            dimString = `${plateWidthPx}mm L x ${plateHeightPx}mm W x ${stackHeightPx}mm H`;
            formulaUsed = "J = I / A_electrode; N_pairs = Q_req / q_pair";
            calculationSource = "engineeringEquationEngine & electrodeModel";
        }

        return {
            ...eq,
            dimensions: dimString,
            operatingPressure: `${feedPressure.toFixed(2)} bar`,
            operatingFlow: `${flowRate.toFixed(1)} L/min`,
            voltage: `${voltage.toFixed(2)} V`,
            current: `${current.toFixed(2)} A`,
            formulaUsed,
            calculationSource,
            optimizationStatus: "OPTIMIZED",
            notes: `Operating technology: ${activeTech}. Calculated current density: ${labels.currentDensity}. Specific energy consumption: ${labels.sec}.`
        };
    });

    return {
        technology: activeTech,
        template,
        labels,
        geometry: {
            plateWidthPx,
            plateHeightPx,
            visualCellCount,
            electrodeThicknessPx,
            spacerThicknessPx,
            membraneThicknessPx,
            channelWidthPx,
            stackHeightPx,
            pumpRadiusPx,
            tankWidthPx,
            tankHeightPx,
            pipeDiameterMm,
            pipeStrokeWidthPx
        },
        electrical: {
            voltage,
            current,
            currentDensity,
            glowIntensity,
            glowFilter,
            thermalHeatmapColor,
            thermalStatus,
            electronSpeedSec
        },
        pressure: {
            feedPressure,
            pressureDropBar,
            pressurePipeColor,
            pressureStatus
        },
        animation: {
            flowAnimationDurationSec,
            initialIonCount,
            remainingIonCount
        },
        equipment: enrichedEquipment,
        layers: template.layers || []
    };
}

export default generateStructure;
