"use strict";

const supabase = require("../config/supabaseClient");

const authMiddleware = {
    isAuthenticated: async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Missing authentication token."
                });
            }

            const token = authHeader.split(" ")[1];
            if (!token || !supabase) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Invalid authentication session."
                });
            }

            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Expired or invalid token."
                });
            }

            // Fetch user role from user_roles table
            let role = "Engineer";
            let fullName = user.user_metadata?.full_name || "User";

            try {
                const { data: roleData } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", user.id)
                    .single();

                if (roleData && roleData.role) {
                    role = roleData.role;
                }

                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", user.id)
                    .single();

                if (profileData && profileData.full_name) {
                    fullName = profileData.full_name;
                }
            } catch (roleErr) {
                console.warn("[AUTH] Failed to fetch role/profile from Supabase:", roleErr.message);
            }

            req.user = {
                id: user.id,
                email: user.email,
                fullName,
                role
            };

            return next();
        } catch (e) {
            console.error("[AUTH] Middleware exception:", e);
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Token verification failed."
            });
        }
    },

    authorize: (allowedRoles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Authentication required."
                });
            }

            if (allowedRoles.includes(req.user.role)) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: "403 Unauthorized: Insufficient permissions for this resource."
            });
        };
    }
};

module.exports = authMiddleware;
