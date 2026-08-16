# CDI/MCDI/FCDI/EDI Engineering Platform Change Log

## Date: 2026-08-12
## Objective: Engineering Foundation Verification and Literature Alignment

### Initial State Audit Summary:
1. **CDI Model**: Verified fixed porous carbon electrode model without membranes. Clarified flow-by vs flow-through topology options, explicit current model envelope vs literature envelope.
2. **MCDI Model**: Identified electrical stack power calculation anomaly where stack voltage was multiplied by total Faraday current instead of stack current. Verified AEM@Anode, CEM@Cathode layer sequence, co-ion exclusion, 20% energy recovery factor provenance.
3. **FCDI Model**: Verified 3-stream architecture (central feed, positive carbon slurry loop, negative carbon slurry loop), continuous operation, external slurry regeneration. Separated current model envelope from literature capabilities.
4. **EDI Model**: Verified separation from CDI electrosorption models. Resin-mediated transport + electromigration + continuous in-situ electrochemical water splitting. Verified multi-variable feed quality gating.
5. **Water Chemistry Engine**: Fixed synthetic anion balancing for unsupplied anion components when Ca2+/Mg2+ are specified, updated LSI and Total Hardness scaling risk thresholds, enforced charge balance validation.
6. **Provenance & Language**: Replaced unverified "Validated" claims with precise provenance tags (`[FIRST_PRINCIPLES]`, `[LITERATURE_SUPPORTED]`, `[PROJECT_ASSUMPTION]`, `[EXPERIMENTALLY_CALIBRATED]`, `[EXTRAPOLATED]`, `[VENDOR_SPECIFICATION]`).
7. **3D CAD Module**: Retained 3D CAD parametric viewer with mandatory titles "PARAMETRIC ENGINEERING VISUALIZATION" and disclaimers ("CAD VISUALIZATION ONLY — NOT PHYSICAL VALIDATION").

---

### File Modification Inventory:
- `client/src/engineering/engineeringTruthTable.js`
- `client/src/engineering/waterChemistryEngine.js`
- `client/src/engineering/cdiModel.js`
- `client/src/engineering/mCDIModel.js`
- `client/src/engineering/fCDIModel.js`
- `client/src/engineering/ediModel.js`
- `client/src/engineering/engineeringEquationEngine.js`
- `client/src/engineering/aiRecommendation.js`
- `client/src/engineering/phase8IndependentEngineeringVerification.test.js`
- `client/src/components/engineering/CAD3DStackViewer.jsx`
- `client/src/components/engineering/TechnologyConceptCard.jsx`
- `client/src/components/engineering/TechComparisonModal.jsx`
- `client/src/components/engineering/ValidationPanel.jsx`
- `engineering_audit.md`
