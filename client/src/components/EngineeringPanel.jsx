import React from "react";
import { useApp } from "../context/AppContext";

export default function EquipmentPanel() {

    const {
        selectedEquipment,
        feedWater,
        engineering,
        simulation,
        stack,
        selectedDesign
    } = useApp();

    if (!selectedEquipment) {

        return (
            <div className="panel">
                <h2>Equipment Properties</h2>
                <p>Click any equipment in the P&amp;ID diagram.</p>
            </div>
        );

    }

    switch (selectedEquipment) {

        case "Feed Tank":

            return (

                <div className="panel">

                    <h2>Feed Tank</h2>

                    <table>

                        <tbody>

                            <tr>
                                <td>TDS</td>
                                <td>{feedWater.tds} ppm</td>
                            </tr>

                            <tr>
                                <td>Flow Rate</td>
                                <td>{feedWater.flowRate} L/min</td>
                            </tr>

                            <tr>
                                <td>Pressure</td>
                                <td>{feedWater.pressure} bar</td>
                            </tr>

                            <tr>
                                <td>Temperature</td>
                                <td>{feedWater.temperature} °C</td>
                            </tr>

                            <tr>
                                <td>pH</td>
                                <td>{feedWater.ph}</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            );

        case "Flow Meter":

            return (

                <div className="panel">

                    <h2>Flow Meter</h2>

                    <table>

                        <tbody>

                            <tr>
                                <td>Measured Flow</td>
                                <td>{feedWater.flowRate} L/min</td>
                            </tr>

                            <tr>
                                <td>Status</td>
                                <td>Running</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            );

        case "Pump":

            return (

                <div className="panel">

                    <h2>Pump</h2>

                    <table>

                        <tbody>

                            <tr>
                                <td>Voltage</td>
                                <td>{engineering.voltage} V</td>
                            </tr>

                            <tr>
                                <td>Current</td>
                                <td>{engineering.current} A</td>
                            </tr>

                            <tr>
                                <td>Power</td>
                                <td>{engineering.power} W</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            );

        case "Pressure Gauge":

            return (

                <div className="panel">

                    <h2>Pressure Gauge</h2>

                    <table>

                        <tbody>

                            <tr>
                                <td>Pressure</td>
                                <td>{feedWater.pressure} bar</td>
                            </tr>

                            <tr>
                                <td>Status</td>
                                <td>Normal</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            );

        case "Conductivity Sensor":

            return (

                <div className="panel">

                    <h2>Conductivity Sensor</h2>

                    <table>

                        <tbody>

                            <tr>
                                <td>Conductivity</td>
                                <td>{feedWater.conductivity} μS/cm</td>
                            </tr>

                            <tr>
                                <td>Status</td>
                                <td>Monitoring</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            );

        case "CDI Reactor":
        case "MCDI Reactor":
        case "FCDI Reactor":
        case "EDI Reactor":

            return (

                <div className="panel">

                    <h2>{selectedDesign} Reactor</h2>

                    <table>

                        <tbody>

                            <tr>
                                <td>Electrode Area</td>
                                <td>{engineering.electrodeArea} cm²</td>
                            </tr>

                            <tr>
                                <td>Current Density</td>
                                <td>{engineering.currentDensity} A/cm²</td>
                            </tr>

                            <tr>
                                <td>Voltage</td>
                                <td>{engineering.voltage} V</td>
                            </tr>

                            <tr>
                                <td>Current</td>
                                <td>{engineering.current} A</td>
                            </tr>

                            <tr>
                                <td>Residence Time</td>
                                <td>{stack?.residenceTime} min</td>
                            </tr>

                            <tr>
                                <td>Stack Thickness</td>
                                <td>{stack?.stackThickness} mm</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            );

        case "Product Tank":

            return (

                <div className="panel">

                    <h2>Product Tank</h2>

                    <table>

                        <tbody>

                            <tr>
                                <td>Outlet TDS</td>
                                <td>{simulation.outputTDS} ppm</td>
                            </tr>

                            <tr>
                                <td>Salt Removal</td>
                                <td>{simulation.saltRemoval}%</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            );

        default:

            return (

                <div className="panel">

                    <h2>Equipment Properties</h2>

                    <p>No properties available.</p>

                </div>

            );

    }

}