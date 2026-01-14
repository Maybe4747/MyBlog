import React from 'react';
import {
  HeartIcon,
  MessageCircleIcon,
  UserPlusIcon,
  MailIcon,
  BellIcon,
  UserIcon,
} from 'lucide-react';

interface Activity {
  id: number;
  type: 'like' | 'comment' | 'follow' | 'message' | 'system' | string;
  from_username?: string;
  fromUsername?: string;
  related_type?: 'file' | 'post' | 'article' | string;
  content?: string;
  title?: string;
  created_at?: string;
  createdAt?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <HeartIcon className="h-5 w-5 text-red-600" />;
      case 'comment':
        return <MessageCircleIcon className="h-5 w-5 text-blue-600" />;
      case 'follow':
        return <UserPlusIcon className="h-5 w-5 text-green-600" />;
      case 'message':
        return <MailIcon className="h-5 w-5 text-indigo-600" />;
      case 'system':
        return <BellIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <UserIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'bg-red-100';
      case 'comment':
        return 'bg-blue-100';
      case 'follow':
        return 'bg-green-100';
      case 'message':
        return 'bg-indigo-100';
      case 'system':
        return 'bg-purple-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getActivityText = (activity: Activity) => {
    const fromUsername = activity.from_username || activity.fromUsername || '某用户';
    switch (activity.type) {
      case 'like':
        return (
          <>
            <span className="font-semibold">{fromUsername}</span> 点赞了你的
            {activity.related_type === 'file' ? '文件' : 
             activity.related_type === 'post' ? '帖子' : 
             activity.related_type === 'article' ? '文章' : '内容'}
          </>
        );
      case 'comment':
        return (
          <>
            <span className="font-semibold">{fromUsername}</span> 评论了你的
            {activity.related_type === 'file' ? '文件' : 
             activity.related_type === 'post' ? '帖子' : 
             activity.related_type === 'article' ? '文章' : '内容'}
          </>
        );
      case 'follow':
        return (
          <>
            <span className="font-semibold">{fromUsername}</span> 开始关注你
          </>
        );
      case 'message':
        return (
          <>
            <span className="font-semibold">{fromUsername}</span> 给你发送了消息
          </>
        );
      default:
        return activity.content || activity.title || '新的活动';
    }
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '刚刚';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}分钟前`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}小时前`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}天前`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}个月前`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years}年前`;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">暂无近期活动</p>
      </div>
    );
  }

  return (
    <>
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start">
          <div className="flex-shrink-0">
            <div className={`h-10 w-10 rounded-full ${getActivityBgColor(activity.type)} flex items-center justify-center`}>
              {getActivityIcon(activity.type)}
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-gray-900">
              {getActivityText(activity)}
            </p>
            <p className="text-xs text-gray-500">
              {formatTimeAgo(activity.created_at || activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </>
  );
};

export default RecentActivity;

