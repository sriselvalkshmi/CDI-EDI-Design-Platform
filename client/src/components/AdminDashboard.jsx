import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useToast } from "./ToastNotification";
import auditLogger from "../services/auditLogger";
import {
    exportUsersToExcel,
    exportActivityLogsToExcel,
    exportEquationAuditsToExcel,
    exportFullEnterpriseReportToExcel,
    exportDataToCSV
} from "../services/excelExporter";
import {
    Users,
    Activity,
    FileSpreadsheet,
    Shield,
    Search,
    UserPlus,
    Key,
    UserX,
    UserCheck,
    Trash2,
    Download,
    FileText,
    Calculator,
    RotateCcw,
    History
} from "lucide-react";

export default function AdminDashboard() {
    const {
        currentUser,
        userDirectory,
        createUser,
        toggleUserStatus,
        deleteUser,
        resetUserPassword
    } = useAuth();

    const { equations, saveEquations, setPage } = useApp();
    const { showSuccess, showError } = useToast();

    const userRole = (currentUser?.role === "Administrator" || currentUser?.email?.toLowerCase() === "admin@cdiedi.com") ? "Administrator" : "User";

    // Permission Guard: Restrict Admin Dashboard strictly to Administrator accounts
    if (userRole !== "Administrator") {
        return (
            <div style={{ width: "100%", height: "100%", padding: "60px 20px", textAlign: "center", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", backgroundColor: "#FEF2F2", display: "inline-flex", justifyContent: "center", alignItems: "center", marginBottom: "16px" }}>
                    <Shield size={32} color="#DC2626" />
                </div>
                <h2 style={{ color: "#0F172A", fontSize: "22px", fontWeight: "700", margin: "0 0 8px 0" }}>Access Denied</h2>
                <p style={{ color: "#64748B", fontSize: "14px", margin: "0 0 20px 0" }}>Administrator permission is required to access the Enterprise Admin Dashboard.</p>
                <button
                    onClick={() => setPage("DASHBOARD")}
                    style={{
                        backgroundColor: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        fontSize: "13.5px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Active Dashboard Tab: "USERS" | "ACTIVITY" | "EQUATIONS" | "AUDIT" | "REPORTS"
    const [activeTab, setActiveTab] = useState("USERS");

    // Search and Filter states
    const [userSearch, setUserSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [logSearch, setLogSearch] = useState("");

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFullName, setNewFullName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("User");

    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [resetPassInput, setResetPassInput] = useState("");

    // Audit logs from auditLogger
    const activityLogs = useMemo(() => auditLogger.getActivityLogs(), [activeTab]);
    const equationAudits = useMemo(() => auditLogger.getEquationAudits(), [activeTab]);

    // Filtered Users List
    const filteredUsers = useMemo(() => {
        return userDirectory.filter((u) => {
            const matchesSearch =
                (u.fullName || "").toLowerCase().includes(userSearch.toLowerCase()) ||
                (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
                (u.username || "").toLowerCase().includes(userSearch.toLowerCase());
            const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
            const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [userDirectory, userSearch, roleFilter, statusFilter]);

    // Filtered Activity Logs
    const filteredLogs = useMemo(() => {
        return activityLogs.filter((l) => {
            const matchesSearch =
                (l.email || "").toLowerCase().includes(logSearch.toLowerCase()) ||
                (l.activity || "").toLowerCase().includes(logSearch.toLowerCase()) ||
                (l.details || "").toLowerCase().includes(logSearch.toLowerCase());
            return matchesSearch;
        });
    }, [activityLogs, logSearch]);

    // Create User Submit
    const handleCreateUserSubmit = async (e) => {
        e.preventDefault();
        try {
            await createUser({
                fullName: newFullName.trim(),
                email: newEmail.trim(),
                password: newPassword,
                role: newRole
            });
            showSuccess(`User ${newEmail} created successfully as ${newRole}.`);
            setShowCreateModal(false);
            setNewFullName("");
            setNewEmail("");
            setNewPassword("");
            setNewRole("User");
        } catch (err) {
            showError(err.message);
        }
    };

    // Reset Password Submit
    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        try {
            await resetUserPassword(selectedUserId, resetPassInput);
            showSuccess("Password reset successfully.");
            setShowResetModal(false);
            setResetPassInput("");
        } catch (err) {
            showError(err.message);
        }
    };

    // Restore Equation Version
    const handleRestoreEquation = async (auditItem) => {
        if (!auditItem.old_value || auditItem.old_value === "-") {
            showError("No previous formula value available to restore.");
            return;
        }

        try {
            const updatedEquations = equations.map((eq) => {
                if (eq.name === auditItem.parameter || eq.id === auditItem.equation_id) {
                    return { ...eq, formula: auditItem.old_value, status: "Published" };
                }
                return eq;
            });

            await saveEquations(updatedEquations);
            await auditLogger.logEquationModification({
                userId: currentUser?.id,
                email: currentUser?.email,
                parameter: auditItem.parameter,
                oldValue: auditItem.new_value,
                newValue: auditItem.old_value,
                reason: `Restored to version from ${new Date(auditItem.created_at).toLocaleString()}`
            });

            showSuccess(`Restored equation '${auditItem.parameter}' to previous version.`);
        } catch (e) {
            showError("Failed to restore equation version.");
        }
    };

    return (
        <div style={styles.container}>
            {/* ADMIN HEADER */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.headerBadge}>
                        <Shield size={24} color="#2563EB" />
                    </div>
                    <div>
                        <h2 style={styles.headerTitle}>Administrator Oversight & Audit Dashboard</h2>
                        <p style={styles.headerSubtitle}>
                            User Management • Activity Logging • Equation History • Reports
                        </p>
                    </div>
                </div>

                <div style={styles.headerRight}>
                    <button onClick={() => exportFullEnterpriseReportToExcel({ users: userDirectory, activityLogs, equationAudits })} style={styles.exportBtn}>
                        <FileSpreadsheet size={16} />
                        <span>Export Master Excel Report</span>
                    </button>
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <div style={styles.tabsContainer}>
                <button
                    onClick={() => setActiveTab("USERS")}
                    style={{ ...styles.tabBtn, ...(activeTab === "USERS" ? styles.activeTabBtn : {}) }}
                >
                    <Users size={16} />
                    <span>Users ({userDirectory.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab("ACTIVITY")}
                    style={{ ...styles.tabBtn, ...(activeTab === "ACTIVITY" ? styles.activeTabBtn : {}) }}
                >
                    <Activity size={16} />
                    <span>User Activity</span>
                </button>

                <button
                    onClick={() => setActiveTab("EQUATIONS")}
                    style={{ ...styles.tabBtn, ...(activeTab === "EQUATIONS" ? styles.activeTabBtn : {}) }}
                >
                    <Calculator size={16} />
                    <span>Equation History</span>
                </button>

                <button
                    onClick={() => setActiveTab("AUDIT")}
                    style={{ ...styles.tabBtn, ...(activeTab === "AUDIT" ? styles.activeTabBtn : {}) }}
                >
                    <History size={16} />
                    <span>Audit Trail</span>
                </button>

                <button
                    onClick={() => setActiveTab("REPORTS")}
                    style={{ ...styles.tabBtn, ...(activeTab === "REPORTS" ? styles.activeTabBtn : {}) }}
                >
                    <FileText size={16} />
                    <span>Reports</span>
                </button>
            </div>

            {/* TAB CONTENT: USERS */}
            {activeTab === "USERS" && (
                <div style={styles.sectionCard}>
                    <div style={styles.tableToolbar}>
                        <div style={styles.searchGroup}>
                            <Search size={16} color="#94A3B8" />
                            <input
                                type="text"
                                placeholder="Search by name, email or username..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>

                        <div style={styles.filterGroup}>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                style={styles.selectFilter}
                            >
                                <option value="ALL">All Roles</option>
                                <option value="Administrator">Administrator</option>
                                <option value="User">User</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={styles.selectFilter}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Disabled">Disabled</option>
                            </select>

                            <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
                                <UserPlus size={16} />
                                <span>Create User</span>
                            </button>

                            <button onClick={() => exportUsersToExcel(userDirectory)} style={styles.secondaryBtn}>
                                <Download size={16} />
                                <span>Users.xlsx</span>
                            </button>
                        </div>
                    </div>

                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>User Details</th>
                                    <th style={styles.th}>Role</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Last Login</th>
                                    <th style={styles.th}>Created Date</th>
                                    <th style={styles.th}>Total Logins</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={styles.userInfo}>
                                                <span style={styles.userName}>{u.fullName || "User"}</span>
                                                <span style={styles.userEmail}>{u.email}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.roleBadge(u.role)}>{u.role}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.statusBadge(u.status)}>{u.status}</span>
                                        </td>
                                        <td style={styles.td}>
                                            {u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}
                                        </td>
                                        <td style={styles.td}>
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                                        </td>
                                        <td style={styles.td}>
                                            <b>{u.total_logins || 0}</b>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.actionRow}>
                                                <button
                                                    onClick={() => {
                                                        setSelectedUserId(u.id);
                                                        setShowResetModal(true);
                                                    }}
                                                    style={styles.iconBtn}
                                                    title="Reset Password"
                                                >
                                                    <Key size={15} color="#475569" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        try {
                                                            toggleUserStatus(u.id);
                                                            showSuccess(`Updated status for ${u.email}`);
                                                        } catch (err) {
                                                            showError(err.message);
                                                        }
                                                    }}
                                                    style={styles.iconBtn}
                                                    title={u.status === "Active" ? "Disable User" : "Enable User"}
                                                >
                                                    {u.status === "Active" ? (
                                                        <UserX size={15} color="#DC2626" />
                                                    ) : (
                                                        <UserCheck size={15} color="#16A34A" />
                                                    )}
                                                </button>

                                                {u.email !== "admin@cdiedi.com" && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`Delete user account ${u.email}?`)) {
                                                                deleteUser(u.id);
                                                                showSuccess("User account deleted.");
                                                            }
                                                        }}
                                                        style={styles.iconBtn}
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={15} color="#DC2626" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: USER ACTIVITY */}
            {activeTab === "ACTIVITY" && (
                <div style={styles.sectionCard}>
                    <div style={styles.tableToolbar}>
                        <div style={styles.searchGroup}>
                            <Search size={16} color="#94A3B8" />
                            <input
                                type="text"
                                placeholder="Search user activity..."
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>

                        <div style={styles.filterGroup}>
                            <button onClick={() => exportActivityLogsToExcel(filteredLogs)} style={styles.createBtn}>
                                <FileSpreadsheet size={16} />
                                <span>ActivityLog.xlsx</span>
                            </button>
                        </div>
                    </div>

                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Timestamp</th>
                                    <th style={styles.th}>User Email</th>
                                    <th style={styles.th}>Action</th>
                                    <th style={styles.th}>Module</th>
                                    <th style={styles.th}>Details</th>
                                    <th style={styles.th}>Browser</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} style={styles.tr}>
                                            <td style={styles.td}>
                                                {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
                                            </td>
                                            <td style={styles.td}>
                                                <b>{log.email || log.user_email || "User"}</b>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.actionBadge}>{log.activity || log.action}</span>
                                            </td>
                                            <td style={styles.td}>{log.module || "General"}</td>
                                            <td style={styles.td}>{log.details || "-"}</td>
                                            <td style={styles.td}>{log.browser || "Web Browser"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} style={styles.emptyTd}>
                                            No user activity recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: EQUATION HISTORY */}
            {activeTab === "EQUATIONS" && (
                <div style={styles.sectionCard}>
                    <div style={styles.tableToolbar}>
                        <h3 style={styles.sectionTitle}>Equation Revision & Audit History</h3>
                        <button onClick={() => exportEquationAuditsToExcel(equationAudits)} style={styles.createBtn}>
                            <FileSpreadsheet size={16} />
                            <span>EquationHistory.xlsx</span>
                        </button>
                    </div>

                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Timestamp</th>
                                    <th style={styles.th}>Modified By</th>
                                    <th style={styles.th}>Equation Parameter</th>
                                    <th style={styles.th}>Previous Expression</th>
                                    <th style={styles.th}>New Expression</th>
                                    <th style={styles.th}>Reason</th>
                                    <th style={styles.th}>Restore</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equationAudits.length > 0 ? (
                                    equationAudits.map((item) => (
                                        <tr key={item.id} style={styles.tr}>
                                            <td style={styles.td}>
                                                {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                                            </td>
                                            <td style={styles.td}>
                                                <b>{item.email || "Administrator"}</b>
                                            </td>
                                            <td style={styles.td}>{item.parameter}</td>
                                            <td style={styles.td}>
                                                <code style={styles.oldCode}>{item.old_value}</code>
                                            </td>
                                            <td style={styles.td}>
                                                <code style={styles.newCode}>{item.new_value}</code>
                                            </td>
                                            <td style={styles.td}>{item.reason}</td>
                                            <td style={styles.td}>
                                                <button
                                                    onClick={() => handleRestoreEquation(item)}
                                                    style={styles.restoreBtn}
                                                    title="Restore equation to old expression"
                                                >
                                                    <RotateCcw size={14} />
                                                    <span>Restore</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} style={styles.emptyTd}>
                                            No equation revision entries found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: AUDIT TRAIL */}
            {activeTab === "AUDIT" && (
                <div style={styles.sectionCard}>
                    <div style={styles.tableToolbar}>
                        <h3 style={styles.sectionTitle}>Full Security Audit Trail</h3>
                        <button onClick={() => exportActivityLogsToExcel(activityLogs)} style={styles.createBtn}>
                            <FileSpreadsheet size={16} />
                            <span>AuditTrail.xlsx</span>
                        </button>
                    </div>

                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Audit ID</th>
                                    <th style={styles.th}>Timestamp</th>
                                    <th style={styles.th}>User</th>
                                    <th style={styles.th}>Module</th>
                                    <th style={styles.th}>Action</th>
                                    <th style={styles.th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activityLogs.map((log) => (
                                    <tr key={log.id} style={styles.tr}>
                                        <td style={styles.td}><code>{log.id}</code></td>
                                        <td style={styles.td}>{new Date(log.created_at).toLocaleString()}</td>
                                        <td style={styles.td}><b>{log.email || "System"}</b></td>
                                        <td style={styles.td}>{log.module}</td>
                                        <td style={styles.td}>{log.activity}</td>
                                        <td style={styles.td}>
                                            <span style={styles.statusBadge("Active")}>Success</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: REPORTS & EXPORTS */}
            {activeTab === "REPORTS" && (
                <div style={styles.sectionCard}>
                    <h3 style={styles.sectionTitle}>Individual Excel Spreadsheets (.xlsx)</h3>
                    <p style={styles.sectionDesc}>
                        Download structured individual Excel spreadsheets for platform administration and audits.
                    </p>

                    <div style={styles.reportsGrid}>
                        <div style={styles.reportBox}>
                            <h4 style={styles.reportTitle}>📊 Users.xlsx</h4>
                            <p style={styles.reportDesc}>Complete list of registered platform users, roles, and login statistics.</p>
                            <button onClick={() => exportUsersToExcel(userDirectory)} style={styles.downloadReportBtn}>
                                <Download size={15} /> Download Users.xlsx
                            </button>
                        </div>

                        <div style={styles.reportBox}>
                            <h4 style={styles.reportTitle}>📜 ActivityLog.xlsx</h4>
                            <p style={styles.reportDesc}>Audit log of user operations, design generations, and system events.</p>
                            <button onClick={() => exportActivityLogsToExcel(activityLogs)} style={styles.downloadReportBtn}>
                                <Download size={15} /> Download ActivityLog.xlsx
                            </button>
                        </div>

                        <div style={styles.reportBox}>
                            <h4 style={styles.reportTitle}>🧮 EquationHistory.xlsx</h4>
                            <p style={styles.reportDesc}>Full audit history of equation formula edits and expression revisions.</p>
                            <button onClick={() => exportEquationAuditsToExcel(equationAudits)} style={styles.downloadReportBtn}>
                                <Download size={15} /> Download EquationHistory.xlsx
                            </button>
                        </div>

                        <div style={styles.reportBox}>
                            <h4 style={styles.reportTitle}>📁 AuditTrail.xlsx</h4>
                            <p style={styles.reportDesc}>System security audit log of logins, administrative checks, and authorization.</p>
                            <button onClick={() => exportActivityLogsToExcel(activityLogs)} style={styles.downloadReportBtn}>
                                <Download size={15} /> Download AuditTrail.xlsx
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE USER MODAL */}
            {showCreateModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <h3 style={styles.modalHeaderTitle}>Create New User</h3>
                        <form onSubmit={handleCreateUserSubmit} style={styles.modalForm}>
                            <div>
                                <label style={styles.modalLabel}>Full Name</label>
                                <input
                                    type="text"
                                    value={newFullName}
                                    onChange={(e) => setNewFullName(e.target.value)}
                                    placeholder="Dr. Jane Doe"
                                    style={styles.modalInput}
                                    required
                                />
                            </div>

                            <div>
                                <label style={styles.modalLabel}>Email Address</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="jane.doe@organization.com"
                                    style={styles.modalInput}
                                    required
                                />
                            </div>

                            <div>
                                <label style={styles.modalLabel}>Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={styles.modalInput}
                                    required
                                />
                            </div>

                            <div>
                                <label style={styles.modalLabel}>Assigned Role</label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    style={styles.modalInput}
                                >
                                    <option value="User">User</option>
                                    <option value="Administrator">Administrator</option>
                                </select>
                            </div>

                            <div style={styles.modalFooter}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>
                                    Cancel
                                </button>
                                <button type="submit" style={styles.submitModalBtn}>
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL */}
            {showResetModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <h3 style={styles.modalHeaderTitle}>Reset Password</h3>
                        <form onSubmit={handleResetPasswordSubmit} style={styles.modalForm}>
                            <div>
                                <label style={styles.modalLabel}>New Password</label>
                                <input
                                    type="password"
                                    value={resetPassInput}
                                    onChange={(e) => setResetPassInput(e.target.value)}
                                    placeholder="Enter new password"
                                    style={styles.modalInput}
                                    required
                                />
                            </div>

                            <div style={styles.modalFooter}>
                                <button type="button" onClick={() => setShowResetModal(false)} style={styles.cancelBtn}>
                                    Cancel
                                </button>
                                <button type="submit" style={styles.submitModalBtn}>
                                    Save New Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        width: "100%",
        height: "100%",
        backgroundColor: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        padding: "24px",
        boxSizing: "border-box",
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "14px"
    },
    headerBadge: {
        width: "48px",
        height: "48px",
        borderRadius: "12px",
        backgroundColor: "#EFF6FF",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    headerTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#0F172A",
        margin: 0
    },
    headerSubtitle: {
        fontSize: "13px",
        color: "#64748B",
        margin: 0
    },
    headerRight: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },
    exportBtn: {
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        border: "none",
        padding: "10px 16px",
        borderRadius: "8px",
        fontWeight: "600",
        fontSize: "13px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    tabsContainer: {
        display: "flex",
        gap: "8px",
        borderBottom: "1px solid #E2E8F0",
        marginBottom: "20px"
    },
    tabBtn: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 16px",
        fontSize: "13.5px",
        fontWeight: "600",
        color: "#64748B",
        backgroundColor: "transparent",
        border: "none",
        borderBottom: "2px solid transparent",
        cursor: "pointer"
    },
    activeTabBtn: {
        color: "#2563EB",
        borderBottomColor: "#2563EB"
    },
    sectionCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #E2E8F0",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
    },
    sectionTitle: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#0F172A",
        margin: "0 0 4px 0"
    },
    sectionDesc: {
        fontSize: "13px",
        color: "#64748B",
        margin: "0 0 16px 0"
    },
    tableToolbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        flexWrap: "wrap",
        gap: "12px"
    },
    searchGroup: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#F8FAFC",
        border: "1px solid #CBD5E1",
        borderRadius: "8px",
        padding: "0 12px",
        width: "300px",
        height: "38px"
    },
    searchInput: {
        border: "none",
        background: "transparent",
        outline: "none",
        fontSize: "13px",
        width: "100%",
        color: "#0F172A"
    },
    filterGroup: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    selectFilter: {
        height: "38px",
        padding: "0 12px",
        fontSize: "13px",
        borderRadius: "8px",
        border: "1px solid #CBD5E1",
        backgroundColor: "#FFFFFF",
        color: "#0F172A",
        outline: "none"
    },
    createBtn: {
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        border: "none",
        padding: "0 14px",
        height: "38px",
        borderRadius: "8px",
        fontWeight: "600",
        fontSize: "13px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    secondaryBtn: {
        backgroundColor: "#F1F5F9",
        color: "#334155",
        border: "1px solid #CBD5E1",
        padding: "0 14px",
        height: "38px",
        borderRadius: "8px",
        fontWeight: "600",
        fontSize: "13px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    },
    tableWrapper: {
        overflowX: "auto"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px",
        textAlign: "left"
    },
    th: {
        padding: "12px 14px",
        borderBottom: "2px solid #E2E8F0",
        fontWeight: "600",
        color: "#475569",
        backgroundColor: "#F8FAFC"
    },
    tr: {
        borderBottom: "1px solid #E2E8F0"
    },
    td: {
        padding: "12px 14px",
        color: "#334155",
        verticalAlign: "middle"
    },
    emptyTd: {
        padding: "24px",
        textAlign: "center",
        color: "#94A3B8",
        fontSize: "14px"
    },
    userInfo: {
        display: "flex",
        flexDirection: "column"
    },
    userName: {
        fontWeight: "600",
        color: "#0F172A"
    },
    userEmail: {
        fontSize: "12px",
        color: "#64748B"
    },
    roleBadge: (role) => ({
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "11.5px",
        fontWeight: "600",
        backgroundColor: role === "Administrator" ? "#EFF6FF" : "#ECFDF5",
        color: role === "Administrator" ? "#1D4ED8" : "#047857"
    }),
    statusBadge: (status) => ({
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "11.5px",
        fontWeight: "600",
        backgroundColor: status === "Active" ? "#DCFCE7" : "#FEE2E2",
        color: status === "Active" ? "#15803D" : "#B91C1C"
    }),
    actionRow: {
        display: "flex",
        gap: "6px"
    },
    iconBtn: {
        width: "30px",
        height: "30px",
        borderRadius: "6px",
        border: "1px solid #E2E8F0",
        backgroundColor: "#FFFFFF",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer"
    },
    actionBadge: {
        padding: "3px 8px",
        borderRadius: "4px",
        backgroundColor: "#F1F5F9",
        color: "#334155",
        fontWeight: "600",
        fontSize: "12px"
    },
    oldCode: {
        backgroundColor: "#FEF2F2",
        color: "#991B1B",
        padding: "2px 6px",
        borderRadius: "4px"
    },
    newCode: {
        backgroundColor: "#F0FDF4",
        color: "#166534",
        padding: "2px 6px",
        borderRadius: "4px"
    },
    restoreBtn: {
        backgroundColor: "#EFF6FF",
        color: "#2563EB",
        border: "1px solid #BFDBFE",
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px"
    },
    reportsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
        marginTop: "16px"
    },
    reportBox: {
        border: "1px solid #E2E8F0",
        borderRadius: "10px",
        padding: "16px",
        backgroundColor: "#F8FAFC"
    },
    reportTitle: {
        fontSize: "14px",
        fontWeight: "700",
        color: "#0F172A",
        margin: "0 0 6px 0"
    },
    reportDesc: {
        fontSize: "12.5px",
        color: "#64748B",
        margin: "0 0 14px 0",
        lineHeight: "1.4"
    },
    downloadReportBtn: {
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        border: "none",
        padding: "8px 14px",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "600",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px"
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
    },
    modalCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: "14px",
        padding: "24px",
        width: "90%",
        maxWidth: "440px"
    },
    modalHeaderTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#0F172A",
        margin: "0 0 16px 0"
    },
    modalForm: {
        display: "flex",
        flexDirection: "column",
        gap: "14px"
    },
    modalLabel: {
        fontSize: "12.5px",
        fontWeight: "600",
        color: "#334155",
        display: "block",
        marginBottom: "4px"
    },
    modalInput: {
        width: "100%",
        height: "38px",
        padding: "0 12px",
        fontSize: "13px",
        borderRadius: "6px",
        border: "1px solid #CBD5E1",
        outline: "none",
        boxSizing: "border-box"
    },
    modalFooter: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "10px"
    },
    cancelBtn: {
        padding: "8px 14px",
        borderRadius: "6px",
        border: "1px solid #CBD5E1",
        background: "#FFFFFF",
        color: "#475569",
        fontSize: "13px",
        cursor: "pointer"
    },
    submitModalBtn: {
        padding: "8px 14px",
        borderRadius: "6px",
        border: "none",
        background: "#2563EB",
        color: "#FFFFFF",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer"
    }
};
