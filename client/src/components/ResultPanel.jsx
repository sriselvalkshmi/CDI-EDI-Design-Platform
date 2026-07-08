import React from "react";

import {useApp} from "../context/AppContext";

import liveCalculation from "../utils/liveCalculation";

export default function ResultPanel(){

    const{

        designComponents

    }=useApp();

    const result =
    liveCalculation(designComponents);

    return(

        <div className="panel">

            <h2>

                Live Engineering Calculation

            </h2>

            <p>

                Electrode Area :
                {result.totalArea} cm²

            </p>

            <p>

                Electrode Thickness :
                {result.totalThickness} mm

            </p>

            <p>

                Flow Rate :
                {result.flowRate} L/min

            </p>

            <p>

                Estimated Salt Removal :
                {result.estimatedRemoval} %

            </p>

        </div>

    );

}