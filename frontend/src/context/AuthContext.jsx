import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import auditLogger from "../services/auditLogger";

const AuthContext = createContext();

const SESSION_KEY = "cdi_edi_auth_session";
const USER_DIRECTORY_KEY = "cdi_edi_user_directory";
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minutes Session Timeout

// Default Directory: Only the Administrator Account (No Demo/Fake Data)
const INITIAL_USERS = [
    {
        id: "u_admin",
        fullName: "Administrator",
        email: "admin@cdiedi.com",
        username: "admin",
        password: "Admin@123456",
        role: "Administrator",
        status: "Active",
        created_at: new Date("2026-01-01").toISOString(),
        last_login: new Date().toISOString(),
        total_logins: 1,
        last_activity: "System Oversight"
    }
];

export function AuthProvider({ children }) {
    const [userDirectory, setUserDirectory] = useState(() => {
        try {
            const saved = localStorage.getItem(USER_DIRECTORY_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Purge any legacy fake/demo accounts (Sarah Jenkins, Marcus Chen, etc.)
                const filtered = parsed.filter((u) => {
                    const e = (u.email || "").toLowerCase();
                    const n = (u.fullName || "").toLowerCase();
                    return !(
                        e.includes("jenkins") ||
                        e.includes("chen") ||
                        e.includes("smith") ||
                        e.includes("superadmin") ||
                        e.includes("researcher") ||
                        e.includes("viewer") ||
                        n.includes("sarah") ||
                        n.includes("marcus") ||
                        n.includes("auditor")
                    );
                });

                // Ensure admin@cdiedi.com is strictly configured as Administrator
                const sanitized = filtered.map((u) => {
                    if (u.email.toLowerCase() === "admin@cdiedi.com") {
                        return { ...u, fullName: "Administrator", role: "Administrator", password: "Admin@123456" };
                    }
                    return { ...u, role: u.role === "Administrator" ? "Administrator" : "User" };
                });

                if (!sanitized.some((u) => u.email.toLowerCase() === "admin@cdiedi.com")) {
                    return [...INITIAL_USERS, ...sanitized];
                }
                return sanitized;
            }
            return INITIAL_USERS;
        } catch (e) {
            return INITIAL_USERS;
        }
    });

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentRole, setCurrentRole] = useState("User");
    const [loginError, setLoginError] = useState("");
    const [loading, setLoading] = useState(true);
    const [rememberMe, setRememberMe] = useState(false);

    const timerRef = useRef(null);

    // Save directory changes
    useEffect(() => {
        try {
            localStorage.setItem(USER_DIRECTORY_KEY, JSON.stringify(userDirectory));
        } catch (e) {
            console.error("User directory save error:", e);
        }
    }, [userDirectory]);

    // Restore session on mount
    useEffect(() => {
        try {
            const storedSession = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
            if (storedSession) {
                const parsed = JSON.parse(storedSession);
                if (parsed && parsed.authenticated && parsed.user) {
                    const sanitizedUser = {
                        ...parsed.user,
                        fullName: parsed.user.email === "admin@cdiedi.com" ? "Administrator" : (parsed.user.fullName || "User"),
                        role: (parsed.user.role === "Administrator" || parsed.user.email.toLowerCase() === "admin@cdiedi.com") ? "Administrator" : "User"
                    };
                    setIsAuthenticated(true);
                    setCurrentUser(sanitizedUser);
                    setCurrentRole(sanitizedUser.role);
                }
            }
        } catch (e) {
            console.error("Session restore error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        if (currentUser) {
            await auditLogger.logLogout(currentUser.id, currentUser.email, currentUser.role);
        }
        try {
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
        } catch (e) {
            console.error("Logout clear error:", e);
        }
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCurrentRole("User");
        setLoginError("");
    }, [currentUser]);

    const resetInactivityTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (isAuthenticated) {
            timerRef.current = setTimeout(() => {
                console.warn("[AUTH] Session timed out after 30 minutes of inactivity.");
                logout();
            }, INACTIVITY_TIMEOUT_MS);
        }
    }, [isAuthenticated, logout]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const events = ["mousemove", "keydown", "click", "scroll"];
        const handler = () => resetInactivityTimer();

        events.forEach((evt) => window.addEventListener(evt, handler));
        resetInactivityTimer();

        return () => {
            events.forEach((evt) => window.removeEventListener(evt, handler));
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isAuthenticated, resetInactivityTimer]);

    /**
     * User Login logic with Email / Username & Password matching
     */
    const login = async (inputIdentifier, inputPassword, isRemember = false) => {
        setLoginError("");
        const idStr = (inputIdentifier || "").trim().toLowerCase();
        const passStr = inputPassword || "";

        const envUser = (import.meta.env.VITE_APP_USERNAME || "admin@cdiedi.com").trim().toLowerCase();
        const envPass = import.meta.env.VITE_APP_PASSWORD || "Admin@123456";

        let matchedUser = userDirectory.find(
            (u) =>
                (u.email.toLowerCase() === idStr || (u.username && u.username.toLowerCase() === idStr)) &&
                u.password === passStr
        );

        if (!matchedUser && (idStr === envUser || idStr === "admin@cdiedi.com") && passStr === envPass) {
            matchedUser = userDirectory[0]; // Administrator
        }

        if (matchedUser) {
            if (matchedUser.status === "Disabled") {
                const msg = "Account is disabled. Please contact Administrator.";
                setLoginError(msg);
                await auditLogger.logLogin(matchedUser.id, matchedUser.email, false, matchedUser.role);
                return { success: false, error: msg };
            }

            const updatedUser = {
                ...matchedUser,
                fullName: matchedUser.email.toLowerCase() === "admin@cdiedi.com" ? "Administrator" : (matchedUser.fullName || "User"),
                role: (matchedUser.role === "Administrator" || matchedUser.email.toLowerCase() === "admin@cdiedi.com") ? "Administrator" : "User",
                last_login: new Date().toISOString(),
                total_logins: (matchedUser.total_logins || 0) + 1,
                last_activity: "Logged In"
            };

            setUserDirectory((prev) => prev.map((u) => (u.id === matchedUser.id ? updatedUser : u)));

            const sessionData = {
                authenticated: true,
                user: updatedUser,
                loginTime: new Date().toISOString()
            };

            try {
                if (isRemember) {
                    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
                } else {
                    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
                }
            } catch (e) {
                console.error("Storage error:", e);
            }

            setIsAuthenticated(true);
            setCurrentUser(updatedUser);
            setCurrentRole(updatedUser.role);
            setRememberMe(isRemember);
            setLoginError("");

            await auditLogger.logLogin(updatedUser.id, updatedUser.email, true, updatedUser.role);
            return { success: true, user: updatedUser };
        } else {
            const errMsg = "Invalid email/username or password. Please try again.";
            setLoginError(errMsg);
            await auditLogger.logLogin(null, idStr, false, "Unknown");
            return { success: false, error: errMsg };
        }
    };

    /**
     * Public Registration logic (Defaults strictly to Role = User)
     */
    const registerUser = async ({ fullName, email, username, password }) => {
        const cleanEmail = (email || "").trim();
        const cleanUser = (username || "").trim();

        if (userDirectory.some((u) => u.email.toLowerCase() === cleanEmail.toLowerCase())) {
            throw new Error("A user with this email address already exists.");
        }
        if (userDirectory.some((u) => u.username && u.username.toLowerCase() === cleanUser.toLowerCase())) {
            throw new Error("This username is already taken. Please choose another.");
        }

        const newUser = {
            id: "u_" + Date.now(),
            fullName: fullName || "User",
            email: cleanEmail,
            username: cleanUser,
            password,
            role: "User", // Strictly assigned User role on public sign up
            status: "Active",
            created_at: new Date().toISOString(),
            last_login: null,
            total_logins: 0,
            last_activity: "Registered Account"
        };

        setUserDirectory((prev) => [newUser, ...prev]);
        await auditLogger.logActivity(newUser.id, newUser.email, "User Registration", "Auth", "New user account registered", "User");
        return newUser;
    };

    const createUser = async ({ fullName, email, password, role }) => {
        return registerUser({ fullName, email, username: email.split("@")[0], password, role: role || "User" });
    };

    const updateUser = async (id, updates) => {
        const target = userDirectory.find((u) => u.id === id);
        if (!target) throw new Error("User not found.");

        setUserDirectory((prev) =>
            prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
        );

        if (currentUser) {
            await auditLogger.logActivity(currentUser.id, currentUser.email, "User Updated", "User Management", `Updated account details for ${target.email}`, currentUser.role);
        }
    };

    const toggleUserStatus = async (id) => {
        const target = userDirectory.find((u) => u.id === id);
        if (!target) return;

        if (target.email.toLowerCase() === "admin@cdiedi.com") {
            throw new Error("Administrator account cannot be disabled.");
        }

        const newStatus = target.status === "Active" ? "Disabled" : "Active";
        setUserDirectory((prev) =>
            prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
        );

        if (currentUser) {
            await auditLogger.logActivity(currentUser.id, currentUser.email, newStatus === "Disabled" ? "User Disabled" : "User Enabled", "User Management", `Changed ${target.email} status to ${newStatus}`, currentUser.role);
        }
    };

    const deleteUser = async (id) => {
        const target = userDirectory.find((u) => u.id === id);
        if (!target) return;

        if (target.email.toLowerCase() === "admin@cdiedi.com") {
            throw new Error("Administrator account cannot be deleted.");
        }

        setUserDirectory((prev) => prev.filter((u) => u.id !== id));
        if (currentUser) {
            await auditLogger.logActivity(currentUser.id, currentUser.email, "User Deleted", "User Management", `Deleted user account ${target.email}`, currentUser.role);
        }
    };

    const resetUserPassword = async (id, newPassword) => {
        const target = userDirectory.find((u) => u.id === id);
        if (!target) throw new Error("User not found.");

        setUserDirectory((prev) =>
            prev.map((u) => (u.id === id ? { ...u, password: newPassword } : u))
        );

        if (currentUser) {
            await auditLogger.logActivity(currentUser.id, currentUser.email, "Password Changed", "User Management", `Reset password for user ${target.email}`, currentUser.role);
        }
    };

    /**
     * Strictly verifies Administrator credentials (admin@cdiedi.com / Admin@123456)
     */
    const verifyAdminCredentials = (adminEmail, adminPassword) => {
        if (!adminEmail || !adminPassword) return false;
        const mailStr = String(adminEmail).trim().toLowerCase();
        const passStr = String(adminPassword);

        const envUser = (import.meta.env.VITE_APP_USERNAME || "admin@cdiedi.com").trim().toLowerCase();
        const envPass = import.meta.env.VITE_APP_PASSWORD || "Admin@123456";

        if ((mailStr === envUser || mailStr === "admin@cdiedi.com") && passStr === envPass) {
            return true;
        }

        const adminAccount = userDirectory.find((u) => u.email.toLowerCase() === "admin@cdiedi.com" || u.role === "Administrator");
        if (adminAccount && adminAccount.email.toLowerCase() === mailStr && adminAccount.password === passStr) {
            return true;
        }

        return false;
    };

    const canManageUsers = currentRole === "Administrator" || (currentUser && currentUser.email.toLowerCase() === "admin@cdiedi.com");
    const canEditEquations = true;
    const canRunOptimization = true;
    const isAdmin = currentRole === "Administrator" || (currentUser && currentUser.email.toLowerCase() === "admin@cdiedi.com");

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                currentUser,
                currentRole,
                loginError,
                setLoginError,
                loading,
                rememberMe,
                userDirectory,
                login,
                registerUser,
                logout,
                createUser,
                updateUser,
                toggleUserStatus,
                deleteUser,
                resetUserPassword,
                verifyAdminCredentials,
                canManageUsers,
                canEditEquations,
                canRunOptimization,
                isAdmin
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default AuthContext;
