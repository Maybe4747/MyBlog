import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { getUserProfile, getUserFiles } from '../../api/users';
import { getMyProfile } from '../../api/profiles';
import { useAuth } from '../../contexts/AuthContext';
import FileCard from '../../components/FileCard';
import Navbar from '../../components/Navbar';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const isOwnProfile = currentUser?.username === username;

      if (isOwnProfile) {
        const profileData = await getMyProfile();
        setProfile(profileData.profile);
      } else {
        const profileData = await getUserProfile(username);
        setProfile(profileData);
      }

      const filesData = await getUserFiles(username);
      setFiles(filesData.files || []);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(file => {
    if (filter === 'all') return true;
    return file.category === filter;
  });

  const categories = [
    { key: 'all', label: 'All Files' },
    { key: 'document', label: 'Documents' },
    { key: 'image', label: 'Images' },
    { key: 'video', label: 'Videos' },
    { key: 'audio', label: 'Audio' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-white/70 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;

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
          {/* Profile Header */}
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl mb-8">
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="relative">
                {profile?.user?.avatar ? (
                  <img
                    src={profile.user.avatar}
                    alt="Avatar"
                    className="w-48 h-48 rounded-3xl border-4 border-white/20 shadow-2xl"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-4 border-white/20 shadow-2xl">
                    <span className="text-7xl text-white font-bold">
                      {profile?.user?.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                {isOwnProfile && (
                  <button className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transition-all duration-200">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                      {profile?.user?.username}
                    </h1>
                    {profile?.user?.bio && (
                      <p className="text-white/80 text-lg">{profile.user.bio}</p>
                    )}
                  </div>
                  {isOwnProfile ? (
                    <button className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-200">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Follow
                      </button>
                      <button className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{profile?.stats?.files || 0}</p>
                    <p className="text-white/70">Files</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{profile?.stats?.followers || 0}</p>
                    <p className="text-white/70">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{profile?.stats?.views || 0}</p>
                    <p className="text-white/70">Views</p>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4">
                  {profile?.user?.location && (
                    <div className="flex items-center text-white/70">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.user.location}
                    </div>
                  )}
                  {profile?.user?.website && (
                    <a
                      href={profile.user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            {profile?.user?.skills && profile.user.skills.length > 0 && (
              <div className="mt-8">
                <h3 className="text-white/90 font-semibold mb-3">Skills</h3>
                <div className="flex flex-wrap gap-3">
                  {profile.user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white rounded-xl border border-white/10 backdrop-blur-sm hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Files Section */}
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {isOwnProfile ? 'Your Files' : `${profile?.user?.username}'s Files`}
              </h2>
            </div>

            {/* Category Filters */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setFilter(category.key)}
                  className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all duration-200 ${
                    filter === category.key
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Files Grid */}
            {filteredFiles.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                  <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-white/70 text-lg">No files found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFiles.map((file) => (
                  <FileCard key={file._id} file={file} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Profile;
