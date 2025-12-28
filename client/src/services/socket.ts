import { io } from 'socket.io-client';

let socket = null;

/**
 * 初始化Socket连接
 */
export const initSocket = (token) => {
  if (socket) {
    return socket;
  }

  socket = io('http://localhost:3001', {
    auth: {
      token
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Socket连接成功');
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket连接断开:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket错误:', error);
  });

  return socket;
};

/**
 * 获取Socket实例
 */
export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket未初始化，请先调用initSocket');
  }
  return socket;
};

/**
 * 关闭Socket连接
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * 发送点赞事件
 */
export const emitLike = (data) => {
  const socketInstance = getSocket();
  socketInstance.emit('like', data);
};

/**
 * 发送关注事件
 */
export const emitFollow = (data) => {
  const socketInstance = getSocket();
  socketInstance.emit('follow', data);
};

/**
 * 发送评论事件
 */
export const emitComment = (data) => {
  const socketInstance = getSocket();
  socketInstance.emit('comment', data);
};

/**
 * 发送@提及事件
 */
export const emitMention = (data) => {
  const socketInstance = getSocket();
  socketInstance.emit('mention', data);
};

/**
 * 发送消息
 */
export const emitMessage = (data) => {
  const socketInstance = getSocket();
  socketInstance.emit('message', data);
};

/**
 * 监听通知事件
 */
export const onNotification = (callback) => {
  const socketInstance = getSocket();
  socketInstance.on('notification', callback);

  // 返回取消监听函数
  return () => {
    socketInstance.off('notification', callback);
  };
};

/**
 * 监听消息事件
 */
export const onMessage = (callback) => {
  const socketInstance = getSocket();
  socketInstance.on('message', callback);

  return () => {
    socketInstance.off('message', callback);
  };
};
