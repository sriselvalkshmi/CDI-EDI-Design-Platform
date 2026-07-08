import React from "react";
import { useApp } from "../context/AppContext";

export default function RecommendationPanel() {

    const { aiResult } = useApp();

    if (!aiResult) {

        return (
            <div className="panel">
                <h2>AI Recommendation</h2>
                <p>No recommendation yet.</p>
            </div>
        );

    }

    const recommendation = aiResult.recommendation;

    return (

        <div className="panel">

            <h2>AI Recommendation</h2>

            <div className="recommendation-box">

                <h1>{recommendation.technology}</h1>

                <h3>
                    Confidence: {recommendation.confidence}%
                </h3>

                <p>
                    {recommendation.reason}
                </p>

            </div>

            <h3>Technology Scores</h3>

            <table className="engineering-table">

                <tbody>

                    <tr>
                        <td>CDI</td>
                        <td>{recommendation.scores.CDI}</td>
                    </tr>

                    <tr>
                        <td>MCDI</td>
                        <td>{recommendation.scores.MCDI}</td>
                    </tr>

                    <tr>
                        <td>FCDI</td>
                        <td>{recommendation.scores.FCDI}</td>
                    </tr>

                    <tr>
                        <td>EDI</td>
                        <td>{recommendation.scores.EDI}</td>
                    </tr>

                </tbody>

            </table>

        </div>

    );

}