import React from "react";
import { useApp } from "../context/AppContext";


export default function StackDesignPanel(){


const {

stack,
componentSizing,
engineering

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
!stack &&
!componentSizing
){


return(


<div className="panel">


<h2>
Stack Design
</h2>


<p>
No stack design available.
</p>


</div>


);


}






const data = stack || componentSizing;









return(


<div className="panel">



<h2>
Stack Design
</h2>



<hr/>






<table className="engineering-table">


<tbody>





<tr>

<td>
Stack Height
</td>


<td>

{
format(
data.stackHeight
)
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
format(
data.stackWidth
)
}

 mm

</td>


</tr>








<tr>

<td>
Stack Thickness
</td>


<td>

{
format(
data.stackThickness
)
}

 mm

</td>


</tr>








<tr>

<td>
Reactor Length
</td>


<td>

{
format(
data.reactorLength
)
}

 cm

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
Residence Time
</td>


<td>

{
format(
data.residenceTime
)
}

 min

</td>


</tr>






</tbody>


</table>







</div>


);


}