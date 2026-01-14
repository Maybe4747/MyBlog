import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPostById, togglePostLike, addPostComment, getPostComments, deletePostComment, Post, Comment as PostComment } from '../../api/posts';
import Navbar from '../../components/Navbar';
import { getDefaultAvatar } from '../../utils/commonUtils';
import { HeartIcon, MessageCircleIcon, ShareIcon, CalendarIcon, ArrowLeftIcon, ImageIcon, VideoIcon } from 'lucide-react';
import CommentSection from '../../components/CommentSection';
import { shareContent } from '../../utils/shareUtils';

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<boolean>(true); // 默认展开评论
  const [postComments, setPostComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError('帖子ID无效');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result: any = await getPostById(parseInt(postId));
        
        if (result?.code === 0 && result?.data?.post) {
          const postData = result.data.post;
          // 判断内容类型：通过检查 image_url 的扩展名来判断是否是视频
          let contentType: 'image' | 'video' | 'text' = 'text';
          let mediaUrl: string | null = null;
          
          if (postData.image_url) {
            // 检查是否是视频文件（通过扩展名判断）
            if (postData.image_url.match(/\.(mp4|webm|mov|mpeg|avi|mkv|flv|wmv)$/i)) {
              contentType = 'video';
            } else {
              contentType = 'image';
            }
            mediaUrl = postData.image_url;
          } else if (postData.video_url) {
            contentType = 'video';
            mediaUrl = postData.video_url;
          }
          
          // 格式化帖子数据
          setPost({
            ...postData,
            author: {
              name: postData.username,
              avatar: postData.avatar,
              title: '',
              company: ''
            },
            likes: postData.likeCount || 0,
            comments: postData.commentCount || 0,
            liked: postData.liked || false,
            contentType,
            mediaUrl
          });
          
          // 自动加载评论
          try {
            setLoadingComments(true);
            const commentsResult: any = await getPostComments(parseInt(postId));
            if (commentsResult?.code === 0 && commentsResult?.data?.comments) {
              const formattedComments = (commentsResult.data.comments || []).map((comment: any) => ({
                id: comment.id,
                user_id: comment.user_id,
                content: comment.content,
                created_at: comment.created_at,
                username: comment.username,
                avatar: comment.avatar
              }));
              setPostComments(formattedComments);
              setExpandedComments(true);
            }
          } catch (err: any) {
            console.error('获取评论失败:', err);
          } finally {
            setLoadingComments(false);
          }
        } else {
          setError(result?.msg || '获取帖子失败');
        }
      } catch (err: any) {
        console.error('获取帖子详情失败:', err);
        setError(err.message || '获取帖子失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleLike = async () => {
    if (!post || !postId) return;

    try {
      const result: any = await togglePostLike(parseInt(postId));
      if (result?.code === 0 && result?.data) {
        setPost({
          ...post,
          liked: result.data.liked,
          likes: result.data.likeCount || post.likes
        });
      }
    } catch (err: any) {
      console.error('点赞失败:', err);
    }
  };

  const handleToggleComments = async () => {
    if (expandedComments) {
      setExpandedComments(false);
      return;
    }

    if (!postId) return;

    try {
      setLoadingComments(true);
      const result: any = await getPostComments(parseInt(postId));
      if (result?.code === 0 && result?.data?.comments) {
        // 将评论数据格式化为 CommentSection 期望的格式
        const formattedComments = (result.data.comments || []).map((comment: any) => ({
          id: comment.id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          username: comment.username,
          avatar: comment.avatar
        }));
        setPostComments(formattedComments);
        setExpandedComments(true);
      }
    } catch (err: any) {
      console.error('获取评论失败:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (content: string) => {
    if (!postId) return;

    try {
      const result: any = await addPostComment(parseInt(postId), content);
      if (result?.code === 0 && result?.data?.comment) {
        setPostComments((prev: PostComment[]) => [...prev, result.data.comment]);
        setPost((prev: any) => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : null);
      }
    } catch (err: any) {
      console.error('添加评论失败:', err);
      throw err;
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!postId) return;

    try {
      const result: any = await deletePostComment(parseInt(postId), commentId);
      if (result?.code === 0) {
        setPostComments((prev: PostComment[]) => prev.filter(c => c.id !== commentId));
        setPost((prev: any) => prev ? { ...prev, comments: Math.max(0, (prev.comments || 0) - 1) } : null);
      }
    } catch (err: any) {
      console.error('删除评论失败:', err);
    }
  };

  const handleShare = () => {
    if (post) {
      const shareUrl = `${window.location.origin}/posts/${postId}`;
      shareContent({
        title: post.content || '查看这个帖子',
        text: post.content || '',
        url: shareUrl
      });
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

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || '帖子不存在'}</p>
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
          onClick={() => {
            // 尝试使用浏览器后退，如果历史记录中有上一页
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              // 如果没有历史记录，直接导航到首页
              navigate('/home');
            }
          }}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          返回首页
        </button>

        {/* 帖子内容 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 帖子头部 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link to={`/profile/${post.author.name}`}>
                  <img
                    className="h-12 w-12 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                    src={post.author.avatar || getDefaultAvatar(post.author.name)}
                    alt={post.author.name}
                  />
                </Link>
                <div className="ml-4">
                  <Link to={`/profile/${post.author.name}`}>
                    <h4 className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                      {post.author.name}
                    </h4>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {new Date(post.created_at || post.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 帖子内容 */}
          <div className="p-6">
            {post.content && (
              <p className="text-gray-800 text-lg leading-relaxed mb-4">{post.content}</p>
            )}

            {/* 图片 */}
            {post.contentType === 'image' && post.mediaUrl && (
              <div className="mt-4 rounded-lg overflow-hidden">
                <img
                  src={post.mediaUrl}
                  alt="Post"
                  className="w-full h-auto max-h-[600px] object-contain"
                />
              </div>
            )}

            {/* 视频 */}
            {post.contentType === 'video' && post.mediaUrl && (
              <div className="mt-4 rounded-lg overflow-hidden">
                <video
                  src={post.mediaUrl}
                  controls
                  className="w-full h-auto max-h-[600px]"
                />
              </div>
            )}
          </div>

          {/* 帖子操作 */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    post.liked 
                      ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <HeartIcon className={`h-5 w-5 ${post.liked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{post.likes || 0}</span>
                </button>
                <button
                  onClick={handleToggleComments}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <MessageCircleIcon className="h-5 w-5" />
                  <span className="font-medium">{post.comments || 0}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors"
                >
                  <ShareIcon className="h-5 w-5" />
                  <span className="font-medium">分享</span>
                </button>
              </div>
            </div>
          </div>

          {/* 评论区域 */}
          {expandedComments && (
            <div className="px-6 py-4 border-t border-gray-200">
              <CommentSection
                comments={postComments}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                currentUserId={user?.id}
                loading={loadingComments}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;

