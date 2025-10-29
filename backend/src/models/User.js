const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['survivor','lawyer','admin','donor'], required: true },
  expertise: [String],
  licenseNumber: String,status: { type: String, enum: ['pending','approved'], default: function(){
    return (this.role === 'admin' || this.role === 'lawyer') ? 'pending' : 'approved';
  }},
}, { timestamps: true });

userSchema.methods.setPassword = async function(pwd){
  this.passwordHash = await bcrypt.hash(pwd, 12);
};
userSchema.methods.validatePassword = function(pwd){
  return bcrypt.compare(pwd, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
