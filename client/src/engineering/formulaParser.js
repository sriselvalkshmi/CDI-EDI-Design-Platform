// server/utils/formulaParser.js
"use strict";

import { toSI } from "./unitConverter";

const PRECEDENCE = {
    '+': 1, '-': 1,
    '*': 2, '/': 2,
    '^': 3,
    'u-': 4 // Unary minus
};

/**
 * Tokenize a mathematical expression string.
 */
function tokenize(expression) {
    const tokens = [];
    let i = 0;
    while (i < expression.length) {
        const char = expression[i];
        if (/\s/.test(char)) {
            i++;
            continue;
        }
        // Match numbers (including decimals)
        if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(expression[i + 1] || ''))) {
            let numStr = '';
            while (i < expression.length && /[0-9\.]/.test(expression[i])) {
                numStr += expression[i];
                i++;
            }
            tokens.push(numStr);
            continue;
        }
        // Match variables (alphabetic followed by alphanumeric or underscore)
        if (/[a-zA-Z_]/.test(char)) {
            let word = '';
            while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
                word += expression[i];
                i++;
            }
            tokens.push(word);
            continue;
        }
        // Match single character operators and brackets
        if (/[\+\-\*\/\^\(\)]/.test(char)) {
            tokens.push(char);
            i++;
            continue;
        }
        throw new Error(`Invalid character: '${char}'`);
    }
    return tokens;
}

/**
 * Convert infix tokens to postfix (Reverse Polish Notation) using Shunting-yard.
 */
function infixToPostfix(tokens) {
    const outputQueue = [];
    const operatorStack = [];
    let lastToken = null;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (/^[0-9]*\.?[0-9]+$/.test(token)) {
            outputQueue.push({ type: 'NUMBER', value: parseFloat(token) });
        } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
            outputQueue.push({ type: 'VARIABLE', name: token });
        } else if (token === '(') {
            operatorStack.push(token);
        } else if (token === ')') {
            let top = operatorStack.pop();
            while (top && top !== '(') {
                outputQueue.push({ type: 'OPERATOR', value: top });
                top = operatorStack.pop();
            }
            if (!top) {
                throw new Error("Missing brackets (mismatched parentheses)");
            }
        } else if (token in PRECEDENCE) {
            // Determine if '-' is unary
            const isUnary = (token === '-' || token === '+') && (
                lastToken === null ||
                lastToken === '(' ||
                (lastToken in PRECEDENCE)
            );

            if (isUnary) {
                if (token === '-') {
                    operatorStack.push('u-');
                }
                // Unary plus is a no-op
            } else {
                const o1 = token;
                let o2 = operatorStack[operatorStack.length - 1];
                while (o2 && o2 in PRECEDENCE && (
                    (o1 !== '^' && PRECEDENCE[o1] <= PRECEDENCE[o2]) ||
                    (o1 === '^' && PRECEDENCE[o1] < PRECEDENCE[o2])
                )) {
                    outputQueue.push({ type: 'OPERATOR', value: operatorStack.pop() });
                    o2 = operatorStack[operatorStack.length - 1];
                }
                operatorStack.push(o1);
            }
        } else {
            throw new Error(`Unknown token: '${token}'`);
        }
        lastToken = token;
    }

    while (operatorStack.length > 0) {
        const op = operatorStack.pop();
        if (op === '(' || op === ')') {
            throw new Error("Missing brackets (mismatched parentheses)");
        }
        outputQueue.push({ type: 'OPERATOR', value: op });
    }

    return outputQueue;
}

/**
 * Evaluate a postfix (RPN) expression using a variable scope.
 */
function evaluatePostfix(postfix, variables) {
    const stack = [];
    for (const node of postfix) {
        if (node.type === 'NUMBER') {
            stack.push(node.value);
        } else if (node.type === 'VARIABLE') {
            if (!(node.name in variables)) {
                throw new Error(`Unknown variable: '${node.name}'`);
            }
            const val = variables[node.name];
            if (val === undefined || val === null || isNaN(val)) {
                throw new Error(`Variable '${node.name}' has no valid numeric value`);
            }
            stack.push(val);
        } else if (node.type === 'OPERATOR') {
            if (node.value === 'u-') {
                if (stack.length < 1) {
                    throw new Error("Invalid syntax: missing operand for unary minus");
                }
                const val = stack.pop();
                stack.push(-val);
            } else {
                if (stack.length < 2) {
                    throw new Error("Invalid syntax: missing operands");
                }
                const b = stack.pop();
                const a = stack.pop();
                let res;
                switch (node.value) {
                    case '+': res = a + b; break;
                    case '-': res = a - b; break;
                    case '*': res = a * b; break;
                    case '/':
                        if (b === 0) {
                            throw new Error("Division by zero");
                        }
                        res = a / b;
                        break;
                    case '^': res = Math.pow(a, b); break;
                    default: throw new Error(`Unknown operator: '${node.value}'`);
                }
                stack.push(res);
            }
        }
    }

    if (stack.length !== 1) {
        throw new Error("Invalid expression syntax");
    }
    return stack[0];
}

/**
 * Parse a formula and extract variables, validate syntax.
 * Returns { postfix, variablesUsed } or throws error.
 */
function parseFormula(formula) {
    if (!formula || formula.trim() === '') {
        throw new Error("Formula is empty");
    }
    const tokens = tokenize(formula);
    const postfix = infixToPostfix(tokens);

    // Extract variables used
    const variablesUsed = new Set();
    for (const token of postfix) {
        if (token.type === 'VARIABLE') {
            variablesUsed.add(token.name);
        }
    }

    return {
        postfix,
        variablesUsed: Array.from(variablesUsed)
    };
}

/**
 * Validate a formula for errors.
 * Returns { success: true } or { success: false, error: "error message" }
 */
function validateFormula(formula, allowedVariables = null) {
    try {
        const { postfix, variablesUsed } = parseFormula(formula);

        if (allowedVariables) {
            const allowedSet = new Set(allowedVariables);
            for (const v of variablesUsed) {
                if (!allowedSet.has(v)) {
                    return { success: false, error: `Unknown variable: '${v}'` };
                }
            }
        }

        // Test run with dummy variable values (excluding 0 to avoid division by zero errors during parsing validation, unless tested separately)
        const testScope = {};
        for (const v of variablesUsed) {
            testScope[v] = 1.0;
        }
        evaluatePostfix(postfix, testScope);

        return { success: true, variablesUsed };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

export {
    tokenize,
    infixToPostfix,
    evaluatePostfix,
    parseFormula,
    validateFormula
};

export default {
    tokenize,
    infixToPostfix,
    evaluatePostfix,
    parseFormula,
    validateFormula
};
