# FIRST-PRINCIPLES FCDI MODEL VALIDATION & VERIFICATION REPORT
**Continuous Flow-Electrode Slurry Kinetics, Pedigree Object, Sensitivity API, Feasibility Hardening & UI Integration**
*Document Version: 4.0 (Task 8.3 Final Integration)*
*Date: August 2026*
*Author: Lead Desalination & Electrochemical Systems Engineer*

---

## 1. EXECUTIVE SUMMARY & LITERATURE REFERENCES

Flow-Electrode Capacitive Deionization (FCDI) operates on a continuous circulating flow-electrode carbon slurry ($5 - 20 \text{ wt\%}$ activated carbon particles suspended in aqueous electrolyte) (*Jeon et al., 2013; Rommerskirchen et al., 2018a, 2018b; Wood et al., 2010*).

### Peer-Reviewed Literature Citations
1. **Jeon et al., Energy & Environmental Science, 2013:**
   *“Desalination via a new membrane capacitive deionization process utilizing flow-electrodes”*
   Demonstrated ~95% single-stage removal for $32.1 \text{ g/L}$ NaCl feed using pumpable carbon flow electrodes.
2. **Rommerskirchen et al., ACS Sustainable Chemistry & Engineering, 2018:**
   *“Energy Recovery and Process Design in Continuous Flow–Electrode Capacitive Deionization Processes”*
   Demonstrated continuous steady-state operation and energy recovery during continuous regeneration.
3. **Rommerskirchen et al., Journal of Membrane Science, 2018:**
   *“Modeling continuous flow-electrode capacitive deionization processes with ion-exchange membranes”*
   Formulated continuous mass transport and ion exchange membrane contactor equations for FCDI.

---

## 2. GOVERNING EQUATIONS & MODEL FORMULATION

$$\begin{aligned}
\text{Water Volume Conservation: } & Q_{feed} = Q_{prod} + Q_{brine} \implies Q_{prod} = Q_{feed} \cdot R_w, \quad Q_{brine} = Q_{feed} \cdot (1 - R_w) \\
\text{Salt Mass Conservation: } & Q_{feed} \cdot C_{feed} = Q_{prod} \cdot C_{out} + Q_{brine} \cdot C_{brine} \\
\text{Concentrate Brine Salinity: } & C_{brine} = \frac{C_{feed} - R_w \cdot C_{out}}{1 - R_w} = C_{feed} + \left(\frac{R_w}{1 - R_w}\right) \cdot (C_{feed} - C_{out}) \\
\text{Molar Salt Removal Rate: } & \dot{n}_{salt} = \frac{Q_{feed, m3s} \cdot (C_{feed} - C_{out})}{M_{NaCl}} \quad (\text{mol/s}) \\
\text{Faraday Charge Demand: } & I_{FCDI} = \frac{\dot{n}_{salt} \cdot z \cdot F}{\Lambda_{FCDI}} \quad (\Lambda_{FCDI} = 0.88 \text{ project calibration parameter}) \\
\text{Continuous Carbon Mass Flow: } & \dot{m}_{carbon} = C_{slurry, gL} \times \left(\frac{Q_{slurry, Lmin}}{60}\right) \quad (\text{g carbon / s}) \\
\text{Operating Salt Loading: } & Loading_{operating} = \frac{\dot{m}_{removed}}{\dot{m}_{carbon}} \times 1000 \quad (\text{mg salt / g carbon}) \\
\text{Electrical Topology & Power: } & V_{stack} = N_{pairs} \cdot V_{cell}, \quad P_{elec} = V_{stack} \cdot I_{cell} \quad (\text{Watts}) \\
\text{Hydraulic Pump Powers: } & P_{pump, water} = \frac{Q_{feed, m3s} \cdot \Delta P_{water}}{\eta_{pump, water}}, \quad P_{pump, slurry} = \frac{Q_{slurry, m3s} \cdot \Delta P_{slurry}}{\eta_{pump, slurry}} \\
\text{Independent SEC Breakdown: } & SEC_{total} = SEC_{elec} + SEC_{waterpump} + SEC_{slurrypump} \quad (\text{kWh/m}^3)
\end{aligned}$$

---

## 3. STRUCTURED MODEL PEDIGREE OBJECT

The FCDI engineering solver (`fCDIModel.js`) exposes a structured model pedigree object:

```javascript
modelPedigree: {
    firstPrinciples: [
        "Water volume conservation balance (Q_feed = Q_prod + Q_brine)",
        "Salt species mass balance (m_dot_feed = m_dot_prod + m_dot_brine)",
        "Molar salt removal rate (n_dot = m_dot / M_NaCl)",
        "Faraday charge demand relationship (I_FCDI = n_dot * z * F / Lambda)",
        "Continuous carbon mass-flow relationship (m_dot_carbon = C_slurry * Q_slurry)",
        "Electrical series module voltage scaling (V_stack = N_pairs * V_cell)",
        "Stack electrical power equation (P_elec = V_stack * I)",
        "Hydraulic pump power equation (P_pump = Q * Delta_P / eta)",
        "Separate SEC calculation breakdown (SEC_total = SEC_elec + SEC_waterpump + SEC_slurrypump)"
    ],
    literatureSupported: [
        "Flow-electrode contactor membrane stack architecture (Jeon et al., 2013)",
        "Continuous non-stop flow-electrode operation (Rommerskirchen et al., 2018)",
        "General carbon slurry operating range of 5–20 wt% (Wood et al., 2010)",
        "Qualitative non-Newtonian effective viscosity increase with carbon particle volume fraction"
    ],
    projectAssumptions: [
        "Default carbon slurry concentration (10 wt%)",
        "Default slurry flow ratio (Q_slurry = 1.2 * Q_feed)",
        "Default intrinsic carbon SAC reference (20.0 mg salt / g carbon)",
        "Slurry channel friction factor and pressure drop scaling factors",
        "Centrifugal water pump efficiency (75%) and progressive-cavity slurry pump efficiency (60%)"
    ],
    calibrationParameters: [
        "Lambda_FCDI (Flow-electrode charge utilization parameter = 0.88)"
    ],
    unsupportedPhysics: [
        "Particle aggregation & rheological clogging kinetics in narrow channel spacers",
        "Long-term carbon slurry degradation and particle attrition rates",
        "Detailed transient carbon-particle charge propagation micro-kinetics",
        "Dynamic membrane scaling and empirical foulant induction time",
        "Exact unvalidated performance on proprietary multi-component water matrixes"
    ]
}
```

---

## 4. TERMINOLOGY SEPARATION & MASS CONSERVATION

- **Intrinsic SAC ($SAC_{intrinsic}$):** Material adsorption capacity property of activated carbon ($20.0 \text{ mg salt / g carbon}$).
- **Operating Salt Loading ($Loading_{operating}$):** Salt removal rate per continuous circulating carbon mass flow rate:
  $$\text{Operating Salt Loading} = \frac{\dot{m}_{removed, g/s}}{\dot{m}_{carbon, g/s}} \times 1000 \quad (\text{mg salt / g carbon})$$
  *Note:* Modifying slurry flow rate or carbon concentration alters **Operating Salt Loading**, but does NOT change the carbon's **Intrinsic SAC**.

- **Mass Conservation Assertion:**
  $$\text{Mass Balance: 100.000\%} \quad \text{Status: CONSERVED} \quad (\text{Tolerance } < 1.0 \times 10^{-5} \text{ g/s})$$

---

## 5. INDEPENDENT SEC ENERGY ACCOUNTING (MODEL ESTIMATE)

```
================================================================================
FCDI ENERGY ACCOUNTING & SEC BREAKDOWN
================================================================================
Electrical Stack Power:      196.9 W
Water Pump Power:            0.8 W (Centrifugal pump, η_pump = 75%)
Slurry Pump Power:           16.0 W (Progressive cavity pump, η_pump = 60%)
Total System Power:          213.7 W

Electrical SEC:              0.3647 kWh/m³
Water Pump SEC:              0.00148 kWh/m³
Slurry Pump SEC:             0.02963 kWh/m³
Hydraulic SEC Total:         0.0311 kWh/m³
================================================================================
TOTAL NET SEC:               0.3958 kWh/m³  [MODEL ESTIMATE]
================================================================================
```

---

## 6. SENSITIVITY ANALYSIS API (`runFCDISensitivityAnalysis`)

The exported pure function `runFCDISensitivityAnalysis(baseInput, parameter, values)` evaluates sensitivity without mutating input objects.

### Verified Physical Directions (22/22 Tests Passed):
- Lower $\Lambda_{FCDI} (0.90 \rightarrow 0.70) \implies$ Higher Faraday current ($137.6 \rightarrow 176.9 \text{ A}$) & higher electrical SEC ($0.3565 \rightarrow 0.4584 \text{ kWh/m}^3$).
- Higher slurry flow ratio ($1.0 \rightarrow 2.0) \implies$ Higher slurry pump power ($13.3 \rightarrow 26.7 \text{ W}$) & higher hydraulic SEC.
- Higher slurry concentration ($10 \rightarrow 20 \text{ wt\%}) \implies$ Higher slurry pressure drop ($2,400 \rightarrow 4,260 \text{ Pa}$) & higher slurry pump SEC.
- Higher cell voltage ($1.2 \rightarrow 1.6 \text{ V}) \implies$ Higher electrical power ($168.9 \rightarrow 225.1 \text{ W}$).

---

## 7. AUTOMATED TEST SUITE & BUILD VERIFICATION RESULTS

All 5 Vitest test suites (containing 47 unit/regression tests) and the Vite client production build executed cleanly with **100% pass rates**:

```bash
# Vitest Execution Output
✓ client/src/engineering/fCDIModel.test.js (22 tests) 132ms
✓ client/src/engineering/mCDIModel.test.js (8 tests) 50ms
✓ client/src/engineering/cdiModel.test.js (9 tests) 88ms
✓ client/src/engineering/perTechnologyCalibration.test.js (1 test) 57ms
✓ client/src/engineering/technologySelection.test.js (7 tests) 52ms

Test Files  5 passed (5)
Tests       47 passed (47)

# Vite Production Build Output
✓ built in 23.48s
dist/index.html                           0.70 kB
dist/assets/index-SLQCuWBa.js         2,320.13 kB
```

---

## 8. STATEMENT OF MODEL PREDICTION vs EXPERIMENTAL VALIDATION

> [!IMPORTANT]
> The FCDI model presented in this platform is a **computational engineering prediction** based on first-principles conservation laws, peer-reviewed literature transport mechanisms, and explicit project calibration parameters.
> Automated software tests verify internal mathematical consistency and model integrity. They do **NOT** constitute experimental physical validation of an un-tested physical stack on proprietary water matrixes.

---
*End of Task 8.3 Final FCDI Model Validation Report (v4.0).*
