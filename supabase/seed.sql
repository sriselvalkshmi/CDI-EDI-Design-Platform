-- Auto-generated authoritative seed for 57 equations
-- Generated: 2026-08-16T09:20:17.278Z

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-01-01', 'Volumetric Flow Conversion', 'Converts feed water volumetric flow rate from engineering liters per minute (L/min) to standard SI units (m³/s).', 'flowRate / 60000', '[]'::jsonb, 'm³/s', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-01-02', 'Product Flow from Recovery', 'Determines purified product water permeate flow rate yielded from feed volumetric rate and target fractional recovery.', 'feedFlowRate * (recovery / 100)', '[]'::jsonb, 'L/min', 'Performance', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-01-03', 'Concentrate Reject Flow', 'Calculates residual concentrate reject flow rate discharged during continuous operation or desorption flushing.', 'feedFlowRate - productFlowRate', '[]'::jsonb, 'L/min', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-01-04', 'Water Recovery Percentage', 'Evaluates overall process water recovery efficiency percentage as the ratio of purified product to total feed volume.', '(productFlowRate / feedFlowRate) * 100', '[]'::jsonb, '%', 'Performance', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-02-01', 'Salt Mass Flow Rate (Dilute NaCl)', 'Calculates instantaneous mass flux of dissolved sodium chloride salts traversing any process boundary in grams per second.', '(flowRate * tds) / 60000', '[]'::jsonb, 'g/s', 'Mass Transfer', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-02-02', 'Feed Salt Load', 'Total dissolved mineral mass rate introduced continuously with influent feed water.', '(feedFlowRate * feedTds) / 60000', '[]'::jsonb, 'g/s', 'Mass Transfer', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-02-03', 'Product Salt Load', 'Residual dissolved mineral mass escaping in effluent demineralized product water.', '(productFlowRate * productTds) / 60000', '[]'::jsonb, 'g/s', 'Mass Transfer', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-02-04', 'Concentrate Salt Load', 'Total rejected salt mass discharged in concentrated brine stream.', '(rejectFlowRate * rejectTds) / 60000', '[]'::jsonb, 'g/s', 'Mass Transfer', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-02-05', 'Flow Balance Residual', 'Checks volumetric flow balance closure across stack boundaries (strictly zero at steady state).', 'feedFlowRate - (productFlowRate + rejectFlowRate)', '[]'::jsonb, 'L/min', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-02-06', 'Salt Mass Balance Residual', 'Evaluates exact salt mass conservation residual across feed, product, and concentrate streams.', '(feedFlowRate * feedTds) - ((productFlowRate * productTds) + (rejectFlowRate * rejectTds))', '[]'::jsonb, 'mg/min', 'Mass Transfer', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-02-07', 'Conservation Balance Closure Tolerance', 'Normalized percentage error in salt mass closure (must be within ±0.01% for valid engineering models).', '(residualSalt / (feedFlowRate * feedTds)) * 100', '[]'::jsonb, '%', 'Mass Transfer', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-03-01', 'Molar Removal Rate', 'Molar demineralization rate of monovalent sodium chloride equivalent removed continuously across stack.', '((feedTds - productTds) / 58.44) * (flowRate / 60000)', '[]'::jsonb, 'mol/s', 'Electrochemical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-03-02', 'Theoretical Faraday Charge Rate', 'Evaluates stoichiometric electrochemical charge transfer rate required by Faraday''s constant (96,485 C/mol).', '(((feedTds - productTds) / 58.44) * (flowRate / 60000)) * 96485', '[]'::jsonb, 'C/s', 'Electrochemical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-03-03', 'Faradaic Charge Efficiency', 'Ratio of theoretical electrochemical charge required for ion transport to actual electrical charge passed.', '((((feedTds - productTds) / 58.44) * (flowRate / 60) * 96485) / (I * cellPairs * 1000)) * 100', '[]'::jsonb, '%', 'Electrochemical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-03-04', 'Operating Current Density', 'Superficial operational current density per unit geometric surface area of porous carbon electrode with unit conversion protection.', 'I / (electrodeArea_cm2 * 0.0001)', '[]'::jsonb, 'A/m²', 'Electrical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-04-01', 'Nominal Cell Voltage', 'Calculates average single-cell potential drop across membrane-spacer-electrode repeat units.', 'stackVoltage / cellPairs', '[]'::jsonb, 'V', 'Electrical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-04-02', 'Series Stack Voltage Summation', 'Evaluates total direct-current voltage across series-connected cell pairs.', 'cellPairs * cellVoltage', '[]'::jsonb, 'V', 'Electrical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-04-03', 'Gross Stack Electrical Power', 'Instantaneous direct-current electrical power consumed by the CDI/EDI cell stack during deionization.', 'V * I', '[]'::jsonb, 'W', 'Electrical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-04-04', 'Gross Electrical SEC', 'Gross Specific Energy Consumption: ratio of stack electrical power (kW) to purified water rate (m³/h).', '(power / 1000) / (purifiedFlowRate * 0.06)', '[]'::jsonb, 'kWh/m³', 'Energy', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-05-01', 'Energy Recovery Credit', 'Estimated capacitive energy reclamation credit during desorption. Assumes 70% converter energy recovery efficiency returning charge to DC bus.', 'grossSEC * (1 - (recovery / 100)) * (recoveryCreditEfficiency / 100)', '[]'::jsonb, 'kWh/m³', 'Energy', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-05-02', 'Auxiliary Hydraulic Work', 'Mechanical shaft power demanded by feed booster pump to overcome spacer mesh friction loss.', '((flowRate / 60000) * (pressureDrop * 1000)) / pumpEfficiency', '[]'::jsonb, 'W', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-05-03', 'Auxiliary Hydraulic SEC', 'Specific pumping electrical work per cubic meter of purified water produced.', '(pumpPower / 1000) / (purifiedFlowRate * 0.06)', '[]'::jsonb, 'kWh/m³', 'Energy', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-05-04', 'Total Net System SEC', 'Net battery-limits Specific Energy Consumption accounting for gross stack power, recovery credit, and pumping.', 'grossSEC - energyRecoveryCredit + pumpSEC', '[]'::jsonb, 'kWh/m³', 'Energy', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-06-01', 'Channel Linear Velocity', 'Average superficial fluid velocity inside active flow spacer channel.', '(flowRate / 60000) / channelArea', '[]'::jsonb, 'm/s', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-06-02', 'Hydraulic Channel Diameter', 'Hydraulic diameter for thin rectangular flow channels based on channel width and spacer thickness.', '(4 * (channelWidth * spacerThickness)) / (2 * (channelWidth + spacerThickness))', '[]'::jsonb, 'm', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-06-03', 'Spacer Hydraulic Loss', 'Friction pressure head loss along spacer-filled narrow channel evaluated via Darcy-Weisbach formulation.', 'f * (L / D) * (rho * (v ^ 2) / 2) / 1000', '[]'::jsonb, 'kPa', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-06-04', 'Feed Pumping Power', 'Electric power input required to drive the feed pump against system head loss and friction.', '((flowRate / 60000) * (pressureDrop * 1000)) / pumpEfficiency', '[]'::jsonb, 'W', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-07-01', 'Product TDS Concentration Prediction', 'Predicts effluent purified stream Total Dissolved Solids from feed salinity and fractional removal efficiency.', 'feedTds * (1 - (removalEfficiency / 100))', '[]'::jsonb, 'mg/L', 'Performance', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-07-02', 'Salt Rejection Percentage', 'Percentage reduction of mineral salinity achieved across active treatment stack.', '((feedTds - productTds) / feedTds) * 100', '[]'::jsonb, '%', 'Performance', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-07-03', 'Concentrate Stream TDS Prediction', 'Evaluates steady-state effluent concentrate brine TDS based on exact conservation of salt mass.', '(feedTds * feedFlowRate - productTds * productFlowRate) / rejectFlowRate', '[]'::jsonb, 'mg/L', 'Mass Transfer', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-08-01', 'Feed Salinity Operating Envelope Check', 'Project screening rule of thumb verifying that feed salinity is within practical CDI/MCDI economic operating envelope (<= 5,000 mg/L).', 'feedTds <= 5000 ? 1 : 0', '[]'::jsonb, 'compliance', 'Optimization', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-08-02', 'Feed Hardness Precipitation Limit', 'Project screening guideline validating that feed calcium/magnesium hardness does not exceed scaling risk threshold (<= 250 mg/L as CaCO3).', 'feedHardness <= 250 ? 1 : 0', '[]'::jsonb, 'compliance', 'Optimization', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-08-03', 'Multi-Technology Feasibility Gate', 'Automated feasibility dispatch evaluating whether selected CDI, MCDI, FCDI, or EDI module matches stream chemistry.', 'feedTds <= maxTdsLimit ? 1 : 0', '[]'::jsonb, 'index', 'Optimization', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-09-01', 'Electrode Active Area Unit Conversion', 'Converts electrode geometric area from square centimeters (cm²) to SI square meters (m²).', 'area_cm2 * 0.0001', '[]'::jsonb, 'm²', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-09-02', 'Total Active Stack Surface Area', 'Evaluates total cumulative active electrode surface area across all stacked cell pairs (anode + cathode).', 'cellPairs * (electrodeArea_cm2 * 0.0001) * 2', '[]'::jsonb, 'm²', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-09-03A', 'Active Stack Core Layer Height', 'Calculates net active cell repeat unit core height from individual compressed layer thicknesses (without end plates).', 'cellPairs * (electrodeThickness + spacerThickness + membraneThickness)', '[]'::jsonb, 'mm', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-09-03B', 'Total Stack Assembly Envelope Height', 'Calculates total physical outer envelope height of the assembled stack module including structural end plates and manifold compression blocks.', '(cellPairs * cellPitch) + endPlateThickness', '[]'::jsonb, 'mm', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-09-04', 'Total Electrode Carbon Mass', 'Calculates total dry mass of active porous carbon electrodes contained across all stack cell pairs.', '2 * cellPairs * (electrodeArea_cm2 * 0.0001) * (thickness / 1000) * density * (1 - porosity)', '[]'::jsonb, 'kg', 'Mass Transfer', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-10-01', 'Operational Batch Cycle Time', 'Total elapsed time for one full batch CDI/MCDI deionization, desorption regeneration, and rinse sequence.', 't_adsorption + t_desorption + t_rinse', '[]'::jsonb, 'minutes', 'Performance', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-10-02', 'Transient Concentration Response Profile', 'First-order dynamic response modeling illustrative effluent salinity trajectory during adsorption step.', 'feedTds - (feedTds - targetTds) * (1 - exp(-t / tau))', '[]'::jsonb, 'mg/L', 'Performance', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-10-03', 'Cycle-Integrated Salt Adsorption Capacity (SAC)', 'Cycle-integrated gravimetric salt adsorption capacity per gram of active carbon electrode mass across adsorption half-cycle.', '((tdsIn - tdsOut) * (flowRate / 60) * (adsorptionTime * 60)) / (totalCarbonMass * 1000)', '[]'::jsonb, 'mg/g', 'Mass Transfer', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-10-04', 'Coulombic Cycle Efficiency', 'Measures reversible charge recovery during desorption and regeneration relative to adsorption charge investment.', '(chargeDesorbed / chargeAdsorbed) * 100', '[]'::jsonb, '%', 'Electrochemical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-11-01', 'Product Water Quality Limit Compliance', 'Binary pass/fail constraint verifying that effluent product TDS satisfies user specification (<= 50 mg/L).', 'productTds <= targetTds ? 1 : 0', '[]'::jsonb, 'compliance', 'Performance', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-11-02', 'Water Recovery Floor Constraint', 'Evaluates whether operating design meets minimum allowable water recovery threshold (>= 95.0%).', 'recovery >= 95.0 ? 1 : 0', '[]'::jsonb, 'compliance', 'Performance', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-11-03', 'Cell Voltage Upper Operating Bound', 'Verifies cell potential remains safely below thermodynamic water splitting boundary (<= 1.60 V) to prevent Faradaic side reactions.', 'cellVoltage <= 1.60 ? 1 : 0', '[]'::jsonb, 'compliance', 'Electrical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-01', 'Stack Resistance (Ohm''s Law)', 'Calculates total apparent direct-current resistance across cell pairs, spacers, and ionic solutions.', 'V / I', '[]'::jsonb, 'Ω', 'Electrical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-02', 'Hydraulic Residence Time', 'Determines fluid residence time inside active treatment spacer volume.', 'reactorVolume / (flowRate / 60000)', '[]'::jsonb, 'seconds', 'Hydraulic', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-03', 'Required Faraday Current', 'Calculates total direct current required to remove target salt mass flow at specified charge efficiency.', '(((tdsIn - tdsOut) / 58.44) * (flowRate / 60) * 96485) / (cellPairs * (chargeEfficiency / 100) * 1000)', '[]'::jsonb, 'A', 'Electrochemical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-04', 'Simplified Osmotic Minimum Work Estimate (Dilute Screening)', 'Screening estimate of minimum thermodynamic energy of separation based on ideal dilute van ''t Hoff osmotic pressure delta. Rigorous multicomponent chemical potential calculations required for detailed engineering design.', '2 * 8.314 * (273.15 + temp) * ((tdsIn - tdsOut) / 58440) * 0.0002778', '[]'::jsonb, 'kWh/m³', 'Electrochemical', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-05', 'Thermodynamic Energy Efficiency', 'Second-law thermodynamic efficiency: ratio of ideal Gibbs separation work to actual net system SEC.', '(thermodynamicMinWork / netSEC) * 100', '[]'::jsonb, '%', 'Energy', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-06', 'Annual Energy Cost', 'Estimated annual operating electricity cost for 24/7 continuous operation (8760 h/yr) at regional tariff.', 'netSEC * (purifiedFlowRate * 0.06) * 8760 * electricityTariff', '[]'::jsonb, '$/year', 'Economics', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-07', 'Annual Electricity Consumption', 'Total annual electricity energy consumption required to operate the CDI/EDI plant continuous base load.', 'netSEC * (purifiedFlowRate * 0.06) * 8760', '[]'::jsonb, 'kWh/year', 'Economics', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-08', 'Annual Electrode Replacement Cost', 'Amortized annual recurring cost for activated carbon electrode periodic replacement.', '(electrodeMass * carbonPriceKg) / carbonLifeYears', '[]'::jsonb, '$/year', 'Economics', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-09', 'Levelized Cost of Water (LCOW)', 'Comprehensive Levelized Cost of Water combining annual operating expenditure and 10% annualized CapEx.', '(annualOpex + (capitalCost * 0.10)) / (purifiedFlowRate * 0.06 * 8760)', '[]'::jsonb, '$/m³', 'Economics', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-10', 'Multi-Objective Penalty Function', 'Multi-objective loss function balancing minimal specific energy with stringent target TDS penalty compliance.', 'SEC + 0.5 * ((targetTds - outletTds) > 0 ? (targetTds - outletTds) : 0)', '[]'::jsonb, 'cost unit', 'Optimization', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-11', 'Technology Screening Suitability Index', 'Multi-criteria decision screening score evaluating technology fit across energy, recovery, and deionization yield.', '0.40 * (1 / (netSEC + 0.01)) + 0.35 * (waterRecovery / 100) + 0.25 * (saltRemovalEfficiency / 100)', '[]'::jsonb, 'index', 'Optimization', true, '{}'::jsonb, '')
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
  updated_at = NOW();

INSERT INTO equations (id, name, description, formula, variables, units, category, enabled, reference, example)
VALUES ('EQ-EXT-12', 'Normalized Skid Capital Cost Metric', 'Estimates total turnkey capital equipment investment cost based on active area and enclosure module base.', 'cellPairs * ((electrodeArea_cm2 * 0.0001) * 250) + 1200', '[]'::jsonb, '$', 'Economics', true, '{}'::jsonb, '')
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
  updated_at = NOW();
