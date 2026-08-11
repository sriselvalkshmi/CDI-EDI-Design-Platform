# TECHNICAL AUDIT REPORT: CDI-EDI DESIGN PLATFORM
**First-Principles Engineering Audit & Physics Verification**
*Date: August 2026*
*Author: Lead Desalination & Electrochemical Systems Engineer*

---

## EXECUTIVE SUMMARY

A complete first-principles engineering audit of the **CDI-EDI Design Platform** was conducted across its core calculation engines, simulation modules, optimization algorithms, material models, and technology configurations. 

### Key Audit Finding
The current implementation enforces a **unified empirical mass-balance shortcut** across all four technologies (CDI, MCDI, FCDI, EDI). While computationally simple, treating Capacitive Deionization (CDI), Membrane Capacitive Deionization (MCDI), Flow-Electrode Capacitive Deionization (FCDI), and Electrodeionization (EDI) with the same fundamental mathematical equations is **physically incorrect** and **scientifically indefensible**. 

CDI, MCDI, and FCDI belong to the CDI family of porous electrode electrosorption processes (with distinct membrane and flow-slurry architectures), whereas **EDI is a distinct electromembrane and ion-exchange resin process** driven by water splitting ($H^+/OH^-$ auto-regeneration) and resin-phase electromigration.

This report documents every assumption, physical inconsistency, dimensional error, and literature mismatch across the codebase, verifies the platform's MCDI baseline example from first principles, and sets forth the authoritative engineering specification for platform remediation.

---

## 1. FUNDAMENTALS & LITERATURE BENCHMARKS

| Technology Metric | Capacitive Deionization (CDI) | Membrane CDI (MCDI) | Flow-Electrode CDI (FCDI) | Electrodeionization (EDI) |
| :--- | :--- | :--- | :--- | :--- |
| **Working Principle** | EDL electrosorption in porous carbon electrodes | EDL electrosorption + AEM/CEM co-ion blocking | Continuous electrosorption into circulating carbon slurry | Resin-assisted electromigration + water-splitting auto-regeneration |
| **Cell Architecture** | Carbon / Open Spacer / Carbon | Carbon + AEM / Open Spacer / CEM + Carbon | Slurry Chamber / AEM / Spacer / CEM / Slurry Chamber | Anode / AEM / Resin-Filled Diluate / CEM / Cathode |
| **Ion Transport** | Electromigration & EDL charging | Electromigration through selective membranes | Electromigration into carbon slurry particles | Resin conductivity enhancement + Nernst-Planck membrane flux |
| **Co-ion Transport** | Significant co-ion expulsion ($\Lambda \downarrow$) | Blocked by AEM & CEM ($\Lambda \uparrow$) | Blocked by AEM & CEM | N/A (Non-capacitive steady electromembrane) |
| **Operation Type** | Discontinuous Batch (Adsorption / Desorption) | Discontinuous Batch (Adsorption / Reversed Desorption) | Continuous (External slurry regeneration loop) | Continuous (Simultaneous desalting & resin auto-regeneration) |
| **Regeneration Mechanism** | Short-circuit / Zero potential flush | Reverse potential (-V) flush | Continuous electrical/thermal slurry discharge loop | Continuous water splitting ($H_2O \rightarrow H^+ + OH^-$) |
| **Valid Feed Salinity** | $< 1,000 \text{ mg/L TDS}$ | $500 - 3,000 \text{ mg/L TDS}$ | $3,000 - 30,000 \text{ mg/L TDS}$ | $< 30 \text{ mg/L TDS}$ (Polishing RO permeate) |
| **Charge Efficiency ($\Lambda$)** | $50\% - 82\%$ (V & C dependent) | $90\% - 98\%$ | $88\% - 95\%$ | Current Efficiency $\eta_i \approx 85\% - 98\%$ |
| **Water Recovery ($R_w$)** | $75\% - 90\%$ | $85\% - 95\%$ | $90\% - 96\%$ | $90\% - 98\%$ |
| **Key Literature Basis** | Porada et al. (2013), Zhao et al. (2013) | Biesheuvel & van der Wal (2010), Zhao et al. (2012) | Jeon et al. (2013), Rommerskirchen et al. (2018) | Wood et al. (2010), DuPont EDI-310 Manual, ASTM D5197 |

---

## 2. CODEBASE AUDIT: IDENTIFIED ASSUMPTIONS & INCONSISTENCIES

The following codebase files were inspected:
1. `client/src/engineering/engineeringEquationEngine.js`
2. `client/src/engineering/simulationEngine.js`
3. `client/src/engineering/cdiDesignCalculator.js`
4. `client/src/engineering/electrodeModel.js`
5. `client/src/engineering/designOptimizer.js`
6. `client/src/engineering/aiRecommendation.js`
7. `client/src/engineering/economicEngine.js`
8. `client/src/engineering/experimentalCalibration.js`
9. `client/src/engineering/desalinationTechConfig.json`
10. All technology-specific schematic/CAD components (`CDISchematic.jsx`, `EDISchematic.jsx`, etc.)

### Comprehensive Table of Codebase Flaws

| # | File & Location | Current Assumption | Why Incorrect | Literature Basis | Correct Engineering Principle | Required Code Change |
|---|---|---|---|---|---|---|
| **1** | `engineeringEquationEngine.js` (L91) | `calculatedElectrodeArea = flowRate * targetDeltaTds * 0.08` | Empirical multiplier. Ignores mass transfer flux, current density, spacer velocity, and electrode geometry. | Porada et al. (2013), *Prog. Mater. Sci.* | Area is dictated by Faraday's Law $A_{tot} = \frac{I_{total}}{J_{operating}}$ and kinetic mass transport balance $N_{pairs} A_{pair} \ge \frac{Q (C_{in} - C_{out})}{J_{salt, max}}$. | Replace empirical rule of thumb with explicit mass flux $J_{salt}$ and operational current density sizing. |
| **2** | `engineeringEquationEngine.js` (L88, L111) | EDI treated with batch electrode mass sizing & SAC ($m_{req} = Q \cdot t_{cycle} \cdot \Delta C / SAC$) | EDI is a continuous resin process; resin capacity does not saturate like carbon electrodes because $H^+/OH^-$ constantly regenerates resin. | Wood et al. (2010), *Desalination* | EDI sizing depends on resin bed volume, limiting current density $I_{lim}$, and residence time for electrodialysis transport. | Branch EDI into a distinct electromembrane resin model without carbon SAC or batch cycle terms. |
| **3** | `cdiDesignCalculator.js` (L48, L185, L370) | $SAC = 80 \text{ mg/g}$, $Area = Mass \times 100$, $SEC = \frac{P/1000}{Q/1000}$ | 1) $80 \text{ mg/g}$ exceeds porous carbon limit ($10-25 \text{ mg/g}$).<br>2) $Mass \times 100$ is arbitrary.<br>3) $Q$ is in L/min, so $Q/1000$ is $\text{m}^3/\text{min}$, missing a factor of 60 ($\text{m}^3/\text{h}$). SEC is off by 60×. | Biesheuvel et al. (2011); Zhao et al. (2013) | Standard dimensional conversion: $Q (\text{m}^3/\text{h}) = \frac{Q (\text{L/min}) \times 60}{1000}$. SAC for activated carbon is $10-25 \text{ mg/g}$. | Deprecate `cdiDesignCalculator.js` or fix units ($60 \times$) and align SAC with literature values. |
| **4** | `electrodeModel.js` (L244-253) | $\Lambda = 0.80 + 0.05 \times V_{cell}$ for all technologies | In CDI, charge efficiency **decreases** with increasing cell voltage due to EDL saturation, co-ion expulsion, and parasitic side-reactions (water electrolysis). | Zhao et al. (2012), *ES&T*; Biesheuvel & van der Wal (2010) | CDI $\Lambda$ follows Modified Donnan (mD) model: $\Lambda = \tanh\left(\frac{z F \Delta \phi_{st}}{2 R T}\right)$, decreasing at high potential and low concentration. | Implement technology-dependent charge efficiency: mD model for CDI, membrane selectivity factor for MCDI. |
| **5** | `electrodeModel.js` (L264-273) | $Utilization = SAC / 20$ | Arbitrary linear formula without physical scaling or concentration dependence. | Porada et al. (2013) | Electrode utilization $\eta_{util} = \frac{SAC_{actual}}{SAC_{max}(C_{feed})}$. | Replace with ratio of operating equilibrium adsorption capacity to maximum theoretical capacity. |
| **6** | `simulationEngine.js` (L55-150) | Transient curves generated using hardcoded exponentials `Math.exp(-0.35*t)` for all technologies | Curves do not solve dynamic differential species mass balance $\frac{dC}{dt} = \frac{Q}{V_{cell}}(C_{in} - C) - \frac{N_{pairs} I \Lambda}{z F V_{cell}}$. | Dynamic CDI stack kinetics (Biesheuvel et al., 2011) | Solve continuous differential mass balance $V_{channel} \frac{dC}{dt} = Q(C_{feed} - C(t)) - r_{adsorption}(t)$. | Update transient generator to compute physical $dC/dt$ mass balance step-by-step. |
| **7** | `desalinationTechConfig.json` (L53, L83, L112, L141) | Static single-value charge efficiencies ($\text{CDI}=82\%$, $\text{MCDI}=92\%$, $\text{FCDI}=90\%$, $\text{EDI}=98\%$) | Charge efficiency varies dynamically with feed salinity, current density, and cell voltage. | Hawkes et al. (2019); Dykstra et al. (2016) | $\Lambda$ must be evaluated dynamically as a function of operating state $(V, C, J)$. | Keep config values as baseline nominal defaults, but compute dynamic $\Lambda$ in engine. |
| **8** | `engineeringEquationEngine.js` (L183-191) | Pressure drop computed using smooth-pipe Darcy-Weisbach equation with arbitrary $f_{darcy} = \frac{64}{Re} + 0.35$ | Flow channels contain spacer netting mesh which creates severe micro-eddy drag ($f_{spacer} \gg f_{smooth}$). | Schock & Miquel (1987); Li & Tung (2008) | Spacer friction factor $f_{spacer} = K_T \cdot Re^{-n}$ where $K_T \approx 3.0 - 6.0$ for net spacers. | Update friction factor formula to include mesh spacer geometry coefficients. |
| **9** | `aiRecommendation.js` (L39-55) | Scoring algorithm uses arbitrary weights ($50\text{ pts}$ setpoint, $20\text{ pts}$ feed, $15\text{ pts}$ SEC, $15\text{ pts}$ recovery) | Linear weighting conceals hard thermodynamic boundaries (e.g., EDI on high salinity or CDI on seawater). | Voutchkov (2018), *Desalination Engineering* | Hard feasibility filtering gate must precede multi-criteria scoring. | Ensure strict feasibility screening before ranking, returning zero score for envelope violations. |
| **10** | `economicEngine.js` (L11-18) | Auxiliary power fixed at $5.0 \text{ W}$, pump efficiency omitted from hydraulic SEC calculation | Hydraulic pumping energy $\frac{Q \Delta P}{\eta_{pump}}$ is not added into primary stack SEC calculation in main KPI dashboard. | WHO Desalination Guidelines; Oren (2008) | Total SEC $SEC_{total} = SEC_{electrical} + SEC_{hydraulic} = \frac{V_{stack} \cdot I}{Q_{prod}} + \frac{\Delta P}{\eta_{pump} \cdot R_w}$. | Include pump efficiency ($\eta_{pump} = 0.75$) and hydraulic SEC explicitly into total SEC. |
| **11** | `EDISchematic.jsx` & `EDISchematic` CAD | Displays EDI mixed-bed resin schematic, but backend sizing uses CDI porous carbon parameters | Visual representation is decoupled from physics sizing calculation. | Vendor spec (DuPont EDI-310) | CAD and schematic parameters must reflect resin volume, diluate channel width, and water-splitting current density. | Pass resin bed depth, bead diameter, and limiting current density props to EDI schematic/CAD. |
| **12** | `engineeringEquationEngine.js` (L44-54) | EDI direct-feed warning allows EDI calculation to run even when feed TDS $> 30\text{ mg/L}$, producing fictitious low SEC numbers | Running EDI on $500\text{ mg/L}$ raw feed without RO yields invalid current density and scaling predictions. | ASTM D5197; DuPont EDI Technical Manual | EDI requires feed conditioning ($TDS < 30 \text{ mg/L}$, Hardness $< 0.5 \text{ mg/L}$ as $\text{CaCO}_3$). | Flag EDI high-salinity direct feed as invalid and force pretreatment train calculation (RO $\rightarrow$ EDI). |

---

## 3. VERIFICATION OF ENGINEERING CALCULATIONS

### 3.1 Verification of the MCDI Example

**Platform Reported Parameters (MCDI Test Case):**
- Feed TDS ($C_{in}$): $500 \text{ mg/L}$
- Target TDS ($C_{target}$): $50 \text{ mg/L}$
- Desalination Removal ($\eta_{rem}$): $90\%$
- Water Recovery ($R_w$): $95\%$
- Feed Flow Rate ($Q_{feed}$): $10 \text{ L/min} = 0.60 \text{ m}^3/\text{h} = 1.6667 \times 10^{-4} \text{ m}^3/\text{s}$
- Cell Voltage ($V_{cell}$): $1.40 \text{ V}$
- Module Voltage ($V_{module}$): $47.60 \text{ V}$ ($34 \text{ cell pairs/module}$)
- System Voltage ($V_{system}$): $142.80 \text{ V}$ ($3 \text{ modules in series} = 102 \text{ cell pairs}$)
- Operating Current ($I$): $1.32 \text{ A}$
- Electrical Power ($P_{elec}$): $188.5 \text{ W}$

#### First-Principles Step-by-Step Derivation:

1. **Mass Removal Rate ($\dot{m}_{salt}$):**
   $$\dot{m}_{salt} = Q_{feed} \times (C_{in} - C_{out}) = 1.6667 \times 10^{-4} \text{ m}^3/\text{s} \times (500 - 50) \text{ g/m}^3 = 0.0750 \text{ g/s}$$
   $$\text{In moles of NaCl/s } (M_{NaCl} = 58.44 \text{ g/mol}):$$
   $$\dot{n}_{salt} = \frac{0.0750 \text{ g/s}}{58.44 \text{ g/mol}} = 0.00128337 \text{ mol/s}$$

2. **Faraday's Law for Electrosorption Rate:**
   Total Faraday current required across the entire stack:
   $$I_{total, faraday} = \frac{\dot{n}_{salt} \cdot z \cdot F}{\Lambda}$$
   Using MCDI charge efficiency $\Lambda = 0.92$ (due to AEM/CEM co-ion blocking) and $F = 96,485 \text{ C/mol}$:
   $$I_{total, faraday} = \frac{0.00128337 \times 1 \times 96485}{0.92} = 134.587 \text{ A}$$

3. **Cell Pair Current ($I_{cell}$):**
   With $N_{pairs} = 102$ cell pairs in electrical series:
   $$I_{cell} = \frac{I_{total, faraday}}{N_{pairs}} = \frac{134.587 \text{ A}}{102} = 1.3195 \text{ A} \approx 1.32 \text{ A} \quad \checkmark \text{ (VERIFIED)}$$

4. **Electrical Voltages:**
   - Single cell voltage: $V_{cell} = 1.40 \text{ V}$
   - Module voltage (34 pairs in series): $V_{module} = 34 \times 1.40 \text{ V} = 47.60 \text{ V} \quad \checkmark \text{ (VERIFIED)}$
   - System stack voltage (3 modules in series = 102 pairs): $V_{system} = 3 \times 47.60 \text{ V} = 142.80 \text{ V} \quad \checkmark \text{ (VERIFIED)}$

5. **Total Stack Electrical Power ($P_{elec}$):**
   $$P_{elec} = V_{system} \times I_{cell} = 142.80 \text{ V} \times 1.3195 \text{ A} = 188.42 \text{ W} \approx 188.5 \text{ W} \quad \checkmark \text{ (VERIFIED)}$$

6. **Electrical Specific Energy Consumption ($SEC_{elec}$):**
   Product flow rate:
   $$Q_{prod} = Q_{feed} \times R_w = 10 \text{ L/min} \times 0.95 = 9.50 \text{ L/min} = 0.570 \text{ m}^3/\text{h}$$
   $$SEC_{elec} = \frac{P_{elec} / 1000}{Q_{prod}} = \frac{0.18842 \text{ kW}}{0.570 \text{ m}^3/\text{h}} = 0.3306 \text{ kWh/m}^3 \quad \checkmark \text{ (VERIFIED)}$$

#### Audit Conclusion on MCDI Benchmark:
The numerical arithmetic reported by the platform for MCDI (142.8 V, 1.32 A, 188.5 W) **is mathematically consistent** for a stack of 102 pairs in series with $\Lambda = 0.92$. However, **the underlying sizing of $N_{pairs} = 102$ and $Area = 360 \text{ cm}^2$ was derived using an empirical formula (`0.08 * flowRate * deltaTDS`) rather than fundamental electro-diffusive transport modeling**.

---

## 4. REQUIRED CODE CHANGES & REMEDIATION ROADMAP

To ensure the platform is scientifically defensible prior to production UI/CAD updates, the following code refactoring schedule is established:

```
+-------------------------------------------------------------------------------+
| PHASE 1: CORE PHYSICS & SEPARATION (Task 1 Audit - Completed)                 |
| - Produce TECHNICAL_AUDIT.md & technology_model_spec.md                       |
| - Establish separate mathematical specifications for CDI, MCDI, FCDI, and EDI |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| PHASE 2: CALCULATOR ENGINE REFACTORING (Task 2 Execution)                     |
| - Implement technology_model_spec.md in engineeringEquationEngine.js          |
| - Decouple EDI from carbon electrosorption & SAC formulas                     |
| - Implement Modified Donnan (mD) charge efficiency for CDI                   |
| - Implement dynamic hydraulic pressure drop with netting spacer drag          |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| PHASE 3: SIMULATION & OPTIMIZATION INTEGRATION (Task 3 Execution)             |
| - Upgrade simulationEngine.js to solve differential species mass balance      |
| - Refactor designOptimizer.js & aiRecommendation.js with strict feasibility   |
| - Update 3D-CAD / Schematics to accurately reflect technology physics         |
+-------------------------------------------------------------------------------+
```

---

## 5. PARAMETERS REQUIRING EXPERIMENTAL CALIBRATION

Where published literature does not provide closed-form theoretical functions, the following parameters are explicitly flagged as **"requires experimental calibration"**:

1. **CDI/MCDI Non-Ideal EDL Capacitance Scaling Coefficient ($\alpha_{cap}$):**
   *Description:* Deviation of differential double-layer capacitance in porous carbon under high ionic strength ($> 2,000 \text{ mg/L}$).
   *Status:* Requires experimental calibration.

2. **Spacer Netting Drag Coefficient ($K_T$ and $n$):**
   *Description:* Empirical pressure drop coefficients $f = K_T Re^{-n}$ for specific commercial spacer netting geometries.
   *Status:* Requires experimental calibration.

3. **FCDI Carbon Slurry Electrical Conductivity vs Weight Percentage ($\sigma_{slurry}(\omega)$):**
   *Description:* Percolation threshold and effective electronic conductivity of activated carbon slurries (5 wt% - 20 wt%) under shear flow.
   *Status:* Requires experimental calibration.

4. **EDI Resin Water-Splitting Rate Constant ($k_{ws}$):**
   *Description:* Overpotential dependent rate constant for catalytic water splitting at bipolar resin-resin junctions.
   *Status:* Requires experimental calibration.

---
*End of Technical Audit Report.*
