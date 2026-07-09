import React from "react";
import { useApp } from "../context/AppContext";

export default function StackDesignPanel(){

    const { stack } = useApp();

    if(!stack){

        return(

            <div className="panel">

                <h2>Stack Design</h2>

                <p>No stack available.</p>

            </div>

        );

    }

    return(

        <div className="panel">

            <h2>Stack Design</h2>

            <table>

                <tbody>

                    <tr>
                        <td>Height</td>
                        <td>{stack.stackHeight} mm</td>
                    </tr>

                    <tr>
                        <td>Width</td>
                        <td>{stack.stackWidth} mm</td>
                    </tr>

                    <tr>
                        <td>Thickness</td>
                        <td>{stack.stackThickness} mm</td>
                    </tr>

                    <tr>
                        <td>Reactor Length</td>
                        <td>{stack.reactorLength} cm</td>
                    </tr>

                    <tr>
                        <td>Residence Time</td>
                        <td>{stack.residenceTime} min</td>
                    </tr>

                </tbody>

            </table>

        </div>

    );

}