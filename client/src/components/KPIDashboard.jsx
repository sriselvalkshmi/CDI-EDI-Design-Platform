import React from "react";
import { useApp } from "../context/AppContext";


export default function KPIDashboard(){


    const {

        simulation,
        engineering

    } = useApp();





    const format=(value,digits=2)=>{


        if(
            value === undefined ||
            value === null ||
            isNaN(value)
        ){

            return "-";

        }


        return Number(value).toFixed(digits);


    };






    if(!simulation){


        return(


            <div className="panel">


                <h2>
                    System Performance KPI
                </h2>


                <p>
                    Generate design to display performance.
                </p>


            </div>


        );


    }






    return(


        <div className="panel">



            <h2>
                System Performance KPI
            </h2>


            <hr />





            <table>


            <tbody>




            <tr>

                <td>
                    Outlet TDS
                </td>


                <td>

                {
                format(
                    simulation.outputTDS
                )
                }

                ppm

                </td>


            </tr>







            <tr>

                <td>
                    Salt Removal
                </td>


                <td>

                {
                format(
                    simulation.saltRemoval
                )
                }

                ppm

                </td>


            </tr>







            <tr>

                <td>
                    Removal Efficiency
                </td>


                <td>

                {
                format(
                    simulation.removalEfficiency
                )
                }

                %

                </td>


            </tr>







            <tr>

                <td>
                    Power Consumption
                </td>


                <td>


                {

                format(

                    engineering?.power ??
                    (
                    simulation.averageVoltage *
                    simulation.averageCurrent
                    )

                )

                }


                W


                </td>


            </tr>








            <tr>

                <td>
                    Specific Energy
                </td>


                <td>


                {

                format(
                    simulation.specificEnergy,
                    4
                )

                }


                kWh/m³


                </td>


            </tr>








            <tr>

                <td>
                    Flow Velocity
                </td>


                <td>


                {

                format(
                    simulation.averageVelocity
                )

                }


                m/s


                </td>


            </tr>





            </tbody>


            </table>



        </div>


    );


}