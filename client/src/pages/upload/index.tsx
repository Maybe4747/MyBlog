import React, { useState } from 'react';
import { UploadIcon, FileIcon, ImageIcon, XIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { addFile } from '../../api/profiles';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [fileMetadata, setFileMetadata] = useState({
    title: '',
    description: '',
    visibility: 'public',
    tags: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const fileData = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setSelectedFiles(prev => [...prev, ...fileData]);
  };

  const removeFile = (id) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setFileMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFileMetadata(prev => ({
      ...prev,
      tags
    }));
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    for (const fileData of selectedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 0 }));

        // 上传文件
        const result = await addFile({
          file: fileData.file,
          title: fileMetadata.title || fileData.name,
          description: fileMetadata.description,
          visibility: fileMetadata.visibility,
          tags: fileMetadata.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          onUploadProgress: (progress) => {
            setUploadProgress(prev => ({ ...prev, [fileData.id]: progress }));
          }
        });
        // 确保进度达到100%
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 100 }));
      } catch (err) {
        console.error('上传失败:', err);
        setError(err.message || '上传失败');
        setUploadProgress(prev => ({ ...prev, [fileData.id]: -1 })); // 标记为失败
      }
    }

    setIsUploading(false);

    // 上传完成后，如果全部成功则跳转到主页
    if (!error) {
      setTimeout(() => {
        navigate('/home');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">上传文件</h1>
            <p className="text-gray-600 mt-1">选择要上传的文件到您的账户</p>
          </div>

          <div className="p-6">
            {/* 文件元数据表单 */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  文件标题 *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={fileMetadata.title}
                  onChange={handleMetadataChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入文件标题"
                />
              </div>
              <div>
                <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
                  可见性
                </label>
                <select
                  id="visibility"
                  name="visibility"
                  value={fileMetadata.visibility}
                  onChange={handleMetadataChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">公开</option>
                  <option value="followers">仅关注者</option>
                  <option value="private">私有</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={fileMetadata.description}
                  onChange={handleMetadataChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入文件描述"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  标签 (用逗号分隔)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={fileMetadata.tags}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="标签1, 标签2, 标签3"
                />
              </div>
            </div>

            {/* Upload area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">拖拽文件到此处或点击选择</p>
              <p className="mt-2 text-sm text-gray-500">支持图片、文档、视频等多种格式</p>

              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                选择文件
              </button>
            </div>

            {/* Selected files list */}
            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">已选择的文件 ({selectedFiles.length})</h2>

                <div className="space-y-3">
                  {selectedFiles.map((fileData) => (
                    <div key={fileData.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        {fileData.preview ? (
                          <div className="relative">
                            <img
                              src={fileData.preview}
                              alt={fileData.name}
                              className="w-12 h-12 object-cover rounded-md"
                            />
                            {showPreview && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <EyeIcon className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                            <FileIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {fileData.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(fileData.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {uploadProgress[fileData.id] !== undefined && uploadProgress[fileData.id] >= 0 && (
                          <div className="w-24">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{Math.round(uploadProgress[fileData.id])}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[fileData.id]}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        {uploadProgress[fileData.id] === -1 && (
                          <span className="text-red-500 text-sm">失败</span>
                        )}
                        <button
                          onClick={() => removeFile(fileData.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <XIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={startUpload}
                    disabled={isUploading || selectedFiles.length === 0}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? '上传中...' : '开始上传'}
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Upload tips */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">上传提示</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 单个文件最大支持 100MB</li>
                <li>• 支持的格式：JPG, PNG, PDF, DOC, DOCX, MP4 等</li>
                <li>• 请确保您拥有上传文件的版权</li>
                <li>• 上传的文件将存储在云端并可随时访问</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;