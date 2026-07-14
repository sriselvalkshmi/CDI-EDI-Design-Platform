import React from "react";
import { useApp } from "../context/AppContext";


export default function ComponentSizing(){


const {

componentSizing

}=useApp();






const formatKey=(key)=>{


return key
.replace(
/([A-Z])/g,
" $1"
)
.replace(
/^./,
str=>str.toUpperCase()
);


};







const formatValue=(key,value)=>{


if(
value===undefined ||
value===null
){

return "-";

}





if(
typeof value==="number"
){

return Number(value).toFixed(2);

}



return value;


};








if(!componentSizing){



return(


<div className="panel">


<h2>
Component Sizing
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
Component Sizing
</h2>



<hr/>





<table className="engineering-table">


<tbody>


{


Object.entries(componentSizing)
.map(
([key,value])=>(



<tr key={key}>


<td>

<b>

{
formatKey(key)
}

</b>

</td>





<td>

{
formatValue(
key,
value
)
}





{


key.toLowerCase()
.includes("length")
&&
" mm"


}



{


key.toLowerCase()
.includes("width")
&&
" mm"


}



{


key.toLowerCase()
.includes("height")
&&
" mm"


}



{


key.toLowerCase()
.includes("thickness")
&&
" mm"


}



{


key.toLowerCase()
.includes("area")
&&
" cm²"


}



</td>




</tr>



)

)

}



</tbody>


</table>






</div>


);


}