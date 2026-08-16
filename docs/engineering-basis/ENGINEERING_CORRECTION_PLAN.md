# ENGINEERING CORRECTION PLAN: CDI-EDI DESIGN PLATFORM
**Systematic Remediation Plan & Physics Core Refactoring Blueprint**
*Date: August 2026*
*Author: Lead Desalination & Electrochemical Systems Engineer*

---

## 1. EXECUTIVE OVERVIEW & GOVERNING PRINCIPLES

This document establishes the official engineering correction plan for the CDI-EDI Design Platform based on `TECHNICAL_AUDIT.md` and `technology_model_spec.md`.

### Core Architectural Directive
The platform must **never force all four technologies into a single unified CDI mass-balance equation**. While CDI, MCDI, and FCDI share an electrosorption family resemblance, **MCDI adds ion-exchange membranes**, **FCDI changes the electrode architecture to a flowing carbon slurry**, and **EDI is a distinct electromembrane/resin process** driven by continuous water-splitting auto-regeneration.

```
                      +------------------------------------------+
                      | Single Source of Truth Engine Pipeline   |
                      +------------------------------------------+
                                           |
                                           v
                        +-------------------------------------+
                        | Feed Quality & Envelope Check Gate  |
                        +-------------------------------------+
                                           |
         +---------------------------------+---------------------------------+
         |                                                                   |
         v                                                                   v
+-------------------------------+                         +-------------------------------+
| CDI Family Solver Branch      |                         | EDI Electromembrane Solver    |
+-------------------------------+                         +-------------------------------+
| 1. CDI Solver (No membranes)  |                         | - Mixed-Bed Resin Bed         |
| 2. MCDI Solver (AEM/CEM RPD)  |                         | - Limiting Current & Water    |
| 3. FCDI Solver (Slurry Flow)  |                         |   Splitting Auto-Regen        |
+-------------------------------+                         +-------------------------------+
```

---

## 2. CATEGORIZATION OF IDENTIFIED ISSUES

All identified codebase issues are categorized into three severity levels:
- **Category A: Critical — Physically Incorrect** (Must be corrected before platform release as an engineering design tool).
- **Category B: Major — Simplified / Empirical** (Can remain temporarily, but must be explicitly documented as empirical or calibration-dependent).
- **Category C: Minor — Presentation / Unit / Consistency** (Corrected after critical issues to ensure UI/documentation alignment).

---

### CATEGORY A: CRITICAL — PHYSICALLY INCORRECT

---

#### Issue A-1: EDI Equation Inheritance (SAC & Carbon Mass Sizing for EDI)
- **Current Implementation:** `engineeringEquationEngine.js` (lines 88–100) forces EDI into batch carbon electrode mass calculation ($m_{req} = Q \cdot t_{cycle} \cdot \Delta C / SAC$) and applies carbon Salt Adsorption Capacity ($SAC = 50 \text{ mg/g}$).
- **Correct Physical Principle:** EDI is a continuous electromembrane resin process. Resins do not saturate like porous carbon electrodes because electro-dissociated water ($H^+/OH^-$) continuously regenerates ion-exchange sites *in situ*. Carbon electrode $SAC$ has zero physical relevance to EDI.
- **Governing Equation/Model:**
  $$\dot{m}_{salt} = Q_{diluate} (C_{in} - C_{out}) = \frac{N_{pairs} \cdot I \cdot \eta_i \cdot M_{NaCl}}{z F}$$
  $$V_{module} = N_{pairs} \cdot \left( I R_{bed} + V_{mem, AEM} + V_{mem, CEM} + \Delta V_{water\_splitting} \right)$$
- **Required Inputs:** Feed TDS ($C_{in}$), target TDS ($C_{target}$), feed flow rate ($Q_{feed}$), resin bed thickness ($d_{bed}$), bead diameter ($d_p$), operating current density ($J$).
- **Required Outputs:** Diluate outlet TDS ($C_{out}$), required cell pairs ($N_{pairs}$), module voltage ($V_{module}$), power ($P$), SEC.
- **Units:** $C_{in}, C_{out}$ ($\text{mg/L}$), $Q_{feed}$ ($\text{m}^3/\text{h}$ or $\text{L/min}$), $J$ ($\text{A/m}^2$), $V$ ($\text{V}$), $P$ ($\text{W}$), SEC ($\text{kWh/m}^3$).
- **Literature vs Calibration:** Literature supported (DuPont EDI Manual; Wood et al., 2010). Resin bed resistance $R_{bed}$ requires empirical calibration.
- **Exact Source File & Function:** `client/src/engineering/engineeringEquationEngine.js` $\rightarrow$ `calculateEngineering()`
- **Validation Test Required:** Assert EDI calculation throws an explicit configuration warning if forced to evaluate carbon $SAC$ or batch adsorption cycle time $t_{cycle}$.
- **Technology Separation:** EDI ONLY.

---

#### Issue A-2: CDI Charge Efficiency Model ($\Lambda$ Increasing with Voltage)
- **Current Implementation:** `electrodeModel.js` (lines 250–253) defines charge efficiency as $\Lambda = 0.80 + 0.05 \times V_{cell}$ for all technologies.
- **Correct Physical Principle:** In CDI (uncoated carbon electrodes), charge efficiency **decreases** with increasing cell voltage because higher potentials increase co-ion expulsion and trigger parasitic reactions (e.g. dissolved oxygen reduction, carbon oxidation).
- **Governing Equation/Model:** Modified Donnan (mD) model:
  $$\Lambda_{CDI} = \tanh\left( \frac{z F \Delta \phi_{st}}{2 R T} \right)$$
  Where Stern potential drop $\Delta \phi_{st}$ depends on electrode micropore charge density.
- **Required Inputs:** Cell voltage ($V_{cell}$), feed ionic strength ($I_s$), micropore volume ($v_{mic}$).
- **Required Outputs:** Dynamic charge efficiency $\Lambda_{CDI} \in [0.50, 0.82]$.
- **Units:** Dimensionless ($0.0 - 1.0$).
- **Literature vs Calibration:** Literature supported (Biesheuvel & van der Wal, 2010; Zhao et al., 2012). Stern capacitance $C_{st,vol}$ requires experimental calibration.
- **Exact Source File & Function:** `client/src/engineering/electrodeModel.js` $\rightarrow$ `electrodeModel()`
- **Validation Test Required:** Verify that $\Lambda_{CDI}(V=1.4\text{V}) < \Lambda_{CDI}(V=0.8\text{V})$ for uncoated CDI electrodes.
- **Technology Separation:** CDI ONLY.

---

#### Issue A-3: Unit Error in Legacy Calculator (`cdiDesignCalculator.js`)
- **Current Implementation:** `cdiDesignCalculator.js` (line 370) computes SEC as `(power / 1000) / (flowRate / 1000)` where `flowRate` is in $\text{L/min}$.
- **Correct Physical Principle:** Dividing flow rate in $\text{L/min}$ by $1000$ yields $\text{m}^3/\text{min}$, NOT $\text{m}^3/\text{h}$. This results in SEC being overstated by a factor of 60 ($60\times$).
- **Governing Equation/Model:**
  $$Q_{m3h} = \frac{Q_{Lmin} \times 60}{1000} \quad (\text{m}^3/\text{h})$$
  $$SEC_{elec} = \frac{P_{elec} / 1000}{Q_{m3h}} \quad (\text{kWh/m}^3)$$
- **Required Inputs:** Power ($P_{elec}$ in $\text{W}$), flow rate ($Q$ in $\text{L/min}$).
- **Required Outputs:** SEC ($\text{kWh/m}^3$).
- **Units:** $\text{W}$, $\text{L/min}$, $\text{kWh/m}^3$.
- **Literature vs Calibration:** Standard SI dimensional conversion (Literature supported).
- **Exact Source File & Function:** `client/src/engineering/cdiDesignCalculator.js` $\rightarrow$ `calculateCDIDesign()`
- **Validation Test Required:** Assert SEC output matches $\frac{P/1000}{(Q \cdot 60 / 1000)}$.
- **Technology Separation:** Applicable to all technologies using `cdiDesignCalculator.js`.

---

#### Issue A-4: Unrestricted EDI Direct-Feed Salinity
- **Current Implementation:** `engineeringEquationEngine.js` (lines 44–54) generates a warning when EDI is fed raw water ($> 30 \text{ mg/L TDS}$), but permits the calculation to proceed, outputting fictitious low energy consumption numbers.
- **Correct Physical Principle:** EDI cannot treat high-salinity raw water. High feed concentration causes severe concentration polarization, excessive current density, scaling ($CaCO_3, Mg(OH)_2$), and rapid resin exhaustion. Pretreatment (RO permeate) is mandatory.
- **Governing Equation/Model:**
  $$\text{If } C_{feed} > 30 \text{ mg/L} \implies \text{Feasibility Gate} = \text{FALSE}, \quad \text{Train} = \text{"RO } \rightarrow \text{ EDI"}$$
- **Required Inputs:** Feed TDS ($C_{feed}$), hardness ($H$).
- **Required Outputs:** `feedQualityFeasible` ($\text{Boolean}$), `processTrainName` ($\text{String}$).
- **Units:** $\text{mg/L}$.
- **Literature vs Calibration:** Literature supported (ASTM D5197; DuPont EDI Specification).
- **Exact Source File & Function:** `client/src/engineering/engineeringEquationEngine.js` $\rightarrow$ `calculateEngineering()`
- **Validation Test Required:** Assert EDI simulation returns `feedQualityFeasible = false` when feed TDS $= 500 \text{ mg/L}$.
- **Technology Separation:** EDI ONLY.

---

### CATEGORY B: MAJOR — SIMPLIFIED / EMPIRICAL

---

#### Issue B-1: Empirical Electrode Area Sizing Rule
- **Current Implementation:** `engineeringEquationEngine.js` (line 91) calculates electrode area via `calculatedElectrodeArea = flowRate * targetDeltaTds * 0.08` clamped between $200$ and $1800 \text{ cm}^2$.
- **Correct Physical Principle:** Planar electrode area must be derived from mass transfer flux and operating current density:
  $$A_{total} = N_{pairs} \cdot A_{pair} = \frac{Q_{feed} (C_{in} - C_{out}) \cdot z F}{J_{operating} \cdot \Lambda \cdot M_{NaCl}}$$
- **Required Inputs:** Flow rate ($Q_{feed}$), $\Delta C$, operating current density ($J_{operating}$), charge efficiency ($\Lambda$).
- **Required Outputs:** Required total electrode area ($A_{total}$ in $\text{m}^2$ or $\text{cm}^2$).
- **Units:** $\text{cm}^2$ or $\text{m}^2$.
- **Literature vs Calibration:** Theoretical foundation is Faraday's Law; operational current density limits $J_{operating}$ require experimental calibration per electrode material.
- **Exact Source File & Function:** `client/src/engineering/engineeringEquationEngine.js` $\rightarrow$ `calculateEngineering()`
- **Validation Test Required:** Verify $A_{total}$ scales linearly with mass removal rate $\dot{m}_{salt}$.
- **Technology Separation:** CDI, MCDI, FCDI.

---

#### Issue B-2: Static Charge Efficiency Coefficients in Config
- **Current Implementation:** `desalinationTechConfig.json` hardcodes static single-value charge efficiencies ($\text{CDI}=82\%$, $\text{MCDI}=92\%$, $\text{FCDI}=90\%$, $\text{EDI}=98\%$).
- **Correct Physical Principle:** Charge efficiency varies dynamically with ionic strength, cell voltage, current density, and membrane selectivity.
- **Governing Equation/Model:**
  $$\Lambda_{MCDI} = \Lambda_{film} \cdot \sigma_{perm} \approx 0.90 - 0.98$$
  $$\Lambda_{CDI} = f(V_{cell}, C_{feed})$$
- **Required Inputs:** Dynamic cell voltage, local channel concentration, membrane permselectivity.
- **Required Outputs:** Dynamic charge efficiency ($\Lambda$).
- **Units:** Dimensionless ($0.0 - 1.0$).
- **Literature vs Calibration:** Requires experimental calibration per membrane/electrode supplier.
- **Exact Source File & Function:** `client/src/engineering/desalinationTechConfig.json`, `engineeringEquationEngine.js`
- **Validation Test Required:** Assert $\Lambda$ varies dynamically when cell voltage or feed salinity is adjusted.
- **Technology Separation:** CDI, MCDI, FCDI.

---

#### Issue B-3: Hydraulic Spacer Pressure Drop Model
- **Current Implementation:** `engineeringEquationEngine.js` (lines 183–191) uses smooth-pipe friction factor $f_{darcy} = \frac{64}{Re} + 0.35$.
- **Correct Physical Principle:** Flow channels contain woven/non-woven netting mesh spacers which create micro-turbulent eddies and severe drag ($f_{spacer} \gg f_{smooth}$).
- **Governing Equation/Model:**
  $$f_{spacer} = K_T \cdot Re^{-n} \quad (K_T \approx 3.0 - 6.0, n \approx 0.25 - 0.35)$$
  $$\Delta P = f_{spacer} \cdot \left(\frac{L}{D_h}\right) \cdot \left(\frac{\rho_w v^2}{2}\right)$$
- **Required Inputs:** Spacer filament diameter, mesh angle, Reynolds number ($Re$), channel length ($L$).
- **Required Outputs:** Spacer pressure drop ($\Delta P$ in $\text{Pa}$).
- **Units:** $\text{Pa}$ or $\text{kPa}$.
- **Literature vs Calibration:** Requires experimental calibration for specific commercial spacer netting geometry.
- **Exact Source File & Function:** `client/src/engineering/engineeringEquationEngine.js` $\rightarrow$ `calculateEngineering()`
- **Validation Test Required:** Assert calculated pressure drop increase aligns with netting mesh experimental drag data.
- **Technology Separation:** All technologies (CDI, MCDI, FCDI, EDI diluate channel).

---

### CATEGORY C: MINOR — PRESENTATION / UNIT / CONSISTENCY

---

#### Issue C-1: Auxiliary Pumping Power & Total SEC Integration
- **Current Implementation:** `economicEngine.js` calculates auxiliary power as a fixed $5.0 \text{ W}$ and computes SEC without adding hydraulic pumping power ($\frac{Q \Delta P}{\eta_{pump}}$) into the primary stack KPI dashboard.
- **Correct Physical Principle:** Total system SEC must represent the sum of electrical stack SEC and hydraulic pumping SEC:
  $$SEC_{total} = SEC_{electrical} + SEC_{hydraulic} = \frac{V_{stack} \cdot I}{Q_{prod}} + \frac{\Delta P}{\eta_{pump} \cdot R_w}$$
- **Required Inputs:** Stack power ($P_{stack}$), pump pressure drop ($\Delta P$), pump efficiency ($\eta_{pump} = 0.75$), product flow rate ($Q_{prod}$).
- **Required Outputs:** Total SEC ($SEC_{total}$ in $\text{kWh/m}^3$).
- **Units:** $\text{kWh/m}^3$.
- **Literature vs Calibration:** Literature supported.
- **Exact Source File & Function:** `client/src/engineering/economicEngine.js` $\rightarrow$ `calculateEconomics()`
- **Validation Test Required:** Assert total SEC equals $SEC_{elec} + SEC_{hydraulic}$.
- **Technology Separation:** All technologies.

---

#### Issue C-2: EDI CAD Visualization Decoupling
- **Current Implementation:** `EDISchematic.jsx` renders mixed-bed resin beads visually, but receives sizing parameters calculated using carbon electrosorption logic.
- **Correct Physical Principle:** Visual CAD/schematic components must be driven by calculated technology-specific parameters (resin bed volume, diluate channel width, limiting current density).
- **Required Inputs:** Resin bed depth, bead diameter, cell pairs, module count.
- **Required Outputs:** Rendered CAD geometry props.
- **Units:** $\text{mm}$, $\text{px}$.
- **Literature vs Calibration:** Literature supported (DuPont EDI spec).
- **Exact Source File & Function:** `client/src/components/engineering/EDISchematic.jsx`
- **Validation Test Required:** Assert EDI CAD component receives resin-specific geometry props from engine.
- **Technology Separation:** EDI ONLY.

---

## 3. SEPARATE ENGINEERING MODELS DEFINITIONS

### 3.1 Capacitive Deionization (CDI) Model Definition
- **Electrode Architecture:** Uncoated porous carbon electrodes (activated carbon, carbon cloth, aerogel).
- **Ion Transport Mechanism:** Electromigration and Electrical Double Layer (EDL) electrosorption.
- **Co-ion Behavior:** Co-ion expulsion reduces charge efficiency at high voltage / low salinity ($\Lambda_{CDI} \approx 50\% - 82\%$).
- **Operation Mode:** Discontinuous batch cycles (Adsorption phase $\rightarrow$ Short-circuit / Zero potential Desorption phase).
- **Governing Removal Equation:**
  $$\dot{m}_{salt} = Q_{feed} (C_{in} - C_{out}) = \frac{N_{pairs} \cdot I \cdot \Lambda_{CDI} \cdot M_{NaCl}}{z F}$$
- **Sizing Capacity:** Salt Adsorption Capacity ($SAC$, $10 - 25 \text{ mg/g}$ carbon).

---

### 3.2 Membrane Capacitive Deionization (MCDI) Model Definition
- **Electrode Architecture:** Porous carbon electrodes + Anion Exchange Membrane (AEM) at anode + Cation Exchange Membrane (CEM) at cathode.
- **Ion Transport Mechanism:** Electromigration through charge-selective ion-exchange membranes into EDL micropores.
- **Co-ion Behavior:** Membranes block co-ion expulsion ($\Lambda_{MCDI} \approx 90\% - 98\%$).
- **Operation Mode:** Discontinuous batch cycles (Adsorption phase $\rightarrow$ Reversed Polarity Desorption phase $-V_{cell}$).
- **Brine Concentration Peak:**
  $$C_{brine, max} = C_{in} + \left( \frac{C_{in} - C_{out}}{1 - R_w} \right)$$

---

### 3.3 Flow-Electrode Capacitive Deionization (FCDI) Model Definition
- **Electrode Architecture:** Pumped carbon slurry flow-electrodes ($5 - 20 \text{ wt\%}$ carbon in electrolyte) circulating behind AEM/CEM sheets.
- **Ion Transport Mechanism:** Continuous electromigration across membranes into suspended carbon slurry particles.
- **Operation Mode:** **Truly Continuous** desalting (no batch cycle interruptions).
- **Slurry Rheology & Pumping SEC:** Viscosity $\mu_{slurry}(\omega_{wt\%})$ dictates parasitic slurry pumping energy:
  $$P_{slurry} = 2 \times \left( \frac{Q_{slurry} \Delta P_{slurry}}{\eta_{pump}} \right)$$

---

### 3.4 Electrodeionization (EDI) Model Definition
- **Electrode Architecture:** Mixed-bed ion-exchange resin beads ($40\% \text{ cation} / 60\% \text{ anion}$) packed in diluate channel between AEM and CEM. End inert electrodes (Titanium coated with $\text{IrO}_2/\text{Pt}$).
- **Ion Transport Mechanism:** High-conductivity resin electromigration path + Electrodialysis transport across membranes.
- **Auto-Regeneration Mechanism:** Continuous **water splitting ($H_2O \rightarrow H^+ + OH^-$)** at resin interfaces under electric field strength above limiting current density $J_{lim}$.
- **Operating Bounds:** **RO Permeate Polishing ONLY** ($C_{feed} < 30 \text{ mg/L}$, Hardness $< 0.5 \text{ mg/L}$ as $\text{CaCO}_3$). Outlet product purity up to $18.2 \text{ M}\Omega\cdot\text{cm}$ ($< 0.1 \text{ mg/L TDS}$). **NO CARBON SAC OR BATCH CYCLE INHERITANCE.**

---

## 4. AUTHORITATIVE MASS BALANCE FRAMEWORK

Before calculating outlet TDS for any technology, the engine must enforce the universal species mass balance:

$$\text{Salt Removal Rate } (\dot{m}_{salt}, \text{g/s}) = \text{Feed Salt Load } (\dot{m}_{feed}) - \text{Product Salt Load } (\dot{m}_{prod})$$

$$\dot{m}_{salt} = Q_{feed} \cdot C_{feed} - Q_{prod} \cdot C_{prod} = Q_{feed} \cdot C_{feed} - (Q_{feed} \cdot R_w) \cdot C_{prod}$$

$$C_{out} \equiv C_{prod} = \frac{Q_{feed} \cdot C_{feed} - \dot{m}_{salt}}{Q_{feed} \cdot R_w}$$

### TDS to Molar Conversion Rule
Total Dissolved Solids ($\text{TDS}$, $\text{mg/L}$) is converted to molar monovalent salt concentration ($C_{molar}$, $\text{mol/m}^3$) assuming equivalent $\text{NaCl}$:

$$C_{molar} (\text{mol/m}^3) = \frac{\text{TDS} (\text{mg/L})}{M_{NaCl} (\text{g/mol})} = \frac{\text{TDS}}{58.44}$$

---

## 5. ELECTRICAL MODEL TOPOLOGY

The electrical calculation sequence must strictly follow series/parallel wiring topology:

```
Cell Voltage (V_cell) 
   │
   ▼
Module Voltage (V_module = N_pairs_per_module × V_cell)
   │
   ▼
Stack System Voltage (V_stack = N_modules_series × V_module)
   │
   ▼
Cell Current (I_cell = I_faraday / N_pairs_series)
   │
   ▼
Stack Power (P_stack = V_stack × I_cell)
   │
   ▼
Specific Energy (SEC_elec = P_stack / Q_prod)
```

---

## 6. 3D CAD ENGINEERING PURPOSE & GEOMETRY SPECIFICATION

The 3D CAD viewer is strictly a **visualization of the calculated technology architecture**, NOT the source of engineering calculations.

| Technology | Required CAD Geometry Layers | Visual Purpose |
| :--- | :--- | :--- |
| **CDI** | Porous carbon electrodes + open flow spacer channel + current collectors | Visualize EDL charging and open flow channel |
| **MCDI** | Porous carbon electrodes + AEM sheet + CEM sheet + open spacer channel | Visualize membrane barriers and co-ion blocking |
| **FCDI** | Slurry flow chambers + AEM/CEM sheets + feed channel + slurry pumps/tanks | Visualize continuous slurry circulation loops |
| **EDI** | Diluate channel with mixed-bed resin beads + concentrate channels + AEM/CEM + inert end electrodes | Visualize resin packing, water splitting, and continuous polishing |

---

## 7. SUMMARY MATRIX: REMEDIATION CLASSIFICATION

| Item | Classification | Action Required |
| :--- | :--- | :--- |
| **EDI SAC / Carbon Mass Inheritance** | **Critical** | Remove carbon mass/SAC formulas; implement resin bed electrodialysis model. |
| **CDI Charge Efficiency Model** | **Critical** | Replace $\Lambda = 0.80 + 0.05 V$ with Modified Donnan model. |
| **Legacy SEC Unit Error ($60\times$)** | **Critical** | Correct $Q$ conversion from $\text{L/min}$ to $\text{m}^3/\text{h}$ in `cdiDesignCalculator.js`. |
| **EDI Raw Feed Salinity Gate** | **Critical** | Gate EDI feed TDS at $< 30 \text{ mg/L}$; force RO pretreatment for high TDS. |
| **Electrode Area Sizing Formula** | **Major** | Replace empirical `0.08*Q*deltaTDS` with mass flux $J_{salt}$ equation. |
| **Static Config Efficiency Numbers** | **Major** | Retain as default baselines; evaluate dynamic $\Lambda(V, C)$ in calculation engine. |
| **Spacer Pressure Drop Model** | **Major** | Replace smooth-pipe $f_{darcy}$ with mesh spacer friction factor $f_{spacer} = K_T Re^{-n}$. |
| **Auxiliary Pumping Power SEC** | **Minor** | Add hydraulic pumping SEC explicitly into total system SEC metric. |
| **EDI CAD Geometry Props** | **Minor** | Pass resin bed depth and bead diameter props to 3D CAD renderer. |

---
*End of Engineering Correction Plan.*
