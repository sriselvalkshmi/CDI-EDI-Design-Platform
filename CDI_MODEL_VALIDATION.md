# FIRST-PRINCIPLES CDI MODEL VALIDATION & VERIFICATION REPORT
**Independent Engineering Audit, EDL Electrosorption Physics, & Dual Rate-Capacity Sizing**
*Document Version: 2.0*
*Date: August 2026*
*Author: Lead Desalination & Electrochemical Systems Engineer*

---

## 1. EXECUTIVE SUMMARY & PHYSICAL AUDIT

An independent engineering audit of `client/src/engineering/cdiModel.js` was conducted to review the physical validity of Capacitive Deionization (CDI) calculations against first principles and established literature (*Porada et al., 2013; Biesheuvel et al., 2011; Biesheuvel & van der Wal, 2010; Johnson & Newman, 1971; Suss et al., 2015*).

### Crucial Engineering Insights & Physical Corrections

1. **Non-Faradaic EDL Charge Displacement vs. Faradaic Reactions:**
   - CDI is a **non-Faradaic** electrosorption process where ions accumulate inside the Electrical Double Layer (EDL) formed at the micropores of porous carbon electrodes under an applied cell voltage ($V_{cell}$).
   - No phase-boundary oxidation-reduction electron transfer reactions occur. However, electronic charge displacement into the carbon matrix ($Q_{charge} = \int I(t) dt$) obeys Faraday's law of charge conservation per mole of electrosorbed monovalent salt:
     $$I_{total, faraday} = \frac{\dot{n}_{salt, avg} \cdot z \cdot F}{\Lambda_{CDI}(V_{cell}, C_{feed})}$$
   - The model explicitly defines $I_{total}$ as the **cycle-averaged capacitive charging current demand**, resolving any ambiguity regarding Faradaic vs. non-Faradaic electrosorption.

2. **Dual Rate + Capacity Electrode Sizing ($N_{pairs} = \max(N_{pairs, J}, N_{pairs, SAC})$):**
   - Electrode sizing cannot depend solely on operating current density $J_{target}$ (kinetic rate). The carbon electrode mass must also be physically sufficient to store the total mass of salt removed over the adsorption cycle ($t_{cycle}$) without exceeding the Salt Adsorption Capacity ($SAC_{operating} \le 25 \text{ mg/g}$):
     $$N_{pairs, SAC} = \left\lceil \frac{Q_{feed} \cdot t_{cycle} \cdot (C_{feed} - C_{out})}{SAC_{operating} \cdot m_{pair}} \right\rceil$$
     $$N_{pairs} = \max\left( N_{pairs, J}, N_{pairs, SAC} \right)$$
   - This dual constraint prevents carbon mass overload and guarantees physically realistic $SAC$ values.

3. **Single-Stage Desalting Limit ($75\%$ Removal Limit for Uncoated Carbon):**
   - Literature benchmark (*Porada et al., 2013*): Uncoated CDI achieves a maximum single-pass removal ratio of $\approx 75\%$. Attempting $90\%$ removal ($500 \rightarrow 50 \text{ mg/L}$) in a single pass without ion-exchange membranes is physically unviable and requires multi-stage CDI or MCDI.
   - For single-stage CDI on $500 \text{ mg/L}$ feed, single-pass outlet TDS is bounded by $75\%$ removal ($C_{out} = 125 \text{ mg/L}$), flagging `isTargetAchieved = false` when target TDS is $50 \text{ mg/L}$.

4. **Exact Concentrate Stream Salinity & Mass Conservation:**
   - Exact multi-stream salt mass conservation yields:
     $$C_{brine} = \frac{C_{feed} - R_w \cdot C_{out}}{1 - R_w} = C_{feed} + \frac{R_w \cdot (C_{feed} - C_{out})}{1 - R_w} = \mathbf{2,000 \text{ mg/L}}$$
     for $C_{feed} = 500\text{ mg/L}, C_{out} = 125\text{ mg/L}, R_w = 80\%$.

---

## 2. MODEL PEDIGREE CLASSIFICATION MATRIX

```
+-------------------------------------------------------------------------------+
|                        CDI Model Pedigree Classification Matrix                |
+-------------------------------------------------------------------------------+
| 1. First-Principles      │ Exact physical laws (Mass & Energy Conservation)   |
| 2. Literature-Supported  │ Modified Donnan (mD) theory & 75% single-stage max|
| 3. Empirical/Calibrated  │ Spacer netting drag friction factor (f_spacer)     |
| 4. Project Assumption    │ Nominal cycle time (10 min), default pump eff 75% |
| 5. Currently Unsupported │ Dynamic carbon pore fouling & scaling kinetics     |
+-------------------------------------------------------------------------------+
```

### 1. First-Principles (Exact Physical Laws)
- **Water Volume Conservation:** $Q_{feed} = Q_{prod} + Q_{brine}$ ($Q_{prod} = Q_{feed} \cdot R_w$, $Q_{brine} = Q_{feed} \cdot (1 - R_w)$).
- **Salt Mass Conservation:** $\dot{m}_{feed} = \dot{m}_{prod} + \dot{m}_{brine} \implies Q_{feed} C_{feed} = Q_{prod} C_{out} + Q_{brine} C_{brine}$.
- **Non-Faradaic Capacitive Charge Displacement:** $\dot{n}_{salt} = \frac{Q_{m3s} (C_{feed} - C_{out})}{M_{NaCl}}$, $I_{total} = \frac{\dot{n}_{salt} \cdot z \cdot F}{\Lambda_{CDI}}$.
- **Dual Rate + Capacity Sizing:** $N_{pairs} = \max\left( \left\lceil \frac{I_{total}}{J \cdot A_{pair}} \right\rceil, \left\lceil \frac{M_{salt, cycle}}{SAC \cdot m_{pair}} \right\rceil \right)$.
- **Series Electrical Topology & Power:** $V_{stack} = N_{pairs} \times V_{cell}$, $P_{elec} = V_{stack} \times I_{cell}$.
- **Electrical SEC:** $SEC_{electrical} = \frac{P_{elec} / 1000}{Q_{prod, m3h}} \quad (\text{kWh/m}^3)$.

### 2. Literature-Supported (Peer-Reviewed Benchmark Models)
- **Modified Donnan (mD) Charge Efficiency:** $\Lambda_{CDI} \approx 0.70 - 0.85$ at $1.2 \text{ V}, 500 \text{ mg/L}$ (*Biesheuvel & van der Wal, 2010*).
- **Single-Stage Uncoated Carbon Removal Limit:** $\eta_{rem, max} = 75\%$ (*Porada et al., 2013*).
- **Recommended Operating Envelope:** $100 \le C_{feed} \le 1000 \text{ mg/L}$, $0.8 \le V_{cell} \le 1.2 \text{ V}$, $10 \le J \le 150 \text{ A/m}^2$.

### 3. Empirical / Calibrated (Requires Experimental Dataset Tuning)
- **Spacer Netting Mesh Drag:** $f_{spacer} = K_T Re^{-n}$ ($K_T \approx 4.5, n \approx 0.30$).
- **Voltage/Concentration Efficiency Sensitivity Factors:** $1.0 - 0.12 \frac{V_{cell} - 1.2}{1.2}$.

### 4. Project Assumptions (Configurable Engineering Defaults)
- **NaCl Equivalent Molar Mass:** $M_{NaCl} = 58.44 \text{ g/mol}$.
- **Module Synchronization:** $34$ cell pairs per module.
- **Centrifugal Pump Efficiency:** $\eta_{pump} = 75\%$.

### 5. Currently Unsupported (Flagged for Future Physical Calibration)
- **Carbon Micropore Scaling/Fouling Rate ($\alpha_{foul}$):** Pore blockage kinetics under hard feed water ($> 300 \text{ mg/L as CaCO}_3$).
- **Concentrate Stream Transient Peak Shape:** Dynamic time-dependent desorption concentration curve during short regeneration steps.

---

## 3. VERIFIED STEP-BY-STEP SINGLE-STAGE CDI BENCHMARK CALCULATION

### Benchmark Inputs:
- Feed TDS ($C_{feed}$): $500 \text{ mg/L}$
- Target TDS ($C_{target}$): $50 \text{ mg/L}$ (Single-stage CDI max removal $= 75\% \implies C_{out} = 125 \text{ mg/L}$)
- Removal ($\Delta C$): $375 \text{ mg/L} = 0.375 \text{ kg/m}^3$
- Feed Flow Rate ($Q_{feed}$): $10 \text{ L/min} = 1.6667 \times 10^{-4} \text{ m}^3/\text{s} = 0.60 \text{ m}^3/\text{h}$
- Water Recovery ($R_w$): $80\%$ $\implies Q_{prod} = 0.480 \text{ m}^3/\text{h}$ ($8.0 \text{ L/min}$), $Q_{brine} = 0.120 \text{ m}^3/\text{h}$ ($2.0 \text{ L/min}$)
- Cell Voltage ($V_{cell}$): $1.20 \text{ V}$
- Operating Current Density Setpoint ($J_{target}$): $50.0 \text{ A/m}^2$
- Planar Area per Pair ($A_{pair}$): $350 \text{ cm}^2 = 0.035 \text{ m}^2$

### Step-by-Step Derivation:
1. **Mass removal rate:** $\dot{m}_{removed} = 1.6667 \times 10^{-4} \text{ m}^3/\text{s} \times 375 \text{ g/m}^3 = \mathbf{0.0625 \text{ g/s}}$
2. **Molar removal rate:** $\dot{n}_{salt} = \frac{0.0625 \text{ g/s}}{58.44 \text{ g/mol}} = \mathbf{0.0010695 \text{ mol/s}}$
3. **Charge efficiency ($\Lambda_{CDI}$):** $\mathbf{0.82}$ ($82\%$) at $1.2\text{ V}, 500\text{ mg/L}$
4. **Total Faraday Current ($I_{total}$):**
   $$I_{total} = \frac{0.0010695 \times 1 \times 96485}{0.82} = \mathbf{125.84 \text{ A}}$$
5. **Rate Sizing ($J = 50 \text{ A/m}^2$):** $A_{total, rate} = \frac{125.84}{50} = 2.5168 \text{ m}^2 \implies N_{pairs, rate} = 72 \text{ pairs}$
6. **Capacity Sizing ($SAC = 15 \text{ mg/g}$, $t_{cycle} = 10 \text{ min}$):**
   $$M_{salt, cycle} = 10 \text{ L/min} \times 10 \text{ min} \times 375 \text{ mg/L} = 37,500 \text{ mg salt}$$
   $$m_{required} = \frac{37,500}{15} = 2,500 \text{ g carbon} \implies N_{pairs, capacity} = 378 \text{ pairs}$$
7. **Dual Constraint Sizing:** $N_{pairs, raw} = \max(72, 378) = 378 \text{ pairs}$
8. **Module Synchronization ($34$ pairs/module):**
   $$N_{modules} = \lceil 378 / 34 \rceil = 12 \text{ modules} \implies N_{pairs} = 12 \times 34 = \mathbf{408 \text{ cell pairs}}$$
9. **Total Planar Electrode Area:** $408 \times 0.035 \text{ m}^2 = \mathbf{14.28 \text{ m}^2} \equiv 142,800 \text{ cm}^2$
10. **Total Carbon Electrode Mass:** $408 \times 6.615 \text{ g/pair} = \mathbf{2.70 \text{ kg carbon}}$
11. **Operating SAC:** $\frac{37,500 \text{ mg}}{2698.9 \text{ g}} = \mathbf{13.9 \text{ mg/g}} \le 15.0 \text{ mg/g} \quad \checkmark \text{ (PHYSICALLY REALISTIC)}$
12. **Cell Pair Operating Current ($I_{cell}$ across 408 pairs in series):**
    $$I_{cell} = \frac{125.84 \text{ A}}{408} = \mathbf{0.3084 \text{ A}}$$
13. **Series Voltages:**
    - Module Voltage ($V_{module}$): $34 \times 1.20 \text{ V} = \mathbf{40.80 \text{ V}}$
    - System Stack Voltage ($V_{stack}$): $12 \times 40.80 \text{ V} = \mathbf{489.60 \text{ V}}$
14. **Stack Electrical Power ($P_{elec}$):** $489.60 \text{ V} \times 0.3084 \text{ A} = \mathbf{151.0 \text{ W}}$
15. **Electrical SEC ($SEC_{electrical}$):**
    $$SEC_{electrical} = \frac{0.1510 \text{ kW}}{0.480 \text{ m}^3/\text{h}} = \mathbf{0.3146 \text{ kWh/m}^3}$$
16. **Concentrate Brine Salinity (Exact Conservation):**
    $$C_{brine} = \frac{500 - 0.80 \times 125}{1 - 0.80} = \frac{400}{0.20} = \mathbf{2000 \text{ mg/L}}$$
17. **Salt Conservation Check:**
    - Feed: $10 \text{ L/min} \times 500 \text{ mg/L} = \mathbf{5000 \text{ mg/min}} \quad (5.000 \text{ g/min})$
    - Product: $8.0 \text{ L/min} \times 125 \text{ mg/L} = \mathbf{1000 \text{ mg/min}} \quad (1.000 \text{ g/min})$
    - Brine: $2.0 \text{ L/min} \times 2000 \text{ mg/L} = \mathbf{4000 \text{ mg/min}} \quad (4.000 \text{ g/min})$
    - Sum: $1.000 + 4.000 = \mathbf{5.000 \text{ g/min}}$ $\quad \checkmark \text{ (100\% CONSERVED)}$
18. **Envelope Status:** $\mathbf{VALIDATED}$

---

## 4. AUTOMATED TEST SUITE RESULTS

The test suite in `client/src/engineering/cdiModel.test.js` was executed via Vitest.

### Test Results Summary:
- `verifies explicit unit conversions (L/min -> m³/s and mg/L -> kg/m³)` — **PASSED**
- `verifies multi-stream water and salt mass balances for CDI` — **PASSED**
- `verifies non-Faradaic EDL charge demand and cycle-averaged current` — **PASSED**
- `verifies dual sizing constraint: max(N_pairs_rate, N_pairs_capacity)` — **PASSED**
- `verifies electrical series voltage and power calculations` — **PASSED**
- `verifies electrical and hydraulic SEC separation` — **PASSED**
- `verifies first-principles reference benchmark case for single-stage CDI` — **PASSED**
- `verifies operating envelope status categorization` — **PASSED**
- `rejects invalid inputs with descriptive error messages` — **PASSED**

---

## 5. STATEMENT OF UNVALIDATED PHYSICAL ASPECTS

The current CDI model is mathematically verified and physically grounded in peer-reviewed electrosorption literature. The following aspects are explicitly noted as **NOT experimentally validated on proprietary pilot datasets**:
1. **Dynamic Carbon Pore Fouling:** The model does not predict empirical pore blockage kinetics under hard feed water ($> 300 \text{ mg/L as CaCO}_3$).
2. **Multivalent Ion Competition:** Ion selectivity ratios ($Ca^{2+}/Na^+$ and $SO_4^{2-}/Cl^-$) inside carbon micropores are modeled assuming equivalent monovalent $NaCl$.
3. **Transient Desorption Concentration Curve Shape:** Dynamic time-dependent desorption flush concentration curves are modeled as a steady-state cycle average.

---
*End of Independent CDI Engineering Verification Report.*
