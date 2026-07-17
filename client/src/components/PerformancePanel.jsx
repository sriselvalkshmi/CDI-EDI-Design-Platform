import React from "react";
import { useApp } from "../context/AppContext";

export default function PerformancePanel(){

    const { performance, simulation } = useApp();


    const data =
        performance ||
        simulation;


    if(!data) return null;



    const format = (value, digits = 2)=>{

        if(
            value === undefined ||
            value === null ||
            isNaN(value)
        ){
            return "-";
        }

        return Number(value).toFixed(digits);

    };



return(

<div className="panel">


<h2>
Performance Analysis
</h2>



<table>


<tbody>


<tr>

<td>
Inlet TDS
</td>

<td>
{format(
    data.inputTDS
)} ppm
</td>

</tr>



<tr>

<td>
Outlet TDS
</td>

<td>
{format(
    data.outputTDS ??
    data.outletTDS
)} ppm
</td>

</tr>




<tr>

<td>
Salt Removed
</td>

<td>
{format(
    data.saltRemoval
)} ppm
</td>

</tr>





<tr>

<td>
Removal Efficiency
</td>

<td>
{format(
    data.removalEfficiency
)} %
</td>

</tr>





<tr>

<td>
Water Recovery
</td>

<td>
{format(
    data.waterRecovery
)} %
</td>

</tr>





<tr>

<td>
Voltage
</td>

<td>
{format(
    data.voltage
)} V
</td>

</tr>





<tr>

<td>
Current
</td>

<td>
{format(
    data.current
)} A
</td>

</tr>





<tr>

<td>
Power
</td>

<td>
{format(
    data.power
)} W
</td>

</tr>





<tr>

<td>
Specific Energy
</td>

<td>
{format(
    data.specificEnergy,
    5
)} kWh/m³
</td>

</tr>





<tr>

<td>
SAC
</td>

<td>
{format(
    data.SAC ??
    data.sac
)} mg/g
</td>

</tr>





<tr>

<td>
Charge Efficiency
</td>

<td>
{format(
    data.chargeEfficiency
)} %
</td>

</tr>





<tr>

<td>
Flow Velocity
</td>

<td>
{format(
    data.flowVelocity
)} m/s
</td>

</tr>





<tr>

<td>
Pressure Drop
</td>

<td>
{format(
    data.pressureDrop
)} Pa
</td>

</tr>





<tr>

<td>
Pump Power
</td>

<td>
{format(
    data.pumpPower,
    5
)} W
</td>

</tr>





<tr>

<td>
Optimization Score
</td>

<td>
{format(
    data.optimizationScore
)} %
</td>

</tr>



</tbody>


</table>


</div>

);

}