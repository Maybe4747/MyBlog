import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getMyProfile } from '../../api/profiles';
import { getUserFiles } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import FileCard from '../../components/FileCard';
import Navbar from '../../components/Navbar';

const Home = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    files: 0,
    views: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user || !user.username) {
      setLoading(false);
      return;
    }
    try {
      const [profileData, filesData] = await Promise.all([
        getMyProfile(),
        getUserFiles(user.username)
      ]);

      setProfile(profileData.profile);
      setFiles(filesData.files || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-white/70 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        {/* Hero Section */}
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-32 h-32 rounded-2xl border-4 border-white/20 shadow-2xl"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-4 border-white/20 shadow-2xl">
                      <span className="text-5xl text-white font-bold">
                        {user?.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                    Welcome Back
                  </h1>
                  <h2 className="text-2xl md:text-3xl text-white/90 font-semibold mb-2">
                    {user?.username}
                  </h2>
                  <p className="text-white/70 text-lg mb-6">
                    Ready to share your next great idea?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/upload"
                      className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transform hover:scale-105 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload New File
                    </Link>
                    {user?.username && (
                      <Link
                        to={`/profile/${user.username}`}
                        className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: 'Followers',
                value: stats.followers,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                gradient: 'from-blue-500 to-purple-500'
              },
              {
                label: 'Following',
                value: stats.following,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                label: 'Files',
                value: files.length,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                gradient: 'from-pink-500 to-rose-500'
              },
              {
                label: 'Total Views',
                value: stats.views,
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
                gradient: 'from-cyan-500 to-blue-500'
              }
            ].map((stat, index) => (
              <div
                key={index}
                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 shadow-2xl hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
                <p className="text-white/70 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Files Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Your Recent Files
            </h2>
            {user?.username && (
              <Link
                to={`/profile/${user.username}`}
                className="text-purple-400 hover:text-purple-300 font-medium flex items-center transition-colors"
              >
                View All
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {files.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-12 text-center shadow-2xl">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white/90 mb-2">No files yet</h3>
              <p className="text-white/70 mb-6">Start sharing your work with the world</p>
              <Link
                to="/upload"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transform hover:scale-105 transition-all duration-200"
              >
                Upload Your First File
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.slice(0, 6).map((file) => (
                <FileCard key={file._id} file={file} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Home;
