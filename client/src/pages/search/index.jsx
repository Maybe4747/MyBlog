import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import { searchUsers, searchFiles } from '../../api/search';
import FileCard from '../../components/FileCard';
import Navbar from '../../components/Navbar';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const [usersResult, filesResult] = await Promise.all([
        searchUsers(query),
        searchFiles(query)
      ]);

      setUsers(usersResult.users || []);
      setFiles(filesResult.files || []);
    } catch (err) {
      console.error('搜索失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'users', label: 'Users' },
    { key: 'files', label: 'Files' }
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl mb-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Search Results
              </h1>
              <p className="text-white/80 text-lg">
                for "{query}"
              </p>
              <p className="text-white/70 mt-2">
                Found {users.length + files.length} results
              </p>
            </div>

            {/* 标签页 */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-white/70 mt-4">Searching...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 用户结果 */}
              {(activeTab === 'all' || activeTab === 'users') && users.length > 0 && (
                <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-6">Users</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {users.map((user) => (
                      <Link
                        key={user.userId}
                        to={`/profile/${user.username}`}
                        className="group backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div className="flex items-center space-x-4">
                          {user.avatar ? (
                            <img src={user.avatar} alt="头像" className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-xl" />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white/20 shadow-xl">
                              <span className="text-2xl text-white font-bold">{user.username[0].toUpperCase()}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-white text-xl font-semibold group-hover:text-purple-300 transition-colors">{user.username}</h3>
                            {user.bio && (
                              <p className="text-white/70 text-sm mt-1 line-clamp-2">{user.bio}</p>
                            )}
                            {user.skills && user.skills.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {user.skills.slice(0, 3).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white/80 rounded-lg text-xs border border-white/10"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {user.skills.length > 3 && (
                                  <span className="px-3 py-1 bg-white/10 text-white/60 rounded-lg text-xs border border-white/10">
                                    +{user.skills.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <svg className="w-6 h-6 text-white/40 group-hover:text-white/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 文件结果 */}
              {(activeTab === 'all' || activeTab === 'files') && files.length > 0 && (
                <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-6">Files</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {files.map((file) => (
                      <FileCard key={file._id} file={file} />
                    ))}
                  </div>
                </div>
              )}

              {/* 空状态 */}
              {users.length === 0 && files.length === 0 && (
                <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-16 text-center shadow-2xl">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                    <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white/90 mb-2">No results found</h3>
                  <p className="text-white/70 mb-6">
                    Try using different keywords
                  </p>
                  <Link
                    to="/home"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transform hover:scale-105 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Back to Home
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Search;
