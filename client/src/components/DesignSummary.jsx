import React from "react";
import { useApp } from "../context/AppContext";


export default function DesignSummary(){


const {

feedWater,
simulation,
engineering,
selectedDesign

}=useApp();







const format=(value,digits=2)=>{


if(
value===undefined ||
value===null ||
isNaN(value)
){

return "-";

}


return Number(value).toFixed(digits);


};








if(
!simulation
){


return(


<div className="panel">


<h2>
Engineering Design Report
</h2>


<p>
No design generated.
</p>


</div>


);


}








return(


<div className="panel">



<h2>
Engineering Design Report
</h2>


<hr/>





<table className="engineering-table">


<tbody>





<tr>

<td>
Technology
</td>


<td>

{
selectedDesign ??
"-"
}

</td>


</tr>








<tr>

<td>
Feed TDS
</td>


<td>

{
feedWater?.tds ??
"-"
}

 ppm

</td>


</tr>








<tr>

<td>
Target TDS
</td>


<td>

{
feedWater?.targetTds ??
"-"
}

 ppm

</td>


</tr>








<tr>

<td>
Predicted Outlet TDS
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
Salt Removed
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
Adsorption Time
</td>


<td>

{
format(
simulation.adsorptionTime
)
}

 min

</td>


</tr>








<tr>

<td>
Desorption Time
</td>


<td>

{
format(
simulation.desorptionTime
)
}

 min

</td>


</tr>








<tr>

<td>
Electrode Area
</td>


<td>

{
format(
engineering?.electrodeArea
)
}

 cm²

</td>


</tr>








<tr>

<td>
Reactor Volume
</td>


<td>

{
format(
engineering?.reactorVolume,
3
)
}

 L

</td>


</tr>








<tr>

<td>
Residence Time
</td>


<td>

{
format(
engineering?.residenceTime
)
}

 min

</td>


</tr>






<tr>

<td>
Status
</td>


<td style={{
color:"green",
fontWeight:"bold"
}}>

✔ Design Feasible

</td>


</tr>





</tbody>


</table>






</div>


);


}