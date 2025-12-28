import React, { useState } from 'react';
import { XIcon, FileTextIcon, UserIcon, GlobeIcon, LockIcon, UsersIcon } from 'lucide-react';

interface ArticleCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (postData: { title: string; content: string; summary: string; visibility: string }) => void;
}

const ArticleCreationModal: React.FC<ArticleCreationModalProps> = ({ isOpen, onClose, onPost }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isOpen) return null;

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) return;
    
    setIsPublishing(true);
    try {
      await onPost({
        title,
        content,
        summary,
        visibility
      });
      // 重置状态
      setTitle('');
      setSummary('');
      setContent('');
      onClose();
    } catch (error) {
      console.error('发布文章失败:', error);
    } finally {
      setIsPublishing(false);
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
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <FileTextIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">创建文章</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 弹窗内容 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* 文章标题 */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="文章标题"
                className="w-full text-2xl font-bold border-0 focus:ring-0 focus:outline-none placeholder-gray-400"
              />
            </div>

            {/* 文章摘要 */}
            <div>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="文章摘要（可选）"
                className="w-full text-base border-0 focus:ring-0 focus:outline-none placeholder-gray-400 resize-none"
                rows={2}
              />
            </div>

            {/* 文章内容 */}
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="开始写你的文章..."
                className="w-full text-base border-0 focus:ring-0 focus:outline-none placeholder-gray-400 resize-none min-h-[300px]"
              />
            </div>
          </div>
        </div>

        {/* 弹窗底部 */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
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

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing || !title.trim() || !content.trim()}
              className={`px-6 py-2 rounded-lg text-white transition-colors ${
                isPublishing || !title.trim() || !content.trim()
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isPublishing ? '发布中...' : '发布文章'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCreationModal;