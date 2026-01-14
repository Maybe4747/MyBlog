import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartIcon,
  MessageCircleIcon,
  ShareIcon,
  MoreHorizontalIcon,
  CalendarIcon,
  FileTextIcon,
  EditIcon,
  TrashIcon,
} from 'lucide-react';
import { getDefaultAvatar } from '../utils/commonUtils';
import CommentSection from './CommentSection';
import { Comment as PostComment } from '../api/posts';
import { savePostScrollMemory } from '../utils/scrollMemory';

export interface PostCardPost {
  id: string | number;
  originalId?: number;
  authorId?: number;
  author: {
    name: string;
    title?: string;
    company?: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares?: number;
  liked: boolean;
  title?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  contentType?: 'image' | 'article' | 'file' | 'video';
  mediaUrl?: string;
  readTime?: string;
  description?: string;
  summary?: string;
  visibility?: 'public' | 'followers' | 'private';
}

interface PostCardProps {
  post: PostCardPost;
  currentUserId?: number;
  onLike?: (postId: string | number) => void | Promise<void>;
  onToggleComments?: (postId: string | number) => void | Promise<void>;
  onShare?: (post: PostCardPost) => void | Promise<void>;
  onEdit?: (post: PostCardPost) => void;
  onDelete?: (postId: string | number) => void;
  onImageModalOpen?: (imageUrl: string, title: string, mediaType: 'image' | 'video') => void;
  postComments?: Record<string | number, PostComment[]>;
  loadingComments?: Record<string | number, boolean>;
  onAddComment?: (postId: string | number, content: string) => void | Promise<void>;
  onDeleteComment?: (postId: string | number, commentId: number) => void | Promise<void>;
  expandedComments?: Set<string | number>;
  showActions?: boolean; // 是否显示操作按钮（编辑/删除）
  className?: string; // 自定义样式类
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onToggleComments,
  onShare,
  onEdit,
  onDelete,
  onImageModalOpen,
  postComments = {},
  loadingComments = {},
  onAddComment,
  onDeleteComment,
  expandedComments = new Set(),
  showActions = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [localExpandedComments, setLocalExpandedComments] = useState<Set<string | number>>(expandedComments);
  const cardRef = useRef<HTMLDivElement>(null);

  // 判断是否是帖子类型（可点击跳转）
  const isPostType = post.contentType === 'image' || post.contentType === 'video' || (!post.contentType && post.mediaUrl);
  const postId = post.originalId || post.id;

  // 处理点赞
  const handleLike = async () => {
    if (onLike) {
      await onLike(post.id);
    }
  };

  // 处理展开/收起评论
  const handleToggleComments = async () => {
    if (onToggleComments) {
      await onToggleComments(post.id);
    }
    // 本地状态切换
    setLocalExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(post.id)) {
        next.delete(post.id);
      } else {
        next.add(post.id);
      }
      return next;
    });
  };

  // 处理分享
  const handleShare = async () => {
    if (onShare) {
      await onShare(post);
    }
  };

  // 处理编辑
  const handleEdit = () => {
    if (onEdit) {
      onEdit(post);
      setOpenMenuId(null);
    }
  };

  // 处理删除
  const handleDelete = () => {
    if (onDelete) {
      onDelete(post.id);
      setOpenMenuId(null);
    }
  };

  // 处理图片/视频预览
  const handleImageModalOpen = (imageUrl: string, title: string, mediaType: 'image' | 'video') => {
    if (onImageModalOpen) {
      onImageModalOpen(imageUrl, title, mediaType);
    }
  };

  // 处理添加评论
  const handleAddComment = async (content: string) => {
    if (onAddComment) {
      await onAddComment(post.id, content);
    }
  };

  // 处理删除评论
  const handleDeleteComment = (commentId: number) => {
    if (onDeleteComment) {
      onDeleteComment(post.id, commentId);
    }
  };

  const isCommentsExpanded = localExpandedComments.has(post.id);

  // 处理点击跳转
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 如果点击的是可交互元素（按钮、链接等），不跳转
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('.dropdown-menu-container') ||
      target.closest('textarea') ||
      target.closest('input') ||
      target.closest('video') ||
      target.closest('img')
    ) {
      return;
    }
    // 如果点击的是图片或视频容器（有 data-media-preview 属性），不跳转（这些元素有自己的预览功能）
    if (target.closest('[data-media-preview]')) {
      return;
    }
    // 只有帖子类型才跳转到详情页
    if (isPostType && postId) {
      // 保存当前位置和动态 ID
      const currentPath = window.location.pathname;
      const scrollPosition = cardRef.current 
        ? cardRef.current.getBoundingClientRect().top + window.scrollY
        : window.scrollY;
      
      savePostScrollMemory(currentPath, postId, scrollPosition);
      navigate(`/posts/${postId}`);
    }
  };

  return (
    <div
      ref={cardRef}
      key={post.id}
      data-post-id={postId}
      className={`bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-2xl shadow-lg border border-blue-100/60 overflow-hidden hover:shadow-xl transition-all duration-300 backdrop-blur-sm ${className}`}
      onClick={handleCardClick}
      style={{ cursor: isPostType ? 'pointer' : 'default' }}
    >
      {/* Post header */}
      <div className="p-6 pb-4 bg-gradient-to-r from-blue-50/30 to-purple-50/20 border-b border-blue-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to={`/profile/${post.author.name}`} className="relative block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-md opacity-30"></div>
              <img
                className="h-12 w-12 rounded-full ring-2 ring-white/80 relative z-10 cursor-pointer hover:ring-blue-300 transition-all"
                src={post.author.avatar || getDefaultAvatar(post.author.name)}
                alt={post.author.name}
              />
            </Link>
            <div className="ml-4">
              <Link to={`/profile/${post.author.name}`} className="block">
                <h4 className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                  {post.author.name}
                </h4>
              </Link>
              {(post.author.title || post.author.company) && (
                <p className="text-sm text-gray-600 font-medium">
                  {post.author.title || ''}
                  {post.author.title && post.author.company && ' · '}
                  {post.author.company || ''}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                <CalendarIcon className="w-3 h-3 mr-1" />
                {post.timestamp}
              </p>
            </div>
          </div>
          {showActions && (
            <div className="relative dropdown-menu-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === post.id ? null : post.id);
                }}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white/60 rounded-xl transition-all"
              >
                <MoreHorizontalIcon className="h-5 w-5" />
              </button>

              {/* 下拉菜单 - 只对作者显示编辑和删除 */}
              {openMenuId === post.id && post.authorId === currentUserId && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit();
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                    >
                      <EditIcon className="w-4 h-4 text-blue-500" />
                      <span>编辑</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>删除</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post content */}
      <div className="px-6 py-5">
        <p className="text-gray-800 leading-relaxed font-medium">{post.content}</p>

        {/* 根据内容类型显示不同的媒体内容 */}
        {post.contentType === 'image' && post.mediaUrl && (
          <div className="mt-5">
            <div
              data-media-preview
              className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300 shadow-lg hover:shadow-xl"
              onClick={(e) => {
                e.stopPropagation();
                handleImageModalOpen(post.mediaUrl || '', post.title || '分享的图片', 'image');
              }}
            >
              <img
                src={post.mediaUrl}
                alt={post.title || '分享的图片'}
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        )}

        {post.contentType === 'video' && post.mediaUrl && (
          <div className="mt-5">
            <div
              data-media-preview
              className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl cursor-pointer hover:scale-[1.02] transition-transform duration-300"
              onClick={(e) => {
                e.stopPropagation();
                handleImageModalOpen(post.mediaUrl || '', post.title || '分享的视频', 'video');
              }}
            >
              <video
                src={post.mediaUrl}
                controls
                className="w-full h-80 object-cover"
                onClick={(e) => e.stopPropagation()}
              >
                您的浏览器不支持视频播放
              </video>
            </div>
          </div>
        )}

        {post.contentType === 'article' && (
          <div
            className="mt-5 p-5 bg-gradient-to-br from-green-50/50 to-emerald-50/30 rounded-2xl border border-green-100/60 cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all duration-300 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              // 提取原始ID（如果是字符串格式如 "article-1"，提取数字部分）
              let articleId = post.originalId;
              if (!articleId && typeof post.id === 'string' && post.id.startsWith('article-')) {
                articleId = parseInt(post.id.replace('article-', ''));
              } else if (!articleId) {
                articleId = typeof post.id === 'number' ? post.id : parseInt(String(post.id));
              }
              // 保存当前位置和动态 ID
              const currentPath = window.location.pathname;
              const scrollPosition = cardRef.current 
                ? cardRef.current.getBoundingClientRect().top + window.scrollY
                : window.scrollY;
              savePostScrollMemory(currentPath, `article-${articleId}`, scrollPosition);
              navigate(`/articles/${articleId}`);
            }}
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100/50 rounded-xl mr-4">
                <FileTextIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate mb-1">{post.title}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{post.description || post.summary || '文章摘要'}</p>
              </div>
              <svg className="w-5 h-5 text-green-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}

        {post.contentType === 'file' && (
          <div className="mt-5 p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-2xl border border-blue-100/60 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100/50 rounded-xl mr-4">
                <FileTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate mb-1">{post.title || post.originalName}</p>
                <p className="text-xs text-gray-600 mb-1">{post.mimeType || '文件'}</p>
                <p className="text-xs text-gray-500">{post.size ? `${(post.size / 1024).toFixed(1)} KB` : '未知大小'}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // 如果文件有 fileUrl，直接使用 TOS URL 下载
                  if (post.mediaUrl) {
                    window.open(post.mediaUrl, '_blank');
                  } else {
                    // 保存当前位置和动态 ID
                    const currentPath = window.location.pathname;
                    const scrollPosition = cardRef.current 
                      ? cardRef.current.getBoundingClientRect().top + window.scrollY
                      : window.scrollY;
                    const fileId = post.originalId || post.id;
                    savePostScrollMemory(currentPath, `file-${fileId}`, scrollPosition);
                    // 否则跳转到文件详情页
                    navigate(`/files/${fileId}`);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 text-sm font-semibold shadow-sm hover:shadow-md transition-all"
              >
                下载
              </button>
            </div>
          </div>
        )}

        {!post.contentType && post.originalName && (
          <div className="mt-5 p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-2xl border border-blue-100/60 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100/50 rounded-xl mr-4">
                <FileTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate mb-1">{post.title || post.originalName}</p>
                <p className="text-xs text-gray-600 mb-1">{post.mimeType || '文件'}</p>
                <p className="text-xs text-gray-500">{post.size ? `${(post.size / 1024).toFixed(1)} KB` : '未知大小'}</p>
              </div>
              <a
                href={`/api/files/download/${post.originalId || post.id}`}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                下载
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Post actions */}
      <div className="px-6 py-4 border-t border-blue-100/50 bg-gradient-to-r from-blue-50/20 to-purple-50/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onLike && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                  post.liked
                    ? 'text-red-600 bg-red-50/50 hover:bg-red-100/50'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50/30'
                }`}
              >
                <HeartIcon className={`h-5 w-5 ${post.liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-semibold">{post.likes}</span>
              </button>
            )}
            {onToggleComments && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleComments();
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50/30 transition-all"
              >
                <MessageCircleIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">{post.comments}</span>
              </button>
            )}
            {onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 hover:text-green-600 hover:bg-green-50/30 transition-all"
              >
                <ShareIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">分享</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 评论区域 */}
      {isCommentsExpanded && (onAddComment || onDeleteComment) && (
        <CommentSection
          comments={postComments[post.id] || []}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          currentUserId={currentUserId}
          loading={loadingComments[post.id]}
        />
      )}
    </div>
  );
};

export default PostCard;

