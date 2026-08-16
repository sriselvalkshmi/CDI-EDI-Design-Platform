import { describe, it, expect } from "vitest";
import calculateEngineering from "../../frontend/src/engineering/engine/engineeringEquationEngine.js";
import { TECHNOLOGY_FUNDAMENTALS } from "../../frontend/src/engineering/core/technologyFundamentals.js";
import { analyzeWaterChemistry } from "../../frontend/src/engineering/chemistry/waterChemistryEngine.js";

/**
 * Phase 6A Automated Regression Test Suite:
 * Technology Topology & Process Schematic Synchronization Audit.
 */
describe("Technology Topology Audit Suite", () => {
    it("runs topology and fundamental schematic audit checks", () => {
        const cdiFund = TECHNOLOGY_FUNDAMENTALS.CDI;
        const cdiEng = calculateEngineering({ technology: "CDI", feedWater: { tds: 500, targetTds: 50, flowRate: 10 } });

        expect(cdiFund.membraneConfiguration).toContain("NONE");
        expect(cdiEng.totalMembraneAreaM2).toBe(0);
        expect(cdiFund.operationType).toContain("Cyclic");

        const mcdiFund = TECHNOLOGY_FUNDAMENTALS.MCDI;
        const mcdiEng = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50, flowRate: 10 } });

        expect(mcdiFund.membraneConfiguration).toContain("AEM adjacent to anode");
        expect(mcdiEng.totalMembraneAreaM2).toBeGreaterThan(0);
        expect(mcdiEng.energyRecoveryFactor).toBe(0.20);

        const fcdiFund = TECHNOLOGY_FUNDAMENTALS.FCDI;
        const fcdiEng = calculateEngineering({ technology: "FCDI", feedWater: { tds: 5000, targetTds: 500, flowRate: 10 } });

        expect(fcdiFund.operatingPrinciple).toContain("carbon-slurry electrode streams");
        expect(fcdiEng.slurryFlowLmin).toBeGreaterThan(0);

        const ediFund = TECHNOLOGY_FUNDAMENTALS.EDI;
        const ediEngRO = calculateEngineering({ technology: "EDI", feedWater: { tds: 15, hardness: 0.1, flowRate: 10 } });
        expect(ediFund.operatingPrinciple).toContain("mixed-bed ion-exchange resin");
        expect(ediEngRO.isFeedFeasible).toBe(true);
    });
});

export function runTechnologyTopologyAuditTests() {
    console.log("==================================================================");
    console.log("PHASE 6A: AUTOMATED TECHNOLOGY TOPOLOGY & SCHEMATIC AUDIT SUITE");
    console.log("==================================================================");

    let passCount = 0;
    let failCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✓ PASS: ${message}`);
            passCount++;
        } else {
            console.error(`  ✕ FAIL: ${message}`);
            failCount++;
        }
    }

    // 1. CDI Topology Verification
    console.log("\n[TEST 1] CDI Process Topology & Fundamentals Verification:");
    const cdiFund = TECHNOLOGY_FUNDAMENTALS.CDI;
    const cdiEng = calculateEngineering({ technology: "CDI", feedWater: { tds: 500, targetTds: 50, flowRate: 10 } });

    assert(cdiFund.membraneConfiguration.includes("NONE"), "CDI membrane configuration is explicitly NONE (0 membranes)");
    assert(cdiEng.totalMembraneAreaM2 === 0, `CDI total calculated membrane area is 0 m² (Actual: ${cdiEng.totalMembraneAreaM2})`);
    assert(cdiFund.operationType.includes("Cyclic"), "CDI operation type is explicitly Cyclic Batch");
    assert(cdiFund.electrodeConfiguration.includes("Fixed porous carbon"), "CDI uses fixed porous carbon electrodes");
    assert(cdiEng.technology === "CDI", "CDI calculation engine output matches technology key CDI");

    // 2. MCDI Topology Verification
    console.log("\n[TEST 2] MCDI Process Topology & Fundamentals Verification:");
    const mcdiFund = TECHNOLOGY_FUNDAMENTALS.MCDI;
    const mcdiEng = calculateEngineering({ technology: "MCDI", feedWater: { tds: 500, targetTds: 50, flowRate: 10 } });

    assert(mcdiFund.membraneConfiguration.includes("AEM adjacent to anode") && mcdiFund.membraneConfiguration.includes("CEM adjacent to cathode"), "MCDI membrane topology specifies AEM at Anode (+), CEM at Cathode (-)");
    assert(mcdiEng.totalMembraneAreaM2 > 0, `MCDI calculated membrane area is positive (${mcdiEng.totalMembraneAreaM2} m²)`);
    assert(mcdiEng.energyRecoveryFactor === 0.20, `MCDI reverse polarity desorption energy recovery factor is 20% (${mcdiEng.energyRecoveryFactor * 100}%)`);
    assert(mcdiFund.electrodeConfiguration.includes("Fixed porous carbon"), "MCDI uses fixed porous carbon electrodes");

    // 3. FCDI Topology Verification
    console.log("\n[TEST 3] FCDI Process Topology & Fundamentals Verification:");
    const fcdiFund = TECHNOLOGY_FUNDAMENTALS.FCDI;
    const fcdiEng = calculateEngineering({ technology: "FCDI", feedWater: { tds: 5000, targetTds: 500, flowRate: 10 } });

    assert(fcdiFund.operatingPrinciple.includes("carbon-slurry electrode streams"), "FCDI operating principle specifies pumpable carbon slurry electrodes");
    assert(fcdiFund.operationType.includes("Continuous"), "FCDI operation type is explicitly Continuous");
    assert(fcdiFund.feedWaterFlowDirection.includes("Central treated-water channel"), "FCDI feed water channel is central and physically separate from slurry loops");
    assert(fcdiEng.slurryFlowLmin > 0, `FCDI circulating slurry flow rate is positive (${fcdiEng.slurryFlowLmin} L/min)`);
    assert(fcdiEng.secSlurryPump > 0, `FCDI slurry pumping SEC is explicitly separated (${fcdiEng.secSlurryPump} kWh/m³)`);

    // 4. EDI Topology Verification
    console.log("\n[TEST 4] EDI Process Topology & Fundamentals Verification:");
    const ediFund = TECHNOLOGY_FUNDAMENTALS.EDI;
    const ediEngRO = calculateEngineering({ technology: "EDI", feedWater: { tds: 15, hardness: 0.1, flowRate: 10 } });
    const ediEngRaw = calculateEngineering({ technology: "EDI", feedWater: { tds: 500, hardness: 150, flowRate: 10 } });

    assert(ediFund.operatingPrinciple.includes("mixed-bed ion-exchange resin"), "EDI operating principle specifies mixed-bed ion-exchange resin beads");
    assert(ediFund.regenerationMechanism.includes("water splitting"), "EDI regeneration mechanism specifies continuous in-situ electrochemical water splitting");
    assert(ediEngRO.isFeedFeasible === true, "EDI RO permeate feed (15 mg/L TDS) is FEASIBLE");
    assert(ediEngRaw.isFeedFeasible === false, "EDI raw feed (500 mg/L TDS) is gated as INFEASIBLE");
    assert(ediEngRaw.gatingReason.includes("30"), "EDI raw feed gating reason explicitly states 30 mg/L limit");

    // 5. Dynamic Technology Switching & Model Synchronization
    console.log("\n[TEST 5] Dynamic Technology Switching Topology Synchronization:");
    const techs = ["CDI", "MCDI", "FCDI", "EDI"];
    techs.forEach(t => {
        const res = calculateEngineering({
            technology: t,
            feedWater: {
                tds: t === "EDI" ? 15 : 500,
                targetTds: t === "EDI" ? 0.05 : 50,
                flowRate: 10
            }
        });
        assert(res.technology === t, `Dynamic switch to ${t} updates calculation engine technology to ${res.technology}`);
        assert(res.fundamentals !== undefined && res.fundamentals.name.includes(t), `Dynamic switch to ${t} updates fundamental topology metadata (${res.fundamentals?.name})`);
    });

    // 6. 10 Literature Concept Dimensions Completeness Audit
    console.log("\n[TEST 6] 10 Literature Concept Dimensions Audit (Structure -> Flow -> Ion movement -> Polarity -> Desalination -> Regeneration -> Continuous/Cyclic -> Advantages -> Limitations -> Pretreatment):");
    ["CDI", "MCDI", "FCDI", "EDI"].forEach(t => {
        const f = TECHNOLOGY_FUNDAMENTALS[t];
        assert(Boolean(f.electrodeConfiguration), `${t} Dimension 1 (Structure): ${f.electrodeConfiguration.substring(0, 40)}...`);
        assert(Boolean(f.feedWaterFlowDirection), `${t} Dimension 2 (Flow): ${f.feedWaterFlowDirection.substring(0, 40)}...`);
        assert(Boolean(f.ionTransportDirection), `${t} Dimension 3 (Ion movement): ${f.ionTransportDirection.substring(0, 40)}...`);
        assert(Boolean(f.electricalPolarity), `${t} Dimension 4 (Polarity): ${f.electricalPolarity.substring(0, 40)}...`);
        assert(Boolean(f.desalinationMechanism), `${t} Dimension 5 (Desalination): ${f.desalinationMechanism.substring(0, 40)}...`);
        assert(Boolean(f.regenerationMechanism), `${t} Dimension 6 (Regeneration): ${f.regenerationMechanism.substring(0, 40)}...`);
        assert(Boolean(f.operationType), `${t} Dimension 7 (Continuous/Cyclic): ${f.operationType}`);
        assert(Array.isArray(f.advantages) && f.advantages.length > 0, `${t} Dimension 8 (Advantages): ${f.advantages.length} entries`);
        assert(Array.isArray(f.limitations) && f.limitations.length > 0, `${t} Dimension 9 (Limitations): ${f.limitations.length} entries`);
        assert(Boolean(f.pretreatmentRequirements), `${t} Dimension 10 (Pretreatment): ${f.pretreatmentRequirements.substring(0, 40)}...`);
    });

    console.log("\n==================================================================");
    console.log(`TOPOLOGY AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("==================================================================");

    if (failCount > 0) {
        throw new Error(`Phase 6A Technology Topology Audit Failed with ${failCount} assertion failures.`);
    }

    return { passCount, failCount };
}

// Auto-execute if run directly via Node.js
if (typeof process !== "undefined" && process.argv && process.argv[1] && process.argv[1].includes("technologyTopologyAudit.test.js")) {
    runTechnologyTopologyAuditTests();
}
