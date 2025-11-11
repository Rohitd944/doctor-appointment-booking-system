const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getMyPatientAppointments,
  getMyDoctorAppointments,
  getAllAppointments,
  getBookedSlots,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('patient'), bookAppointment);
router.get('/', protect, authorize('patient'), getMyPatientAppointments);
router.get('/doctor', protect, authorize('doctor'), getMyDoctorAppointments);
router.get('/admin', protect, authorize('admin'), getAllAppointments);
router.get('/booked', protect, getBookedSlots); // Used by patients
router.put('/cancel/:id', protect, authorize('patient', 'admin'), cancelAppointment);

module.exports = router;