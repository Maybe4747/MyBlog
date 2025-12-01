import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { getSearchSuggestions } from '../api/search';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSuggestions([]);
      setSearchQuery('');
    }
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      try {
        const result = await getSearchSuggestions(query);
        setSuggestions(result.suggestions?.users || []);
      } catch (err) {
        console.error('获取搜索建议失败:', err);
      }
    } else {
      setSuggestions([]);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/home" className="flex items-center group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                ProfileHub
              </span>
            </Link>
          </div>

          {/* 搜索框 */}
          <div className="flex-1 flex items-center justify-center px-6">
            <form onSubmit={handleSearch} className="relative w-full max-w-lg">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-white/40 group-focus-within:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search users or files..."
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              {/* 搜索建议下拉框 */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-slate-900/90 border border-white/20 rounded-2xl shadow-2xl z-20 overflow-hidden">
                  {suggestions.map((suggestion, index) => (
                    <Link
                      key={index}
                      to={`/profile/${suggestion.value}`}
                      className="flex items-center px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
                      onClick={() => {
                        setSuggestions([]);
                        setSearchQuery('');
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">{suggestion.value[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{suggestion.value}</p>
                        <p className="text-white/60 text-xs">User</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* 用户菜单 */}
          <div className="flex items-center space-x-4">
            <Link
              to="/notifications"
              className="relative p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* 未读通知数量徽章 */}
              <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse">
                3
              </span>
            </Link>

            <Link
              to="/upload"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transform hover:scale-105 transition-all duration-200"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload
              </span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 p-2 hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="头像" className="w-10 h-10 rounded-xl border-2 border-white/20 shadow-lg" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white/20 shadow-lg">
                    <span className="text-white font-bold text-lg">{user?.username?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-white font-semibold">{user?.username}</p>
                  <p className="text-white/60 text-xs">Online</p>
                </div>
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 下拉菜单 */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-slate-900/95 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <Link
                    to={`/profile/${user?.username}`}
                    className="flex items-center px-5 py-4 text-white hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => setShowDropdown(false)}
                  >
                    <svg className="w-5 h-5 mr-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="font-semibold">Profile</p>
                      <p className="text-xs text-white/60">View your profile</p>
                    </div>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-5 py-4 text-white hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => setShowDropdown(false)}
                  >
                    <svg className="w-5 h-5 mr-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold">Settings</p>
                      <p className="text-xs text-white/60">Configure your account</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-5 py-4 text-white hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <div className="text-left">
                      <p className="font-semibold">Logout</p>
                      <p className="text-xs text-white/60">Sign out of your account</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
