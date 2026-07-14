import React from "react";


export default function EquationEditor({

equations,

setEquations

}){


return(


<div className="panel">


<h2>
Engineering Equations
</h2>


<textarea

value={equations.SAC}

onChange={
e=>setEquations({

...equations,

SAC:e.target.value

})

}

/>



</div>


)


}