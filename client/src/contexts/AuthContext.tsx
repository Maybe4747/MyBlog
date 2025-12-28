import { createContext, useState, useContext, useEffect } from 'react';
import { login as loginApi, register as registerApi, getCurrentUser, logout as logoutApi } from '../api/auth';
import { User, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化时检查用户登录状态
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await getCurrentUser();
          const { data,code,msg}=response;
          if (code === 0) {
            setUser(data.user);
          }
        } catch (err) {
          console.error('获取用户信息失败:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // 登录
  const login = async (value: LoginCredentials) => {
    try {
      setError(null);
      setLoading(true);
      const  {data,code,msg } = await loginApi(value);
      console.log('登录响应:', {data,code,msg});
      if (code === 0) {
        const { token, refreshToken, user } = data;

        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // 过滤敏感字段，只保存安全的用户信息
        const safeUserData = {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          avatar: user?.avatar,
          position: user?.position,
          title: user?.title,
          location: user?.location,
          bio: user?.bio,
          skills: user?.skills,
          stats: user?.stats || {}
        };

        localStorage.setItem('user', JSON.stringify(safeUserData));
        setUser(safeUserData);
        return { success: true };
      } else {
        setError(msg || '登录失败');
        return { success: false, error: msg || '登录失败' };
      }
    } catch (err: any) {
      setError(err.message || '登录过程中出现错误');
      return { success: false, error: err.message || '登录过程中出现错误' };
    } finally {
      setLoading(false);
    }
  };

  // 退出登录
  const logout = () => {
    logoutApi();
    setUser(null);
    window.location.href = '/login';
  };

  // 注册
  const register = async (userData: RegisterData) => {
    try {
      setError(null);
      setLoading(true);
    const  {data,code,msg } = await registerApi(userData);
      if (code === 0) {
        const { token, refreshToken, user: newUser } = data;

        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // 过滤敏感字段，只保存安全的用户信息
        const safeUserData = {
          id: newUser?.id,
          username: newUser?.username,
          email: newUser?.email,
          avatar: newUser?.avatar,
          position: newUser?.position,
          company: newUser?.company,
          location: newUser?.location,
          bio: newUser?.bio,
          skills: newUser?.skills,
          stats: newUser?.stats,
          // 添加其他需要的字段，但排除passwordHash等敏感字段
        };

        localStorage.setItem('user', JSON.stringify(safeUserData));
        setUser(safeUserData);
        return { success: true };
      } else {
        setError(response.msg || '注册失败');
        return { success: false, error: response.msg || '注册失败' };
      }
    } catch (err: any) {
      setError(err.message || '注册过程中出现错误');
      return { success: false, error: err.message || '注册过程中出现错误' };
    } finally {
      setLoading(false);
    }
  };

  // 更新用户信息
  const updateUser = (userData: User) => {
    setUser(prev => ({ ...prev, ...userData }));
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const updatedUser = { ...parsedUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
