import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getSearchSuggestions } from '../api/search';
import { getUnreadCount } from '../api/notifications';
import { User } from '../types';
import { getDefaultAvatar } from '../utils/commonUtils';
import {
  SearchIcon,
  BellIcon,
  MailIcon
} from 'lucide-react';

interface Suggestion {
  value: string;
  label: string;
  type: string;
}

interface NavbarProps {
  activeTab?: 'feed' | 'network';
  onTabChange?: (tab: 'feed' | 'network') => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response: any = await getUnreadCount();
        console.log('未读通知API响应:', response);
        // 尝试多种可能的响应格式
        const count = response?.data?.data?.count 
          || response?.data?.count 
          || 0;
        console.log('解析的未读数量:', count, 'unreadCount状态:', unreadCount);
        setUnreadCount(Number(count) || 0);
      } catch (err: any) {
        console.error('获取未读通知数量失败:', err);
        setUnreadCount(0);
      }
    };

    if (user) {
      fetchUnreadCount();

      // 每30秒更新一次未读通知数量
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSuggestions([]);
      setSearchQuery('');
    }
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      try {
        const result = await getSearchSuggestions(query);
        setSuggestions(result.data?.suggestions?.users || []);
      } catch (err: any) {
        console.error('获取搜索建议失败:', err);
      }
    } else {
      setSuggestions([]);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link to="/home">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  老己
                </h1>
              </Link>
            </div>

            {/* 导航标签 - 仅在首页显示 */}
            {activeTab && onTabChange && (
              <nav className="hidden md:flex space-x-8">
                <button
                  onClick={() => onTabChange('feed')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'feed'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  动态
                </button>
                <button
                  onClick={() => onTabChange('network')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'network'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  职场人脉
                </button>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* 搜索框 */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
                placeholder="搜索..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />

              {/* 搜索建议下拉框 */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  {suggestions.map((suggestion, index) => (
                    <Link
                      key={index}
                      to={`/profile/${suggestion.value}`}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        setSuggestions([]);
                        setSearchQuery('');
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">{suggestion.value[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{suggestion.value}</p>
                        <p className="text-gray-500 text-xs">用户</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 通知按钮 */}
            <Link
              to="/notifications"
              className={`relative p-2 rounded-full transition-colors ${
                unreadCount > 0
                  ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title={unreadCount > 0 ? `您有 ${unreadCount} 条未读通知` : '通知'}
            >
              <BellIcon className={`h-6 w-6 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
              {unreadCount > 0 && (
                <>
                  {/* 外圈脉冲动画 */}
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 z-0 pointer-events-none">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                  </span>
                  {/* 红色圆点提示 */}
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full z-10 border-2 border-white shadow-lg">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </>
              )}
            </Link>

            {/* 消息按钮 */}
            {/* <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
              <MailIcon className="h-6 w-6" />
            </button> */}

            {/* 用户信息 */}
            <div className="flex items-center space-x-3">
              <Link to={`/profile/${user?.username}`}>
                <img
                  className="h-8 w-8 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  src={user?.avatar || getDefaultAvatar(user?.username)}
                  alt={user?.username}
                />
              </Link>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user?.username || '用户'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
