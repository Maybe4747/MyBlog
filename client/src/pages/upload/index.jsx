import { useState } from 'react';
import FileUpload from '../../components/FileUpload';
import { useNavigate } from 'react-router';
import Navbar from '../../components/Navbar';

const Upload = () => {
  const navigate = useNavigate();
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    setTimeout(() => {
      navigate('/home');
    }, 2000);
  };

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
          {uploadSuccess && (
            <div className="mb-8 backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-6 shadow-2xl">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white text-lg font-semibold">File uploaded successfully!</p>
                  <p className="text-white/70">Redirecting to homepage in 2 seconds...</p>
                </div>
              </div>
            </div>
          )}
          <FileUpload onSuccess={handleUploadSuccess} />
        </div>
      </div>
    </div>
    </>
  );
};

export default Upload;
