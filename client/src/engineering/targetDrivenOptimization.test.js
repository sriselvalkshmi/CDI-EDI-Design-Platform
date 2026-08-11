import { describe, it, expect } from "vitest";
import calculateEngineering from "./engineeringEquationEngine.js";
import optimize from "./designOptimizer.js";

/**
 * Target-Driven Physics Sizing & Energy Optimization Test Suite
 * Asserts Target TDS operates as an active setpoint constraint:
 * 1. Target = 100 ppm -> Outlet TDS ≈ 100.0 ppm
 * 2. Target = 50 ppm -> Outlet TDS ≈ 50.0 ppm
 * 3. Target = 5 ppm -> Target Not Achievable for MCDI single-stage
 */
describe("Target-Driven Physics Sizing & Energy Optimization Test Suite", () => {
    const feed500 = { tds: 500, conductivity: 300, hardness: 150, ph: 7.2, flowRate: 10 };

    it("TEST 1: MCDI Target = 100 ppm Setpoint", () => {
        const mcdi100 = calculateEngineering({ technology: "MCDI", feedWater: { ...feed500, targetTds: 100 } });
        expect(mcdi100.outletTDS).toBeLessThanOrEqual(100.5);
        expect(mcdi100.outletTDS).toBeGreaterThanOrEqual(95.0);
        expect(mcdi100.isTargetAchieved).toBe(true);
    });

    it("TEST 2: MCDI Target = 50 ppm Setpoint", () => {
        const mcdi50 = calculateEngineering({ technology: "MCDI", feedWater: { ...feed500, targetTds: 50 } });
        expect(mcdi50.outletTDS).toBeLessThanOrEqual(50.5);
        expect(mcdi50.outletTDS).toBeGreaterThanOrEqual(45.0);
        expect(mcdi50.isTargetAchieved).toBe(true);
    });

    it("TEST 3: MCDI Target = 5 ppm Unachievable Boundary", () => {
        const mcdi5 = calculateEngineering({ technology: "MCDI", feedWater: { ...feed500, targetTds: 5 } });
        expect(mcdi5.isTargetAchieved).toBe(false);
    });

    it("TEST 4: Design Optimizer Setpoint Minimization", () => {
        const optRes = optimize({ ...feed500, targetTds: 50 }, {}, { technology: "MCDI" });
        expect(optRes.outletTDS).toBeLessThanOrEqual(50.5);
    });
});
