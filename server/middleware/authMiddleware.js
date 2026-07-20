"use strict";

const authMiddleware = {
    isAuthenticated: (req, res, next) => {
        if (req.session && req.session.user) {
            return next();
        }
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Please log in to access this resource."
        });
    },

    authorize: (allowedRoles) => {
        return (req, res, next) => {
            if (!req.session || !req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Please log in to access this resource."
                });
            }

            const userRole = req.session.user.role;
            if (allowedRoles.includes(userRole)) {
                return next();
            }

            return res.status(401).json({
                success: false,
                message: "Unauthorized: Insufficient permissions for this action."
            });
        };
    }
};

module.exports = authMiddleware;
