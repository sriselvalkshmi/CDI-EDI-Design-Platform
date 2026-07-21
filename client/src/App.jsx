import React from "react";
import Dashboard from "./pages/Dashboard";
import EquationEditorPage from "./pages/EquationEditorPage";
import Login from "./pages/Login";
import { useApp } from "./context/AppContext";

function App() {
    const { page, isAuthenticated } = useApp();

    // If user explicitly navigated to LOGIN or attempted to open protected EQUATION_EDITOR without auth
    if (page === "LOGIN" || (page === "EQUATION_EDITOR" && !isAuthenticated)) {
        return <Login />;
    }

    return (
        <div className="app-container" style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            {page === "EQUATION_EDITOR" && isAuthenticated ? (
                <EquationEditorPage />
            ) : (
                <Dashboard />
            )}
        </div>
    );
}

export default App;