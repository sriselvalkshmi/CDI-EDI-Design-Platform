import React from "react";
import { useApp } from "../context/AppContext";


export default function ResultPanel(){

const {
    designResult,
    selectedDesign
} = useApp();

const simulation = designResult?.simulation;
const engineering = designResult?.engineering;
const optimization = designResult?.optimizedEngineering;
const kpi = designResult?.kpi;

if (!designResult || !designResult.engineering) {
    return (
        <div className="panel">
            <h2>Final Design Summary</h2>
            <hr />
            <p>Generate design first.</p>
        </div>
    );
}





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







return(


<div className="panel">


<h2>
Final Design Summary
</h2>


<hr/>





<table>


<tbody>





<tr>

<td>
Technology
</td>


<td>

{
engineering?.technology || selectedDesign || "-"
}

</td>


</tr>






<tr>

<td>
Feed TDS
</td>


<td>

{
format(
    designResult?.input?.feedWater?.tds
)
}

 ppm

</td>


</tr>






<tr>

<td>
Outlet TDS
</td>


<td>

{
format(
    engineering?.outletTDS ?? kpi?.outletTDS
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
    (designResult?.input?.feedWater?.tds != null && engineering?.outletTDS != null)
        ? (designResult.input.feedWater.tds - engineering.outletTDS)
        : null
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
    engineering?.removalEfficiency ?? kpi?.removalEfficiency
)
}

 %

</td>


</tr>








<tr>

<td>
Operating Voltage
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








<tr>

<td>
Cell Pairs
</td>


<td>

{
engineering?.cellPairs ?? "-"
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
optimization?.score ??
simulation?.optimizationScore
)
}

 %

</td>


</tr>






</tbody>


</table>









<hr/>








<h3>
System Status
</h3>





<ul>


<li>
Design generation completed.
</li>


<li>
CDI / EDI simulation completed.
</li>


<li>
Hydraulic calculations completed.
</li>


<li>
AI optimization completed.
</li>


</ul>








</div>


);


}