import api from './client';

export interface CreatePostData {
  content?: string;
  image?: File;
  video?: File;
  visibility?: 'public' | 'followers' | 'private';
}

export interface Post {
  id: number;
  user_id: number;
  content: string | null;
  image_url: string | null;
  visibility: 'public' | 'followers' | 'private';
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  username: string;
  avatar: string | null;
  email: string;
  liked?: boolean;
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * 创建帖子
 */
export const createPost = async (postData: CreatePostData) => {
  const formData = new FormData();
  
  if (postData.content) {
    formData.append('content', postData.content);
  }
  
  if (postData.image) {
    formData.append('image', postData.image);
  }
  
  if (postData.video) {
    formData.append('image', postData.video); // 后端使用同一个字段名'image'来接收文件
  }
  
  formData.append('visibility', postData.visibility || 'public');

  return api.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 获取帖子列表
 */
export const getPosts = async (params?: {
  userId?: number;
  page?: number;
  limit?: number;
  visibility?: 'public' | 'followers' | 'private';
}) => {
  return api.get<{ code: number; data: PostsResponse }>('/posts', { params });
};

/**
 * 获取单个帖子
 */
export const getPostById = async (postId: number) => {
  return api.get<{ code: number; data: { post: Post } }>(`/posts/${postId}`);
};

/**
 * 更新帖子
 */
export const updatePost = async (postId: number, postData: Partial<CreatePostData>) => {
  const formData = new FormData();
  
  if (postData.content !== undefined) {
    formData.append('content', postData.content || '');
  }
  
  if (postData.image) {
    formData.append('image', postData.image);
  }
  
  if (postData.visibility !== undefined) {
    formData.append('visibility', postData.visibility);
  }

  return api.put(`/posts/${postId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 删除帖子
 */
export const deletePost = async (postId: number) => {
  return api.delete(`/posts/${postId}`);
};

/**
 * 点赞/取消点赞帖子
 */
export const togglePostLike = async (postId: number) => {
  return api.post<{ code: number; data: { liked: boolean } }>(`/posts/${postId}/like`);
};

