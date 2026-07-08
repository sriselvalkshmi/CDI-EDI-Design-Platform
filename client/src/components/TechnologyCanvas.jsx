import React from "react";
import { useApp } from "../context/AppContext";

export default function TechnologyCanvas() {

    const { technology } = useApp();

    return (

        <div className="technologyCanvas">

            <h2>{technology} Process</h2>

            {technology === "CDI" && (
                <img src="/images/cdi.png" width="600" />
            )}

            {technology === "MCDI" && (
                <img src="/images/mcdi.png" width="600" />
            )}

            {technology === "FCDI" && (
                <img src="/images/fcdi.png" width="600" />
            )}

            {technology === "EDI" && (
                <img src="/images/edi.png" width="600" />
            )}

        </div>

    );

}