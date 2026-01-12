// middleware/roleMiddleware.js

// Usage: authorizeRoles('admin') or authorizeRoles('reviewer', 'admin')
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // assume req.user.role is set by your authMiddleware
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
};
