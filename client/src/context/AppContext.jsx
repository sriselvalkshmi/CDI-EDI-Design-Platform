import React, { createContext, useContext, useState } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {

    const [technology, setTechnology] = useState("CDI");
     
    const [performance,setPerformance]=useState(null);
    const [optimization, setOptimization] = useState(null);
    const [electrode,setElectrode]=useState(null);
    const [selectedDesign, setSelectedDesign] = useState("CDI");

    const [simulation, setSimulation] = useState(null);

    const [designParameters, setDesignParameters] = useState(null);

    const [engineering, setEngineering] = useState(null);

    const [componentSizing, setComponentSizing] = useState(null);

    const [selectedComponent, setSelectedComponent] = useState(null);

    const [loading, setLoading] = useState(false);

    const [selectedEquipment,setSelectedEquipment]=useState(null);

    const [aiResult, setAiResult] = useState(null);

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

    const [designComponents, setDesignComponents] = useState([

        {
            id: 1,
            type: "Electrode",
            name: "Carbon Electrode",
            area: 250,
            thickness: 0.5,
            material: "Activated Carbon"
        },

        {
            id: 2,
            type: "Spacer",
            name: "Flow Channel",
            height: 1,
            flowRate: 10
        },

        {
            id: 3,
            type: "Electrode",
            name: "Carbon Electrode",
            area: 250,
            thickness: 0.5,
            material: "Activated Carbon"
        }

    ]);

    return (

        <AppContext.Provider

            value={{

                technology,
                setTechnology,

                selectedDesign,
                setSelectedDesign,

                feedWater,
                setFeedWater,

                aiResult,
                setAiResult,

                designParameters,
                setDesignParameters,

                simulation,
                setSimulation,

                engineering,
                setEngineering,

                componentSizing,
                setComponentSizing,

                designComponents,
                setDesignComponents,

                selectedComponent,
                setSelectedComponent,

                performance,
                setPerformance,

                optimization,
                setOptimization,

                electrode,
                setElectrode,

                selectedEquipment,
                setSelectedEquipment,

                loading,
                setLoading

            }}

        >

            {children}

        </AppContext.Provider>

    );

}

export function useApp() {

    return useContext(AppContext);

}