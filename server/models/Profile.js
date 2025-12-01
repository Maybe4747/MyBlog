import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    unique: true
  },
  files: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      enum: ['document', 'image', 'video', 'audio', 'other'],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
    },
    tags: [{
      type: String,
      trim: true
    }],
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public'
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    likes: [{
      userId: Number,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    comments: [{
      userId: Number,
      username: String,
      content: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalViews: {
    type: Number,
    default: 0
  },
  totalDownloads: {
    type: Number,
    default: 0
  },
  followerCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 创建索引
profileSchema.index({ userId: 1 });
profileSchema.index({ 'files.tags': 1 });
profileSchema.index({ 'files.category': 1 });
profileSchema.index({ 'files.visibility': 1 });

export default mongoose.model('Profile', profileSchema);
