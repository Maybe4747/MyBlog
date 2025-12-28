// types/index.ts
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
  likeCount?: number;
  commentCount?: number;
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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface UpdateProfileData {
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
}

export interface Suggestion {
  value: string;
  label: string;
  type: string;
}