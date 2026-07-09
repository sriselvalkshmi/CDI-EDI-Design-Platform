import React from "react";
import { useApp } from "../context/AppContext";

export default function CDIPerformancePanel() {

    const { cdiPerformance } = useApp();

    if (!cdiPerformance) {
        return (
            <div className="panel">
                <h2>CDI Performance</h2>
                <p>No performance data available.</p>
            </div>
        );
    }

    return (

        <div className="panel">

            <h2>CDI Performance Metrics</h2>

            <table className="performance-table">

                <tbody>

                    <tr>
                        <td>Salt Removed</td>
                        <td>{cdiPerformance.saltRemoved} mg/L</td>
                    </tr>

                    <tr>
                        <td>SAC</td>
                        <td>{cdiPerformance.SAC} mg/g</td>
                    </tr>

                    <tr>
                        <td>ASAR</td>
                        <td>{cdiPerformance.ASAR} mg/g/min</td>
                    </tr>

                    <tr>
                        <td>Charge Efficiency</td>
                        <td>{cdiPerformance.chargeEfficiency} %</td>
                    </tr>

                    <tr>
                        <td>Energy</td>
                        <td>{cdiPerformance.energy} Wh</td>
                    </tr>

                    <tr>
                        <td>Specific Energy Consumption</td>
                        <td>{cdiPerformance.SEC} Wh/L</td>
                    </tr>

                </tbody>

            </table>

        </div>

    );

}