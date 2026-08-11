# VALIDATION REQUIREMENTS & TEST SUITE SPECIFICATION
**Comprehensive Engineering Test Framework & Physics Verification Matrix**
*Document Version: 1.0*
*Status: Authoritative Test Specification for CDI-EDI Platform*

---

## 1. OVERVIEW

This document specifies the validation requirements and test suite architecture necessary to verify the correctness, scientific defensibility, and numerical stability of the CDI-EDI Design Platform calculation engines.

---

## 2. TEST SUITE CATEGORIES & ASSERTION RULES

The test suite is structured into six mandatory test categories:

```
+------------------------------------------------------------------+
|                    Validation Test Suite Pipeline                |
+------------------------------------------------------------------+
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
+-------------------+   +-------------------+   +-------------------+
| 1. Mass Balance   |   | 2. Unit & Scale   |   | 3. Technology     |
|    Conservation   |   |    Consistency    |   |    Separation     |
+-------------------+   +-------------------+   +-------------------+
      │                           │                           │
      ▼                           ▼                           ▼
+-------------------+   +-------------------+   +-------------------+
| 4. Operational    |   | 5. Hydrodynamic   |   | 6. Peer-Reviewed  |
|    Envelope Gates |   |    Sanity Checks  |   |    Literature     |
+-------------------+   +-------------------+   +-------------------+
```

---

### 2.1 Category 1: Species Mass Balance Conservation Tests
- **Objective:** Verify absolute mass conservation across feed, product, and brine streams.
- **Assertion Formula:**
  $$\left| \dot{m}_{feed} - (\dot{m}_{prod} + \dot{m}_{brine}) \right| < 1.0 \times 10^{-6} \text{ g/s}$$
  $$\left| Q_{feed} \cdot C_{feed} - (Q_{prod} \cdot C_{prod} + Q_{brine} \cdot C_{brine}) \right| < 1.0 \times 10^{-4} \text{ g/min}$$
- **Test File:** `client/src/engineering/engineeringSanityChecks.test.js`

---

### 2.2 Category 2: Unit & Dimensional Consistency Tests
- **Objective:** Prevent unit mismatch errors (e.g. $\text{L/min}$ vs $\text{m}^3/\text{h}$ or $\text{A/cm}^2$ vs $\text{A/m}^2$).
- **Test Cases:**
  1. **Flow Conversion:** Assert $Q (\text{m}^3/\text{h}) = \frac{Q (\text{L/min}) \times 60}{1000}$.
  2. **Current Density:** Assert $J (\text{A/m}^2) = \frac{I (\text{A})}{A_{pair} (\text{cm}^2) / 10000}$.
  3. **SEC Calculation:** Assert $SEC (\text{kWh/m}^3) = \frac{P_{elec} (\text{W}) / 1000}{Q_{prod} (\text{m}^3/\text{h})}$.

---

### 2.3 Category 3: Technology Separation & Inheritance Tests
- **Objective:** Ensure EDI does not inherit CDI carbon $SAC$ or batch adsorption cycle parameters.
- **Test Cases:**
  1. **EDI Carbon Isolation:** Assert `calculateEngineering({ technology: "EDI" })` does NOT contain `sac` or `adsorptionCycleMin` properties in its core solver.
  2. **EDI Feasibility Gate:** Assert `calculateEngineering({ technology: "EDI", feedWater: { tds: 500 } })` returns `feedQualityFeasible = false`.
  3. **CDI Membrane Absence:** Assert CDI solver sets membrane thickness and membrane cost terms to zero.

---

### 2.4 Category 4: Operational Envelope Boundary Gate Tests
- **Objective:** Verify feed quality checks enforce strict operational boundaries defined in `desalinationTechConfig.json`.

| Technology | Max Direct Feed TDS | Max Hardness | Expected Boundary Behavior |
| :--- | :--- | :--- | :--- |
| **CDI** | $1,000 \text{ mg/L}$ | $200 \text{ mg/L}$ | Warning for $TDS > 1000$; Feasibility = false for $TDS > 2000$. |
| **MCDI** | $3,000 \text{ mg/L}$ | $300 \text{ mg/L}$ | Feasibility = true for $500 - 3000\text{ ppm}$; Warning for $>3000\text{ ppm}$. |
| **FCDI** | $30,000 \text{ mg/L}$ | $500 \text{ mg/L}$ | Feasibility = true up to $30,000\text{ ppm}$. |
| **EDI** | $30 \text{ mg/L}$ | $0.5 \text{ mg/L}$ | Feasibility = false for $TDS > 30\text{ ppm}$ or Hardness $>0.5\text{ ppm}$. |

---

### 2.5 Category 5: Hydrodynamic & Electrical Topology Sanity Checks
- **Objective:** Validate series/parallel electrical and hydraulic topology calculations.
- **Test Cases:**
  1. **Module Voltage Multiplier:** Assert $V_{module} = N_{pairs/module} \times V_{cell}$.
  2. **Stack Power:** Assert $P_{stack} = V_{stack} \times I_{cell}$.
  3. **Residence Time Scaling:** Assert residence time $\tau = \frac{V_{reactor}}{Q}$ decreases monotonically with increasing flow rate.

---

### 2.6 Category 6: Peer-Reviewed Literature Benchmark Datasets

The calculation engine must be validated against published peer-reviewed datasets:

| Benchmark Case | Technology | Feed TDS | Removal | Recovery | Literature Reference | Target Voltage / Power / SEC Bounds |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Benchmark 1** | CDI | $500 \text{ mg/L}$ | $75\%$ | $80\%$ | Porada et al. (2013), *Prog. Mater. Sci.* | $V=1.2\text{V}$, $SEC=0.15 - 0.35\text{ kWh/m}^3$ |
| **Benchmark 2** | MCDI | $500 \text{ mg/L}$ | $90\%$ | $95\%$ | Zhao et al. (2012), *ES&T* | $V=1.4\text{V}$, $SEC=0.25 - 0.40\text{ kWh/m}^3$ |
| **Benchmark 3** | FCDI | $10,000 \text{ mg/L}$ | $85\%$ | $90\%$ | Rommerskirchen et al. (2018), *J. Membr. Sci.* | $V=1.8\text{V}$, $SEC=0.80 - 1.40\text{ kWh/m}^3$ |
| **Benchmark 4** | EDI | $15 \text{ mg/L}$ | $99.5\%$ | $95\%$ | Wood et al. (2010); DuPont EDI Spec | $V=15.0\text{V}$, $SEC=0.20 - 0.50\text{ kWh/m}^3$ |

---

## 3. AUTOMATED TEST EXECUTION COMMANDS

All validation tests are executed using Vite/Vitest:

```bash
# Run all engineering validation tests
npm test -- client/src/engineering/

# Run specific cross-panel & technology separation tests
npx vitest client/src/engineering/technologySelection.test.js
npx vitest client/src/engineering/engineeringSanityChecks.test.js
npx vitest client/src/engineering/perTechnologyCalibration.test.js
```

---
*End of Validation Requirements Specification.*
