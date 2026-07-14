import React from "react";
import { useApp } from "../context/AppContext";


export default function ParameterPanel(){


const {

designParameters

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







const getUnit=(key)=>{


const name =
key.toLowerCase();



if(name.includes("tds"))
return " ppm";



if(name.includes("flow"))
return " L/min";



if(name.includes("voltage"))
return " V";



if(name.includes("current"))
return " A";



if(name.includes("pressure"))
return " bar";



if(name.includes("temperature"))
return " °C";



if(name.includes("area"))
return " cm²";



if(name.includes("thickness"))
return " mm";



if(name.includes("time"))
return " min";



return "";

};








const formatValue=(value)=>{


if(
typeof value==="number"
){

return value.toFixed(2);

}


return value;


};








return(


<div className="panel">



<h2>
Design Parameters
</h2>


<hr/>






{

designParameters ?

(


<table className="engineering-table">


<tbody>


{


Object.entries(designParameters)
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
formatValue(value)
}

{
getUnit(key)
}

</td>



</tr>


)

)


}



</tbody>


</table>


)


:


<p>
Generate design to calculate parameters.
</p>


}




</div>


);


}