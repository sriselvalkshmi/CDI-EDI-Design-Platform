import { describe, it, expect } from "vitest";
import {
    SWEEP_PARAMETERS,
    generateScenarioValues,
    validateSweepConfig,
    formatSweepPoints,
    runScenarioAnalysis,
    optimizeScenarioTechnology
} from "../../shared/engineering/core/designExplorerEngine.js";

describe("Design Explorer — Scenario & Sensitivity Analysis Engine", () => {

    describe("1. Scenario Value Generation & Sweep Point Formatter", () => {
        it("generates 6 evenly spaced values from 500 to 1000 mg/L for Feed TDS sweep", () => {
            const values = generateScenarioValues({ from: 500, to: 1000, count: 6 });
            expect(values).toEqual([500, 600, 700, 800, 900, 1000]);
        });

        it("generates 5 evenly spaced values from 5 to 25 L/min for Feed Flow sweep", () => {
            const values = generateScenarioValues({ from: 5, to: 25, count: 5 });
            expect(values).toEqual([5, 10, 15, 20, 25]);
        });

        it("handles fractional step sizes appropriately (e.g. 1.0 to 1.6 V in 4 steps)", () => {
            const values = generateScenarioValues({ from: 1.0, to: 1.6, count: 4 });
            expect(values).toEqual([1, 1.2, 1.4, 1.6]);
        });

        it("formats sweep points with arrow notation (e.g. 500 → 600 → ... mg/L)", () => {
            const values = [500, 600, 700, 800, 900, 1000];
            const formatted = formatSweepPoints(values, "mg/L");
            expect(formatted.formatted).toBe("500 → 600 → 700 → 800 → 900 → 1000 mg/L");
            expect(formatted.isCondensed).toBe(false);
        });

        it("condenses sweep points cleanly when case count exceeds 6", () => {
            const values = [500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
            const formatted = formatSweepPoints(values, "mg/L");
            expect(formatted.formatted).toBe("500 → 550 → 600 → ... → 1000 mg/L");
            expect(formatted.isCondensed).toBe(true);
            expect(formatted.fullList.length).toBe(11);
        });

        it("clamps case count between 2 and 20", () => {
            const valuesLow = generateScenarioValues({ from: 100, to: 200, count: 1 });
            expect(valuesLow.length).toBe(2);
            expect(valuesLow).toEqual([100, 200]);

            const valuesHigh = generateScenarioValues({ from: 100, to: 200, count: 50 });
            expect(valuesHigh.length).toBe(20);
        });
    });

    describe("2. Configuration Validation & Engineering Boundary Checking", () => {
        it("accepts valid sweep configuration", () => {
            const valid = validateSweepConfig({ parameter: "Feed TDS", from: 500, to: 1000, count: 6 });
            expect(valid.isValid).toBe(true);
            expect(valid.errors.length).toBe(0);
        });

        it("rejects unsupported parameter names", () => {
            const invalid = validateSweepConfig({ parameter: "Arbitrary Constant", from: 1, to: 10, count: 5 });
            expect(invalid.isValid).toBe(false);
            expect(invalid.errors[0]).toContain("Unsupported sweep parameter");
        });

        it("rejects when 'From' is greater than or equal to 'To'", () => {
            const invalidEq = validateSweepConfig({ parameter: "Feed TDS", from: 1000, to: 1000, count: 6 });
            expect(invalidEq.isValid).toBe(false);
            expect(invalidEq.errors[0]).toContain("strictly less than");

            const invalidGt = validateSweepConfig({ parameter: "Feed TDS", from: 1200, to: 800, count: 6 });
            expect(invalidGt.isValid).toBe(false);
        });

        it("rejects negative or zero sweep bounds", () => {
            const invalidNeg = validateSweepConfig({ parameter: "Feed Flow", from: -5, to: 20, count: 5 });
            expect(invalidNeg.isValid).toBe(false);
            expect(invalidNeg.errors.some(e => e.includes("greater than zero"))).toBe(true);
        });

        it("rejects out-of-physical-envelope sweep values", () => {
            const invalidTds = validateSweepConfig({ parameter: "Feed TDS", from: 5, to: 50000, count: 6 });
            expect(invalidTds.isValid).toBe(false);
            expect(invalidTds.errors[0]).toContain("physical range");
        });

        it("rejects invalid case counts (< 2 or > 20)", () => {
            const invalidLow = validateSweepConfig({ parameter: "Feed Flow", from: 5, to: 20, count: 1 });
            expect(invalidLow.isValid).toBe(false);
            expect(invalidLow.errors[0]).toContain("between 2 and 20");

            const invalidHigh = validateSweepConfig({ parameter: "Feed Flow", from: 5, to: 20, count: 25 });
            expect(invalidHigh.isValid).toBe(false);
            expect(invalidHigh.errors[0]).toContain("between 2 and 20");
        });
    });

    describe("3. Authoritative AUTO Technology Selection & Scenario Optimization (Step 18 & 19)", () => {
        const baselineTdsSweep = {
            feedWater: {
                tds: 500,
                flowRate: 10,
                targetTds: 3,
                targetRecovery: 95.0
            },
            technology: "AUTO",
            optimizationInputs: {
                voltage: 1.4,
                cellPairs: 34,
                electrodeArea: 350
            }
        };

        const values = [500, 600, 700, 800, 900, 1000];
        const result = runScenarioAnalysis({ baseline: baselineTdsSweep, parameter: "Feed TDS", values });

        it("selects optimized MCDI configuration achieving target under AUTO mode (does NOT select EDI)", () => {
            expect(result.scenarios.length).toBe(6);
            result.scenarios.forEach((sc) => {
                // Active scenario optimization finds allowable modular MCDI configuration achieving target TDS <= 3 mg/L
                expect(sc.technology).toBe("MCDI");
                expect(sc.feasibility).toBe("FEASIBLE");
                expect(sc.operatingRange).toBe("RECOMMENDED");
                expect(sc.productTds).toBeLessThanOrEqual(3.05);
                expect(sc.recovery).toBeGreaterThanOrEqual(95.0);
            });
        });

        it("preserves strict mass balance and salt balance closure across all scenarios", () => {
            result.scenarios.forEach((sc) => {
                expect(sc.flowResidual).toBeLessThanOrEqual(0.005);
                expect(sc.saltResidual).toBeLessThanOrEqual(0.001);
                expect(sc.massBalanceStatus).toBe("CLOSED");
                expect(sc.saltBalanceStatus).toBe("CLOSED");
                expect(sc.balanceStatus).toBe("CLOSED");
            });
        });

        it("populates all 11 required scenario table fields and inspection payload", () => {
            result.scenarios.forEach((sc) => {
                // 11-column fields
                expect(sc.id).toBeDefined();
                expect(sc.paramFormatted).toBeDefined();
                expect(sc.technology).toBe("MCDI");
                expect(sc.outletTds).toBeGreaterThan(0);
                expect(sc.recovery).toBeGreaterThan(0);
                expect(sc.sec).toBeGreaterThan(0);
                expect(sc.pressureDrop).toBeGreaterThan(0);
                expect(sc.massBalanceStatus).toBe("CLOSED");
                expect(sc.saltBalanceStatus).toBe("CLOSED");
                expect(sc.operatingRange).toBe("RECOMMENDED");
                expect(sc.feasibility).toBe("FEASIBLE");

                // Inspection payload
                expect(sc.inputs).toBeDefined();
                expect(sc.outputs).toBeDefined();
                expect(sc.balances).toBeDefined();
                expect(sc.feasibilityDetail).toBeDefined();
                expect(sc.technologyDetail).toBeDefined();
                expect(sc.technologyDetail.selectedTechnology).toBe("MCDI");
                expect(sc.outputs.productFlow).toBeGreaterThan(0);
            });
        });

        it("optimizes allowable configurations across Feed TDS 50–1000 mg/L sweep (all feasible)", () => {
            const baselineSweep = {
                feedWater: {
                    tds: 50,
                    flowRate: 10,
                    targetTds: 5,
                    targetRecovery: 95.0
                },
                technology: "AUTO",
                optimizationInputs: {
                    voltage: 1.4,
                    cellPairs: 34,
                    electrodeArea: 350
                }
            };
            const sweepValues = [50, 240, 430, 620, 810, 1000];
            const sweepRes = runScenarioAnalysis({ baseline: baselineSweep, parameter: "Feed TDS", values: sweepValues });

            expect(sweepRes.scenarios.length).toBe(6);

            // S01 (50 mg/L): Feasible because operating configuration operates safely within envelope
            expect(sweepRes.scenarios[0].technology).toBe("MCDI");
            expect(sweepRes.scenarios[0].feasibility).toBe("FEASIBLE");
            expect(sweepRes.scenarios[0].outletTds).toBeLessThanOrEqual(5.0);

            // S02-S06 (240 to 1000 mg/L): Optimized modular MCDI stack achieves target inside recommended envelope
            const feasibleScenarios = sweepRes.scenarios.slice(1);
            feasibleScenarios.forEach((sc) => {
                expect(sc.technology).toBe("MCDI");
                expect(sc.feasibility).toBe("FEASIBLE");
                expect(sc.operatingRange).toBe("RECOMMENDED");
                expect(sc.outletTds).toBeLessThanOrEqual(5.05);
            });

            expect(sweepRes.summary.feasibleCount).toBe(6);
            expect(sweepRes.summary.warningCount).toBe(0);
            expect(sweepRes.summary.infeasibleCount).toBe(0);
        });

        it("discards failed scenarios from displayed results when authoritative evaluation returns no candidates", () => {
            const mockRecalculate = () => ({
                engineering: {
                    outletTDS: 10,
                    waterRecovery: 90,
                    secElectricalGross: 0.5,
                    secElectricalNet: 0.4,
                    pressureDrop: 500,
                    power: 100,
                    cellPairs: 34,
                    electrodeArea: 350,
                    voltageCell: 1.4,
                    currentDensity: 30,
                    current: 1.0,
                    flowRate: 10,
                    feedTds: 500
                },
                aiRecommendation: {
                    evaluations: [],
                    feasibleCandidates: [],
                    rankedCandidates: [],
                    selectedTechnology: null,
                    reason: "No candidate technology evaluated."
                },
                selectedTechnology: null
            });

            const noneResult = runScenarioAnalysis({
                baseline: baselineTdsSweep,
                parameter: "Feed TDS",
                values: [500, 600],
                recalculatePipeline: mockRecalculate
            });

            // Failed scenarios are automatically discarded from displayed results
            expect(noneResult.scenarios.length).toBe(0);
            expect(noneResult.allScenarios.length).toBe(2);
            noneResult.allScenarios.forEach((sc) => {
                expect(sc.technology).toBe("NONE");
                expect(sc.feasibility).toBe("NOT FEASIBLE");
                expect(sc.operatingRange).toBe("OUTSIDE LIMITS");
                expect(sc.feasibilityReason).toContain("No candidate technology evaluated");
            });
            expect(noneResult.summary.discardedCount).toBe(2);
        });

        it("identifies summary counters for feasible sweep", () => {
            expect(result.summary.totalScenarios).toBe(6);
            expect(result.summary.feasibleCount).toBe(6);
            expect(result.summary.warningCount).toBe(0);
            expect(result.summary.infeasibleCount).toBe(0);
            expect(result.summary.bestRegion.isFeasibleFound).toBe(true);
        });

        it("correctly identifies and discards infeasible scenarios when physical limits are exceeded", () => {
            const impossibleBaseline = {
                feedWater: {
                    tds: 15000,
                    flowRate: 10,
                    targetTds: 0.1,
                    targetRecovery: 99.5
                },
                technology: "AUTO",
                optimizationInputs: {
                    voltage: 1.4,
                    cellPairs: 34,
                    electrodeArea: 350
                }
            };
            const infeasRes = runScenarioAnalysis({ baseline: impossibleBaseline, parameter: "Feed TDS", values: [15000, 20000] });
            expect(infeasRes.scenarios.length).toBe(0); // Discarded from displayed results
            expect(infeasRes.allScenarios.length).toBe(2);
            infeasRes.allScenarios.forEach(sc => {
                expect(sc.feasibility).toBe("NOT FEASIBLE");
                expect(sc.operatingRange).toBe("OUTSIDE LIMITS");
            });
            expect(infeasRes.summary.infeasibleCount).toBe(2);
            expect(infeasRes.summary.discardedCount).toBe(2);
            expect(infeasRes.summary.feasibleCount).toBe(0);
        });

        it("generates an automated engineering insight reflecting SEC trend and balance closure", () => {
            expect(typeof result.engineeringInsight).toBe("string");
            expect(result.engineeringInsight).toContain("SEC increases");
        });
    });

    describe("4. Feasible AUTO Selection Case (Target TDS = 50 mg/L)", () => {
        const baselineFeasible = {
            feedWater: {
                tds: 500,
                flowRate: 10,
                targetTds: 50,
                targetRecovery: 95.0
            },
            technology: "AUTO",
            optimizationInputs: {
                voltage: 1.4,
                cellPairs: 34,
                electrodeArea: 350
            }
        };

        const values = [500, 600, 700, 800, 900, 1000];
        const result = runScenarioAnalysis({ baseline: baselineFeasible, parameter: "Feed TDS", values });

        it("selects MCDI as authoritative feasible technology", () => {
            expect(result.scenarios.length).toBe(6);
            result.scenarios.forEach((sc) => {
                expect(sc.technology).toBe("MCDI");
                expect(sc.feasibility).toBe("FEASIBLE");
                expect(sc.operatingRange).toBe("RECOMMENDED");
            });
        });

        it("identifies S01 as best feasible case with lowest SEC", () => {
            expect(result.summary.bestRegion.isFeasibleFound).toBe(true);
            expect(result.summary.bestRegion.bestScenarioId).toBe("S01");
            expect(result.summary.bestRegion.bestTechnology).toBe("MCDI");
            expect(result.summary.bestRegion.bestParamValue).toBe(500);
            expect(result.summary.bestRegion.bestSec).toBeCloseTo(0.33, 2);
        });

        it("generates deterministic insight showing SEC increasing with Feed TDS", () => {
            expect(result.engineeringInsight).toContain("SEC increases");
            expect(result.engineeringInsight).toContain("kWh/m³");
        });
    });

    describe("5. Multi-Parameter Sensitivity Coverage & Baseline Preservation", () => {
        const baseline = {
            feedWater: {
                tds: 500,
                flowRate: 10,
                targetTds: 50,
                targetRecovery: 95.0
            },
            technology: "MCDI",
            optimizationInputs: {
                voltage: 1.4,
                cellPairs: 34,
                electrodeArea: 350
            }
        };

        it("runs Feed Flow sensitivity sweep (5 to 25 L/min)", () => {
            const values = [5, 10, 15, 20, 25];
            const res = runScenarioAnalysis({ baseline, parameter: "Feed Flow", values });
            expect(res.scenarios.length).toBe(5);
            res.scenarios.forEach(sc => {
                expect(sc.balanceStatus).toBe("CLOSED");
                expect(sc.outputs.productFlow).toBeGreaterThan(0);
            });
        });

        it("runs Recovery sensitivity sweep (85% to 98%)", () => {
            const values = [85, 88, 91, 95, 98];
            const res = runScenarioAnalysis({ baseline, parameter: "Recovery", values });
            // Only RECOMMENDED configurations (<= 95.5% recovery) are displayed; 98% is extended range and omitted
            expect(res.scenarios.length).toBe(4);
            expect(res.allScenarios.length).toBe(5);
            res.scenarios.forEach(sc => {
                expect(sc.feasibility).toBe("FEASIBLE");
                expect(sc.operatingRange).toBe("RECOMMENDED");
                expect(sc.balanceStatus).toBe("CLOSED");
                expect(sc.recovery).toBeGreaterThan(0);
            });
        });

        it("runs Cell Voltage sweep (1.0 to 1.6 V)", () => {
            const values = [1.0, 1.2, 1.4, 1.6];
            const res = runScenarioAnalysis({ baseline, parameter: "Cell Voltage", values });
            // Only RECOMMENDED configurations (<= 1.55V) are displayed; 1.6V is extended range and omitted
            expect(res.scenarios.length).toBe(3);
            expect(res.allScenarios.length).toBe(4);
            res.scenarios.forEach(sc => {
                expect(sc.feasibility).toBe("FEASIBLE");
                expect(sc.operatingRange).toBe("RECOMMENDED");
                expect(sc.cellVoltage).toBeDefined();
                expect(sc.sec).toBeGreaterThan(0);
            });
        });

        it("runs Cell Pairs sweep (20 to 60 pairs)", () => {
            const values = [20, 30, 40, 50, 60];
            const res = runScenarioAnalysis({ baseline, parameter: "Cell Pairs", values });
            expect(res.scenarios.length).toBeGreaterThanOrEqual(4);
            expect(res.allScenarios.length).toBe(5);
            res.scenarios.forEach(sc => {
                expect(sc.cellPairs).toBeDefined();
                expect(sc.outletTds).toBeGreaterThan(0);
            });
        });

        it("runs Active Area sweep (200 to 500 cm²)", () => {
            const values = [200, 300, 400, 500];
            const res = runScenarioAnalysis({ baseline, parameter: "Active Area", values });
            expect(res.scenarios.length).toBe(4);
            res.scenarios.forEach(sc => {
                expect(sc.electrodeArea).toBeDefined();
                expect(sc.currentDensity).toBeGreaterThan(0);
            });
        });
    });

    describe("6. Regression Audits: Summary Counts, Best Case Priority, Parameter Independence & Validation", () => {
        const baseline = {
            feedWater: {
                tds: 50,
                flowRate: 10,
                targetTds: 5,
                targetRecovery: 95.0
            },
            technology: "AUTO",
            optimizationInputs: {
                voltage: 1.4,
                cellPairs: 34,
                electrodeArea: 350
            }
        };

        it("verifies scenario summary counts strictly match displayed FEASIBLE rows", () => {
            const values = [50, 240, 430, 620, 810, 1000];
            const res = runScenarioAnalysis({ baseline, parameter: "Feed TDS", values });
            
            const feasibleRows = res.scenarios.filter(s => s.feasibility === "FEASIBLE" && s.operatingRange === "RECOMMENDED").length;

            expect(res.summary.feasibleCount).toBe(feasibleRows);
            expect(res.summary.warningCount).toBe(0);
            expect(res.scenarios.length).toBe(res.summary.feasibleCount);
        });

        it("verifies Best Case and summary correctly handles extended-envelope baseline exclusion", () => {
            const warningBaseline = {
                ...baseline,
                optimizationInputs: {
                    ...baseline.optimizationInputs,
                    voltage: 1.6 // Extended operating voltage outside recommended envelope
                }
            };
            const values = [50, 60, 70, 80];
            const res = runScenarioAnalysis({ baseline: warningBaseline, parameter: "Feed TDS", values });

            // In strict mode, extended envelope configurations (> 1.55V) are omitted from displayed results
            expect(res.scenarios.length).toBe(0);
            expect(res.summary.feasibleCount).toBe(0);
            expect(res.summary.warningCount).toBe(0);
            expect(res.summary.bestRegion.isFeasibleFound).toBe(false);
            expect(res.summary.bestRegion.status).toBe("NOT FEASIBLE");
            expect(res.summary.bestRegion.title).toBe("NO FEASIBLE CASE IN TESTED RANGE");
        });

        it("verifies Best Case strictly identifies feasible scenario and range remains Tested Feasible Range", () => {
            const sweepValues = [50, 240, 430, 620, 810, 1000];
            const res = runScenarioAnalysis({ baseline, parameter: "Feed TDS", values: sweepValues });

            expect(res.summary.bestRegion.isFeasibleFound).toBe(true);
            expect(res.summary.bestRegion.status).toBe("FEASIBLE");
            expect(res.summary.bestRegion.rangeLabel).toBe("Tested Feasible Range");
            expect(res.summary.bestRegion.bestTechnology).toBe("MCDI");
        });

        it("verifies parameter sweep independence across all 6 parameters", () => {
            const paramsToTest = [
                { param: "Feed TDS", values: [50, 100, 200], key: "feedTds" },
                { param: "Feed Flow", values: [5, 10, 15], key: "feedFlow" },
                { param: "Recovery", values: [85, 90, 95], key: "targetRecovery" },
                { param: "Cell Voltage", values: [1.0, 1.2, 1.4], key: "cellVoltage" },
                { param: "Cell Pairs", values: [20, 30, 40], key: "cellPairs" },
                { param: "Active Area", values: [200, 300, 400], key: "activeArea" }
            ];

            paramsToTest.forEach(({ param, values, key }) => {
                const res = runScenarioAnalysis({ baseline, parameter: param, values });
                expect(res.scenarios.length).toBe(values.length);
                res.scenarios.forEach((sc, i) => {
                    expect(sc.inputs[key] ?? sc[key]).toBe(values[i]);
                    // Check other baseline variables remain unchanged
                    if (key !== "feedTds") expect(sc.inputs.feedTds).toBe(50);
                    if (key !== "feedFlow") expect(sc.inputs.feedFlow).toBe(10);
                    if (key !== "cellVoltage") expect(sc.inputs.cellVoltage).toBe(1.4);
                });
            });
        });

        it("validates invalid sweep configurations comprehensively", () => {
            // From >= To
            const v1 = validateSweepConfig({ parameter: "Feed TDS", from: 50, to: 3, count: 6 });
            expect(v1.isValid).toBe(false);
            expect(v1.errors[0]).toContain("strictly less than");

            // Negative values
            const v2 = validateSweepConfig({ parameter: "Feed TDS", from: -10, to: 500, count: 6 });
            expect(v2.isValid).toBe(false);

            // Zero value
            const v3 = validateSweepConfig({ parameter: "Feed TDS", from: 0, to: 500, count: 6 });
            expect(v3.isValid).toBe(false);

            // Non-numeric
            const v4 = validateSweepConfig({ parameter: "Feed TDS", from: "abc", to: 500, count: 6 });
            expect(v4.isValid).toBe(false);

            // Count < 2
            const v5 = validateSweepConfig({ parameter: "Feed TDS", from: 50, to: 500, count: 1 });
            expect(v5.isValid).toBe(false);
        });

        it("verifies sweep points exist for valid range (From 3, To 50) and are cleared for invalid range (From 50, To 3)", () => {
            // Valid Range: From 3, To 50, count = 6
            const validValidation = validateSweepConfig({ parameter: "Feed TDS", from: 3, to: 50, count: 6 });
            expect(validValidation.isValid).toBe(true);
            expect(validValidation.errors.length).toBe(0);

            const validValues = generateScenarioValues({ from: 3, to: 50, count: 6 });
            expect(validValues).toEqual([3, 12.4, 21.8, 31.2, 40.6, 50]);
            
            const validDisplay = formatSweepPoints(validValues, "mg/L");
            expect(validDisplay.formatted).toBe("3 → 12.4 → 21.8 → 31.2 → 40.6 → 50 mg/L");

            const validResult = runScenarioAnalysis({ baseline, parameter: "Feed TDS", values: validValues });
            expect(validResult.scenarios.length).toBe(6);

            // Invalid Range: From 50, To 3, count = 6
            const invalidValidation = validateSweepConfig({ parameter: "Feed TDS", from: 50, to: 3, count: 6 });
            expect(invalidValidation.isValid).toBe(false);
            expect(invalidValidation.errors[0]).toContain("'From' value (50) must be strictly less than 'To' value (3)");

            // Sweep points MUST be cleared (empty array)
            const invalidValues = generateScenarioValues({ from: 50, to: 3, count: 6 });
            expect(invalidValues).toEqual([]);

            // Formatted sweep points display MUST be "—"
            const invalidDisplay = formatSweepPoints(invalidValues, "mg/L");
            expect(invalidDisplay.formatted).toBe("—");

            // Zero scenario calculation occurs
            const invalidResult = runScenarioAnalysis({ baseline, parameter: "Feed TDS", values: invalidValues });
            expect(invalidResult.scenarios.length).toBe(0);
        });
    });

    describe("6. Baseline Product TDS Synchronization & Warning Propagation Regression Tests", () => {
        it("reproduces baseline Product TDS (2.6 mg/L), recovery (95.2%), and SEC (0.044 kWh/m³) exactly for S01", () => {
            const baseline55 = {
                feedWater: {
                    tds: 55,
                    flowRate: 10,
                    targetTds: 3.0,
                    targetRecovery: 95.2
                },
                technology: "AUTO",
                optimizationInputs: {
                    voltage: 1.4,
                    cellPairs: 34,
                    electrodeArea: 350,
                    current: 0.53
                },
                engineering: {
                    technology: "MCDI",
                    outletTDS: 2.6,
                    waterRecovery: 95.2,
                    secElectricalGross: 0.0441,
                    current: 0.53,
                    power: 25.2,
                    pressureDrop: 406
                }
            };

            const sweepValues = [55, 244, 433, 622, 811, 1000];
            const result = runScenarioAnalysis({ baseline: baseline55, parameter: "Feed TDS", values: sweepValues });

            expect(result.scenarios.length).toBe(6);
            const s01 = result.scenarios[0];

            expect(s01.id).toBe("S01");
            expect(s01.feedTds).toBe(55);
            expect(s01.productTds).toBe(2.6);
            expect(s01.recovery).toBe(95.2);
            expect(s01.sec).toBe(0.044);
            expect(s01.technology).toBe("MCDI");
            expect(s01.feasibility).toBe("FEASIBLE");

            // Scenarios S02-S06 are optimized across modular stack configurations and are FEASIBLE
            result.scenarios.slice(1).forEach((sc) => {
                expect(sc.technology).toBe("MCDI");
                expect(sc.feasibility).toBe("FEASIBLE");
                expect(sc.productTds).toBeLessThanOrEqual(3.05);
                expect(sc.recovery).toBeGreaterThanOrEqual(95.0);
                expect(sc.pressureDrop).toBe(406); // constant ΔP locked across Feed TDS sweep
            });

            // Summary counters
            expect(result.summary.feasibleCount).toBe(6);
            expect(result.summary.warningCount).toBe(0);
            expect(result.summary.infeasibleCount).toBe(0);

            // Best region wording
            expect(result.summary.bestRegion.isFeasibleFound).toBe(true);
            expect(result.summary.bestRegion.status).toBe("FEASIBLE");
            expect(result.summary.bestRegion.rangeLabel).toBe("Tested Feasible Range");
        });

        it("reproduces 2.6 mg/L Product TDS from first principles when recalculating with base current", () => {
            const baseline55NoDirectEng = {
                feedWater: {
                    tds: 55,
                    flowRate: 10,
                    targetTds: 3.0,
                    targetRecovery: 95.2
                },
                technology: "MCDI",
                optimizationInputs: {
                    voltage: 1.4,
                    cellPairs: 34,
                    electrodeArea: 350,
                    current: 0.53
                }
            };

            const sweepValues = [55, 100, 200];
            const result = runScenarioAnalysis({ baseline: baseline55NoDirectEng, parameter: "Feed TDS", values: sweepValues });
            const s01 = result.scenarios[0];

            expect(s01.feedTds).toBe(55);
            expect(s01.productTds).toBe(2.6);
            expect(s01.recovery).toBe(95.2);
            expect(s01.sec).toBe(0.044);
            expect(s01.feasibility).toBe("FEASIBLE");
        });
    });

    describe("7. Multi-Technology Scenario Discovery & Strict Feasibility Verification Suite", () => {
        const testFeedWater = {
            tds: 50,
            flowRate: 10,
            targetTds: 3.0,
            targetRecovery: 95.0
        };

        it("evaluates all 4 registered technologies (CDI, MCDI, FCDI, EDI) for every scenario point without skipping", () => {
            const optResult = optimizeScenarioTechnology({
                scFeed: testFeedWater,
                scOptInputs: { voltage: 1.4 },
                parameter: "Feed TDS",
                baseTech: "AUTO"
            });

            expect(optResult).toBeDefined();
            expect(optResult.evaluatedTechnologies).toBeDefined();
            expect(optResult.evaluatedTechnologies.length).toBe(4);

            const evaluatedTechKeys = optResult.evaluatedTechnologies.map(t => t.tech);
            expect(evaluatedTechKeys).toContain("CDI");
            expect(evaluatedTechKeys).toContain("MCDI");
            expect(evaluatedTechKeys).toContain("FCDI");
            expect(evaluatedTechKeys).toContain("EDI");

            // Verify each evaluated technology has full audit fields
            optResult.evaluatedTechnologies.forEach(ev => {
                expect(ev.name).toBeDefined();
                expect(ev.status).toBeDefined();
                expect(ev.reason).toBeDefined();
                expect(typeof ev.isFeasible).toBe("boolean");
            });
        });

        it("discovers both MCDI and FCDI as feasible at 50 mg/L, selecting MCDI as BEST without baseline technology bias", () => {
            const optResult = optimizeScenarioTechnology({
                scFeed: { tds: 50, flowRate: 10, targetTds: 3.0, targetRecovery: 95.0 },
                scOptInputs: { voltage: 1.4 },
                parameter: "Feed TDS",
                baseTech: "AUTO"
            });

            // Discovers both MCDI and FCDI
            expect(optResult.feasibleTechnologies).toContain("MCDI");
            expect(optResult.feasibleTechnologies).toContain("FCDI");

            // MCDI selected as BEST because of lower electrical SEC (0.040 vs 0.049 kWh/m³)
            expect(optResult.tech).toBe("MCDI");
            expect(optResult.isFeasible).toBe(true);
            expect(optResult.isInRecommended).toBe(true);

            // Even if baseTech was set to FCDI, MCDI should still be chosen if it ranks higher by SEC/margin
            const optResultWithBaseFcdi = optimizeScenarioTechnology({
                scFeed: { tds: 50, flowRate: 10, targetTds: 3.0, targetRecovery: 95.0 },
                scOptInputs: { voltage: 1.4 },
                parameter: "Feed TDS",
                baseTech: "FCDI" // Baseline bias stress test
            });
            expect(optResultWithBaseFcdi.tech).toBe("MCDI");
        });

        it("verifies CDI, MCDI, FCDI, and EDI are genuinely evaluated for S02-S06 and MCDI is selected only after comparing actual feasible candidates", () => {
            const baseline = {
                feedWater: { tds: 50, flowRate: 10, targetTds: 3.0, targetRecovery: 95.0 },
                technology: "AUTO",
                optimizationInputs: { voltage: 1.4, cellPairs: 34, electrodeArea: 350 }
            };
            const sweepValues = [50, 240, 430, 620, 810, 1000];
            const result = runScenarioAnalysis({ baseline, parameter: "Feed TDS", values: sweepValues });

            expect(result.scenarios.length).toBe(6);

            // S01 has both MCDI and FCDI feasible
            expect(result.scenarios[0].feasibleTechnologies).toContain("MCDI");
            expect(result.scenarios[0].feasibleTechnologies).toContain("FCDI");

            // S02-S06 have all 4 technologies audited, but only MCDI meets single-stage target <= 3.0 mg/L at 95% recovery
            result.scenarios.slice(1).forEach((sc) => {
                expect(sc.allEvaluatedTechs.length).toBe(4);
                const cdiAudit = sc.allEvaluatedTechs.find(t => t.tech === "CDI");
                const fcdiAudit = sc.allEvaluatedTechs.find(t => t.tech === "FCDI");
                const ediAudit = sc.allEvaluatedTechs.find(t => t.tech === "EDI");
                const mcdiAudit = sc.allEvaluatedTechs.find(t => t.tech === "MCDI");

                // CDI fails co-ion expulsion limit (<= 70% removal)
                expect(cdiAudit.isFeasible).toBe(false);
                expect(cdiAudit.reason).toContain("co-ion expulsion");

                // FCDI fails single-stage removal benchmark (95% removal leaves > 3.0 mg/L)
                expect(fcdiAudit.isFeasible).toBe(false);

                // EDI fails raw feed limit (> 30 mg/L requires pretreatment)
                expect(ediAudit.isFeasible).toBe(false);
                expect(ediAudit.reason).toContain("Pretreatment required");

                // MCDI passes
                expect(mcdiAudit.isFeasible).toBe(true);
                expect(sc.technology).toBe("MCDI");
                expect(sc.feasibility).toBe("FEASIBLE");
                expect(sc.operatingRange).toBe("RECOMMENDED");
            });
        });

        it("verifies S05 detail (Feed TDS = 810 mg/L) comes from authoritative pipeline with 68 cell pairs, Product TDS 2.9 mg/L, Recovery 95%, SEC 0.593 kWh/m³", () => {
            const baseline = {
                feedWater: { tds: 50, flowRate: 10, targetTds: 3.0, targetRecovery: 95.0 },
                technology: "AUTO",
                optimizationInputs: { voltage: 1.4, cellPairs: 34, electrodeArea: 350 }
            };
            const sweepValues = [50, 240, 430, 620, 810, 1000];
            const result = runScenarioAnalysis({ baseline, parameter: "Feed TDS", values: sweepValues });

            const s05 = result.scenarios[4]; // index 4 = 810 mg/L
            expect(s05.feedTds).toBe(810);
            expect(s05.cellPairs).toBe(68);
            expect(s05.inputs.cellPairs).toBe(68);
            expect(s05.inputs.modules).toBe(2);
            expect(s05.productTds).toBe(2.9);
            expect(s05.recovery).toBe(95);
            expect(s05.sec).toBe(0.593);
            expect(s05.massBalanceStatus).toBe("CLOSED");
            expect(s05.saltBalanceStatus).toBe("CLOSED");
        });

        it("strictly excludes FEASIBLE WITH WARNING and NOT FEASIBLE scenarios from displayed results", () => {
            const baseline = {
                feedWater: { tds: 50, flowRate: 10, targetTds: 3.0, targetRecovery: 95.0 },
                technology: "AUTO",
                optimizationInputs: { voltage: 1.4, cellPairs: 34, electrodeArea: 350 }
            };
            const result = runScenarioAnalysis({ baseline, parameter: "Feed TDS", values: [50, 240, 430] });

            // All displayed scenarios must have RECOMMENDED operating range and FEASIBLE status
            result.scenarios.forEach(sc => {
                expect(sc.feasibility).toBe("FEASIBLE");
                expect(sc.operatingRange).toBe("RECOMMENDED");
                expect(sc.feasibility).not.toBe("FEASIBLE WITH WARNING");
                expect(sc.feasibility).not.toBe("NOT FEASIBLE");
            });

            // Summary warningCount must be 0
            expect(result.summary.warningCount).toBe(0);
        });

        it("omits all scenarios when no configuration is feasible without manufacturing fake data", () => {
            const impossibleBaseline = {
                feedWater: { tds: 5000, flowRate: 10, targetTds: 0.001, targetRecovery: 99.9 }, // Impossible target
                technology: "AUTO",
                optimizationInputs: { voltage: 1.4, cellPairs: 34, electrodeArea: 350 }
            };
            const result = runScenarioAnalysis({ baseline: impossibleBaseline, parameter: "Feed TDS", values: [5000, 6000, 7000] });

            expect(result.scenarios.length).toBe(0);
            expect(result.summary.feasibleCount).toBe(0);
            expect(result.summary.bestRegion.status).toBe("NOT FEASIBLE");
            expect(result.summary.bestRegion.bestCaseFormatted).toBe("—");
        });

        it("verifies all 17 configuration parameters are present in scenario payload including modules", () => {
            const baseline = {
                feedWater: { tds: 50, flowRate: 10, targetTds: 3.0, targetRecovery: 95.0 },
                technology: "AUTO",
                optimizationInputs: { voltage: 1.4, cellPairs: 34, electrodeArea: 350 }
            };
            const result = runScenarioAnalysis({ baseline, parameter: "Feed TDS", values: [50] });
            const sc = result.scenarios[0];

            // 17 required parameters
            expect(sc.inputs.feedTds).toBeDefined();
            expect(sc.inputs.feedFlow).toBeDefined();
            expect(sc.inputs.recovery).toBeDefined();
            expect(sc.inputs.cellVoltage).toBeDefined();
            expect(sc.inputs.cellPairs).toBeDefined();
            expect(sc.inputs.activeArea).toBeDefined();
            expect(sc.inputs.modules).toBeDefined();
            expect(sc.outputs.productTds).toBeDefined();
            expect(sc.outputs.productFlow).toBeDefined();
            expect(sc.outputs.rejectFlow).toBeDefined();
            expect(sc.outputs.sec).toBeDefined();
            expect(sc.outputs.stackPower).toBeDefined();
            expect(sc.outputs.pressureDrop).toBeDefined();
            expect(sc.balances.flowResidual).toBeDefined();
            expect(sc.balances.saltResidual).toBeDefined();
            expect(sc.technology).toBeDefined();
            expect(sc.feasibility).toBe("FEASIBLE");
        });

        it("verifies full S01-S06 multi-technology sweep displays all 6 scenarios with complete 4-technology audit and closed balances", () => {
            const baseline = {
                feedWater: { tds: 50, flowRate: 10, targetTds: 3.0, targetRecovery: 95.0, hardness: 15, conductivity: 77 },
                technology: "AUTO",
                optimizationInputs: { voltage: 1.4, cellPairs: 34, electrodeArea: 350, current: 0.48 },
                engineering: { outletTds: 2.6, waterRecoveryPct: 95.2, secElectricalGross: 0.040, pressureDrop: 406 }
            };
            const values = [50, 240, 430, 620, 810, 1000];
            const result = runScenarioAnalysis({ baseline, parameter: "Feed TDS", values });

            // All 6 candidate scenarios are feasible and displayed
            expect(result.summary.totalCandidateCases).toBe(6);
            expect(result.summary.feasibleCount).toBe(6);
            expect(result.scenarios.length).toBe(6);

            // S01: Both MCDI and FCDI feasible, MCDI selected as BEST
            const s01 = result.scenarios[0];
            expect(s01.scenarioId).toBe("S01");
            expect(s01.feedTds).toBe(50);
            expect(s01.technology).toBe("MCDI");
            expect(s01.feasibleTechnologies).toContain("MCDI");
            expect(s01.feasibleTechnologies).toContain("FCDI");
            expect(s01.feasibleTechSummary).toBe("MCDI, FCDI");
            expect(s01.outletTds).toBeCloseTo(2.6, 1);
            expect(s01.massBalanceStatus).toBe("CLOSED");
            expect(s01.saltBalanceStatus).toBe("CLOSED");

            // S02-S06: Genuine evaluation of all 4 technologies, MCDI is sole feasible candidate
            const expectedTds = [240, 430, 620, 810, 1000];
            for (let i = 1; i < 6; i++) {
                const sc = result.scenarios[i];
                expect(sc.feedTds).toBe(expectedTds[i - 1]);
                expect(sc.feasibility).toBe("FEASIBLE");
                expect(sc.operatingRange).toBe("RECOMMENDED");
                expect(sc.technology).toBe("MCDI");
                expect(sc.feasibleTechnologies).toEqual(["MCDI"]);
                expect(sc.outletTds).toBeLessThanOrEqual(3.05);
                expect(sc.recovery).toBeGreaterThanOrEqual(94.9);
                expect(sc.massBalanceStatus).toBe("CLOSED");
                expect(sc.saltBalanceStatus).toBe("CLOSED");
                expect(sc.allEvaluatedTechs.length).toBe(4);

                // Verify the 4-technology audit reasons
                const cdi = sc.allEvaluatedTechs.find(t => t.tech === "CDI");
                const fcdi = sc.allEvaluatedTechs.find(t => t.tech === "FCDI");
                const edi = sc.allEvaluatedTechs.find(t => t.tech === "EDI");
                const mcdi = sc.allEvaluatedTechs.find(t => t.tech === "MCDI");

                expect(mcdi.isFeasible).toBe(true);
                expect(cdi.isFeasible).toBe(false);
                expect(cdi.reason).toContain("co-ion expulsion");
                expect(fcdi.isFeasible).toBe(false);
                expect(fcdi.reason).toContain("Single-stage removal benchmark");
                expect(edi.isFeasible).toBe(false);
                expect(edi.reason).toContain("DuPont EDI-310");
            }

            // S05 & S06 use 2 modules (68 cell pairs) to stay within recommended current density
            const s05 = result.scenarios[4];
            expect(s05.cellPairs).toBe(68);
            expect(s05.inputs.modules).toBe(2);
            expect(s05.outletTds).toBe(2.9);

            const s06 = result.scenarios[5];
            expect(s06.cellPairs).toBe(68);
            expect(s06.inputs.modules).toBe(2);
            expect(s06.outletTds).toBe(1.9);
        });
    });
});
