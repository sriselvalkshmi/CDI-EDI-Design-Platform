/**
 * Formula Parser for Equation Engine
 */
export function parseFormula(formulaStr) {
    if (!formulaStr) return [];
    // Tokenize math expression into operators, numbers, and variables
    const tokens = formulaStr.match(/([a-zA-Z_][a-zA-Z0-9_]*|\d+\.?\d*|[\+\-\*\/\(\)\^])/g) || [];
    return tokens;
}

export function evaluatePostfix(tokens, valuesMap = {}) {
    if (!tokens || tokens.length === 0) return 0;
    
    // Evaluate standard infix/postfix tokens using valuesMap
    const stack = [];
    tokens.forEach(token => {
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

export function validateFormula(formulaStr) {
    if (!formulaStr) return { valid: false, error: "Empty formula" };
    try {
        const tokens = parseFormula(formulaStr);
        return { valid: tokens.length > 0, tokens };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}
