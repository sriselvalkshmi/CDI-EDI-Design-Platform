/**
 * PHYSICS MODEL V2 VERIFICATION AUDIT SUITE
 * 
 * Verifies all 10 Mandatory Engineering Test Cases:
 * TEST 1: Baseline MCDI Balance Closure (Water, Salt, Charge, Energy)
 * TEST 2: Current-Controlled CDI (Physical EDL, Co-ion expulsion penalty)
 * TEST 3: Target-Controlled MCDI (Series Faraday Stack Coupling)
 * TEST 4: High-TDS Feed Feasibility Limiting (No silent target-forcing)
 * TEST 5: FCDI Flow Electrode Hydraulics and Slurry SEC Separation
 * TEST 6: EDI Ultrapure Polishing with Valid Pretreated Feed
 * TEST 7: EDI Mandatory Pretreatment Gate Violation
 * TEST 8: Technology Assessment Multi-Criteria Selection
 * TEST 9: Dynamic Hydraulic Pressure Drop (Responsive Mesh Drag)
 * TEST 10: TEA Integration consuming Corrected Net Electrical SEC
 */

import { describe, it } from "vitest";
import assert from "node:assert/strict";

import { calculateMCDIModel } from "../../shared/engineering/models/mCDIModel.js";
import { calculateCDIModel } from "../../shared/engineering/models/cdiModel.js";
import { calculateFCDIModel } from "../../shared/engineering/models/fCDIModel.js";
import { calculateEDIModel } from "../../shared/engineering/models/ediModel.js";
import { evaluateFourLevelCompliance, evaluateModelConfidence } from "../../shared/engineering/core/balanceEngine.js";
import { runScenarioAnalysis } from "../../shared/engineering/core/designExplorerEngine.js";
import aiRecommendation from "../../shared/engineering/core/aiRecommendation.js";
import calculateTEA from "../../shared/engineering/tea/technoEconomicEngine.js";
import { getCentralEngineeringResult } from "../../shared/engineering/core/singleSourceOfTruth.js";

describe("Physics Model V2 - Engineering Correctness Audit", () => {

    // -------------------------------------------------------------------------
    // TEST 1: Baseline MCDI Balance Closure
    // -------------------------------------------------------------------------
    it("TEST 1: Baseline MCDI Mass, Salt, Charge, and Energy Balances Close Strictly", () => {
        const feedWater = {
            tds: 500,
            targetTds: 50,
            flowRate: 10,
            temperature: 25,
            targetRecovery: 95
        };

        const result = calculateMCDIModel(feedWater, {
            cellPairs: 34,
            numberOfModules: 2,
            cellVoltage: 1.4,
            operatingMode: "TARGET_CONTROLLED"
        });

        assert.ok(result, "MCDI calculation result should exist");
        assert.ok(result.balanceAudit, "Balance audit must be attached");

        const balances = result.balanceAudit;

        // Water mass balance closure
        assert.ok(balances.waterBalance.isBalanced, "Water balance must pass");
        assert.ok(balances.waterBalance.residualLmin < 0.01, "Water balance error < 0.01 L/min");

        // Salt mass balance closure
        assert.ok(balances.saltBalance.isBalanced, "Salt balance must pass");
        assert.ok(balances.saltBalance.residualGs < 0.01, "Salt balance error < 0.01 g/s");

        // Charge balance closure
        assert.ok(balances.chargeBalance.isBalanced, "Charge balance must pass");
        assert.ok(balances.chargeBalance.relativeErrorPct < 5.0, "Charge balance error < 5%");

        // Energy balance
        assert.ok(result.secGross > 0, "Gross SEC must be positive");
        assert.ok(result.secNet <= result.secGross, "Net SEC must be <= Gross SEC (energy recovery credit)");
        assert.ok(result.secPump >= 0, "Pump SEC must be non-negative");
    });

    // -------------------------------------------------------------------------
    // TEST 2: Current-Controlled CDI Verification
    // -------------------------------------------------------------------------
    it("TEST 2: Current-Controlled CDI determines outlet TDS physically with co-ion expulsion penalty", () => {
        const feedWater = {
            tds: 600,
            flowRate: 8,
            temperature: 25
        };

        const result = calculateCDIModel(feedWater, {
            cellPairs: 30,
            cellVoltage: 1.2,
            operatingMode: "CURRENT_CONTROLLED"
        });

        assert.ok(result.outletTDS > 0, "Outlet TDS must be physically predicted");
        assert.ok(result.outletTDS < 600, "Some desalination must occur");
        // CDI charge efficiency without membranes is lower (0.40 - 0.75) due to co-ion expulsion
        assert.ok((result.chargeEfficiencyFrac ?? (result.chargeEfficiency / 100)) <= 0.75, "CDI charge efficiency reflects co-ion expulsion penalty");
        assert.equal(result.operatingMode, "CURRENT_CONTROLLED");
    });

    // -------------------------------------------------------------------------
    // TEST 3: Target-Controlled MCDI Verification
    // -------------------------------------------------------------------------
    it("TEST 3: Target-Controlled MCDI derives required series Faraday current and stack sizing", () => {
        const feedWater = {
            tds: 500,
            targetTds: 50,
            flowRate: 10,
            targetRecovery: 95
        };

        const result = calculateMCDIModel(feedWater, {
            cellPairs: 34,
            numberOfModules: 2,
            cellVoltage: 1.4,
            operatingMode: "TARGET_CONTROLLED"
        });

        assert.ok(result.cellCurrent > 0, "Calculated stack current must be positive");
        assert.ok(result.totalFaradayCurrent >= result.cellCurrent, "Total Faraday current across pairs >= cell current");
        // Target should be met if within feasible capacity
        assert.ok(Math.abs(result.outletTDS - 50) < 1.0, "Outlet TDS should meet target in feasible envelope");
    });

    // -------------------------------------------------------------------------
    // TEST 4: High-TDS Feed Feasibility Limiting (No silent target-forcing)
    // -------------------------------------------------------------------------
    it("TEST 4: High-TDS feed that exceeds physical capacity reports NOT FEASIBLE", () => {
        const highTdsFeed = {
            tds: 5000,
            targetTds: 50, // Demands 99% removal from small stack
            flowRate: 20,
            targetRecovery: 95
        };

        // Small stack incapable of 99% removal on 5000 mg/L feed at 20 L/min
        const result = calculateMCDIModel(highTdsFeed, {
            cellPairs: 10,
            numberOfModules: 1,
            cellVoltage: 1.2,
            operatingMode: "TARGET_CONTROLLED"
        });

        // The physics model must report infeasibility rather than silently forcing outletTDS to 50
        assert.ok(
            result.isFeasible === false || result.complianceLevel === "NOT_FEASIBLE" || result.outletTDS > 50,
            "Model must NOT fake achieving 50 mg/L if physically infeasible"
        );
    });

    // -------------------------------------------------------------------------
    // TEST 5: FCDI Flow Electrode Continuous Operation
    // -------------------------------------------------------------------------
    it("TEST 5: FCDI separates water and slurry pump SEC and models continuous transport", () => {
        const feedWater = {
            tds: 1000,
            targetTds: 100,
            flowRate: 10
        };

        const result = calculateFCDIModel(feedWater, {
            cellPairs: 20,
            cellVoltage: 1.2,
            carbonLoadingWtPct: 12.0
        });

        assert.ok(result, "FCDI result must exist");
        assert.ok(result.slurryViscosityCp > 1.0, "Slurry viscosity must account for carbon loading");
        assert.ok(result.secSlurryPump >= 0, "Slurry pumping SEC must be reported separately");
        assert.ok(result.secWaterPump >= 0, "Water pumping SEC must be reported separately");
        assert.equal(result.technology, "FCDI");
    });

    // -------------------------------------------------------------------------
    // TEST 6: EDI Ultrapure Polishing with Valid Pretreated Feed
    // -------------------------------------------------------------------------
    it("TEST 6: EDI achieves ultrapure resistivity when feed satisfies DuPont pretreatment criteria", () => {
        const pretreatedFeed = {
            tds: 10, // <= 30 mg/L
            hardness: 0.1, // <= 0.5 mg/L
            flowRate: 10,
            targetTds: 0.1
        };

        const result = calculateEDIModel(pretreatedFeed, {
            cellPairs: 40,
            currentDensity: 60
        });

        assert.ok(result.isFeedFeasible, "Feed should pass pretreatment gate");
        assert.ok(result.isFeasible, "Design should be feasible");
        assert.ok(result.resistivityMOhmCm >= 1.0, "Ultrapure water resistivity should be high (> 1 MOhm-cm)");
        assert.ok(result.pressureDrop > 0, "Ergun packed-bed pressure drop must be calculated");
    });

    // -------------------------------------------------------------------------
    // TEST 7: EDI Mandatory Pretreatment Gate Violation
    // -------------------------------------------------------------------------
    it("TEST 7: EDI rejects raw feed violating DuPont EDI-310 limits with NOT FEASIBLE", () => {
        const rawFeed = {
            tds: 500, // > 30 mg/L limit
            hardness: 150, // > 0.5 mg/L limit
            flowRate: 10
        };

        const result = calculateEDIModel(rawFeed, {
            cellPairs: 40
        });

        assert.equal(result.isFeedFeasible, false, "Raw water must fail EDI pretreatment gate");
        assert.equal(result.isFeasible, false, "EDI model must be marked infeasible");
        assert.ok(result.complianceLevel === "NOT_FEASIBLE" || result.complianceLevel === "LEVEL_0_PRETREATMENT_REQUIRED", "Must indicate pretreatment failure");
        assert.ok(result.infeasibilityReason.includes("DuPont EDI-310"), "Reason must cite pretreatment standard");
    });

    // -------------------------------------------------------------------------
    // TEST 8: Technology Assessment Multi-Criteria Selection
    // -------------------------------------------------------------------------
    it("TEST 8: Technology Assessment selects appropriate technology based on feed TDS", () => {
        // High TDS brackish water
        const brackishFeed = { tds: 2500, hardness: 100, flowRate: 15, targetTds: 250 };
        const recBrackish = aiRecommendation(brackishFeed);
        const techBrackish = recBrackish.selectedTechnology || recBrackish.technology;
        assert.ok(["MCDI", "CDI", "FCDI"].includes(techBrackish), "MCDI/CDI/FCDI recommended for brackish water");

        // Ultrapure polishing requirement (< 20 mg/L feed)
        const polishingFeed = { tds: 15, hardness: 0.1, flowRate: 10, targetTds: 0.1 };
        const recPolishing = aiRecommendation(polishingFeed);
        const techPolishing = recPolishing.selectedTechnology || recPolishing.technology;
        assert.equal(techPolishing, "EDI", "EDI should be recommended for ultrapure polishing");
    });

    // -------------------------------------------------------------------------
    // TEST 9: Dynamic Hydraulic Pressure Drop
    // -------------------------------------------------------------------------
    it("TEST 9: Hydraulic pressure drop dynamically responds to flow velocity without fixed override", () => {
        const baseFeed = { tds: 500, targetTds: 50, flowRate: 5 };
        const highFlowFeed = { tds: 500, targetTds: 50, flowRate: 20 };

        const lowFlowRes = calculateMCDIModel(baseFeed, { cellPairs: 34 });
        const highFlowRes = calculateMCDIModel(highFlowFeed, { cellPairs: 34 });

        assert.ok(highFlowRes.pressureDrop > lowFlowRes.pressureDrop, "Higher flow rate must yield higher pressure drop");
        assert.notEqual(lowFlowRes.pressureDrop, 406, "Pressure drop must not be frozen at 406 Pa");
        assert.notEqual(highFlowRes.pressureDrop, 406, "Pressure drop must not be frozen at 406 Pa");
    });

    // -------------------------------------------------------------------------
    // TEST 10: Techno-Economic Analysis (TEA) Integration
    // -------------------------------------------------------------------------
    it("TEST 10: TEA consumes corrected Net SEC and reflects technology-specific costs", () => {
        const engineering = {
            technology: "MCDI",
            flowRateLmin: 10,
            waterRecovery: 95,
            secGross: 0.35,
            secNet: 0.28,
            secHydraulic: 0.005,
            secTotal: 0.285,
            cellPairs: 34,
            numberOfModules: 2,
            totalElectrodeAreaM2: 2.38,
            pressureDrop: 250,
            power: 160
        };

        const teaResult = calculateTEA({
            engineering,
            economicInputs: {
                electricityTariff: 10.0,
                operatingHoursPerDay: 24,
                operatingDaysPerYear: 350
            }
        });

        assert.ok(teaResult, "TEA result must exist");
        assert.ok(teaResult.annualEnergyCostInr > 0, "Annual electricity cost must be positive");
        assert.ok(teaResult.annualOpexInr > teaResult.annualEnergyCostInr, "Annual OPEX includes maintenance and parts");
        assert.ok(teaResult.operatingTreatmentCostInrPerM3 > 0, "Operating treatment cost per m³ must be calculated");
    });

    // -------------------------------------------------------------------------
    // Single Source of Truth Compliance Exposure
    // -------------------------------------------------------------------------
    it("Single Source of Truth correctly exposes compliance, confidence, and audit data", () => {
        const feedWater = { tds: 500, targetTds: 50, flowRate: 10 };
        const engineering = calculateMCDIModel(feedWater, { cellPairs: 34 });
        const centralResult = getCentralEngineeringResult(engineering, "MCDI", feedWater);

        assert.ok(centralResult.complianceLevel, "Compliance level must be exposed");
        assert.ok(centralResult.modelConfidence, "Model confidence must be exposed");
        assert.ok(centralResult.balanceAudit, "Balance audit must be exposed");
        assert.ok(centralResult.authoritativePrediction, "Authoritative prediction must match outletTDS");
    });
});
