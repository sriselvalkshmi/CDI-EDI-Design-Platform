import React from "react";
import { useApp } from "../context/AppContext";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceArea
} from "recharts";





function GraphCard({
    title,
    data,
    dataKey,
    unit
}) {


const adsorptionTime =
data[0]?.adsorption ?? 0;


const totalTime =
data[0]?.total ?? 20;




return(


<div className="graph-card">


<h3>
{title}
</h3>



<ResponsiveContainer
width="100%"
height={260}
>


<LineChart
data={data}
>



<ReferenceArea

x1={0}

x2={adsorptionTime}

fill="#e3f2fd"

fillOpacity={0.3}

/>





<ReferenceArea

x1={adsorptionTime}

x2={totalTime}

fill="#fff3e0"

fillOpacity={0.3}

/>






<CartesianGrid
strokeDasharray="3 3"
/>





<XAxis
dataKey="time"
/>





<YAxis />





<Tooltip />





<Legend />







<Line

type="monotone"

dataKey={dataKey}

strokeWidth={3}

stroke="#1565c0"

dot={false}

/>






</LineChart>


</ResponsiveContainer>





<p className="graph-unit">

{unit}

</p>





</div>


);

}









export default function SimulationGraphs(){



const {

simulation

}=useApp();






if(
!simulation ||
!simulation.time
){

return(


<div className="panel">


<h2>
CDI / EDI Cell Simulation
</h2>


<p>
Generate design first.
</p>


</div>


);


}







const graphData = simulation.time.map(
(t,i)=>({


time:t,



voltage:
simulation.voltage?.[i] ?? 0,



current:
simulation.current?.[i] ?? 0,



tds:
simulation.tds?.[i] ?? 0,



conductivity:
simulation.conductivity?.[i] ?? 0,



chargeEfficiency:
simulation.chargeEfficiency?.[i] ?? 0,



adsorption:
simulation.adsorptionTime ?? 0,


total:
(simulation.adsorptionTime ?? 0)
+
(simulation.desorptionTime ?? 0)



})

);







return(



<div className="panel">



<h2>
CDI / EDI Cell Dynamic Simulation
</h2>





<div className="graphs-container">





<GraphCard

title="Voltage Profile"

data={graphData}

dataKey="voltage"

unit="Voltage (V)"

/>








<GraphCard

title="Current Profile"

data={graphData}

dataKey="current"

unit="Current (A)"

/>








<GraphCard

title="TDS Removal"

data={graphData}

dataKey="tds"

unit="TDS (ppm)"

/>








<GraphCard

title="Conductivity"

data={graphData}

dataKey="conductivity"

unit="µS/cm"

/>








<GraphCard

title="Charge Efficiency"

data={graphData}

dataKey="chargeEfficiency"

unit="Λ"

/>






</div>




</div>


);


}