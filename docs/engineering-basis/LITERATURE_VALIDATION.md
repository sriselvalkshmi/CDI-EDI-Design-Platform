# LITERATURE VALIDATION OF ENGINEERING CORRECTION PLAN
**Critical Peer-Reviewed Literature Review, Model Verification, & Parameter Audit**
*Document Version: 1.0*
*Date: August 2026*
*Author: Lead Desalination & Electrochemical Systems Engineer*

---

## 1. EXECUTIVE SUMMARY & VALIDATION SCOPE

Before modifying any production calculation code in the CDI-EDI Design Platform, every proposed engineering correction, equation, physical model, unit definition, and numerical operating limit from `TECHNICAL_AUDIT.md`, `ENGINEERING_CORRECTION_PLAN.md`, and `technology_model_spec.md` was critically validated against peer-reviewed desalination literature and vendor technical standards.

### Key Finding & Rule on Universal Numerical Limits
Arbitrary universal limits (e.g. hardcoding $CDI < 1000 \text{ mg/L}$, $MCDI = 500-3000 \text{ mg/L}$, $FCDI = 3000-30000 \text{ mg/L}$) **must not be hardcoded into calculations as absolute physical constants**. While general operating regimes exist in published literature, actual operational limits depend on economic tradeoffs, energy consumption thresholds, electrode design, and multi-stage configurations.

All operational limits are refactored into **Configurable Technology Feasibility Envelopes**, explicitly labeled with their pedigree:
1. **Literature-supported** (e.g., EDI feed RO permeate requirement $TDS < 30 \text{ mg/L}$, Hardness $< 0.5 \text{ mg/L}$; CDI cell voltage limit $V_{cell} \le 1.2 \text{ V}$ to prevent water electrolysis).
2. **Experimental** (e.g., FCDI carbon slurry viscosity scaling, spacer netting mesh friction factors $K_T, n$).
3. **Project assumption** (e.g., baseline cycle time $t_{cycle} = 10 \text{ min}$, default recovery setpoint $90\%$).

---

## 2. CRITICAL LITERATURE REVIEW BY TECHNOLOGY

### 2.1 CAPACITIVE DEIONIZATION (CDI)

#### 1. Salt Adsorption Capacity (SAC)
- **Literature Source:** Porada et al. (2013), *Prog. Mater. Sci.* 58, 1388–1442; Biesheuvel et al. (2011), *Colloids Surf. A* 388, 121–131.
- **Verification:** $SAC$ represents the equilibrium mass of salt adsorbed per unit mass of porous carbon ($\text{mg salt / g carbon}$). For typical activated carbon, experimental equilibrium $SAC$ ranges between $8$ and $18 \text{ mg/g}$ at $V_{cell} = 1.2 \text{ V}$ in $500 \text{ mg/L NaCl}$.
- **Code Audit:** Legacy `cdiDesignCalculator.js` hardcoded $SAC = 80 \text{ mg/g}$. This is physically impossible for non-functionalized porous carbon without chemical modification or redox additives.
- **Decision:** **MODIFY.** Set default nominal $SAC$ for standard activated carbon to $15 \text{ mg/g}$ (Literature-supported) and make $SAC(C_{feed}, V_{cell})$ dynamic based on Langmuir/Freundlich isotherms.

#### 2. Modified Donnan (mD) Theory & Charge Efficiency ($\Lambda$)
- **Literature Source:** Biesheuvel & van der Wal (2010), *J. Membr. Sci.* 346, 256–262; Zhao et al. (2012), *Environ. Sci. Technol.* 46, 8560–8569.
- **Verification:** In uncoated carbon electrodes, co-ion expulsion reduces charge efficiency:
  $$\Lambda_{CDI} = \frac{\text{Salt Adsorbed (mols)}}{\text{Charge Passed (F)}} = \tanh\left( \frac{z F \Delta \phi_{st}}{2 R T} \right)$$
  Where $\Delta \phi_{st}$ is the Stern potential drop in electrode micropores. As cell voltage increases or feed concentration decreases, co-ion expulsion increases and $\Lambda_{CDI}$ **decreases**.
- **Code Audit:** `electrodeModel.js` used $\Lambda = 0.80 + 0.05 \times V_{cell}$, predicting $\Lambda$ *increases* with voltage. This violates mD theory.
- **Engineering Suitability:** Full mD theoretical equations require solving non-linear algebraic equations for micropore charge $q_{mic}$, suitable for dynamic simulation. For steady-state sizing, a dynamic empirical correlation $\Lambda_{CDI}(V_{cell}, C_{feed})$ calibrated from mD curves is suitable for engineering design.
- **Decision:** **MODIFY.** Implement dynamic mD-based charge efficiency model.

#### 3. Mass Balance Equation
- **Literature Source:** Porada et al. (2013); Johnson & Newman (1971), *J. Electrochem. Soc.* 118, 510.
- **Verification:**
  $$\dot{m}_{salt} = Q_{feed} (C_{in} - C_{out}) = \frac{N_{pairs} \cdot I \cdot \Lambda \cdot M_{NaCl}}{z F}$$
- **Code Audit:** Verified equation structure. Units must be explicitly $\dot{m}$ ($\text{g/s}$), $Q$ ($\text{m}^3/\text{s}$), $C$ ($\text{g/m}^3 \equiv \text{mg/L}$), $I$ ($\text{A}$), $M_{NaCl} = 58.44 \text{ g/mol}$, $F = 96,485 \text{ C/mol}$.
- **Decision:** **KEEP.** Approved literature-supported equation.

---

### 2.2 MEMBRANE CAPACITIVE DEIONIZATION (MCDI)

#### 1. AEM/CEM Membrane Role & Co-ion Exclusion
- **Literature Source:** Zhao et al. (2012), *Environ. Sci. Technol.* 46, 8560–8569; Dykstra et al. (2016), *Desalination* 390, 47–52.
- **Verification:** Ion-exchange membranes (AEM at anode, CEM at cathode) block co-ion expulsion ($\sigma_{perm} \approx 0.95 - 0.99$). Counter-ions enter micropores while co-ions are trapped inside. Consequently, charge efficiency is high ($\Lambda_{MCDI} \approx 0.90 - 0.98$) and relatively insensitive to cell voltage up to $1.6 \text{ V}$.
- **Code Audit:** `engineeringEquationEngine.js` assigned static $\Lambda_{MCDI} = 0.92$.
- **Decision:** **MODIFY.** Retain high baseline efficiency ($\Lambda \ge 0.90$), but incorporate membrane ohmic resistance ($R_{mem} = d_{mem} / \kappa_{mem}$) into module voltage calculation.

#### 2. Reversed Polarity Desorption (RPD) Cycle
- **Literature Source:** Lee et al. (2014), *Desalination* 342, 70–76.
- **Verification:** Applying $-V_{cell}$ (e.g. $-1.4 \text{ V}$) during regeneration accelerates ion desorption, yielding higher peak brine concentration $C_{brine, max}$ and shorter flush times ($t_{des} \approx 3 - 5 \text{ min}$) compared to zero-voltage short-circuit CDI.
- **Decision:** **KEEP.** Approved literature-supported cycle dynamics.

---

### 2.3 FLOW-ELECTRODE CAPACITIVE DEIONIZATION (FCDI)

#### 1. Flow-Electrode Architecture & Continuous Operation
- **Literature Source:** Jeon et al. (2013), *Energy Environ. Sci.* 6, 1471–1475; Rommerskirchen et al. (2018), *J. Membr. Sci.* 546, 188–202.
- **Verification:** FCDI utilizes circulating liquid carbon slurry ($5 - 20 \text{ wt\%}$ carbon in electrolyte) flowing through electrode channels behind AEM/CEM sheets. Because carbon slurry continuously enters and leaves the stack, FCDI achieves **continuous desalination** without batch adsorption/desorption pauses.
- **Code Audit:** `simulationEngine.js` treated FCDI using batch adsorption/desorption curves. This is physically incorrect.
- **Decision:** **MODIFY.** Model FCDI as a continuous steady-state process with external slurry regeneration loops.

#### 2. Slurry Rheology & Pumping SEC
- **Literature Source:** Gendel et al. (2014), *Electrochem. Commun.* 46, 152–156; Yang et al. (2016), *Water Res.* 89, 360–367.
- **Verification:** Slurry viscosity $\mu_{slurry}$ increases nonlinearly with carbon weight fraction $\omega_{wt\%}$, increasing parasitic pumping pressure drop $\Delta P_{slurry}$. However, higher carbon loading increases electronic conductivity $\sigma_{slurry}$.
- **Decision:** **MODIFY.** Add slurry pumping power $P_{slurry} = \frac{2 Q_{slurry} \Delta P_{slurry}}{\eta_{pump}}$ explicitly into total FCDI SEC calculation. Mark slurry drag coefficients as requiring experimental calibration.

---

### 2.4 ELECTRODEIONIZATION (EDI)

#### 1. Resin-Filled Compartments & Water Splitting Auto-Regeneration
- **Literature Source:** Wood et al. (2010), *Desalination* 261, 296–306; Glueckauf (1955), *AIChE J.* 1, 479; DuPont EDI-310 Technical Manual.
- **Verification:** EDI diluate channels are packed with mixed-bed ion-exchange resin ($40\% \text{ cation} / 60\% \text{ anion}$). Resin beads increase effective electrical conductivity in low-salinity water. When local current density $J$ exceeds limiting current density $J_{lim}$, electro-dissociation of water ($H_2O \rightarrow H^+ + OH^-$) occurs at resin junctions, continuously auto-regenerating resin sites.
- **Code Audit:** `engineeringEquationEngine.js` forced EDI into carbon electrode $SAC$ ($50 \text{ mg/g}$) and batch adsorption cycle time. Resin beds do not saturate or operate on carbon $SAC$.
- **Decision:** **REMOVE carbon SAC inheritance.** Implement electrodialysis Nernst-Planck transport and water-splitting current efficiency equations.

#### 2. Feedwater Quality Envelope (RO Permeate Polishing Only)
- **Literature Source:** ASTM D5197; DuPont EDI Technical Specification; WHO Water Series.
- **Verification:** Commercial EDI modules **strictly require pre-conditioned RO permeate feed** ($TDS < 30 \text{ mg/L}$, Hardness $< 0.5 \text{ mg/L}$ as $\text{CaCO}_3$, Silica $< 0.5 \text{ mg/L}$). Raw feed ($> 30 \text{ mg/L}$) causes immediate $CaCO_3/Mg(OH)_2$ scaling, resin fouling, and module failure.
- **Code Audit:** `engineeringEquationEngine.js` permitted EDI direct feed calculation at $500 \text{ mg/L TDS}$.
- **Decision:** **MODIFY.** Implement strict feasibility gating: EDI direct feed at $> 30 \text{ mg/L}$ TDS flags `feedQualityFeasible = false` and forces the `RO → EDI` process train calculation. Label this constraint as **Literature-supported / Vendor Specification**.

---

## 3. PROPOSED CORRECTION VALIDATION TABLE

| # | Proposed Correction | Literature Support | Equation Verified | Units Verified | Underlying Assumption | Decision (Keep / Modify / Remove) |
|---|---|---|---|---|---|---|
| **1** | Remove carbon $SAC$ & carbon mass from EDI model | **High** (Wood et al., 2010; DuPont EDI Spec) | Yes ($\dot{m} = \frac{N I \eta_i M}{z F}$) | Yes ($\text{g/s}, \text{A}, \text{g/mol}$) | EDI is continuous resin process; resin auto-regenerates via $H^+/OH^-$. | **KEEP** correction (Remove carbon $SAC$ from EDI). |
| **2** | Replace CDI linear efficiency $\Lambda = 0.80+0.05V$ with mD model | **High** (Biesheuvel & van der Wal, 2010) | Yes ($\Lambda = \tanh\left(\frac{z F \Delta \phi_{st}}{2 R T}\right)$) | Yes (Dimensionless) | Uncoated carbon experiences co-ion expulsion; $\Lambda$ decreases at high $V$. | **KEEP** correction (Implement mD efficiency model). |
| **3** | Correct SEC unit scaling factor ($60\times$) in `cdiDesignCalculator.js` | **High** (Standard SI conversions) | Yes ($SEC = \frac{P/1000}{Q \cdot 60 / 1000}$) | Yes ($\text{kWh/m}^3$) | Flow rate in $\text{L/min}$ must be converted to $\text{m}^3/\text{h}$ via $\times 60 / 1000$. | **KEEP** correction (Fix unit factor). |
| **4** | Gate EDI direct feed at $> 30 \text{ mg/L TDS}$ | **High** (ASTM D5197; Vendor spec) | Yes ($C_{feed} \le 30 \text{ mg/L}$) | Yes ($\text{mg/L}$) | Direct raw feed causes severe scaling and module burnout. | **MODIFY:** Label limit explicitly as "Vendor Spec Envelope". |
| **5** | Replace empirical area `0.08*Q*deltaTDS` with Faraday flux $A = \frac{\dot{m} z F}{J \Lambda M}$ | **High** (Porada et al., 2013; Johnson & Newman, 1971) | Yes ($A = \frac{I_{total}}{J_{operating}}$) | Yes ($\text{m}^2, \text{A}, \text{A/m}^2$) | Planar area is governed by operating current density limit $J_{operating}$. | **KEEP** correction. |
| **6** | Replace smooth-pipe friction with spacer netting mesh drag ($f_{spacer} = K_T Re^{-n}$) | **Medium** (Schock & Miquel, 1987; Li & Tung, 2008) | Yes ($\Delta P = f \frac{L}{D_h} \frac{\rho v^2}{2}$) | Yes ($\text{Pa}$) | Mesh spacers create micro-eddy turbulence ($f_{spacer} \gg f_{smooth}$). | **MODIFY:** Mark $K_T, n$ as requiring experimental calibration. |
| **7** | Model FCDI as continuous process with slurry pumping SEC | **High** (Jeon et al., 2013; Rommerskirchen et al., 2018) | Yes ($P_{slurry} = \frac{2 Q_{slurry} \Delta P}{\eta_{pump}}$) | Yes ($\text{W}, \text{kWh/m}^3$) | FCDI flow electrodes continuously enter/leave stack without batch pauses. | **KEEP** correction. |
| **8** | Add hydraulic pumping SEC to main KPI dashboard | **High** (Oren, 2008; WHO Desalination Manual) | Yes ($SEC_{total} = SEC_{elec} + SEC_{pump}$) | Yes ($\text{kWh/m}^3$) | Total energy must include pump power ($\frac{Q \Delta P}{\eta_{pump}}$). | **KEEP** correction. |
| **9** | Universal hardcoded salinity envelopes (e.g. CDI $<1000$ ppm, MCDI $=500-3000$ ppm) | **Unsupported as universal physical constants** | No (Economic tradeoffs vary) | N/A | Hardcoded limits treat operational guidelines as physical laws. | **REMOVE universal hardcoded limits.** Replace with Configurable Envelopes. |

---

## 4. FINAL CLASSIFIED SPECIFICATION LISTS

### 4.1 Approved Corrections (Literature-Supported)
1. **EDI Isolation from Carbon Physics:** Completely remove carbon electrode mass ($m_{req}$) and carbon $SAC$ from EDI solver. Implement Nernst-Planck electromigration and water-splitting current efficiency ($\eta_i$).
2. **CDI Modified Donnan Charge Efficiency:** Replace $\Lambda = 0.80 + 0.05 V$ with mD-based charge efficiency model ($\Lambda_{CDI}$ decreases with voltage and lower ionic strength).
3. **Electrode Area Faraday Sizing:** Replace empirical rule `0.08 * Q * deltaTDS` with Faraday mass flux sizing: $A_{total} = \frac{I_{total}}{J_{operating}}$.
4. **FCDI Continuous Operation Solver:** Refactor FCDI solver from batch adsorption/desorption curves to continuous steady-state mass balance with slurry pumping SEC.
5. **Dimensional Unit Conversion Correction:** Fix $60\times$ flow rate conversion factor in `cdiDesignCalculator.js`.
6. **Total System SEC Integration:** Include hydraulic pumping SEC ($SEC_{pump} = \frac{\Delta P}{\eta_{pump} R_w}$) in total SEC metrics.

---

### 4.2 Corrections Requiring Modification
1. **EDI Feed Salinity Gate:** Modify from a hard-stop code error to a **Configurable Envelope Gate** labeled `Vendor Specification (DuPont EDI-310 / ASTM D5197)`. High feed salinity ($> 30 \text{ mg/L}$) triggers automatic process train selection (`RO → EDI`).
2. **Spacer Netting Pressure Drop:** Modify theoretical smooth-pipe equation to mesh spacer friction model ($f_{spacer} = K_T Re^{-n}$), and explicitly flag $K_T$ and $n$ as experimental calibration parameters.
3. **CDI Dynamic Charge Efficiency:** For real-time engineering design calculation, use a calibrated continuous mD response surface $\Lambda_{CDI}(V_{cell}, C_{feed})$ rather than full dynamic non-linear differential solver iterations.

---

### 4.3 Unsupported Assumptions to Remove
1. **Hardcoded Universal Salinity Limits:** Remove hardcoded physical bounds (e.g. $CDI < 1000 \text{ ppm}$, $MCDI = 500-3000 \text{ ppm}$) treated as immutable physical laws. Replace with **Configurable Technology Feasibility Envelopes**.
2. **Fixed Auxiliary Power ($5.0 \text{ W}$):** Remove fixed $5.0 \text{ W}$ arbitrary auxiliary power assumption; compute auxiliary power as a percentage of control system stack rating ($1-2\%$).
3. **Fixed SAC ($80 \text{ mg/g}$):** Remove $80 \text{ mg/g}$ carbon capacity assumption in legacy calculator.

---

### 4.4 Parameters Requiring Experimental Calibration
1. **Spacer Netting Friction Coefficients ($K_T, n$):** Empirical drag coefficients for commercial spacer netting mesh geometries.
2. **FCDI Slurry Rheology & Pumping Drag ($K_{slurry}, \mu_{slurry}$):** Viscosity and friction scaling of carbon slurries ($5 - 20 \text{ wt\%}$) under flow.
3. **FCDI Carbon Slurry Electronic Conductivity ($\sigma_{slurry}(\omega_{wt\%})$):** Percolation threshold and effective conductivity of carbon slurry suspensions.
4. **EDI Resin Water-Splitting Rate Constant ($k_{ws}$):** Overpotential-dependent rate constant for catalytic water splitting at bipolar resin junctions.
5. **Membrane Ohmic Resistance & Permselectivity ($\sigma_{perm}, R_{mem}$):** Vendor-specific AEM/CEM membrane transport parameters.

---
*End of Literature Validation Report.*
