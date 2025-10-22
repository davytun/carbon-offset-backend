const mongoose = require('mongoose');

const offsetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: String,
    required: true
  },
  projectName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  totalCo2eKg: {
    type: Number,
    required: true,
    min: 0
  },
  totalHbarCost: {
    type: Number,
    required: true,
    min: 0
  },
  userHederaAddress: {
    type: String,
    required: true
  },
  // Blockchain transaction IDs
  hbarTransactionId: {
    type: String,
    required: true
  },
  tokenMintTransactionId: {
    type: String,
    required: true
  },
  tokenId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  redemptionTransactionId: {
    type: String,
    sparse: true
  },
  redeemedAt: {
    type: Date
  }
}, {
  timestamps: true
});

offsetSchema.index({ userId: 1, createdAt: -1 });
offsetSchema.index({ hbarTransactionId: 1 }, { unique: true });
offsetSchema.index({ tokenMintTransactionId: 1 }, { unique: true });

module.exports = mongoose.model('Offset', offsetSchema);