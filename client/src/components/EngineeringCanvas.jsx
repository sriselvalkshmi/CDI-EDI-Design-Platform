import React from "react";

import {useApp} from "../context/AppContext";

import CellBlock from "./CellBlock";


export default function EngineeringCanvas(){


const {selectedDesign}=useApp();



return(

<div className="panel canvas">


<h2>
CDI / EDI Engineering Canvas
</h2>



<div className="water">

Raw Water

</div>



<div className="arrow">

↓

</div>




{

selectedDesign==="CDI" &&

<CellBlock title="CDI Cell">


<p>
+ Carbon Electrode
</p>


<p>
Electrosorption Layer
</p>


<p>
Flow Spacer Channel
</p>


<p>
- Carbon Electrode
</p>


</CellBlock>


}





{

selectedDesign==="MCDI" &&

<CellBlock title="MCDI Cell">


<p>
+ Electrode
</p>


<p>
Cation Exchange Membrane
</p>


<p>
Flow Channel
</p>


<p>
Anion Exchange Membrane
</p>


<p>
- Electrode
</p>


</CellBlock>


}





{

selectedDesign==="FCDI" &&

<CellBlock title="FCDI Reactor">


<p>
Positive Flow Electrode
</p>


<p>
Ion Exchange Membrane
</p>


<p>
Negative Flow Electrode
</p>


</CellBlock>


}





{

selectedDesign==="EDI" &&

<CellBlock title="EDI Stack">


<p>
Dilute Chamber
</p>


<p>
Ion Exchange Resin
</p>


<p>
Cation Membrane
</p>


<p>
Anion Membrane
</p>


<p>
Concentrate Chamber
</p>


</CellBlock>


}




<div className="arrow">

↓

</div>


<div className="water">

Product Water

</div>



</div>

);


}