-- ====================================================================
-- CDI/EDI Design Platform - Database Seed Script
-- Execute this script after signing up your Administrator user account
-- ====================================================================

-- 1. Example Query to Assign Administrator Role to the designated Admin Email
UPDATE public.user_roles 
SET role = 'Administrator' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@cdi-edi.platform');

-- 2. Seed Default System Equations into Equations Table
INSERT INTO public.equations (id, name, description, formula, variables, units, category, enabled) VALUES
('power_consumption', 'Specific Energy Consumption', 'Calculates energy consumed per m3 of treated water', '(V * I) / Q', '[{"name":"V","label":"Voltage (V)"},{"name":"I","label":"Current (A)"},{"name":"Q","label":"Flow Rate (m3/h)"}]', 'kWh/m3', 'Energy', true),
('salt_removal_efficiency', 'Salt Removal Efficiency', 'Calculates percentage TDS removal', '((C_in - C_out) / C_in) * 100', '[{"name":"C_in","label":"Feed TDS (mg/L)"},{"name":"C_out","label":"Product TDS (mg/L)"}]', '%', 'Performance', true),
('water_recovery', 'Water Recovery Ratio', 'Calculates percentage of clean water recovered', '(Q_prod / Q_feed) * 100', '[{"name":"Q_prod","label":"Product Flow Rate"},{"name":"Q_feed","label":"Feed Flow Rate"}]', '%', 'Hydraulic', true)
ON CONFLICT (id) DO NOTHING;
