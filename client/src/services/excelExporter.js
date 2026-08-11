import * as XLSX from "xlsx";

/**
 * Helper to download a workbook object as a file
 */
function downloadWorkbook(workbook, filename) {
    XLSX.writeFile(workbook, filename);
}

/**
 * Export Users list to Excel (.xlsx)
 */
export function exportUsersToExcel(users = []) {
    const formattedData = users.map((u) => ({
        "User ID": u.id,
        "Full Name": u.fullName || u.full_name || "Engineer",
        "Email Address": u.email,
        "Role": u.role || "User",
        "Status": u.status || "Active",
        "Created Date": u.created_at ? new Date(u.created_at).toLocaleString() : "-",
        "Last Login": u.last_login ? new Date(u.last_login).toLocaleString() : "Never",
        "Total Logins": u.total_logins || 1,
        "Last Activity": u.last_activity || "None"
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    downloadWorkbook(workbook, `CDI_EDI_Users_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Engineering Design Report to Excel (.xlsx)
 */
export function exportDesignReportToExcel(designResult = {}) {
    const eng = designResult.engineering || {};
    const feed = designResult.input?.feedWater || {};

    const summaryData = [
        { Parameter: "Design Technology", Value: eng.technology || "CDI", Unit: "-" },
        { Parameter: "Feed TDS", Value: feed.tds || 500, Unit: "mg/L" },
        { Parameter: "Target TDS", Value: feed.targetTds || 50, Unit: "mg/L" },
        { Parameter: "Product Outlet TDS", Value: Number(eng.outletTDS || 50).toFixed(1), Unit: "mg/L" },
        { Parameter: "Removal Efficiency", Value: Number(eng.removalEfficiency || 90).toFixed(2), Unit: "%" },
        { Parameter: "Water Recovery", Value: Number(eng.waterRecovery || 95).toFixed(1), Unit: "%" },
        { Parameter: "Operating Voltage", Value: eng.voltage || 1.0, Unit: "V" },
        { Parameter: "Operating Current", Value: Number(eng.current || 1.42).toFixed(2), Unit: "A" },
        { Parameter: "DC Power Dissipation", Value: Number(eng.power || 1.42).toFixed(1), Unit: "W" },
        { Parameter: "Specific Energy Consumption (SEC)", Value: Number(eng.sec || 0.0024).toFixed(4), Unit: "kWh/m³" },
        { Parameter: "Pressure Drop", Value: Number(eng.pressureDrop || 270).toFixed(0), Unit: "Pa" },
        { Parameter: "Cell Pairs", Value: eng.cellPairs || 95, Unit: "pairs" },
        { Parameter: "Electrode Area", Value: eng.electrodeArea || 150, Unit: "cm²" }
    ];

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Engineering Design Summary");
    downloadWorkbook(workbook, `CDI_EDI_Engineering_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Activity Logs to Excel (.xlsx)
 */
export function exportActivityLogsToExcel(logs = []) {
    const formattedData = logs.map((l) => ({
        "Log ID": l.id,
        "Timestamp": l.created_at ? new Date(l.created_at).toLocaleString() : new Date().toLocaleString(),
        "User Email": l.email || l.user_email || "Anonymous",
        "Role": l.role || "User",
        "Activity": l.activity || l.action || "Action",
        "Module": l.module || "General",
        "Details": l.details || "-",
        "IP Address": l.ip_address || "127.0.0.1",
        "Browser/Device": l.browser || "Web Browser"
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Activity Logs");
    downloadWorkbook(workbook, `CDI_EDI_Activity_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Equation Modification Audit Trail to Excel (.xlsx)
 */
export function exportEquationAuditsToExcel(audits = []) {
    const formattedData = audits.map((a) => ({
        "Audit ID": a.id,
        "Timestamp": a.created_at ? new Date(a.created_at).toLocaleString() : new Date().toLocaleString(),
        "User": a.email || a.user_email || "Admin",
        "Equation Name / Parameter": a.parameter || a.name || "Equation",
        "Old Expression": a.old_value || "-",
        "New Expression": a.new_value || "-",
        "Change Reason": a.reason || "Manual update",
        "Status": a.status || "Applied"
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Equation Audits");
    downloadWorkbook(workbook, `CDI_EDI_Equation_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Comprehensive Multi-Tab Enterprise Workbook
 */
export function exportFullEnterpriseReportToExcel({
    users = [],
    activityLogs = [],
    equationAudits = [],
    optimizations = [],
    loginHistory = []
}) {
    const workbook = XLSX.utils.book_new();

    // 1. Users Sheet
    const usersSheet = XLSX.utils.json_to_sheet(
        users.map((u) => ({
            "Full Name": u.fullName || u.full_name || "User",
            "Email": u.email,
            "Role": u.role || "User",
            "Status": u.status || "Active",
            "Last Login": u.last_login ? new Date(u.last_login).toLocaleString() : "Never",
            "Created Date": u.created_at ? new Date(u.created_at).toLocaleString() : "-"
        }))
    );
    XLSX.utils.book_append_sheet(workbook, usersSheet, "User Directory");

    // 2. Activity Logs Sheet
    const activitySheet = XLSX.utils.json_to_sheet(
        activityLogs.map((l) => ({
            "Timestamp": l.created_at ? new Date(l.created_at).toLocaleString() : "-",
            "User": l.email || "Anonymous",
            "Action": l.activity || l.action || "Action",
            "Module": l.module || "General",
            "Details": l.details || "-"
        }))
    );
    XLSX.utils.book_append_sheet(workbook, activitySheet, "Activity Logs");

    // 3. Equation History Sheet
    const equationSheet = XLSX.utils.json_to_sheet(
        equationAudits.map((a) => ({
            "Timestamp": a.created_at ? new Date(a.created_at).toLocaleString() : "-",
            "Modified By": a.email || "Admin",
            "Equation / Parameter": a.parameter || "Formula",
            "Old Formula": a.old_value || "-",
            "New Formula": a.new_value || "-",
            "Reason": a.reason || "-"
        }))
    );
    XLSX.utils.book_append_sheet(workbook, equationSheet, "Equation Audit Trail");

    // 4. Login History Sheet
    const loginSheet = XLSX.utils.json_to_sheet(
        loginHistory.map((lh) => ({
            "Timestamp": lh.login_time ? new Date(lh.login_time).toLocaleString() : "-",
            "Email": lh.email,
            "Status": lh.status || "LOGIN",
            "Browser": lh.browser || "-",
            "Session Duration": lh.session_duration || "-"
        }))
    );
    XLSX.utils.book_append_sheet(workbook, loginSheet, "Login History");

    downloadWorkbook(workbook, `CDI_EDI_Enterprise_Master_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export any dataset to CSV file
 */
export function exportDataToCSV(data = [], filename = "export.csv") {
    if (!data.length) return;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

export default {
    exportUsersToExcel,
    exportDesignReportToExcel,
    exportActivityLogsToExcel,
    exportEquationAuditsToExcel,
    exportFullEnterpriseReportToExcel,
    exportDataToCSV
};
