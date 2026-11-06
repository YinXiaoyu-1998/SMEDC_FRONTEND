import "@testing-library/jest-dom/vitest";

// Node 25 自带一个未启用存储的 localStorage 全局，会遮蔽 jsdom 的实现；
// 测试只依赖 key/value 行为，这里注入内存实现保证与浏览器一致。
function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  const storage = {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
  return storage as Storage;
}

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: createMemoryStorage(),
});

// react-router 导航时会用 jsdom 的 AbortSignal 构造 Node 的 Request，两者不是同一实现；
// 本应用没有 loader，测试中丢弃该 signal 即可，避免 undici 的 WebIDL 校验报错。
const BaseRequest = globalThis.Request;

class CompatibleRequest extends BaseRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (init?.signal === undefined || init.signal === null) {
      super(input, init);
      return;
    }
    const rest: RequestInit = { ...init };
    delete rest.signal;
    super(input, rest);
  }
}

Object.defineProperty(globalThis, "Request", {
  configurable: true,
  writable: true,
  value: CompatibleRequest,
});
