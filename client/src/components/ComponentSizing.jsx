import React from "react";
import { useApp } from "../context/AppContext";

export default function ComponentSizing() {

    const { componentSizing } = useApp();

    if (!componentSizing) {
        return (
            <div className="panel">
                <h2>Component Sizing</h2>
                <p>No Design Generated</p>
            </div>
        );
    }

    return (
        <div className="panel">
            <h2>Component Sizing</h2>

            <table className="engineering-table">
                <tbody>
                    {Object.entries(componentSizing).map(([k, v]) => (
                        <tr key={k}>
                            <td>{k}</td>
                            <td>{v}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}