import React from "react";
import { useApp } from "../context/AppContext";

export default function KPIDashboard() {

    const { simulation, feedWater } = useApp();

    if (!simulation) {
        return null;
    }

    const removal =
        (
            ((feedWater.tds - simulation.outputTDS) /
                feedWater.tds) *
            100
        ).toFixed(1);

    const energy =
        (
            simulation.voltage.reduce((a, b) => a + b, 0) *
            simulation.current.reduce((a, b) => a + b, 0) /
            simulation.time.length
        ).toFixed(2);

    const cycle =
        simulation.adsorptionTime +
        simulation.desorptionTime;

    const recovery = 95;

    return (

        <div className="kpi-grid">

            <div className="kpi-card">
                <h3>Removal Efficiency</h3>
                <h1>{removal}%</h1>
            </div>

            <div className="kpi-card">
                <h3>Energy</h3>
                <h1>{energy} Wh</h1>
            </div>

            <div className="kpi-card">
                <h3>Cycle Time</h3>
                <h1>{cycle} min</h1>
            </div>

            <div className="kpi-card">
                <h3>Water Recovery</h3>
                <h1>{recovery}%</h1>
            </div>

        </div>

    );

}