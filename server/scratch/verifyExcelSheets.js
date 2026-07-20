"use strict";

const ExcelJS = require("exceljs");
const path = require("path");

async function checkExcel() {
    const filePath = path.join(__dirname, "../logs/Login_History.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    console.log("=== VERIFYING EXCEL WORKBOOK WORKSHEETS ===");
    
    workbook.worksheets.forEach(sheet => {
        console.log(`\nWorksheet: ${sheet.name}`);
        console.log(`- Number of rows (including header): ${sheet.rowCount}`);
        
        // Print first 5 rows
        for (let i = 1; i <= Math.min(sheet.rowCount, 6); i++) {
            const rowVals = [];
            sheet.getRow(i).eachCell({ includeEmpty: true }, cell => {
                rowVals.push(cell.value);
            });
            console.log(`  Row ${i}:`, rowVals);
        }
    });

    console.log("\n==========================================");
}

checkExcel().catch(e => console.error("Error checking Excel sheets:", e));
