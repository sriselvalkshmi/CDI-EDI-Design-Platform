import React from "react";
import { useApp } from "../context/AppContext";

export default function PerformancePanel(){

const { performance } = useApp();

if(!performance) return null;

return(

<div className="panel">

<h2>Performance Analysis</h2>

<table>

<tbody>

<tr>
<td>Inlet TDS</td>
<td>{performance.inletTDS} ppm</td>
</tr>

<tr>
<td>Outlet TDS</td>
<td>{performance.outletTDS} ppm</td>
</tr>

<tr>
<td>Salt Removed</td>
<td>{performance.saltRemoved} ppm</td>
</tr>

<tr>
<td>Removal Efficiency</td>
<td>{performance.removalEfficiency}%</td>
</tr>

<tr>
<td>Water Recovery</td>
<td>{performance.waterRecovery}%</td>
</tr>

<tr>
<td>Energy Consumption</td>
<td>{performance.energyConsumption} kWh</td>
</tr>

<tr>
<td>Specific Energy</td>
<td>{performance.specificEnergy} kWh/m³</td>
</tr>

</tbody>

</table>

</div>

);

}