# AUTHORITATIVE ENGINEERING MODEL SPECIFICATION
**Capacitive Deionization (CDI), Membrane CDI (MCDI), Flow-Electrode CDI (FCDI), and Electrodeionization (EDI)**
*Document Version: 1.0*
*Status: Authoritative Engineering Standard for CDI-EDI Platform*

---

## 1. OVERVIEW & SYSTEM TAXONOMY

This specification defines the authoritative mathematical and physical engineering models for the four technologies supported by the CDI-EDI Design Platform:
1. **Capacitive Deionization (CDI)** — Porous carbon electrosorption (discontinuous batch).
2. **Membrane Capacitive Deionization (MCDI)** — Membrane-enhanced electrosorption with co-ion blocking (discontinuous batch / reversed polarity).
3. **Flow-Electrode Capacitive Deionization (FCDI)** — Continuous slurry flow-electrode electrosorption (continuous).
4. **Electrodeionization (EDI)** — Electromembrane resin polishing with electro-dissociation auto-regeneration (continuous).

```
                      +---------------------------------------+
                      | CDI-EDI Desalination Platform Engine  |
                      +---------------------------------------+
                                          |
         +--------------------------------+--------------------------------+
         |                                                                 |
         v                                                                 v
+-------------------------------+                       +-------------------------------+
|   CDI Family Technologies     |                       | Electrodeionization (EDI)     |
| (Porous Carbon Electrosorption) |                       | (Electromembrane & Resin)     |
+-------------------------------+                       +-------------------------------+
| 1. CDI  (Uncoated Carbon)     |                       | - Mixed-Bed Resin Bed         |
| 2. MCDI (AEM/CEM Coated)      |                       | - Water Splitting (H+/OH-)    |
| 3. FCDI (Flow Carbon Slurry)  |                       | - Continuous UPW Polishing    |
+-------------------------------+                       +-------------------------------+
```

---

## 2. STANDARD NOTATION & PHYSICAL CONSTANTS

- $F$: Faraday's Constant ($96,485 \text{ C/mol}$)
- $R$: Universal Gas Constant ($8.314 \text{ J/(mol}\cdot\text{K)}$)
- $T$: Absolute Temperature ($K$, nominal $298.15 \text{ K}$)
- $z$: Ionic valence ($z=1$ for $\text{NaCl}$)
- $M_{NaCl}$: Molar mass of $\text{NaCl}$ ($58.44 \text{ g/mol}$)
- $\rho_{w}$: Water density ($1000 \text{ kg/m}^3$)
- $\mu$: Water dynamic viscosity ($0.001 \text{ Pa}\cdot\text{s}$)
- $C$: Ionic concentration ($\text{mg/L} \equiv \text{g/m}^3$ or $\text{mol/m}^3$)
- $Q$: Volumetric flow rate ($\text{m}^3/\text{s}$ or $\text{L/min}$)
- $N_{pairs}$: Number of cell pairs in stack
- $A_{pair}$: Planar electrode surface area per cell pair ($\text{m}^2$)
- $V_{cell}$: Cell pair voltage ($\text{V}$)
- $I$: Cell current ($\text{A}$)
- $J$: Current density ($\text{A/m}^2$)
- $\Lambda$: Charge efficiency ($0.0 - 1.0$)

---

## 3. TECHNOLOGY MODEL 1: CAPACITIVE DEIONIZATION (CDI)

### 3.1 Working Principle & Architecture
CDI desalinates water by electro-adsorbing monovalent and divalent ions into the Electrical Double Layer (EDL) formed inside the micropores of high-surface-area carbon electrodes upon applying a low DC cell voltage ($0.8 - 1.2 \text{ V}$). The cell stack consists of alternating porous carbon anodes and cathodes separated by open flow spacer channels. **No ion-exchange membranes are present.**

```
                     +V  [Anode Carbon]
  Feed Water ----->  -------------------  -----> Desalted Product
                     === Flow Spacer ===
                     -------------------  -----> (Adsorption Phase)
                     -V  [Cathode Carbon]
```

### 3.2 Electrochemistry & Modified Donnan (mD) Model
Ion transport in microporous carbon is governed by the Modified Donnan (mD) model. The total charge stored per unit volume of micropore $q_{mic}$ is related to the Stern layer potential drop $\Delta \phi_{st}$ and volumetric capacitance $C_{st,vol}$:

$$q_{mic} = c_{mi,0} \cdot 2 \sinh\left(\frac{z F \Delta \phi_{dD}}{R T}\right)$$

$$\Delta \phi_{st} = \frac{F \cdot q_{mic}}{C_{st,vol}}$$

Where $\Delta \phi_{dD}$ is the Donnan potential drop between the spacer macro-channel and electrode micropores.

#### Dynamic Charge Efficiency ($\Lambda_{CDI}$):
Due to **co-ion expulsion** (expulsion of cations from anode and anions from cathode during charging), charge efficiency $\Lambda_{CDI}$ is significantly less than 100%:

$$\Lambda_{CDI} = \frac{\text{Net Salt Adsorbed}}{\text{Total Charge Passed}} = \tanh\left(\frac{z F \Delta \phi_{st}}{2 R T}\right)$$

*Key Physics Behavior:* $\Lambda_{CDI}$ ranges between **$50\%$ and $82\%$**, decreasing with increasing cell voltage $V_{cell}$ and lower feed concentration $C_{feed}$.

### 3.3 Mass Balance & Desalination Rate
For a stack of $N_{pairs}$ cell pairs in electrical series and hydraulic parallel during adsorption cycle $t_{ads}$:

$$\dot{m}_{salt} = Q_{feed} \cdot (C_{in} - C_{out}) = \frac{N_{pairs} \cdot I \cdot \Lambda_{CDI} \cdot M_{NaCl}}{z F}$$

$$C_{out}(t) = C_{in} - \frac{N_{pairs} \cdot I(t) \cdot \Lambda_{CDI}}{Q_{feed} \cdot z F} \cdot M_{NaCl}$$

Total equilibrium salt adsorption capacity ($SAC$, $\text{mg/g}$):
$$SAC(C_{feed}, V_{cell}) = SAC_{max} \cdot \left(\frac{C_{feed}}{K_{Langmuir} + C_{feed}}\right) \cdot \left(\frac{V_{cell}}{V_{ref}}\right)$$

### 3.4 Hydraulics & Pressure Drop
Flow spacer channel height $\delta_{spacer} = 0.3 - 0.5 \text{ mm}$. Pressure drop $\Delta P$ across netting spacer length $L$:

$$f_{spacer} = K_T \cdot Re^{-n} \quad (K_T \approx 4.5, n \approx 0.30 \text{ for netting mesh})$$

$$\Delta P = f_{spacer} \cdot \frac{L}{D_h} \cdot \frac{\rho_w v_{channel}^2}{2}$$

### 3.5 Energy Consumption (SEC)
$$SEC_{elec, CDI} = \frac{\int_0^{t_{ads}} V_{stack} \cdot I(t) \, dt}{Q_{feed} \cdot R_w \cdot t_{ads} \cdot 3600 \cdot 1000} \quad (\text{kWh/m}^3)$$

$$SEC_{pump} = \frac{\Delta P}{\eta_{pump} \cdot R_w \cdot 3600 \cdot 1000} \quad (\text{kWh/m}^3)$$

### 3.6 Operating Bounds
- Feed TDS: $< 1,000 \text{ mg/L}$ (Optimal $100 - 800 \text{ mg/L}$)
- Cell Voltage: $0.8 - 1.2 \text{ V}$ (Max $1.5 \text{ V}$ to prevent water electrolysis)
- Water Recovery: $75\% - 90\%$

---

## 4. TECHNOLOGY MODEL 2: MEMBRANE CAPACITIVE DEIONIZATION (MCDI)

### 4.1 Working Principle & Architecture
MCDI integrates Anion Exchange Membranes (AEM) in front of the positive carbon electrode and Cation Exchange Membranes (CEM) in front of the negative carbon electrode. The membranes **block co-ion expulsion**, retaining co-ions within the electrode pores while allowing counter-ions to pass.

```
                     +V  [Anode Carbon]
                         [AEM Membrane]
  Feed Water ----->  ===================  -----> Desalted Product
                         [CEM Membrane]
                     -V  [Cathode Cathode]
```

### 4.2 Electrochemistry & Co-ion Blocking
By eliminating co-ion expulsion, the charge efficiency of MCDI approaches theoretical unity:

$$\Lambda_{MCDI} = \Lambda_{film} \cdot \sigma_{perm} \approx 0.90 - 0.98$$

Where $\sigma_{perm}$ is the membrane permselectivity ($0.95 - 0.99$).

### 4.3 Reversed Polarity Regeneration Dynamics
Unlike CDI (which short-circuits during flush), MCDI utilizes **reversed polarity desorption (RPD)** ($-V_{cell}$, e.g. $-1.4 \text{ V}$), forcing electro-adsorbed ions rapidly out of carbon pores into a concentrated brine stream.

#### Concentrate Brine Concentration ($C_{brine, max}$):
$$C_{brine, max} = C_{in} + \left(\frac{C_{in} - C_{out}}{1 - R_w}\right)$$

### 4.4 Sizing & Mass Balance
$$N_{pairs} = \left\lceil \frac{Q_{feed} \cdot (C_{in} - C_{target}) \cdot z F}{I_{operating} \cdot \Lambda_{MCDI} \cdot M_{NaCl}} \right\rceil$$

### 4.5 Operating Bounds
- Feed TDS: $500 - 3,000 \text{ mg/L}$
- Cell Voltage: $1.0 - 1.6 \text{ V}$
- Charge Efficiency: $90\% - 98\%$
- Water Recovery: $85\% - 95\%$

---

## 5. TECHNOLOGY MODEL 3: FLOW-ELECTRODE CAPACITIVE DEIONIZATION (FCDI)

### 5.1 Working Principle & Architecture
FCDI replaces static solid carbon electrodes with **continuously circulating flowable liquid carbon slurry electrodes** (suspended conductive carbon black / activated carbon particles in electrolyte, $5-20 \text{ wt\%}$). The slurry flows behind AEM and CEM sheets while feed water flows through a central desalting channel.

```
  [Slurry Loop 1] ---->  [Flow Slurry Anode]  ----> [External Discharger]
                         [AEM Membrane]
  Feed Water --------->  === Feed Channel === ----> Continuous Product
                         [CEM Membrane]
  [Slurry Loop 2] ---->  [Flow Slurry Cathode]----> [External Discharger]
```

### 5.2 Continuous Transport & Mass Balance
FCDI operates **continuously** without batch adsorption/desorption interruption cycles.

#### Steady-State Salt Removal Rate:
$$\dot{m}_{salt} = Q_{feed} \cdot (C_{in} - C_{out}) = \frac{N_{pairs} \cdot I \cdot \Lambda_{FCDI}}{z F} \cdot M_{NaCl}$$

#### Slurry Carbon Loading ($q_{slurry}$, $\text{mg/g}$):
$$q_{slurry, out} = q_{slurry, in} + \frac{Q_{feed} \cdot (C_{in} - C_{out})}{\dot{m}_{slurry, carbon}}$$

Where $\dot{m}_{slurry, carbon} = Q_{slurry} \cdot \rho_{slurry} \cdot \omega_{carbon}$.

### 5.3 Slurry Rheology & Parasitic Pumping Energy
Slurry viscosity $\mu_{slurry}$ increases nonlinearly with carbon weight fraction $\omega_{wt\%}$ according to Krieger-Dougherty model:

$$\mu_{slurry} = \mu_{water} \left(1 - \frac{\phi}{\phi_{max}}\right)^{-[\eta]\phi_{max}}$$

Parasitic slurry pumping power ($P_{slurry}$):
$$P_{slurry} = 2 \times \left(\frac{Q_{slurry} \cdot \Delta P_{slurry}}{\eta_{pump}}\right)$$

Total FCDI SEC:
$$SEC_{total, FCDI} = \frac{V_{stack} \cdot I + P_{slurry}}{Q_{feed} \cdot R_w \cdot 3600 \cdot 1000} \quad (\text{kWh/m}^3)$$

### 5.4 Operating Bounds
- Feed TDS: $3,000 - 30,000 \text{ mg/L}$ (High-salinity brackish & sea-water)
- Cell Voltage: $1.2 - 2.0 \text{ V}$
- Slurry Loading: $5 - 15 \text{ wt\%}$
- Operation Mode: Truly Continuous

---

## 6. TECHNOLOGY MODEL 4: ELECTRODEIONIZATION (EDI)

### 6.1 Working Principle & Architecture
EDI is a hybrid **electromembrane and ion-exchange resin process**. The diluate channel between AEM and CEM sheets is packed with mixed-bed ion-exchange resin beads ($40\% \text{ cation} / 60\% \text{ anion}$). Under a high applied DC electric field ($5 - 50 \text{ V/cell}$), ions migrate rapidly along high-conductivity resin bead paths. Under high field strength, **water splitting ($H_2O \rightarrow H^+ + OH^-$)** occurs at resin-resin and resin-membrane interfaces, continuously regenerating the ion-exchange resin *in situ*.

```
                     +V  [Titanium Anode]
                         [AEM Membrane]
  RO Permeate ------>  [Diluate: Mixed-Bed] -----> Ultra-Pure Water
  (<30 mg/L TDS)       [Resin (H+/OH- Auto-Regen)] (<0.1 mg/L TDS)
                         [CEM Membrane]
                     -V  [Titanium Cathode]
```

### 6.2 Transport Mechanisms & Water Splitting

#### 1. Resin Phase Conductivity Enhancement:
In low-salinity water ($< 30 \text{ mg/L}$), water electrical conductivity is extremely low ($< 50 \ \mu\text{S/cm}$). The mixed resin bed provides a high-conductivity ionic bridge across the flow channel:

$$\sigma_{bed} = \sigma_{water} \cdot (1 - \phi_{resin}) + \sigma_{resin, eff} \cdot \phi_{resin}$$

#### 2. Limiting Current Density ($I_{lim}$):
The mass transfer limiting current density in the boundary layer:

$$J_{lim} = \frac{z F \cdot k_m \cdot C_{feed}}{1 - t_+}$$

Where $k_m$ is the mass transfer coefficient ($m/s$) and $t_+$ is the transport number in solution.

#### 3. Water Splitting Auto-Regeneration:
When operating current density $J > J_{lim}$, concentration polarization drives local dissociation of water molecules:

$$H_2O \xrightarrow{\text{Electric Field / Resin Catalysis}} H^+ + OH^-$$

- Generated $H^+$ continuously regenerates cation exchange resin ($R-Na + H^+ \rightarrow R-H + Na^+$).
- Generated $OH^-$ continuously regenerates anion exchange resin ($R-Cl + OH^- \rightarrow R-OH + Cl^-$).
- **Result:** Chemical-free, continuous production of ultra-pure water ($> 15 - 18.2 \text{ M}\Omega\cdot\text{cm}$).

### 6.3 EDI Sizing & Electro-Molar Balance
Product water purity is specified in resistivity ($\text{M}\Omega\cdot\text{cm}$) or TDS ($< 0.1 \text{ mg/L}$).

$$N_{pairs, EDI} = \left\lceil \frac{Q_{feed} \cdot (C_{in} - C_{out}) \cdot z F}{I_{operating} \cdot \eta_i \cdot M_{NaCl}} \right\rceil$$

Where $\eta_i$ is the current efficiency ($0.85 - 0.98$).

$$V_{module, EDI} = N_{pairs} \cdot \left(I \cdot R_{bed} + V_{membrane, AEM} + V_{membrane, CEM} + \Delta V_{water\_splitting}\right)$$

### 6.4 Operating Bounds & Pretreatment Constraints
- **Feed TDS:** $< 30 \text{ mg/L}$ (RO Permeate ONLY; Direct feed $>30 \text{ ppm}$ is INVALID)
- **Feed Conductivity:** $< 50 \ \mu\text{S/cm}$
- **Feed Hardness:** $< 0.5 \text{ mg/L as } \text{CaCO}_3$ (Prevents immediate $CaCO_3/Mg(OH)_2$ scaling)
- **Cell Voltage:** $5.0 - 50.0 \text{ V}$ per cell/module
- **Target Product Quality:** Ultra-pure water ($0.055 - 1.0 \ \mu\text{S/cm}$ / $1.0 - 18.2 \text{ M}\Omega\cdot\text{cm}$)

---

## 7. SUMMARY COMPARISON MATRIX

| Feature / Model Metric | CDI | MCDI | FCDI | EDI |
| :--- | :--- | :--- | :--- | :--- |
| **Separation Medium** | Porous Carbon | Porous Carbon + AEM/CEM | Carbon Slurry + AEM/CEM | Mixed-Bed Resin + AEM/CEM |
| **Primary Ion Transport** | Electrosorption into EDL | Co-ion blocked EDL electrosorption | Continuous slurry electrosorption | Resin electromigration + Electrodialysis |
| **Charge Efficiency Formula** | $\Lambda = \tanh\left(\frac{z F \Delta \phi_{st}}{2 R T}\right)$ | $\Lambda = \Lambda_{film} \cdot \sigma_{perm}$ | $\Lambda \approx 0.88 - 0.95$ | $\eta_i = \frac{z F Q \Delta C}{N I M}$ |
| **Operation Mode** | Batch (Adsorb/Flush) | Batch (Adsorb/RPD Flush) | Truly Continuous | Truly Continuous |
| **Regeneration Mechanism** | Short circuit / Zero V | Reverse potential ($-V$) | External slurry loop | Water splitting ($H^+/OH^-$) |
| **Valid Feed Range** | $< 1,000 \text{ mg/L}$ | $500 - 3,000 \text{ mg/L}$ | $3,000 - 30,000 \text{ mg/L}$ | $< 30 \text{ mg/L}$ (RO Permeate) |
| **Target Product Quality** | $50 - 200 \text{ mg/L}$ | $10 - 100 \text{ mg/L}$ | $100 - 500 \text{ mg/L}$ | $< 0.1 \text{ mg/L}$ ($18.2 \text{ M}\Omega\cdot\text{cm}$) |

---
*End of Authoritative Engineering Model Specification.*
