import React, {
    createContext,
    useContext,
    useState,
    useEffect
} from "react";
import supabase, { isSupabaseConfigured } from "../services/supabaseClient";
import auditLogger from "../services/auditLogger";

// Client-side engineering calculation modules
import engineeringEquationEngine from "../engineering/engineeringEquationEngine";
import electrodeModel from "../engineering/electrodeModel";
import componentSizingModule from "../engineering/componentSizing";
import simulationEngine from "../engineering/simulationEngine";
import cdiDesignCalculator from "../engineering/cdiDesignCalculator";
import stackDesigner from "../engineering/stackDesigner";
import layoutGenerator from "../engineering/layoutGenerator";
import performanceCalculator from "../engineering/performanceCalculator";
import designOptimizer from "../engineering/designOptimizer";
import EquationEngine from "../engineering/equationEngine";
import aiRecommendation from "../engineering/aiRecommendation";

const componentSizing = typeof componentSizingModule === "function" ? componentSizingModule : componentSizingModule.calculate;

const AppContext = createContext();

export function AppProvider({ children }) {

    //------------------------------------------
    // GENERAL STATE
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
    // RESULTS & MODULES
    //------------------------------------------

    const [designResult, setDesignResult] = useState({
      input: {},
      aiRecommendation: null,
      engineering: null,
      optimizedEngineering: null,
      simulation: null,
      performance: null,
      equipment: null,
      pid: null,
      kpi: {
        outletTDS: null,
        removalEfficiency: null,
        pressureDrop: null,
        power: null,
        flowVelocity: null,
        SEC: null,
        residenceTime: null,
        waterRecovery: null,
        recovery: null,
        currentDensity: null,
        electrodeArea: null,
        stackLength: null
      },
      validation: { status: "VALID", messages: [] }
    });

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

    const [designComponents, setDesignComponents] = useState([
        { id: 1, type: "Electrode", name: "Carbon Electrode", area: 250, thickness: 0.6, material: "Activated Carbon" },
        { id: 2, type: "Spacer", name: "Flow Channel", height: 0.5, flowRate: 10 },
        { id: 3, type: "Electrode", name: "Carbon Electrode", area: 250, thickness: 0.6, material: "Activated Carbon" }
    ]);

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [page, setPage] = useState("DASHBOARD");
    const [equations, setEquations] = useState([]);
    const [designGenerated, setDesignGenerated] = useState(false);

    // Client-side engineering calculation engine
    const recalculate = (currentInputs = optimizationInputs, currentTech = technology) => {
        try {


            // 1. AI Recommendation
            const ai = aiRecommendation(feedWater);
            const activeTech = currentTech === "AUTO" ? (ai.selectedTechnology || "CDI") : currentTech;

            // 2. Engineering Equation Engine
            const eng = engineeringEquationEngine({
                technology: activeTech,
                feedWater,
                ...currentInputs
            });

            // 3. Electrode Model
            const elect = electrodeModel(feedWater, eng);

            // 4. Component Sizing (kept for UI but not part of designResult output)
            const size = componentSizing(eng, activeTech);

            // 5. Simulation Engine
            const sim = simulationEngine(activeTech, feedWater, { engineering: eng, electrode: elect });

            // 6. Performance Calculator
            const perf = performanceCalculator(eng, sim, feedWater);

            // 7. Design Optimizer (optional)
            const optResult = designOptimizer(feedWater, size, eng);

            // Ensure technology is set on engineering
            eng.technology = activeTech;

            // Assemble output fields
            const output = {
                technology: activeTech,
                outletTDS: sim?.outputTDS ?? sim?.outletTDS ?? eng?.outletTDS ?? null,
                removalEfficiency: sim?.removalEfficiency ?? eng?.removalEfficiency ?? null,
                pressureDrop: eng?.pressureDrop ?? 0,
                power: eng?.power ?? (sim?.averageVoltage * sim?.averageCurrent) ?? null,
                flowVelocity: eng?.flowVelocity ?? 0,
                SEC: sim?.specificEnergy ?? eng?.sec ?? null,
                residenceTime: eng?.residenceTime ?? currentInputs?.residenceTime ?? null,
                waterRecovery: eng?.waterRecovery ?? 95.0,
                recovery: eng?.recovery ?? 95.0,
                currentDensity: eng?.currentDensity ?? null,
                electrodeArea: eng?.electrodeArea ?? null,
                stackLength: eng?.stackLength ?? null
            };

            // Validation checks
            const validation = { status: "VALID", messages: [] };
            const targetTds = Number(feedWater.targetTds || 50);
            if (output.outletTDS !== null && output.outletTDS > targetTds) {
                validation.status = "INVALID";
                validation.messages.push("⚠ Target TDS NOT achieved");
            }
            if (eng?.voltage && eng.voltage > 5) {
                validation.messages.push("⚠ Voltage exceeds safe range");
            }
            if (eng?.currentDensity && eng.currentDensity > 3) {
                validation.messages.push("⚠ Current density exceeds safe range");
            }

            // 8. P&ID and Layout Generator
            const pidResult = layoutGenerator(null, eng, feedWater, sim, activeTech);

            // Build the unified designResult object
            const newDesignResult = {
                input: { feedWater, optimizationInputs: currentInputs, technology: activeTech, userSelectedTechnology: currentTech },
                aiRecommendation: ai,
                engineering: eng,
                simulation: sim,
                performance: perf,
                optimizedEngineering: optResult?.optimizedDesign || null,
                equipment: pidResult?.equipment || [],
                pid: pidResult,
                kpi: {
                    technology: eng.technology,
                    outletTDS: output.outletTDS,
                    removalEfficiency: output.removalEfficiency,
                    pressureDrop: eng.pressureDrop,
                    power: output.power,
                    flowVelocity: eng.flowVelocity,
                    SEC: output.SEC,
                    residenceTime: output.residenceTime,
                    waterRecovery: output.waterRecovery,
                    recovery: output.recovery,
                    currentDensity: output.currentDensity,
                    electrodeArea: output.electrodeArea,
                    stackLength: output.stackLength
                },
                validation
            };

            setDesignResult(newDesignResult);
            setDesignGenerated(true);
        } catch (e) {
            console.error("Client calculation error:", e);
        }
    };

    const fetchEquations = async () => {
        try {
            const eqList = await EquationEngine.loadEquationsAsync();
            setEquations(eqList || []);
        } catch (e) {
            console.error("Error fetching equations:", e);
        }
    };

    const saveEquations = async (newEquations) => {
        try {
            EquationEngine.saveEquations(newEquations);
            setEquations(newEquations);
            if (user) {
                await auditLogger.logActivity(user.id, user.email, "Save Equation", "Equation Editor", `Saved equation library (${newEquations.length} equations)`);
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const resetEquations = async () => {
        try {
            const defaultEqs = EquationEngine.resetToDefaults();
            setEquations(defaultEqs);
            if (user) {
                await auditLogger.logActivity(user.id, user.email, "Reset Equation Library", "Equation Editor", "Restored default equations library");
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const loadUserData = async (sbUser) => {
        if (!sbUser) {
            setUser(null);
            setIsAuthenticated(false);
            return;
        }

        let role = "User";
        let fullName = sbUser.user_metadata?.full_name || "Engineer";

        try {
            const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name, role")
                .eq("id", sbUser.id)
                .maybeSingle();

            if (profileData) {
                if (profileData.role) role = profileData.role;
                if (profileData.full_name) fullName = profileData.full_name;
            } else {
                const initialRole = (sbUser.email === "admin@cdiedi.com" || sbUser.email === "admin@cdi-edi.platform") ? "Administrator" : "User";
                await supabase.from("profiles").upsert([{
                    id: sbUser.id,
                    email: sbUser.email,
                    full_name: fullName,
                    role: initialRole
                }]);
                role = initialRole;
            }

            if (sbUser.email === "admin@cdiedi.com" || sbUser.email === "admin@cdi-edi.platform") {
                role = "Administrator";
            }
        } catch (e) {
            console.warn("User profile fetch error:", e.message);
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
            throw new Error("Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env.");
        }
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                await auditLogger.logLogin(null, email, false);
                throw error;
            }
            if (data?.user) {
                await loadUserData(data.user);
                await auditLogger.logLogin(data.user.id, data.user.email, true);
                setPage("EQUATION_EDITOR");
                fetchEquations();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Login error:", e);
            throw e;
        }
    };

    const register = async ({ fullName, email, password }) => {
        if (!isSupabaseConfigured) {
            throw new Error("Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env.");
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

            if (data?.user) {
                // Upsert profile in Supabase profiles table
                await supabase.from("profiles").upsert([{
                    id: data.user.id,
                    full_name: fullName,
                    email,
                    role: email === "admin@cdiedi.com" ? "Administrator" : "User"
                }]);
            }

            return { success: true, user: data?.user };
        } catch (e) {
            console.error("Registration error:", e);
            throw e;
        }
    };

    const logout = async () => {
        try {
            if (user) {
                await auditLogger.logLogout(user.id, user.email);
            }
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Logout error:", e);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            setPage("DASHBOARD");
        }
    };

    const requestPasswordReset = async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin
            });
            if (error) throw error;
            return { success: true, message: "Password reset link sent to your email." };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    // Check Supabase Auth Session on mount
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

        return () => subscription?.unsubscribe();
    }, []);

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
                designResult,
                setDesignResult,
                recalculate,
                designGenerated,
                setDesignGenerated,
                user,
                setUser,
                isAuthenticated,
                setIsAuthenticated,
                login,
                register,
                logout,
                requestPasswordReset,
                page,
                setPage,
                equations,
                setEquations,
                fetchEquations,
                saveEquations,
                resetEquations,
                optimizationMode,
                setOptimizationMode,
                optimizationInputs,
                setOptimizationInputs,
                lockedParameters,
                setLockedParameters,
                designComponents,
                setDesignComponents,
                selectedComponent,
                setSelectedComponent,
                selectedEquipment,
                setSelectedEquipment
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}