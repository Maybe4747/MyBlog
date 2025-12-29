import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getArticleById, toggleArticleLike, Article } from '../../api/articles';
import Navbar from '../../components/Navbar';
import { HeartIcon, MessageCircleIcon, ShareIcon, CalendarIcon, UserIcon, ArrowLeftIcon } from 'lucide-react';

const ArticleDetail = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) {
        setError('文章ID无效');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result: any = await getArticleById(parseInt(articleId));
        
        if (result?.code === 0 && result?.data?.article) {
          setArticle(result.data.article);
        } else {
          setError(result?.msg || '获取文章失败');
        }
      } catch (err: any) {
        console.error('获取文章详情失败:', err);
        setError(err.message || '获取文章失败');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  const handleLike = async () => {
    if (!article || !articleId) return;

    try {
      const result: any = await toggleArticleLike(parseInt(articleId));
      if (result?.code === 0) {
        const newLiked = result.data?.liked ?? !article.liked;
        setArticle({
          ...article,
          liked: newLiked,
          like_count: newLiked ? (article.like_count || 0) + 1 : Math.max(0, (article.like_count || 0) - 1)
        });
      }
    } catch (err: any) {
      console.error('点赞失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || '文章不存在'}</p>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          返回首页
        </button>

        {/* 文章内容 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* 文章头部 */}
          <div className="bg-white border-b border-gray-200 p-8">
            <div className="flex items-center mb-4">
              <img
                className="h-16 w-16 rounded-full ring-2 ring-gray-200"
                src={article.avatar || `https://ui-avatars.com/api/?name=${article.username}&background=random`}
                alt={article.username}
              />
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">{article.username}</h3>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {new Date(article.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
            
            {article.summary && (
              <p className="text-lg text-gray-600 mb-4">{article.summary}</p>
            )}

            {/* 只显示阅读数，点赞和评论在操作栏显示 */}
            <div className="flex items-center text-sm text-gray-600">
              <div className="flex items-center">
                <UserIcon className="w-4 h-4 mr-1" />
                <span>{article.read_count || 0} 阅读</span>
              </div>
            </div>
          </div>

          {/* 文章正文 */}
          <div className="p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}
            />
          </div>

          {/* 文章操作栏 */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all ${
                    article.liked
                      ? 'text-red-600 bg-red-50 hover:bg-red-100'
                      : 'text-gray-600 bg-white hover:bg-gray-50'
                  } border border-gray-200`}
                >
                  <HeartIcon className={`w-5 h-5 ${article.liked ? 'fill-current' : ''}`} />
                  <span className="font-medium">点赞 ({article.like_count || 0})</span>
                </button>
                
                <button className="flex items-center space-x-2 px-6 py-3 rounded-xl text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 transition-all">
                  <MessageCircleIcon className="w-5 h-5" />
                  <span className="font-medium">评论 ({article.comment_count || 0})</span>
                </button>
                
                <button className="flex items-center space-x-2 px-6 py-3 rounded-xl text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 transition-all">
                  <ShareIcon className="w-5 h-5" />
                  <span className="font-medium">分享</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;

