import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { XIcon, ImageIcon, UserIcon, GlobeIcon, LockIcon, UsersIcon, VideoIcon } from 'lucide-react';

interface Post {
  id?: string | number;
  content?: string;
  mediaUrl?: string;
  visibility?: 'public' | 'followers' | 'private';
}

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (postData: { content: string; image?: File; video?: File; visibility: string }) => void;
  editingPost?: Post | null;
  mediaType?: 'image' | 'video'; // 指定媒体类型：照片或视频
}

const PostCreationModal: React.FC<PostCreationModalProps> = ({ isOpen, onClose, onPost, editingPost, mediaType = 'image' }) => {
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState('public');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当打开编辑模式时，填充表单
  useEffect(() => {
    if (isOpen && editingPost) {
      setContent(editingPost.content || '');
      setVisibility(editingPost.visibility || 'public');
      if (editingPost.mediaUrl) {
        setImagePreview(editingPost.mediaUrl);
      }
    } else if (isOpen && !editingPost) {
      // 创建模式，重置表单
      setContent('');
      setImagePreview(null);
      setSelectedImage(null);
      setVideoPreview(null);
      setSelectedVideo(null);
      setVisibility('public');
    }
  }, [isOpen, editingPost]);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
      setSelectedImage(file);
        setSelectedVideo(null);
        setVideoPreview(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        setSelectedVideo(file);
        setSelectedImage(null);
        setImagePreview(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          setVideoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedImage && !selectedVideo) return;
    
    setIsUploading(true);
    try {
      await onPost({
        content,
        image: selectedImage || undefined,
        video: selectedVideo || undefined,
        visibility
      });
      // 重置状态
      setContent('');
      setImagePreview(null);
      setSelectedImage(null);
      setVideoPreview(null);
      setSelectedVideo(null);
      onClose();
    } catch (error) {
      console.error('发布失败:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = () => {
    setImagePreview(null);
    setSelectedImage(null);
    setVideoPreview(null);
    setSelectedVideo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'private':
        return <LockIcon className="w-4 h-4" />;
      case 'followers':
        return <UsersIcon className="w-4 h-4" />;
      default:
        return <GlobeIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-purple-50/30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {editingPost 
                ? '编辑帖子' 
                : mediaType === 'video' ? '发布视频' : '发布照片'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 弹窗内容 - 可滚动区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center ring-2 ring-blue-100 shadow-md">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="分享些什么..."
                className="w-full border-0 focus:ring-0 focus:outline-none resize-none text-base placeholder-gray-400 bg-transparent min-h-[120px]"
                  rows={4}
                />

              {/* 图片预览 */}
              {imagePreview && (
                <div className="mt-4 relative group">
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                  <img
                    src={imagePreview}
                    alt="预览"
                      className="w-full max-h-96 object-cover"
                  />
                  <button
                      onClick={removeMedia}
                      className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  >
                      <XIcon className="w-4 h-4 text-gray-700" />
                  </button>
                  </div>
                </div>
              )}

              {/* 视频预览 */}
              {videoPreview && (
                <div className="mt-4 relative group">
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-96 object-cover"
                    />
                  <button
                      onClick={removeMedia}
                      className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  >
                      <XIcon className="w-4 h-4 text-gray-700" />
                  </button>
                  </div>
                </div>
              )}

              {/* 操作按钮区域 */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center transition-all px-4 py-2.5 rounded-xl group border ${
                    mediaType === 'video'
                      ? 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 border-gray-200 hover:border-purple-300'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {mediaType === 'video' ? (
                    <>
                      <VideoIcon className="w-5 h-5 mr-2 text-purple-500 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">添加视频</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 mr-2 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">添加照片</span>
                    </>
                  )}
                </button>

                <div className="relative">
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="flex items-center pl-4 pr-10 py-2.5 bg-white rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-200 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <option value="public">公开</option>
                    <option value="followers">关注者</option>
                    <option value="private">仅自己</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    {getVisibilityIcon()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 弹窗底部 - 固定位置 */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 hover:bg-white rounded-xl transition-all font-medium border border-gray-200 hover:border-gray-300"
          >
            取消
          </button>
          <button
            onClick={handlePost}
            disabled={isUploading || (!content.trim() && !selectedImage && !selectedVideo)}
            className={`px-8 py-2.5 rounded-xl text-white transition-all font-semibold shadow-lg ${
              isUploading || (!content.trim() && !selectedImage && !selectedVideo)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl transform hover:scale-105 active:scale-100'
            }`}
          >
            {isUploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                发布中...
              </span>
            ) : (editingPost ? '更新' : '发布')}
          </button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={mediaType === 'video' ? 'video/*' : 'image/*'}
        className="hidden"
      />
    </div>
  );
};

export default PostCreationModal;