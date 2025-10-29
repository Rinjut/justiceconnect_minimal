const mongoose = require('mongoose');
const caseSchema = new mongoose.Schema({
  survivor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  intake: { type: mongoose.Schema.Types.ObjectId, ref: 'Intake' },
  status: { type: String, enum: ['new','assigned','in_progress','closed'], default: 'new' }
}, { timestamps: true });
module.exports = mongoose.model('Case', caseSchema);
