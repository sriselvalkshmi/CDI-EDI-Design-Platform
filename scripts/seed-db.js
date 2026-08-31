/**
 * Database Seeding Script
 * Generates SQL seed or pushes 57 authoritative equations directly to Supabase.
 */
import { DEFAULT_EQUATIONS_DATABASE } from "../shared/engineering/equations/defaultEquationsDatabase.js";
import fs from "fs";
import path from "path";

console.log("==================================================================");
console.log("🌱 SYNCING 57 AUTHORITATIVE EQUATIONS TO BACKEND SEED");
console.log("==================================================================\n");

const sqlStatements = DEFAULT_EQUATIONS_DATABASE.map(eq => {
    const esc = (str) => (str ? str.replace(/'/g, "''") : "");
    const varsJson = JSON.stringify(eq.variables || []).replace(/'/g, "''");
    const refJson = JSON.stringify(eq.reference || {}).replace(/'/g, "''");

    return `INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('${esc(eq.id)}', '${esc(eq.name)}', '${esc(eq.description)}', '${esc(eq.formula)}', '${varsJson}'::jsonb, '${esc(eq.units)}', '${esc(eq.category)}', ${eq.enabled !== false}, '${refJson}'::jsonb, '${esc(eq.example)}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  formula = EXCLUDED.formula,
  variables = EXCLUDED.variables,
  units = EXCLUDED.units,
  category = EXCLUDED.category,
  enabled = EXCLUDED.enabled,
  reference = EXCLUDED.reference,
  example = EXCLUDED.example,
  updated_at = NOW();`;
});

const sqlContent = `-- Auto-generated authoritative seed for 57 equations
-- Generated: ${new Date().toISOString()}

${sqlStatements.join("\n\n")}
`;

const seedPath = path.resolve("./supabase/seed.sql");
fs.writeFileSync(seedPath, sqlContent, "utf-8");
console.log(`✓ Successfully updated ${seedPath} with ${DEFAULT_EQUATIONS_DATABASE.length} equations.`);
