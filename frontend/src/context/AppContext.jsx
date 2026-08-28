import React, {
    createContext,
    useContext,
    useState,
    useEffect
} from "react";
import supabase, { isSupabaseConfigured } from "../services/supabaseClient";
import auditLogger from "../services/auditLogger";

// Shared engineering calculation modules
import engineeringEquationEngine from "@shared/engineering/engine/engineeringEquationEngine.js";
import electrodeModel from "@shared/engineering/sizing/electrodeModel.js";
import componentSizingModule from "@shared/engineering/sizing/componentSizing.js";
import simulationEngine from "@shared/engineering/core/simulationEngine.js";
import cdiDesignCalculator from "@shared/engineering/core/cdiDesignCalculator.js";
import stackDesigner from "@shared/engineering/sizing/stackDesigner.js";
import layoutGenerator from "@shared/engineering/core/layoutGenerator.js";
import performanceCalculator from "@shared/engineering/core/performanceCalculator.js";
import designOptimizer from "@shared/engineering/sizing/designOptimizer.js";
import EquationEngine from "@shared/engineering/engine/equationEngine.js";
import { DEFAULT_EQUATIONS_DATABASE } from "@shared/engineering/equations/defaultEquationsDatabase.js";
import aiRecommendation from "@shared/engineering/core/aiRecommendation.js";
import analyzeWaterChemistry from "@shared/engineering/chemistry/waterChemistry.js";
import calculateEconomics from "@shared/engineering/core/economicEngine.js";
import calibrateEquations from "@shared/engineering/validation/experimentalCalibration.js";
import { predictActualPerformance } from "@shared/engineering/core/mlCorrectionEngine.js";

EquationEngine.setSupabaseClient(supabase);

const componentSizing = typeof componentSizingModule === "function" ? componentSizingModule : componentSizingModule.calculate;

const AppContext = createContext();

export function AppProvider({ children }) {

    //------------------------------------------
    // GENERAL STATE
    //------------------------------------------

    const [technology, setTechnology] = useState("AUTO");
    const [selectedDesign, setSelectedDesign] = useState("AUTO");
    const [loading, setLoading] = useState(false);

    //------------------------------------------
    // FEED WATER (Default empty/0 Design Basis)
    //------------------------------------------

    const [feedWater, setFeedWater] = useState({
        tds: "",
        conductivity: "",
        hardness: "",
        ph: "",
        temperature: "",
        flowRate: "",
        pressure: "",
        targetTds: "",
        targetRecovery: 95.0
    });

    //------------------------------------------
    // RESULTS & MODULES
    //------------------------------------------

    const [designResult, setDesignResult] = useState(null);

    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedEquipment, setSelectedEquipment] = useState(null);

    //------------------------------------------
    // OPTIMIZATION
    //------------------------------------------

    const [optimizationMode, setOptimizationMode] = useState("AI");
    const [optimizationStatus, setOptimizationStatus] = useState("idle");
    const [optimizationError, setOptimizationError] = useState(null);
    const [optimizationInputs, setOptimizationInputs] = useState({
        voltage: 1.4,
        current: 2.76,
        cellPairs: 510,
        electrodeArea: 350,
        numberOfModules: 15
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
    
    const [equations, setEquations] = useState(() => {
        try {
            const saved = localStorage.getItem("cdi_edi_equations");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length >= DEFAULT_EQUATIONS_DATABASE.length) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error("Failed to load saved equations:", e);
        }
        return DEFAULT_EQUATIONS_DATABASE;
    });

    const saveEquations = async (updatedEquations) => {
        try {
            setEquations(updatedEquations);
            localStorage.setItem("cdi_edi_equations", JSON.stringify(updatedEquations));
            return { success: true };
        } catch (e) {
            console.error("Save equations error:", e);
            return { success: false, error: e.message };
        }
    };

    const resetEquations = async () => {
        try {
            setEquations(DEFAULT_EQUATIONS_DATABASE);
            localStorage.setItem("cdi_edi_equations", JSON.stringify(DEFAULT_EQUATIONS_DATABASE));
            return { success: true };
        } catch (e) {
            console.error("Reset equations error:", e);
            return { success: false, error: e.message };
        }
    };

    const [designGenerated, setDesignGenerated] = useState(true);
    const [activeStage, setActiveStage] = useState("02_TECHNOLOGY");
    const [showDesignTrace, setShowDesignTrace] = useState(false);
    const [showEngineeringBasis, setShowEngineeringBasis] = useState(false);
    const [showSelectionLogic, setShowSelectionLogic] = useState(false);

    // Client-side engineering calculation engine
    const recalculate = (currentInputs = optimizationInputs, currentTech = technology, isOptimization = false, feedWaterOverride = null) => {
        const activeFeedWater = feedWaterOverride || feedWater;

        // Ensure essential numeric values exist before running calculation
        const tdsNum = Number(activeFeedWater.tds);
        const flowNum = Number(activeFeedWater.flowRate);
        const targetTdsNum = Number(activeFeedWater.targetTds);

        if (!tdsNum || isNaN(tdsNum) || tdsNum <= 0 || !flowNum || isNaN(flowNum) || flowNum <= 0 || !targetTdsNum || isNaN(targetTdsNum) || targetTdsNum <= 0) {
            return null;
        }

        const sanitizedFeed = {
            ...activeFeedWater,
            tds: tdsNum,
            flowRate: flowNum,
            targetTds: targetTdsNum,
            conductivity: Number(activeFeedWater.conductivity) || Math.round(tdsNum / 0.65),
            hardness: Number(activeFeedWater.hardness) || Math.round(tdsNum * 0.30),
            ph: Number(activeFeedWater.ph) || 7.2,
            temperature: Number(activeFeedWater.temperature) || 25,
            pressure: Number(activeFeedWater.pressure) || 1.0
        };

        try {
            // 1. Water Chemistry Analysis
            const waterChem = analyzeWaterChemistry(sanitizedFeed);

            // 2. AI Recommendation
            const ai = aiRecommendation(sanitizedFeed);
            const activeTech = currentTech === "AUTO" ? (ai.selectedTechnology || "MCDI") : currentTech;
            const prevTech = designResult?.selectedTechnology;

            let calcInputs = { ...currentInputs };
            if (prevTech && prevTech !== activeTech) {
                // Reset stack geometry when switching technology so the new technology sizes itself from first principles
                calcInputs = {};
            }

            // 3. Engineering Equation Engine
            let eng = engineeringEquationEngine({
                technology: activeTech,
                feedWater: sanitizedFeed,
                ...calcInputs
            });

            // Synchronize flowVelocity and residenceTime authoritatively from engineering calculation
            calcInputs = {
                ...calcInputs,
                flowVelocity: eng.flowVelocity,
                residenceTime: eng.residenceTime
            };

            // 4. Electrode Model
            let elect = electrodeModel(sanitizedFeed, eng);

            // 5. Component Sizing
            let size = componentSizing(eng, activeTech);

            // 6. Design Optimizer
            const feedWaterWithOpt = {
                ...sanitizedFeed,
                optimizationMode,
                optimizationInputs: calcInputs,
                lockedParameters
            };
            const optResult = designOptimizer(feedWaterWithOpt, size, eng);

            if (optResult && (isOptimization || calcInputs.cellPairs === undefined || calcInputs.cellPairs === 36)) {
                calcInputs = {
                    ...calcInputs,
                    voltage: optResult.optimizedVoltage ?? calcInputs.voltage,
                    current: optResult.current ?? calcInputs.current,
                    flowRate: sanitizedFeed.flowRate,
                    electrodeArea: optResult.optimizedElectrodeArea ?? calcInputs.electrodeArea,
                    cellPairs: optResult.optimizedCellPairs ?? calcInputs.cellPairs,
                    residenceTime: eng.residenceTime,
                    flowVelocity: eng.flowVelocity
                };

                // Recalculate physical equations with optimized parameters
                eng = engineeringEquationEngine({
                    technology: activeTech,
                    feedWater: sanitizedFeed,
                    ...calcInputs
                });

                elect = electrodeModel(sanitizedFeed, eng);
                size = componentSizing(eng, activeTech);

                setOptimizationInputs(calcInputs);
            }

            // 7. Simulation Engine
            const sim = simulationEngine(activeTech, sanitizedFeed, { engineering: eng, electrode: elect });

            // 8. Performance Calculator
            const perf = performanceCalculator(sanitizedFeed, sim, eng, null, elect);

            // 9. Economic & Energy Analysis
            const economics = calculateEconomics(eng, sanitizedFeed);

            // 10. Dynamic Layout Generator (P&ID)
            const pid = layoutGenerator({ engineering: eng, input: { feedWater: sanitizedFeed } });

            // 11. Consolidated Equipment Schedule
            const equipment = [
                {
                    id: "TK-101",
                    tag: "TK-101",
                    name: "Feed Water Storage Tank",
                    category: "Tanks",
                    type: "Feed Storage Tank",
                    capacity: `${(sanitizedFeed.flowRate * 60).toFixed(0)} L`,
                    flowRate: `${sanitizedFeed.flowRate} L/min`,
                    tds: `${sanitizedFeed.tds} mg/L`,
                    designStandard: "ASME Sec VIII / API 650",
                    material: "316L Stainless Steel",
                    power: "-"
                },
                {
                    id: "P-101",
                    tag: "P-101",
                    name: "Feed Water Pump",
                    category: "Pumps",
                    type: "Centrifugal Pump",
                    flowRate: `${sanitizedFeed.flowRate} L/min`,
                    pressure: `${sanitizedFeed.pressure || 1.0} bar`,
                    power: `${(eng.power * 0.05).toFixed(1)} W`,
                    designStandard: "ISO 5199 / ANSI B73.1",
                    material: "Super Duplex Stainless Steel 2507",
                    efficiency: "75%"
                },
                {
                    id: "R-101",
                    tag: `${activeTech}-101`,
                    name: `${activeTech} Desalination Core`,
                    category: "Reactors",
                    type: `${activeTech} Module`,
                    capacity: `${eng.cellPairs} cell pairs`,
                    flowRate: `${sanitizedFeed.flowRate} L/min`,
                    tds: `${sanitizedFeed.tds} -> ${eng.outletTDS} mg/L`,
                    power: `${eng.power} W`,
                    designStandard: "Electrochemical Stack Standard IEC 62282",
                    material: "Titanium Current Collectors / Graphite"
                }
            ];

            const unifiedResult = {
                input: { feedWater: sanitizedFeed, technology: activeTech },
                selectedTechnology: activeTech,
                aiRecommendation: ai,
                engineering: eng,
                electrode: elect,
                sizing: size,
                simulation: sim,
                performance: perf,
                economics,
                equipment,
                pid,
                kpi: {
                    outletTDS: eng.outletTDS,
                    removalEfficiency: eng.removalEfficiency,
                    pressureDrop: eng.pressureDrop,
                    power: eng.power,
                    flowVelocity: eng.flowVelocity,
                    SEC: eng.sec,
                    residenceTime: eng.residenceTime,
                    waterRecovery: eng.waterRecovery,
                    recovery: eng.waterRecovery,
                    currentDensity: eng.currentDensity,
                    electrodeArea: eng.electrodeArea,
                    cellPairs: eng.cellPairs,
                    stackLength: eng.stackLength
                },
                validation: {
                    status: eng.isTargetAchieved ? "TARGET ACHIEVED" : "TARGET NOT ACHIEVED",
                    messages: eng.literatureWarnings || []
                }
            };

            setDesignResult(unifiedResult);
            setDesignGenerated(true);
            return unifiedResult;
        } catch (error) {
            console.error("Recalculation error in AppContext:", error);
        }
    };

    // Clean initial state on mount: start in clean blank state with AUTO screening selected
    useEffect(() => {
        setDesignResult(null);
        setDesignGenerated(false);
    }, []);

    // Recalculate when technology changes only if a design has already been generated
    useEffect(() => {
        if (designGenerated) {
            recalculate();
        }
    }, [technology]);

    return (
        <AppContext.Provider value={{
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
            selectedComponent,
            setSelectedComponent,
            selectedEquipment,
            setSelectedEquipment,
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
            user,
            setUser,
            isAuthenticated,
            setIsAuthenticated,
            page,
            setPage,
            equations,
            setEquations,
            saveEquations,
            resetEquations,
            designGenerated,
            setDesignGenerated,
            activeStage,
            setActiveStage,
            showDesignTrace,
            setShowDesignTrace,
            showEngineeringBasis,
            setShowEngineeringBasis,
            showSelectionLogic,
            setShowSelectionLogic,
            recalculate
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}