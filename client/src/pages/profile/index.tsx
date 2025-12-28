import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { UserIcon, BriefcaseIcon, MapPinIcon, LinkIcon, CalendarIcon, HeartIcon, MessageCircleIcon, MoreHorizontalIcon, FileIcon, DownloadIcon, UsersIcon, UserCheckIcon, MessageSquareIcon, FileTextIcon, ImageIcon, GraduationCapIcon, PlusIcon, Edit3Icon, Trash2Icon } from 'lucide-react';
import { getUserProfile, getUserActivity } from '../../api/users';
import { updateProfile } from '../../api/profiles';
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

// 内联 ExperienceForm 组件以避免外部组件引起的 Hooks 顺序问题
const ExperienceForm = ({ experience, onSubmit, onCancel, type }) => {
  const [formData, setFormData] = useState({
    company: experience?.company || experience?.school || '',
    position: experience?.position || '',
    school: experience?.school || experience?.company || '',
    degree: experience?.degree || '',
    major: experience?.major || '',
    startDate: experience?.startDate?.split('T')[0] || '',
    endDate: experience?.endDate?.split('T')[0] || '',
    description: experience?.description || '',
  });

  const [isCurrent, setIsCurrent] = useState(!experience?.endDate);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {experience ? '编辑' : '添加'} {type === 'experience' ? '工作经历' : '教育经历'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {type === 'experience' ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">公司</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">学校</label>
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学位</label>
                    <input
                      type="text"
                      name="degree"
                      value={formData.degree}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">专业</label>
                    <input
                      type="text"
                      name="major"
                      value={formData.major}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                <input
                  type="date"
                  name="endDate"
                  value={isCurrent ? '' : formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCurrent}
                />
                <div className="mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isCurrent}
                      onChange={(e) => setIsCurrent(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">至今</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {experience ? '更新' : '添加'}
              </button>
            </div>
          </form>
        </div>
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
      
      setExperiences(expResponse.data?.data?.experiences || expResponse.data?.experiences || []);
      setEducations(eduResponse.data?.data?.educations || eduResponse.data?.educations || []);
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

        // 如果是自己的资料页面，也获取活动流、工作经历和教育经历
        if (currentUser && currentUser.username === username) {
          await fetchUserActivity();
          await fetchExperiencesAndEducations();
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

  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name, value } = target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  }, [setEditData]);

  const handleSaveProfile = useCallback(async () => {
    try {
      const skillsArray = editData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);

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

      setIsEditing(false);
    } catch (err) {
      setError(err.message || '更新档案失败');
    }
  }, [editData]);

  const handleCancelEdit = useCallback(() => {
    setEditData({
      bio: profileData.bio || '',
      location: profileData.location || '',
      website: profileData.website || '',
      skills: profileData.skills ? profileData.skills.join(', ') : ''
    });
    setIsEditing(false);
  }, [profileData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover image */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600">
        {profileData.coverImage ? (
          <img
            src={profileData.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500" />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Profile info */}
        <div className="relative -mt-20">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-start">
              <div className="flex-shrink-0">
                <img
                  className="h-32 w-32 rounded-full border-4 border-white mx-auto md:mx-0"
                  src={profileData.avatar || `https://ui-avatars.com/api/?name=${profileData.username}&background=random`}
                  alt={profileData.username}
                />
              </div>

              <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{profileData.username}</h1>
                <p className="text-lg text-gray-600">{profileData.position || profileData.title} · {profileData.company}</p>
                <p className="text-gray-500 flex items-center justify-center md:justify-start mt-1">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {profileData.location || '未设置位置'}
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{profileData.stats?.files || 0}</p>
                    <p className="text-sm text-gray-500">文件</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{profileData.stats?.followers || 0}</p>
                    <p className="text-sm text-gray-500">关注者</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{profileData.stats?.following || 0}</p>
                    <p className="text-sm text-gray-500">关注</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  {!isOwnProfile && (
                    <button
                      onClick={handleFollow}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isFollowing
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isFollowing ? '已关注' : '关注'}
                    </button>
                  )}
                  {isOwnProfile && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      编辑档案
                    </button>
                  )}
                  {isOwnProfile && isEditing && (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        取消
                      </button>
                    </>
                  )}
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    消息
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <MoreHorizontalIcon className="w-5 h-5 inline mr-1" />
                    更多
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                    <textarea
                      name="bio"
                      value={editData.bio}
                      onChange={handleEditChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
                    <input
                      type="text"
                      name="location"
                      value={editData.location}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">网站</label>
                    <input
                      type="text"
                      name="website"
                      value={editData.website}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">技能 (用逗号分隔)</label>
                    <input
                      type="text"
                      name="skills"
                      value={editData.skills}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-700">{profileData.bio || '该用户还未设置个人简介'}</p>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                    {profileData.position && (
                      <div className="flex items-center">
                        <BriefcaseIcon className="h-4 w-4 mr-1" />
                        {profileData.position} at {profileData.company || '未设置公司'}
                      </div>
                    )}
                    {profileData.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {profileData.location}
                      </div>
                    )}
                    {profileData.website && (
                      <div className="flex items-center">
                        <LinkIcon className="h-4 w-4 mr-1" />
                        <a href={profileData.website} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                          {profileData.website}
                        </a>
                      </div>
                    )}
                    {profileData.joinedDate && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        加入于 {profileData.joinedDate}
                      </div>
                    )}
                  </div>

                  {profileData.skills && profileData.skills.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">技能</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile content tabs */}
        <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                className={`py-4 px-1 border-b-2 text-sm font-medium ${
                  activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('files')}
              >
                文件
              </button>
              <button
                className={`py-4 px-1 border-b-2 text-sm font-medium ${
                  activeTab === 'about'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('about')}
              >
                关于
              </button>
              <button
                className={`py-4 px-1 border-b-2 text-sm font-medium ${
                  activeTab === 'connections'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('connections')}
              >
                连接
              </button>
              <button
                className={`py-4 px-1 border-b-2 text-sm font-medium ${
                  activeTab === 'more'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  
                  {profileData.skills && profileData.skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">技能</h4>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {profileData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 工作经历部分 */}
                  {isOwnProfile && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-900">工作经历</h4>
                        <button
                          onClick={() => setShowAddExperience(true)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          添加
                        </button>
                      </div>
                      
                      {experiencesLoading ? (
                        <div className="text-sm text-gray-500">加载中...</div>
                      ) : experiences.length > 0 ? (
                        <div className="space-y-3">
                          {experiences.map((exp) => (
                            <div key={exp.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-900">{exp.position}</h5>
                                  <p className="text-sm text-gray-600">{exp.company}</p>
                                </div>
                                {isOwnProfile && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => setEditingExperience(exp)}
                                      className="text-gray-500 hover:text-blue-600"
                                    >
                                      <Edit3Icon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteExperience(exp.id)}
                                      className="text-gray-500 hover:text-red-600"
                                    >
                                      <Trash2Icon className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="mt-2 text-sm text-gray-500 flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                {new Date(exp.startDate).toLocaleDateString()} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : '至今'}
                              </div>
                              {exp.description && (
                                <p className="mt-2 text-sm text-gray-600">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">暂无工作经历</p>
                      )}
                    </div>
                  )}
                  
                  {/* 教育经历部分 */}
                  {isOwnProfile && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-900">教育经历</h4>
                        <button
                          onClick={() => setShowAddEducation(true)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          添加
                        </button>
                      </div>
                      
                      {experiencesLoading ? (
                        <div className="text-sm text-gray-500">加载中...</div>
                      ) : educations.length > 0 ? (
                        <div className="space-y-3">
                          {educations.map((edu) => (
                            <div key={edu.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-900">{edu.school}</h5>
                                  <p className="text-sm text-gray-600">
                                    {edu.degree && `${edu.degree} · `}
                                    {edu.major}
                                  </p>
                                </div>
                                {isOwnProfile && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => setEditingEducation(edu)}
                                      className="text-gray-500 hover:text-blue-600"
                                    >
                                      <Edit3Icon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEducation(edu.id)}
                                      className="text-gray-500 hover:text-red-600"
                                    >
                                      <Trash2Icon className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="mt-2 text-sm text-gray-500 flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {new Date(edu.startDate).toLocaleDateString()} - {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : '至今'}
                              </div>
                              {edu.description && (
                                <p className="mt-2 text-sm text-gray-600">{edu.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">暂无教育经历</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'connections' && (
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
            )}

            {activeTab === 'more' && (
              <div>
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
          experience={null}
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
          experience={null}
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