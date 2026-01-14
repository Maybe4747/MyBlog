import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserIcon, BriefcaseIcon, MapPinIcon, LinkIcon, CalendarIcon, HeartIcon, MessageCircleIcon, MoreHorizontalIcon, FileIcon, DownloadIcon, UsersIcon, UserCheckIcon, MessageSquareIcon, FileTextIcon, ImageIcon, GraduationCapIcon, PlusIcon, Edit3Icon, Trash2Icon, CameraIcon, Building2Icon, XIcon, ShareIcon } from 'lucide-react';
import { getUserProfile, getUserActivity, getPublicFiles } from '../../api/users';
import { updateProfile } from '../../api/profiles';
import api from '../../api/client';
import { followUser, unfollowUser, getFollowers, getFollowing } from '../../api/social';
import { addMessage, getUserMessages, likeMessage, unlikeMessage, deleteMessage } from '../../api/messages';
import { getPosts, togglePostLike, addPostComment, getPostComments, deletePostComment, Comment as PostComment } from '../../api/posts';
import { getArticles, toggleArticleLike, addArticleComment, getArticleComments, deleteArticleComment } from '../../api/articles';
import { likeFile, unlikeFile, commentOnFile, getFileComments, deleteFileComment } from '../../api/profiles';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultAvatar } from '../../utils/commonUtils';
import { 
  getUserExperiences,
  addUserExperience,
  updateUserExperience,
  deleteUserExperience,
  getUserEducations,
  addUserEducation,
  updateUserEducation,
  deleteUserEducation
} from '../../api/experiences';
import PostCard, { PostCardPost } from '../../components/PostCard';
import PostFeed from '../../components/PostFeed';

// 日期格式化辅助函数
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return '';
  }
  
  try {
    // 先处理字符串，移除时间部分（如果有）
    const dateOnly = typeof dateString === 'string' ? dateString.split('T')[0] : String(dateString).split('T')[0];
    
    // 解析 YYYY-MM-DD 格式
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 月份从0开始
      const day = parseInt(parts[2], 10);
      
      // 验证日期有效性
      if (year > 0 && month >= 0 && month <= 11 && day > 0 && day <= 31) {
        // 使用本地时区创建日期对象，避免时区问题
        const date = new Date(year, month, day);
        
        // 验证日期是否有效（防止无效日期如 2025-02-30）
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
          return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
        }
      }
    }
    
    // 如果手动解析失败，尝试使用 Date 构造函数
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
    }
    
    // 如果都失败，返回原始字符串
    return String(dateString);
  } catch (error) {
    console.error('日期格式化错误:', error, dateString);
    return String(dateString); // 出错时返回原始字符串
  }
};

// 内联 ExperienceForm 组件
const ExperienceForm = ({ experience, onSubmit, onCancel, type }: { experience?: any; onSubmit: (data: any) => void | Promise<void>; onCancel: () => void; type: 'experience' | 'education' }) => {
  const [formData, setFormData] = useState({
    company: experience?.company || experience?.school || '',
    position: experience?.position || '',
    school: experience?.school || experience?.company || '',
    degree: experience?.degree || '',
    major: experience?.major || '',
    startDate: experience?.start_date?.split('T')[0] || experience?.startDate?.split('T')[0] || '',
    endDate: experience?.end_date?.split('T')[0] || experience?.endDate?.split('T')[0] || '',
    description: experience?.description || '',
  });

  const [isCurrent, setIsCurrent] = useState(!experience?.end_date && !experience?.endDate);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = type === 'experience'
      ? {
          company: formData.company,
          position: formData.position,
          startDate: formData.startDate,
          endDate: isCurrent ? null : formData.endDate,
          description: formData.description,
        }
      : {
          school: formData.school,
          degree: formData.degree,
          major: formData.major,
          startDate: formData.startDate,
          endDate: isCurrent ? null : formData.endDate,
          description: formData.description,
        };

    if (experience?.id) {
      onSubmit({ ...data, id: experience.id });
    } else {
      onSubmit(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* 头部 */}
        <div className={`sticky top-0 z-10 px-6 py-5 border-b border-gray-100 ${type === 'experience' ? 'bg-gradient-to-r from-blue-50/50 to-blue-100/30' : 'bg-gradient-to-r from-purple-50/50 to-purple-100/30'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {type === 'experience' ? (
                <BriefcaseIcon className="h-5 w-5 text-blue-500 mr-2" />
              ) : (
                <GraduationCapIcon className="h-5 w-5 text-purple-500 mr-2" />
              )}
              <h3 className="text-xl font-semibold text-gray-800">
                {experience ? '编辑' : '添加'} {type === 'experience' ? '工作经历' : '教育经历'}
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {type === 'experience' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">公司名称</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 bg-gray-50/50 transition-all"
                  placeholder="请输入公司名称"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">职位名称</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 bg-gray-50/50 transition-all"
                  placeholder="请输入职位名称"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">学校名称</label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 bg-gray-50/50 transition-all"
                  placeholder="请输入学校名称"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">学位</label>
                  <input
                    type="text"
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 bg-gray-50/50 transition-all"
                    placeholder="如：本科"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">专业</label>
                  <input
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-300 bg-gray-50/50 transition-all"
                    placeholder="如：计算机科学"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">开始日期</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 bg-gray-50/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">结束日期</label>
              <input
                type="date"
                name="endDate"
                value={isCurrent ? '' : formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 bg-gray-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCurrent}
              />
              <div className="mt-2">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isCurrent}
                    onChange={(e) => setIsCurrent(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400 cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800">至今</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{type === 'experience' ? '工作描述' : '教育描述'}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 bg-gray-50/50 transition-all resize-none"
              placeholder={type === 'experience' ? '描述您的工作内容、成就等...' : '描述您的学习经历、成就等...'}
            />
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-white font-medium transition-all shadow-sm hover:shadow-md ${
                type === 'experience' 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              {experience ? '更新' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ProfileParams {
  username: string;
}

const Profile = () => {
  const { username } = useParams<ProfileParams>();
  const { user: currentUser, updateUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  // 内容列表相关状态
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userArticles, setUserArticles] = useState<any[]>([]);
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const hasFetchedContent = useRef(false);
  const hasFetchedFiles = useRef(false);

  // 社交相关状态
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState<boolean>(false);
  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set());
  const [followingLoading, setFollowingLoading] = useState<Record<number, boolean>>({});
  
  const navigate = useNavigate();

  // 留言相关状态
  const [messages, setMessages] = useState<any[]>([]);
  const [messageContent, setMessageContent] = useState<string>('');
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);

  // 工作经历和教育经历相关状态
  const [experiences, setExperiences] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [experiencesLoading, setExperiencesLoading] = useState<boolean>(false);
  const [showAddExperience, setShowAddExperience] = useState<boolean>(false);
  const [showAddEducation, setShowAddEducation] = useState<boolean>(false);
  const [editingExperience, setEditingExperience] = useState<any>(null);
  const [editingEducation, setEditingEducation] = useState<any>(null);

  // 编辑相关状态
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEditingSkills, setIsEditingSkills] = useState<boolean>(false);
  const [editData, setEditData] = useState<{
    bio: string;
    location: string;
    position: string;
    company: string;
    skills: string;
    socialLinks: Array<{ platform: string; url: string }>;
  }>({
    bio: '',
    location: '',
    position: '',
    company: '',
    skills: '',
    socialLinks: []
  });
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  
  // 头像和背景图片上传相关状态
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // 预览模态框相关状态
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string>('');
  const [previewMediaType, setPreviewMediaType] = useState<'image' | 'video'>('image');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // 打开预览模态框
  const openPreviewModal = useCallback((mediaUrl: string, mediaType: 'image' | 'video', title: string = '') => {
    setPreviewMediaUrl(mediaUrl);
    setPreviewMediaType(mediaType);
    setPreviewTitle(title);
    setPreviewModalOpen(true);
  }, []);

  // 关闭预览模态框
  const closePreviewModal = useCallback(() => {
    setPreviewModalOpen(false);
    setPreviewMediaUrl('');
    setPreviewTitle('');
  }, []);

  // 评论相关状态
  const [expandedComments, setExpandedComments] = useState<Set<string | number>>(new Set());
  const [postComments, setPostComments] = useState<Record<string | number, PostComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string | number, boolean>>({});


  // 获取用户活动流（包括文件、帖子、文章）
  const fetchUserActivity = useCallback(async (): Promise<void> => {
    console.log('fetchUserActivity: 函数被调用', { username, hasProfileData: !!profileData });
    
    if (!username || !profileData) {
      console.log('fetchUserActivity: 缺少 username 或 profileData，跳过请求', { username, profileData });
      return;
    }

    try {
      console.log('fetchUserActivity: 设置 loading 状态');
      setContentLoading(true);
      
      // 判断是否是自己的档案
      const isOwn = currentUser && currentUser.username === username;
      
      // 尝试多种方式获取 userId
      let userId = profileData.id || profileData.userId || profileData.user_id;
      
      // 获取关注状态（用于判断是否显示关注者可见的内容）
      const currentIsFollowing = isFollowing;
      
      console.log('fetchUserActivity: 检查 userId', { 
        profileData,
        id: profileData.id,
        userId: profileData.userId,
        user_id: profileData.user_id,
        username: profileData.username,
        finalUserId: userId,
        isOwn
      });
      
      // 如果没有 userId，但如果是查看自己的档案，可以使用 currentUser.id
      if (!userId && isOwn && currentUser?.id) {
        userId = currentUser.id;
        console.log('fetchUserActivity: 使用 currentUser.id', { userId });
      }
      
      if (!userId) {
        console.warn('fetchUserActivity: 缺少 userId，无法获取内容', { 
          profileData,
          username 
        });
        setUserActivity([]);
        setUserPosts([]);
        setUserArticles([]);
        setUserFiles([]);
        return;
      }
      
      console.log('fetchUserActivity: 开始获取内容', { username, userId, isOwn });
      
      // 并行获取文件、帖子和文章
      // 传 visibility: 'followers'，后端会返回公开的 + 关注者可见的（如果已关注）+ 自己的
      const [filesResponse, postsResponse, articlesResponse] = await Promise.allSettled([
        getPublicFiles({ limit: 50 }),
        getPosts({ userId, limit: 50, visibility: 'followers' }),
        getArticles({ userId, limit: 50, visibility: 'followers' })
      ]);
      
      // 处理文件数据
      let files: any[] = [];
      if (filesResponse.status === 'fulfilled') {
        const response = filesResponse.value as any;
        if (response?.code === 0 && response?.data?.files) {
          const allFiles = response.data.files;
          files = allFiles.filter((file: any) => {
            if (isOwn) {
              return file.user_id === userId;
            } else {
              // 显示公开的，或者如果当前用户已关注该作者，也显示关注者可见的
              return file.user_id === userId && (
                file.visibility === 'public' || 
                (file.visibility === 'followers' && currentIsFollowing)
              );
            }
          });
          setUserFiles(files);
        } else {
          setUserFiles([]);
        }
      } else {
        setUserFiles([]);
      }
      
      // 处理帖子数据
      let posts: any[] = [];
      if (postsResponse.status === 'fulfilled') {
        const response = postsResponse.value as any;
        if (response?.code === 0 && response?.data?.posts) {
          const allPosts = response.data.posts;
          posts = allPosts.filter((post: any) => {
            if (isOwn) {
              return post.user_id === userId;
            } else {
              // 显示公开的，或者如果当前用户已关注该作者，也显示关注者可见的
              return post.user_id === userId && (
                post.visibility === 'public' || 
                (post.visibility === 'followers' && currentIsFollowing)
              );
            }
          });
          setUserPosts(posts);
        } else {
          setUserPosts([]);
        }
      } else {
        setUserPosts([]);
      }
      
      // 处理文章数据
      let articles: any[] = [];
      if (articlesResponse.status === 'fulfilled') {
        const response = articlesResponse.value as any;
        if (response?.code === 0 && response?.data?.articles) {
          const allArticles = response.data.articles;
          articles = allArticles.filter((article: any) => {
            if (isOwn) {
              return article.user_id === userId;
            } else {
              // 显示公开的，或者如果当前用户已关注该作者，也显示关注者可见的
              return article.user_id === userId && (
                article.visibility === 'public' || 
                (article.visibility === 'followers' && currentIsFollowing)
              );
            }
          });
          setUserArticles(articles);
        } else {
          setUserArticles([]);
        }
      } else {
        setUserArticles([]);
      }
      
      // 合并所有活动到 userActivity（用于"我的动态"标签页）
      const activities: any[] = [];
      
      // 添加文件活动
      files.forEach((file: any) => {
        activities.push({
          id: `file_${file.id}`,
          originalId: file.id,
          type: 'file_upload',
          title: file.title,
          description: file.description,
          originalName: file.original_name,
          size: file.size,
          mimeType: file.mime_type,
          fileUrl: file.file_url,
          uploadedAt: file.uploaded_at,
          createdAt: file.uploaded_at,
          visibility: file.visibility,
          likeCount: file.likeCount || 0,
          commentCount: file.commentCount || 0,
          downloadCount: file.download_count || 0
        });
      });
      
      // 添加帖子活动
      posts.forEach((post: any) => {
        const isVideo = post.image_url && (
          post.image_url.toLowerCase().endsWith('.mp4') ||
          post.image_url.toLowerCase().endsWith('.webm') ||
          post.image_url.toLowerCase().endsWith('.ogg') ||
          post.image_url.toLowerCase().endsWith('.mov')
        );
        
        activities.push({
          id: `post_${post.id}`,
          originalId: post.id,
          type: isVideo ? 'video_post' : (post.image_url ? 'image_post' : 'post'),
          title: post.content || '帖子',
          content: post.content,
          caption: post.content,
          description: post.content,
          mediaUrl: post.image_url,
          mediaType: isVideo ? 'video' : 'image',
          createdAt: post.created_at,
          uploadedAt: post.created_at,
          visibility: post.visibility,
          likeCount: post.like_count || 0,
          commentCount: post.comment_count || 0
        });
      });
      
      // 添加文章活动
      articles.forEach((article: any) => {
        activities.push({
          id: `article_${article.id}`,
          originalId: article.id,
          type: 'article',
          title: article.title,
          description: article.summary || article.content?.substring(0, 200),
          summary: article.summary,
          content: article.content,
          articleUrl: `/articles/${article.id}`,
          createdAt: article.created_at,
          publishedAt: article.created_at,
          visibility: article.visibility,
          likeCount: article.like_count || 0,
          commentCount: article.comment_count || 0,
          claps: article.like_count || 0,
          readTime: '3分钟'
        });
      });
      
      // 按时间排序（最新的在前）
      activities.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.uploadedAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.uploadedAt || 0).getTime();
        return timeB - timeA;
      });
      
      console.log('fetchUserActivity: 设置活动列表', { 
        activitiesCount: activities.length,
        filesCount: files.length,
        postsCount: posts.length,
        articlesCount: articles.length
      });
      
      setUserActivity(activities);
    } catch (err: any) {
      console.error('获取用户活动流失败:', err);
      setUserActivity([]);
      setUserPosts([]);
      setUserArticles([]);
      setUserFiles([]);
    } finally {
      setContentLoading(false);
    }
  }, [username, profileData, currentUser, isFollowing]);

  // 获取工作经历和教育经历
  const fetchExperiencesAndEducations = useCallback(async () => {
    try {
      setExperiencesLoading(true);
      const [expResponse, eduResponse] = await Promise.all([
        getUserExperiences(),
        getUserEducations()
      ]);
      
      // 直接使用数据库返回的字段名（start_date, end_date）
      let experiencesData = expResponse.data?.data?.experiences || expResponse.data?.experiences || [];
      let educationsData = eduResponse.data?.data?.educations || eduResponse.data?.educations || [];
      
      // 前端排序（作为备用，确保排序正确）
      // 排序规则：仍在职/在读的优先，然后按结束时间（如果有）或开始时间降序
      experiencesData = experiencesData.sort((a: any, b: any) => {
        // 仍在职的（end_date 为 null）优先显示
        if (!a.end_date && b.end_date) return -1;
        if (a.end_date && !b.end_date) return 1;
        
        // 比较结束时间（如果有）或开始时间
        const aDate = a.end_date || a.start_date;
        const bDate = b.end_date || b.start_date;
        
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        
        const dateA = new Date(aDate).getTime();
        const dateB = new Date(bDate).getTime();
        
        return dateB - dateA; // 降序，最新的在前
      });
      
      educationsData = educationsData.sort((a: any, b: any) => {
        // 仍在读的（end_date 为 null）优先显示
        if (!a.end_date && b.end_date) return -1;
        if (a.end_date && !b.end_date) return 1;
        
        // 比较结束时间（如果有）或开始时间
        const aDate = a.end_date || a.start_date;
        const bDate = b.end_date || b.start_date;
        
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        
        const dateA = new Date(aDate).getTime();
        const dateB = new Date(bDate).getTime();
        
        return dateB - dateA; // 降序，最新的在前
      });
      
      setExperiences(experiencesData);
      setEducations(educationsData);
    } catch (err) {
      console.error('获取工作经历和教育经历失败:', err);
    } finally {
      setExperiencesLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        console.log('fetchProfile: 缺少 username，跳过请求');
        return;
      }

      console.log('fetchProfile: 开始获取用户档案', { username });
      
      try {
        setLoading(true);
        console.log('fetchProfile: 调用 getUserProfile API', { username });
        const response = await getUserProfile(username);
        console.log('fetchProfile: API 响应', { 
          status: response.status,
          data: response.data,
          fullResponse: response 
        });
        
        const userData = response.data?.data?.user || response.data?.user;
        const stats = response.data?.data?.stats || response.data?.stats || {};
        
        console.log('fetchProfile: 解析后的数据', { 
          userData, 
          stats, 
          hasUserData: !!userData,
          hasStats: !!stats
        });
        
        // 合并用户数据和统计数据
        const profileDataWithStats = {
          ...userData,
          stats: {
            files: stats.files || 0,
            followers: stats.followers || 0,
            following: stats.following || 0,
            views: stats.views || 0
          }
        };
        
        console.log('fetchProfile: 设置 profileData', { profileDataWithStats });
        setProfileData(profileDataWithStats);
        setIsFollowing(userData.isFollowing || false);

        // 如果是自己的资料页面，获取工作经历和教育经历
        if (currentUser && currentUser.username === username) {
          await fetchExperiencesAndEducations();
        } else {
          // 查看他人档案时，清空工作经历和教育经历
          setExperiences([]);
          setEducations([]);
        }
        
        // 获取活动流（文件和文章）- 在 profileData 设置后，useEffect 会自动触发
      } catch (err: any) {
        setError(err.message || '获取用户资料失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser?.username]);

  // 初始化编辑数据
  useEffect(() => {
    if (profileData) {
      // 将 socialLinks 对象转换为数组格式
      const socialLinksArray = profileData.socialLinks 
        ? Object.entries(profileData.socialLinks).map(([platform, url]) => ({
            platform: platform,
            url: url as string
          }))
        : [];
      
      setEditData({
        bio: profileData.bio || '',
        location: profileData.location || '',
        position: profileData.position || '',
        company: profileData.company || '',
        skills: profileData.skills ? profileData.skills.join(', ') : '',
        socialLinks: socialLinksArray
      });
      // 初始化技能数组
      setCurrentSkills(profileData.skills ? [...profileData.skills] : []);
    }
  }, [profileData]);
  
  // 当 profileData 更新时，重新获取活动流（文件列表）
  useEffect(() => {
    if (profileData && profileData.id && !hasFetchedFiles.current) {
      hasFetchedFiles.current = true;
      fetchUserActivity();
    }
  }, [profileData?.id, username, fetchUserActivity]);
  
  // 当 username 变化时，重置标志
  useEffect(() => {
    hasFetchedFiles.current = false;
  }, [username]);

  // 工作经历相关函数
  const handleAddExperience = useCallback(async (experienceData) => {
    try {
      const response = await addUserExperience(experienceData);
      setShowAddExperience(false);
      // 重新获取数据，确保排序正确
      await fetchExperiencesAndEducations();
    } catch (err) {
      setError(err.message || '添加工作经历失败');
    }
  }, [fetchExperiencesAndEducations]);

  const handleUpdateExperience = useCallback(async (id, experienceData) => {
    try {
      const response = await updateUserExperience(id, experienceData);
      setEditingExperience(null);
      // 重新获取数据，确保排序正确
      await fetchExperiencesAndEducations();
    } catch (err) {
      setError(err.message || '更新工作经历失败');
    }
  }, [fetchExperiencesAndEducations]);

  const handleDeleteExperience = useCallback(async (id) => {
    if (window.confirm('确定要删除这条工作经历吗？')) {
      try {
        await deleteUserExperience(id);
        setExperiences(prev => prev.filter(exp => exp.id !== id));
      } catch (err) {
        setError(err.message || '删除工作经历失败');
      }
    }
  }, []);

  // 教育经历相关函数
  const handleAddEducation = useCallback(async (educationData) => {
    try {
      const response = await addUserEducation(educationData);
      setShowAddEducation(false);
      // 重新获取数据，确保排序正确
      await fetchExperiencesAndEducations();
    } catch (err) {
      setError(err.message || '添加教育经历失败');
    }
  }, [fetchExperiencesAndEducations]);

  const handleUpdateEducation = useCallback(async (id, educationData) => {
    try {
      const response = await updateUserEducation(id, educationData);
      setEditingEducation(null);
      // 重新获取数据，确保排序正确
      await fetchExperiencesAndEducations();
    } catch (err) {
      setError(err.message || '更新教育经历失败');
    }
  }, [fetchExperiencesAndEducations]);

  const handleDeleteEducation = useCallback(async (id) => {
    if (window.confirm('确定要删除这条教育经历吗？')) {
      try {
        await deleteUserEducation(id);
        setEducations(prev => prev.filter(edu => edu.id !== id));
      } catch (err) {
        setError(err.message || '删除教育经历失败');
      }
    }
  }, []);

  const fetchSocialData = useCallback(async (type: 'followers' | 'following'): Promise<void> => {
    try {
      setSocialLoading(true);
      let response;

      if (type === 'followers') {
        response = await getFollowers(profileData.id, { page: 1, limit: 10 });
        setFollowers(response.data.followers || []);
      } else if (type === 'following') {
        response = await getFollowing(profileData.id, { page: 1, limit: 10 });
        setFollowing(response.data.following || []);
      }
    } catch (err) {
      console.error(`获取${type}列表失败:`, err);
    } finally {
      setSocialLoading(false);
    }
  }, [profileData?.id]);

  // 获取留言
  const fetchMessages = useCallback(async () => {
    try {
      setMessagesLoading(true);
      const response: any = await getUserMessages(profileData.id, { page: 1, limit: 10 });
      // 处理API响应格式
      const messagesData = response.data?.messages || response.data?.data?.messages || response.messages || [];
      setMessages(messagesData);
    } catch (err) {
      console.error('获取留言失败:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [profileData?.id]);

  const handleAddMessage = useCallback(async () => {
    if (!messageContent.trim()) return;

    try {
      await addMessage(profileData.id, messageContent);
      setMessageContent('');
      // 重新获取留言列表
      fetchMessages();
    } catch (err) {
      setError(err.message || '发表留言失败');
    }
  }, [profileData?.id, messageContent, fetchMessages]);

  const handleLikeMessage = useCallback(async (messageId: number, isLiked: boolean) => {
    try {
      let result: any;
      if (isLiked) {
        result = await unlikeMessage(messageId);
      } else {
        result = await likeMessage(messageId);
      }
      
      // 如果API返回了更新后的数据，直接更新状态，否则重新获取列表
      if (result?.data?.likeCount !== undefined) {
        setMessages(prevMessages => prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, isLiked: result.data.liked, likeCount: result.data.likeCount }
            : msg
        ));
      } else {
        // 重新获取留言列表
        fetchMessages();
      }
    } catch (err: any) {
      console.error('点赞留言失败:', err);
      setError(err.message || '操作失败');
    }
  }, [fetchMessages]);

  const handleFollow = useCallback(async () => {
    if (!profileData) return;

    try {
      if (isFollowing) {
        await unfollowUser(profileData.id);
        setIsFollowing(false);
      } else {
        await followUser(profileData.id);
        setIsFollowing(true);
      }
    } catch (err) {
      setError(err.message || '操作失败');
    }
  }, [profileData, isFollowing]);

  // 处理点赞
  const handleLike = useCallback(async (postId: string | number) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      // 在所有内容中查找（posts、articles、files）
      const allContent = [
        ...userPosts.map(p => ({ ...p, contentType: 'image' as const })),
        ...userArticles.map(a => ({ ...a, contentType: 'article' as const })),
        ...userFiles.map(f => ({ ...f, contentType: 'file' as const }))
      ];
      
      const item = allContent.find(p => p.id === postId);
      if (!item || !item.id) return;

      let result: any;
      
      if (item.contentType === 'article') {
        result = await toggleArticleLike(item.id);
        if (result && result.code === 0 && result.data) {
          const newLiked = result.data.liked;
          const newLikeCount = result.data.likeCount ?? (item.likeCount || item.like_count || 0);
          setUserArticles(prev => prev.map(a => 
            a.id === postId ? { ...a, liked: newLiked, likeCount: newLikeCount, like_count: newLikeCount } : a
          ));
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
          setUserFiles(prev => prev.map(f => 
            f.id === postId ? { ...f, liked: newLiked, likeCount: newLikeCount, like_count: newLikeCount } : f
          ));
        }
      } else {
        // 帖子
        result = await togglePostLike(item.id);
        if (result && result.code === 0 && result.data) {
          const newLiked = result.data.liked;
          const newLikeCount = result.data.likeCount ?? (item.likeCount || item.like_count || 0);
          setUserPosts(prev => prev.map(p => 
            p.id === postId ? { ...p, liked: newLiked, likeCount: newLikeCount, like_count: newLikeCount } : p
          ));
        }
      }
    } catch (err: any) {
      console.error('点赞操作失败:', err);
      setError(err.message || '操作失败');
    }
  }, [currentUser, userPosts, userArticles, userFiles, navigate]);

  // 处理展开/收起评论
  const handleToggleComments = useCallback(async (postId: string | number) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // 在所有内容中查找
    const allContent = [
      ...userPosts.map(p => ({ ...p, contentType: 'image' as const })),
      ...userArticles.map(a => ({ ...a, contentType: 'article' as const })),
      ...userFiles.map(f => ({ ...f, contentType: 'file' as const }))
    ];
    
    const item = allContent.find(p => p.id === postId);
    if (!item || !item.id) return;

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
  }, [currentUser, userPosts, userArticles, userFiles, expandedComments, postComments, navigate]);

  // 处理添加评论
  const handleAddComment = useCallback(async (postId: string | number, content: string) => {
    // 在所有内容中查找
    const allContent = [
      ...userPosts.map(p => ({ ...p, contentType: 'image' as const })),
      ...userArticles.map(a => ({ ...a, contentType: 'article' as const })),
      ...userFiles.map(f => ({ ...f, contentType: 'file' as const }))
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
        // 更新评论数
        if (item.contentType === 'article') {
          setUserArticles(prev => prev.map(a => 
            a.id === postId ? { ...a, commentCount: (a.commentCount || a.comment_count || 0) + 1, comment_count: (a.commentCount || a.comment_count || 0) + 1 } : a
          ));
        } else if (item.contentType === 'file') {
          setUserFiles(prev => prev.map(f => 
            f.id === postId ? { ...f, commentCount: (f.commentCount || f.comment_count || 0) + 1, comment_count: (f.commentCount || f.comment_count || 0) + 1 } : f
          ));
        } else {
          setUserPosts(prev => prev.map(p => 
            p.id === postId ? { ...p, commentCount: (p.commentCount || p.comment_count || 0) + 1, comment_count: (p.commentCount || p.comment_count || 0) + 1 } : p
          ));
        }
      }
    } catch (err: any) {
      console.error('添加评论失败:', err);
      setError(err.message || '添加评论失败');
    }
  }, [userPosts, userArticles, userFiles]);

  // 处理删除评论
  const handleDeleteComment = useCallback(async (postId: string | number, commentId: number) => {
    // 在所有内容中查找
    const allContent = [
      ...userPosts.map(p => ({ ...p, contentType: 'image' as const })),
      ...userArticles.map(a => ({ ...a, contentType: 'article' as const })),
      ...userFiles.map(f => ({ ...f, contentType: 'file' as const }))
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
        // 更新评论数
        if (item.contentType === 'article') {
          setUserArticles(prev => prev.map(a => 
            a.id === postId ? { ...a, commentCount: Math.max(0, (a.commentCount || a.comment_count || 0) - 1), comment_count: Math.max(0, (a.commentCount || a.comment_count || 0) - 1) } : a
          ));
        } else if (item.contentType === 'file') {
          setUserFiles(prev => prev.map(f => 
            f.id === postId ? { ...f, commentCount: Math.max(0, (f.commentCount || f.comment_count || 0) - 1), comment_count: Math.max(0, (f.commentCount || f.comment_count || 0) - 1) } : f
          ));
        } else {
          setUserPosts(prev => prev.map(p => 
            p.id === postId ? { ...p, commentCount: Math.max(0, (p.commentCount || p.comment_count || 0) - 1), comment_count: Math.max(0, (p.commentCount || p.comment_count || 0) - 1) } : p
          ));
        }
      }
    } catch (err: any) {
      console.error('删除评论失败:', err);
      setError(err.message || '删除评论失败');
    }
  }, [userPosts, userArticles, userFiles]);

  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // 处理头像上传（独立上传，不依赖编辑模式）
  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件
    if (file.size > 5 * 1024 * 1024) {
      setError('头像文件大小不能超过5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 显示预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 如果不在编辑模式，直接上传
    if (!isEditing) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await api.post('/users/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        const avatarUrl = response.data?.data?.avatar || response.data?.avatar;
        if (avatarUrl) {
          setProfileData((prev: any) => ({
            ...prev,
            avatar: avatarUrl
          }));
          // 同步更新 AuthContext 中的用户信息，使首页头像也能更新
          updateUser({ avatar: avatarUrl });
          setAvatarPreview(null); // 清除预览，使用服务器返回的URL
        }
      } catch (err: any) {
        console.error('上传头像错误:', err);
        setError(err.response?.data?.msg || err.message || '上传头像失败');
        setAvatarPreview(null);
      } finally {
        setUploading(false);
        // 清空input，允许重复选择同一文件
        e.target.value = '';
      }
    } else {
      // 在编辑模式下，只设置文件，等待保存
      setAvatarFile(file);
    }
  }, [isEditing]);

  // 处理背景图片上传（独立上传，不依赖编辑模式）
  const handleCoverChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件
    if (file.size > 10 * 1024 * 1024) {
      setError('背景图片文件大小不能超过10MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 显示预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 如果不在编辑模式，直接上传
    if (!isEditing) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('cover', file);

        const response = await api.post('/users/cover', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        const coverImageUrl = response.data?.data?.coverImage || response.data?.coverImage;
        if (coverImageUrl) {
          setProfileData((prev: any) => ({
            ...prev,
            coverImage: coverImageUrl
          }));
          setCoverPreview(null); // 清除预览，使用服务器返回的URL
        }
      } catch (err: any) {
        console.error('上传背景图片错误:', err);
        setError(err.response?.data?.msg || err.message || '上传背景图片失败');
        setCoverPreview(null);
      } finally {
        setUploading(false);
        // 清空input，允许重复选择同一文件
        e.target.value = '';
      }
    } else {
      // 在编辑模式下，只设置文件，等待保存
      setCoverFile(file);
    }
  }, [isEditing]);

  const handleSaveProfile = useCallback(async () => {
    try {
      setUploading(true);
      const skillsArray = editData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);

      // 如果有头像或背景图片需要上传，使用FormData
      if (avatarFile || coverFile) {
        const formData = new FormData();
        formData.append('bio', editData.bio);
        formData.append('location', editData.location);
        formData.append('position', editData.position);
        formData.append('company', editData.company);
        formData.append('skills', JSON.stringify(skillsArray));
        formData.append('socialLinks', JSON.stringify(
          editData.socialLinks
            .filter(link => link.platform.trim() && link.url.trim())
            .reduce((acc, link) => {
              acc[link.platform] = link.url;
              return acc;
            }, {} as Record<string, string>)
        ));
        
        if (avatarFile) {
          formData.append('avatar', avatarFile);
        }
        if (coverFile) {
          formData.append('coverImage', coverFile);
        }

        const response = await api.put('/users/profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        const updatedData = response.data?.data || response.data;
        
        // 更新本地状态
        const newAvatar = updatedData?.avatar || updatedData?.user?.avatar;
        const newCoverImage = updatedData?.coverImage || updatedData?.user?.coverImage;
        
        setProfileData(prev => ({
          ...prev,
          bio: editData.bio,
          location: editData.location,
          position: editData.position,
          company: editData.company,
          skills: skillsArray,
          socialLinks: editData.socialLinks
            .filter(link => link.platform.trim() && link.url.trim())
            .reduce((acc, link) => {
              acc[link.platform] = link.url;
              return acc;
            }, {} as Record<string, string>),
          avatar: newAvatar || prev.avatar,
          coverImage: newCoverImage || prev.coverImage
        }));
        
        // 同步更新 AuthContext 中的用户信息，使首页头像也能更新
        if (newAvatar) {
          updateUser({ avatar: newAvatar });
        }
      } else {
        // 没有图片上传，使用普通JSON请求
        await updateProfile({
          bio: editData.bio,
          location: editData.location,
          position: editData.position,
          company: editData.company,
          skills: skillsArray,
          socialLinks: editData.socialLinks
            .filter(link => link.platform.trim() && link.url.trim())
            .reduce((acc, link) => {
              acc[link.platform] = link.url;
              return acc;
            }, {} as Record<string, string>)
        });

        // 更新本地状态
        setProfileData(prev => ({
          ...prev,
          bio: editData.bio,
          location: editData.location,
          position: editData.position,
          company: editData.company,
          skills: skillsArray,
          socialLinks: editData.socialLinks
            .filter(link => link.platform.trim() && link.url.trim())
            .reduce((acc, link) => {
              acc[link.platform] = link.url;
              return acc;
            }, {} as Record<string, string>)
        }));
      }

      // 清除预览和文件
      setAvatarFile(null);
      setAvatarPreview(null);
      setCoverFile(null);
      setCoverPreview(null);
      setIsEditing(false);
    } catch (err: any) {
      console.error('更新档案错误（完整信息）:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      });
      
      // 处理详细的错误信息
      let errorMessage = '更新档案失败';
      if (err.response?.data) {
        const errorData = err.response.data;
        console.error('服务器返回的错误数据:', errorData);
        
        if (errorData.details && Array.isArray(errorData.details)) {
          // 显示验证错误详情
          errorMessage = errorData.details.map((d: any) => d.msg || d.message).join('; ') || errorData.msg || errorData.error || errorMessage;
        } else {
          errorMessage = errorData.msg || errorData.error || errorMessage;
        }
        
        // 如果是开发环境，显示更详细的错误信息
        if (errorData.error && typeof errorData.error === 'object') {
          console.error('详细错误信息:', errorData.error);
          if (errorData.error.message) {
            errorMessage += ': ' + errorData.error.message;
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('最终错误消息:', errorMessage);
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [editData, avatarFile, coverFile]);

  const handleCancelEdit = useCallback(() => {
    setEditData({
      bio: profileData?.bio || '',
      location: profileData?.location || '',
      position: profileData?.position || '',
      company: profileData?.company || '',
      skills: profileData?.skills ? profileData.skills.join(', ') : '',
      socialLinks: profileData?.socialLinks 
        ? Object.entries(profileData.socialLinks).map(([platform, url]) => ({
            platform: platform,
            url: url as string
          }))
        : []
    });
    setIsEditing(false);
  }, [profileData]);

  // 删除技能
  const handleRemoveSkill = useCallback((skillToRemove: string) => {
    setCurrentSkills(prev => prev.filter(skill => skill !== skillToRemove));
  }, []);

  // 添加新技能
  const handleAddSkill = useCallback(() => {
    const trimmedSkill = newSkillInput.trim();
    if (trimmedSkill && !currentSkills.includes(trimmedSkill)) {
      setCurrentSkills(prev => [...prev, trimmedSkill]);
      setNewSkillInput('');
    }
  }, [newSkillInput, currentSkills]);

  // 保存技能
  const handleSaveSkills = useCallback(async () => {
    try {
      const skillsArray = currentSkills.filter(skill => skill.trim());

      await updateProfile({
        skills: skillsArray
      });

      // 更新本地状态
      setProfileData(prev => ({
        ...prev,
        skills: skillsArray
      }));

      setIsEditingSkills(false);
    } catch (err: any) {
      setError(err.message || '更新技能失败');
    }
  }, [currentSkills]);

  // 取消编辑技能
  const handleCancelEditSkills = useCallback(() => {
    setCurrentSkills(profileData?.skills ? [...profileData.skills] : []);
    setNewSkillInput('');
    setIsEditingSkills(false);
  }, [profileData]);

  // 计算是否是自己的档案（必须在所有条件返回之前）
  const isOwnProfile = currentUser && currentUser.username === username;

  if (loading) {
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

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-gray-600">用户不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 预览模态框 */}
      {previewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closePreviewModal}
        >
          <div className="relative max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closePreviewModal}
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors z-10"
            >
              <XIcon className="w-6 h-6" />
            </button>
            {previewMediaType === 'video' ? (
              <video
                src={previewMediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              >
                您的浏览器不支持视频播放
              </video>
            ) : (
              <img
                src={previewMediaUrl}
                alt={previewTitle}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
            {previewTitle && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center bg-black/50 px-4 py-2 rounded-lg">
                <p className="font-medium">{previewTitle}</p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Cover image */}
      <div className="h-56 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 relative overflow-hidden group">
        {coverPreview ? (
          <img
            src={coverPreview}
            alt="Cover Preview"
            className="w-full h-full object-cover"
          />
        ) : profileData.coverImage ? (
          <img
            src={profileData.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50">
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-blue-200/40 text-6xl font-bold">个人档案</div>
            </div>
          </div>
        )}
        {isOwnProfile && (
          <div className="absolute top-4 right-4">
            <label className="inline-flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white rounded-full cursor-pointer shadow-lg transition-all duration-200 hover:scale-110">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-700" />
              )}
            </label>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-16">
        {/* Profile info */}
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-start">
              <div className="flex-shrink-0 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-full blur-sm opacity-40"></div>
                <div className="relative">
                  <img
                    className="h-32 w-32 rounded-full border-4 border-white mx-auto md:mx-0 shadow-md"
                    src={avatarPreview || profileData.avatar || getDefaultAvatar(profileData.username)}
                    alt={profileData.username}
                  />
                  {isOwnProfile && (
                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-white hover:bg-gray-50 rounded-full cursor-pointer shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 border-2 border-white">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      ) : (
                        <CameraIcon className="w-5 h-5 text-gray-700" />
                      )}
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-1 relative">
                {/* 编辑按钮 - 右上角图标 */}
                {isOwnProfile && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute top-0 right-0 w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-md border border-gray-200/50 transition-all duration-200 hover:scale-110 hover:shadow-lg"
                    title="编辑档案"
                  >
                    <Edit3Icon className="w-4 h-4 text-gray-600" />
                  </button>
                )}
                {isOwnProfile && isEditing && (
                  <div className="absolute top-0 right-0 flex items-center gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={uploading}
                      className="w-9 h-9 flex items-center justify-center bg-green-50 hover:bg-green-100 rounded-full shadow-md border border-green-200/50 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="保存"
                    >
                      {uploading ? (
                        <svg className="animate-spin h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        setCoverFile(null);
                        setCoverPreview(null);
                        handleCancelEdit();
                      }}
                      disabled={uploading}
                      className="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full shadow-md border border-gray-200/50 transition-all duration-200 hover:scale-110 disabled:opacity-50"
                      title="取消"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="pr-12">
                  <h1 className="text-2xl font-bold text-gray-900">{profileData.username}</h1>
                  <p className="text-lg text-gray-600 mt-1">
                    {profileData.position || profileData.title || '未设置职业'}
                    {profileData.company && (
                      <>
                        <span className="mx-2 text-gray-400">·</span>
                        {profileData.company}
                      </>
                    )}
                  </p>
                  {profileData.location && (
                    <p className="text-gray-500 flex items-center justify-center md:justify-start mt-2">
                      <MapPinIcon className="h-4 w-4 mr-1.5" />
                      {profileData.location}
                    </p>
                  )}
                  {profileData.socialLinks && Object.keys(profileData.socialLinks).length > 0 && (
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                      {Object.entries(profileData.socialLinks).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:text-blue-500 transition-colors flex items-center gap-1"
                        >
                          <LinkIcon className="h-3 w-3" />
                          <span>{platform}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>


                <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-2">
                  {!isOwnProfile && (
                    <button
                      onClick={handleFollow}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isFollowing
                          ? 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-200/50'
                      }`}
                    >
                      {isFollowing ? '已关注' : '关注'}
                    </button>
                  )}
                  {!isOwnProfile && (
                    <button
                      onClick={() => {
                        setActiveTab('messages');
                        // 获取留言数据
                        if (profileData?.id) {
                          fetchMessages();
                        }
                        // 滚动到留言区域
                        setTimeout(() => {
                          const messagesSection = document.getElementById('messages-section');
                          if (messagesSection) {
                            messagesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          } else {
                            // 如果找不到，尝试滚动到标签页区域
                            const tabsSection = document.querySelector('[data-tabs-section]');
                            if (tabsSection) {
                              tabsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                          }
                        }, 200);
                      }}
                      className="px-4 py-2 border border-gray-200/80 text-gray-600 rounded-lg hover:bg-gray-50/80 hover:border-gray-300/80 transition-all duration-200 text-sm font-medium flex items-center gap-1.5"
                    >
                      <MessageCircleIcon className="w-4 h-4" />
                      留言
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              {isEditing ? (
                <div className="space-y-4">
                  {/* 头像和背景图片提示 */}
                  {(avatarFile || coverFile) && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200/50 rounded-lg">
                      <p className="text-sm text-blue-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {avatarFile && '已选择新头像'}
                        {avatarFile && coverFile && '，'}
                        {coverFile && '已选择新背景图片'}
                        <span className="text-blue-600">保存时将上传</span>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
                    <textarea
                      name="bio"
                      value={editData.bio}
                      onChange={handleEditChange}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 bg-white transition-all resize-none text-sm"
                      placeholder="介绍一下自己..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">位置</label>
                      <input
                        type="text"
                        name="location"
                        value={editData.location}
                        onChange={handleEditChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 bg-white transition-all text-sm"
                        placeholder="例如：北京"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">职业</label>
                      <input
                        type="text"
                        name="position"
                        value={editData.position}
                        onChange={handleEditChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 bg-white transition-all text-sm"
                        placeholder="例如：前端开发工程师"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">目前所在公司</label>
                    <input
                      type="text"
                      name="company"
                      value={editData.company}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 bg-white transition-all text-sm"
                      placeholder="例如：XX科技有限公司"
                    />
                  </div>

                  {/* 多个社交链接 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                      社交链接
                    </label>
                    <div className="space-y-3">
                      {editData.socialLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={link.platform}
                            onChange={(e) => {
                              const newLinks = [...editData.socialLinks];
                              newLinks[index].platform = e.target.value;
                              setEditData({ ...editData, socialLinks: newLinks });
                            }}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 bg-white transition-all text-sm"
                            placeholder="链接说明（如：GitHub、博客等）"
                          />
                          <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-400 text-sm">https://</span>
                            </div>
                            <input
                              type="text"
                              value={link.url.replace(/^https?:\/\//, '')}
                              onChange={(e) => {
                                let value = e.target.value.trim();
                                value = value.replace(/^https?:\/\//, '').replace(/^http:\/\//, '');
                                const newLinks = [...editData.socialLinks];
                                newLinks[index].url = value ? `https://${value}` : '';
                                setEditData({ ...editData, socialLinks: newLinks });
                              }}
                              className="w-full pl-16 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 bg-white transition-all text-sm"
                              placeholder="example.com"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newLinks = editData.socialLinks.filter((_, i) => i !== index);
                              setEditData({ ...editData, socialLinks: newLinks });
                            }}
                            className="px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditData({
                            ...editData,
                            socialLinks: [...editData.socialLinks, { platform: '', url: '' }]
                          });
                        }}
                        className="w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>添加链接</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      提示：技能请在下方独立的技能卡片中编辑
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 个人简介 */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4 text-gray-500" />
                      个人简介
                    </h3>
                    {profileData.bio ? (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm pl-5">{profileData.bio}</p>
                    ) : (
                      <p className="text-gray-400 italic text-sm pl-5">该用户还未设置个人简介</p>
                    )}
                  </div>

                  {/* 职业和公司信息 */}
                  {(profileData.position || profileData.company) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <BriefcaseIcon className="w-4 h-4 text-gray-500" />
                        职业信息
                      </h3>
                      <div className="pl-5 space-y-1">
                        {profileData.position && (
                          <p className="text-gray-700 text-sm">
                            <span className="font-medium">职业：</span>{profileData.position}
                          </p>
                        )}
                        {profileData.company && (
                          <p className="text-gray-700 text-sm">
                            <span className="font-medium">公司：</span>{profileData.company}
                          </p>
                        )}
                      </div>
                </div>
              )}

                </div>
              )}
            </div>
          </div>
        </div>

        {/* 技能卡片 - 独立展示 */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50/30 to-blue-50/30 flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700">技能专长</h2>
            </div>
            {isOwnProfile && !isEditingSkills && (
              <button
                onClick={() => {
                  setCurrentSkills(profileData?.skills ? [...profileData.skills] : []);
                  setNewSkillInput('');
                  setIsEditingSkills(true);
                }}
                className="text-indigo-500 hover:text-indigo-600 font-medium text-sm flex items-center transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50/80"
              >
                <Edit3Icon className="h-4 w-4 mr-1" />
                编辑技能
              </button>
            )}
          </div>
          <div className="p-6">
            {isEditingSkills ? (
              <div className="space-y-4">
                {/* 当前技能列表 - 可删除 */}
                {currentSkills.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">当前技能</label>
                    <div className="flex flex-wrap gap-2">
                      {currentSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 text-sm rounded-xl border border-indigo-100/80 font-medium"
                        >
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-2 text-indigo-400 hover:text-red-500 transition-colors"
                            type="button"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 添加新技能 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">添加新技能</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 bg-gray-50/50 transition-all"
                      placeholder="输入技能名称，按回车或点击添加"
                    />
                    <button
                      onClick={handleAddSkill}
                      disabled={!newSkillInput.trim()}
                      className="px-5 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                    >
                      添加
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">输入技能名称后点击添加按钮或按回车键</p>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={handleCancelEditSkills}
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-medium"
                    type="button"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveSkills}
                    className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all font-medium shadow-sm hover:shadow-md"
                    type="button"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : profileData.skills && profileData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {profileData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 text-sm rounded-xl border border-indigo-100/80 hover:from-indigo-100 hover:to-blue-100 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-indigo-50 rounded-2xl mb-4">
                  <svg className="h-12 w-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm font-medium mb-2">
                  {isOwnProfile ? '添加您的技能，展示您的专业能力' : '该用户还没有添加技能'}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => {
                      setCurrentSkills(profileData?.skills ? [...profileData.skills] : []);
                      setNewSkillInput('');
                      setIsEditingSkills(true);
                    }}
                    className="mt-4 px-5 py-2.5 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-100 border border-indigo-200/50 transition-all duration-200 text-sm font-medium"
                  >
                    添加技能
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 工作经历卡片 - 领英风格 */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-gray-100 bg-blue-50/30 flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <BriefcaseIcon className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700">工作经历</h2>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setShowAddExperience(true)}
                className="text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-blue-50/80"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                添加工作经历
              </button>
            )}
          </div>
          <div className="p-6">
                  {experiencesLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-200 border-t-blue-500"></div>
                    </div>
                  ) : experiences.length > 0 ? (
              <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative pb-6 last:pb-0 border-l-2 border-blue-100 pl-6 ml-3">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-[3px] border-blue-300 rounded-full"></div>
                    <div className="flex justify-between items-start group">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{exp.position}</h3>
                        <p className="text-base text-gray-700 font-medium mb-1">{exp.company}</p>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <div className="p-1 bg-blue-50 rounded mr-2">
                            <CalendarIcon className="h-3.5 w-3.5 text-blue-400" />
                          </div>
                          <span className="font-medium">
                            {exp.start_date ? formatDate(exp.start_date) : '未知'} - {exp.end_date ? formatDate(exp.end_date) : '至今'}
                          </span>
                        </div>
                        {exp.description && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
                          </div>
                        )}
                      </div>
                      {isOwnProfile && (
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                          <button
                            onClick={() => setEditingExperience(exp)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="编辑"
                          >
                            <Edit3Icon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExperience(exp.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="删除"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex p-3 bg-blue-50 rounded-xl mb-3">
                  <BriefcaseIcon className="h-8 w-8 text-blue-300" />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-3">
                  {isOwnProfile ? '添加您的工作经历，展示您的职业发展' : '该用户还没有添加工作经历'}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowAddExperience(true)}
                    className="px-5 py-2.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 border border-blue-200/50 transition-all duration-200 text-sm font-medium"
                  >
                    添加工作经历
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 教育经历卡片 - 领英风格 */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-gray-100 bg-purple-50/30 flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <GraduationCapIcon className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700">教育经历</h2>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setShowAddEducation(true)}
                className="text-purple-500 hover:text-purple-600 font-medium text-sm flex items-center transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-purple-50/80"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                添加教育经历
              </button>
            )}
          </div>
          <div className="p-6">
                  {experiencesLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-purple-200 border-t-purple-500"></div>
                    </div>
                  ) : educations.length > 0 ? (
              <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                {educations.map((edu) => (
                  <div key={edu.id} className="relative pb-6 last:pb-0 border-l-2 border-purple-100 pl-6 ml-3">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-[3px] border-purple-300 rounded-full"></div>
                    <div className="flex justify-between items-start group">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{edu.school}</h3>
                        <p className="text-base text-gray-700 font-medium mb-1">
                          {edu.degree && `${edu.degree}`}
                          {edu.degree && edu.major && ' · '}
                          {edu.major}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <div className="p-1 bg-purple-50 rounded mr-2">
                            <CalendarIcon className="h-3.5 w-3.5 text-purple-400" />
                          </div>
                          <span className="font-medium">
                            {edu.start_date ? formatDate(edu.start_date) : '未知'} - {edu.end_date ? formatDate(edu.end_date) : '至今'}
                          </span>
                        </div>
                        {edu.description && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{edu.description}</p>
                          </div>
                        )}
                      </div>
                      {isOwnProfile && (
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                          <button
                            onClick={() => setEditingEducation(edu)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="编辑"
                          >
                            <Edit3Icon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEducation(edu.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="删除"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex p-3 bg-purple-50 rounded-xl mb-3">
                  <GraduationCapIcon className="h-8 w-8 text-purple-300" />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-3">
                  {isOwnProfile ? '添加您的教育背景，展示您的学术成就' : '该用户还没有添加教育经历'}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowAddEducation(true)}
                    className="px-5 py-2.5 bg-purple-50 text-purple-500 rounded-xl hover:bg-purple-100 border border-purple-200/50 transition-all duration-200 text-sm font-medium"
                  >
                    添加教育经历
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile content tabs */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 px-6 bg-gray-50/30 rounded-t-2xl">
              <button
                className={`py-4 px-6 border-b-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'all'
                    ? 'border-blue-300 text-blue-500 bg-blue-50/40'
                    : 'border-transparent text-gray-500 hover:text-blue-400 hover:bg-blue-50/20'
                }`}
                onClick={() => setActiveTab('all')}
              >
                我的动态
              </button>
              <button
                className={`py-4 px-6 border-b-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'posts'
                    ? 'border-purple-300 text-purple-500 bg-purple-50/40'
                    : 'border-transparent text-gray-500 hover:text-purple-400 hover:bg-purple-50/20'
                }`}
                onClick={() => setActiveTab('posts')}
              >
                帖子
              </button>
              <button
                className={`py-4 px-6 border-b-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'articles'
                    ? 'border-green-300 text-green-500 bg-green-50/40'
                    : 'border-transparent text-gray-500 hover:text-green-400 hover:bg-green-50/20'
                }`}
                onClick={() => setActiveTab('articles')}
              >
                文章
              </button>
              <button
                className={`py-4 px-6 border-b-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'files'
                    ? 'border-orange-300 text-orange-500 bg-orange-50/40'
                    : 'border-transparent text-gray-500 hover:text-orange-400 hover:bg-orange-50/20'
                }`}
                onClick={() => setActiveTab('files')}
              >
                文件
              </button>
              <button
                className={`py-4 px-6 border-b-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'messages'
                    ? 'border-cyan-300 text-cyan-500 bg-cyan-50/40'
                    : 'border-transparent text-gray-500 hover:text-cyan-400 hover:bg-cyan-50/20'
                }`}
                onClick={() => {
                  setActiveTab('messages');
                  if (profileData?.id) {
                    fetchMessages();
                  }
                }}
              >
                留言
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'all' && (
              <div>
                {contentLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <PostFeed
                    posts={userActivity.map((activity) => {
                      // 根据活动类型转换为PostCardPost格式
                      if (activity.type === 'file_upload' || activity.originalName) {
                        // 文件类型
                        const isImage = activity.mimeType?.startsWith('image/');
                        const isVideo = activity.mimeType?.startsWith('video/');
                        return {
                          id: activity.id,
                          originalId: activity.originalId,
                          authorId: profileData?.id,
                          author: {
                            name: profileData?.username || username || '用户',
                            title: profileData?.position || '',
                            company: profileData?.company || '',
                            avatar: profileData?.avatar || getDefaultAvatar(profileData?.username || username || ''),
                          },
                          content: activity.description || activity.title || '分享了一个文件',
                          timestamp: new Date(activity.uploadedAt || activity.createdAt).toLocaleString('zh-CN'),
                          likes: activity.likeCount || 0,
                          comments: activity.commentCount || 0,
                          liked: false,
                          contentType: isImage ? 'image' as const : isVideo ? 'video' as const : 'file' as const,
                          mediaUrl: activity.fileUrl || undefined,
                          title: activity.title || activity.originalName,
                          originalName: activity.originalName,
                          size: activity.size,
                          mimeType: activity.mimeType,
                          description: activity.description,
                        } as PostCardPost;
                      } else if (activity.type === 'article' || activity.articleUrl) {
                        // 文章类型
                        return {
                          id: activity.id,
                          originalId: activity.originalId,
                          authorId: profileData?.id,
                          author: {
                            name: profileData?.username || username || '用户',
                            title: profileData?.position || '',
                            company: profileData?.company || '',
                            avatar: profileData?.avatar || getDefaultAvatar(profileData?.username || username || ''),
                          },
                          content: activity.description || activity.summary || '',
                          timestamp: new Date(activity.publishedAt || activity.createdAt).toLocaleString('zh-CN'),
                          likes: activity.claps || activity.likeCount || 0,
                          comments: activity.commentCount || 0,
                          liked: false,
                          contentType: 'article' as const,
                          title: activity.title,
                          description: activity.description || activity.summary || '',
                          readTime: activity.readTime || '3分钟',
                        } as PostCardPost;
                      } else if (activity.type === 'image_post' || activity.type === 'video_post' || activity.mediaUrl) {
                        // 图片或视频类型
                        const isVideo = activity.type === 'video_post' || activity.mediaType === 'video';
                        return {
                          id: activity.id,
                          originalId: activity.originalId,
                          authorId: profileData?.id,
                          author: {
                            name: profileData?.username || username || '用户',
                            title: profileData?.position || '',
                            company: profileData?.company || '',
                            avatar: profileData?.avatar || getDefaultAvatar(profileData?.username || username || ''),
                          },
                          content: activity.caption || activity.description || activity.content || '',
                          timestamp: new Date(activity.createdAt).toLocaleString('zh-CN'),
                          likes: activity.likeCount || 0,
                          comments: activity.commentCount || 0,
                          liked: false,
                          contentType: isVideo ? 'video' as const : 'image' as const,
                          mediaUrl: activity.mediaUrl || undefined,
                        } as PostCardPost;
                      } else {
                        // 默认类型
                        return {
                          id: activity.id,
                          originalId: activity.originalId,
                          authorId: profileData?.id,
                          author: {
                            name: profileData?.username || username || '用户',
                            title: profileData?.position || '',
                            company: profileData?.company || '',
                            avatar: profileData?.avatar || getDefaultAvatar(profileData?.username || username || ''),
                          },
                          content: activity.content || activity.description || activity.title || '',
                          timestamp: new Date(activity.createdAt).toLocaleString('zh-CN'),
                          likes: activity.likeCount || 0,
                          comments: activity.commentCount || 0,
                          liked: false,
                        } as PostCardPost;
                      }
                    })}
                    currentUserId={currentUser?.id}
                    contentFilter="all"
                    showFilter={false}
                    onLike={handleLike}
                    onToggleComments={handleToggleComments}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                    postComments={postComments}
                    loadingComments={loadingComments}
                    expandedComments={expandedComments}
                    onImageModalOpen={(imageUrl, title, mediaType) => openPreviewModal(imageUrl, mediaType, title)}
                    showActions={false}
                    emptyStateTitle="暂无内容"
                    emptyStateDescription="此用户还没有任何分享"
                  />
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div>
                {contentLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <PostFeed
                    posts={userPosts.map((post) => {
                      // 判断是图片还是视频
                      const mediaUrl = post.image_url || post.mediaUrl || '';
                      const isVideo = mediaUrl && (
                        mediaUrl.toLowerCase().endsWith('.mp4') ||
                        mediaUrl.toLowerCase().endsWith('.webm') ||
                        mediaUrl.toLowerCase().endsWith('.ogg') ||
                        mediaUrl.toLowerCase().endsWith('.mov') ||
                        post.mime_type?.startsWith('video/') ||
                        post.mediaType === 'video'
                      );
                      
                      // 转换为 PostCard 需要的格式
                      return {
                        id: post.id,
                        originalId: post.id,
                        authorId: profileData?.id,
                        author: {
                          name: profileData?.username || username || '用户',
                          title: profileData?.position || '',
                          company: profileData?.company || '',
                          avatar: profileData?.avatar || getDefaultAvatar(profileData?.username || username || ''),
                        },
                        content: post.content || post.caption || post.description || '',
                        timestamp: new Date(post.createdAt || post.created_at).toLocaleString('zh-CN'),
                        likes: post.likeCount || post.like_count || 0,
                        comments: post.commentCount || post.comment_count || 0,
                        liked: post.liked || false,
                        contentType: isVideo ? 'video' : (mediaUrl ? 'image' : undefined),
                        mediaUrl: mediaUrl || undefined,
                      } as PostCardPost;
                    })}
                    currentUserId={currentUser?.id}
                    contentFilter="posts"
                    showFilter={false}
                    onLike={handleLike}
                    onToggleComments={handleToggleComments}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                    postComments={postComments}
                    loadingComments={loadingComments}
                    expandedComments={expandedComments}
                    onImageModalOpen={(imageUrl, title, mediaType) => openPreviewModal(imageUrl, mediaType, title)}
                    showActions={false}
                    emptyStateTitle="暂无帖子"
                    emptyStateDescription="此用户还没有发布任何帖子"
                  />
                )}
              </div>
            )}

            {activeTab === 'articles' && (
              <div>
                {contentLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <PostFeed
                    posts={userArticles.map((article) => ({
                      id: article.id,
                      originalId: article.id,
                      authorId: profileData?.id,
                      author: {
                        name: profileData?.username || username || '用户',
                        title: profileData?.position || '',
                        company: profileData?.company || '',
                        avatar: profileData?.avatar || getDefaultAvatar(profileData?.username || username || ''),
                      },
                      content: article.summary || article.content?.substring(0, 200) || '',
                      timestamp: new Date(article.createdAt || article.created_at).toLocaleString('zh-CN'),
                      likes: article.likeCount || article.like_count || 0,
                      comments: article.commentCount || article.comment_count || 0,
                      liked: article.liked || false,
                      contentType: 'article' as const,
                      title: article.title,
                      description: article.summary || article.content?.substring(0, 200) || '',
                      readTime: `${Math.ceil((article.content?.length || 0) / 500)}分钟`,
                    } as PostCardPost))}
                    currentUserId={currentUser?.id}
                    contentFilter="articles"
                    showFilter={false}
                    onLike={handleLike}
                    onToggleComments={handleToggleComments}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                    postComments={postComments}
                    loadingComments={loadingComments}
                    expandedComments={expandedComments}
                    showActions={false}
                    emptyStateTitle="暂无文章"
                    emptyStateDescription="此用户还没有发布任何文章"
                  />
                )}
              </div>
            )}

            {activeTab === 'files' && (
              <div>
                {contentLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                  </div>
                ) : (
                  <PostFeed
                    posts={userFiles.map((file) => {
                      const isImage = file.mime_type?.startsWith('image/');
                      const isVideo = file.mime_type?.startsWith('video/');
                      
                      return {
                        id: file.id,
                        originalId: file.id,
                        authorId: profileData?.id,
                        author: {
                          name: profileData?.username || username || '用户',
                          title: profileData?.position || '',
                          company: profileData?.company || '',
                          avatar: profileData?.avatar || getDefaultAvatar(profileData?.username || username || ''),
                        },
                        content: file.description || file.title || '分享了一个文件',
                        timestamp: new Date(file.uploaded_at || file.uploadedAt).toLocaleString('zh-CN'),
                        likes: file.likeCount || file.like_count || 0,
                        comments: file.commentCount || file.comment_count || 0,
                        liked: file.liked || false,
                        contentType: isImage ? 'image' as const : isVideo ? 'video' as const : 'file' as const,
                        mediaUrl: file.file_url || file.fileUrl || undefined,
                        title: file.title || file.original_name,
                        originalName: file.original_name,
                        size: file.size,
                        mimeType: file.mime_type,
                        description: file.description,
                      } as PostCardPost;
                    })}
                    currentUserId={currentUser?.id}
                    contentFilter="files"
                    showFilter={false}
                    onLike={handleLike}
                    onToggleComments={handleToggleComments}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                    postComments={postComments}
                    loadingComments={loadingComments}
                    expandedComments={expandedComments}
                    onImageModalOpen={(imageUrl, title, mediaType) => openPreviewModal(imageUrl, mediaType, title)}
                    showActions={false}
                    emptyStateTitle="暂无文件"
                    emptyStateDescription="此用户还没有上传任何文件"
                  />
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div id="messages-section">
                {/* 添加留言表单 */}
                {currentUser && !isOwnProfile && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={currentUser.avatar || getDefaultAvatar(currentUser.username)}
                        alt={currentUser.username}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getDefaultAvatar(currentUser.username);
                        }}
                      />
                      <div className="flex-1">
                        <textarea
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          placeholder="给TA留言..."
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-300 resize-none text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              handleAddMessage();
                            }
                          }}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">按 Ctrl+Enter 发送</p>
                          <button
                            onClick={handleAddMessage}
                            disabled={!messageContent.trim() || messagesLoading}
                            className="px-4 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            发送
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 留言列表 */}
                {messagesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message: any) => (
                      <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <img
                            className="h-10 w-10 rounded-full object-cover cursor-pointer"
                            src={message.avatar || getDefaultAvatar(message.username || message.fromUsername)}
                            alt={message.username || message.fromUsername}
                            onClick={() => navigate(`/profile/${message.username || message.fromUsername}`)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getDefaultAvatar(message.username || message.fromUsername);
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <h4 
                                  className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-cyan-600"
                                  onClick={() => navigate(`/profile/${message.username || message.fromUsername}`)}
                                >
                                  {message.username || message.fromUsername || '匿名用户'}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt || message.created_at).toLocaleString('zh-CN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mt-1">
                              {message.content}
                            </p>
                            <div className="flex items-center space-x-4 mt-3">
                              <button
                                onClick={() => handleLikeMessage(message.id, message.isLiked || message.liked)}
                                className={`flex items-center space-x-1 text-xs transition-colors ${
                                  message.isLiked || message.liked
                                    ? 'text-red-500 hover:text-red-600'
                                    : 'text-gray-500 hover:text-red-500'
                                }`}
                              >
                                <HeartIcon className={`w-4 h-4 ${message.isLiked || message.liked ? 'fill-current' : ''}`} />
                                <span>{message.likeCount || message.like_count || 0}</span>
                              </button>
                              {currentUser && (currentUser.id === message.userId || currentUser.id === message.user_id) && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm('确定要删除这条留言吗？')) {
                                      try {
                                        await deleteMessage(message.id);
                                        setMessages(prev => prev.filter(msg => msg.id !== message.id));
                                      } catch (err: any) {
                                        console.error('删除留言失败:', err);
                                        setError(err.message || '删除留言失败');
                                      }
                                    }
                                  }}
                                  className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                                >
                                  删除
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无留言</h3>
                    <p className="text-gray-500">
                      {isOwnProfile ? '还没有人给你留言' : '成为第一个给TA留言的人吧'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* {activeTab === 'connections' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">连接</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900">粉丝 ({profileData.stats?.followers || 0})</h4>
                      <button
                        onClick={() => fetchSocialData('followers')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        刷新
                      </button>
                    </div>

                    {socialLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : followers.length > 0 ? (
                      <div className="space-y-3">
                        {followers.map((follower) => (
                          <div key={follower.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={follower.avatar || getDefaultAvatar(follower.username)}
                              alt={follower.username}
                            />
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">{follower.username}</p>
                              <p className="text-xs text-gray-500">{follower.bio || '暂无简介'}</p>
                            </div>
                            <button className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200">
                              关注
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        暂无粉丝
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900">关注 ({profileData.stats?.following || 0})</h4>
                      <button
                        onClick={() => fetchSocialData('following')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        刷新
                      </button>
                    </div>

                    {socialLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : following.length > 0 ? (
                      <div className="space-y-3">
                        {following.map((followedUser) => (
                          <div key={followedUser.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={followedUser.avatar || getDefaultAvatar(followedUser.username)}
                              alt={followedUser.username}
                            />
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">{followedUser.username}</p>
                              <p className="text-xs text-gray-500">{followedUser.bio || '暂无简介'}</p>
                            </div>
                            <button className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full hover:bg-gray-200">
                              已关注
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        暂无关注
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )} */}

          </div>
        </div>
      </div>
      
      {/* 工作经历表单 */}
      {showAddExperience && (
        <ExperienceForm
          onSubmit={handleAddExperience}
          onCancel={() => setShowAddExperience(false)}
          type="experience"
        />
      )}
      
      {editingExperience && (
        <ExperienceForm
          experience={editingExperience}
          onSubmit={(data) => handleUpdateExperience(data.id, data)}
          onCancel={() => setEditingExperience(null)}
          type="experience"
        />
      )}
      
      {/* 教育经历表单 */}
      {showAddEducation && (
        <ExperienceForm
          onSubmit={handleAddEducation}
          onCancel={() => setShowAddEducation(false)}
          type="education"
        />
      )}
      
      {editingEducation && (
        <ExperienceForm
          experience={editingEducation}
          onSubmit={(data) => handleUpdateEducation(data.id, data)}
          onCancel={() => setEditingEducation(null)}
          type="education"
        />
      )}
    </div>
  );
};

export default Profile;