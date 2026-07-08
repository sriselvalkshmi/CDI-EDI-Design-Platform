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


function GraphCard({title, data, dataKey, unit}) {

    return (

        <div className="graph-card">


            <h3>
                {title}
            </h3>


            <ResponsiveContainer width="100%" height={280}>


                <LineChart data={data}>


                    <CartesianGrid 
                        strokeDasharray="3 3"
                    />


                    {/* Adsorption Region */}

                    <ReferenceArea

                        x1={0}

                        x2={20}

                        label="Adsorption"

                    />



                    {/* Desorption Region */}

                    <ReferenceArea

                        x1={20}

                        x2={30}

                        label="Desorption"

                    />




                    <XAxis

                        dataKey="time"

                        label={{
                            value:"Time (min)",
                            position:"insideBottom"
                        }}

                    />



                    <YAxis

                        label={{
                            value:unit,
                            angle:-90,
                            position:"insideLeft"
                        }}

                    />



                    <Tooltip />


                    <Legend />



                    <Line

                        type="monotone"

                        dataKey={dataKey}

                        strokeWidth={2}

                        dot={false}

                    />


                </LineChart>


            </ResponsiveContainer>


        </div>

    );

}




export default function SimulationGraphs(){


    const {simulation}=useApp();



    if(!simulation || !simulation.time){

        return(

            <div className="panel">

                <h2>
                    Simulation Graphs
                </h2>

                <p>
                    Generate design to view simulation
                </p>

            </div>

        );

    }


    const graphData = simulation.time.map((t,i)=>({

    time:t,

    voltage:simulation.voltage[i],

    current:simulation.current[i],

    tds:simulation.tds[i],

    cycle:
        t <= simulation.adsorptionTime
        ?
        "Adsorption"
        :
        "Desorption"

}));



    return(

        <div className="panel">


            <h2>
                CDI Cell Dynamic Simulation
            </h2>



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

                title="TDS Removal Curve"

                data={graphData}

                dataKey="tds"

                unit="TDS (ppm)"

            />



        </div>

    );

}