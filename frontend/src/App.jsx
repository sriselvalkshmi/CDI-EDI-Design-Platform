import React from "react";
import Dashboard from "./pages/Dashboard";
import EquationEditorPage from "./pages/EquationEditorPage";
import AdminDashboard from "./components/AdminDashboard";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useApp } from "./context/AppContext";

function App() {
    const { page } = useApp();

    return (
        <ProtectedRoute>
            <div className="app-container" style={{ width: "100vw", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {page === "ADMIN_DASHBOARD" ? (
                    <>
                        <Navbar />
                        <div style={{ flex: 1, overflow: "hidden" }}>
                            <AdminDashboard />
                        </div>
                    </>
                ) : page === "EQUATION_EDITOR" ? (
                    <EquationEditorPage />
                ) : (
                    <Dashboard />
                )}
            </div>
        </ProtectedRoute>
    );
}

export default App;