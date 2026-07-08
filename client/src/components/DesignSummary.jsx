import React from "react";
import { useApp } from "../context/AppContext";

export default function DesignSummary() {

    const {
        recommendation,
        feedWater,
        simulation,
        engineering,
        technology
    } = useApp();

    if (!recommendation || !simulation) {

        return (
            <div className="panel">
                <h2>Design Report</h2>
                <p>No design generated.</p>
            </div>
        );
    }

    const removal =
        (
            ((feedWater.tds - simulation.outputTDS) /
                feedWater.tds) *
            100
        ).toFixed(1);

    return (

        <div className="panel">

            <h2>Engineering Design Report</h2>

            <table className="engineering-table">

                <tbody>

                    <tr>
                        <td><b>Technology</b></td>
                        <td>{technology}</td>
                    </tr>

                    <tr>
                        <td><b>Feed TDS</b></td>
                        <td>{feedWater.tds} ppm</td>
                    </tr>

                    <tr>
                        <td><b>Target TDS</b></td>
                        <td>{feedWater.targetTds} ppm</td>
                    </tr>

                    <tr>
                        <td><b>Predicted Output</b></td>
                        <td>{simulation.outputTDS} ppm</td>
                    </tr>

                    <tr>
                        <td><b>Removal Efficiency</b></td>
                        <td>{removal}%</td>
                    </tr>

                    <tr>
                        <td><b>Adsorption Time</b></td>
                        <td>{simulation.adsorptionTime} min</td>
                    </tr>

                    <tr>
                        <td><b>Desorption Time</b></td>
                        <td>{simulation.desorptionTime} min</td>
                    </tr>

                    <tr>
                        <td><b>Electrode Area</b></td>
                        <td>
                            {engineering?.area?.toFixed?.(2) ?? engineering?.area} cm²
                        </td>
                    </tr>

                    <tr>
                        <td><b>Reactor Volume</b></td>
                        <td>
                            {engineering?.reactorVolume?.toFixed?.(3) ?? engineering?.reactorVolume} L
                        </td>
                    </tr>

                    <tr>
                        <td><b>EBCT</b></td>
                        <td>
                            {engineering?.ebct?.toFixed?.(2) ?? engineering?.ebct} min
                        </td>
                    </tr>

                    <tr>
                        <td><b>Status</b></td>
                        <td style={{color:"green"}}>
                            ✔ Design Feasible
                        </td>
                    </tr>

                </tbody>

            </table>

        </div>

    );

}