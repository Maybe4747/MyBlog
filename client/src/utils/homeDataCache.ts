/**
 * 首页数据缓存工具
 * 用于缓存首页的动态数据，从详情页返回时使用缓存，避免重新加载
 */

interface CachedHomeData {
  posts: any[];
  articles: any[];
  files: any[];
  connections: any[];
  followers: any[];
  following: any[];
  profileData: any;
  userStats: any;
  recentActivities: any[];
  timestamp: number;
  contentFilter?: string;
}

const CACHE_KEY = 'home_data_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟过期

/**
 * 保存首页数据到缓存
 */
export const saveHomeDataCache = (data: Partial<CachedHomeData>) => {
  try {
    const cacheData: CachedHomeData = {
      posts: data.posts || [],
      articles: data.articles || [],
      files: data.files || [],
      connections: data.connections || [],
      followers: data.followers || [],
      following: data.following || [],
      profileData: data.profileData || null,
      userStats: data.userStats || null,
      recentActivities: data.recentActivities || [],
      timestamp: Date.now(),
      contentFilter: data.contentFilter || 'all',
    };
    
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.error('保存首页数据缓存失败:', e);
  }
};

/**
 * 获取缓存的首页数据
 */
export const getHomeDataCache = (): CachedHomeData | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    const cacheData: CachedHomeData = JSON.parse(cached);
    
    // 检查缓存是否过期
    const now = Date.now();
    if (now - cacheData.timestamp > CACHE_EXPIRY) {
      clearHomeDataCache();
      return null;
    }

    return cacheData;
  } catch (e) {
    console.error('获取首页数据缓存失败:', e);
    return null;
  }
};

/**
 * 清除首页数据缓存
 */
export const clearHomeDataCache = () => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.error('清除首页数据缓存失败:', e);
  }
};

/**
 * 更新缓存中的单个动态（比如点赞、评论后更新）
 */
export const updateCachedPost = (postId: string | number, updates: Partial<any>) => {
  try {
    const cache = getHomeDataCache();
    if (!cache) return;

    // 更新 posts 中的动态
    const postIndex = cache.posts.findIndex((p: any) => p.id === postId || p.originalId === postId);
    if (postIndex !== -1) {
      cache.posts[postIndex] = { ...cache.posts[postIndex], ...updates };
      saveHomeDataCache(cache);
    }

    // 更新 articles 中的文章
    const articleIndex = cache.articles.findIndex((a: any) => a.id === postId || a.originalId === postId);
    if (articleIndex !== -1) {
      cache.articles[articleIndex] = { ...cache.articles[articleIndex], ...updates };
      saveHomeDataCache(cache);
    }

    // 更新 files 中的文件
    const fileIndex = cache.files.findIndex((f: any) => f.id === postId || f.originalId === postId);
    if (fileIndex !== -1) {
      cache.files[fileIndex] = { ...cache.files[fileIndex], ...updates };
      saveHomeDataCache(cache);
    }
  } catch (e) {
    console.error('更新缓存动态失败:', e);
  }
};

/**
 * 从缓存中删除动态
 */
export const removeCachedPost = (postId: string | number) => {
  try {
    const cache = getHomeDataCache();
    if (!cache) return;

    cache.posts = cache.posts.filter((p: any) => p.id !== postId && p.originalId !== postId);
    cache.articles = cache.articles.filter((a: any) => a.id !== postId && a.originalId !== postId);
    cache.files = cache.files.filter((f: any) => f.id !== postId && f.originalId !== postId);
    
    saveHomeDataCache(cache);
  } catch (e) {
    console.error('从缓存删除动态失败:', e);
  }
};

/**
 * 检查缓存是否有效
 */
export const isCacheValid = (): boolean => {
  const cache = getHomeDataCache();
  return cache !== null;
};

