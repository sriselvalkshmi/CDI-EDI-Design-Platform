/**
 * Formula Parser & Evaluator for CDI/EDI Engineering Equation Engine
 */

// Math keywords and functions to exclude from variable extraction
const MATH_RESERVED_KEYWORDS = new Set([
    "Math", "abs", "acos", "acosh", "asin", "asinh", "atan", "atan2", "atanh",
    "cbrt", "ceil", "clz32", "cos", "cosh", "exp", "expm1", "floor", "fround",
    "hypot", "imul", "log", "log1p", "log10", "log2", "max", "min", "pow",
    "random", "round", "sign", "sin", "sinh", "sqrt", "tan", "tanh", "trunc",
    "PI", "E", "LN2", "LN10", "LOG2E", "LOG10E", "SQRT1_2", "SQRT2", "true", "false"
]);

export function parseFormula(formulaStr) {
    if (!formulaStr) return [];
    // Tokenize math expression into operators, numbers, and variables
    const tokens = formulaStr.match(/([a-zA-Z_][a-zA-Z0-9_]*|\d+\.?\d*|[\+\-\*\/\(\)\^,\?:]+)/g) || [];
    return tokens;
}

export function extractVariables(formulaStr) {
    if (!formulaStr || typeof formulaStr !== "string") return [];
    const rawTokens = formulaStr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const vars = new Set();

    rawTokens.forEach((token) => {
        if (!MATH_RESERVED_KEYWORDS.has(token)) {
            vars.add(token);
        }
    });

    return Array.from(vars);
}

export function validateFormula(formulaStr) {
    if (!formulaStr || formulaStr.trim() === "") {
        return { success: false, error: "Empty formula expression", variablesUsed: [] };
    }

    try {
        const variablesUsed = extractVariables(formulaStr);

        // Test syntax evaluation by generating a mock Function with dummy numeric inputs
        const dummyScope = {};
        variablesUsed.forEach((v) => { dummyScope[v] = 1; });

        const keys = Object.keys(dummyScope);
        const values = Object.values(dummyScope);

        // Convert ternary operators or exponentiation ^ if present for JS Function evaluation
        const jsExpression = formulaStr.replace(/\^/g, "**");

        const testFn = new Function(...keys, `return ${jsExpression};`);
        testFn(...values);

        return {
            success: true,
            valid: true,
            variablesUsed,
            tokens: parseFormula(formulaStr)
        };
    } catch (e) {
        return {
            success: false,
            valid: false,
            error: e.message,
            variablesUsed: extractVariables(formulaStr)
        };
    }
}

export function evaluatePostfix(tokens, valuesMap = {}) {
    if (!tokens || tokens.length === 0) return 0;

    const stack = [];
    tokens.forEach((token) => {
        if (!isNaN(Number(token))) {
            stack.push(Number(token));
        } else if (valuesMap[token] !== undefined) {
            stack.push(Number(valuesMap[token]));
        } else if (["+", "-", "*", "/", "^"].includes(token)) {
            const b = stack.pop() || 0;
            const a = stack.pop() || 0;
            if (token === "+") stack.push(a + b);
            else if (token === "-") stack.push(a - b);
            else if (token === "*") stack.push(a * b);
            else if (token === "/") stack.push(b !== 0 ? a / b : 0);
            else if (token === "^") stack.push(Math.pow(a, b));
        }
    });
    return stack.length > 0 ? stack[stack.length - 1] : 0;
}
