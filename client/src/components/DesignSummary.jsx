import React from "react";
import { useApp } from "../context/AppContext";
import designCalculator from "../utils/designCalculator";

export default function DesignSummary() {

    const {

        technology,

        feedWater

    } = useApp();

    const design = designCalculator(

        feedWater,

        technology

    );

    return (

        <div className="panel">

            <h2>Engineering Design</h2>

            {

                Object.entries(design).map(([key,value])=>(

                    <div
                        key={key}
                        className="design-row"
                    >

                        <span>{key}</span>

                        <span>{value}</span>

                    </div>

                ))

            }

        </div>

    );

}