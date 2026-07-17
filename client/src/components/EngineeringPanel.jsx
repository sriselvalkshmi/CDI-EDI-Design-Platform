import React from "react";
import { useApp } from "../context/AppContext";


export default function EngineeringPanel() {


    const {

        engineering,
        electrode,
        componentSizing,
        feedWater,
        selectedDesign,
        simulation,
        performance

    } = useApp();



    //--------------------------------------------------
    // FORMAT
    //--------------------------------------------------

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





    //--------------------------------------------------
    // NO DESIGN
    //--------------------------------------------------


    if(!engineering){


        return(

            <div className="panel">

                <h2>
                    Engineering Design Summary
                </h2>


                <p>
                    Generate a design to view engineering calculations.
                </p>


            </div>

        );


    }






    return(


    <div className="panel">


        <h2>
            Engineering Design Summary
        </h2>





        {/* SYSTEM DESIGN */}

        <h3>
            System Design
        </h3>


        <table>

        <tbody>


        <tr>

            <td>
                Technology
            </td>

            <td>
                {selectedDesign || "-"}
            </td>

        </tr>



        <tr>

            <td>
                Feed TDS
            </td>

            <td>
                {feedWater?.tds || "-"} ppm
            </td>

        </tr>




        <tr>

            <td>
                Target TDS
            </td>

            <td>
                {feedWater?.targetTds || "-"} ppm
            </td>

        </tr>





        <tr>

            <td>
                Flow Rate
            </td>

            <td>
                {feedWater?.flowRate || "-"} L/min
            </td>

        </tr>



        </tbody>

        </table>





        {/* ELECTRICAL */}


        <h3>
            Electrical Design
        </h3>


        <table>

        <tbody>


        <tr>

        <td>
            Operating Voltage
        </td>

        <td>
            {format(engineering.voltage)} V
        </td>

        </tr>




        <tr>

        <td>
            Current
        </td>

        <td>
            {format(engineering.current)} A
        </td>

        </tr>




        <tr>

        <td>
            Power
        </td>

        <td>
            {format(engineering.power)} W
        </td>

        </tr>




        <tr>

        <td>
            Current Density
        </td>


        <td>

        {
        format(
            engineering.currentDensity ??
            electrode?.currentDensity
        )
        }

        A/m²

        </td>


        </tr>



        </tbody>

        </table>








        {/* STACK DESIGN */}


        <h3>
            Stack Design
        </h3>


        <table>

        <tbody>


        <tr>

        <td>
            Electrode Area
        </td>

        <td>
        {
        format(
        engineering.electrodeArea
        )
        }

        cm²

        </td>

        </tr>





        <tr>

        <td>
            Cell Pairs
        </td>

        <td>
        {
        engineering.cellPairs || "-"
        }

        </td>

        </tr>




        <tr>

        <td>
            Residence Time
        </td>

        <td>
        {
        format(
        engineering.residenceTime
        )
        }

        min

        </td>

        </tr>





        <tr>

        <td>
            Stack Length
        </td>


        <td>

        {
        componentSizing?.stackLength ??
        engineering.stackLength ??
        "-"
        }

        mm

        </td>


        </tr>





        <tr>

        <td>
            Stack Width
        </td>


        <td>

        {
        componentSizing?.stackWidth ??
        engineering.stackWidth ??
        "-"
        }

        mm

        </td>


        </tr>





        <tr>

        <td>
            Stack Height
        </td>


        <td>

        {
        componentSizing?.stackHeight ??
        engineering.stackHeight ??
        "-"
        }

        mm

        </td>


        </tr>



        </tbody>

        </table>









        {/* ELECTRODE */}



        <h3>
            Electrode Properties
        </h3>


        <table>


        <tbody>



        <tr>

        <td>
            SAC
        </td>

        <td>

        {
        format(

            electrode?.SAC ??
            performance?.SAC ??
            engineering?.SAC

        )

        }

        mg/g

        </td>


        </tr>






        <tr>

        <td>
            Electrode Mass
        </td>

        <td>

        {
        format(

            electrode?.electrodeMass ??
            engineering?.electrodeMass

        )

        }

        g

        </td>


        </tr>






        <tr>

        <td>
            Capacitance
        </td>


        <td>

        {
        format(

            electrode?.capacitance ??
            engineering?.capacitance

        )

        }

        F

        </td>


        </tr>




        </tbody>


        </table>









        {/* HYDRAULICS */}



        <h3>
            Hydraulic Design
        </h3>


        <table>


        <tbody>



        <tr>

        <td>
            Flow Velocity
        </td>


        <td>

        {
        format(

            engineering?.flowVelocity ??
            simulation?.flowVelocity

        )

        }

        m/s

        </td>


        </tr>







        <tr>

        <td>
            Pressure Drop
        </td>


        <td>

        {
        format(

            engineering?.pressureDrop ??
            simulation?.pressureDrop,

            2

        )

        }

        Pa

        </td>


        </tr>






        <tr>

        <td>
            Pump Power
        </td>


        <td>

        {
        format(

            engineering?.pumpPower ??
            simulation?.pumpPower,

            4

        )

        }

        W

        </td>


        </tr>







        <tr>

        <td>
            Water Recovery
        </td>


        <td>

        {
        format(

            performance?.waterRecovery ??
            simulation?.waterRecovery

        )

        }

        %

        </td>


        </tr>




        </tbody>


        </table>




    </div>


    );


}