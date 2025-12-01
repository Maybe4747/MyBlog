import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
  followerId: {
    type: Number,
    required: true
  },
  followingId: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 复合唯一索引，防止重复关注
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// 查询索引
followSchema.index({ followerId: 1 });
followSchema.index({ followingId: 1 });

export default mongoose.model('Follow', followSchema);
