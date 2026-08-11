# TECHNOLOGY ARCHITECTURE & CAD MAP SPECIFICATION
**Physical Cell Architectures, Layer Stacks, Flow Maps, and 3D-CAD Components**
*Document Version: 1.0*
*Status: Authoritative Architectural Blueprint for CDI-EDI Platform*

---

## 1. OVERVIEW

This document specifies the authoritative physical cell architectures, layer configurations, flow arrangements, electrical wiring topologies, and 3D CAD representation maps for the four desalination technologies supported by the platform:
1. **Capacitive Deionization (CDI)**
2. **Membrane Capacitive Deionization (MCDI)**
3. **Flow-Electrode Capacitive Deionization (FCDI)**
4. **Electrodeionization (EDI)**

---

## 2. TECHNOLOGY ARCHITECTURE 1: CAPACITIVE DEIONIZATION (CDI)

### 2.1 Physical Layer Stack
```
+-------------------------------------------------------------+
| End Plate / Compression Frame (Anode Side)                  |
+-------------------------------------------------------------+
| Current Collector Plate (Graphite / Titanium Foil)          |
+-------------------------------------------------------------+
| Anode Porous Carbon Electrode (Activated Carbon / Aerogel)  |
+-------------------------------------------------------------+
| Open Flow Spacer Channel (Woven Netting Mesh, 0.3 - 0.5 mm) |
+-------------------------------------------------------------+
| Cathode Porous Carbon Electrode (Activated Carbon / Aerogel)|
+-------------------------------------------------------------+
| Current Collector Plate (Graphite / Titanium Foil)          |
+-------------------------------------------------------------+
| End Plate / Compression Frame (Cathode Side)                |
+-------------------------------------------------------------+
```

### 2.2 Operational Flow Arrangement & Cycle State Machine
- **Flow Mode:** Flow-by (parallel to planar electrode face) or Flow-through (perpendicular).
- **Operation State Machine:**
  1. **Adsorption Phase ($t_{ads}$, $10 - 15 \text{ min}$):** $+V_{cell}$ applied. Feed water enters, $Na^+$ and $Cl^-$ electrosorb into carbon EDL micropores. Desalted product stream exits to product tank.
  2. **Desorption Phase ($t_{des}$, $5 - 10 \text{ min}$):** $0 \text{ V}$ (short circuit). Electro-adsorbed ions release back into flow channel. Concentrated brine flush stream exits to waste tank.

### 2.3 CAD Representation Requirements
- **Components to Render:**
  - Anode & Cathode porous carbon plates (dark gray textured material).
  - Open flow spacer netting (semi-transparent blue/mesh pattern).
  - Terminal current collectors (copper/titanium end lugs).
  - Flow arrows for feed inlet, desalted product, and brine waste.
  - EDL ion electrosorption vectors ($Na^+$ red spheres, $Cl^-$ blue spheres).

---

## 3. TECHNOLOGY ARCHITECTURE 2: MEMBRANE CAPACITIVE DEIONIZATION (MCDI)

### 3.1 Physical Layer Stack
```
+-------------------------------------------------------------+
| Current Collector Plate (Anode Side)                        |
+-------------------------------------------------------------+
| Anode Porous Carbon Electrode                               |
+-------------------------------------------------------------+
| Anion Exchange Membrane (AEM Sheet, ~0.15 mm)               |
+-------------------------------------------------------------+
| Open Flow Spacer Channel (Woven Netting Mesh, 0.3 - 0.5 mm) |
+-------------------------------------------------------------+
| Cation Exchange Membrane (CEM Sheet, ~0.15 mm)              |
+-------------------------------------------------------------+
| Cathode Porous Carbon Electrode                             |
+-------------------------------------------------------------+
| Current Collector Plate (Cathode Side)                      |
+-------------------------------------------------------------+
```

### 3.2 Operational Flow Arrangement & Cycle State Machine
- **Flow Mode:** Flow-by spacer channel bounded by AEM and CEM.
- **Operation State Machine:**
  1. **Adsorption Phase ($t_{ads}$, $10 - 20 \text{ min}$):** $+V_{cell}$ applied ($1.0 - 1.6 \text{ V}$). Anions pass AEM into anode pores; cations pass CEM into cathode pores. Co-ion expulsion is blocked by membranes. Product stream exits.
  2. **Reversed Polarity Desorption Phase ($t_{des}$, $3 - 8 \text{ min}$):** $-V_{cell}$ applied ($-1.4 \text{ V}$). Electro-adsorbed ions are rapidly repelled into channel, forming a high-salinity brine peak.

### 3.3 CAD Representation Requirements
- **Components to Render:**
  - Carbon electrodes + AEM sheet (yellow tinted layer) + CEM sheet (green tinted layer).
  - Spacer channel with directional counter-ion movement ($Cl^-$ through AEM, $Na^+$ through CEM).
  - Polarity reversal indicator ($+1.4 \text{ V} \leftrightarrow -1.4 \text{ V}$).

---

## 4. TECHNOLOGY ARCHITECTURE 3: FLOW-ELECTRODE CAPACITIVE DEIONIZATION (FCDI)

### 4.1 Physical Layer Stack
```
+-------------------------------------------------------------+
| Anode Slurry Channel (Circulating Carbon Slurry 5-20 wt%)   |
+-------------------------------------------------------------+
| Anion Exchange Membrane (AEM Sheet)                         |
+-------------------------------------------------------------+
| Central Feed Spacer Channel (Desalting Channel)             |
+-------------------------------------------------------------+
| Cation Exchange Membrane (CEM Sheet)                        |
+-------------------------------------------------------------+
| Cathode Slurry Channel (Circulating Carbon Slurry 5-20 wt%) |
+-------------------------------------------------------------+
```

### 4.2 Operational Flow Arrangement & Cycle State Machine
- **Flow Mode:** **Continuous Desalting**. Feed water flows through central channel while carbon slurry is pumped continuously through anode and cathode slurry chambers.
- **External Loops:** Slurry flows to external electrical/thermal discharger tanks, regenerating slurry continuously before returning to stack.

### 4.3 CAD Representation Requirements
- **Components to Render:**
  - Dual slurry flow chambers with dynamic animated slurry particle flow (dark slurry suspension).
  - Central feed channel with AEM/CEM boundary sheets.
  - Peristaltic slurry circulation pumps and external slurry reservoir tanks.

---

## 5. TECHNOLOGY ARCHITECTURE 4: ELECTRODEIONIZATION (EDI)

### 4.1 Physical Layer Stack
```
+-------------------------------------------------------------+
| Anode End Plate & Anode Chamber (Titanium coated IrO2/Pt)   |
+-------------------------------------------------------------+
| Anion Exchange Membrane (AEM Sheet)                         |
+-------------------------------------------------------------+
| Diluate Channel packed with Mixed-Bed Ion-Exchange Resin    |
| (40% Cation / 60% Anion Resin Beads, d_p = 0.5 - 0.7 mm)    |
+-------------------------------------------------------------+
| Cation Exchange Membrane (CEM Sheet)                        |
+-------------------------------------------------------------+
| Concentrate Channel (Brine Stream)                          |
+-------------------------------------------------------------+
| Cathode Chamber & Cathode Plate                             |
+-------------------------------------------------------------+
```

### 4.2 Operational Flow Arrangement & Cycle State Machine
- **Flow Mode:** **Continuous Ultra-Pure Polishing**. Feed water (RO permeate $< 30 \text{ mg/L}$) enters dilute channel.
- **Water Splitting State:** High DC electric field ($5 - 50 \text{ V/cell}$) drives electro-dissociation of water ($H_2O \rightarrow H^+ + OH^-$) at resin bead boundaries, continuously auto-regenerating resin sites.

### 4.3 CAD Representation Requirements
- **Components to Render:**
  - Packed bed diluate compartment with spherical resin beads (red cation beads, blue anion beads).
  - Water-splitting dissociation symbol markers ($H^+$ and $OH^-$ ions generated at interfaces).
  - RO Permeate inlet line and Ultra-Pure Water ($18.2 \text{ M}\Omega\cdot\text{cm}$) outlet line.

---

## 6. CAD MAPPING SUMMARY MATRIX

| Technology | Cell Structure | Key Visual Layers | Distinctive Animated Feature |
| :--- | :--- | :--- | :--- |
| **CDI** | Uncoated Carbon Stack | Carbon / Spacer / Carbon | EDL ion accumulation into carbon matrix |
| **MCDI** | Membrane-Coated Stack | Carbon / AEM / Spacer / CEM / Carbon | Polarity reversal (RPD) brine flush |
| **FCDI** | Slurry Flow Reactor | Slurry Chamber / AEM / Feed / CEM / Slurry | Pumping carbon slurry circulation loops |
| **EDI** | Resin-Packed Electromembrane | Anode / AEM / Mixed-Bed Resin / CEM / Cathode | Continuous water-splitting ($H^+/OH^-$) |

---
*End of Technology Architecture Specification.*
