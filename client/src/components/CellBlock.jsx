import React from "react";


export default function CellBlock({title,children}){


return(

<div className="cell-block">


<h3>
{title}
</h3>


<div>

{children}

</div>


</div>

);


}