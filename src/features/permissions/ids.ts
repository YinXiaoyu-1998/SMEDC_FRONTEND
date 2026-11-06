/**
 * 新条目 ID 由客户端生成：契约只要求 [A-Za-z0-9_-]{1,64}，
 * 优先用随机 UUID 去掉连字符，环境不支持时退回时间戳 + 随机串。
 */
export function createId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi !== undefined && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID().replaceAll("-", "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
