import React from "react";
import { useApp } from "../context/AppContext";

export default function EquipmentPanel() {

    const {
        designResult,
        selectedEquipment,
        selectedDesign
    } = useApp();

    const feedWater = designResult?.input?.feedWater;
    const engineering = designResult?.engineering;
    const simulation = designResult?.simulation;
    const equipmentList = designResult?.equipment || [];

    //----------------------------------------------------

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

    //----------------------------------------------------

    if (!designResult || !designResult.engineering) {
        return (
            <div className="panel equipment-panel">
                <h2>Equipment Properties</h2>
                <hr />
                <p>Generate a design first.</p>
            </div>
        );
    }

    if (!selectedEquipment) {

        return (

            <div className="panel equipment-panel">

                <h2>Equipment Properties</h2>

                <hr />

                {equipmentList.length > 0 ? (
                    <div>
                        <p style={{ fontSize: "12px", color: "#607D8B", marginBottom: "12px" }}>
                            Click any equipment in the P&amp;ID diagram to inspect detailed engineering properties.
                        </p>
                        <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "#F1F5F9", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
                                    <th style={{ padding: "6px 8px" }}>ID</th>
                                    <th style={{ padding: "6px 8px" }}>Equipment Name</th>
                                    <th style={{ padding: "6px 8px" }}>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipmentList.map(eq => (
                                    <tr key={eq.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                        <td style={{ padding: "6px 8px", fontWeight: "600", color: "#1565C0" }}>{eq.id}</td>
                                        <td style={{ padding: "6px 8px" }}>{eq.name}</td>
                                        <td style={{ padding: "6px 8px", textTransform: "capitalize", color: "#607D8B" }}>{eq.type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>
                        Click any equipment in the P&amp;ID diagram to display its engineering information.
                    </p>
                )}

            </div>

        );

    }

    //----------------------------------------------------
    // FEED TANK
    //----------------------------------------------------

    if (selectedEquipment.name === "Feed Tank") {

        return (

            <div className="panel equipment-panel">

                <h2>Feed Tank</h2>

                <table>

                    <tbody>

                        <tr>
                            <td>Feed TDS</td>
                            <td>{feedWater?.tds} ppm</td>
                        </tr>

                        <tr>
                            <td>Flow Rate</td>
                            <td>{feedWater?.flowRate} L/min</td>
                        </tr>

                        <tr>
                            <td>Temperature</td>
                            <td>{feedWater?.temperature} °C</td>
                        </tr>

                        <tr>
                            <td>Pressure</td>
                            <td>{feedWater?.pressure} bar</td>
                        </tr>

                    </tbody>

                </table>

            </div>

        );

    }

    //----------------------------------------------------
    // PUMP
    //----------------------------------------------------

    if (selectedEquipment.name === "Pump") {

        return (

            <div className="panel equipment-panel">

                <h2>Pump</h2>

                <table>

                    <tbody>

                        <tr>
                            <td>Flow Rate</td>
                            <td>{feedWater?.flowRate} L/min</td>
                        </tr>

                        <tr>
                            <td>Pressure</td>
                            <td>{feedWater?.pressure} bar</td>
                        </tr>

                        <tr>
                            <td>Pump Power</td>
                            <td>{format(simulation?.pumpPower,4)} W</td>
                        </tr>

                        <tr>
                            <td>Pressure Drop</td>
                            <td>{format(engineering?.pressureDrop ?? simulation?.pressureDrop)} Pa</td>
                        </tr>

                    </tbody>

                </table>

            </div>

        );

    }

    //----------------------------------------------------
    // CDI REACTOR
    //----------------------------------------------------

    if (
        selectedEquipment.name === "CDI Reactor" ||
        selectedEquipment.name === "MCDI Reactor" ||
        selectedEquipment.name === "FCDI Reactor" ||
        selectedEquipment.name === "EDI Stack"
    ) {

        return (

            <div className="panel equipment-panel">

                <h2>{selectedEquipment.name}</h2>

                <table>

                    <tbody>

                        <tr>
                            <td>Technology</td>
                            <td>{engineering?.technology || selectedDesign}</td>
                        </tr>

                        <tr>
                            <td>Voltage</td>
                            <td>{format(engineering?.voltage)} V</td>
                        </tr>

                        <tr>
                            <td>Current</td>
                            <td>{format(engineering?.current)} A</td>
                        </tr>

                        <tr>
                            <td>Power</td>
                            <td>{format(engineering?.power)} W</td>
                        </tr>

                        <tr>
                            <td>Cell Pairs</td>
                            <td>{engineering?.cellPairs ?? "-"}</td>
                        </tr>

                        <tr>
                            <td>Electrode Area</td>
                            <td>{format(engineering?.electrodeArea)} cm²</td>
                        </tr>

                        <tr>
                            <td>Residence Time</td>
                            <td>{format(engineering?.residenceTime)} min</td>
                        </tr>

                    </tbody>

                </table>

            </div>

        );

    }

    //----------------------------------------------------
    // PRODUCT TANK
    //----------------------------------------------------

    if (selectedEquipment.name === "Product Tank") {

        return (

            <div className="panel equipment-panel">

                <h2>Product Tank</h2>

                <table>

                    <tbody>

                        <tr>
                            <td>Outlet TDS</td>
                            <td>{format(simulation?.outputTDS)} ppm</td>
                        </tr>

                        <tr>
                            <td>Product Flow</td>
                            <td>{feedWater?.flowRate} L/min</td>
                        </tr>

                        <tr>
                            <td>Water Recovery</td>
                            <td>
                                {
                                    simulation?.waterRecovery != null
                                        ? `${format(simulation.waterRecovery)} %`
                                        : "-"
                                }
                            </td>
                        </tr>

                        <tr>
                            <td>Removal Efficiency</td>
                            <td>{format(simulation?.removalEfficiency)} %</td>
                        </tr>

                    </tbody>

                </table>

            </div>

        );

    }

    //----------------------------------------------------
    // DEFAULT
    //----------------------------------------------------

    return (

        <div className="panel equipment-panel">

            <h2>{selectedEquipment.name}</h2>

            <table>

                <tbody>

                    {
                        Object.entries(selectedEquipment).map(([key, value]) => {

                            if (key === "name") return null;

                            return (

                                <tr key={key}>

                                    <td>
                                        {
                                            key
                                                .replace(/([A-Z])/g, " $1")
                                                .replace(/^./, str => str.toUpperCase())
                                        }
                                    </td>

                                    <td>
                                        {
                                            typeof value === "number"
                                                ? format(value)
                                                : value
                                        }
                                    </td>

                                </tr>

                            );

                        })
                    }

                </tbody>

            </table>

        </div>

    );

}