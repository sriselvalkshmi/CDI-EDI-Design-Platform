import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { useApp } from "../../context/AppContext";

/**
 * Parametric 3D Engineering / CAD Visualization Panel
 * Dedicated Light Engineering CAD View theme (#F8FAFC background, bright lighting,
 * graphite electrodes, cyan AEM, amber CEM, teal spacers, white CAD callout tags).
 */
export default function CAD3DStackViewer({ technology: propTech }) {
    const { designResult, technology: contextTech, setTechnology } = useApp();

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const labelRendererRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const animationFrameRef = useRef(null);
    const stackGroupRef = useRef(null);
    const particlesGroupRef = useRef(null);
    const dimensionsGroupRef = useRef(null);
    const labelsGroupRef = useRef(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const resizeObserverRef = useRef(null);

    // Extract engineering parameters & authoritative single source of truth technology derivation
    const eng = designResult?.engineering || {};
    const feedWater = designResult?.input?.feedWater || {};

    const activeTech = designResult?.selectedTechnology || eng.technology || propTech || (contextTech !== "AUTO" ? contextTech : null) || "MCDI";
    const tech = activeTech;

    const technologyLabel = activeTech === "PROCESS_TRAIN" ? "PROCESS TRAIN" : activeTech;

    // UI & Viewer Controls State
    const [displayMode, setDisplayMode] = useState("NORMAL"); // "NORMAL", "EXPLODED", "SECTION", "FLOW", "ELECTRICAL", "DIMENSIONS"
    const [explosionDistance, setExplosionDistance] = useState(0.8);
    const [sectionAxis, setSectionAxis] = useState("X");
    const [sectionOffset, setSectionOffset] = useState(0);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [webglSupported, setWebglSupported] = useState(true);

    // Visibility toggles
    const [layerVisibility, setLayerVisibility] = useState({
        endPlates: true,
        electrodes: true,
        aem: true,
        cem: true,
        spacers: true,
        slurry: true,
        resin: true,
        terminals: true,
        dimensions: true,
        flow: true,
        labels: true
    });
    
    // Panel overlay collapse states
    const [telemetryOpen, setTelemetryOpen] = useState(true);
    const [dimensionsOpen, setDimensionsOpen] = useState(true);
    
    // Engineering metrics with fallbacks
    const cellVoltage = Number(eng.voltageCell || 1.40);
    const numberOfModules = Number(eng.numberOfModules || 1);
    const pairsPerModule = Number(eng.pairsPerModule || (eng.cellPairs ? Math.round(eng.cellPairs / numberOfModules) : 34));
    const totalCellPairs = Number(eng.cellPairs || 34);
    const moduleVoltage = Number(eng.voltageModule || (pairsPerModule * cellVoltage));
    const stackVoltageSeries = Number(eng.voltageStack || (totalCellPairs * cellVoltage));
    const bankVoltage = Number(eng.voltageBank || moduleVoltage);
    const systemVoltage = stackVoltageSeries;

    const electrodeArea = Number(eng.electrodeArea || 350); // cm²
    const electrodeThickness = Number(eng.electrodeThickness || 0.60); // mm
    const membraneThickness = Number(eng.membraneThickness || 0.15); // mm
    const spacerThickness = Number(eng.spacerThickness || 0.50); // mm
    
    const flowRate = Number(eng.flowRate || feedWater.flowRate || 10.0); // L/min
    const flowVelocity = Number(eng.flowVelocity !== undefined ? eng.flowVelocity : 0.052); // m/s
    const residenceTime = Number(eng.residenceTime || 0.045); // min
    const pressureDrop = Number(eng.pressureDrop || 406); // Pa

    const feedTDS = Number(feedWater.tds || 50);
    const targetTDS = Number(feedWater.targetTds || 10);
    const outletTDS = Number(eng.outletTDS || 10);
    const waterRecovery = Number(eng.waterRecovery || 95.0);

    const moduleCurrent = Number(eng.moduleCurrent || eng.current || 0.40);
    const bankCurrent = Number(eng.bankCurrent || (numberOfModules > 1 ? moduleCurrent * numberOfModules : moduleCurrent));
    const operatingCurrent = bankCurrent;
    const modulePower = Number(eng.power || eng.stackElectricalPowerW || (moduleVoltage * moduleCurrent) || 175.2);
    const bankPower = Number(numberOfModules > 1 ? (modulePower * numberOfModules) : modulePower);
    const power = modulePower;
    const currentDensity = Number(eng.currentDensity || 11.4); // A/m²

    // Pretreatment EDI Envelope check
    const ediDirectFeedFeasible = eng.ediDirectFeedFeasible !== false;
    const isEdiWarning = tech === "EDI" && (!ediDirectFeedFeasible || feedTDS > 30);

    // Derived physical stack dimensions (mm)
    const sideDimMm = Math.round(Math.sqrt(electrodeArea) * 10) || 190; // mm (Width/Length)
    const pairThicknessMm = (electrodeThickness * 2) + spacerThickness + (tech !== "CDI" ? membraneThickness * 2 : 0);
    const totalThicknessMm = Math.round(totalCellPairs * pairThicknessMm + 40); // mm with endplates

    // Visual scale factor (world units: 1 unit = 100mm)
    const widthScale = (sideDimMm / 100);
    const lengthScale = (sideDimMm / 100);
    
    // Clamp visual pairs for proportional CAD visualization and snappy interaction (representative periodic stack)
    const visualPairs = Math.min(8, Math.max(5, Math.round(totalCellPairs / 10)));

    // Fit Camera to Model Bounding Box (True 3/4 Engineering Isometric Vantage)
    const handleFitModel = useCallback(() => {
        if (!cameraRef.current || !controlsRef.current || !stackGroupRef.current) return;
        const stackGroup = stackGroupRef.current;
        const bbox = new THREE.Box3().setFromObject(stackGroup);
        if (bbox.isEmpty()) return;

        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = cameraRef.current.fov * (Math.PI / 180);
        let cameraDist = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.95;
        cameraDist = Math.max(5.8, cameraDist);
        
        // True 3/4 Isometric Perspective (45 deg azimuth, 26 deg elevation)
        // Shows top clamping plate, tie rods, side nozzles, and alternating cell pairs cleanly within viewport
        const elevationAngle = 0.45; // ~26 degrees above horizon
        const azimuthAngle = Math.PI / 4; // 45 degrees
        const ox = cameraDist * Math.cos(elevationAngle) * Math.sin(azimuthAngle);
        const oy = cameraDist * Math.sin(elevationAngle);
        const oz = cameraDist * Math.cos(elevationAngle) * Math.cos(azimuthAngle);

        cameraRef.current.position.set(center.x + ox, center.y + oy, center.z + oz);
        cameraRef.current.lookAt(center);
        
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
    }, []);

    // Camera Reset
    const handleResetCamera = useCallback(() => {
        handleFitModel();
    }, [handleFitModel]);

    // Check WebGL context support
    useEffect(() => {
        try {
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (!gl) {
                setWebglSupported(false);
            }
        } catch (e) {
            setWebglSupported(false);
        }
    }, []);

    // Three.js Scene Setup & Parametric Geometry Generation Loop
    useEffect(() => {
        if (!webglSupported || !canvasRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const initialWidth = container.clientWidth || 800;
        const initialHeight = container.clientHeight || 420;

        // 1. LIGHT CAD SCENE & RENDERERS
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xF8FAFC);
        sceneRef.current = scene;

        // WebGL Renderer with clear color #F8FAFC
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        renderer.setSize(initialWidth, initialHeight, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0xF8FAFC, 1);
        renderer.localClippingEnabled = true;
        rendererRef.current = renderer;

        // CSS2D Label Renderer
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(initialWidth, initialHeight);
        labelRenderer.domElement.style.position = "absolute";
        labelRenderer.domElement.style.top = "0px";
        labelRenderer.domElement.style.left = "0px";
        labelRenderer.domElement.style.pointerEvents = "none";
        labelRendererRef.current = labelRenderer;

        // Clean up existing labels before appending
        const existingLabels = container.querySelectorAll(".css2d-label-layer");
        existingLabels.forEach(el => el.remove());
        labelRenderer.domElement.classList.add("css2d-label-layer");
        container.appendChild(labelRenderer.domElement);

        // 2. CAMERA & CONTROLS
        const camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 0.1, 100);
        camera.position.set(5.5, 3.2, 5.5);
        cameraRef.current = camera;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 18.0;
        controls.minDistance = 1.2;
        controlsRef.current = controls;

        // 3. BRIGHT ENGINEERING LIGHTING SETUP (Light CAD theme)
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2.2);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.4);
        keyLight.position.set(6, 12, 8);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xE2E8F0, 1.8);
        fillLight.position.set(-6, 6, -5);
        scene.add(fillLight);

        const frontLight = new THREE.DirectionalLight(0xFFFFFF, 1.6);
        frontLight.position.set(2, 4, 7);
        scene.add(frontLight);

        const underLight = new THREE.DirectionalLight(0xCBD5E1, 0.9);
        underLight.position.set(0, -6, 0);
        scene.add(underLight);

        // Materials Setup (Clean, luminous industrial CAD palette - low metalness avoids black reflections)
        const endPlateMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.15, roughness: 0.35, name: "Stainless Steel End Plate" });
        const boltMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.25, roughness: 0.25, name: "Tie Rod Clamping Bolt" });
        const nutMat = new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.2, roughness: 0.3, name: "Brass Clamping Hex Nut" });
        const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.05, roughness: 0.65, name: "Porous Carbon Electrode" });
        const aemMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.3, transparent: true, opacity: 0.92, name: "Cyan AEM Membrane" });
        const cemMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.3, transparent: true, opacity: 0.92, name: "Amber CEM Membrane" });
        const spacerMat = new THREE.MeshStandardMaterial({ color: 0x10B981, roughness: 0.35, transparent: true, opacity: 0.88, name: "Emerald Flow Spacer" });
        const slurryMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.08, name: "Flowing Carbon Slurry Chamber" });
        const cationResinMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.3, name: "Cation Resin Bead" });
        const anionResinMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.3, name: "Anion Resin Bead" });
        const terminalAnodeMat = new THREE.MeshStandardMaterial({ color: 0xEF4444, metalness: 0.2, roughness: 0.3, name: "Anode Busbar (+V)" });
        const terminalCathodeMat = new THREE.MeshStandardMaterial({ color: 0x2563EB, metalness: 0.2, roughness: 0.3, name: "Cathode Busbar (-V)" });
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, metalness: 0.2, roughness: 0.3, name: "Feed Water Inlet Pipe" });
        const prodPipeMat = new THREE.MeshStandardMaterial({ color: 0x16A34A, metalness: 0.2, roughness: 0.3, name: "Product Water Outlet Pipe" });
        const concPipeMat = new THREE.MeshStandardMaterial({ color: 0xEA580C, metalness: 0.2, roughness: 0.3, name: "Concentrate Reject Pipe" });
        const flangeMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.2, roughness: 0.35, name: "Piping Flange" });

        // 6. CUTAWAY SECTION CLIPPING PLANE SETUP
        let clipPlane = null;
        if (displayMode === "SECTION") {
            if (sectionAxis === "X") clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), sectionOffset);
            else if (sectionAxis === "Y") clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), sectionOffset);
            else clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), sectionOffset);
            renderer.clippingPlanes = [clipPlane];
        } else {
            renderer.clippingPlanes = [];
        }

        // 7. BUILD PARAMETRIC ASSEMBLY
        const isExp = displayMode === "EXPLODED";
        const expGap = isExp ? explosionDistance : 0.012; // 12mm visual relief in standard mode ensures distinct layer stratification

        const plateW = Math.min(2.1, Math.max(1.6, widthScale));
        const plateD = plateW;
        const endPlateThickness = 0.16;
        const layerThick = isExp ? 0.08 : 0.055;

        const layersPerPair = tech === "FCDI" ? 5 : (tech === "CDI" ? 3 : (tech === "MCDI" ? 5 : 4));
        const totalStackHeight = (visualPairs * layersPerPair * (layerThick + expGap)) + (endPlateThickness * 2) + 0.35;
        let currentY = -totalStackHeight / 2 + 0.1;

        // 4. LIGHT GRAY/BLUE CAD GRID (Placed right below bottom end plate)
        const grid = new THREE.GridHelper(12, 24, 0x94A3B8, 0xCBD5E1);
        grid.material.transparent = true;
        grid.material.opacity = 0.55;
        grid.position.y = -totalStackHeight / 2 - 0.25;
        scene.add(grid);

        // 5. STACK GEOMETRY GROUPS
        const stackGroup = new THREE.Group();
        scene.add(stackGroup);
        stackGroupRef.current = stackGroup;

        const particlesGroup = new THREE.Group();
        scene.add(particlesGroup);
        particlesGroupRef.current = particlesGroup;

        const dimensionsGroup = new THREE.Group();
        scene.add(dimensionsGroup);
        dimensionsGroupRef.current = dimensionsGroup;

        const labelsGroup = new THREE.Group();
        scene.add(labelsGroup);
        labelsGroupRef.current = labelsGroup;

        // CAD Edge Line Helper
        const edgeLineMat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.45 });
        const addCadLayer = (geometry, material, posY, userData = null) => {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = posY;
            if (userData) mesh.userData = userData;
            stackGroup.add(mesh);

            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, edgeLineMat);
            line.position.y = posY;
            stackGroup.add(line);
            return mesh;
        };

        // Helper to create HTML 3D CSS2D Callout Labels (White cards with colored borders and dots)
        const add3DLabel = (text, x, y, z, color = "#0284C7") => {
            if (!layerVisibility.labels) return;
            const div = document.createElement("div");
            div.className = "cad-3d-label";
            div.style.background = "rgba(255, 255, 255, 0.96)";
            div.style.color = "#0F172A";
            div.style.border = `1px solid ${color}`;
            div.style.borderLeft = `3.5px solid ${color}`;
            div.style.padding = "3px 7px";
            div.style.borderRadius = "4px";
            div.style.fontSize = "10.5px";
            div.style.fontWeight = "600";
            div.style.whiteSpace = "nowrap";
            div.style.boxShadow = "0 2px 8px rgba(15, 23, 42, 0.12)";
            div.textContent = text;

            const labelObj = new CSS2DObject(div);
            labelObj.position.set(x, y, z);
            labelsGroup.add(labelObj);
        };

        const bottomY = currentY;

        // BOTTOM END PLATE (Stainless steel with corner bolt lugs)
        if (layerVisibility.endPlates) {
            const bEndGeo = new THREE.BoxGeometry(plateW * 1.06, endPlateThickness, plateD * 1.06);
            addCadLayer(bEndGeo, endPlateMat, currentY, { name: "Bottom Clamping End Plate", type: "End Plate", material: "316L Stainless Steel", thickness: "20.0 mm" });

            // 4 Chrome Tie Rod Bolts with Brass Hex Nuts
            const boltGeo = new THREE.CylinderGeometry(0.035, 0.035, totalStackHeight + 0.15, 16);
            const nutGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.05, 6);
            const cornerOff = (plateW * 1.06) / 2 - 0.07;
            [
                [-cornerOff, -cornerOff],
                [cornerOff, -cornerOff],
                [-cornerOff, cornerOff],
                [cornerOff, cornerOff]
            ].forEach(([bx, bz]) => {
                const boltMesh = new THREE.Mesh(boltGeo, boltMat);
                boltMesh.position.set(bx, 0, bz);
                stackGroup.add(boltMesh);

                const topNut = new THREE.Mesh(nutGeo, nutMat);
                topNut.position.set(bx, totalStackHeight / 2 - 0.02, bz);
                stackGroup.add(topNut);

                const btmNut = new THREE.Mesh(nutGeo, nutMat);
                btmNut.position.set(bx, -totalStackHeight / 2 + 0.08, bz);
                stackGroup.add(btmNut);
            });
        }

        currentY += endPlateThickness + expGap;

        // BOTTOM ANODE TERMINAL (Red busbar)
        const anodeY = currentY;
        if (layerVisibility.terminals) {
            const termGeo = new THREE.BoxGeometry(plateW * 0.95, 0.045, plateD * 0.95);
            addCadLayer(termGeo, terminalAnodeMat, currentY, { name: "Anode Busbar Current Collector (+V)", type: "Electrical Terminal", voltage: `+${systemVoltage.toFixed(1)} V DC` });

            add3DLabel(`Anode (+${systemVoltage.toFixed(1)}V DC)`, plateW / 2 + 0.22, currentY, plateD * 0.25, "#EF4444");
        }

        currentY += 0.05 + expGap;

        // REPEATING CELL PAIRS STACK
        const layerGeoCore = new THREE.BoxGeometry(plateW, layerThick, plateD);
        const spacerGeo = new THREE.BoxGeometry(plateW * 1.03, layerThick, plateD * 1.03); // Flow spacers have gasket alignment border
        const midPairIndex = Math.floor(visualPairs / 2);

        for (let i = 0; i < visualPairs; i++) {
            const pairIdx = Math.round((i + 1) * (totalCellPairs / visualPairs));
            const isMidPair = i === midPairIndex;

            if (tech === "CDI") {
                // CDI: Membrane-Free Porous Carbon Electrosorption Stack
                if (layerVisibility.electrodes) {
                    addCadLayer(layerGeoCore, carbonMat, currentY, { name: `CDI Porous Carbon Anode (Pair #${pairIdx})`, type: "Porous Carbon Electrode", technology: "CDI" });
                    if (isMidPair) add3DLabel(`Carbon Anode #${pairIdx}`, plateW / 2 + 0.22, currentY, 0, "#475569");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    addCadLayer(spacerGeo, spacerMat, currentY, { name: `Feed Channel Flow Spacer (Pair #${pairIdx})`, type: "Feed Water Spacer", technology: "CDI" });
                    if (isMidPair) add3DLabel("Feed Channel Spacer", 0, currentY, plateD / 2 + 0.22, "#10B981");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.electrodes) {
                    addCadLayer(layerGeoCore, carbonMat, currentY, { name: `CDI Porous Carbon Cathode (Pair #${pairIdx})`, type: "Porous Carbon Electrode", technology: "CDI" });
                    if (isMidPair) add3DLabel(`Carbon Cathode #${pairIdx}`, -plateW / 2 - 0.22, currentY, 0, "#475569");
                }
                currentY += layerThick + expGap;

            } else if (tech === "MCDI") {
                // MCDI: Fixed Porous Carbon Electrodes + AEM (Anode side) & CEM (Cathode side)
                if (layerVisibility.electrodes) {
                    addCadLayer(layerGeoCore, carbonMat, currentY, { name: `MCDI Carbon Anode (Pair #${pairIdx})`, type: "Fixed Porous Carbon Electrode", technology: "MCDI" });
                }
                currentY += layerThick + expGap;

                if (layerVisibility.aem) {
                    addCadLayer(layerGeoCore, aemMat, currentY, { name: `Anion Exchange Membrane (AEM, Pair #${pairIdx})`, type: "AEM Membrane", technology: "MCDI" });
                    if (isMidPair) add3DLabel("AEM Membrane", -plateW / 2 - 0.22, currentY, plateD * 0.35, "#0284C7");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    addCadLayer(spacerGeo, spacerMat, currentY, { name: `Feed Channel Spacer (Pair #${pairIdx})`, type: "Flow Spacer", technology: "MCDI" });
                    if (isMidPair) add3DLabel("Feed Water Channel", 0, currentY, plateD / 2 + 0.22, "#10B981");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.cem) {
                    addCadLayer(layerGeoCore, cemMat, currentY, { name: `Cation Exchange Membrane (CEM, Pair #${pairIdx})`, type: "CEM Membrane", technology: "MCDI" });
                    if (isMidPair) add3DLabel("CEM Membrane", -plateW / 2 - 0.22, currentY, -plateD * 0.35, "#D97706");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.electrodes) {
                    addCadLayer(layerGeoCore, carbonMat, currentY, { name: `MCDI Carbon Cathode (Pair #${pairIdx})`, type: "Fixed Porous Carbon Electrode", technology: "MCDI" });
                }
                currentY += layerThick + expGap;

            } else if (tech === "FCDI") {
                // FCDI: Flowing Carbon Slurry Electrode Channels + AEM/CEM Membranes + Desalination Water Channel
                if (layerVisibility.slurry) {
                    addCadLayer(layerGeoCore, slurryMat, currentY, { name: `Anode Carbon Slurry Chamber (Pair #${pairIdx})`, type: "Flowing Slurry Chamber", slurryConcentration: "10 wt% Carbon", technology: "FCDI" });
                    if (isMidPair) add3DLabel("Anode Slurry Loop", plateW / 2 + 0.22, currentY, -plateD * 0.35, "#475569");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.aem) {
                    addCadLayer(layerGeoCore, aemMat, currentY, { name: `Anion Exchange Membrane (AEM, Pair #${pairIdx})`, type: "AEM Membrane", technology: "FCDI" });
                    if (isMidPair) add3DLabel("AEM Membrane", -plateW / 2 - 0.22, currentY, plateD * 0.35, "#0284C7");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    addCadLayer(spacerGeo, spacerMat, currentY, { name: `Central Feed-Water Desalination Channel (Pair #${pairIdx})`, type: "Desalination Water Channel", technology: "FCDI" });
                    if (isMidPair) add3DLabel("Feed Water Channel", 0, currentY, plateD / 2 + 0.22, "#10B981");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.cem) {
                    addCadLayer(layerGeoCore, cemMat, currentY, { name: `Cation Exchange Membrane (CEM, Pair #${pairIdx})`, type: "CEM Membrane", technology: "FCDI" });
                    if (isMidPair) add3DLabel("CEM Membrane", -plateW / 2 - 0.22, currentY, -plateD * 0.35, "#D97706");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.slurry) {
                    addCadLayer(layerGeoCore, slurryMat, currentY, { name: `Cathode Carbon Slurry Chamber (Pair #${pairIdx})`, type: "Flowing Slurry Chamber", slurryConcentration: "10 wt% Carbon", technology: "FCDI" });
                    if (isMidPair) add3DLabel("Cathode Slurry Loop", plateW / 2 + 0.22, currentY, plateD * 0.35, "#475569");
                }
                currentY += layerThick + expGap;

            } else if (tech === "EDI") {
                // EDI: Alternating Membranes + Mixed-Bed Ion-Exchange Resin Diluate Channels + Concentrate Channels
                if (layerVisibility.aem) {
                    const aem = new THREE.Mesh(layerGeo, aemMat);
                    aem.position.y = currentY;
                    aem.userData = { name: `Anion Exchange Membrane (AEM, Pair #${pairIdx})`, type: "AEM Membrane", technology: "EDI" };
                    stackGroup.add(aem);
                    if (isMidPair || isExp) add3DLabel("AEM Membrane", -plateW / 2 - 0.25, currentY, -plateD / 2, "#0284C7");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.resin) {
                    const diluteChamberGroup = new THREE.Group();
                    const chamberBox = new THREE.Mesh(layerGeo, spacerMat);
                    diluteChamberGroup.add(chamberBox);

                    const beadGeo = new THREE.SphereGeometry(0.025, 8, 8);
                    for (let b = 0; b < 16; b++) {
                        const bx = (Math.random() - 0.5) * (plateW - 0.1);
                        const bz = (Math.random() - 0.5) * (plateD - 0.1);
                        const bead = new THREE.Mesh(beadGeo, b % 2 === 0 ? cationResinMat : anionResinMat);
                        bead.position.set(bx, 0, bz);
                        diluteChamberGroup.add(bead);
                    }

                    diluteChamberGroup.position.y = currentY;
                    diluteChamberGroup.userData = { name: `Mixed-Bed Ion-Exchange Resin Diluate Cell (Pair #${pairIdx})`, type: "Resin Diluate Channel", technology: "EDI" };
                    stackGroup.add(diluteChamberGroup);

                    if (isMidPair || isExp) add3DLabel("Mixed-Bed Resin (Diluate)", plateW / 2 + 0.25, currentY, 0, "#D97706");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.cem) {
                    const cem = new THREE.Mesh(layerGeo, cemMat);
                    cem.position.y = currentY;
                    cem.userData = { name: `Cation Exchange Membrane (CEM, Pair #${pairIdx})`, type: "CEM Membrane", technology: "EDI" };
                    stackGroup.add(cem);
                    if (isMidPair || isExp) add3DLabel("CEM Membrane", -plateW / 2 - 0.25, currentY, plateD / 2, "#D97706");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    const concentrateChamber = new THREE.Mesh(layerGeo, spacerMat);
                    concentrateChamber.position.y = currentY;
                    concentrateChamber.userData = { name: `Concentrate Brine Reject Channel (Pair #${pairIdx})`, type: "Concentrate Channel", technology: "EDI" };
                    stackGroup.add(concentrateChamber);
                    if (isMidPair || isExp) add3DLabel("Concentrate Channel", plateW / 2 + 0.25, currentY, plateD / 2 + 0.2, "#0284C7");
                }
                currentY += layerThick + expGap;

            } else if (tech === "ED") {
                // ED: Alternating CEM/AEM Membrane Pairs + Dilute and Concentrate Flow Spacers
                if (layerVisibility.cem) {
                    const cem = new THREE.Mesh(layerGeo, cemMat);
                    cem.position.y = currentY;
                    cem.userData = { name: `Cation Exchange Membrane (CEM, Pair #${pairIdx})`, type: "CEM Membrane", technology: "ED" };
                    stackGroup.add(cem);
                    if (isMidPair || isExp) add3DLabel("CEM Membrane", -plateW / 2 - 0.25, currentY, plateD / 2, "#D97706");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    const diluteChamber = new THREE.Mesh(layerGeo, spacerMat);
                    diluteChamber.position.y = currentY;
                    diluteChamber.userData = { name: `Dilute Desalination Channel (Pair #${pairIdx})`, type: "Dilute Channel", technology: "ED" };
                    stackGroup.add(diluteChamber);
                    if (isMidPair || isExp) add3DLabel("Dilute Channel (Product)", plateW / 2 + 0.25, currentY, 0, "#10B981");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.aem) {
                    const aem = new THREE.Mesh(layerGeo, aemMat);
                    aem.position.y = currentY;
                    aem.userData = { name: `Anion Exchange Membrane (AEM, Pair #${pairIdx})`, type: "AEM Membrane", technology: "ED" };
                    stackGroup.add(aem);
                    if (isMidPair || isExp) add3DLabel("AEM Membrane", -plateW / 2 - 0.25, currentY, -plateD / 2, "#0284C7");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    const concChamber = new THREE.Mesh(layerGeo, concSpacerMat);
                    concChamber.position.y = currentY;
                    concChamber.userData = { name: `Concentrate Brine Channel (Pair #${pairIdx})`, type: "Concentrate Channel", technology: "ED" };
                    stackGroup.add(concChamber);
                    if (isMidPair || isExp) add3DLabel("Concentrate Channel (Brine)", plateW / 2 + 0.25, currentY, plateD / 2 + 0.2, "#DC2626");
                }
                currentY += layerThick + expGap;

            } else if (tech === "EDR") {
                // EDR: Reversible Polarity Stack with Alternating CEM/AEM and Invertible Flow Channels
                if (layerVisibility.cem) {
                    const cem = new THREE.Mesh(layerGeo, cemMat);
                    cem.position.y = currentY;
                    cem.userData = { name: `Cation Exchange Membrane (CEM, Pair #${pairIdx})`, type: "CEM Membrane", technology: "EDR" };
                    stackGroup.add(cem);
                    if (isMidPair || isExp) add3DLabel("CEM Membrane", -plateW / 2 - 0.25, currentY, plateD / 2, "#D97706");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    const revChamberA = new THREE.Mesh(layerGeo, reversibleSpacerMat);
                    revChamberA.position.y = currentY;
                    revChamberA.userData = { name: `Reversible Channel A [Dilute ↔ Conc] (Pair #${pairIdx})`, type: "Reversible Flow Channel", technology: "EDR" };
                    stackGroup.add(revChamberA);
                    if (isMidPair || isExp) add3DLabel("Reversible Channel A", plateW / 2 + 0.25, currentY, 0, "#6366F1");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.aem) {
                    const aem = new THREE.Mesh(layerGeo, aemMat);
                    aem.position.y = currentY;
                    aem.userData = { name: `Anion Exchange Membrane (AEM, Pair #${pairIdx})`, type: "AEM Membrane", technology: "EDR" };
                    stackGroup.add(aem);
                    if (isMidPair || isExp) add3DLabel("AEM Membrane", -plateW / 2 - 0.25, currentY, -plateD / 2, "#0284C7");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    const revChamberB = new THREE.Mesh(layerGeo, reversibleSpacerMat);
                    revChamberB.position.y = currentY;
                    revChamberB.userData = { name: `Reversible Channel B [Conc ↔ Dilute] (Pair #${pairIdx})`, type: "Reversible Flow Channel", technology: "EDR" };
                    stackGroup.add(revChamberB);
                    if (isMidPair || isExp) add3DLabel("Reversible Channel B", plateW / 2 + 0.25, currentY, plateD / 2 + 0.2, "#8B5CF6");
                }
                currentY += layerThick + expGap;

            } else {
                if (layerVisibility.aem) {
                    const aem = new THREE.Mesh(layerGeo, aemMat);
                    aem.position.y = currentY;
                    aem.userData = { name: `AEM Membrane (Pair #${pairIdx})`, type: "AEM Membrane", technology: tech };
                    stackGroup.add(aem);
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    const sp = new THREE.Mesh(layerGeo, spacerMat);
                    sp.position.y = currentY;
                    sp.userData = { name: `Process Train Hybrid Channel (Pair #${pairIdx})`, type: "Spacer", technology: tech };
                    stackGroup.add(sp);
                }
                currentY += layerThick + expGap;
            }
        }

        // TOP CATHODE TERMINAL (Blue busbar)
        const cathodeY = currentY;
        if (layerVisibility.terminals) {
            const termCathGeo = new THREE.BoxGeometry(plateW * 0.95, 0.045, plateD * 0.95);
            addCadLayer(termCathGeo, terminalCathodeMat, currentY, { name: "Cathode Busbar Current Collector (-V)", type: "Electrical Terminal", voltage: "0.0 V DC (Cathode Reference)" });

            add3DLabel("Cathode (-0V DC)", -plateW / 2 - 0.22, currentY, -plateD * 0.25, "#2563EB");
        }

        currentY += 0.05 + expGap;

        // TOP END PLATE (Stainless steel clamping plate)
        const topY = currentY;
        if (layerVisibility.endPlates) {
            const tEndGeo = new THREE.BoxGeometry(plateW * 1.06, endPlateThickness, plateD * 1.06);
            addCadLayer(tEndGeo, endPlateMat, currentY, { name: "Top Clamping End Plate", type: "End Plate", material: "316L Stainless Steel", thickness: "20.0 mm" });

            add3DLabel("Top End Plate", 0, currentY + 0.16, 0, "#64748B");
        }

        // PIPING, FLANGES & INDUSTRIAL MANIFOLDS
        // 1. Raw Feed Inlet Nozzle (Bottom Right)
        const flangeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.035, 16);
        const inPipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 16);
        
        const inPipe = new THREE.Mesh(inPipeGeo, pipeMat);
        inPipe.position.set(plateW * 0.35, bottomY - 0.18, plateD * 0.35);
        inPipe.userData = { name: "Feed Water Inlet Manifold", type: "Hydraulic Piping", flowRate: `${flowRate.toFixed(1)} L/min` };
        stackGroup.add(inPipe);

        const inFlange = new THREE.Mesh(flangeGeo, flangeMat);
        inFlange.position.set(plateW * 0.35, bottomY - 0.32, plateD * 0.35);
        stackGroup.add(inFlange);

        add3DLabel(`Feed In (${flowRate.toFixed(1)} L/min)`, plateW * 0.35, bottomY - 0.38, plateD * 0.35 + 0.15, "#0284C7");

        // 2. Product Water Outlet Nozzle (Top Left)
        const outPipe = new THREE.Mesh(inPipeGeo, prodPipeMat);
        outPipe.position.set(-plateW * 0.35, topY + 0.20, -plateD * 0.35);
        outPipe.userData = { name: "Purified Product Outlet Manifold", type: "Hydraulic Piping", outletTds: `${outletTDS.toFixed(1)} mg/L` };
        stackGroup.add(outPipe);

        const outFlange = new THREE.Mesh(flangeGeo, flangeMat);
        outFlange.position.set(-plateW * 0.35, topY + 0.34, -plateD * 0.35);
        stackGroup.add(outFlange);

        add3DLabel(`Product Out (${outletTDS.toFixed(1)} ppm)`, -plateW * 0.35, topY + 0.40, -plateD * 0.35 - 0.15, "#16A34A");

        // 3. Concentrate / Brine Reject Nozzle (Top Right)
        const concPipe = new THREE.Mesh(inPipeGeo, concPipeMat);
        concPipe.position.set(plateW * 0.35, topY + 0.20, -plateD * 0.35);
        concPipe.userData = { name: "Concentrate Brine Reject Manifold", type: "Hydraulic Piping" };
        stackGroup.add(concPipe);

        const concFlange = new THREE.Mesh(flangeGeo, flangeMat);
        concFlange.position.set(plateW * 0.35, topY + 0.34, -plateD * 0.35);
        stackGroup.add(concFlange);

        // FLOW PARTICLES (Hydraulic flow inside spacers)
        if (layerVisibility.flow || displayMode === "FLOW") {
            const particleCount = 35;
            const pGeo = new THREE.SphereGeometry(0.028, 8, 8);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x0284C7 });
            
            for (let p = 0; p < particleCount; p++) {
                const particle = new THREE.Mesh(pGeo, pMat);
                particle.position.set(
                    (Math.random() - 0.5) * plateW * 0.85,
                    bottomY + 0.2 + Math.random() * (topY - bottomY - 0.4),
                    (Math.random() - 0.5) * plateD * 0.85
                );
                particlesGroup.add(particle);
            }
        }

        // DIMENSION ANNOTATIONS
        if (layerVisibility.dimensions || displayMode === "DIMENSIONS") {
            const dimMat = new THREE.LineBasicMaterial({ color: 0x0284C7, linewidth: 2 });
            
            const pointsY = [
                new THREE.Vector3(plateW / 2 + 0.65, bottomY, plateD / 2 + 0.65),
                new THREE.Vector3(plateW / 2 + 0.65, topY, plateD / 2 + 0.65)
            ];
            const dimLineY = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsY), dimMat);
            dimensionsGroup.add(dimLineY);

            add3DLabel(`H: ${totalThicknessMm} mm`, plateW / 2 + 0.75, (topY + bottomY) / 2, plateD / 2 + 0.65, "#0284C7");

            const pointsX = [
                new THREE.Vector3(-plateW / 2, bottomY - 0.25, plateD / 2 + 0.65),
                new THREE.Vector3(plateW / 2, bottomY - 0.25, plateD / 2 + 0.65)
            ];
            const dimLineX = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsX), dimMat);
            dimensionsGroup.add(dimLineX);

            add3DLabel(`W: ${sideDimMm} mm`, 0, bottomY - 0.35, plateD / 2 + 0.65, "#0284C7");
        }

        // Auto-fit camera framing with safety timeout for initial DOM layout
        handleFitModel();
        const fitTimer = setTimeout(() => {
            handleFitModel();
        }, 60);

        // Raycasting click
        const handleCanvasClick = (e) => {
            if (!rendererRef.current || !cameraRef.current) return;
            const rect = rendererRef.current.domElement.getBoundingClientRect();
            mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
            const intersects = raycasterRef.current.intersectObjects(stackGroup.children, true);

            if (intersects.length > 0) {
                const hitMesh = intersects[0].object;
                if (hitMesh.userData && hitMesh.userData.name) {
                    setSelectedComponent(hitMesh.userData);
                }
            }
        };

        const canvasElem = renderer.domElement;
        canvasElem.addEventListener("click", handleCanvasClick);

        // Animation Loop
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            controls.update();

            if (particlesGroup.children.length > 0) {
                const speed = Math.max(0.005, flowVelocity * 0.15);
                particlesGroup.children.forEach(p => {
                    p.position.x += speed;
                    if (p.position.x > plateW / 2 + 0.25) {
                        p.position.x = -plateW / 2 - 0.25;
                    }
                });
            }

            renderer.render(scene, camera);
            if (labelRendererRef.current) {
                labelRendererRef.current.render(scene, camera);
            }
        };

        animate();

        // ResizeObserver on CAD container
        const handleResizeEntry = (entries) => {
            if (!entries || !entries[0] || !rendererRef.current || !cameraRef.current) return;
            const contentRect = entries[0].contentRect;
            const newW = contentRect.width;
            const newH = contentRect.height;
            if (newW > 0 && newH > 0) {
                cameraRef.current.aspect = newW / newH;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(newW, newH, false);
                if (labelRendererRef.current) {
                    labelRendererRef.current.setSize(newW, newH);
                }
            }
        };

        resizeObserverRef.current = new ResizeObserver(handleResizeEntry);
        resizeObserverRef.current.observe(container);

        return () => {
            clearTimeout(fitTimer);
            if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
            if (canvasElem) canvasElem.removeEventListener("click", handleCanvasClick);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (rendererRef.current) rendererRef.current.dispose();
            const oldLabels = container.querySelectorAll(".css2d-label-layer");
            oldLabels.forEach(el => el.remove());
        };
    }, [
        webglSupported,
        tech,
        displayMode,
        explosionDistance,
        sectionAxis,
        sectionOffset,
        layerVisibility,
        totalCellPairs,
        electrodeArea,
        electrodeThickness,
        membraneThickness,
        spacerThickness,
        flowVelocity,
        systemVoltage,
        operatingCurrent,
        widthScale,
        lengthScale,
        visualPairs,
        handleFitModel
    ]);

    // WebGL Fallback
    if (!webglSupported) {
        return (
            <div className="cad-panel" style={{ background: "#FFFFFF", borderRadius: "8px", padding: "20px", color: "#0F172A", border: "1px solid #CBD5E1" }}>
                <div style={{ padding: "30px", textAlign: "center", background: "#F8FAFC", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <div style={{ color: "#EF4444", fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>WebGL Acceleration Unavailable</div>
                    <p style={{ color: "#64748B", fontSize: "13px" }}>
                        Your browser or environment does not support 3D WebGL rendering. Switching to 2D vector schematics.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="cad-panel" style={{
            background: "#FFFFFF",
            borderRadius: "6px",
            padding: "0",
            color: "#0F172A",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            width: "100%",
            boxSizing: "border-box"
        }}>
            {/* CONTAINER CSS STYLES FOR LIGHT ENGINEERING CAD THEME & OVERLAYS */}
            <style>{`
                .cad-viewport {
                    width: 100%;
                    height: 520px;
                    min-height: 480px;
                    position: relative;
                    overflow: hidden;
                    background: #F8FAFC;
                    border: 1px solid #CBD5E1;
                    border-radius: 6px;
                }
                @media (max-width: 768px) {
                    .cad-viewport {
                        height: 420px;
                    }
                }
                .cad-canvas {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                }
                .cad-canvas canvas {
                    display: block;
                    width: 100% !important;
                    height: 100% !important;
                }
                .css2d-label-layer {
                    position: absolute !important;
                    inset: 0 !important;
                    pointer-events: none;
                    overflow: hidden;
                }
                .css2d-label-layer > div {
                    pointer-events: none;
                }
                .cad-telemetry {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    z-index: 20;
                    background: rgba(255, 255, 255, 0.94);
                    color: #0F172A;
                    border: 1px solid #CBD5E1;
                    border-radius: 6px;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
                    backdrop-filter: blur(8px);
                    max-width: 175px;
                    font-size: 10px;
                    pointer-events: auto;
                    transition: all 0.2s ease;
                }
                .cad-dimensions {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    z-index: 20;
                    background: rgba(255, 255, 255, 0.96);
                    color: #0F172A;
                    border: 1px solid #CBD5E1;
                    border-radius: 6px;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
                    max-width: 175px;
                    max-height: calc(100% - 20px);
                    overflow-y: auto;
                    font-size: 10px;
                    pointer-events: auto;
                    transition: all 0.2s ease;
                }
                .cad-3d-label {
                    padding: 3px 6px;
                    background: rgba(255, 255, 255, 0.96);
                    color: #0F172A;
                    border: 1px solid #94A3B8;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 600;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
                    white-space: nowrap;
                }
            `}</style>

            {/* CAD HEADER & TECHNOLOGY SELECTOR */}
            <div className="cad-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: "800", color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            STACK GEOMETRY ({technologyLabel})
                        </span>
                        <span style={{ background: "#F8FAFC", color: "#475569", border: "1px solid #CBD5E1", padding: "1px 6px", borderRadius: "2px", fontSize: "9.5px", fontWeight: "700" }}>
                            PARAMETRIC CAD MODEL
                        </span>
                    </div>
                    <div style={{ fontSize: "10.5px", color: "#64748B", marginTop: "3px", fontFamily: "monospace" }}>
                        Envelope: <strong style={{ color: "#0F172A" }}>{sideDimMm}×{sideDimMm}×{totalThicknessMm} mm</strong> | Pairs: <strong style={{ color: "#0F172A" }}>{totalCellPairs}</strong> | Modules: <strong style={{ color: "#0F172A" }}>{numberOfModules}</strong> | Area: <strong style={{ color: "#0F172A" }}>{electrodeArea} cm²</strong> | Membrane: <strong style={{ color: "#0F172A" }}>0.15 mm</strong> | Spacer: <strong style={{ color: "#0F172A" }}>0.50 mm</strong> | Electrode: <strong style={{ color: "#0F172A" }}>0.60 mm</strong> | Pitch: <strong style={{ color: "#0F172A" }}>2.00 mm</strong>
                    </div>
                </div>
            </div>


            {/* CAD TOOLBAR CONTROLS */}
            <div className="cad-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "8px", flexWrap: "wrap", background: "#F8FAFC", padding: "6px 8px", borderRadius: "6px", border: "1px solid #CBD5E1" }}>
                {/* MODE TOGGLES */}
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                    {[
                        { id: "NORMAL", label: "Standard CAD" },
                        { id: "EXPLODED", label: "Exploded View" },
                        { id: "SECTION", label: "Section Cut" },
                        { id: "FLOW", label: "Flow Velocity" },
                        { id: "ELECTRICAL", label: "Electrical" },
                        { id: "DIMENSIONS", label: "Dimensions" }
                    ].map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setDisplayMode(m.id)}
                            style={{
                                background: displayMode === m.id ? "#0284C7" : "#FFFFFF",
                                color: displayMode === m.id ? "#FFFFFF" : "#334155",
                                border: displayMode === m.id ? "1px solid #0284C7" : "1px solid #CBD5E1",
                                borderRadius: "4px",
                                padding: "4px 10px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                            }}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* CAMERA & LABEL CONTROLS */}
                <div style={{ display: "flex", gap: "5px" }}>
                    <button
                        onClick={() => setLayerVisibility(prev => ({ ...prev, labels: !prev.labels }))}
                        style={{
                            background: layerVisibility.labels ? "#0284C7" : "#FFFFFF",
                            color: layerVisibility.labels ? "#FFFFFF" : "#475569",
                            border: layerVisibility.labels ? "1px solid #0284C7" : "1px solid #CBD5E1",
                            borderRadius: "4px",
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer"
                        }}
                    >
                        Labels: {layerVisibility.labels ? "ON" : "OFF"}
                    </button>
                    <button
                        onClick={handleResetCamera}
                        style={{ background: "#FFFFFF", color: "#475569", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                    >
                        Reset Camera
                    </button>
                </div>
            </div>

            {/* ELECTRICAL CIRCUIT BANNER */}
            {displayMode === "ELECTRICAL" && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "6px", padding: "6px 10px", marginBottom: "8px", fontSize: "11px", color: "#1E40AF", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                    <div>
                        <strong>DC Power Supply Pathway:</strong> DC Power Supply → Anode Busbar (+{systemVoltage.toFixed(1)}V) → Stack Assembly → Cathode Busbar (-0V)
                    </div>
                    <div style={{ display: "flex", gap: "10px", fontWeight: "700", color: "#1E3A8A" }}>
                        <span>Cell: {cellVoltage.toFixed(2)}V</span>
                        <span>Module: {moduleVoltage.toFixed(1)}V</span>
                        <span>Stack: {systemVoltage.toFixed(1)}V</span>
                        <span>Current: {operatingCurrent.toFixed(2)}A</span>
                        <span>Power: {power.toFixed(1)}W</span>
                    </div>
                </div>
            )}

            {/* DYNAMIC MODE CONTROLS (Explosion / Section sliders) */}
            {displayMode === "EXPLODED" && (
                <div style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", padding: "5px 10px", borderRadius: "6px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px", fontSize: "11px" }}>
                    <span style={{ color: "#0284C7", fontWeight: "700" }}>Explosion Separation:</span>
                    <input
                        type="range"
                        min="0.1"
                        max="2.5"
                        step="0.1"
                        value={explosionDistance}
                        onChange={(e) => setExplosionDistance(Number(e.target.value))}
                        style={{ flex: 1, accentColor: "#0284C7" }}
                    />
                    <span style={{ color: "#0F172A", fontWeight: "700" }}>{(explosionDistance * 10).toFixed(0)} mm</span>
                </div>
            )}

            {displayMode === "SECTION" && (
                <div style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", padding: "5px 10px", borderRadius: "6px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px", fontSize: "11px" }}>
                    <span style={{ color: "#0284C7", fontWeight: "700" }}>Cut Axis:</span>
                    {["X", "Y", "Z"].map((ax) => (
                        <label key={ax} style={{ color: "#0F172A", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
                            <input type="radio" name="secAxis" checked={sectionAxis === ax} onChange={() => setSectionAxis(ax)} />
                            {ax}-Plane
                        </label>
                    ))}
                    <span style={{ color: "#64748B", marginLeft: "8px" }}>Cut Position:</span>
                    <input
                        type="range"
                        min="-2.0"
                        max="2.0"
                        step="0.1"
                        value={sectionOffset}
                        onChange={(e) => setSectionOffset(Number(e.target.value))}
                        style={{ flex: 1, accentColor: "#0284C7" }}
                    />
                </div>
            )}

            {/* BOUNDED LIGHT CAD VIEWPORT CONTAINER */}
            <div ref={containerRef} className="cad-viewport">
                {/* CANVAS */}
                <div className="cad-canvas">
                    <canvas ref={canvasRef} />
                </div>

                {/* ABSOLUTE OVERLAY 1: LEFT-SIDE TELEMETRY CARD */}
                <div className="cad-telemetry" style={{ minWidth: telemetryOpen ? "165px" : "auto", padding: telemetryOpen ? "6px 10px" : "4px 8px" }}>
                    <div
                        onClick={() => setTelemetryOpen(v => !v)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: "8px" }}
                        title="Click to minimize/expand"
                    >
                        <span style={{ color: "#0284C7", fontWeight: "700", fontSize: "11px" }}>Stack Telemetry</span>
                        <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "800" }}>{telemetryOpen ? "−" : "+"}</span>
                    </div>
                    {telemetryOpen && (
                        <>
                            <div style={{ color: "#475569", display: "flex", flexDirection: "column", gap: "2px", fontSize: "10px", marginTop: "4px" }}>
                                <div>Hydraulic Vel: <strong style={{ color: "#0F172A" }}>{flowVelocity.toFixed(3)} m/s</strong></div>
                                <div>Pressure Drop: <strong style={{ color: "#0F172A" }}>{pressureDrop.toFixed(0)} Pa</strong></div>
                                <div>Module Power: <strong style={{ color: "#0F172A" }}>{modulePower.toFixed(1)} W</strong>{numberOfModules > 1 ? ` (Bank: ≈ ${bankPower.toFixed(1)} W)` : ""}</div>
                                <div>Cell Voltage: <strong style={{ color: "#0F172A" }}>{cellVoltage.toFixed(2)} V</strong></div>
                                <div>Module Voltage: <strong style={{ color: "#0F172A" }}>{moduleVoltage.toFixed(1)} V DC</strong> ({pairsPerModule} pairs)</div>
                                <div>Stack Voltage: <strong style={{ color: "#0F172A" }}>{stackVoltageSeries.toFixed(1)} V DC</strong> ({totalCellPairs} pairs series)</div>
                                {numberOfModules > 1 && <div>Bank Bus: <strong style={{ color: "#0F172A" }}>{bankVoltage.toFixed(1)} V DC</strong></div>}
                                <div>Module Current: <strong style={{ color: "#0F172A" }}>{moduleCurrent.toFixed(2)} A</strong>{numberOfModules > 1 ? ` (Bank: ${bankCurrent.toFixed(2)} A)` : ""}</div>
                            </div>
                            <div style={{ fontSize: "9px", color: "#64748B", marginTop: "4px", borderTop: "1px solid #E2E8F0", paddingTop: "3px" }}>
                                Current design configuration
                            </div>
                        </>
                    )}
                </div>

                {/* ABSOLUTE OVERLAY 2: RIGHT-SIDE DIMENSIONS & LAYER VISIBILITY PANEL */}
                <div className="cad-dimensions" style={{ minWidth: dimensionsOpen ? "170px" : "auto", padding: dimensionsOpen ? "6px 10px" : "4px 8px" }}>
                    <div
                        onClick={() => setDimensionsOpen(v => !v)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: "8px", borderBottom: dimensionsOpen ? "1px solid #E2E8F0" : "none", paddingBottom: dimensionsOpen ? "4px" : "0", marginBottom: dimensionsOpen ? "4px" : "0" }}
                        title="Click to minimize/expand"
                    >
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#0284C7" }}>Dimensions &amp; Layers</span>
                        <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "800" }}>{dimensionsOpen ? "−" : "+"}</span>
                    </div>
                    {dimensionsOpen && (
                        <>
                            <div style={{ borderBottom: "1px solid #E2E8F0", paddingBottom: "4px", marginBottom: "4px" }}>
                                <div style={{ color: "#475569", display: "flex", flexDirection: "column", gap: "1.5px", fontSize: "9.5px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Width:</span><strong style={{ color: "#0F172A" }}>{sideDimMm} mm</strong></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Length:</span><strong style={{ color: "#0F172A" }}>{sideDimMm} mm</strong></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Height:</span><strong style={{ color: "#0F172A" }}>{totalThicknessMm} mm</strong></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Membrane:</span><strong style={{ color: "#0F172A" }}>{membraneThickness} mm</strong></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Spacer:</span><strong style={{ color: "#0F172A" }}>{spacerThickness} mm</strong></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Electrode:</span><strong style={{ color: "#0F172A" }}>{electrodeThickness} mm</strong></div>
                                </div>
                            </div>

                            <div style={{ borderBottom: "1px solid #E2E8F0", paddingBottom: "4px", marginBottom: "4px" }}>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#0284C7", marginBottom: "2px" }}>Layer Visibility</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1.5px", fontSize: "9.5px" }}>
                                    <label style={{ color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <input type="checkbox" checked={layerVisibility.endPlates} onChange={(e) => setLayerVisibility({ ...layerVisibility, endPlates: e.target.checked })} />
                                        End Plates
                                    </label>
                                    <label style={{ color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <input
                                            type="checkbox"
                                            checked={tech === "FCDI" ? layerVisibility.slurry : layerVisibility.electrodes}
                                            onChange={(e) => setLayerVisibility({ ...layerVisibility, electrodes: e.target.checked, slurry: e.target.checked })}
                                        />
                                        {tech === "FCDI" ? "Slurry Chambers" : "Electrodes"}
                                    </label>
                                    {tech !== "CDI" && (
                                        <>
                                            <label style={{ color: "#0284C7", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                                <input type="checkbox" checked={layerVisibility.aem} onChange={(e) => setLayerVisibility({ ...layerVisibility, aem: e.target.checked })} />
                                                AEM
                                            </label>
                                            <label style={{ color: "#D97706", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                                <input type="checkbox" checked={layerVisibility.cem} onChange={(e) => setLayerVisibility({ ...layerVisibility, cem: e.target.checked })} />
                                                CEM
                                            </label>
                                        </>
                                    )}
                                    <label style={{ color: "#059669", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <input type="checkbox" checked={layerVisibility.spacers} onChange={(e) => setLayerVisibility({ ...layerVisibility, spacers: e.target.checked })} />
                                        Spacers
                                    </label>
                                    <label style={{ color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <input type="checkbox" checked={layerVisibility.terminals} onChange={(e) => setLayerVisibility({ ...layerVisibility, terminals: e.target.checked })} />
                                        Terminals
                                    </label>
                                    <label style={{ color: "#0284C7", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <input type="checkbox" checked={layerVisibility.labels} onChange={(e) => setLayerVisibility({ ...layerVisibility, labels: e.target.checked })} />
                                        3D Callouts
                                    </label>
                                </div>
                            </div>

                            {/* MATERIAL LEGEND */}
                            <div style={{ fontSize: "9px", color: "#64748B" }}>
                                <strong style={{ color: "#0F172A", display: "block", marginBottom: "2px" }}>Legend:</strong>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                                    <span style={{ color: "#DC2626" }}>■ Anode Busbar (+V)</span>
                                    <span style={{ color: "#2563EB" }}>■ Cathode Busbar (-V)</span>
                                    {tech === "FCDI" && <span style={{ color: "#334155" }}>■ Slurry Chamber</span>}
                                    {tech !== "CDI" && <span style={{ color: "#0284C7" }}>■ AEM (Cyan)</span>}
                                    {tech !== "CDI" && <span style={{ color: "#D97706" }}>■ CEM (Amber)</span>}
                                    <span style={{ color: "#059669" }}>■ Flow Spacer (Teal)</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* CLICKED COMPONENT INSPECTOR TAG */}
                {selectedComponent && (
                    <div style={{ position: "absolute", bottom: "12px", left: "12px", zIndex: 25, background: "rgba(255, 255, 255, 0.96)", border: "1px solid #0284C7", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", maxWidth: "320px", boxShadow: "0 4px 14px rgba(15,23,42,0.15)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <strong style={{ color: "#0284C7", fontSize: "11.5px" }}>{selectedComponent.name}</strong>
                            <button onClick={() => setSelectedComponent(null)} style={{ background: "transparent", border: "none", color: "#64748B", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>Close</button>
                        </div>
                        {Object.entries(selectedComponent).map(([k, v]) => {
                            if (k === "name") return null;
                            return (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "8px", margin: "2px 0" }}>
                                    <span style={{ color: "#64748B", textTransform: "capitalize" }}>{k}:</span>
                                    <strong style={{ color: "#0F172A" }}>{String(v)}</strong>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
