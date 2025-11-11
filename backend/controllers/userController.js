const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new PATIENT
const registerUser = async (req, res) => {
  try {
    // ✅ 1. 'mobile' ko yahaan add karein
    const { name, email, password, role, mobile } = req.body;

    // ✅ 2. 'mobile' ko validation mein add karein
    if (!name || !email || !password || !role || !mobile) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }
    
    if (role !== 'patient') {
        return res.status(400).json({ message: 'This form is only for patient registration.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Password hashing ab model mein hoga
    const user = await User.create({
      name,
      email,
      mobile, // ✅ 3. 'mobile' ko create mein add karein
      password,
      role: 'patient',
      specialty: 'N/A'
    });

    if (user) {
      // Register hone ke baad seedha login data bhej dein
      res.status(201).json({
        _id: user._id, // Dashboard.html ko _id chahiye
        name: user.name,
        email: user.email,
        mobile: user.mobile, // <-- ✅ 4. 'mobile' ko response mein add karein
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};


// @desc    Set password for existing Doctor/Staff (YE ABHI ISTEMAL NAHI HO RAHA HAI)
const setUserPassword = async (req, res) => {
  // ... (aapka code) ...
};


// @desc    Login user
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body; 

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Please provide email, password, and role' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const isDefaultPassword = await bcrypt.compare('DEFAULT_PASSWORD_NOT_SET', user.password);
    if (isDefaultPassword) {
        return res.status(401).json({ message: 'Password not set. Please contact admin.' });
    }

    if (await bcrypt.compare(password, user.password)) {
      
      if (user.role !== role) {
        return res.status(401).json({ message: 'Incorrect role selected for this user.' });
      }

      // ✅ BUG 6 FIXED: Response ko { user: {...} } object mein bhejein
      res.json({
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile, // <-- ✅ 'mobile' ko response mein add karein
            role: user.role,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get user profile
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get all users (for Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};


// @desc    Get all doctors
const getDoctors = async (req, res) => {
  try {
    // ✅ 'mobile' ko select karein
    const doctors = await User.find({ role: 'doctor' }).select('_id name specialty email mobile');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get all staff/admins
const getStaff = async (req, res) => {
  try {
    // ✅ 'mobile' ko select karein
    const staff = await User.find({ role: 'admin' }).select('_id name email mobile');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// ✅ BUG 7 FIXED: Naya function add karein
// @desc    Get all patients
const getAllPatients = async (req, res) => {
  try {
    // ✅ 'mobile' ko select karein
    const patients = await User.find({ role: 'patient' }).select('_id name email mobile');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};


module.exports = {
  registerUser,
  setUserPassword,
  loginUser,
  getUserProfile,
  getAllUsers,
  getDoctors,
  getStaff,
  getAllPatients, // ✅ Ise export karein
};