import React from "react";

import {useApp} from "../context/AppContext";


export default function DesignBuilder(){


const {

designComponents,

setSelectedComponent

}=useApp();



return(

<div className="panel">


<h2>
Cell Configuration
</h2>


{

designComponents.map((item)=>(


<div

key={item.id}

className="design-item"

onClick={()=>setSelectedComponent(item)}

>


<h3>

{item.type}

</h3>


<p>

{item.name}

</p>


</div>


))


}


</div>

);


}