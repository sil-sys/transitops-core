const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');

// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return next(new ApiError(400, 'Please provide name, email, password, and role'));
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ApiError(400, 'User with this email already exists'));
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ApiError(400, 'Please provide email and password'));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get current logged-in user
// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

module.exports = { registerUser, loginUser, getMe };