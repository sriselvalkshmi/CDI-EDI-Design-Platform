import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * TechErrorBoundary
 * React Error Boundary preventing technology rendering component crashes
 * from breaking the main design platform UI. Provides graceful fallback.
 */
export default class TechErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Technology Renderer Error Boundary Caught Error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: "24px",
                    background: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    borderRadius: "12px",
                    textAlign: "center",
                    margin: "12px 0",
                    boxShadow: "0 4px 6px -1px rgba(220, 38, 38, 0.05)"
                }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#FEE2E2",
                        color: "#DC2626",
                        marginBottom: "12px"
                    }}>
                        <AlertTriangle size={26} />
                    </div>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "700", color: "#991B1B" }}>
                        Technology Renderer Warning
                    </h3>
                    <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#7F1D1D" }}>
                        {this.state.error?.message || "An unexpected error occurred while rendering the technology schematic."}
                    </p>

                    <button
                        onClick={this.handleReset}
                        style={{
                            background: "#DC2626",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "8px 18px",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "12.5px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <RefreshCw size={14} /> Reset Technology Visualizer
                    </button>

                    {process.env.NODE_ENV !== "production" && this.state.errorInfo && (
                        <details style={{ marginTop: "14px", textAlign: "left", fontSize: "11px", color: "#B91C1C" }}>
                            <summary style={{ cursor: "pointer", fontWeight: "600" }}>Stack Trace Details</summary>
                            <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto", marginTop: "6px", background: "#FFF5F5", padding: "8px", borderRadius: "4px" }}>
                                {this.state.error?.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
