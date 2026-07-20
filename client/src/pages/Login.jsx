import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function Login() {
    const { login, register, setPage } = useApp();

    const [activeTab, setActiveTab] = useState("SIGN_IN"); // "SIGN_IN" | "SIGN_UP" | "FORGOT_PASSWORD"

    // Sign In State
    const [loginIdentifier, setLoginIdentifier] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    // Sign Up State
    const [signUpFullName, setSignUpFullName] = useState("");
    const [signUpEmail, setSignUpEmail] = useState("");
    const [signUpCompany, setSignUpCompany] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
    const [signUpError, setSignUpError] = useState("");
    const [signUpSuccess, setSignUpSuccess] = useState("");
    const [signUpLoading, setSignUpLoading] = useState(false);

    // Forgot Password State
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState("");

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoginLoading(true);
        try {
            const success = await login(loginIdentifier.trim(), loginPassword);
            if (!success) {
                setLoginError("Invalid email/username or password.");
            }
        } catch (err) {
            setLoginError(err.response?.data?.message || "Authentication failed. Check credentials.");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setSignUpError("");
        setSignUpSuccess("");

        if (signUpPassword !== signUpConfirmPassword) {
            setSignUpError("Passwords do not match.");
            return;
        }

        if (signUpPassword.length < 4) {
            setSignUpError("Password must be at least 4 characters long.");
            return;
        }

        setSignUpLoading(true);
        try {
            const res = await register({
                fullName: signUpFullName,
                email: signUpEmail,
                company: signUpCompany,
                password: signUpPassword
            });
            if (res.success) {
                setSignUpSuccess("Account created successfully! You can now sign in.");
                setSignUpFullName("");
                setSignUpEmail("");
                setSignUpCompany("");
                setSignUpPassword("");
                setSignUpConfirmPassword("");
                setTimeout(() => {
                    setActiveTab("SIGN_IN");
                    setLoginIdentifier(signUpEmail);
                }, 1500);
            } else {
                setSignUpError(res.message || "Registration failed.");
            }
        } catch (err) {
            setSignUpError(err.response?.data?.message || "Registration failed. Try a different email.");
        } finally {
            setSignUpLoading(false);
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        setForgotMessage("Password reset request logged. Please contact System Administrator (admin@cdi-edi.platform) to issue a new password.");
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.loginCard}>
                <button
                    onClick={() => setPage("DASHBOARD")}
                    style={styles.backBtn}
                >
                    ← Back to Engineering Dashboard
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
                <p style={styles.subtitle}>Engineering Design &amp; Optimization Suite</p>

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
                            <label style={styles.label}>Email Address or Admin Username</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. user@domain.com or admin"
                                value={loginIdentifier}
                                onChange={(e) => setLoginIdentifier(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
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
                            <label style={styles.label}>Company / University (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Acme Engineering Solutions"
                                value={signUpCompany}
                                onChange={(e) => setSignUpCompany(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password *</label>
                            <input
                                type="password"
                                required
                                placeholder="Create password"
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
                            {signUpLoading ? "Creating Account..." : "Create New User Account"}
                        </button>
                    </form>
                )}

                {/* TAB 3: FORGOT PASSWORD */}
                {activeTab === "FORGOT_PASSWORD" && (
                    <form onSubmit={handleForgotPassword} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Enter Registered Email</label>
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
                            style={styles.submitButton}
                        >
                            Request Password Reset
                        </button>
                    </form>
                )}

                <div style={styles.footer}>
                    <span style={styles.version}>CDI / EDI Design Platform v2.5 (Enterprise Security Edition)</span>
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
    hintBox: {
        marginTop: "10px",
        padding: "10px 12px",
        background: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: "3px"
    },
    hintTitle: {
        fontSize: "11px",
        fontWeight: "bold",
        color: "#334155"
    },
    hintText: {
        fontSize: "11px",
        color: "#64748b"
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
