import React, { useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import EquationEditorPage from "./pages/EquationEditorPage";
import Login from "./pages/Login";
import { useApp } from "./context/AppContext";

function App() {
    const { page, isAuthenticated, user, setPage } = useApp();

    // Check Viewer role restriction
    useEffect(() => {
        if (page === "EQUATION_EDITOR" && isAuthenticated && user?.role === "Viewer") {
            alert("Access Denied: Viewer role cannot access the Equation Editor.");
            setPage("DASHBOARD");
        }
    }, [page, isAuthenticated, user, setPage]);

    return (
        <div className="app-container" style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            {page === "EQUATION_EDITOR" ? (
                isAuthenticated && user?.role !== "Viewer" ? (
                    <EquationEditorPage />
                ) : (
                    <Login />
                )
            ) : page === "LOGIN" ? (
                <Login />
            ) : (
                <Dashboard />
            )}
        </div>
    );
}

export default App;