import React from "react";
import { useApp } from "../context/AppContext";


export default function RecommendationPanel(){

const {
    designResult,
    selectedDesign
} = useApp();

const aiRecommendation = designResult?.aiRecommendation;
const engineering = designResult?.engineering;
const kpi = designResult?.kpi;
const feedWater = designResult?.input?.feedWater;

if (!designResult || !designResult.aiRecommendation) {


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
aiRecommendation ?? {};







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
<td>Selected Technology</td>
<td><strong>{engineering?.technology || selectedDesign || "-"}</strong></td>
</tr>
<tr>
<td>AI Recommended Technology</td>
<td><strong>{recommendation.selectedTechnology || recommendation.technology || "-"}</strong></td>
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
    engineering?.outletTDS ?? kpi?.outletTDS
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






</tbody>


</table>






</div>


);


}