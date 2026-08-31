/**
 * ENGINEERING FORMULA VALIDATOR & EXPRESSION EVALUATOR
 * 
 * Provides mathematical validation, variable dependency checking,
 * constant expansion, and sandbox execution for the Engineering Equation Registry.
 */

// Universal physical and chemical constants for engineering calculations
export const ENGINEERING_CONSTANTS = {
    F: 96485.3321,          // Faraday Constant (C/mol)
    FARADAY_CONSTANT: 96485.3321,
    R: 8.31446,             // Universal Gas Constant (J/(mol·K))
    GAS_CONSTANT: 8.31446,
    MW_NaCl: 58.4428,       // Molar Mass of Sodium Chloride (g/mol)
    MW_WATER: 18.0153,      // Molar Mass of Water (g/mol)
    z: 1,                   // Equivalent ionic valence (1:1 electrolyte)
    rho: 1000.0,            // Water density at standard 25°C (kg/m³)
    DENSITY_WATER: 1000.0,
    mu: 0.00089,            // Dynamic viscosity of water at 25°C (Pa·s)
    VISCOSITY_WATER: 0.00089,
    g: 9.80665,             // Standard gravity (m/s²)
    PI: Math.PI,
    E: Math.E
};

// Math functions recognized in solver expressions
const BUILT_IN_FUNCTIONS = new Set([
    "sqrt", "exp", "ln", "log", "log10", "log2",
    "sin", "cos", "tan", "asin", "acos", "atan",
    "abs", "min", "max", "pow", "round", "floor", "ceil"
]);

/**
 * Extract variable tokens from an algebraic solver expression
 */
export function extractExpressionVariables(expressionStr) {
    if (!expressionStr || typeof expressionStr !== "string") return [];
    
    // Match word tokens (identifiers)
    const tokens = expressionStr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const vars = new Set();

    tokens.forEach((token) => {
        if (!BUILT_IN_FUNCTIONS.has(token) && !ENGINEERING_CONSTANTS[token] && token !== "Math") {
            vars.add(token);
        }
    });

    return Array.from(vars);
}

/**
 * Transform standard engineering mathematical syntax to executable JavaScript expression
 */
export function compileSolverExpression(expressionStr) {
    if (!expressionStr || typeof expressionStr !== "string") return "";

    let js = expressionStr.trim();

    // 1. Replace power operator ^ with **
    js = js.replace(/\^/g, "**");

    // 2. Map standard functions to Math.*
    js = js.replace(/\bln\s*\(/g, "Math.log(");
    js = js.replace(/\blog10\s*\(/g, "Math.log10(");
    js = js.replace(/\blog2\s*\(/g, "Math.log2(");
    js = js.replace(/\bsqrt\s*\(/g, "Math.sqrt(");
    js = js.replace(/\bexp\s*\(/g, "Math.exp(");
    js = js.replace(/\babs\s*\(/g, "Math.abs(");
    js = js.replace(/\bmin\s*\(/g, "Math.min(");
    js = js.replace(/\bmax\s*\(/g, "Math.max(");
    js = js.replace(/\bsin\s*\(/g, "Math.sin(");
    js = js.replace(/\bcos\s*\(/g, "Math.cos(");
    js = js.replace(/\btan\s*\(/g, "Math.tan(");

    return js;
}

/**
 * Comprehensive Validation of an Engineering Equation
 * 
 * @param {Object} equation - Equation definition
 * @param {Object} testScope - Input parameter values for test evaluation
 * @returns {Object} Validation report with valid status, error message, warnings, and evaluation result
 */
export function validateEngineeringEquation(equation, testScope = {}) {
    if (!equation) {
        return { valid: false, error: "Equation definition is missing." };
    }

    const { name, solverExpression, variables = [] } = equation;

    if (!name || name.trim() === "") {
        return { valid: false, error: "Equation name is required." };
    }

    if (!solverExpression || solverExpression.trim() === "") {
        return { valid: false, error: "Solver expression cannot be empty." };
    }

    // 1. Syntax check and token extraction
    const usedVars = extractExpressionVariables(solverExpression);
    const declaredVarSymbols = new Set(variables.map(v => v.symbol));

    // 2. Check for undefined variables in expression
    const undefinedVars = usedVars.filter(v => !declaredVarSymbols.has(v) && !ENGINEERING_CONSTANTS[v]);
    if (undefinedVars.length > 0) {
        return {
            valid: false,
            error: `Undefined variable(s) in solver expression: ${undefinedVars.join(", ")}. Please declare them in the Variables table.`,
            usedVariables: usedVars,
            undefinedVariables: undefinedVars
        };
    }

    // 3. Compile JS expression
    const jsExpr = compileSolverExpression(solverExpression);

    // 4. Test execution in isolated sandbox
    try {
        const fullScope = {
            ...ENGINEERING_CONSTANTS,
            ...testScope
        };

        // Populate any missing variable with its declared default or 1.0
        variables.forEach((v) => {
            if (fullScope[v.symbol] === undefined) {
                fullScope[v.symbol] = v.defaultValue !== undefined ? Number(v.defaultValue) : 1.0;
            }
        });

        const scopeKeys = Object.keys(fullScope);
        const scopeValues = Object.values(fullScope);

        const evaluatorFn = new Function(...scopeKeys, `return (${jsExpr});`);
        const result = evaluatorFn(...scopeValues);

        if (result === null || result === undefined) {
            return { valid: false, error: "Solver expression evaluated to null or undefined." };
        }

        if (typeof result === "number" && (isNaN(result) || !isFinite(result))) {
            return {
                valid: false,
                error: isNaN(result) ? "Calculation produced NaN (Not a Number)." : "Division by zero or infinity encountered in calculation.",
                testResult: result
            };
        }

        // Check for static divide-by-zero vulnerability patterns (e.g. / 0 or / (var - var))
        const warnings = [];
        if (solverExpression.includes("/ 0") || solverExpression.includes("/0")) {
            return { valid: false, error: "Direct division by zero detected in solver expression." };
        }

        // Format test substitution string
        const substitutionParts = [];
        usedVars.forEach(v => {
            if (fullScope[v] !== undefined) {
                substitutionParts.push(`${v} = ${fullScope[v]}`);
            }
        });

        return {
            valid: true,
            error: null,
            warnings,
            usedVariables: usedVars,
            testResult: typeof result === "number" ? Number(result.toFixed(6)) : result,
            testSubstitution: substitutionParts.join(", ")
        };

    } catch (err) {
        return {
            valid: false,
            error: `Mathematical syntax error: ${err.message}`,
            usedVariables: usedVars
        };
    }
}

/**
 * Check for circular dependencies across an equation graph
 * 
 * @param {Array} equations - List of equations with id and dependencies
 * @returns {Object} { hasCycles: boolean, cyclePath?: string }
 */
export function checkCircularDependencies(equations = []) {
    const adj = new Map();
    const idMap = new Map();

    equations.forEach(eq => {
        idMap.set(eq.id, eq);
        adj.set(eq.id, eq.dependencies || []);
    });

    const visited = new Set();
    const recStack = new Set();

    function isCyclicUtil(node, path = []) {
        visited.add(node);
        recStack.add(node);
        path.push(node);

        const neighbors = adj.get(node) || [];
        for (const neighbor of neighbors) {
            // Find equation by ID or by Name
            const neighborEq = equations.find(e => e.id === neighbor || e.name === neighbor);
            const neighborId = neighborEq ? neighborEq.id : neighbor;

            if (!visited.has(neighborId)) {
                if (isCyclicUtil(neighborId, [...path])) return true;
            } else if (recStack.has(neighborId)) {
                return true;
            }
        }

        recStack.delete(node);
        return false;
    }

    for (const eq of equations) {
        if (!visited.has(eq.id)) {
            if (isCyclicUtil(eq.id, [])) {
                return { hasCycles: true, cyclePath: `Circular dependency detected involving equation ${eq.id} (${eq.name})` };
            }
        }
    }

    return { hasCycles: false };
}
