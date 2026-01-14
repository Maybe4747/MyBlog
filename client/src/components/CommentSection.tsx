import React, { useState, useEffect, useRef } from 'react';
import { MessageCircleIcon, SendIcon, Trash2Icon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDefaultAvatar } from '../utils/commonUtils';

export interface Comment {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  username: string;
  avatar: string | null;
}

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment?: (commentId: number) => Promise<void>;
  currentUserId?: number;
  loading?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  onAddComment,
  onDeleteComment,
  currentUserId,
  loading = false
}) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting || !user) return;

    setIsSubmitting(true);
    try {
      await onAddComment(commentText.trim());
      setCommentText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('添加评论失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!onDeleteComment || deletingId) return;
    
    if (!window.confirm('确定要删除这条评论吗？')) return;

    setDeletingId(commentId);
    try {
      await onDeleteComment(commentId);
    } catch (error) {
      console.error('删除评论失败:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentText(e.target.value);
    // 自动调整高度
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      {/* 评论输入框 */}
      {user && (
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleSubmit} className="flex items-start space-x-3">
            <img
              className="h-8 w-8 rounded-full flex-shrink-0"
              src={user.avatar || getDefaultAvatar(user.username)}
              alt={user.username}
            />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={commentText}
                onChange={handleTextareaChange}
                placeholder="写下你的评论..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                maxLength={1000}
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {commentText.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <SendIcon className="w-4 h-4" />
                  <span>{isSubmitting ? '发送中...' : '发送'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 评论列表 */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无评论，快来发表第一条评论吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <img
                  className="h-10 w-10 rounded-full flex-shrink-0"
                  src={comment.avatar || getDefaultAvatar(comment.username)}
                  alt={comment.username}
                />
                <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{comment.username}</span>
                      <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                    </div>
                    {onDeleteComment && (currentUserId === comment.user_id || user?.id === comment.user_id) && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="删除评论"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;

