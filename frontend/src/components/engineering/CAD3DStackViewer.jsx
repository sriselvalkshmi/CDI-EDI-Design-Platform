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
    
    // Engineering metrics with fallbacks
    const cellVoltage = Number(eng.voltageCell || 1.40);
    const moduleVoltage = Number(eng.voltageModule || 47.6);
    const systemVoltage = Number(eng.voltageStack || 142.8);
    const numberOfModules = Number(eng.numberOfModules || 3);
    const pairsPerModule = Number(eng.pairsPerModule || 34);
    const totalCellPairs = Number(eng.cellPairs || 102);

    const electrodeArea = Number(eng.electrodeArea || 360); // cm²
    const electrodeThickness = Number(eng.electrodeThickness || 0.60); // mm
    const membraneThickness = Number(eng.membraneThickness || 0.15); // mm
    const spacerThickness = Number(eng.spacerThickness || 0.50); // mm
    
    const flowRate = Number(eng.flowRate || feedWater.flowRate || 10.0); // L/min
    const flowVelocity = Number(eng.flowVelocity || 0.033); // m/s
    const residenceTime = Number(eng.residenceTime || 0.045); // min
    const pressureDrop = Number(eng.pressureDrop || 270.1); // Pa

    const feedTDS = Number(feedWater.tds || 500);
    const targetTDS = Number(feedWater.targetTds || 50);
    const outletTDS = Number(eng.outletTDS || 50);
    const waterRecovery = Number(eng.waterRecovery || 95.0);

    const operatingCurrent = Number(eng.current || 1.45); // A
    const power = Number(eng.power || 207.1); // W
    const currentDensity = Number(eng.currentDensity || 14.5); // A/m²

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
    
    // Clamp visual pairs for performance
    const visualPairs = Math.min(24, Math.max(6, Math.round(totalCellPairs / 4)));

    // Fit Camera to Model Bounding Box
    const handleFitModel = useCallback(() => {
        if (!cameraRef.current || !controlsRef.current || !stackGroupRef.current) return;
        const stackGroup = stackGroupRef.current;
        const bbox = new THREE.Box3().setFromObject(stackGroup);
        if (bbox.isEmpty()) return;

        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = cameraRef.current.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
        cameraZ = Math.max(3.0, cameraZ);
        
        const offset = new THREE.Vector3(cameraZ * 0.7, cameraZ * 0.5, cameraZ * 0.7);
        cameraRef.current.position.copy(center).add(offset);
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
        camera.position.set(3.8, 2.6, 4.8);
        cameraRef.current = camera;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 18.0;
        controls.minDistance = 1.2;
        controlsRef.current = controls;

        // 3. BRIGHT ENGINEERING LIGHTING SETUP
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2.2);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xFFFFFF, 3.0);
        keyLight.position.set(6, 10, 8);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xDDE7F0, 1.5);
        fillLight.position.set(-6, 5, -4);
        scene.add(fillLight);

        // 4. LIGHT GRAY/BLUE CAD GRID
        const grid = new THREE.GridHelper(12, 24, 0x94A3B8, 0xCBD5E1);
        grid.material.transparent = true;
        grid.material.opacity = 0.55;
        grid.position.y = -1.8;
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

        // Materials Setup (Light CAD Palette)
        const endPlateMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3, name: "Steel End Plate" });
        const boltMat = new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.8, roughness: 0.2, name: "Tie Rod Bolt" });
        const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.1, roughness: 0.9, name: "Graphite Carbon Electrode" });
        const aemMat = new THREE.MeshPhysicalMaterial({ color: 0x0284C7, transmission: 0.6, opacity: 0.85, transparent: true, roughness: 0.1, name: "Cyan AEM Membrane" });
        const cemMat = new THREE.MeshPhysicalMaterial({ color: 0xD97706, transmission: 0.6, opacity: 0.85, transparent: true, roughness: 0.1, name: "Amber CEM Membrane" });
        const spacerMat = new THREE.MeshStandardMaterial({ color: 0x059669, opacity: 0.75, transparent: true, roughness: 0.4, name: "Teal Flow Spacer Mesh" });
        const slurryMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8, name: "Carbon Slurry Channel" });
        const cationResinMat = new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.2, roughness: 0.3, name: "Cation Resin Bead" });
        const anionResinMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, metalness: 0.2, roughness: 0.3, name: "Anion Resin Bead" });
        const terminalAnodeMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, metalness: 0.6, roughness: 0.3, name: "Anode Terminal (+V)" });
        const terminalCathodeMat = new THREE.MeshStandardMaterial({ color: 0x2563EB, metalness: 0.6, roughness: 0.3, name: "Cathode Terminal (-V)" });

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
        const expGap = isExp ? explosionDistance : 0;

        const plateW = widthScale;
        const plateD = lengthScale;
        const endPlateThickness = 0.12;
        const layerThick = 0.04;

        let currentY = -(visualPairs * (layerThick + expGap * 0.08));

        // Helper to create HTML 3D CSS2D Callout Labels (White cards with dark text)
        const add3DLabel = (text, x, y, z, border = "#94A3B8") => {
            if (!layerVisibility.labels) return;
            const div = document.createElement("div");
            div.className = "cad-3d-label";
            div.style.background = "rgba(255, 255, 255, 0.96)";
            div.style.color = "#0F172A";
            div.style.border = `1px solid ${border}`;
            div.style.padding = "4px 7px";
            div.style.borderRadius = "4px";
            div.style.fontSize = "11px";
            div.style.fontWeight = "600";
            div.style.whiteSpace = "nowrap";
            div.style.boxShadow = "0 2px 6px rgba(15, 23, 42, 0.15)";
            div.textContent = text;

            const labelObj = new CSS2DObject(div);
            labelObj.position.set(x, y, z);
            labelsGroup.add(labelObj);
        };

        // BOTTOM END PLATE
        if (layerVisibility.endPlates) {
            const bEndGeo = new THREE.BoxGeometry(plateW + 0.3, endPlateThickness, plateD + 0.3);
            const bEndMesh = new THREE.Mesh(bEndGeo, endPlateMat);
            bEndMesh.position.y = currentY;
            bEndMesh.userData = { name: "Bottom Stainless Steel End Plate", type: "End Plate", thickness: "20.0 mm" };
            stackGroup.add(bEndMesh);

            add3DLabel("End Plate", plateW / 2 + 0.3, currentY, plateD / 2 + 0.2, "#64748B");

            // Tie Rod Bolts
            const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, (visualPairs * 0.25) + 0.8, 12);
            [
                [-plateW / 2 - 0.1, -plateD / 2 - 0.1],
                [plateW / 2 + 0.1, -plateD / 2 - 0.1],
                [-plateW / 2 - 0.1, plateD / 2 + 0.1],
                [plateW / 2 + 0.1, plateD / 2 + 0.1]
            ].forEach(([bx, bz]) => {
                const boltMesh = new THREE.Mesh(boltGeo, boltMat);
                boltMesh.position.set(bx, 0, bz);
                stackGroup.add(boltMesh);
            });
        }

        currentY += endPlateThickness + expGap;

        // BOTTOM ANODE TERMINAL
        if (layerVisibility.terminals) {
            const termGeo = new THREE.BoxGeometry(plateW * 0.9, 0.05, plateD * 0.9);
            const termMesh = new THREE.Mesh(termGeo, terminalAnodeMat);
            termMesh.position.y = currentY;
            termMesh.userData = { name: "Anode Current Collector Busbar (+V)", type: "Electrical Terminal", voltage: `${systemVoltage.toFixed(1)} V DC` };
            stackGroup.add(termMesh);

            add3DLabel(`Anode (+${systemVoltage.toFixed(1)}V)`, -plateW / 2 - 0.4, currentY, 0, "#EF4444");
        }

        currentY += 0.06 + expGap;

        // REPEATING CELL PAIRS STACK
        const layerGeo = new THREE.BoxGeometry(plateW, layerThick, plateD);

        for (let i = 0; i < visualPairs; i++) {
            const pairIdx = Math.round((i + 1) * (totalCellPairs / visualPairs));
            const isMidPair = i === Math.floor(visualPairs / 2);

            if (tech === "CDI") {
                // CDI: Membrane-Free Porous Carbon Electrosorption Stack
                if (layerVisibility.electrodes) {
                    const anodeEl = new THREE.Mesh(layerGeo, carbonMat);
                    anodeEl.position.y = currentY;
                    anodeEl.userData = { name: `CDI Porous Carbon Anode (Pair #${pairIdx})`, type: "Porous Carbon Electrode", technology: "CDI" };
                    stackGroup.add(anodeEl);
                    if (isMidPair || isExp) add3DLabel(`Porous Carbon Anode #${pairIdx}`, plateW / 2 + 0.25, currentY, 0, "#475569");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    const sp = new THREE.Mesh(layerGeo, spacerMat);
                    sp.position.y = currentY;
                    sp.userData = { name: `Feed Channel Flow Spacer (Pair #${pairIdx})`, type: "Feed Water Spacer", technology: "CDI" };
                    stackGroup.add(sp);
                    if (isMidPair || isExp) add3DLabel("Feed Channel Spacer", -plateW / 2 - 0.25, currentY, plateD / 2, "#10B981");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.electrodes) {
                    const cathodeEl = new THREE.Mesh(layerGeo, carbonMat);
                    cathodeEl.position.y = currentY;
                    cathodeEl.userData = { name: `CDI Porous Carbon Cathode (Pair #${pairIdx})`, type: "Porous Carbon Electrode", technology: "CDI" };
                    stackGroup.add(cathodeEl);
                    if (isMidPair || isExp) add3DLabel(`Porous Carbon Cathode #${pairIdx}`, plateW / 2 + 0.25, currentY, 0, "#475569");
                }
                currentY += layerThick + expGap;

            } else if (tech === "MCDI") {
                // MCDI: Fixed Porous Carbon Electrodes + AEM (Anode side) & CEM (Cathode side)
                if (layerVisibility.electrodes) {
                    const anodeEl = new THREE.Mesh(layerGeo, carbonMat);
                    anodeEl.position.y = currentY;
                    anodeEl.userData = { name: `MCDI Carbon Anode (Pair #${pairIdx})`, type: "Fixed Porous Carbon Electrode", technology: "MCDI" };
                    stackGroup.add(anodeEl);
                }
                currentY += layerThick + expGap;

                if (layerVisibility.aem) {
                    const aem = new THREE.Mesh(layerGeo, aemMat);
                    aem.position.y = currentY;
                    aem.userData = { name: `Anion Exchange Membrane (AEM, Pair #${pairIdx})`, type: "AEM Membrane", technology: "MCDI" };
                    stackGroup.add(aem);
                    if (isMidPair || isExp) add3DLabel("AEM Membrane (Anode)", plateW / 2 + 0.25, currentY, -plateD / 2, "#0284C7");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    const sp = new THREE.Mesh(layerGeo, spacerMat);
                    sp.position.y = currentY;
                    sp.userData = { name: `Feed Channel Spacer (Pair #${pairIdx})`, type: "Flow Spacer", technology: "MCDI" };
                    stackGroup.add(sp);
                    if (isMidPair || isExp) add3DLabel("Feed Water Channel", -plateW / 2 - 0.25, currentY, 0, "#10B981");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.cem) {
                    const cem = new THREE.Mesh(layerGeo, cemMat);
                    cem.position.y = currentY;
                    cem.userData = { name: `Cation Exchange Membrane (CEM, Pair #${pairIdx})`, type: "CEM Membrane", technology: "MCDI" };
                    stackGroup.add(cem);
                    if (isMidPair || isExp) add3DLabel("CEM Membrane (Cathode)", plateW / 2 + 0.25, currentY, plateD / 2, "#D97706");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.electrodes) {
                    const cathodeEl = new THREE.Mesh(layerGeo, carbonMat);
                    cathodeEl.position.y = currentY;
                    cathodeEl.userData = { name: `MCDI Carbon Cathode (Pair #${pairIdx})`, type: "Fixed Porous Carbon Electrode", technology: "MCDI" };
                    stackGroup.add(cathodeEl);
                }
                currentY += layerThick + expGap;

            } else if (tech === "FCDI") {
                // FCDI: Flowing Carbon Slurry Electrode Channels + AEM/CEM Membranes + Feed Water Channel
                if (layerVisibility.slurry) {
                    const anodeSlurry = new THREE.Mesh(layerGeo, slurryMat);
                    anodeSlurry.position.y = currentY;
                    anodeSlurry.userData = { name: `Anode Carbon Slurry Channel (Pair #${pairIdx})`, type: "Flowing Slurry Chamber", slurryConcentration: "10 wt% Carbon", technology: "FCDI" };
                    stackGroup.add(anodeSlurry);
                    if (isMidPair || isExp) add3DLabel("Anode Slurry Loop", plateW / 2 + 0.25, currentY, -plateD / 2, "#475569");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.aem) {
                    const aem = new THREE.Mesh(layerGeo, aemMat);
                    aem.position.y = currentY;
                    aem.userData = { name: `Anion Exchange Membrane (AEM, Pair #${pairIdx})`, type: "AEM Membrane", technology: "FCDI" };
                    stackGroup.add(aem);
                    if (isMidPair || isExp) add3DLabel("AEM Membrane", -plateW / 2 - 0.25, currentY, -plateD / 2, "#0284C7");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.spacers) {
                    const waterChamber = new THREE.Mesh(layerGeo, spacerMat);
                    waterChamber.position.y = currentY;
                    waterChamber.userData = { name: `Central Feed-Water Desalination Channel (Pair #${pairIdx})`, type: "Desalination Water Channel", technology: "FCDI" };
                    stackGroup.add(waterChamber);
                    if (isMidPair || isExp) add3DLabel("Water Flow Channel", plateW / 2 + 0.25, currentY, 0, "#10B981");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.cem) {
                    const cem = new THREE.Mesh(layerGeo, cemMat);
                    cem.position.y = currentY;
                    cem.userData = { name: `Cation Exchange Membrane (CEM, Pair #${pairIdx})`, type: "CEM Membrane", technology: "FCDI" };
                    stackGroup.add(cem);
                    if (isMidPair || isExp) add3DLabel("CEM Membrane", -plateW / 2 - 0.25, currentY, plateD / 2, "#D97706");
                }
                currentY += layerThick + expGap;

                if (layerVisibility.slurry) {
                    const cathodeSlurry = new THREE.Mesh(layerGeo, slurryMat);
                    cathodeSlurry.position.y = currentY;
                    cathodeSlurry.userData = { name: `Cathode Carbon Slurry Channel (Pair #${pairIdx})`, type: "Flowing Slurry Chamber", slurryConcentration: "10 wt% Carbon", technology: "FCDI" };
                    stackGroup.add(cathodeSlurry);
                    if (isMidPair || isExp) add3DLabel("Cathode Slurry Loop", plateW / 2 + 0.25, currentY, plateD / 2, "#475569");
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

        // TOP CATHODE TERMINAL
        if (layerVisibility.terminals) {
            const termCathGeo = new THREE.BoxGeometry(plateW * 0.9, 0.05, plateD * 0.9);
            const termCathMesh = new THREE.Mesh(termCathGeo, terminalCathodeMat);
            termCathMesh.position.y = currentY;
            termCathMesh.userData = { name: "Cathode Current Collector Busbar (-V)", type: "Electrical Terminal" };
            stackGroup.add(termCathMesh);

            add3DLabel("Cathode (-0V)", -plateW / 2 - 0.4, currentY, 0, "#2563EB");
        }

        currentY += 0.06 + expGap;

        // TOP END PLATE
        if (layerVisibility.endPlates) {
            const tEndGeo = new THREE.BoxGeometry(plateW + 0.3, endPlateThickness, plateD + 0.3);
            const tEndMesh = new THREE.Mesh(tEndGeo, endPlateMat);
            tEndMesh.position.y = currentY;
            tEndMesh.userData = { name: "Top Stainless Steel End Plate", type: "End Plate" };
            stackGroup.add(tEndMesh);

            add3DLabel("End Plate", plateW / 2 + 0.3, currentY, plateD / 2 + 0.2, "#64748B");
        }

        // PIPING & MANIFOLDS
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, metalness: 0.6, roughness: 0.3 });
        const prodPipeMat = new THREE.MeshStandardMaterial({ color: 0x16A34A, metalness: 0.6, roughness: 0.3 });

        const inPipeGeo = new THREE.CylinderGeometry(0.08, 0.08, currentY + 0.6, 16);
        const inPipe = new THREE.Mesh(inPipeGeo, pipeMat);
        inPipe.position.set(-plateW / 2 - 0.25, currentY / 2, 0);
        inPipe.userData = { name: "Feed Water Inlet Pipe", type: "Piping" };
        stackGroup.add(inPipe);

        add3DLabel(`Inlet (${flowRate} L/min)`, -plateW / 2 - 0.35, currentY / 2, plateD / 2 + 0.2, "#0284C7");

        const outPipe = new THREE.Mesh(inPipeGeo, prodPipeMat);
        outPipe.position.set(plateW / 2 + 0.25, currentY / 2, 0);
        outPipe.userData = { name: "Product Water Outlet Pipe", type: "Piping" };
        stackGroup.add(outPipe);

        add3DLabel(`Outlet (${outletTDS} ppm)`, plateW / 2 + 0.35, currentY / 2, plateD / 2 + 0.2, "#16A34A");

        // FLOW PARTICLES
        if (layerVisibility.flow || displayMode === "FLOW") {
            const particleCount = 40;
            const pGeo = new THREE.SphereGeometry(0.03, 8, 8);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x0284C7 });
            
            for (let p = 0; p < particleCount; p++) {
                const particle = new THREE.Mesh(pGeo, pMat);
                particle.position.set(
                    -plateW / 2 - 0.25 + Math.random() * (plateW + 0.5),
                    (Math.random() - 0.5) * currentY,
                    (Math.random() - 0.5) * plateD
                );
                particlesGroup.add(particle);
            }
        }

        // DIMENSION ANNOTATIONS
        if (layerVisibility.dimensions || displayMode === "DIMENSIONS") {
            const dimMat = new THREE.LineBasicMaterial({ color: 0x0284C7, linewidth: 2 });
            
            const pointsY = [
                new THREE.Vector3(plateW / 2 + 0.5, -(visualPairs * 0.1), plateD / 2 + 0.5),
                new THREE.Vector3(plateW / 2 + 0.5, currentY, plateD / 2 + 0.5)
            ];
            const dimLineY = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsY), dimMat);
            dimensionsGroup.add(dimLineY);

            add3DLabel(`Height: ${totalThicknessMm} mm`, plateW / 2 + 0.6, currentY / 2, plateD / 2 + 0.5, "#0284C7");

            const pointsX = [
                new THREE.Vector3(-plateW / 2, currentY + 0.4, plateD / 2 + 0.4),
                new THREE.Vector3(plateW / 2, currentY + 0.4, plateD / 2 + 0.4)
            ];
            const dimLineX = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pointsX), dimMat);
            dimensionsGroup.add(dimLineX);

            add3DLabel(`Width: ${sideDimMm} mm`, 0, currentY + 0.5, plateD / 2 + 0.4, "#0284C7");
        }

        // Auto-fit camera framing
        handleFitModel();

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
            borderRadius: "8px",
            padding: "12px",
            color: "#0F172A",
            border: "1px solid #CBD5E1",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            width: "100%",
            boxSizing: "border-box",
            overflow: "hidden"
        }}>
            {/* CONTAINER CSS STYLES FOR LIGHT ENGINEERING CAD THEME & OVERLAYS */}
            <style>{`
                .cad-viewport {
                    width: 100%;
                    height: 420px;
                    min-height: 360px;
                    max-height: 460px;
                    position: relative;
                    overflow: hidden;
                    background: #F8FAFC;
                    border: 1px solid #CBD5E1;
                    border-radius: 8px;
                }
                @media (max-width: 1200px) {
                    .cad-viewport {
                        height: 380px;
                    }
                }
                @media (max-width: 768px) {
                    .cad-viewport {
                        height: 320px;
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
                    top: 12px;
                    left: 12px;
                    z-index: 20;
                    background: rgba(255, 255, 255, 0.94);
                    color: #0F172A;
                    border: 1px solid #CBD5E1;
                    border-radius: 6px;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
                    backdrop-filter: blur(8px);
                    padding: 8px 12px;
                    font-size: 10.5px;
                    pointer-events: auto;
                }
                .cad-dimensions {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    z-index: 20;
                    background: rgba(255, 255, 255, 0.96);
                    color: #0F172A;
                    border: 1px solid #CBD5E1;
                    border-radius: 6px;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
                    max-width: 210px;
                    max-height: calc(100% - 24px);
                    overflow-y: auto;
                    padding: 8px 10px;
                    font-size: 10.5px;
                    pointer-events: auto;
                }
                .cad-3d-label {
                    padding: 4px 7px;
                    background: rgba(255, 255, 255, 0.96);
                    color: #0F172A;
                    border: 1px solid #94A3B8;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);
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

                {/* TECHNOLOGY SELECTION BUTTONS */}
                <div style={{ display: "flex", gap: "4px", background: "#F1F5F9", padding: "3px", borderRadius: "6px", border: "1px solid #CBD5E1" }}>
                    {["CDI", "MCDI", "FCDI", "EDI"].map((t) => (
                        <button
                            key={t}
                            onClick={() => {
                                if (setTechnology) setTechnology(t);
                            }}
                            style={{
                                background: tech === t ? "#2563EB" : "transparent",
                                color: tech === t ? "#FFFFFF" : "#64748B",
                                border: "none",
                                padding: "4px 10px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer"
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* EDI PRETREATMENT WARNING BANNER */}
            {isEdiWarning && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "6px", padding: "6px 10px", marginBottom: "8px", fontSize: "11px", color: "#991B1B", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>⚠️</span>
                    <div>
                        <strong>EDI Feed Quality Envelope Alert:</strong> Feed TDS ({feedTDS} ppm) exceeds direct EDI limit (&lt; 30 ppm TDS). Reverse Osmosis (RO) pretreatment required.
                    </div>
                </div>
            )}

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
                <div className="cad-telemetry">
                    <div style={{ color: "#0284C7", fontWeight: "700", marginBottom: "4px", fontSize: "11.5px" }}>Calculated Stack Data</div>
                    <div style={{ color: "#475569", display: "flex", flexDirection: "column", gap: "2px", fontSize: "10.5px" }}>
                        <div>Hydraulic Velocity: <strong style={{ color: "#0F172A" }}>{flowVelocity.toFixed(3)} m/s</strong></div>
                        <div>Pressure Drop: <strong style={{ color: "#0F172A" }}>{pressureDrop.toFixed(0)} Pa</strong></div>
                        <div>Stack Power: <strong style={{ color: "#0F172A" }}>{power.toFixed(1)} W</strong></div>
                        <div>System Voltage: <strong style={{ color: "#0F172A" }}>{systemVoltage.toFixed(1)} V DC</strong></div>
                        <div>Operating Current: <strong style={{ color: "#0F172A" }}>{operatingCurrent.toFixed(2)} A</strong></div>
                    </div>
                    <div style={{ fontSize: "9px", color: "#64748B", marginTop: "4px", borderTop: "1px solid #E2E8F0", paddingTop: "3px" }}>
                        Values calculated from the current design configuration.
                    </div>
                </div>

                {/* ABSOLUTE OVERLAY 2: RIGHT-SIDE DIMENSIONS & LAYER VISIBILITY PANEL */}
                <div className="cad-dimensions">
                    <div style={{ borderBottom: "1px solid #E2E8F0", paddingBottom: "4px", marginBottom: "6px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#0284C7", marginBottom: "4px" }}>Stack Dimensions</div>
                        <div style={{ color: "#475569", display: "flex", flexDirection: "column", gap: "2px", fontSize: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Width:</span><strong style={{ color: "#0F172A" }}>{sideDimMm} mm</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Length:</span><strong style={{ color: "#0F172A" }}>{sideDimMm} mm</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Height:</span><strong style={{ color: "#0F172A" }}>{totalThicknessMm} mm</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Membrane:</span><strong style={{ color: "#0F172A" }}>{membraneThickness} mm</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Spacer:</span><strong style={{ color: "#0F172A" }}>{spacerThickness} mm</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Electrode:</span><strong style={{ color: "#0F172A" }}>{electrodeThickness} mm</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Pair Spacing:</span><strong style={{ color: "#0F172A" }}>{pairThicknessMm.toFixed(2)} mm</strong></div>
                        </div>
                    </div>

                    <div style={{ borderBottom: "1px solid #E2E8F0", paddingBottom: "4px", marginBottom: "6px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#0284C7", marginBottom: "3px" }}>Layer Visibility</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <label style={{ color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                <input type="checkbox" checked={layerVisibility.endPlates} onChange={(e) => setLayerVisibility({ ...layerVisibility, endPlates: e.target.checked })} />
                                End Plates
                            </label>
                            <label style={{ color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                <input type="checkbox" checked={layerVisibility.electrodes} onChange={(e) => setLayerVisibility({ ...layerVisibility, electrodes: e.target.checked })} />
                                Carbon Electrodes
                            </label>
                            {tech !== "CDI" && (
                                <>
                                    <label style={{ color: "#0284C7", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <input type="checkbox" checked={layerVisibility.aem} onChange={(e) => setLayerVisibility({ ...layerVisibility, aem: e.target.checked })} />
                                        AEM Membranes
                                    </label>
                                    <label style={{ color: "#D97706", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <input type="checkbox" checked={layerVisibility.cem} onChange={(e) => setLayerVisibility({ ...layerVisibility, cem: e.target.checked })} />
                                        CEM Membranes
                                    </label>
                                </>
                            )}
                            <label style={{ color: "#059669", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                <input type="checkbox" checked={layerVisibility.spacers} onChange={(e) => setLayerVisibility({ ...layerVisibility, spacers: e.target.checked })} />
                                Flow Spacers
                            </label>
                            <label style={{ color: "#0284C7", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                <input type="checkbox" checked={layerVisibility.labels} onChange={(e) => setLayerVisibility({ ...layerVisibility, labels: e.target.checked })} />
                                3D Callouts
                            </label>
                        </div>
                    </div>

                    {/* MATERIAL LEGEND */}
                    <div style={{ fontSize: "9.5px", color: "#64748B" }}>
                        <strong style={{ color: "#0F172A", display: "block", marginBottom: "2px" }}>Legend:</strong>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                            <span style={{ color: "#DC2626" }}>■ Anode (+V)</span>
                            <span style={{ color: "#2563EB" }}>■ Cathode (-V)</span>
                            {tech !== "CDI" && <span style={{ color: "#0284C7" }}>■ AEM (Cyan)</span>}
                            {tech !== "CDI" && <span style={{ color: "#D97706" }}>■ CEM (Amber)</span>}
                            <span style={{ color: "#059669" }}>■ Flow Spacer (Teal)</span>
                        </div>
                    </div>
                </div>

                {/* CLICKED COMPONENT INSPECTOR TAG */}
                {selectedComponent && (
                    <div style={{ position: "absolute", bottom: "12px", left: "12px", zIndex: 25, background: "rgba(255, 255, 255, 0.96)", border: "1px solid #0284C7", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", maxWidth: "320px", boxShadow: "0 4px 14px rgba(15,23,42,0.15)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <strong style={{ color: "#0284C7", fontSize: "11.5px" }}>{selectedComponent.name}</strong>
                            <button onClick={() => setSelectedComponent(null)} style={{ background: "transparent", border: "none", color: "#64748B", cursor: "pointer", fontSize: "12px" }}>✕</button>
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

            {/* CAD DESIGN FOOTNOTE */}
            <div style={{ marginTop: "6px", borderTop: "1px solid #E2E8F0", paddingTop: "5px", fontSize: "10px", color: "#64748B", textAlign: "center", lineHeight: "1.4" }}>
                <span>Design basis: Generated parametrically from stack sizing parameters. Pressure vessel and mechanical stress analysis not performed. CAD geometry is a parametric design representation and is not a certified mechanical design.</span>
            </div>
        </div>
    );
}
