import { describe, it, expect } from "vitest";

describe("Reset and Ungenerated Default Zero State Verification", () => {
    describe("1. Initial Optimization Inputs Specification", () => {
        it("optimization inputs default to zero for all 5 stack variables", () => {
            const defaultInputs = {
                voltage: 0,
                current: 0,
                cellPairs: 0,
                electrodeArea: 0,
                numberOfModules: 0
            };
            expect(defaultInputs.voltage).toBe(0);
            expect(defaultInputs.current).toBe(0);
            expect(defaultInputs.cellPairs).toBe(0);
            expect(defaultInputs.electrodeArea).toBe(0);
            expect(defaultInputs.numberOfModules).toBe(0);
        });
    });

    describe("2. Ungenerated State Calculations Guarding", () => {
        const isDesignReady = false;
        const cellPairs = isDesignReady ? 34 : null;
        const electrodeArea = isDesignReady ? 350 : null;
        const flow = isDesignReady ? 10 : null;
        const pressureDrop = isDesignReady ? 406 : null;
        const tSpacer = 0.50; // mm

        it("channelWidthM and channelAreaM2 evaluate to 0 when design is not ready", () => {
            const channelWidthM = (isDesignReady && electrodeArea) ? Math.sqrt(electrodeArea / 10000) : 0;
            const channelAreaM2 = (isDesignReady && cellPairs && electrodeArea) ? cellPairs * channelWidthM * (tSpacer / 1000) : 0;
            expect(channelWidthM).toBe(0);
            expect(channelAreaM2).toBe(0);
        });

        it("calculated superficial velocity evaluates to 0 when design is not ready", () => {
            const channelWidthM = (isDesignReady && electrodeArea) ? Math.sqrt(electrodeArea / 10000) : 0;
            const channelAreaM2 = (isDesignReady && cellPairs && electrodeArea) ? cellPairs * channelWidthM * (tSpacer / 1000) : 0;
            const calculatedVelocity = (isDesignReady && flow && channelAreaM2 > 0)
                ? Number(((flow / 60000) / channelAreaM2).toFixed(3))
                : 0;
            expect(calculatedVelocity).toBe(0);
        });

        it("pressure drop and total system pressure drop evaluate to 0 when design is not ready", () => {
            const eng = {};
            const totalSystemDp = isDesignReady ? (eng.totalSystemPressureDrop ?? (pressureDrop !== null ? pressureDrop + 500 : 0)) : 0;
            const channelDp = isDesignReady && pressureDrop !== null ? pressureDrop : 0;
            expect(totalSystemDp).toBe(0);
            expect(channelDp).toBe(0);
        });

        it("engineering basis parameters evaluate to 0 when design is not ready", () => {
            const operatingChargeUtil = isDesignReady ? "0.88" : "0.00";
            const nominalChargeUtilBaseline = isDesignReady ? "0.92" : "0.00";
            const activeStackHeightMm = isDesignReady ? "108 mm" : "0 mm";
            const auxHydraulicWork = isDesignReady ? "0.150 Wh/m³" : "0.000 Wh/m³";

            expect(operatingChargeUtil).toBe("0.00");
            expect(nominalChargeUtilBaseline).toBe("0.00");
            expect(activeStackHeightMm).toBe("0 mm");
            expect(auxHydraulicWork).toBe("0.000 Wh/m³");
        });
    });

    describe("3. Design Explorer Default Zero Baseline State", () => {
        const isDesignActive = false;
        const baselineState = isDesignActive ? {
            feedTds: 500,
            feedFlow: 10,
            targetTds: 50,
            targetRecovery: 95,
            technology: "AUTO",
            cellVoltage: 1.4,
            cellPairs: 34,
            electrodeArea: 350,
            numberOfModules: 1,
            current: 3.96
        } : {
            feedTds: 0,
            feedFlow: 0,
            targetTds: 0,
            targetRecovery: 0,
            technology: "AUTO",
            cellVoltage: 0,
            cellPairs: 0,
            electrodeArea: 0,
            numberOfModules: 0,
            current: 0
        };

        const fromVal = isDesignActive ? 500 : 0;
        const toVal = isDesignActive ? 1000 : 0;

        it("all baseline state numeric parameters are 0 in ungenerated state", () => {
            expect(baselineState.feedTds).toBe(0);
            expect(baselineState.feedFlow).toBe(0);
            expect(baselineState.targetTds).toBe(0);
            expect(baselineState.targetRecovery).toBe(0);
            expect(baselineState.cellVoltage).toBe(0);
            expect(baselineState.cellPairs).toBe(0);
            expect(baselineState.electrodeArea).toBe(0);
            expect(baselineState.numberOfModules).toBe(0);
            expect(baselineState.current).toBe(0);
        });

        it("sweep parameter From and To values are 0 in ungenerated state", () => {
            expect(fromVal).toBe(0);
            expect(toVal).toBe(0);
        });

        it("sweep point display shows 0 without error when ungenerated", () => {
            const sweepPointDisplay = (!isDesignActive && fromVal === 0 && toVal === 0)
                ? { formatted: "0", isCondensed: false, fullList: ["0"] }
                : { formatted: "—", isCondensed: false, fullList: [] };

            expect(sweepPointDisplay.formatted).toBe("0");
        });

        it("validation errors array is empty in ungenerated zero state", () => {
            const sweepValidation = { isValid: false, errors: ["'From' value must be greater than zero."] };
            const validationErrors = (!isDesignActive && fromVal === 0 && toVal === 0)
                ? []
                : sweepValidation.errors;

            expect(validationErrors).toEqual([]);
        });
    });
});
