import { useState } from 'react';
import { Link } from 'react-router';
import { likeFile, unlikeFile } from '../api/profiles';
import { emitLike } from '../services/socket';

const FileCard = ({ file, onLikeUpdate }) => {
  const [liked, setLiked] = useState(file.liked || false);
  const [likeCount, setLikeCount] = useState(file.likeCount || file.likes?.length || 0);
  const [loading, setLoading] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    try {
      setLoading(true);

      if (liked) {
        await unlikeFile(file._id);
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await likeFile(file._id);
        setLiked(true);
        setLikeCount(prev => prev + 1);

        // 发送Socket事件
        emitLike({
          targetUserId: file.userId,
          targetType: 'file',
          targetId: file._id
        });
      }

      if (onLikeUpdate) {
        onLikeUpdate(file._id, !liked);
      }
    } catch (err) {
      console.error('点赞失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = `/api/files/download/${file._id}`;
    link.download = file.originalName;
    link.click();
  };

  const getFileIcon = (category) => {
    switch (category) {
      case 'image':
        return (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'video':
        return (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'audio':
        return (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center border border-white/10">
            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        );
      case 'document':
        return (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500/20 to-slate-500/20 flex items-center justify-center border border-white/10">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </div>
        );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInDays < 1) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Link
      to={`/file/${file._id}`}
      className="group block backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl"
    >
      {/* File Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getFileIcon(file.category)}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-lg group-hover:text-purple-300 transition-colors truncate">
              {file.title}
            </h3>
            <p className="text-white/60 text-sm truncate">{file.originalName}</p>
          </div>
        </div>
        <span className="text-xs text-white/50 whitespace-nowrap ml-2">
          {formatFileSize(file.size)}
        </span>
      </div>

      {/* File Description */}
      {file.description && (
        <p className="text-white/70 mb-4 line-clamp-2">{file.description}</p>
      )}

      {/* Tags */}
      {file.tags && file.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {file.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white/80 rounded-lg text-xs border border-white/10"
            >
              #{tag}
            </span>
          ))}
          {file.tags.length > 3 && (
            <span className="px-3 py-1 bg-white/10 text-white/60 rounded-lg text-xs border border-white/10">
              +{file.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-white/60 mb-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {likeCount}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {file.commentCount || file.comments?.length || 0}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {file.downloadCount || 0}
          </span>
        </div>
        <span>{formatDate(file.uploadedAt)}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
            liked
              ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/30 hover:from-pink-500/30 hover:to-rose-500/30'
              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
          }`}
        >
          <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-medium">{likeCount}</span>
        </button>

        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="font-medium">Download</span>
        </button>
      </div>
    </Link>
  );
};

export default FileCard;
