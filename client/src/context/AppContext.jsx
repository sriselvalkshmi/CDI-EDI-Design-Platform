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
import analyzeWaterChemistry from "../engineering/waterChemistry";
import calculateEconomics from "../engineering/economicEngine";
import calibrateEquations from "../engineering/experimentalCalibration";
import predictActualPerformance from "../engineering/mlCorrectionEngine";


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
    const [optimizationStatus, setOptimizationStatus] = useState("idle"); // "idle" | "loading" | "success" | "no_improvement" | "error"
    const [optimizationError, setOptimizationError] = useState(null);
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
    const recalculate = (currentInputs = optimizationInputs, currentTech = technology, isOptimization = false) => {
        try {
            // 1. Water Chemistry Analysis
            const waterChem = analyzeWaterChemistry(feedWater);

            // 2. AI Recommendation
            const ai = aiRecommendation(feedWater);
            const activeTech = currentTech === "AUTO" ? (ai.selectedTechnology || "CDI") : currentTech;

            let calcInputs = { ...currentInputs };

            // 3. Engineering Equation Engine
            let eng = engineeringEquationEngine({
                technology: activeTech,
                feedWater,
                ...calcInputs
            });

            // Save initial engineering values before optimization for comparison UI
            const initialEng = { ...eng };

            // 4. Electrode Model
            let elect = electrodeModel(feedWater, eng);

            // 5. Component Sizing
            let size = componentSizing(eng, activeTech);

            // 6. Design Optimizer
            const feedWaterWithOpt = {
                ...feedWater,
                optimizationMode,
                optimizationInputs: calcInputs,
                lockedParameters
            };
            const optResult = designOptimizer(feedWaterWithOpt, size, eng);

            let noImprovement = false;

            if ((isOptimization || currentTech === "AUTO") && optResult) {
                const vChanged = Math.abs((optResult.optimizedVoltage ?? eng.voltage) - eng.voltage) > 0.01;
                const iChanged = Math.abs((optResult.current ?? eng.current) - eng.current) > 0.01;
                const cChanged = (optResult.optimizedCellPairs ?? eng.cellPairs) !== eng.cellPairs;
                const aChanged = Math.abs((optResult.optimizedElectrodeArea ?? eng.electrodeArea) - eng.electrodeArea) > 1;
                const qChanged = Math.abs((optResult.optimizedFlowRate ?? eng.flowRate) - eng.flowRate) > 0.01;

                if (!vChanged && !iChanged && !cChanged && !aChanged && !qChanged) {
                    noImprovement = true;
                }

                calcInputs = {
                    ...calcInputs,
                    voltage: optResult.optimizedVoltage ?? calcInputs.voltage,
                    current: optResult.current ?? calcInputs.current,
                    flowRate: optResult.optimizedFlowRate ?? calcInputs.flowRate,
                    electrodeArea: optResult.optimizedElectrodeArea ?? calcInputs.electrodeArea,
                    cellPairs: optResult.optimizedCellPairs ?? calcInputs.cellPairs
                };

                // Recalculate physical equations with optimized parameters
                eng = engineeringEquationEngine({
                    technology: activeTech,
                    feedWater,
                    ...calcInputs
                });

                // Recalculate electrode model & sizing with updated engineering data
                elect = electrodeModel(feedWater, eng);
                size = componentSizing(eng, activeTech);

                setOptimizationInputs(calcInputs);
            }

            // 7. Simulation Engine (re-calculated with latest eng & elect)
            const sim = simulationEngine(activeTech, feedWater, { engineering: eng, electrode: elect });

            // 8. Performance Calculator
            const perf = performanceCalculator(feedWater, sim, eng, null, elect);

            // 9. Economic & Energy Analysis
            const economics = calculateEconomics(eng, feedWater);

            // 10. Experimental Calibration & ML Prediction
            const calibration = calibrateEquations();
            const mlPrediction = predictActualPerformance(eng, feedWater);

            // Ensure technology is set on engineering
            eng.technology = activeTech;

            // Assemble output fields
            const output = {
                technology: activeTech,
                outletTDS: eng?.outletTDS ?? sim?.outputTDS ?? sim?.outletTDS ?? null,
                removalEfficiency: eng?.removalEfficiency ?? sim?.removalEfficiency ?? null,
                pressureDrop: eng?.pressureDrop ?? 0,
                power: eng?.power ?? (sim?.averageVoltage * sim?.averageCurrent) ?? null,
                flowVelocity: eng?.flowVelocity ?? 0,
                SEC: eng?.sec ?? sim?.specificEnergy ?? null,
                residenceTime: eng?.residenceTime ?? calcInputs?.residenceTime ?? null,
                waterRecovery: eng?.waterRecovery ?? 95.0,
                recovery: eng?.recovery ?? 95.0,
                currentDensity: eng?.currentDensity ?? null,
                electrodeArea: eng?.electrodeArea ?? null,
                stackLength: eng?.stackLength ?? null
            };

            // Validation & Multi-Stage Calculation Logic
            const tds = Number(feedWater.tds || 500);
            const targetTds = Number(feedWater.targetTds || 50);
            const requiredRemoval = tds > 0 ? ((tds - targetTds) / tds) * 100 : 90.0;

            const maxTechRemovalMap = { CDI: 85.0, MCDI: 94.0, FCDI: 95.0, EDI: 99.9 };
            const maxTechRemoval = maxTechRemovalMap[activeTech] || 85.0;

            const isMultiStage = false;
            const stage1Tech = activeTech;

            // Single Technology Stage 1 Object
            const stage1OutletTDS = eng.outletTDS;
            const stage1RemovalEff = eng.removalEfficiency;

            const stage1 = {
                stage: 1,
                name: `${stage1Tech} Desalination`,
                technology: stage1Tech,
                inletTDS: tds,
                outletTDS: stage1OutletTDS,
                removalEfficiency: stage1RemovalEff,
                voltage: eng.voltage,
                current: eng.current,
                power: eng.power,
                sec: eng.sec,
                waterRecovery: eng.waterRecovery,
                cellPairs: eng.cellPairs,
                electrodeArea: eng.electrodeArea,
                residenceTime: eng.residenceTime,
                flowRate: eng.flowRate,
                currentDensity: eng.currentDensity,
                pressureDrop: eng.pressureDrop,
                engineering: {
                    technology: stage1Tech,
                    inletTDS: tds,
                    outletTDS: stage1OutletTDS,
                    voltage: eng.voltage,
                    current: eng.current,
                    power: eng.power,
                    sec: eng.sec,
                    removalEfficiency: stage1RemovalEff,
                    waterRecovery: eng.waterRecovery,
                    cellPairs: eng.cellPairs,
                    electrodeArea: eng.electrodeArea,
                    residenceTime: eng.residenceTime,
                    flowRate: eng.flowRate,
                    currentDensity: eng.currentDensity,
                    pressureDrop: eng.pressureDrop
                }
            };

            const recommendedProcess = activeTech;
            const finalOutletTDS = stage1.outletTDS;
            const overallRemoval = stage1.removalEfficiency;
            const totalPower = eng.power;
            const userFlowRate = Number(feedWater.flowRate || 10);
            const overallSec = eng.sec;
            const overallRecovery = eng.waterRecovery;

            const processObj = {
                recommendedProcess,
                technology: activeTech,
                isMultiStage: false,
                stages: [stage1],
                overall: {
                    recommendedProcess,
                    technology: activeTech,
                    inletTDS: tds,
                    targetTDS: targetTds,
                    outletTDS: finalOutletTDS,
                    removal: overallRemoval,
                    removalEfficiency: overallRemoval,
                    recovery: overallRecovery,
                    waterRecovery: overallRecovery,
                    totalPower,
                    flowRate: userFlowRate,
                    SEC: overallSec,
                    sec: overallSec,
                    status: finalOutletTDS <= targetTds + 1 ? "VALID" : "TARGET NOT ACHIEVABLE",
                    isMultiStage: false
                }
            };

            const validation = {
                status: processObj.overall.status === "VALID" ? "VALID" : "TARGET NOT ACHIEVABLE",
                messages: [],
                recommendedProcess
            };

            if (processObj.overall.status === "VALID") {
                validation.messages.push(`✓ Target TDS (${targetTds} ppm) achieved using single-stage ${activeTech}.`);
            } else {
                validation.messages.push(`⚠ Single-stage ${activeTech} maximum removal capacity reached (${maxTechRemoval}%). Target TDS (${targetTds} ppm) cannot be fully achieved.`);
                validation.messages.push(`💡 Outlet TDS reached: ${finalOutletTDS} ppm.`);
            }

            // Sync overall values to main engineering object for backwards compatibility
            eng.technology = isMultiStage ? "FCDI → EDI" : activeTech;
            eng.outletTDS = finalOutletTDS;
            eng.removalEfficiency = overallRemoval;
            eng.power = totalPower;
            eng.sec = overallSec;
            eng.waterRecovery = overallRecovery;
            eng.isMultiStage = isMultiStage;
            eng.recommendedProcess = recommendedProcess;

            // P&ID and Layout Generator
            const pidResult = layoutGenerator(null, eng, feedWater, sim, activeTech, processObj);

            // Build the unified designResult object with fresh references
            const newDesignResult = {
                input: { feedWater: { ...feedWater }, optimizationInputs: calcInputs, technology: activeTech, userSelectedTechnology: currentTech },
                aiRecommendation: {
                    ...ai,
                    recommendedProcess
                },
                process: processObj,
                engineering: eng,
                simulation: sim,
                performance: perf,
                waterChemistry: waterChem,
                economics,
                calibration,
                mlPrediction,
                optimizedEngineering: optResult ? {
                    ...optResult,
                    previousEngineering: initialEng,
                    isOptimal: noImprovement,
                    isLimitReached: !isMultiStage && optResult.isLimitReached,
                    isOptimizationApplied: isOptimization,
                    recommendedProcess
                } : null,
                equipment: pidResult?.equipment || [],
                pid: pidResult,
                kpi: {
                    technology: eng.technology,
                    outletTDS: finalOutletTDS,
                    removalEfficiency: overallRemoval,
                    pressureDrop: eng.pressureDrop,
                    power: totalPower,
                    flowVelocity: eng.flowVelocity,
                    SEC: overallSec,
                    residenceTime: output.residenceTime,
                    waterRecovery: overallRecovery,
                    recovery: overallRecovery,
                    currentDensity: output.currentDensity,
                    electrodeArea: output.electrodeArea,
                    stackLength: output.stackLength,
                    costPerM3: economics.costPerM3,
                    carbonFootprint: economics.carbonFootprint,
                    lsi: waterChem.lsi,
                    sac: eng.sac,
                    chargeEfficiency: eng.chargeEfficiency
                },
                validation
            };
            const isLimitReached = Boolean(optResult?.isLimitReached || processObj?.overall?.isMultiStage);
            const status = isLimitReached ? "LIMIT_REACHED" : (noImprovement ? "NO_IMPROVEMENT" : "OPTIMIZED");

            setDesignResult(newDesignResult);
            setDesignGenerated(true);
            return {
                success: true,
                noImprovement,
                isLimitReached,
                status,
                recommendedProcess: validation.recommendedProcess || "FCDI → EDI"
            };
        } catch (e) {
            console.error("Client calculation error:", e);
            throw e;
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
                optimizationStatus,
                setOptimizationStatus,
                optimizationError,
                setOptimizationError,
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