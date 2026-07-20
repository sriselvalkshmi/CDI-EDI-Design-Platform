"use strict";

const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const LOGS_DIR = path.join(__dirname, "../logs");
const FILE_PATH = path.join(LOGS_DIR, "Login_History.xlsx");

// Concurrency queue to serialize writes to the Excel file
let writeQueue = Promise.resolve();

class ExcelHelper {
    constructor() {
        this.ensureDir();
    }

    ensureDir() {
        if (!fs.existsSync(LOGS_DIR)) {
            fs.mkdirSync(LOGS_DIR, { recursive: true });
        }
    }

    parseUserAgent(userAgentString) {
        if (!userAgentString) {
            return { browser: "Unknown", os: "Unknown" };
        }
        let os = "Unknown OS";
        let browser = "Unknown Browser";

        if (userAgentString.indexOf("Windows") !== -1) os = "Windows";
        else if (userAgentString.indexOf("Macintosh") !== -1 || userAgentString.indexOf("Mac OS") !== -1) os = "macOS";
        else if (userAgentString.indexOf("Linux") !== -1) os = "Linux";
        else if (userAgentString.indexOf("Android") !== -1) os = "Android";
        else if (userAgentString.indexOf("like Mac") !== -1 || userAgentString.indexOf("iPhone") !== -1 || userAgentString.indexOf("iPad") !== -1) os = "iOS";

        if (userAgentString.indexOf("Edge") !== -1 || userAgentString.indexOf("Edg") !== -1) browser = "Edge";
        else if (userAgentString.indexOf("OPR") !== -1 || userAgentString.indexOf("Opera") !== -1) browser = "Opera";
        else if (userAgentString.indexOf("Firefox") !== -1) browser = "Firefox";
        else if (userAgentString.indexOf("Chrome") !== -1) browser = "Chrome";
        else if (userAgentString.indexOf("Safari") !== -1) browser = "Safari";
        else if (userAgentString.indexOf("MSIE") !== -1 || userAgentString.indexOf("Trident") !== -1) browser = "Internet Explorer";

        return { browser, os };
    }

    getIPAddress(req) {
        if (!req) return "127.0.0.1";
        const forward = req.headers ? req.headers["x-forwarded-for"] : null;
        if (forward) {
            return forward.split(",")[0].trim();
        }
        return req.socket?.remoteAddress || req.ip || "127.0.0.1";
    }

    async getOrCreateWorkbook() {
        const workbook = new ExcelJS.Workbook();
        
        if (fs.existsSync(FILE_PATH)) {
            try {
                await workbook.xlsx.readFile(FILE_PATH);

                if (!workbook.getWorksheet("Login_History")) {
                    this.initLoginSheet(workbook);
                }
                if (!workbook.getWorksheet("User_Activity")) {
                    this.initActivitySheet(workbook);
                }
                if (!workbook.getWorksheet("Engineering_Modifications")) {
                    this.initModSheet(workbook);
                }

                return workbook;
            } catch (e) {
                console.error("Error reading existing Excel workbook, creating a new one.", e);
            }
        }

        // Initialize new workbook
        workbook.creator = "CDI-EDI Design Platform";
        workbook.created = new Date();

        this.initLoginSheet(workbook);
        this.initActivitySheet(workbook);
        this.initModSheet(workbook);

        this.ensureDir();
        await workbook.xlsx.writeFile(FILE_PATH);
        return workbook;
    }

    initLoginSheet(workbook) {
        const loginSheet = workbook.addWorksheet("Login_History");
        loginSheet.views = [{ state: "frozen", ySplit: 1 }];
        loginSheet.columns = [
            { header: "Login Time", key: "loginTime", width: 22 },
            { header: "Logout Time", key: "logoutTime", width: 22 },
            { header: "User Name", key: "username", width: 20 },
            { header: "Email", key: "email", width: 25 },
            { header: "Role", key: "role", width: 16 },
            { header: "Status", key: "status", width: 16 },
            { header: "IP Address", key: "ip", width: 18 },
            { header: "Browser", key: "browser", width: 15 },
            { header: "Operating System", key: "os", width: 15 },
            { header: "Session Duration", key: "duration", width: 18 }
        ];
        this.formatHeaderRow(loginSheet);
    }

    initActivitySheet(workbook) {
        const activitySheet = workbook.addWorksheet("User_Activity");
        activitySheet.views = [{ state: "frozen", ySplit: 1 }];
        activitySheet.columns = [
            { header: "Date", key: "date", width: 14 },
            { header: "Time", key: "time", width: 14 },
            { header: "User", key: "user", width: 20 },
            { header: "Email", key: "email", width: 25 },
            { header: "Activity", key: "activity", width: 22 },
            { header: "Module", key: "module", width: 20 },
            { header: "Details", key: "details", width: 35 }
        ];
        this.formatHeaderRow(activitySheet);
    }

    initModSheet(workbook) {
        const modSheet = workbook.addWorksheet("Engineering_Modifications");
        modSheet.views = [{ state: "frozen", ySplit: 1 }];
        modSheet.columns = [
            { header: "Date", key: "date", width: 14 },
            { header: "User", key: "user", width: 20 },
            { header: "Email", key: "email", width: 25 },
            { header: "Module", key: "module", width: 20 },
            { header: "Parameter", key: "parameter", width: 22 },
            { header: "Old Value", key: "oldValue", width: 20 },
            { header: "New Value", key: "newValue", width: 20 },
            { header: "Reason", key: "reason", width: 35 }
        ];
        this.formatHeaderRow(modSheet);
    }

    formatHeaderRow(worksheet) {
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1976D2" }
        };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
    }

    async logLogin(userObject, req, success) {
        return this.enqueue(async () => {
            const workbook = await this.getOrCreateWorkbook();
            const sheet = workbook.getWorksheet("Login_History");
            const now = new Date();
            const dateStr = now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, "0") + "-" +
                String(now.getDate()).padStart(2, "0") + " " +
                String(now.getHours()).padStart(2, "0") + ":" +
                String(now.getMinutes()).padStart(2, "0") + ":" +
                String(now.getSeconds()).padStart(2, "0");

            const uaString = req && req.headers ? req.headers["user-agent"] : "";
            const { browser, os } = this.parseUserAgent(uaString);
            const ip = this.getIPAddress(req);

            const username = userObject ? (userObject.fullName || userObject.username) : (req.body?.email || req.body?.username || "Anonymous");
            const email = userObject ? (userObject.email || userObject.username) : (req.body?.email || "N/A");
            const role = userObject ? userObject.role : "User";
            const status = success ? "LOGIN" : "FAILED LOGIN";

            sheet.addRow([
                dateStr,
                "-",
                username,
                email,
                role,
                status,
                ip,
                browser,
                os,
                "-"
            ]);
            await workbook.xlsx.writeFile(FILE_PATH);

            // Log to User_Activity
            await this.logActivityInternal(
                workbook,
                username,
                email,
                success ? "Login" : "Failed Login",
                "Auth",
                success ? "User logged in successfully" : "Failed login attempt"
            );
        });
    }

    async logLogout(username, email) {
        return this.enqueue(async () => {
            const workbook = await this.getOrCreateWorkbook();
            const sheet = workbook.getWorksheet("Login_History");
            if (!sheet) return;

            let rowToUpdate = null;
            sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber === 1) return;
                const userVal = row.getCell(3).value;
                const emailVal = row.getCell(4).value;
                const statusVal = row.getCell(6).value;
                const logoutVal = row.getCell(2).value;

                if ((userVal === username || emailVal === email) && statusVal === "LOGIN" && (logoutVal === "-" || !logoutVal)) {
                    rowToUpdate = row;
                }
            });

            const now = new Date();
            const dateStr = now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, "0") + "-" +
                String(now.getDate()).padStart(2, "0") + " " +
                String(now.getHours()).padStart(2, "0") + ":" +
                String(now.getMinutes()).padStart(2, "0") + ":" +
                String(now.getSeconds()).padStart(2, "0");

            if (rowToUpdate) {
                let durationText = "-";
                try {
                    const loginTimeVal = rowToUpdate.getCell(1).value;
                    if (loginTimeVal) {
                        const loginDate = new Date(loginTimeVal);
                        const diffSecs = Math.round((now - loginDate) / 1000);
                        if (diffSecs < 60) {
                            durationText = `${diffSecs} seconds`;
                        } else {
                            const diffMins = Math.floor(diffSecs / 60);
                            const remSecs = diffSecs % 60;
                            durationText = `${diffMins} min ${remSecs} sec`;
                        }
                    }
                } catch (e) {
                    console.error("Error calculating session duration:", e);
                }

                rowToUpdate.getCell(2).value = dateStr;
                rowToUpdate.getCell(6).value = "LOGOUT";
                rowToUpdate.getCell(10).value = durationText;
            }

            await workbook.xlsx.writeFile(FILE_PATH);

            await this.logActivityInternal(
                workbook,
                username || "Anonymous",
                email || "N/A",
                "Logout",
                "Auth",
                "User logged out"
            );
        });
    }

    async logActivity(username, email, activity, moduleName, details) {
        return this.enqueue(async () => {
            const workbook = await this.getOrCreateWorkbook();
            await this.logActivityInternal(workbook, username, email, activity, moduleName, details);
        });
    }

    async logActivityInternal(workbook, username, email, activity, moduleName, details) {
        const sheet = workbook.getWorksheet("User_Activity");
        if (!sheet) return;

        const now = new Date();
        const dateStr = now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, "0") + "-" +
            String(now.getDate()).padStart(2, "0");
        const timeStr = String(now.getHours()).padStart(2, "0") + ":" +
            String(now.getMinutes()).padStart(2, "0") + ":" +
            String(now.getSeconds()).padStart(2, "0");

        sheet.addRow([
            dateStr,
            timeStr,
            username || "Anonymous",
            email || "N/A",
            activity || "Action",
            moduleName || "General",
            details || "-"
        ]);
        await workbook.xlsx.writeFile(FILE_PATH);
    }

    async logModification(username, email, moduleName, parameter, oldValue, newValue, reason) {
        return this.enqueue(async () => {
            const workbook = await this.getOrCreateWorkbook();
            const sheet = workbook.getWorksheet("Engineering_Modifications");
            if (!sheet) return;

            const now = new Date();
            const dateStr = now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, "0") + "-" +
                String(now.getDate()).padStart(2, "0");

            sheet.addRow([
                dateStr,
                username || "Anonymous",
                email || "N/A",
                moduleName || "General",
                parameter,
                String(oldValue ?? "-"),
                String(newValue ?? "-"),
                reason || "Manual modification"
            ]);
            await workbook.xlsx.writeFile(FILE_PATH);
        });
    }

    async compareAndLogParameters(username, email, oldInputs, newInputs, reason, moduleName) {
        try {
            if (!oldInputs || Object.keys(oldInputs).length === 0) return;
            
            const params = [
                { name: "voltage", label: "Voltage" },
                { name: "current", label: "Current" },
                { name: "flowRate", label: "Flow Rate" },
                { name: "cellPairs", label: "Cell Pairs" },
                { name: "electrodeArea", label: "Electrode Area" },
                { name: "spacerThickness", label: "Spacer Thickness" },
                { name: "residenceTime", label: "Residence Time" },
                { name: "technology", label: "Technology" },
                { name: "targetTds", label: "Target TDS" },
                { name: "targetTDS", label: "Target TDS" }
            ];
            
            const feedWaterParams = [
                { name: "tds", label: "Feed Water TDS" },
                { name: "conductivity", label: "Feed Water Conductivity" },
                { name: "hardness", label: "Feed Water Hardness" },
                { name: "ph", label: "Feed Water pH" },
                { name: "temperature", label: "Feed Water Temperature" },
                { name: "flowRate", label: "Feed Water Flow Rate" },
                { name: "pressure", label: "Feed Water Pressure" }
            ];

            for (const p of params) {
                const newVal = newInputs[p.name] !== undefined ? newInputs[p.name] : (newInputs.optimizationInputs ? newInputs.optimizationInputs[p.name] : undefined);
                const oldVal = oldInputs[p.name] !== undefined ? oldInputs[p.name] : (oldInputs.optimizationInputs ? oldInputs.optimizationInputs[p.name] : undefined);
                if (newVal !== undefined && oldVal !== undefined && newVal !== null && oldVal !== null && String(newVal) !== String(oldVal)) {
                    await this.logModification(username, email, moduleName, p.label, oldVal, newVal, reason);
                }
            }

            const newFW = newInputs.feedWater || newInputs || {};
            const oldFW = oldInputs.feedWater || oldInputs || {};
            for (const p of feedWaterParams) {
                const newVal = newFW[p.name];
                const oldVal = oldFW[p.name];
                if (newVal !== undefined && oldVal !== undefined && newVal !== null && oldVal !== null && String(newVal) !== String(oldVal)) {
                    await this.logModification(username, email, moduleName, p.label, oldVal, newVal, reason);
                }
            }
        } catch (e) {
            console.error("Error comparing parameters:", e);
        }
    }

    async readLogsData() {
        const workbook = await this.getOrCreateWorkbook();
        
        const loginSheet = workbook.getWorksheet("Login_History");
        const activitySheet = workbook.getWorksheet("User_Activity");
        const modSheet = workbook.getWorksheet("Engineering_Modifications");

        const loginHistory = [];
        if (loginSheet) {
            loginSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber === 1) return;
                loginHistory.push({
                    loginTime: String(row.getCell(1).value || "-"),
                    logoutTime: String(row.getCell(2).value || "-"),
                    username: String(row.getCell(3).value || "-"),
                    email: String(row.getCell(4).value || "-"),
                    role: String(row.getCell(5).value || "-"),
                    status: String(row.getCell(6).value || "-"),
                    ip: String(row.getCell(7).value || "-"),
                    browser: String(row.getCell(8).value || "-"),
                    os: String(row.getCell(9).value || "-"),
                    sessionDuration: String(row.getCell(10).value || "-")
                });
            });
        }

        const userActivity = [];
        if (activitySheet) {
            activitySheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber === 1) return;
                userActivity.push({
                    date: String(row.getCell(1).value || "-"),
                    time: String(row.getCell(2).value || "-"),
                    user: String(row.getCell(3).value || "-"),
                    email: String(row.getCell(4).value || "-"),
                    activity: String(row.getCell(5).value || "-"),
                    module: String(row.getCell(6).value || "-"),
                    details: String(row.getCell(7).value || "-")
                });
            });
        }

        const engineeringModifications = [];
        if (modSheet) {
            modSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber === 1) return;
                engineeringModifications.push({
                    date: String(row.getCell(1).value || "-"),
                    user: String(row.getCell(2).value || "-"),
                    email: String(row.getCell(3).value || "-"),
                    module: String(row.getCell(4).value || "-"),
                    parameter: String(row.getCell(5).value || "-"),
                    oldValue: String(row.getCell(6).value || "-"),
                    newValue: String(row.getCell(7).value || "-"),
                    reason: String(row.getCell(8).value || "-")
                });
            });
        }

        return {
            loginHistory: loginHistory.reverse(),
            userActivity: userActivity.reverse(),
            engineeringModifications: engineeringModifications.reverse()
        };
    }

    enqueue(writeFn) {
        writeQueue = writeQueue.then(writeFn).catch(e => {
            console.error("Critical Excel write error:", e);
        });
        return writeQueue;
    }

    getFilePath() {
        return FILE_PATH;
    }
}

module.exports = new ExcelHelper();
