import { describe, it, expect } from "vitest";
import calculateEngineering from "../../shared/engineering/engine/engineeringEquationEngine.js";
import { auditEngineeringDesign } from "../../shared/engineering/core/engineeringAudit.js";

describe("First-Principles Equation & Mass-Balance Audit Test Suite (Task 26)", () => {
    const defaultFeed = {
        tds: 500,
        targetTds: 50,
        flowRate: 10,
        hardness: 150
    };

    it("verifies 99.9% salt mass balance consistency on MCDI design", () => {
        const eng = calculateEngineering({ technology: "MCDI", feedWater: defaultFeed });
        const audit = auditEngineeringDesign(eng, { tds: 500, targetTds: 50, flowRate: 10 });

        expect(audit.massBalanceValid).toBe(true);
        expect(audit.massBalanceErrorRel).toBeLessThan(0.001);
    });

    it("verifies electrical stack equations (V_stack = V_module * N_modules)", () => {
        const eng = calculateEngineering({ technology: "MCDI", feedWater: defaultFeed });
        const audit = auditEngineeringDesign(eng, { tds: 500, targetTds: 50, flowRate: 10 });

        expect(audit.voltageCalculationValid).toBe(true);
        expect(audit.powerCalculationValid).toBe(true);
    });

    it("verifies removal efficiency calculation consistency", () => {
        const eng = calculateEngineering({ technology: "MCDI", feedWater: defaultFeed });
        const audit = auditEngineeringDesign(eng, { tds: 500, targetTds: 50, flowRate: 10 });

        expect(audit.removalCalculationValid).toBe(true);
    });

    it("verifies SEC reconciliation derived from power and treated flow", () => {
        const eng = calculateEngineering({ technology: "MCDI", feedWater: defaultFeed });
        const audit = auditEngineeringDesign(eng, { tds: 500, targetTds: 50, flowRate: 10 });

        expect(audit.secCalculationValid).toBe(true);
    });

    it("verifies single-source pressure drop validity", () => {
        const eng = calculateEngineering({ technology: "MCDI", feedWater: defaultFeed });
        const audit = auditEngineeringDesign(eng, { tds: 500, targetTds: 50, flowRate: 10 });

        expect(audit.pressureDropValid).toBe(true);
    });

    it("flags TECHNOLOGY MISMATCH when expected technology differs from model technology", () => {
        const eng = calculateEngineering({ technology: "CDI", feedWater: defaultFeed });
        const audit = auditEngineeringDesign(eng, { expectedTechnology: "MCDI" });

        expect(audit.technologyConsistent).toBe(false);
        expect(audit.overallValid).toBe(false);
        expect(audit.errors.some(e => e.includes("TECHNOLOGY MISMATCH"))).toBe(true);
    });

    it("verifies engineeringAudit attached directly to calculateEngineering return object", () => {
        const eng = calculateEngineering({ technology: "FCDI", feedWater: { tds: 5000, targetTds: 500, flowRate: 12 } });
        expect(eng.engineeringAudit).toBeDefined();
        expect(eng.engineeringAudit.overallValid).toBe(true);
        expect(eng.engineeringAudit.statusLabel).toBe("✓ ENGINEERING CALCULATION VERIFIED");
        expect(eng.engineeringAudit.auditDetails).toBeDefined();
        expect(eng.engineeringAudit.auditDetails.massBalance.provenance).toBe("FIRST PRINCIPLES (Mass Conservation Law)");
        expect(eng.engineeringAudit.auditDetails.sec.provenance).toBe("EXPERIMENTALLY CALIBRATED");
    });

    // Corruption & Tolerance Detection Tests (Task 27)
    it("detects incorrect stack voltage", () => {
        const eng = calculateEngineering({ technology: "MCDI", feedWater: defaultFeed });
        const corrupted = { ...eng, voltageStack: eng.voltageStack + 20 };
        const audit = auditEngineeringDesign(corrupted, { tds: 500, targetTds: 50, flowRate: 10 });
        expect(audit.voltageCalculationValid).toBe(false);
        expect(audit.auditDetails.electrical.status).toBe("FAIL");
    });

    it("detects incorrect power", () => {
        const eng = calculateEngineering({ technology: "MCDI", feedWater: defaultFeed });
        const corrupted = { ...eng, power: eng.power + 500 };
        const audit = auditEngineeringDesign(corrupted, { tds: 500, targetTds: 50, flowRate: 10 });
        expect(audit.powerCalculationValid).toBe(false);
        expect(audit.auditDetails.electrical.status).toBe("FAIL");
    });

    it("detects incorrect removal percentage", () => {
        const eng = calculateEngineering({ technology: "MCDI", feedWater: defaultFeed });
        const corrupted = { ...eng, removalEfficiency: eng.removalEfficiency - 25 };
        const audit = auditEngineeringDesign(corrupted, { tds: 500, targetTds: 50, flowRate: 10 });
        expect(audit.removalCalculationValid).toBe(false);
        expect(audit.auditDetails.removal.status).toBe("FAIL");
    });

    it("detects incorrect SEC", () => {
        const eng = calculateEngineering({ technology: "MCDI", feedWater: defaultFeed });
        const corrupted = { ...eng, secElectrical: eng.secElectrical + 5.0 };
        const audit = auditEngineeringDesign(corrupted, { tds: 500, targetTds: 50, flowRate: 10 });
        expect(audit.secCalculationValid).toBe(false);
        expect(audit.auditDetails.sec.status).toBe("FAIL");
    });

    it("detects invalid pressure drop", () => {
        const eng = calculateEngineering({ technology: "MCDI", feedWater: defaultFeed });
        const corrupted = { ...eng, pressureDrop: -50 };
        const audit = auditEngineeringDesign(corrupted, { tds: 500, targetTds: 50, flowRate: 10 });
        expect(audit.pressureDropValid).toBe(false);
        expect(audit.auditDetails.pressureDrop.status).toBe("FAIL");
    });
});
