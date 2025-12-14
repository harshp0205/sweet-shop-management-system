const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { validateRequiredFields, validateEmail } = require('../utils/validators');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Validate required fields
  const validation = validateRequiredFields(req.body, ['name', 'email', 'password']);
  if (!validation.isValid) {
    return next(new ErrorResponse(validation.message, 400));
  }

  // Validate email format
  if (!validateEmail(email)) {
    return next(new ErrorResponse('Please provide a valid email', 400));
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ErrorResponse('User with this email already exists', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user'
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate required fields
  const validation = validateRequiredFields(req.body, ['email', 'password']);
  if (!validation.isValid) {
    return next(new ErrorResponse(validation.message, 400));
  }

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await user.matchPassword(password);

  if (!isPasswordValid) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});
