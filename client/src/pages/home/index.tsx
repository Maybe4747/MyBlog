import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFiles, getUserProfile, getUserActivity, getPublicFiles } from '../../api/users';
import { addFile, getMyProfile, updateFile, deleteFile, likeFile, unlikeFile, commentOnFile, getFileComments, deleteFileComment } from '../../api/profiles';
import { createPost, getPosts, Post as ApiPost, updatePost, deletePost, togglePostLike, addPostComment, getPostComments, deletePostComment, Comment as PostComment } from '../../api/posts';
import { createArticle, getArticles, Article as ApiArticle, updateArticle, deleteArticle, getArticleById } from '../../api/articles';
import Navbar from '../../components/Navbar';
import { searchUsers } from '../../api/search';
import { followUser, unfollowUser, getFollowers, getFollowing } from '../../api/social';
import { getNotifications } from '../../api/notifications';
import { User } from '../../types';
import { getDefaultAvatar } from '../../utils/commonUtils';
import CommentSection from '../../components/CommentSection';
import { shareContent, generateShareUrl } from '../../utils/shareUtils';
import RecentActivity from './recentActivity';
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
  UploadIcon,
  UserPlusIcon,
  MailIcon,
  BellIcon
} from 'lucide-react';
import PostCreationModal from '../../components/PostCreationModal';
import ArticleCreationModal from '../../components/ArticleCreationModal';
import PostCard, { PostCardPost } from '../../components/PostCard';
import PostFeed from '../../components/PostFeed';
import { saveHomeDataCache, getHomeDataCache, clearHomeDataCache, updateCachedPost, removeCachedPost } from '../../utils/homeDataCache';

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
  userId?: number; // 用户ID，用于关注功能
  name: string;
  title: string;
  company: string;
  avatar: string;
  mutual: number;
  isFollowing?: boolean; // 是否已关注
}

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const navigationType = useNavigationType();
  const [posts, setPosts] = useState<Post[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [followers, setFollowers] = useState<any[]>([]); // 粉丝列表
  const [following, setFollowing] = useState<any[]>([]); // 关注列表
  const [activeTab, setActiveTab] = useState<'feed' | 'network'>('feed');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [postModalMediaType, setPostModalMediaType] = useState<'image' | 'video'>('image'); // 帖子弹窗的媒体类型
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null); // 当前打开的下拉菜单ID
  const [expandedComments, setExpandedComments] = useState<Set<string | number>>(new Set()); // 展开评论的帖子ID
  const [postComments, setPostComments] = useState<Record<string | number, PostComment[]>>({}); // 帖子评论
  const [loadingComments, setLoadingComments] = useState<Record<string | number, boolean>>({}); // 加载评论状态
  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set()); // 已关注的用户ID集合
  const [followingLoading, setFollowingLoading] = useState<Record<number, boolean>>({}); // 关注操作加载状态
  const [recentActivities, setRecentActivities] = useState<any[]>([]); // 近期活动列表
  const [contentFilter, setContentFilter] = useState<'all' | 'my' | 'following' | 'posts' | 'articles' | 'files'>('all'); // 内容筛选
  const navigate = useNavigate();
  const location = useLocation();

  // 使用一个标志来防止重复请求
  const hasFetchedData = useRef(false);
  
  // 发布成功提示状态
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 统计详情模态框相关状态
  const [statsModalOpen, setStatsModalOpen] = useState<boolean>(false);
  const [statsModalType, setStatsModalType] = useState<'files' | 'followers' | 'following'>('files');
  const [statsModalData, setStatsModalData] = useState<any[]>([]);
  const [statsModalLoading, setStatsModalLoading] = useState<boolean>(false);

  // 打开统计详情模态框
  const openStatsModal = async (type: 'files' | 'followers' | 'following') => {
    if (!user?.id) return;
    
    setStatsModalType(type);
    setStatsModalOpen(true);
    setStatsModalLoading(true);
    setStatsModalData([]);

    try {
      if (type === 'followers') {
        const response: any = await getFollowers(user.id);
        console.log('主页获取关注者列表响应:', response);
        // 后端可能直接返回 { followers, pagination } 或包装在 { code: 0, data: { followers, pagination } }
        const followers = response?.followers || response?.data?.followers || (response?.code === 0 ? response?.data?.followers : null);
        if (followers && Array.isArray(followers)) {
          console.log('主页关注者列表数据:', followers);
          setStatsModalData(followers);
        } else {
          console.warn('主页关注者列表数据格式异常:', response);
        }
      } else if (type === 'following') {
        const response: any = await getFollowing(user.id);
        console.log('主页获取关注列表响应:', response);
        // 后端可能直接返回 { followings, pagination } 或包装在 { code: 0, data: { followings, pagination } }
        const followings = response?.followings || response?.data?.followings || (response?.code === 0 ? response?.data?.followings : null);
        if (followings && Array.isArray(followings)) {
          console.log('主页关注列表数据:', followings);
          setStatsModalData(followings);
        } else {
          console.warn('主页关注列表数据格式异常:', response);
        }
      } else if (type === 'files') {
        const response: any = await getPublicFiles({ limit: 100 });
        if (response?.code === 0 && response?.data?.files) {
          const files = response.data.files.filter((file: any) => file.user_id === user.id);
          setStatsModalData(files);
        }
      }
    } catch (err: any) {
      console.error('获取统计数据失败:', err);
    } finally {
      setStatsModalLoading(false);
    }
  };

  // 关闭统计详情模态框
  const closeStatsModal = () => {
    setStatsModalOpen(false);
    setStatsModalData([]);
  };
  
  // 用户统计数据
  const [userStats, setUserStats] = useState({
    followers: 0,
    following: 0,
    files: 0,
    visitors: 0,
    newFollowers: 0
  });

  // 用户档案信息（从API获取的完整信息）
  const [userProfile, setUserProfile] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) {
      const shouldRefresh = location.state?.refresh;
      const isBackNavigation = navigationType === 'POP';
      
      // 如果是返回操作且缓存有效，使用缓存数据
      if (isBackNavigation && !shouldRefresh) {
        const cachedData = getHomeDataCache();
        if (cachedData) {
          console.log('使用缓存的首页数据');
          setPosts(cachedData.posts || []);
          setConnections(cachedData.connections || []);
          setFollowers(cachedData.followers || []);
          setFollowing(cachedData.following || []);
          setUserProfile(cachedData.profileData || {});
          setUserStats(cachedData.userStats || {
            followers: 0,
            following: 0,
            files: 0,
            visitors: 0,
            newFollowers: 0
          });
          setRecentActivities(cachedData.recentActivities || []);
          if (cachedData.contentFilter) {
            setContentFilter(cachedData.contentFilter as any);
          }
          setLoading(false);
          
          // 清除 location state，避免重复刷新
          if (shouldRefresh) {
            window.history.replaceState({}, '');
          }
          
          // 记录访客访问（延迟执行，避免影响页面加载）
          import('../../api/visitors').then(({ recordVisit }) => {
            setTimeout(() => {
              recordVisit(user.id).catch((err: any) => {
                console.error('记录访客访问失败:', err);
              });
            }, 1000);
          });
          
          return;
        }
      }
      
      // 否则正常获取数据
      fetchHomeData(shouldRefresh);
      // 清除 location state，避免重复刷新
      if (shouldRefresh) {
        window.history.replaceState({}, '');
      }
      
      // 记录访客访问（延迟执行，避免影响页面加载）
      import('../../api/visitors').then(({ recordVisit }) => {
        setTimeout(() => {
          recordVisit(user.id).catch((err: any) => {
            console.error('记录访客访问失败:', err);
          });
        }, 1000);
      });
    }

    // 清理函数，当组件卸载时重置标志
    return () => {
      // 不在这里重置，允许组件重新挂载时获取数据
    };
  }, [user, location.state, navigationType]);

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
      const stats = {
        followers: 0,
        following: 0,
        files: 0,
        visitors: 0,
        newFollowers: 0
      };
      
      try {
        const profileResponse: any = await getMyProfile();
        console.log('获取用户档案完整响应:', JSON.stringify(profileResponse, null, 2));
        // API拦截器返回的是 { code: 0, data: { profile: {...} }, msg: '...' }
        // 所以 profileResponse 就是整个响应对象
        const profileData = profileResponse?.data?.profile || profileResponse?.data?.user || profileResponse?.data?.data || {};
        console.log('解析后的profileData:', profileData);
        console.log('todayNewFollowers值:', profileData.todayNewFollowers);
        console.log('todayVisitors值:', profileData.todayVisitors);
        // 合并用户基础信息和档案信息
        const mergedProfile: Partial<User> = {
          ...user,
          ...profileData,
          position: profileData.position || profileData.title,
          company: profileData.company,
          location: profileData.location,
          bio: profileData.bio,
          skills: profileData.skills || []
        };
        
        // 保存用户档案信息到状态
        setUserProfile(mergedProfile);
        
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
        if (profileData.todayVisitors !== undefined) {
          stats.visitors = profileData.todayVisitors;
        }
        if (profileData.todayNewFollowers !== undefined) {
          stats.newFollowers = profileData.todayNewFollowers;
        } else {
          console.warn('todayNewFollowers未定义，使用默认值0');
        }
        
        console.log('最终stats:', stats);
        
        // 更新统计数据状态
        setUserStats(stats);
      } catch (profileError: any) {
        console.error('获取用户档案失败:', profileError);
        // 如果获取失败，使用 AuthContext 中的用户信息
        const fallbackProfile: Partial<User> = {
          ...user,
          position: user?.position,
          location: user?.location,
          company: user?.company,
          bio: user?.bio,
          skills: user?.skills || []
        };
        setUserProfile(fallbackProfile);
      }

      // 获取所有内容：posts、articles和files
      const allPosts: Post[] = [];

      // 1. 获取帖子（posts）
      try {
        // 传 visibility: 'followers'，后端会返回公开的 + 关注者可见的（如果已关注）+ 自己的
        const postsResponse: any = await getPosts({ limit: 20, visibility: 'followers' });
        if (postsResponse?.code === 0 && postsResponse?.data?.posts) {
          const posts = postsResponse.data.posts.map((post: ApiPost) => ({
            id: `post-${post.id}`, // 添加前缀确保唯一性
            originalId: post.id, // 存储原始ID用于API调用
            authorId: post.user_id, // 存储作者ID
            author: {
              name: post.username || '',
              title: '', // 帖子作者信息从API获取，这里不设置
              company: '',
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
        // 传 visibility: 'followers'，后端会返回公开的 + 关注者可见的（如果已关注）+ 自己的
        const articlesResponse: any = await getArticles({ limit: 20, visibility: 'followers' });
        if (articlesResponse?.code === 0 && articlesResponse?.data?.articles) {
          const articles = articlesResponse.data.articles.map((article: ApiArticle) => ({
            id: `article-${article.id}`, // 添加前缀确保唯一性
            originalId: article.id, // 存储原始ID用于API调用
            authorId: article.user_id, // 存储作者ID
            author: {
              name: article.username || '',
              title: '', // 文章作者信息从API获取，这里不设置
              company: '',
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
              name: activity.username || activity.owner_username || user?.username || '',
              title: '', // 文件作者信息从API获取，这里不设置
              company: '',
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

      // 去重：根据 id 去重，保留第一个出现的
      const uniquePostsMap = new Map<string | number, Post>();
      for (const post of allPosts) {
        if (!uniquePostsMap.has(post.id)) {
          uniquePostsMap.set(post.id, post);
        }
      }
      const uniquePosts = Array.from(uniquePostsMap.values());

      // 按时间排序（最新的在前）
      const formattedPosts = uniquePosts.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      });

      // 获取粉丝列表和关注列表
      let followersList: any[] = [];
      let followingList: any[] = [];
      
      if (user?.id) {
        try {
          // 获取粉丝列表
          const followersResponse: any = await getFollowers(user.id);
          const followersData = followersResponse?.followers || followersResponse?.data?.followers || (followersResponse?.code === 0 ? followersResponse?.data?.followers : null);
          if (followersData && Array.isArray(followersData)) {
            followersList = followersData;
          }
        } catch (err) {
          console.error('获取粉丝列表失败:', err);
        }

        try {
          // 获取关注列表
          const followingResponse: any = await getFollowing(user.id);
          const followingData = followingResponse?.followings || followingResponse?.data?.followings || (followingResponse?.code === 0 ? followingResponse?.data?.followings : null);
          if (followingData && Array.isArray(followingData)) {
            followingList = followingData;
          }
        } catch (err) {
          console.error('获取关注列表失败:', err);
        }
      }

      // 将关注列表转换为连接格式（职场人脉只显示关注的人）
      const formattedConnections: Connection[] = followingList.map((followUser: any) => ({
        id: followUser.id,
        userId: followUser.id,
        name: followUser.username,
        title: followUser.position || '未设置职位',
        company: followUser.company || '未设置公司',
        avatar: followUser.avatar || '',
        mutual: 0,
        isFollowing: true // 关注列表中的人都是已关注的
        }));

      // 初始化 followingUsers Set，将已关注的用户ID添加到 Set 中
      const initialFollowingUsers = new Set<number>();
      followingList.forEach((followUser: any) => {
        if (followUser.id) {
          initialFollowingUsers.add(followUser.id);
        }
      });

      setPosts(formattedPosts);
      setConnections(formattedConnections);
      setFollowers(followersList);
      setFollowing(followingList);
      setFollowingUsers(initialFollowingUsers); // 初始化关注状态

      // 获取近期活动（通知）
      let recentActivitiesList: any[] = [];
      try {
        const notificationsResponse: any = await getNotifications({ page: 1, limit: 5 });
        if (notificationsResponse?.code === 0 && notificationsResponse?.data?.notifications) {
          recentActivitiesList = notificationsResponse.data.notifications;
          setRecentActivities(recentActivitiesList);
        }
      } catch (notificationsError: any) {
        console.error('获取近期活动失败:', notificationsError);
        setRecentActivities([]);
      }

      // 保存数据到缓存
      saveHomeDataCache({
        posts: formattedPosts,
        articles: formattedPosts.filter(p => p.contentType === 'article'),
        files: formattedPosts.filter(p => p.contentType === 'file'),
        connections: formattedConnections,
        followers: followersList,
        following: followingList,
        profileData: userProfile,
        userStats: stats,
        recentActivities: recentActivitiesList,
        contentFilter: contentFilter
      });
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
  const [modalMediaType, setModalMediaType] = useState<'image' | 'video'>('image');

  const handleLike = async (postId: string | number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post || !post.originalId) return;

      // 根据内容类型调用不同的API
      // 帖子类型：image 或 video
      if (post.contentType === 'image' || post.contentType === 'video') {
        const result: any = await togglePostLike(post.originalId);
        // API 拦截器返回的是 { code, data, msg }，所以 result 就是响应数据
        console.log('点赞结果:', result);
        console.log('result.code:', result?.code);
        console.log('result.data:', result?.data);
        
        // result 的格式是 {code: 0, data: {liked: true, likeCount: 1}, msg: '点赞成功'}
        if (result && result.code === 0 && result.data) {
          const newLiked = result.data.liked;
          const newLikeCount = result.data.likeCount ?? post.likes;
          console.log('更新状态:', { newLiked, newLikeCount, currentLiked: post.liked, postId });
          
          // 使用函数式更新确保使用最新状态
          setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
              console.log('更新帖子:', p.id, '从', p.liked, '到', newLiked);
              return { 
                ...p, 
                liked: newLiked, 
                likes: newLikeCount
              };
            }
            return p;
          }));
        } else {
          console.error('点赞失败或响应格式错误:', result);
          console.error('条件检查:', { 
            hasResult: !!result, 
            code: result?.code, 
            hasData: !!result?.data 
          });
        }
      } else if (post.contentType === 'article') {
        const { toggleArticleLike } = await import('../../api/articles');
        const result: any = await toggleArticleLike(post.originalId);
        // API 拦截器返回的是 { code, data, msg }，所以 result 就是响应数据
        console.log('点赞结果:', result);
        console.log('result.code:', result?.code);
        console.log('result.data:', result?.data);
        
        // result 的格式是 {code: 0, data: {liked: true, likeCount: 1}, msg: '点赞成功'}
        if (result && result.code === 0 && result.data) {
          const newLiked = result.data.liked;
          const newLikeCount = result.data.likeCount ?? post.likes;
          console.log('更新状态:', { newLiked, newLikeCount, currentLiked: post.liked, postId });
          
          // 使用函数式更新确保使用最新状态
          setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
              console.log('更新文章:', p.id, '从', p.liked, '到', newLiked);
              return { 
                ...p, 
                liked: newLiked, 
                likes: newLikeCount
              };
            }
            return p;
          }));
        } else {
          console.error('点赞失败或响应格式错误:', result);
          console.error('条件检查:', { 
            hasResult: !!result, 
            code: result?.code, 
            hasData: !!result?.data 
          });
        }
      } else if (post.contentType === 'file') {
        // 文件点赞：需要先检查是否已点赞，然后调用对应的API
        const isCurrentlyLiked = post.liked;
        let result: any;
        
        if (isCurrentlyLiked) {
          // 取消点赞
          result = await unlikeFile(post.originalId);
        } else {
          // 添加点赞
          result = await likeFile(post.originalId);
        }
        
        console.log('文件点赞结果:', result);
        
        // 文件点赞API返回格式：{code: 0, data: {liked: true/false, likeCount: number}, msg: '...'}
        if (result && result.code === 0 && result.data) {
          const newLiked = result.data.liked;
          const newLikeCount = result.data.likeCount ?? post.likes;
          
          console.log('更新文件状态:', { newLiked, newLikeCount, currentLiked: post.liked, postId });
          
          // 使用函数式更新确保使用最新状态
          setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
              console.log('更新文件:', p.id, '从', p.liked, '到', newLiked);
              return { 
                ...p, 
                liked: newLiked, 
                likes: newLikeCount
              };
            }
            return p;
          }));
        } else {
          console.error('文件点赞失败或响应格式错误:', result);
        }
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
      console.error('点赞操作失败:', err);
    }
  };

  const handleToggleComments = async (postId: string | number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post || !post.originalId) return;

    const isExpanded = expandedComments.has(postId);
    
    if (isExpanded) {
      // 收起评论
      setExpandedComments(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      // 展开评论
      setExpandedComments(prev => new Set(prev).add(postId));
      
      // 如果还没有加载过评论，则加载
      if (!postComments[postId]) {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        try {
          if (post.contentType === 'image' || post.contentType === 'video') {
            const result: any = await getPostComments(post.originalId);
            console.log('获取帖子评论结果:', result);
            // API拦截器返回的是 {code, data, msg}，所以result就是响应数据
            if (result && result.code === 0 && result.data) {
              setPostComments(prev => ({ ...prev, [postId]: result.data.comments || [] }));
            } else {
              console.error('获取评论失败:', result);
            }
          } else if (post.contentType === 'article') {
            const { getArticleComments } = await import('../../api/articles');
            const result: any = await getArticleComments(post.originalId);
            console.log('获取文章评论结果:', result);
            // API拦截器返回的是 {code, data, msg}，所以result就是响应数据
            if (result && result.code === 0 && result.data) {
              setPostComments(prev => ({ ...prev, [postId]: result.data.comments || [] }));
            } else {
              console.error('获取评论失败:', result);
            }
          } else if (post.contentType === 'file') {
            const result: any = await getFileComments(post.originalId);
            console.log('获取文件评论结果:', result);
            // API拦截器返回的是 {code, data, msg}，所以result就是响应数据
            if (result && result.code === 0 && result.data) {
              setPostComments(prev => ({ ...prev, [postId]: result.data.comments || [] }));
            } else {
              console.error('获取评论失败:', result);
            }
          }
        } catch (err) {
          console.error('加载评论失败:', err);
        } finally {
          setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
      }
    }
  };

  const handleAddComment = async (postId: string | number, content: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.originalId) return;

    try {
      if (post.contentType === 'image' || post.contentType === 'video') {
        const result: any = await addPostComment(post.originalId, content);
        console.log('添加帖子评论结果:', result);
        // API拦截器返回的是 {code, data, msg}，所以result就是响应数据
        if (result && result.code === 0 && result.data && result.data.comment) {
          setPostComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), result.data.comment]
          }));
          // 更新评论数
          setPosts(prevPosts => prevPosts.map(p =>
            p.id === postId ? { ...p, comments: p.comments + 1 } : p
          ));
        } else {
          console.error('添加评论失败:', result);
        }
      } else if (post.contentType === 'article') {
        const { addArticleComment } = await import('../../api/articles');
        const result: any = await addArticleComment(post.originalId, content);
        console.log('添加文章评论结果:', result);
        // API拦截器返回的是 {code, data, msg}，所以result就是响应数据
        if (result && result.code === 0 && result.data && result.data.comment) {
          setPostComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), result.data.comment]
          }));
          // 更新评论数
          setPosts(prevPosts => prevPosts.map(p =>
            p.id === postId ? { ...p, comments: p.comments + 1 } : p
          ));
        } else {
          console.error('添加评论失败:', result);
        }
      } else if (post.contentType === 'file') {
        const result: any = await commentOnFile(post.originalId, content);
        console.log('添加文件评论结果:', result);
        // API拦截器返回的是 {code, data, msg}，所以result就是响应数据
        if (result && result.code === 0 && result.data && result.data.comment) {
          setPostComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), result.data.comment]
          }));
          // 更新评论数
          setPosts(prevPosts => prevPosts.map(p =>
            p.id === postId ? { ...p, comments: p.comments + 1 } : p
          ));
        } else {
          console.error('添加评论失败:', result);
        }
      }
    } catch (err) {
      console.error('添加评论失败:', err);
      throw err;
    }
  };

  const handleDeleteComment = async (postId: string | number, commentId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.originalId) return;

    try {
      if (post.contentType === 'image' || post.contentType === 'video') {
        const result: any = await deletePostComment(post.originalId, commentId);
        console.log('删除帖子评论结果:', result);
        // API拦截器返回的是 {code, data, msg}，所以result就是响应数据
        if (result && result.code === 0) {
          setPostComments(prev => ({
            ...prev,
            [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
          }));
          // 更新评论数
          setPosts(prevPosts => prevPosts.map(p =>
            p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p
          ));
        } else {
          console.error('删除评论失败:', result);
        }
      } else if (post.contentType === 'article') {
        const { deleteArticleComment } = await import('../../api/articles');
        const result: any = await deleteArticleComment(post.originalId, commentId);
        console.log('删除文章评论结果:', result);
        // API拦截器返回的是 {code, data, msg}，所以result就是响应数据
        if (result && result.code === 0) {
          setPostComments(prev => ({
            ...prev,
            [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
          }));
          // 更新评论数
          setPosts(prevPosts => prevPosts.map(p =>
            p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p
          ));
        } else {
          console.error('删除评论失败:', result);
        }
      } else if (post.contentType === 'file') {
        const result: any = await deleteFileComment(post.originalId, commentId);
        console.log('删除文件评论结果:', result);
        // API拦截器返回的是 {code, data, msg}，所以result就是响应数据
        if (result && result.code === 0) {
          setPostComments(prev => ({
            ...prev,
            [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
          }));
          // 更新评论数
          setPosts(prevPosts => prevPosts.map(p =>
            p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p
          ));
        } else {
          console.error('删除评论失败:', result);
        }
      }
    } catch (err) {
      console.error('删除评论失败:', err);
      throw err;
    }
  };

  const handleShare = async (post: Post) => {
    if (!post.originalId) return;

    let shareUrl = '';
    let shareTitle = '';
    let shareText = '';

    if (post.contentType === 'image' || post.contentType === 'video') {
      shareUrl = generateShareUrl('post', post.originalId);
      shareTitle = '分享一个帖子';
      shareText = post.content || post.description || '';
    } else if (post.contentType === 'article') {
      shareUrl = generateShareUrl('article', post.originalId);
      shareTitle = post.title || '分享一篇文章';
      shareText = post.description || '';
    } else if (post.contentType === 'file') {
      shareUrl = generateShareUrl('file', post.originalId);
      shareTitle = post.title || '分享一个文件';
      shareText = post.description || '';
    }

    const result = await shareContent({
      title: shareTitle,
      text: shareText,
      url: shareUrl
    });

    if (result.success) {
      if (result.method === 'copy') {
        setSuccessMessage('链接已复制到剪贴板！');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } else {
      setError('分享失败，请手动复制链接');
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

  const openImageModal = (imageUrl: string, title: string, mediaType: 'image' | 'video' = 'image') => {
    setModalImageUrl(imageUrl);
    setModalImageTitle(title);
    setModalMediaType(mediaType);
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
      {/* 图片/视频预览模态框 */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          <div className="relative max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors z-10"
            >
              <XIcon className="w-6 h-6" />
            </button>
            {modalMediaType === 'video' ? (
              <video
                src={modalImageUrl}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              >
                您的浏览器不支持视频播放
              </video>
            ) : (
              <img
                src={modalImageUrl}
                alt={modalImageTitle}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
            {modalImageTitle && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center bg-black/50 px-4 py-2 rounded-lg">
                <p className="font-medium">{modalImageTitle}</p>
              </div>
            )}
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
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-16 lg:self-start">
            {/* User profile card */}
            <div className="bg-gradient-to-br from-white via-blue-50/40 to-purple-50/30 rounded-2xl shadow-lg border border-blue-100/60 p-6 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Link to={`/profile/${user?.username}`} className="block">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-xl opacity-50"></div>
                    <img
                      className="h-20 w-20 rounded-full ring-4 ring-white/80 relative z-10 cursor-pointer hover:ring-blue-300 transition-all"
                      src={user?.avatar || getDefaultAvatar(user?.username)}
                      alt={user?.username}
                    />
                  </Link>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{userProfile?.username || user?.username || '用户'}</h3>
                {(userProfile?.position || userProfile?.company) && (
                  <p className="text-sm text-gray-600 font-medium">
                    {userProfile?.position || ''}
                    {userProfile?.position && userProfile?.company && ' · '}
                    {userProfile?.company || ''}
                  </p>
                )}
                {userProfile?.location && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <MapPinIcon className="w-3 h-3 mr-1" />
                    {userProfile.location}
                  </p>
                )}

                <div className="flex space-x-6 mt-6 text-center w-full border-t border-blue-100/50 pt-4">
                  <div 
                    className="flex-1 cursor-pointer hover:bg-blue-50/50 rounded-lg p-2 transition-colors"
                    onClick={() => openStatsModal('followers')}
                  >
                    <p className="text-lg font-bold text-blue-600">{userStats.followers}</p>
                    <p className="text-xs text-gray-500 mt-1">粉丝</p>
                  </div>
                  <div 
                    className="flex-1 cursor-pointer hover:bg-purple-50/50 rounded-lg p-2 transition-colors"
                    onClick={() => openStatsModal('following')}
                  >
                    <p className="text-lg font-bold text-purple-600">{userStats.following}</p>
                    <p className="text-xs text-gray-500 mt-1">关注</p>
                  </div>
                  <div 
                    className="flex-1 cursor-pointer hover:bg-pink-50/50 rounded-lg p-2 transition-colors"
                    onClick={() => openStatsModal('files')}
                  >
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
                    <span className="text-sm font-medium text-gray-700">访客总量</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{userStats.visitors}</span>
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
                        src={user?.avatar || getDefaultAvatar(user?.username)}
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

                {/* Posts feed with filter */}
                <PostFeed
                  posts={posts.map(post => ({
                    ...post,
                    author: {
                      ...post.author,
                      title: post.author.title || '',
                      company: post.author.company || '',
                    },
                  })) as PostCardPost[]}
                          currentUserId={user?.id}
                  contentFilter={contentFilter}
                  onFilterChange={setContentFilter}
                  showFilter={true}
                  showMyFilter={true}
                  followingUserIds={followingUsers}
                  onLike={handleLike}
                  onToggleComments={handleToggleComments}
                  onShare={(post) => handleShare(post as any)}
                  onEdit={(post) => handleEdit(post as any)}
                  onDelete={(postId) => setDeletingPostId(postId)}
                  onImageModalOpen={openImageModal}
                  postComments={postComments}
                  loadingComments={loadingComments}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  expandedComments={expandedComments}
                  showActions={true}
                  emptyStateAction={
                    contentFilter === 'all' ? (
                      <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        发布第一条动态
                      </button>
                    ) : undefined
                  }
                />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connections.length > 0 ? (
                    connections.map((connection) => (
                      <div key={connection.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex flex-col items-center text-center">
                          <Link to={`/profile/${connection.name}`} className="block w-full">
                            <img
                              className="h-20 w-20 rounded-full mx-auto mb-3 border-2 border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
                              src={connection.avatar || getDefaultAvatar(connection.name)}
                              alt={connection.name}
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/profile/${connection.name}`);
                              }}
                            />
                            <h4 
                              className="text-sm font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/profile/${connection.name}`);
                              }}
                            >
                              {connection.name}
                            </h4>
                            <p className="text-xs text-gray-600 mb-1">{connection.title || '未设置职位'}</p>
                            <p className="text-xs text-gray-500 mb-3">{connection.company || '未设置公司'}</p>
                          </Link>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!user || !connection.userId) {
                                navigate('/login');
                                return;
                              }
                              
                              const userId = connection.userId;
                              
                              setFollowingLoading(prev => ({ ...prev, [userId]: true }));
                              
                              try {
                                // 因为这是关注列表，所以都是已关注状态，点击就是取消关注
                                  const result: any = await unfollowUser(userId);
                                  if (result?.code === 0 || result?.data?.code === 0) {
                                    setFollowingUsers(prev => {
                                      const next = new Set(prev);
                                      next.delete(userId);
                                      return next;
                                    });
                                  // 从连接列表中移除
                                  setConnections(prev => prev.filter(conn => conn.userId !== userId));
                                  // 从关注列表中移除
                                  setFollowing(prev => prev.filter((u: any) => u.id !== userId));
                                    setUserStats(prev => ({ ...prev, following: Math.max(0, prev.following - 1) }));
                                  } else {
                                    console.error('取消关注失败:', result);
                                    setError(result?.msg || '取消关注失败');
                                }
                              } catch (err: any) {
                                console.error('取消关注失败:', err);
                                setError(err.message || '操作失败');
                              } finally {
                                setFollowingLoading(prev => ({ ...prev, [userId]: false }));
                              }
                            }}
                            disabled={followingLoading[connection.userId || 0]}
                            className={`w-full text-xs px-4 py-2 rounded-lg transition-colors font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 ${
                              followingLoading[connection.userId || 0] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {followingLoading[connection.userId || 0] ? '处理中...' : '取消关注'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无人脉</h3>
                      <p className="text-gray-500 mb-4">您还没有关注任何人</p>
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
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-16 lg:self-start">
            {/* Recent activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">近期活动</h3>
              <div className="space-y-4">
                <RecentActivity activities={recentActivities} />
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

      {/* 统计详情模态框 */}
      {statsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeStatsModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 模态框头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {statsModalType === 'files' ? '文件' : statsModalType === 'followers' ? '粉丝' : '关注'}
              </h3>
              <button
                onClick={closeStatsModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              {statsModalLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : statsModalData.length > 0 ? (
                <div className="space-y-3">
                  {statsModalData.map((item: any) => {
                    if (statsModalType === 'files') {
                      return (
                        <div key={item.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <FileTextIcon className="h-10 w-10 text-blue-500 mr-4" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{item.title || item.original_name}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.size ? `${(item.size / 1024).toFixed(1)} KB` : '未知大小'} · {item.mime_type || '未知类型'}
                            </p>
                          </div>
                        </div>
                      );
                    } else {
                      // 粉丝或关注列表
                      return (
                        <div key={item.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <img
                            className="h-12 w-12 rounded-full object-cover cursor-pointer border-2 border-gray-100 hover:border-blue-300 transition-colors"
                            src={item.avatar || getDefaultAvatar(item.username)}
                            alt={item.username}
                            onClick={() => {
                              navigate(`/profile/${item.username}`);
                              closeStatsModal();
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getDefaultAvatar(item.username);
                            }}
                          />
                          <div className="ml-4 flex-1 min-w-0">
                            <h4 
                              className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600 truncate"
                              onClick={() => {
                                navigate(`/profile/${item.username}`);
                                closeStatsModal();
                              }}
                            >
                              {item.username}
                            </h4>
                            {item.bio && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.bio}</p>
                            )}
                            {item.position && (
                              <p className="text-xs text-gray-600 mt-1">{item.position}</p>
                            )}
                          </div>
                          {user && item.id !== user.id && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const userId = item.id;
                                const isCurrentlyFollowing = followingUsers.has(userId) || item.isFollowing;
                                
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
                                      setStatsModalData(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: false } : u));
                                      setUserStats(prev => ({ ...prev, following: Math.max(0, prev.following - 1) }));
                                    }
                                  } else {
                                    const result: any = await followUser(userId);
                                    if (result?.code === 0 || result?.data?.code === 0) {
                                      setFollowingUsers(prev => new Set(prev).add(userId));
                                      setStatsModalData(prev => prev.map(u => u.id === userId ? { ...u, isFollowing: true } : u));
                                      setUserStats(prev => ({ ...prev, following: prev.following + 1 }));
                                    }
                                  }
                                } catch (err: any) {
                                  console.error('关注操作失败:', err);
                                } finally {
                                  setFollowingLoading(prev => ({ ...prev, [userId]: false }));
                                }
                              }}
                              disabled={followingLoading[item.id]}
                              className={`px-4 py-2 text-sm rounded-full transition-colors ml-4 ${
                                (followingUsers.has(item.id) || item.isFollowing)
                                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              } ${followingLoading[item.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {followingLoading[item.id] ? '处理中...' : 
                               (followingUsers.has(item.id) || item.isFollowing) ? '已关注' : '关注'}
                            </button>
                          )}
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {statsModalType === 'files' ? '暂无文件' : statsModalType === 'followers' ? '暂无粉丝' : '暂无关注'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
     </div>
  );
}

export default Home;