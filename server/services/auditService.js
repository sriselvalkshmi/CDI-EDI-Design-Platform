"use strict";

const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const supabase = require("../config/supabaseClient");

const LOGS_DIR = path.join(__dirname, "../logs");
const FILE_PATH = path.join(LOGS_DIR, "Login_History.xlsx");

let writeQueue = Promise.resolve();

class AuditService {
    constructor() {
        this.ensureDir();
    }

    ensureDir() {
        if (!fs.existsSync(LOGS_DIR)) {
            fs.mkdirSync(LOGS_DIR, { recursive: true });
        }
    }

    parseUserAgent(userAgentString) {
        if (!userAgentString) return { browser: "Unknown", os: "Unknown" };
        let os = "Unknown OS";
        let browser = "Unknown Browser";

        if (userAgentString.includes("Windows")) os = "Windows";
        else if (userAgentString.includes("Macintosh") || userAgentString.includes("Mac OS")) os = "macOS";
        else if (userAgentString.includes("Linux")) os = "Linux";
        else if (userAgentString.includes("Android")) os = "Android";
        else if (userAgentString.includes("like Mac") || userAgentString.includes("iPhone") || userAgentString.includes("iPad")) os = "iOS";

        if (userAgentString.includes("Edge") || userAgentString.includes("Edg")) browser = "Edge";
        else if (userAgentString.includes("OPR") || userAgentString.includes("Opera")) browser = "Opera";
        else if (userAgentString.includes("Firefox")) browser = "Firefox";
        else if (userAgentString.includes("Chrome")) browser = "Chrome";
        else if (userAgentString.includes("Safari")) browser = "Safari";
        else if (userAgentString.includes("MSIE") || userAgentString.includes("Trident")) browser = "Internet Explorer";

        return { browser, os };
    }

    getIPAddress(req) {
        if (!req) return "127.0.0.1";
        const forward = req.headers ? req.headers["x-forwarded-for"] : null;
        if (forward) return forward.split(",")[0].trim();
        return req.socket?.remoteAddress || req.ip || "127.0.0.1";
    }

    async getOrCreateWorkbook() {
        const workbook = new ExcelJS.Workbook();
        if (fs.existsSync(FILE_PATH)) {
            try {
                await workbook.xlsx.readFile(FILE_PATH);
                if (!workbook.getWorksheet("Login_History")) this.initLoginSheet(workbook);
                if (!workbook.getWorksheet("User_Activity")) this.initActivitySheet(workbook);
                if (!workbook.getWorksheet("Engineering_Modifications")) this.initModSheet(workbook);
                return workbook;
            } catch (e) {
                console.warn("[EXCEL AUDIT] Could not read existing workbook, creating new one:", e.message);
            }
        }

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
        const sheet = workbook.addWorksheet("Login_History");
        sheet.views = [{ state: "frozen", ySplit: 1 }];
        sheet.columns = [
            { header: "Login Time", key: "loginTime", width: 22 },
            { header: "Logout Time", key: "logoutTime", width: 22 },
            { header: "Email", key: "email", width: 25 },
            { header: "Status", key: "status", width: 16 },
            { header: "IP Address", key: "ip", width: 18 },
            { header: "Browser", key: "browser", width: 15 },
            { header: "Operating System", key: "os", width: 15 },
            { header: "Session Duration", key: "duration", width: 18 }
        ];
        this.formatHeaderRow(sheet);
    }

    initActivitySheet(workbook) {
        const sheet = workbook.addWorksheet("User_Activity");
        sheet.views = [{ state: "frozen", ySplit: 1 }];
        sheet.columns = [
            { header: "Date", key: "date", width: 14 },
            { header: "Time", key: "time", width: 14 },
            { header: "Email", key: "email", width: 25 },
            { header: "Activity", key: "activity", width: 22 },
            { header: "Module", key: "module", width: 20 },
            { header: "Details", key: "details", width: 35 }
        ];
        this.formatHeaderRow(sheet);
    }

    initModSheet(workbook) {
        const sheet = workbook.addWorksheet("Engineering_Modifications");
        sheet.views = [{ state: "frozen", ySplit: 1 }];
        sheet.columns = [
            { header: "Date", key: "date", width: 14 },
            { header: "User Email", key: "email", width: 25 },
            { header: "Parameter", key: "parameter", width: 22 },
            { header: "Old Value", key: "oldValue", width: 20 },
            { header: "New Value", key: "newValue", width: 20 },
            { header: "Reason", key: "reason", width: 35 }
        ];
        this.formatHeaderRow(sheet);
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

    async logLogin(userId, email, req, success) {
        const uaString = req?.headers ? req.headers["user-agent"] : "";
        const { browser, os } = this.parseUserAgent(uaString);
        const ip_address = this.getIPAddress(req);
        const status = success ? "LOGIN" : "FAILED LOGIN";

        // 1. Supabase Database Logging
        if (supabase) {
            try {
                await supabase.from("login_history").insert([{
                    user_id: userId || null,
                    email: email || "Anonymous",
                    ip_address,
                    browser,
                    operating_system: os,
                    status
                }]);
            } catch (e) {
                console.error("[AUDIT] Error logging login into Supabase:", e.message);
            }
        }

        // 2. Server Excel File Audit Logging
        this.enqueue(async () => {
            const workbook = await this.getOrCreateWorkbook();
            const sheet = workbook.getWorksheet("Login_History");
            const now = new Date();
            const dateStr = now.toLocaleString();
            sheet.addRow([dateStr, "-", email || "Anonymous", status, ip_address, browser, os, "-"]);
            await workbook.xlsx.writeFile(FILE_PATH);
        });

        await this.logActivity(userId, email, success ? "Login" : "Failed Login", "Auth", success ? "User logged in successfully" : "Failed login attempt");
    }

    async logLogout(userId, email) {
        if (supabase) {
            try {
                const { data } = await supabase
                    .from("login_history")
                    .select("id")
                    .eq("email", email)
                    .eq("status", "LOGIN")
                    .is("logout_time", null)
                    .order("login_time", { ascending: false })
                    .limit(1);

                if (data && data.length > 0) {
                    await supabase
                        .from("login_history")
                        .update({ logout_time: new Date().toISOString(), status: "LOGOUT" })
                        .eq("id", data[0].id);
                }
            } catch (e) {
                console.error("[AUDIT] Error logging logout into Supabase:", e.message);
            }
        }

        this.enqueue(async () => {
            const workbook = await this.getOrCreateWorkbook();
            const sheet = workbook.getWorksheet("Login_History");
            if (!sheet) return;

            let rowToUpdate = null;
            sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber === 1) return;
                const emailVal = row.getCell(3).value;
                const statusVal = row.getCell(4).value;
                const logoutVal = row.getCell(2).value;

                if (emailVal === email && statusVal === "LOGIN" && (logoutVal === "-" || !logoutVal)) {
                    rowToUpdate = row;
                }
            });

            const now = new Date();
            const dateStr = now.toLocaleString();

            if (rowToUpdate) {
                rowToUpdate.getCell(2).value = dateStr;
                rowToUpdate.getCell(4).value = "LOGOUT";
            }
            await workbook.xlsx.writeFile(FILE_PATH);
        });

        await this.logActivity(userId, email, "Logout", "Auth", "User logged out");
    }

    async logActivity(userId, email, activity, moduleName, details) {
        if (supabase) {
            try {
                await supabase.from("user_activity").insert([{
                    user_id: userId || null,
                    email: email || "Anonymous",
                    activity: activity || "Action",
                    module: moduleName || "General",
                    details: details || "-"
                }]);
            } catch (e) {
                console.error("[AUDIT] Error logging activity into Supabase:", e.message);
            }
        }

        this.enqueue(async () => {
            const workbook = await this.getOrCreateWorkbook();
            const sheet = workbook.getWorksheet("User_Activity");
            if (!sheet) return;
            const now = new Date();
            sheet.addRow([
                now.toLocaleDateString(),
                now.toLocaleTimeString(),
                email || "Anonymous",
                activity || "Action",
                moduleName || "General",
                details || "-"
            ]);
            await workbook.xlsx.writeFile(FILE_PATH);
        });
    }

    async logModification(userId, parameter, oldValue, newValue, reason) {
        if (supabase) {
            try {
                await supabase.from("engineering_modifications").insert([{
                    user_id: userId || null,
                    parameter: parameter || "Unknown Parameter",
                    old_value: String(oldValue ?? "-"),
                    new_value: String(newValue ?? "-"),
                    reason: reason || "Parameter modification"
                }]);
            } catch (e) {
                console.error("[AUDIT] Error logging modification into Supabase:", e.message);
            }
        }

        this.enqueue(async () => {
            const workbook = await this.getOrCreateWorkbook();
            const sheet = workbook.getWorksheet("Engineering_Modifications");
            if (!sheet) return;
            const now = new Date();
            sheet.addRow([
                now.toLocaleString(),
                userId || "Anonymous User",
                parameter || "Unknown Parameter",
                String(oldValue ?? "-"),
                String(newValue ?? "-"),
                reason || "Parameter modification"
            ]);
            await workbook.xlsx.writeFile(FILE_PATH);
        });
    }

    async readLogsData() {
        if (!supabase) {
            return { loginHistory: [], userActivity: [], engineeringModifications: [] };
        }

        try {
            const [loginRes, activityRes, modRes] = await Promise.all([
                supabase.from("login_history").select("*").order("login_time", { ascending: false }).limit(100),
                supabase.from("user_activity").select("*").order("timestamp", { ascending: false }).limit(100),
                supabase.from("engineering_modifications").select("*").order("timestamp", { ascending: false }).limit(100)
            ]);

            const loginHistory = (loginRes.data || []).map(item => {
                let sessionDuration = "-";
                if (item.login_time && item.logout_time) {
                    const start = new Date(item.login_time);
                    const end = new Date(item.logout_time);
                    const diffSecs = Math.round((end - start) / 1000);
                    if (diffSecs < 60) sessionDuration = `${diffSecs} seconds`;
                    else sessionDuration = `${Math.floor(diffSecs / 60)} min ${diffSecs % 60} sec`;
                }
                return {
                    id: item.id,
                    loginTime: item.login_time ? new Date(item.login_time).toLocaleString() : "-",
                    logoutTime: item.logout_time ? new Date(item.logout_time).toLocaleString() : "-",
                    userId: item.user_id,
                    email: item.email,
                    status: item.status,
                    ip: item.ip_address || "127.0.0.1",
                    browser: item.browser || "Unknown",
                    os: item.operating_system || "Unknown",
                    sessionDuration
                };
            });

            const userActivity = (activityRes.data || []).map(item => ({
                id: item.id,
                date: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "-",
                time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "-",
                userId: item.user_id,
                email: item.email,
                activity: item.activity,
                module: item.module,
                details: item.details
            }));

            const engineeringModifications = (modRes.data || []).map(item => ({
                id: item.id,
                date: item.timestamp ? new Date(item.timestamp).toLocaleString() : "-",
                userId: item.user_id,
                parameter: item.parameter,
                oldValue: item.old_value,
                newValue: item.new_value,
                reason: item.reason
            }));

            return { loginHistory, userActivity, engineeringModifications };
        } catch (e) {
            console.error("[AUDIT] Error fetching audit logs from Supabase:", e.message);
            return { loginHistory: [], userActivity: [], engineeringModifications: [] };
        }
    }

    enqueue(writeFn) {
        writeQueue = writeQueue.then(writeFn).catch(e => {
            console.error("[EXCEL AUDIT] Critical Excel write error:", e.message);
        });
        return writeQueue;
    }
}

module.exports = new AuditService();
