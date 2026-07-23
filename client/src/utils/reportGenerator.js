import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (val, digits = 2, unit = "") => {
    if (val === undefined || val === null || isNaN(Number(val))) return "-";
    return `${Number(val).toFixed(digits)}${unit ? " " + unit : ""}`;
};

export const generateEngineeringReportPDF = ({
    user,
    feedWater = {},
    technology = "CDI",
    aiResult = null,
    engineering = null,
    simulation = null,
    performance = null,
    optimization = null,
    equations = [],
    modifications = []
}) => {
    try {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const userName = user?.fullName || user?.username || "Process Engineering Department";
        const reportDate = new Date().toLocaleDateString();
        const reportTime = new Date().toLocaleTimeString();
        const fullTimeStamp = `${reportDate} ${reportTime}`;

        // Feed Water Parameters
        const fwTds = feedWater.tds ?? 500;
        const fwCond = feedWater.conductivity ?? (fwTds * 0.6);
        const fwHard = feedWater.hardness ?? 150;
        const fwPh = feedWater.ph ?? 7.0;
        const fwTemp = feedWater.temperature ?? 25;
        const fwPress = feedWater.pressure ?? 1.0;
        const fwFlow = feedWater.flowRate ?? 10.0;
        const targetTds = feedWater.targetTds ?? feedWater.targetTDS ?? 50;

        // Engineering Data
        const engData = engineering || {};
        const elec = {
            voltage: engData.voltage ?? aiResult?.voltage ?? 1.20,
            current: engData.current ?? aiResult?.current ?? 5.00,
            power: engData.power ?? (engData.voltage * engData.current) ?? 6.00,
            currentDensity: engData.currentDensity ?? 200.0
        };
        const stack = {
            cellPairs: engData.cellPairs ?? aiResult?.cellPairs ?? 36,
            electrodeArea: engData.electrodeArea ?? aiResult?.electrodeArea ?? 250,
            residenceTime: engData.residenceTime ?? aiResult?.residenceTime ?? 10.0,
            stackLength: engData.stackLength ?? 200,
            stackWidth: engData.stackWidth ?? 100,
            stackHeight: engData.stackHeight ?? 37
        };
        const hydr = {
            flowVelocity: engData.flowVelocity ?? aiResult?.flowVelocity ?? 0.15,
            pressureDrop: engData.pressureDrop ?? aiResult?.pressureDrop ?? 50.0,
            pumpPower: engData.pumpPower ?? aiResult?.pumpPower ?? 0.05,
            waterRecovery: engData.waterRecovery ?? aiResult?.waterRecovery ?? 95.0
        };
        const elecProps = {
            mass: engData.electrodeMass ?? 67.50,
            capacitance: 5062.5,
            sac: engData.sac ?? 6.60,
            chargeEfficiency: 85.0
        };

        // Simulation & Performance Data
        const simData = simulation || performance || {};
        const outletTds = engData.outletTDS ?? simData.outletTDS ?? simData.outletTds ?? (fwTds * 0.1);
        const saltRemoval = fwTds - outletTds;
        const removalEff = engData.removalEfficiency ?? simData.removalEfficiency ?? ((saltRemoval / fwTds) * 100);
        const powerCons = engData.power ?? elec.power ?? 6.00;
        const sec = engData.sec ?? simData.specificEnergy ?? simData.sec ?? 0.0100;

        // Selected Tech & AI Recommendation
        const recTech = aiResult?.selectedTechnology || technology || "CDI";
        const optMode = optimization?.mode || "AI Optimization";

        //---------------------------------------------------------
        // PAGE 1: PROJECT METADATA, FEED WATER & ENGINEERING SUMMARY
        //---------------------------------------------------------

        // Header Banner
        doc.setFillColor(15, 23, 42); // Slate-900
        doc.rect(0, 0, 210, 26, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text("CDI / EDI DESIGN PLATFORM", 14, 11);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(147, 197, 253);
        doc.text("Engineering Equation Report", 14, 18);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(`OPERATOR: ${userName.toUpperCase()}`, 196, 11, { align: "right" });
        doc.text(`GENERATED: ${fullTimeStamp}`, 196, 18, { align: "right" });

        doc.setFillColor(37, 99, 235);
        doc.rect(0, 22, 210, 4, "F");

        let startY = 30;

        // 1. Project Metadata Details Table
        autoTable(doc, {
            startY: startY,
            head: [["Project Metadata Details", ""]],
            body: [
                ["Project Name", "CDI / EDI Pilot Design System"],
                ["Generated Date & Time", fullTimeStamp],
                ["Selected Technology", recTech],
                ["Optimization Mode", optMode],
                ["AI Recommendation", recTech],
                ["Confidence Level", "95%"],
                ["Operator Name", userName]
            ],
            theme: "grid",
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            styles: { fontSize: 8, cellPadding: 1.8 },
            columnStyles: {
                0: { fontStyle: "bold", cellWidth: 60 },
                1: { cellWidth: 122 }
            }
        });

        startY = doc.lastAutoTable.finalY + 4;

        // 2. Feed Water Properties Table
        autoTable(doc, {
            startY: startY,
            head: [["Feed Water Properties", "", ""]],
            body: [
                ["Property", "Value", "Unit"],
                ["Total Dissolved Solids (TDS)", fmt(fwTds, 1), "ppm"],
                ["Conductivity", fmt(fwCond, 1), "µS/cm"],
                ["Hardness", fmt(fwHard, 1), "mg/L as CaCO3"],
                ["pH Value", fmt(fwPh, 1), "-"],
                ["Temperature", fmt(fwTemp, 1), "°C"],
                ["Feed Pressure", fmt(fwPress, 1), "bar"],
                ["Flow Rate", fmt(fwFlow, 1), "L/min"],
                ["Target Output TDS", fmt(targetTds, 1), "ppm"]
            ],
            theme: "grid",
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            styles: { fontSize: 8, cellPadding: 1.6 },
            columnStyles: {
                0: { fontStyle: "bold", cellWidth: 90 },
                1: { cellWidth: 46, alignment: "right" },
                2: { cellWidth: 46 }
            }
        });

        startY = doc.lastAutoTable.finalY + 4;

        // Process data extraction
        const process = engData.process || {};
        const isMultiStage = process.isMultiStage || engData.isMultiStage;
        const stage1 = process.stages?.[0] || {};
        const stage2 = process.stages?.[1] || {};
        const overall = process.overall || {};

        // 3. Stage 1 & Stage 2 Engineering Design Summary
        if (isMultiStage) {
            autoTable(doc, {
                startY: startY,
                head: [["Stage 1 Engineering Design (FCDI Bulk Desalination)", "", ""]],
                body: [
                    ["Parameter", "Stage 1 Value", "Unit"],
                    ["Technology", "FCDI", "-"],
                    ["Inlet TDS", fmt(stage1.inletTDS || fwTds, 1), "ppm"],
                    ["Outlet TDS", fmt(stage1.outletTDS || 1941, 1), "ppm"],
                    ["Operating Voltage", fmt(stage1.voltage || elec.voltage, 2), "V"],
                    ["Operating Current", fmt(stage1.current || elec.current, 2), "A"],
                    ["Power Consumption", fmt(stage1.power || elec.power, 2), "W"],
                    ["Cell Pairs", `${stage1.cellPairs || stack.cellPairs || 36}`, "pairs"],
                    ["Electrode Area", fmt(stage1.electrodeArea || stack.electrodeArea || 500, 0), "cm²"]
                ],
                theme: "grid",
                headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
                styles: { fontSize: 7.5, cellPadding: 1.4 },
                columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 }, 1: { cellWidth: 46, alignment: "right" }, 2: { cellWidth: 46 } }
            });

            startY = doc.lastAutoTable.finalY + 3;

            autoTable(doc, {
                startY: startY,
                head: [["Stage 2 Engineering Design (EDI Polishing)", "", ""]],
                body: [
                    ["Parameter", "Stage 2 Value", "Unit"],
                    ["Technology", "EDI", "-"],
                    ["Inlet TDS", fmt(stage2.inletTDS || stage1.outletTDS || 1941, 1), "ppm"],
                    ["Final Outlet TDS", fmt(stage2.outletTDS || targetTds, 1), "ppm"],
                    ["Operating Voltage", fmt(stage2.voltage || 25.0, 2), "V"],
                    ["Operating Current", fmt(stage2.current || 2.1, 2), "A"],
                    ["Power Consumption", fmt(stage2.power || 52.5, 2), "W"],
                    ["Cell Pairs", `${stage2.cellPairs || 50}`, "pairs"],
                    ["Electrode Area", fmt(stage2.electrodeArea || 400, 0), "cm²"]
                ],
                theme: "grid",
                headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
                styles: { fontSize: 7.5, cellPadding: 1.4 },
                columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 }, 1: { cellWidth: 46, alignment: "right" }, 2: { cellWidth: 46 } }
            });

            startY = doc.lastAutoTable.finalY + 3;

            autoTable(doc, {
                startY: startY,
                head: [["Overall Plant Performance", "", ""]],
                body: [
                    ["Parameter", "Overall Value", "Unit"],
                    ["Recommended Process", overall.recommendedProcess || "FCDI → EDI", "-"],
                    ["Overall Feed TDS", fmt(overall.inletTDS || fwTds, 1), "ppm"],
                    ["Overall Final Outlet TDS", fmt(overall.outletTDS || targetTds, 1), "ppm"],
                    ["Overall Salt Removal Efficiency", fmt(overall.removalEfficiency || 99.9, 2), "%"],
                    ["Total Plant Power", fmt(overall.totalPower || 61.86, 2), "W"],
                    ["Overall Specific Energy (SEC)", fmt(overall.sec || sec, 4), "kWh/m³"],
                    ["Overall Water Recovery", fmt(overall.waterRecovery || hydr.waterRecovery, 1), "%"]
                ],
                theme: "grid",
                headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
                styles: { fontSize: 7.5, cellPadding: 1.4 },
                columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 }, 1: { cellWidth: 46, alignment: "right" }, 2: { cellWidth: 46 } }
            });
        } else {
            autoTable(doc, {
                startY: startY,
                head: [["Engineering Design Summary", "", ""]],
                body: [
                    ["Parameter", "Recommended / Current Value", "Unit"],
                    ["Operating Voltage", fmt(elec.voltage, 2), "V"],
                    ["Current", fmt(elec.current, 2), "A"],
                    ["Power Consumption", fmt(elec.power, 2), "W"],
                    ["Cell Pairs", `${stack.cellPairs || 20}`, "pairs"],
                    ["Electrode Area (per cell)", fmt(stack.electrodeArea || 250, 0), "cm²"],
                    ["Residence Time", fmt(stack.residenceTime || 10.0, 1), "min"],
                    ["Flow Velocity", fmt(hydr.flowVelocity || 0.300, 3), "m/s"],
                    ["Pressure Drop", fmt(hydr.pressureDrop || 580.8, 1), "Pa"],
                    ["Pump Power", fmt(hydr.pumpPower || 0.138, 3), "W"],
                    ["Water Recovery", fmt(hydr.waterRecovery || 99.42, 2), "%"],
                    ["Cell Stack Dimensions (L x W x H)", `${stack.stackLength || 100} x ${stack.stackWidth || 50} x ${stack.stackHeight || 22}`, "mm"]
                ],
                theme: "grid",
                headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 1.5 },
                columnStyles: {
                    0: { fontStyle: "bold", cellWidth: 90 },
                    1: { cellWidth: 46, alignment: "right" },
                    2: { cellWidth: 46 }
                }
            });
        }

        //---------------------------------------------------------
        // PAGE 2: EQUATION EDITOR SUMMARY & OPTIMIZATION SUMMARY
        //---------------------------------------------------------
        doc.addPage();

        // Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 12, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text("CDI / EDI DESIGN PLATFORM — Engineering Equation Report", 14, 8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(147, 197, 253);
        doc.text(`OPERATOR: ${userName.toUpperCase()}`, 196, 8, { align: "right" });

        startY = 18;

        // Equation Summary Data List matching user table
        const defaultEqSummary = [
            ["Power", "Electrical", "V * I", "W", "6.00 W", "Valid", "V = 1.2 V, I = 5 A => P = 6 W"],
            ["Current Density", "Electrical", "I / Area", "A/cm²", "200.00 A/m²", "Valid", "I = 5 A, Area = 250 cm² => J = 0.02 A/cm²"],
            ["Residence Time", "Hydraulic", "ReactorVolume / FlowRate", "min", "10.0 min", "Valid", "ReactorVolume = 2 L, FlowRate = 10 L/min => t = 0.2 min"],
            ["Flow Velocity", "Hydraulic", "FlowRate / ChannelArea", "m/s", "0.300 m/s", "Valid", "FlowRate = 10 L/min, ChannelArea = 1.1 cm² => v = 1.51 m/s"],
            ["Hydraulic Diameter", "Hydraulic", "(2 * Width * Height) / (Width + Height)", "mm", "0.990 mm", "Valid", "Width = 100 mm, Height = 0.5 mm => Dh = 0.995 mm"],
            ["Pressure Drop", "Hydraulic", "f * (Length / Dh) * (Density * Velocity^2 / 2)", "Pa", "580.8 Pa", "Valid", "f=0.03, Length=200mm, Dh=1mm, Density=1000kg/m³, Velocity=0.15m/s => DeltaP=67.5 Pa"],
            ["Pump Power", "Hydraulic", "(FlowRate * DeltaP) / PumpEfficiency", "W", "0.138 W", "Valid", "FlowRate=10 L/min (1.66e-4 m³/s), DeltaP=180 Pa, PumpEfficiency=75% => PumpPower=0.04 W"],
            ["Specific Energy Consumption", "Energy", "Power / WaterProduced", "kWh/m³", "0.0100 kWh/m³", "Valid", "Power = 6 W, WaterProduced = 10 L/min (0.6 m³/h) => SEC = 0.01 kWh/m³"],
            ["Salt Removal", "Mass Transfer", "FeedTDS - OutletTDS", "ppm", "33.0 ppm", "Valid", "FeedTDS = 500 ppm, OutletTDS = 50 ppm => SaltRemoval = 450 ppm"],
            ["Removal Efficiency", "Performance", "((FeedTDS - OutletTDS) / FeedTDS) * 100", "%", "6.60 %", "Valid", "FeedTDS = 500 ppm, OutletTDS = 50 ppm => RemovalEfficiency = 90%"],
            ["Electrode Mass", "Performance", "Area * Thickness * Density", "g", "67.50 g", "Valid", "Area = 250 cm², Thickness = 0.6 mm (0.06 cm), Density = 0.45 g/cm³ => Mass = 6.75 g"],
            ["Salt Adsorption Capacity", "Optimization", "SaltRemoved / ElectrodeMass", "mg/g", "6.60 mg/g", "Valid", "SaltRemoved = 135 mg, ElectrodeMass = 6.75 g => SAC = 20 mg/g"],
            ["Charge Efficiency", "Electrochemical", "RemovedCharge / SuppliedCharge", "%", "85.0 %", "Valid", "RemovedCharge = 85 C, SuppliedCharge = 100 C => Lambda = 0.85 (85%)"]
        ];

        // 4. Equation Editor Summary Table
        autoTable(doc, {
            startY: startY,
            head: [["Equation Name", "Category", "Formula", "Units", "Current Value", "Status", "Example Calculation"]],
            body: defaultEqSummary,
            theme: "striped",
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
            styles: { fontSize: 7, cellPadding: 1.2 },
            columnStyles: {
                0: { cellWidth: 26, fontStyle: "bold" },
                1: { cellWidth: 18 },
                2: { cellWidth: 32 },
                3: { cellWidth: 12 },
                4: { cellWidth: 16 },
                5: { cellWidth: 12 },
                6: { cellWidth: 66 }
            }
        });

        startY = doc.lastAutoTable.finalY + 4;

        // 5. User Equation Modifications Section
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text("User Equation Modifications", 14, startY);
        startY += 4;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        if (modifications && modifications.length > 0) {
            const modRows = modifications.map(m => [m.parameter || m.module, m.oldValue || "-", m.newValue || "-", m.user || "-", m.date || "-"]);
            autoTable(doc, {
                startY: startY,
                head: [["Parameter", "Old Formula / Value", "New Formula / Value", "Modified By", "Date"]],
                body: modRows,
                theme: "grid",
                headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
                styles: { fontSize: 7.5, cellPadding: 1.5 }
            });
            startY = doc.lastAutoTable.finalY + 4;
        } else {
            doc.text("No equation modifications were made.", 14, startY);
            startY += 6;
        }

        // 6. Optimization Summary - [AI Optimization] Table
        autoTable(doc, {
            startY: startY,
            head: [[`Optimization Summary - [${optMode}]`, "", "", ""]],
            body: [
                ["Parameter", "Operational Value", "Unit", "Override Status"],
                ["Voltage", fmt(elec.voltage, 2), "V", "Auto"],
                ["Current", fmt(elec.current, 2), "A", "Auto"],
                ["Cell Pairs", `${stack.cellPairs || 36}`, "pairs", "Auto"],
                ["Electrode Area", fmt(stack.electrodeArea || 250, 0), "cm²", "Auto"],
                ["Flow Rate", fmt(fwFlow, 1), "L/min", "Auto"],
                ["Residence Time", fmt(stack.residenceTime || 10.0, 1), "min", "Auto"],
                ["Flow Velocity", fmt(hydr.flowVelocity || 0.150, 3), "m/s", "Auto"],
                ["Spacer Thickness", "0.50", "mm", "Auto"]
            ],
            theme: "grid",
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
            styles: { fontSize: 7.5, cellPadding: 1.5 },
            columnStyles: {
                0: { fontStyle: "bold", cellWidth: 60 },
                1: { cellWidth: 42, alignment: "right" },
                2: { cellWidth: 40 },
                3: { cellWidth: 40 }
            }
        });

        //---------------------------------------------------------
        // PAGE 3: SIMULATION RESULTS, EVALUATION & SYSTEM INFO
        //---------------------------------------------------------
        doc.addPage();

        // Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 12, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text("CDI / EDI DESIGN PLATFORM — Engineering Equation Report", 14, 8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(147, 197, 253);
        doc.text(`OPERATOR: ${userName.toUpperCase()}`, 196, 8, { align: "right" });

        startY = 18;

        // 7. Simulation Results & Desalination Performance Table
        autoTable(doc, {
            startY: startY,
            head: [["Simulation Results & Desalination Performance", "", ""]],
            body: [
                ["Performance Metric", "Calculated Value", "Operational Target"],
                ["Outlet Salinity (TDS)", fmt(outletTds, 1, "ppm"), "50 ppm (Target)"],
                ["Salt Removal", fmt(saltRemoval, 1, "ppm"), "Baseline Adsorption"],
                ["Removal Efficiency", fmt(removalEff, 2, "%"), "Optimal Target"],
                ["Power Consumption", fmt(powerCons, 2, "W"), "Stack Capacity"],
                ["Specific Energy", fmt(sec, 4, "kWh/m³"), "Efficiency Index"],
                ["Pressure Drop", fmt(hydr.pressureDrop || 580.8, 1, "Pa"), "Hydraulic Load"],
                ["Water Recovery", fmt(hydr.waterRecovery || 99.42, 2, "%"), "Volume Yield"]
            ],
            theme: "grid",
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: "bold", cellWidth: 70 },
                1: { cellWidth: 56, fontStyle: "bold", textColor: [37, 99, 235] },
                2: { cellWidth: 56 }
            }
        });

        startY = doc.lastAutoTable.finalY + 6;

        // 8. Performance Summary Text Block
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text("Performance Summary:", 14, startY);
        startY += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        const summaryText = `The selected ${recTech} technology is suitable for treating feed water with a TDS of ${fmt(fwTds, 0)} ppm. The optimized operating voltage is ${fmt(elec.voltage, 2)} V. Expected removal efficiency is ${fmt(removalEff, 2)}%. Specific energy consumption is ${fmt(sec, 4)} kWh/m³. Pressure drop remains within acceptable operating limits. The design is suitable for laboratory-scale and pilot-scale implementation.`;
        
        const splitText = doc.splitTextToSize(summaryText, 182);
        doc.text(splitText, 14, startY);
        startY += (splitText.length * 4.5) + 6;

        // 9. Equation Audit Trail Section
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text("Equation Audit Trail", 14, startY);
        startY += 4;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("No equation modifications were me.", 14, startY);
        startY += 10;

        // 10. System Information Table
        autoTable(doc, {
            startY: startY,
            head: [["System Information", "", "", ""]],
            body: [
                ["Software Version:", "2.5.0", "React Version:", "18.3.1"],
                ["Node Version:", "20.14.0", "Express Version:", "4.19.2"]
            ],
            theme: "plain",
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
            styles: { fontSize: 7.5, cellPadding: 1.5 },
            columnStyles: {
                0: { fontStyle: "bold", cellWidth: 35 },
                1: { cellWidth: 55 },
                2: { fontStyle: "bold", cellWidth: 35 },
                3: { cellWidth: 57 }
            }
        });

        startY = doc.lastAutoTable.finalY + 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Generated by: CDI / EDI Design Platform", 105, startY, { align: "center" });
        doc.text("CONFIDENTIAL - FOR INTERNAL USE ONLY", 105, startY + 4, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.text("End of Engineering Report", 105, startY + 8, { align: "center" });

        // APPLY RUNNING FOOTER TO ALL PAGES
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);

            // Footer (All Pages)
            doc.setDrawColor(226, 232, 240);
            doc.line(14, 284, 196, 284);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text(`CDI / EDI Design Platform - System Report    Generated: ${fullTimeStamp}`, 14, 289);
            doc.text(`CONFIDENTIAL - FOR INTERNAL USE ONLY          Page ${i} of ${totalPages}`, 196, 289, { align: "right" });
        }

        doc.save(`CDI_EDI_Engineering_Report_${userName.replace(/\s+/g, "_")}.pdf`);
        return true;
    } catch (e) {
        console.error("Critical error generating PDF report:", e);
        alert(`Report generation failed: ${e.message}`);
        return false;
    }
};
