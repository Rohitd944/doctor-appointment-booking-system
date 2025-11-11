const mongoose = require('mongoose');

// This sub-schema defines a single entry in the history
const historyRecordSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  diagnosis: { type: String, required: true },
  notes: { type: String, required: true },
  treatedByDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

const medicalHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  records: [historyRecordSchema],
}, { timestamps: true });

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);