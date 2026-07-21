"use strict";

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });
        console.log("  [SUPABASE] Client initialized successfully.");
    } catch (e) {
        console.warn("  [SUPABASE] Failed to initialize Supabase client:", e.message);
    }
} else {
    console.log("  [SUPABASE] Credentials not set. Running with local storage fallback.");
}

module.exports = supabase;
