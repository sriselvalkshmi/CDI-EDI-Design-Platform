import supabase from "./supabaseClient";

class AuditLogger {
    parseUserAgent() {
        const ua = navigator.userAgent || "";
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

    async logLogin(userId, email, success = true) {
        if (!supabase || !userId) return;
        const { browser, os } = this.parseUserAgent();
        const status = success ? "LOGIN" : "FAILED LOGIN";

        try {
            await supabase.from("login_history").insert([{
                user_id: userId,
                email: email || "Anonymous",
                ip_address: "127.0.0.1",
                browser,
                operating_system: os,
                status
            }]);
        } catch (e) {
            console.warn("[AUDIT] Login log error:", e.message);
        }

        await this.logActivity(userId, email, success ? "Login" : "Failed Login", "Auth", success ? "User signed in" : "Failed sign in attempt");
    }

    async logLogout(userId, email) {
        if (!supabase || !userId) return;
        try {
            const { data } = await supabase
                .from("login_history")
                .select("id, login_time")
                .eq("email", email)
                .eq("status", "LOGIN")
                .is("logout_time", null)
                .order("login_time", { ascending: false })
                .limit(1);

            if (data && data.length > 0) {
                const loginTime = new Date(data[0].login_time);
                const logoutTime = new Date();
                const diffSecs = Math.round((logoutTime - loginTime) / 1000);
                const sessionDuration = diffSecs < 60 ? `${diffSecs} seconds` : `${Math.floor(diffSecs / 60)} min ${diffSecs % 60} sec`;

                await supabase
                    .from("login_history")
                    .update({
                        logout_time: logoutTime.toISOString(),
                        status: "LOGOUT",
                        session_duration: sessionDuration
                    })
                    .eq("id", data[0].id);
            }
        } catch (e) {
            console.warn("[AUDIT] Logout log error:", e.message);
        }

        await this.logActivity(userId, email, "Logout", "Auth", "User signed out");
    }

    async logActivity(userId, email, activity, moduleName, details) {
        if (!supabase || !userId) return;
        try {
            await supabase.from("user_activity").insert([{
                user_id: userId,
                email: email || "Anonymous",
                activity: activity || "Action",
                module: moduleName || "General",
                details: details || "-"
            }]);
        } catch (e) {
            console.warn("[AUDIT] Activity log error:", e.message);
        }
    }

    async logModification(userId, email, parameter, oldValue, newValue, reason) {
        if (!supabase || !userId) return;
        try {
            await supabase.from("engineering_modifications").insert([{
                user_id: userId,
                email: email || "Anonymous",
                parameter: parameter || "Parameter",
                old_value: String(oldValue ?? "-"),
                new_value: String(newValue ?? "-"),
                reason: reason || "Manual modification"
            }]);
        } catch (e) {
            console.warn("[AUDIT] Modification log error:", e.message);
        }
    }
}

export const auditLogger = new AuditLogger();
export default auditLogger;
