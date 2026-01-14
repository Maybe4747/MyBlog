import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchIcon, UsersIcon, FileTextIcon, ImageIcon, FileIcon, HeartIcon, MessageCircleIcon, EyeIcon } from 'lucide-react';
import { searchAll } from '../../api/search';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultAvatar } from '../../utils/commonUtils';
import { followUser, unfollowUser } from '../../api/social';
import PostCard, { PostCardPost } from '../../components/PostCard';
import PostFeed from '../../components/PostFeed';
import { togglePostLike, addPostComment, getPostComments, deletePostComment, Comment as PostComment } from '../../api/posts';
import { toggleArticleLike, addArticleComment, getArticleComments, deleteArticleComment } from '../../api/articles';
import { likeFile, unlikeFile, commentOnFile, getFileComments, deleteFileComment } from '../../api/profiles';

interface SearchResult {
  id: number;
  type: 'user' | 'post' | 'article' | 'file';
  [key: string]: any;
}

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const queryFromUrl = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'posts' | 'articles' | 'files'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users: any[];
    posts: any[];
    articles: any[];
    files: any[];
  }>({
    users: [],
    posts: [],
    articles: [],
    files: []
  });
  const [pagination, setPagination] = useState({
    users: { page: 1, limit: 20, total: 0 },
    posts: { page: 1, limit: 20, total: 0 },
    articles: { page: 1, limit: 20, total: 0 },
    files: { page: 1, limit: 20, total: 0 }
  });

  // 评论相关状态
  const [expandedComments, setExpandedComments] = useState<Set<string | number>>(new Set());
  const [postComments, setPostComments] = useState<Record<string | number, PostComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string | number, boolean>>({});

  // 从URL参数初始化搜索
  useEffect(() => {
    if (queryFromUrl) {
      performSearch(queryFromUrl);
    }
  }, []);

  // 执行搜索
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults({ users: [], posts: [], articles: [], files: [] });
      return;
    }

    setLoading(true);
    try {
      // 使用统一的搜索接口，一次请求获取所有结果
      const response: any = await searchAll(query, { page: 1, limit: 10 });
      
      // API拦截器返回的是 { code: 0, data: { users: [...], posts: [...], articles: [...], files: [...], pagination: {...} }, msg: '...' }
      // 需要处理可能的嵌套结构
      let resultData = response?.data || response || {};
      
      // 如果resultData还有data字段，说明是双重嵌套
      if (resultData.data && (resultData.data.users || resultData.data.posts)) {
        resultData = resultData.data;
      }
      
      console.log('搜索响应完整:', JSON.stringify(response, null, 2));
      console.log('搜索结果数据:', resultData);
      console.log('用户结果:', resultData.users);
      console.log('用户结果数量:', resultData.users?.length || 0);
      console.log('用户结果详情:', JSON.stringify(resultData.users, null, 2));
      
      setResults({
        users: Array.isArray(resultData.users) ? resultData.users : [],
        posts: Array.isArray(resultData.posts) ? resultData.posts : [],
        articles: Array.isArray(resultData.articles) ? resultData.articles : [],
        files: Array.isArray(resultData.files) ? resultData.files : []
      });

      setPagination({
        users: resultData.pagination?.users || { page: 1, limit: 10, total: 0 },
        posts: resultData.pagination?.posts || { page: 1, limit: 10, total: 0 },
        articles: resultData.pagination?.articles || { page: 1, limit: 10, total: 0 },
        files: resultData.pagination?.files || { page: 1, limit: 10, total: 0 }
      });
    } catch (error) {
      console.error('搜索失败:', error);
      console.error('搜索错误详情:', {
        message: (error as any)?.message,
        response: (error as any)?.response?.data,
        stack: (error as any)?.stack
      });
      setResults({ users: [], posts: [], articles: [], files: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // 处理搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
      performSearch(searchQuery);
    }
  };

  // 标签页切换时重新搜索
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  }, [activeTab, performSearch, searchQuery]);

  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set());
  const [followingLoading, setFollowingLoading] = useState<Record<number, boolean>>({});

  // 渲染用户结果
  const renderUser = (userItem: any) => {
    return (
      <div
        key={userItem.id}
        className="p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-b-0"
      >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <img
            className="h-12 w-12 rounded-full object-cover cursor-pointer"
            src={userItem.avatar || getDefaultAvatar(userItem.username)}
            alt={userItem.username}
            onClick={() => navigate(`/profile/${userItem.username}`)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = getDefaultAvatar(userItem.username);
            }}
          />
          <div className="ml-4 flex-1">
            <h4 
              className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={() => navigate(`/profile/${userItem.username}`)}
            >
              {userItem.username}
            </h4>
            {userItem.position && (
              <p className="text-xs text-gray-600 mt-1">{userItem.position}</p>
            )}
            {userItem.company && (
              <p className="text-xs text-gray-500">{userItem.company}</p>
            )}
            {userItem.bio && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{userItem.bio}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
        {user && userItem.id !== user.id && (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (!user) {
                navigate('/login');
                return;
              }
              
              const userId = userItem.id;
              const isCurrentlyFollowing = followingUsers.has(userId) || userItem.isFollowing;
              
              setFollowingLoading(prev => ({ ...prev, [userId]: true }));
              
              try {
                if (isCurrentlyFollowing) {
                  const result: any = await unfollowUser(userId);
                  if (result?.code === 0 || result?.data?.code === 0) {
                    setFollowingUsers(prev => {
                      const next = new Set(prev);
                      next.delete(userId);
                      return next;
                    });
                    setResults(prev => ({
                      ...prev,
                      users: prev.users.map(u => u.id === userId ? { ...u, isFollowing: false } : u)
                    }));
                  }
                } else {
                  const result: any = await followUser(userId);
                  if (result?.code === 0 || result?.data?.code === 0) {
                    setFollowingUsers(prev => new Set(prev).add(userId));
                    setResults(prev => ({
                      ...prev,
                      users: prev.users.map(u => u.id === userId ? { ...u, isFollowing: true } : u)
                    }));
                  }
                }
              } catch (err: any) {
                console.error('关注操作失败:', err);
              } finally {
                setFollowingLoading(prev => ({ ...prev, [userId]: false }));
              }
            }}
            disabled={followingLoading[userItem.id]}
            className={`px-4 py-2 text-sm rounded-full transition-colors ${
              (followingUsers.has(userItem.id) || userItem.isFollowing)
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            } ${followingLoading[userItem.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {followingLoading[userItem.id] ? '处理中...' : 
             (followingUsers.has(userItem.id) || userItem.isFollowing) ? '已关注' : '关注'}
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${userItem.username}`);
          }}
          className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
        >
          查看
          </button>
        </div>
      </div>
      </div>
    );
  };

  // 渲染帖子结果
  const renderPost = (post: any) => {
    // 转换搜索结果的帖子格式为PostCard需要的格式
    const postCardPost: PostCardPost = {
      id: post.id,
      originalId: post.id,
      authorId: post.user_id,
      author: {
        name: post.username || '未知用户',
        title: post.position || '',
        company: post.company || '',
        avatar: post.avatar || getDefaultAvatar(post.username || ''),
      },
      content: post.content || '',
      timestamp: post.created_at ? new Date(post.created_at).toLocaleString('zh-CN') : '',
      likes: post.likeCount || post.like_count || 0,
      comments: post.commentCount || post.comment_count || 0,
      liked: post.liked || false,
      contentType: post.contentType || (post.image_url ? 'image' : undefined),
      mediaUrl: post.image_url || post.mediaUrl || '',
    };
    
    return (
      <PostCard
        key={post.id}
        post={postCardPost}
        currentUserId={user?.id}
        showActions={false}
        className="border-b border-gray-100 last:border-b-0"
      />
    );
  };

  // 渲染文章结果
  const renderArticle = (article: any) => (
    <div
      key={article.id}
      className="p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
      onClick={() => navigate(`/articles/${article.id}`)}
    >
      <div className="flex items-center mb-2">
        <img
          className="h-8 w-8 rounded-full object-cover cursor-pointer"
          src={article.avatar || getDefaultAvatar(article.username)}
          alt={article.username}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${article.username}`);
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = getDefaultAvatar(article.username);
          }}
        />
        <div className="ml-3">
          <h4 className="text-sm font-semibold text-gray-900">{article.username}</h4>
        </div>
      </div>
      <h5 className="text-base font-semibold text-gray-900 mt-2">{article.title}</h5>
      {article.summary && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{article.summary}</p>
      )}
      <div className="flex items-center mt-3 text-xs text-gray-500">
        <span className="flex items-center mr-4">
          <EyeIcon className="h-4 w-4 mr-1" />
          {article.read_count || 0}
        </span>
        <span className="flex items-center mr-4">
          <HeartIcon className="h-4 w-4 mr-1" />
          {article.likeCount || 0}
        </span>
        <span className="flex items-center">
          <MessageCircleIcon className="h-4 w-4 mr-1" />
          {article.commentCount || 0}
        </span>
      </div>
    </div>
  );

  // 渲染文件结果
  const renderFile = (file: any) => (
    <div
      key={file.id}
      className="p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
      onClick={() => navigate(`/files/${file.id}`)}
    >
      <div className="flex items-center mb-2">
        <img
          className="h-8 w-8 rounded-full object-cover cursor-pointer"
          src={file.owner_avatar || getDefaultAvatar(file.owner_username)}
          alt={file.owner_username}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${file.owner_username}`);
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = getDefaultAvatar(file.owner_username);
          }}
        />
        <div className="ml-3">
          <h4 className="text-sm font-semibold text-gray-900">{file.owner_username}</h4>
        </div>
      </div>
      <div className="flex items-start mt-2">
        <FileIcon className="h-5 w-5 text-blue-600 mr-3 mt-1" />
        <div className="flex-1">
          <h5 className="text-base font-semibold text-gray-900">{file.title || file.original_name}</h5>
          {file.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{file.description}</p>
          )}
          {file.tags && file.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {file.tags.map((tag: string, index: number) => (
                <span key={index} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center mt-3 text-xs text-gray-500">
        <span className="flex items-center mr-4">
          <HeartIcon className="h-4 w-4 mr-1" />
          {file.likeCount || 0}
        </span>
        <span className="flex items-center">
          <MessageCircleIcon className="h-4 w-4 mr-1" />
          {file.commentCount || 0}
        </span>
      </div>
    </div>
  );

  // 处理点赞
  const handleLike = useCallback(async (postId: string | number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const allContent = [
        ...results.posts.map(p => ({ ...p, contentType: 'image' as const })),
        ...results.articles.map(a => ({ ...a, contentType: 'article' as const })),
        ...results.files.map(f => ({ ...f, contentType: 'file' as const }))
      ];
      
      const item = allContent.find(p => p.id === postId);
      if (!item || !item.id) return;

      let result: any;
      
      if (item.contentType === 'article') {
        result = await toggleArticleLike(item.id);
        if (result && result.code === 0 && result.data) {
          const newLiked = result.data.liked;
          const newLikeCount = result.data.likeCount ?? (item.likeCount || item.like_count || 0);
          setResults(prev => ({
            ...prev,
            articles: prev.articles.map(a => 
              a.id === postId ? { ...a, liked: newLiked, likeCount: newLikeCount, like_count: newLikeCount } : a
            )
          }));
        }
      } else if (item.contentType === 'file') {
        const isCurrentlyLiked = item.liked;
        if (isCurrentlyLiked) {
          result = await unlikeFile(item.id);
        } else {
          result = await likeFile(item.id);
        }
        if (result && result.code === 0 && result.data) {
          const newLiked = result.data.liked;
          const newLikeCount = result.data.likeCount ?? (item.likeCount || item.like_count || 0);
          setResults(prev => ({
            ...prev,
            files: prev.files.map(f => 
              f.id === postId ? { ...f, liked: newLiked, likeCount: newLikeCount, like_count: newLikeCount } : f
            )
          }));
        }
      } else {
        result = await togglePostLike(item.id);
        if (result && result.code === 0 && result.data) {
          const newLiked = result.data.liked;
          const newLikeCount = result.data.likeCount ?? (item.likeCount || item.like_count || 0);
          setResults(prev => ({
            ...prev,
            posts: prev.posts.map(p => 
              p.id === postId ? { ...p, liked: newLiked, likeCount: newLikeCount, like_count: newLikeCount } : p
            )
          }));
        }
      }
    } catch (err: any) {
      console.error('点赞操作失败:', err);
    }
  }, [user, results, navigate]);

  // 处理展开/收起评论
  const handleToggleComments = useCallback(async (postId: string | number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const allContent = [
      ...results.posts.map(p => ({ ...p, contentType: 'image' as const })),
      ...results.articles.map(a => ({ ...a, contentType: 'article' as const })),
      ...results.files.map(f => ({ ...f, contentType: 'file' as const }))
    ];
    
    const item = allContent.find(p => p.id === postId);
    if (!item || !item.id) return;

    const isExpanded = expandedComments.has(postId);
    
    if (isExpanded) {
      setExpandedComments(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      setExpandedComments(prev => new Set(prev).add(postId));
      
      if (!postComments[postId]) {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        try {
          let result: any;
          if (item.contentType === 'article') {
            result = await getArticleComments(item.id);
          } else if (item.contentType === 'file') {
            result = await getFileComments(item.id);
          } else {
            result = await getPostComments(item.id);
          }
          
          if (result && result.code === 0 && result.data) {
            setPostComments(prev => ({ ...prev, [postId]: result.data.comments || [] }));
          }
        } catch (err) {
          console.error('加载评论失败:', err);
        } finally {
          setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
      }
    }
  }, [user, results, expandedComments, postComments, navigate]);

  // 处理添加评论
  const handleAddComment = useCallback(async (postId: string | number, content: string) => {
    const allContent = [
      ...results.posts.map(p => ({ ...p, contentType: 'image' as const })),
      ...results.articles.map(a => ({ ...a, contentType: 'article' as const })),
      ...results.files.map(f => ({ ...f, contentType: 'file' as const }))
    ];
    
    const item = allContent.find(p => p.id === postId);
    if (!item || !item.id) return;

    try {
      let result: any;
      if (item.contentType === 'article') {
        result = await addArticleComment(item.id, content);
      } else if (item.contentType === 'file') {
        result = await commentOnFile(item.id, content);
      } else {
        result = await addPostComment(item.id, content);
      }
      
      if (result && result.code === 0 && result.data && result.data.comment) {
        setPostComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), result.data.comment]
        }));
        if (item.contentType === 'article') {
          setResults(prev => ({
            ...prev,
            articles: prev.articles.map(a => 
              a.id === postId ? { ...a, commentCount: (a.commentCount || a.comment_count || 0) + 1, comment_count: (a.commentCount || a.comment_count || 0) + 1 } : a
            )
          }));
        } else if (item.contentType === 'file') {
          setResults(prev => ({
            ...prev,
            files: prev.files.map(f => 
              f.id === postId ? { ...f, commentCount: (f.commentCount || f.comment_count || 0) + 1, comment_count: (f.commentCount || f.comment_count || 0) + 1 } : f
            )
          }));
        } else {
          setResults(prev => ({
            ...prev,
            posts: prev.posts.map(p => 
              p.id === postId ? { ...p, commentCount: (p.commentCount || p.comment_count || 0) + 1, comment_count: (p.commentCount || p.comment_count || 0) + 1 } : p
            )
          }));
        }
      }
    } catch (err: any) {
      console.error('添加评论失败:', err);
    }
  }, [results]);

  // 处理删除评论
  const handleDeleteComment = useCallback(async (postId: string | number, commentId: number) => {
    const allContent = [
      ...results.posts.map(p => ({ ...p, contentType: 'image' as const })),
      ...results.articles.map(a => ({ ...a, contentType: 'article' as const })),
      ...results.files.map(f => ({ ...f, contentType: 'file' as const }))
    ];
    
    const item = allContent.find(p => p.id === postId);
    if (!item || !item.id) return;

    try {
      let result: any;
      if (item.contentType === 'article') {
        result = await deleteArticleComment(item.id, commentId);
      } else if (item.contentType === 'file') {
        result = await deleteFileComment(item.id, commentId);
      } else {
        result = await deletePostComment(item.id, commentId);
      }
      
      if (result && result.code === 0) {
        setPostComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
        }));
        if (item.contentType === 'article') {
          setResults(prev => ({
            ...prev,
            articles: prev.articles.map(a => 
              a.id === postId ? { ...a, commentCount: Math.max(0, (a.commentCount || a.comment_count || 0) - 1), comment_count: Math.max(0, (a.commentCount || a.comment_count || 0) - 1) } : a
            )
          }));
        } else if (item.contentType === 'file') {
          setResults(prev => ({
            ...prev,
            files: prev.files.map(f => 
              f.id === postId ? { ...f, commentCount: Math.max(0, (f.commentCount || f.comment_count || 0) - 1), comment_count: Math.max(0, (f.commentCount || f.comment_count || 0) - 1) } : f
            )
          }));
        } else {
          setResults(prev => ({
            ...prev,
            posts: prev.posts.map(p => 
              p.id === postId ? { ...p, commentCount: Math.max(0, (p.commentCount || p.comment_count || 0) - 1), comment_count: Math.max(0, (p.commentCount || p.comment_count || 0) - 1) } : p
            )
          }));
        }
      }
    } catch (err: any) {
      console.error('删除评论失败:', err);
    }
  }, [results]);

  // 获取当前标签页的结果
  const getCurrentResults = () => {
    if (activeTab === 'people') {
      return results.users.map(u => ({ ...u, type: 'user' }));
    } else if (activeTab === 'posts') {
      return results.posts.map(p => ({ ...p, type: 'post' }));
    } else if (activeTab === 'articles') {
      return results.articles.map(a => ({ ...a, type: 'article' }));
    } else if (activeTab === 'files') {
      return results.files.map(f => ({ ...f, type: 'file' }));
    } else {
      // 全部：合并所有结果
      return [
        ...results.users.map(u => ({ ...u, type: 'user' })),
        ...results.posts.map(p => ({ ...p, type: 'post' })),
        ...results.articles.map(a => ({ ...a, type: 'article' })),
        ...results.files.map(f => ({ ...f, type: 'file' }))
      ];
    }
  };

  const currentResults = getCurrentResults();
  const hasResults = currentResults.length > 0;
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索框 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索用户、帖子、文章、文件..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </form>
        </div>

        {/* 标签页 */}
        {hasQuery && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setActiveTab('people')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'people'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                用户 ({pagination.users.total})
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                帖子 ({pagination.posts.total})
              </button>
              <button
                onClick={() => setActiveTab('articles')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'articles'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                文章 ({pagination.articles.total})
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'files'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                文件 ({pagination.files.total})
              </button>
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        {hasQuery && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : hasResults ? (
              <div>
                {activeTab === 'people' || activeTab === 'all' ? (
                  // 用户结果使用原来的渲染方式
                  <div className="divide-y divide-gray-200">
                    {currentResults.filter(r => r.type === 'user').map((result) => renderUser(result))}
                    {(activeTab === 'all' && (results.posts.length > 0 || results.articles.length > 0 || results.files.length > 0)) && (
                      <div className="p-4">
                        <PostFeed
                          posts={[
                            ...results.posts.map((post) => {
                              const isVideo = post.image_url && (
                                post.image_url.toLowerCase().endsWith('.mp4') ||
                                post.image_url.toLowerCase().endsWith('.webm') ||
                                post.image_url.toLowerCase().endsWith('.ogg') ||
                                post.image_url.toLowerCase().endsWith('.mov') ||
                                post.mime_type?.startsWith('video/')
                              );
                              return {
                                id: post.id,
                                originalId: post.id,
                                authorId: post.user_id,
                                author: {
                                  name: post.username || '未知用户',
                                  title: post.position || '',
                                  company: post.company || '',
                                  avatar: post.avatar || getDefaultAvatar(post.username || ''),
                                },
                                content: post.content || '',
                                timestamp: post.created_at ? new Date(post.created_at).toLocaleString('zh-CN') : '',
                                likes: post.likeCount || post.like_count || 0,
                                comments: post.commentCount || post.comment_count || 0,
                                liked: post.liked || false,
                                contentType: isVideo ? 'video' as const : (post.image_url ? 'image' as const : undefined),
                                mediaUrl: post.image_url || post.mediaUrl || undefined,
                              } as PostCardPost;
                            }),
                            ...results.articles.map((article) => ({
                              id: article.id,
                              originalId: article.id,
                              authorId: article.user_id,
                              author: {
                                name: article.username || '未知用户',
                                title: article.position || '',
                                company: article.company || '',
                                avatar: article.avatar || getDefaultAvatar(article.username || ''),
                              },
                              content: article.summary || article.content?.substring(0, 200) || '',
                              timestamp: article.created_at ? new Date(article.created_at).toLocaleString('zh-CN') : '',
                              likes: article.likeCount || article.like_count || 0,
                              comments: article.commentCount || article.comment_count || 0,
                              liked: article.liked || false,
                              contentType: 'article' as const,
                              title: article.title,
                              description: article.summary || article.content?.substring(0, 200) || '',
                              readTime: `${Math.ceil((article.content?.length || 0) / 500)}分钟`,
                            } as PostCardPost)),
                            ...results.files.map((file) => {
                              const isImage = file.mime_type?.startsWith('image/');
                              const isVideo = file.mime_type?.startsWith('video/');
                              return {
                                id: file.id,
                                originalId: file.id,
                                authorId: file.user_id,
                                author: {
                                  name: file.owner_username || file.username || '未知用户',
                                  title: file.position || '',
                                  company: file.company || '',
                                  avatar: file.owner_avatar || file.avatar || getDefaultAvatar(file.owner_username || file.username || ''),
                                },
                                content: file.description || file.title || '分享了一个文件',
                                timestamp: file.uploaded_at ? new Date(file.uploaded_at).toLocaleString('zh-CN') : '',
                                likes: file.likeCount || file.like_count || 0,
                                comments: file.commentCount || file.comment_count || 0,
                                liked: file.liked || false,
                                contentType: isImage ? 'image' as const : isVideo ? 'video' as const : 'file' as const,
                                mediaUrl: file.file_url || undefined,
                                title: file.title || file.original_name,
                                originalName: file.original_name,
                                size: file.size,
                                mimeType: file.mime_type,
                                description: file.description,
                              } as PostCardPost;
                            }),
                          ]}
                          currentUserId={user?.id}
                          contentFilter="all"
                          showFilter={false}
                          onLike={handleLike}
                          onToggleComments={handleToggleComments}
                          onAddComment={handleAddComment}
                          onDeleteComment={handleDeleteComment}
                          postComments={postComments}
                          loadingComments={loadingComments}
                          expandedComments={expandedComments}
                          showActions={false}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // posts、articles、files使用PostFeed组件
                  <PostFeed
                    posts={
                      activeTab === 'posts' ? results.posts.map((post) => {
                        const isVideo = post.image_url && (
                          post.image_url.toLowerCase().endsWith('.mp4') ||
                          post.image_url.toLowerCase().endsWith('.webm') ||
                          post.image_url.toLowerCase().endsWith('.ogg') ||
                          post.image_url.toLowerCase().endsWith('.mov') ||
                          post.mime_type?.startsWith('video/')
                        );
                        return {
                          id: post.id,
                          originalId: post.id,
                          authorId: post.user_id,
                          author: {
                            name: post.username || '未知用户',
                            title: post.position || '',
                            company: post.company || '',
                            avatar: post.avatar || getDefaultAvatar(post.username || ''),
                          },
                          content: post.content || '',
                          timestamp: post.created_at ? new Date(post.created_at).toLocaleString('zh-CN') : '',
                          likes: post.likeCount || post.like_count || 0,
                          comments: post.commentCount || post.comment_count || 0,
                          liked: post.liked || false,
                          contentType: isVideo ? 'video' as const : (post.image_url ? 'image' as const : undefined),
                          mediaUrl: post.image_url || post.mediaUrl || undefined,
                        } as PostCardPost;
                      }) :
                      activeTab === 'articles' ? results.articles.map((article) => ({
                        id: article.id,
                        originalId: article.id,
                        authorId: article.user_id,
                        author: {
                          name: article.username || '未知用户',
                          title: article.position || '',
                          company: article.company || '',
                          avatar: article.avatar || getDefaultAvatar(article.username || ''),
                        },
                        content: article.summary || article.content?.substring(0, 200) || '',
                        timestamp: article.created_at ? new Date(article.created_at).toLocaleString('zh-CN') : '',
                        likes: article.likeCount || article.like_count || 0,
                        comments: article.commentCount || article.comment_count || 0,
                        liked: article.liked || false,
                        contentType: 'article' as const,
                        title: article.title,
                        description: article.summary || article.content?.substring(0, 200) || '',
                        readTime: `${Math.ceil((article.content?.length || 0) / 500)}分钟`,
                      } as PostCardPost)) :
                      results.files.map((file) => {
                        const isImage = file.mime_type?.startsWith('image/');
                        const isVideo = file.mime_type?.startsWith('video/');
                        return {
                          id: file.id,
                          originalId: file.id,
                          authorId: file.user_id,
                          author: {
                            name: file.owner_username || file.username || '未知用户',
                            title: file.position || '',
                            company: file.company || '',
                            avatar: file.owner_avatar || file.avatar || getDefaultAvatar(file.owner_username || file.username || ''),
                          },
                          content: file.description || file.title || '分享了一个文件',
                          timestamp: file.uploaded_at ? new Date(file.uploaded_at).toLocaleString('zh-CN') : '',
                          likes: file.likeCount || file.like_count || 0,
                          comments: file.commentCount || file.comment_count || 0,
                          liked: file.liked || false,
                          contentType: isImage ? 'image' as const : isVideo ? 'video' as const : 'file' as const,
                          mediaUrl: file.file_url || undefined,
                          title: file.title || file.original_name,
                          originalName: file.original_name,
                          size: file.size,
                          mimeType: file.mime_type,
                          description: file.description,
                        } as PostCardPost;
                      })
                    }
                    currentUserId={user?.id}
                    contentFilter={activeTab === 'posts' ? 'posts' : activeTab === 'articles' ? 'articles' : 'files'}
                    showFilter={false}
                    onLike={handleLike}
                    onToggleComments={handleToggleComments}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                    postComments={postComments}
                    loadingComments={loadingComments}
                    expandedComments={expandedComments}
                    showActions={false}
                    emptyStateTitle="未找到结果"
                    emptyStateDescription="请尝试使用其他关键词搜索"
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">未找到结果</h3>
                <p className="text-gray-500">请尝试使用其他关键词搜索</p>
              </div>
            )}
          </div>
        )}

        {/* 初始状态 */}
        {!hasQuery && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">开始搜索</h3>
            <p className="text-gray-500">输入关键词搜索用户、帖子、文章或文件</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
