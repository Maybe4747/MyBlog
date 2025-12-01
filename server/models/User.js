import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],
  education: [{
    school: String,
    degree: String,
    major: String,
    startDate: Date,
    endDate: Date
  }],
  socialLinks: {
    github: String,
    linkedin: String,
    twitter: String,
    weibo: String
  },
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public'
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showActivity: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建索引
userSchema.index({ userId: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

export default mongoose.model('User', userSchema);
