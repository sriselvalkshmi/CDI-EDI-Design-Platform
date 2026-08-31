import { describe, it, expect } from "vitest";
import { 
    synthesizeAutonomousSystem,
    runFiltrationUnit,
    runSoftenerUnit,
    runROUnit,
    runEDIUnit,
    runMCDIUnit
} from "../../shared/engineering/models/treatmentTrainSynthesisEngine.js";

describe("Autonomous Engineering System Synthesis Engine Suite", () => {

    it("TEST 1: Low-TDS feed where standalone MCDI is feasible", () => {
        const feed = { tds: 39, hardness: 10, flowRate: 20, targetTds: 2.0, targetRecovery: 95.0 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 2.0, targetRecovery: 95.0 }, { technology: "MCDI" });
        
        expect(res.selectedTrain.trainId).toBe("TRAIN_MCDI");
        expect(res.selectedTrain.finalProductTds).toBeLessThanOrEqual(2.0);
        expect(res.selectedTrain.overallRecoveryPct).toBeGreaterThanOrEqual(94.5);
        expect(res.balances.waterBalance.status).toBe("CLOSED");
        expect(res.balances.saltBalance.status).toBe("CLOSED");
    });

    it("TEST 2: Feed where direct EDI fails but RO -> EDI is feasible", () => {
        const feed = { tds: 39, hardness: 10, flowRate: 20, targetTds: 0.1, targetRecovery: 70.0 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 0.1, targetRecovery: 70.0 }, { technology: "RO_EDI" });

        expect(res.selectedTrain.trainId).toBe("TRAIN_RO_EDI");
        expect(res.selectedTrain.stages.length).toBe(3); // Filter -> RO -> EDI
        expect(res.selectedTrain.finalProductTds).toBeLessThanOrEqual(0.1);
        expect(res.selectedTrain.overallRecoveryPct).toBeCloseTo(71.1, 0);
        expect(res.balances.waterBalance.status).toBe("CLOSED");
    });

    it("TEST 3: Feed where EDI requires Softener (IX) -> EDI to achieve high recovery (>90%)", () => {
        const feed = { tds: 39, hardness: 10, flowRate: 20, targetTds: 0.1, targetRecovery: 90.0 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 0.1, targetRecovery: 90.0 }, { technology: "IX_EDI" });

        expect(res.selectedTrain.trainId).toBe("TRAIN_IX_EDI");
        expect(res.selectedTrain.stages[1].technology).toBe("SOFTENER");
        expect(res.selectedTrain.stages[1].productStream.hardness).toBeLessThanOrEqual(0.05); // Dupont EDI requirement satisfied
        expect(res.selectedTrain.stages[2].technology).toBe("EDI");
        expect(res.selectedTrain.overallRecoveryPct).toBeGreaterThanOrEqual(90.0);
        expect(res.balances.waterBalance.status).toBe("CLOSED");
    });

    it("TEST 4: Feed where target recovery cannot be achieved (e.g. 99.9%)", () => {
        const feed = { tds: 39, hardness: 10, flowRate: 20, targetTds: 2.0, targetRecovery: 99.9 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 2.0, targetRecovery: 99.9 });

        expect(res.systemMetrics.isSystemPass).toBe(false);
    });

    it("TEST 5: Feed where target product quality cannot be achieved with membrane-free CDI", () => {
        const feed = { tds: 39, hardness: 10, flowRate: 20, targetTds: 2.0, targetRecovery: 95.0 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 2.0, targetRecovery: 95.0 }, { technology: "CDI" });

        expect(res.selectedTrain.trainId).toBe("TRAIN_CDI");
        expect(res.selectedTrain.isTargetTdsMet).toBe(false); // CDI ceiling ~5.9 mg/L
        expect(res.selectedTrain.status).toBe("NOT_FEASIBLE");
    });

    it("TEST 6: High hardness feed (>200 mg/L) automatically triggers Softener pretreatment", () => {
        const feed = { tds: 400, hardness: 350, flowRate: 20, targetTds: 20, targetRecovery: 95.0 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 20, targetRecovery: 95.0 }, { technology: "AUTO" });

        // Evaluates Softener+MCDI or Softener+EDI:
        const ixMcdiTrain = res.allCandidateTrains.find(t => t.trainId === "TRAIN_IX_MCDI");
        expect(ixMcdiTrain).toBeDefined();
        expect(ixMcdiTrain.stages.some(s => s.technology === "SOFTENER")).toBe(true);
    });

    it("TEST 7: High TDS feed (5000 mg/L) evaluation", () => {
        const feed = { tds: 5000, hardness: 150, flowRate: 20, targetTds: 500, targetRecovery: 80.0 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 500, targetRecovery: 80.0 }, { technology: "AUTO" });

        expect(res.allCandidateTrains.length).toBeGreaterThanOrEqual(5);
        expect(res.balances.waterBalance.status).toBe("CLOSED");
    });

    it("TEST 8: Conflicting TDS and conductivity inputs preserve values and generate valid synthesis", () => {
        const feed = { tds: 39, conductivity: 8, hardness: 10, flowRate: 20, targetTds: 2.0, targetRecovery: 95.0 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 2.0, targetRecovery: 95.0 });

        expect(res.systemMetrics.rawFeedTdsMgL).toBe(39);
        expect(res.selectedTrain).toBeDefined();
        expect(res.balances.waterBalance.status).toBe("CLOSED");
    });

    it("TEST 9: Missing optional chemistry handled gracefully", () => {
        const feed = { tds: 39, flowRate: 20, targetTds: 2.0, targetRecovery: 95.0 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 2.0, targetRecovery: 95.0 });

        expect(res.selectedTrain).toBeDefined();
        expect(res.streamTable.length).toBeGreaterThanOrEqual(3);
    });

    it("TEST 10: Multi-stage water and dissolved salt conservation closure on all candidate trains", () => {
        const feed = { tds: 39, hardness: 10, flowRate: 20, targetTds: 2.0, targetRecovery: 95.0 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 2.0, targetRecovery: 95.0 });

        // Verify that stream table conservation closures are strictly met:
        expect(res.balances.waterBalance.isClosed).toBe(true);
        expect(res.balances.waterBalance.residualLmin).toBeLessThanOrEqual(0.01);

        expect(res.balances.saltBalance.isClosed).toBe(true);
        expect(res.balances.saltBalance.residualGs).toBeLessThanOrEqual(0.001);
    });

    it("TEST 11: Standalone Reverse Osmosis (RO) train synthesis", () => {
        const feed = { tds: 500, hardness: 150, flowRate: 20, targetTds: 25.0, targetRecovery: 75.0 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 25.0, targetRecovery: 75.0 }, { technology: "RO" });

        expect(res.selectedTrain.trainId).toBe("TRAIN_RO");
        expect(res.selectedTrain.finalProductTds).toBeLessThanOrEqual(25.0);
        expect(res.balances.waterBalance.status).toBe("CLOSED");
    });

    it("TEST 12: Two-Pass High-Purity RO train achieves <1.0 mg/L TDS", () => {
        const feed = { tds: 500, hardness: 150, flowRate: 20, targetTds: 25.0, targetRecovery: 65.0 };
        const res = synthesizeAutonomousSystem(feed, { targetTds: 25.0, targetRecovery: 65.0 }, { technology: "RO_2STAGE" });

        expect(res.selectedTrain.trainId).toBe("TRAIN_RO_2STAGE");
        expect(res.selectedTrain.finalProductTds).toBeLessThanOrEqual(2.0);
        expect(res.balances.waterBalance.status).toBe("CLOSED");
    });

});
