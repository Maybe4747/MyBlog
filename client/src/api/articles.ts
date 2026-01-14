import api from './client';

export interface CreateArticleData {
  title: string;
  summary?: string;
  content: string;
  visibility?: 'public' | 'followers' | 'private';
}

export interface Article {
  id: number;
  user_id: number;
  title: string;
  summary: string | null;
  content: string;
  visibility: 'public' | 'followers' | 'private';
  read_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  username: string;
  avatar: string | null;
  email: string;
  liked?: boolean;
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * 创建文章
 */
export const createArticle = async (articleData: CreateArticleData) => {
  return api.post('/articles', articleData);
};

/**
 * 获取文章列表
 */
export const getArticles = async (params?: {
  userId?: number;
  page?: number;
  limit?: number;
  visibility?: 'public' | 'followers' | 'private';
  search?: string;
}) => {
  return api.get<{ code: number; data: ArticlesResponse }>('/articles', { params });
};

/**
 * 获取单个文章
 */
export const getArticleById = async (articleId: number) => {
  return api.get<{ code: number; data: { article: Article } }>(`/articles/${articleId}`);
};

/**
 * 更新文章
 */
export const updateArticle = async (articleId: number, articleData: Partial<CreateArticleData>) => {
  return api.put(`/articles/${articleId}`, articleData);
};

/**
 * 删除文章
 */
export const deleteArticle = async (articleId: number) => {
  return api.delete(`/articles/${articleId}`);
};

/**
 * 点赞/取消点赞文章
 */
export const toggleArticleLike = async (articleId: number) => {
  return api.post<{ code: number; data: { liked: boolean; likeCount: number } }>(`/articles/${articleId}/like`);
};

export interface Comment {
  id: number;
  article_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  username: string;
  avatar: string | null;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * 添加文章评论
 */
export const addArticleComment = async (articleId: number, content: string) => {
  return api.post<{ code: number; data: { comment: Comment } }>(`/articles/${articleId}/comments`, { content });
};

/**
 * 获取文章评论列表
 */
export const getArticleComments = async (articleId: number, params?: { page?: number; limit?: number }) => {
  return api.get<{ code: number; data: CommentsResponse }>(`/articles/${articleId}/comments`, { params });
};

/**
 * 删除文章评论
 */
export const deleteArticleComment = async (articleId: number, commentId: number) => {
  return api.delete<{ code: number; data: null }>(`/articles/${articleId}/comments/${commentId}`);
};

