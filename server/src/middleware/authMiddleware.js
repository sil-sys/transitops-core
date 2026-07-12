const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// Verifies JWT and attaches user to req
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return next(new ApiError(401, 'User no longer exists'));
      }

      next();
    } catch (error) {
      return next(new ApiError(401, 'Not authorized, token invalid'));
    }
  } else {
    return next(new ApiError(401, 'Not authorized, no token'));
  }
};

// Restricts route to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role '${req.user.role}' is not authorized to access this route`)
      );
    }
    next();
  };
};

module.exports = { protect, authorize };