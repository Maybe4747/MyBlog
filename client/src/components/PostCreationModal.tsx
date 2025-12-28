import React, { useState, useRef, ChangeEvent } from 'react';
import { XIcon, ImageIcon, FileTextIcon, UserIcon, GlobeIcon, LockIcon, UsersIcon } from 'lucide-react';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (postData: { content: string; image?: File; visibility: string }) => void;
}

const PostCreationModal: React.FC<PostCreationModalProps> = ({ isOpen, onClose, onPost }) => {
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [visibility, setVisibility] = useState('public');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedImage) return;
    
    setIsUploading(true);
    try {
      await onPost({
        content,
        image: selectedImage || undefined,
        visibility
      });
      // 重置状态
      setContent('');
      setImagePreview(null);
      setSelectedImage(null);
      onClose();
    } catch (error) {
      console.error('发布失败:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setSelectedImage(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">创建帖子</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 弹窗内容 */}
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="border-b border-gray-200 pb-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="分享些什么..."
                  className="w-full border-0 focus:ring-0 focus:outline-none resize-none text-lg placeholder-gray-500"
                  rows={4}
                />
              </div>

              {/* 图片预览 */}
              {imagePreview && (
                <div className="mt-4 relative">
                  <img
                    src={imagePreview}
                    alt="预览"
                    className="rounded-lg max-h-64 w-full object-cover"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                  >
                    <XIcon className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              )}

              {/* 可见性设置 */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    <ImageIcon className="w-5 h-5 mr-1" />
                    <span>照片</span>
                  </button>
                  <button className="flex items-center text-gray-600 hover:text-green-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
                    <FileTextIcon className="w-5 h-5 mr-1" />
                    <span>文章</span>
                  </button>
                </div>

                <div className="relative">
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="flex items-center pl-3 pr-8 py-2 bg-gray-100 rounded-full text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500"
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

        {/* 弹窗底部 */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handlePost}
            disabled={isUploading || (!content.trim() && !selectedImage)}
            className={`px-6 py-2 rounded-lg text-white transition-colors ${
              isUploading || (!content.trim() && !selectedImage)
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? '发布中...' : '发布'}
          </button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default PostCreationModal;