-- ====================================================================
-- CDI/EDI Design Platform - Supabase Seed Script
-- Run this script to assign Administrator role to admin@cdiedi.com
-- ====================================================================

-- Assign Administrator role to admin@cdiedi.com profile
UPDATE public.profiles 
SET role = 'Administrator' 
WHERE email = 'admin@cdiedi.com';

-- Default Equations Seed
INSERT INTO public.equations (id, name, description, formula, variables, units, category, enabled) VALUES
('power', 'Power Consumption', 'Calculates electrical power consumed by cell stack', 'V * I', '["V", "I"]'::jsonb, 'W', 'Electrical', true),
('current_density', 'Current Density', 'Electrical current per unit area of electrode', 'I / Area', '["I", "Area"]'::jsonb, 'A/cm²', 'Electrical', true),
('residence_time', 'Residence Time', 'Time water spends inside flow channel', '(Area * Height) / FlowRate', '["Area", "Height", "FlowRate"]'::jsonb, 's', 'Hydraulic', true),
('sec', 'Specific Energy Consumption', 'Energy consumed per m3 of clean water produced', 'Power / WaterProduced', '["Power", "WaterProduced"]'::jsonb, 'kWh/m³', 'Energy', true),
('salt_removal', 'Salt Removal', 'Difference in TDS between inlet feed and product outlet', 'FeedTDS - OutletTDS', '["FeedTDS", "OutletTDS"]'::jsonb, 'ppm', 'Mass Transfer', true),
('removal_efficiency', 'Removal Efficiency', 'Percentage of salt removed relative to feed salinity', '((FeedTDS - OutletTDS) / FeedTDS) * 100', '["FeedTDS", "OutletTDS"]'::jsonb, '%', 'Performance', true)
ON CONFLICT (id) DO NOTHING;
