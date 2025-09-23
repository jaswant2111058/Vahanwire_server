const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    lowercase: true,
  },
  phone: {
    type: String,
  },
  avatar: {
    type: String,
    enum: ['yellow', 'blue', 'green', 'red', 'purple'],
    default: 'blue'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

module.exports = mongoose.model('UsersVahan', userSchema);