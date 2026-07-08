import React from "react";
import { useApp } from "../context/AppContext";

export default function ComponentEditor() {

    const {
        selectedComponent,
        designComponents,
        setDesignComponents,
        setSelectedComponent
    } = useApp();

    if (!selectedComponent) {
        return (
            <div className="panel">
                <h2>Component Parameters</h2>
                <p>Select a component</p>
            </div>
        );
    }

    const updateValue = (field, value) => {

        const updated = designComponents.map((item) => {

            if (item.id === selectedComponent.id) {

                return {
                    ...item,
                    [field]: value
                };

            }

            return item;

        });

        setDesignComponents(updated);

        const current = updated.find(
            item => item.id === selectedComponent.id
        );

        setSelectedComponent(current);

    };

    return (

        <div className="panel">

            <h2>{selectedComponent.type}</h2>

            {
                selectedComponent.type === "Electrode" && (
                    <>

                        <label>Material</label>

                        <input
                            value={selectedComponent.material}
                            onChange={(e)=>updateValue("material",e.target.value)}
                        />

                        <label>Area (cm²)</label>

                        <input
                            type="number"
                            value={selectedComponent.area}
                            onChange={(e)=>updateValue("area",Number(e.target.value))}
                        />

                        <label>Thickness (mm)</label>

                        <input
                            type="number"
                            value={selectedComponent.thickness}
                            onChange={(e)=>updateValue("thickness",Number(e.target.value))}
                        />

                    </>
                )
            }

            {
                selectedComponent.type === "Spacer" && (
                    <>

                        <label>Height (mm)</label>

                        <input
                            type="number"
                            value={selectedComponent.height}
                            onChange={(e)=>updateValue("height",Number(e.target.value))}
                        />

                        <label>Flow Rate (L/min)</label>

                        <input
                            type="number"
                            value={selectedComponent.flowRate}
                            onChange={(e)=>updateValue("flowRate",Number(e.target.value))}
                        />

                    </>
                )
            }

        </div>

    );

}