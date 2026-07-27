import supabase from "./supabaseClient";

const ACTIVITY_LOGS_KEY = "cdi_edi_activity_logs";
const EQUATION_AUDIT_KEY = "cdi_edi_equation_audit";
const LOGIN_HISTORY_KEY = "cdi_edi_login_history";
const OPTIMIZATION_HISTORY_KEY = "cdi_edi_opt_history";

const isValidUUID = (id) => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

class AuditLogger {
    parseUserAgent() {
        const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
        let os = "Unknown OS";
        let browser = "Unknown Browser";

        if (ua.includes("Windows")) os = "Windows";
        else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
        else if (ua.includes("Linux")) os = "Linux";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

        if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge";
        else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Safari")) browser = "Safari";

        return { browser, os };
    }

    /**
     * Check if an active Supabase JWT session exists before attempting remote database inserts
     */
    async _hasSupabaseSession() {
        if (!supabase) return false;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            return Boolean(session && session.access_token);
        } catch (e) {
            return false;
        }
    }

    /**
     * Local storage helper to prepend log entries
     */
    _saveLocal(key, entry) {
        try {
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            const updated = [entry, ...existing].slice(0, 500); // keep top 500
            localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {
            console.warn("[AUDIT] Local storage write error:", e);
        }
    }

    _getLocal(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || "[]");
        } catch (e) {
            return [];
        }
    }

    async logLogin(userId, email, success = true, role = "User") {
        const { browser, os } = this.parseUserAgent();
        const status = success ? "LOGIN" : "FAILED LOGIN";
        const entry = {
            id: "lh_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            user_id: userId || "anon",
            email: email || "Anonymous",
            role,
            ip_address: "127.0.0.1",
            browser: `${browser} (${os})`,
            operating_system: os,
            status,
            login_time: new Date().toISOString()
        };

        this._saveLocal(LOGIN_HISTORY_KEY, entry);

        if (isValidUUID(userId) && (await this._hasSupabaseSession())) {
            try {
                await supabase.from("login_history").insert([{
                    user_id: userId,
                    email: email || "Anonymous",
                    ip_address: "127.0.0.1",
                    browser: `${browser} (${os})`,
                    operating_system: os,
                    status
                }]);
            } catch (e) {
                // Silently fall back to local storage
            }
        }

        await this.logActivity(userId, email, success ? "User Login" : "Failed Login", "Auth", success ? `User signed in as ${role}` : "Failed sign in attempt", role);
    }

    async logLogout(userId, email, role = "User") {
        const entry = {
            id: "lh_" + Date.now(),
            user_id: userId || "anon",
            email: email || "Anonymous",
            role,
            status: "LOGOUT",
            logout_time: new Date().toISOString()
        };
        this._saveLocal(LOGIN_HISTORY_KEY, entry);

        if (isValidUUID(userId) && (await this._hasSupabaseSession())) {
            try {
                await supabase.from("login_history").insert([{
                    user_id: userId,
                    email: email || "Anonymous",
                    status: "LOGOUT"
                }]);
            } catch (e) {
                // Silently fall back to local storage
            }
        }

        await this.logActivity(userId, email, "Logout", "Auth", "User signed out", role);
    }

    async logActivity(userId, email, activity, moduleName, details, role = "User") {
        const { browser, os } = this.parseUserAgent();
        const entry = {
            id: "act_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            user_id: userId || "anon",
            email: email || "Anonymous",
            role,
            activity: activity || "Action",
            module: moduleName || "General",
            details: details || "-",
            ip_address: "127.0.0.1",
            browser: `${browser} on ${os}`,
            created_at: new Date().toISOString()
        };

        this._saveLocal(ACTIVITY_LOGS_KEY, entry);

        if (await this._hasSupabaseSession()) {
            try {
                const payload = {
                    email: email || "Anonymous",
                    activity: activity || "Action",
                    module: moduleName || "General",
                    details: details || "-"
                };
                if (isValidUUID(userId)) {
                    payload.user_id = userId;
                }
                await supabase.from("user_activity").insert([payload]);
            } catch (e) {
                // Silently fall back to local storage
            }
        }
    }

    async logEquationModification({ userId, email, equationId, parameter, oldValue, newValue, reason }) {
        const entry = {
            id: "eq_audit_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            user_id: userId || "admin",
            email: email || "admin@cdiedi.com",
            equation_id: equationId,
            parameter: parameter || "Equation Expression",
            old_value: String(oldValue ?? "-"),
            new_value: String(newValue ?? "-"),
            reason: reason || "Manual modification by admin",
            status: "APPLIED",
            created_at: new Date().toISOString()
        };

        this._saveLocal(EQUATION_AUDIT_KEY, entry);

        if (await this._hasSupabaseSession()) {
            try {
                const payload = {
                    email: email || "Anonymous",
                    parameter: parameter || "Parameter",
                    old_value: String(oldValue ?? "-"),
                    new_value: String(newValue ?? "-"),
                    reason: reason || "Manual modification"
                };
                if (isValidUUID(userId)) {
                    payload.user_id = userId;
                }
                await supabase.from("engineering_modifications").insert([payload]);
            } catch (e) {
                // Silently fall back to local storage
            }
        }

        await this.logActivity(userId, email, "Equation Edited", "Equation Editor", `Modified '${parameter}': ${oldValue} -> ${newValue}`);
    }

    async logOptimization({ userId, email, technology, mode, inputs, result }) {
        const entry = {
            id: "opt_" + Date.now(),
            user_id: userId || "anon",
            email: email || "Anonymous",
            technology,
            mode,
            inputs,
            resultSummary: result?.kpi || {},
            created_at: new Date().toISOString()
        };
        this._saveLocal(OPTIMIZATION_HISTORY_KEY, entry);
        await this.logActivity(userId, email, "Optimize", "Optimization Engine", `Ran optimization mode '${mode}' for ${technology}`);
    }

    // Getters for Admin Dashboard
    getActivityLogs() {
        return this._getLocal(ACTIVITY_LOGS_KEY);
    }

    getEquationAudits() {
        return this._getLocal(EQUATION_AUDIT_KEY);
    }

    getLoginHistory() {
        return this._getLocal(LOGIN_HISTORY_KEY);
    }

    getOptimizationHistory() {
        return this._getLocal(OPTIMIZATION_HISTORY_KEY);
    }
}

export const auditLogger = new AuditLogger();
export default auditLogger;
