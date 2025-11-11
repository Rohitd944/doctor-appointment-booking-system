const Appointment = require('../models/appointmentModel');

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private (Patient)
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;
    
    // Check if slot is already taken
    const existingAppointment = await Appointment.findOne({ 
      doctorId, 
      date, 
      time, 
      status: { $in: ['Confirmed', 'Pending'] } // <-- FIX: Check both
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This time slot is already booked. Please choose another.' });
    }

    const appointment = new Appointment({
      patientId: req.user.id,
      doctorId,
      date,
      time,
      status: 'Confirmed', // Auto-confirm for this project
    });

    const createdAppointment = await appointment.save();
    res.status(201).json(createdAppointment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get appointments for the logged-in patient
// @route   GET /api/appointments/mypatient
// @access  Private (Patient)
const getMyPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id })
      .populate('doctorId', 'name specialty')
      .sort({ date: -1 }); // Show newest first
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get upcoming appointments for the logged-in doctor
// @route   GET /api/appointments/mydoctor
// @access  Private (Doctor)
const getMyDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctorId: req.user.id,
      status: { $in: ['Pending', 'Confirmed'] },
      date: { $gte: new Date().toISOString().split('T')[0] } // From today onwards
    })
      // ✅ 'mobile' ko yahaan add kar diya hai
      .populate('patientId', 'name email mobile')
      .sort({ date: 'asc' });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get all appointments (for Admin)
// @route   GET /api/appointments/all
// @access  Private (Admin)
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('doctorId', 'name')
      .populate('patientId', 'name')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get booked time slots for a doctor on a specific date
// @route   GET /api/appointments/booked
// @access  Private
const getBookedSlots = async (req, res) => {
  const { doctorId, date } = req.query;
  try {
    const appointments = await Appointment.find({
      doctorId,
      date,
      status: { $in: ['Confirmed', 'Pending'] } // <-- FIX: Check both statuses
    });
    
    const bookedTimes = appointments.map(appt => appt.time);
    res.json(bookedTimes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Cancel an appointment
// @route   PUT /api/appointments/cancel/:id
// @access  Private (Patient or Admin)
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Allow patient OR admin to cancel
    if (appointment.patientId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized to cancel this appointment' });
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  bookAppointment,
  getMyPatientAppointments,
  getMyDoctorAppointments,
  getAllAppointments,
  getBookedSlots,
  cancelAppointment,
};