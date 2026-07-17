import React from "react";
import { useApp } from "../context/AppContext";

export default function DesignSummary() {

    const {

        feedWater,
        simulation,
        optimization,
        selectedDesign

    } = useApp();

    //------------------------------------------------------

    const format = (value, digits = 2) => {

        if (
            value === undefined ||
            value === null ||
            isNaN(value)
        ) {
            return "-";
        }

        return Number(value).toFixed(digits);

    };

    //------------------------------------------------------

    if (!simulation) {

        return (

            <div className="panel">

                <h2>Final Design Summary</h2>

                <p>No design generated.</p>

            </div>

        );

    }

    //------------------------------------------------------

    return (

        <div className="panel">

            <h2>Final Design Summary</h2>

            <hr />

            <table className="engineering-table">

                <tbody>

                    <tr>
                        <td>Technology</td>
                        <td>{selectedDesign ?? "-"}</td>
                    </tr>

                    <tr>
                        <td>Feed TDS</td>
                        <td>{feedWater?.tds ?? "-"} ppm</td>
                    </tr>

                    <tr>
                        <td>Target TDS</td>
                        <td>{feedWater?.targetTds ?? "-"} ppm</td>
                    </tr>

                    <tr>
                        <td>Predicted Outlet TDS</td>
                        <td>{format(simulation?.outputTDS)} ppm</td>
                    </tr>

                    <tr>
                        <td>Removal Efficiency</td>
                        <td>{format(simulation?.removalEfficiency)} %</td>
                    </tr>

                    <tr>
                        <td>Specific Energy</td>
                        <td>{format(simulation?.specificEnergy, 4)} kWh/m³</td>
                    </tr>

                    <tr>
                        <td>Optimization Score</td>
                        <td>
                            {format(
                                optimization?.score ??
                                simulation?.optimizationScore
                            )} %
                        </td>
                    </tr>

                    <tr>
                        <td>Status</td>

                        <td
                            style={{
                                color: "green",
                                fontWeight: "bold"
                            }}
                        >
                            ✔ Design Feasible
                        </td>
                    </tr>

                </tbody>

            </table>

        </div>

    );

}