import React from "react";
import { useApp } from "../context/AppContext";

export default function EngineeringPanel() {

    const {

        engineering

    } = useApp();

    if (!engineering) {

        return (

            <div className="panel">

                <h2>Engineering Calculations</h2>

                <p>Generate a design first.</p>

            </div>

        );

    }

    return (

        <div className="panel">

            <h2>Engineering Calculations</h2>

            <table className="engineering-table">

                <tbody>

                    <tr>

                        <td>Electrode Area</td>

                        <td>{engineering.area.toFixed(2)} cm²</td>

                    </tr>

                    <tr>

                        <td>Reactor Volume</td>

                        <td>{engineering.reactorVolume.toFixed(4)} m³</td>

                    </tr>

                    <tr>

                        <td>EBCT</td>

                        <td>{engineering.ebct.toFixed(2)} min</td>

                    </tr>

                    <tr>

                        <td>SAC</td>

                        <td>{engineering.sac.toFixed(2)} mg/g</td>

                    </tr>

                </tbody>

            </table>

        </div>

    );

}