// controllers/authController.js
// Handles user registration, login, and profile management.
// Pattern: each function is async, wrapped in try/catch.
// On success → return data. On failure → pass error to next(err).

const User = require('../models/User');

// ─── @route   POST /api/auth/register ────────────────────────────────────────
// @desc    Register a new user
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create user — password gets hashed in the pre-save hook
    const user = await User.create({ name, email, password, phone });

    // Generate JWT
    const token = user.generateToken();

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error); // Passes to global error handler
  }
};

// ─── @route   POST /api/auth/login ───────────────────────────────────────────
// @desc    Authenticate user and return JWT
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user — we need password for comparison, so we explicitly select it
    // (Remember: password has select:false in the schema)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      // Don't reveal whether the email exists — security best practice
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated' });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = user.generateToken();

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @route   GET /api/auth/profile ──────────────────────────────────────────
// @desc    Get current user's profile
// @access  Private (requires protect middleware)
const getProfile = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── @route   PUT /api/auth/profile ──────────────────────────────────────────
// @desc    Update user profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true } // new:true returns the updated doc
    );

    res.json({ success: true, message: 'Profile updated!', user });
  } catch (error) {
    next(error);
  }
};

// ─── @route   PUT /api/auth/change-password ──────────────────────────────────
// @desc    Change password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword; // pre-save hook will hash this
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
