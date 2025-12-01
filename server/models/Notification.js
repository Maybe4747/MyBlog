import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'mention', 'message', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  fromUserId: {
    type: Number
  },
  fromUsername: {
    type: String
  },
  relatedType: {
    type: String,
    enum: ['file', 'comment', 'profile', 'message']
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// 索引
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ relatedType: 1, relatedId: 1 });

export default mongoose.model('Notification', notificationSchema);
