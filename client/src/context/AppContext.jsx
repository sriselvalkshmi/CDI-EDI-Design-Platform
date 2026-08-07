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
import { DEFAULT_EQUATIONS_DATABASE } from "../data/defaultEquationsDatabase";
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
        ph: 7.2,
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
      validation: { status: "TARGET ACHIEVED", messages: [] }
    });

    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedEquipment, setSelectedEquipment] = useState(null);

    //------------------------------------------
    // OPTIMIZATION
    //------------------------------------------

    const [optimizationMode, setOptimizationMode] = useState("AI");
    const [optimizationStatus, setOptimizationStatus] = useState("idle");
    const [optimizationError, setOptimizationError] = useState(null);
    const [optimizationInputs, setOptimizationInputs] = useState({
        voltage: 1.2,
        current: 1.45,
        cellPairs: 36,
        electrodeArea: 250,
        electrodeThickness: 0.6,
        spacerThickness: 0.5,
        flowRate: 10,
        flowVelocity: 0.036,
        residenceTime: 0.167,
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
    
    const [equations, setEquations] = useState(() => DEFAULT_EQUATIONS_DATABASE);
    const [designGenerated, setDesignGenerated] = useState(false);

    // Client-side engineering calculation engine
    const recalculate = (currentInputs = optimizationInputs, currentTech = technology, isOptimization = false, feedWaterOverride = null) => {
        const activeFeedWater = feedWaterOverride || feedWater;
        try {
            // 1. Water Chemistry Analysis
            const waterChem = analyzeWaterChemistry(activeFeedWater);

            // 2. AI Recommendation
            const ai = aiRecommendation(activeFeedWater);
            const activeTech = currentTech === "AUTO" ? (ai.selectedTechnology || "CDI") : currentTech;

            let calcInputs = { ...currentInputs };

            // 3. Engineering Equation Engine
            let eng = engineeringEquationEngine({
                technology: activeTech,
                feedWater: activeFeedWater,
                ...calcInputs
            });

            // Synchronize flowVelocity and residenceTime authoritatively from engineering calculation
            calcInputs = {
                ...calcInputs,
                flowVelocity: eng.flowVelocity,
                residenceTime: eng.residenceTime
            };

            // 4. Electrode Model
            let elect = electrodeModel(activeFeedWater, eng);

            // 5. Component Sizing
            let size = componentSizing(eng, activeTech);

            // 6. Design Optimizer
            const feedWaterWithOpt = {
                ...activeFeedWater,
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
                    flowRate: optResult.optimizedFlowRate ?? calcInputs.flowRate,
                    electrodeArea: optResult.optimizedElectrodeArea ?? calcInputs.electrodeArea,
                    cellPairs: optResult.optimizedCellPairs ?? calcInputs.cellPairs,
                    residenceTime: eng.residenceTime,
                    flowVelocity: eng.flowVelocity
                };

                // Recalculate physical equations with optimized parameters
                eng = engineeringEquationEngine({
                    technology: activeTech,
                    feedWater: activeFeedWater,
                    ...calcInputs
                });

                elect = electrodeModel(activeFeedWater, eng);
                size = componentSizing(eng, activeTech);

                setOptimizationInputs(calcInputs);
            }

            // 7. Simulation Engine
            const sim = simulationEngine(activeTech, activeFeedWater, { engineering: eng, electrode: elect });

            // 8. Performance Calculator
            const perf = performanceCalculator(activeFeedWater, sim, eng, null, elect);

            // 9. Economic & Energy Analysis
            const economics = calculateEconomics(eng, activeFeedWater);

            // 10. Dynamic Layout Generator (P&ID)
            const pid = layoutGenerator(eng, eng, activeFeedWater, sim, activeTech);

            // 11. Consolidated Equipment Schedule
            const equipment = [
                {
                    id: "TK-101",
                    tag: "TK-101",
                    name: "Feed Water Storage Tank",
                    category: "Tanks",
                    type: "Feed Storage Tank",
                    capacity: `${(activeFeedWater.flowRate * 60).toFixed(0)} L`,
                    flowRate: `${activeFeedWater.flowRate} L/min`,
                    tds: `${activeFeedWater.tds} ppm`,
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
                    flowRate: `${activeFeedWater.flowRate} L/min`,
                    pressure: `${activeFeedWater.pressure || 1.0} bar`,
                    power: `${(eng.power * 0.05).toFixed(1)} W`,
                    designStandard: "ISO 5199 / ANSI B73.1",
                    material: "Super Duplex Stainless Steel 2507",
                    efficiency: "75%"
                },
                {
                    id: "R-101",
                    tag: "R-101",
                    name: `${activeTech} Stack Module`,
                    category: "Reactors",
                    type: `${activeTech} Cell Stack`,
                    cellPairs: `${eng.cellPairs} Pairs`,
                    electrodeArea: `${eng.electrodeArea} cm²`,
                    voltage: `${eng.voltageStack} V`,
                    current: `${eng.current} A`,
                    power: `${eng.power} W`,
                    dimensions: eng.moduleDimensions || "450mm L × 450mm W × 370mm H",
                    designStandard: "ISO 10628 / IEC / ASME",
                    material: activeTech === "EDI" ? "Titanium Grade 2 / FRP" : "316L Stainless Steel / PVDF"
                },
                {
                    id: "TK-103",
                    tag: "TK-103",
                    name: "Product Water Storage Tank",
                    category: "Tanks",
                    type: "Product Storage Tank",
                    capacity: `${(activeFeedWater.flowRate * 60 * 0.95).toFixed(0)} L`,
                    flowRate: `${(activeFeedWater.flowRate * 0.95).toFixed(1)} L/min`,
                    tds: `${eng.outletTDS} ppm`,
                    designStandard: "ASME Sec VIII",
                    material: "316L Stainless Steel",
                    power: "-"
                }
            ];

            const unifiedResult = {
                input: { feedWater: activeFeedWater },
                waterChemistry: waterChem,
                aiRecommendation: ai,
                technologyEvaluation: ai.evaluations,
                selectedTechnology: activeTech,
                engineering: eng,
                optimizedEngineering: eng,
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
            return unifiedResult;
        } catch (error) {
            console.error("Recalculation error in AppContext:", error);
        }
    };

    // Recalculate only if design has already been generated by user action
    useEffect(() => {
        if (designGenerated) {
            recalculate();
        }
    }, [feedWater, technology]);

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
            designGenerated,
            setDesignGenerated,
            recalculate
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}