import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "info", duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showSuccess = useCallback((msg) => addToast(msg, "success"), [addToast]);
    const showError = useCallback((msg) => addToast(msg, "error"), [addToast]);
    const showInfo = useCallback((msg) => addToast(msg, "info"), [addToast]);
    const showWarning = useCallback((msg) => addToast(msg, "warning"), [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, showSuccess, showError, showInfo, showWarning, removeToast }}>
            {children}
            <div style={styles.toastContainer}>
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        style={{
                            ...styles.toast,
                            ...(styles[toast.type] || styles.info)
                        }}
                    >
                        <div style={styles.iconWrapper}>
                            {toast.type === "success" && <CheckCircle size={18} color="#166534" />}
                            {toast.type === "error" && <XCircle size={18} color="#991B1B" />}
                            {toast.type === "warning" && <AlertTriangle size={18} color="#9A3412" />}
                            {toast.type === "info" && <Info size={18} color="#1E40AF" />}
                        </div>
                        <span style={styles.message}>{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} style={styles.closeBtn}>
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Fallback no-op if context not mounted yet
        return {
            showSuccess: console.log,
            showError: console.error,
            showInfo: console.log,
            showWarning: console.warn
        };
    }
    return context;
}

const styles = {
    toastContainer: {
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "380px",
        pointerEvents: "none"
    },
    toast: {
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        fontSize: "13.5px",
        fontWeight: "500",
        lineHeight: "1.4",
        transition: "all 0.2s ease-in-out"
    },
    success: {
        backgroundColor: "#F0FDF4",
        border: "1px solid #BBF7D0",
        color: "#166534"
    },
    error: {
        backgroundColor: "#FEF2F2",
        border: "1px solid #FCA5A5",
        color: "#991B1B"
    },
    warning: {
        backgroundColor: "#FFFBEB",
        border: "1px solid #FDE68A",
        color: "#9A3412"
    },
    info: {
        backgroundColor: "#EFF6FF",
        border: "1px solid #BFDBFE",
        color: "#1E40AF"
    },
    iconWrapper: {
        display: "flex",
        alignItems: "center",
        marginRight: "10px"
    },
    message: {
        flex: 1
    },
    closeBtn: {
        background: "none",
        border: "none",
        color: "inherit",
        opacity: 0.6,
        cursor: "pointer",
        padding: "2px",
        marginLeft: "8px",
        display: "flex",
        alignItems: "center"
    }
};
