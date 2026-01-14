/**
 * 滚动位置记忆工具
 * 用于记住用户点击的动态位置，以便返回时恢复
 */

interface PostScrollMemory {
  pathname: string;
  postId: string | number;
  scrollPosition: number;
  timestamp: number;
}

const STORAGE_KEY = 'post_scroll_memory';
const MAX_MEMORIES = 10; // 最多保存10个页面的记忆

/**
 * 保存动态位置信息
 */
export const savePostScrollMemory = (
  pathname: string,
  postId: string | number,
  scrollPosition: number
) => {
  try {
    const memories = getPostScrollMemories();
    
    // 移除同路径的旧记忆
    const filtered = memories.filter(m => m.pathname !== pathname);
    
    // 添加新记忆
    const newMemory: PostScrollMemory = {
      pathname,
      postId,
      scrollPosition,
      timestamp: Date.now()
    };
    
    filtered.push(newMemory);
    
    // 只保留最近的 MAX_MEMORIES 个记忆
    const sorted = filtered.sort((a, b) => b.timestamp - a.timestamp);
    const limited = sorted.slice(0, MAX_MEMORIES);
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (e) {
    console.error('保存动态位置失败:', e);
  }
};

/**
 * 获取动态位置信息
 */
export const getPostScrollMemory = (pathname: string): PostScrollMemory | null => {
  try {
    const memories = getPostScrollMemories();
    const memory = memories.find(m => m.pathname === pathname);
    return memory || null;
  } catch (e) {
    console.error('获取动态位置失败:', e);
    return null;
  }
};

/**
 * 获取所有记忆
 */
const getPostScrollMemories = (): PostScrollMemory[] => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('读取动态位置失败:', e);
  }
  return [];
};

/**
 * 清除指定路径的记忆
 */
export const clearPostScrollMemory = (pathname: string) => {
  try {
    const memories = getPostScrollMemories();
    const filtered = memories.filter(m => m.pathname !== pathname);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('清除动态位置失败:', e);
  }
};

/**
 * 获取动态元素在页面中的位置
 */
export const getPostElementPosition = (postId: string | number): number | null => {
  try {
    // 尝试通过 data-post-id 属性查找
    const element = document.querySelector(`[data-post-id="${postId}"]`);
    if (element) {
      return element.getBoundingClientRect().top + window.scrollY;
    }
    
    // 如果找不到，返回 null
    return null;
  } catch (e) {
    console.error('获取动态元素位置失败:', e);
    return null;
  }
};

