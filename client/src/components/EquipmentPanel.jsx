import React from "react";
import { useApp } from "../context/AppContext";


export default function EquipmentPanel() {


    const {

        selectedEquipment,
        selectedDesign,
        engineering,
        feedWater

    } = useApp();



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





    if (!selectedEquipment) {


        return (

            <div className="panel equipment-panel">


                <h2>
                    Equipment Properties
                </h2>


                <hr />



                <p>
                    Select equipment from the P&ID diagram
                    to view properties.
                </p>



                <table>


                    <tbody>


                        <tr>

                            <td>
                                Technology
                            </td>

                            <td>
                                {selectedDesign ?? "-"}
                            </td>

                        </tr>




                        <tr>

                            <td>
                                Feed TDS
                            </td>

                            <td>
                                {feedWater?.tds ?? "-"} ppm
                            </td>

                        </tr>




                        <tr>

                            <td>
                                Flow Rate
                            </td>

                            <td>
                                {feedWater?.flowRate ?? "-"} L/min
                            </td>

                        </tr>


                    </tbody>


                </table>



            </div>

        );

    }






    return (


        <div className="panel equipment-panel">



            <h2>
                {selectedEquipment.name}
            </h2>



            <hr />





            {/* EQUIPMENT DATA */}


            <table>


                <tbody>


                {

                    Object.entries(selectedEquipment)
                    .map(([key,value]) => {


                        if(key==="name")
                            return null;



                        return (

                            <tr key={key}>


                                <td>

                                    <b>

                                    {
                                    key
                                    .replace(
                                        /([A-Z])/g,
                                        " $1"
                                    )
                                    .replace(
                                        /^./,
                                        str =>
                                        str.toUpperCase()
                                    )
                                    }

                                    </b>

                                </td>



                                <td>

                                {
                                    typeof value==="number"
                                    ?
                                    format(value)
                                    :
                                    value
                                }

                                </td>



                            </tr>

                        );


                    })

                }


                </tbody>


            </table>






            <hr />






            {/* ONLY BASIC ENGINEERING */}



            <h3>
                Operating Conditions
            </h3>



            <table>


                <tbody>



                    <tr>

                        <td>
                            Technology
                        </td>

                        <td>
                            {selectedDesign ?? "-"}
                        </td>

                    </tr>





                    <tr>

                        <td>
                            Voltage
                        </td>


                        <td>
                            {
                            format(
                            engineering?.voltage
                            )
                            }
                            V
                        </td>

                    </tr>





                    <tr>

                        <td>
                            Current
                        </td>


                        <td>
                            {
                            format(
                            engineering?.current
                            )
                            }
                            A
                        </td>

                    </tr>





                    <tr>

                        <td>
                            Power
                        </td>


                        <td>
                            {
                            format(
                            engineering?.power
                            )
                            }
                            W
                        </td>

                    </tr>



                </tbody>


            </table>






        </div>


    );


}