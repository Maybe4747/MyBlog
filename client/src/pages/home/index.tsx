import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFiles, getUserProfile, getUserActivity, getPublicFiles } from '../../api/users';
import { addFile, getMyProfile, updateFile, deleteFile } from '../../api/profiles';
import { createPost, getPosts, Post as ApiPost, updatePost, deletePost } from '../../api/posts';
import { createArticle, getArticles, Article as ApiArticle, updateArticle, deleteArticle, getArticleById } from '../../api/articles';
import Navbar from '../../components/Navbar';
import { searchUsers } from '../../api/search';
import { User } from '../../types';
import {
  HeartIcon,
  MessageCircleIcon,
  ShareIcon,
  MoreHorizontalIcon,
  CalendarIcon,
  UsersIcon,
  FileTextIcon,
  TrendingUpIcon,
  XIcon,
  ImageIcon,
  UserIcon,
  MapPinIcon,
  EditIcon,
  TrashIcon,
  VideoIcon,
  UploadIcon
} from 'lucide-react';
import PostCreationModal from '../../components/PostCreationModal';
import ArticleCreationModal from '../../components/ArticleCreationModal';

interface Post {
  id: string | number; // 支持字符串（带前缀）和数字
  originalId?: number; // 存储原始ID用于API调用
  authorId?: number; // 作者ID，用于判断是否是作者
  author: {
    name: string;
    title: string;
    company: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  title?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  contentType?: 'image' | 'article' | 'file' | 'video';
  mediaUrl?: string;
  readTime?: string;
  description?: string;
  summary?: string; // 文章摘要
  claps?: number;
  articleUrl?: string;
  visibility?: 'public' | 'followers' | 'private';
}

interface Connection {
  id: number;
  name: string;
  title: string;
  company: string;
  avatar: string;
  mutual: number;
}

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'network'>('feed');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [postModalMediaType, setPostModalMediaType] = useState<'image' | 'video'>('image'); // 帖子弹窗的媒体类型
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null); // 当前打开的下拉菜单ID
  const navigate = useNavigate();
  const location = useLocation();

  // 使用一个标志来防止重复请求
  const hasFetchedData = useRef(false);
  
  // 发布成功提示状态
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // 用户统计数据
  const [userStats, setUserStats] = useState({
    followers: 0,
    following: 0,
    files: 0,
    downloads: 0,
    newFollowers: 0
  });

  useEffect(() => {
    if (user) {
      const shouldRefresh = location.state?.refresh;
      fetchHomeData(shouldRefresh);
      // 清除 location state，避免重复刷新
      if (shouldRefresh) {
        window.history.replaceState({}, '');
      }
    }

    // 清理函数，当组件卸载时重置标志
    return () => {
      // 不在这里重置，允许组件重新挂载时获取数据
    };
  }, [user, location.state]);

  // 创建一个可重用的 fetchHomeData 函数
  const fetchHomeData = async (forceRefresh = false) => {
    if (hasFetchedData.current && !forceRefresh) {
      return;
    }

    if (forceRefresh) {
      hasFetchedData.current = false; // 重置标志以允许刷新
    }
    hasFetchedData.current = true;

    try {
      setLoading(true);

      // 获取用户自己的档案信息
      let userProfile: Partial<User> = {};
      const stats = {
        followers: 0,
        following: 0,
        files: 0,
        downloads: 0,
        newFollowers: 0
      };
      
      try {
        const profileResponse = await getMyProfile();
        const profileData = profileResponse.data?.profile || profileResponse.data?.user || {};
        userProfile = profileData;
        
        // 从API响应中提取统计数据
        if (profileData.followerCount !== undefined) {
          stats.followers = profileData.followerCount;
        }
        if (profileData.followingCount !== undefined) {
          stats.following = profileData.followingCount;
        }
        if (profileData.totalFiles !== undefined) {
          stats.files = profileData.totalFiles;
        }
        if (profileData.totalDownloads !== undefined) {
          stats.downloads = profileData.totalDownloads;
        }
        
        // 更新统计数据状态
        setUserStats(stats);
      } catch (profileError: any) {
        console.error('获取用户档案失败:', profileError);
        userProfile = {
          username: user?.username,
          avatar: user?.avatar,
          position: user?.position,
          title: user?.title,
          location: user?.location,
          skills: user?.skills,
          stats: user?.stats || {}
        };
      }

      // 获取推荐用户
      let recommendedUsers: any[] = [];
      try {
        const searchResponse = await searchUsers('default', { limit: 3 });
        recommendedUsers = searchResponse.data?.data?.users || searchResponse.data?.users || [];
      } catch (searchError: any) {
        console.error('获取推荐用户失败:', searchError);
        recommendedUsers = [];
      }

      // 获取所有内容：posts、articles和files
      const allPosts: Post[] = [];

      // 1. 获取帖子（posts）
      try {
        const postsResponse: any = await getPosts({ limit: 20, visibility: 'public' });
        if (postsResponse?.code === 0 && postsResponse?.data?.posts) {
          const posts = postsResponse.data.posts.map((post: ApiPost) => ({
            id: `post-${post.id}`, // 添加前缀确保唯一性
            originalId: post.id, // 存储原始ID用于API调用
            authorId: post.user_id, // 存储作者ID
            author: {
              name: post.username || '用户',
              title: userProfile?.position || userProfile?.title || '用户',
              company: userProfile?.company || '',
              avatar: post.avatar || ''
            },
            content: post.content || '',
            timestamp: new Date(post.created_at).toLocaleString('zh-CN'),
            likes: post.like_count || 0,
            comments: post.comment_count || 0,
            shares: 0,
            liked: post.liked || false,
            contentType: post.image_url ? (post.image_url.match(/\.(mp4|webm|mov|mpeg)$/i) ? 'video' as const : 'image' as const) : 'image' as const,
            mediaUrl: post.image_url || undefined,
            description: post.content || '',
            visibility: post.visibility
          }));
          allPosts.push(...posts);
        }
      } catch (postsError: any) {
        console.error('获取帖子失败:', postsError);
      }

      // 2. 获取文章（articles）
      try {
        const articlesResponse: any = await getArticles({ limit: 20, visibility: 'public' });
        if (articlesResponse?.code === 0 && articlesResponse?.data?.articles) {
          const articles = articlesResponse.data.articles.map((article: ApiArticle) => ({
            id: `article-${article.id}`, // 添加前缀确保唯一性
            originalId: article.id, // 存储原始ID用于API调用
            authorId: article.user_id, // 存储作者ID
            author: {
              name: article.username || '用户',
              title: userProfile?.position || userProfile?.title || '用户',
              company: userProfile?.company || '',
              avatar: article.avatar || ''
            },
            content: article.summary || article.content.substring(0, 200) || '',
            timestamp: new Date(article.created_at).toLocaleString('zh-CN'),
            likes: article.like_count || 0,
            comments: article.comment_count || 0,
            shares: 0,
            liked: article.liked || false,
            title: article.title,
            contentType: 'article' as const,
            description: article.summary || '',
            readTime: `${Math.ceil(article.content.length / 500)}分钟`,
            visibility: article.visibility
          }));
          allPosts.push(...articles);
        }
      } catch (articlesError: any) {
        console.error('获取文章失败:', articlesError);
      }

      // 3. 获取所有公开文件（类似posts和articles）
      let userActivity: any[] = [];
      try {
        const filesResponse: any = await getPublicFiles({ limit: 20 });
        console.log('文件API响应:', filesResponse);
        if (filesResponse?.code === 0 && filesResponse?.data?.files) {
          console.log('文件数量:', filesResponse.data.files.length);
          // 将文件格式转换为活动格式
          userActivity = filesResponse.data.files.map((file: any) => ({
            id: file.id,
            type: 'file_upload',
            title: file.title,
            description: file.description,
            originalName: file.original_name,
            size: file.size,
            mimeType: file.mime_type,
            fileUrl: file.file_url,
            uploadedAt: file.uploaded_at,
            likeCount: file.likeCount || 0,
            commentCount: file.commentCount || 0,
            userId: file.user_id,
            username: file.owner_username,
            avatar: file.avatar || null
          }));
          console.log('转换后的文件活动:', userActivity.length);
        } else {
          console.warn('文件API响应格式异常:', filesResponse);
        }
      } catch (activityError: any) {
        console.error('获取公开文件失败:', activityError);
      }

      // 将文件活动转换为帖子格式
      const filePosts: Post[] = userActivity.map(activity => {
        let contentType: 'image' | 'article' | 'file' = 'file';
        if (activity.mimeType?.startsWith('image/')) {
          contentType = 'image';
        } else if (activity.mimeType === 'text/markdown' || activity.tags?.includes('article')) {
          contentType = 'article';
        }
        
          return {
            id: `file-${activity.id}`, // 添加前缀确保唯一性
            originalId: activity.id, // 存储原始ID用于API调用
            authorId: activity.userId || activity.user_id, // 存储作者ID
            author: {
              name: activity.username || activity.owner_username || user?.username || '用户',
              title: userProfile?.position || userProfile?.title || '用户',
              company: userProfile?.company || '',
              avatar: activity.avatar || user?.avatar || ''
            },
            content: activity.description || activity.title || '分享了一个文件',
            timestamp: activity.uploadedAt || activity.uploaded_at ? new Date(activity.uploadedAt || activity.uploaded_at).toLocaleString('zh-CN') : '刚刚',
            likes: activity.likeCount || activity.like_count || 0,
            comments: activity.commentCount || activity.comment_count || 0,
            shares: 0,
            liked: false,
            title: activity.title,
            originalName: activity.originalName || activity.original_name,
            size: activity.size,
            mimeType: activity.mimeType || activity.mime_type,
            contentType: contentType,
            mediaUrl: activity.fileUrl || activity.file_url,
            description: activity.description,
            readTime: contentType === 'article' ? '5分钟' : undefined
          };
      });

      allPosts.push(...filePosts);

      // 按时间排序（最新的在前）
      const formattedPosts = allPosts.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      });

      // 将推荐用户转换为连接格式
      const formattedConnections: Connection[] = recommendedUsers.map(recUser => ({
        id: recUser.id,
        name: recUser.username,
        title: recUser.position || '用户',
        company: recUser.company || '',
        avatar: recUser.avatar || '',
        mutual: recUser.mutualConnections || 0
      }));

      setPosts(formattedPosts);
      setConnections(formattedConnections);
    } catch (err: any) {
      setError(err.message || '获取数据失败');
      console.error('获取首页数据失败:', err);
    } finally {
      setLoading(false);
      hasFetchedData.current = false; // 允许下次重新获取
    }
  };

  // 图片模态框状态
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalImageTitle, setModalImageTitle] = useState('');

  const handleLike = async (postId: string | number) => {
    try {
      // 这里应该调用实际的API来点赞/取消点赞
      // 由于没有具体的点赞文件API，我们暂时只更新本地状态
      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
          : post
      ));
    } catch (err: any) {
      setError(err.message || '操作失败');
      console.error('点赞操作失败:', err);
    }
  };

  const handleDelete = async (postId: string | number) => {
    if (!deletingPostId) return;
    
    // 检查是否是文件类型
    const postToDelete = posts.find(p => p.id === postId);
    if (postToDelete?.contentType === 'file' && postToDelete.originalId) {
      try {
        const result: any = await deleteFile(postToDelete.originalId);
        if (result?.code === 0 || result?.message) {
          setSuccessMessage('文件删除成功！');
          setShowSuccessMessage(true);
          setTimeout(() => {
            setShowSuccessMessage(false);
            setSuccessMessage('');
          }, 3000);
          // 刷新数据
          fetchHomeData(true);
        } else {
          setError(result?.msg || result?.error || '删除文件失败');
          setTimeout(() => setError(null), 5000);
        }
      } catch (error: any) {
        console.error('删除文件失败:', error);
        setError(error.message || '删除文件失败');
        setTimeout(() => setError(null), 5000);
      } finally {
        setDeletingPostId(null);
      }
      return;
    }
    
    try {
      const post = posts.find(p => p.id === postId);
      if (!post || !post.originalId) return;

      if (post.contentType === 'article') {
        await deleteArticle(post.originalId);
      } else if (post.contentType === 'image' || post.contentType === 'file') {
        await deletePost(post.originalId);
      }

      // 从列表中移除
      setPosts(posts.filter(p => p.id !== postId));
      setSuccessMessage('删除成功！');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err: any) {
      setError(err.message || '删除失败');
      console.error('删除失败:', err);
    } finally {
      setDeletingPostId(null);
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-menu-container')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenuId]);

  const handleEdit = async (post: Post) => {
    try {
      // 如果是文件类型，跳转到文件详情页进行编辑
      if (post.contentType === 'file' && post.originalId) {
        navigate(`/files/${post.originalId}`);
        return;
      }
      
      if (post.contentType === 'article' && post.originalId) {
        // 对于文章，需要获取完整内容
        const result: any = await getArticleById(post.originalId);
        if (result?.code === 0 && result?.data?.article) {
          const article = result.data.article;
          setEditingPost({
            ...post,
            title: article.title,
            summary: article.summary || '',
            content: article.content,
            visibility: article.visibility
          });
          setIsArticleModalOpen(true);
        }
      } else {
        // 对于帖子，直接使用现有数据
        setEditingPost(post);
        // 根据内容类型设置媒体类型
        if (post.contentType === 'video') {
          setPostModalMediaType('video');
        } else {
          setPostModalMediaType('image');
        }
        setIsPostModalOpen(true);
      }
    } catch (error: any) {
      console.error('获取文章详情失败:', error);
      setError('获取文章详情失败，请重试');
      setTimeout(() => setError(null), 5000);
    }
  };

  const openImageModal = (imageUrl: string, title: string) => {
    setModalImageUrl(imageUrl);
    setModalImageTitle(title);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 图片模态框 */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors z-10"
            >
              <XIcon className="w-6 h-6" />
            </button>
            <img
              src={modalImageUrl}
              alt={modalImageTitle}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
              <p className="font-medium">{modalImageTitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* 主页面内容 */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30">
        {/* Header */}
         <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar - User profile and quick stats */}
          <div className="lg:col-span-3 space-y-6">
            {/* User profile card */}
            <div className="bg-gradient-to-br from-white via-blue-50/40 to-purple-50/30 rounded-2xl shadow-lg border border-blue-100/60 p-6 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-xl opacity-50"></div>
                  <img
                    className="h-20 w-20 rounded-full ring-4 ring-white/80 relative z-10"
                    src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'}
                    alt={user?.username}
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{user?.username || '用户'}</h3>
                <p className="text-sm text-gray-600 font-medium">{user?.position || user?.title || '软件工程师'}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <MapPinIcon className="w-3 h-3 mr-1" />
                  {user?.location || '北京'}
                </p>

                <div className="flex space-x-6 mt-6 text-center w-full border-t border-blue-100/50 pt-4">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-blue-600">{userStats.followers}</p>
                    <p className="text-xs text-gray-500 mt-1">粉丝</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-purple-600">{userStats.following}</p>
                    <p className="text-xs text-gray-500 mt-1">关注</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-pink-600">{userStats.files}</p>
                    <p className="text-xs text-gray-500 mt-1">文件</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 rounded-2xl shadow-lg border border-purple-100/60 p-6 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-2"></div>
                今日洞察
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100/50 rounded-lg mr-3">
                      <TrendingUpIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">文件下载量</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{userStats.downloads}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100/50 rounded-lg mr-3">
                      <UsersIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">新增关注</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{userStats.newFollowers}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100/50 rounded-lg mr-3">
                      <FileTextIcon className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">上传文件</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600">{userStats.files}</span>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">可能认识的人</h3>
              <div className="space-y-4">
                {/* {connections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={connection.avatar || `https://ui-avatars.com/api/?name=${connection.name}&background=random`}
                        alt={connection.name}
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{connection.name}</p>
                        <p className="text-xs text-gray-500">{connection.title}</p>
                        <p className="text-xs text-gray-500">{connection.mutual || 0} 位共同联系人</p>
                      </div>
                    </div>
                    <button className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
                      添加
                    </button>
                  </div>
                ))} */}
              </div>
            </div>
          </div>

          {/* Main content based on active tab */}
          <div className="lg:col-span-6 space-y-6">
            {/* 成功消息提示 */}
            {showSuccessMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{successMessage}</span>
                </div>
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="text-green-600 hover:text-green-800"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 错误消息提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeTab === 'feed' && (
              <>
                {/* Create post - 优化样式 */}
                <div className="bg-gradient-to-br from-white via-blue-50/40 to-purple-50/30 rounded-2xl shadow-lg border border-blue-100/60 p-6 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-md opacity-40"></div>
                      <img
                        className="h-12 w-12 rounded-full ring-3 ring-white/80 relative z-10"
                        src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'}
                        alt={user?.username}
                      />
                    </div>
                    <button
                      onClick={() => {
                        setPostModalMediaType('image');
                        setIsPostModalOpen(true);
                      }}
                      className="flex-1 text-left px-5 py-3.5 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/90 transition-all text-gray-600 border border-blue-100/60 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm hover:shadow-md font-medium">
                      分享些什么...
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-blue-100/60">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="flex items-center px-5 py-2.5 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 transition-all group shadow-sm hover:shadow-md">
                        <div className="p-1.5 bg-blue-100/50 rounded-lg mr-2 group-hover:bg-blue-200/50 transition-colors">
                          <ImageIcon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-sm font-semibold">照片</span>
                      </button>
                      <button
                        onClick={() => {
                          setPostModalMediaType('video');
                          setIsPostModalOpen(true);
                        }}
                        className="flex items-center px-5 py-2.5 rounded-xl text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 transition-all group shadow-sm hover:shadow-md">
                        <div className="p-1.5 bg-purple-100/50 rounded-lg mr-2 group-hover:bg-purple-200/50 transition-colors">
                          <VideoIcon className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-sm font-semibold">视频</span>
                      </button>
                      <button
                        onClick={() => setIsArticleModalOpen(true)}
                        className="flex items-center px-5 py-2.5 rounded-xl text-gray-700 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100/50 transition-all group shadow-sm hover:shadow-md">
                        <div className="p-1.5 bg-green-100/50 rounded-lg mr-2 group-hover:bg-green-200/50 transition-colors">
                          <FileTextIcon className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-sm font-semibold">文章</span>
                      </button>
                      <button
                        onClick={() => navigate('/upload')}
                        className="flex items-center px-5 py-2.5 rounded-xl text-gray-700 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100/50 transition-all group shadow-sm hover:shadow-md">
                        <div className="p-1.5 bg-orange-100/50 rounded-lg mr-2 group-hover:bg-orange-200/50 transition-colors">
                          <UploadIcon className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-sm font-semibold">文件</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Posts feed */}
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div key={post.id} className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-2xl shadow-lg border border-blue-100/60 overflow-hidden hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                      {/* Post header */}
                      <div className="p-6 pb-4 bg-gradient-to-r from-blue-50/30 to-purple-50/20 border-b border-blue-100/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-md opacity-30"></div>
                              <img
                                className="h-12 w-12 rounded-full ring-2 ring-white/80 relative z-10"
                                src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.name}&background=random`}
                                alt={post.author.name}
                              />
                            </div>
                            <div className="ml-4">
                              <h4 className="text-sm font-bold text-gray-900">{post.author.name}</h4>
                              <p className="text-sm text-gray-600 font-medium">{post.author.title} · {post.author.company}</p>
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                {post.timestamp}
                              </p>
                            </div>
                          </div>
                          <div className="relative dropdown-menu-container">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white/60 rounded-xl transition-all"
                            >
                              <MoreHorizontalIcon className="h-5 w-5" />
                            </button>
                            
                            {/* 下拉菜单 - 只对作者显示编辑和删除 */}
                            {openMenuId === post.id && post.authorId === user?.id && (
                              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                <button
                                  onClick={() => {
                                    handleEdit(post);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                                >
                                  <EditIcon className="w-4 h-4 text-blue-500" />
                                  <span>编辑</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setDeletingPostId(post.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                  <span>删除</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Post content */}
                      <div className="px-6 py-5">
                        <p className="text-gray-800 leading-relaxed font-medium">{post.content}</p>

                        {/* 根据内容类型显示不同的媒体内容 */}
                        {post.contentType === 'image' && post.mediaUrl && (
                          <div className="mt-5">
                            <div
                              className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300 shadow-lg hover:shadow-xl"
                              onClick={() => openImageModal(post.mediaUrl || '', post.title || '分享的图片')}
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
                            <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl">
                              <video
                                src={post.mediaUrl}
                                controls
                                className="w-full h-80 object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {post.contentType === 'article' && (
                          <div
                            className="mt-5 p-5 bg-gradient-to-br from-green-50/50 to-emerald-50/30 rounded-2xl border border-green-100/60 cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all duration-300 backdrop-blur-sm"
                            onClick={() => {
                              // 提取原始ID（如果是字符串格式如 "article-1"，提取数字部分）
                              let articleId = post.originalId;
                              if (!articleId && typeof post.id === 'string' && post.id.startsWith('article-')) {
                                articleId = parseInt(post.id.replace('article-', ''));
                              } else if (!articleId) {
                                articleId = typeof post.id === 'number' ? post.id : parseInt(String(post.id));
                              }
                              navigate(`/articles/${articleId}`);
                            }}
                          >
                            <div className="flex items-center">
                              <div className="p-3 bg-green-100/50 rounded-xl mr-4">
                                <FileTextIcon className="w-6 h-6 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate mb-1">{post.title}</p>
                                <p className="text-xs text-gray-600 line-clamp-2">{post.description || '文章摘要'}</p>
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
                                onClick={() => {
                                  // 如果文件有 fileUrl，直接使用 TOS URL 下载
                                  if (post.mediaUrl) {
                                    window.open(post.mediaUrl, '_blank');
                                  } else {
                                    // 否则跳转到文件详情页
                                    navigate(`/files/${post.originalId || post.id}`);
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
                            <button
                              onClick={() => handleLike(post.id)}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                                post.liked 
                                  ? 'text-red-600 bg-red-50/50 hover:bg-red-100/50' 
                                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50/30'
                              }`}
                            >
                              <HeartIcon className={`h-5 w-5 ${post.liked ? 'fill-current' : ''}`} />
                              <span className="text-sm font-semibold">{post.likes}</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50/30 transition-all">
                              <MessageCircleIcon className="h-5 w-5" />
                              <span className="text-sm font-semibold">{post.comments}</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 hover:text-green-600 hover:bg-green-50/30 transition-all">
                              <ShareIcon className="h-5 w-5" />
                              <span className="text-sm font-semibold">{post.shares}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无内容</h3>
                    <p className="text-gray-500 mb-4">还没有任何分享</p>
                    <button
                      onClick={() => window.location.href = '/upload'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      创建第一个分享
                    </button>
                  </div>
                )}
              </>
            )}

            {/* 删除确认对话框 */}
            {deletingPostId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">确认删除</h3>
                  <p className="text-gray-600 mb-6">确定要删除这条动态吗？此操作无法撤销。</p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setDeletingPostId(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleDelete(deletingPostId)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 帖子创建/编辑弹窗 */}
            <PostCreationModal
              isOpen={isPostModalOpen}
              onClose={() => {
                setIsPostModalOpen(false);
                setEditingPost(null);
              }}
              editingPost={editingPost}
              mediaType={postModalMediaType}
              onPost={async (postData) => {
                try {
                  let result: any;
                  
                  if (editingPost && editingPost.originalId) {
                    // 编辑模式
                    result = await updatePost(editingPost.originalId, {
                      content: postData.content || undefined,
                      image: postData.image,
                      video: postData.video,
                      visibility: (postData.visibility || 'public') as 'public' | 'followers' | 'private'
                    });
                  } else {
                    // 创建模式
                    result = await createPost({
                      content: postData.content || undefined,
                      image: postData.image,
                      video: postData.video,
                      visibility: (postData.visibility || 'public') as 'public' | 'followers' | 'private'
                    });
                  }
                  
                  console.log('帖子操作响应:', result);
                  
                  if (result?.code === 0) {
                    const mediaType = postData.video ? '视频' : (postData.image ? '照片' : '帖子');
                    setSuccessMessage(editingPost ? '帖子更新成功！' : `${mediaType}发布成功！`);
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                    
                    // 关闭弹窗
                    setIsPostModalOpen(false);
                    setEditingPost(null);
                    
                    // 重置标志，允许重新获取数据
                    hasFetchedData.current = false;
                    
                    // 延迟重新加载数据
                    setTimeout(async () => {
                      try {
                        await fetchHomeData();
                      } catch (fetchError: any) {
                        console.error('刷新数据失败:', fetchError);
                        setError('刷新数据失败，请手动刷新页面');
                        setTimeout(() => setError(null), 5000);
                      }
                    }, 500);
                  } else {
                    setError(result?.msg || result?.error || (editingPost ? '更新失败，请重试' : '发布失败，请重试'));
                    setTimeout(() => setError(null), 5000);
                  }
                } catch (error: any) {
                  console.error('操作失败:', error);
                  setError(error.message || (editingPost ? '更新失败，请重试' : '发布失败，请重试'));
                  setTimeout(() => setError(null), 5000);
                }
              }}
            />

            {/* 文章创建/编辑弹窗 */}
            <ArticleCreationModal
              isOpen={isArticleModalOpen}
              onClose={() => {
                setIsArticleModalOpen(false);
                setEditingPost(null);
              }}
              editingArticle={editingPost}
              onPost={async (postData) => {
                try {
                  let result: any;
                  
                  if (editingPost && editingPost.originalId) {
                    // 编辑模式
                    result = await updateArticle(editingPost.originalId, {
                      title: postData.title,
                      summary: postData.summary || undefined,
                      content: postData.content,
                      visibility: (postData.visibility || 'public') as 'public' | 'followers' | 'private'
                    });
                  } else {
                    // 创建模式
                    result = await createArticle({
                      title: postData.title,
                      summary: postData.summary || undefined,
                      content: postData.content,
                      visibility: (postData.visibility || 'public') as 'public' | 'followers' | 'private'
                    });
                  }
                  
                  console.log('文章操作响应:', result);
                  
                  if (result?.code === 0) {
                    setSuccessMessage(editingPost ? '文章更新成功！' : '文章发布成功！');
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                    
                    // 关闭弹窗
                    setIsArticleModalOpen(false);
                    setEditingPost(null);
                    
                    // 重置标志，允许重新获取数据
                    hasFetchedData.current = false;
                    
                    // 延迟重新加载数据
                    setTimeout(async () => {
                      try {
                        await fetchHomeData();
                      } catch (fetchError: any) {
                        console.error('刷新数据失败:', fetchError);
                        setError('刷新数据失败，请手动刷新页面');
                        setTimeout(() => setError(null), 5000);
                      }
                    }, 500);
                  } else {
                    setError(result?.msg || result?.error || (editingPost ? '更新失败，请重试' : '发布文章失败，请重试'));
                    setTimeout(() => setError(null), 5000);
                  }
                } catch (error: any) {
                  console.error('操作失败:', error);
                  
                  if (error.response?.status === 401) {
                    setError('登录已过期，请重新登录');
                    setTimeout(() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('refreshToken');
                      localStorage.removeItem('user');
                      window.location.href = '/login';
                    }, 2000);
                  } else {
                    setError(error.message || (editingPost ? '更新失败，请重试' : '发布文章失败，请重试'));
                    setTimeout(() => setError(null), 5000);
                  }
                }
              }}
            />

            {activeTab === 'network' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">职场人脉</h3>
                <div className="space-y-4">
                  {connections.length > 0 ? (
                    connections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <img
                            className="h-12 w-12 rounded-full"
                            src={connection.avatar || `https://ui-avatars.com/api/?name=${connection.name}&background=random`}
                            alt={connection.name}
                          />
                          <div className="ml-4">
                            <h4 className="text-sm font-semibold text-gray-900">{connection.name}</h4>
                            <p className="text-sm text-gray-600">{connection.title} · {connection.company}</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                          关注
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无人脉</h3>
                      <p className="text-gray-500 mb-4">您还没有任何连接</p>
                      <button
                        onClick={() => setActiveTab('feed')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        浏览动态
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right sidebar - Activity and trends */}
          <div className="lg:col-span-3 space-y-6">
            {/* Trending topics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">热门标签</h3>
              <div className="space-y-3">
                {(user?.skills || []).slice(0, 4).map((skill, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">#{skill}</p>
                      <p className="text-xs text-gray-500">你关注的标签</p>
                    </div>
                    <button className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
                      关注
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">近期活动</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{user?.username || '你'}</span> 上传了新文件
                    </p>
                    <p className="text-xs text-gray-500">刚刚</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <HeartIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-900">
                      某用户 点赞了你的文件
                    </p>
                    <p className="text-xs text-gray-500">2小时以前</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-900">
                      你加入了平台
                    </p>
                    <p className="text-xs text-gray-500">1个月以前</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Job recommendations */}
            {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">相关职位</h3>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <h4 className="text-sm font-semibold text-gray-900">前端开发工程师</h4>
                  <p className="text-xs text-gray-600">知名互联网公司 · 北京</p>
                  <p className="text-xs text-gray-500 mt-2">月薪 20k-35k · 5天/周</p>
                  <button className="mt-3 w-full text-xs bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                    查看详情
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <h4 className="text-sm font-semibold text-gray-900">UI/UX设计师</h4>
                  <p className="text-xs text-gray-600">创新科技公司 · 上海</p>
                  <p className="text-xs text-gray-500 mt-2">月薪 18k-30k · 5天/周</p>
                  <button className="mt-3 w-full text-xs bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                    查看详情
                  </button>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
     </div>
  );
}

export default Home;