import React from "react";
import { useApp } from "../context/AppContext";


export default function RecommendationPanel(){


const {

aiResult,
selectedDesign,
feedWater,
engineering,
simulation

}=useApp();








if(!aiResult){


return(


<div className="panel">


<h2>
AI Technology Recommendation
</h2>


<hr/>


<p>
Generate design to view AI recommendation.
</p>


</div>


);


}







const recommendation =
aiResult.recommendation ?? {};







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
AI Technology Recommendation
</h2>



<hr/>






<table className="engineering-table">


<tbody>





<tr>

<td>
Recommended Technology
</td>


<td>

<strong>

{
recommendation.technology
??
selectedDesign
??
"-"
}

</strong>


</td>


</tr>









<tr>

<td>
Confidence
</td>


<td>

{
format(
recommendation.confidence ?? 95
)
}

 %

</td>


</tr>









<tr>

<td>
Feed TDS
</td>


<td>

{
feedWater?.tds
??
aiResult.feedWater?.tds
??
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
feedWater?.targetTds
??
aiResult.feedWater?.targetTds
??
"-"
}

 ppm

</td>


</tr>






</tbody>


</table>








<hr/>







<h3>
AI Reason
</h3>






<p>

{
recommendation.reason
??
"Technology selected based on water quality parameters."
}


</p>









<hr/>







<h3>
Design Recommendation Summary
</h3>






<table className="engineering-table">


<tbody>





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
Cell Pairs
</td>


<td>

{
engineering?.cellPairs
??
"-"
}

</td>


</tr>








<tr>

<td>
Predicted Outlet TDS
</td>


<td>

{
format(
simulation?.outputTDS
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
simulation?.removalEfficiency
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