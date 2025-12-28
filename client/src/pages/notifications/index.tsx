import React, { useState, useEffect } from 'react';
import { BellIcon, CheckIcon, TrashIcon, MailIcon, HeartIcon, MessageCircleIcon, UserPlusIcon } from 'lucide-react';
import { getNotifications, markNotificationsAsRead, deleteNotification, getUnreadCount } from '../../api/notifications';
import { useAuth } from '../../contexts/AuthContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [showUnreadOnly]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications({
        page: 1,
        limit: 20,
        unreadOnly: showUnreadOnly
      });
      setNotifications(response.data.notifications || []);
    } catch (err) {
      setError(err.message || '获取通知失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.data.count || 0);
    } catch (err) {
      console.error('获取未读通知数量失败:', err);
    }
  };

  const handleMarkAsRead = async (notificationIds = []) => {
    try {
      if (notificationIds.length > 0) {
        await markNotificationsAsRead(notificationIds);
      } else {
        // 标记所有为已读
        await markNotificationsAsRead([], true);
      }
      
      // 更新本地状态
      if (notificationIds.length > 0) {
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id) 
              ? { ...notification, isRead: 1 } 
              : notification
          )
        );
      } else {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: 1 }))
        );
      }
      
      // 更新未读数量
      fetchUnreadCount();
    } catch (err) {
      setError(err.message || '标记已读失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      if (notifications.find(n => n.id === id && !n.isRead)) {
        fetchUnreadCount(); // 如果删除的是未读通知，更新未读数量
      }
    } catch (err) {
      setError(err.message || '删除通知失败');
    }
  };

  const handleSelectAll = () => {
    const allIds = notifications.map(n => n.id);
    setSelectedNotifications(
      selectedNotifications.length === allIds.length ? [] : allIds
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <HeartIcon className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'follow':
        return <UserPlusIcon className="h-5 w-5 text-green-500" />;
      case 'message':
        return <MailIcon className="h-5 w-5 text-indigo-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationText = (notification) => {
    const { type, title, content, fromUser } = notification;
    const fromUsername = fromUser?.username || '某用户';
    
    switch (type) {
      case 'like':
        return `${fromUsername} 点赞了您的文件`;
      case 'comment':
        return `${fromUsername} 评论了您的文件: "${content}"`;
      case 'follow':
        return `${fromUsername} 开始关注您`;
      case 'message':
        return `${fromUsername} 给您发送了消息`;
      default:
        return content || title;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center">
              <BellIcon className="h-6 w-6 text-gray-600 mr-2" />
              <h1 className="text-2xl font-semibold text-gray-900">通知</h1>
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {unreadCount} 条未读
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">仅显示未读</span>
              </label>
              <button
                onClick={() => handleMarkAsRead()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                全部标记为已读
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无通知</h3>
                <p className="text-gray-500">您目前没有任何通知</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {selectedNotifications.length > 0 
                        ? `${selectedNotifications.length} 项已选` 
                        : '选择通知'}
                    </span>
                  </div>
                  {selectedNotifications.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMarkAsRead(selectedNotifications)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        标记为已读
                      </button>
                      <button
                        onClick={() => {
                          selectedNotifications.forEach(id => handleDelete(id));
                          setSelectedNotifications([]);
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>

                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${!notification.isRead ? 'text-blue-700 font-semibold' : 'text-gray-900'}`}>
                              {getNotificationText(notification)}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {new Date(notification.createdAt).toLocaleString()}
                              </span>
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead([notification.id])}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;