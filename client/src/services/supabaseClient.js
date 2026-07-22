import { createClient } from "@supabase/supabase-js";

const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const supabaseUrl = env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const isSupabaseConfigured = Boolean(
    env.VITE_SUPABASE_URL &&
    env.VITE_SUPABASE_ANON_KEY &&
    !env.VITE_SUPABASE_URL.includes("placeholder") &&
    !env.VITE_SUPABASE_URL.includes("your-project-id") &&
    !env.VITE_SUPABASE_ANON_KEY.includes("your-supabase")
);


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

export default supabase;
