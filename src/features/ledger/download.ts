/**
 * 触发浏览器下载。URL 必须来自契约地址或服务端签发的短时链接；
 * 这里只负责一次用户可见的下载动作，不隐藏、不自动重试。
 */
export function triggerBrowserDownload(url: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
