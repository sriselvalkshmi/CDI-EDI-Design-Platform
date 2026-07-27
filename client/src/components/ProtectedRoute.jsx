import React from "react";
import { useAuth } from "../context/AuthContext";
import LoginPage from "./LoginPage";

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Initializing Secure Session...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    return children;
}

const styles = {
    loadingContainer: {
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0F172A",
        color: "#94A3B8",
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif"
    },
    spinner: {
        width: "36px",
        height: "36px",
        border: "3px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "50%",
        borderTopColor: "#2563EB",
        animation: "spin 1s ease-in-out infinite"
    },
    loadingText: {
        marginTop: "16px",
        fontSize: "14px",
        fontWeight: "500"
    }
};
