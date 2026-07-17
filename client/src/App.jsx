import React from "react";
import Dashboard from "./pages/Dashboard";
import EquationEditorPage from "./pages/EquationEditorPage";
import { useApp } from "./context/AppContext";

function App() {
    const { page } = useApp();

    return (
        <div className="app-container">
            {page === "DASHBOARD" ? (
                <Dashboard />
            ) : (
                <EquationEditorPage />
            )}
        </div>
    );
}

export default App;