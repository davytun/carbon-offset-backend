const mongoose = require('mongoose');

const emissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emissionType: {
    type: String,
    required: true,
    enum: ['travel', 'energy', 'food', 'other']
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  },
  co2eKg: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    maxlength: 500
  },
  // Blockchain transaction details
  hederaTransactionId: {
    type: String,
    required: true
  },
  consensusTimestamp: {
    type: String,
    required: true
  },
  topicId: {
    type: String,
    required: true
  },
  calculationMethod: {
    type: String,
    enum: ['internal', 'external_api', 'provided'],
    default: 'internal'
  }
}, {
  timestamps: true
});

emissionSchema.index({ userId: 1, date: -1 });
emissionSchema.index({ hederaTransactionId: 1 }, { unique: true });

module.exports = mongoose.model('Emission', emissionSchema);