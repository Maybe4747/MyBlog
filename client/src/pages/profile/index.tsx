import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { UserIcon, BriefcaseIcon, MapPinIcon, LinkIcon, CalendarIcon, HeartIcon, MessageCircleIcon, MoreHorizontalIcon, FileIcon, DownloadIcon, UsersIcon, UserCheckIcon, MessageSquareIcon, FileTextIcon, ImageIcon, GraduationCapIcon, PlusIcon, Edit3Icon, Trash2Icon, CameraIcon, Building2Icon } from 'lucide-react';
import { getUserProfile, getUserActivity } from '../../api/users';
import { updateProfile } from '../../api/profiles';
import api from '../../api/client';
import { followUser, unfollowUser, getFollowers, getFollowing } from '../../api/social';
import { addMessage, getUserMessages, likeMessage, unlikeMessage } from '../../api/messages';
import { useAuth } from '../../contexts/AuthContext';
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
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  // 文件列表相关状态
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('files');

  // 社交相关状态
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState<boolean>(false);

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
    website: string;
    skills: string;
  }>({
    bio: '',
    location: '',
    website: '',
    skills: ''
  });
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  
  // 头像和背景图片上传相关状态
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // 获取用户活动流
  const fetchUserActivity = useCallback(async (): Promise<void> => {
    if (!username) return;

    try {
      setFilesLoading(true);
      const response = await getUserActivity(username);
      setUserActivity(response.data?.data?.activities || response.data?.activities || []);
    } catch (err: any) {
      console.error('获取用户活动流失败:', err);
    } finally {
      setFilesLoading(false);
    }
  }, [username]);

  // 获取工作经历和教育经历
  const fetchExperiencesAndEducations = useCallback(async () => {
    try {
      setExperiencesLoading(true);
      const [expResponse, eduResponse] = await Promise.all([
        getUserExperiences(),
        getUserEducations()
      ]);
      
      // 直接使用数据库返回的字段名（start_date, end_date）
      const experiencesData = expResponse.data?.data?.experiences || expResponse.data?.experiences || [];
      const educationsData = eduResponse.data?.data?.educations || eduResponse.data?.educations || [];
      
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
      if (!username) return;

      try {
        setLoading(true);
        const response = await getUserProfile(username);
        const userData = response.data?.data?.user || response.data?.user;
        setProfileData(userData);
        setIsFollowing(userData.isFollowing || false);

        // 如果是自己的资料页面，获取活动流、工作经历和教育经历
        if (currentUser && currentUser.username === username) {
          await fetchUserActivity();
          await fetchExperiencesAndEducations();
        } else {
          // 查看他人档案时，清空工作经历和教育经历
          setExperiences([]);
          setEducations([]);
        }
      } catch (err: any) {
        setError(err.message || '获取用户资料失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser, fetchUserActivity, fetchExperiencesAndEducations]);

  // 初始化编辑数据
  useEffect(() => {
    if (profileData) {
      setEditData({
        bio: profileData.bio || '',
        location: profileData.location || '',
        website: profileData.website || '',
        skills: profileData.skills ? profileData.skills.join(', ') : ''
      });
      // 初始化技能数组
      setCurrentSkills(profileData.skills ? [...profileData.skills] : []);
    }
  }, [profileData]);

  // 工作经历相关函数
  const handleAddExperience = useCallback(async (experienceData) => {
    try {
      const response = await addUserExperience(experienceData);
      const newExperience = response.data?.data?.experience || response.data?.experience;
      setExperiences(prev => [newExperience, ...prev]);
      setShowAddExperience(false);
    } catch (err) {
      setError(err.message || '添加工作经历失败');
    }
  }, []);

  const handleUpdateExperience = useCallback(async (id, experienceData) => {
    try {
      const response = await updateUserExperience(id, experienceData);
      const updatedExperience = response.data?.data?.experience || response.data?.experience;
      setExperiences(prev => prev.map(exp => exp.id === id ? updatedExperience : exp));
      setEditingExperience(null);
    } catch (err) {
      setError(err.message || '更新工作经历失败');
    }
  }, []);

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
      const newEducation = response.data?.data?.education || response.data?.education;
      setEducations(prev => [newEducation, ...prev]);
      setShowAddEducation(false);
    } catch (err) {
      setError(err.message || '添加教育经历失败');
    }
  }, []);

  const handleUpdateEducation = useCallback(async (id, educationData) => {
    try {
      const response = await updateUserEducation(id, educationData);
      const updatedEducation = response.data?.data?.education || response.data?.education;
      setEducations(prev => prev.map(edu => edu.id === id ? updatedEducation : edu));
      setEditingEducation(null);
    } catch (err) {
      setError(err.message || '更新教育经历失败');
    }
  }, []);

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
      const response = await getUserMessages(profileData.id, { page: 1, limit: 10 });
      setMessages(response.data.messages || []);
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

  const handleLikeMessage = useCallback(async (messageId, isLiked) => {
    try {
      if (isLiked) {
        await unlikeMessage(messageId);
      } else {
        await likeMessage(messageId);
      }
      // 重新获取留言列表
      fetchMessages();
    } catch (err) {
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
        formData.append('website', editData.website);
        formData.append('skills', JSON.stringify(skillsArray));
        
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
        setProfileData(prev => ({
          ...prev,
          bio: editData.bio,
          location: editData.location,
          website: editData.website,
          skills: skillsArray,
          avatar: updatedData?.avatar || prev.avatar,
          coverImage: updatedData?.coverImage || prev.coverImage
        }));
      } else {
        // 没有图片上传，使用普通JSON请求
        await updateProfile({
          bio: editData.bio,
          location: editData.location,
          website: editData.website,
          skills: skillsArray
        });

        // 更新本地状态
        setProfileData(prev => ({
          ...prev,
          bio: editData.bio,
          location: editData.location,
          website: editData.website,
          skills: skillsArray
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
      website: profileData?.website || '',
      skills: profileData?.skills ? profileData.skills.join(', ') : ''
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

  const isOwnProfile = currentUser && currentUser.username === username;

  return (
    <div className="min-h-screen bg-gray-50">
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
                    src={avatarPreview || profileData.avatar || `https://ui-avatars.com/api/?name=${profileData.username}&background=random`}
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
                    {profileData.position || profileData.title}
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
                  {profileData.website && (
                    <p className="text-gray-500 flex items-center justify-center md:justify-start mt-1">
                      <LinkIcon className="h-4 w-4 mr-1.5" />
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                        {profileData.website}
                      </a>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5">
                  <div className="text-center px-4 py-2 bg-blue-50/60 rounded-xl border border-blue-100/80 backdrop-blur-sm min-w-[70px]">
                    <p className="text-xl font-bold text-blue-500">{profileData.stats?.files || 0}</p>
                    <p className="text-xs text-blue-400 font-medium mt-0.5">文件</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-purple-50/60 rounded-xl border border-purple-100/80 backdrop-blur-sm min-w-[70px]">
                    <p className="text-xl font-bold text-purple-500">{profileData.stats?.followers || 0}</p>
                    <p className="text-xs text-purple-400 font-medium mt-0.5">关注者</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-pink-50/60 rounded-xl border border-pink-100/80 backdrop-blur-sm min-w-[70px]">
                    <p className="text-xl font-bold text-pink-500">{profileData.stats?.following || 0}</p>
                    <p className="text-xs text-pink-400 font-medium mt-0.5">关注</p>
                  </div>
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
                        setActiveTab('more');
                        // 滚动到留言区域
                        setTimeout(() => {
                          const messagesSection = document.getElementById('messages-section');
                          if (messagesSection) {
                            messagesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
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
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4 text-gray-500" />
                        网站
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-sm">https://</span>
                        </div>
                        <input
                          type="text"
                          name="website"
                          value={editData.website?.replace(/^https?:\/\//, '') || ''}
                          onChange={(e) => {
                            let value = e.target.value.trim();
                            // 移除用户可能输入的协议前缀
                            value = value.replace(/^https?:\/\//, '').replace(/^http:\/\//, '');
                            // 调用handleEditChange，但传入完整的URL
                            const syntheticEvent = {
                              target: {
                                name: 'website',
                                value: value ? `https://${value}` : ''
                              }
                            } as React.ChangeEvent<HTMLInputElement>;
                            handleEditChange(syntheticEvent);
                          }}
                          className="w-full pl-16 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 bg-white transition-all text-sm"
                          placeholder="example.com"
                        />
                        {editData.website && editData.website.replace(/^https?:\/\//, '').trim() && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <a
                              href={editData.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                              title="在新标签页中打开"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                      {editData.website && editData.website.replace(/^https?:\/\//, '').trim() && (
                        <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-600">预览：</span>
                          <a 
                            href={editData.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 hover:underline truncate max-w-[200px] inline-block"
                            title={editData.website}
                          >
                            {editData.website}
                          </a>
                        </p>
                      )}
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
              <div className="space-y-6">
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
              <div className="space-y-6">
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
                  activeTab === 'files'
                    ? 'border-blue-300 text-blue-500 bg-blue-50/40'
                    : 'border-transparent text-gray-500 hover:text-blue-400 hover:bg-blue-50/20'
                }`}
                onClick={() => setActiveTab('files')}
              >
                文件
              </button>
              <button
                className={`py-4 px-6 border-b-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'about'
                    ? 'border-purple-300 text-purple-500 bg-purple-50/40'
                    : 'border-transparent text-gray-500 hover:text-purple-400 hover:bg-purple-50/20'
                }`}
                onClick={() => setActiveTab('about')}
              >
                关于
              </button>
              {/* <button
                className={`py-4 px-6 border-b-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'connections'
                    ? 'border-pink-300 text-pink-500 bg-pink-50/40'
                    : 'border-transparent text-gray-500 hover:text-pink-400 hover:bg-pink-50/20'
                }`}
                onClick={() => setActiveTab('connections')}
              >
                连接
              </button> */}
              <button
                className={`py-4 px-6 border-b-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'more'
                    ? 'border-green-300 text-green-500 bg-green-50/40'
                    : 'border-transparent text-gray-500 hover:text-green-400 hover:bg-green-50/20'
                }`}
                onClick={() => setActiveTab('more')}
              >
                更多
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'files' && (
              <div>
                {filesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : userActivity.length > 0 ? (
                  <div className="space-y-4">
                    {userActivity.map((activity) => (
                      activity.type === 'file_upload' || activity.originalName ? (
                        // 文件类型活动
                        <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <FileIcon className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="ml-3 flex-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{activity.title || activity.originalName}</h4>
                              <p className="text-xs text-gray-500">{activity.originalName}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-500">{(activity.size / 1024).toFixed(1)} KB</span>
                                <span className="text-xs text-gray-500">{activity.visibility}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-between text-xs text-gray-500">
                            <span>{activity.downloadCount || 0} 次下载</span>
                            <span>{new Date(activity.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ) : activity.type === 'article' || activity.articleUrl ? (
                        // 文章类型活动
                        <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <FileTextIcon className="h-8 w-8 text-green-500" />
                            </div>
                            <div className="ml-3 flex-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{activity.title}</h4>
                              <p className="text-xs text-gray-500">{activity.description || activity.summary}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-500">{activity.readTime || '3分钟'}阅读</span>
                                <span className="text-xs text-gray-500">{activity.claps || activity.likeCount || 0} 点赞</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-between text-xs text-gray-500">
                            <span>文章</span>
                            <span>{new Date(activity.publishedAt || activity.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ) : activity.type === 'image_post' || activity.mediaUrl ? (
                        // 图片类型活动
                        <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <ImageIcon className="h-8 w-8 text-purple-500" />
                            </div>
                            <div className="ml-3 flex-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{activity.title || '图片分享'}</h4>
                              <p className="text-xs text-gray-500">{activity.caption || activity.description}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-500">{activity.likeCount || 0} 点赞</span>
                                <span className="text-xs text-gray-500">{activity.commentCount || 0} 评论</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 rounded-lg overflow-hidden">
                            <img
                              src={activity.mediaUrl}
                              alt={activity.caption || activity.title}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                          <div className="mt-2 flex justify-between text-xs text-gray-500">
                            <span>图片</span>
                            <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ) : (
                        // 默认活动类型
                        <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <FileIcon className="h-8 w-8 text-indigo-500" />
                            </div>
                            <div className="ml-3 flex-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{activity.title || '活动'}</h4>
                              <p className="text-xs text-gray-500">{activity.content || activity.description}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-500">{activity.likeCount || 0} 点赞</span>
                                <span className="text-xs text-gray-500">{activity.commentCount || 0} 评论</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-between text-xs text-gray-500">
                            <span>{activity.type || '分享'}</span>
                            <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无内容</h3>
                    <p className="text-gray-500">此用户还没有任何分享</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">关于 {profileData.username}</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">个人简介</h4>
                    <p className="mt-1 text-sm text-gray-600">{profileData.bio || '该用户还未设置个人简介'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">位置</h4>
                    <p className="mt-1 text-sm text-gray-600">{profileData.location || '未设置位置'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">网站</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {profileData.website ? (
                        <a href={profileData.website} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                          {profileData.website}
                        </a>
                      ) : '未设置网站'}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      工作经历、教育经历和技能请查看主页面的独立卡片区域
                    </p>
                  </div>
                </div>
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
                              src={follower.avatar || `https://ui-avatars.com/api/?name=${follower.username}&background=random`}
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
                              src={followedUser.avatar || `https://ui-avatars.com/api/?name=${followedUser.username}&background=random`}
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

            {activeTab === 'more' && (
              <div id="messages-section">
                <h3 className="text-lg font-medium text-gray-900 mb-4">留言</h3>

                {/* 发表留言区域 */}
                {!isOwnProfile && (
                  <div className="mb-6">
                    <div className="flex items-start space-x-3">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.username || 'User'}&background=random`}
                        alt={currentUser?.username}
                      />
                      <div className="flex-1">
                        <textarea
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          placeholder={`给 ${profileData.username} 留个言吧...`}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows="3"
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={handleAddMessage}
                            disabled={!messageContent.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            发表
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 留言列表 */}
                <div>
                  {messagesLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={message.avatar || `https://ui-avatars.com/api/?name=${message.username}&background=random`}
                            alt={message.username}
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h4 className="text-sm font-medium text-gray-900">{message.username}</h4>
                              <span className="mx-2 text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-1 text-gray-700">{message.content}</p>
                            <div className="mt-2 flex items-center space-x-4">
                              <button
                                onClick={() => handleLikeMessage(message.id, message.isLiked)}
                                className={`flex items-center space-x-1 ${
                                  message.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                                }`}
                              >
                                <HeartIcon className={`h-4 w-4 ${message.isLiked ? 'fill-current' : ''}`} />
                                <span className="text-xs">{message.likeCount || 0}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
                                <MessageCircleIcon className="h-4 w-4" />
                                <span className="text-xs">回复</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      暂无留言
                    </div>
                  )}
                </div>
              </div>
            )}
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