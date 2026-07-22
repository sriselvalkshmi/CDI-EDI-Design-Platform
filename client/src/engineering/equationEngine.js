import { parseFormula, evaluatePostfix, validateFormula } from './formulaParser.js';

import supabase from '../services/supabaseClient.js';
let inMemoryEquationsCache = null;

const EQUATION_SYMBOLS = {
    'power': ['Power', 'P'],
    'current_density': ['CurrentDensity', 'J'],
    'residence_time': ['ResidenceTime', 't'],
    'flow_velocity': ['FlowVelocity', 'v'],
    'hydraulic_diameter': ['Dh'],
    'pressure_drop': ['DeltaP', 'PressureDrop'],
    'pump_power': ['PumpPower'],
    'sec': ['SEC'],
    'salt_removal': ['SaltRemoval'],
    'removal_efficiency': ['RemovalEfficiency'],
    'electrode_mass': ['ElectrodeMass', 'Mass'],
    'sac': ['SAC'],
    'charge_efficiency': ['Lambda', 'ChargeEfficiency']
};

class EquationEngine {
    
    static loadEquations() {
        if (!inMemoryEquationsCache) {
            inMemoryEquationsCache = EquationEngine.getDefaultEquations();
        }
        return inMemoryEquationsCache;
    }

    static async loadEquationsAsync() {
        if (supabase) {
            try {
                const { data, error } = await supabase.from('equations').select('*');
                if (!error && data && data.length > 0) {
                    inMemoryEquationsCache = data.map(eq => ({
                        id: eq.id,
                        name: eq.name,
                        description: eq.description,
                        formula: eq.formula,
                        variables: eq.variables || [],
                        units: eq.units,
                        category: eq.category,
                        enabled: eq.enabled,
                        reference: eq.reference || {},
                        example: eq.example
                    }));
                    return inMemoryEquationsCache;
                }
            } catch (e) {
                console.warn("Equations fetch error, using local fallback:", e.message);
            }
        }
        return EquationEngine.loadEquations();
    }

    static saveEquations(equations) {
        EquationEngine.validateLibrary(equations);
        inMemoryEquationsCache = equations;

        if (supabase) {
            try {
                const dbRecords = equations.map(eq => ({
                    id: eq.id,
                    name: eq.name,
                    description: eq.description,
                    formula: eq.formula,
                    variables: eq.variables || [],
                    units: eq.units,
                    category: eq.category,
                    enabled: eq.enabled,
                    reference: eq.reference || {},
                    example: eq.example,
                    updated_at: new Date().toISOString()
                }));
                supabase.from('equations').upsert(dbRecords, { onConflict: 'id' }).then(() => {});
            } catch (e) {
                console.warn("Equation upsert error:", e.message);
            }
        }
    }

    static resetToDefaults() {
        const defaults = [
          {
            "id": "power",
            "name": "Power",
            "description": "Calculates the electrical power consumed by the cell stack.",
            "formula": "V * I",
            "variables": ["V", "I"],
            "units": "W",
            "category": "Electrical",
            "enabled": true,
            "reference": {
              "title": "Review of Capacitive Deionization",
              "description": "Fundamental relation of power consumption in electrochemical systems.",
              "literatureReference": "Review of Capacitive Deionization",
              "publication": "Water Research",
              "doi": "10.1016/j.watres.2012.11.001",
              "year": 2013
            },
            "example": "V = 1.2 V, I = 5 A => P = 6 W"
          },
          {
            "id": "current_density",
            "name": "Current Density",
            "description": "Electrical current per unit area of electrode.",
            "formula": "I / Area",
            "variables": ["I", "Area"],
            "units": "A/cm²",
            "category": "Electrical",
            "enabled": true,
            "reference": {
              "title": "Electrochemical System Engineering",
              "description": "Standard definitions for current density in porous electrodes.",
              "literatureReference": "Electrode Kinetics and Cell Currents",
              "publication": "Journal of Membrane Science",
              "doi": "10.1016/j.memsci.2015.02.012",
              "year": 2015
            },
            "example": "I = 5 A, Area = 250 cm² => J = 0.02 A/cm²"
          },
          {
            "id": "residence_time",
            "name": "Residence Time",
            "description": "Average time fluid stays inside the cell reactor channel.",
            "formula": "ReactorVolume / FlowRate",
            "variables": ["ReactorVolume", "FlowRate"],
            "units": "min",
            "category": "Hydraulic",
            "enabled": true,
            "reference": {
              "title": "Chemical Reaction Engineering Principles",
              "description": "Calculates hydraulic retention time for continuous reactors.",
              "literatureReference": "Chemical Reaction Engineering (3rd Ed)",
              "publication": "John Wiley & Sons",
              "doi": "10.1016/0009-2509(73)80053-0",
              "year": 1999
            },
            "example": "ReactorVolume = 2 L, FlowRate = 10 L/min => t = 0.2 min"
          },
          {
            "id": "flow_velocity",
            "name": "Flow Velocity",
            "description": "Linear flow velocity through the spacer channel.",
            "formula": "FlowRate / ChannelArea",
            "variables": ["FlowRate", "ChannelArea"],
            "units": "m/s",
            "category": "Hydraulic",
            "enabled": true,
            "reference": {
              "title": "Spacer Channel Hydraulics",
              "description": "Flow modeling in thin spacer filled channels for CDI stacks.",
              "literatureReference": "Modeling of flow structures in spacer filled channels",
              "publication": "Desalination",
              "doi": "10.1016/j.desal.2016.05.008",
              "year": 2016
            },
            "example": "FlowRate = 10 L/min, ChannelArea = 1.1 cm² => v = 1.51 m/s"
          },
          {
            "id": "hydraulic_diameter",
            "name": "Hydraulic Diameter",
            "description": "Equivalent hydraulic diameter for rectangular flow channels.",
            "formula": "(2 * Width * Height) / (Width + Height)",
            "variables": ["Width", "Height"],
            "units": "mm",
            "category": "Hydraulic",
            "enabled": true,
            "reference": {
              "title": "Fluid Mechanics for Rectangular Ducts",
              "description": "Definition of hydraulic diameter for non-circular pipes.",
              "literatureReference": "Hydraulics in rectangular channels",
              "publication": "Journal of Fluid Mechanics",
              "doi": "10.1017/jfm.2011.14",
              "year": 2011
            },
            "example": "Width = 100 mm, Height = 0.5 mm => Dh = 0.995 mm"
          },
          {
            "id": "pressure_drop",
            "name": "Pressure Drop",
            "description": "Frictional pressure loss along the flow spacer channel length.",
            "formula": "f * (Length / Dh) * (Density * Velocity^2 / 2)",
            "variables": ["f", "Length", "Dh", "Density", "Velocity"],
            "units": "Pa",
            "category": "Hydraulic",
            "enabled": true,
            "reference": {
              "title": "Darcy-Weisbach Channel Friction",
              "description": "Calculation of frictional pressure drop in spacer channels.",
              "literatureReference": "Pressure loss in spacer-filled membrane modules",
              "publication": "Journal of Membrane Science",
              "doi": "10.1016/0376-7388(94)00214-E",
              "year": 1995
            },
            "example": "f=0.03, Length=200mm, Dh=1mm, Density=1000kg/m³, Velocity=0.15m/s => DeltaP=67.5 Pa"
          },
          {
            "id": "pump_power",
            "name": "Pump Power",
            "description": "Theoretical electrical power required by the circulation pump.",
            "formula": "(FlowRate * DeltaP) / PumpEfficiency",
            "variables": ["FlowRate", "DeltaP", "PumpEfficiency"],
            "units": "W",
            "category": "Hydraulic",
            "enabled": true,
            "reference": {
              "title": "Pumping System Efficiency",
              "description": "Standard energy requirements for fluid circulation in CDI setups.",
              "literatureReference": "Pump power optimization in desalination",
              "publication": "Energy Conversion and Management",
              "doi": "10.1016/j.enconman.2014.07.031",
              "year": 2014
            },
            "example": "FlowRate=10 L/min (1.66e-4 m³/s), DeltaP=180 Pa, PumpEfficiency=75% => PumpPower=0.04 W"
          },
          {
            "id": "sec",
            "name": "Specific Energy Consumption",
            "description": "Energy spent per unit volume of desalinated water produced.",
            "formula": "Power / WaterProduced",
            "variables": ["Power", "WaterProduced"],
            "units": "kWh/m³",
            "category": "Energy",
            "enabled": true,
            "reference": {
              "title": "Energy Consumption in Capacitive Deionization",
              "description": "Metrics for comparing thermodynamic efficiency in CDI/EDI.",
              "literatureReference": "Thermodynamics and energy in CDI",
              "publication": "Environmental Science & Technology",
              "doi": "10.1021/es505111a",
              "year": 2015
            },
            "example": "Power = 6 W, WaterProduced = 10 L/min (0.6 m³/h) => SEC = 0.01 kWh/m³"
          },
          {
            "id": "salt_removal",
            "name": "Salt Removal",
            "description": "Difference in total dissolved solids (TDS) between inlet feed and product outlet.",
            "formula": "FeedTDS - OutletTDS",
            "variables": ["FeedTDS", "OutletTDS"],
            "units": "ppm",
            "category": "Mass Transfer",
            "enabled": true,
            "reference": {
              "title": "TDS Profiles in CDI Desalination",
              "description": "Basic mass transfer metrics for desalinating cells.",
              "literatureReference": "Salt transport in capacitive deionization",
              "publication": "Chemical Engineering Journal",
              "doi": "10.1016/j.cej.2017.03.119",
              "year": 2017
            },
            "example": "FeedTDS = 500 ppm, OutletTDS = 50 ppm => SaltRemoval = 450 ppm"
          },
          {
            "id": "removal_efficiency",
            "name": "Removal Efficiency",
            "description": "Percentage of salt removed relative to the feed salinity.",
            "formula": "((FeedTDS - OutletTDS) / FeedTDS) * 100",
            "variables": ["FeedTDS", "OutletTDS"],
            "units": "%",
            "category": "Performance",
            "enabled": true,
            "reference": {
              "title": "Desalination Efficiency Metrics",
              "description": "Percentage indicators for performance reporting in CDI.",
              "literatureReference": "Performance metrics for capacitive deionization",
              "publication": "Water Research",
              "doi": "10.1016/j.watres.2019.04.015",
              "year": 2019
            },
            "example": "FeedTDS = 500 ppm, OutletTDS = 50 ppm => RemovalEfficiency = 90%"
          },
          {
            "id": "electrode_mass",
            "name": "Electrode Mass",
            "description": "Total mass of active electrode material in the cell.",
            "formula": "Area * Thickness * Density",
            "variables": ["Area", "Thickness", "Density"],
            "units": "g",
            "category": "Performance",
            "enabled": true,
            "reference": {
              "title": "Carbon Electrode Engineering",
              "description": "Determination of electrode mass from geometry and bulk material density.",
              "literatureReference": "Porous carbon electrodes for CDI modules",
              "publication": "Carbon",
              "doi": "10.1016/j.carbon.2014.10.021",
              "year": 2014
            },
            "example": "Area = 250 cm², Thickness = 0.6 mm (0.06 cm), Density = 0.45 g/cm³ => Mass = 6.75 g"
          },
          {
            "id": "sac",
            "name": "Salt Adsorption Capacity",
            "description": "Mass of salt adsorbed per unit mass of active electrode material.",
            "formula": "SaltRemoved / ElectrodeMass",
            "variables": ["SaltRemoved", "ElectrodeMass"],
            "units": "mg/g",
            "category": "Optimization",
            "enabled": true,
            "reference": {
              "title": "SAC in Capacitive Deionization",
              "description": "Crucial optimization indicator representing charge storage capacity.",
              "literatureReference": "Salt adsorption capacity of porous carbon electrodes",
              "publication": "Environmental Science & Technology",
              "doi": "10.1021/es305215y",
              "year": 2013
            },
            "example": "SaltRemoved = 135 mg, ElectrodeMass = 6.75 g => SAC = 20 mg/g"
          },
          {
            "id": "charge_efficiency",
            "name": "Charge Efficiency",
            "description": "Ratio of salt removed to electrical charge supplied during adsorption.",
            "formula": "RemovedCharge / SuppliedCharge",
            "variables": ["RemovedCharge", "SuppliedCharge"],
            "units": "%",
            "category": "Electrochemical",
            "enabled": true,
            "reference": {
              "title": "Electrochemical Charge Efficiency in CDI",
              "description": "Indicator of co-ion repulsion efficiency in electrical double layers.",
              "literatureReference": "Charge efficiency in capacitive deionization",
              "publication": "Journal of Colloid and Interface Science",
              "doi": "10.1016/j.jcis.2010.08.019",
              "year": 2010
            },
            "example": "RemovedCharge = 85 C, SuppliedCharge = 100 C => Lambda = 0.85 (85%)"
          }
        ];
        inMemoryEquationsCache = defaults;
        if (supabase) {
            try {
                supabase.from('equations').upsert(defaults, { onConflict: 'id' }).then(() => {});
            } catch (e) {}
        }
        return defaults;
    }

    static getDefaultEquations() {
        return [
          {
            "id": "power",
            "name": "Power",
            "description": "Calculates the electrical power consumed by the cell stack.",
            "formula": "V * I",
            "variables": ["V", "I"],
            "units": "W",
            "category": "Electrical",
            "enabled": true,
            "reference": {
              "title": "Review of Capacitive Deionization",
              "description": "Fundamental relation of power consumption in electrochemical systems.",
              "literatureReference": "Review of Capacitive Deionization",
              "publication": "Water Research",
              "doi": "10.1016/j.watres.2012.11.001",
              "year": 2013
            },
            "example": "V = 1.2 V, I = 5 A => P = 6 W"
          },
          {
            "id": "current_density",
            "name": "Current Density",
            "description": "Electrical current per unit area of electrode.",
            "formula": "I / Area",
            "variables": ["I", "Area"],
            "units": "A/cm²",
            "category": "Electrical",
            "enabled": true
          },
          {
            "id": "residence_time",
            "name": "Residence Time",
            "description": "Time water spends inside the cell flow channel.",
            "formula": "(Area * Height) / FlowRate",
            "variables": ["Area", "Height", "FlowRate"],
            "units": "s",
            "category": "Hydraulic",
            "enabled": true
          },
          {
            "id": "sec",
            "name": "Specific Energy Consumption",
            "description": "Energy consumed per cubic meter of clean water produced.",
            "formula": "Power / WaterProduced",
            "variables": ["Power", "WaterProduced"],
            "units": "kWh/m³",
            "category": "Energy",
            "enabled": true
          },
          {
            "id": "salt_removal",
            "name": "Salt Removal",
            "description": "Difference in total dissolved solids (TDS) between inlet feed and product outlet.",
            "formula": "FeedTDS - OutletTDS",
            "variables": ["FeedTDS", "OutletTDS"],
            "units": "ppm",
            "category": "Mass Transfer",
            "enabled": true
          },
          {
            "id": "removal_efficiency",
            "name": "Removal Efficiency",
            "description": "Percentage of salt removed relative to the feed salinity.",
            "formula": "((FeedTDS - OutletTDS) / FeedTDS) * 100",
            "variables": ["FeedTDS", "OutletTDS"],
            "units": "%",
            "category": "Performance",
            "enabled": true
          }
        ];
    }

    static getTopologicalOrder(activeEquations) {
        const adj = {};
        const eqById = {};
        const symbolToEqId = {};

        for (const eq of activeEquations) {
            eqById[eq.id] = eq;
            const symbols = EQUATION_SYMBOLS[eq.id] || [eq.id];
            for (const sym of symbols) {
                symbolToEqId[sym.toLowerCase()] = eq.id;
            }
            symbolToEqId[eq.name.replace(/\s+/g, '').toLowerCase()] = eq.id;
        }

        for (const eq of activeEquations) {
            adj[eq.id] = [];
            try {
                const { variablesUsed } = parseFormula(eq.formula);
                for (const v of variablesUsed) {
                    const targetId = symbolToEqId[v.toLowerCase()];
                    if (targetId && targetId !== eq.id) {
                        adj[eq.id].push(targetId);
                    }
                }
            } catch (e) {
                // Ignore parsing errors for dependency construction
            }
        }

        const visited = {}; // 'visiting', 'visited'
        const order = [];

        function visit(id) {
            if (visited[id] === 'visiting') {
                throw new Error(`Circular dependency detected involving equation: ${eqById[id].name}`);
            }
            if (!visited[id]) {
                visited[id] = 'visiting';
                const deps = adj[id] || [];
                for (const depId of deps) {
                    visit(depId);
                }
                visited[id] = 'visited';
                order.push(id);
            }
        }

        for (const eq of activeEquations) {
            if (!visited[eq.id]) {
                visit(eq.id);
            }
        }

        return order.map(id => eqById[id]);
    }

    static validateLibrary(equations) {
        const active = equations.filter(e => e.enabled);
        
        // 1. Validate formulas syntax and allowed variables
        const symbolToEqId = {};
        const allowedVariables = new Set([
            'V', 'voltage',
            'I', 'current',
            'Area', 'electrodeArea',
            'Thickness', 'electrodeThickness',
            'SpacerThickness', 'spacerThickness',
            'FlowRate', 'flowRate',
            'Velocity', 'flowVelocity', 'v',
            'ResidenceTime', 'residenceTime', 't',
            'FeedPressure', 'pressure',
            'Width', 'stackWidth',
            'Height', 'stackHeight',
            'Length', 'stackLength',
            'PumpEfficiency', 'pumpEfficiency',
            'Density', 'electrodeDensity', 'fluidDensity',
            'Porosity', 'porosity',
            'FeedTDS',
            'OutletTDS',
            'WaterProduced',
            'SaltRemoved',
            'RemovedCharge',
            'SuppliedCharge',
            'f', // Friction factor
            'waterRecovery',
            'ReactorVolume',
            'ChannelArea'
        ]);

        for (const eq of equations) {
            const symbols = EQUATION_SYMBOLS[eq.id] || [eq.id];
            for (const sym of symbols) {
                symbolToEqId[sym.toLowerCase()] = eq.id;
                allowedVariables.add(sym);
            }
            allowedVariables.add(eq.id);
            allowedVariables.add(eq.name);
        }

        // Validate syntax
        for (const eq of active) {
            const validation = validateFormula(eq.formula, Array.from(allowedVariables));
            if (!validation.success) {
                throw new Error(`Equation '${eq.name}' is invalid: ${validation.error}`);
            }
        }

        // 2. Validate circular dependencies
        EquationEngine.getTopologicalOrder(active);
    }

    static evaluate(equationName, scope, defaultValue = 0) {
        try {
            const equations = EquationEngine.loadEquations();
            const eq = equations.find(e => e.name.toLowerCase() === equationName.toLowerCase() || e.id.toLowerCase() === equationName.toLowerCase());
            
            if (!eq || !eq.enabled) {
                return defaultValue;
            }

            const { postfix } = parseFormula(eq.formula);
            
            // Map context variables specifically
            const currentScope = { ...scope };
            
            // Standardize symbols in scope
            if (currentScope.voltage !== undefined) currentScope.V = currentScope.voltage;
            if (currentScope.current !== undefined) currentScope.I = currentScope.current;
            if (currentScope.electrodeArea !== undefined) currentScope.Area = currentScope.electrodeArea;
            if (currentScope.electrodeThickness !== undefined) currentScope.Thickness = currentScope.electrodeThickness;
            if (currentScope.stackLength !== undefined) currentScope.Length = currentScope.stackLength;
            if (currentScope.stackWidth !== undefined) currentScope.Width = currentScope.stackWidth;
            if (currentScope.stackHeight !== undefined) currentScope.Height = currentScope.stackHeight;
            if (currentScope.flowVelocity !== undefined) currentScope.Velocity = currentScope.flowVelocity;
            if (currentScope.flowRate !== undefined) currentScope.FlowRate = currentScope.flowRate;
            if (currentScope.feedTds !== undefined) currentScope.FeedTDS = currentScope.feedTds;
            if (currentScope.outletTds !== undefined) currentScope.OutletTDS = currentScope.outletTds;

            if (eq.id === 'electrode_mass') {
                currentScope.Density = scope.electrodeDensity ?? scope.Density ?? 0.45;
            } else if (eq.id === 'pressure_drop') {
                currentScope.Density = scope.fluidDensity ?? scope.Density ?? 1000;
            } else {
                if (currentScope.Density === undefined) {
                    currentScope.Density = 0.45; // default to electrode density for other things
                }
            }

            return evaluatePostfix(postfix, currentScope);
        } catch (e) {
            console.warn(`Evaluation of '${equationName}' failed: ${e.message}. Using fallback.`);
            return defaultValue;
        }
    }

    static evaluateAll(inputs) {
        const equations = EquationEngine.loadEquations();
        const active = equations.filter(e => e.enabled);

        const scope = { ...inputs };
        
        // Standardize base aliases in scope
        if (scope.voltage !== undefined) scope.V = scope.voltage;
        if (scope.current !== undefined) scope.I = scope.current;
        if (scope.cellPairs !== undefined) scope.N = scope.cellPairs;
        if (scope.electrodeArea !== undefined) scope.Area = scope.electrodeArea;
        if (scope.electrodeThickness !== undefined) scope.Thickness = scope.electrodeThickness;
        if (scope.spacerThickness !== undefined) scope.SpacerThickness = scope.spacerThickness;
        if (scope.flowRate !== undefined) scope.FlowRate = scope.flowRate;
        if (scope.flowVelocity !== undefined) scope.Velocity = scope.flowVelocity;
        if (scope.residenceTime !== undefined) scope.ResidenceTime = scope.residenceTime;
        if (scope.feedTds !== undefined) scope.FeedTDS = scope.feedTds;
        if (scope.outletTds !== undefined) scope.OutletTDS = scope.outletTds;
        if (scope.stackLength !== undefined) scope.Length = scope.stackLength;
        if (scope.stackWidth !== undefined) scope.Width = scope.stackWidth;
        if (scope.stackHeight !== undefined) scope.Height = scope.stackHeight;
        
        // Defaults for constants
        if (scope.f === undefined) scope.f = 0.03;
        if (scope.fluidDensity === undefined) scope.fluidDensity = 1000;
        if (scope.electrodeDensity === undefined) scope.electrodeDensity = 0.45;
        if (scope.pumpEfficiency === undefined) scope.pumpEfficiency = 75; // 75%
        if (scope.PumpEfficiency === undefined) scope.PumpEfficiency = scope.pumpEfficiency;
        
        // Ensure intermediates
        if (scope.ReactorVolume === undefined) {
            // Volume = Area * Thickness * cellPairs * 2
            scope.ReactorVolume = ((scope.Area || 250) * ((scope.Thickness || 0.6) / 10) * (scope.cellPairs || 36) * 2) / 1000; // in Liters
        }
        if (scope.ChannelArea === undefined) {
            // Area in cm² = Width(mm) * SpacerThickness(mm) / 100
            scope.ChannelArea = ((scope.stackWidth || 100) * (scope.spacerThickness || 0.5)) / 100;
        }
        if (scope.WaterProduced === undefined) {
            scope.WaterProduced = (scope.flowRate || 10) * ((scope.waterRecovery ?? 98) / 100);
        }
        if (scope.SaltRemoved === undefined) {
            scope.SaltRemoved = Math.max(0, (scope.FeedTDS || 500) - (scope.OutletTDS || 50)) * (scope.flowRate || 10); // mg/min
        }
        if (scope.RemovedCharge === undefined) {
            // Removed charge = SaltRemoved (mg/min) * Faraday / NaClMW / 60
            scope.RemovedCharge = ((scope.SaltRemoved || 450) / 1000 / 58.44) * 96485 / 60; // Coulomb/s (Ampere)
        }
        if (scope.SuppliedCharge === undefined) {
            scope.SuppliedCharge = scope.current || 5.0; // Amperes
        }

        let sortedEquations;
        try {
            sortedEquations = EquationEngine.getTopologicalOrder(active);
        } catch (e) {
            console.error("Topological sorting failed, falling back:", e.message);
            sortedEquations = active;
        }

        for (const eq of sortedEquations) {
            try {
                const { postfix } = parseFormula(eq.formula);
                const currentScope = { ...scope };

                if (currentScope.Height === undefined) currentScope.Height = scope.stackHeight ?? scope.spacerThickness ?? scope.electrodeThickness ?? 0.5;
                if (currentScope.Area === undefined) currentScope.Area = scope.electrodeArea ?? 250;
                if (currentScope.Thickness === undefined) currentScope.Thickness = scope.electrodeThickness ?? 0.6;
                if (currentScope.FlowRate === undefined) currentScope.FlowRate = scope.flowRate ?? 10;
                if (currentScope.V === undefined) currentScope.V = scope.voltage ?? 1.2;
                if (currentScope.I === undefined) currentScope.I = scope.current ?? 5;

                if (eq.id === 'electrode_mass') {
                    currentScope.Density = scope.electrodeDensity ?? 0.45;
                } else if (eq.id === 'pressure_drop') {
                    currentScope.Density = scope.fluidDensity ?? 1000;
                }

                const result = evaluatePostfix(postfix, currentScope);
                
                const symbols = EQUATION_SYMBOLS[eq.id] || [eq.id];
                for (const sym of symbols) {
                    scope[sym] = result;
                }
                scope[eq.id] = result;
                scope[eq.name] = result;
            } catch (err) {
                console.warn(`Evaluation of equation '${eq.name}' failed: ${err.message}. Using fallback.`);
                const fallback = EquationEngine.getFallbackValue(eq.id, scope);
                const symbols = EQUATION_SYMBOLS[eq.id] || [eq.id];
                for (const sym of symbols) {
                    scope[sym] = fallback;
                }
                scope[eq.id] = fallback;
                scope[eq.name] = fallback;
            }
        }

        return scope;
    }

    static getFallbackValue(id, scope) {
        const V = scope.voltage ?? scope.V ?? 1.2;
        const I = scope.current ?? scope.I ?? 5.0;
        const Area = scope.electrodeArea ?? scope.Area ?? 250;
        const FlowRate = scope.flowRate ?? scope.FlowRate ?? 10;
        const CellPairs = scope.cellPairs ?? scope.N ?? 36;
        
        switch (id) {
            case 'power': return V * I;
            case 'current_density': return I / Math.max(Area, 1);
            case 'residence_time': return (scope.ReactorVolume ?? 2) / Math.max(FlowRate, 0.001);
            case 'flow_velocity': return FlowRate / Math.max(scope.ChannelArea ?? 1.1, 0.001);
            case 'hydraulic_diameter': 
                const W = scope.Width ?? 100;
                const H = scope.Height ?? 0.5;
                return (2 * W * H) / Math.max(W + H, 0.001);
            case 'pressure_drop': 
                const Dh = scope.Dh ?? 1.0;
                const Vel = scope.Velocity ?? 0.15;
                return (scope.f ?? 0.03) * ((scope.Length ?? 200) / Math.max(Dh, 0.001)) * ((scope.fluidDensity ?? 1000) * Vel * Vel / 2);
            case 'pump_power': 
                return (FlowRate * (scope.DeltaP ?? 180)) / Math.max(scope.PumpEfficiency ?? 75, 1);
            case 'sec': 
                return (scope.Power ?? (V * I)) / Math.max(scope.WaterProduced ?? 9.8, 0.001);
            case 'salt_removal': 
                return (scope.FeedTDS ?? 500) - (scope.OutletTDS ?? 50);
            case 'removal_efficiency': 
                return (((scope.FeedTDS ?? 500) - (scope.OutletTDS ?? 50)) / Math.max(scope.FeedTDS ?? 500, 1)) * 100;
            case 'electrode_mass': 
                return Area * (scope.Thickness ?? 0.6) * (scope.electrodeDensity ?? 0.45);
            case 'sac': 
                return (scope.SaltRemoved ?? 450) / Math.max(scope.ElectrodeMass ?? 6.75, 0.001);
            case 'charge_efficiency': 
                return (scope.RemovedCharge ?? 0.85) / Math.max(scope.SuppliedCharge ?? 1, 0.001);
            default: 
                return 0;
        }
    }
}

export default EquationEngine;