/**
 * Promise 相关工具函数
 */

/**
 * 为 Promise 添加超时限制
 * @param ms 超时时间（毫秒）
 * @param promise 原始 Promise
 * @returns 带超时的 Promise
 */
export function withTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
