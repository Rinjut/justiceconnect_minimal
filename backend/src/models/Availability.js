const mongoose = require('mongoose');
const availabilitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  slots: [{ start: Date, end: Date }]
}, { timestamps: true });
module.exports = mongoose.model('Availability', availabilitySchema);
