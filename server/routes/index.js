import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: '个人职业资料管理平台 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      profiles: '/api/profiles',
      files: '/api/files',
      social: '/api/social',
      search: '/api/search',
      notifications: '/api/notifications'
    }
  });
});

export default router;
