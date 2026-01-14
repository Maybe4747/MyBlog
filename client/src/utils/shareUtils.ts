/**
 * 分享工具函数
 */

/**
 * 复制链接到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
};

/**
 * 使用 Web Share API 分享
 */
export const shareViaWebAPI = async (data: {
  title: string;
  text?: string;
  url: string;
}): Promise<boolean> => {
  try {
    if (navigator.share) {
      await navigator.share(data);
      return true;
    }
    return false;
  } catch (err: any) {
    // 用户取消分享不算错误
    if (err.name === 'AbortError') {
      return false;
    }
    console.error('分享失败:', err);
    return false;
  }
};

/**
 * 分享内容（优先使用 Web Share API，否则复制链接）
 */
export const shareContent = async (data: {
  title: string;
  text?: string;
  url: string;
}): Promise<{ success: boolean; method: 'share' | 'copy' | 'none' }> => {
  // 尝试使用 Web Share API
  const shared = await shareViaWebAPI(data);
  if (shared) {
    return { success: true, method: 'share' };
  }

  // 降级到复制链接
  const copied = await copyToClipboard(data.url);
  if (copied) {
    return { success: true, method: 'copy' };
  }

  return { success: false, method: 'none' };
};

/**
 * 生成分享链接
 */
export const generateShareUrl = (type: 'post' | 'article' | 'file', id: number): string => {
  const baseUrl = window.location.origin;
  switch (type) {
    case 'post':
      return `${baseUrl}/posts/${id}`;
    case 'article':
      return `${baseUrl}/articles/${id}`;
    case 'file':
      return `${baseUrl}/files/${id}`;
    default:
      return baseUrl;
  }
};

