import React from "react";
import { useApp } from "../context/AppContext";

export default function ElectrodePanel() {

    const { electrode } = useApp();

    if (!electrode) {

        return (
            <div className="panel">
                <h2>Electrode Design</h2>
                <p>Generate a design first.</p>
            </div>
        );

    }

    return (

        <div className="panel">

            <h2>Electrode Design</h2>

            <table>

                <tbody>

                    <tr>
                        <td>Area</td>
                        <td>{electrode.area} cm²</td>
                    </tr>

                    <tr>
                        <td>Thickness</td>
                        <td>{electrode.thickness} cm</td>
                    </tr>

                    <tr>
                        <td>Porosity</td>
                        <td>{electrode.porosity}</td>
                    </tr>

                    <tr>
                        <td>Density</td>
                        <td>{electrode.density} g/cm³</td>
                    </tr>

                    <tr>
                        <td>Volume</td>
                        <td>{electrode.volume} cm³</td>
                    </tr>

                    <tr>
                        <td>Mass</td>
                        <td>{electrode.electrodeMass} g</td>
                    </tr>

                    <tr>
                        <td>Capacitance</td>
                        <td>{electrode.capacitance} F</td>
                    </tr>

                </tbody>

            </table>

        </div>

    );

}