import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { getPostScrollMemory, getPostElementPosition, clearPostScrollMemory } from '../utils/scrollMemory';

// 使用 sessionStorage 持久化滚动位置，这样即使组件重新挂载也能恢复
const getScrollKey = (pathname: string) => `scroll_position_${pathname}`;

const ScrollToTop = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const prevPathnameRef = useRef<string>('');
  const isRestoringRef = useRef<boolean>(false);
  const hasRestoredPostPositionRef = useRef<boolean>(false);

  // 实时保存滚动位置
  useEffect(() => {
    const handleScroll = () => {
      // 如果正在恢复滚动位置，不保存
      if (isRestoringRef.current) {
        return;
      }
      const currentPath = location.pathname;
      if (currentPath) {
        try {
          sessionStorage.setItem(getScrollKey(currentPath), window.scrollY.toString());
        } catch (e) {
          console.error('保存滚动位置失败:', e);
        }
      }
    };

    // 使用节流来减少保存频率
    let scrollTimer: NodeJS.Timeout | null = null;
    const throttledScroll = () => {
      if (scrollTimer) return;
      scrollTimer = setTimeout(() => {
        handleScroll();
        scrollTimer = null;
      }, 100);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      // 在卸载前保存一次
      handleScroll();
    };
  }, [location.pathname]);

  // 路由变化时恢复滚动位置
  useEffect(() => {
    // 保存上一个路径的滚动位置
    if (prevPathnameRef.current && prevPathnameRef.current !== location.pathname) {
      try {
        sessionStorage.setItem(getScrollKey(prevPathnameRef.current), window.scrollY.toString());
      } catch (e) {
        console.error('保存滚动位置失败:', e);
      }
    }

    // 更新当前路径
    prevPathnameRef.current = location.pathname;

    // 恢复当前路径的滚动位置
    let savedPosition: number | null = null;
    try {
      const saved = sessionStorage.getItem(getScrollKey(location.pathname));
      if (saved !== null) {
        savedPosition = parseInt(saved, 10);
      }
    } catch (e) {
      console.error('读取滚动位置失败:', e);
    }

    // 检查是否是返回操作（POP 表示浏览器后退/前进）
    const isBackNavigation = navigationType === 'POP';
    
    // 如果是返回操作，尝试恢复动态位置
    if (isBackNavigation && !hasRestoredPostPositionRef.current) {
      const postMemory = getPostScrollMemory(location.pathname);
      
      if (postMemory) {
        hasRestoredPostPositionRef.current = true;
        isRestoringRef.current = true;

        // 尝试通过 data-post-id 属性找到动态元素
        const restoreToPost = () => {
          // 首先尝试通过元素定位
          const elementPosition = getPostElementPosition(postMemory.postId);
          
          if (elementPosition !== null) {
            // 找到了动态元素，滚动到该位置
            window.scrollTo({
              top: elementPosition - 20, // 减去一点偏移，让动态不完全贴顶
              behavior: 'auto'
            });
            setTimeout(() => {
              isRestoringRef.current = false;
              hasRestoredPostPositionRef.current = false;
            }, 200);
            return true;
          } else {
            // 如果找不到元素，使用保存的滚动位置
            window.scrollTo({
              top: postMemory.scrollPosition,
              behavior: 'auto'
            });
            setTimeout(() => {
              isRestoringRef.current = false;
              hasRestoredPostPositionRef.current = false;
            }, 200);
            return true;
          }
        };

        // 等待页面内容加载完成
        const timer1 = setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              restoreToPost();
            });
          });
        }, 100);

        // 备用恢复机制
        const timer2 = setTimeout(() => {
          if (hasRestoredPostPositionRef.current) {
            restoreToPost();
          }
        }, 500);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }

    // 重置恢复标志（如果不是返回操作）
    if (!isBackNavigation) {
      hasRestoredPostPositionRef.current = false;
    }

    if (savedPosition !== null && savedPosition >= 0 && !hasRestoredPostPositionRef.current) {
      // 标记正在恢复，避免触发保存
      isRestoringRef.current = true;

      // 恢复滚动位置的函数
      const restoreScroll = () => {
        window.scrollTo({
          top: savedPosition!,
          behavior: 'auto'
        });
        // 延迟重置标志，确保滚动完成
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 200);
      };

      // 等待页面内容加载完成
      // 使用多层延迟确保 DOM 已完全渲染
      const timer1 = setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            restoreScroll();
          });
        });
      }, 50);

      // 备用恢复机制，如果第一次恢复失败
      const timer2 = setTimeout(() => {
        if (Math.abs(window.scrollY - savedPosition!) > 10) {
          restoreScroll();
        }
      }, 300);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else if (!hasRestoredPostPositionRef.current) {
      // 如果没有保存的位置（新页面），滚动到顶部
      isRestoringRef.current = true;
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          behavior: 'auto'
        });
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 200);
      });
    }
  }, [location.pathname, navigationType]);

  return null;
};

export default ScrollToTop;

