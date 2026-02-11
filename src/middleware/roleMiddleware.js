function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized'));
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('Forbidden: insufficient permissions'));
    }

    return next();
  };
}

module.exports = {
  authorizeRoles,
};

