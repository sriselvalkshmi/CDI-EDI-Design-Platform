import React from "react";
import { useApp } from "../context/AppContext";


export default function OptimizationPanel(){


const {

optimization,
engineering,
simulation,
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







if(!optimization){


return(


<div className="panel">


<h2>
AI Optimization
</h2>


<hr/>


<p>
Generate a design to calculate AI optimization.
</p>


</div>


);


}







return(


<div className="panel">


<h2>
AI Optimization
</h2>


<hr/>





<h3>
Optimization Result
</h3>



<table>


<tbody>



<tr>

<td>
Technology
</td>


<td>

{
selectedDesign ?? "-"
}

</td>

</tr>






<tr>

<td>
Optimization Score
</td>


<td>

{
format(
optimization.score ??
simulation?.optimizationScore
)
}

 %

</td>

</tr>






<tr>

<td>
Confidence
</td>


<td>

{
format(
optimization.confidence ?? 95
)
}

 %

</td>

</tr>






</tbody>


</table>









<hr/>








<h3>
Optimized Operating Conditions
</h3>





<table>


<tbody>






<tr>

<td>
Voltage
</td>


<td>

{
format(
optimization.optimizedVoltage ??
engineering?.voltage
)
}

 V

</td>

</tr>







<tr>

<td>
Flow Rate
</td>


<td>

{
format(
optimization.optimizedFlowRate
)
}

 L/min

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
Flow Velocity
</td>


<td>

{
format(
simulation?.averageVelocity
)
}

 m/s

</td>

</tr>







<tr>

<td>
Specific Energy
</td>


<td>

{
format(
simulation?.specificEnergy,
4
)
}

 kWh/m³

</td>

</tr>





</tbody>


</table>









<hr/>








<h3>
AI Design Suggestions
</h3>



<ul>


<li>
Maintain voltage below water splitting limit.
</li>


<li>
Optimize residence time for ion transport.
</li>


<li>
Reduce spacer thickness if pressure drop increases.
</li>


<li>
Improve electrode utilization efficiency.
</li>


</ul>






</div>


);


}