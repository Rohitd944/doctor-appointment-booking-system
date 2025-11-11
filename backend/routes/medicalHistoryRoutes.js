const express = require('express');
const router = express.Router();
const {
  getPatientHistory,
  addHistoryRecord,
} = require('../controllers/medicalHistoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getPatientHistory);
router.post('/:patientId', protect, authorize('doctor', 'admin'), addHistoryRecord);

module.exports = router;