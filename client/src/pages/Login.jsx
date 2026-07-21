import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { isSupabaseConfigured } from "../services/supabaseClient";

export default function Login() {
    const { login, register, requestPasswordReset, setPage } = useApp();

    const [activeTab, setActiveTab] = useState("SIGN_IN"); // "SIGN_IN" | "SIGN_UP" | "FORGOT_PASSWORD"

    // Sign In State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    // Sign Up State
    const [signUpFullName, setSignUpFullName] = useState("");
    const [signUpEmail, setSignUpEmail] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
    const [signUpError, setSignUpError] = useState("");
    const [signUpSuccess, setSignUpSuccess] = useState("");
    const [signUpLoading, setSignUpLoading] = useState(false);

    // Forgot Password State
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoginLoading(true);
        try {
            const success = await login(loginEmail.trim(), loginPassword);
            if (!success) {
                setLoginError("Invalid email or password.");
            }
        } catch (err) {
            if (err.message && err.message.includes("Email not confirmed")) {
                setLoginError("Email address not verified. Please check your inbox for verification email.");
            } else {
                setLoginError(err.message || "Authentication failed. Check your email and password.");
            }
        } finally {
            setLoginLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setSignUpError("");
        setSignUpSuccess("");

        if (!signUpFullName.trim()) {
            setSignUpError("Full Name is required.");
            return;
        }

        if (!signUpEmail.trim()) {
            setSignUpError("Email address is required.");
            return;
        }

        if (signUpPassword !== signUpConfirmPassword) {
            setSignUpError("Passwords do not match.");
            return;
        }

        if (signUpPassword.length < 6) {
            setSignUpError("Password must be at least 6 characters long.");
            return;
        }

        setSignUpLoading(true);
        try {
            const res = await register({
                fullName: signUpFullName.trim(),
                email: signUpEmail.trim(),
                password: signUpPassword
            });

            if (res.success) {
                setSignUpSuccess("Account created successfully! Please check your email for verification link if required, then sign in.");
                setSignUpFullName("");
                setSignUpEmail("");
                setSignUpPassword("");
                setSignUpConfirmPassword("");
                setTimeout(() => {
                    setActiveTab("SIGN_IN");
                    setLoginEmail(signUpEmail);
                }, 2000);
            }
        } catch (err) {
            setSignUpError(err.message || "Registration failed. Try a different email.");
        } finally {
            setSignUpLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotMessage("");
        setForgotLoading(true);
        try {
            const res = await requestPasswordReset(forgotEmail.trim());
            if (res.success) {
                setForgotMessage(res.message || "Password reset email sent!");
            } else {
                setForgotMessage(res.error || "Failed to send password reset email.");
            }
        } catch (err) {
            setForgotMessage(err.message || "An error occurred.");
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.loginCard}>
                <button
                    onClick={() => setPage("DASHBOARD")}
                    style={styles.backBtn}
                >
                    ← Back to Platform
                </button>

                {/* Platform Logo Design */}
                <div style={styles.logoContainer}>
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="60" height="60" rx="14" fill="#2563eb" />
                        <line x1="15" y1="20" x2="45" y2="20" stroke="white" strokeWidth="4" strokeLinecap="round" />
                        <line x1="15" y1="30" x2="45" y2="30" stroke="#93c5fd" strokeWidth="4" strokeLinecap="round" />
                        <line x1="15" y1="40" x2="45" y2="40" stroke="white" strokeWidth="4" strokeLinecap="round" />
                        <path d="M22 15V45" stroke="#dbeafe" strokeWidth="2" strokeDasharray="3 3" />
                        <path d="M38 15V45" stroke="#dbeafe" strokeWidth="2" strokeDasharray="3 3" />
                    </svg>
                </div>

                <h1 style={styles.title}>CDI / EDI Design Platform</h1>
                <p style={styles.subtitle}>Supabase Enterprise Security Authentication</p>

                {!isSupabaseConfigured && (
                    <div style={{
                        backgroundColor: "#fffbeb",
                        border: "1px solid #fcd34d",
                        color: "#92400e",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        marginBottom: "16px",
                        textAlign: "left",
                        width: "100%",
                        boxSizing: "border-box"
                    }}>
                        <strong>⚠️ Supabase Not Configured</strong>
                        <div style={{ marginTop: "4px", fontSize: "11px", color: "#b45309" }}>
                            Please set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>client/.env</code> file or Netlify project settings.
                        </div>
                    </div>
                )}

                {/* Tab Switcher: Sign In | Sign Up | Forgot Password */}
                <div style={styles.tabBar}>
                    <button
                        onClick={() => setActiveTab("SIGN_IN")}
                        style={{
                            ...styles.tabButton,
                            ...(activeTab === "SIGN_IN" ? styles.tabButtonActive : {})
                        }}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setActiveTab("SIGN_UP")}
                        style={{
                            ...styles.tabButton,
                            ...(activeTab === "SIGN_UP" ? styles.tabButtonActive : {})
                        }}
                    >
                        Sign Up
                    </button>
                    <button
                        onClick={() => setActiveTab("FORGOT_PASSWORD")}
                        style={{
                            ...styles.tabButton,
                            ...(activeTab === "FORGOT_PASSWORD" ? styles.tabButtonActive : {})
                        }}
                    >
                        Forgot Password
                    </button>
                </div>

                {/* TAB 1: SIGN IN */}
                {activeTab === "SIGN_IN" && (
                    <form onSubmit={handleSignIn} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address *</label>
                            <input
                                type="email"
                                required
                                placeholder="e.g. user@domain.com"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password *</label>
                            <input
                                type="password"
                                required
                                placeholder="Enter password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        {loginError && <div style={styles.errorMessage}>{loginError}</div>}

                        <button
                            type="submit"
                            disabled={loginLoading}
                            style={{
                                ...styles.submitButton,
                                ...(loginLoading ? styles.submitButtonDisabled : {})
                            }}
                        >
                            {loginLoading ? "Authenticating..." : "Sign In to Platform"}
                        </button>
                    </form>
                )}

                {/* TAB 2: SIGN UP */}
                {activeTab === "SIGN_UP" && (
                    <form onSubmit={handleSignUp} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Full Name *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Jane Doe"
                                value={signUpFullName}
                                onChange={(e) => setSignUpFullName(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address *</label>
                            <input
                                type="email"
                                required
                                placeholder="e.g. jane.doe@company.com"
                                value={signUpEmail}
                                onChange={(e) => setSignUpEmail(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password *</label>
                            <input
                                type="password"
                                required
                                placeholder="Create password (min 6 chars)"
                                value={signUpPassword}
                                onChange={(e) => setSignUpPassword(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Confirm Password *</label>
                            <input
                                type="password"
                                required
                                placeholder="Confirm password"
                                value={signUpConfirmPassword}
                                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        {signUpError && <div style={styles.errorMessage}>{signUpError}</div>}
                        {signUpSuccess && <div style={styles.successMessage}>{signUpSuccess}</div>}

                        <button
                            type="submit"
                            disabled={signUpLoading}
                            style={{
                                ...styles.submitButton,
                                ...(signUpLoading ? styles.submitButtonDisabled : {})
                            }}
                        >
                            {signUpLoading ? "Registering..." : "Create New Account"}
                        </button>
                    </form>
                )}

                {/* TAB 3: FORGOT PASSWORD */}
                {activeTab === "FORGOT_PASSWORD" && (
                    <form onSubmit={handleForgotPassword} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Registered Email Address *</label>
                            <input
                                type="email"
                                required
                                placeholder="e.g. user@domain.com"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        {forgotMessage && <div style={styles.infoMessage}>{forgotMessage}</div>}

                        <button
                            type="submit"
                            disabled={forgotLoading}
                            style={{
                                ...styles.submitButton,
                                ...(forgotLoading ? styles.submitButtonDisabled : {})
                            }}
                        >
                            {forgotLoading ? "Sending..." : "Send Password Reset Link"}
                        </button>
                    </form>
                )}

                <div style={styles.footer}>
                    <span style={styles.version}>CDI / EDI Design Platform v3.0 (Supabase Auth Enabled)</span>
                </div>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        padding: "20px"
    },
    loginCard: {
        background: "#ffffff",
        borderRadius: "16px",
        padding: "35px 30px",
        width: "100%",
        maxWidth: "440px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative"
    },
    backBtn: {
        alignSelf: "flex-start",
        marginBottom: "15px",
        background: "#f1f5f9",
        border: "1px solid #cbd5e1",
        color: "#475569",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s"
    },
    logoContainer: {
        marginBottom: "15px"
    },
    title: {
        fontSize: "22px",
        fontWeight: "700",
        color: "#0f172a",
        margin: "0 0 4px 0",
        textAlign: "center"
    },
    subtitle: {
        fontSize: "13px",
        color: "#64748b",
        margin: "0 0 20px 0",
        textAlign: "center"
    },
    tabBar: {
        display: "flex",
        background: "#f1f5f9",
        borderRadius: "8px",
        padding: "4px",
        width: "100%",
        marginBottom: "20px",
        gap: "4px"
    },
    tabButton: {
        flex: 1,
        padding: "8px 4px",
        border: "none",
        background: "transparent",
        color: "#64748b",
        fontSize: "12px",
        fontWeight: "600",
        borderRadius: "6px",
        cursor: "pointer",
        transition: "all 0.2s"
    },
    tabButtonActive: {
        background: "#ffffff",
        color: "#2563eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    },
    form: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },
    label: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#475569"
    },
    input: {
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #cbd5e1",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box",
        width: "100%"
    },
    submitButton: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        padding: "12px",
        borderRadius: "8px",
        fontWeight: "700",
        fontSize: "14px",
        cursor: "pointer",
        transition: "background-color 0.2s",
        marginTop: "6px"
    },
    submitButtonDisabled: {
        backgroundColor: "#93c5fd",
        cursor: "not-allowed"
    },
    errorMessage: {
        backgroundColor: "#fef2f2",
        border: "1px solid #fca5a5",
        color: "#991b1b",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "12px"
    },
    successMessage: {
        backgroundColor: "#f0fdf4",
        border: "1px solid #bbf7d0",
        color: "#166534",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "12px"
    },
    infoMessage: {
        backgroundColor: "#eff6ff",
        border: "1px solid #bfdbfe",
        color: "#1e40af",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "12px"
    },
    footer: {
        marginTop: "20px",
        textAlign: "center"
    },
    version: {
        fontSize: "11px",
        color: "#94a3b8"
    }
};
