import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 必须在最顶部配置dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// 现在导入其他模块
import express from 'express';
import { createServer } from 'http';
import app from './app.js';
import {
  initMySQL,
  closeConnections
} from './config/database.js';
import { initSocket } from './socket/handler.js';
import { initSearchEngine } from './utils/search.js';

const PORT = process.env.PORT || 3001;

const server = createServer(app);

// 初始化所有服务
const initialize = async () => {
  try {
    console.log('\n🚀 启动服务器...\n');

    // 初始化数据库
    console.log('📦 初始化数据库...');
    console.log('  → 正在连接MySQL...');
    await initMySQL();
    console.log('  → MySQL连接完成');
    // 初始化搜索引擎
    console.log('🔍 初始化搜索引擎...');
    try {
      const searchReady = await initSearchEngine();
      console.log('  → 搜索引擎初始化完成');
    } catch (err) {
      console.log('⚠️  搜索服务初始化跳过:', err.message);
    }

    // 初始化Socket.IO
    console.log('⚡ 初始化WebSocket...');
    try {
      initSocket(server);
      console.log('  → WebSocket初始化完成');
    } catch (err) {
      console.log('⚠️  WebSocket初始化跳过:', err.message);
    }

    console.log('\n✅ 所有服务初始化完成\n');

    // 启动HTTP服务器
    server.listen(PORT, () => {
      console.log(`\n🎉 服务器运行在 http://localhost:${PORT}`);
      console.log(`📝 API文档: http://localhost:${PORT}/api`);
      console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
      console.log('\n─────────────────────────\n');
    });

  } catch (error) {
    console.error('\n❌ 服务器启动失败:', error.message);
    console.log('\n请检查以下服务是否正常运行:');
    console.log('1. MySQL数据库\n');
    process.exit(1);
  }
};

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('\n收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('HTTP服务器已关闭');
  });
  await closeConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    console.log('HTTP服务器已关闭');
  });
  await closeConnections();
  process.exit(0);
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  console.error('在Promise:', promise);
  process.exit(1);
});

// 启动服务器
initialize();
