import React from "react";
import { useApp } from "../context/AppContext";

export default function OptimizationPanel() {

    const { optimization } = useApp();

    if (!optimization) {
        return null;
    }

    return (
        <div className="panel">

            <h2>Design Optimization</h2>

            <table>
                <tbody>

                    <tr>
                        <td>Optimized Voltage</td>
                        <td>{optimization.optimizedVoltage} V</td>
                    </tr>

                    <tr>
                        <td>Flow Rate</td>
                        <td>{optimization.optimizedFlowRate} L/min</td>
                    </tr>

                    <tr>
                        <td>Adsorption Time</td>
                        <td>{optimization.adsorptionTime} min</td>
                    </tr>

                    <tr>
                        <td>Desorption Time</td>
                        <td>{optimization.desorptionTime} min</td>
                    </tr>

                    <tr>
                        <td>Predicted Removal</td>
                        <td>{optimization.predictedRemoval}%</td>
                    </tr>

                    <tr>
                        <td>Recovery</td>
                        <td>{optimization.recovery}%</td>
                    </tr>

                    <tr>
                        <td>Energy</td>
                        <td>{optimization.energy} kWh</td>
                    </tr>

                </tbody>
            </table>

        </div>
    );
}