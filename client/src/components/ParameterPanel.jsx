import React from "react";

import {useApp} from "../context/AppContext";


export default function ParameterPanel(){


const {designParameters}=useApp();



return(

<div className="panel">


<h2>
Design Parameters
</h2>


{

designParameters ?


Object.entries(designParameters).map(

([key,value])=>(

<p key={key}>

<b>{key}</b> : {value}

</p>

)

)


:

<p>
Generate design to calculate parameters
</p>


}


</div>

);


}