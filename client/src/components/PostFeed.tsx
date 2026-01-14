import React from 'react';
import { FileTextIcon } from 'lucide-react';
import PostCard, { PostCardPost } from './PostCard';
import { Comment as PostComment } from '../api/posts';

export type ContentFilter = 'all' | 'my' | 'following' | 'posts' | 'articles' | 'files';

interface PostFeedProps {
  posts: PostCardPost[];
  currentUserId?: number;
  contentFilter?: ContentFilter;
  onFilterChange?: (filter: ContentFilter) => void;
  showFilter?: boolean; // 是否显示筛选标签
  showMyFilter?: boolean; // 是否显示"我的动态"筛选
  followingUserIds?: Set<number> | number[]; // 已关注的用户ID列表，用于"关注动态"筛选
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
  emptyStateTitle?: string; // 自定义空状态标题
  emptyStateDescription?: string; // 自定义空状态描述
  emptyStateAction?: React.ReactNode; // 自定义空状态操作按钮
  className?: string; // 自定义样式类
}

const PostFeed: React.FC<PostFeedProps> = ({
  posts,
  currentUserId,
  contentFilter = 'all',
  onFilterChange,
  showFilter = true,
  showMyFilter = true,
  followingUserIds,
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
  emptyStateTitle,
  emptyStateDescription,
  emptyStateAction,
  className = '',
}) => {
  // 根据筛选条件过滤posts
  const getFilteredPosts = (): PostCardPost[] => {
    if (contentFilter === 'my' && currentUserId) {
      // 只显示当前用户的内容
      return posts.filter(post => post.authorId === currentUserId);
    } else if (contentFilter === 'following' && followingUserIds) {
      // 只显示已关注用户的动态
      const followingIdsSet = followingUserIds instanceof Set 
        ? followingUserIds 
        : new Set(followingUserIds);
      return posts.filter(post => {
        if (!post.authorId) return false;
        return followingIdsSet.has(post.authorId);
      });
    } else if (contentFilter === 'posts') {
      // 只显示帖子（图片和视频）
      return posts.filter(post => post.contentType === 'image' || post.contentType === 'video');
    } else if (contentFilter === 'articles') {
      // 只显示文章
      return posts.filter(post => post.contentType === 'article');
    } else if (contentFilter === 'files') {
      // 只显示文件
      return posts.filter(post => post.contentType === 'file');
    }
    // 'all' 或其他情况，返回所有
    return posts;
  };

  const filteredPosts = getFilteredPosts();

  // 获取空状态的标题和描述
  const getEmptyState = () => {
    if (emptyStateTitle && emptyStateDescription) {
      return { title: emptyStateTitle, description: emptyStateDescription };
    }

    const states: Record<ContentFilter, { title: string; description: string }> = {
      all: { title: '暂无内容', description: '还没有任何分享' },
      my: { title: '暂无我的动态', description: '你还没有发布任何动态' },
      following: { title: '暂无关注动态', description: '你关注的人还没有发布任何动态' },
      posts: { title: '暂无帖子', description: '还没有任何帖子' },
      articles: { title: '暂无文章', description: '还没有任何文章' },
      files: { title: '暂无文件', description: '还没有任何文件' },
    };

    return states[contentFilter] || states.all;
  };

  const emptyState = getEmptyState();

  return (
    <div className={className}>
      {/* 内容筛选标签 */}
      {showFilter && onFilterChange && (
        <div className="mb-6 flex items-center space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              contentFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            全部
          </button>
          {showMyFilter && currentUserId && (
            <button
              onClick={() => onFilterChange('my')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                contentFilter === 'my'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              我的动态
            </button>
          )}
          {followingUserIds && (followingUserIds instanceof Set ? followingUserIds.size > 0 : followingUserIds.length > 0) && (
            <button
              onClick={() => onFilterChange('following')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                contentFilter === 'following'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              关注动态
            </button>
          )}
          <button
            onClick={() => onFilterChange('posts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              contentFilter === 'posts'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            帖子
          </button>
          <button
            onClick={() => onFilterChange('articles')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              contentFilter === 'articles'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            文章
          </button>
          <button
            onClick={() => onFilterChange('files')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              contentFilter === 'files'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            文件
          </button>
        </div>
      )}

      {/* 动态列表 */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-4">
          {filteredPosts.map((post, index) => (
            <PostCard
              key={`${post.id}-${post.contentType || 'default'}-${index}`}
              post={{
                ...post,
                author: {
                  ...post.author,
                  title: post.author.title || '',
                  company: post.author.company || '',
                },
              }}
              currentUserId={currentUserId}
              onLike={onLike}
              onToggleComments={onToggleComments}
              onShare={onShare}
              onEdit={onEdit}
              onDelete={onDelete}
              onImageModalOpen={onImageModalOpen}
              postComments={postComments}
              loadingComments={loadingComments}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
              expandedComments={expandedComments}
              showActions={showActions}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyState.title}</h3>
          <p className="text-gray-500 mb-4">{emptyState.description}</p>
          {emptyStateAction}
        </div>
      )}
    </div>
  );
};

export default PostFeed;

