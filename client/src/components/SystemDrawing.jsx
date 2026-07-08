import React from "react";
import { useApp } from "../context/AppContext";

import CDIDrawing from "./drawing/CDIDrawing";
import MCDIDrawing from "./drawing/MCDIDrawing";
import FCDIDrawing from "./drawing/FCDIDrawing";
import EDIDrawing from "./drawing/EDIDrawing";

export default function SystemDrawing() {

  const { selectedDesign } = useApp();

  console.log("Selected Design:", selectedDesign);

  return (
    <div className="panel">

      <h2>System Layout</h2>

      <h3>{selectedDesign}</h3>

      {selectedDesign === "CDI" && <CDIDrawing />}

      {selectedDesign === "MCDI" && <MCDIDrawing />}

      {selectedDesign === "FCDI" && <FCDIDrawing />}

      {selectedDesign === "EDI" && <EDIDrawing />}

    </div>
  );
}