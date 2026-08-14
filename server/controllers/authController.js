const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Family = require('../models/family');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password)'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || ''
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        familyId: user.familyId,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data provided'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.status(200).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        familyId: user.familyId,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is populated by protect middleware
    res.status(200).json({
      success: true,
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      familyId: req.user.familyId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Create a family group
// @route   POST /api/auth/family/create
// @access  Private
const createFamily = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide a family group name' });
    }

    const family = await Family.create({
      name,
      ownerId: req.user._id,
      members: [req.user._id]
    });

    // Update creator's familyId reference
    req.user.familyId = family._id;
    await req.user.save();

    res.status(201).json({ success: true, data: family });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join a family group
// @route   POST /api/auth/family/join
// @access  Private
const joinFamily = async (req, res) => {
  try {
    const { familyId } = req.body;
    if (!familyId) {
      return res.status(400).json({ success: false, message: 'Please provide a valid family Invite Code' });
    }

    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family group not found' });
    }

    // Check if user is already a member
    if (family.members.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You are already a member of this family group' });
    }

    family.members.push(req.user._id);
    await family.save();

    // Update user's familyId reference
    req.user.familyId = family._id;
    await req.user.save();

    res.status(200).json({ success: true, data: family });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get family group details
// @route   GET /api/auth/family/:familyId
// @access  Private
const getFamilyDetails = async (req, res) => {
  try {
    const family = await Family.findOne({
      _id: req.params.familyId,
      members: req.user._id
    }).populate('members', 'name email phone');

    if (!family) {
      return res.status(404).json({ success: false, message: 'Family group not found or access denied' });
    }

    res.status(200).json({ success: true, data: family });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  createFamily,
  joinFamily,
  getFamilyDetails
};
