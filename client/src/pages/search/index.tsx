import React, { useState } from 'react';
import { SearchIcon, UsersIcon, BriefcaseIcon, FileTextIcon, HashIcon, UserIcon, BuildingIcon } from 'lucide-react';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Mock search results
  const searchResults = {
    all: [
      { id: 1, type: 'user', name: '张三', title: '高级软件工程师', company: '科技公司', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
      { id: 2, type: 'user', name: '李四', title: '产品经理', company: '互联网公司', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
      { id: 3, type: 'job', title: '前端开发工程师', company: '创新科技', location: '北京', salary: '20k-35k' },
      { id: 4, type: 'post', title: 'React 最新特性解析', author: '王五', likes: 124, comments: 12, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
      { id: 5, type: 'hashtag', name: '#前端开发', posts: 1234 },
      { id: 6, type: 'company', name: '腾讯科技', industry: '互联网', employees: '10000+' }
    ],
    people: [
      { id: 1, name: '张三', title: '高级软件工程师', company: '科技公司', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
      { id: 2, name: '李四', title: '产品经理', company: '互联网公司', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
      { id: 3, name: '王五', title: 'UI设计师', company: '设计公司', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' }
    ],
    jobs: [
      { id: 1, title: '前端开发工程师', company: '创新科技', location: '北京', salary: '20k-35k', logo: 'https://via.placeholder.com/40x40' },
      { id: 2, title: '后端开发工程师', company: '互联网公司', location: '上海', salary: '25k-40k', logo: 'https://via.placeholder.com/40x40' },
      { id: 3, title: '产品经理', company: '科技公司', location: '深圳', salary: '22k-38k', logo: 'https://via.placeholder.com/40x40' }
    ],
    content: [
      { id: 1, title: 'React 最新特性解析', author: '张三', likes: 124, comments: 12, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
      { id: 2, title: 'Vue 3 与 TypeScript 最佳实践', author: '李四', likes: 89, comments: 7, avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' },
      { id: 3, title: 'Node.js 性能优化指南', author: '王五', likes: 156, comments: 18, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' }
    ],
    hashtags: [
      { id: 1, name: '#前端开发', posts: 1234 },
      { id: 2, name: '#React', posts: 890 },
      { id: 3, name: '#JavaScript', posts: 2100 },
      { id: 4, name: '#TypeScript', posts: 756 },
      { id: 5, name: '#Vue', posts: 632 }
    ]
  };

  const getResults = () => {
    return searchResults[activeTab] || searchResults.all;
  };

  const renderResult = (item) => {
    switch (item.type) {
      case 'user':
        return (
          <div key={item.id} className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
            <img
              className="h-12 w-12 rounded-full"
              src={item.avatar}
              alt={item.name}
            />
            <div className="ml-4 flex-1">
              <h4 className="text-sm font-semibold text-gray-900">{item.name}</h4>
              <p className="text-sm text-gray-600">{item.title}</p>
              <p className="text-xs text-gray-500">{item.company}</p>
            </div>
            <button className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
              连接
            </button>
          </div>
        );
      case 'job':
        return (
          <div key={item.id} className="p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-b-0">
            <div className="flex items-start">
              <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                <BuildingIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.company} · {item.location}</p>
                <p className="text-xs text-green-600 font-medium">{item.salary}</p>
              </div>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                申请
              </button>
            </div>
          </div>
        );
      case 'post':
        return (
          <div key={item.id} className="p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-b-0">
            <div className="flex items-center">
              <img
                className="h-8 w-8 rounded-full"
                src={item.avatar}
                alt={item.author}
              />
              <div className="ml-3">
                <h4 className="text-sm font-semibold text-gray-900">{item.author}</h4>
              </div>
            </div>
            <h5 className="text-sm font-medium text-gray-900 mt-2">{item.title}</h5>
            <div className="flex items-center mt-3 text-xs text-gray-500">
              <span className="flex items-center mr-4">
                <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center mr-1">
                  <span className="w-1 h-1 bg-white rounded-full"></span>
                </span>
                {item.likes} 赞同
              </span>
              <span className="flex items-center">
                <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center mr-1">
                  <span className="w-1 h-1 bg-white rounded-full"></span>
                </span>
                {item.comments} 评论
              </span>
            </div>
          </div>
        );
      case 'hashtag':
        return (
          <div key={item.id} className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <HashIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">#{item.name}</h4>
              <p className="text-xs text-gray-500">{item.posts} 个帖子</p>
            </div>
            <button className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
              关注
            </button>
          </div>
        );
      case 'company':
        return (
          <div key={item.id} className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
              <BuildingIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">{item.name}</h4>
              <p className="text-xs text-gray-500">{item.industry} · {item.employees} 员工</p>
            </div>
            <button className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
              关注
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索用户、职位、内容..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Search tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } text-sm font-medium transition-colors`}
              >
                全部
              </button>
              <button
                onClick={() => setActiveTab('people')}
                className={`py-4 px-1 border-b-2 ${
                  activeTab === 'people'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } text-sm font-medium transition-colors`}
              >
                人脉
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`py-4 px-1 border-b-2 ${
                  activeTab === 'jobs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } text-sm font-medium transition-colors`}
              >
                职位
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`py-4 px-1 border-b-2 ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } text-sm font-medium transition-colors`}
              >
                内容
              </button>
              <button
                onClick={() => setActiveTab('hashtags')}
                className={`py-4 px-1 border-b-2 ${
                  activeTab === 'hashtags'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } text-sm font-medium transition-colors`}
              >
                话题
              </button>
            </nav>
          </div>

          {/* Search results */}
          <div className="p-4">
            {getResults().length > 0 ? (
              <div className="divide-y divide-gray-100">
                {getResults().map(item => (
                  <div key={item.id}>
                    {renderResult(item)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <SearchIcon className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">未找到结果</h3>
                <p className="mt-1 text-sm text-gray-500">尝试使用不同的搜索词</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;