/**
 * Shared Engineering Core - Single Authoritative Source of Truth
 */

// Equations & Engine
export { DEFAULT_EQUATIONS_DATABASE } from "./equations/defaultEquationsDatabase.js";
export { EQUATION_CATALOG } from "./equations/equationCatalog.js";
export { default as calculateEngineering } from "./engine/engineeringEquationEngine.js";
export { default as EquationEngine } from "./engine/equationEngine.js";
export { evaluateFormula, validateFormula, parseFormula } from "./engine/formulaParser.js";

// Models
export { default as calculateCDIModel, CDI_ENVELOPE, calculateCDIChargeEfficiency } from "./models/cdiModel.js";
export { default as calculateMCDIModel, MCDI_ENVELOPE } from "./models/mCDIModel.js";
export { default as calculateFCDIModel, FCDI_ENVELOPE } from "./models/fCDIModel.js";
export { default as calculateEDIModel, EDI_ENVELOPE } from "./models/ediModel.js";
export { default as calculateProcessTrain, PROCESS_TRAIN_SPECS } from "./models/processTrainEngine.js";

// Chemistry & Speciation
export { analyzeWaterChemistry, estimateConductivity, calculateLSI } from "./chemistry/waterChemistryEngine.js";

// Sizing & Optimization
export { default as electrodeModel } from "./sizing/electrodeModel.js";
export { default as componentSizing } from "./sizing/componentSizing.js";
export { default as stackDesigner } from "./sizing/stackDesigner.js";
export { default as designOptimizer } from "./sizing/designOptimizer.js";

// Core Truth & Diagnostics
export { getCentralEngineeringResult } from "./core/singleSourceOfTruth.js";
export { ENGINEERING_TRUTH_TABLE } from "./core/engineeringTruthTable.js";
export { TECHNOLOGY_FUNDAMENTALS } from "./core/technologyFundamentals.js";
export { extractDesignBasisParameters } from "./core/designBasis.js";
export { auditEngineeringDesign } from "./core/engineeringAudit.js";
export { default as aiRecommendation } from "./core/aiRecommendation.js";
export { default as structureGenerator } from "./core/structureGenerator.js";
export { default as layoutGenerator } from "./core/layoutGenerator.js";
export { predictActualPerformance } from "./core/mlCorrectionEngine.js";

// Validation & Calibration
export { default as calibrateEquations } from "./validation/experimentalCalibration.js";
export { LITERATURE_BENCHMARKS, runExperimentalValidationSuite } from "./validation/experimentalValidation.js";
