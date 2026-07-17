import React from "react";
import { useApp } from "../context/AppContext";

export default function Navbar() {
    const { page, setPage } = useApp();

    return (
        <div className="navbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", background: "#f8f9fa", borderBottom: "1px solid #e0e0e0", height: "60px", boxSizing: "border-box" }}>
            <h1 style={{ margin: 0, fontSize: "20px", color: "#1976d2" }}>CDI / EDI Design Platform</h1>
            <div className="nav-tabs" style={{ display: "flex", gap: "10px" }}>
                <button
                    onClick={() => setPage("DASHBOARD")}
                    style={{
                        background: page === "DASHBOARD" ? "#1976d2" : "transparent",
                        color: page === "DASHBOARD" ? "white" : "#555",
                        border: page === "DASHBOARD" ? "none" : "1px solid #ccc",
                        cursor: "pointer",
                        fontWeight: "600",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        transition: "all 0.2s"
                    }}
                >
                    Design Dashboard
                </button>
                <button
                    onClick={() => setPage("EQUATION_EDITOR")}
                    style={{
                        background: page === "EQUATION_EDITOR" ? "#1976d2" : "transparent",
                        color: page === "EQUATION_EDITOR" ? "white" : "#555",
                        border: page === "EQUATION_EDITOR" ? "none" : "1px solid #ccc",
                        cursor: "pointer",
                        fontWeight: "600",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        transition: "all 0.2s"
                    }}
                >
                    Equation Editor
                </button>
            </div>
        </div>
    );
}