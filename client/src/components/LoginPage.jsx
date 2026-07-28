import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useToast } from "./ToastNotification";
import { Lock, Mail, ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight, KeyRound, Check, User, UserPlus, LogIn } from "lucide-react";

export default function LoginPage() {
    const { login, registerUser, loginError, setLoginError } = useAuth();
    const { setPage } = useApp();
    const { showSuccess, showInfo } = useToast();

    const [activeTab, setActiveTab] = useState("SIGN_IN"); // "SIGN_IN" | "SIGN_UP" | "FORGOT"

    // Sign In State
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sign Up State
    const [signUpFullName, setSignUpFullName] = useState("");
    const [signUpEmail, setSignUpEmail] = useState("");
    const [signUpUsername, setSignUpUsername] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
    const [signUpSuccessMsg, setSignUpSuccessMsg] = useState("");

    // Forgot Password State
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState(false);

    const handleSignInSubmit = async (e) => {
        e.preventDefault();
        setLoginError("");

        if (!identifier.trim()) {
            setLoginError("Please enter your email address or username.");
            return;
        }
        if (!password) {
            setLoginError("Please enter your password.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await login(identifier, password, rememberMe);
            if (res.success) {
                showSuccess(`Welcome back, ${res.user.fullName || "User"}!`);
                setPage("DASHBOARD");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setLoginError("");
        setSignUpSuccessMsg("");

        if (!signUpFullName.trim()) {
            setLoginError("Full Name is required.");
            return;
        }
        if (!signUpEmail.trim()) {
            setLoginError("Email address is required.");
            return;
        }
        if (!signUpUsername.trim()) {
            setLoginError("Username is required.");
            return;
        }
        if (signUpPassword !== signUpConfirmPassword) {
            setLoginError("Passwords do not match.");
            return;
        }
        if (signUpPassword.length < 6) {
            setLoginError("Password must be at least 6 characters long.");
            return;
        }

        setIsSubmitting(true);
        try {
            const newUser = await registerUser({
                fullName: signUpFullName.trim(),
                email: signUpEmail.trim(),
                username: signUpUsername.trim(),
                password: signUpPassword
            });

            setSignUpSuccessMsg(`Registration successful! Account created for ${newUser.email}. You can now sign in.`);
            showSuccess("Account created successfully as User!");

            setTimeout(() => {
                setActiveTab("SIGN_IN");
                setIdentifier(newUser.email);
                setSignUpSuccessMsg("");
            }, 2500);
        } catch (err) {
            setLoginError(err.message || "Registration failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotSubmit = (e) => {
        e.preventDefault();
        if (!forgotEmail.trim()) return;
        setForgotSuccess(true);
        showInfo("Password reset instructions have been sent to your email.");
        setTimeout(() => {
            setActiveTab("SIGN_IN");
            setForgotSuccess(false);
            setForgotEmail("");
        }, 2500);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* BRAND HEADER */}
                <div style={styles.header}>
                    <div style={styles.logoBadge}>
                        <ShieldCheck size={34} color="#2563EB" />
                    </div>
                    <h1 style={styles.title}>CDI / EDI Design Platform</h1>
                    <p style={styles.subtitle}>
                        Enterprise Access Portal
                    </p>
                </div>

                {/* TAB SWITCHER */}
                <div style={styles.tabBar}>
                    <button
                        onClick={() => {
                            setActiveTab("SIGN_IN");
                            setLoginError("");
                        }}
                        style={{
                            ...styles.tabBtn,
                            ...(activeTab === "SIGN_IN" ? styles.activeTabBtn : {})
                        }}
                    >
                        <LogIn size={15} />
                        <span>Sign In</span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("SIGN_UP");
                            setLoginError("");
                        }}
                        style={{
                            ...styles.tabBtn,
                            ...(activeTab === "SIGN_UP" ? styles.activeTabBtn : {})
                        }}
                    >
                        <UserPlus size={15} />
                        <span>Sign Up</span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("FORGOT");
                            setLoginError("");
                        }}
                        style={{
                            ...styles.tabBtn,
                            ...(activeTab === "FORGOT" ? styles.activeTabBtn : {})
                        }}
                    >
                        <KeyRound size={15} />
                        <span>Forgot Password</span>
                    </button>
                </div>

                {/* ERROR ALERT */}
                {loginError && (
                    <div style={styles.errorAlert} role="alert">
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
                        <span style={styles.errorText}>{loginError}</span>
                    </div>
                )}

                {/* SIGN UP SUCCESS BANNER */}
                {signUpSuccessMsg && (
                    <div style={styles.successAlert}>
                        <Check size={18} style={{ flexShrink: 0 }} />
                        <span>{signUpSuccessMsg}</span>
                    </div>
                )}

                {/* SIGN IN FORM */}
                {activeTab === "SIGN_IN" && (
                    <form onSubmit={handleSignInSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label} htmlFor="login-identifier">
                                Email Address
                            </label>
                            <div style={styles.inputWrapper}>
                                <Mail size={18} style={styles.inputIcon} />
                                <input
                                    id="login-identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => {
                                        setIdentifier(e.target.value);
                                        if (loginError) setLoginError("");
                                    }}
                                    placeholder="Enter your email address"
                                    style={styles.input}
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label} htmlFor="login-password">
                                Password
                            </label>
                            <div style={styles.inputWrapper}>
                                <Lock size={18} style={styles.inputIcon} />
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (loginError) setLoginError("");
                                    }}
                                    placeholder="••••••••"
                                    style={styles.input}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={styles.eyeBtn}
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div style={styles.optionsRow}>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={styles.checkbox}
                                />
                                <span>Remember Session</span>
                            </label>

                            <button
                                type="button"
                                onClick={() => setActiveTab("FORGOT")}
                                style={styles.forgotBtn}
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                ...styles.submitBtn,
                                opacity: isSubmitting ? 0.75 : 1,
                                cursor: isSubmitting ? "wait" : "pointer"
                            }}
                        >
                            {isSubmitting ? (
                                "Authenticating..."
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* SIGN UP FORM */}
                {activeTab === "SIGN_UP" && (
                    <form onSubmit={handleSignUpSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Full Name</label>
                            <div style={styles.inputWrapper}>
                                <User size={18} style={styles.inputIcon} />
                                <input
                                    type="text"
                                    value={signUpFullName}
                                    onChange={(e) => setSignUpFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                    style={styles.input}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <div style={styles.inputWrapper}>
                                <Mail size={18} style={styles.inputIcon} />
                                <input
                                    type="email"
                                    value={signUpEmail}
                                    onChange={(e) => setSignUpEmail(e.target.value)}
                                    placeholder="name@organization.com"
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Username</label>
                            <div style={styles.inputWrapper}>
                                <User size={18} style={styles.inputIcon} />
                                <input
                                    type="text"
                                    value={signUpUsername}
                                    onChange={(e) => setSignUpUsername(e.target.value)}
                                    placeholder="Choose a username"
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div style={styles.rowTwoCol}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Password</label>
                                <input
                                    type="password"
                                    value={signUpPassword}
                                    onChange={(e) => setSignUpPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={styles.inputShort}
                                    required
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Confirm Password</label>
                                <input
                                    type="password"
                                    value={signUpConfirmPassword}
                                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={styles.inputShort}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                ...styles.submitBtn,
                                opacity: isSubmitting ? 0.75 : 1,
                                cursor: isSubmitting ? "wait" : "pointer"
                            }}
                        >
                            {isSubmitting ? (
                                "Creating Account..."
                            ) : (
                                <>
                                    <span>Create User Account</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* FORGOT PASSWORD FORM */}
                {activeTab === "FORGOT" && (
                    <div>
                        {forgotSuccess ? (
                            <div style={styles.modalSuccess}>
                                <Check size={20} color="#166534" />
                                <span>Instructions sent! Check your inbox.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotSubmit} style={styles.form}>
                                <p style={styles.forgotDesc}>
                                    Enter your account email address and we will send password reset instructions.
                                </p>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Email Address</label>
                                    <div style={styles.inputWrapper}>
                                        <Mail size={18} style={styles.inputIcon} />
                                        <input
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="yourname@organization.com"
                                            style={styles.input}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <button type="submit" style={styles.submitBtn}>
                                    <span>Send Reset Link</span>
                                    <ArrowRight size={18} />
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* FOOTER */}
                <div style={styles.footer}>
                    <span style={styles.footerText}>
                        Capacitive Deionization & Electrodeionization Engineering Platform
                    </span>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0F172A",
        backgroundImage: "radial-gradient(circle at 50% 30%, #1E293B 0%, #0F172A 70%)",
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
        padding: "20px",
        overflow: "auto"
    },
    card: {
        width: "100%",
        maxWidth: "480px",
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        padding: "36px 32px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        boxSizing: "border-box"
    },
    header: {
        textAlign: "center",
        marginBottom: "24px"
    },
    logoBadge: {
        width: "56px",
        height: "56px",
        borderRadius: "14px",
        backgroundColor: "#EFF6FF",
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "12px",
        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)"
    },
    title: {
        fontSize: "22px",
        fontWeight: "700",
        color: "#0F172A",
        margin: "0 0 4px 0",
        letterSpacing: "-0.4px"
    },
    subtitle: {
        fontSize: "13px",
        color: "#64748B",
        margin: 0
    },
    tabBar: {
        display: "flex",
        backgroundColor: "#F1F5F9",
        borderRadius: "8px",
        padding: "4px",
        marginBottom: "22px"
    },
    tabBtn: {
        flex: 1,
        height: "36px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "5px",
        border: "none",
        borderRadius: "6px",
        fontSize: "12.5px",
        fontWeight: "600",
        color: "#64748B",
        backgroundColor: "transparent",
        cursor: "pointer",
        transition: "all 0.2s"
    },
    activeTabBtn: {
        backgroundColor: "#FFFFFF",
        color: "#2563EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    },
    errorAlert: {
        backgroundColor: "#FEF2F2",
        border: "1px solid #FCA5A5",
        borderRadius: "8px",
        padding: "10px 12px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        color: "#991B1B"
    },
    errorText: {
        fontSize: "13px",
        fontWeight: "500"
    },
    successAlert: {
        backgroundColor: "#F0FDF4",
        border: "1px solid #BBF7D0",
        borderRadius: "8px",
        padding: "10px 12px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "#166534",
        fontSize: "13px",
        fontWeight: "600"
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
    },
    forgotDesc: {
        fontSize: "13px",
        color: "#64748B",
        marginBottom: "14px",
        lineHeight: "1.4"
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },
    label: {
        fontSize: "12.5px",
        fontWeight: "600",
        color: "#334155"
    },
    inputWrapper: {
        position: "relative",
        display: "flex",
        alignItems: "center"
    },
    inputIcon: {
        position: "absolute",
        left: "12px",
        color: "#94A3B8",
        pointerEvents: "none"
    },
    input: {
        width: "100%",
        height: "42px",
        paddingLeft: "38px",
        paddingRight: "38px",
        fontSize: "13.5px",
        color: "#0F172A",
        backgroundColor: "#F8FAFC",
        border: "1px solid #CBD5E1",
        borderRadius: "8px",
        outline: "none",
        boxSizing: "border-box"
    },
    rowTwoCol: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px"
    },
    inputShort: {
        width: "100%",
        height: "42px",
        padding: "0 12px",
        fontSize: "13.5px",
        color: "#0F172A",
        backgroundColor: "#F8FAFC",
        border: "1px solid #CBD5E1",
        borderRadius: "8px",
        outline: "none",
        boxSizing: "border-box"
    },
    eyeBtn: {
        position: "absolute",
        right: "10px",
        background: "none",
        border: "none",
        color: "#94A3B8",
        cursor: "pointer",
        display: "flex",
        alignItems: "center"
    },
    optionsRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "12.5px",
        color: "#475569"
    },
    checkboxLabel: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer"
    },
    checkbox: {
        accentColor: "#2563EB"
    },
    forgotBtn: {
        background: "none",
        border: "none",
        color: "#2563EB",
        fontWeight: "600",
        cursor: "pointer",
        fontSize: "12.5px",
        padding: 0
    },
    submitBtn: {
        width: "100%",
        height: "44px",
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "8px",
        fontSize: "14.5px",
        fontWeight: "600",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        marginTop: "4px"
    },
    footer: {
        marginTop: "20px",
        paddingTop: "16px",
        borderTop: "1px solid #E2E8F0",
        textAlign: "center"
    },
    footerText: {
        fontSize: "10.5px",
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        fontWeight: "500"
    },
    modalSuccess: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "14px",
        backgroundColor: "#F0FDF4",
        color: "#166534",
        borderRadius: "8px",
        fontSize: "13.5px",
        fontWeight: "600"
    }
};
