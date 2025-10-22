const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  projectType: {
    type: String,
    required: true,
    enum: ['reforestation', 'renewable_energy', 'methane_capture', 'direct_air_capture', 'other']
  },
  costPerKg: {
    type: Number,
    required: true,
    min: 0
  },
  treasuryAccount: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^0\.0\.\d+$/.test(v);
      },
      message: 'Invalid Hedera account ID format'
    }
  },
  totalCapacity: {
    type: Number,
    required: true,
    min: 0
  },
  availableCredits: {
    type: Number,
    required: true,
    min: 0
  },
  verificationStandard: {
    type: String,
    enum: ['VCS', 'CDM', 'Gold_Standard', 'CAR', 'other'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  images: [String],
  certificationUrl: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);