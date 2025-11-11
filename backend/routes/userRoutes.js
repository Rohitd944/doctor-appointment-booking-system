const express = require('express');
const router = express.Router();
const {
  registerUser,
  setUserPassword,
  loginUser,
  getUserProfile,
  getDoctors,
  getAllUsers,
  getStaff,
  getAllPatients, // ✅ Naya import
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.put('/set-password', setUserPassword); // Ye abhi use nahi ho raha
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/doctors', getDoctors); // Public
router.get('/staff', getStaff); // Public (for login)

router.get('/all-doctors', protect, authorize('admin'), getDoctors);
router.get('/all-staff', protect, authorize('admin'), getStaff);
router.get('/all-patients', protect, authorize('admin'), getAllPatients); 

module.exports = router;