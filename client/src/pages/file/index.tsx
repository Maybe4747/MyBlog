import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFileById, updateFile, deleteFile, likeFile, unlikeFile } from '../../api/profiles';
import Navbar from '../../components/Navbar';
import { 
  HeartIcon, 
  MessageCircleIcon, 
  ShareIcon, 
  CalendarIcon, 
  UserIcon, 
  ArrowLeftIcon,
  DownloadIcon,
  EditIcon,
  TrashIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  FileIcon,
  XIcon,
  CheckIcon
} from 'lucide-react';

interface FileData {
  id: number;
  title: string;
  description: string;
  original_name: string;
  file_url: string;
  mime_type: string;
  size: number;
  category: string;
  visibility: 'public' | 'followers' | 'private';
  tags: string[];
  uploaded_at: string;
  user_id: number;
  owner_username: string;
  avatar?: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
}

const FileDetail = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    visibility: 'public' as 'public' | 'followers' | 'private',
    tags: [] as string[]
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      if (!fileId) {
        setError('文件ID无效');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result: any = await getFileById(parseInt(fileId));
        
        if (result?.code === 0 && result?.data?.file) {
          const fileData = result.data.file;
          setFile(fileData);
          setEditData({
            title: fileData.title,
            description: fileData.description || '',
            visibility: fileData.visibility,
            tags: fileData.tags || []
          });
        } else {
          setError(result?.msg || '获取文件失败');
        }
      } catch (err: any) {
        console.error('获取文件详情失败:', err);
        setError(err.message || '获取文件失败');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [fileId]);

  const handleLike = async () => {
    if (!file || !fileId) return;

    try {
      let result: any;
      if (file.liked) {
        result = await unlikeFile(parseInt(fileId));
      } else {
        result = await likeFile(parseInt(fileId));
      }
      
      if (result?.code === 0 || result?.message) {
        setFile({
          ...file,
          liked: !file.liked,
          likeCount: file.liked ? file.likeCount - 1 : file.likeCount + 1
        });
      }
    } catch (err: any) {
      console.error('点赞失败:', err);
    }
  };

  const handleDownload = () => {
    if (!file?.file_url) return;
    window.open(file.file_url, '_blank');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!fileId) return;

    try {
      const result: any = await updateFile(parseInt(fileId), {
        title: editData.title,
        description: editData.description,
        visibility: editData.visibility,
        tags: editData.tags
      });

      if (result?.code === 0 || result?.message) {
        setFile({
          ...file!,
          ...editData
        });
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error('更新文件失败:', err);
      alert('更新文件失败: ' + (err.message || '未知错误'));
    }
  };

  const handleCancelEdit = () => {
    if (file) {
      setEditData({
        title: file.title,
        description: file.description || '',
        visibility: file.visibility,
        tags: file.tags || []
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!fileId) return;

    try {
      const result: any = await deleteFile(parseInt(fileId));
      if (result?.code === 0 || result?.message) {
        navigate('/home');
      }
    } catch (err: any) {
      console.error('删除文件失败:', err);
      alert('删除文件失败: ' + (err.message || '未知错误'));
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <FileIcon className="w-8 h-8" />;
    if (file.mime_type?.startsWith('image/')) return <ImageIcon className="w-8 h-8" />;
    if (file.mime_type?.startsWith('video/')) return <VideoIcon className="w-8 h-8" />;
    return <FileTextIcon className="w-8 h-8" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const canPreview = () => {
    if (!file) return false;
    const mimeType = file.mime_type?.toLowerCase() || '';
    return (
      mimeType.startsWith('image/') ||
      mimeType.startsWith('video/') ||
      mimeType === 'application/pdf' ||
      mimeType.startsWith('text/')
    );
  };

  const renderPreview = () => {
    if (!file || !canPreview()) return null;

    const mimeType = file.mime_type?.toLowerCase() || '';

    if (mimeType.startsWith('image/')) {
      return (
        <div className="mb-6">
          <img
            src={file.file_url}
            alt={file.title}
            className="w-full rounded-lg shadow-lg"
          />
        </div>
      );
    }

    if (mimeType.startsWith('video/')) {
      return (
        <div className="mb-6">
          <video
            src={file.file_url}
            controls
            className="w-full rounded-lg shadow-lg"
          >
            您的浏览器不支持视频播放
          </video>
        </div>
      );
    }

    if (mimeType === 'application/pdf') {
      return (
        <div className="mb-6">
          <iframe
            src={file.file_url}
            className="w-full h-[600px] rounded-lg shadow-lg border"
            title={file.title}
          />
        </div>
      );
    }

    if (mimeType.startsWith('text/')) {
      return (
        <div className="mb-6">
          <iframe
            src={file.file_url}
            className="w-full h-[600px] rounded-lg shadow-lg border"
            title={file.title}
          />
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || '文件不存在'}</p>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === file.user_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          返回首页
        </button>

        {/* 文件内容 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* 文件头部 */}
          <div className="bg-white border-b border-gray-200 p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <img
                  className="h-16 w-16 rounded-full ring-2 ring-gray-200"
                  src={file.avatar || `https://ui-avatars.com/api/?name=${file.owner_username}&background=random`}
                  alt={file.owner_username}
                />
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900">{file.owner_username}</h3>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {new Date(file.uploaded_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              {isOwner && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="文件标题"
                />
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="文件描述"
                />
                <select
                  value={editData.visibility}
                  onChange={(e) => setEditData({ ...editData, visibility: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">公开</option>
                  <option value="followers">仅关注者</option>
                  <option value="private">私有</option>
                </select>
                <input
                  type="text"
                  value={editData.tags.join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                    setEditData({ ...editData, tags });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="标签（用逗号分隔）"
                />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <CheckIcon className="w-4 h-4 mr-1" />
                    保存
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
                  >
                    <XIcon className="w-4 h-4 mr-1" />
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl mr-4">
                    {getFileIcon()}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{file.title}</h1>
                    <p className="text-sm text-gray-600 mb-1">{file.original_name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)} • {file.mime_type || '未知类型'}</p>
                  </div>
                </div>
                
                {file.description && (
                  <p className="text-lg text-gray-600 mb-4">{file.description}</p>
                )}

                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {file.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 文件预览 */}
          {!isEditing && renderPreview()}

          {/* 文件操作栏 */}
          {!isEditing && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all ${
                      file.liked
                        ? 'text-red-600 bg-red-50 hover:bg-red-100'
                        : 'text-gray-600 bg-white hover:bg-gray-50'
                    } border border-gray-200`}
                  >
                    <HeartIcon className={`w-5 h-5 ${file.liked ? 'fill-current' : ''}`} />
                    <span className="font-medium">点赞 ({file.likeCount || 0})</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 px-6 py-3 rounded-xl text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 transition-all">
                    <MessageCircleIcon className="w-5 h-5" />
                    <span className="font-medium">评论 ({file.commentCount || 0})</span>
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-6 py-3 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    <span className="font-medium">下载</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 px-6 py-3 rounded-xl text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 transition-all">
                    <ShareIcon className="w-5 h-5" />
                    <span className="font-medium">分享</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">确定要删除这个文件吗？此操作无法撤销。</p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDetail;

