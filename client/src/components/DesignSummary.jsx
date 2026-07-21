import React from "react";
import { useApp } from "../context/AppContext";

export default function DesignSummary() {

    const {
        designResult,
        selectedDesign
    } = useApp();

    const feedWater = designResult?.input?.feedWater;
    const simulation = designResult?.simulation;
    const optimization = designResult?.optimizedEngineering;
    const kpi = designResult?.kpi;

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

    if (!designResult || !designResult.simulation) {

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
                        <td>{designResult?.engineering?.technology || selectedDesign || "-"}</td>
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
                        <td>{format(designResult?.engineering?.outletTDS ?? kpi?.outletTDS)} ppm</td>
                    </tr>

                    <tr>
                        <td>Removal Efficiency</td>
                        <td>{format(designResult?.engineering?.removalEfficiency ?? kpi?.removalEfficiency)} %</td>
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