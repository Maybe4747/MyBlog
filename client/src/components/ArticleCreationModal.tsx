import React, { useState, useEffect } from 'react';
import { XIcon, FileTextIcon, GlobeIcon, LockIcon, UsersIcon } from 'lucide-react';

interface Article {
  id?: string | number;
  title?: string;
  summary?: string;
  content?: string;
  visibility?: 'public' | 'followers' | 'private';
}

interface ArticleCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (postData: { title: string; content: string; summary: string; visibility: string }) => void;
  editingArticle?: Article | null;
}

const ArticleCreationModal: React.FC<ArticleCreationModalProps> = ({ isOpen, onClose, onPost, editingArticle }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [isPublishing, setIsPublishing] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string; summary?: string }>({});

  // 当打开编辑模式时，填充表单
  useEffect(() => {
    if (isOpen && editingArticle) {
      setTitle(editingArticle.title || '');
      setSummary(editingArticle.summary || '');
      setContent(editingArticle.content || '');
      setVisibility(editingArticle.visibility || 'public');
    } else if (isOpen && !editingArticle) {
      // 创建模式，重置表单
      setTitle('');
      setSummary('');
      setContent('');
      setVisibility('public');
      setErrors({});
    }
  }, [isOpen, editingArticle]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { title?: string; content?: string; summary?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = '文章标题不能为空';
    } else if (title.trim().length > 200) {
      newErrors.title = '标题不能超过200个字符';
    }
    
    if (!content.trim()) {
      newErrors.content = '文章内容不能为空';
    } else if (content.trim().length < 10) {
      newErrors.content = '文章内容至少需要10个字符';
    }
    
    if (summary.trim().length > 500) {
      newErrors.summary = '摘要不能超过500个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = async () => {
    // 验证表单
    if (!validateForm()) {
      return;
    }
    
    setIsPublishing(true);
    try {
      await onPost({
        title,
        content,
        summary: summary.trim() || undefined,
        visibility
      });
      // 重置状态
      setTitle('');
      setSummary('');
      setContent('');
      setErrors({});
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50/50 to-blue-50/30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl shadow-lg">
              <FileTextIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{editingArticle ? '编辑文章' : '创建文章'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 弹窗内容 - 可滚动区域 */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* 文章标题 */}
            <div>
              <div className={`border-b-2 pb-3 ${
                errors.title ? 'border-red-300' : 'border-gray-200'
              }`}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
                  }}
                  placeholder="文章标题..."
                  className={`w-full text-3xl font-bold border-0 focus:ring-0 focus:outline-none placeholder-gray-300 bg-transparent ${
                    errors.title ? 'text-red-600' : ''
                  }`}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center space-x-2">
                  {errors.title ? (
                    <span className="text-sm text-red-600 font-medium">{errors.title}</span>
                  ) : (
                    <span className="text-xs text-gray-500">标题不能为空，最大 200 个字符</span>
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  title.length > 200 ? 'text-red-600' : 
                  title.length > 0 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {title.length}/200
                  {title.length > 0 && title.length <= 200 && <span className="ml-1">✓</span>}
                </span>
              </div>
            </div>

            {/* 文章摘要 */}
            <div>
              <div className={`bg-gray-50 rounded-2xl p-5 border ${
                errors.summary ? 'border-red-300' : 'border-gray-200'
              }`}>
                <textarea
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    if (errors.summary) setErrors(prev => ({ ...prev, summary: undefined }));
                  }}
                  placeholder="文章摘要（可选）..."
                  className="w-full text-base border-0 focus:ring-0 focus:outline-none placeholder-gray-400 resize-none bg-transparent"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center space-x-2">
                  {errors.summary ? (
                    <span className="text-sm text-red-600 font-medium">{errors.summary}</span>
                  ) : (
                    <span className="text-xs text-gray-500">摘要可选，最大 500 个字符</span>
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  summary.length > 500 ? 'text-red-600' : 
                  summary.length > 0 && summary.length <= 500 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {summary.length}/500
                  {summary.length > 0 && summary.length <= 500 && <span className="ml-1">✓</span>}
                </span>
              </div>
            </div>

            {/* 文章内容 */}
            <div>
              <div className={`bg-gray-50 rounded-2xl p-6 border min-h-[400px] ${
                errors.content ? 'border-red-300' : 'border-gray-200'
              }`}>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (errors.content) setErrors(prev => ({ ...prev, content: undefined }));
                  }}
                  placeholder="开始写你的文章..."
                  className="w-full text-base border-0 focus:ring-0 focus:outline-none placeholder-gray-400 resize-none bg-transparent min-h-[400px] leading-relaxed"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                {errors.content ? (
                  <span className="text-sm text-red-600 font-medium">{errors.content}</span>
                ) : content.trim().length > 0 && content.trim().length < 10 ? (
                  <span className="text-sm text-amber-600 font-medium">
                    内容至少需要10个字符（当前：{content.trim().length}个字符）
                  </span>
                ) : null}
                <span className={`text-xs ml-auto ${
                  content.trim().length < 10 ? 'text-red-600' : 
                  content.trim().length >= 10 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {content.trim().length} 字符
                  {content.trim().length >= 10 && <span className="ml-1">✓</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 弹窗底部 - 固定位置 */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="flex items-center pl-4 pr-10 py-2.5 bg-white rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-green-200 border border-gray-200 hover:border-green-300 transition-colors cursor-pointer"
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
              className="px-6 py-2.5 text-gray-700 hover:bg-white rounded-xl transition-all font-medium border border-gray-200 hover:border-gray-300"
            >
              取消
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing || !title.trim() || !content.trim() || content.trim().length < 10}
              className={`px-8 py-2.5 rounded-xl text-white transition-all font-semibold shadow-lg ${
                isPublishing || !title.trim() || !content.trim() || content.trim().length < 10
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:shadow-xl transform hover:scale-105 active:scale-100'
              }`}
            >
              {isPublishing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  发布中...
                </span>
              ) : (editingArticle ? '更新文章' : '发布文章')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCreationModal;