import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

let io;

/**
 * 初始化Socket.IO
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // 身份验证中间件
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('未提供访问令牌'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ userId: decoded.userId });

      if (!user) {
        return next(new Error('用户不存在'));
      }

      socket.userId = decoded.userId;
      socket.username = user.username;
      next();

    } catch (error) {
      next(new Error('认证失败'));
    }
  });

  // 连接事件
  io.on('connection', (socket) => {
    console.log(`用户 ${socket.username} (${socket.userId}) 已连接`);

    // 加入用户专属房间
    socket.join(`user:${socket.userId}`);

    // 监听客户端消息
    socket.on('message', async (data) => {
      console.log('收到消息:', data);

      // TODO: 处理实时消息
      // 例如：私聊、群聊等
    });

    // 监听点赞事件
    socket.on('like', async (data) => {
      try {
        const { targetUserId, targetType, targetId } = data;

        // 创建通知
        const notification = await Notification.create({
          userId: targetUserId,
          type: 'like',
          title: '新的点赞',
          content: `${socket.username} 点赞了您的${getTypeName(targetType)}`,
          fromUserId: socket.userId,
          fromUsername: socket.username,
          relatedType: targetType,
          relatedId: targetId
        });

        // 发送给目标用户
        io.to(`user:${targetUserId}`).emit('notification', {
          notification
        });

      } catch (error) {
        console.error('点赞事件处理错误:', error);
      }
    });

    // 监听关注事件
    socket.on('follow', async (data) => {
      try {
        const { targetUserId } = data;

        const [users] = await getMySQLPool().execute(
          'SELECT username FROM users WHERE id = ?',
          [targetUserId]
        );

        if (users.length === 0) return;

        // 创建通知
        const notification = await Notification.create({
          userId: targetUserId,
          type: 'follow',
          title: '新的关注者',
          content: `${socket.username} 关注了您`,
          fromUserId: socket.userId,
          fromUsername: socket.username
        });

        // 发送给目标用户
        io.to(`user:${targetUserId}`).emit('notification', {
          notification
        });

      } catch (error) {
        console.error('关注事件处理错误:', error);
      }
    });

    // 监听评论事件
    socket.on('comment', async (data) => {
      try {
        const { targetUserId, targetType, targetId, content } = data;

        // 创建通知
        const notification = await Notification.create({
          userId: targetUserId,
          type: 'comment',
          title: '新的评论',
          content: `${socket.username} 评论了您的${getTypeName(targetType)}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          fromUserId: socket.userId,
          fromUsername: socket.username,
          relatedType: targetType,
          relatedId: targetId
        });

        // 发送给目标用户
        io.to(`user:${targetUserId}`).emit('notification', {
          notification
        });

      } catch (error) {
        console.error('评论事件处理错误:', error);
      }
    });

    // 监听@提及事件
    socket.on('mention', async (data) => {
      try {
        const { mentionedUserId, targetType, targetId, content } = data;

        // 创建通知
        const notification = await Notification.create({
          userId: mentionedUserId,
          type: 'mention',
          title: '新的@提及',
          content: `${socket.username} 在${getTypeName(targetType)中提到了您: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          fromUserId: socket.userId,
          fromUsername: socket.username,
          relatedType: targetType,
          relatedId: targetId
        });

        // 发送给被提及用户
        io.to(`user:${mentionedUserId}`).emit('notification', {
          notification
        });

      } catch (error) {
        console.error('@提及事件处理错误:', error);
      }
    });

    // 断开连接事件
    socket.on('disconnect', (reason) => {
      console.log(`用户 ${socket.username} (${socket.userId}) 已断开连接: ${reason}`);
    });

    // 错误处理
    socket.on('error', (error) => {
      console.error('Socket错误:', error);
    });
  });

  return io;
};

/**
 * 发送通知给指定用户
 */
export const sendNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', { notification });
  }
};

/**
 * 发送消息给指定用户
 */
export const sendMessage = (userId, message) => {
  if (io) {
    io.to(`user:${userId}`).emit('message', message);
  }
};

/**
 * 获取类型名称
 */
const getTypeName = (type) => {
  const typeMap = {
    file: '文件',
    comment: '评论',
    post: '动态'
  };
  return typeMap[type] || '内容';
};

import { getMySQLPool } from '../config/database.js';
