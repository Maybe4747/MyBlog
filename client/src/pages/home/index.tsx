import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFiles, getUserProfile, getUserActivity } from '../../api/users';
import { getNotifications } from '../../api/notifications';
import { getFollowers, getFollowing } from '../../api/social';
import { addFile, getMyProfile } from '../../api/profiles';
import Navbar from '../../components/Navbar';
import { searchUsers } from '../../api/search';
import { User, File } from '../../types';
import {
  SearchIcon,
  BellIcon,
  MailIcon,
  PlusIcon,
  HeartIcon,
  MessageCircleIcon,
  ShareIcon,
  MoreHorizontalIcon,
  UserIcon,
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  FileTextIcon,
  TrendingUpIcon,
  XIcon
} from 'lucide-react';
import PostCreationModal from '../../components/PostCreationModal';
import ArticleCreationModal from '../../components/ArticleCreationModal';

interface Post {
  id: number;
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
  contentType?: 'image' | 'article' | 'file';
  mediaUrl?: string;
  readTime?: string;
  description?: string;
  claps?: number;
  articleUrl?: string;
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
  const navigate = useNavigate();

  // 使用一个标志来防止重复请求
  const hasFetchedData = useRef(false);

  useEffect(() => {
    const fetchHomeData = async () => {
      // 防止重复请求
      if (hasFetchedData.current) {
        return;
      }

      hasFetchedData.current = true;

      try {
        setLoading(true);

        // 获取用户自己的档案信息
        let userProfile: Partial<User> = {};
        try {
          const profileResponse = await getMyProfile();
          userProfile = profileResponse.data?.profile || profileResponse.data?.user || {};
        } catch (profileError: any) {
          console.error('获取用户档案失败:', profileError);
          // 使用用户基本信息作为备选
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

        // 获取推荐用户（模拟可能认识的人）
        let recommendedUsers: any[] = [];
        try {
          // 只有在有用户信息的情况下才获取推荐用户，或者获取通用推荐
          if (user?.username && user.username !== 'Maybe') {
            const searchResponse = await searchUsers(user.username, { limit: 3 });
            recommendedUsers = searchResponse.data?.users || [];
          } else {
            // 如果没有用户信息或用户名为'Maybe'，则获取通用推荐
            const searchResponse = await searchUsers('default', { limit: 3 });
            recommendedUsers = searchResponse.data?.users || [];
          }
        } catch (searchError: any) {
          console.error('获取推荐用户失败:', searchError);
          // 如果搜索失败，尝试获取通用推荐或随机用户
          try {
            const searchResponse = await searchUsers('default', { limit: 3 });
            recommendedUsers = searchResponse.data?.users || [];
          } catch (fallbackError: any) {
            console.error('获取推荐用户的备用方法也失败:', fallbackError);
          }
        }


        // 获取用户活动（如动态、文件、文章等）
        let userActivity: any[] = [];
        try {
          if (user?.username && user.username !== 'Maybe') {
            const activityResponse = await getUserActivity(user.username, { limit: 10 });
            userActivity = activityResponse.data?.activity || activityResponse.data?.activities || [];
          }
        } catch (activityError: any) {
          console.error('获取用户活动失败:', activityError);
        }

        // 将活动数据转换为帖子格式（简化版，不包含点赞评论）
        const formattedPosts: Post[] = userActivity.map(activity => {
          return {
            id: activity.id,
            author: {
              name: activity.username || user?.username || '用户',
              title: userProfile?.position || userProfile?.title || '用户',
              company: userProfile?.company || '',
              avatar: activity.avatar || user?.avatar || ''
            },
            content: activity.description || activity.title || '分享了一个文件',
            timestamp: activity.uploadedAt ? new Date(activity.uploadedAt).toLocaleString('zh-CN') : '刚刚',
            likes: 0,
            comments: 0,
            shares: 0,
            liked: false,
            title: activity.title,
            originalName: activity.originalName,
            size: activity.size,
            mimeType: activity.mimeType,
            contentType: 'file'
          };
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
      }
    };

    if (user && !hasFetchedData.current) {
      fetchHomeData();
    }

    // 清理函数，当组件卸载时重置标志
    return () => {
      hasFetchedData.current = false;
    };
  }, [user]);

  // 图片模态框状态
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalImageTitle, setModalImageTitle] = useState('');

  const handleLike = async (postId: number) => {
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
         <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar - User profile and quick stats */}
          <div className="lg:col-span-3 space-y-6">
            {/* User profile card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center">
                <img
                  className="h-20 w-20 rounded-full mb-4"
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'}
                  alt={user?.username}
                />
                <h3 className="text-lg font-semibold text-gray-900">{user?.username || '用户'}</h3>
                <p className="text-sm text-gray-600">{user?.position || user?.title || '软件工程师'}</p>
                <p className="text-xs text-gray-500 mt-1">{user?.location || '北京'}</p>

                <div className="flex space-x-4 mt-4 text-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user?.stats?.followers || 0}</p>
                    <p className="text-xs text-gray-500">连接</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user?.stats?.following || 0}</p>
                    <p className="text-xs text-gray-500">关注</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user?.stats?.files || 0}</p>
                    <p className="text-xs text-gray-500">文件</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">今日洞察</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUpIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">文件下载量</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{user?.stats?.downloads || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UsersIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">新增关注</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{user?.stats?.newFollowers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileTextIcon className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-sm text-gray-600">上传文件</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{user?.stats?.files || 0}</span>
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
            {activeTab === 'feed' && (
              <>
                {/* Create post */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      className="h-12 w-12 rounded-full"
                      src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'}
                      alt={user?.username}
                    />
                    <button
                      onClick={() => setIsPostModalOpen(true)}
                      className="flex-1 text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                      分享些什么...
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">照片</span>
                      </button>
                      <button
                        onClick={() => setIsArticleModalOpen(true)}
                        className="flex items-center text-gray-600 hover:text-green-600 transition-colors">
                        <svg className="w-5 h-5 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-sm">文章</span>
                      </button>
                      <button
                        onClick={() => window.location.href = '/upload'}
                        className="flex items-center text-gray-600 hover:text-purple-600 transition-colors">
                        <svg className="w-5 h-5 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm">文件</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Posts feed */}
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {/* Post header */}
                      <div className="p-6 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <img
                              className="h-12 w-12 rounded-full"
                              src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.name}&background=random`}
                              alt={post.author.name}
                            />
                            <div className="ml-4">
                              <h4 className="text-sm font-semibold text-gray-900">{post.author.name}</h4>
                              <p className="text-sm text-gray-600">{post.author.title} · {post.author.company}</p>
                              <p className="text-xs text-gray-500">{post.timestamp}</p>
                            </div>
                          </div>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreHorizontalIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Post content */}
                      <div className="px-6 pb-4">
                        <p className="text-gray-800">{post.content}</p>

                        {/* 根据内容类型显示不同的媒体内容 */}
                        {post.contentType === 'image' && post.mediaUrl && (
                          <div className="mt-4">
                            <div
                              className="rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openImageModal(post.mediaUrl, post.title)}
                            >
                              <img
                                src={post.mediaUrl}
                                alt={post.title || '分享的图片'}
                                className="w-full h-80 object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {post.contentType === 'article' && (
                          <div
                            className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => navigate(`/articles/${post.id}`)}
                          >
                            <div className="flex items-center">
                              <svg className="w-8 h-8 text-green-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{post.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{post.description || '文章摘要'}</p>
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                  <span>{post.readTime || '3分钟'}阅读</span>
                                  <span className="mx-2">•</span>
                                  <span>{post.claps || 0} 次点赞</span>
                                  <span className="mx-2">•</span>
                                  <span>{post.comments} 条评论</span>
                                </div>
                              </div>
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {post.contentType === 'file' && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <FileTextIcon className="h-8 w-8 text-blue-500 mr-3" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{post.title || post.originalName}</p>
                                <p className="text-xs text-gray-500">{post.mimeType || '文件'}</p>
                                <p className="text-xs text-gray-500">{(post.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <a
                                href={`/api/files/download/${post.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                下载
                              </a>
                            </div>
                          </div>
                        )}

                        {!post.contentType && post.originalName && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <FileTextIcon className="h-8 w-8 text-blue-500 mr-3" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{post.title || post.originalName}</p>
                                <p className="text-xs text-gray-500">{post.mimeType || '文件'}</p>
                                <p className="text-xs text-gray-500">{(post.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <a
                                href={`/api/files/download/${post.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm"
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
                      <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <button
                              onClick={() => handleLike(post.id)}
                              className={`flex items-center space-x-2 ${
                                post.liked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                              } transition-colors`}
                            >
                              <HeartIcon className={`h-5 w-5 ${post.liked ? 'fill-current' : ''}`} />
                              <span className="text-sm font-medium">{post.likes}</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                              <MessageCircleIcon className="h-5 w-5" />
                              <span className="text-sm font-medium">{post.comments}</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                              <ShareIcon className="h-5 w-5" />
                              <span className="text-sm font-medium">{post.shares}</span>
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

            {/* 帖子创建弹窗 */}
            <PostCreationModal
              isOpen={isPostModalOpen}
              onClose={() => setIsPostModalOpen(false)}
              onPost={async (postData) => {
                // 这里需要实现实际的帖子发布逻辑
                // 目前只是模拟发布，实际应用中需要调用API
                console.log('发布帖子:', postData);

                // 如果有图片，可能需要调用上传文件API
                if (postData.image) {
                  try {
                    const result = await addFile({
                      file: postData.image,
                      title: postData.content.substring(0, 50) || '分享的图片',
                      description: postData.content,
                      visibility: postData.visibility
                    });
                    console.log('文件上传成功:', result);
                  } catch (error) {
                    console.error('文件上传失败:', error);
                  }
                } else {
                  // 纯文本帖子，可以考虑调用专门的帖子API（如果有的话）
                  console.log('纯文本帖子发布:', postData);
                }

                // 重新加载数据以显示新帖子
                fetchHomeData();
              }}
            />

            {/* 文章创建弹窗 */}
            <ArticleCreationModal
              isOpen={isArticleModalOpen}
              onClose={() => setIsArticleModalOpen(false)}
              onPost={async (postData) => {
                // 这里需要实现实际的文章发布逻辑
                // 目前只是模拟发布，实际应用中需要调用API
                console.log('发布文章:', postData);

                // 实际应用中，这里应该调用创建文章的API
                // await createArticleAPI(postData);

                // 重新加载数据以显示新文章
                fetchHomeData();
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