const MedicalHistory = require('../models/medicalHistoryModel');

// @desc    Get medical history for a specific patient
// @route   GET /api/history
// @access  Private (Patient for self, Doctor/Admin for any)
const getPatientHistory = async (req, res) => {
  try {
    // For patients, use their own ID
    const patientId = req.user.role === 'patient' ? req.user.id : req.query.patientId;
    
    // If doctor/admin and no patientId provided
    if ((req.user.role === 'doctor' || req.user.role === 'admin') && !patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Doctors and Admins can view any patient's history.
    let history = await MedicalHistory.findOne({ patientId })
      .populate('records.treatedByDoctor', 'name specialty')
      .sort({ 'records.date': -1 });

    if (!history) {
      // If no history exists, create one for the doctor to add to
      if (req.user.role === 'doctor' || req.user.role === 'admin') {
           history = await MedicalHistory.create({ patientId, records: [] });
      } else {
           // For patient, just return empty
           return res.json({ patientId, records: [] });
      }
    }
    
    // Sort records descending (newest first)
    history.records.sort((a, b) => b.date - a.date);

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Add a new record to a patient's medical history
// @route   POST /api/history/:patientId
// @access  Private (Doctor or Admin only)
const addHistoryRecord = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { diagnosis, notes } = req.body;

    if (!diagnosis || !notes) {
      return res.status(400).json({ message: 'Diagnosis and notes are required' });
    }

    let history = await MedicalHistory.findOne({ patientId });

    // If history doesn't exist, create it
    if (!history) {
      history = new MedicalHistory({ patientId, records: [] });
    }

    const newRecord = {
      diagnosis,
      notes,
      treatedByDoctor: req.user.id, // The logged-in doctor/admin
    };

    history.records.unshift(newRecord); // Add new record to the top
    await history.save();
    
    // Populate the new record before sending it back
    const populatedHistory = await MedicalHistory.findOne({ patientId: patientId })
      .populate('records.treatedByDoctor', 'name specialty')
      .sort({ 'records.date': -1 });
      
    // Sort records descending (newest first)
    populatedHistory.records.sort((a, b) => b.date - a.date);

    res.status(201).json(populatedHistory);

  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  getPatientHistory,
  addHistoryRecord,
};