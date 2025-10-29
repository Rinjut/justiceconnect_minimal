const mongoose = require('mongoose');
const intakeSchema = new mongoose.Schema({
  survivor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  needCategory: { type: String, enum: ['protective','immigration','housing','other'], required: true },
  narrative: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Intake', intakeSchema);
