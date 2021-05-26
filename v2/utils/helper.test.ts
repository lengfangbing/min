/**
 * 仅用于单测时的辅助函数
 * @param {Record<string, string>} [value] 要映射成Header的k-v
 */
export function getHeaders(value?: Record<string, string>) {
  const headers = new Headers();
  Object.keys(value || {}).forEach((item) => {
    headers.set(item, (value || {})[item]);
  });
  return headers;
}
