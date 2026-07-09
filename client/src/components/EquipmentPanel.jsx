import React from "react";
import { useApp } from "../context/AppContext";

export default function EquipmentPanel(){

    const {
        selectedEquipment
    } = useApp();


    if(!selectedEquipment){

        return(
            <div className="panel equipment-panel">

                <h2>Equipment Properties</h2>

                <p>
                    Click any equipment in P&amp;ID diagram
                </p>

            </div>
        );

    }


    return(

        <div className="panel equipment-panel">

            <h2>
                {selectedEquipment.name}
            </h2>


            <table>

            <tbody>

            {
                Object.entries(selectedEquipment)
                .map(([key,value])=>{

                    if(key==="name")
                    return null;


                    return(

                    <tr key={key}>

                        <td>
                            {key}
                        </td>

                        <td>
                            {value}
                        </td>

                    </tr>

                    )

                })

            }


            </tbody>

            </table>


        </div>

    );

}