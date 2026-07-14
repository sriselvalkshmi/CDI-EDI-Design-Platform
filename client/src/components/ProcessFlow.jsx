import React from "react";
import { useApp } from "../context/AppContext";


export default function ProcessFlow(){


const {

selectedDesign,
setSelectedEquipment

}=useApp();



function equipment(name,type){


setSelectedEquipment({

name:name,

type:type,

status:"Running",

technology:selectedDesign


});


}




return(

<div className="panel">


<h2>
Process & Instrumentation Diagram
</h2>


<hr/>



<svg
width="900"
height="350"
>



{/* Feed Tank */}

<rect

x="40"
y="120"
width="100"
height="80"
fill="#d9f0ff"
stroke="black"
onClick={()=>equipment(
"Feed Tank",
"Storage"
)}

/>


<text
x="55"
y="165"
>
Feed Tank
</text>





{/* Pump */}

<circle

cx="220"
cy="160"
r="40"
fill="#fff3cd"
stroke="black"

onClick={()=>equipment(
"Pump",
"Hydraulic"
)}

/>


<text
x="195"
y="165"
>
Pump
</text>






{/* Flow line */}

<line

x1="140"
y1="160"
x2="180"
y2="160"

stroke="black"
strokeWidth="3"

/>






{/* Reactor */}

<rect

x="330"
y="100"
width="180"
height="120"

fill="#e6ffe6"
stroke="black"

onClick={()=>equipment(
`${selectedDesign} Reactor`,
"Desalination"
)}

>




</rect>



<text

x="360"
y="165"

fontSize="18"

>

{selectedDesign} Stack

</text>





{/* CDI */}

{

selectedDesign==="CDI" &&

<text
x="370"
y="190"
>
Activated Carbon Electrodes
</text>

}






{/* MCDI */}

{

selectedDesign==="MCDI" &&

<text
x="360"
y="190"
>
Ion Exchange Membranes
</text>

}





{/* FCDI */}

{

selectedDesign==="FCDI" &&

<text
x="360"
y="190"
>
Flow Electrodes
</text>

}





{/* EDI */}

{

selectedDesign==="EDI" &&

<text
x="370"
y="190"
>
Dilute / Concentrate
</text>

}






{/* Product Tank */}

<rect

x="700"
y="120"

width="120"

height="80"

fill="#d4edda"

stroke="black"

onClick={()=>equipment(
"Product Tank",
"Storage"
)}

>


</rect>


<text
x="715"
y="165"
>
Product Tank
</text>





{/* Connections */}

<line

x1="260"
y1="160"
x2="330"
y2="160"

stroke="black"

strokeWidth="3"

/>


<line

x1="510"
y1="160"
x2="700"
y2="160"

stroke="black"

strokeWidth="3"

/>






</svg>



<hr/>


<h3>
Current Technology:
{" "}

<b>

{selectedDesign}

</b>

</h3>



</div>


);


}