// api/types.ts
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  position?: string;
  company?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  stats?: {
    followers?: number;
    following?: number;
    files?: number;
  };
}

export interface UserProfile {
  userId: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  position?: string;
  totalFiles?: number;
  totalDownloads?: number;
  followerCount?: number;
}

export interface File {
  id: number;
  userId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  title: string;
  description?: string;
  visibility: 'public' | 'followers' | 'private';
  downloadCount: number;
  uploadedAt: string;
  tags: string[];
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  fromUserId: number;
  relatedType: string;
  relatedId: number;
  isRead: number;
  readAt?: string;
  createdAt: string;
}

export interface Message {
  id: number;
  userId: number;
  profileUserId: number;
  username: string;
  avatar?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  msg: string;
}

export interface UpdateProfileData {
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
}

export interface Post {
  id: number;
  author: {
    name: string;
    title: string;
    company: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  title?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  contentType?: 'image' | 'article' | 'file';
  mediaUrl?: string;
  readTime?: string;
}