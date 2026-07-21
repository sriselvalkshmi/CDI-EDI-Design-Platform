export function toSI(value, unit) {
    const val = Number(value || 0);
    if (!unit) return val;

    switch (unit.toLowerCase().trim()) {
        case "l/min":
        case "lpm":
            return val * (0.001 / 60);
        case "m3/h":
        case "m³/h":
            return val / 3600;
        case "cm2":
        case "cm²":
            return val * 1e-4;
        case "mm":
            return val * 1e-3;
        case "kw":
            return val * 1000;
        case "kwh":
            return val * 3.6e6;
        default:
            return val;
    }
}

export function convertUnit(value, fromUnit, toUnit) {
    const siValue = toSI(value, fromUnit);
    if (!toUnit) return siValue;

    switch (toUnit.toLowerCase().trim()) {
        case "l/min":
        case "lpm":
            return siValue * (60 / 0.001);
        case "m3/h":
        case "m³/h":
            return siValue * 3600;
        case "cm2":
        case "cm²":
            return siValue / 1e-4;
        case "mm":
            return siValue / 1e-3;
        case "kw":
            return siValue / 1000;
        default:
            return siValue;
    }
}

export default { toSI, convertUnit };
