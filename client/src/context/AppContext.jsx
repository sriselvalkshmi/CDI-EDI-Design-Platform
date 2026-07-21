import React, {
    createContext,
    useContext,
    useState,
    useEffect
} from "react";
import api from "../services/api";
import supabase, { isSupabaseConfigured } from "../services/supabaseClient";

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

    const [optimizationMode, setOptimizationMode] = useState("AI");
    const [optimizationInputs, setOptimizationInputs] = useState({
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

    const [lockedParameters, setLockedParameters] = useState({
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

    const [designComponents, setDesignComponents] = useState([
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
                setSelectedDesign(data.selectedTechnology || currentTech);
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

    // Helper to fetch user role & profile details
    const loadUserData = async (sbUser) => {
        if (!sbUser) {
            setUser(null);
            setIsAuthenticated(false);
            return;
        }

        let role = "Engineer";
        let fullName = sbUser.user_metadata?.full_name || "Engineer";

        try {
            // Check roles table first
            const { data: roleData } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", sbUser.id)
                .single();

            if (roleData && roleData.role) {
                role = roleData.role;
            }

            const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", sbUser.id)
                .single();

            if (profileData && profileData.full_name) {
                fullName = profileData.full_name;
            }
        } catch (e) {
            console.warn("Could not query user profile directly, falling back to /auth/me API endpoint:", e.message);
            try {
                const meRes = await api.get("/auth/me");
                if (meRes.data?.success && meRes.data?.user) {
                    role = meRes.data.user.role || role;
                    fullName = meRes.data.user.fullName || fullName;
                }
            } catch (meErr) {
                console.warn("/auth/me fallback error:", meErr.message);
            }
        }

        setUser({
            id: sbUser.id,
            email: sbUser.email,
            fullName,
            role
        });
        setIsAuthenticated(true);
    };

    const login = async (email, password) => {
        if (!isSupabaseConfigured) {
            throw new Error("Supabase Project URL & Anon Key are missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env file.");
        }
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                await api.post("/auth/login-event", { userId: null, email, success: false });
                throw error;
            }
            if (data?.user) {
                await loadUserData(data.user);
                await api.post("/auth/login-event", { userId: data.user.id, email: data.user.email, success: true });
                setPage("DASHBOARD");
                fetchEquations();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Login failed:", e);
            throw e;
        }
    };

    const register = async ({ fullName, email, password }) => {
        if (!isSupabaseConfigured) {
            throw new Error("Supabase Project URL & Anon Key are missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env file.");
        }
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName }
                }
            });
            if (error) throw error;
            return { success: true, user: data?.user };
        } catch (e) {
            console.error("Registration failed:", e);
            throw e;
        }
    };

    const logout = async () => {
        try {
            if (user) {
                await api.post("/auth/logout-event", { userId: user.id, email: user.email });
            }
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Logout error:", e);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            setPage("LOGIN");
        }
    };

    const requestPasswordReset = async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}`
            });
            if (error) throw error;
            return { success: true, message: "Password reset link sent to your email address." };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    // Setup Axios Interceptor to catch 401 errors
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    const url = error.config.url;
                    if (!url.includes("/auth/me") && !url.includes("/auth/login-event")) {
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

    // Check Supabase Auth Session on mount & listen for auth state changes
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await loadUserData(session.user);
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } catch (e) {
                console.error("Session init error:", e);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                await loadUserData(session.user);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Debounced automatic calculation when optimization parameters change
    useEffect(() => {
        if (!engineering) return;
        
        const timer = setTimeout(() => {
            recalculate(optimizationInputs, technology);
        }, 500);

        return () => clearTimeout(timer);
    }, [optimizationInputs, technology]);

    return (
        <AppContext.Provider
            value={{
                technology,
                setTechnology,
                selectedDesign,
                setSelectedDesign,
                loading,
                setLoading,
                feedWater,
                setFeedWater,
                aiResult,
                setAiResult,
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
                layout,
                setLayout,
                stack,
                setStack,
                cellGeometry,
                setCellGeometry,
                selectedComponent,
                setSelectedComponent,
                selectedEquipment,
                setSelectedEquipment,
                designComponents,
                setDesignComponents,
                optimizationMode,
                setOptimizationMode,
                optimizationInputs,
                setOptimizationInputs,
                lockedParameters,
                setLockedParameters,
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
                requestPasswordReset
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}