import React, { useState, useRef, useCallback } from 'react';
import { 
  UploadIcon, 
  FileIcon, 
  ImageIcon, 
  XIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  FileTextIcon,
  VideoIcon,
  MusicIcon,
  ArchiveIcon,
  FileCodeIcon
} from 'lucide-react';
import { addFile } from '../../api/profiles';
import { useNavigate } from 'react-router-dom';

interface FileData {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview: string | null;
  title: string;
  description: string;
  visibility: 'public' | 'followers' | 'private';
  tags: string[];
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
}

const Upload = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
    if (type.startsWith('video/')) return <VideoIcon className="w-6 h-6" />;
    if (type.startsWith('audio/')) return <MusicIcon className="w-6 h-6" />;
    if (type.includes('pdf') || type.includes('document') || type.includes('word')) return <FileTextIcon className="w-6 h-6" />;
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return <ArchiveIcon className="w-6 h-6" />;
    if (type.includes('code') || type.includes('text')) return <FileCodeIcon className="w-6 h-6" />;
    return <FileIcon className="w-6 h-6" />;
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'bg-blue-100 text-blue-600';
    if (type.startsWith('video/')) return 'bg-purple-100 text-purple-600';
    if (type.startsWith('audio/')) return 'bg-pink-100 text-pink-600';
    if (type.includes('pdf') || type.includes('document')) return 'bg-red-100 text-red-600';
    if (type.includes('zip') || type.includes('archive')) return 'bg-yellow-100 text-yellow-600';
    return 'bg-gray-100 text-gray-600';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newFiles: FileData[] = fileArray.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      title: file.name.replace(/\.[^/.]+$/, ''), // 默认标题为文件名（不含扩展名）
      description: '',
      visibility: 'public' as const,
      tags: [],
      uploadStatus: 'pending' as const,
      progress: 0
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      processFiles(event.target.files);
      // 重置input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const updateFileMetadata = (id: string, field: keyof FileData, value: any) => {
    setSelectedFiles(prev =>
      prev.map(file =>
        file.id === id ? { ...file, [field]: value } : file
      )
    );
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    const uploadResults: { success: number; failed: number } = { success: 0, failed: 0 };

    for (const fileData of selectedFiles) {
      try {
        updateFileMetadata(fileData.id, 'uploadStatus', 'uploading');
        updateFileMetadata(fileData.id, 'progress', 0);

        await addFile({
          file: fileData.file,
          title: fileData.title || fileData.name,
          description: fileData.description,
          visibility: fileData.visibility,
          tags: fileData.tags,
          onUploadProgress: (progress: number) => {
            updateFileMetadata(fileData.id, 'progress', progress);
          }
        });

        updateFileMetadata(fileData.id, 'uploadStatus', 'success');
        updateFileMetadata(fileData.id, 'progress', 100);
        uploadResults.success++;
      } catch (err: any) {
        console.error('上传失败:', err);
        updateFileMetadata(fileData.id, 'uploadStatus', 'error');
        updateFileMetadata(fileData.id, 'progress', 0);
        uploadResults.failed++;
        
        // 提供更友好的错误信息
        let errorMessage = '上传失败';
        if (err.message) {
          if (err.message.includes('timeout')) {
            errorMessage = `文件 "${fileData.name}" 上传超时，请检查网络连接或尝试上传较小的文件`;
          } else if (err.message.includes('Network Error')) {
            errorMessage = `文件 "${fileData.name}" 网络错误，请检查网络连接`;
          } else if (err.message.includes('File too large') || err.message.includes('文件大小超过限制')) {
            const fileSizeMB = (fileData.size / (1024 * 1024)).toFixed(2);
            errorMessage = `文件 "${fileData.name}" 大小 ${fileSizeMB}MB 超过限制（最大 20MB），请上传较小的文件`;
          } else {
            errorMessage = `文件 "${fileData.name}" 上传失败: ${err.message}`;
          }
        }
        setError(errorMessage);
      }
    }

    setIsUploading(false);

    if (uploadResults.failed === 0) {
      setSuccessMessage(`成功上传 ${uploadResults.success} 个文件！`);
      setTimeout(() => {
        navigate('/home', { state: { refresh: true } });
      }, 2000);
    } else if (uploadResults.success > 0) {
      setSuccessMessage(`部分成功：${uploadResults.success} 个成功，${uploadResults.failed} 个失败`);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">上传文件</h1>
          <p className="text-gray-600">选择或拖拽文件到此处上传到您的账户</p>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickUpload}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300
            ${isDragging 
              ? 'border-orange-500 bg-orange-50/50 scale-[1.02]' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex flex-col items-center">
            <div className={`
              p-4 rounded-full mb-4 transition-all duration-300
              ${isDragging 
                ? 'bg-orange-100 scale-110' 
                : 'bg-blue-100'
              }
            `}>
              <UploadIcon className={`w-10 h-10 ${isDragging ? 'text-orange-600' : 'text-blue-600'}`} />
            </div>
            <p className="text-xl font-semibold text-gray-900 mb-2">
              {isDragging ? '松开鼠标以上传文件' : '拖拽文件到此处或点击选择'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              支持图片、文档、视频、音频等多种格式
            </p>
            <button
              type="button"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              选择文件
            </button>
          </div>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                已选择的文件 ({selectedFiles.length})
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {selectedFiles.map((fileData) => (
                <div
                  key={fileData.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-gray-50/50"
                >
                  {/* File Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={`p-3 rounded-lg ${getFileTypeColor(fileData.type)} flex-shrink-0`}>
                        {getFileIcon(fileData.type)}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {fileData.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(fileData.size)} • {fileData.type || '未知类型'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileData.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* File Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        标题
                      </label>
                      <input
                        type="text"
                        value={fileData.title}
                        onChange={(e) => updateFileMetadata(fileData.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入文件标题"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        可见性
                      </label>
                      <select
                        value={fileData.visibility}
                        onChange={(e) => updateFileMetadata(fileData.id, 'visibility', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="public">公开</option>
                        <option value="followers">仅关注者</option>
                        <option value="private">私有</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        描述
                      </label>
                      <textarea
                        value={fileData.description}
                        onChange={(e) => updateFileMetadata(fileData.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入文件描述（可选）"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        标签（用逗号分隔）
                      </label>
                      <input
                        type="text"
                        value={fileData.tags.join(', ')}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                          updateFileMetadata(fileData.id, 'tags', tags);
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="标签1, 标签2, 标签3"
                      />
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {fileData.uploadStatus === 'uploading' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>上传中...</span>
                        <span>{Math.round(fileData.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${fileData.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload Status */}
                  {fileData.uploadStatus === 'success' && (
                    <div className="mt-4 flex items-center text-green-600 text-sm">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      <span>上传成功</span>
                    </div>
                  )}
                  {fileData.uploadStatus === 'error' && (
                    <div className="mt-4 flex items-center text-red-600 text-sm">
                      <AlertCircleIcon className="w-5 h-5 mr-2" />
                      <span>上传失败</span>
                    </div>
                  )}

                  {/* Image Preview */}
                  {fileData.preview && (
                    <div className="mt-4">
                      <img
                        src={fileData.preview}
                        alt={fileData.name}
                        className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() => {
                  selectedFiles.forEach(file => {
                    if (file.preview) URL.revokeObjectURL(file.preview);
                  });
                  setSelectedFiles([]);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isUploading}
              >
                清空列表
              </button>
              <button
                onClick={startUpload}
                disabled={isUploading || selectedFiles.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    上传中...
                  </span>
                ) : (
                  `开始上传 (${selectedFiles.length})`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <AlertCircleIcon className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">上传错误</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-400 hover:text-red-600"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">上传成功</p>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-4 text-green-400 hover:text-green-600"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
            <AlertCircleIcon className="w-4 h-4 mr-2" />
            上传提示
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>单个文件最大支持 100MB</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>支持的格式：JPG, PNG, GIF, PDF, DOC, DOCX, MP4, MP3, ZIP 等</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>请确保您拥有上传文件的版权</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>上传的文件将存储在云端并可随时访问</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Upload;
