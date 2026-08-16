# FIRST-PRINCIPLES MCDI MODEL VALIDATION & VERIFICATION REPORT
**Independent Engineering Audit, Pedigree Matrix, SEC Energy Accounting, & Parametric CAD View**
*Document Version: 3.1*
*Date: August 2026*
*Author: Lead Desalination & Electrochemical Systems Engineer*

---

## 1. EXECUTIVE SUMMARY & ENGINEERING AUDIT RESOLUTIONS

An independent engineering review of `client/src/engineering/mCDIModel.js` and UI presentation components was performed. Every equation, unit conversion, SEC energy breakdown, stack sizing method, and CAD visualization claim was audited against peer-reviewed MCDI literature (*Zhao et al., 2012; Biesheuvel & van der Wal, 2010; Dykstra et al., 2016; Porada et al., 2013; Lee et al., 2014; PMC5618139; MDPI Membranes 2017*).

### Key Engineering Resolutions Applied

1. **Model Prediction Status vs. Validation Claim:**
   - The UI display status tag is explicitly labeled **`TARGET ACHIEVED — MODEL PREDICTION`**.
   - Literature benchmarks establish model equations, but do NOT validate an exact un-tested physical stack on proprietary water matrixes without pilot trial data.

2. **Refined Net SEC Labeling (Model Estimate):**
   - Specific Energy Consumption is explicitly labeled as **`Total Net SEC: 0.2646 kWh/m³ — model estimate based on assumed 20% regeneration-energy recovery`**.
   - The $20\%$ regeneration-energy recovery factor ($\eta_{recovery} = 0.20$) is an assumed project parameter representing constant-current desorption energy recovery, NOT a universal law:
     $$SEC_{elec, ads} = \frac{P_{stack} / 1000}{Q_{prod, m3h}} = \mathbf{0.3306 \text{ kWh/m}^3}$$
     $$SEC_{elec, net} = SEC_{elec, ads} \cdot (1 - 0.20) = \mathbf{0.2645 \text{ kWh/m}^3}$$
     $$SEC_{hyd} = \frac{Q_{m3s} \cdot \Delta P}{\eta_{pump} \cdot Q_{prod, m3h} \cdot 3600 \cdot 1000} = \mathbf{0.0001 \text{ kWh/m}^3}$$
     $$SEC_{total} = SEC_{elec, net} + SEC_{hyd} = \mathbf{0.2646 \text{ kWh/m}^3 \quad (\text{Model Estimate})}$$

3. **Charge Efficiency Parameter Classification ($\Lambda_{MCDI} = 0.92$):**
   - The nominal MCDI charge efficiency ($\Lambda_{MCDI} = 0.92$) is explicitly categorized as **`Charge Efficiency Parameter: 0.92 — model assumption/calibration`**.
   - Published MCDI literature (*MDPI Membranes 2017 review; Li et al. 2012*) shows that experimental charge efficiencies vary substantially ($50\% - 95\%$) depending on cell voltage, solution conductivity, and operating mode.

4. **Dual Rate + Capacity Electrode Sizing ($N_{pairs} = \max(N_{pairs, J}, N_{pairs, SAC})$):**
   - Stack cell-pair count satisfies **BOTH** the rate constraint ($J_{target}$) and carbon adsorption capacity ($SAC_{operating} \approx 25.0 \text{ mg/g}$) over the adsorption step ($t_{ads} = 10 \text{ min}$):
     $$N_{pairs, SAC} = \left\lceil \frac{Q_{feed, Lmin} \cdot t_{ads, min} \cdot (C_{feed} - C_{out})}{SAC_{operating} \cdot m_{carbon, pair}} \right\rceil$$
     $$N_{pairs} = \max\left( N_{pairs, J}, N_{pairs, SAC} \right)$$
     $$N_{modules} = \left\lceil \frac{N_{pairs}}{34} \right\rceil \implies N_{pairs} = N_{modules} \times 34$$

5. **Exact Multi-Stream Salt Mass Conservation:**
   - Exact multi-stream salt mass balance yields:
     $$C_{brine} = \frac{C_{feed} - R_w \cdot C_{out}}{1 - R_w} = C_{feed} + \frac{R_w \cdot (C_{feed} - C_{out})}{1 - R_w} = \mathbf{9,050 \text{ mg/L}}$$
     for $C_{feed} = 500 \text{ mg/L}, C_{out} = 50 \text{ mg/L}, R_w = 95\%$. Salt mass is $100\%$ conserved ($\text{Salt}_{in} = \text{Salt}_{prod} + \text{Salt}_{brine}$).

6. **Parametric Engineering CAD Visualization:**
   - 3D CAD is explicitly labeled as **“Parametric Engineering Visualization of Calculated Stack Geometry”** — NOT evidence of physical validation.
   - Physical layer order: Feed Spacer Channel $\rightarrow$ AEM Membrane $\rightarrow$ Carbon Anode $\rightarrow$ Current Collector $\rightarrow$ Carbon Cathode $\rightarrow$ CEM Membrane $\rightarrow$ Product Spacer Channel.

---

## 2. MODEL PEDIGREE CLASSIFICATION MATRIX

```
+-------------------------------------------------------------------------------+
|                        MCDI Model Pedigree Classification Matrix               |
+-------------------------------------------------------------------------------+
| 1. First-Principles      │ Exact physical laws (Mass & Energy Conservation)   |
| 2. Literature-Supported  │ AEM/CEM co-ion exclusion & mD charge efficiency    |
| 3. Empirical/Calibrated  │ Charge efficiency (0.92) & spacer friction drag    |
| 4. Project Assumption    │ Regeneration energy recovery 20%, cycle time 10m  |
| 5. Currently Unsupported │ Dynamic membrane scaling & non-linear fouling rate |
+-------------------------------------------------------------------------------+
```

---

## 3. VERIFIED MCDI BENCHMARK CALCULATION SUMMARY

- **Status:** **`TARGET ACHIEVED — MODEL PREDICTION`**
- **Target TDS:** $50 \text{ mg/L}$
- **Predicted Outlet TDS:** $50 \text{ mg/L}$
- **Predicted Removal:** $90.0\%$
- **Target Deviation:** $0.0 \text{ mg/L}$
- **Water Recovery ($R_w$):** $95\%$ $\implies Q_{prod} = 0.570 \text{ m}^3/\text{h}$ ($9.50 \text{ L/min}$), $Q_{brine} = 0.030 \text{ m}^3/\text{h}$ ($0.50 \text{ L/min}$)
- **Cell Voltage ($V_{cell}$):** $1.40 \text{ V}$
- **Charge Efficiency Parameter:** $\mathbf{0.92}$ (Model Assumption / Calibration)
- **Total Faraday Current ($I_{total}$):** $134.59 \text{ A}$
- **Synchronized Module Cell Pairs ($34$ pairs/module):** $3 \text{ modules} \implies \mathbf{102 \text{ cell pairs}}$
- **Operating Current Density $J_{actual}$:** $\mathbf{37.7 \text{ A/m}^2}$
- **System Stack Voltage $V_{stack}$:** $3 \times 47.60 \text{ V} = \mathbf{142.80 \text{ V}}$
- **Adsorption Electrical Power $P_{ads}$:** $142.80 \text{ V} \times 1.3195 \text{ A} = \mathbf{188.5 \text{ W}}$
- **Electrical Energy Accounting:**
  - Adsorption Electrical SEC ($SEC_{elec, ads}$): $\mathbf{0.3306 \text{ kWh/m}^3}$
  - Assumed Regeneration Energy Recovery ($\eta_{rec} = 20\%$): Net Electrical SEC $= \mathbf{0.2645 \text{ kWh/m}^3}$
  - Hydraulic Pumping SEC ($SEC_{hyd}$): $\mathbf{0.0001 \text{ kWh/m}^3}$
  - **Total Net SEC (Model Estimate):** $\mathbf{0.2646 \text{ kWh/m}^3 \quad (\text{Model Estimate based on assumed 20\% recovery})}$
- **Concentrate Salinity ($C_{brine}$):** $\frac{500 - 0.95 \times 50}{1 - 0.95} = \mathbf{9,050 \text{ mg/L}}$ $\quad \checkmark \text{ (100\% MASS CONSERVED)}$

---

## 4. AUTOMATED TEST SUITE & BUILD VERIFICATION

```bash
# Vitest Execution Output
✓ client/src/engineering/mCDIModel.test.js (8 tests) 29ms
✓ client/src/engineering/cdiModel.test.js (9 tests) 21ms
✓ client/src/engineering/perTechnologyCalibration.test.js (1 test) 19ms
✓ client/src/engineering/technologySelection.test.js (7 tests) 20ms

Test Files  4 passed (4)
Tests       25 passed (25)

# Vite Production Build Output
✓ built in 22.84s
```

---

## 5. STATEMENT OF UNVALIDATED PHYSICAL ASPECTS

The current MCDI model is mathematically verified and physically grounded in peer-reviewed electrosorption literature. The following aspects are explicitly noted as **NOT experimentally validated on proprietary pilot datasets**:
1. **Dynamic Membrane Fouling:** The model does not predict empirical scale induction time for $CaSO_4$ or $CaCO_3$ precipitation on AEM/CEM sheets under feed hardness $> 300 \text{ mg/L as CaCO}_3$.
2. **Multivalent Ion Competition:** Ion selectivity ratios ($Ca^{2+}/Na^+$ and $SO_4^{2-}/Cl^-$) across AEM/CEM membranes are modeled assuming equivalent monovalent $NaCl$.
3. **Transient Desorption Concentration Spike:** The dynamic time-dependent concentration peak during short $3 \text{ min}$ RPD flush cycles is modeled as a steady-state cycle average.

---
*End of MCDI Model Validation & Verification Report (v3.1).*
