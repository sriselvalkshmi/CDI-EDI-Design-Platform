import React, {
    createContext,
    useContext,
    useState,
    useEffect
} from "react";
import api from "../services/api";

const AppContext = createContext();

export function AppProvider({ children }) {

    //------------------------------------------
    // GENERAL
    //------------------------------------------

    const [technology, setTechnology] = useState("AUTO");
    const [selectedDesign, setSelectedDesign] = useState("CDI");
    const [loading, setLoading] = useState(false);

    //------------------------------------------
    // FEED WATER
    //------------------------------------------

    const [feedWater, setFeedWater] = useState({
        tds: 500,
        conductivity: 300,
        hardness: 150,
        ph: 7,
        temperature: 25,
        flowRate: 10,
        pressure: 1,
        targetTds: 50
    });

    //------------------------------------------
    // COMPLETE API RESPONSE
    //------------------------------------------

    const [aiResult, setAiResult] = useState(null);

    //------------------------------------------
    // DESIGN RESULTS
    //------------------------------------------

    const [designParameters, setDesignParameters] = useState(null);

    const [engineering, setEngineering] = useState(null);

    const [componentSizing, setComponentSizing] = useState(null);

    const [simulation, setSimulation] = useState(null);

    const [performance, setPerformance] = useState(null);

    const [optimization, setOptimization] = useState(null);

    const [electrode, setElectrode] = useState(null);

    //------------------------------------------
    // NEW DESIGN OBJECTS
    //------------------------------------------

    const [layout, setLayout] = useState(null);

    const [stack, setStack] = useState(null);

    const [cellGeometry, setCellGeometry] = useState(null);

    //------------------------------------------
    // EQUIPMENT
    //------------------------------------------

    const [selectedComponent, setSelectedComponent] = useState(null);

    const [selectedEquipment, setSelectedEquipment] = useState(null);

    //------------------------------------------
    // OPTIMIZATION
    //------------------------------------------

    const [optimizationMode, setOptimizationMode] =
        useState("AI");

    const [optimizationInputs, setOptimizationInputs] =
        useState({
            voltage: 1.2,
            current: 5,
            cellPairs: 36,
            electrodeArea: 250,
            electrodeThickness: 0.6,
            spacerThickness: 0.5,
            flowRate: 10,
            flowVelocity: 0.15,
            residenceTime: 10,
            feedPressure: 1.0,
            stackLength: 200,
            stackWidth: 100,
            stackHeight: 37.0,
            pumpEfficiency: 75,
            electrodeDensity: 0.45,
            electrodePorosity: 0.65
        });

    const [lockedParameters, setLockedParameters] =
        useState({
            voltage: false,
            current: false,
            cellPairs: false,
            electrodeArea: false,
            electrodeThickness: false,
            spacerThickness: false,
            flowRate: false,
            flowVelocity: false,
            residenceTime: false,
            feedPressure: false,
            stackLength: false,
            stackWidth: false,
            stackHeight: false,
            pumpEfficiency: false,
            electrodeDensity: false,
            electrodePorosity: false
        });


    //------------------------------------------
    // DESIGN COMPONENTS
    //------------------------------------------

    const [designComponents, setDesignComponents] =
        useState([
            {
                id: 1,
                type: "Electrode",
                name: "Carbon Electrode",
                area: 250,
                thickness: 0.6,
                material: "Activated Carbon"
            },
            {
                id: 2,
                type: "Spacer",
                name: "Flow Channel",
                height: 0.5,
                flowRate: 10
            },
            {
                id: 3,
                type: "Electrode",
                name: "Carbon Electrode",
                area: 250,
                thickness: 0.6,
                material: "Activated Carbon"
            }
        ]);

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [page, setPage] = useState("DASHBOARD");
    const [equations, setEquations] = useState([]);

    const fetchEquations = async () => {
        try {
            const res = await api.get("/equations");
            if (res.data && res.data.success) {
                setEquations(res.data.equations);
            }
        } catch (e) {
            if (e.response?.status === 401) {
                return;
            }
            console.error("Error fetching equations:", e);
        }
    };

    const saveEquations = async (newEquations) => {
        try {
            const res = await api.post("/equations", newEquations);
            if (res.data.success) {
                setEquations(res.data.equations);
                return { success: true };
            }
            return { success: false, error: res.data.error };
        } catch (e) {
            return { success: false, error: e.response?.data?.error || e.message };
        }
    };

    const resetEquations = async () => {
        try {
            const res = await api.post("/equations/reset");
            if (res.data.success) {
                setEquations(res.data.equations);
                return { success: true };
            }
            return { success: false, error: res.data.error };
        } catch (e) {
            return { success: false, error: e.response?.data?.error || e.message };
        }
    };

    const recalculate = async (currentInputs = optimizationInputs, currentTech = technology) => {
        try {
            const payload = {
                ...feedWater,
                technology: currentTech,
                optimizationMode,
                optimizationInputs: currentInputs,
                lockedParameters
            };
            const res = await api.post("/optimize", payload);
            if (res.data.success) {
                const data = res.data;
                // technology
                setSelectedDesign(data.selectedTechnology || currentTech);
                // calculations
                if (data.engineering) setEngineering(data.engineering);
                if (data.simulation) setSimulation(data.simulation);
                if (data.sizing) setComponentSizing(data.sizing);
                if (data.electrode) setElectrode(data.electrode);
                if (data.performance) setPerformance(data.performance);
                if (data.optimization) setOptimization(data.optimization);
                if (data.stack) setStack(data.stack);
                if (data.cellGeometry) setCellGeometry(data.cellGeometry);
                if (data.layout) setLayout(data.layout);
            }
        } catch (e) {
            console.error("Recalculation error:", e);
        }
    };

    const checkSession = async () => {
        try {
            const res = await api.get("/auth/me");
            if (res.data && res.data.success) {
                setUser(res.data.user);
                setIsAuthenticated(true);
                try {
                    const eqRes = await api.get("/equations");
                    if (eqRes.data && eqRes.data.success) {
                        setEquations(eqRes.data.equations);
                    }
                } catch (eqErr) {
                    if (eqErr.response?.status === 401) {
                        return;
                    }
                    console.error("Error loading equations on mount:", eqErr);
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                setIsAuthenticated(false);
                setUser(null);
                return;
            }
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const login = async (identifier, password) => {
        try {
            const res = await api.post("/auth/login", { identifier, password });
            if (res.data.success) {
                setUser(res.data.user);
                setIsAuthenticated(true);
                setPage("EQUATION_EDITOR");
                try {
                    const eqRes = await api.get("/equations");
                    if (eqRes.data.success) {
                        setEquations(eqRes.data.equations);
                    }
                } catch (eqErr) {
                    console.error("Error loading equations after login:", eqErr);
                }
                return true;
            }
            return false;
        } catch (e) {
            console.error("Login failed:", e);
            throw e;
        }
    };

    const register = async (formData) => {
        try {
            const res = await api.post("/auth/register", formData);
            return res.data;
        } catch (e) {
            throw e;
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (e) {
            console.error("Logout request failed:", e);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            setPage("DASHBOARD");
        }
    };

    const changePassword = async (oldPassword, newPassword) => {
        try {
            const res = await api.post("/auth/change-password", { oldPassword, newPassword });
            return res.data;
        } catch (e) {
            return { success: false, error: e.response?.data?.message || e.message };
        }
    };

    // Setup Axios Interceptor to catch 401 errors
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    const url = error.config.url;
                    if (!url.includes("/auth/me") && !url.includes("/auth/login")) {
                        setUser(null);
                        setIsAuthenticated(false);
                        setPage("LOGIN");
                    }
                }
                return Promise.reject(error);
            }
        );
        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

    // Check session on mount
    useEffect(() => {
        checkSession();
    }, []);

    // Debounced automatic calculation when optimization parameters change
    useEffect(() => {
        if (!engineering) return; // Only trigger if initial design has been loaded
        
        const timer = setTimeout(() => {
            recalculate(optimizationInputs, technology);
        }, 500);

        return () => clearTimeout(timer);
    }, [optimizationInputs, technology]);

    //------------------------------------------
    // PROVIDER
    //------------------------------------------

    return (
        <AppContext.Provider
            value={{

                // General
                technology,
                setTechnology,

                selectedDesign,
                setSelectedDesign,

                loading,
                setLoading,

                // Feed Water
                feedWater,
                setFeedWater,

                // API Response
                aiResult,
                setAiResult,

                // Design
                designParameters,
                setDesignParameters,

                engineering,
                setEngineering,

                componentSizing,
                setComponentSizing,

                simulation,
                setSimulation,

                performance,
                setPerformance,

                optimization,
                setOptimization,

                electrode,
                setElectrode,

                // New Design Data
                layout,
                setLayout,

                stack,
                setStack,

                cellGeometry,
                setCellGeometry,

                // Equipment
                selectedComponent,
                setSelectedComponent,

                selectedEquipment,
                setSelectedEquipment,

                designComponents,
                setDesignComponents,

                // Optimization
                optimizationMode,
                setOptimizationMode,

                optimizationInputs,
                setOptimizationInputs,

                lockedParameters,
                setLockedParameters,

                // Equations & Page Navigation
                page,
                setPage,
                equations,
                setEquations,
                fetchEquations,
                saveEquations,
                resetEquations,
                recalculate,
                user,
                setUser,
                isAuthenticated,
                setIsAuthenticated,
                login,
                register,
                logout,
                changePassword
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}